/**
 * GameEngine module for coordinating the game loop and logic.
 * @module GameEngine
 */

// Create a module that can be used in both browser and Jest environments
(function(exports) {
  // Dependencies
  let CanvasManager, InputHandler, CollisionManager, Player, Ghost;
  
  // Get dependencies in browser or Node.js environment
  if (typeof window !== 'undefined') {
    // Browser environment
    CanvasManager = window.CanvasManager;
    InputHandler = window.InputHandler;
    CollisionManager = window.CollisionManager;
    Player = window.Player;
    Ghost = window.Ghost;
  } else {
    // Node.js (Jest) environment
    CanvasManager = require('./canvasManager');
    InputHandler = require('./inputHandler');
    CollisionManager = require('./collisionManager');
    Player = require('./player');
    Ghost = require('./ghost');
  }
  
  // Game state
  const gameState = {
    isInitialized: false,
    isGameOver: false,
    score: 0,
    lastTimestamp: 0,
    assets: null,
    player: null,
    ghosts: [],
    context: null,
    difficultyLevel: 1,
    difficultyTimer: 0,
    difficultyInterval: 10000, // Increase difficulty every 10 seconds
    gracePeriod: 3000, // 3 second grace period before collision detection starts
    maze: null
  };
  
  /**
   * Initialize the game with the provided assets.
   * @param {Object} assets - The loaded game assets.
   */
  function initialize(assets) {
    // Save assets
    gameState.assets = assets;
    
    // Initialize canvas
    gameState.context = CanvasManager.initialize();
    
    // Initialize input handler
    InputHandler.initialize();
    
    // Add restart event listener
    if (typeof document !== 'undefined') {
      const restartButton = document.getElementById('restart-button');
      if (restartButton) {
        restartButton.addEventListener('click', restart);
      }
    }
    
    // Create player and ghosts
    createEntities();
    
    // Update difficulty display
    updateDifficultyDisplay();
    
    // Start the game loop
    gameState.isInitialized = true;
    gameState.lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
  }
  
  /**
   * Create player and ghost entities.
   */
  function createEntities() {
    // Create player
    gameState.player = new Player(gameState.assets);
    
    // Create ghosts
    gameState.ghosts = [];
    
    const canvasDimensions = CanvasManager.getDimensions();
    
    // Calculate safe positions based on the maze
    // The maze is drawn centered, so we need to place entities in valid maze positions
    const mazePositions = getMazePositions(canvasDimensions);
    
    if (mazePositions.length > 0) {
      // Place player at a random valid position
      const playerPos = getRandomPosition(mazePositions);
      gameState.player.x = playerPos.x;
      gameState.player.y = playerPos.y;
      
      // Mark the player position as used so ghosts don't spawn there
      mazePositions.splice(playerPos.index, 1);
      
      // Place ghosts at random valid positions
      for (let i = 0; i < 4; i++) {
        if (mazePositions.length === 0) break;
        
        const ghostPos = getRandomPosition(mazePositions);
        const ghostImage = i % 2 === 0 ? gameState.assets.cat1 : gameState.assets.cat2;
        
        gameState.ghosts.push(new Ghost(ghostImage, {
          x: ghostPos.x,
          y: ghostPos.y
        }));
        
        // Mark the position as used
        mazePositions.splice(ghostPos.index, 1);
      }
    } else {
      // Fallback to original positioning if maze isn't available
      // Make sure ghosts are placed at a safe distance from the player
      const safeDistance = 120; // Minimum distance between player and ghosts
      
      // Ghost 1 at top left - further away from center
      gameState.ghosts.push(new Ghost(gameState.assets.cat1, {
        x: Math.max(20, safeDistance),
        y: Math.max(20, safeDistance)
      }));
      
      // Ghost 2 at bottom right - further away from center
      gameState.ghosts.push(new Ghost(gameState.assets.cat2, {
        x: canvasDimensions.width - Math.max(60, safeDistance) - gameState.assets.cat2.width,
        y: canvasDimensions.height - Math.max(60, safeDistance) - gameState.assets.cat2.height
      }));
      
      // Ghost 3 at top right - further away from center
      gameState.ghosts.push(new Ghost(gameState.assets.cat1, {
        x: canvasDimensions.width - Math.max(60, safeDistance) - gameState.assets.cat1.width,
        y: Math.max(20, safeDistance)
      }));
      
      // Ghost 4 at bottom left - further away from center
      gameState.ghosts.push(new Ghost(gameState.assets.cat2, {
        x: Math.max(20, safeDistance),
        y: canvasDimensions.height - Math.max(60, safeDistance) - gameState.assets.cat2.height
      }));
    }
  }
  
  /**
   * Get a list of valid positions in the maze (path cells)
   * @param {Object} dimensions - Canvas dimensions
   * @returns {Array} Array of {x, y} positions
   */
  function getMazePositions(dimensions) {
    if (!gameState.maze) return [];
    
    const positions = [];
    const { grid, cellSize, offsetX, offsetY } = gameState.maze;
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === 0) { // Path cell
          positions.push({
            x: offsetX + col * cellSize + (cellSize - 64) / 2, // Center entity in cell
            y: offsetY + row * cellSize + (cellSize - 64) / 2,
            row: row,
            col: col
          });
        }
      }
    }
    
    return positions;
  }
  
  /**
   * Get a random position from the available maze positions
   * @param {Array} positions - Array of available positions
   * @returns {Object} - Selected position with index
   */
  function getRandomPosition(positions) {
    const index = Math.floor(Math.random() * positions.length);
    const position = positions[index];
    return {
      x: position.x,
      y: position.y,
      index: index
    };
  }
  
  /**
   * Check if a move would result in a wall collision
   * @param {Object} position - Current position {x, y}
   * @param {Object} direction - Movement direction {x, y}
   * @param {number} distance - Movement distance
   * @returns {boolean} - True if the move is valid (no wall collision)
   */
  function isValidMove(position, direction, distance) {
    if (!gameState.maze) return true;
    
    const { grid, cellSize, offsetX, offsetY } = gameState.maze;
    
    // Calculate new position
    const newX = position.x + direction.x * distance;
    const newY = position.y + direction.y * distance;
    
    // Convert position to grid coordinates
    const gridCol = Math.floor((newX - offsetX + 32) / cellSize);
    const gridRow = Math.floor((newY - offsetY + 32) / cellSize);
    
    // Check if new position is within grid bounds
    if (gridRow < 0 || gridRow >= grid.length || gridCol < 0 || gridCol >= grid[0].length) {
      return false;
    }
    
    // Check if new position is a wall
    return grid[gridRow][gridCol] !== 1;
  }
  
  /**
   * Main game loop.
   * @param {number} timestamp - The current timestamp from requestAnimationFrame.
   */
  function gameLoop(timestamp) {
    // Calculate time since last frame
    const deltaTime = timestamp - gameState.lastTimestamp;
    gameState.lastTimestamp = timestamp;
    
    // If game is not over, update game state
    if (!gameState.isGameOver) {
      // Get current input direction
      const direction = InputHandler.getDirection();
      
      // Update player
      gameState.player.update(direction, deltaTime);
      
      // Update ghosts
      gameState.ghosts.forEach(ghost => {
        ghost.update(deltaTime);
      });
      
      // Handle grace period
      if (gameState.gracePeriod > 0) {
        // Decrease grace period
        gameState.gracePeriod = Math.max(0, gameState.gracePeriod - deltaTime);
        
        // Log when grace period ends
        if (gameState.gracePeriod === 0) {
          console.log('Grace period ended, collision detection activated');
        }
      } else {
        // Check for collisions after grace period
        if (CollisionManager.checkPlayerGhostCollisions(gameState.player, gameState.ghosts)) {
          endGame();
        }
      }
      
      // Update difficulty timer
      gameState.difficultyTimer += deltaTime;
      if (gameState.difficultyTimer >= gameState.difficultyInterval) {
        increaseDifficulty();
        gameState.difficultyTimer = 0;
      }
      
      // Increment score based on movement and time
      if (direction.x !== 0 || direction.y !== 0) {
        // Player is moving, give more points
        gameState.score += Math.round(deltaTime / 10) * gameState.difficultyLevel;
      } else {
        // Player is stationary, give fewer points
        gameState.score += Math.round(deltaTime / 50);
      }
      
      // Update score display
      updateScoreDisplay();
    }
    
    // Draw game entities
    render();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
  }
  
  /**
   * Increase game difficulty.
   */
  function increaseDifficulty() {
    // Increment difficulty level
    gameState.difficultyLevel++;
    
    // Update difficulty display
    updateDifficultyDisplay();
    
    // Increase ghost speed
    gameState.ghosts.forEach(ghost => {
      ghost.speed += 20; // Increase speed by 20 pixels per second
      ghost.directionChangeInterval = Math.max(500, ghost.directionChangeInterval - 200); // Decrease time between direction changes
    });
    
    // Add a new ghost if fewer than 8
    if (gameState.ghosts.length < 8) {
      const canvasDimensions = CanvasManager.getDimensions();
      const ghostImage = Math.random() < 0.5 ? gameState.assets.cat1 : gameState.assets.cat2;
      
      // Random position along one of the edges
      let position;
      const edge = Math.floor(Math.random() * 4);
      
      switch (edge) {
        case 0: // Top edge
          position = { 
            x: Math.random() * (canvasDimensions.width - ghostImage.width), 
            y: 0 
          };
          break;
        case 1: // Right edge
          position = { 
            x: canvasDimensions.width - ghostImage.width, 
            y: Math.random() * (canvasDimensions.height - ghostImage.height) 
          };
          break;
        case 2: // Bottom edge
          position = { 
            x: Math.random() * (canvasDimensions.width - ghostImage.width), 
            y: canvasDimensions.height - ghostImage.height 
          };
          break;
        case 3: // Left edge
          position = { 
            x: 0, 
            y: Math.random() * (canvasDimensions.height - ghostImage.height) 
          };
          break;
      }
      
      // Create and add the new ghost
      const newGhost = new Ghost(ghostImage, position);
      newGhost.speed = 150 + (gameState.difficultyLevel - 1) * 20; // Set speed based on difficulty
      gameState.ghosts.push(newGhost);
    }
  }
  
  /**
   * Render all game entities.
   */
  function render() {
    // Clear the canvas
    CanvasManager.clear();
    
    // Draw background
    drawBackground();
    
    // Draw player
    gameState.player.draw(gameState.context);
    
    // Draw ghosts
    gameState.ghosts.forEach(ghost => {
      ghost.draw(gameState.context);
    });
    
    // Draw grace period indicator
    if (gameState.gracePeriod > 0) {
      drawGracePeriodIndicator();
    }
    
    // Draw game over message if game is over
    if (gameState.isGameOver && typeof document !== 'undefined') {
      const gameOverElement = document.getElementById('game-over');
      if (gameOverElement) {
        gameOverElement.classList.remove('hidden');
      }
    }
  }
  
  /**
   * Draw the game background.
   */
  function drawBackground() {
    if (!gameState.context || !CanvasManager) return;
    
    const canvasDimensions = CanvasManager.getDimensions();
    const ctx = gameState.context;
    
    // Draw darker background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);
    
    // Draw maze
    drawMaze(ctx, canvasDimensions);
    
    // Draw border
    ctx.strokeStyle = '#3333FF';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvasDimensions.width - 4, canvasDimensions.height - 4);
  }
  
  /**
   * Draw the maze structure
   */
  function drawMaze(ctx, dimensions) {
    // Maze configuration
    const cellSize = Math.min(dimensions.width, dimensions.height) / 15;
    const wallColor = '#2121AA';
    ctx.fillStyle = wallColor;
    ctx.strokeStyle = '#3333FF';
    ctx.lineWidth = 2;
    
    // Simple maze layout - 1 represents walls, 0 represents paths
    const maze = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
      [1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    
    // Calculate offset to center the maze
    const offsetX = (dimensions.width - (maze[0].length * cellSize)) / 2;
    const offsetY = (dimensions.height - (maze.length * cellSize)) / 2;
    
    // Draw the maze
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        if (maze[row][col] === 1) {
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;
          
          // Draw maze cell
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }
    }
    
    // Add to game state so other components can access it
    gameState.maze = {
      grid: maze,
      cellSize: cellSize,
      offsetX: offsetX,
      offsetY: offsetY
    };
  }
  
  /**
   * Draw the grace period indicator
   */
  function drawGracePeriodIndicator() {
    const ctx = gameState.context;
    const canvasDimensions = CanvasManager.getDimensions();
    
    // Calculate remaining grace period percentage
    const percentage = gameState.gracePeriod / 3000; // 3000ms is the full grace period
    
    // Draw text
    ctx.font = '20px Arial';
    ctx.fillStyle = percentage > 0.5 ? 'green' : percentage > 0.25 ? 'yellow' : 'red';
    ctx.textAlign = 'center';
    ctx.fillText('Safety Mode: ' + Math.ceil(gameState.gracePeriod / 1000) + 's', canvasDimensions.width / 2, 30);
    
    // Draw progress bar
    const barWidth = 200;
    const barHeight = 10;
    const barX = (canvasDimensions.width - barWidth) / 2;
    const barY = 40;
    
    // Draw background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw progress
    ctx.fillStyle = percentage > 0.5 ? 'green' : percentage > 0.25 ? 'yellow' : 'red';
    ctx.fillRect(barX, barY, barWidth * percentage, barHeight);
  }
  
  /**
   * Update the score display.
   */
  function updateScoreDisplay() {
    if (typeof document !== 'undefined') {
      const scoreElement = document.getElementById('scoreValue');
      if (scoreElement) {
        scoreElement.textContent = gameState.score;
      }
    }
  }
  
  /**
   * Update the difficulty level display.
   */
  function updateDifficultyDisplay() {
    if (typeof document !== 'undefined') {
      const difficultyElement = document.getElementById('difficultyValue');
      if (difficultyElement) {
        difficultyElement.textContent = gameState.difficultyLevel;
      }
    }
  }
  
  /**
   * End the game.
   */
  function endGame() {
    gameState.isGameOver = true;
    
    // Update final score in game over screen
    if (typeof document !== 'undefined') {
      const finalScoreElement = document.getElementById('finalScore');
      if (finalScoreElement) {
        finalScoreElement.textContent = gameState.score;
      }
    }
  }
  
  /**
   * Restart the game.
   */
  function restart() {
    // Reset game state
    gameState.isGameOver = false;
    gameState.score = 0;
    gameState.difficultyLevel = 1;
    gameState.difficultyTimer = 0;
    gameState.gracePeriod = 3000; // Reset grace period
    
    // Update difficulty display
    updateDifficultyDisplay();
    
    // Hide game over display
    if (typeof document !== 'undefined') {
      const gameOverElement = document.getElementById('game-over');
      if (gameOverElement) {
        gameOverElement.classList.add('hidden');
      }
    }
    
    // Recreate entities
    createEntities();
    
    // Update score display
    updateScoreDisplay();
  }
  
  // Export functions for use in browser or tests
  exports.initialize = initialize;
  exports.restart = restart;
  exports.isValidMove = isValidMove;
  
  // For testing purposes, export internal functions
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    exports._testExports = {
      gameState,
      gameLoop,
      createEntities,
      render,
      updateScoreDisplay,
      updateDifficultyDisplay,
      endGame
    };
  }
  
  // For Node.js/Jest compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  }
})((typeof window !== 'undefined') ? (window.GameEngine = {}) : {}); 