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
      this.scaleFactor = 0.1875; // Reduced from 0.375 (halved again)
      
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
      // Track time since last direction change
      this.directionTimer += deltaTime;
      
      // Calculate movement delta based on speed and time
      const dx = this.direction.x * this.speed * (deltaTime / 1000);
      const dy = this.direction.y * this.speed * (deltaTime / 1000);
      
      // Calculate potential new position
      const newX = this.x + dx;
      const newY = this.y + dy;
      
      // Try to use GameEngine's isValidMove if available (for maze walls)
      if (typeof window !== 'undefined' && window.GameEngine && window.GameEngine.isValidMove) {
        const isValid = window.GameEngine.isValidMove(
          {x: this.x, y: this.y}, 
          {x: this.direction.x, y: this.direction.y}, 
          this.speed * (deltaTime / 1000)
        );
        
        if (isValid) {
          // Move if valid
          this.x = newX;
          this.y = newY;
        } else {
          // Change direction immediately if we hit a wall
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
      
      // Change direction periodically (2-4 seconds) if we haven't changed due to collision
      if (this.directionTimer > 2000 + Math.random() * 2000) {
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
      context.strokeStyle = '#FFFFFF'; // White outline for better visibility
      context.strokeRect(this.x, this.y, this.width, this.height);
      
      // Determine ghost color based on the image reference - use brighter colors for green background
      let ghostColor = '#FF0000'; // Bright red for default
      if (this.image && this.image.src) {
        const imgSrc = this.image.src.toLowerCase();
        if (imgSrc.includes('cat1')) {
          ghostColor = '#FFA500'; // Bright orange for cat1
        } else if (imgSrc.includes('cat2')) {
          ghostColor = '#00FFFF'; // Cyan for cat2
        }
      }
      
      // Draw ghost body with more saturated colors
      const radius = this.width / 2;
      const centerX = this.x + radius;
      const centerY = this.y + radius;
      
      // Draw head (top half circle) with bright color
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