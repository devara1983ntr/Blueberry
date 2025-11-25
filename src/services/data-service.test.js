// Move mocks above imports using doMock to ensure hoisting

// Define mocks
const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(),
    FieldValue: {
        arrayUnion: jest.fn(val => ['union', val]),
        arrayRemove: jest.fn(val => ['remove', val])
    }
};

// Mock global firebase and window.firebase
global.firebase = {
  firestore: jest.fn(() => mockFirestore)
};
global.firebase.firestore.FieldValue = mockFirestore.FieldValue;
global.window = { firebase: global.firebase };

// Mock config
jest.mock('../config/firebase.js', () => ({
  db: mockFirestore
}));

const { getWatchHistory, addToWatchHistory, getFavorites, addToFavorites, removeFromFavorites, getSettings, updateSettings } = require('./data-service.js');

describe('Data Service', () => {
  let mockCollection;
  let mockDoc;
  let mockGetDoc;
  let mockSetDoc;
  let mockUpdateDoc;
  let mockGetDocs;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetDoc = jest.fn();
    mockSetDoc = jest.fn();
    mockUpdateDoc = jest.fn();
    mockGetDocs = jest.fn();

    // Setup doc mock
    mockDoc = jest.fn(() => ({
        get: mockGetDoc,
        set: mockSetDoc,
        update: mockUpdateDoc,
        collection: mockCollection // For nested collections
    }));

    // Setup collection mock
    mockCollection = jest.fn(() => ({
        doc: mockDoc,
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: mockGetDocs
    }));

    mockFirestore.collection = mockCollection;
    mockFirestore.doc = mockDoc;
  });

  describe('getWatchHistory', () => {
    it('should return watch history', async () => {
      const mockData = { videoId: '1', timestamp: '123' };
      mockGetDocs.mockResolvedValue({
        forEach: (cb) => cb({ data: () => mockData })
      });

      const result = await getWatchHistory('uid');

      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('uid');
      expect(mockCollection).toHaveBeenCalledWith('watchHistory');
      expect(mockGetDocs).toHaveBeenCalled();
      expect(result).toEqual([mockData]);
    });

    it('should return empty array if no history', async () => {
        mockGetDocs.mockResolvedValue({
            forEach: (cb) => {}
        });

      const result = await getWatchHistory('uid');

      expect(result).toEqual([]);
    });
  });

  describe('addToFavorites', () => {
      it('should add video to favorites', async () => {
          mockUpdateDoc.mockResolvedValue({});

          await addToFavorites('uid', 'vid1');

          expect(mockFirestore.collection).toHaveBeenCalledWith('users');
          expect(mockDoc).toHaveBeenCalledWith('uid');
          expect(mockUpdateDoc).toHaveBeenCalledWith({
              favorites: ['union', 'vid1']
          });
      });
  });

  describe('removeFromFavorites', () => {
      it('should remove video from favorites', async () => {
          mockUpdateDoc.mockResolvedValue({});

          await removeFromFavorites('uid', 'vid1');

          expect(mockUpdateDoc).toHaveBeenCalledWith({
              favorites: ['remove', 'vid1']
          });
      });
  });

  describe('getFavorites', () => {
      it('should return favorites array', async () => {
          mockGetDoc.mockResolvedValue({
              exists: true,
              data: () => ({ favorites: ['vid1'] })
          });

          const result = await getFavorites('uid');
          expect(result).toEqual(['vid1']);
      });

      it('should return empty array if doc does not exist', async () => {
          mockGetDoc.mockResolvedValue({
              exists: false
          });

          const result = await getFavorites('uid');
          expect(result).toEqual([]);
      });
  });

  describe('getSettings', () => {
      it('should return settings', async () => {
          const settings = { theme: 'dark' };
          mockGetDoc.mockResolvedValue({
              exists: true,
              data: () => ({ settings })
          });

          const result = await getSettings('uid');
          expect(result).toEqual(settings);
      });
  });

  describe('updateSettings', () => {
      it('should update settings', async () => {
          const settings = { theme: 'light' };
          mockUpdateDoc.mockResolvedValue({});

          await updateSettings('uid', settings);

          expect(mockUpdateDoc).toHaveBeenCalledWith({ settings });
      });
  });
});
