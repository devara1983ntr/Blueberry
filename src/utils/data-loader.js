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
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }

        // Read text first to check for LFS pointer
        const text = await response.text();

        if (text.startsWith('version https://git-lfs')) {
            throw new Error(`File ${filePath} is a Git LFS pointer. Please pull the full file.`);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid JSON in ${filePath}: ${e.message}`);
        }

        if (!Array.isArray(data)) {
             throw new Error(`Invalid data format in ${filePath}. Expected an array.`);
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
        throw error; // Re-throw the error to be handled by the caller
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
