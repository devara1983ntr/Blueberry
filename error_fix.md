# Error Fix Plan

## Detected Issues

### 1. Test Environment & Configuration
- **Missing `package.json`**: The file was a Git LFS pointer, preventing dependency installation and script execution. (Fixed)
- **Recursion in Jest Mock**: `HTMLElement.prototype.attachShadow` mock in `jest.setup.js` caused infinite recursion in `querySelector`. (Fixed)
- **Firebase Mocking**: `jest.setup.js` was mocking `firebase/auth` module instead of the global `firebase` object used by the Compat SDK. (Fixed)
- **Missing Globals**: `TextEncoder`, `TextDecoder`, `crypto` were missing in Jest environment. (Fixed)

### 2. Linting Errors
- **Undefined `showToast`**: Multiple files (`login.js`, `profile.js`, `settings.js`, `category-grid.js`) were using `showToast` without importing it. (Fixed)
- **Unused Variables**: Various warnings across the codebase. (To be fixed)
- **Undefined `modal`**: `src/pages/settings.js` used `modal` outside its scope. (Fixed)

### 3. Test Failures (80 failures remaining)
- **`src/utils/i18n.test.js`**:
  - Initialization with stored language fails (mock data mismatch).
  - Fallback logic verification fails.
  - State persistence between tests (singleton instance).
- **`src/components/video-player.test.js`**:
  - Shake gesture detection threshold/count mismatch.
  - `showToast` calls verification failing (mock vs real).
- **`src/components/search-bar.test.js`**:
  - Likely Shadow DOM interaction issues or recursion (before fix).
- **`src/utils/data-loader.test.js`**:
  - Likely `fetch` mock issues for LFS pointer simulation.
- **`src/services/auth-service.test.js`**:
  - `firebase.auth()` mocking issues.
- **`src/services/data-service.test.js`**:
  - `firebase.firestore()` mocking issues.

### 4. Component Issues
- **`VideoPlayer`**:
  - Used internal `showToast` method instead of shared component. (Fixed)
  - `Pornhub` iframe control is simulated (by design), but tests check implementation details.

## Fix Plan

1.  **Fix `i18n` Tests**: Ensure `fetch` mock returns correct JSON structure and `i18n` instance is reset between tests.
2.  **Fix `VideoPlayer` Tests**: Update gesture test expectations (shake count) and fix `showToast` mocking.
3.  **Fix `Auth` & `Data` Service Tests**: Refine `jest.setup.js` Firebase mocks to match usage in services (e.g., `doc()`, `getDoc()`, `setDoc()`).
4.  **Fix `Search Bar` Tests**: Ensure `attachShadow` and events work correctly in mock environment.
5.  **Cleanup Code**: Remove unused variables identified by linter.
