export class AgeVerificationModal extends HTMLElement {
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
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .modal-content {
          background: #141414;
          padding: 3rem;
          border-radius: 8px;
          text-align: center;
          max-width: 500px;
          width: 90%;
          border: 1px solid #333;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        h1 {
          color: #fff;
          margin-bottom: 1rem;
          font-family: sans-serif;
        }

        p {
          color: #a3a3a3;
          margin-bottom: 2rem;
          line-height: 1.6;
          font-family: sans-serif;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        button {
          padding: 12px 24px;
          border-radius: 4px;
          border: none;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .btn-confirm {
          background-color: #e50914;
          color: white;
        }

        .btn-confirm:hover {
          background-color: #b2070f;
        }

        .btn-exit {
          background-color: transparent;
          border: 1px solid #666;
          color: #ccc;
        }

        .btn-exit:hover {
          border-color: #fff;
          color: #fff;
        }
      </style>

      <div class="modal-content">
        <h1>Age Restricted Content</h1>
        <p>
          This website contains material that is restricted to adults.
          By entering, you confirm that you are at least 18 years of age
          or the age of majority in your jurisdiction.
        </p>
        <div class="actions">
          <button class="btn-confirm" id="confirm-btn">I am 18 or older - Enter</button>
          <button class="btn-exit" id="exit-btn">I am under 18 - Exit</button>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('confirm-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('verified'));
    });

    this.shadowRoot.getElementById('exit-btn').addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });
  }
}

customElements.define('age-verification-modal', AgeVerificationModal);
