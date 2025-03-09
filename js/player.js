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
      
      // Set dimensions based on the image size
      this.width = assets.faceOpen.width;
      this.height = assets.faceOpen.height;
      
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
      // Calculate movement delta
      const dx = direction.x * this.speed * (deltaTime / 1000);
      const dy = direction.y * this.speed * (deltaTime / 1000);
      
      // Update position
      this.x += dx;
      this.y += dy;
      
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
        // Draw the image
        context.drawImage(image, this.x, this.y, this.width, this.height);
        
        // Draw a colored outline around the player for debugging
        context.strokeStyle = 'yellow';
        context.lineWidth = 2;
        context.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw a solid circle in the center of the player as a fallback
        context.fillStyle = 'yellow';
        context.beginPath();
        context.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 - 5, 0, Math.PI * 2);
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
          context.arc(this.x + this.width/2, this.y + this.height/2, this.width/4, 0.2 * Math.PI, 0.8 * Math.PI);
        } else {
          context.moveTo(this.x + this.width/3, this.y + 2*this.height/3);
          context.lineTo(this.x + 2*this.width/3, this.y + 2*this.height/3);
        }
        context.lineWidth = 3;
        context.stroke();
      } catch (e) {
        console.error('Error drawing player:', e);
        
        // Fallback drawing if image fails
        context.fillStyle = 'yellow';
        context.fillRect(this.x, this.y, this.width, this.height);
        
        // Add text to indicate this is the player
        context.fillStyle = 'black';
        context.font = '12px Arial';
        context.fillText('PLAYER', this.x + 5, this.y + this.height/2);
      }
    }
    
    /**
     * Get the player's current position and dimensions for collision detection.
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
  
  // Export the Player class
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
  } else {
    window.Player = Player;
  }
})(); 