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
      
      // Detect if we're on a mobile device for sizing
      this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Scale factor to make player fit better in maze - smaller on mobile
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
      this.width = assets.faceOpen.width * this.scaleFactor;
      this.height = assets.faceOpen.height * this.scaleFactor;
      
      // Log the player size for debugging
      console.log(`Player size set: ${this.width}x${this.height}, isMobile: ${this.isMobile}`);
      
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
      // Use normalized deltaTime to ensure consistent speed across devices
      // This helps prevent faster movement on devices with different framerates
      const normalizedDeltaTime = Math.min(deltaTime, 50); // Cap at 50ms to prevent huge jumps
      
      // Calculate potential movement distance
      const distance = this.speed * (normalizedDeltaTime / 1000);
      
      // Calculate potential movement in both directions
      let dx = direction.x * distance;
      let dy = direction.y * distance;
      
      if (typeof window !== 'undefined' && window.GameEngine && window.GameEngine.isValidMove) {
        // Use GameEngine's isValidMove function for wall collision
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
        // Update position
        this.x += dx;
        this.y += dy;
      }
      
      // Keep player within canvas bounds
      const canvasDimensions = CanvasManager.getDimensions();
      this.x = Math.max(0, Math.min(this.x, canvasDimensions.width - this.width));
      this.y = Math.max(0, Math.min(this.y, canvasDimensions.height - this.height));
      
      // Update animation timer and toggle mouth state
      this.animationTimer += normalizedDeltaTime;
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
      if (!context) {
        console.error("No context provided for player drawing");
        return;
      }

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
          
          // Small indicator dot for debugging (can be commented out for production)
          // context.fillStyle = 'white';
          // context.fillRect(this.x, this.y, 4, 4);
          
          console.log("Drawing player with image:", 
            `dimensions=${this.width}x${this.height}, position=(${Math.round(this.x)},${Math.round(this.y)})`);
        } else {
          // Fall back to drawn representation
          console.warn("Using fallback drawing for player - image not loaded correctly");
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
      
      // Draw the player body - very bright yellow for maximum visibility
      context.fillStyle = '#FFFF00'; // Bright yellow
      context.beginPath();
      context.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      context.fill();
      
      // Draw mouth based on animation state - make it larger and more visible
      context.fillStyle = '#000000';
      context.beginPath();
      if (this.mouthOpen) {
        // Draw open mouth - larger angle for visibility
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius-1, 0.2 * Math.PI, 0.8 * Math.PI);
        context.lineTo(centerX, centerY);
        context.closePath();
      } else {
        // Draw closed mouth - straight line
        context.moveTo(this.x + this.width/3, this.y + 2*this.height/3);
        context.lineTo(this.x + 2*this.width/3, this.y + 2*this.height/3);
      }
      context.fill();
      
      console.log("Drew fallback player:", 
        `center=(${Math.round(centerX)},${Math.round(centerY)}), radius=${Math.round(radius)}`);
    }
    
    /**
     * Get the player's current position and dimensions for collision detection.
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
  
  // Export the Player class
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
  } else {
    window.Player = Player;
  }
})(); 