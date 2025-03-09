/**
 * Main game initialization file.
 * This is the entry point that loads all assets and starts the game.
 */

(function() {
  // Wait for the DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Pac-Face game...');
    
    // Define the game assets to load
    const assetUrls = {
      faceOpen: 'assets/face-open.png',
      faceClosed: 'assets/face-closed.png',
      cat1: 'assets/cat1.png',
      cat2: 'assets/cat2.png'
    };
    
    // Show a loading message
    const gameContainer = document.getElementById('game-container');
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading';
    loadingElement.textContent = 'Loading game assets...';
    loadingElement.style.position = 'absolute';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.color = 'white';
    loadingElement.style.fontSize = '24px';
    gameContainer.appendChild(loadingElement);
    
    try {
      // Try to load PNG assets first
      AssetManager.loadImages(assetUrls)
        .then(function(loadedAssets) {
          console.log('PNG assets loaded successfully');
          
          // Remove the loading message
          gameContainer.removeChild(loadingElement);
          
          // Start the game with loaded assets
          startGame(loadedAssets);
        })
        .catch(function(error) {
          console.warn('Error loading PNG assets, falling back to SVG:', error);
          
          // Loading message update
          loadingElement.textContent = 'Using SVG placeholders...';
          
          // Use SVG assets instead
          setTimeout(function() {
            // Generate SVG assets
            const svgAssets = SVGAssets.generateSVGAssets();
            
            // Remove the loading message
            gameContainer.removeChild(loadingElement);
            
            // Start the game with SVG assets
            startGame(svgAssets);
          }, 500); // Short delay to show the message
        });
    } catch (e) {
      console.error('Error initializing game:', e);
      
      // Show error message
      loadingElement.textContent = 'Error initializing game. Please refresh and try again.';
      loadingElement.style.color = 'red';
    }
  });
  
  /**
   * Start the game with the provided assets.
   * @param {Object} assets - The loaded game assets.
   */
  function startGame(assets) {
    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Show mobile instructions if on mobile device
    if (isMobile) {
      const mobileInstructions = document.getElementById('mobile-instructions');
      if (mobileInstructions) {
        mobileInstructions.classList.remove('hidden');
        
        // Hide instructions after 5 seconds
        setTimeout(function() {
          mobileInstructions.classList.add('hidden');
        }, 5000);
      }
    }
    
    // Initialize the game engine with the assets
    GameEngine.initialize(assets);
    
    // Add event listener for restarting the game
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('click', function() {
        GameEngine.restart();
      });
    }
    
    console.log('Game started successfully!');
  }
})(); 