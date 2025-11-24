export class Toast extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: none;
                }
                .toast {
                    background-color: var(--card-background, #1a1a1a);
                    color: var(--text-color, #ffffff);
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    max-width: 300px;
                    opacity: 0;
                    transform: translateY(100%);
                    transition: opacity 0.3s ease, transform 0.3s ease;
                    border-left: 4px solid var(--accent-color, #e94560);
                }
                .toast.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .toast.success {
                    border-left-color: #4caf50;
                }
                .toast.error {
                    border-left-color: #f44336;
                }
                .toast.warning {
                    border-left-color: #ff9800;
                }
                .toast.info {
                    border-left-color: var(--accent-color, #e94560);
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-color, #ffffff);
                    font-size: 1.2rem;
                    cursor: pointer;
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    opacity: 0.7;
                }
                .close-btn:hover {
                    opacity: 1;
                }
            </style>
            <div class="toast" role="alert" aria-live="assertive">
                <button class="close-btn" aria-label="Close notification">&times;</button>
                <div class="message"></div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.toast = this.shadowRoot.querySelector('.toast');
        this.messageEl = this.shadowRoot.querySelector('.message');
        this.closeBtn = this.shadowRoot.querySelector('.close-btn');

        this.closeBtn.addEventListener('click', () => this.hide());
        this.timeoutId = null;
    }

    connectedCallback() {
        // Auto-hide after 5 seconds if shown
        if (this.hasAttribute('show')) {
            this.show();
        }
    }

    disconnectedCallback() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }

    show(message = '', type = 'info', duration = 5000) {
        this.messageEl.textContent = message;
        this.toast.className = `toast ${type}`;
        this.style.display = 'block';
        // Force reflow
        this.toast.offsetHeight;
        this.toast.classList.add('show');

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (duration > 0) {
            this.timeoutId = setTimeout(() => this.hide(), duration);
        }
    }

    hide() {
        this.toast.classList.remove('show');
        setTimeout(() => {
            this.style.display = 'none';
        }, 300); // Match transition duration
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    static showToast(message, type = 'info', duration = 5000) {
        let toast = document.querySelector('blueberry-toast');
        if (!toast) {
            toast = document.createElement('blueberry-toast');
            document.body.appendChild(toast);
        }
        toast.show(message, type, duration);
    }
}

customElements.define('blueberry-toast', Toast);

export function showToast(message, type = 'info', duration = 5000) {
    Toast.showToast(message, type, duration);
}
