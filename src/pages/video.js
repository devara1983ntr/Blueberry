import { keyboardShortcuts } from '../utils/keyboard-shortcuts.js';
import { getCurrentUser } from '../services/auth-service.js';
import { addToWatchHistory, addToFavorites, removeFromFavorites, getFavorites, getSettings } from '../services/data-service.js';
import { addToLocalHistory } from '../services/local-history-service.js';
import { getRelatedVideos } from '../services/recommendation-service.js';
import { getVideoById } from '../utils/data-loader.js';

// Hash PIN for parental controls
async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple toast function
function showToast(type, message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 1rem;
        border-radius: 4px;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    hamburger.addEventListener('click', () => {
        navDrawer.toggle();
    });

    try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id') || '0';

        // Load current video
        const currentVideo = await getVideoById(id);

        if (!currentVideo) {
            // This handles the case where the video ID doesn't exist in the data file.
            throw new Error('Video not found');
        }

        const videoId = currentVideo.id;

        // Check parental controls
        const currentUser = getCurrentUser();
        let settings = {};
        if (currentUser) {
            try {
                settings = await getSettings(currentUser.uid);
            } catch (error) {
                console.error('Error getting settings:', error);
            }
        } else {
            settings = JSON.parse(localStorage.getItem('blueberry-settings')) || {};
        }

        if (settings.parentalEnabled) {
            const pin = prompt('Enter parental control PIN:');
            if (!pin) {
                showToast('error', 'PIN required to view this content');
                return;
            }
            const hashedPin = await hashPIN(pin);
            if (hashedPin !== settings.parentalPinHash) {
                showToast('error', 'Incorrect PIN');
                return;
            }
        }

        // Populate video player
        const videoPlayer = document.querySelector('video-player');
        videoPlayer.setAttribute('embed', currentVideo.embed);

        // Add to watch history
        if (currentUser) {
            addToWatchHistory(currentUser.uid, videoId);
        } else {
            addToLocalHistory(videoId);
        }

        // Populate header title
        const titleHeader = document.querySelector('.video-title-header');
        titleHeader.textContent = currentVideo.title;

        // Populate metadata
        const title = document.querySelector('.video-title');
        title.textContent = currentVideo.title;

        const views = document.querySelector('.views');
        views.textContent = currentVideo.views ? `${currentVideo.views} views` : '';

        const likes = document.querySelector('.likes');
        likes.textContent = currentVideo.likes ? `${currentVideo.likes} likes` : '';

        const tagsContainer = document.querySelector('.video-tags');
        tagsContainer.innerHTML = currentVideo.tags.map(tag => `<span>${tag}</span>`).join('');

        const description = document.querySelector('.video-description');
        description.textContent = currentVideo.performer ? `Performer: ${currentVideo.performer}` : '';

        // Share functionality
        const shareBtn = document.getElementById('share-btn');
        const shareDropdown = document.getElementById('share-dropdown');

        shareBtn.addEventListener('click', () => {
            shareDropdown.hidden = !shareDropdown.hidden;
        });

        // Share options
        shareDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-option')) {
                const platform = e.target.dataset.platform;
                const url = window.location.href;
                const title = currentVideo.title;

                let shareUrl;
                switch (platform) {
                    case 'facebook':
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                        break;
                    case 'twitter':
                        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                        break;
                    case 'whatsapp':
                        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                        break;
                    case 'copy':
                        navigator.clipboard.writeText(url).then(() => {
                            showToast('success', 'Link copied to clipboard!');
                        });
                        shareDropdown.hidden = true;
                        return;
                }

                if (shareUrl) {
                    window.open(shareUrl, '_blank');
                }
                shareDropdown.hidden = true;
            }
        });

        // Favorite functionality
        const favoriteBtn = document.getElementById('favorite-btn');
        let isFavorite = false;

        const updateFavoriteButton = () => {
            favoriteBtn.textContent = isFavorite ? '❤️ Added to Favorites' : '❤️ Add to Favorites';
        };

        if (currentUser) {
            // Check if already in favorites
            getFavorites(currentUser.uid).then(favorites => {
                isFavorite = favorites.includes(videoId);
                updateFavoriteButton();
            });
        }

        favoriteBtn.addEventListener('click', async () => {
            if (!currentUser) {
                showToast('warning', 'Please log in to add favorites');
                return;
            }

            try {
                if (isFavorite) {
                    await removeFromFavorites(currentUser.uid, videoId);
                    isFavorite = false;
                    showToast('success', 'Removed from favorites');
                } else {
                    await addToFavorites(currentUser.uid, videoId);
                    isFavorite = true;
                    showToast('success', 'Added to favorites');
                }
                updateFavoriteButton();
            } catch (error) {
                console.error('Error updating favorites:', error);
                showToast('error', 'Error updating favorites');
            }
        });

        // Add to playlist functionality
        const addToPlaylistBtn = document.getElementById('add-to-playlist-btn');
        addToPlaylistBtn.addEventListener('click', () => {
            const videoPlayer = document.querySelector('video-player');
            const videoData = {
                id: videoId,
                title: currentVideo.title,
                thumbnail: currentVideo.thumbnail,
                embed: currentVideo.embed,
                duration: currentVideo.duration
            };
            videoPlayer.addToPlaylist(videoData);
            showToast('success', 'Added to playlist');
        });

        // Add to watch later functionality
        const addToWatchLaterBtn = document.getElementById('add-to-watch-later-btn');
        addToWatchLaterBtn.addEventListener('click', () => {
            const videoPlayer = document.querySelector('video-player');
            const videoData = {
                id: videoId,
                title: currentVideo.title,
                thumbnail: currentVideo.thumbnail,
                embed: currentVideo.embed,
                duration: currentVideo.duration
            };
            videoPlayer.addToWatchLater(videoData);
            showToast('success', 'Added to watch later');
        });

        // Load recommendations
        try {
            const recommendations = await getRelatedVideos(videoId, 10);
            const belowPlayerGrid = document.getElementById('below-player-recommendations-grid');
            const relatedGrid = document.getElementById('related-videos-grid');

            const populateRecommendations = (container, videos) => {
                if (!container) return;
                container.innerHTML = '';
                videos.forEach(video => {
                    // Check if custom element exists, else fallback to div
                    // Assuming video-thumbnail is defined elsewhere or we use the div structure from home.js
                    // But home.js uses div with class 'video-card'.
                    // src/components/video-thumbnail.js might exist but I haven't seen it in file list.
                    // Wait, I didn't see video-thumbnail.js in components list.
                    // home.js uses div structure.
                    // But video.js used createElement('video-thumbnail').
                    // Let's check if video-thumbnail is defined.
                    // If not, I should use the standard card structure.
                    // For safety, I'll use the card structure from home.js if I'm not sure.

                    const card = document.createElement('div');
                    card.className = 'video-card';
                    card.innerHTML = `
                        <img src="${video.thumbnail}" loading="lazy" alt="${video.title}">
                        <div class="duration">${video.duration}</div>
                        <div class="content">
                            <h3>${video.title}</h3>
                            <div class="meta">
                                <span>${video.views || '0'} views</span>
                            </div>
                        </div>
                    `;
                    card.addEventListener('click', () => {
                        window.location.href = `video.html?id=${video.id}`;
                    });
                    container.appendChild(card);
                });
            };

            populateRecommendations(belowPlayerGrid, recommendations.slice(0, 6));
            populateRecommendations(relatedGrid, recommendations.slice(6, 10));
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }

        // Keyboard shortcuts
        keyboardShortcuts.init();

        // Swipe gestures for video navigation
        let touchStartX = 0;
        let touchEndX = 0;
        const videoPlayerElement = document.querySelector('video-player');

        videoPlayerElement.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        videoPlayerElement.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50; // Minimum distance for swipe
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                const currentIdInt = parseInt(videoId, 10);

                if (diff > 0) {
                    // Swipe left - next video
                    const nextId = currentIdInt + 1;
                    window.location.href = `video.html?id=${nextId}`;
                } else {
                    // Swipe right - previous video
                    const prevId = Math.max(0, currentIdInt - 1);
                    window.location.href = `video.html?id=${prevId}`;
                }
            }
        }

        // Accessibility: Add ARIA label for swipe functionality
        videoPlayerElement.setAttribute('aria-label', 'Video player - swipe left for next video, swipe right for previous video');

    } catch (error) {
        console.error('Failed to load video page:', error);
        const container = document.querySelector('.video-page-container');
        if (container) {
            container.innerHTML = `<div style="text-align: center; color: #dc3545; padding: 2rem;">
                <h2>Unable to Load Video</h2>
                <p>${error.message}</p>
                <p>Please check your connection and try again. If the problem persists, the video may have been removed.</p>
                <a href="index.html" class="btn-primary" style="margin-top: 1rem; display: inline-block;">Go to Homepage</a>
            </div>`;
        }
        showToast('error', error.message || 'Failed to load video.');
    }
});