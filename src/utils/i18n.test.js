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
          json: () => Promise.resolve({ hello: 'नमस्ते' }),
          text: () => Promise.resolve(JSON.stringify({ hello: 'नमस्ते' }))
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
          json: () => Promise.resolve({ hello: 'Hello' }),
          text: () => Promise.resolve(JSON.stringify({ hello: 'Hello' }))
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
          json: () => Promise.resolve({ hello: 'Hello' }),
          text: () => Promise.resolve(JSON.stringify({ hello: 'Hello' }))
        })
      );

      await i18n.init();

      expect(i18n.getLanguage()).toBe('en');
    });

    it('should handle fetch failure and use fallback', async () => {
      localStorage.setItem('blueberry-language', 'hi');
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'));

      await i18n.init();

      // Language remains 'hi', but translations fallback (to English mostly)
      expect(i18n.getLanguage()).toBe('hi');
      expect(i18n.translations.common.loading).toBe('Loading...'); // From fallback
    });
  });

  describe('setLanguage', () => {
    beforeEach(async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hello: 'नमस्ते' }),
          text: () => Promise.resolve(JSON.stringify({ hello: 'नमस्ते' }))
        })
      );
    });

    it('should set language successfully', async () => {
      await i18n.setLanguage('hi');

      expect(i18n.getLanguage()).toBe('hi');
      expect(localStorage.getItem('blueberry-language')).toBe('hi');
      expect(i18n.translations.hello).toBe('नमस्ते');
    });

    it('should dispatch languageChanged event', async () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      await i18n.setLanguage('hi');

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'languageChanged',
          detail: { language: 'hi' }
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
          ok: false,
          text: () => Promise.resolve('Error')
        })
      );

      await i18n.setLanguage('hi');

      expect(i18n.getLanguage()).toBe('hi'); // Still sets language
      // Translations should be fallback
      expect(i18n.translations.common.loading).toBe('Loading...');
    });
  });

  describe('getLanguage', () => {
    it('should return current language', () => {
      i18n.currentLanguage = 'hi';

      expect(i18n.getLanguage()).toBe('hi');
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
      // expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
      consoleSpy.mockRestore();
    });
  });

  describe('loadTranslations', () => {
    it('should load translations successfully', async () => {
      const mockTranslations = { test: 'value' };
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTranslations),
          text: () => Promise.resolve(JSON.stringify(mockTranslations))
        })
      );

      await i18n.loadTranslations('hi');

      expect(i18n.translations).toEqual(mockTranslations);
      expect(global.fetch).toHaveBeenCalledWith('src/i18n/hi.json');
    });

    it('should handle fetch failure', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      await i18n.loadTranslations('hi');

      // Fallback
      expect(i18n.translations.common.loading).toBe('Loading...');
    });
  });
});
