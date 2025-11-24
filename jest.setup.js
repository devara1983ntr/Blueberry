// Jest setup for Firebase mocking
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Crypto
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn((algo, data) => Promise.resolve(new Uint8Array(32))),
    },
  },
});

// Singleton Mocks
const mockAuthInstance = {
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    currentUser: null,
};

const mockFirestoreInstance = {
    collection: jest.fn(() => ({
        doc: jest.fn(() => ({
            get: jest.fn(),
            set: jest.fn(),
            update: jest.fn(),
        })),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(),
    })),
    doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
    })),
};

// Mock Global Firebase Object (Compat Style)
global.firebase = {
  initializeApp: jest.fn(() => ({})),
  analytics: jest.fn(),
  auth: jest.fn(() => mockAuthInstance),
  firestore: jest.fn(() => mockFirestoreInstance),
};

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn(function(key) { return this.store[key] || null; }),
  setItem: jest.fn(function(key, value) { this.store[key] = value.toString(); }),
  removeItem: jest.fn(function(key) { delete this.store[key]; }),
  clear: jest.fn(function() { this.store = {}; }),
};
global.localStorage = localStorageMock;

// Mock fetch for i18n and data
global.fetch = jest.fn((url) => {
    if (url.includes('i18n')) {
         if (url.includes('hi.json')) {
             return Promise.resolve({
                 ok: true,
                 json: () => Promise.resolve({ hello: 'नमस्ते' }),
                 text: () => Promise.resolve(JSON.stringify({ hello: 'नमस्ते' }))
             });
         }
         return Promise.resolve({
             ok: true,
             json: () => Promise.resolve({
                 "nav.home": "Home",
                 "settings.success": "Success",
                 "settings.ok": "OK",
                 "settings.parentalUpdated": "Parental controls updated",
                 "common.loading": "Loading..."
             }),
             text: () => Promise.resolve('{}')
         });
    }
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve('[]')
    });
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
      this.callback = callback;
  }
  observe(element) {
      this.callback([{ isIntersecting: true, target: element }]);
  }
  disconnect() {}
  unobserve() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock DeviceMotionEvent
global.DeviceMotionEvent = class DeviceMotionEvent {};

// Mock custom elements registry
global.customElements = {
  define: jest.fn(),
  get: jest.fn(),
};

// Mock document methods for fullscreen
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});
document.exitFullscreen = jest.fn();
document.pictureInPictureElement = jest.fn();

// Mock HTMLElement for custom elements
global.HTMLElement = class HTMLElement {
  constructor() {
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
    this.dispatchEvent = jest.fn();
    this.attachShadow = jest.fn((init) => {
        const shadowRoot = document.createElement('div');
        const originalQuerySelector = shadowRoot.querySelector.bind(shadowRoot);

        shadowRoot.innerHTML = '';

        shadowRoot.querySelector = jest.fn((sel) => {
             if (sel === 'iframe') return document.createElement('iframe');
             const el = originalQuerySelector(sel);
             if (el) return el;
             return {
                 addEventListener: jest.fn(),
                 removeEventListener: jest.fn(),
                 classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
                 style: {},
                 value: '',
                 textContent: '',
                 click: jest.fn()
             };
        });
        shadowRoot.querySelectorAll = jest.fn((sel) => []);
        shadowRoot.getElementById = jest.fn((id) => {
            return {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                 classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
                 style: {},
                 value: '',
                 textContent: '',
                 click: jest.fn()
            }
        });
        shadowRoot.appendChild = jest.fn((node) => node);
        this.shadowRoot = shadowRoot;
        return shadowRoot;
    });
    this.setAttribute = jest.fn();
    this.getAttribute = jest.fn();
    this.hasAttribute = jest.fn();
    this.removeAttribute = jest.fn();
    this.classList = {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn(),
    };
    this.style = {};
    this.tabIndex = 0;
  }
};

Object.defineProperty(window, 'DeviceMotionEvent', {
  writable: true,
  value: global.DeviceMotionEvent,
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
  writable: true,
});

global.prompt = jest.fn();
global.alert = jest.fn();

global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};
