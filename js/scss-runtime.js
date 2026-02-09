(function () {
  'use strict';

  var STYLE_ID = 'app-scss-runtime';
  function getBasePath() {
    var baseTag = document.querySelector('base');
    if (baseTag && baseTag.getAttribute('href')) {
      var href = baseTag.getAttribute('href');
      // Normalize to always have trailing slash
      return href.endsWith('/') ? href : (href + '/');
    }
    return '/';
  }

  var basePath = getBasePath();
  var variablesUrl = new URL('src/css/quasar.variables.scss', window.location.origin + basePath).href;
  var appUrl = new URL('src/css/app.scss', window.location.origin + basePath).href;

  function ensureStyleTag() {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    return style;
  }

  function compileWithSass(scssText) {
    return new Promise(function (resolve, reject) {
      if (window.Sass && typeof window.Sass.compile === 'function') {
        window.Sass.compile(scssText, function (result) {
          if (result && result.status === 0) {
            resolve(result.text || '');
          } else {
            reject(new Error(result && (result.formatted || result.message) || 'Sass compile failed'));
          }
        });
        return;
      }

      if (window.Sass && typeof window.Sass === 'function') {
        var sass = new window.Sass();
        if (sass && typeof sass.compile === 'function') {
          sass.compile(scssText, function (result) {
            if (result && result.status === 0) {
              resolve(result.text || '');
            } else {
              reject(new Error(result && (result.formatted || result.message) || 'Sass compile failed'));
            }
          });
          return;
        }
      }

      reject(new Error('Sass compiler not available. Ensure sass.sync.js is loaded.'));
    });
  }

  function loadText(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) {
        throw new Error('Failed to load SCSS: ' + res.status + ' ' + res.statusText + ' (' + url + ')');
      }
      return res.text();
    });
  }

  function loadAndCompile() {
    Promise.all([loadText(variablesUrl), loadText(appUrl)])
      .then(function (parts) {
        var scssText = parts.join('\n');
        return compileWithSass(scssText);
      })
      .then(function (cssText) {
        ensureStyleTag().textContent = cssText;
        console.log('[SCSS] compiled from', variablesUrl, 'and', appUrl);
      })
      .catch(function (err) {
        console.error('[SCSS] compile failed', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndCompile);
  } else {
    loadAndCompile();
  }
})();
