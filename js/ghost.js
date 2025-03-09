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
      
      // Set dimensions based on the image size
      this.width = image.width;
      this.height = image.height;
      
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
      // Calculate movement delta
      const dx = this.direction.x * this.speed * (deltaTime / 1000);
      const dy = this.direction.y * this.speed * (deltaTime / 1000);
      
      // Update position
      this.x += dx;
      this.y += dy;
      
      // Check canvas boundaries
      const canvasDimensions = CanvasManager.getDimensions();
      const hitBoundary = 
        this.x <= 0 || 
        this.x >= canvasDimensions.width - this.width ||
        this.y <= 0 || 
        this.y >= canvasDimensions.height - this.height;
      
      // Keep ghost within canvas bounds
      this.x = Math.max(0, Math.min(this.x, canvasDimensions.width - this.width));
      this.y = Math.max(0, Math.min(this.y, canvasDimensions.height - this.height));
      
      // If hit boundary, change direction immediately
      if (hitBoundary) {
        this.chooseNewDirection();
      }
      
      // Update direction timer
      this.directionTimer += deltaTime;
      
      // Periodically change direction
      if (this.directionTimer >= this.directionChangeInterval) {
        this.chooseNewDirection();
        this.directionTimer = 0;
      }
    }
    
    /**
     * Choose a new random direction for the ghost.
     */
    chooseNewDirection() {
      // Possible directions: up, down, left, right
      const directions = [
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }   // Right
      ];
      
      // Choose a random direction that's different from the current one
      let newDirection;
      do {
        const randomIndex = Math.floor(Math.random() * directions.length);
        newDirection = directions[randomIndex];
      } while (
        newDirection.x === this.direction.x && 
        newDirection.y === this.direction.y
      );
      
      this.direction = newDirection;
    }
    
    /**
     * Draw the ghost on the canvas.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    draw(context) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    
    /**
     * Get the ghost's current position and dimensions for collision detection.
     * @returns {Object} An object with x, y, width, and height properties.
     */
    getBounds() {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
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