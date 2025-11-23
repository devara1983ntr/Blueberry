 // Animation utilities
 import '../utils/data-loader.js';
 import '../components/toast.js';
 import { isAgeVerified, promptAgeVerification } from '../utils/age-verification.js';
 import { analytics } from '../config/firebase.js';
 import { logEvent } from 'firebase/analytics';
 import { db } from '../config/firebase.js';
 import { collection, addDoc } from 'firebase/firestore';

 // Error logging to Firebase
 const logErrorToFirebase = async (error, context = {}) => {
     try {
         await addDoc(collection(db, 'errors'), {
             message: error.message || error,
             stack: error.stack || '',
             url: window.location.href,
             userAgent: navigator.userAgent,
             timestamp: new Date(),
             context
         });
     } catch (logError) {
         console.error('Failed to log error to Firebase:', logError);
     }
 };

 const animationUtils = {
    // Check if user prefers reduced motion
    prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,

    // Intersection Observer for scroll-triggered animations
    createScrollObserver: (callback, options = {}) => {
        if (animationUtils.prefersReducedMotion()) return;

        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { ...defaultOptions, ...options });

        return observer;
    },

    // Staggered animation for grid items
    animateStaggeredItems: (container) => {
        if (animationUtils.prefersReducedMotion()) return;

        const items = container.querySelectorAll('.staggered-item');
        const observer = animationUtils.createScrollObserver((item) => {
            item.classList.add('animate');
        });

        items.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(item);
        });
    },

    // Parallax effect for hero sections
    initParallax: () => {
        if (animationUtils.prefersReducedMotion()) return;

        const parallaxElements = document.querySelectorAll('.parallax-bg');

        const handleScroll = () => {
            const scrollY = window.scrollY;

            parallaxElements.forEach(element => {
                const speed = 0.5; // Adjust speed as needed
                element.style.transform = `translateY(${scrollY * speed}px)`;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Firebase Analytics page view tracking
    logEvent(analytics, 'page_view', {
        page_title: document.title,
        page_location: window.location.href
    });

    // Age verification
    const ageBanner = document.getElementById('age-restriction-banner');
    const confirmAgeBtn = document.getElementById('confirm-age');
    const denyAgeBtn = document.getElementById('deny-age');

    if (!isAgeVerified()) {
        ageBanner.style.display = 'block';
    }

    confirmAgeBtn.addEventListener('click', async () => {
        const verified = await promptAgeVerification();
        if (verified) {
            ageBanner.style.display = 'none';
        } else {
            alert('Invalid age verification. Please try again.');
        }
    });

    denyAgeBtn.addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });

    // Cookie consent
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptCookiesBtn = document.getElementById('accept-cookies');
    const declineCookiesBtn = document.getElementById('decline-cookies');

    if (!localStorage.getItem('cookie-preference')) {
        cookieBanner.style.display = 'block';
    }

    acceptCookiesBtn.addEventListener('click', () => {
        localStorage.setItem('cookie-preference', 'accepted');
        cookieBanner.style.display = 'none';
    });

    declineCookiesBtn.addEventListener('click', () => {
        localStorage.setItem('cookie-preference', 'declined');
        cookieBanner.style.display = 'none';
    });

    // Initialize scroll-triggered animations
    animationUtils.initParallax();

    const trendingContainer = document.querySelector('.video-grid:nth-of-type(1) .grid-container');
    const newReleasesContainer = document.querySelector('.video-grid:nth-of-type(2) .grid-container');
    const featuredCategoriesContainer = document.querySelector('.video-grid:nth-of-type(3) .grid-container');

    // Load video data
    let videos = [];
    try {
        const { loadAllVideos } = await import('../utils/data-loader.js');
        videos = await loadAllVideos();
        // Limit to first 100 for performance
        videos = videos.slice(0, 100);
    } catch (error) {
        console.error('Error loading video data:', error);
        showToast('error', 'Failed to Load Videos', error.message);

        // Fallback to placeholder videos
        videos = [
            { title: 'Video 1', thumbnail: 'https://source.unsplash.com/random/400x225/?girl' },
            { title: 'Video 2', thumbnail: 'https://source.unsplash.com/random/400x225/?woman' },
        ];
    }

    const populateGrid = (container, items) => {
        container.innerHTML = '';
        items.forEach((item, index) => {
            const videoThumbnail = document.createElement('video-thumbnail');
            videoThumbnail.setAttribute('title', item.title);
            videoThumbnail.setAttribute('thumbnail', item.thumbnail);
            videoThumbnail.setAttribute('id', item.id);
            videoThumbnail.classList.add('staggered-item');
            container.appendChild(videoThumbnail);
        });

        animationUtils.animateStaggeredItems(container);
    };

    // Populate grids
    populateGrid(trendingContainer, videos.slice(0, 12));
    populateGrid(newReleasesContainer, videos.slice(12, 24));
    populateGrid(featuredCategoriesContainer, videos.slice(24, 36));
});

// Global error monitoring
window.addEventListener('error', (event) => {
    logErrorToFirebase(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    logErrorToFirebase(event.reason, { type: 'unhandledrejection' });
});