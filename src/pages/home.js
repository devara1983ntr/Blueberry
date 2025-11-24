import '../components/loading-spinner.js';
import '../components/toast.js';
import '../components/pagination.js';
import { getCurrentUser, onAuthStateChange } from '../services/auth-service.js';

let currentPage = 1;
const itemsPerPage = 24;
let totalVideosCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navDrawer.toggle();
        });
    }

    // Determine max videos based on auth status
    const maxVideos = getCurrentUser() ? 126000 : 2000; // 126000 is approx total
    // Import TOTAL_VIDEOS_ESTIMATE if possible, but hardcoding safely or fetching from loader is better

    // Initial Load
    await loadPage(1, maxVideos);

    // Handle login banner
    const loginBanner = document.getElementById('login-banner');
    if (loginBanner) {
        const updateBanner = () => {
            if (getCurrentUser()) {
                loginBanner.style.display = 'none';
            } else {
                loginBanner.style.display = 'block';
            }
        };
        updateBanner();
        onAuthStateChange(updateBanner);
    }
});

async function loadPage(page, maxTotal) {
    currentPage = page;
    const mainGrid = document.getElementById('main-video-grid');
    const paginationContainer = document.getElementById('pagination-container');
    const featuredContainer = document.getElementById('featured-video');

    // Show spinner
    mainGrid.innerHTML = '<loading-spinner size="medium" style="circular"></loading-spinner>';

    try {
        const { getVideos, TOTAL_VIDEOS_ESTIMATE } = await import('../utils/data-loader.js');

        // Use the estimated total from loader, but cap it if user not logged in
        let availableTotal = TOTAL_VIDEOS_ESTIMATE;
        if (maxTotal && maxTotal < availableTotal) {
            availableTotal = maxTotal;
        }
        totalVideosCount = availableTotal;

        const start = (page - 1) * itemsPerPage;
        // Fetch videos for this page
        const videos = await getVideos(start, itemsPerPage);

        // If it's the first page and we have a featured video container, render it
        if (page === 1 && videos.length > 0 && featuredContainer) {
             const featured = videos[0];
             featuredContainer.innerHTML = `
                <img src="${featured.thumbnail}" alt="${featured.title}">
                <button class="play-button">▶</button>
                <div class="title">${featured.title}</div>
            `;
        }

        displayVideos(videos, totalVideosCount);

    } catch (error) {
        console.error('Error loading video data:', error);
        // showToast('error', 'Failed to Load Videos', error.message);
        mainGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #dc3545; padding: 1rem;">Unable to load video content. Please check your connection and try again.</div>';
    }
}

function displayVideos(videos, totalItems) {
    const mainGrid = document.getElementById('main-video-grid');
    const paginationContainer = document.getElementById('pagination-container');

    if (videos.length === 0) {
        mainGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #666; padding: 1rem;">No videos available.</div>';
        paginationContainer.innerHTML = '';
        return;
    }

    // Display videos
    mainGrid.innerHTML = '';
    videos.forEach(video => {
        const videoThumbnail = document.createElement('video-thumbnail');
        videoThumbnail.setAttribute('title', video.title);
        videoThumbnail.setAttribute('thumbnail', video.thumbnail);
        videoThumbnail.setAttribute('id', video.id);
        videoThumbnail.addEventListener('click', () => {
            window.location.href = `video.html?id=${video.id}`;
        });
        mainGrid.appendChild(videoThumbnail);
    });

    // Pagination
    paginationContainer.innerHTML = '';
    if (totalItems > itemsPerPage) {
        const pagination = document.createElement('blueberry-pagination');
        pagination.setAttribute('total-items', totalItems);
        pagination.setAttribute('items-per-page', itemsPerPage);
        pagination.setAttribute('current-page', currentPage);
        pagination.setAttribute('mode', 'numbered');
        pagination.addEventListener('page-change', (e) => {
            const maxVideos = getCurrentUser() ? null : 2000;
            loadPage(e.detail.page, maxVideos);
            // Scroll to top of grid
            mainGrid.scrollIntoView({ behavior: 'smooth' });
        });
        paginationContainer.appendChild(pagination);
    }
}
