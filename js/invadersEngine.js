/**
 * Carlos Invaders Engine
 */

const InvadersEngine = (function () {
    let canvas, ctx;
    let player = { x: 0, y: 0, width: 50, height: 50, speed: 5 };
    let bullets = [];
    let enemies = [];
    let isRunning = false;
    let score = 0;
    let enemyDirection = 1;
    let enemyStepDown = 0;
    let assets = {};

    function init(targetCanvas, gameAssets) {
        canvas = targetCanvas;
        ctx = canvas.getContext('2d');
        assets = gameAssets;
        reset();
    }

    function reset() {
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - 70;
        bullets = [];
        enemies = [];
        score = 0;
        enemyDirection = 1;

        // Spawn grid of enemies
        const rows = 4;
        const cols = 8;
        const padding = 20;
        const startX = 50;
        const startY = 50;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                enemies.push({
                    x: startX + c * (40 + padding),
                    y: startY + r * (40 + padding),
                    width: 40,
                    height: 40,
                    type: r === 0 ? 'ghost_github' : (r < 2 ? 'ghost_linkedin' : 'ghost_kaggle')
                });
            }
        }
        isRunning = true;
    }

    function update() {
        if (!isRunning) return;

        // Player movement (handled by game.js input, but we can check here too)
        // ... handled externally ...

        // Bullet movement
        bullets.forEach((b, i) => {
            b.y -= 7;
            if (b.y < 0) bullets.splice(i, 1);
        });

        // Enemy movement
        let hitEdge = false;
        enemies.forEach(e => {
            e.x += 1 * enemyDirection;
            if (e.x + e.width > canvas.width - 20 || e.x < 20) hitEdge = true;
        });

        if (hitEdge) {
            enemyDirection *= -1;
            enemies.forEach(e => e.y += 20);
        }

        // Collisions
        bullets.forEach((b, bi) => {
            enemies.forEach((e, ei) => {
                if (b.x < e.x + e.width && b.x + b.width > e.x &&
                    b.y < e.y + e.height && b.y + b.height > e.y) {
                    bullets.splice(bi, 1);
                    enemies.splice(ei, 1);
                    score += 10;
                    updateHUD();
                }
            });
        });

        if (enemies.length === 0) reset(); // Win state -> reset/level up

        // Check if enemies reached player
        enemies.forEach(e => {
            if (e.y + e.height > player.y) {
                gameOver();
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Player (Carlos)
        const carlosImg = assets.player_idle || assets.player;
        if (carlosImg) {
            ctx.drawImage(carlosImg, player.x, player.y, player.width, player.height);
        }

        // Draw Bullets
        ctx.fillStyle = '#ffde59';
        bullets.forEach(b => {
            ctx.fillRect(b.x, b.y, b.width, b.height);
        });

        // Draw Enemies
        enemies.forEach(e => {
            const img = assets[e.type];
            if (img) {
                ctx.drawImage(img, e.x, e.y, e.width, e.height);
            } else {
                ctx.fillStyle = 'red';
                ctx.fillRect(e.x, e.y, e.width, e.height);
            }
        });
    }

    function shoot() {
        if (!isRunning) return;
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10 });
    }

    function move(dir) {
        player.x += dir * player.speed;
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    }

    function updateHUD() {
        const scoreEl = document.getElementById('scoreValue');
        if (scoreEl) scoreEl.innerText = score;
    }

    function gameOver() {
        isRunning = false;
        if (window.showGameOver) window.showGameOver(score, "Invasion Successful... for the bugs.");
    }

    return { init, update, draw, shoot, move, stop: () => isRunning = false };
})();

window.InvadersEngine = InvadersEngine;
