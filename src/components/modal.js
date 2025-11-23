class Modal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    display: none;
                    align-items: center;
                    justify-content: center;
                }
                .overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(2px);
                }
                .modal {
                    background-color: var(--card-background, #1a1a1a);
                    color: var(--text-color, #ffffff);
                    border-radius: 8px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                    transform: scale(0.9);
                    opacity: 0;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }
                :host(.open) .modal {
                    transform: scale(1);
                    opacity: 1;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid var(--secondary-color, #16213e);
                }
                .title {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: bold;
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-color, #ffffff);
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                }
                .close-btn:hover {
                    background-color: var(--secondary-color, #16213e);
                }
                .body {
                    padding: 1rem;
                }
                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                    padding: 1rem;
                    border-top: 1px solid var(--secondary-color, #16213e);
                }
                button {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.3s;
                }
                .btn-primary {
                    background-color: var(--accent-color, #e94560);
                    color: var(--text-color, #ffffff);
                }
                .btn-primary:hover {
                    background-color: #d43d51;
                }
                .btn-secondary {
                    background-color: var(--secondary-color, #16213e);
                    color: var(--text-color, #ffffff);
                }
                .btn-secondary:hover {
                    background-color: #0f1419;
                }
            </style>
            <div class="overlay"></div>
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="header">
                    <h2 id="modal-title" class="title"><slot name="title">Modal Title</slot></h2>
                    <button class="close-btn" aria-label="Close modal">&times;</button>
                </div>
                <div class="body">
                    <slot name="body">Modal content goes here.</slot>
                </div>
                <div class="actions">
                    <slot name="actions">
                        <button class="btn-secondary" data-action="cancel">Cancel</button>
                        <button class="btn-primary" data-action="confirm">OK</button>
                    </slot>
                </div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.overlay = this.shadowRoot.querySelector('.overlay');
        this.modal = this.shadowRoot.querySelector('.modal');
        this.closeBtn = this.shadowRoot.querySelector('.close-btn');

        this.overlay.addEventListener('click', () => this.close());
        this.closeBtn.addEventListener('click', () => this.close());

        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="cancel"]')) {
                this.close();
            }
            if (e.target.matches('[data-action="confirm"]')) {
                this.confirm();
            }
        });

        this.focusableElements = [];
        this.firstFocusable = null;
        this.lastFocusable = null;
    }

    connectedCallback() {
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleKeydown(e) {
        if (!this.classList.contains('open')) return;

        if (e.key === 'Escape') {
            this.close();
        } else if (e.key === 'Tab') {
            this.trapFocus(e);
        }
    }

    trapFocus(e) {
        if (this.focusableElements.length === 0) {
            this.updateFocusableElements();
        }

        if (e.shiftKey) {
            if (document.activeElement === this.firstFocusable) {
                this.lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === this.lastFocusable) {
                this.firstFocusable.focus();
                e.preventDefault();
            }
        }
    }

    updateFocusableElements() {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(this.shadowRoot.querySelectorAll(focusableSelectors));
        this.firstFocusable = this.focusableElements[0];
        this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    }

    open() {
        this.style.display = 'flex';
        this.classList.add('open');
        this.updateFocusableElements();
        if (this.firstFocusable) {
            this.firstFocusable.focus();
        }
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.classList.remove('open');
        setTimeout(() => {
            this.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
        this.dispatchEvent(new CustomEvent('modal-closed'));
    }

    confirm() {
        this.dispatchEvent(new CustomEvent('modal-confirmed'));
        this.close();
    }
}

customElements.define('blueberry-modal', Modal);