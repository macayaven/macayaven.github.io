/**
 * CollisionManager module for detecting collisions between game objects.
 * @module CollisionManager
 */

// Create a module that can be used in both browser and Jest environments
(function(exports) {
  /**
   * Check if two rectangular objects are colliding.
   * @param {Object} bounds1 - First object bounds with left, right, top, bottom properties.
   * @param {Object} bounds2 - Second object bounds with left, right, top, bottom properties.
   * @returns {boolean} True if the objects are colliding, false otherwise.
   */
  function checkCollision(bounds1, bounds2) {
    // Use Axis-Aligned Bounding Box (AABB) collision detection with new bounds format
    return (
      bounds1.left <= bounds2.right &&
      bounds1.right >= bounds2.left &&
      bounds1.top <= bounds2.bottom &&
      bounds1.bottom >= bounds2.top
    );
  }
  
  /**
   * Check if player collides with any of the ghosts.
   * @param {Object} player - The player object with getBounds method.
   * @param {Array} ghosts - Array of ghost objects with getBounds method.
   * @returns {boolean} True if player collides with any ghost, false otherwise.
   */
  function checkPlayerGhostCollisions(player, ghosts) {
    const playerBounds = player.getBounds();
    
    return ghosts.find(ghost => {
      const ghostBounds = ghost.getBounds();
      return checkCollision(playerBounds, ghostBounds);
    });
  }
  
  // Export functions for use in browser or tests
  exports.checkCollision = checkCollision;
  exports.checkPlayerGhostCollisions = checkPlayerGhostCollisions;
  
  // For Node.js/Jest compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  }
})((typeof window !== 'undefined') ? (window.CollisionManager = {}) : {}); 