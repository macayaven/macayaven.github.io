// tests/ghost.test.js
// Create mock objects
const mockCanvasManager = {
  getDimensions: jest.fn().mockReturnValue({ width: 800, height: 600 })
};

// Define mock at file level
jest.mock('../js/canvasManager', () => mockCanvasManager);

describe('Ghost', () => {
  // Mock assets
  const mockAssets = {
    cat1: { width: 64, height: 64 },
    cat2: { width: 64, height: 64 }
  };
  
  // Mock canvas context with draw tracking
  const mockContext = {
    drawImage: jest.fn()
  };
  
  let Ghost;
  
  beforeEach(() => {
    // Reset mocks
    mockContext.drawImage.mockClear();
    mockCanvasManager.getDimensions.mockClear();
    
    // Import the module under test
    jest.isolateModules(() => {
      Ghost = require('../js/ghost');
      
      // Manually inject the mockCanvasManager into the Ghost module
      if (Ghost.setCanvasManager) {
        Ghost.setCanvasManager(mockCanvasManager);
      }
    });
  });
  
  test('constructor initializes ghost with correct properties', () => {
    // Create a ghost instance
    const ghost = new Ghost(mockAssets.cat1, { x: 100, y: 200 });
    
    // Verify initial properties
    expect(ghost.width).toBe(mockAssets.cat1.width);
    expect(ghost.height).toBe(mockAssets.cat1.height);
    expect(ghost.x).toBe(100);
    expect(ghost.y).toBe(200);
    expect(ghost.speed).toBeGreaterThan(0);
    expect(ghost.directionChangeInterval).toBeGreaterThan(0);
  });
  
  test('update changes position based on current direction', () => {
    // Create a ghost instance
    const ghost = new Ghost(mockAssets.cat1, { x: 100, y: 100 });
    const initialX = ghost.x;
    const initialY = ghost.y;
    
    // Force a direction
    ghost.direction = { x: 1, y: 0 }; // Move right
    
    // Mock the canvas dimensions retrieval
    mockCanvasManager.getDimensions.mockReturnValue({ width: 800, height: 600 });
    
    // Update with a small delta time
    ghost.update(16); // 16ms (typical frame time)
    
    // Verify position change
    expect(ghost.x).toBeGreaterThan(initialX);
    expect(ghost.y).toBe(initialY); // Y shouldn't change
    expect(mockCanvasManager.getDimensions).toHaveBeenCalled();
  });
  
  test('update prevents ghost from going off-canvas', () => {
    // Create a ghost instance and position at edge
    const ghost = new Ghost(mockAssets.cat1, { x: 800 - 64, y: 100 });
    
    // Force direction towards edge
    ghost.direction = { x: 1, y: 0 }; // Move right
    
    // Mock the canvas dimensions retrieval
    mockCanvasManager.getDimensions.mockReturnValue({ width: 800, height: 600 });
    
    // Update with large enough delta time to ensure movement
    ghost.update(1000);
    
    // Verify ghost stays within canvas bounds
    expect(ghost.x).toBeLessThanOrEqual(800 - ghost.width);
    expect(mockCanvasManager.getDimensions).toHaveBeenCalled();
  });
  
  test('update changes direction periodically', () => {
    // Create a ghost instance
    const ghost = new Ghost(mockAssets.cat1, { x: 100, y: 100 });
    
    // Force initial direction
    ghost.direction = { x: 1, y: 0 };
    ghost.directionTimer = ghost.directionChangeInterval - 1; // Just before change
    
    // Store initial direction
    const initialDirection = { ...ghost.direction };
    
    // Mock the canvas dimensions retrieval
    mockCanvasManager.getDimensions.mockReturnValue({ width: 800, height: 600 });
    
    // Update with enough time to trigger direction change
    ghost.update(2);
    
    // Verify direction changed
    expect(ghost.direction).not.toEqual(initialDirection);
    expect(mockCanvasManager.getDimensions).toHaveBeenCalled();
  });
  
  test('chooseNewDirection selects a valid direction', () => {
    // Create a ghost instance
    const ghost = new Ghost(mockAssets.cat1, { x: 100, y: 100 });
    
    // Call the method several times to ensure it works consistently
    for (let i = 0; i < 10; i++) {
      ghost.chooseNewDirection();
      
      // Verify the direction is valid (one component is 0, the other is -1 or 1)
      const { x, y } = ghost.direction;
      
      // Either x is 0 and y is -1 or 1, or y is a 0 and x is -1 or 1
      const isValidDirection = 
        (x === 0 && (y === -1 || y === 1)) || 
        (y === 0 && (x === -1 || x === 1));
        
      expect(isValidDirection).toBe(true);
    }
  });
  
  test('draw renders the ghost image correctly', () => {
    // Create a ghost instance
    const ghost = new Ghost(mockAssets.cat1, { x: 100, y: 100 });
    
    // Draw the ghost
    ghost.draw(mockContext);
    
    // Verify the image was drawn correctly
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockAssets.cat1,
      ghost.x,
      ghost.y,
      ghost.width,
      ghost.height
    );
  });
  
  test('getBounds returns correct position and dimensions', () => {
    // Create a ghost instance
    const ghost = new Ghost(mockAssets.cat1, { x: 100, y: 200 });
    
    // Get bounds
    const bounds = ghost.getBounds();
    
    // Verify bounds match ghost position and dimensions
    expect(bounds).toEqual({
      x: 100,
      y: 200,
      width: mockAssets.cat1.width,
      height: mockAssets.cat1.height
    });
  });
}); 