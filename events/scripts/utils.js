import { SUSI_OPTIONS } from './constances.js';

export const LIBS = (() => {
  const { hostname, search } = window.location;
  if (!(hostname.includes('.hlx.') || hostname.includes('.aem.') || hostname.includes('local'))) return '/libs';
  const branch = new URLSearchParams(search).get('milolibs') || 'main';
  if (!/^[a-zA-Z0-9_-]+$/.test(branch)) throw new Error('Invalid branch name.');
  if (branch === 'local') return 'http://localhost:6456/libs';
  return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
})();

export function getEventServiceEnv() {
  const validEnvs = ['dev', 'stage', 'prod'];
  const { host, search } = window.location;
  const SLD = host.includes('.aem.') ? 'aem' : 'hlx';
  const usp = new URLSearchParams(search);
  const eccEnv = usp.get('eccEnv');

  if (validEnvs.includes(eccEnv)) return eccEnv;

  if ((host.includes(`${SLD}.page`) || host.includes(`${SLD}.live`))) {
    if (host.startsWith('dev--')) return 'dev';
    if (host.startsWith('dev02--') || host.startsWith('main02--')) return 'dev02';
    if (host.startsWith('stage--')) return 'stage';
    if (host.startsWith('stage02--')) return 'stage02';
    if (host.startsWith('main--')) return 'prod';
  }

  if (host.includes('localhost')) return 'local';

  if (host.includes('stage.adobe')
    || host.includes('corp.adobe')
    || host.includes('graybox.adobe')) return 'stage';

  if (host.endsWith('adobe.com')) return 'prod';
  // fallback to dev
  return 'dev';
}

export function createTag(tag, attributes, html, options = {}) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement
      || html instanceof SVGElement
      || html instanceof DocumentFragment) {
      el.append(html);
    } else if (Array.isArray(html)) {
      el.append(...html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  options.parent?.append(el);
  return el;
}

export function yieldToMain() {
  return new Promise((r) => {
    setTimeout(r, 0);
  });
}

export function getMetadata(name, doc = document) {
  const attr = name && name.includes('og:') ? 'property' : 'name';
  const meta = doc.head.querySelector(`meta[${attr}="${name}"]`);
  return meta && meta.content;
}

export function setMetadata(name, value, doc = document) {
  const attr = name && name.includes('og:') ? 'property' : 'name';
  const meta = doc.head.querySelector(`meta[${attr}="${name}"]`);

  if (name === 'title') document.title = value;

  if (meta && meta.content !== value) {
    meta.content = value;
  } else {
    const newMeta = doc.createElement('meta');
    newMeta.setAttribute(attr, name);
    newMeta.content = value;
    doc.head.appendChild(newMeta);
  }
}

export function handlize(str) {
  return str.toLowerCase().trim().replaceAll(' ', '-');
}

export function flattenObject(obj, parentKey = '', result = {}) {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const newKey = parentKey ? `${parentKey}.${key}` : key;

    if (key === 'arbitrary' && Array.isArray(value)) {
      value.forEach((item) => {
        const itemKey = `${newKey}.${item.key}`;
        result[itemKey] = item.value;
      });
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, newKey, result);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && !Array.isArray(item) && key !== 'arbitrary') {
          flattenObject(item, `${newKey}[${index}]`, result);
        } else {
          result[`${newKey}[${index}]`] = item;
        }
      });
    } else {
      result[newKey] = value;
    }
  });

  return result;
}

export function createOptimizedPicture(
  src,
  alt = '',
  relative = true,
  eager = false,
  breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }],
) {
  let url;

  if (relative) {
    url = new URL(src);
  } else {
    url = new URL(src, window.location.href);
  }

  const picture = document.createElement('picture');
  const { pathname, href } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${relative ? pathname : href}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${relative ? pathname : href}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('src', `${relative ? pathname : href}?width=${br.width}&format=${ext}&optimize=medium`);
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
    }
  });

  return picture;
}

export function getIcon(tag) {
  const img = document.createElement('img');
  img.className = `icon icon-${tag}`;
  img.src = `/events/icons/${tag}.svg`;
  img.alt = tag;

  return img;
}

function toClassName(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

export function getSusiOptions(conf) {
  const { env: { name: envName } } = conf;
  const { href, hash } = window.location;

  const susiOptions = Object.keys(SUSI_OPTIONS).reduce((opts, key) => {
    opts[key] = SUSI_OPTIONS[key][envName] || SUSI_OPTIONS[key];
    return opts;
  }, {});

  if (hash.includes('#rsvp-form')) {
    susiOptions.redirect_uri = `${href}`;
  }

  return susiOptions;
}

export function readBlockConfig(block) {
  return [...block.querySelectorAll(':scope>div')].reduce((config, row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const valueEl = cols[1];
        const name = toClassName(cols[0].textContent);
        if (valueEl.querySelector('a')) {
          const aArr = [...valueEl.querySelectorAll('a')];
          if (aArr.length === 1) {
            config[name] = aArr[0].href;
          } else {
            config[name] = aArr.map((a) => a.href);
          }
        } else if (valueEl.querySelector('p')) {
          const pArr = [...valueEl.querySelectorAll('p')];
          if (pArr.length === 1) {
            config[name] = pArr[0].innerHTML;
          } else {
            config[name] = pArr.map((p) => p.innerHTML);
          }
        } else config[name] = row.children[1].innerHTML;
      }
    }

    return config;
  }, {});
}

