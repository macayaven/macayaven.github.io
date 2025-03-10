# Pac-Face Game

A fun Pac-Man style game built with HTML5 Canvas and JavaScript, featuring a face character that opens and closes its mouth as the player, and ghosts as enemies.

## Features

- Responsive design that works on both desktop and mobile devices
- Canvas-based rendering for smooth animations
- Face character that opens and closes its mouth while moving
- Ghosts with simple AI behavior
- Score tracking

## How to Play

1. Open `index.html` in your browser
2. Use arrow keys to control the face character
3. Avoid the ghosts
4. Collect points as you move around

## Development

This project is built using:
- HTML5 Canvas
- Vanilla JavaScript with ES6 modules
- Test-Driven Development (TDD) approach with Jest

### Project Structure

- `index.html` - Main HTML page with the canvas element
- `styles.css` - Responsive styles
- `game.js` - Main game initialization
- `js/` - Contains all game modules:
  - `assetManager.js` - Handles loading of images
  - `canvasManager.js` - Manages canvas operations
  - `inputHandler.js` - Processes keyboard/touch input
  - `collisionManager.js` - Detects collisions
  - `player.js` - Player (face) functionality
  - `ghost.js` - Ghost (cat) functionality
  - `gameEngine.js` - Main game loop and logic
- `assets/` - Contains game images
- `tests/` - Unit tests for each module

### Running Tests

```
npm install
npm test
``` 