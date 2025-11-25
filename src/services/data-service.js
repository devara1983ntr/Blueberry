// src/services/data-service.js
// Hexagonal Architecture: This is the Data Port (interface)
// The adapter is Firestore implementation (Compat SDK)

import { db } from '../config/firebase.js';
import { firebase } from '../config/firebase.js'; // Assuming firebase global is available via config or window

/**
 * Adds a video to user's favorites.
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
export async function addToFavorites(userId, videoId) {
  if (!userId || !videoId) {
    throw new Error('User ID and Video ID are required');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      favorites: window.firebase.firestore.FieldValue.arrayUnion(videoId)
    });
  } catch (error) {
    // If user doc doesn't exist, create it
    if (error.code === 'not-found' || error.message.includes('No document to update')) {
        try {
            await db.collection('users').doc(userId).set({
                favorites: [videoId]
            }, { merge: true });
            return;
        } catch (innerError) {
             console.error('Error creating user profile for favorites:', innerError);
             throw new Error(`Failed to add video to favorites: ${innerError.message}`);
        }
    }

    console.error('Error adding to favorites:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to modify favorites. Please log in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to add video to favorites: ${error.message}`);
    }
  }
}

/**
 * Removes a video from user's favorites.
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
export async function removeFromFavorites(userId, videoId) {
  if (!userId || !videoId) {
    throw new Error('User ID and Video ID are required');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      favorites: window.firebase.firestore.FieldValue.arrayRemove(videoId)
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to modify favorites. Please log in again.');
    } else if (error.code === 'not-found') {
      throw new Error('User profile not found. Please try logging in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to remove video from favorites: ${error.message}`);
    }
  }
}

/**
 * Gets user's favorites.
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of video IDs
 */
export async function getFavorites(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      return userSnap.data().favorites || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting favorites:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access favorites. Please log in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to get favorites: ${error.message}`);
    }
  }
}

/**
 * Adds a video to user's watch history.
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {Date} timestamp - Watch timestamp
 * @returns {Promise<void>}
 */
export async function addToWatchHistory(userId, videoId, timestamp = new Date()) {
  if (!userId || !videoId) {
    throw new Error('User ID and Video ID are required');
  }

  try {
    const historyRef = db.collection('users').doc(userId).collection('watchHistory').doc(videoId);
    await historyRef.set({
      videoId,
      timestamp: timestamp.toISOString(),
      watchedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding to watch history:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to modify watch history. Please log in again.');
    } else if (error.code === 'not-found') {
      throw new Error('User profile not found. Please try logging in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to add video to watch history: ${error.message}`);
    }
  }
}

/**
 * Gets user's watch history.
 * @param {string} userId - User ID
 * @param {number} limitCount - Maximum number of items to return
 * @returns {Promise<Array>} Array of watch history items
 */
export async function getWatchHistory(userId, limitCount = 50) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const historyRef = db.collection('users').doc(userId).collection('watchHistory');
    const q = historyRef.orderBy('timestamp', 'desc').limit(limitCount);
    const querySnapshot = await q.get();

    const history = [];
    querySnapshot.forEach((doc) => {
      history.push(doc.data());
    });

    return history;
  } catch (error) {
    console.error('Error getting watch history:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access watch history. Please log in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to get watch history: ${error.message}`);
    }
  }
}

/**
 * Gets user's settings.
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User settings object
 */
export async function getSettings(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      return userSnap.data().settings || {};
    }
    return {};
  } catch (error) {
    console.error('Error getting settings:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access settings. Please log in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to get settings: ${error.message}`);
    }
  }
}

/**
 * Updates user's settings.
 * @param {string} userId - User ID
 * @param {Object} settings - Settings object to update
 * @returns {Promise<void>}
 */
export async function updateSettings(userId, settings) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!settings || typeof settings !== 'object') {
    throw new Error('Settings must be a valid object');
  }

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      settings: settings
    });
  } catch (error) {
    // Check if doc exists
    if (error.code === 'not-found' || error.message.includes('No document to update')) {
        await db.collection('users').doc(userId).set({ settings }, { merge: true });
        return;
    }

    console.error('Error updating settings:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update settings. Please log in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }
}
