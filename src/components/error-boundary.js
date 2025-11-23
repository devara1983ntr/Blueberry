class ErrorBoundary extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .error {
                    background-color: var(--card-background, #1a1a1a);
                    color: var(--text-color, #ffffff);
                    border: 1px solid #f44336;
                    border-radius: 8px;
                    padding: 1rem;
                    text-align: center;
                }
                .error h3 {
                    color: #f44336;
                    margin: 0 0 0.5rem 0;
                }
                .error p {
                    margin: 0.5rem 0;
                }
                .retry-btn {
                    background-color: var(--accent-color, #e94560);
                    color: var(--text-color, #ffffff);
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-top: 0.5rem;
                }
                .retry-btn:hover {
                    background-color: #d43d51;
                }
                .content {
                    display: block;
                }
                :host([error]) .content {
                    display: none;
                }
                :host([error]) .error {
                    display: block;
                }
                .error {
                    display: none;
                }
            </style>
            <div class="content">
                <slot></slot>
            </div>
            <div class="error">
                <h3>Something went wrong</h3>
                <p class="error-message"></p>
                <button class="retry-btn">Try Again</button>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.errorMessageEl = this.shadowRoot.querySelector('.error-message');
        this.retryBtn = this.shadowRoot.querySelector('.retry-btn');

        this.retryBtn.addEventListener('click', () => this.retry());
    }

    connectedCallback() {
        this.updateErrorState();
    }

    static get observedAttributes() {
        return ['error'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'error') {
            this.updateErrorState();
        }
    }

    updateErrorState() {
        const error = this.getAttribute('error');
        if (error) {
            this.errorMessageEl.textContent = error;
        }
    }

    retry() {
        this.removeAttribute('error');
        this.dispatchEvent(new CustomEvent('error-boundary-retry'));
    }

    // Method to set error programmatically
    setError(message) {
        this.setAttribute('error', message);
    }

    clearError() {
        this.removeAttribute('error');
    }
}

customElements.define('error-boundary', ErrorBoundary);