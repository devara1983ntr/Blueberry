import '../components/loading-spinner.js';
import '../components/toast.js';
import '../components/pagination.js';
import { getCurrentUser, onAuthStateChange } from '../services/auth-service.js';

let allVideos = [];
let currentPage = 1;
const itemsPerPage = 24;

document.addEventListener('DOMContentLoaded', async () => {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    hamburger.addEventListener('click', () => {
        navDrawer.toggle();
    });

    // Show loading spinner
    const mainGrid = document.getElementById('main-video-grid');
    const paginationContainer = document.getElementById('pagination-container');

    const showLoadingSpinner = () => {
        mainGrid.innerHTML = '<loading-spinner size="medium" style="circular"></loading-spinner>';
        paginationContainer.innerHTML = '';
    };

    showLoadingSpinner();

    // Determine max videos based on auth status
    const maxVideos = getCurrentUser() ? null : 2000;

    // Load video data using dynamic import for code splitting
    try {
        const { loadAllVideos } = await import('../utils/data-loader.js');
        allVideos = await loadAllVideos(maxVideos);
    } catch (error) {
        console.error('Error loading video data:', error);
        showToast('error', 'Failed to Load Videos', error.message);

        // Show error message in UI
        mainGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #dc3545; padding: 1rem;">Unable to load video content. Please check your connection and try again.</div>';
        return;
    }

    // Render featured video
    const featuredContainer = document.getElementById('featured-video');
    if (allVideos.length > 0) {
        const featured = allVideos[0];
        featuredContainer.innerHTML = `
            <img src="${featured.thumbnail}" alt="${featured.title}">
            <button class="play-button">▶</button>
            <div class="title">${featured.title}</div>
        `;
    }

    // Display videos with pagination
    displayVideos();

    // Handle login banner
    const loginBanner = document.getElementById('login-banner');
    const updateBanner = () => {
        if (getCurrentUser()) {
            loginBanner.style.display = 'none';
        } else {
            loginBanner.style.display = 'block';
        }
    };
    updateBanner();

    // Listen for auth state changes to update banner
    onAuthStateChange(updateBanner);
});

function displayVideos() {
    const mainGrid = document.getElementById('main-video-grid');
    const paginationContainer = document.getElementById('pagination-container');

    if (allVideos.length === 0) {
        mainGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #666; padding: 1rem;">No videos available.</div>';
        paginationContainer.innerHTML = '';
        return;
    }

    // Paginate
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageVideos = allVideos.slice(start, end);

    // Display videos
    mainGrid.innerHTML = '';
    pageVideos.forEach(video => {
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
    if (allVideos.length > itemsPerPage) {
        const pagination = document.createElement('blueberry-pagination');
        pagination.setAttribute('total-items', allVideos.length);
        pagination.setAttribute('items-per-page', itemsPerPage);
        pagination.setAttribute('current-page', currentPage);
        pagination.setAttribute('mode', 'numbered');
        pagination.addEventListener('page-change', (e) => {
            currentPage = e.detail.page;
            displayVideos();
            // Scroll to top of grid
            mainGrid.scrollIntoView({ behavior: 'smooth' });
        });
        paginationContainer.appendChild(pagination);
    }
}