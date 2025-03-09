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
      
      // Scale factor to make ghost fit better in maze
      this.scaleFactor = 0.5;
      
      // Set dimensions based on the image size with scaling
      this.width = image.width * this.scaleFactor;
      this.height = image.height * this.scaleFactor;
      
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
          
          // Add small white dot to confirm real image is drawn
          context.fillStyle = 'white';
          context.fillRect(this.x, this.y, 2, 2);
        } else {
          // Fall back to drawn representation
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
      // Draw the ghost outline for debugging
      context.strokeStyle = '#FF0000';
      context.strokeRect(this.x, this.y, this.width, this.height);
      
      // Determine ghost color based on the image reference
      let ghostColor = '#FF0000'; // Default red
      if (this.image && this.image.src) {
        const imgSrc = this.image.src.toLowerCase();
        if (imgSrc.includes('cat1')) {
          ghostColor = '#FF7700'; // Orange for cat1
        } else if (imgSrc.includes('cat2')) {
          ghostColor = '#00CCFF'; // Light blue for cat2
        }
      }
      
      // Draw ghost body
      const radius = this.width / 2;
      const centerX = this.x + radius;
      const centerY = this.y + radius;
      
      // Draw head (top half circle)
      context.beginPath();
      context.arc(centerX, centerY - radius/2, radius/2, Math.PI, 0, true);
      context.fillStyle = ghostColor;
      context.fill();
      
      // Draw body sides
      context.beginPath();
      context.moveTo(centerX, centerY - radius/2);
      context.lineTo(centerX + radius/2, centerY);
      context.lineTo(centerX, centerY + radius/2);
      context.lineTo(centerX - radius/2, centerY);
      context.closePath();
      context.fillStyle = ghostColor;
      context.fill();
      
      // Draw eyes
      context.fillStyle = 'white';
      context.beginPath();
      context.arc(centerX - radius/4, centerY - radius/4, 5, 0, Math.PI * 2);
      context.arc(centerX + radius/4, centerY - radius/4, 5, 0, Math.PI * 2);
      context.fill();
      
      // Draw pupils
      context.fillStyle = 'black';
      context.beginPath();
      context.arc(centerX - radius/4 + 2, centerY - radius/4, 2, 0, Math.PI * 2);
      context.arc(centerX + radius/4 + 2, centerY - radius/4, 2, 0, Math.PI * 2);
      context.fill();
    }
    
    /**
     * Get the ghost's current position and dimensions for collision detection.
     * @returns {Object} An object with x, y, width, and height properties.
     */
    getBounds() {
      // Add a slight reduction to make the hitbox a bit smaller than visual size
      const hitboxReduction = 4;
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