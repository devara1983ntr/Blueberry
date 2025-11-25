import { showToast } from './toast.js';

// Hexagonal Architecture: Ports
class VideoControlsPort {
    play() { throw new Error('Not implemented'); }
    pause() { throw new Error('Not implemented'); }
    setVolume(volume) { throw new Error('Not implemented'); }
    toggleMute() { throw new Error('Not implemented'); }
    seek(time) { throw new Error('Not implemented'); }
    enterFullscreen() { throw new Error('Not implemented'); }
    exitFullscreen() { throw new Error('Not implemented'); }
    getCurrentTime() { throw new Error('Not implemented'); }
    getDuration() { throw new Error('Not implemented'); }
}

// Hexagonal Architecture: Adapters
class IframeVideoAdapter extends VideoControlsPort {
    constructor(iframe) {
        super();
        this.iframe = iframe;
        this.isPlaying = false;
        this.volume = 1;
        this.muted = false;
        this.currentTime = 0;
        this.duration = 0;
    }

    play() {
        // Pornhub iframes do not support programmatic play/pause via postMessage
        // This is a simulation; in reality, controls are handled by iframe
        this.isPlaying = true;
    }

    pause() {
        this.isPlaying = false;
    }

    setVolume(volume) {
        this.volume = volume;
        // Volume control not possible with iframe
    }

    toggleMute() {
        this.muted = !this.muted;
    }

    seek(time) {
        this.currentTime = time;
    }

    enterFullscreen() {
        if (this.iframe.requestFullscreen) {
            this.iframe.requestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }

    getCurrentTime() {
        return this.currentTime;
    }

    getDuration() {
        return this.duration;
    }
}

// Core Domain
class VideoPlayerDomain {
    constructor(adapter) {
        this.adapter = adapter;
    }

    play() {
        this.adapter.play();
    }

    pause() {
        this.adapter.pause();
    }

