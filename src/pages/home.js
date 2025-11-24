import '../components/loading-spinner.js';
import '../components/toast.js';
import '../components/pagination.js';
import '../components/limit-reached-banner.js';
import { getCurrentUser, onAuthStateChange } from '../services/auth-service.js';
import { initAgeVerification } from '../utils/age-verification.js';

let currentPage = 1;
const itemsPerPage = 24;
let totalVideosCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Age Verification (Blocks interaction if not verified)
    await initAgeVerification();

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navDrawer.toggle();
        });
    }

    // Auth State Listener
    onAuthStateChange(user => {
        refreshContent(user);
    });

    // Initial Load (assumes guest initially until auth state resolves, but listener will catch update)
    // We wait a tiny bit for auth to initialize? No, onAuthStateChange fires immediately with null or user.
});

async function refreshContent(user) {
    const { TOTAL_VIDEOS_ESTIMATE, GUEST_LIMIT } = await import('../utils/data-loader.js');

    const maxVideos = user ? TOTAL_VIDEOS_ESTIMATE : GUEST_LIMIT;

    // Reset to page 1 on auth change
    currentPage = 1;
    await loadPage(currentPage, maxVideos);

    // Update Login Banner Visibility
    const loginBanner = document.getElementById('login-banner');
    if (loginBanner) {
        loginBanner.style.display = user ? 'none' : 'block';
    }
}

async function loadPage(page, maxTotal) {
    currentPage = page;
    const mainGrid = document.getElementById('main-video-grid');
    const paginationContainer = document.getElementById('pagination-container');
    const featuredContainer = document.getElementById('featured-video');
    const limitBannerContainer = document.getElementById('limit-banner-container');

    // Show spinner
    mainGrid.innerHTML = '<loading-spinner size="medium" style="circular"></loading-spinner>';
    if (limitBannerContainer) limitBannerContainer.innerHTML = '';

    try {
        const { getVideos } = await import('../utils/data-loader.js');

        // Calculate pagination bounds
        const start = (page - 1) * itemsPerPage;

        // Check if we are beyond the limit (should be handled by maxTotal but double check)
        if (start >= maxTotal) {
            // This shouldn't happen via normal pagination click unless logic is off
            mainGrid.innerHTML = '';
            if (limitBannerContainer) {
                limitBannerContainer.appendChild(document.createElement('limit-reached-banner'));
            }
            return;
        }

        // Fetch videos
        // If the request exceeds the maxTotal (e.g. last partial page for guest), slice it
        let fetchLimit = itemsPerPage;
        if (start + itemsPerPage > maxTotal) {
            fetchLimit = maxTotal - start;
        }

        const videos = await getVideos(start, fetchLimit);

        // Render Featured Video (Only on page 1)
        if (page === 1 && videos.length > 0 && featuredContainer) {
             const featured = videos[0]; // Use first video as featured for now
             featuredContainer.innerHTML = `
                <div class="featured-content">
                    <img src="${featured.thumbnail}" alt="${featured.title}">
                    <div class="overlay">
                        <button class="play-button">▶</button>
                        <div class="info">
                            <h2 class="title">${featured.title}</h2>
                            <p class="desc">Trending now • ${featured.duration}</p>
                        </div>
                    </div>
                </div>
            `;
            // Add styling for this specific innerHTML if not covered by main CSS
            // But we'll rely on global CSS updates.
        }

        displayVideos(videos);
        setupPagination(maxTotal);

        // If this is the last page for a guest, show the banner below the grid
        if (!getCurrentUser() && (start + videos.length >= maxTotal) && limitBannerContainer) {
             limitBannerContainer.appendChild(document.createElement('limit-reached-banner'));
        }

    } catch (error) {
        console.error('Error loading video data:', error);
        mainGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #dc3545; padding: 1rem;">Unable to load video content. Please check your connection and try again.</div>';
    }
}

function displayVideos(videos) {
    const mainGrid = document.getElementById('main-video-grid');

    if (videos.length === 0) {
        mainGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #666; padding: 1rem;">No videos available.</div>';
        return;
    }

    mainGrid.innerHTML = '';
    videos.forEach(video => {
        // Create card structure matching card.css
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

        mainGrid.appendChild(card);
    });
}

function setupPagination(totalItems) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    if (totalItems > itemsPerPage) {
        const pagination = document.createElement('blueberry-pagination');
        pagination.setAttribute('total-items', totalItems);
        pagination.setAttribute('items-per-page', itemsPerPage);
        pagination.setAttribute('current-page', currentPage);
        pagination.setAttribute('mode', 'numbered'); // or 'simple' for mobile

        pagination.addEventListener('page-change', async (e) => {
            await loadPage(e.detail.page, totalItems);
            document.getElementById('main-video-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        paginationContainer.appendChild(pagination);
    }
}
