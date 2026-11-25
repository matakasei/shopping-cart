/**
 * URLからサイトの情報を解析・サニタイズするユーティリティ
 */

export const MAX_URL_LENGTH = 2048;

const SITE_DEFINITIONS = [
  {
    name: 'Amazon',
    domains: ['amazon.co.jp', 'amazon.com', 'amzn.to'],
    color: 'var(--color-amazon)',
    logoText: 'Amazon',
  },
  {
    name: '楽天',
    domains: ['rakuten.co.jp'],
    color: 'var(--color-rakuten)',
    logoText: 'Rakuten',
  },
  {
    name: 'Yahoo!ショッピング',
    domains: ['shopping.yahoo.co.jp', 'paypaymall.yahoo.co.jp'],
    color: 'var(--color-yahoo)',
    logoText: 'Yahoo!',
  },
];

/**
 * http / https の安全なURLのみ許可し、それ以外は空文字を返す
 */
export const sanitizeHttpUrl = (urlStr) => {
  if (typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return '';

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
};

/**
 * ホスト名が定義済みドメインと完全一致または正規のサブドメインかを判定する
 */
export const isDomainMatch = (hostname, domain) => {
  const host = hostname.toLowerCase();
  const target = domain.toLowerCase();
  return host === target || host.endsWith(`.${target}`);
};

export const parseUrl = (urlStr) => {
  const safeUrl = sanitizeHttpUrl(urlStr);
  if (!safeUrl) {
    return {
      siteName: '手動入力',
      color: 'var(--color-other)',
      logoText: 'MEMO',
      domain: '',
    };
  }

  try {
    const url = new URL(safeUrl);
    const domain = url.hostname.replace(/^www\./, '').toLowerCase();

    const site = SITE_DEFINITIONS.find((s) =>
      s.domains.some((d) => isDomainMatch(domain, d))
    );

    if (site) {
      return {
        siteName: site.name,
        color: site.color,
        logoText: site.logoText,
        domain,
      };
    }

    return {
      siteName: domain,
      color: 'var(--color-other)',
      logoText: 'WEB',
      domain,
    };
  } catch {
    return {
      siteName: 'Unknown',
      color: 'var(--color-other)',
      logoText: '?',
      domain: '',
    };
  }
};

/**
 * Microlink APIを利用してタイトルと画像を取得する（タイムアウト・HTTPエラー対応）
 */
export const fetchUrlInfo = async (urlStr, { timeoutMs = 6000, fetchImpl = fetch } = {}) => {
  const safeUrl = sanitizeHttpUrl(urlStr);
  if (!safeUrl) {
    return { ok: false, reason: 'invalid_url', data: null };
  }

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(safeUrl)}`;
    const response = await fetchImpl(apiUrl, { signal: controller.signal });

    if (!response.ok) {
      return {
        ok: false,
        reason: 'http_error',
        status: response.status,
        data: null,
      };
    }

    const payload = await response.json();
    const rawData = payload?.status === 'success' ? payload.data : null;

    if (!rawData) {
      return { ok: false, reason: 'empty', data: null };
    }

    const title = typeof rawData.title === 'string' ? rawData.title.trim() : '';
    const image = sanitizeHttpUrl(rawData.image?.url || rawData.logo?.url || '');
    const description = typeof rawData.description === 'string' ? rawData.description.trim() : '';

    return {
      ok: Boolean(title || image),
      reason: title || image ? 'ok' : 'empty',
      data: {
        title,
        image,
        description,
        price: '',
      },
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { ok: false, reason: 'timeout', data: null };
    }
    return { ok: false, reason: 'network_error', data: null };
  } finally {
    clearTimeout(timerId);
  }
};
