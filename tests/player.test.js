// tests/player.test.js
// Create mock objects
const mockCanvasManager = {
  getDimensions: jest.fn().mockReturnValue({ width: 800, height: 600 })
};

// Define the mock at the top level
jest.mock('../js/canvasManager', () => mockCanvasManager);

describe('Player', () => {
  // Mock assets
  const mockAssets = {
    faceOpen: { width: 64, height: 64 },
    faceClosed: { width: 64, height: 64 }
  };
  
  // Mock canvas context with draw tracking
  const mockContext = {
    drawImage: jest.fn()
  };
  
  let Player;
  
  beforeEach(() => {
    // Reset mocks
    mockContext.drawImage.mockClear();
    mockCanvasManager.getDimensions.mockClear();
    
    // Import the module under test with isolation
    jest.isolateModules(() => {
      Player = require('../js/player');
      
      // Manually inject the mockCanvasManager into the Player module
      if (Player.setCanvasManager) {
        Player.setCanvasManager(mockCanvasManager);
      }
    });
  });
  
  test('constructor initializes player with correct properties', () => {
    // Mock canvas dimensions for this test
    mockCanvasManager.getDimensions.mockReturnValue({ width: 800, height: 600 });
    
    // Create a player instance
    const player = new Player(mockAssets);
    
    // Verify initial properties
    expect(player.width).toBe(mockAssets.faceOpen.width);
    expect(player.height).toBe(mockAssets.faceOpen.height);
    
    // Verify player starts in the middle of the canvas
    expect(player.x).toBe(400 - player.width / 2); // 800/2 - width/2
    expect(player.y).toBe(300 - player.height / 2); // 600/2 - height/2
    
    // Verify initial state
    expect(player.mouthOpen).toBe(true);
    expect(player.speed).toBeGreaterThan(0);
    
    // Verify the mock was called
    expect(mockCanvasManager.getDimensions).toHaveBeenCalled();
  });
  
  test('update changes position based on direction', () => {
    // Mock canvas dimensions for this test
    mockCanvasManager.getDimensions.mockReturnValue({ width: 800, height: 600 });
    
    // Create a player instance
    const player = new Player(mockAssets);
    const initialX = player.x;
    const initialY = player.y;
    
    // Reset the mock for cleaner assertions
    mockCanvasManager.getDimensions.mockClear();
    
    // Set direction and update
    const direction = { x: 1, y: 0 }; // Move right
    player.update(direction, 16); // 16ms (typical frame time)
    
    // Verify position change
    expect(player.x).toBeGreaterThan(initialX);
    expect(player.y).toBe(initialY); // Y shouldn't change
    expect(mockCanvasManager.getDimensions).toHaveBeenCalled();
  });
  
  test('update prevents player from going off-canvas', () => {
    // Mock canvas dimensions for this test
    mockCanvasManager.getDimensions.mockReturnValue({ width: 800, height: 600 });
    
    // Create a player instance and position at edge
    const player = new Player(mockAssets);
    player.x = 800 - player.width; // Right edge of canvas - right edge of player = right edge
    
    // Reset the mock for cleaner assertions
    mockCanvasManager.getDimensions.mockClear();
    
    // Try to move right (which would go off-canvas)
    const direction = { x: 1, y: 0 };
    player.update(direction, 100); // Large deltaTime to ensure movement
    
    // Verify player stays within canvas bounds
    expect(player.x).toBeLessThanOrEqual(800 - player.width);
    expect(mockCanvasManager.getDimensions).toHaveBeenCalled();
  });
  
  test('update toggles mouth state based on animation timer', () => {
    // Mock canvas dimensions for this test
    mockCanvasManager.getDimensions.mockReturnValue({ width: 800, height: 600 });
    
    // Create a player instance
    const player = new Player(mockAssets);
    const initialMouthState = player.mouthOpen;
    
    // Reset the mock for cleaner assertions
    mockCanvasManager.getDimensions.mockClear();
    
    // Update with large enough deltaTime to toggle mouth state
    player.update({ x: 1, y: 0 }, 200); // Should be enough to cross animation threshold
    
    // Verify mouth state changed
    expect(player.mouthOpen).toBe(!initialMouthState);
    expect(mockCanvasManager.getDimensions).toHaveBeenCalled();
  });
  
  test('draw renders the correct image based on mouth state', () => {
    // Mock canvas dimensions for this test
    mockCanvasManager.getDimensions.mockReturnValue({ width: 800, height: 600 });
    
    // Create a player instance
    const player = new Player(mockAssets);
    
    // Draw with mouth open
    player.mouthOpen = true;
    player.draw(mockContext);
    
    // Verify the open mouth image was drawn
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockAssets.faceOpen,
      player.x,
      player.y,
      player.width,
      player.height
    );
    
    // Reset mock and change mouth state
    mockContext.drawImage.mockClear();
    player.mouthOpen = false;
    player.draw(mockContext);
    
    // Verify the closed mouth image was drawn
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockAssets.faceClosed,
      player.x,
      player.y,
      player.width,
      player.height
    );
  });
}); 