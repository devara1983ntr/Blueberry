# Fix: Database Service Refactor for Compat SDK

## Issue
The application uses the Firebase Compat libraries (via CDN in `index.html` and others) which provide a global `firebase` object. However, `src/services/data-service.js` was written using the Modular SDK syntax (`import { doc, getDoc } from 'firebase/firestore'`). This mismatch caused runtime errors in the browser because the browser does not support bare module imports without an import map or bundler configuration for those specific packages.

## Resolution
Refactored `src/services/data-service.js` to use the Compat API syntax consistent with the environment and other services (like `auth-service.js`).

### Changes
*   Removed `import { ... } from 'firebase/firestore'`.
*   Updated database operations to use `db.collection('...').doc('...')` chaining.
*   Updated `addToFavorites` and `removeFromFavorites` to use `window.firebase.firestore.FieldValue.arrayUnion/arrayRemove`.
*   Updated `src/services/data-service.test.js` to mock the global `firebase` object and Compat API structure, ensuring tests pass and cover the functionality.

## Verification
*   `npm test` passes for `data-service.test.js` and `recommendation-service.test.js`.
*   Frontend verification (via Playwright) confirms that the Video Page loads title, metadata, and recommendations without crashing.
