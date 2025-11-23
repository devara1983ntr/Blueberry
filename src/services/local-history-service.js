// src/services/local-history-service.js
// Manages local watch history using localStorage

const STORAGE_KEY = 'localWatchHistory';
const MAX_HISTORY = 100;

/**
 * Adds a video to local watch history.
 * @param {string} videoId - Video ID
 * @returns {void}
 */
export function addToLocalHistory(videoId) {
  if (!videoId) {
    throw new Error('Video ID is required');
  }

  try {
    const history = getLocalHistory();
    const existingIndex = history.findIndex(item => item.videoId === videoId);

    if (existingIndex !== -1) {
      // Move to front if already exists
      const [item] = history.splice(existingIndex, 1);
      item.timestamp = new Date().toISOString();
      history.unshift(item);
    } else {
      // Add new item
      history.unshift({
        videoId,
        timestamp: new Date().toISOString()
      });
    }

    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.splice(MAX_HISTORY);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error adding to local history:', error);
    throw new Error(`Failed to add video to local history: ${error.message}`);
  }
}

/**
 * Gets local watch history.
 * @returns {Array} Array of history items with videoId and timestamp
 */
export function getLocalHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting local history:', error);
    return [];
  }
}

/**
 * Clears local watch history.
 * @returns {void}
 */
export function clearLocalHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing local history:', error);
    throw new Error(`Failed to clear local history: ${error.message}`);
  }
}

/**
 * Removes a specific video from local history.
 * @param {string} videoId - Video ID to remove
 * @returns {void}
 */
export function removeFromLocalHistory(videoId) {
  if (!videoId) {
    throw new Error('Video ID is required');
  }

  try {
    const history = getLocalHistory();
    const filtered = history.filter(item => item.videoId !== videoId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from local history:', error);
    throw new Error(`Failed to remove video from local history: ${error.message}`);
  }
}