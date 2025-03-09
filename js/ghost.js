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
      const distance = this.speed * (deltaTime / 1000);
      let dx = this.direction.x * distance;
      let dy = this.direction.y * distance;
      
      // Check for maze wall collisions if available
      let hitBoundary = false;
      
      if (typeof window !== 'undefined' && window.GameEngine && window.GameEngine.isValidMove) {
        // Use GameEngine's isValidMove function
        if (!window.GameEngine.isValidMove(
          { x: this.x, y: this.y },
          this.direction,
          distance
        )) {
          hitBoundary = true;
          dx = 0;
          dy = 0;
        }
      } else {
        // Fallback to original boundary detection
        const canvasDimensions = CanvasManager.getDimensions();
        hitBoundary = 
          this.x + dx <= 0 || 
          this.x + dx >= canvasDimensions.width - this.width ||
          this.y + dy <= 0 || 
          this.y + dy >= canvasDimensions.height - this.height;
      }
      
      // Update position if no collision
      if (!hitBoundary) {
        this.x += dx;
        this.y += dy;
      } else {
        // If hit boundary, change direction immediately
        this.chooseNewDirection();
      }
      
      // Keep ghost within canvas bounds
      const canvasDimensions = CanvasManager.getDimensions();
      this.x = Math.max(0, Math.min(this.x, canvasDimensions.width - this.width));
      this.y = Math.max(0, Math.min(this.y, canvasDimensions.height - this.height));
      
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
      try {
        // Check if the image is available and loaded properly
        const imageLoadedCorrectly = this.image && this.image.width > 0 && this.image.height > 0;
        
        if (imageLoadedCorrectly) {
          // Draw the actual cat image
          context.drawImage(this.image, this.x, this.y, this.width, this.height);
          
          // Add a small dot in the corner to confirm image rendering
          context.fillStyle = 'white';
          context.beginPath();
          context.arc(this.x + 5, this.y + 5, 2, 0, Math.PI * 2);
          context.fill();
        } else {
          // Draw fallback
          this.drawFallback(context);
        }
      } catch (e) {
        console.error('Error drawing ghost:', e);
        this.drawFallback(context);
      }
    }
    
    /**
     * Draw a fallback representation of the ghost if the image fails to load.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    drawFallback(context) {
      // Draw outline for debugging
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.strokeRect(this.x, this.y, this.width, this.height);
      
      // Determine color based on image reference (this is a guess, adjust as needed)
      const ghostColor = this.image === window.cat1 ? '#ff6666' : '#6666ff';
      context.fillStyle = ghostColor;
      
      // Draw ghost body
      context.beginPath();
      // Head (top half circle)
      context.arc(this.x + this.width/2, this.y + this.height/3, this.width/3, Math.PI, 0, true);
      // Body sides
      context.lineTo(this.x + this.width, this.y + this.height - this.height/4);
      // Bottom zigzag
      context.lineTo(this.x + this.width*0.75, this.y + this.height - this.height/3);
      context.lineTo(this.x + this.width/2, this.y + this.height);
      context.lineTo(this.x + this.width/4, this.y + this.height - this.height/3);
      context.lineTo(this.x, this.y + this.height - this.height/4);
      context.closePath();
      context.fill();
      
      // Draw eyes
      context.fillStyle = 'white';
      context.beginPath();
      context.arc(this.x + this.width/3, this.y + this.height/3, 5, 0, Math.PI * 2);
      context.arc(this.x + 2*this.width/3, this.y + this.height/3, 5, 0, Math.PI * 2);
      context.fill();
      
      // Draw pupils
      context.fillStyle = 'black';
      context.beginPath();
      context.arc(this.x + this.width/3 + 2, this.y + this.height/3, 2, 0, Math.PI * 2);
      context.arc(this.x + 2*this.width/3 + 2, this.y + this.height/3, 2, 0, Math.PI * 2);
      context.fill();
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