// src/pages/categories.js
import '../components/navigation-drawer.js';
import '../components/search-bar.js';

// Pre-defined categories list
const CATEGORIES = [
    "Amateur", "Anal", "Asian", "BBW", "Big Tits", "Blonde", "Blowjob",
    "Brunette", "Creampie", "Cumshot", "Ebony", "Fetish", "Group",
    "Hardcore", "Hentai", "Interracial", "Latina", "Lesbian", "Mature",
    "Milf", "POV", "Public", "Redhead", "Roleplay", "Solo", "Teen", "Threesome"
];

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    if(hamburger) hamburger.addEventListener('click', () => navDrawer.toggle());

    renderCategories();
});

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    CATEGORIES.forEach(category => {
        const card = document.createElement('a');
        card.className = 'category-card';
        card.href = `search.html?category=${encodeURIComponent(category)}`;

        // Generate a random gradient for the background placeholder
        const hue = Math.floor(Math.random() * 360);
        card.style.background = `linear-gradient(45deg, hsl(${hue}, 60%, 20%), hsl(${hue + 40}, 60%, 40%))`;

        card.innerHTML = `
            <h3>${category}</h3>
        `;

        // Add swipe/touch feedback
        card.addEventListener('touchstart', () => {
            card.style.transform = 'scale(0.95)';
        });
        card.addEventListener('touchend', () => {
             card.style.transform = 'scale(1)';
        });

        grid.appendChild(card);
    });
}