/**
 * Parses a regular metadata path without array processing.
 * @param {string} path - The metadata path to parse
 * @param {Object} extraData - Optional extra data
 * @returns {*} The parsed value
 */
function parseRegularPath(path, extraData = {}) {
  // Split the path into segments using both . and : as delimiters
  const segments = path.split(/[.:]/).filter(Boolean);
  const delimiters = path.match(/[.:]/g) || [];

  // Get the base metadata value
  let currentValue = getMetadata(segments[0]);

  // If no metadata found, try extraData
  if (!currentValue) {
    return extraData[path] || '';
  }

  // Try to parse as JSON if it looks like JSON
  try {
    if (currentValue.startsWith('{') || currentValue.startsWith('[')) {
      currentValue = JSON.parse(currentValue);
    }
  } catch (e) {
    window.lana?.log(`Error while parsing metadata for ${path}:\n${JSON.stringify(e, null, 2)}`);
    return extraData[path] || '';
  }

  // Process remaining segments
  for (let i = 1; i < segments.length; i += 1) {
    const delimiter = delimiters[i - 1];
    const segment = segments[i];

    if (delimiter === ':') {
      // Array indexing
      const index = parseInt(segment, 10);
      if (Array.isArray(currentValue) && index >= 0 && index < currentValue.length) {
        currentValue = currentValue[index];
      } else {
        return extraData[path] || '';
      }
    } else if (currentValue && typeof currentValue === 'object') {
      // Object property access
      currentValue = currentValue[segment];
    } else {
      return extraData[path] || '';
    }
  }

  return currentValue || extraData[path] || '';
}

/**
 * Parses a metadata path string and returns the corresponding value from the metadata.
 * Supports combinations of object property access (.) and array indexing (:).
 * Also supports array iteration with @array(path)separator syntax.
 * Examples:
 * - attr (just accessing the attribute itself)
 * - attr.subattr (one level in object)
 * - attr:0 (attr is array after JSON.parse)
 * - attr.subattr:0.subsubattr
 * - attr:0.subattr
 * - attr:1.subattr:0
 * - @array(attr) (iterate over array with space separator)
 * - @array(attr.subattr), (iterate over nested array with comma separator)
 * - @array(attr.name) | (extract name attribute from objects with pipe separator)
 * @param {string} path - The metadata path to parse
 * @param {Object} extraData - Optional extra data to fall back to if metadata is not found
 * @returns {*} The parsed value from metadata
 */
export function parseMetadataPath(path, extraData = {}) {
  if (!path) return '';

  // Check if this is an array iteration request
  const arrayMatch = path.match(/^@array\(([^)]+)\)(.*)$/);
  if (!arrayMatch) {
    // Regular path parsing (no array processing)
    return parseRegularPath(path, extraData);
  }

  // Array iteration - parse the inner path first, then post-process
  const innerPath = arrayMatch[1];
  const separator = arrayMatch[2] || ' ';

  // Check if we need to extract a specific attribute from objects
  const pathParts = innerPath.split('.');
  const hasAttribute = pathParts.length > 1;

  let result;
  if (hasAttribute) {
    // Extract the attribute from each object in the array
    const attribute = pathParts[pathParts.length - 1];
    const basePath = pathParts.slice(0, -1).join('.');
    const baseArray = parseRegularPath(basePath, extraData);

    if (Array.isArray(baseArray)) {
      result = baseArray.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return item[attribute] ?? '';
        }
        // If the item is a primitive, just use it as-is
        return item;
      });
    } else {
      // If base path doesn't return an array, try parsing the full path
      result = parseRegularPath(innerPath, extraData);
    }
  } else {
    // Parse the inner path using regular logic
    result = parseRegularPath(innerPath, extraData);
    // If result is not an array, but is an object with a single array property, use that array
    if (!Array.isArray(result) && result && typeof result === 'object') {
      const arrayProps = Object.keys(result).filter((k) => Array.isArray(result[k]));
      if (arrayProps.length === 1) {
        result = result[arrayProps[0]];
      }
    }
  }

  // Post-process: if result is an array, join it with separator
  if (Array.isArray(result) && result.length > 0) {
    return result.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return JSON.stringify(item);
      }
      return String(item);
    }).join(separator);
  }

  // If not an array, return empty string
  return '';
}
