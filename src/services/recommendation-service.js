// src/services/recommendation-service.js
// Provides video recommendations based on user behavior

import { getFavorites, getWatchHistory } from './data-service.js';
import { loadAllVideos } from '../utils/data-loader.js';

/**
 * Gets video recommendations for a user based on favorites and watch history.
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Promise<Array>} Array of recommended video objects
 */
export async function getRecommendations(userId, limit = 10) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // Get user's favorites and watch history
    const [favorites, history] = await Promise.all([
      getFavorites(userId),
      getWatchHistory(userId, 50) // Get recent history
    ]);

    // Combine video IDs from favorites and history
    const userVideoIds = new Set([...favorites, ...history.map(item => item.videoId)]);

    if (userVideoIds.size === 0) {
      // No user data, return popular videos or random
      const allVideos = await loadAllVideos();
      return allVideos.slice(0, limit);
    }

    // Load all videos
    const allVideos = await loadAllVideos();

    // Get user's videos
    const userVideos = allVideos.filter(video => userVideoIds.has(video.id));

    // Collect tags and categories from user's videos
    const userTags = new Set();
    const userCategories = new Set();

    userVideos.forEach(video => {
      video.tags.forEach(tag => userTags.add(tag));
      video.categories.forEach(cat => userCategories.add(cat));
    });

    // Score other videos based on matching tags/categories
    const scoredVideos = allVideos
      .filter(video => !userVideoIds.has(video.id)) // Exclude already watched/favorited
      .map(video => {
        let score = 0;
        video.tags.forEach(tag => {
          if (userTags.has(tag)) score += 2; // Higher weight for tags
        });
        video.categories.forEach(cat => {
          if (userCategories.has(cat)) score += 1;
        });
        return { video, score };
      })
      .filter(item => item.score > 0) // Only videos with some relevance
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.video);

    return scoredVideos;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw new Error(`Failed to get recommendations: ${error.message}`);
  }
}