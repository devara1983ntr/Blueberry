// src/pages/search.js
import { loadAllVideos } from '../utils/data-loader.js';
import '../components/pagination.js';
import '../components/search-bar.js';
import '../components/navigation-drawer.js';

let allVideos = [];
let filteredVideos = [];
let currentQuery = '';
let currentCategory = '';
let currentPage = 1;
const itemsPerPage = 24;

document.addEventListener('DOMContentLoaded', async () => {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    if (hamburger) hamburger.addEventListener('click', () => navDrawer.toggle());

    // Load videos - optimization note: loading ALL videos is heavy.
    // Ideally this should be server-side search.
    // For now, we load a subset or try to handle it.
    // Given the previous refactor to 'loadAllVideos' warning, let's load a larger chunk for search demo
    // or just rely on what we can get.
    // Real implementation would require a dedicated search endpoint.
    // We will attempt to load a reasonable amount for client-side search simulation (e.g., 5000)
    allVideos = await loadAllVideos(5000);

    // Get URL params
    const urlParams = new URLSearchParams(window.location.search);
    currentQuery = urlParams.get('q') || '';
    currentCategory = urlParams.get('category') || '';

    // Update Title
    const searchTitle = document.getElementById('search-results-title');
    if (currentCategory) {
        searchTitle.textContent = `${currentCategory} Videos`;
    } else if (currentQuery) {
        searchTitle.textContent = `Results for "${currentQuery}"`;
    } else {
        searchTitle.textContent = 'All Videos';
    }

    applyFiltersAndDisplay();
});

function applyFiltersAndDisplay() {
    filteredVideos = filterVideos(allVideos, currentQuery, currentCategory);
    displayResults();
}

function filterVideos(videos, query, category) {
    let result = videos;

    if (category) {
        result = result.filter(video =>
            video.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
        );
    }

    if (query) {
        const lowerQuery = query.toLowerCase();
        result = result.filter(video =>
            video.title.toLowerCase().includes(lowerQuery) ||
            video.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            (video.performer && video.performer.toLowerCase().includes(lowerQuery))
        );
    }

    return result;
}

function displayResults() {
    const resultsGrid = document.getElementById('results-grid');
    const paginationElement = document.getElementById('pagination');

    if (filteredVideos.length === 0) {
        resultsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; margin-top: 2rem; color: var(--text-secondary);">No videos found matching your criteria.</p>';
        paginationElement.innerHTML = '';
        return;
    }

    // Paginate
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageVideos = filteredVideos.slice(start, end);

    resultsGrid.innerHTML = '';
    pageVideos.forEach(video => {
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
        resultsGrid.appendChild(card);
    });

    // Pagination Component
    paginationElement.innerHTML = '';
    if (filteredVideos.length > itemsPerPage) {
        const pagination = document.createElement('blueberry-pagination');
        pagination.setAttribute('total-items', filteredVideos.length);
        pagination.setAttribute('items-per-page', itemsPerPage);
        pagination.setAttribute('current-page', currentPage);
        pagination.setAttribute('mode', 'numbered');
        pagination.addEventListener('page-change', (e) => {
            currentPage = e.detail.page;
            displayResults();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationElement.appendChild(pagination);
    }
}
