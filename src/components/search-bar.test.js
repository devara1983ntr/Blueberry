import '../components/search-bar.js';

describe('SearchBar Component', () => {
  let searchBar;
  let mockInput;
  let mockSearchButton;
  let mockFiltersButton;
  let mockAutocompleteDropdown;
  let mockFiltersDropdown;

  beforeEach(() => {
    searchBar = new SearchBar();
    document.body.appendChild(searchBar);

    // Mock shadow DOM elements
    mockInput = {
      value: '',
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      focus: jest.fn()
    };
    mockSearchButton = { addEventListener: jest.fn(), click: jest.fn() };
    mockFiltersButton = {
      addEventListener: jest.fn(),
      setAttribute: jest.fn(),
      title: ''
    };
    mockAutocompleteDropdown = {
      style: { display: 'none' },
      innerHTML: '',
      addEventListener: jest.fn()
    };
    mockFiltersDropdown = {
      style: { display: 'none' }
    };

    searchBar.shadowRoot = {
      querySelector: jest.fn((selector) => {
        switch (selector) {
          case '.search-input': return mockInput;
          case '.search-button': return mockSearchButton;
          case '.filters-button': return mockFiltersButton;
          case '.autocomplete-dropdown': return mockAutocompleteDropdown;
          case '.filters-dropdown': return mockFiltersDropdown;
          case '.apply-filters': return { addEventListener: jest.fn() };
          case '#duration-filter': return { value: '', querySelector: jest.fn(() => ({ textContent: '' })) };
          case '#category-filter': return { value: '', placeholder: '' };
          case 'label[for="duration-filter"]': return { textContent: '' };
          case 'label[for="category-filter"]': return { textContent: '' };
          default: return null;
        }
      }),
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn()
    };

    // Mock i18n
    searchBar.updateTexts = jest.fn();
    searchBar.navigateToSearch = jest.fn();
  });

  afterEach(() => {
    document.body.removeChild(searchBar);
    jest.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create a SearchBar instance', () => {
      expect(searchBar).toBeInstanceOf(SearchBar);
      expect(searchBar).toBeInstanceOf(HTMLElement);
    });

    it('should attach shadow DOM', () => {
      expect(searchBar.shadowRoot).toBeDefined();
    });

    it('should initialize default state', () => {
      expect(searchBar.allTags).toBeInstanceOf(Set);
      expect(searchBar.allCategories).toBeInstanceOf(Set);
      expect(searchBar.allPerformers).toBeInstanceOf(Set);
      expect(searchBar.filtersOpen).toBe(false);
      expect(searchBar.selectedIndex).toBe(-1);
      expect(searchBar.currentSuggestions).toEqual([]);
    });
  });

  describe('Loading Suggestions', () => {
    it('should load suggestions from videos', async () => {
      const mockVideos = [
        {
          tags: ['tag1', 'tag2'],
          categories: ['cat1'],
          performer: 'performer1'
        },
        {
          tags: ['tag2', 'tag3'],
          categories: ['cat2'],
          performer: 'performer2'
        }
      ];

      // Mock loadAllVideos
      const mockLoadAllVideos = jest.fn().mockResolvedValue(mockVideos);
      // Import the function dynamically
      jest.doMock('../utils/data-loader.js', () => ({
        loadAllVideos: mockLoadAllVideos
      }));

      // Re-import to get the mock
      const { loadAllVideos } = await import('../utils/data-loader.js');

      await searchBar.loadSuggestions();

      expect(loadAllVideos).toHaveBeenCalled();
      expect(searchBar.allTags.has('tag1')).toBe(true);
      expect(searchBar.allTags.has('tag2')).toBe(true);
      expect(searchBar.allTags.has('tag3')).toBe(true);
      expect(searchBar.allCategories.has('cat1')).toBe(true);
      expect(searchBar.allCategories.has('cat2')).toBe(true);
      expect(searchBar.allPerformers.has('performer1')).toBe(true);
      expect(searchBar.allPerformers.has('performer2')).toBe(true);
    });

    it('should not load suggestions if already loaded', async () => {
      searchBar.allTags.add('existing');
      searchBar.isLoadingSuggestions = true;

      await searchBar.loadSuggestions();

      expect(searchBar.allTags.has('existing')).toBe(true);
    });

    it('should handle loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockLoadAllVideos = jest.fn().mockRejectedValue(new Error('Load failed'));
      jest.doMock('../utils/data-loader.js', () => ({
        loadAllVideos: mockLoadAllVideos
      }));

      await searchBar.loadSuggestions();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading suggestions:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Fuzzy Matching', () => {
    it('should match exact strings', () => {
      expect(searchBar.fuzzyMatch('hello', 'hello')).toBe(true);
    });

    it('should match partial strings in order', () => {
      expect(searchBar.fuzzyMatch('hello world', 'hlo')).toBe(true);
      expect(searchBar.fuzzyMatch('hello world', 'hew')).toBe(true);
    });

    it('should not match out of order characters', () => {
      expect(searchBar.fuzzyMatch('hello', 'hle')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(searchBar.fuzzyMatch('Hello', 'hello')).toBe(true);
    });

    it('should handle empty query', () => {
      expect(searchBar.fuzzyMatch('hello', '')).toBe(true);
    });

    it('should handle empty text', () => {
      expect(searchBar.fuzzyMatch('', 'h')).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    it('should perform search on button click', () => {
      mockInput.value = 'test query';

      searchBar.setupEventListeners();
      mockSearchButton.click();

      expect(searchBar.navigateToSearch).toHaveBeenCalledWith('test query');
    });

    it('should perform search on Enter key', () => {
      mockInput.value = 'test query';

      searchBar.setupEventListeners();
      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      mockInput.dispatchEvent(enterEvent);

      expect(searchBar.navigateToSearch).toHaveBeenCalledWith('test query');
    });

    it('should not search with empty query', () => {
      mockInput.value = '';

      searchBar.setupEventListeners();
      mockSearchButton.click();

      expect(searchBar.navigateToSearch).not.toHaveBeenCalled();
    });
  });

  describe('Autocomplete', () => {
    beforeEach(() => {
      searchBar.allTags = new Set(['javascript', 'react', 'vue']);
      searchBar.allCategories = new Set(['tutorial', 'news']);
      searchBar.allPerformers = new Set(['john', 'jane']);
    });

    it('should show autocomplete for queries >= 2 characters', () => {
      mockInput.value = 'ja';

      searchBar.setupEventListeners();
      const inputEvent = new Event('input');
      mockInput.dispatchEvent(inputEvent);

      expect(mockAutocompleteDropdown.style.display).toBe('block');
      expect(mockInput.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
    });

    it('should hide autocomplete for queries < 2 characters', () => {
      mockInput.value = 'j';

      searchBar.setupEventListeners();
      const inputEvent = new Event('input');
      mockInput.dispatchEvent(inputEvent);

      expect(mockAutocompleteDropdown.style.display).toBe('none');
      expect(mockInput.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
    });

    it('should generate suggestions from tags, categories, and performers', () => {
      mockInput.value = 'j';
      searchBar.allTags = new Set(['javascript']);
      searchBar.allCategories = new Set(['jobs']);
      searchBar.allPerformers = new Set(['john']);

      searchBar.setupEventListeners();
      const inputEvent = new Event('input');
      mockInput.dispatchEvent(inputEvent);

      expect(searchBar.currentSuggestions).toEqual([
        { type: 'tag', value: 'javascript' },
        { type: 'category', value: 'jobs' },
        { type: 'performer', value: 'john' }
      ]);
    });

    it('should limit suggestions to 10 total', () => {
      mockInput.value = 'a';
      searchBar.allTags = new Set(['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      searchBar.allCategories = new Set(['cat1', 'cat2', 'cat3', 'cat4', 'cat5']);
      searchBar.allPerformers = new Set(['perf1', 'perf2', 'perf3', 'perf4', 'perf5']);

      searchBar.setupEventListeners();
      const inputEvent = new Event('input');
      mockInput.dispatchEvent(inputEvent);

      expect(searchBar.currentSuggestions.length).toBe(10);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      searchBar.currentSuggestions = [
        { type: 'tag', value: 'javascript' },
        { type: 'category', value: 'tutorial' }
      ];
      mockAutocompleteDropdown.style.display = 'block';
      mockAutocompleteDropdown.querySelectorAll = jest.fn(() => [
        { classList: { toggle: jest.fn() } },
        { classList: { toggle: jest.fn() } }
      ]);
    });

    it('should navigate down with ArrowDown', () => {
      searchBar.selectedIndex = -1;

      const keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      mockInput.dispatchEvent(keydownEvent);

      expect(searchBar.selectedIndex).toBe(0);
    });

    it('should navigate up with ArrowUp', () => {
      searchBar.selectedIndex = 1;

      const keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      mockInput.dispatchEvent(keydownEvent);

      expect(searchBar.selectedIndex).toBe(0);
    });

    it('should wrap to bottom when navigating up from top', () => {
      searchBar.selectedIndex = 0;

      const keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      mockInput.dispatchEvent(keydownEvent);

      expect(searchBar.selectedIndex).toBe(1);
    });

    it('should select suggestion with Enter', () => {
      searchBar.selectedIndex = 0;

      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      mockInput.dispatchEvent(keydownEvent);

      expect(mockInput.value).toBe('javascript');
      expect(mockAutocompleteDropdown.style.display).toBe('none');
      expect(searchBar.navigateToSearch).toHaveBeenCalledWith('javascript');
    });

    it('should hide dropdown with Escape', () => {
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      mockInput.dispatchEvent(keydownEvent);

      expect(mockAutocompleteDropdown.style.display).toBe('none');
      expect(searchBar.selectedIndex).toBe(-1);
    });
  });

  describe('Filters', () => {
    it('should toggle filters dropdown', () => {
      searchBar.filtersOpen = false;

      searchBar.setupEventListeners();
      mockFiltersButton.click();

      expect(searchBar.filtersOpen).toBe(true);
      expect(mockFiltersDropdown.style.display).toBe('block');
      expect(mockFiltersButton.setAttribute).toHaveBeenCalledWith('aria-expanded', true);
    });

    it('should apply filters', () => {
      const durationSelect = { value: 'short' };
      const categoryInput = { value: 'tutorial' };
      searchBar.shadowRoot.querySelector = jest.fn((selector) => {
        if (selector === '#duration-filter') return durationSelect;
        if (selector === '#category-filter') return categoryInput;
        return { addEventListener: jest.fn() };
      });

      searchBar.setupEventListeners();
      const applyButton = searchBar.shadowRoot.querySelector('.apply-filters');
      applyButton.click();

      expect(mockFiltersDropdown.style.display).toBe('none');
      expect(searchBar.filtersOpen).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should navigate to search page with query', () => {
      delete window.location;
      window.location = { href: '' };

      searchBar.navigateToSearch('test query');

      expect(window.location.href).toBe('search.html?q=test%20query');
    });
  });

  describe('Accessibility', () => {
    it('should update ARIA attributes for autocomplete', () => {
      mockInput.value = 'ja';

      searchBar.setupEventListeners();
      const inputEvent = new Event('input');
      mockInput.dispatchEvent(inputEvent);

      expect(mockInput.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
    });

    it('should update ARIA attributes for filters', () => {
      searchBar.setupEventListeners();
      mockFiltersButton.click();

      expect(mockFiltersButton.setAttribute).toHaveBeenCalledWith('aria-expanded', true);
    });
  });

  describe('Lifecycle', () => {
    it('should setup event listeners on connect', () => {
      searchBar.setupEventListeners = jest.fn();
      searchBar.loadSuggestions = jest.fn();

      searchBar.connectedCallback();

      expect(searchBar.setupEventListeners).toHaveBeenCalled();
      expect(searchBar.loadSuggestions).toHaveBeenCalled();
      expect(searchBar.updateTexts).toHaveBeenCalled();
    });

    it('should handle language changes', () => {
      searchBar.connectedCallback();

      const languageEvent = new CustomEvent('languageChanged');
      window.dispatchEvent(languageEvent);

      expect(searchBar.updateTexts).toHaveBeenCalled();
    });
  });
});