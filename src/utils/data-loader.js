// src/utils/data-loader.js
// Utility to load and search video data from partitioned JSON files

// Configuration for partitioned data files
const DATA_DIR = 'data/';
const FILE_PREFIX = 'videos_page_';
const FILE_EXTENSION = '.json';
const TOTAL_FILES = 1260;
const VIDEOS_PER_FILE = 100;
export const TOTAL_VIDEOS_ESTIMATE = TOTAL_FILES * VIDEOS_PER_FILE;

// Cache for loaded files: fileIndex -> Array of videos
const fileCache = new Map();

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
            timeout: 10000
        });

        if (!response.ok) {
             // If file not found and it's a high index, maybe we reached the end.
             // But for now, throw.
            throw new Error(`HTTP ${response.status}: ${response.statusText} for ${filePath}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(`Invalid data format in ${filePath}: expected array`);
        }

        // Process videos
        // fileIndex is 1-based.
        // videos in file 1 are indices 0-99.
        // videos in file 2 are indices 100-199.
        // globalIndex = (fileIndex - 1) * VIDEOS_PER_FILE + localIndex
        const baseIndex = (fileIndex - 1) * VIDEOS_PER_FILE;

        const processedVideos = data.map((video, localIndex) => {
            const globalIndex = baseIndex + localIndex;

            if (!video || !video.embed) {
                // Warning only if it's not the test file
                if (fileIndex !== -1) {
                    console.warn(`Skipping invalid video at global index ${globalIndex} in ${filePath}`);
                }
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
        return [];
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
    // Note: filesData is array of arrays.
    // However, they might not be in order if Promise.all finishes out of order?
    // No, Promise.all preserves order of results.

    // We need to be careful. loadVideoFile(i) returns the WHOLE file content.
    // But we need to slice it correctly relative to the global offset.

    // Let's iterate through the requested file indices again to reconstruct the stream
    for (let i = 0; i < filesData.length; i++) {
        combined = combined.concat(filesData[i]);
    }

    // Now slice the specific range requested
    // The combined array starts at (firstFileIndex - 1) * VIDEOS_PER_FILE
    const combinedStartIndex = (firstFileIndex - 1) * VIDEOS_PER_FILE;

    const relativeStart = start - combinedStartIndex;
    const relativeEnd = relativeStart + limit;

    return combined.slice(relativeStart, relativeEnd);
}

/**
 * Loads all videos (Deprecated/Modified).
 * CAUTION: Trying to load ALL videos is now discouraged.
 * This function will now behave as "load first page" or "load first batch"
 * unless specific logic is added, but to avoid breaking existing callers immediately,
 * we might need to warn or return a limited set.
 *
 * However, existing callers expect an array they can slice synchronously?
 * No, it was async.
 *
 * If the caller calls `loadAllVideos(maxVideos)`, we can satisfy it with `getVideos(0, maxVideos)`.
 * If `maxVideos` is null, it tries to load EVERYTHING. We should prevent that or cap it.
 */
export async function loadAllVideos(maxVideos = null) {
    if (maxVideos === null) {
        console.warn("loadAllVideos called without limit. Defaulting to 100 to prevent performance issues.");
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
    // This is tricky if IDs are scattered.
    // For now, iterate and load individually (or group by file).
    // Grouping by file is better.

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

    // Now all needed files are in cache.
    // We can just construct the result.
    // But we need to return the video objects.

    let result = [];
    for (const fileIndex of fileIndicesToLoad) {
        const videos = await loadVideoFile(fileIndex); // Should be instant from cache
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
