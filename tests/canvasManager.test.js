// tests/canvasManager.test.js
describe('CanvasManager', () => {
  let canvasElement;
  let contextMock;
  
  beforeEach(() => {
    // Create a mock canvas element
    canvasElement = document.createElement('canvas');
    canvasElement.id = 'gameCanvas';
    document.body.appendChild(canvasElement);
    
    // Mock the 2D context
    contextMock = {
      clearRect: jest.fn(),
      canvas: {
        width: 0,
        height: 0
      }
    };
    
    // Mock getContext to return our mock
    canvasElement.getContext = jest.fn().mockReturnValue(contextMock);
    
    // Reset module registry
    jest.resetModules();
  });
  
  afterEach(() => {
    // Clean up DOM
    document.body.removeChild(canvasElement);
  });
  
  test('initialize should find the canvas and return its 2D context', () => {
    // Import the module under test
    const CanvasManager = require('../js/canvasManager');
    
    // Initialize the canvas manager
    const context = CanvasManager.initialize();
    
    // Expectations
    expect(canvasElement.getContext).toHaveBeenCalledWith('2d');
    expect(context).toBe(contextMock);
  });
  
  test('initialize should set initial canvas dimensions based on window size', () => {
    // Mock window dimensions
    global.innerWidth = 800;
    global.innerHeight = 600;
    
    // Import the module under test
    const CanvasManager = require('../js/canvasManager');
    
    // Initialize the canvas manager
    CanvasManager.initialize();
    
    // Expectations
    // Canvas should be sized to fit the window with some margin
    expect(canvasElement.width).toBeLessThanOrEqual(800);
    expect(canvasElement.height).toBeLessThanOrEqual(600);
    expect(canvasElement.width).toBeGreaterThan(0);
    expect(canvasElement.height).toBeGreaterThan(0);
  });
  
  test('resize should adjust canvas dimensions when window is resized', () => {
    // Import the module under test
    const CanvasManager = require('../js/canvasManager');
    
    // Initialize the canvas manager
    CanvasManager.initialize();
    
    // Initial size
    const initialWidth = canvasElement.width;
    const initialHeight = canvasElement.height;
    
    // Change window size
    global.innerWidth = 1024;
    global.innerHeight = 768;
    
    // Trigger resize
    CanvasManager.resize();
    
    // Expectations
    expect(canvasElement.width).not.toBe(initialWidth);
    expect(canvasElement.height).not.toBe(initialHeight);
    expect(canvasElement.width).toBeLessThanOrEqual(1024);
    expect(canvasElement.height).toBeLessThanOrEqual(768);
  });
  
  test('clear should call clearRect on the context with correct dimensions', () => {
    // Import the module under test
    const CanvasManager = require('../js/canvasManager');
    
    // Set canvas dimensions
    canvasElement.width = 400;
    canvasElement.height = 300;
    contextMock.canvas.width = 400;
    contextMock.canvas.height = 300;
    
    // Initialize the canvas manager
    const context = CanvasManager.initialize();
    
    // Call clear
    CanvasManager.clear();
    
    // Expectations
    expect(contextMock.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
  });
}); 