    togglePlayPause() {
        if (this.adapter.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    setVolume(volume) {
        this.adapter.setVolume(volume);
    }

    toggleMute() {
        this.adapter.toggleMute();
    }

    seek(time) {
        this.adapter.seek(time);
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            this.adapter.exitFullscreen();
        } else {
            this.adapter.enterFullscreen();
        }
    }
}

class VideoPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    background-color: #000;
                    aspect-ratio: 16 / 9;
                    transition: all 0.3s ease;
                }
                :host(.theater-mode) {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 1000;
                }
                :host(.mini-player) {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 320px;
                    height: 180px;
                    z-index: 1000;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }
                iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .controls {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
                    padding: 1rem;
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 10;
                    flex-wrap: wrap;
                }
                :host(:hover) .controls, :host(.mini-player) .controls {
                    opacity: 1;
                }
                .controls button {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 4px;
                    transition: background 0.2s;
                    min-width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .controls button:hover {
                    background: rgba(255,255,255,0.1);
                }
                .controls button.active {
                    background: rgba(255,255,255,0.2);
                    color: #4CAF50;
                }
                input[type="range"] {
                    flex-grow: 1;
                    height: 4px;
                    background: #555;
                    border-radius: 2px;
                    min-width: 100px;
                }
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: #fff;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .dropdown {
                    position: relative;
                    display: inline-block;
                }
                .dropdown-content {
                    display: none;
                    position: absolute;
                    bottom: 100%;
                    background: rgba(0,0,0,0.9);
                    border: 1px solid #333;
                    border-radius: 4px;
                    min-width: 120px;
                    z-index: 100;
                    margin-bottom: 5px;
                }
                .dropdown-content.show {
                    display: block;
                }
                .dropdown-content button {
                    width: 100%;
                    text-align: left;
                    padding: 0.5rem;
                    font-size: 0.9rem;
                    border: none;
                    background: none;
                    color: #fff;
                    cursor: pointer;
                    border-radius: 0;
                }
                .dropdown-content button:hover {
                    background: rgba(255,255,255,0.1);
                }
                .dropdown-content button.active {
                    background: rgba(255,255,255,0.2);
                    color: #4CAF50;
                }
                .speed-control {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .speed-display {
                    font-size: 0.9rem;
                    min-width: 30px;
                    text-align: center;
                }
                .playlist-panel {
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 300px;
                    background: rgba(0,0,0,0.9);
                    border-left: 1px solid #333;
                    display: none;
                    flex-direction: column;
                    z-index: 20;
                }
                .playlist-panel.show {
                    display: flex;
                }
                .playlist-header {
                    padding: 1rem;
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .playlist-items {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.5rem;
                }
                .playlist-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-bottom: 0.5rem;
                }
                .playlist-item:hover {
                    background: rgba(255,255,255,0.1);
                }
                .playlist-item.active {
                    background: rgba(255,255,255,0.2);
                }
                .playlist-item img {
                    width: 60px;
                    height: 40px;
                    object-fit: cover;
                    border-radius: 4px;
                }
                .playlist-item-info {
                    flex: 1;
                    min-width: 0;
                }
                .playlist-item-title {
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .playlist-item-duration {
                    font-size: 0.8rem;
                    color: #aaa;
                }
                .watch-later-panel {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 300px;
                    background: rgba(0,0,0,0.9);
                    border-right: 1px solid #333;
                    display: none;
                    flex-direction: column;
                    z-index: 20;
                }
                .watch-later-panel.show {
                    display: flex;
                }
                .watch-later-header {
                    padding: 1rem;
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .watch-later-items {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.5rem;
                }
                .watch-later-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-bottom: 0.5rem;
                }
                .watch-later-item:hover {
                    background: rgba(255,255,255,0.1);
                }
                .watch-later-item img {
                    width: 60px;
                    height: 40px;
                    object-fit: cover;
                    border-radius: 4px;
                }
                .watch-later-item-info {
                    flex: 1;
                    min-width: 0;
                }
                .watch-later-item-title {
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .watch-later-item-duration {
                    font-size: 0.8rem;
                    color: #aaa;
                }
                .remove-btn {
                    background: none;
                    border: none;
                    color: #ff6b6b;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 50%;
                    font-size: 0.8rem;
                }
                .remove-btn:hover {
                    background: rgba(255,107,107,0.2);
                }
                .brightness-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0);
                    pointer-events: none;
                    z-index: 5;
                }
                .gesture-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 30;
                }
                .speed-control-overlay {
                    background: rgba(0,0,0,0.8);
                    padding: 1rem;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    color: white;
                }
            </style>
            <iframe></iframe>
            <div class="brightness-overlay"></div>
            <div class="controls">
                <button class="play-pause" title="Play/Pause">▶️</button>
                <input type="range" class="progress-bar" value="0" min="0" max="100" step="0.1" title="Progress">
                <button class="volume" title="Volume">🔊</button>
                <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1" title="Volume">
                <div class="dropdown">
                    <button class="quality-btn" title="Quality">HD</button>
                    <div class="dropdown-content">
                        <button class="quality-option active" data-quality="auto">Auto</button>
                        <button class="quality-option" data-quality="4k">4K</button>
                        <button class="quality-option" data-quality="1080p">1080p</button>
                        <button class="quality-option" data-quality="720p">720p</button>
                        <button class="quality-option" data-quality="480p">480p</button>
                        <button class="quality-option" data-quality="360p">360p</button>
                    </div>
                </div>
                <button class="subtitles-btn" title="Subtitles">CC</button>
                <div class="speed-control">
                    <button class="speed-down" title="Decrease Speed">-</button>
                    <span class="speed-display">1x</span>
                    <button class="speed-up" title="Increase Speed">+</button>
                </div>
                <button class="pip-btn" title="Picture-in-Picture">📺</button>
                <button class="theater-btn" title="Theater Mode">🎭</button>
                <button class="mini-player-btn" title="Mini Player">📱</button>
                <button class="loop-btn" title="Loop">🔁</button>
                <button class="autoplay-btn" title="Auto-play Next">▶️➡️</button>
                <button class="screenshot-btn" title="Screenshot">📸</button>
                <button class="share-timestamp-btn" title="Share with Timestamp">⏰</button>
                <button class="playlist-btn" title="Playlist">📋</button>
                <button class="watch-later-btn" title="Watch Later">⏰</button>
                <button class="fullscreen">⛶</button>
            </div>
            <div class="playlist-panel">
                <div class="playlist-header">
                    <h3>Playlist</h3>
                    <button class="close-playlist">✕</button>
                </div>
                <div class="playlist-items"></div>
            </div>
            <div class="watch-later-panel">
                <div class="watch-later-header">
                    <h3>Watch Later</h3>
                    <button class="close-watch-later">✕</button>
                </div>
                <div class="watch-later-items"></div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.iframe = this.shadowRoot.querySelector('iframe');
        this.playPauseBtn = this.shadowRoot.querySelector('.play-pause');
        this.progressBar = this.shadowRoot.querySelector('.progress-bar');
        this.volumeBtn = this.shadowRoot.querySelector('.volume');
        this.volumeSlider = this.shadowRoot.querySelector('.volume-slider');
        this.fullscreenBtn = this.shadowRoot.querySelector('.fullscreen');

