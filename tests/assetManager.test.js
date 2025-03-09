// tests/assetManager.test.js
// Mock the Image constructor
const mockImage = function() {
  this.onload = null;
  this.onerror = null;
  this.src = '';
};

// Define mock at file level
jest.mock('global', () => ({
  Image: mockImage
}), { virtual: true });

describe('AssetManager', () => {
  let AssetManager;
  
  beforeEach(() => {
    // Reset modules
    jest.resetModules();
    
    // Use real SVG assets from the project to avoid timeouts
    global.Image = function() {
      this.onload = null;
      this.onerror = null;
      this.src = '';
      this.width = 64;
      this.height = 64;
      
      // Auto-trigger onload when src is set
      const originalSrcSetter = Object.getOwnPropertyDescriptor(Image.prototype, 'src')?.set;
      Object.defineProperty(this, 'src', {
        set(value) {
          if (value.includes('nonexistent')) {
            // For invalid URLs, trigger error after a small delay
            setTimeout(() => {
              if (this.onerror) this.onerror(new Error('Failed to load image'));
            }, 10);
          } else {
            // For valid URLs, trigger load after a small delay
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 10);
          }
          
          // Store the value
          this._src = value;
        },
        get() {
          return this._src;
        }
      });
    };
    
    // Import the module under test
    AssetManager = require('../js/assetManager');
  });
  
  afterEach(() => {
    // Restore the original Image
    delete global.Image;
  });
  
  test('loadImages returns a promise that resolves with loaded images', async () => {
    // The image URLs to load
    const imageUrls = {
      faceOpen: 'assets/face-open.png',
      faceClosed: 'assets/face-closed.png'
    };
    
    // Start loading images
    const loadPromise = AssetManager.loadImages(imageUrls);
    
    // Expectations
    expect(loadPromise).toBeInstanceOf(Promise);
    
    // Wait for the promise to resolve
    const loadedImages = await loadPromise;
    
    // Verify the result structure
    expect(loadedImages).toBeDefined();
    expect(Object.keys(loadedImages).length).toBe(Object.keys(imageUrls).length);
    expect(loadedImages.faceOpen).toBeDefined();
    expect(loadedImages.faceClosed).toBeDefined();
  });
  
  test('loadImages handles errors for invalid image URLs gracefully', async () => {
    // Create a spy for the error handler
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // The image URLs to load, including invalid ones
    const imageUrls = {
      valid: 'assets/face-open.png', 
      invalid: 'assets/nonexistent-image.png'
    };
    
    // Start loading images
    const loadPromise = AssetManager.loadImages(imageUrls);
    
    // Wait for the promise to resolve (it should resolve even if some images fail)
    const loadedImages = await loadPromise;
    
    // Verify the error was handled and we still get all entries
    expect(loadedImages).toBeDefined();
    expect(Object.keys(loadedImages).length).toBe(2);
    expect(loadedImages.valid).toBeDefined();
    expect(loadedImages.invalid).toBeDefined();
    
    // Restore console.error
    errorSpy.mockRestore();
  }, 1000); // Set a timeout of 1 second to avoid test timeouts
}); 