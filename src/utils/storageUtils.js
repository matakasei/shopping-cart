import { v4 as uuidv4 } from 'uuid';
import { parseUrl, sanitizeHttpUrl } from './urlParser';

export const LIMITS = {
  MAX_ITEMS: 100,
  MAX_SAVED_CARTS: 50,
  MAX_TITLE_LENGTH: 200,
  MAX_CART_NAME_LENGTH: 100,
  MAX_SITE_NAME_LENGTH: 60,
  MAX_PRICE: 100_000_000,
  MAX_QUANTITY: 999,
  MAX_BUDGET: 1_000_000_000,
};

const clampInt = (val, min, max, fallback = min) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
};

const sanitizeText = (val, maxLen, fallback = '') => {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen) || fallback;
};

/**
 * 1商品データの型・範囲・URLプロトコルを検証して正規化する
 */
export const validateAndNormalizeItem = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const title = sanitizeText(raw.title, LIMITS.MAX_TITLE_LENGTH);
  if (!title) return null;

  const url = sanitizeHttpUrl(raw.url || '');
  const imageUrl = sanitizeHttpUrl(raw.imageUrl || '');

  const parsedSite = url
    ? parseUrl(url)
    : {
        siteName: sanitizeText(raw.siteInfo?.siteName, LIMITS.MAX_SITE_NAME_LENGTH, '手動入力'),
        color:
          typeof raw.siteInfo?.color === 'string' && raw.siteInfo.color.length <= 40
            ? raw.siteInfo.color
            : 'var(--color-other)',
        logoText: sanitizeText(raw.siteInfo?.logoText, 12, 'MEMO'),
        domain: '',
      };

  return {
    id: typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 64 ? raw.id : uuidv4(),
    url,
    title,
    price: clampInt(raw.price, 0, LIMITS.MAX_PRICE, 0),
    quantity: clampInt(raw.quantity, 1, LIMITS.MAX_QUANTITY, 1),
    shipping: clampInt(raw.shipping, 0, LIMITS.MAX_PRICE, 0),
    points: clampInt(raw.points, 0, LIMITS.MAX_PRICE, 0),
    imageUrl,
    siteInfo: parsedSite,
    included: raw.included !== false,
    addedAt: Number.isFinite(Number(raw.addedAt)) ? Number(raw.addedAt) : Date.now(),
  };
};

/**
 * 商品配列を検証し、上限件数以内に正規化する
 */
export const validateCartItems = (rawList) => {
  if (!Array.isArray(rawList)) return [];
  const normalized = [];
  for (const raw of rawList) {
    if (normalized.length >= LIMITS.MAX_ITEMS) break;
    const item = validateAndNormalizeItem(raw);
    if (item) normalized.push(item);
  }
  return normalized;
};

/**
 * 保存済みカート一覧を検証し、上限件数以内に正規化する
 */
export const validateSavedCarts = (rawList) => {
  if (!Array.isArray(rawList)) return [];
  const normalized = [];
  for (const raw of rawList) {
    if (normalized.length >= LIMITS.MAX_SAVED_CARTS) break;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;

    const name = sanitizeText(raw.name, LIMITS.MAX_CART_NAME_LENGTH);
    if (!name) continue;

    const items = validateCartItems(raw.items);
    const budget =
      raw.budget != null && Number.isFinite(Number(raw.budget)) && Number(raw.budget) > 0
        ? clampInt(raw.budget, 1, LIMITS.MAX_BUDGET, null)
        : null;

    normalized.push({
      id: typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 64 ? raw.id : uuidv4(),
      name,
      items,
      total: clampInt(raw.total, 0, LIMITS.MAX_BUDGET, 0),
      budget,
      savedAt: Number.isFinite(Number(raw.savedAt)) ? Number(raw.savedAt) : Date.now(),
    });
  }
  return normalized;
};

export const validateBudget = (raw) => {
  if (raw == null || raw === '') return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return null;
  return clampInt(num, 1, LIMITS.MAX_BUDGET, null);
};

/**
 * localStorage から安全に読み込み・検証する
 */
export const safeReadStorage = (key, validator, fallback, storage = globalThis.localStorage) => {
  try {
    if (!storage) return fallback;
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return validator ? validator(parsed) : parsed;
  } catch {
    return fallback;
  }
};

/**
 * localStorage へ安全に書き込む（容量超過・無効環境でも例外を外に出さない）
 */
export const safeWriteStorage = (key, value, storage = globalThis.localStorage) => {
  try {
    if (!storage) return { ok: false, reason: 'unavailable' };
    if (value == null) {
      storage.removeItem(key);
    } else {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      storage.setItem(key, serialized);
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error?.name === 'QuotaExceededError' ? 'quota_exceeded' : 'storage_error',
    };
  }
};
