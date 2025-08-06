import { genRandomChars } from '../string';

describe('genRandomChars', () => {
  it('should return a string of default length 6', () => {
    const result = genRandomChars();
    expect(typeof result).toBe('string');
    expect(result.length).toBe(6);
  });

  it('should return a string of specified length', () => {
    const length = 10;
    const result = genRandomChars(length);
    expect(typeof result).toBe('string');
    expect(result.length).toBe(length);
  });

  it('should return different strings on multiple calls', () => {
    const result1 = genRandomChars();
    const result2 = genRandomChars();
    expect(result1).not.toBe(result2);
  });

  it('should only contain alphanumeric characters', () => {
    const result = genRandomChars(20);
    // Should only contain lowercase letters and numbers
    expect(result).toMatch(/^[a-z0-9]+$/);
  });

  it('should handle edge case of length 0', () => {
    const result = genRandomChars(0);
    expect(result).toBe('');
  });

  it('should handle length 1', () => {
    const result = genRandomChars(1);
    expect(result.length).toBe(1);
    expect(result).toMatch(/^[a-z0-9]$/);
  });

  it('should be consistent with its character set across multiple runs', () => {
    // Generate multiple strings and ensure they all follow the same pattern
    const results = Array.from({ length: 10 }, () => genRandomChars(10));

    results.forEach((result) => {
      expect(result).toMatch(/^[a-z0-9]+$/);
      expect(result.length).toBe(10);
    });
  });

  it('should not include special characters or uppercase letters', () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 20; i++) {
      const result = genRandomChars(15);
      // Should not contain uppercase letters, special characters, or whitespace
      expect(result).not.toMatch(/[A-Z]/);
      expect(result).not.toMatch(/[^a-z0-9]/);
    }
  });
});
