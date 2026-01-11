/**
 * Mind of Carlos Guessing Game
 */

const MindEngine = (function () {
    let canvas, ctx, container;
    let strikes = 0;
    let isRunning = false;
    let inputEl;

    const clues = [
        "I was born in a place where people eat 'churros'.",
        "I once coded for 24 hours straight and only produced a 'Hello World'.",
        "My favorite language is JavaScript... or Sarcasm.",
        "I have a secret stash of rubber ducks.",
        "I believe the answer to everything is 42, but for this it's much simpler.",
        "Carlos is currently thinking about... nothing."
    ];

    function init(targetCanvas) {
        canvas = targetCanvas;
        ctx = canvas.getContext('2d');

        // Hide canvas, show HTML interface inside game-container
        canvas.style.display = 'none';

        const parent = canvas.parentElement;
        container = document.createElement('div');
        container.id = 'mind-game-ui';
        container.style.cssText = 'color: white; text-align: center; padding: 2rem; font-family: inherit;';
        container.innerHTML = `
            <h2 style="margin-bottom: 2rem; font-weight: 900;">WHAT IS CARLOS THINKING RIGHT NOW?</h2>
            <input type="text" id="mind-input" class="neo-btn" style="background: white; text-transform: none; width: 80%;" placeholder="Type your guess...">
            <div id="strikes-container" style="margin-top: 2rem; font-size: 2rem;"></div>
            <p id="mind-feedback" style="margin-top: 1rem; color: var(--primary-color); font-weight: 900; min-height: 1.5rem;"></p>
        `;

        parent.appendChild(container);
        inputEl = document.getElementById('mind-input');

        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkGuess(inputEl.value);
        });

        isRunning = true;
        updateStrikes();
    }

    function checkGuess(val) {
        const guess = val.toLowerCase().trim();
        const feedback = document.getElementById('mind-feedback');

        if (guess === 'nothing' || guess === 'nada' || guess === 'nedad' || guess === '' || guess === 'nothing at all') {
            feedback.innerText = "CORRECT. ABSOLUTELY NOTHING.";
            feedback.style.color = "var(--secondary-color)";
            setTimeout(() => {
                if (window.showGameOver) window.showGameOver(999, "You have entered the void of my thoughts.");
            }, 1000);
        } else {
            strikes++;
            const randomClue = clues[Math.floor(Math.random() * clues.length)];
            feedback.innerText = `WRONG. CLUE: ${randomClue}`;
            feedback.style.color = "var(--accent-color)";
            updateStrikes();
            inputEl.value = '';

            if (strikes >= 3) {
                setTimeout(() => {
                    if (window.showGameOver) window.showGameOver(0, "My brain is a fortress. You failed.");
                }, 500);
            }
        }
    }

    function updateStrikes() {
        const strCont = document.getElementById('strikes-container');
        if (strCont) {
            strCont.innerHTML = '❌'.repeat(strikes) + '⚪'.repeat(3 - strikes);
        }
    }

    function stop() {
        isRunning = false;
        if (container) container.remove();
        canvas.style.display = 'block';
    }

    return { init, stop, update: () => { }, draw: () => { } };
})();

window.MindEngine = MindEngine;