        // New elements
        this.qualityBtn = this.shadowRoot.querySelector('.quality-btn');
        this.qualityDropdown = this.shadowRoot.querySelector('.dropdown-content');
        this.subtitlesBtn = this.shadowRoot.querySelector('.subtitles-btn');
        this.speedDownBtn = this.shadowRoot.querySelector('.speed-down');
        this.speedUpBtn = this.shadowRoot.querySelector('.speed-up');
        this.speedDisplay = this.shadowRoot.querySelector('.speed-display');
        this.pipBtn = this.shadowRoot.querySelector('.pip-btn');
        this.theaterBtn = this.shadowRoot.querySelector('.theater-btn');
        this.miniPlayerBtn = this.shadowRoot.querySelector('.mini-player-btn');
        this.loopBtn = this.shadowRoot.querySelector('.loop-btn');
        this.autoplayBtn = this.shadowRoot.querySelector('.autoplay-btn');
        this.screenshotBtn = this.shadowRoot.querySelector('.screenshot-btn');
        this.shareTimestampBtn = this.shadowRoot.querySelector('.share-timestamp-btn');
        this.playlistBtn = this.shadowRoot.querySelector('.playlist-btn');
        this.watchLaterBtn = this.shadowRoot.querySelector('.watch-later-btn');

        // Panels
        this.playlistPanel = this.shadowRoot.querySelector('.playlist-panel');
        this.watchLaterPanel = this.shadowRoot.querySelector('.watch-later-panel');
        this.playlistItems = this.shadowRoot.querySelector('.playlist-items');
        this.watchLaterItems = this.shadowRoot.querySelector('.watch-later-items');

        // Initialize Hexagonal Architecture
        this.adapter = new IframeVideoAdapter(this.iframe);
        this.domain = new VideoPlayerDomain(this.adapter);

        // State variables
        this.currentQuality = 'auto';
        this.subtitlesEnabled = false;
        this.playbackSpeed = 1.0;
        this.isPiPMode = false;
        this.isTheaterMode = false;
        this.isMiniPlayer = false;
        this.isLooping = false;
        this.autoplayNext = false;
        this.playlist = [];
        this.watchLaterQueue = [];
        this.currentVideoIndex = 0;

        // Gesture state
        this.touchState = {
            startTime: 0,
            startX: 0,
            startY: 0,
            touches: [],
            isPinching: false,
            pinchStartDistance: 0,
            zoomLevel: 1,
            tapCount: 0,
            lastTapTime: 0,
            longPressTimer: null,
            isSwiping: false,
            circularPath: [],
            brightness: 1,
            shakeCount: 0,
            lastShakeTime: 0
        };

        // Load saved settings
        this.loadSettings();

