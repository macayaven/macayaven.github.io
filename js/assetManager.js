/**
 * AssetManager module for preloading and managing game assets.
 * @module AssetManager
 */

// Create a module that can be used in both browser and Jest environments
(function(exports) {
  /**
   * Load all images specified in the imageUrls object.
   * @param {Object} imageUrls - An object mapping image names to their URLs.
   * @returns {Promise<Object>} - A promise that resolves with an object containing all loaded images.
   */
  function loadImages(imageUrls) {
    const images = {};
    const imagePromises = [];

    // Create a promise for each image to load
    Object.entries(imageUrls).forEach(([key, url]) => {
      const promise = new Promise((resolve) => {
        const img = new Image();
        
        // Set the image handlers
        img.onload = () => {
          images[key] = img;
          resolve(img);
        };
        
        img.onerror = (error) => {
          console.error(`Failed to load image: ${url}`, error);
          // Still resolve the promise to allow the game to continue
          images[key] = new Image(); // Provide an empty image
          resolve(images[key]);
        };
        
        // Start loading the image
        img.src = url;
      });
      
      imagePromises.push(promise);
    });

    // Return a promise that resolves when all images are loaded
    return Promise.all(imagePromises).then(() => images);
  }

  // Export functions for use in browser or tests
  exports.loadImages = loadImages;
  
  // For Node.js/Jest compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  }
})((typeof window !== 'undefined') ? (window.AssetManager = {}) : {}); 