/**
 * Player class representing the user-controlled character (face).
 * @module Player
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
   * Player class representing the user's character.
   */
  class Player {
    /**
     * Create a new Player instance.
     * @param {Object} assets - The game assets containing faceOpen and faceClosed images.
     */
    constructor(assets) {
      // Store the face images
      this.faceOpen = assets.faceOpen;
      this.faceClosed = assets.faceClosed;
      
      // Scale factor to make player fit better in maze
      this.scaleFactor = 0.5;
      
      // Set dimensions based on the image size with scaling
      this.width = assets.faceOpen.width * this.scaleFactor;
      this.height = assets.faceOpen.height * this.scaleFactor;
      
      // Get canvas dimensions
      const canvasDimensions = CanvasManager.getDimensions();
      
      // Position player in the center of the canvas
      this.x = canvasDimensions.width / 2 - this.width / 2;
      this.y = canvasDimensions.height / 2 - this.height / 2;
      
      // Movement speed in pixels per second
      this.speed = 200;
      
      // Animation properties
      this.mouthOpen = true;
      this.animationTimer = 0;
      this.animationInterval = 150; // ms between mouth open/close
    }
    
    /**
     * Update the player's position and animation state.
     * @param {Object} direction - The current movement direction.
     * @param {number} deltaTime - The time since the last update in milliseconds.
     */
    update(direction, deltaTime) {
      if (typeof window !== 'undefined' && window.GameEngine && window.GameEngine.isValidMove) {
        // Use GameEngine's isValidMove function for wall collision
        const distance = this.speed * (deltaTime / 1000);
        
        if (direction.x !== 0 || direction.y !== 0) {
          // Save current position
          const oldX = this.x;
          const oldY = this.y;
          
          // Try to move in x direction
          if (direction.x !== 0 && window.GameEngine.isValidMove(
            { x: this.x, y: this.y }, 
            { x: direction.x, y: 0 }, 
            distance
          )) {
            this.x += direction.x * distance;
          }
          
          // Try to move in y direction
          if (direction.y !== 0 && window.GameEngine.isValidMove(
            { x: this.x, y: this.y }, 
            { x: 0, y: direction.y }, 
            distance
          )) {
            this.y += direction.y * distance;
          }
        }
      } else {
        // Fallback to original movement if GameEngine is not available
        // Calculate movement delta
        const dx = direction.x * this.speed * (deltaTime / 1000);
        const dy = direction.y * this.speed * (deltaTime / 1000);
        
        // Update position
        this.x += dx;
        this.y += dy;
      }
      
      // Keep player within canvas bounds
      const canvasDimensions = CanvasManager.getDimensions();
      this.x = Math.max(0, Math.min(this.x, canvasDimensions.width - this.width));
      this.y = Math.max(0, Math.min(this.y, canvasDimensions.height - this.height));
      
      // Update animation timer and toggle mouth state
      this.animationTimer += deltaTime;
      if (this.animationTimer >= this.animationInterval) {
        this.mouthOpen = !this.mouthOpen;
        this.animationTimer = 0;
      }
    }
    
    /**
     * Draw the player on the canvas.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    draw(context) {
      // Draw the appropriate image based on mouth state
      const image = this.mouthOpen ? this.faceOpen : this.faceClosed;
      
      try {
        // Check if the image is available and loaded
        const imageLoadedCorrectly = image && image.width > 0 && image.height > 0;
        
        if (imageLoadedCorrectly) {
          // Draw the actual image with scaling
          context.drawImage(
            image, 
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
        console.error('Error drawing player:', error);
        this.drawFallback(context);
      }
    }
    
    /**
     * Draw a fallback representation of the player if the image fails to load.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     */
    drawFallback(context) {
      // Draw a representation of the player based on direction and mouth state
      // Size based on the scaled width
      const radius = this.width / 2;
      const centerX = this.x + radius;
      const centerY = this.y + radius;
      
      // Draw a colored rectangle for debugging
      context.strokeStyle = 'yellow';
      context.lineWidth = 2;
      context.strokeRect(this.x, this.y, this.width, this.height);
      
      // Draw a solid circle for the player
      context.fillStyle = 'yellow';
      context.beginPath();
      context.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
      context.fill();
      
      // Draw eyes
      context.fillStyle = 'black';
      context.beginPath();
      context.arc(this.x + this.width/3, this.y + this.height/3, 5, 0, Math.PI * 2);
      context.arc(this.x + 2*this.width/3, this.y + this.height/3, 5, 0, Math.PI * 2);
      context.fill();
      
      // Draw mouth based on state
      context.beginPath();
      if (this.mouthOpen) {
        context.arc(centerX, centerY, radius/4, 0.2 * Math.PI, 0.8 * Math.PI);
      } else {
        context.moveTo(this.x + this.width/3, this.y + 2*this.height/3);
        context.lineTo(this.x + 2*this.width/3, this.y + 2*this.height/3);
      }
      context.lineWidth = 3;
      context.stroke();
    }
    
    /**
     * Get the player's current position and dimensions for collision detection.
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
  
  // Export the Player class
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
  } else {
    window.Player = Player;
  }
})(); 