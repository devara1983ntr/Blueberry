# Blueberry Project Memory Bank

## Project Overview

Blueberry is a modern, responsive Progressive Web App (PWA) designed for adult video streaming. Built with vanilla JavaScript, HTML5, and CSS3, the application leverages Firebase for comprehensive backend services including authentication, data storage, and analytics. The app provides a seamless user experience across devices with features like offline support, personalized recommendations, and multi-language support.

### Key Features
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **PWA Capabilities**: Service worker caching, offline viewing, and installable app experience
- **User Authentication**: Secure Firebase-based login and registration
- **Personalized Experience**: Favorites, watch history, and AI-driven recommendations
- **Advanced Search**: Filtering and search functionality across video content
- **Multi-language Support**: Internationalization with 5 supported languages (English, Hindi, Tamil, Telugu, Odia)
- **Age Verification**: Mandatory age verification system for content access
- **Performance Optimized**: Code splitting, lazy loading, and optimized asset delivery
- **Error Monitoring**: Automatic error logging to Firebase for debugging
- **Accessibility**: WCAG-compliant components with keyboard navigation

### Technology Stack
- **Frontend**: ES6+ JavaScript, HTML5, CSS3
- **Backend Services**: Firebase (Authentication, Firestore, Analytics, Hosting)
- **Build Tools**: Babel (transpilation), Clean CSS (minification), Jest (testing)
- **Development Server**: HTTP Server for local development
- **PWA Features**: Service Worker, Web App Manifest, Push Notifications

## Architecture and Design Patterns

### Hexagonal Architecture
The application follows a hexagonal (ports and adapters) architecture pattern that promotes separation of concerns and testability:

```
Domain Layer (Core Business Logic)
├── Ports (Interfaces)
│   ├── VideoControlsPort
│   ├── DataServicePort
│   └── AuthServicePort
├── Domain Services
│   ├── VideoPlayerDomain
│   ├── RecommendationEngine
│   └── UserManagementDomain
Adapters Layer (External Interfaces)
├── FirebaseAdapter (Firestore, Auth)
├── IframeVideoAdapter (Video playback)
├── LocalStorageAdapter (Offline data)
└── ServiceWorkerAdapter (Caching)
```

### Component-Based UI Architecture
The UI is built using custom web components with Shadow DOM for encapsulation:

- **Base Components**: Reusable UI primitives (buttons, inputs, modals)
- **Composite Components**: Complex components combining multiple base components
- **Page Components**: Route-specific components managing page-level logic
- **Service Integration**: Components communicate with services through ports

### Design Patterns Implemented
- **Observer Pattern**: Event-driven communication between components
- **Factory Pattern**: Component instantiation and service creation
- **Strategy Pattern**: Interchangeable caching strategies in service worker
- **Adapter Pattern**: Wrapping external APIs (Firebase, video iframes)
- **Singleton Pattern**: Shared instances of services (auth, data, i18n)

### File Structure
```
blueberry/
├── src/
│   ├── components/     # UI components (Web Components)
│   ├── services/       # Business logic services
│   ├── pages/          # Page-specific logic
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   ├── i18n/           # Internationalization files
│   └── styles/         # CSS stylesheets
├── *.html              # Static HTML pages
├── main.js             # Application entry point
├── sw.js               # Service worker
└── manifest.json       # PWA manifest
```

## Component Architecture

### Core Components

#### VideoPlayer Component
A sophisticated video player built as a custom element with hexagonal architecture:

- **Ports**: VideoControlsPort defining playback interface
- **Adapters**: IframeVideoAdapter for Pornhub embed integration
- **Features**: 
  - Advanced controls (play/pause, volume, quality, subtitles)
  - Gesture support (swipe to seek, pinch to zoom, shake to randomize)
  - Playlist and watch-later functionality
  - Theater and mini-player modes
  - Picture-in-picture support

#### VideoThumbnail Component
Displays video previews with lazy loading and interaction handling:

- **Features**: Thumbnail display, title overlay, click handling
- **Performance**: Intersection Observer for lazy loading
- **Accessibility**: Keyboard navigation and screen reader support

