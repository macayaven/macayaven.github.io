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
    gracePeriod: 1500 // 1.5 second grace period before collision detection starts
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
      
      // Check for collisions after grace period
      if (gameState.gracePeriod <= 0 && CollisionManager.checkPlayerGhostCollisions(gameState.player, gameState.ghosts)) {
        endGame();
      } else {
        // Decrease grace period
        gameState.gracePeriod = Math.max(0, gameState.gracePeriod - deltaTime);
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
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    const gridSize = 40;
    for (let y = 0; y < canvasDimensions.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasDimensions.width, y);
      ctx.stroke();
    }
    
    // Draw vertical grid lines
    for (let x = 0; x < canvasDimensions.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasDimensions.height);
      ctx.stroke();
    }
    
    // Draw border
    ctx.strokeStyle = '#3333FF';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvasDimensions.width - 4, canvasDimensions.height - 4);
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
    gameState.gracePeriod = 1500; // Reset grace period
    
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