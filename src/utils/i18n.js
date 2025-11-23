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
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to English
            if (lang !== 'en') {
                await this.loadTranslations('en');
            }
        }
    }

    t(key, variables = {}) {
        const keys = key.split('.');
        let value = this.translations;
        for (const k of keys) {
            value = value && value[k];
        }
        if (typeof value !== 'string') {
            console.warn(`Translation key not found: ${key}`);
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