// src/utils/age-verification.js
// Handles age verification for adult content

const STORAGE_KEY = 'ageVerified';

/**
 * Checks if the user has been age verified.
 * @returns {boolean} True if verified, false otherwise
 */
export function isAgeVerified() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch (error) {
    console.error('Error checking age verification:', error);
    return false;
  }
}

/**
 * Sets age verification status.
 * @param {boolean} verified - Verification status
 * @returns {void}
 */
export function setAgeVerified(verified) {
  try {
    localStorage.setItem(STORAGE_KEY, verified ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting age verification:', error);
  }
}

/**
 * Initializes the age verification check.
 * If not verified, injects the modal into the DOM.
 */
export async function initAgeVerification() {
  if (isAgeVerified()) {
    return;
  }

  // Dynamic import to avoid loading the component if not needed
  await import('../components/age-verification-modal.js');

  const modal = document.createElement('age-verification-modal');
  document.body.appendChild(modal);

  // Prevent scrolling on body while modal is open
  document.body.style.overflow = 'hidden';

  return new Promise((resolve) => {
    modal.addEventListener('verified', () => {
      setAgeVerified(true);
      document.body.removeChild(modal);
      document.body.style.overflow = ''; // Restore scrolling
      resolve(true);
    });
  });
}
