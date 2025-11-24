// src/utils/data-loader.js
// Utility to load and search video data from partitioned JSON files

// Configuration for partitioned data files
const DATA_DIR = 'data/';
const FILE_PREFIX = 'videos_page_';
const FILE_EXTENSION = '.json';
const TOTAL_FILES = 1260;
const VIDEOS_PER_FILE = 100;
export const TOTAL_VIDEOS_ESTIMATE = TOTAL_FILES * VIDEOS_PER_FILE;

// Guest access limit
export const GUEST_LIMIT = 3000;

// Cache for loaded files: fileIndex -> Array of videos
const fileCache = new Map();

/**
 * Generates mock data for a given file index when the real data is unavailable (e.g. LFS pointer).
 * @param {number} fileIndex
 * @param {number} count
 * @returns {Array} Array of mock video objects
 */
function generateMockData(fileIndex, count) {
    const mockVideos = [];
    const baseIndex = (fileIndex - 1) * count;

    // Deterministic pseudo-random helper
    const pseudoRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const categories = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Documentary', 'Thriller'];
    const performers = ['Alice Smith', 'Bob Jones', 'Charlie Brown', 'Dana White'];

    for (let i = 0; i < count; i++) {
        const globalIndex = baseIndex + i;
        const seed = globalIndex * 123.45;

        // Pick a color based on index
        const hue = Math.floor(pseudoRandom(seed) * 360);
        const color = `hsl(${hue}, 70%, 50%)`;

        // Generate duration
        const minutes = Math.floor(pseudoRandom(seed + 1) * 30) + 1;
        const seconds = Math.floor(pseudoRandom(seed + 2) * 60);
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        mockVideos.push({
            id: `${globalIndex}`,
            title: `Mock Video Title ${globalIndex}`,
            thumbnail: `data:image/svg+xml;charset=UTF-8,%3Csvg width='320' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='320' height='180' fill='${encodeURIComponent(color)}' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='white'%3EVideo ${globalIndex}%3C/text%3E%3C/svg%3E`,
            embed: `https://www.youtube.com/embed/dQw4w9WgXcQ`, // Safe placeholder
            tags: ['mock', 'test', 'video'],
            categories: [categories[Math.floor(pseudoRandom(seed + 3) * categories.length)]],
            performer: performers[Math.floor(pseudoRandom(seed + 4) * performers.length)],
            duration: duration,
            views: Math.floor(pseudoRandom(seed + 5) * 100000).toLocaleString(),
            likes: Math.floor(pseudoRandom(seed + 6) * 5000),
            dislikes: Math.floor(pseudoRandom(seed + 7) * 100)
        });
    }
    return mockVideos;
}

/**
 * Loads a specific video file by its 1-based index.
 * @param {number} fileIndex
 * @returns {Promise<Array>} Array of video objects
 */
async function loadVideoFile(fileIndex) {
    if (fileCache.has(fileIndex)) {
        return fileCache.get(fileIndex);
    }

    // For testing purposes, if fileIndex is -1, load test data
    const filePath = fileIndex === -1
        ? `${DATA_DIR}test_videos.json`
        : `${DATA_DIR}${FILE_PREFIX}${fileIndex}${FILE_EXTENSION}`;

    try {
        const response = await fetch(filePath, {
            timeout: 5000
        });

        if (!response.ok) {
            console.warn(`HTTP ${response.status} for ${filePath}. Using mock data.`);
            const mocks = generateMockData(fileIndex, VIDEOS_PER_FILE);
            fileCache.set(fileIndex, mocks);
            return mocks;
        }

        // Read text first to check for LFS pointer
        const text = await response.text();

        if (text.startsWith('version https://git-lfs')) {
            console.warn(`File ${filePath} is a Git LFS pointer. Using mock data.`);
            const mocks = generateMockData(fileIndex, VIDEOS_PER_FILE);
            fileCache.set(fileIndex, mocks);
            return mocks;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.warn(`Invalid JSON in ${filePath}. Using mock data.`, e);
            const mocks = generateMockData(fileIndex, VIDEOS_PER_FILE);
            fileCache.set(fileIndex, mocks);
            return mocks;
        }

        if (!Array.isArray(data)) {
             console.warn(`Invalid data format in ${filePath}. Using mock data.`);
             const mocks = generateMockData(fileIndex, VIDEOS_PER_FILE);
             fileCache.set(fileIndex, mocks);
             return mocks;
        }

        const baseIndex = (fileIndex - 1) * VIDEOS_PER_FILE;

        const processedVideos = data.map((video, localIndex) => {
            const globalIndex = baseIndex + localIndex;

            if (!video || !video.embed) {
                // If individual video is bad, maybe replace with mock or skip
                // For now, let's keep the original skip logic but be robust
                return null;
            }

            return {
                id: `${globalIndex}`,
                title: video.title || 'Untitled',
                thumbnail: video.thumbnail || '',
                embed: video.embed || '',
                tags: video.tags ? video.tags.split(';') : [],
                categories: video.categories ? video.categories.split(';') : [],
                performer: video.actors || '',
                duration: video.duration || '',
                views: video.views || '',
                likes: video.likes || '',
                dislikes: video.dislikes || ''
            };
        }).filter(v => v !== null);

        fileCache.set(fileIndex, processedVideos);
        return processedVideos;

    } catch (error) {
        console.error(`Error loading file ${fileIndex}:`, error);
        // Fallback to mock data on network error
        const mocks = generateMockData(fileIndex, VIDEOS_PER_FILE);
        fileCache.set(fileIndex, mocks);
        return mocks;
    }
}

