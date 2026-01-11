/**
 * GameEngine module for coordinating the game loop and logic.
 * @module GameEngine
 */

// Create a module that can be used in both browser and Jest environments
(function (exports) {
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
    difficultyInterval: 30000, // 30 seconds per level
    gracePeriod: 3000, // 3 second grace period at start
    gracePeriodMax: 3000,
    maze: null,
    colors: [
      '#4a9636', // Green
      '#3657a7', // Blue
      '#a73657', // Red
      '#a78136', // Orange
      '#8136a7', // Purple
      '#36a794'  // Teal
    ],
    currentColorIndex: 0,
    colorChangeInterval: 5000, // Change color every 5 seconds
    lastColorChange: 0
  };

  /**
   * Initialize game state and resources.
   * @param {Object} assets - Game assets (images).
   */
  function initialize(assets) {
    console.log("Initializing Game Engine...");

    // Save assets
    gameState.assets = assets;

    // Set game-active class for UI hiding
    if (typeof document !== 'undefined') {
      document.body.classList.add('game-active');
    }

    // Initialize canvas
    try {
      gameState.context = CanvasManager.initialize();
      console.log("Canvas initialized successfully");
    } catch (error) {
      console.error("Failed to initialize canvas:", error);
      return; // Exit initialization if canvas setup fails
    }

    // Initialize input handler
    InputHandler.initialize();
    console.log("Input handler initialized");

    // Add restart event listener
    if (typeof document !== 'undefined') {
      const restartButton = document.getElementById('restart-button');
      if (restartButton) {
        // Remove any existing listeners to prevent duplicates
        const newRestartButton = restartButton.cloneNode(true);
        restartButton.parentNode.replaceChild(newRestartButton, restartButton);

        // Add the click event listener
        newRestartButton.addEventListener('click', function (event) {
          console.log("Restart button clicked");
          event.preventDefault();
          restart();
        });
        // Also add a touchend event listener for mobile devices
        newRestartButton.addEventListener('touchend', function (event) {
          console.log("Restart button touched");
          event.preventDefault();
          restart();
        });
        console.log("Restart button listener added");
      } else {
        console.warn("Restart button not found");
      }
    }

    // Initialize game state
    gameState.isRunning = true;
    gameState.isGameOver = false;
    gameState.lastFrameTime = 0;
    gameState.score = 0;
    gameState.difficultyLevel = 1;
    gameState.difficultyTimer = 0;
    gameState.difficultyInterval = 30000; // 30 seconds per level
    gameState.gracePeriod = 3000; // 3 second grace period at start
    gameState.gracePeriodMax = 3000;

    // Initialize maze first
    const canvasDimensions = CanvasManager.getDimensions();
    initializeMaze(canvasDimensions);
    console.log("Maze initialized:", gameState.maze ? "✓" : "✗");

    // Create entities
    createEntities();
    console.log("Entities created:",
      `Player: ${gameState.player ? "✓" : "✗"}, Ghosts: ${gameState.ghosts?.length || 0}`);

    // Validate all entity positions
    validateEntityPositions();
    console.log("Entity positions validated");

    // Update displays
    updateScoreDisplay();
    updateDifficultyDisplay();

    // Start game loop
    gameState.isInitialized = true;
    console.log("Game Engine initialized successfully");

    // Force a render to ensure everything is drawn initially
    render();

    // Start the game loop
    requestAnimationFrame(gameLoop);
    console.log("Game started successfully!");
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

    // Initialize maze if needed
    if (!gameState.maze) {
      initializeMaze(canvasDimensions);
    }

    // Calculate safe positions based on the maze
    const mazePositions = getMazePositions(canvasDimensions);

    if (mazePositions.length > 0) {
      console.log(`Found ${mazePositions.length} valid positions for characters`);

      // Place player at a random valid position
      const playerPos = getRandomPosition(mazePositions);
      gameState.player.x = playerPos.x;
      gameState.player.y = playerPos.y;

      // Mark the player position and nearby positions as used
      const usedIndices = [playerPos.index];
      const proximityThreshold = 100; // Don't spawn ghosts too close to player

      // Find positions to avoid (too close to player)
      for (let i = 0; i < mazePositions.length; i++) {
        if (i === playerPos.index) continue;

        const pos = mazePositions[i];
        const distance = Math.sqrt(
          Math.pow(pos.x - playerPos.x, 2) +
          Math.pow(pos.y - playerPos.y, 2)
        );

        if (distance < proximityThreshold) {
          usedIndices.push(i);
        }
      }

      // Get available positions (not too close to player)
      const availablePositions = mazePositions.filter((_, index) =>
        !usedIndices.includes(index)
      );

      // Place ghosts at random valid positions away from player
      const ghostCount = Math.min(4, availablePositions.length);
      for (let i = 0; i < ghostCount; i++) {
        if (availablePositions.length === 0) break;

        const ghostPos = getRandomPosition(availablePositions);
        const ghostTypes = ['ghost_linkedin', 'ghost_kaggle', 'ghost_github'];
        const ghostType = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];

        gameState.ghosts.push(new Ghost(ghostType, {
          x: ghostPos.x,
          y: ghostPos.y
        }));

        // Remove this position so no other ghost spawns here
        availablePositions.splice(ghostPos.index, 1);
      }
    } else {
      console.error("No valid maze positions found for characters!");
      // Fallback to original positioning if maze isn't available
      gameState.player.x = canvasDimensions.width / 2 - gameState.player.width / 2;
      gameState.player.y = canvasDimensions.height / 2 - gameState.player.height / 2;

      // Add a single ghost as fallback using ghost type
      const ghostTypes = ['ghost_linkedin', 'ghost_kaggle', 'ghost_github'];
      const ghostType = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
      const ghost = new Ghost(ghostType, {
        x: canvasDimensions.width / 4,
        y: canvasDimensions.height / 4
      });
      gameState.ghosts.push(ghost);
    }
  }

  /**
   * Get a list of valid positions in the maze (path cells)
   * @param {Object} dimensions - Canvas dimensions
   * @returns {Array} - List of valid positions
   */
  function getMazePositions(dimensions) {
    if (!gameState.maze) return [];

    const positions = [];
    const { grid, cellSize, offsetX, offsetY } = gameState.maze;

    // Detect if we're on a mobile device for sizing
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Assuming a standard entity size - smaller on mobile
    const entitySize = isMobile ? 8 : 12;

    // Log entity size being used
    console.log(`Using entity size: ${entitySize}, isMobile: ${isMobile}`);

    // Use a more strict approach to find valid positions
    // Only use cells that are guaranteed to be safe (away from walls)
    for (let row = 1; row < grid.length - 1; row++) {
      for (let col = 1; col < grid[row].length - 1; col++) {
        // Only consider path cells (0)
        if (grid[row][col] !== 0) continue;

        // Check if this is a genuinely safe position
        // - Must be a path cell 
        // - Must not have walls in adjacent cells (orthogonally)
        // - Must be at least one cell away from the maze border
        const hasNorthWall = grid[row - 1][col] === 1;
        const hasSouthWall = grid[row + 1][col] === 1;
        const hasEastWall = grid[row][col + 1] === 1;
        const hasWestWall = grid[row][col - 1] === 1;

        let safetyScore = 0;

        // Add safety score based on distance from walls
        // Higher score = safer position
        if (!hasNorthWall) safetyScore++;
        if (!hasSouthWall) safetyScore++;
        if (!hasEastWall) safetyScore++;
        if (!hasWestWall) safetyScore++;

        // Only include positions with at least 3 open directions on desktop
        // For mobile, be more strict and require 4 open directions (intersections only)
        const minSafetyScore = isMobile ? 4 : 3;

        if (safetyScore >= minSafetyScore) {
          // Calculate the absolute position that centers the entity in the cell
          const centerX = offsetX + col * cellSize + (cellSize / 2);
          const centerY = offsetY + row * cellSize + (cellSize / 2);

          positions.push({
            x: centerX - (entitySize / 2),
            y: centerY - (entitySize / 2),
            row: row,
            col: col,
            safetyScore: safetyScore // Higher = safer
          });
        }
      }
    }

    // If we found safe positions, sort them by safety score (safest first)
    if (positions.length > 0) {
      positions.sort((a, b) => b.safetyScore - a.safetyScore);
      return positions;
    }

    // Fallback to find ANY valid path cells if we couldn't find perfectly safe ones
    console.warn("No ideal safe positions found. Looking for any valid path cells.");

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === 0) { // Path cell
          // Verify this position is actually inside a path - double check
          if (isPositionInsideValidPath(row, col, grid)) {
            const centerX = offsetX + col * cellSize + (cellSize / 2);
            const centerY = offsetY + row * cellSize + (cellSize / 2);

            positions.push({
              x: centerX - (entitySize / 2),
              y: centerY - (entitySize / 2),
              row: row,
              col: col
            });
          }
        }
      }
    }

    return positions;
  }

  /**
   * Helper function to double check if a position is inside a valid path and not in a wall
   * @param {number} row - Grid row
   * @param {number} col - Grid column
   * @param {Array} grid - Maze grid
   * @returns {boolean} - True if position is in a valid path
   */
  function isPositionInsideValidPath(row, col, grid) {
    // First, basic check if this cell is a path (0)
    if (grid[row][col] !== 0) return false;

    // Check if this cell has at least one direction that's also a path
    // This helps avoid isolated cells that might be incorrectly marked as paths
    const hasValidPath =
      (row > 0 && grid[row - 1][col] === 0) ||
      (row < grid.length - 1 && grid[row + 1][col] === 0) ||
      (col > 0 && grid[row][col - 1] === 0) ||
      (col < grid[0].length - 1 && grid[row][col + 1] === 0);

    return hasValidPath;
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
   * Initialize the maze for the game.
   * @param {Object} dimensions - Canvas dimensions.
   */
  function initializeMaze(dimensions) {
    // Maze configuration
    const cellSize = Math.min(dimensions.width, dimensions.height) / 15;

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

    // Add to game state so other components can access it
    gameState.maze = {
      grid: maze,
      cellSize: cellSize,
      offsetX: offsetX,
      offsetY: offsetY
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

    // Use player dimensions for collision detection
    const entityWidth = gameState.player ? gameState.player.width : 12;
    const entityHeight = gameState.player ? gameState.player.height : 12;

    // Calculate potential new position with the movement
    const newX = position.x + direction.x * distance;
    const newY = position.y + direction.y * distance;

    // Add a small buffer from the wall edges (15% of cell size)
    const buffer = cellSize * 0.15;

    // Calculate entity bounds at new position
    const bounds = {
      left: newX,
      right: newX + entityWidth,
      top: newY,
      bottom: newY + entityHeight
    };

    // Check if any corner of the entity would be inside a wall
    const corners = [
      { x: bounds.left, y: bounds.top },     // Top-left
      { x: bounds.right, y: bounds.top },    // Top-right
      { x: bounds.left, y: bounds.bottom },  // Bottom-left
      { x: bounds.right, y: bounds.bottom }  // Bottom-right
    ];

    // Also check the midpoints of each edge for better accuracy
    corners.push({ x: (bounds.left + bounds.right) / 2, y: bounds.top });    // Top middle
    corners.push({ x: (bounds.left + bounds.right) / 2, y: bounds.bottom }); // Bottom middle
    corners.push({ x: bounds.left, y: (bounds.top + bounds.bottom) / 2 });   // Left middle
    corners.push({ x: bounds.right, y: (bounds.top + bounds.bottom) / 2 });  // Right middle

    // Check if any of these points would be inside a wall
    for (const corner of corners) {
      const gridCol = Math.floor((corner.x - offsetX) / cellSize);
      const gridRow = Math.floor((corner.y - offsetY) / cellSize);

      // Check if this position is inside a wall
      if (gridRow >= 0 && gridRow < grid.length &&
        gridCol >= 0 && gridCol < grid[0].length &&
        grid[gridRow][gridCol] === 1) {
        return false;
      }
    }

    // Ensure the new position is still within bounds of the canvas
    const canvasDimensions = CanvasManager.getDimensions();
    return (
      newX >= 0 &&
      newX + entityWidth <= canvasDimensions.width &&
      newY >= 0 &&
      newY + entityHeight <= canvasDimensions.height
    );
  }

  /**
   * Main game loop
   * @param {number} timestamp - Current timestamp
   */
  function gameLoop(timestamp) {
    if (!gameState.isRunning) return;

    // Calculate delta time since last frame
    const deltaTime = timestamp - (gameState.lastFrameTime || timestamp);
    gameState.lastFrameTime = timestamp;

    // Normalize deltaTime to ensure consistent speed across devices
    // This helps prevent faster movement on devices with different framerates or CPUs
    const normalizedDeltaTime = Math.min(deltaTime, 50); // Cap at 50ms to prevent huge jumps

    // Update color change timer
    gameState.colorChangeTimer = (gameState.colorChangeTimer || 0) + normalizedDeltaTime;
    if (gameState.colorChangeTimer > gameState.colorChangeInterval) {
      gameState.currentColorIndex = (gameState.currentColorIndex + 1) % gameState.colors.length;
      gameState.colorChangeTimer = 0;
      console.log("Changed maze color to:", gameState.colors[gameState.currentColorIndex]);
    }

    // Get player input
    const direction = InputHandler.getDirection();

    // Flag to track if we should validate positions this frame
    const shouldValidatePositions = Math.random() < 0.05; // Randomly validate ~5% of frames

    // Update player
    gameState.player.update(direction, normalizedDeltaTime);

    // Update ghosts
    gameState.ghosts.forEach(ghost => {
      ghost.update(normalizedDeltaTime);

      // Check for invalid positions after ghost update
      if (shouldValidatePositions && !isEntityInValidPosition(ghost)) {
        console.log("Fixing invalid ghost position during gameplay");

        // Get a new valid position
        const validPositions = getMazePositions(CanvasManager.getDimensions());
        if (validPositions.length > 0) {
          const newPos = getRandomPosition(validPositions);
          ghost.x = newPos.x;
          ghost.y = newPos.y;
        }
      }
    });

    // Check player position validity after update
    if (shouldValidatePositions && !isEntityInValidPosition(gameState.player)) {
      console.log("Fixing invalid player position during gameplay");

      // Get a new valid position
      const validPositions = getMazePositions(CanvasManager.getDimensions());
      if (validPositions.length > 0) {
        const newPos = getRandomPosition(validPositions);
        gameState.player.x = newPos.x;
        gameState.player.y = newPos.y;
      }
    }

    // Grace period countdown
    if (gameState.gracePeriod > 0) {
      gameState.gracePeriod -= normalizedDeltaTime;

      if (gameState.gracePeriod <= 0) {
        gameState.gracePeriod = 0;

        // Log when grace period ends
        console.log('Grace period ended, collision detection activated');
      }
    } else {
      // Check for collisions after grace period
      var collidedGhost = CollisionManager.checkPlayerGhostCollisions(gameState.player, gameState.ghosts);
      if (collidedGhost) {
        gameOver(collidedGhost);
      }
    }

    // Update difficulty timer
    gameState.difficultyTimer += normalizedDeltaTime;
    if (gameState.difficultyTimer >= gameState.difficultyInterval) {
      increaseDifficulty();
      gameState.difficultyTimer = 0;
    }

    // Increment score based on movement and time
    if (direction.x !== 0 || direction.y !== 0) {
      // Player is moving, give more points
      gameState.score += Math.round(normalizedDeltaTime / 10) * gameState.difficultyLevel;
    } else {
      // Player is stationary, give fewer points
      gameState.score += Math.round(normalizedDeltaTime / 50);
    }

    // Update score display
    updateScoreDisplay();

    // Render the game
    render();

    // Continue game loop
    if (!gameState.isGameOver) {
      requestAnimationFrame(gameLoop);
    }
  }

  /**
   * Increase game difficulty
   */
  function increaseDifficulty() {
    gameState.difficultyLevel++;

    // Update the visual display
    updateDifficultyDisplay();

    // Add more ghosts as difficulty increases
    if (gameState.difficultyLevel % 2 === 0 && gameState.ghosts.length < 8) {
      // Maximum of 8 ghosts to avoid overwhelming the player
      addGhost();
    }

    // Increase ghost speed - use baseSpeed for consistent speed increments
    gameState.ghosts.forEach(ghost => {
      // Set speed relative to the base speed, which is the same on all devices
      ghost.speed = ghost.baseSpeed + (gameState.difficultyLevel - 1) * 20;

      console.log(`Ghost speed updated to ${ghost.speed} at difficulty level ${gameState.difficultyLevel}`);
    });

    // Give a brief grace period when difficulty increases
    gameState.gracePeriod = 1500; // 1.5 second grace period on difficulty increase
    gameState.gracePeriodMax = 1500;

    // Ensure all entities are in valid positions for the new level
    validateEntityPositions();
  }

  /**
   * Render all game entities.
   */
  function render() {
    if (!gameState.context) {
      console.error("No context available for rendering");
      return;
    }

    // Clear the canvas
    CanvasManager.clear();

    // Make sure maze is initialized
    if (!gameState.maze) {
      const dimensions = CanvasManager.getDimensions();
      initializeMaze(dimensions);
    }

    // Draw background (which includes maze)
    drawBackground();

    // Draw player if available
    if (gameState.player) {
      gameState.player.draw(gameState.context);
    } else {
      console.warn("No player to render");
    }

    // Draw ghosts if available
    if (gameState.ghosts && gameState.ghosts.length > 0) {
      gameState.ghosts.forEach((ghost) => {
        ghost.draw(gameState.context);
      });
    } else {
      console.warn("No ghosts to render");
    }

    // Draw grace period indicator
    if (gameState.gracePeriod > 0) {
      drawGracePeriodIndicator();
    }

    // Draw game over message if game is over
    if (gameState.isGameOver && typeof document !== 'undefined') {
      var gameOverElement = document.getElementById('game-over') || document.getElementById('gameover');
      if (gameOverElement) {
        gameOverElement.classList.remove('hidden');
      }
    }
  }

  /**
   * Draw the game background.
   */
  function drawBackground() {
    if (!gameState.context || !CanvasManager) {
      console.error("Cannot draw background - missing context or CanvasManager");
      return;
    }

    const canvasDimensions = CanvasManager.getDimensions();
    const ctx = gameState.context;

    // Draw emerald green background (was black)
    ctx.fillStyle = '#08784e'; // Emerald green color
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

    // Ensure maze is initialized
    if (!gameState.maze) {
      initializeMaze(canvasDimensions);
    }

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
    if (!gameState.maze) {
      console.error("No maze data available for drawing");
      initializeMaze(dimensions);
    }

    if (!gameState.maze) {
      console.error("Failed to initialize maze");
      return;
    }

    const { grid, cellSize, offsetX, offsetY } = gameState.maze;

    // Use current color for maze paths
    const pathColor = gameState.colors[gameState.currentColorIndex];

    // Draw the maze grid
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        const x = col * cellSize + offsetX;
        const y = row * cellSize + offsetY;

        if (cell === 0) {
          // Path - use current color
          ctx.fillStyle = pathColor;
          ctx.fillRect(x, y, cellSize, cellSize);
        } else {
          // Draw wall cells with black
          ctx.fillStyle = '#000000'; // Black
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }

  /**
   * Draw the grace period indicator
   */
  function drawGracePeriodIndicator() {
    const ctx = gameState.context;
    const canvasDimensions = CanvasManager.getDimensions();

    // Calculate remaining grace period percentage
    const percentage = gameState.gracePeriod / (gameState.gracePeriodMax || 3000);

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
  function gameOver(ghost) {
    console.log('gameOver triggered for ghost type: ' + ghost.type);
    gameState.isGameOver = true;
    gameState.isRunning = false;

    // Un-set game-active class to show UI
    if (typeof document !== 'undefined') {
      document.body.classList.remove('game-active');
    }

    // Get ghost URL mapping
    const ghostUrls = {
      ghost_linkedin: 'https://www.linkedin.com/in/carlos-crespo-macaya/',
      ghost_kaggle: 'https://www.kaggle.com/macayaven',
      ghost_github: 'https://github.com/macayaven'
    };
    const url = ghostUrls[ghost.type] || 'https://github.com';

    // Attempt to open the URL in a new tab
    try {
      window.open(url, '_blank');
    } catch (e) {
      console.log('Popup blocked, but that is okay.');
    }

    // Update the UI
    if (typeof document !== 'undefined') {
      const finalScoreElement = document.getElementById('finalScore');
      if (finalScoreElement) {
        finalScoreElement.textContent = gameState.score;
      }

      const gameOverElement = document.getElementById('game-over');
      if (gameOverElement) {
        gameOverElement.classList.remove('hidden');

        // Add a funny message about the ghost that killed you
        let killedBy = document.getElementById('killed-by');
        if (!killedBy) {
          killedBy = document.createElement('p');
          killedBy.id = 'killed-by';
          killedBy.style.marginTop = '1rem';
          killedBy.style.fontSize = '0.9rem';
          gameOverElement.insertBefore(killedBy, document.getElementById('restart-button'));
        }

        const ghostName = ghost.type.split('_')[1].toUpperCase();
        killedBy.innerHTML = `Destroyed by ${ghostName}. Check out my work there <a href="${url}" target="_blank" style="color: var(--accent-color);">here</a>.`;
      }
    }
  }


  /**
   * Restart the game.
   */
  function restart() {
    console.log("Game restart initiated");

    // Reset game state
    gameState.isGameOver = false;

    // Set game-active class
    if (typeof document !== 'undefined') {
      document.body.classList.add('game-active');
    }

    gameState.score = 0;
    gameState.difficultyLevel = 1;
    gameState.difficultyTimer = 0;
    gameState.gracePeriod = 3000; // 3 seconds grace period
    gameState.gracePeriodMax = 3000;

    // Clear ghosts
    gameState.ghosts = [];

    // Hide game over screen
    if (typeof document !== 'undefined') {
      var gameOverElement = document.getElementById('game-over') || document.getElementById('gameover');
      if (gameOverElement) {
        gameOverElement.classList.add('hidden');
        console.log("Game over element hidden");
      } else {
        console.warn("Game over element not found");
      }
    }

    // Re-initialize with current assets for clean slate
    createEntities();
    console.log("Entities recreated");

    // Ensure all characters are in valid positions
    validateEntityPositions();

    // Update displays
    updateScoreDisplay();
    updateDifficultyDisplay();

    // Force a render to ensure everything is drawn initially
    render();

    // Restart the game loop if it's not running
    if (!gameState.isRunning) {
      gameState.isRunning = true;
      gameState.lastFrameTime = performance.now();
      requestAnimationFrame(gameLoop);
      console.log("Game loop restarted");
    }

    console.log("Game successfully restarted");
  }

  /**
   * Validate and fix entity positions to ensure they're in valid maze positions
   */
  function validateEntityPositions() {
    if (!gameState.maze) return;

    const canvasDimensions = CanvasManager.getDimensions();
    const validPositions = getMazePositions(canvasDimensions);

    if (validPositions.length === 0) {
      console.error("No valid positions found for entity validation!");
      return;
    }

    // Check and fix player position if needed
    if (!isEntityInValidPosition(gameState.player)) {
      console.log("Fixing invalid player position");
      const newPos = getRandomPosition(validPositions);
      gameState.player.x = newPos.x;
      gameState.player.y = newPos.y;

      // Remove this position so ghosts don't spawn here
      validPositions.splice(newPos.index, 1);
    }

    // Check and fix ghost positions if needed
    gameState.ghosts.forEach((ghost, index) => {
      if (!isEntityInValidPosition(ghost)) {
        console.log(`Fixing invalid ghost position for ghost ${index}`);

        if (validPositions.length > 0) {
          const newPos = getRandomPosition(validPositions);
          ghost.x = newPos.x;
          ghost.y = newPos.y;

          // Remove this position so other ghosts don't spawn here
          validPositions.splice(newPos.index, 1);
        } else {
          // If we ran out of valid positions, hide the ghost off-screen
          // Better than having it stuck in a wall
          ghost.x = -100;
          ghost.y = -100;
        }
      }
    });
  }

  /**
   * Check if an entity is in a valid maze position
   * @param {Object} entity - Entity to check
   * @returns {boolean} - True if entity is in a valid position
   */
  function isEntityInValidPosition(entity) {
    if (!gameState.maze) return true;

    const { grid, cellSize, offsetX, offsetY } = gameState.maze;

    // Calculate the grid cell for the entity's center
    const centerX = entity.x + entity.width / 2;
    const centerY = entity.y + entity.height / 2;

    const gridCol = Math.floor((centerX - offsetX) / cellSize);
    const gridRow = Math.floor((centerY - offsetY) / cellSize);

    // Check if coordinates are within grid bounds
    if (gridRow < 0 || gridRow >= grid.length ||
      gridCol < 0 || gridCol >= grid[0].length) {
      return false;
    }

    // Check if the entity is in a path cell (0)
    return grid[gridRow][gridCol] === 0;
  }

  /**
   * Add a new ghost to the game
   */
  function addGhost() {
    const canvasDimensions = CanvasManager.getDimensions();
    const ghostTypes = ['ghost_linkedin', 'ghost_kaggle', 'ghost_github'];
    const ghostType = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];

    // Get valid positions based on the maze
    const validPositions = getMazePositions(canvasDimensions);

    if (validPositions.length > 0) {
      // Find positions that are not too close to the player
      const playerPos = {
        x: gameState.player.x,
        y: gameState.player.y
      };

      const safePositions = validPositions.filter(pos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - playerPos.x, 2) +
          Math.pow(pos.y - playerPos.y, 2)
        );
        return distance > 150; // Minimum safe distance from player
      });

      // Use safe positions if available, otherwise use any valid position
      const positionsToUse = safePositions.length > 0 ? safePositions : validPositions;

      // Get a random valid position
      const index = Math.floor(Math.random() * positionsToUse.length);
      const position = positionsToUse[index];

      // Create and add the new ghost
      const newGhost = new Ghost(ghostType, {
        x: position.x,
        y: position.y
      });

      // Set speed based on current difficulty - use baseSpeed for consistency
      newGhost.speed = newGhost.baseSpeed + (gameState.difficultyLevel - 1) * 20;

      // Add to game
      gameState.ghosts.push(newGhost);
      console.log(`Added new ghost at position (${position.x}, ${position.y}), speed: ${newGhost.speed}`);
    } else {
      console.warn("No valid positions found for new ghost");
    }
  }

  // Export functions for use in browser or tests
  exports.initialize = initialize;
  exports.restart = restart;
  exports.isValidMove = isValidMove;
  exports.isEntityInValidPosition = isEntityInValidPosition;

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