#### Navigation Components
- **NavigationDrawer**: Side navigation with responsive behavior
- **SearchBar**: Advanced search with filtering options
- **CategoryGrid**: Grid layout for video categories
- **Pagination**: Page navigation with state management

### Component Communication
Components communicate through:
- **Custom Events**: For decoupled communication
- **Shared Services**: For data sharing and state management
- **Direct Method Calls**: For parent-child relationships

## Service Layer

### Authentication Service (`auth-service.js`)
Handles user authentication using Firebase Auth:

- **Methods**: `login()`, `register()`, `logout()`, `onAuthStateChange()`
- **Features**: Email/password authentication, session management
- **Error Handling**: Comprehensive error messages for different failure scenarios

### Data Service (`data-service.js`)
Manages user data persistence using Firestore:

- **Methods**: 
  - Favorites: `addToFavorites()`, `removeFromFavorites()`, `getFavorites()`
  - Watch History: `addToWatchHistory()`, `getWatchHistory()`
  - Settings: `getSettings()`, `updateSettings()`
- **Architecture**: Implements hexagonal pattern with Firestore as adapter
- **Error Handling**: Permission-based error messages and retry logic

### Recommendation Service (`recommendation-service.js`)
Provides personalized video recommendations:

- **Algorithm**: Based on user favorites and watch history
- **Scoring**: Tag and category relevance matching
- **Caching**: Local storage for offline recommendations

### Local History Service (`local-history-service.js`)
Manages client-side data storage:

- **Features**: Local storage abstraction with fallback handling
- **Data Types**: User preferences, cached content, offline queue

## Data Management

### Firebase Integration
- **Firestore**: NoSQL database for user data and content metadata
- **Authentication**: User management and security
- **Analytics**: User behavior tracking and insights
- **Hosting**: CDN-backed static file hosting

### Data Flow
1. **Content Loading**: Videos loaded from JSON data files or external APIs
2. **User Data**: Stored in Firestore with real-time synchronization
3. **Caching Strategy**: 
   - Static assets: Cache-first with service worker
   - API data: Network-first with offline fallback
   - Images: Cache-first with size limits

### Data Structures
- **Video Object**: { id, title, thumbnail, embed, tags, category, duration }
- **User Profile**: { uid, favorites[], settings{}, watchHistory[] }
- **Settings**: { language, theme, autoplay, quality }

## Internationalization

### Implementation
- **Library**: Custom I18n class with JSON-based translations
- **Supported Languages**: English (en), Hindi (hi), Tamil (ta), Telugu (te), Odia (or)
- **File Structure**: `src/i18n/{lang}.json` for each language
- **Features**: 
  - Variable interpolation
  - Fallback to English for missing translations
  - Runtime language switching
  - Local storage persistence

### Usage
```javascript
import { i18n } from './utils/i18n.js';

// Initialize
await i18n.init();

// Get translation
const message = i18n.t('video.play', { title: 'Sample Video' });

// Change language
await i18n.setLanguage('hi');
```

## Testing Strategy

### Framework
- **Jest**: JavaScript testing framework with JSDOM environment
- **Configuration**: Custom setup in `jest.setup.js`
- **Coverage**: Minimum 80% code coverage requirement

### Test Structure
- **Unit Tests**: Individual functions and component methods
- **Integration Tests**: Service layer testing with Firebase mocks
- **Component Tests**: UI component behavior and rendering
- **E2E Tests**: User flow testing (planned for future)

### Test Categories
- **Services**: Auth, data, recommendation services
- **Utils**: i18n, data-loader, age-verification
- **Components**: Video player, thumbnails, forms

### CI/CD Integration
- Automated test runs on push/PR
- Coverage reports generation
- Test failure notifications

## Performance Optimizations

### Code Splitting and Lazy Loading
- **Dynamic Imports**: Components loaded on demand
- **Route-based Splitting**: Page components loaded per route
- **Service Worker**: Background loading of critical resources

### Caching Strategies
- **Service Worker**: Multiple cache buckets (static, images, API)
- **Cache-first**: Static assets and images
- **Network-first**: API calls with offline fallback
- **Stale-while-revalidate**: Scripts and styles

### Rendering Optimizations
- **Intersection Observer**: Lazy loading of video thumbnails
- **Debounced Events**: Search and scroll event handling
- **Virtual Scrolling**: Large list optimization (planned)

