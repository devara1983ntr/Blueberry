// src/utils/age-verification.js
// Handles age verification for adult content

const STORAGE_KEY = 'ageVerified';
const MIN_AGE = 18;

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
 * Verifies user's age based on birth date.
 * @param {Date|string} birthDate - User's birth date
 * @returns {boolean} True if age >= 18, false otherwise
 */
export function verifyAge(birthDate) {
  if (!birthDate) {
    throw new Error('Birth date is required');
  }

  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) {
      throw new Error('Invalid birth date format');
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= MIN_AGE;
  } catch (error) {
    console.error('Error verifying age:', error);
    throw new Error(`Failed to verify age: ${error.message}`);
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
    throw new Error(`Failed to set age verification: ${error.message}`);
  }
}

/**
 * Prompts user for age verification.
 * @returns {Promise<boolean>} True if verified, false if not
 */
export async function promptAgeVerification() {
  const birthDate = prompt('Please enter your birth date (YYYY-MM-DD) to verify you are 18+:');
  if (!birthDate) {
    return false;
  }

  try {
    const isVerified = verifyAge(birthDate);
    if (isVerified) {
      setAgeVerified(true);
    }
    return isVerified;
  } catch (error) {
    alert('Invalid date format. Please use YYYY-MM-DD.');
    return false;
  }
}