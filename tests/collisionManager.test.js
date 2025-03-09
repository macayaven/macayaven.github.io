// tests/collisionManager.test.js
describe('CollisionManager', () => {
  let CollisionManager;
  
  beforeEach(() => {
    // Reset modules
    jest.resetModules();
    
    // Import the module under test
    CollisionManager = require('../js/collisionManager');
  });
  
  test('checkCollision returns true when objects overlap', () => {
    // Create two colliding objects
    const object1 = {
      x: 100,
      y: 100,
      width: 50,
      height: 50
    };
    
    const object2 = {
      x: 140,
      y: 140,
      width: 50,
      height: 50
    };
    
    // Check collision
    const result = CollisionManager.checkCollision(object1, object2);
    
    // Should return true as objects overlap
    expect(result).toBe(true);
  });
  
  test('checkCollision returns false when objects do not overlap', () => {
    // Create two non-colliding objects
    const object1 = {
      x: 100,
      y: 100,
      width: 50,
      height: 50
    };
    
    const object2 = {
      x: 200,
      y: 200,
      width: 50,
      height: 50
    };
    
    // Check collision
    const result = CollisionManager.checkCollision(object1, object2);
    
    // Should return false as objects don't overlap
    expect(result).toBe(false);
  });
  
  test('checkCollision returns true when objects touch at an edge', () => {
    // Create two objects that touch at an edge
    const object1 = {
      x: 100,
      y: 100,
      width: 50,
      height: 50
    };
    
    const object2 = {
      x: 150,
      y: 100,
      width: 50,
      height: 50
    };
    
    // Check collision
    const result = CollisionManager.checkCollision(object1, object2);
    
    // Should return true as objects touch at an edge
    expect(result).toBe(true);
  });
  
  test('checkCollision returns true when one object is inside another', () => {
    // Create two objects where one is inside the other
    const object1 = {
      x: 100,
      y: 100,
      width: 100,
      height: 100
    };
    
    const object2 = {
      x: 125,
      y: 125,
      width: 50,
      height: 50
    };
    
    // Check collision
    const result = CollisionManager.checkCollision(object1, object2);
    
    // Should return true as one object is inside another
    expect(result).toBe(true);
  });
  
  test('checkCollision handles edge cases correctly', () => {
    // Edge case 1: Zero width/height
    const zeroWidth = {
      x: 100,
      y: 100,
      width: 0,
      height: 50
    };
    
    const normal = {
      x: 100,
      y: 100,
      width: 50,
      height: 50
    };
    
    // Should still detect collision even with zero width
    expect(CollisionManager.checkCollision(zeroWidth, normal)).toBe(true);
    
    // Edge case 2: Negative position
    const negativePos = {
      x: -50,
      y: -50,
      width: 100,
      height: 100
    };
    
    const zeroPos = {
      x: 0,
      y: 0,
      width: 50,
      height: 50
    };
    
    // Should handle negative positions correctly
    expect(CollisionManager.checkCollision(negativePos, zeroPos)).toBe(true);
  });
}); 