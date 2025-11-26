// BlueberryInput
class BlueberryInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .input-container {
                    position: relative;
                }
                input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--secondary-color, #16213e);
                    border-radius: 4px;
                    background-color: var(--card-background, #1a1a1a);
                    color: var(--text-color, #ffffff);
                    font-size: 1rem;
                    box-sizing: border-box;
                    transition: border-color 0.3s;
                }
                input:focus {
                    outline: none;
                    border-color: var(--accent-color, #e94560);
                }
                input::placeholder {
                    color: var(--gray-color, #b0b0b0);
                }
                .label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                    color: var(--text-color, #ffffff);
                }
                .error {
                    color: #f44336;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }
            </style>
            <div class="input-container">
                <label class="label" for="input"></label>
                <input id="input" type="text">
                <div class="error"></div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.input = this.shadowRoot.querySelector('input');
        this.labelEl = this.shadowRoot.querySelector('.label');
        this.errorEl = this.shadowRoot.querySelector('.error');
    }

    connectedCallback() {
        // Link the label to the input
        const inputId = 'input-' + Math.random().toString(36).substr(2, 9);
        this.input.id = inputId;
        this.labelEl.setAttribute('for', inputId);

        this.input.addEventListener('input', () => this.dispatchEvent(new Event('input')));
        this.input.addEventListener('change', () => this.dispatchEvent(new Event('change')));
    }

    static get observedAttributes() {
        return ['type', 'placeholder', 'value', 'disabled', 'error', 'label'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'type') {
            this.input.type = newValue || 'text';
        } else if (name === 'label') {
            this.labelEl.textContent = newValue;
        } else if (name === 'placeholder') {
            this.input.placeholder = newValue || '';
        } else if (name === 'value') {
            this.input.value = newValue || '';
        } else if (name === 'disabled') {
            this.input.disabled = this.hasAttribute('disabled');
        } else if (name === 'error') {
            this.errorEl.textContent = newValue || '';
        }
    }

    get value() {
        return this.input.value;
    }

    set value(val) {
        this.input.value = val;
        this.setAttribute('value', val);
    }
}

customElements.define('blueberry-input', BlueberryInput);

// BlueberryButton
class BlueberryButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                button {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    background-color: var(--accent-color, #e94560);
                    color: var(--text-color, #ffffff);
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    display: inline-block;
                }
                button:hover:not(:disabled) {
                    background-color: #d43d51;
                }
                button:disabled {
                    background-color: var(--gray-color, #b0b0b0);
                    cursor: not-allowed;
                }
                button.secondary {
                    background-color: var(--secondary-color, #16213e);
                }
                button.secondary:hover:not(:disabled) {
                    background-color: #0f1419;
                }
            </style>
            <button><slot></slot></button>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.button = this.shadowRoot.querySelector('button');
        this.button.addEventListener('click', () => this.dispatchEvent(new Event('click')));
    }

    static get observedAttributes() {
        return ['disabled', 'variant'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'disabled') {
            this.button.disabled = this.hasAttribute('disabled');
        } else if (name === 'variant') {
            this.button.className = newValue || '';
        }
    }
}

customElements.define('blueberry-button', BlueberryButton);

// BlueberrySelect
class BlueberrySelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .select-container {
                    position: relative;
                }
                select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--secondary-color, #16213e);
                    border-radius: 4px;
                    background-color: var(--card-background, #1a1a1a);
                    color: var(--text-color, #ffffff);
                    font-size: 1rem;
                    box-sizing: border-box;
                    transition: border-color 0.3s;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 0.5rem center;
                    background-repeat: no-repeat;
                    background-size: 1.5em 1.5em;
                    padding-right: 2.5rem;
                }
                select:focus {
                    outline: none;
                    border-color: var(--accent-color, #e94560);
                }
                .label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                    color: var(--text-color, #ffffff);
                }
                .error {
                    color: #f44336;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }
            </style>
            <div class="select-container">
                <label class="label" for="select"></label>
                <select id="select">
                    <slot></slot>
                </select>
                <div class="error"></div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.select = this.shadowRoot.querySelector('select');
        this.errorEl = this.shadowRoot.querySelector('.error');
    }

    connectedCallback() {
        this.select.addEventListener('change', () => this.dispatchEvent(new Event('change')));
    }

    static get observedAttributes() {
        return ['value', 'disabled', 'error', 'label'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value') {
            this.select.value = newValue || '';
        } else if (name === 'label') {
            this.shadowRoot.querySelector('.label').textContent = newValue;
        } else if (name === 'disabled') {
            this.select.disabled = this.hasAttribute('disabled');
        } else if (name === 'error') {
            this.errorEl.textContent = newValue || '';
        }
    }

    get value() {
        return this.select.value;
    }

    set value(val) {
        this.select.value = val;
        this.setAttribute('value', val);
    }
}

customElements.define('blueberry-select', BlueberrySelect);

// BlueberryTextarea
class BlueberryTextarea extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--secondary-color, #16213e);
                    border-radius: 4px;
                    background-color: var(--card-background, #1a1a1a);
                    color: var(--text-color, #ffffff);
                    font-size: 1rem;
                    box-sizing: border-box;
                    transition: border-color 0.3s;
                    resize: vertical;
                    min-height: 100px;
                }
                textarea:focus {
                    outline: none;
                    border-color: var(--accent-color, #e94560);
                }
                textarea::placeholder {
                    color: var(--gray-color, #b0b0b0);
                }
                .label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                    color: var(--text-color, #ffffff);
                }
                .error {
                    color: #f44336;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }
            </style>
            <div>
                <label class="label" for="textarea"></label>
                <textarea id="textarea"></textarea>
                <div class="error"></div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.textarea = this.shadowRoot.querySelector('textarea');
        this.errorEl = this.shadowRoot.querySelector('.error');
    }

    connectedCallback() {
        this.textarea.addEventListener('input', () => this.dispatchEvent(new Event('input')));
        this.textarea.addEventListener('change', () => this.dispatchEvent(new Event('change')));
    }

    static get observedAttributes() {
        return ['placeholder', 'value', 'disabled', 'rows', 'error', 'label'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'placeholder') {
            this.textarea.placeholder = newValue || '';
        } else if (name === 'label') {
            this.shadowRoot.querySelector('.label').textContent = newValue;
        } else if (name === 'value') {
            this.textarea.value = newValue || '';
        } else if (name === 'disabled') {
            this.textarea.disabled = this.hasAttribute('disabled');
        } else if (name === 'rows') {
            this.textarea.rows = newValue || 3;
        } else if (name === 'error') {
            this.errorEl.textContent = newValue || '';
        }
    }

    get value() {
        return this.textarea.value;
    }

    set value(val) {
        this.textarea.value = val;
        this.setAttribute('value', val);
    }
}

customElements.define('blueberry-textarea', BlueberryTextarea);