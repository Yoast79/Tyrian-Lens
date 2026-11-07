/**
 * Tyrian Lens Data Loader
 * Standardized data fetching with Dev (local-first) vs Release (GitHub raw-first) routing
 * and multi-language support (de, fr, es, en).
 */
(function(window) {
    'use strict';

    function getLanguage() {
        return (localStorage.getItem('gw2_lang') || localStorage.getItem('gw2_wiki_lang') || 'en').toLowerCase().trim();
    }

    function isDevEnvironment() {
        try {
            if (typeof window.isDevMode !== 'undefined') return window.isDevMode === true;
            if (window.parent && window.parent !== window && typeof window.parent.isDevMode !== 'undefined') {
                return window.parent.isDevMode === true;
            }
        } catch (e) {}
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'gw2ps.local';
    }

    function getCandidateUrls(file) {
        if (!file) return [];
        // Normalize filename (strip leading slashes, query strings, and optional Data/ prefix)
        let clean = file.split('?')[0].replace(/^\/+/, '');
        if (clean.toLowerCase().startsWith('data/')) {
            clean = clean.substring(5);
        }

        const lang = getLanguage();
        const isDev = isDevEnvironment();
        const cloudflareBase = 'https://data.tyrianlens.com/';
        const githubBase = 'https://raw.githubusercontent.com/Yoast79/Tyrian-Lens/main/Data/';
        const localBase = 'https://gw2ps.local/Data/';

        const extMatch = clean.match(/\.[^.]+$/);
        const ext = extMatch ? extMatch[0] : '';
        const base = ext ? clean.substring(0, clean.length - ext.length) : clean;

        const candidates = [];

        // If a non-English language is selected and the file isn't already language-suffixed
        if (lang && lang !== 'en' && !base.endsWith('_' + lang)) {
            const locFile = `${lang}/${base}_${lang}${ext}`;
            const locAlt = `${lang}/${clean}`;

            if (isDev) {
                // Local dev: local first, then Cloudflare, then GitHub fallback
                candidates.push(localBase + locFile);
                candidates.push(localBase + locAlt);
                candidates.push(cloudflareBase + locFile);
                candidates.push(cloudflareBase + locAlt);
                candidates.push(githubBase + locFile);
                candidates.push(githubBase + locAlt);
                candidates.push(localBase + clean);
                candidates.push(cloudflareBase + clean);
                candidates.push(githubBase + clean);
            } else {
                // Production: Cloudflare remote first, then local fallback, then GitHub fallback
                candidates.push(cloudflareBase + locFile);
                candidates.push(cloudflareBase + locAlt);
                candidates.push(localBase + locFile);
                candidates.push(localBase + locAlt);
                candidates.push(cloudflareBase + clean);
                candidates.push(localBase + clean);
                candidates.push(githubBase + locFile);
                candidates.push(githubBase + clean);
            }
        } else {
            if (isDev) {
                candidates.push(localBase + clean);
                candidates.push(cloudflareBase + clean);
                candidates.push(githubBase + clean);
            } else {
                candidates.push(cloudflareBase + clean);
                candidates.push(localBase + clean);
                candidates.push(githubBase + clean);
            }
        }

        return candidates;
    }

    async function fetchDataFile(file, options) {
        const candidates = getCandidateUrls(file);

        for (const url of candidates) {
            try {
                const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                const res = await fetch(fetchUrl, options || { cache: 'no-store' });
                if (res && res.ok) {
                    return res;
                }
            } catch (err) {
                // Ignore and try next candidate
            }
        }
        return null;
    }

    async function fetchDataJSON(file, options) {
        const res = await fetchDataFile(file, options);
        if (!res) return null;
        try {
            const text = await res.text();
            return JSON.parse(text.replace(/^\uFEFF/, '').trim());
        } catch (err) {
            console.error(`[DataLoader] Failed to parse JSON for ${file}:`, err);
            return null;
        }
    }

    // --- Translation System ---
    let _translations = null;
    let _loadPromise = null;

    async function loadTranslations(forceReload) {
        if (_translations && !forceReload) return _translations;
        if (_loadPromise && !forceReload) return _loadPromise;

        _loadPromise = (async () => {
            try {
                const data = await fetchDataJSON('manual_translations.json');
                if (data) {
                    _translations = data;
                }
            } catch (err) {
                console.error('[DataLoader] Failed to load translations:', err);
            }
            if (!_translations) _translations = {};
            return _translations;
        })();

        return _loadPromise;
    }

    function t(keyPath, defaultValue, ...args) {
        if (!_translations) {
            let res = defaultValue !== undefined ? defaultValue : keyPath;
            if (typeof res === 'string' && args.length > 0) {
                args.forEach((arg, i) => { res = res.replace(new RegExp('\\{' + i + '\\}', 'g'), arg); });
            }
            return res;
        }
        if (typeof keyPath !== 'string') return defaultValue !== undefined ? defaultValue : '';

        let result = undefined;

        // Try exact match first
        if (_translations[keyPath] !== undefined) {
            result = _translations[keyPath];
        } else {
            // Try dot navigation
            const parts = keyPath.split('.');
            let cur = _translations;
            let found = true;
            for (const p of parts) {
                if (cur && typeof cur === 'object' && p in cur) {
                    cur = cur[p];
                } else {
                    found = false;
                    break;
                }
            }
            if (found && cur !== undefined && cur !== null) {
                result = cur;
            } else if (_translations.common && _translations.common[keyPath] !== undefined) {
                result = _translations.common[keyPath];
            } else if (_translations.common_ui && _translations.common_ui[keyPath] !== undefined) {
                result = _translations.common_ui[keyPath];
            }
        }

        if (result === undefined) {
            result = defaultValue !== undefined ? defaultValue : keyPath;
        }

        if (typeof result === 'string' && args.length > 0) {
            args.forEach((arg, i) => {
                result = result.replace(new RegExp('\\{' + i + '\\}', 'g'), arg);
            });
        }

        return result;
    }

    function applyTranslations(root) {
        const doc = root || (typeof document !== 'undefined' ? document : null);
        if (!doc) return;

        doc.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val && val !== key) {
                if (typeof val === 'string' && val.includes('<') && val.includes('>')) {
                    el.innerHTML = val;
                } else {
                    el.innerText = val;
                }
            }
        });

        doc.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            const val = t(key);
            if (val && val !== key) el.placeholder = val;
        });

        doc.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const val = t(key);
            if (val && val !== key) el.title = val;
        });

        doc.querySelectorAll('[data-i18n-tip]').forEach(el => {
            const key = el.getAttribute('data-i18n-tip');
            const val = t(key);
            if (val && val !== key) {
                el.setAttribute('data-tooltip', val);
                if (el.title) el.title = val;
            }
        });
    }

    // Auto-trigger translation preload & auto-apply
    loadTranslations().then(() => {
        if (typeof document !== 'undefined' && document.readyState !== 'loading') {
            applyTranslations();
        }
    });

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            loadTranslations().then(() => applyTranslations());
        });
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('message', (e) => {
            if (e.data && e.data.action === 'languageChanged') {
                loadTranslations(true).then(() => applyTranslations());
            }
        });
    }

    window.DataLoader = {
        getLanguage,
        isDevEnvironment,
        getCandidateUrls,
        fetchDataFile,
        fetchDataJSON,
        loadTranslations,
        t,
        applyTranslations,
        get translations() { return _translations; }
    };

    window.fetchDataFile = fetchDataFile;
    window.fetchDataJSON = fetchDataJSON;

})(typeof window !== 'undefined' ? window : this);
