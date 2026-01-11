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
  let touchActive = false;
  const MIN_SWIPE_DISTANCE = 20; // Reduced from 30 for higher sensitivity
  
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
        const canvas = document.getElementById('gameCanvas');
        const target = event.target;

        // Only handle touch if it's on the canvas
        // This allows buttons and other elements to receive their click events
        if (target !== canvas && !canvas.contains(target)) {
          return;
        }

        // Record start position
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchActive = true;

        // Prevent default to avoid scrolling and zooming (only for canvas touches)
        event.preventDefault();

        console.log("Touch start detected:", touchStartX, touchStartY);
      }
    };
    
    touchmoveHandler = function(event) {
      // Only process if touch is active (started on canvas)
      if (!touchActive || event.touches.length !== 1) return;

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

        console.log("Touch direction set:", direction.x, direction.y);

        // Update start position to continue movement if finger stays down
        touchStartX = touchX;
        touchStartY = touchY;
      }
    };
    
    touchendHandler = function(event) {
      // Only handle touch end if touch was active (started on canvas)
      if (!touchActive) return;

      // Reset touch state
      touchActive = false;

      // Don't reset direction immediately to allow more responsive controls
      // We'll keep the direction for a short time to make it feel more responsive
      setTimeout(() => {
        if (!touchActive) {
          direction.x = 0;
          direction.y = 0;
        }
      }, 100);

      event.preventDefault();
    };
    
    // Add event listeners
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    
    // Add touch event listeners for mobile
    // First check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log("Device detected as mobile:", isMobile);
    
    // Always add touch controls, regardless of device detection
    // This ensures they work on all touch-enabled devices
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      console.log("Adding touch event listeners to canvas");
      
      // Use these options to prevent scrolling when touching the canvas
      const touchOptions = { passive: false };
      
      canvas.addEventListener('touchstart', touchstartHandler, touchOptions);
      canvas.addEventListener('touchmove', touchmoveHandler, touchOptions);
      canvas.addEventListener('touchend', touchendHandler);
      
      // Also add touch listeners to document body for better swipe detection
      document.body.addEventListener('touchstart', touchstartHandler, touchOptions);
      document.body.addEventListener('touchmove', touchmoveHandler, touchOptions);
      document.body.addEventListener('touchend', touchendHandler);
    } else {
      console.error("Canvas element not found for touch controls!");
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
    
    // Remove touch event listeners - use same options as when adding
    const touchOptions = { passive: false };
    const canvas = document.getElementById('gameCanvas');
    
    if (canvas) {
      if (touchstartHandler) {
        canvas.removeEventListener('touchstart', touchstartHandler, touchOptions);
        document.body.removeEventListener('touchstart', touchstartHandler, touchOptions);
      }
      
      if (touchmoveHandler) {
        canvas.removeEventListener('touchmove', touchmoveHandler, touchOptions);
        document.body.removeEventListener('touchmove', touchmoveHandler, touchOptions);
      }
      
      if (touchendHandler) {
        canvas.removeEventListener('touchend', touchendHandler);
        document.body.removeEventListener('touchend', touchendHandler);
      }
    }
    
    // Reset direction
    direction.x = 0;
    direction.y = 0;
    
    console.log("Input handler cleaned up");
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