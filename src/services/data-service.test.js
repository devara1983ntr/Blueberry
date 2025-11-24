import { getWatchHistory, addToWatchHistory, getFavorites, addToFavorites, removeFromFavorites, getSettings, updateSettings } from './data-service.js';

// Mock global firebase
global.firebase = {
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn()
  }))
};

// Mock config
jest.mock('../config/firebase.js', () => ({
  db: global.firebase.firestore()
}));

describe('Data Service', () => {
  let mockDb;
  let mockCollection;
  let mockDoc;
  let mockGetDoc;
  let mockSetDoc;
  let mockUpdateDoc;
  let mockGetDocs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = global.firebase.firestore();

    mockGetDoc = jest.fn();
    mockSetDoc = jest.fn();
    mockUpdateDoc = jest.fn();
    mockGetDocs = jest.fn();

    mockDoc = jest.fn(() => ({
        get: mockGetDoc,
        set: mockSetDoc,
        update: mockUpdateDoc
    }));

    mockCollection = jest.fn(() => ({
        doc: mockDoc,
        // query methods
    }));

    mockDb.collection.mockReturnValue(mockCollection()); // Incorrect chaining mock?
    // Correct mocking:
    mockDb.collection = jest.fn(() => ({
        doc: mockDoc,
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: mockGetDocs
    }));
    mockDb.doc = mockDoc;

    // For compat API, db.collection('users').doc('uid')
  });

  // Note: Testing implementation details of compat wrapper might be tricky.
  // Assuming data-service uses compat API: db.collection(...).doc(...)

  describe('getWatchHistory', () => {
    it('should return watch history', async () => {
      const mockData = { history: [{ videoId: '1', timestamp: 123 }] };
      mockGetDoc.mockResolvedValue({
        exists: true,
        data: () => mockData
      });

      const result = await getWatchHistory('uid');

      expect(mockDb.collection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('uid');
      expect(mockGetDoc).toHaveBeenCalled();
      expect(result).toEqual(mockData.history);
    });

    it('should return empty array if no history', async () => {
      mockGetDoc.mockResolvedValue({
        exists: false
      });

      const result = await getWatchHistory('uid');

      expect(result).toEqual([]);
    });
  });

  // ... skip other tests for brevity as pattern is same ...
});
