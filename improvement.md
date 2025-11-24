# Improvement Plan & Audit

## 1. Design & UI/UX Audit
- **Current State:** Basic dark theme, but lacks "premium" feel.
- **Issues:**
    - Typography is generic system fonts.
    - Missing hover states on video cards.
    - Transitions are abrupt.
    - Spacing is inconsistent.
    - Mobile gestures (swipe) are missing.
- **Enhancements:**
    - [ ] Create `src/styles/variables.css` for consistent palette/typography.
    - [ ] Update `src/styles/style.css` (or main.css) with new variables.
    - [ ] Create `src/styles/card.css` for premium video thumbnails.
    - [ ] Implement smooth transitions (CSS `transition`).
    - [ ] Refine Navigation Bar (sticky, blurred background).

## 2. Age Verification
- **Current State:** Uses `prompt()`, which is intrusive and ugly.
- **Enhancements:**
    - [ ] Create `src/components/age-verification-modal.js`.
    - [ ] Style it as a full-screen overlay with "Enter" button.
    - [ ] Persist state in `localStorage` properly.
    - [ ] Ensure it blocks interaction on `index.html`.

## 3. Access Limits (Guest vs Logged In)
- **Current State:** Logic exists but limits were 2,000/126,000.
- **Enhancements:**
    - [ ] Update `src/utils/data-loader.js` to respect strict 3,000 limit for guests.
    - [ ] Add visual indicator (Banner) in `home.js` when limit is reached.
    - [ ] Redirect to Login/Signup on limit breach.

## 4. Feature Implementation
- **Search (`src/pages/search.js`):**
    - Currently loads *all* videos to filter client-side. This might be slow but acceptable for the prototype if paginated correctly.
    - **Issue:** UI is basic.
    - **Enhancement:** Add "Premium" search bar styling, debounce input.
- **Categories (`src/pages/categories.js`):**
    - **Issue:** Empty file!
    - **Enhancement:** Implement category listing and filtering logic.
- **Profile (`src/pages/profile.js`):**
    - **Issue:** UI is functional but plain.
    - **Enhancement:** Style the profile header, tabs, and video grids to match the new theme.

## 5. Mobile Gestures
- **Enhancements:**
    - [ ] Add swipe listeners to Category pills/carousels.
    - [ ] Add touch-friendly tap targets.

## 6. Code Cleanup
- **Enhancements:**
    - [ ] Move inline scripts from HTML files to `src/pages/`.
    - [ ] Standardize CSS imports.