        // Store event handlers for cleanup
        this.playPauseHandler = () => this.domain.togglePlayPause();
        this.progressHandler = (e) => this.domain.seek(e.target.value);
        this.volumeBtnHandler = () => this.domain.toggleMute();
        this.volumeSliderHandler = (e) => this.domain.setVolume(e.target.value);
        this.fullscreenHandler = () => this.domain.toggleFullscreen();

        // New event handlers
        this.qualityBtnHandler = () => this.toggleQualityDropdown();
        this.qualityOptionHandler = (e) => this.selectQuality(e.target.dataset.quality);
        this.subtitlesHandler = () => this.toggleSubtitles();
        this.speedDownHandler = () => this.adjustSpeed(-0.25);
        this.speedUpHandler = () => this.adjustSpeed(0.25);
        this.pipHandler = () => this.togglePictureInPicture();
        this.theaterHandler = () => this.toggleTheaterMode();
        this.miniPlayerHandler = () => this.toggleMiniPlayer();
        this.loopHandler = () => this.toggleLoop();
        this.autoplayHandler = () => this.toggleAutoplay();
        this.screenshotHandler = () => this.takeScreenshot();
        this.shareTimestampHandler = () => this.shareWithTimestamp();
        this.playlistHandler = () => this.togglePlaylist();
        this.watchLaterHandler = () => this.toggleWatchLater();
        this.closePlaylistHandler = () => this.closePlaylist();
        this.closeWatchLaterHandler = () => this.closeWatchLater();

