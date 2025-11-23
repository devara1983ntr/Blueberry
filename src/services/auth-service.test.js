import { login, register, logout, onAuthStateChange, getCurrentUser } from './auth-service.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Mock the Firebase auth module
jest.mock('firebase/auth');
jest.mock('../config/firebase.js', () => ({
  auth: {
    currentUser: null,
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth currentUser
    require('../config/firebase.js').auth.currentUser = null;
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUserCredential = { user: { uid: '123', email: 'test@example.com' } };
      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await login('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        require('../config/firebase.js').auth,
        'test@example.com',
        'password123'
      );
      expect(result).toBe(mockUserCredential);
    });

    it('should throw error for missing email', async () => {
      await expect(login('', 'password123')).rejects.toThrow('Email and password are required');
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should throw error for missing password', async () => {
      await expect(login('test@example.com', '')).rejects.toThrow('Email and password are required');
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle user not found error', async () => {
      const error = { code: 'auth/user-not-found' };
      signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(login('test@example.com', 'password123')).rejects.toThrow(
        'No account found with this email address. Please check your email or sign up.'
      );
    });

    it('should handle wrong password error', async () => {
      const error = { code: 'auth/wrong-password' };
      signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Incorrect password. Please try again.'
      );
    });

    it('should handle invalid email error', async () => {
      const error = { code: 'auth/invalid-email' };
      signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(login('invalid-email', 'password123')).rejects.toThrow(
        'Invalid email address format.'
      );
    });

    it('should handle user disabled error', async () => {
      const error = { code: 'auth/user-disabled' };
      signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(login('test@example.com', 'password123')).rejects.toThrow(
        'This account has been disabled. Please contact support.'
      );
    });

    it('should handle too many requests error', async () => {
      const error = { code: 'auth/too-many-requests' };
      signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(login('test@example.com', 'password123')).rejects.toThrow(
        'Too many failed login attempts. Please try again later.'
      );
    });

    it('should handle network error', async () => {
      const error = { code: 'auth/network-request-failed' };
      signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(login('test@example.com', 'password123')).rejects.toThrow(
        'Network error. Please check your connection and try again.'
      );
    });

    it('should handle generic login error', async () => {
      const error = { message: 'Generic error' };
      signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(login('test@example.com', 'password123')).rejects.toThrow(
        'Login failed: Generic error'
      );
    });
  });

  describe('register', () => {
    it('should register successfully with valid credentials', async () => {
      const mockUserCredential = { user: { uid: '123', email: 'test@example.com' } };
      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await register('test@example.com', 'password123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        require('../config/firebase.js').auth,
        'test@example.com',
        'password123'
      );
      expect(result).toBe(mockUserCredential);
    });

    it('should throw error for password too short', async () => {
      await expect(register('test@example.com', '12345')).rejects.toThrow(
        'Password must be at least 6 characters long'
      );
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle email already in use error', async () => {
      const error = { code: 'auth/email-already-in-use' };
      createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(register('test@example.com', 'password123')).rejects.toThrow(
        'An account with this email already exists. Please try logging in instead.'
      );
    });

    it('should handle weak password error', async () => {
      const error = { code: 'auth/weak-password' };
      createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(register('test@example.com', '123')).rejects.toThrow(
        'Password is too weak. Please choose a stronger password.'
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      signOut.mockResolvedValue();

      await expect(logout()).resolves.toBeUndefined();
      expect(signOut).toHaveBeenCalledWith(require('../config/firebase.js').auth);
    });

    it('should handle network error during logout', async () => {
      const error = { code: 'auth/network-request-failed' };
      signOut.mockRejectedValue(error);

      await expect(logout()).rejects.toThrow(
        'Network error during logout. You may still be logged in.'
      );
    });

    it('should handle generic logout error', async () => {
      const error = { message: 'Generic logout error' };
      signOut.mockRejectedValue(error);

      await expect(logout()).rejects.toThrow('Logout failed: Generic logout error');
    });
  });

  describe('onAuthStateChange', () => {
    it('should call onAuthStateChanged with auth and callback', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      onAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const result = onAuthStateChange(mockCallback);

      expect(onAuthStateChanged).toHaveBeenCalledWith(
        require('../config/firebase.js').auth,
        mockCallback
      );
      expect(result).toBe(mockUnsubscribe);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from auth', () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      require('../config/firebase.js').auth.currentUser = mockUser;

      const result = getCurrentUser();

      expect(result).toBe(mockUser);
    });

    it('should return null when no user is logged in', () => {
      require('../config/firebase.js').auth.currentUser = null;

      const result = getCurrentUser();

      expect(result).toBeNull();
    });
  });
});