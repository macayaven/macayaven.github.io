/**
 * SVG Asset Generator module for creating placeholder SVG images.
 * This is used as a fallback when PNG assets are not available.
 * @module SVGAssets
 */

// Create a module that can be used in both browser and Jest environments
(function(exports) {
  /**
   * Create an SVG data URL for use as an image source.
   * @param {string} svgContent - The SVG content.
   * @returns {string} - Data URL containing the SVG.
   */
  function createSVGDataURL(svgContent) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  }
  
  /**
   * Generate a face with open mouth SVG.
   * @returns {string} - Data URL for the open mouth face.
   */
  function generateFaceOpenSVG() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" fill="yellow" stroke="black" stroke-width="2"/>
        <circle cx="20" cy="20" r="4" fill="black"/>
        <circle cx="44" cy="20" r="4" fill="black"/>
        <path d="M15,40 Q32,60 49,40" fill="black" stroke="black" stroke-width="2"/>
      </svg>
    `;
    return createSVGDataURL(svg);
  }
  
  /**
   * Generate a face with closed mouth SVG.
   * @returns {string} - Data URL for the closed mouth face.
   */
  function generateFaceClosedSVG() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" fill="yellow" stroke="black" stroke-width="2"/>
        <circle cx="20" cy="20" r="4" fill="black"/>
        <circle cx="44" cy="20" r="4" fill="black"/>
        <path d="M15,45 Q32,35 49,45" fill="black" stroke="black" stroke-width="2"/>
      </svg>
    `;
    return createSVGDataURL(svg);
  }
  
  /**
   * Generate a ghost SVG with a given color.
   * @param {string} color - The fill color for the ghost.
   * @returns {string} - Data URL for the ghost.
   */
  function generateGhostSVG(color) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <path d="M10,50 L10,20 Q10,10 32,10 Q54,10 54,20 L54,50 Q54,55 49,50 L43,42 Q40,38 37,42 L32,50 Q29,55 26,50 L21,42 Q18,38 15,42 L10,50" fill="${color}" stroke="black" stroke-width="2"/>
        <circle cx="22" cy="25" r="3" fill="black"/>
        <circle cx="42" cy="25" r="3" fill="black"/>
        <path d="M25,35 L39,35" stroke="black" stroke-width="2" fill="none"/>
        <path d="M10,20 L5,10" stroke="black" stroke-width="2" fill="none"/>
        <path d="M54,20 L59,10" stroke="black" stroke-width="2" fill="none"/>
      </svg>
    `;
    return createSVGDataURL(svg);
  }
  
  /**
   * Create an Image object from an SVG data URL.
   * @param {string} svgDataURL - The SVG data URL.
   * @returns {Promise<Image>} - A promise that resolves with the created Image object.
   */
  function createImageFromSVG(svgDataURL) {
    const img = new Image();
    img.width = 64;
    img.height = 64;
    
    // Add fallback dimensions in case the image doesn't load correctly
    img._fallbackWidth = 64;
    img._fallbackHeight = 64;
    
    // Ensure the image has time to load
    return new Promise((resolve) => {
      img.onload = () => {
        console.log('SVG image loaded successfully:', img.width, img.height);
        resolve(img);
      };
      
      img.onerror = (err) => {
        console.error('Error loading SVG image:', err);
        // Still resolve with the image to allow the game to continue
        resolve(img);
      };
      
      // Set the source after attaching event handlers
      try {
        img.src = svgDataURL;
      } catch (err) {
        console.error('Error setting SVG source:', err);
        resolve(img);
      }
      
      // Set a timeout to resolve anyway after 1 second
      setTimeout(() => {
        if (!img.complete) {
          console.warn('SVG image load timed out - using fallback');
          resolve(img);
        }
      }, 1000);
    });
  }
  
  /**
   * Generate SVG assets for the game.
   * @returns {Promise<Object>} - Promise that resolves with object containing all SVG assets as images.
   */
  function generateSVGAssets() {
    return Promise.all([
      createImageFromSVG(generateFaceOpenSVG()),
      createImageFromSVG(generateFaceClosedSVG()),
      createImageFromSVG(generateGhostSVG('#ff6666')), // Red ghost
      createImageFromSVG(generateGhostSVG('#6666ff'))  // Blue ghost
    ]).then(([faceOpen, faceClosed, ghost1, ghost2]) => {
      console.log('All SVG assets generated and loaded');
      return { faceOpen, faceClosed, ghost1, ghost2 };
    });
  }
  
  // Export functions for use in browser or tests
  exports.generateSVGAssets = generateSVGAssets;
  
  // For Node.js/Jest compatibility
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  }
})((typeof window !== 'undefined') ? (window.SVGAssets = {}) : {}); 