### Bundle Optimization
- **Babel Transpilation**: ES6+ to browser-compatible code
- **CSS Minification**: Clean CSS for production builds
- **Asset Optimization**: Image compression and WebP support

## Deployment Configuration

### Firebase Hosting
- **Build Process**: Automated build with npm scripts
- **CDN**: Global content delivery network
- **SSL**: Automatic HTTPS certificate management
- **Custom Domain**: Support for custom domain configuration

### Build Pipeline
```json
{
  "scripts": {
    "build:js": "babel src --out-dir dist --presets=@babel/preset-env --minified",
    "build:css": "mkdir -p dist && for file in *.css; do npx clean-css $file > dist/$file; done",
    "build": "npm run build:js && npm run build:css && cp *.html dist/ && cp manifest.json dist/ && cp -r assets dist/"
  }
}
```

### Environment Configuration
- **Development**: Local HTTP server with hot reload
- **Staging**: Firebase hosting preview channels
- **Production**: Firebase hosting with analytics

### Alternative Hosting Options
- **Netlify**: Git-based deployments with build hooks
- **Vercel**: Serverless deployment with edge functions
- **AWS S3 + CloudFront**: Scalable hosting with custom CDN rules

## Security Considerations

### Authentication and Authorization
- **Firebase Auth**: Secure token-based authentication
- **Session Management**: Automatic token refresh and validation
- **Permission Checks**: Firestore security rules for data access control

### Content Security
- **Age Verification**: Mandatory age verification with local storage persistence
- **Content Filtering**: Client-side content access control
- **Input Validation**: Sanitization of user inputs and API responses

### Data Protection
- **Encryption**: HTTPS for all data transmission
- **Privacy**: GDPR-compliant data handling practices
- **Error Logging**: Secure error reporting without sensitive data

### PWA Security
- **Service Worker**: Secure origin restrictions
- **Cache Poisoning**: Cache validation and cleanup
- **Offline Security**: Local data encryption (planned)

## Development Workflow

### Version Control
- **Git**: Distributed version control with GitHub hosting
- **Branching Strategy**: Feature branches with pull request reviews
- **Commit Standards**: Conventional commit messages

### Development Environment
- **Node.js**: v14+ for package management and build tools
- **Local Server**: HTTP server for development with CORS support
- **Firebase Emulator**: Local development environment for Firebase services

### Code Quality
- **ESLint**: Code linting (planned)
- **Prettier**: Code formatting (planned)
- **Husky**: Git hooks for pre-commit quality checks

### Collaboration
- **GitHub Issues**: Bug tracking and feature requests
- **Pull Requests**: Code review process with required approvals
- **Documentation**: README and API documentation maintenance

## Future Enhancements

### Planned Features
- **Advanced Video Player**: HLS streaming support, multiple quality options
- **Social Features**: User comments, ratings, sharing
- **Offline Sync**: Background sync for offline actions
- **Push Notifications**: Content updates and recommendations
- **Advanced Analytics**: User behavior insights and A/B testing

### Technical Improvements
- **TypeScript Migration**: Type safety and better IDE support
- **Component Library**: Shared component library extraction
- **Micro-frontend Architecture**: Modular application structure
- **GraphQL Integration**: Efficient data fetching with Apollo Client

### Performance Enhancements
- **WebAssembly**: Video processing and encoding optimizations
- **Service Worker Updates**: Advanced caching strategies
- **CDN Optimization**: Edge computing for personalized content
- **Progressive Loading**: Skeleton screens and progressive image loading

### Scalability Considerations
- **Database Sharding**: Horizontal scaling for user data
- **CDN Expansion**: Multi-region content delivery
- **Load Balancing**: Server-side rendering for SEO optimization
- **Monitoring**: Advanced performance monitoring and alerting

### Accessibility Improvements
- **Screen Reader Optimization**: Enhanced ARIA labels and navigation
- **Keyboard Navigation**: Full keyboard accessibility implementation
- **Color Contrast**: WCAG AAA compliance for all components
- **International Accessibility**: RTL language support and cultural adaptations

This memory bank serves as a comprehensive reference for developers working on the Blueberry project, providing insights into the architecture, implementation details, and future development directions.