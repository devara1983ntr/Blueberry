// src/services/recommendation-service.js
// Provides video recommendations based on user behavior

import { getFavorites, getWatchHistory } from './data-service.js';
import { loadAllVideos, getVideoById } from '../utils/data-loader.js';

/**
 * Gets related videos based on a specific video ID (content-based filtering).
 * @param {string} videoId - The ID of the current video
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Promise<Array>} Array of recommended video objects
 */
export async function getRelatedVideos(videoId, limit = 10) {
  try {
    const currentVideo = await getVideoById(videoId);
    if (!currentVideo) {
      // Fallback to random videos if current not found
      const all = await loadAllVideos();
      return all.slice(0, limit);
    }

    const currentTags = new Set(currentVideo.tags || []);
    const currentCategories = new Set(currentVideo.categories || []);

    // We can't load *all* videos efficiently if there are 120k.
    // For now, we'll load a subset or use loadAllVideos (which currently defaults to 100).
    // In a real app, this would be a backend query.
    const candidates = await loadAllVideos(200); // Load up to 200 candidates

    const scored = candidates
      .filter(v => v.id !== videoId)
      .map(video => {
        let score = 0;
        if (video.tags) {
            video.tags.forEach(tag => {
                if (currentTags.has(tag)) score += 2;
            });
        }
        if (video.categories) {
            video.categories.forEach(cat => {
                if (currentCategories.has(cat)) score += 1;
            });
        }
        return { video, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.video);

    // If not enough matches, fill with randoms
    if (scored.length < limit) {
        const remaining = limit - scored.length;
        const others = candidates
            .filter(v => v.id !== videoId && !scored.includes(v))
            .slice(0, remaining);
        return [...scored, ...others];
    }

    return scored;

  } catch (error) {
    console.error('Error getting related videos:', error);
    // Fallback
    const all = await loadAllVideos();
    return all.slice(0, limit);
  }
}

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