/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { lazyCaptureProfile } from './profile.js';
import autoUpdateContent, { getNonProdData, validatePageAndRedirect } from './content-update.js';
import { getSusiOptions, setMetadata, getMetadata, getEventServiceEnv, LIBS } from './utils.js';

const {
  loadArea,
  setConfig,
  updateConfig,
  getConfig,
  loadLana,
  getLocale,
} = await import(`${LIBS}/utils/utils.js`);

export default function decorateArea(area = document) {
  const parsePhotosData = () => {
    const output = {};

    if (!area) return output;

    try {
      const photosData = JSON.parse(getMetadata('photos'));

      photosData.forEach((photo) => {
        output[photo.imageKind] = photo;
      });
    } catch (e) {
      window.lana?.log(`Failed to parse photos metadata:\n${JSON.stringify(e, null, 2)}`);
    }

    return output;
  };

  const eagerLoad = (parent, selector) => {
    const img = parent.querySelector(selector);
    img?.removeAttribute('loading');
  };

  (async function loadLCPImage() {
    const marquee = area.querySelector('.marquee');
    if (!marquee) {
      eagerLoad(area, 'img');
      return;
    }

    // First image of first row
    eagerLoad(marquee, 'div:first-child img');
    // Last image of last column of last row
    eagerLoad(marquee, 'div:last-child > div:last-child img');
  }());

  if (getMetadata('event-details-page') !== 'yes') return;

  const photosData = parsePhotosData(area);

  const miloDeps = {
    miloLibs: LIBS,
    getConfig,
  };

  autoUpdateContent(area, miloDeps, photosData);
}

const prodDomains = ['milo.adobe.com', 'business.adobe.com', 'www.adobe.com', 'news.adobe.com', 'helpx.adobe.com'];

// Add project-wide style path here.
const STYLES = '';

