import { VideoThumbnail } from '../components/video-thumbnail.js';

describe('VideoThumbnail Component', () => {
  let videoThumbnail;
  let mockContainer;
  let mockPicture;
  let mockImg;
  let mockObserver;

  beforeEach(() => {
    // Mock shadow DOM elements
    mockContainer = {
      addEventListener: jest.fn(),
      tabIndex: 0,
      dispatchEvent: jest.fn()
    };
    mockPicture = {
      dataset: { src: '' },
      classList: { add: jest.fn() },
      querySelector: jest.fn(() => ({ srcset: '' }))
    };
    mockImg = {
      src: '',
      onload: null,
      onerror: null,
      classList: { add: jest.fn() }
    };

    const mockShadowRoot = {
      querySelector: (selector) => {
        switch (selector) {
          case '.thumbnail-container': return mockContainer;
          case 'picture': return mockPicture;
          case 'img': return mockImg;
          default: return null;
        }
      },
      appendChild: jest.fn(),
      contains: jest.fn(() => true)
    };

    // Mock attachShadow
    HTMLElement.prototype.attachShadow = jest.fn(function() {
      this.shadowRoot = mockShadowRoot;
      return mockShadowRoot;
    });

    videoThumbnail = new VideoThumbnail();

    // Mock IntersectionObserver
    mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn()
    };
    global.IntersectionObserver = jest.fn(() => mockObserver);

    videoThumbnail.handleClick = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create a VideoThumbnail instance', () => {
      expect(videoThumbnail).toBeInstanceOf(VideoThumbnail);
      expect(videoThumbnail).toBeInstanceOf(HTMLElement);
    });

    it('should attach shadow DOM', () => {
      expect(videoThumbnail.shadowRoot).toBeDefined();
    });

    it('should initialize default state', () => {
      expect(videoThumbnail.isLoaded).toBe(false);
      expect(videoThumbnail.observer).toBeNull();
    });
  });

  describe('Lazy Loading Setup', () => {
    it('should setup intersection observer on connect', () => {
      videoThumbnail.setupLazyLoading();

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { rootMargin: '50px' }
      );
      expect(mockObserver.observe).toHaveBeenCalledWith(mockPicture);
    });

    it('should not setup observer if already exists', () => {
      videoThumbnail.observer = mockObserver;

      videoThumbnail.setupLazyLoading();

      expect(global.IntersectionObserver).not.toHaveBeenCalled();
    });

    it('should disconnect observer on disconnect', () => {
      videoThumbnail.observer = mockObserver;

      videoThumbnail.disconnectedCallback();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when no observer exists', () => {
      videoThumbnail.observer = null;

      expect(() => videoThumbnail.disconnectedCallback()).not.toThrow();
    });
  });

  describe('Image Loading', () => {
    it('should load image when intersecting', () => {
      const video = { id: '1', title: 'Test Video', thumbnail: 'test-image.jpg' };
      videoThumbnail.video = video;

      videoThumbnail.loadImage();

      expect(mockPicture.querySelector).toHaveBeenCalledWith('source');
      expect(mockImg.src).toBe('test-image.jpg');
    });

    it('should handle WebP conversion', () => {
      const video = { id: '1', title: 'Test Video', thumbnail: 'test-image.jpg' };
      videoThumbnail.video = video;
      const mockSource = { srcset: '' };
      mockPicture.querySelector.mockReturnValue(mockSource);

      videoThumbnail.loadImage();

      expect(mockSource.srcset).toBe('test-image.webp');
    });

    it('should add loaded class on successful load', () => {
      const video = { id: '1', title: 'Test Video', thumbnail: 'test-image.jpg' };
      videoThumbnail.video = video;
      videoThumbnail.setupLazyLoading(); // Set up observer

      videoThumbnail.loadImage();
      mockImg.onload();

      expect(mockPicture.classList.add).toHaveBeenCalledWith('loaded');
      expect(videoThumbnail.isLoaded).toBe(true);
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle load errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const video = { id: '1', title: 'Test Video', thumbnail: 'test-image.jpg' };
      videoThumbnail.video = video;

      videoThumbnail.loadImage();
      mockImg.onerror();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load image:', 'test-image.jpg');
      expect(mockImg.src).toBe('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzY2NiI+SW1hZ2Ugbm90IGF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=');
      consoleSpy.mockRestore();
    });

    it('should do nothing if no src is set', () => {
      const video = { id: '1', title: 'Test Video', thumbnail: '' };
      videoThumbnail.video = video;

      videoThumbnail.loadImage();

      expect(mockImg.src).toBe('');
    });
  });

  describe('Click Handling', () => {
    it('should handle click and navigate to video', () => {
      videoThumbnail.id = 'video123';
      const locationSpy = jest.spyOn(window, 'location', 'get');
      locationSpy.mockReturnValue({ href: '' });

      videoThumbnail.handleClick();

      expect(window.location.href).toBe('video.html?id=video123');
      locationSpy.mockRestore();
    });

    it('should not navigate if no id is set', () => {
      videoThumbnail.id = '';
      delete window.location;
      window.location = { href: '' };

      videoThumbnail.handleClick();

      expect(window.location.href).toBe('');
    });

    it('should handle keyboard activation', () => {
      videoThumbnail.handleClick = jest.fn();
      videoThumbnail.container.addEventListener.mock.calls[1][1]({ key: 'Enter' });
      expect(videoThumbnail.handleClick).toHaveBeenCalled();
    });

    it('should ignore other keys', () => {
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      mockContainer.dispatchEvent(spaceEvent);

      expect(videoThumbnail.handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Attribute Handling', () => {
    it('should set id attribute on connect', () => {
      videoThumbnail.setAttribute('id', 'test-video');
      videoThumbnail.getAttribute = jest.fn(() => 'test-video');

      videoThumbnail.connectedCallback();

      expect(videoThumbnail.id).toBe('test-video');
    });
  });

  describe('Accessibility', () => {
    it('should make container focusable', () => {
      expect(mockContainer.tabIndex).toBe(0);
    });

    it('should handle keyboard navigation', () => {
      videoThumbnail.connectedCallback();

      expect(mockContainer.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should handle missing shadow DOM elements gracefully', () => {
      videoThumbnail.shadowRoot.querySelector = jest.fn(() => null);

      expect(() => videoThumbnail.connectedCallback()).not.toThrow();
      expect(() => videoThumbnail.setupLazyLoading()).not.toThrow();
    });

    it('should handle observer creation errors', () => {
      global.IntersectionObserver = jest.fn(() => {
        throw new Error('Observer creation failed');
      });

      expect(() => videoThumbnail.setupLazyLoading()).not.toThrow();
    });
  });
});