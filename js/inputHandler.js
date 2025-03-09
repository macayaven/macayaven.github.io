/**
 * InputHandler module for managing keyboard and touch input.
 * @module InputHandler
 */

// Create a module that can be used in both browser and Jest environments
(function(exports) {
  // Direction state object
  const direction = { x: 0, y: 0 };
  
  // Event handler references (for cleanup)
  let keydownHandler;
  let keyupHandler;
  let touchstartHandler;
  let touchmoveHandler;
  let touchendHandler;
  
  // Touch input variables
  let touchStartX = 0;
  let touchStartY = 0;
  const MIN_SWIPE_DISTANCE = 30;
  
  /**
   * Initialize keyboard and touch event listeners.
   */
  function initialize() {
    // Set up the keydown event handler
    keydownHandler = function(event) {
      switch (event.key) {
        case 'ArrowUp':
          direction.x = 0;
          direction.y = -1;
          event.preventDefault();
          break;
        case 'ArrowDown':
          direction.x = 0;
          direction.y = 1;
          event.preventDefault();
          break;
        case 'ArrowLeft':
          direction.x = -1;
          direction.y = 0;
          event.preventDefault();
          break;
        case 'ArrowRight':
          direction.x = 1;
          direction.y = 0;
          event.preventDefault();
          break;
      }
    };
    
    // Set up the keyup event handler
    keyupHandler = function(event) {
      switch (event.key) {
        case 'ArrowUp':
          if (direction.y === -1) direction.y = 0;
          event.preventDefault();
          break;
        case 'ArrowDown':
          if (direction.y === 1) direction.y = 0;
          event.preventDefault();
          break;
        case 'ArrowLeft':
          if (direction.x === -1) direction.x = 0;
          event.preventDefault();
          break;
        case 'ArrowRight':
          if (direction.x === 1) direction.x = 0;
          event.preventDefault();
          break;
      }
    };
    
    // Touch handlers for mobile support
    touchstartHandler = function(event) {
      if (event.touches.length === 1) {
        // Record start position
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      }
    };
    
    touchmoveHandler = function(event) {
      if (event.touches.length === 1) {
        // Prevent scrolling while playing
        event.preventDefault();
        
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        
        const diffX = touchX - touchStartX;
        const diffY = touchY - touchStartY;
        
        // Only process if movement is significant
        if (Math.abs(diffX) > MIN_SWIPE_DISTANCE || Math.abs(diffY) > MIN_SWIPE_DISTANCE) {
          // Determine primary direction
          if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal movement
            direction.x = diffX > 0 ? 1 : -1;
            direction.y = 0;
          } else {
            // Vertical movement
            direction.x = 0;
            direction.y = diffY > 0 ? 1 : -1;
          }
          
          // Update start position to continue movement if finger stays down
          touchStartX = touchX;
          touchStartY = touchY;
        }
      }
    };
    
    touchendHandler = function(event) {
      // Reset direction when touch ends
      direction.x = 0;
      direction.y = 0;
    };
    
    // Add event listeners
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    
    // Add touch event listeners if available
    if ('ontouchstart' in window) {
      const canvas = document.getElementById('gameCanvas');
      if (canvas) {
        canvas.addEventListener('touchstart', touchstartHandler);
        canvas.addEventListener('touchmove', touchmoveHandler, { passive: false });
        canvas.addEventListener('touchend', touchendHandler);
      }
    }
  }
  
  /**
   * Get the current movement direction.
   * @returns {Object} An object with x and y properties representing the direction.
   */
  function getDirection() {
    return { ...direction };
  }
  
  /**
   * Clean up event listeners.
   */
  function cleanup() {
    if (keydownHandler) {
      window.removeEventListener('keydown', keydownHandler);
    }
    
    if (keyupHandler) {
      window.removeEventListener('keyup', keyupHandler);
    }
    
    // Remove touch event listeners
    if ('ontouchstart' in window) {
      const canvas = document.getElementById('gameCanvas');
      if (canvas) {
        canvas.removeEventListener('touchstart', touchstartHandler);
        canvas.removeEventListener('touchmove', touchmoveHandler);
        canvas.removeEventListener('touchend', touchendHandler);
      }
    }
  }
  
  // Export functions for use in browser or tests
  exports.initialize = initialize;
  exports.getDirection = getDirection;
  exports.cleanup = cleanup;
  
  // For Node.js/Jest compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  }
})((typeof window !== 'undefined') ? (window.InputHandler = {}) : {}); 