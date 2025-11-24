const FALLBACK_TRANSLATIONS = {
    "search": {
        "placeholder": "Search videos...",
        "filters": "Filters",
        "durationLabel": "Duration",
        "categoryLabel": "Category",
        "categoryPlaceholder": "Filter by category",
        "applyFilters": "Apply Filters",
        "durationAny": "Any",
        "durationShort": "Short (< 5 min)",
        "durationMedium": "Medium (5-20 min)",
        "durationLong": "Long (> 20 min)"
    },
    "common": {
        "loading": "Loading...",
        "error": "An error occurred",
        "noResults": "No results found"
    }
};

class I18n {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.supportedLanguages = ['en', 'hi', 'ta', 'te', 'or'];
    }

    async init() {
        const stored = localStorage.getItem('blueberry-language');
        if (stored && this.supportedLanguages.includes(stored)) {
            this.currentLanguage = stored;
        }
        await this.loadTranslations(this.currentLanguage);

        // If translations are empty (e.g., failed load), ensure we have fallbacks
        if (Object.keys(this.translations).length === 0) {
            console.warn('Using fallback translations.');
            this.translations = FALLBACK_TRANSLATIONS;
        }
    }

    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`Unsupported language: ${lang}`);
            return;
        }
        this.currentLanguage = lang;
        localStorage.setItem('blueberry-language', lang);
        await this.loadTranslations(lang);
        // Dispatch event for components to update
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }

    getLanguage() {
        return this.currentLanguage;
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`src/i18n/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}`);
            }

            // Read as text first to check for LFS pointer
            const text = await response.text();

            if (text.startsWith('version https://git-lfs')) {
                console.warn(`Translation file for ${lang} is a Git LFS pointer. using fallbacks.`);
                this.translations = FALLBACK_TRANSLATIONS;
                return;
            }

            try {
                this.translations = JSON.parse(text);
            } catch (e) {
                console.error(`Invalid JSON for ${lang}:`, e);
                this.translations = FALLBACK_TRANSLATIONS;
            }

        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to embedded English translations
            this.translations = FALLBACK_TRANSLATIONS;
        }
    }

    t(key, variables = {}) {
        const keys = key.split('.');
        let value = this.translations;
        for (const k of keys) {
            value = value && value[k];
        }

        // If not found in current translations, try fallback
        if (typeof value !== 'string') {
            let fallbackValue = FALLBACK_TRANSLATIONS;
            for (const k of keys) {
                fallbackValue = fallbackValue && fallbackValue[k];
            }
            if (typeof fallbackValue === 'string') {
                value = fallbackValue;
            }
        }

        if (typeof value !== 'string') {
            // console.warn(`Translation key not found: ${key}`);
            return key;
        }
        // Interpolate variables
        return value.replace(/{(\w+)}/g, (match, varName) => {
            return variables[varName] !== undefined ? variables[varName] : match;
        });
    }
}

const i18n = new I18n();

export { i18n };
export default i18n;
