/**
 * Ghost class representing the enemy cat characters.
 * @module Ghost
 */

// Use IIFE for browser and Node.js compatibility
(function() {
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
   * Ghost class representing a cat enemy.
   */
  class Ghost {
    /**
     * Create a new Ghost instance.
     * @param {Image} image - The cat image to use for this ghost.
     * @param {Object} position - The initial position {x, y}.
     */
    constructor(image, position) {
      // Store the ghost image
      this.image = image;
      
      // Detect if we're on a mobile device for sizing
      this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Scale factor to make ghost fit better in maze - smaller on mobile
      this.scaleFactor = this.isMobile ? 0.12 : 0.1875; // 0.12 for mobile, 0.1875 for desktop
      
      // Adjust scale further based on screen size for mobile
      if (this.isMobile) {
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        // Make even smaller on tiny screens
        if (screenWidth < 400) {
          this.scaleFactor = 0.1;
        }
      }
      
      // Set dimensions based on the image size with scaling
      this.width = image.width * this.scaleFactor;
      this.height = image.height * this.scaleFactor;
      
      // Log the ghost size for debugging
      console.log(`Ghost size set: ${this.width}x${this.height}, isMobile: ${this.isMobile}`);
      
      // Set initial position
      this.x = position.x;
      this.y = position.y;
      
      // Movement properties
      this.speed = 150; // Pixels per second
      this.direction = { x: 0, y: 0 };
      
      // Direction change behavior
      this.directionTimer = 0;
      this.directionChangeInterval = 2000; // Change direction every 2 seconds
      
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
      
      // Calculate movement delta based on speed and time
      const dx = this.direction.x * this.speed * (deltaTime / 1000);
      const dy = this.direction.y * this.speed * (deltaTime / 1000);
      
      // Calculate potential new position
      const newX = this.x + dx;
      const newY = this.y + dy;
      
      // Track if we can move in the current direction
      let canMove = true;
      
      // Try to use GameEngine's isValidMove if available (for maze walls)
      if (typeof window !== 'undefined' && window.GameEngine && window.GameEngine.isValidMove) {
        canMove = window.GameEngine.isValidMove(
          {x: this.x, y: this.y}, 
          {x: this.direction.x, y: this.direction.y}, 
          this.speed * (deltaTime / 1000)
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
      const currentDirection = {x: this.direction.x, y: this.direction.y};
      
      // Check all four possible directions
      const possibleDirections = [
        {x: 1, y: 0},   // Right
        {x: -1, y: 0},  // Left
        {x: 0, y: 1},   // Down
        {x: 0, y: -1}   // Up
      ];
      
      // Try each direction and see if it's valid
      for (const dir of possibleDirections) {
        // Skip opposite direction to avoid getting stuck between walls
        if (dir.x === -currentDirection.x && dir.y === -currentDirection.y) continue;
        
        // Check if this direction is valid (won't hit a wall)
        let isValid = true;
        
        if (typeof window !== 'undefined' && window.GameEngine && window.GameEngine.isValidMove) {
          isValid = window.GameEngine.isValidMove(
            {x: this.x, y: this.y}, 
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
      
      try {
        // Check if the image is available and loaded
        const imageLoadedCorrectly = this.image && this.image.width > 0 && this.image.height > 0;
        
        if (imageLoadedCorrectly) {
          // Draw the actual image with scaling
          context.drawImage(
            this.image, 
            this.x, 
            this.y, 
            this.width, 
            this.height
          );
          
          // Small indicator dot for debugging (can be commented out for production)
          // context.fillStyle = 'white';
          // context.fillRect(this.x, this.y, 4, 4);
          
          console.log("Drawing ghost with image:", 
            `dimensions=${this.width}x${this.height}, position=(${Math.round(this.x)},${Math.round(this.y)})`);
        } else {
          // Fall back to drawn representation
          console.warn("Using fallback drawing for ghost - image not loaded correctly");
          this.drawFallback(context);
        }
      } catch (error) {
        console.error('Error drawing ghost:', error);
        this.drawFallback(context);
      }
    }
    
    /**
     * Draw a fallback representation of the ghost if the image fails to load.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    drawFallback(context) {
      // Determine ghost color based on the image reference - use very bright colors for visibility
      let ghostColor = '#FF0000'; // Bright red for default
      if (this.image && this.image.src) {
        const imgSrc = this.image.src.toLowerCase();
        if (imgSrc.includes('cat1')) {
          ghostColor = '#FF9500'; // Bright orange for cat1
        } else if (imgSrc.includes('cat2')) {
          ghostColor = '#00FFFF'; // Bright cyan for cat2
        }
      }
      
      // Draw ghost body with more saturated colors for better visibility
      const radius = this.width / 2;
      const centerX = this.x + radius;
      const centerY = this.y + radius;
      
      // Draw a solid circular body for visibility
      context.beginPath();
      context.arc(centerX, centerY, radius-2, 0, Math.PI * 2);
      context.fillStyle = ghostColor;
      context.fill();
      
      // Draw eyes - make larger for better visibility
      context.fillStyle = 'white';
      context.beginPath();
      const eyeRadius = Math.max(2, radius/4);
      context.arc(centerX - radius/3, centerY - radius/4, eyeRadius, 0, Math.PI * 2);
      context.arc(centerX + radius/3, centerY - radius/4, eyeRadius, 0, Math.PI * 2);
      context.fill();
      
      // Draw pupils
      context.fillStyle = 'black';
      context.beginPath();
      const pupilRadius = Math.max(1, eyeRadius/2);
      context.arc(centerX - radius/3 + 1, centerY - radius/4, pupilRadius, 0, Math.PI * 2);
      context.arc(centerX + radius/3 + 1, centerY - radius/4, pupilRadius, 0, Math.PI * 2);
      context.fill();
      
      console.log("Drew fallback ghost:", 
        `center=(${Math.round(centerX)},${Math.round(centerY)}), radius=${Math.round(radius)}, color=${ghostColor}`);
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