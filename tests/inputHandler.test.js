// tests/inputHandler.test.js
describe('InputHandler', () => {
  let addEventListenerSpy;
  let removeEventListenerSpy;
  
  beforeEach(() => {
    // Mock event listeners
    addEventListenerSpy = jest.spyOn(window, 'addEventListener').mockImplementation(() => {});
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
    
    // Reset modules
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore mocks
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
  
  test('initialize should set up event listeners for keyboard events', () => {
    // Import the module under test
    const InputHandler = require('../js/inputHandler');
    
    // Initialize the input handler
    InputHandler.initialize();
    
    // Expectations
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
  });
  
  test('getDirection should return the current direction state', () => {
    // Import the module under test
    const InputHandler = require('../js/inputHandler');
    
    // Initialize with no keys pressed
    InputHandler.initialize();
    
    // Get initial direction
    const initialDirection = InputHandler.getDirection();
    
    // Expectations for initial state
    expect(initialDirection).toEqual({ x: 0, y: 0 });
  });
  
  test('keydown events should update direction correctly', () => {
    // Import the module under test
    const InputHandler = require('../js/inputHandler');
    
    // Initialize the input handler
    InputHandler.initialize();
    
    // Extract the keydown handler
    const keydownHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'keydown')[1];
    
    // Simulate arrow key presses
    keydownHandler({ key: 'ArrowUp', preventDefault: jest.fn() });
    expect(InputHandler.getDirection()).toEqual({ x: 0, y: -1 });
    
    keydownHandler({ key: 'ArrowRight', preventDefault: jest.fn() });
    expect(InputHandler.getDirection()).toEqual({ x: 1, y: 0 });
    
    keydownHandler({ key: 'ArrowDown', preventDefault: jest.fn() });
    expect(InputHandler.getDirection()).toEqual({ x: 0, y: 1 });
    
    keydownHandler({ key: 'ArrowLeft', preventDefault: jest.fn() });
    expect(InputHandler.getDirection()).toEqual({ x: -1, y: 0 });
  });
  
  test('keyup events should reset direction only for the released key', () => {
    // Import the module under test
    const InputHandler = require('../js/inputHandler');
    
    // Initialize the input handler
    InputHandler.initialize();
    
    // Extract the keydown and keyup handlers
    const keydownHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'keydown')[1];
    const keyupHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'keyup')[1];
    
    // Simulate arrow key press
    keydownHandler({ key: 'ArrowRight', preventDefault: jest.fn() });
    expect(InputHandler.getDirection()).toEqual({ x: 1, y: 0 });
    
    // Simulate key release
    keyupHandler({ key: 'ArrowRight', preventDefault: jest.fn() });
    expect(InputHandler.getDirection()).toEqual({ x: 0, y: 0 });
  });
  
  test('cleanup should remove event listeners', () => {
    // Import the module under test
    const InputHandler = require('../js/inputHandler');
    
    // Initialize and then clean up
    InputHandler.initialize();
    InputHandler.cleanup();
    
    // Expectations
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
  });
}); 