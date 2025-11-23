 // src/utils/data-loader.js
// Utility to load and search video data

let allVideos = null;

export async function loadAllVideos(maxVideos = null) {
    if (allVideos) {
        return maxVideos ? allVideos.slice(0, maxVideos) : allVideos;
    }

    try {
        const response = await fetch('data/full_data.json', {
            timeout: 10000 // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Invalid data format: expected array');
        }

        allVideos = data.map((video, index) => {
            if (!video || !video.embed) {
                console.warn(`Skipping invalid video at index ${index}`);
                return null;
            }
            return {
                id: `${index}`,
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

        if (allVideos.length === 0) {
            throw new Error('No video data could be loaded. Please try refreshing the page.');
        }

        console.log(`Loaded ${allVideos.length} videos from data/full_data.json`);
        return maxVideos ? allVideos.slice(0, maxVideos) : allVideos;
    } catch (error) {
        console.error('Error loading data/full_data.json:', error);
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