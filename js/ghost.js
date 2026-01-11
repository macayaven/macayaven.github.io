/**
 * Ghost class representing an enemy.
 * @module Ghost
 */

// Use IIFE for browser and Node.js compatibility
(function () {
  // Import the CanvasManager
  let CanvasManager;

  if (typeof window !== 'undefined') {
    // Browser environment
    CanvasManager = window.CanvasManager;
  } else {
    // Node.js (Jest) environment
    CanvasManager = require('./canvasManager');
  }

  /**
   * Ghost class representing an enemy.
   */
  class Ghost {
    /**
     * Create a new Ghost instance.
     * @param {string} ghostType - The type of ghost.
     * @param {Object} position - The initial position {x, y}.
     */
    constructor(ghostType, position) {
      // Set ghost type
      this.type = ghostType;
      // Load the corresponding PNG image from assets based on ghost type
      if (this.type === 'ghost_linkedin') {
        this.image = new Image();
        this.image.src = 'assets/ghost_linkedin_monster.png';
      } else if (this.type === 'ghost_kaggle') {
        this.image = new Image();
        this.image.src = 'assets/ghost_kaggle_monster.png';
      } else if (this.type === 'ghost_github') {
        this.image = new Image();
        this.image.src = 'assets/ghost_github_monster.png';
      } else if (this.type === 'ghost_hf') {
        this.image = new Image();
        this.image.src = 'assets/ghost_hf_monster.png';
      } else {
        // If type unrecognized, randomly choose ghost1.png or ghost2.png
        this.image = new Image();
        this.image.src = Math.random() < 0.5 ? 'assets/ghost1.png' : 'assets/ghost2.png';
      }

      // Detect if we're on a mobile device for sizing
      this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Scale factor to make ghost fit better in maze - smaller on mobile
      this.scaleFactor = this.isMobile ? 0.12 : 0.3; // 0.12 for mobile, 0.1875 for desktop

      // Adjust scale further based on screen size for mobile
      if (this.isMobile) {
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        // Make even smaller on tiny screens
        if (screenWidth < 400) {
          this.scaleFactor = 0.1;
        }
      }

      // Set dimensions based on a default ghost size (64x64) with scaling
      this.baseSize = 64;
      this.width = this.baseSize * this.scaleFactor;
      this.height = this.baseSize * this.scaleFactor;

      // Log the ghost type and size for debugging
      console.log(`Ghost (${this.type}) size set: ${this.width}x${this.height}, isMobile: ${this.isMobile}`);

      // Set initial position
      this.x = position.x;
      this.y = position.y;

      // Movement properties - same base speed regardless of device
      this.baseSpeed = 100; // Base speed in pixels per second
      this.speed = this.baseSpeed * (this.scaleFactor / 0.1875);
      this.direction = { x: 0, y: 0 };

      // Direction change behavior
      this.directionTimer = 0;
      this.directionChangeInterval = 2000; // Change direction every 2 seconds by default

      // Choose initial direction
      this.chooseNewDirection();
    }

    /**
     * Update the ghost's position and behavior.
     * @param {number} deltaTime - The time since the last update in milliseconds.
     */
    update(deltaTime) {
      // Track time since last direction change
      this.directionTimer += deltaTime;

      // Use normalized deltaTime to ensure consistent speed across devices
      // This helps prevent faster movement on devices with different framerates
      const normalizedDeltaTime = Math.min(deltaTime, 50); // Cap at 50ms to prevent huge jumps

      // Calculate movement delta based on speed and time
      const dx = this.direction.x * this.speed * (normalizedDeltaTime / 1000);
      const dy = this.direction.y * this.speed * (normalizedDeltaTime / 1000);

      // Calculate potential new position
      const newX = this.x + dx;
      const newY = this.y + dy;

      // Track if we can move in the current direction
      let canMove = true;

      // Try to use GameEngine's isValidMove if available (for maze walls)
      if (typeof window !== 'undefined' && window.GameEngine && window.GameEngine.isValidMove) {
        canMove = window.GameEngine.isValidMove(
          { x: this.x, y: this.y },
          { x: this.direction.x, y: this.direction.y },
          this.speed * (normalizedDeltaTime / 1000)
        );

        if (canMove) {
          // Move if valid
          this.x = newX;
          this.y = newY;

          // Verify position after movement
          if (window.GameEngine.isEntityInValidPosition &&
            !window.GameEngine.isEntityInValidPosition(this)) {
            // If we somehow ended up in an invalid position, revert the move
            this.x -= dx;
            this.y -= dy;
            canMove = false;
          }
        }

        if (!canMove) {
          // Change direction immediately if we hit a wall or invalid position
          this.chooseNewDirection();
          this.directionTimer = 0;
        }
      } else {
        // Fallback boundary detection if GameEngine is not available
        const canvasDimensions = typeof window !== 'undefined' && window.CanvasManager ?
          window.CanvasManager.getDimensions() :
          { width: 600, height: 400 };

        // Check if we're trying to move out of bounds
        const wouldHitBoundary = (
          newX < 0 ||
          newY < 0 ||
          newX + this.width > canvasDimensions.width ||
          newY + this.height > canvasDimensions.height
        );

        if (wouldHitBoundary) {
          // Hit a boundary, choose a new direction
          this.chooseNewDirection();
          this.directionTimer = 0;
        } else {
          // Safe to move
          this.x = newX;
          this.y = newY;
        }
      }

      // Change direction periodically or if we're not moving
      const shouldChangeDirection =
        this.directionTimer > 2000 + Math.random() * 2000 || // Time-based change
        (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01);        // Not moving

      if (shouldChangeDirection) {
        this.chooseNewDirection();
        this.directionTimer = 0;
      }
    }

    /**
     * Choose a new random direction for the ghost.
     */
    chooseNewDirection() {
      // Get available directions - avoid immediate reversal which can cause getting stuck
      const availableDirections = [];
      const currentDirection = { x: this.direction.x, y: this.direction.y };

      // Check all four possible directions
      const possibleDirections = [
        { x: 1, y: 0 },   // Right
        { x: -1, y: 0 },  // Left
        { x: 0, y: 1 },   // Down
        { x: 0, y: -1 }   // Up
      ];

      // Try each direction and see if it's valid
      for (const dir of possibleDirections) {
        // Skip opposite direction to avoid getting stuck between walls
        if (dir.x === -currentDirection.x && dir.y === -currentDirection.y) continue;

        // Check if this direction is valid (won't hit a wall)
        let isValid = true;

        if (typeof window !== 'undefined' && window.GameEngine && window.GameEngine.isValidMove) {
          isValid = window.GameEngine.isValidMove(
            { x: this.x, y: this.y },
            dir,
            this.speed * 0.05 // Small test distance
          );
        }

        if (isValid) {
          availableDirections.push(dir);
        }
      }

      // If we have valid directions, choose one randomly
      if (availableDirections.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableDirections.length);
        this.direction = availableDirections[randomIndex];
      } else {
        // If all directions are invalid, just choose any random direction
        const randomIndex = Math.floor(Math.random() * possibleDirections.length);
        this.direction = possibleDirections[randomIndex];
      }
    }

    /**
     * Draw the ghost on the canvas.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    draw(context) {
      if (!context) {
        console.error("No context provided for ghost drawing");
        return;
      }

      // If the image is loaded, draw it; otherwise, optionally draw a fallback rectangle
      if (this.image && this.image.complete && this.image.naturalWidth > 0) {
        // Draw colored personality halo
        context.save();
        context.beginPath();
        let haloColor = '#5ce1e6'; // Default Aqua
        if (this.type === 'ghost_linkedin') haloColor = '#0077b5';
        if (this.type === 'ghost_github') haloColor = '#333';
        if (this.type === 'ghost_kaggle') haloColor = '#20beff';
        if (this.type === 'ghost_hf') haloColor = '#FFD21E';

        context.shadowBlur = 15;
        context.shadowColor = haloColor;

        // Draw a subtle circle behind
        context.fillStyle = haloColor + '33'; // 20% opacity
        context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.7, 0, Math.PI * 2);
        context.fill();

        // Draw image
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        context.restore();
      } else {
        // Fallback: draw a rectangle with a border
        context.fillStyle = '#CCCCCC';
        context.fillRect(this.x, this.y, this.width, this.height);
        context.strokeStyle = '#000000';
        context.strokeRect(this.x, this.y, this.width, this.height);
      }

      console.log(`Drawing ghost: type=${this.type}, dimensions=${this.width}x${this.height}, position=(${Math.round(this.x)}, ${Math.round(this.y)})`);
    }

    /**
     * Get the ghost's current position and dimensions for collision detection.
     * @returns {Object} An object with x, y, width, and height properties.
     */
    getBounds() {
      // Add a slight reduction to make the hitbox a bit smaller than visual size
      // Using a smaller reduction for the much smaller character size
      const hitboxReduction = 2;
      return {
        left: this.x + hitboxReduction,
        right: this.x + this.width - hitboxReduction,
        top: this.y + hitboxReduction,
        bottom: this.y + this.height - hitboxReduction
      };
    }
  }

  // Export the Ghost class
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Ghost;
  } else {
    window.Ghost = Ghost;
  }
})(); 