        this.addEventListeners();
    }

    static get observedAttributes() {
        return ['embed'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'embed') {
            if (newValue && newValue.includes('src=')) {
                const srcMatch = newValue.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                    this.iframe.src = srcMatch[1];
                } else {
                    console.error('Could not extract src from embed code:', newValue);
                    this.iframe.src = '';
                }
            } else {
                this.iframe.src = newValue || '';
            }
        }
    }

    addEventListeners() {
        this.playPauseBtn.addEventListener('click', this.playPauseHandler);
        this.progressBar.addEventListener('input', this.progressHandler);
        this.volumeBtn.addEventListener('click', this.volumeBtnHandler);
        this.volumeSlider.addEventListener('input', this.volumeSliderHandler);
        this.fullscreenBtn.addEventListener('click', this.fullscreenHandler);

        // New event listeners
        this.qualityBtn.addEventListener('click', this.qualityBtnHandler);
        this.shadowRoot.querySelectorAll('.quality-option').forEach(btn => {
            btn.addEventListener('click', this.qualityOptionHandler);
        });
        this.subtitlesBtn.addEventListener('click', this.subtitlesHandler);
        this.speedDownBtn.addEventListener('click', this.speedDownHandler);
        this.speedUpBtn.addEventListener('click', this.speedUpHandler);
        this.pipBtn.addEventListener('click', this.pipHandler);
        this.theaterBtn.addEventListener('click', this.theaterHandler);
        this.miniPlayerBtn.addEventListener('click', this.miniPlayerHandler);
        this.loopBtn.addEventListener('click', this.loopHandler);
        this.autoplayBtn.addEventListener('click', this.autoplayHandler);
        this.screenshotBtn.addEventListener('click', this.screenshotHandler);
        this.shareTimestampBtn.addEventListener('click', this.shareTimestampHandler);
        this.playlistBtn.addEventListener('click', this.playlistHandler);
        this.watchLaterBtn.addEventListener('click', this.watchLaterHandler);
        this.shadowRoot.querySelector('.close-playlist').addEventListener('click', this.closePlaylistHandler);
        this.shadowRoot.querySelector('.close-watch-later').addEventListener('click', this.closeWatchLaterHandler);

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.shadowRoot.contains(e.target)) {
                this.qualityDropdown.classList.remove('show');
                this.playlistPanel.classList.remove('show');
                this.watchLaterPanel.classList.remove('show');
            }
        });

        // Touch event listeners for gestures
        this.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Device motion for shake gesture
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
        }
    }

    disconnectedCallback() {
        // Remove event listeners
        this.playPauseBtn.removeEventListener('click', this.playPauseHandler);
        this.progressBar.removeEventListener('input', this.progressHandler);
        this.volumeBtn.removeEventListener('click', this.volumeBtnHandler);
        this.volumeSlider.removeEventListener('input', this.volumeSliderHandler);
        this.fullscreenBtn.removeEventListener('click', this.fullscreenHandler);

        // Remove new event listeners
        this.qualityBtn.removeEventListener('click', this.qualityBtnHandler);
        this.shadowRoot.querySelectorAll('.quality-option').forEach(btn => {
            btn.removeEventListener('click', this.qualityOptionHandler);
        });
        this.subtitlesBtn.removeEventListener('click', this.subtitlesHandler);
        this.speedDownBtn.removeEventListener('click', this.speedDownHandler);
        this.speedUpBtn.removeEventListener('click', this.speedUpHandler);
        this.pipBtn.removeEventListener('click', this.pipHandler);
        this.theaterBtn.removeEventListener('click', this.theaterHandler);
        this.miniPlayerBtn.removeEventListener('click', this.miniPlayerHandler);
        this.loopBtn.removeEventListener('click', this.loopHandler);
        this.autoplayBtn.removeEventListener('click', this.autoplayHandler);
        this.screenshotBtn.removeEventListener('click', this.screenshotHandler);
        this.shareTimestampBtn.removeEventListener('click', this.shareTimestampHandler);
        this.playlistBtn.removeEventListener('click', this.playlistHandler);
        this.watchLaterBtn.removeEventListener('click', this.watchLaterHandler);
        this.shadowRoot.querySelector('.close-playlist').removeEventListener('click', this.closePlaylistHandler);
        this.shadowRoot.querySelector('.close-watch-later').removeEventListener('click', this.closeWatchLaterHandler);

        // Remove touch event listeners
        this.removeEventListener('touchstart', this.handleTouchStart);
        this.removeEventListener('touchmove', this.handleTouchMove);
        this.removeEventListener('touchend', this.handleTouchEnd);

        // Remove device motion listener
        if (window.DeviceMotionEvent) {
            window.removeEventListener('devicemotion', this.handleDeviceMotion);
        }
    }

    // Settings management
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('video-player-settings') || '{}');
        this.subtitlesEnabled = settings.subtitlesEnabled || false;
        this.playbackSpeed = settings.playbackSpeed || 1.0;
        this.isLooping = settings.isLooping || false;
        this.autoplayNext = settings.autoplayNext || false;
        this.currentQuality = settings.currentQuality || 'auto';
        this.updateUI();
    }

    saveSettings() {
        const settings = {
            subtitlesEnabled: this.subtitlesEnabled,
            playbackSpeed: this.playbackSpeed,
            isLooping: this.isLooping,
            autoplayNext: this.autoplayNext,
            currentQuality: this.currentQuality
        };
        localStorage.setItem('video-player-settings', JSON.stringify(settings));
    }

    updateUI() {
        this.speedDisplay.textContent = `${this.playbackSpeed}x`;
        this.subtitlesBtn.classList.toggle('active', this.subtitlesEnabled);
        this.loopBtn.classList.toggle('active', this.isLooping);
        this.autoplayBtn.classList.toggle('active', this.autoplayNext);
        this.qualityBtn.textContent = this.currentQuality.toUpperCase();
        this.shadowRoot.querySelectorAll('.quality-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === this.currentQuality);
        });
    }

    // Quality selection
    toggleQualityDropdown() {
        this.qualityDropdown.classList.toggle('show');
    }

    selectQuality(quality) {
        this.currentQuality = quality;
        this.qualityBtn.textContent = quality.toUpperCase();
        this.qualityDropdown.classList.remove('show');
        this.updateUI();
        this.saveSettings();
    }

    // Subtitles toggle
    toggleSubtitles() {
        this.subtitlesEnabled = !this.subtitlesEnabled;
        this.updateUI();
        this.saveSettings();
    }

    // Playback speed control
    adjustSpeed(delta) {
        this.playbackSpeed = Math.max(0.25, Math.min(4.0, this.playbackSpeed + delta));
        this.updateUI();
        this.saveSettings();
    }

    // Picture-in-picture mode
    togglePictureInPicture() {
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
            this.isPiPMode = false;
        } else if (this.iframe.requestPictureInPicture) {
            this.iframe.requestPictureInPicture();
            this.isPiPMode = true;
        }
        this.pipBtn.classList.toggle('active', this.isPiPMode);
    }

    // Theater mode
    toggleTheaterMode() {
        this.isTheaterMode = !this.isTheaterMode;
        this.classList.toggle('theater-mode', this.isTheaterMode);
        this.theaterBtn.classList.toggle('active', this.isTheaterMode);
        if (this.isTheaterMode) {
            this.isMiniPlayer = false;
            this.classList.remove('mini-player');
        }
    }

    // Mini-player mode
    toggleMiniPlayer() {
        this.isMiniPlayer = !this.isMiniPlayer;
        this.classList.toggle('mini-player', this.isMiniPlayer);
        this.miniPlayerBtn.classList.toggle('active', this.isMiniPlayer);
        if (this.isMiniPlayer) {
            this.isTheaterMode = false;
            this.classList.remove('theater-mode');
        }
    }

    // Video loop toggle
    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.updateUI();
        this.saveSettings();
    }

    // Auto-play next video
    toggleAutoplay() {
        this.autoplayNext = !this.autoplayNext;
        this.updateUI();
        this.saveSettings();
    }

    // Screenshot capture (simulated)
    takeScreenshot() {
        showToast('Screenshot saved to gallery');
    }

    // Share with timestamp
    shareWithTimestamp() {
        const currentTime = Math.floor(this.adapter.getCurrentTime());
        const url = `${window.location.href}?t=${currentTime}`;
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link with timestamp copied to clipboard');
        });
    }

    // Playlist functionality
    togglePlaylist() {
        this.playlistPanel.classList.toggle('show');
        this.watchLaterPanel.classList.remove('show');
        if (this.playlistPanel.classList.contains('show')) {
            this.renderPlaylist();
        }
    }

    closePlaylist() {
        this.playlistPanel.classList.remove('show');
    }

    addToPlaylist(video) {
        if (!this.playlist.find(v => v.id === video.id)) {
            this.playlist.push(video);
            this.savePlaylist();
            this.renderPlaylist();
        }
    }

    removeFromPlaylist(videoId) {
        this.playlist = this.playlist.filter(v => v.id !== videoId);
        this.savePlaylist();
        this.renderPlaylist();
    }

    renderPlaylist() {
        this.playlistItems.innerHTML = '';
        this.playlist.forEach((video, index) => {
            const item = document.createElement('div');
            item.className = `playlist-item ${index === this.currentVideoIndex ? 'active' : ''}`;
            item.innerHTML = `
                <img src="${video.thumbnail}" alt="${video.title}">
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${video.title}</div>
                    <div class="playlist-item-duration">${video.duration || ''}</div>
                </div>
                <button class="remove-btn" data-id="${video.id}">×</button>
            `;
            item.addEventListener('click', () => this.playVideoFromPlaylist(index));
            item.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromPlaylist(video.id);
            });
            this.playlistItems.appendChild(item);
        });
    }

    playVideoFromPlaylist(index) {
        this.currentVideoIndex = index;
        const video = this.playlist[index];
        this.setAttribute('embed', video.embed);
        this.renderPlaylist();
    }

    savePlaylist() {
        localStorage.setItem('video-playlist', JSON.stringify(this.playlist));
    }

    loadPlaylist() {
        this.playlist = JSON.parse(localStorage.getItem('video-playlist') || '[]');
    }

    // Watch later queue
    toggleWatchLater() {
        this.watchLaterPanel.classList.toggle('show');
        this.playlistPanel.classList.remove('show');
        if (this.watchLaterPanel.classList.contains('show')) {
            this.renderWatchLater();
        }
    }

    closeWatchLater() {
        this.watchLaterPanel.classList.remove('show');
    }

    addToWatchLater(video) {
        if (!this.watchLaterQueue.find(v => v.id === video.id)) {
            this.watchLaterQueue.push(video);
            this.saveWatchLater();
            this.renderWatchLater();
        }
    }

    removeFromWatchLater(videoId) {
        this.watchLaterQueue = this.watchLaterQueue.filter(v => v.id !== videoId);
        this.saveWatchLater();
        this.renderWatchLater();
    }

    renderWatchLater() {
        this.watchLaterItems.innerHTML = '';
        this.watchLaterQueue.forEach(video => {
            const item = document.createElement('div');
            item.className = 'watch-later-item';
            item.innerHTML = `
                <img src="${video.thumbnail}" alt="${video.title}">
                <div class="watch-later-item-info">
                    <div class="watch-later-item-title">${video.title}</div>
                    <div class="watch-later-item-duration">${video.duration || ''}</div>
                </div>
                <button class="remove-btn" data-id="${video.id}">×</button>
            `;
            item.addEventListener('click', () => this.playFromWatchLater(video));
            item.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromWatchLater(video.id);
            });
            this.watchLaterItems.appendChild(item);
        });
    }

    playFromWatchLater(video) {
        this.setAttribute('embed', video.embed);
        this.removeFromWatchLater(video.id);
    }

    saveWatchLater() {
        localStorage.setItem('watch-later-queue', JSON.stringify(this.watchLaterQueue));
    }

    loadWatchLater() {
        this.watchLaterQueue = JSON.parse(localStorage.getItem('watch-later-queue') || '[]');
    }

    // Gesture utility methods
    getDistance(touch1, touch2) {
        return Math.sqrt((touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2);
    }

    isCircularGesture(path) {
        if (path.length < 10) return false;
        const center = path.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        center.x /= path.length;
        center.y /= path.length;
        const radius = path.reduce((acc, p) => acc + Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2), 0) / path.length;
        const variance = path.reduce((acc, p) => acc + (Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2) - radius) ** 2, 0) / path.length;
        return variance < 1000;
    }

    applyZoom() {
        this.iframe.style.transform = `scale(${this.touchState.zoomLevel})`;
        this.iframe.style.transformOrigin = 'center center';
    }

    applyBrightness() {
        const overlay = this.shadowRoot.querySelector('.brightness-overlay');
        overlay.style.background = `rgba(0,0,0,${1 - this.touchState.brightness})`;
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        const touches = e.touches;
        this.touchState.startTime = Date.now();
        this.touchState.startX = touches[0].clientX;
        this.touchState.startY = touches[0].clientY;
        this.touchState.touches = Array.from(touches);
        if (touches.length === 2) {
            this.touchState.isPinching = true;
            this.touchState.pinchStartDistance = this.getDistance(touches[0], touches[1]);
        } else {
            this.touchState.isPinching = false;
        }
        // Long press timer
        this.touchState.longPressTimer = setTimeout(() => {
            this.handleLongPress();
        }, 500);
        // Tap count
        const now = Date.now();
        if (now - this.touchState.lastTapTime < 300) {
            this.touchState.tapCount++;
        } else {
            this.touchState.tapCount = 1;
        }
        this.touchState.lastTapTime = now;
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touches = e.touches;
        if (touches.length === 2 && this.touchState.isPinching) {
            const distance = this.getDistance(touches[0], touches[1]);
            const scale = distance / this.touchState.pinchStartDistance;
            this.touchState.zoomLevel = Math.max(0.5, Math.min(2, this.touchState.zoomLevel * scale));
            this.applyZoom();
            this.touchState.pinchStartDistance = distance;
        } else if (touches.length === 1) {
            const deltaX = touches[0].clientX - this.touchState.startX;
            const deltaY = touches[0].clientY - this.touchState.startY;
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                clearTimeout(this.touchState.longPressTimer);
                this.touchState.isSwiping = true;
                this.touchState.circularPath.push({ x: touches[0].clientX, y: touches[0].clientY });
            }
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        clearTimeout(this.touchState.longPressTimer);
        const touches = e.changedTouches;
        const endTime = Date.now();
        const duration = endTime - this.touchState.startTime;
        if (!this.touchState.isSwiping && duration < 300) {
            // Tap gestures
            if (this.touchState.tapCount === 2) {
                this.domain.togglePlayPause();
                showToast('Play/Pause');
            } else if (this.touchState.tapCount === 3) {
                this.domain.toggleFullscreen();
                showToast('Fullscreen toggled');
            }
        } else if (this.touchState.isSwiping) {
            const deltaX = touches[0].clientX - this.touchState.startX;
            const deltaY = touches[0].clientY - this.touchState.startY;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe - seek
                if (Math.abs(deltaX) > 50) {
                    const seekAmount = deltaX > 0 ? 10 : -10;
                    this.domain.seek(this.adapter.getCurrentTime() + seekAmount);
                    showToast(`Seek ${seekAmount > 0 ? '+' : ''}${seekAmount}s`);
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > 50) {
                    if (this.touchState.touches.length === 1) {
                        // Volume
                        const volumeChange = deltaY > 0 ? -0.1 : 0.1;
                        this.adapter.volume = Math.max(0, Math.min(1, this.adapter.volume + volumeChange));
                        showToast(`Volume ${(this.adapter.volume * 100).toFixed(0)}%`);
                    } else if (this.touchState.touches.length === 2) {
                        // Brightness
                        const brightnessChange = deltaY > 0 ? -0.1 : 0.1;
                        this.touchState.brightness = Math.max(0.1, Math.min(1, this.touchState.brightness + brightnessChange));
                        this.applyBrightness();
                        showToast(`Brightness ${Math.round(this.touchState.brightness * 100)}%`);
                    }
                }
            }
            // Check circular
            if (this.isCircularGesture(this.touchState.circularPath)) {
                this.toggleLoop();
                showToast('Loop toggled');
            }
        }
        // Reset
        this.touchState.isSwiping = false;
        this.touchState.circularPath = [];
        this.touchState.touches = [];
    }

    handleLongPress() {
        this.showSpeedControl();
    }

    handleDeviceMotion(e) {
        const acceleration = e.accelerationIncludingGravity;
        const now = Date.now();
        if (now - this.touchState.lastShakeTime > 100) {
            const totalAcceleration = Math.sqrt(
                acceleration.x * acceleration.x +
                acceleration.y * acceleration.y +
                acceleration.z * acceleration.z
            );
            if (totalAcceleration > 25) {
                this.touchState.shakeCount++;
                if (this.touchState.shakeCount > 3) {
                    this.handleShake();
                    this.touchState.shakeCount = 0;
                }
            } else {
                this.touchState.shakeCount = 0;
            }
            this.touchState.lastShakeTime = now;
        }
    }

    handleShake() {
        if (this.playlist.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.playlist.length);
            this.playVideoFromPlaylist(randomIndex);
            showToast('Playing random video from playlist');
        } else {
            showToast('No playlist available for random navigation');
        }
    }

    showSpeedControl() {
        const overlay = document.createElement('div');
        overlay.className = 'gesture-overlay';
        overlay.innerHTML = `
            <div class="speed-control-overlay">
                <span>Playback Speed: ${this.playbackSpeed}x</span>
                <input type="range" min="0.25" max="4" step="0.25" value="${this.playbackSpeed}">
            </div>
        `;
        this.shadowRoot.appendChild(overlay);
        const slider = overlay.querySelector('input');
        const display = overlay.querySelector('span');
        slider.addEventListener('input', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
            display.textContent = `Playback Speed: ${this.playbackSpeed}x`;
            this.updateUI();
        });
        slider.addEventListener('change', () => {
            this.saveSettings();
            setTimeout(() => {
                if (this.shadowRoot.contains(overlay)) {
                    this.shadowRoot.removeChild(overlay);
                }
            }, 2000);
        });
    }

    // Initialize component
    connectedCallback() {
        this.loadPlaylist();
        this.loadWatchLater();
    }
}

customElements.define('video-player', VideoPlayer);

export { VideoPlayer };
