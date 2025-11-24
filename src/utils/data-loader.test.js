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
            const mockData = Array(100).fill(null).map((_, i) => ({
                embed: `<iframe src="embed${i}"></iframe>`,
                thumbnail: `thumb${i}`,
                title: `Title${i}`,
                tags: 'tag1;tag2',
                categories: 'cat1;cat2',
                actors: 'performer1',
                duration: '10:00',
                views: '1000',
                likes: '50',
                dislikes: '10'
            }));

            // Mock fetch for first file
            fetch.mockImplementation((url) => {
                if (url.includes('videos_page_1.json')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockData),
                        text: () => Promise.resolve(JSON.stringify(mockData))
                    });
                }
                return Promise.resolve({ ok: false });
            });

            const videos = await loadAllVideos(100);

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith('data/videos_page_1.json', { timeout: 5000 });
            expect(videos).toHaveLength(100);
            expect(videos[0].id).toBe('0');
            expect(videos[0].title).toBe('Title0');
        });

        it('should use mock data if response not ok', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            // Should NOT throw, but return mock data
            const videos = await loadAllVideos(100);

            expect(videos).toHaveLength(100);
            expect(videos[0].title).toContain('Mock Video');
        });

        it('should use mock data if data is not array', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ notArray: true }),
                text: () => Promise.resolve('{"notArray": true}')
            });

            const videos = await loadAllVideos(100);

            expect(videos).toHaveLength(100);
            expect(videos[0].title).toContain('Mock Video');
        });

        it('should use mock data if LFS pointer detected', async () => {
             fetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve('version https://git-lfs.github.com/spec/v1\noid sha256:...\nsize 1234')
            });

            const videos = await loadAllVideos(100);

            expect(videos).toHaveLength(100);
            expect(videos[0].title).toContain('Mock Video');
        });
    });

    describe('getVideoById', () => {
        it('should return video by id', async () => {
            const mockData = Array(100).fill(null).map((_, i) => ({
                embed: 'iframe', title: `Title${i}`, thumbnail: 'thumb',
                tags: '', categories: '', actors: '', duration: '', views: '', likes: '', dislikes: ''
            }));

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData),
                text: () => Promise.resolve(JSON.stringify(mockData))
            });

            const video = await getVideoById('0');

            expect(video.id).toBe('0');
            expect(video.title).toBe('Title0');
        });

        it('should return undefined if id not found (in file)', async () => {
             // If index is out of bounds of file logic?
             // getVideoById determines file index from ID.
             // ID 999 -> file 10.
             // Mock fetch for file 10 to return empty
             fetch.mockImplementation((url) => {
                 if (url.includes('videos_page_10.json')) {
                     return Promise.resolve({
                         ok: true,
                         json: () => Promise.resolve([]),
                         text: () => Promise.resolve('[]')
                     });
                 }
                 return Promise.resolve({ ok: false });
             });

            const video = await getVideoById('999');
            expect(video).toBeUndefined();
        });
    });

    describe('getVideosByIds', () => {
        it('should return videos by ids', async () => {
            const mockData = Array(100).fill(null).map((_, i) => ({
                embed: 'iframe', title: `Title${i}`, thumbnail: 'thumb',
                tags: '', categories: '', actors: '', duration: '', views: '', likes: '', dislikes: ''
            }));

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData),
                text: () => Promise.resolve(JSON.stringify(mockData))
            });

            const videos = await getVideosByIds(['0', '1']);

            expect(videos).toHaveLength(2);
            expect(videos[0].id).toBe('0');
            expect(videos[1].id).toBe('1');
        });
    });
});