/**
 * Gets a subset of videos based on offset and limit.
 * Loads necessary files on demand.
 * @param {number} offset - Starting index (0-based)
 * @param {number} limit - Number of videos to fetch
 * @returns {Promise<Array>}
 */
export async function getVideos(offset, limit) {
    const start = offset;
    const end = offset + limit;

    // Calculate which files contain the range [start, end)
    const firstFileIndex = Math.floor(start / VIDEOS_PER_FILE) + 1;
    const lastFileIndex = Math.floor((end - 1) / VIDEOS_PER_FILE) + 1;

    const promises = [];
    for (let i = firstFileIndex; i <= lastFileIndex; i++) {
        // Safety check
        if (i > TOTAL_FILES && i !== -1) continue;
        promises.push(loadVideoFile(i));
    }

    const filesData = await Promise.all(promises);

    // Combine all loaded videos
    let combined = [];
    for (let i = 0; i < filesData.length; i++) {
        combined = combined.concat(filesData[i]);
    }

    // Now slice the specific range requested
    const combinedStartIndex = (firstFileIndex - 1) * VIDEOS_PER_FILE;

    const relativeStart = start - combinedStartIndex;
    const relativeEnd = relativeStart + limit;

    return combined.slice(relativeStart, relativeEnd);
}

/**
 * Loads all videos (Deprecated/Modified).
 */
export async function loadAllVideos(maxVideos = null) {
    if (maxVideos === null) {
        // console.warn("loadAllVideos called without limit. Defaulting to 100.");
        maxVideos = 100;
    }
    return getVideos(0, maxVideos);
}

export async function getVideoById(id) {
    const globalIndex = parseInt(id, 10);
    if (isNaN(globalIndex)) return null;

    const fileIndex = Math.floor(globalIndex / VIDEOS_PER_FILE) + 1;
    if (fileIndex < 1 || fileIndex > TOTAL_FILES) return null;

    const videos = await loadVideoFile(fileIndex);
    return videos.find(v => v.id === id);
}

export async function getVideosByIds(ids) {
    const fileIndicesToLoad = new Set();
    const idsByFile = new Map();

    ids.forEach(id => {
        const globalIndex = parseInt(id, 10);
        if (!isNaN(globalIndex)) {
             const fileIndex = Math.floor(globalIndex / VIDEOS_PER_FILE) + 1;
             fileIndicesToLoad.add(fileIndex);

             if (!idsByFile.has(fileIndex)) {
                 idsByFile.set(fileIndex, []);
             }
             idsByFile.get(fileIndex).push(id);
        }
    });

    const promises = [];
    fileIndicesToLoad.forEach(idx => {
        if (idx >= 1 && idx <= TOTAL_FILES) {
            promises.push(loadVideoFile(idx));
        }
    });

    await Promise.all(promises);

    let result = [];
    for (const fileIndex of fileIndicesToLoad) {
        const videos = await loadVideoFile(fileIndex);
        const relevantIds = idsByFile.get(fileIndex);
        const found = videos.filter(v => relevantIds.includes(v.id));
        result = result.concat(found);
    }

    return result;
}

// For testing purposes
export function _resetCache() {
    fileCache.clear();
}
