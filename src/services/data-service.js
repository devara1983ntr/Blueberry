// src/services/data-service.js
// Hexagonal Architecture: This is the Data Port (interface)
// The adapter is Firestore implementation

import { db } from '../config/firebase.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

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
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayUnion(videoId)
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to modify favorites. Please log in again.');
    } else if (error.code === 'not-found') {
      throw new Error('User profile not found. Please try logging in again.');
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
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayRemove(videoId)
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
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
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
    const historyRef = doc(collection(db, 'users', userId, 'watchHistory'), videoId);
    await setDoc(historyRef, {
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
    const historyRef = collection(db, 'users', userId, 'watchHistory');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);

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
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
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
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      settings: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);

    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update settings. Please log in again.');
    } else if (error.code === 'not-found') {
      throw new Error('User profile not found. Please try logging in again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please check your connection and try again.');
    } else {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }
}