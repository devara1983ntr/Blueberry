class LoadingSpinner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    width: 40px;
                    height: 40px;
                }
                .spinner {
                    width: 100%;
                    height: 100%;
                    border: 3px solid var(--secondary-color, #16213e);
                    border-top: 3px solid var(--accent-color, #e94560);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                :host([size="small"]) {
                    width: 20px;
                    height: 20px;
                }
                :host([size="small"]) .spinner {
                    border-width: 2px;
                }
                :host([size="large"]) {
                    width: 60px;
                    height: 60px;
                }
                :host([size="large"]) .spinner {
                    border-width: 4px;
                }
            </style>
            <div class="spinner" role="status" aria-label="Loading"></div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        // No additional setup needed
    }

    static get observedAttributes() {
        return ['size'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'size') {
            // Size is handled via CSS
        }
    }
}

customElements.define('loading-spinner', LoadingSpinner);