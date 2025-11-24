// src/utils/keyboard-shortcuts.js
// Manages keyboard shortcuts for the application

const shortcuts = new Map();
let isInitialized = false;

/**
 * Registers a keyboard shortcut.
 * @param {string} key - Key combination (e.g., 'space', 'ArrowRight', 'ctrl+s')
 * @param {function} callback - Function to call when shortcut is triggered
 * @param {Object} options - Options for the shortcut
 * @returns {void}
 */
export function registerShortcut(key, callback, options = {}) {
  if (!key || typeof callback !== 'function') {
    throw new Error('Key and callback are required');
  }

  shortcuts.set(key.toLowerCase(), { callback, options });
}

/**
 * Unregisters a keyboard shortcut.
 * @param {string} key - Key combination to remove
 * @returns {void}
 */
export function unregisterShortcut(key) {
  shortcuts.delete(key.toLowerCase());
}

/**
 * Initializes keyboard event listeners.
 * @returns {void}
 */
export function initShortcuts() {
  if (isInitialized) return;

  document.addEventListener('keydown', handleKeyDown);
  isInitialized = true;
}

/**
 * Destroys keyboard event listeners.
 * @returns {void}
 */
export function destroyShortcuts() {
  if (isInitialized) {
    document.removeEventListener('keydown', handleKeyDown);
    isInitialized = false;
  }
  shortcuts.clear();
}

/**
 * Handles keydown events.
 * @param {KeyboardEvent} event - The keydown event
 */
function handleKeyDown(event) {
  // Skip if typing in input/textarea
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
    return;
  }

  const key = getKeyCombination(event);
  const shortcut = shortcuts.get(key.toLowerCase());

  if (shortcut) {
    event.preventDefault();
    try {
      shortcut.callback(event);
    } catch (error) {
      console.error('Error executing shortcut callback:', error);
    }
  }
}

/**
 * Gets the key combination string from a keyboard event.
 * @param {KeyboardEvent} event - The keyboard event
 * @returns {string} Key combination string
 */
function getKeyCombination(event) {
  const parts = [];

  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');

  let key = event.key.toLowerCase();
  if (key === ' ') key = 'space';

  parts.push(key);

  return parts.join('+');
}

/**
 * Gets all registered shortcuts.
 * @returns {Array} Array of registered shortcut keys
 */
export function getRegisteredShortcuts() {
  return Array.from(shortcuts.keys());
}