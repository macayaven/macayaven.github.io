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
      ghost_linkedin: 'assets/ghost_linkedin.png',
      ghost_kaggle: 'assets/ghost_kaggle.png',
      ghost_github: 'assets/ghost_github.png'
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
    
    // Add debug info to the console
    console.log('Asset URLs to load:', assetUrls);
    
    try {
      // Try to load PNG assets first
      AssetManager.loadImages(assetUrls)
        .then(function(loadedAssets) {
          console.log('PNG assets loaded successfully:', loadedAssets);
          
          // Verify that all assets were loaded correctly
          let allAssetsValid = true;
          Object.keys(loadedAssets).forEach(key => {
            if (!loadedAssets[key] || !loadedAssets[key].width) {
              console.error(`Asset ${key} failed to load properly`);
              allAssetsValid = false;
            }
          });
          
          if (!allAssetsValid) {
            throw new Error('Some assets did not load properly. Falling back to SVG.');
          }
          
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
            console.log('Generating SVG assets');
            // Generate SVG assets
            SVGAssets.generateSVGAssets()
              .then(svgAssets => {
                console.log('SVG assets generated:', svgAssets);
                
                // Remove the loading message
                gameContainer.removeChild(loadingElement);
                
                // Start the game with SVG assets
                startGame(svgAssets);
              })
              .catch(error => {
                console.error('Error generating SVG assets:', error);
                loadingElement.textContent = 'Error loading game assets. Please refresh and try again.';
                loadingElement.style.color = 'red';
              });
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
    console.log('Starting game with assets:', assets);
    
    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Is mobile device:', isMobile);
    
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
    try {
      GameEngine.initialize(assets);
      console.log('Game Engine initialized successfully');
    } catch (error) {
      console.error('Error initializing GameEngine:', error);
      alert('Error starting game. Please check console for details and refresh to try again.');
    }
    
    console.log('Game started successfully!');
  }
})(); 