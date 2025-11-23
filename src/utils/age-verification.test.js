import {
  isAgeVerified,
  verifyAge,
  setAgeVerified,
  promptAgeVerification
} from './age-verification.js';

describe('Age Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('isAgeVerified', () => {
    it('should return true when age is verified', () => {
      localStorage.setItem('ageVerified', 'true');

      expect(isAgeVerified()).toBe(true);
    });

    it('should return false when age is not verified', () => {
      localStorage.setItem('ageVerified', 'false');

      expect(isAgeVerified()).toBe(false);
    });

    it('should return false when no verification status exists', () => {
      expect(isAgeVerified()).toBe(false);
    });

    it('should return false when localStorage access fails', () => {
      localStorage.getItem = jest.fn(() => {
        throw new Error('Storage access denied');
      });

      expect(isAgeVerified()).toBe(false);
    });
  });

  describe('verifyAge', () => {
    it('should return true for age 18 or older', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 18);

      expect(verifyAge(birthDate.toISOString().split('T')[0])).toBe(true);
    });

    it('should return false for age under 18', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 17);

      expect(verifyAge(birthDate.toISOString().split('T')[0])).toBe(false);
    });

    it('should handle leap year birthdays correctly', () => {
      // February 29, 2004 (leap year) - person turns 18 on Feb 29, 2022
      const today = new Date('2022-02-28');
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2022);
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(1); // February (0-indexed)
      jest.spyOn(Date.prototype, 'getDate').mockReturnValue(28);

      expect(verifyAge('2004-02-29')).toBe(true);
    });

    it('should handle edge case of birthday today', () => {
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setFullYear(today.getFullYear() - 18);

      expect(verifyAge(birthDate.toISOString().split('T')[0])).toBe(true);
    });

    it('should handle edge case of birthday tomorrow (not yet 18)', () => {
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setFullYear(today.getFullYear() - 18);
      birthDate.setDate(today.getDate() + 1);

      expect(verifyAge(birthDate.toISOString().split('T')[0])).toBe(false);
    });

    it('should throw error for missing birth date', () => {
      expect(() => verifyAge('')).toThrow('Birth date is required');
      expect(() => verifyAge(null)).toThrow('Birth date is required');
      expect(() => verifyAge(undefined)).toThrow('Birth date is required');
    });

    it('should throw error for invalid date format', () => {
      expect(() => verifyAge('invalid-date')).toThrow('Invalid birth date format');
    });

    it('should handle Date constructor errors', () => {
      const originalDate = global.Date;
      global.Date = jest.fn(() => {
        throw new Error('Invalid date');
      });

      expect(() => verifyAge('2020-01-01')).toThrow('Failed to verify age: Invalid date');

      global.Date = originalDate;
    });
  });

  describe('setAgeVerified', () => {
    it('should set verification status to true', () => {
      setAgeVerified(true);

      expect(localStorage.getItem('ageVerified')).toBe('true');
    });

    it('should set verification status to false', () => {
      setAgeVerified(false);

      expect(localStorage.getItem('ageVerified')).toBe('false');
    });

    it('should handle localStorage errors', () => {
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => setAgeVerified(true)).toThrow(
        'Failed to set age verification: Storage quota exceeded'
      );
    });
  });

  describe('promptAgeVerification', () => {
    it('should return true when user enters valid age 18+ date', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20);
      global.prompt = jest.fn(() => birthDate.toISOString().split('T')[0]);

      const result = await promptAgeVerification();

      expect(result).toBe(true);
      expect(isAgeVerified()).toBe(true);
    });

    it('should return false when user enters age under 18 date', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 16);
      global.prompt = jest.fn(() => birthDate.toISOString().split('T')[0]);

      const result = await promptAgeVerification();

      expect(result).toBe(false);
      expect(isAgeVerified()).toBe(false);
    });

    it('should return false when user cancels prompt', async () => {
      global.prompt = jest.fn(() => null);

      const result = await promptAgeVerification();

      expect(result).toBe(false);
      expect(isAgeVerified()).toBe(false);
    });

    it('should return false and show alert for invalid date', async () => {
      global.prompt = jest.fn(() => 'invalid-date');
      global.alert = jest.fn();

      const result = await promptAgeVerification();

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Invalid date format. Please use YYYY-MM-DD.');
      expect(isAgeVerified()).toBe(false);
    });

    it('should handle verifyAge errors', async () => {
      global.prompt = jest.fn(() => '2020-13-45'); // Invalid date
      global.alert = jest.fn();

      const result = await promptAgeVerification();

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Invalid date format. Please use YYYY-MM-DD.');
    });
  });
});