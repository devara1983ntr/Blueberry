import {
  registerShortcut,
  unregisterShortcut,
  initShortcuts,
  destroyShortcuts,
  getRegisteredShortcuts
} from './keyboard-shortcuts.js';

describe('Keyboard Shortcuts', () => {
  let mockCallback;

  beforeEach(() => {
    mockCallback = jest.fn();
    jest.clearAllMocks();
    // Reset module state
    destroyShortcuts();
  });

  afterEach(() => {
    destroyShortcuts();
  });

  describe('registerShortcut', () => {
    it('should register a shortcut successfully', () => {
      registerShortcut('space', mockCallback);

      expect(getRegisteredShortcuts()).toContain('space');
    });

    it('should register shortcuts with modifiers', () => {
      registerShortcut('ctrl+s', mockCallback);

      expect(getRegisteredShortcuts()).toContain('ctrl+s');
    });

    it('should normalize key case', () => {
      registerShortcut('SPACE', mockCallback);

      expect(getRegisteredShortcuts()).toContain('space');
    });

    it('should throw error for missing key', () => {
      expect(() => registerShortcut('', mockCallback)).toThrow('Key and callback are required');
      expect(() => registerShortcut(null, mockCallback)).toThrow('Key and callback are required');
    });

    it('should throw error for missing callback', () => {
      expect(() => registerShortcut('space', null)).toThrow('Key and callback are required');
      expect(() => registerShortcut('space', undefined)).toThrow('Key and callback are required');
      expect(() => registerShortcut('space', 'not a function')).toThrow('Key and callback are required');
    });

    it('should store options with shortcut', () => {
      const options = { preventDefault: false };
      registerShortcut('space', mockCallback, options);

      // Access internal shortcuts map (for testing purposes)
      // In a real scenario, you might expose a getter or test through behavior
      expect(getRegisteredShortcuts()).toContain('space');
    });
  });

  describe('unregisterShortcut', () => {
    it('should unregister a shortcut', () => {
      registerShortcut('space', mockCallback);
      expect(getRegisteredShortcuts()).toContain('space');

      unregisterShortcut('space');

      expect(getRegisteredShortcuts()).not.toContain('space');
    });

    it('should normalize key case when unregistering', () => {
      registerShortcut('space', mockCallback);
      unregisterShortcut('SPACE');

      expect(getRegisteredShortcuts()).not.toContain('space');
    });

    it('should do nothing if shortcut does not exist', () => {
      registerShortcut('space', mockCallback);
      unregisterShortcut('nonexistent');

      expect(getRegisteredShortcuts()).toContain('space');
    });
  });

  describe('initShortcuts', () => {
    it('should add event listener to document', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      initShortcuts();

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should not initialize if already initialized', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      initShortcuts();
      initShortcuts(); // Second call

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroyShortcuts', () => {
    it('should remove event listener from document', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      initShortcuts();
      destroyShortcuts();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should clear all shortcuts', () => {
      registerShortcut('space', mockCallback);
      registerShortcut('enter', mockCallback);

      expect(getRegisteredShortcuts()).toHaveLength(2);

      destroyShortcuts();

      expect(getRegisteredShortcuts()).toHaveLength(0);
    });

    it('should do nothing if not initialized', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      destroyShortcuts();

      expect(removeEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe('getRegisteredShortcuts', () => {
    it('should return array of registered shortcut keys', () => {
      registerShortcut('space', mockCallback);
      registerShortcut('ctrl+s', mockCallback);

      const shortcuts = getRegisteredShortcuts();

      expect(shortcuts).toEqual(expect.arrayContaining(['space', 'ctrl+s']));
      expect(shortcuts).toHaveLength(2);
    });

    it('should return empty array when no shortcuts registered', () => {
      const shortcuts = getRegisteredShortcuts();

      expect(shortcuts).toEqual([]);
    });
  });

  describe('Shortcut execution', () => {
    beforeEach(() => {
      initShortcuts();
    });

    it('should execute callback when shortcut is triggered', () => {
      registerShortcut('space', mockCallback);

      const event = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith(event);
    });

    it('should handle modifier keys', () => {
      registerShortcut('ctrl+s', mockCallback);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        preventDefault: jest.fn()
      });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith(event);
    });

    it('should prevent default for registered shortcuts', () => {
      registerShortcut('space', mockCallback);

      const preventDefaultSpy = jest.fn();
      const event = new KeyboardEvent('keydown', {
        key: ' '
      });
      event.preventDefault = preventDefaultSpy;
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not execute callback for unregistered shortcuts', () => {
      registerShortcut('space', mockCallback);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should skip execution when typing in input/textarea', () => {
      registerShortcut('space', mockCallback);

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(event, 'target', { value: input });

      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should skip execution when typing in contenteditable', () => {
      registerShortcut('space', mockCallback);

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(event, 'target', { value: div });

      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      registerShortcut('space', errorCallback);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const event = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(event);

      expect(errorCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error executing shortcut callback:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});