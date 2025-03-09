/**
 * CanvasManager module for handling canvas initialization and operations.
 * @module CanvasManager
 */

// Create a module that can be used in both browser and Jest environments
(function(exports) {
  let canvas = null;
  let context = null;
  
  /**
   * Initialize the canvas and get its 2D context.
   * @returns {CanvasRenderingContext2D} The 2D rendering context.
   */
  function initialize() {
    // Get the canvas element
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      throw new Error('Canvas element not found! Make sure there is a canvas with id "gameCanvas".');
    }
    
    // Get the 2D context
    context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas!');
    }
    
    // Set initial canvas size
    resize();
    
    // Listen for window resize events
    window.addEventListener('resize', resize);
    
    return context;
  }
  
  /**
   * Resize the canvas to fit the window.
   */
  function resize() {
    if (!canvas) return;
    
    // Calculate the available space with some margins
    const maxWidth = window.innerWidth - 40; // 20px margin on each side
    const maxHeight = window.innerHeight - 40; // 20px margin on top and bottom
    
    // Keep aspect ratio (4:3) for the game area
    const aspectRatio = 4 / 3;
    
    let width, height;
    
    if (maxWidth / maxHeight > aspectRatio) {
      // Window is wider than our desired aspect ratio
      height = Math.min(maxHeight, 600); // Cap at 600px height
      width = height * aspectRatio;
    } else {
      // Window is taller than our desired aspect ratio
      width = Math.min(maxWidth, 800); // Cap at 800px width
      height = width / aspectRatio;
    }
    
    // Set the canvas dimensions
    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);
  }
  
  /**
   * Clear the entire canvas.
   */
  function clear() {
    if (!context || !canvas) return;
    
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  }
  
  /**
   * Get the canvas dimensions.
   * @returns {Object} Object containing width and height of the canvas.
   */
  function getDimensions() {
    return {
      width: canvas ? canvas.width : 0,
      height: canvas ? canvas.height : 0
    };
  }
  
  // Export functions for use in browser or tests
  exports.initialize = initialize;
  exports.resize = resize;
  exports.clear = clear;
  exports.getDimensions = getDimensions;
  
  // For Node.js/Jest compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  }
})((typeof window !== 'undefined') ? (window.CanvasManager = {}) : {}); 