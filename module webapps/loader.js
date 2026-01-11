(function () {
  const basePath = 'module webapps';
  const registry = {};
  const cssPromises = new Map();
  const scriptPromises = new Map();
  const htmlCache = new Map();

  const buildUrl = (name, file) => encodeURI(`${basePath}/${name}/${file}`);

  const ensureCss = (name) => {
    if (cssPromises.has(name)) {
      return cssPromises.get(name);
    }
    const href = buildUrl(name, `${name}.css`);
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .find((link) => link.href && link.href.includes(href));
    if (existing) {
      const resolved = Promise.resolve();
      cssPromises.set(name, resolved);
      return resolved;
    }
    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.addEventListener('load', () => resolve());
      link.addEventListener('error', () => reject(new Error(`Failed to load ${href}`)));
      document.head.appendChild(link);
    });
    cssPromises.set(name, promise);
    return promise;
  };

  const ensureScript = (name) => {
    if (scriptPromises.has(name)) {
      return scriptPromises.get(name);
    }
    const src = buildUrl(name, `${name}.js`);
    const existing = Array.from(document.scripts).find((script) => script.src && script.src.includes(src));
    if (existing) {
      const resolved = Promise.resolve();
      scriptPromises.set(name, resolved);
      return resolved;
    }
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
      document.body.appendChild(script);
    });
    scriptPromises.set(name, promise);
    return promise;
  };

  const fetchHtml = async (name) => {
    if (htmlCache.has(name)) {
      return htmlCache.get(name);
    }
    const url = buildUrl(name, `${name}.html`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }
    const html = await response.text();
    htmlCache.set(name, html);
    return html;
  };

  const register = (name, api) => {
    if (!name) return;
    registry[name] = api || {};
  };

  const mount = async (target, name) => {
    if (!target || !name) return;
    if (target.dataset.webappMounted === name && target.innerHTML.trim()) return;

    target.dataset.webappMounted = name;

    const cssPromise = ensureCss(name).catch((err) => console.warn(err));
    const htmlPromise = fetchHtml(name).catch((err) => {
      console.warn(err);
      return '';
    });
    const scriptPromise = ensureScript(name).catch((err) => console.warn(err));

    const html = await htmlPromise;
    target.innerHTML = html;

    await Promise.all([cssPromise, scriptPromise]);

    const api = registry[name];
    if (api && typeof api.init === 'function') {
      api.init(target);
    }
  };

  window.ModuleWebapps = {
    register,
    mount
  };
})();
