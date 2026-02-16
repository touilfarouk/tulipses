console.log('Loading i18n module...');

(() => {
  const dictionaries = {
    en: null,
    fr: null,
    ar: null
  };

  const listeners = new Set();

  const getBasePath = () => {
    const isGitHubPages = window.location.hostname === 'touilfarouk.github.io';
    const isTulipsesPath = window.location.pathname.includes('/tulipses/');
    return (isGitHubPages || isTulipsesPath) ? '/tulipses/' : '/';
  };

  const getDictionaryUrl = (lang) => {
    const version = window.APP_VERSION || Date.now();
    return `${getBasePath()}data/i18n.${lang}.json?v=${version}`;
  };

  const loadDictionary = async (lang) => {
    if (dictionaries[lang]) return dictionaries[lang];
    try {
      const response = await fetch(getDictionaryUrl(lang), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      dictionaries[lang] = json;
      return json;
    } catch (error) {
      console.warn('Failed to load dictionary for', lang, error);
      dictionaries[lang] = null;
      return null;
    }
  };

  const i18n = {
    lang: localStorage.getItem('Tulipes-language') || 'en',
    t(key) {
      const dict = dictionaries[this.lang];
      const parts = key.split('.');
      let value = dict;
      for (const part of parts) {
        value = value?.[part];
      }
      return value ?? key;
    },
    async setLang(lang) {
      const target = lang || 'en';
      await loadDictionary(target);
      this.lang = dictionaries[target] ? target : 'en';
      localStorage.setItem('Tulipes-language', this.lang);
      listeners.forEach((cb) => cb(this.lang));
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    }
  };

  window.i18n = i18n;
  i18n.setLang(i18n.lang);
  console.log('i18n ready with lang:', i18n.lang);
})();
