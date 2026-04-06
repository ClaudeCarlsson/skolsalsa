import * as cheerio from 'cheerio';
import { sleep, jitter } from './rate-limiter.js';

const BASE_URL = 'https://siris.skolverket.se';
const SALSA_URL = `${BASE_URL}/siris/f?p=SIRIS:164:0::NO:::`;
const SESSION_TIMEOUT = 20 * 60 * 1000;
const MAX_RETRY_DEPTH = 3;

/**
 * Pure HTTP session manager for SIRIS/SALSA.
 * No browser needed - uses Node.js native fetch to replicate APEX interactions.
 */
export class SessionManager {
  constructor(logger) {
    this.sessionId = null;
    this.cookies = new Map();
    this.lastRefresh = 0;
    this.logger = logger || console;
    this.ajaxIds = {};
    this.selectedSchools = new Set();
  }

  async init() {
    await this.establish();
  }

  async establish() {
    this.logger.info('Establishing SIRIS session...');

    const resp = await fetch(SALSA_URL, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'SkolSalsa-SALSA-Scraper/1.0 (educational research)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
      },
    });

    if (!resp.ok) {
      throw new Error(`Failed to load SIRIS page: HTTP ${resp.status}`);
    }

    this._extractCookies(resp);
    const html = await resp.text();

    // Validate we got the actual SALSA page, not a login redirect
    if (!html.includes('P164_KOMMUN') && !html.includes('SALSA')) {
      throw new Error('SIRIS response does not contain expected SALSA page content');
    }

    const $ = cheerio.load(html);

    this.sessionId = $('#pInstance').val();
    if (!this.sessionId) {
      const match = html.match(/p_instance["\s]*(?:value="|:)\s*(\d+)/);
      if (match) this.sessionId = match[1];
    }

    if (!this.sessionId) {
      throw new Error('Failed to extract APEX session ID from page');
    }

    // Extract AJAX identifiers
    const ajaxMatch = html.match(/apex\.widget\.selectList\("#P164_KOMMUN".*?"ajaxIdentifier":"([^"]+)"/);
    if (ajaxMatch) this.ajaxIds.kommun = ajaxMatch[1];

    const orgMatch = html.match(/apex\.widget\.selectList\("#P164_ORG".*?"ajaxIdentifier":"([^"]+)"/);
    if (orgMatch) this.ajaxIds.org = orgMatch[1];

    const skolaMatch = html.match(/apex\.widget\.selectList\("#P164_SKOLA".*?"ajaxIdentifier":"([^"]+)"/);
    if (skolaMatch) this.ajaxIds.skola = skolaMatch[1];

    // Extract municipalities and organizations from the HTML
    this.municipalities = [];
    $('#P164_KOMMUN option').each((_, el) => {
      const val = $(el).attr('value');
      const text = $(el).text().trim();
      if (val && val !== '') {
        this.municipalities.push({ code: val, name: text });
      }
    });

    this.organizations = [];
    let isOld = false;
    $('#P164_ORG option').each((_, el) => {
      const val = $(el).attr('value');
      const text = $(el).text().trim();
      if (text === '--Äldre organisationer--') { isOld = true; return; }
      if (val && val !== '' && val !== '0' && !isOld) {
        this.organizations.push({ code: val, name: text });
      }
    });

    this.selectedSchools.clear();
    this.lastRefresh = Date.now();
    this.logger.info(`Session ${this.sessionId} | ${this.municipalities.length} munis | ${this.organizations.length} orgs`);
  }

  async ensureFresh() {
    if (Date.now() - this.lastRefresh > SESSION_TIMEOUT) {
      this.logger.info('Session expired, refreshing...');
      await this.establish();
    }
  }

  _extractCookies(resp) {
    const setCookies = resp.headers.getSetCookie?.() || [];
    for (const sc of setCookies) {
      const [pair] = sc.split(';');
      const [name, ...valueParts] = pair.split('=');
      this.cookies.set(name.trim(), valueParts.join('=').trim());
    }
  }

  _cookieHeader() {
    return Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async _fetch(url, options = {}, _retryCount = 0) {
    await this.ensureFresh();
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const resp = await fetch(fullUrl, {
      ...options,
      redirect: 'follow',
      headers: {
        'Cookie': this._cookieHeader(),
        'User-Agent': 'SkolSalsa-SALSA-Scraper/1.0 (educational research)',
        'Accept': options.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'sv-SE,sv;q=0.9',
        'Referer': `${BASE_URL}/siris/f?p=SIRIS:164:${this.sessionId}::NO:::`,
        ...options.headers,
      },
    });
    this._extractCookies(resp);

    // Update last activity timestamp on successful response
    this.lastRefresh = Date.now();

    if (!resp.ok) {
      if (resp.status === 401 && _retryCount < MAX_RETRY_DEPTH) {
        this.logger.warn(`Session invalidated (${resp.status}), re-establishing (attempt ${_retryCount + 1})...`);
        await this.establish();
        return this._fetch(url, options, _retryCount + 1);
      }
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    // Detect silent redirect to login page (redirect:follow masks 302s)
    const finalUrl = resp.url || '';
    if (finalUrl.includes('login') || finalUrl.includes('p=SIRIS:101:')) {
      if (_retryCount < MAX_RETRY_DEPTH) {
        this.logger.warn('Redirected to login page, re-establishing session...');
        await this.establish();
        return this._fetch(url, options, _retryCount + 1);
      }
      throw new Error('Session expired: redirected to login page after max retries');
    }

    return resp;
  }

  async addSchool(schoolCode) {
    this.selectedSchools.add(schoolCode);
    return this._fetch(
      `/siris/ris.salsa_ui.addSelected?psType=S&psvalue=${encodeURIComponent(schoolCode)}`,
      { method: 'POST' }
    );
  }

  async removeSchool(schoolCode) {
    this.selectedSchools.delete(schoolCode);
    return this._fetch(
      `/siris/ris.salsa_ui.delSelected?psType=S&psvalue=${encodeURIComponent(schoolCode)}`,
      { method: 'POST' }
    );
  }

  async selectAllYears() {
    return this._fetch(
      '/siris/ris.salsa_ui.addSelected?psType=Y&psvalue=A',
      { method: 'POST' }
    );
  }

  async selectYear(year) {
    return this._fetch(
      `/siris/ris.salsa_ui.addSelected?psType=Y&psvalue=${encodeURIComponent(String(year))}`,
      { method: 'POST' }
    );
  }

  /**
   * Clear all school selections by removing each individually.
   */
  async clearAllSchools() {
    const toRemove = Array.from(this.selectedSchools);
    const errors = [];
    for (const code of toRemove) {
      try {
        await this._fetch(
          `/siris/ris.salsa_ui.delSelected?psType=S&psvalue=${encodeURIComponent(code)}`,
          { method: 'POST' }
        );
      } catch (err) {
        errors.push(err);
      }
    }
    this.selectedSchools.clear();

    if (errors.length > 0) {
      this.logger.warn(`clearAllSchools: ${errors.length}/${toRemove.length} removals failed`);
    }
  }

  async getSchoolsForMunicipality(municipalityCode) {
    return this._getSchools('', municipalityCode, '');
  }

  async getSchoolsForOrganization(orgCode) {
    return this._getSchools('', '', orgCode);
  }

  async _getSchools(huvudman, kommun, org) {
    const ajaxId = this.ajaxIds.skola;

    const items = [];
    const values = [];
    if (kommun) { items.push('P164_KOMMUN'); values.push(encodeURIComponent(kommun)); }
    if (org) { items.push('P164_ORG'); values.push(encodeURIComponent(org)); }
    if (huvudman) { items.push('P164_HUVUDMAN'); values.push(encodeURIComponent(huvudman)); }

    const itemStr = items.join(',');
    const valueStr = values.join(',');

    const pageUrl = `/siris/f?p=SIRIS:164:${this.sessionId}::NO::${itemStr}:${valueStr}`;
    const resp = await this._fetch(pageUrl);
    const html = await resp.text();

    const $ = cheerio.load(html);

    const newSessionId = $('#pInstance').val();
    if (newSessionId) this.sessionId = newSessionId;

    const skolaMatch = html.match(/apex\.widget\.selectList\("#P164_SKOLA".*?"ajaxIdentifier":"([^"]+)"/);
    if (skolaMatch) this.ajaxIds.skola = skolaMatch[1];

    const schools = [];
    $('#P164_SKOLA option').each((_, el) => {
      const val = $(el).attr('value');
      const name = $(el).text().trim();
      if (val && val !== '' && val !== '0') {
        schools.push({ code: val, name });
      }
    });

    // If dropdown is empty, try AJAX refresh with session state already set
    if (schools.length === 0 && ajaxId) {
      const body = new URLSearchParams();
      body.set('p_request', `PLUGIN=${this.ajaxIds.skola}`);
      body.set('p_flow_id', '101');
      body.set('p_flow_step_id', '164');
      body.set('p_instance', this.sessionId);

      try {
        const ajaxResp = await this._fetch('/siris/wwv_flow.show', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: body.toString(),
        });
        const ajaxText = await ajaxResp.text();
        return this._parseSelectOptions(ajaxText);
      } catch (err) {
        this.logger.warn(`AJAX school refresh failed: ${err.message}`);
      }
    }

    return schools;
  }

  _parseSelectOptions(text) {
    const schools = [];

    if (text.includes('<option')) {
      const $ = cheerio.load(`<select>${text}</select>`);
      $('option').each((_, el) => {
        const val = $(el).attr('value');
        const name = $(el).text().trim();
        if (val && val !== '' && val !== '0') {
          schools.push({ code: val, name });
        }
      });
      return schools;
    }

    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data.filter(d => d.r && d.r !== '0').map(d => ({ code: d.r, name: d.d }));
      }
      if (data.values) {
        return data.values.filter(v => v.r && v.r !== '0').map(v => ({ code: v.r, name: v.d }));
      }
    } catch {
      // Not JSON - return empty
    }

    return schools;
  }

  async getTablePage() {
    await this.ensureFresh();
    const url = `/siris/f?p=SIRIS:165:${this.sessionId}::NO:::`;
    const resp = await this._fetch(url);
    return resp.text();
  }

  async close() {
    this.logger.info('Session closed');
  }
}
