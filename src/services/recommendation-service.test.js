import { getRecommendations } from './recommendation-service.js';

// Mock dependencies
jest.mock('./data-service.js', () => ({
  getFavorites: jest.fn(),
  getWatchHistory: jest.fn(),
}));

jest.mock('../utils/data-loader.js', () => ({
  loadAllVideos: jest.fn(),
}));

const { getFavorites, getWatchHistory } = require('./data-service.js');
const { loadAllVideos } = require('../utils/data-loader.js');

describe('Recommendation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecommendations', () => {
    const mockVideos = [
      {
        id: 'video1',
        title: 'Video 1',
        tags: ['tag1', 'tag2'],
        categories: ['cat1']
      },
      {
        id: 'video2',
        title: 'Video 2',
        tags: ['tag2', 'tag3'],
        categories: ['cat1', 'cat2']
      },
      {
        id: 'video3',
        title: 'Video 3',
        tags: ['tag3', 'tag4'],
        categories: ['cat2']
      },
      {
        id: 'video4',
        title: 'Video 4',
        tags: ['tag1'],
        categories: ['cat3']
      }
    ];

    it('should return recommendations based on user favorites and history', async () => {
      getFavorites.mockResolvedValue(['video1']);
      getWatchHistory.mockResolvedValue([{ videoId: 'video2' }]);
      loadAllVideos.mockResolvedValue(mockVideos);

      const result = await getRecommendations('user123', 5);

      expect(getFavorites).toHaveBeenCalledWith('user123');
      expect(getWatchHistory).toHaveBeenCalledWith('user123', 50);
      expect(loadAllVideos).toHaveBeenCalled();

      // Should recommend videos with matching tags/categories, excluding already watched/favorited
      expect(result).toHaveLength(2); // video3 and video4
      expect(result.map(v => v.id)).toEqual(expect.arrayContaining(['video3', 'video4']));
    });

    it('should return popular videos when user has no favorites or history', async () => {
      getFavorites.mockResolvedValue([]);
      getWatchHistory.mockResolvedValue([]);
      loadAllVideos.mockResolvedValue(mockVideos);

      const result = await getRecommendations('user123', 2);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockVideos.slice(0, 2));
    });

    it('should limit recommendations to specified count', async () => {
      getFavorites.mockResolvedValue(['video1']);
      getWatchHistory.mockResolvedValue([{ videoId: 'video2' }]);
      loadAllVideos.mockResolvedValue(mockVideos);

      const result = await getRecommendations('user123', 1);

      expect(result).toHaveLength(1);
    });

    it('should use default limit of 10', async () => {
      getFavorites.mockResolvedValue([]);
      getWatchHistory.mockResolvedValue([]);
      loadAllVideos.mockResolvedValue(mockVideos);

      const result = await getRecommendations('user123');

      expect(result).toHaveLength(4); // All videos since no user data
    });

    it('should exclude already watched and favorited videos', async () => {
      getFavorites.mockResolvedValue(['video1']);
      getWatchHistory.mockResolvedValue([{ videoId: 'video2' }]);
      loadAllVideos.mockResolvedValue(mockVideos);

      const result = await getRecommendations('user123');

      const recommendedIds = result.map(v => v.id);
      expect(recommendedIds).not.toContain('video1');
      expect(recommendedIds).not.toContain('video2');
    });

    it('should score videos by tag and category matches', async () => {
      // video1 has tag1, tag2, cat1
      // video2 has tag2, tag3, cat1, cat2
      // User has video1 favorited, so should recommend videos with tag1, tag2, cat1
      // video4 has tag1 (2 points), video3 has tag3 (1 point from video2), video2 excluded
      getFavorites.mockResolvedValue(['video1']);
      getWatchHistory.mockResolvedValue([]);
      loadAllVideos.mockResolvedValue(mockVideos);

      const result = await getRecommendations('user123');

      // video4 should come first (higher score due to tag1 match)
      expect(result[0].id).toBe('video4');
      expect(result[1].id).toBe('video3');
    });

    it('should handle errors from dependencies', async () => {
      getFavorites.mockRejectedValue(new Error('Database error'));

      await expect(getRecommendations('user123')).rejects.toThrow(
        'Failed to get recommendations: Database error'
      );
    });

    it('should throw error for missing userId', async () => {
      await expect(getRecommendations('')).rejects.toThrow('User ID is required');
      expect(getFavorites).not.toHaveBeenCalled();
    });

    it('should handle empty video list', async () => {
      getFavorites.mockResolvedValue([]);
      getWatchHistory.mockResolvedValue([]);
      loadAllVideos.mockResolvedValue([]);

      const result = await getRecommendations('user123');

      expect(result).toEqual([]);
    });

    it('should handle videos with no tags or categories', async () => {
      const videosWithMissingData = [
        { id: 'video1', tags: [], categories: [] },
        { id: 'video2', tags: ['tag1'], categories: [] }
      ];

      getFavorites.mockResolvedValue(['video1']);
      getWatchHistory.mockResolvedValue([]);
      loadAllVideos.mockResolvedValue(videosWithMissingData);

      const result = await getRecommendations('user123');

      expect(result).toHaveLength(0); // video2 has no relevance score
    });
  });
});