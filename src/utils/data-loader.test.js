import { loadAllVideos, getVideoById, getVideosByIds, _resetCache } from './data-loader.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('data-loader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        _resetCache();
    });

    describe('loadAllVideos', () => {
        it('should load and parse video data correctly', async () => {
            const mockData = [
                {
                    embed: '<iframe src="embed1"></iframe>',
                    thumbnail: 'thumb1',
                    title: 'Title1',
                    tags: 'tag1;tag2',
                    categories: 'cat1;cat2',
                    actors: 'performer1',
                    duration: '10:00',
                    views: '1000',
                    likes: '50',
                    dislikes: '10'
                },
                {
                    embed: '<iframe src="embed2"></iframe>',
                    thumbnail: 'thumb2',
                    title: 'Title2',
                    tags: 'tag3',
                    categories: 'cat3',
                    actors: 'performer2',
                    duration: '5:00',
                    views: '500',
                    likes: '25',
                    dislikes: '5'
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const videos = await loadAllVideos();

            expect(fetch).toHaveBeenCalledWith('data/full_data.json', { timeout: 10000 });
            expect(videos).toHaveLength(2);
            expect(videos[0]).toEqual({
                id: '0',
                title: 'Title1',
                thumbnail: 'thumb1',
                embed: '<iframe src="embed1"></iframe>',
                tags: ['tag1', 'tag2'],
                categories: ['cat1', 'cat2'],
                performer: 'performer1',
                duration: '10:00',
                views: '1000',
                likes: '50',
                dislikes: '10'
            });
            expect(videos[1]).toEqual({
                id: '1',
                title: 'Title2',
                thumbnail: 'thumb2',
                embed: '<iframe src="embed2"></iframe>',
                tags: ['tag3'],
                categories: ['cat3'],
                performer: 'performer2',
                duration: '5:00',
                views: '500',
                likes: '25',
                dislikes: '5'
            });
        });

        it('should throw error if response not ok', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            await expect(loadAllVideos()).rejects.toThrow('Unable to load video data. Please check your internet connection and try again.');
        });

        it('should throw error if data is not array', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ notArray: true })
            });

            await expect(loadAllVideos()).rejects.toThrow('Unable to load video data. Please check your internet connection and try again.');
        });

        it('should filter out invalid videos', async () => {
            const mockData = [
                {
                    embed: '<iframe src="embed1"></iframe>',
                    thumbnail: 'thumb1',
                    title: 'Title1',
                    tags: 'tag1',
                    categories: 'cat1',
                    actors: 'performer1',
                    duration: '10:00',
                    views: '1000',
                    likes: '50',
                    dislikes: '10'
                },
                {
                    embed: '' // invalid
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const videos = await loadAllVideos();

            expect(videos).toHaveLength(1);
            expect(videos[0].id).toBe('0');
        });

        it('should throw error if no videos loaded', async () => {
            const mockData = [
                { embed: '' }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            await expect(loadAllVideos()).rejects.toThrow('Unable to load video data. Please check your internet connection and try again.');
        });
    });

    describe('getVideoById', () => {
        it('should return video by id', async () => {
            const mockData = [
                {
                    embed: '<iframe src="embed1"></iframe>',
                    thumbnail: 'thumb1',
                    title: 'Title1',
                    tags: 'tag1',
                    categories: 'cat1',
                    actors: 'performer1',
                    duration: '10:00',
                    views: '1000',
                    likes: '50',
                    dislikes: '10'
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const video = await getVideoById('0');

            expect(video.id).toBe('0');
            expect(video.title).toBe('Title1');
        });

        it('should return undefined if id not found', async () => {
            const mockData = [
                {
                    embed: '<iframe src="embed1"></iframe>',
                    thumbnail: 'thumb1',
                    title: 'Title1',
                    tags: 'tag1',
                    categories: 'cat1',
                    actors: 'performer1',
                    duration: '10:00',
                    views: '1000',
                    likes: '50',
                    dislikes: '10'
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const video = await getVideoById('999');

            expect(video).toBeUndefined();
        });
    });

    describe('getVideosByIds', () => {
        it('should return videos by ids', async () => {
            const mockData = [
                {
                    embed: '<iframe src="embed1"></iframe>',
                    thumbnail: 'thumb1',
                    title: 'Title1',
                    tags: 'tag1',
                    categories: 'cat1',
                    actors: 'performer1',
                    duration: '10:00',
                    views: '1000',
                    likes: '50',
                    dislikes: '10'
                },
                {
                    embed: '<iframe src="embed2"></iframe>',
                    thumbnail: 'thumb2',
                    title: 'Title2',
                    tags: 'tag2',
                    categories: 'cat2',
                    actors: 'performer2',
                    duration: '5:00',
                    views: '500',
                    likes: '25',
                    dislikes: '5'
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const videos = await getVideosByIds(['0', '1']);

            expect(videos).toHaveLength(2);
            expect(videos[0].id).toBe('0');
            expect(videos[1].id).toBe('1');
        });

        it('should return empty array if no ids match', async () => {
            const mockData = [
                {
                    embed: '<iframe src="embed1"></iframe>',
                    thumbnail: 'thumb1',
                    title: 'Title1',
                    tags: 'tag1',
                    categories: 'cat1',
                    actors: 'performer1',
                    duration: '10:00',
                    views: '1000',
                    likes: '50',
                    dislikes: '10'
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const videos = await getVideosByIds(['999']);

            expect(videos).toHaveLength(0);
        });
    });
});