// ... existing code ...
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing THE MULTIVERSE OF CARLOS...');

    // --- FUNNY UI LOGIC ---

    // 1. Panic Button
    const panicBtn = document.getElementById('panic-btn');
    const panicOverlay = document.getElementById('panic-overlay');
    
    if (panicBtn && panicOverlay) {
        panicBtn.addEventListener('click', () => {
            panicOverlay.classList.toggle('active');
        });
        
        panicOverlay.addEventListener('click', () => {
            panicOverlay.classList.remove('active');
        });

        // Esc key to un-panic
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') panicOverlay.classList.remove('active');
        });
    }

    // 2. Random Funny Tips
    const funnyTips = [
        "If you press Arrow Up twice, nothing happens. But it makes you feel like you're trying.",
        "Carlos once fought a ghost in Kaggle. The results were... statistically significant.",
        "Breaking: Local man still hasn't updated his LinkedIn profile picture from 2012.",
        "This site is powered by pure caffeine and 4am regrets.",
        "Warning: Swiping too fast might summon a senior developer to review your code.",
        "Hint: The LinkedIn icon is the final boss. Good luck.",
        "Fact: Carlos can speak 3 languages, but only if they are JavaScript, Python, and Sarcasm."
    ];
    
    const tipElement = document.getElementById('funny-tip');
    if (tipElement) {
        setInterval(() => {
            tipElement.style.opacity = 0;
            setTimeout(() => {
                tipElement.textContent = funnyTips[Math.floor(Math.random() * funnyTips.length)];
                tipElement.style.opacity = 1;
                tipElement.style.transition = 'opacity 0.5s';
            }, 500);
        }, 8000);
    }

    // 3. Mouse Follow Head (Mini Easter Egg)
    const headerTitle = document.querySelector('header h3');
    if (headerTitle) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            headerTitle.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    // --- GAME INITIALIZATION ---
    
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
    const isMobileDevice = window.innerWidth <= 480;
    loadingElement.id = 'loading';
    loadingElement.textContent = 'Gathering the Multiverse...';
    loadingElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: ${isMobileDevice ? '16px' : '24px'};
      font-weight: 900;
      text-align: center;
      padding: 1rem;
      max-width: 80%;
    `;
    gameContainer.appendChild(loadingElement);
    
    try {
      AssetManager.loadImages(assetUrls)
        .then(function(loadedAssets) {
          gameContainer.removeChild(loadingElement);
          startGame(loadedAssets);
        })
        .catch(function(error) {
          console.warn('Falling back to SVG:', error);
          loadingElement.textContent = 'Generating Retro Vibe...';
          
          setTimeout(function() {
            SVGAssets.generateSVGAssets()
              .then(svgAssets => {
                gameContainer.removeChild(loadingElement);
                startGame(svgAssets);
              })
              .catch(error => {
                console.error('Error generating assets:', error);
                loadingElement.textContent = 'Error: The Multiverse is unstable.';
                loadingElement.style.color = 'red';
              });
          }, 500);
        });
    } catch (e) {
      console.error('Error initializing game:', e);
    }
  });
  
  function startGame(assets) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      const mobileInstructions = document.getElementById('mobile-instructions');
      if (mobileInstructions) {
        mobileInstructions.classList.remove('hidden');
        mobileInstructions.style.transition = 'opacity 0.5s ease-out';
        // Fade out after 5 seconds, then hide completely
        setTimeout(() => {
          mobileInstructions.style.opacity = '0';
          setTimeout(() => mobileInstructions.classList.add('hidden'), 500);
        }, 5000);
      }
    }
    
    try {
      GameEngine.initialize(assets);
    } catch (error) {
      console.error('Error initializing GameEngine:', error);
    }
  }
})();
 