// Add any config options.
const CONFIG = {
  codeRoot: '/events',
  contentRoot: '/events',
  imsClientId: 'events-milo',
  miloLibs: LIBS,
  prodDomains,
  htmlExclude: [
    /www\.adobe\.com\/(\w\w(_\w\w)?\/)?express(\/.*)?/,
    /www\.adobe\.com\/(\w\w(_\w\w)?\/)?go(\/.*)?/,
    /www\.adobe\.com\/(\w\w(_\w\w)?\/)?learn(\/.*)?/,
  ],
  // imsScope: 'AdobeID,openid,gnav',
  // geoRouting: 'off',
  // fallbackRouting: 'off',
  decorateArea,
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    ae_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    ae_en: { ietf: 'en', tk: 'hah7vzn.css' },
    africa: { ietf: 'en', tk: 'hah7vzn.css' },
    ar: { ietf: 'es-AR', tk: 'hah7vzn.css' },
    at: { ietf: 'de-AT', tk: 'hah7vzn.css' },
    au: { ietf: 'en-AU', tk: 'hah7vzn.css' },
    be_en: { ietf: 'en-BE', tk: 'hah7vzn.css' },
    be_fr: { ietf: 'fr-BE', tk: 'hah7vzn.css' },
    be_nl: { ietf: 'nl-BE', tk: 'qxw8hzm.css' },
    bg: { ietf: 'bg-BG', tk: 'qxw8hzm.css' },
    br: { ietf: 'pt-BR', tk: 'hah7vzn.css' },
    ca_fr: { ietf: 'fr-CA', tk: 'hah7vzn.css' },
    ca: { ietf: 'en-CA', tk: 'hah7vzn.css' },
    ch_de: { ietf: 'de-CH', tk: 'hah7vzn.css' },
    ch_fr: { ietf: 'fr-CH', tk: 'hah7vzn.css' },
    ch_it: { ietf: 'it-CH', tk: 'hah7vzn.css' },
    cl: { ietf: 'es-CL', tk: 'hah7vzn.css' },
    cn: { ietf: 'zh-CN', tk: 'qxw8hzm' },
    co: { ietf: 'es-CO', tk: 'hah7vzn.css' },
    cr: { ietf: 'es-419', tk: 'hah7vzn.css' },
    cy_en: { ietf: 'en-CY', tk: 'hah7vzn.css' },
    cz: { ietf: 'cs-CZ', tk: 'qxw8hzm.css' },
    de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
    dk: { ietf: 'da-DK', tk: 'qxw8hzm.css' },
    ec: { ietf: 'es-419', tk: 'hah7vzn.css' },
    ee: { ietf: 'et-EE', tk: 'qxw8hzm.css' },
    eg_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    eg_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    el: { ietf: 'el', tk: 'qxw8hzm.css' },
    es: { ietf: 'es-ES', tk: 'hah7vzn.css' },
    fi: { ietf: 'fi-FI', tk: 'qxw8hzm.css' },
    fr: { ietf: 'fr-FR', tk: 'hah7vzn.css' },
    gr_el: { ietf: 'el', tk: 'qxw8hzm.css' },
    gr_en: { ietf: 'en-GR', tk: 'hah7vzn.css' },
    gt: { ietf: 'es-419', tk: 'hah7vzn.css' },
    hk_en: { ietf: 'en-HK', tk: 'hah7vzn.css' },
    hk_zh: { ietf: 'zh-HK', tk: 'jay0ecd' },
    hu: { ietf: 'hu-HU', tk: 'qxw8hzm.css' },
    id_en: { ietf: 'en', tk: 'hah7vzn.css' },
    id_id: { ietf: 'id', tk: 'qxw8hzm.css' },
    ie: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    il_en: { ietf: 'en-IL', tk: 'hah7vzn.css' },
    il_he: { ietf: 'he', tk: 'qxw8hzm.css', dir: 'rtl' },
    in_hi: { ietf: 'hi', tk: 'qxw8hzm.css' },
    in: { ietf: 'en-IN', tk: 'hah7vzn.css' },
    it: { ietf: 'it-IT', tk: 'hah7vzn.css' },
    jp: { ietf: 'ja-JP', tk: 'dvg6awq' },
    kr: { ietf: 'ko-KR', tk: 'qjs5sfm' },
    kw_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    kw_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    la: { ietf: 'es-LA', tk: 'hah7vzn.css' },
    langstore: { ietf: 'en-US', tk: 'hah7vzn.css' },
    lt: { ietf: 'lt-LT', tk: 'qxw8hzm.css' },
    lu_de: { ietf: 'de-LU', tk: 'hah7vzn.css' },
    lu_en: { ietf: 'en-LU', tk: 'hah7vzn.css' },
    lu_fr: { ietf: 'fr-LU', tk: 'hah7vzn.css' },
    lv: { ietf: 'lv-LV', tk: 'qxw8hzm.css' },
    mena_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    mena_en: { ietf: 'en', tk: 'hah7vzn.css' },
    mt: { ietf: 'en-MT', tk: 'hah7vzn.css' },
    mx: { ietf: 'es-MX', tk: 'hah7vzn.css' },
    my_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    my_ms: { ietf: 'ms', tk: 'qxw8hzm.css' },
    ng: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    nl: { ietf: 'nl-NL', tk: 'qxw8hzm.css' },
    no: { ietf: 'no-NO', tk: 'qxw8hzm.css' },
    nz: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    pe: { ietf: 'es-PE', tk: 'hah7vzn.css' },
    ph_en: { ietf: 'en', tk: 'hah7vzn.css' },
    ph_fil: { ietf: 'fil-PH', tk: 'qxw8hzm.css' },
    pl: { ietf: 'pl-PL', tk: 'qxw8hzm.css' },
    pr: { ietf: 'es-419', tk: 'hah7vzn.css' },
    pt: { ietf: 'pt-PT', tk: 'hah7vzn.css' },
    qa_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    qa_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    ro: { ietf: 'ro-RO', tk: 'qxw8hzm.css' },
    ru: { ietf: 'ru-RU', tk: 'qxw8hzm.css' },
    sa_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
    sa_en: { ietf: 'en', tk: 'hah7vzn.css' },
    se: { ietf: 'sv-SE', tk: 'qxw8hzm.css' },
    sg: { ietf: 'en-SG', tk: 'hah7vzn.css' },
    si: { ietf: 'sl-SI', tk: 'qxw8hzm.css' },
    sk: { ietf: 'sk-SK', tk: 'qxw8hzm.css' },
    th_en: { ietf: 'en', tk: 'hah7vzn.css' },
    th_th: { ietf: 'th', tk: 'lqo2bst.css' },
    tr: { ietf: 'tr-TR', tk: 'qxw8hzm.css' },
    tw: { ietf: 'zh-TW', tk: 'jay0ecd' },
    ua: { ietf: 'uk-UA', tk: 'qxw8hzm.css' },
    uk: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    vn_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    vn_vi: { ietf: 'vi', tk: 'qxw8hzm.css' },
    za: { ietf: 'en-GB', tk: 'hah7vzn.css' },
  },
  adobeid: {
    enableGuestAccounts: true,
    enableGuestTokenForceRefresh: true,
    enableGuestBotDetection: false,
    api_parameters: { check_token: { guest_allowed: true } },
    onTokenExpired: () => {
      window.locaton.reload();
    },
  },
};

