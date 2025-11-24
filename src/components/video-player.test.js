import { VideoPlayer } from '../components/video-player.js';

describe('VideoPlayer Component', () => {
  let videoPlayer;
  let mockIframe;
  let mockAdapter;

  beforeEach(() => {
    // Create mock elements
    const mockElements = {
      'iframe': mockIframe,
      '.play-pause': { addEventListener: jest.fn(), click: jest.fn() },
      '.progress-bar': { addEventListener: jest.fn(), value: 0 },
      '.volume': { addEventListener: jest.fn(), click: jest.fn() },
      '.volume-slider': { addEventListener: jest.fn(), value: 1 },
      '.fullscreen': { addEventListener: jest.fn() },
      '.quality-btn': { textContent: 'HD', addEventListener: jest.fn() },
      '.dropdown-content': { classList: { remove: jest.fn(), toggle: jest.fn() }, querySelectorAll: jest.fn(() => []) },
      '.subtitles-btn': { classList: { toggle: jest.fn() }, addEventListener: jest.fn() },
      '.speed-display': { textContent: '1x' },
      '.speed-down': { addEventListener: jest.fn() },
      '.speed-up': { addEventListener: jest.fn() },
      '.pip-btn': { addEventListener: jest.fn() },
      '.theater-btn': { addEventListener: jest.fn() },
      '.mini-player-btn': { addEventListener: jest.fn() },
      '.loop-btn': { classList: { toggle: jest.fn() }, addEventListener: jest.fn() },
      '.autoplay-btn': { classList: { toggle: jest.fn() }, addEventListener: jest.fn() },
      '.screenshot-btn': { addEventListener: jest.fn() },
      '.share-timestamp-btn': { addEventListener: jest.fn() },
      '.playlist-btn': { addEventListener: jest.fn() },
      '.watch-later-btn': { addEventListener: jest.fn() },
      '.close-playlist': { addEventListener: jest.fn() },
      '.close-watch-later': { addEventListener: jest.fn() },
      '.playlist-panel': { classList: { toggle: jest.fn(), remove: jest.fn(), contains: jest.fn(() => false) } },
      '.watch-later-panel': { classList: { toggle: jest.fn(), remove: jest.fn(), contains: jest.fn(() => false) } },
      '.playlist-items': { innerHTML: '', appendChild: jest.fn() },
      '.watch-later-items': { innerHTML: '', appendChild: jest.fn() },
    };

    // Create mock shadow root
    const mockShadowRoot = {
      querySelector: (selector) => mockElements[selector] || null,
      querySelectorAll: (selector) => {
        if (selector === '.quality-option') {
          return [{ dataset: { quality: 'auto' }, classList: { toggle: jest.fn() } }];
        }
        return [];
      },
      appendChild: jest.fn(),
      contains: jest.fn(() => true),
      removeChild: jest.fn()
    };

    // Define attachShadow method on HTMLElement prototype
    HTMLElement.prototype.attachShadow = jest.fn(function() {
      this.shadowRoot = mockShadowRoot;
      return mockShadowRoot;
    });

    // Create a new VideoPlayer instance
    videoPlayer = new VideoPlayer();

    // Mock the iframe and adapter
    mockIframe = {};
    mockAdapter = {
      play: jest.fn(),
      pause: jest.fn(),
      setVolume: jest.fn(),
      toggleMute: jest.fn(),
      seek: jest.fn(),
      enterFullscreen: jest.fn(),
      exitFullscreen: jest.fn(),
      getCurrentTime: jest.fn(() => 0),
      getDuration: jest.fn(() => 100),
      isPlaying: false,
      volume: 1,
      muted: false,
      currentTime: 0,
      duration: 100
    };

    // Mock adapter
    videoPlayer.adapter = mockAdapter;
    videoPlayer.domain = {
      play: jest.fn(),
      pause: jest.fn(),
      togglePlayPause: jest.fn(),
      setVolume: jest.fn(),
      toggleMute: jest.fn(),
      seek: jest.fn(),
      toggleFullscreen: jest.fn()
    };

    // Mock localStorage
    videoPlayer.loadSettings = jest.fn();
    videoPlayer.saveSettings = jest.fn();
    videoPlayer.updateUI = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create a VideoPlayer instance', () => {
      expect(videoPlayer).toBeInstanceOf(VideoPlayer);
      expect(videoPlayer).toBeInstanceOf(HTMLElement);
    });

    it('should attach shadow DOM', () => {
      expect(videoPlayer.shadowRoot).toBeDefined();
    });

    it('should initialize default state', () => {
      expect(videoPlayer.currentQuality).toBe('auto');
      expect(videoPlayer.subtitlesEnabled).toBe(false);
      expect(videoPlayer.playbackSpeed).toBe(1.0);
      expect(videoPlayer.isPiPMode).toBe(false);
      expect(videoPlayer.isTheaterMode).toBe(false);
      expect(videoPlayer.isMiniPlayer).toBe(false);
      expect(videoPlayer.isLooping).toBe(false);
      expect(videoPlayer.autoplayNext).toBe(false);
      expect(videoPlayer.playlist).toEqual([]);
      expect(videoPlayer.watchLaterQueue).toEqual([]);
      expect(videoPlayer.currentVideoIndex).toBe(0);
    });
  });

  describe('Attribute Handling', () => {
    it('should handle embed attribute change', () => {
      const embedUrl = 'https://example.com/video';

      videoPlayer.attributeChangedCallback('embed', '', embedUrl);

      expect(mockIframe.src).toBe(embedUrl);
    });

    it('should ignore other attribute changes', () => {
      videoPlayer.attributeChangedCallback('other', '', 'value');

      expect(mockIframe.src).toBeUndefined();
    });
  });

  describe('Settings Management', () => {
    it('should load settings from localStorage', () => {
      const mockSettings = {
        subtitlesEnabled: true,
        playbackSpeed: 1.5,
        isLooping: true,
        autoplayNext: true,
        currentQuality: '1080p'
      };
      localStorage.getItem = jest.fn(() => JSON.stringify(mockSettings));

      videoPlayer.loadSettings();

      expect(videoPlayer.subtitlesEnabled).toBe(true);
      expect(videoPlayer.playbackSpeed).toBe(1.5);
      expect(videoPlayer.isLooping).toBe(true);
      expect(videoPlayer.autoplayNext).toBe(true);
      expect(videoPlayer.currentQuality).toBe('1080p');
    });

    it('should save settings to localStorage', () => {
      videoPlayer.subtitlesEnabled = true;
      videoPlayer.playbackSpeed = 1.25;
      videoPlayer.isLooping = true;
      videoPlayer.autoplayNext = false;
      videoPlayer.currentQuality = '720p';

      localStorage.setItem = jest.fn();
      videoPlayer.saveSettings();

      expect(localStorage.setItem).toHaveBeenCalledWith('video-player-settings', JSON.stringify({
        subtitlesEnabled: true,
        playbackSpeed: 1.25,
        isLooping: true,
        autoplayNext: false,
        currentQuality: '720p'
      }));
    });
  });

  describe('Quality Selection', () => {
    it('should toggle quality dropdown', () => {
      const dropdown = { classList: { toggle: jest.fn() } };
      videoPlayer.shadowRoot.querySelector = jest.fn(() => dropdown);

      videoPlayer.toggleQualityDropdown();

      expect(dropdown.classList.toggle).toHaveBeenCalledWith('show');
    });

    it('should select quality', () => {
      const btn = { textContent: '' };
      videoPlayer.shadowRoot.querySelector = jest.fn((selector) => {
        if (selector === '.quality-btn') return btn;
        if (selector === '.dropdown-content') return { classList: { remove: jest.fn() } };
        return { querySelectorAll: jest.fn(() => []) };
      });

      videoPlayer.selectQuality('1080p');

      expect(videoPlayer.currentQuality).toBe('1080p');
      expect(btn.textContent).toBe('1080P');
    });
  });

  describe('Subtitles', () => {
    it('should toggle subtitles', () => {
      videoPlayer.subtitlesEnabled = false;

      videoPlayer.toggleSubtitles();

      expect(videoPlayer.subtitlesEnabled).toBe(true);
      expect(videoPlayer.saveSettings).toHaveBeenCalled();
    });
  });

  describe('Playback Speed', () => {
    it('should adjust speed up', () => {
      videoPlayer.playbackSpeed = 1.0;

      videoPlayer.adjustSpeed(0.25);

      expect(videoPlayer.playbackSpeed).toBe(1.25);
      expect(videoPlayer.saveSettings).toHaveBeenCalled();
    });

    it('should not exceed maximum speed', () => {
      videoPlayer.playbackSpeed = 3.5;

      videoPlayer.adjustSpeed(1.0);

      expect(videoPlayer.playbackSpeed).toBe(4.0);
    });

    it('should not go below minimum speed', () => {
      videoPlayer.playbackSpeed = 0.5;

      videoPlayer.adjustSpeed(-0.5);

      expect(videoPlayer.playbackSpeed).toBe(0.25);
    });
  });

  describe('Picture-in-Picture', () => {
    it('should toggle PiP mode on', () => {
      document.pictureInPictureElement = null;
      mockIframe.requestPictureInPicture = jest.fn().mockResolvedValue();

      videoPlayer.togglePictureInPicture();

      expect(mockIframe.requestPictureInPicture).toHaveBeenCalled();
      expect(videoPlayer.isPiPMode).toBe(true);
    });

    it('should toggle PiP mode off', () => {
      document.pictureInPictureElement = mockIframe;
      document.exitPictureInPicture = jest.fn().mockResolvedValue();

      videoPlayer.togglePictureInPicture();

      expect(document.exitPictureInPicture).toHaveBeenCalled();
      expect(videoPlayer.isPiPMode).toBe(false);
    });
  });

  describe('Theater Mode', () => {
    it('should toggle theater mode on', () => {
      videoPlayer.isTheaterMode = false;
      videoPlayer.classList.toggle = jest.fn();

      videoPlayer.toggleTheaterMode();

      expect(videoPlayer.isTheaterMode).toBe(true);
      expect(videoPlayer.classList.toggle).toHaveBeenCalledWith('theater-mode', true);
    });

    it('should disable mini player when enabling theater mode', () => {
      videoPlayer.isMiniPlayer = true;
      videoPlayer.isTheaterMode = false;

      videoPlayer.toggleTheaterMode();

      expect(videoPlayer.isMiniPlayer).toBe(false);
    });
  });

  describe('Mini Player', () => {
    it('should toggle mini player mode', () => {
      videoPlayer.isMiniPlayer = false;
      videoPlayer.classList.toggle = jest.fn();

      videoPlayer.toggleMiniPlayer();

      expect(videoPlayer.isMiniPlayer).toBe(true);
      expect(videoPlayer.classList.toggle).toHaveBeenCalledWith('mini-player', true);
    });

    it('should disable theater mode when enabling mini player', () => {
      videoPlayer.isTheaterMode = true;
      videoPlayer.isMiniPlayer = false;

      videoPlayer.toggleMiniPlayer();

      expect(videoPlayer.isTheaterMode).toBe(false);
    });
  });

  describe('Loop Mode', () => {
    it('should toggle loop mode', () => {
      videoPlayer.isLooping = false;

      videoPlayer.toggleLoop();

      expect(videoPlayer.isLooping).toBe(true);
      expect(videoPlayer.saveSettings).toHaveBeenCalled();
    });
  });

  describe('Autoplay', () => {
    it('should toggle autoplay next', () => {
      videoPlayer.autoplayNext = false;

      videoPlayer.toggleAutoplay();

      expect(videoPlayer.autoplayNext).toBe(true);
      expect(videoPlayer.saveSettings).toHaveBeenCalled();
    });
  });

  describe('Screenshot', () => {
    it('should simulate screenshot capture', () => {
      videoPlayer.showToast = jest.fn();

      videoPlayer.takeScreenshot();

      expect(videoPlayer.showToast).toHaveBeenCalledWith('Screenshot saved to gallery');
    });
  });

  describe('Share with Timestamp', () => {
    it('should copy link with timestamp to clipboard', () => {
      const mockClipboard = { writeText: jest.fn().mockResolvedValue() };
      Object.assign(navigator, { clipboard: mockClipboard });
      videoPlayer.adapter.getCurrentTime = jest.fn(() => 45);
      videoPlayer.showToast = jest.fn();
      delete window.location;
      window.location = { href: 'https://example.com/video?id=123' };

      videoPlayer.shareWithTimestamp();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/video?id=123&t=45');
      expect(videoPlayer.showToast).toHaveBeenCalledWith('Link with timestamp copied to clipboard');
    });
  });

  describe('Playlist Management', () => {
    it('should toggle playlist panel', () => {
      const playlistPanel = { classList: { toggle: jest.fn(), contains: jest.fn(() => true) } };
      const watchLaterPanel = { classList: { remove: jest.fn() } };
      videoPlayer.shadowRoot.querySelector = jest.fn((selector) => {
        if (selector === '.playlist-panel') return playlistPanel;
        if (selector === '.watch-later-panel') return watchLaterPanel;
        return null;
      });
      videoPlayer.renderPlaylist = jest.fn();

      videoPlayer.togglePlaylist();

      expect(playlistPanel.classList.toggle).toHaveBeenCalledWith('show');
      expect(watchLaterPanel.classList.remove).toHaveBeenCalledWith('show');
      expect(videoPlayer.renderPlaylist).toHaveBeenCalled();
    });

    it('should add video to playlist', () => {
      const video = { id: 'video1', title: 'Test Video' };
      videoPlayer.savePlaylist = jest.fn();

      videoPlayer.addToPlaylist(video);

      expect(videoPlayer.playlist).toContain(video);
      expect(videoPlayer.savePlaylist).toHaveBeenCalled();
    });

    it('should not add duplicate videos to playlist', () => {
      const video = { id: 'video1', title: 'Test Video' };
      videoPlayer.playlist = [video];
      videoPlayer.savePlaylist = jest.fn();

      videoPlayer.addToPlaylist(video);

      expect(videoPlayer.playlist).toHaveLength(1);
    });

    it('should remove video from playlist', () => {
      const video1 = { id: 'video1', title: 'Video 1' };
      const video2 = { id: 'video2', title: 'Video 2' };
      videoPlayer.playlist = [video1, video2];
      videoPlayer.savePlaylist = jest.fn();
      videoPlayer.renderPlaylist = jest.fn();

      videoPlayer.removeFromPlaylist('video1');

      expect(videoPlayer.playlist).toEqual([video2]);
      expect(videoPlayer.savePlaylist).toHaveBeenCalled();
      expect(videoPlayer.renderPlaylist).toHaveBeenCalled();
    });
  });

  describe('Watch Later Queue', () => {
    it('should add video to watch later', () => {
      const video = { id: 'video1', title: 'Test Video' };
      videoPlayer.saveWatchLater = jest.fn();

      videoPlayer.addToWatchLater(video);

      expect(videoPlayer.watchLaterQueue).toContain(video);
      expect(videoPlayer.saveWatchLater).toHaveBeenCalled();
    });

    it('should play from watch later and remove', () => {
      const video = { id: 'video1', title: 'Test Video' };
      videoPlayer.watchLaterQueue = [video];
      videoPlayer.setAttribute = jest.fn();
      videoPlayer.removeFromWatchLater = jest.fn();

      videoPlayer.playFromWatchLater(video);

      expect(videoPlayer.setAttribute).toHaveBeenCalledWith('embed', video.embed);
      expect(videoPlayer.removeFromWatchLater).toHaveBeenCalledWith(video.id);
    });
  });

  describe('Toast Notifications', () => {
    it('should show toast notification', () => {
      const mockToast = document.createElement('div');
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      videoPlayer.showToast('Test message');

      expect(document.body.appendChild).toHaveBeenCalled();
      // Cleanup happens after timeout
    });
  });

  describe('Lifecycle', () => {
    it('should load playlist and watch later on connect', () => {
      videoPlayer.loadPlaylist = jest.fn();
      videoPlayer.loadWatchLater = jest.fn();

      videoPlayer.connectedCallback();

      expect(videoPlayer.loadPlaylist).toHaveBeenCalled();
      expect(videoPlayer.loadWatchLater).toHaveBeenCalled();
    });

    it('should clean up event listeners on disconnect', () => {
      const mockBtn = { removeEventListener: jest.fn() };
      videoPlayer.shadowRoot.querySelectorAll = jest.fn(() => [mockBtn]);
      videoPlayer.shadowRoot.querySelector = jest.fn(() => mockBtn);

      videoPlayer.disconnectedCallback();

      expect(mockBtn.removeEventListener).toHaveBeenCalledTimes(13); // All event listeners
    });
  });

  describe('Touch Gestures', () => {
    it('should handle touch start', () => {
      const event = {
        preventDefault: jest.fn(),
        touches: [{ clientX: 100, clientY: 200 }]
      };

      videoPlayer.handleTouchStart(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(videoPlayer.touchState.startX).toBe(100);
      expect(videoPlayer.touchState.startY).toBe(200);
    });

    it('should handle double tap', () => {
      videoPlayer.domain.togglePlayPause = jest.fn();
      videoPlayer.showToast = jest.fn();

      // First tap
      videoPlayer.touchState.tapCount = 1;
      videoPlayer.touchState.lastTapTime = Date.now() - 100;

      const event = {
        preventDefault: jest.fn(),
        changedTouches: [{ clientX: 100, clientY: 200 }]
      };

      videoPlayer.handleTouchEnd(event);

      expect(videoPlayer.domain.togglePlayPause).toHaveBeenCalled();
      expect(videoPlayer.showToast).toHaveBeenCalledWith('Play/Pause');
    });

    it('should handle swipe seek', () => {
      videoPlayer.domain.seek = jest.fn();
      videoPlayer.adapter.getCurrentTime = jest.fn(() => 50);
      videoPlayer.showToast = jest.fn();

      videoPlayer.touchState.startX = 100;
      videoPlayer.touchState.startY = 200;
      videoPlayer.touchState.isSwiping = true;

      const event = {
        preventDefault: jest.fn(),
        changedTouches: [{ clientX: 200, clientY: 200 }] // Swipe right
      };

      videoPlayer.handleTouchEnd(event);

      expect(videoPlayer.domain.seek).toHaveBeenCalledWith(60); // 50 + 10
      expect(videoPlayer.showToast).toHaveBeenCalledWith('Seek +10s');
    });
  });

  describe('Device Motion', () => {
    it('should handle shake gesture', () => {
      videoPlayer.playlist = [{ id: 'video1' }];
      videoPlayer.playVideoFromPlaylist = jest.fn();
      videoPlayer.showToast = jest.fn();

      const event = {
        accelerationIncludingGravity: { x: 15, y: 15, z: 15 }
      };

      // Simulate multiple shakes
      videoPlayer.handleDeviceMotion(event);
      videoPlayer.handleDeviceMotion(event);
      videoPlayer.handleDeviceMotion(event);

      expect(videoPlayer.playVideoFromPlaylist).toHaveBeenCalledWith(expect.any(Number));
      expect(videoPlayer.showToast).toHaveBeenCalledWith('Playing random video from playlist');
    });
  });
});