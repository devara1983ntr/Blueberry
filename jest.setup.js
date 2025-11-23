// Jest setup for Firebase mocking
import { jest } from '@jest/globals';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

// Firebase mocking is done in individual test files that need it

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch for i18n
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
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
    this.attachShadow = jest.fn(() => ({
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      contains: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      getElementById: jest.fn(),
      style: {},
    }));
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
    this.dispatchEvent = jest.fn();
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

// Mock window methods
Object.defineProperty(window, 'DeviceMotionEvent', {
  writable: true,
  value: global.DeviceMotionEvent,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
  writable: true,
});

// Mock prompt and alert for age verification
global.prompt = jest.fn();
global.alert = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};