(function () {
  document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing THE MULTIVERSE OF CARLOS...');

    // --- FUNNY UI LOGIC ---

    // 1. Panic Button
    const panicBtn = document.getElementById('panic-btn');
    const panicOverlay = document.getElementById('panic-overlay');

    if (panicBtn && panicOverlay) {
      const togglePanic = () => {
        panicOverlay.classList.toggle('active');
      };

      panicBtn.addEventListener('click', togglePanic);
      panicBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        togglePanic();
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

    // 3. Mouse Follow Head (Removed for stability)
    /*
    const headerTitle = document.querySelector('header h3');
    if (headerTitle) {
      window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        headerTitle.style.transform = `translate(${x}px, ${y}px)`;
      });
    }
    */

    // 4. Audio Pulse Button
    const audioBtn = document.getElementById('audio-pulse-btn');
    const audio = document.getElementById('saludo-audio');

    if (audioBtn && audio) {
      audioBtn.addEventListener('click', () => {
        if (audio.paused) {
          audio.currentTime = 0;
          audio.play();
          audioBtn.classList.add('playing');
        } else {
          audio.pause();
          audioBtn.classList.remove('playing');
        }
      });

      audio.addEventListener('ended', () => {
        audioBtn.classList.remove('playing');
      });
    }

    // --- GAME INITIALIZATION ---

    const assetUrls = {
      faceOpen: 'assets/face-open.png',
      faceClosed: 'assets/face-closed.png',
      ghost_linkedin: 'assets/ghost_linkedin_monster.png',
      ghost_kaggle: 'assets/ghost_kaggle_monster.png',
      ghost_github: 'assets/ghost_github_monster.png',
      ghost_hf: 'assets/ghost_hf_monster.png'
    };

    // Show a loading message
    const gameContainer = document.getElementById('game-container');
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading';
    loadingElement.textContent = 'Gathering the Multiverse...';
    loadingElement.style.position = 'absolute';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.color = 'white';
    loadingElement.style.fontSize = '24px';
    loadingElement.style.fontWeight = '900';
    gameContainer.appendChild(loadingElement);

    try {
      AssetManager.loadImages(assetUrls)
        .then(function (loadedAssets) {
          gameContainer.removeChild(loadingElement);
          startGame(loadedAssets);
        })
        .catch(function (error) {
          console.warn('Falling back to SVG:', error);
          loadingElement.textContent = 'Generating Retro Vibe...';

          setTimeout(function () {
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

  let currentEngine = null;
  let globalAssets = null;

  function startGame(assets) {
    // Initialize CanvasManager to ensure correct dimensions
    if (window.CanvasManager) {
      window.CanvasManager.initialize();
    }

    globalAssets = assets;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      const mobileInstructions = document.getElementById('mobile-instructions');
      if (mobileInstructions) {
        mobileInstructions.classList.remove('hidden');
        setTimeout(() => mobileInstructions.style.opacity = 0, 5000);
      }
    }

    // --- GAME SELECTOR LOGIC ---
    const selectorBtns = document.querySelectorAll('.selector-btn');
    selectorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switchMultiverse(btn.dataset.game);
      });
    });

    // Start with the default selected in the UI, but don't play yet
    const activeBtn = document.querySelector('.selector-btn.active');
    if (activeBtn) {
      const gameName = activeBtn.dataset.game;
      console.log(`Pre-selected ${gameName}. Waiting for START MISSION...`);
    }

    const startBtn = document.getElementById('start-game-btn');
    const startOverlay = document.getElementById('game-start-overlay');

    if (startBtn && startOverlay) {
      startBtn.addEventListener('click', () => {
        startOverlay.classList.add('hidden');
        const activeBtn = document.querySelector('.selector-btn.active');
        if (activeBtn) {
          switchMultiverse(activeBtn.dataset.game, true);
        }
      });
    }
  }

  function switchMultiverse(gameName, actuallyStart = false) {
    console.log(`Switching to ${gameName} (Auto-start: ${actuallyStart})...`);
    if (currentEngine && currentEngine.stop) currentEngine.stop();

    const gameOver = document.getElementById('game-over');
    const startOverlay = document.getElementById('game-start-overlay');
    if (gameOver) gameOver.classList.add('hidden');

    if (!actuallyStart && startOverlay) {
      startOverlay.classList.remove('hidden');
    }

    document.body.classList.remove('game-active');
    const canvas = document.getElementById('gameCanvas');

    if (actuallyStart) {
      if (gameName === 'adventure') {
        currentEngine = GameEngine;
        GameEngine.initialize(globalAssets);
      } else if (gameName === 'invaders') {
        currentEngine = InvadersEngine;
        InvadersEngine.init(canvas, globalAssets);
      } else if (gameName === 'mind') {
        currentEngine = MindEngine;
        MindEngine.init(canvas);
      }
    }
  }

  // Exposed helper for engines
  window.showGameOver = function (score, message) {
    const gameOver = document.getElementById('game-over');
    const finalScore = document.getElementById('finalScore');
    const title = gameOver.querySelector('h2');

    if (finalScore) finalScore.textContent = score;
    if (title && message) title.textContent = message;

    gameOver.classList.remove('hidden');
    document.body.classList.remove('game-active');
  };

  // Main Game Loop for custom engines
  function gameLoop() {
    if (currentEngine && currentEngine !== GameEngine) {
      currentEngine.update();
      currentEngine.draw();
    }
    requestAnimationFrame(gameLoop);
  }
  gameLoop();

  // Handle Input for Invaders
  window.addEventListener('keydown', (e) => {
    if (currentEngine === InvadersEngine) {
      if (e.key === 'ArrowLeft') InvadersEngine.move(-5);
      if (e.key === 'ArrowRight') InvadersEngine.move(5);
      if (e.key === ' ') InvadersEngine.shoot();
    }
  });

})();
