import { login, register, logout, onAuthStateChange, getCurrentUser } from './auth-service.js';

// Mock global firebase
global.firebase = {
  auth: jest.fn(() => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    currentUser: { uid: '123', email: 'test@example.com' }
  }))
};

// Mock config
jest.mock('../config/firebase.js', () => ({
  auth: global.firebase.auth()
}));

describe('Auth Service', () => {
  let mockAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = global.firebase.auth();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUserCredential = { user: { uid: '123', email: 'test@example.com' } };
      mockAuth.signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await login('test@example.com', 'password');

      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result).toEqual(mockUserCredential);
    });

    it('should throw error for missing credentials', async () => {
      await expect(login('', 'password')).rejects.toThrow('Email and password are required');
    });

    it('should handle login error', async () => {
      const error = { code: 'auth/user-not-found', message: 'User not found' };
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(login('test@example.com', 'password')).rejects.toThrow('No account found with this email address. Please check your email or sign up.');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUserCredential = { user: { uid: '123', email: 'test@example.com' } };
      mockAuth.createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await register('test@example.com', 'password123');

      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result).toEqual(mockUserCredential);
    });

    it('should throw error for weak password', async () => {
      await expect(register('test@example.com', '123')).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should handle registration error', async () => {
      const error = { code: 'auth/email-already-in-use', message: 'Email in use' };
      mockAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(register('test@example.com', 'password123')).rejects.toThrow('An account with this email already exists. Please try logging in instead.');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockAuth.signOut.mockResolvedValue();

      await logout();

      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('should handle logout error', async () => {
      const error = { code: 'unknown', message: 'Unknown error' };
      mockAuth.signOut.mockRejectedValue(error);

      await expect(logout()).rejects.toThrow('Logout failed: Unknown error');
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state listener', () => {
      const callback = jest.fn();
      mockAuth.onAuthStateChanged.mockReturnValue(jest.fn());

      onAuthStateChange(callback);

      expect(mockAuth.onAuthStateChanged).toHaveBeenCalledWith(callback);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const user = getCurrentUser();
      expect(user).toEqual({ uid: '123', email: 'test@example.com' });
    });
  });
});
