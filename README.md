# Blueberry

A modern, responsive Progressive Web App (PWA) for adult video streaming, built with vanilla JavaScript, HTML5, and CSS3. The application leverages Firebase for backend services including authentication, data storage, and analytics, providing a seamless user experience across devices.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact Information](#contact-information)

## Features

- **Responsive Design**: Optimized user interface for desktop, tablet, and mobile devices
- **Progressive Web App (PWA)**: Offline support with service worker caching for enhanced performance
- **Firebase Integration**: Comprehensive backend services including authentication, Firestore database, and analytics
- **User Authentication**: Secure login and registration system with Firebase Auth
- **Personalized Experience**: Favorites, watch history, and recommendation system based on user behavior
- **Search Functionality**: Advanced video search with filtering capabilities
- **Multi-language Support**: Internationalization support for multiple languages
- **Age Verification**: Built-in age verification system for content access control
- **SEO Optimized**: Meta tags and structured data for improved search engine visibility
- **Performance Focused**: Code splitting, lazy loading, and optimized asset delivery
- **Error Monitoring**: Automatic error logging and reporting to Firebase
- **Accessibility**: WCAG compliant components and keyboard navigation support

## Technology Stack

### Frontend
- **JavaScript (ES6+)**: Modern JavaScript with modules and async/await
- **HTML5**: Semantic markup and accessibility features
- **CSS3**: Responsive design with custom properties and animations

### Backend & Services
- **Firebase**:
  - **Authentication**: User management and security
  - **Firestore**: NoSQL database for user data and content
  - **Analytics**: User behavior tracking and insights
  - **Hosting**: Static file hosting with CDN

### Development Tools
- **Babel**: JavaScript transpilation for browser compatibility
- **Jest**: Unit testing framework with JSDOM environment
- **HTTP Server**: Development server for local testing
- **Clean CSS**: CSS minification and optimization

### Progressive Web App
- **Service Worker**: Offline caching and background sync
- **Web App Manifest**: Installable app experience
- **Push Notifications**: User engagement features

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Firebase project with Firestore, Authentication, and Analytics enabled

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Roshan8800/Blue-berry.git
   cd blueberry
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Analytics services
   - Copy your Firebase configuration from Project Settings > General > Your apps > Web app

4. **Set up environment variables**:
   Create a `.env` file in the root directory with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **Start development server**:
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:8080`

## Usage

### For Users

1. **Browse Content**: Navigate through trending videos on the homepage
2. **Search Videos**: Use the search bar to find specific content
3. **User Account**: Register or login to access personalized features
4. **Favorites**: Add videos to your favorites list for quick access
5. **Watch History**: Track your viewing history
6. **Recommendations**: Receive personalized video suggestions
7. **Offline Viewing**: Access cached content when offline
8. **Settings**: Customize your experience through user settings

### For Developers

- **Development Server**: `npm start` - Launches local development server
- **Testing**: `npm test` - Runs the test suite
- **Build Production**: `npm run build` - Creates optimized production build
- **Code Linting**: Ensure code quality with integrated linting

## Architecture

The application follows a modular, hexagonal architecture pattern with clear separation of concerns:

```
blueberry/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── category-grid.js
│   │   ├── error-boundary.js
│   │   ├── form-elements.js
│   │   ├── loading-spinner.js
│   │   ├── modal.js
│   │   ├── navigation-drawer.js
│   │   ├── pagination.js
│   │   ├── search-bar.js
│   │   ├── toast.js
│   │   ├── video-player.js
│   │   └── video-thumbnail.js
│   ├── config/              # Configuration files
│   │   └── firebase.js      # Firebase initialization
│   ├── i18n/                # Internationalization
│   │   ├── en.json
│   │   ├── hi.json
│   │   ├── or.json
│   │   ├── ta.json
│   │   └── te.json
│   ├── pages/               # Page-specific logic
│   │   ├── about.js
│   │   ├── categories.js
│   │   ├── help.js
│   │   ├── home.js
│   │   ├── login.js
│   │   ├── profile.js
│   │   ├── search.js
│   │   └── settings.js
│   ├── services/            # Business logic and API interfaces
│   │   ├── auth-service.js      # Authentication operations
│   │   ├── data-service.js      # User data management
│   │   ├── local-history-service.js
│   │   └── recommendation-service.js
│   ├── styles/              # CSS stylesheets
│   │   └── main.css
│   └── utils/               # Utility functions
│       ├── age-verification.js
│       ├── data-loader.js
│       ├── i18n.js
│       └── keyboard-shortcuts.js
├── *.html                   # Static HTML pages
├── *.css                    # Global styles
├── main.js                  # Application entry point
├── sw.js                    # Service worker
├── manifest.json            # PWA manifest
└── package.json
```

### Key Architectural Patterns

- **Hexagonal Architecture**: Services act as ports with Firebase as the adapter
- **Component-Based UI**: Modular, reusable components
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data
- **Progressive Enhancement**: Core functionality works without JavaScript

## API Documentation

### Authentication Service (`src/services/auth-service.js`)

#### `login(email, password)`
Authenticates a user with email and password.
- **Parameters**:
  - `email` (string): User's email address
  - `password` (string): User's password
- **Returns**: Promise<UserCredential>
- **Throws**: Error for invalid credentials or network issues

#### `register(email, password)`
Creates a new user account.
- **Parameters**:
  - `email` (string): User's email address
  - `password` (string): User's password (minimum 6 characters)
- **Returns**: Promise<UserCredential>
- **Throws**: Error for existing email or weak password

#### `logout()`
Signs out the current user.
- **Returns**: Promise<void>

#### `onAuthStateChange(callback)`
Listens for authentication state changes.
- **Parameters**:
  - `callback` (function): Function receiving user object or null
- **Returns**: Unsubscribe function

### Data Service (`src/services/data-service.js`)

#### `addToFavorites(userId, videoId)`
Adds a video to user's favorites.
- **Parameters**:
  - `userId` (string): User identifier
  - `videoId` (string): Video identifier
- **Returns**: Promise<void>

#### `removeFromFavorites(userId, videoId)`
Removes a video from user's favorites.
- **Parameters**:
  - `userId` (string): User identifier
  - `videoId` (string): Video identifier
- **Returns**: Promise<void>

#### `getFavorites(userId)`
Retrieves user's favorite videos.
- **Parameters**:
  - `userId` (string): User identifier
- **Returns**: Promise<Array<string>> - Array of video IDs

#### `addToWatchHistory(userId, videoId, timestamp)`
Adds a video to user's watch history.
- **Parameters**:
  - `userId` (string): User identifier
  - `videoId` (string): Video identifier
  - `timestamp` (Date, optional): Watch timestamp
- **Returns**: Promise<void>

#### `getWatchHistory(userId, limitCount)`
Retrieves user's watch history.
- **Parameters**:
  - `userId` (string): User identifier
  - `limitCount` (number, optional): Maximum items to return (default: 50)
- **Returns**: Promise<Array> - Array of watch history items

#### `getSettings(userId)`
Retrieves user's settings.
- **Parameters**:
  - `userId` (string): User identifier
- **Returns**: Promise<Object> - User settings object

#### `updateSettings(userId, settings)`
Updates user's settings.
- **Parameters**:
  - `userId` (string): User identifier
  - `settings` (Object): Settings object to update
- **Returns**: Promise<void>

### Recommendation Service (`src/services/recommendation-service.js`)

#### `getRecommendations(userId, limit)`
Generates personalized video recommendations.
- **Parameters**:
  - `userId` (string): User identifier
  - `limit` (number, optional): Maximum recommendations to return (default: 10)
- **Returns**: Promise<Array> - Array of recommended video objects
- **Algorithm**: Based on user's favorites and watch history, scoring videos by tag and category relevance

## Testing

The project uses Jest as the testing framework with JSDOM for DOM simulation.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: Service layer testing with Firebase mocks
- **Component Tests**: UI component behavior testing
- **Coverage**: Minimum 80% code coverage requirement

### Test Files

- `src/**/*.test.js` - Test files alongside source code
- `jest.setup.js` - Jest configuration and global setup
- Coverage reports generated in `coverage/` directory

## Deployment

### Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticate with Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```

4. **Build the application**:
   ```bash
   npm run build
   ```

5. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

### Alternative Hosting Options

#### Netlify
- Connect GitHub repository
- Set build command: `npm run build`
- Publish directory: `dist`

#### Vercel
- Import GitHub repository
- Automatic deployments on push
- Custom build settings if needed

#### AWS S3 + CloudFront
- Upload built files to S3 bucket
- Configure CloudFront distribution for CDN
- Set up proper caching and security headers

#### GitHub Pages
- Use GitHub Actions for CI/CD
- Build and deploy on push to main branch
- Custom domain support available

### Environment Configuration

Ensure all environment variables are properly configured in your hosting platform's environment settings or Firebase Functions for server-side processing.

## Contributing

We welcome contributions from the community! Please follow these guidelines:

1. **Fork the repository** on GitHub
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the existing code style
4. **Add tests** for new functionality
5. **Run the test suite**:
   ```bash
   npm test
   ```
6. **Commit your changes** with descriptive messages
7. **Push to your fork** and **submit a pull request**

### Code Style Guidelines

- Use ES6+ features and modern JavaScript practices
- Follow consistent naming conventions (camelCase for variables/functions)
- Add JSDoc comments for all public functions
- Maintain test coverage above 80%
- Ensure responsive design for all new components

### Reporting Issues

- Use GitHub Issues to report bugs or request features
- Provide detailed steps to reproduce bugs
- Include browser and device information
- Attach screenshots for UI-related issues

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

The ISC License is a permissive free software license that allows for broad use of the software, including commercial use, with minimal restrictions.

## Contact Information

### Project Maintainers

- **Roshan Sahu** - Frontend Developer
  - GitHub: [@Roshan8800](https://github.com/Roshan8800)

- **Papun Sahu** - Data Integration Specialist

- **Rohan Sahu** - Testing & Performance Optimization

### Repository

- **GitHub**: [https://github.com/Roshan8800/Blue-berry](https://github.com/Roshan8800/Blue-berry)
- **Homepage**: [https://github.com/Roshan8800/Blue-berry](https://github.com/Roshan8800/Blue-berry)

### Support

For questions, bug reports, or feature requests, please:

1. Check existing [GitHub Issues](https://github.com/Roshan8800/Blue-berry/issues)
2. Create a new issue with detailed information
3. Contact maintainers through GitHub

---

**Disclaimer**: This application is intended for adult audiences only (18+). All content and usage must comply with applicable laws and regulations in your jurisdiction.
