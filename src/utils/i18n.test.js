import { i18n } from './i18n.js';

describe('I18n', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    // Reset i18n instance
    i18n.currentLanguage = 'en';
    i18n.translations = {};
  });

  describe('init', () => {
    it('should initialize with stored language', async () => {
      localStorage.setItem('blueberry-language', 'hi');
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hello: 'नमस्ते' })
        })
      );

      await i18n.init();

      expect(i18n.getLanguage()).toBe('hi');
      expect(i18n.translations.hello).toBe('नमस्ते');
    });

    it('should default to English when no stored language', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hello: 'Hello' })
        })
      );

      await i18n.init();

      expect(i18n.getLanguage()).toBe('en');
    });

    it('should handle invalid stored language', async () => {
      localStorage.setItem('blueberry-language', 'invalid');
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hello: 'Hello' })
        })
      );

      await i18n.init();

      expect(i18n.getLanguage()).toBe('en');
    });

    it('should handle fetch failure and fallback to English', async () => {
      localStorage.setItem('blueberry-language', 'hi');
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hello: 'Hello' })
        });

      await i18n.init();

      expect(i18n.getLanguage()).toBe('en');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('setLanguage', () => {
    beforeEach(async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hello: 'Hola' })
        })
      );
    });

    it('should set language successfully', async () => {
      await i18n.setLanguage('es');

      expect(i18n.getLanguage()).toBe('es');
      expect(localStorage.getItem('blueberry-language')).toBe('es');
      expect(i18n.translations.hello).toBe('Hola');
    });

    it('should dispatch languageChanged event', async () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      await i18n.setLanguage('es');

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'languageChanged',
          detail: { language: 'es' }
        })
      );
    });

    it('should reject unsupported language', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await i18n.setLanguage('unsupported');

      expect(i18n.getLanguage()).toBe('en'); // Remains default
      expect(consoleSpy).toHaveBeenCalledWith('Unsupported language: unsupported');

      consoleSpy.mockRestore();
    });

    it('should handle fetch failure', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false
        })
      );

      await i18n.setLanguage('es');

      expect(i18n.getLanguage()).toBe('es'); // Still sets language
      expect(i18n.translations).toEqual({}); // But translations fail
    });
  });

  describe('getLanguage', () => {
    it('should return current language', () => {
      i18n.currentLanguage = 'fr';

      expect(i18n.getLanguage()).toBe('fr');
    });
  });

  describe('t (translate)', () => {
    beforeEach(() => {
      i18n.translations = {
        greeting: 'Hello',
        user: {
          name: 'John',
          message: 'Welcome {name}!'
        },
        missing: {
          key: 'Default'
        }
      };
    });

    it('should translate simple key', () => {
      expect(i18n.t('greeting')).toBe('Hello');
    });

    it('should translate nested key', () => {
      expect(i18n.t('user.name')).toBe('John');
    });

    it('should interpolate variables', () => {
      expect(i18n.t('user.message', { name: 'Alice' })).toBe('Welcome Alice!');
    });

    it('should handle missing variables', () => {
      expect(i18n.t('user.message', {})).toBe('Welcome {name}!');
    });

    it('should return key for missing translation', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: nonexistent.key');

      consoleSpy.mockRestore();
    });

    it('should return key for invalid nested structure', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(i18n.t('missing')).toBe('missing');
      expect(consoleSpy).toHaveBeenCalledWith('Translation key not found: missing');

      consoleSpy.mockRestore();
    });

    it('should handle empty translations', () => {
      i18n.translations = {};

      expect(i18n.t('any.key')).toBe('any.key');
    });
  });

  describe('loadTranslations', () => {
    it('should load translations successfully', async () => {
      const mockTranslations = { test: 'value' };
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTranslations)
        })
      );

      await i18n.loadTranslations('es');

      expect(i18n.translations).toEqual(mockTranslations);
      expect(global.fetch).toHaveBeenCalledWith('src/i18n/es.json');
    });

    it('should handle fetch failure', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      await i18n.loadTranslations('es');

      expect(i18n.translations).toEqual({});
    });

    it('should handle non-ok response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false
        })
      );

      await i18n.loadTranslations('es');

      expect(i18n.translations).toEqual({});
    });

    it('should fallback to English on failure when not English', async () => {
      const englishTranslations = { hello: 'Hello' };
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(englishTranslations)
        });

      await i18n.loadTranslations('es');

      expect(i18n.translations).toEqual(englishTranslations);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not fallback when loading English fails', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      await i18n.loadTranslations('en');

      expect(i18n.translations).toEqual({});
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});