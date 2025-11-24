export class LimitReachedBanner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                width: 100%;
                margin: 2rem 0;
            }
            .banner {
                background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
                border: 1px solid #333;
                border-left: 5px solid #e50914;
                padding: 2rem;
                border-radius: 8px;
                text-align: center;
                color: #fff;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            h2 {
                margin: 0 0 1rem 0;
                font-family: sans-serif;
                font-size: 1.5rem;
            }
            p {
                color: #a3a3a3;
                margin-bottom: 1.5rem;
                font-family: sans-serif;
            }
            .btn {
                background-color: #e50914;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
                font-family: sans-serif;
                display: inline-block;
                transition: background-color 0.2s;
            }
            .btn:hover {
                background-color: #b2070f;
            }
        </style>
        <div class="banner">
            <h2>Guest Access Limit Reached</h2>
            <p>You have viewed the maximum number of videos available for guests (3,000). To unlock full access to over 120,000 videos, please log in or sign up.</p>
            <a href="login.html" class="btn">Log In / Sign Up</a>
        </div>
        `;
    }
}

customElements.define('limit-reached-banner', LimitReachedBanner);
