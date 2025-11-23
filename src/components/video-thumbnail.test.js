import '../components/video-thumbnail.js';

describe('VideoThumbnail Component', () => {
  let videoThumbnail;
  let mockContainer;
  let mockPicture;
  let mockImg;
  let mockObserver;

  beforeEach(() => {
    videoThumbnail = new VideoThumbnail();
    document.body.appendChild(videoThumbnail);

    // Mock shadow DOM elements
    mockContainer = {
      addEventListener: jest.fn(),
      tabIndex: 0
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

    videoThumbnail.shadowRoot = {
      querySelector: jest.fn((selector) => {
        switch (selector) {
          case '.thumbnail-container': return mockContainer;
          case 'picture': return mockPicture;
          case 'img': return mockImg;
          default: return null;
        }
      })
    };

    // Mock IntersectionObserver
    mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn()
    };
    global.IntersectionObserver = jest.fn(() => mockObserver);

    videoThumbnail.handleClick = jest.fn();
  });

  afterEach(() => {
    document.body.removeChild(videoThumbnail);
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
      const testSrc = 'test-image.jpg';
      mockPicture.dataset.src = testSrc;

      videoThumbnail.loadImage();

      expect(mockPicture.querySelector).toHaveBeenCalledWith('source');
      expect(mockImg.src).toBe(testSrc);
    });

    it('should handle WebP conversion', () => {
      const testSrc = 'test-image.jpg';
      mockPicture.dataset.src = testSrc;
      const mockSource = { srcset: '' };
      mockPicture.querySelector.mockReturnValue(mockSource);

      videoThumbnail.loadImage();

      expect(mockSource.srcset).toBe('test-image.webp');
    });

    it('should add loaded class on successful load', () => {
      mockPicture.dataset.src = 'test-image.jpg';

      videoThumbnail.loadImage();
      mockImg.onload();

      expect(mockPicture.classList.add).toHaveBeenCalledWith('loaded');
      expect(videoThumbnail.isLoaded).toBe(true);
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle load errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockPicture.dataset.src = 'test-image.jpg';

      videoThumbnail.loadImage();
      mockImg.onerror();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load image:', 'test-image.jpg');
      expect(mockImg.src).toBe('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzY2NiI+SW1hZ2Ugbm90IGF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=');
      consoleSpy.mockRestore();
    });

    it('should do nothing if no src is set', () => {
      mockPicture.dataset.src = '';

      videoThumbnail.loadImage();

      expect(mockImg.src).toBe('');
    });
  });

  describe('Click Handling', () => {
    it('should handle click and navigate to video', () => {
      videoThumbnail.id = 'video123';
      delete window.location;
      window.location = { href: '' };

      videoThumbnail.handleClick();

      expect(window.location.href).toBe('video.html?id=video123');
    });

    it('should not navigate if no id is set', () => {
      videoThumbnail.id = '';
      delete window.location;
      window.location = { href: '' };

      videoThumbnail.handleClick();

      expect(window.location.href).toBe('');
    });

    it('should handle keyboard activation', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      mockContainer.dispatchEvent(enterEvent);

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

      videoThumbnail.connectedCallback();

      expect(videoThumbnail.id).toBe('test-video');
    });
  });

  describe('Accessibility', () => {
    it('should make container focusable', () => {
      expect(mockContainer.tabIndex).toBe(0);
    });

    it('should handle keyboard navigation', () => {
      videoThumbnail.shadowRoot.querySelector = jest.fn((selector) => {
        if (selector === '.thumbnail-container') return mockContainer;
        return null;
      });

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
      expect(() => videoThumbnail.loadImage()).not.toThrow();
    });

    it('should handle observer creation errors', () => {
      global.IntersectionObserver = jest.fn(() => {
        throw new Error('Observer creation failed');
      });

      expect(() => videoThumbnail.setupLazyLoading()).not.toThrow();
    });
  });
});