console.log('Loading screen data loader...');

(() => {
  const cache = new Map();

  const getBasePath = () => {
    const isGitHubPages = window.location.hostname === 'touilfarouk.github.io';
    const isTulipsesPath = window.location.pathname.includes('/tulipses/');
    return (isGitHubPages || isTulipsesPath) ? '/tulipses/' : '/';
  };

  const getUrl = (screen, lang) => {
    const version = window.APP_VERSION || Date.now();
    return `${getBasePath()}data/${screen}/${lang}.json?v=${version}`;
  };

  const fetchJson = async (screen, lang) => {
    const key = `${screen}:${lang}`;
    if (cache.has(key)) return cache.get(key);

    const response = await fetch(getUrl(screen, lang), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json = await response.json();
    cache.set(key, json);
    return json;
  };

  const load = async (screen, lang = 'en') => {
    try {
      return await fetchJson(screen, lang);
    } catch (error) {
      console.warn(`Screen data load failed for ${screen}/${lang}`, error);
      if (lang !== 'en') {
        try {
          return await fetchJson(screen, 'en');
        } catch (fallbackError) {
          console.warn(`Screen data fallback failed for ${screen}/en`, fallbackError);
        }
      }
      return null;
    }
  };

  window.screenData = { load };
  console.log('screenData ready');
})();
