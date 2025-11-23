import {
  addToLocalHistory,
  getLocalHistory,
  clearLocalHistory,
  removeFromLocalHistory
} from './local-history-service.js';

describe('Local History Service', () => {
  beforeEach(() => {
    // Clear localStorage mock before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('addToLocalHistory', () => {
    it('should add video to local history', () => {
      addToLocalHistory('video123');

      const history = getLocalHistory();
      expect(history).toHaveLength(1);
      expect(history[0].videoId).toBe('video123');
      expect(history[0]).toHaveProperty('timestamp');
    });

    it('should move existing video to front when added again', () => {
      addToLocalHistory('video1');
      addToLocalHistory('video2');
      addToLocalHistory('video1'); // Add again

      const history = getLocalHistory();
      expect(history).toHaveLength(2);
      expect(history[0].videoId).toBe('video1'); // Moved to front
      expect(history[1].videoId).toBe('video2');
    });

    it('should limit history to MAX_HISTORY items', () => {
      // Add more than MAX_HISTORY (100) items
      for (let i = 1; i <= 105; i++) {
        addToLocalHistory(`video${i}`);
      }

      const history = getLocalHistory();
      expect(history).toHaveLength(100);
      expect(history[0].videoId).toBe('video105'); // Most recent first
      expect(history[99].videoId).toBe('video6'); // 100th item
    });

    it('should throw error for missing videoId', () => {
      expect(() => addToLocalHistory('')).toThrow('Video ID is required');
      expect(() => addToLocalHistory(null)).toThrow('Video ID is required');
      expect(() => addToLocalHistory(undefined)).toThrow('Video ID is required');
    });

    it('should handle localStorage errors', () => {
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => addToLocalHistory('video123')).toThrow(
        'Failed to add video to local history: Storage quota exceeded'
      );
    });
  });

  describe('getLocalHistory', () => {
    it('should return empty array when no history exists', () => {
      const history = getLocalHistory();
      expect(history).toEqual([]);
    });

    it('should return parsed history from localStorage', () => {
      const mockHistory = [
        { videoId: 'video1', timestamp: '2023-01-01T00:00:00.000Z' },
        { videoId: 'video2', timestamp: '2023-01-02T00:00:00.000Z' }
      ];
      localStorage.setItem('localWatchHistory', JSON.stringify(mockHistory));

      const history = getLocalHistory();
      expect(history).toEqual(mockHistory);
    });

    it('should return empty array when localStorage data is corrupted', () => {
      localStorage.setItem('localWatchHistory', 'invalid json');

      const history = getLocalHistory();
      expect(history).toEqual([]);
    });

    it('should handle localStorage errors', () => {
      localStorage.getItem = jest.fn(() => {
        throw new Error('Storage access denied');
      });

      const history = getLocalHistory();
      expect(history).toEqual([]);
    });
  });

  describe('clearLocalHistory', () => {
    it('should clear all history', () => {
      addToLocalHistory('video1');
      addToLocalHistory('video2');

      expect(getLocalHistory()).toHaveLength(2);

      clearLocalHistory();

      expect(getLocalHistory()).toEqual([]);
      expect(localStorage.getItem('localWatchHistory')).toBeNull();
    });

    it('should handle localStorage errors', () => {
      localStorage.removeItem = jest.fn(() => {
        throw new Error('Storage access denied');
      });

      expect(() => clearLocalHistory()).toThrow(
        'Failed to clear local history: Storage access denied'
      );
    });
  });

  describe('removeFromLocalHistory', () => {
    it('should remove specific video from history', () => {
      addToLocalHistory('video1');
      addToLocalHistory('video2');
      addToLocalHistory('video3');

      removeFromLocalHistory('video2');

      const history = getLocalHistory();
      expect(history).toHaveLength(2);
      expect(history.map(item => item.videoId)).toEqual(['video3', 'video1']);
    });

    it('should do nothing if video not in history', () => {
      addToLocalHistory('video1');
      addToLocalHistory('video2');

      removeFromLocalHistory('video3');

      const history = getLocalHistory();
      expect(history).toHaveLength(2);
    });

    it('should throw error for missing videoId', () => {
      expect(() => removeFromLocalHistory('')).toThrow('Video ID is required');
      expect(() => removeFromLocalHistory(null)).toThrow('Video ID is required');
    });

    it('should handle localStorage errors', () => {
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => removeFromLocalHistory('video123')).toThrow(
        'Failed to remove video from local history: Storage quota exceeded'
      );
    });
  });
});