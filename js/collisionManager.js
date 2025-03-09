/**
 * CollisionManager module for detecting collisions between game objects.
 * @module CollisionManager
 */

// Create a module that can be used in both browser and Jest environments
(function(exports) {
  /**
   * Check if two rectangular objects are colliding.
   * @param {Object} object1 - First object with x, y, width, height properties.
   * @param {Object} object2 - Second object with x, y, width, height properties.
   * @returns {boolean} True if the objects are colliding, false otherwise.
   */
  function checkCollision(object1, object2) {
    // Use Axis-Aligned Bounding Box (AABB) collision detection
    // We consider objects touching at edges as colliding
    return (
      object1.x <= object2.x + object2.width &&
      object1.x + object1.width >= object2.x &&
      object1.y <= object2.y + object2.height &&
      object1.y + object1.height >= object2.y
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
    
    return ghosts.some(ghost => {
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