const MILO_CONFIG = setConfig({ ...CONFIG });
updateConfig({ ...MILO_CONFIG, signInContext: getSusiOptions(MILO_CONFIG) });

function renderWithNonProdMetadata() {
  const isEventDetailsPage = getMetadata('event-details-page') === 'yes';

  if (!isEventDetailsPage) return false;

  const isLiveProd = getEventServiceEnv() === 'prod' && window.location.hostname === 'www.adobe.com';
  const isMissingEventId = !getMetadata('event-id');

  if (!isLiveProd && isMissingEventId) return true;

  const isPreviewMode = new URLSearchParams(window.location.search).get('previewMode');

  if (isLiveProd && isPreviewMode) return true;

  return false;
}

async function fetchAndDecorateArea() {
  // Load non-prod data for stage and dev environments
  let env = getEventServiceEnv();
  if (env === 'local') env = 'dev';
  const nonProdData = await getNonProdData(env);
  if (!nonProdData) return;
  Object.entries(nonProdData).forEach(([key, value]) => {
    setMetadata(key, value);
  });

  decorateArea();
}

function replaceDotMedia(area = document) {
  const { prefix } = getLocale(CONFIG.locales);
  const currUrl = new URL(window.location);
  const pathSeg = currUrl.pathname.split('/').length;
  if ((prefix === '' && pathSeg >= 3) || (prefix !== '' && pathSeg >= 4)) return;
  const resetAttributeBase = (tag, attr) => {
    area.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((el) => {
      el[attr] = `${new URL(`${CONFIG.contentRoot}${el.getAttribute(attr).substring(1)}`, window.location).href}`;
    });
  };
  resetAttributeBase('img', 'src');
  resetAttributeBase('source', 'srcset');
}

replaceDotMedia(document);

// Decorate the page with site specific needs.

decorateArea();

// fetch metadata json and decorate again if non-prod or prod + preview mode
if (renderWithNonProdMetadata()) await fetchAndDecorateArea();

// Validate the page and redirect if is event-details-page
if (getMetadata('event-details-page') === 'yes') await validatePageAndRedirect(LIBS);

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

(function loadStyles() {
  const paths = [`${LIBS}/styles/styles.css`];
  if (STYLES) { paths.push(STYLES); }
  paths.forEach((path) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    document.head.appendChild(link);
  });
}());

async function loadPage() {
  await loadLana({ clientId: 'events-milo' });
  await loadArea().then(() => {
    if (getMetadata('event-details-page') === 'yes') lazyCaptureProfile();
  });
}

(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());

(async function init() {
  await loadPage()
})()
