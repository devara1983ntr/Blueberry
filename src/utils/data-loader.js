// src/utils/data-loader.js
// Utility to load and search video data from partitioned JSON files

let allVideos = null;

// Configuration for partitioned data files
const DATA_DIR = 'data/';
const FILE_PREFIX = 'videos_page_';
const FILE_EXTENSION = '.json';
const TOTAL_FILES = 1260; // Based on the partitioning script output

export async function loadAllVideos(maxVideos = null) {
    if (allVideos) {
        return maxVideos ? allVideos.slice(0, maxVideos) : allVideos;
    }

    try {
        console.log('Loading video data from partitioned files...');

        // Generate file paths for all partitioned files
        const filePaths = [];
        for (let i = 1; i <= TOTAL_FILES; i++) {
            filePaths.push(`${DATA_DIR}${FILE_PREFIX}${i}${FILE_EXTENSION}`);
        }

        // Load all files concurrently
        const loadPromises = filePaths.map(async (filePath, fileIndex) => {
            try {
                const response = await fetch(filePath, {
                    timeout: 10000 // 10 second timeout per file
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText} for ${filePath}`);
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error(`Invalid data format in ${filePath}: expected array`);
                }

                // Process each video in the file with global index
                const baseIndex = (fileIndex) * 100; // Each file has up to 100 videos
                return data.map((video, localIndex) => {
                    const globalIndex = baseIndex + localIndex;

                    if (!video || !video.embed) {
                        console.warn(`Skipping invalid video at global index ${globalIndex} in ${filePath}`);
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
                }).filter(video => video !== null);

            } catch (fileError) {
                console.error(`Error loading ${filePath}:`, fileError);
                // Return empty array for failed files to continue loading others
                return [];
            }
        });

        // Wait for all files to load
        const fileResults = await Promise.all(loadPromises);

        // Flatten all video arrays
        const allRawVideos = fileResults.flat();

        // Filter out any null entries (shouldn't be any, but safety check)
        allVideos = allRawVideos.filter(video => video !== null);

        if (allVideos.length === 0) {
            throw new Error('No video data could be loaded. Please try refreshing the page.');
        }

        console.log(`Loaded ${allVideos.length} videos from ${TOTAL_FILES} partitioned files`);
        return maxVideos ? allVideos.slice(0, maxVideos) : allVideos;

    } catch (error) {
        console.error('Error loading video data:', error);
        throw new Error('Unable to load video data. Please check your internet connection and try again.');
    }
}

export async function getVideoById(id) {
    const videos = await loadAllVideos();
    return videos.find(video => video.id === id);
}

export async function getVideosByIds(ids) {
    const videos = await loadAllVideos();
    return videos.filter(video => ids.includes(video.id));
}

// For testing purposes
export function _resetCache() {
    allVideos = null;
}