import {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  addToWatchHistory,
  getWatchHistory,
  getSettings,
  updateSettings
} from './data-service.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

// Mock Firestore functions
jest.mock('firebase/firestore');
jest.mock('../config/firebase.js', () => ({
  db: {},
}));

describe('Data Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToFavorites', () => {
    it('should add video to favorites successfully', async () => {
      const mockDocRef = {};
      doc.mockReturnValue(mockDocRef);
      updateDoc.mockResolvedValue();

      await expect(addToFavorites('user123', 'video456')).resolves.toBeUndefined();

      expect(doc).toHaveBeenCalledWith(require('../config/firebase.js').db, 'users', 'user123');
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
        favorites: arrayUnion('video456')
      });
    });

    it('should throw error for missing userId', async () => {
      await expect(addToFavorites('', 'video456')).rejects.toThrow('User ID and Video ID are required');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should throw error for missing videoId', async () => {
      await expect(addToFavorites('user123', '')).rejects.toThrow('User ID and Video ID are required');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should handle permission denied error', async () => {
      const error = { code: 'permission-denied' };
      updateDoc.mockRejectedValue(error);

      await expect(addToFavorites('user123', 'video456')).rejects.toThrow(
        'You do not have permission to modify favorites. Please log in again.'
      );
    });

    it('should handle not found error', async () => {
      const error = { code: 'not-found' };
      updateDoc.mockRejectedValue(error);

      await expect(addToFavorites('user123', 'video456')).rejects.toThrow(
        'User profile not found. Please try logging in again.'
      );
    });

    it('should handle unavailable error', async () => {
      const error = { code: 'unavailable' };
      updateDoc.mockRejectedValue(error);

      await expect(addToFavorites('user123', 'video456')).rejects.toThrow(
        'Service temporarily unavailable. Please check your connection and try again.'
      );
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove video from favorites successfully', async () => {
      const mockDocRef = {};
      doc.mockReturnValue(mockDocRef);
      updateDoc.mockResolvedValue();

      await expect(removeFromFavorites('user123', 'video456')).resolves.toBeUndefined();

      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
        favorites: arrayRemove('video456')
      });
    });

    it('should handle errors the same as addToFavorites', async () => {
      const error = { code: 'permission-denied' };
      updateDoc.mockRejectedValue(error);

      await expect(removeFromFavorites('user123', 'video456')).rejects.toThrow(
        'You do not have permission to modify favorites. Please log in again.'
      );
    });
  });

  describe('getFavorites', () => {
    it('should get favorites successfully', async () => {
      const mockDocRef = {};
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ favorites: ['video1', 'video2'] })
      };
      doc.mockReturnValue(mockDocRef);
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getFavorites('user123');

      expect(result).toEqual(['video1', 'video2']);
    });

    it('should return empty array when user has no favorites', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({})
      };
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getFavorites('user123');

      expect(result).toEqual([]);
    });

    it('should return empty array when user document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getFavorites('user123');

      expect(result).toEqual([]);
    });

    it('should throw error for missing userId', async () => {
      await expect(getFavorites('')).rejects.toThrow('User ID is required');
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should handle permission denied error', async () => {
      const error = { code: 'permission-denied' };
      getDoc.mockRejectedValue(error);

      await expect(getFavorites('user123')).rejects.toThrow(
        'You do not have permission to access favorites. Please log in again.'
      );
    });
  });

  describe('addToWatchHistory', () => {
    it('should add video to watch history successfully', async () => {
      const mockCollectionRef = {};
      const mockDocRef = {};
      collection.mockReturnValue(mockCollectionRef);
      doc.mockReturnValue(mockDocRef);
      setDoc.mockResolvedValue();

      await expect(addToWatchHistory('user123', 'video456')).resolves.toBeUndefined();

      expect(collection).toHaveBeenCalledWith(require('../config/firebase.js').db, 'users', 'user123', 'watchHistory');
      expect(doc).toHaveBeenCalledWith(mockCollectionRef, 'video456');
      expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        videoId: 'video456',
        timestamp: expect.any(String)
      }));
    });

    it('should use provided timestamp', async () => {
      const customTimestamp = new Date('2023-01-01');
      setDoc.mockResolvedValue();

      await addToWatchHistory('user123', 'video456', customTimestamp);

      expect(setDoc).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
        timestamp: customTimestamp.toISOString()
      }));
    });
  });

  describe('getWatchHistory', () => {
    it('should get watch history successfully', async () => {
      const mockCollectionRef = {};
      const mockQuery = {};
      const mockQuerySnapshot = {
        forEach: jest.fn(callback => {
          callback({ data: () => ({ videoId: 'video1', timestamp: '2023-01-01' }) });
          callback({ data: () => ({ videoId: 'video2', timestamp: '2023-01-02' }) });
        })
      };
      collection.mockReturnValue(mockCollectionRef);
      query.mockReturnValue(mockQuery);
      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await getWatchHistory('user123', 10);

      expect(result).toEqual([
        { videoId: 'video1', timestamp: '2023-01-01' },
        { videoId: 'video2', timestamp: '2023-01-02' }
      ]);
      expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(limit).toHaveBeenCalledWith(10);
    });

    it('should use default limit of 50', async () => {
      const mockQuerySnapshot = { forEach: jest.fn() };
      getDocs.mockResolvedValue(mockQuerySnapshot);

      await getWatchHistory('user123');

      expect(limit).toHaveBeenCalledWith(50);
    });
  });

  describe('getSettings', () => {
    it('should get settings successfully', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ settings: { theme: 'dark' } })
      };
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getSettings('user123');

      expect(result).toEqual({ theme: 'dark' });
    });

    it('should return empty object when no settings exist', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({})
      };
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getSettings('user123');

      expect(result).toEqual({});
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const newSettings = { theme: 'light', autoplay: true };
      updateDoc.mockResolvedValue();

      await expect(updateSettings('user123', newSettings)).resolves.toBeUndefined();

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        settings: newSettings
      });
    });

    it('should throw error for missing userId', async () => {
      await expect(updateSettings('', { theme: 'dark' })).rejects.toThrow('User ID is required');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should throw error for invalid settings', async () => {
      await expect(updateSettings('user123', null)).rejects.toThrow('Settings must be a valid object');
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
});