import { validateCartItems, validateBudget, LIMITS } from './storageUtils';
import { sanitizeHttpUrl } from './urlParser';

export const SHARE_LIMITS = {
  MAX_ENCODED_LENGTH: 16384,
  MAX_DECOMPRESSED_BYTES: 65536,
};

const bytesToBase64Url = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlToBytes = (str) => {
  if (typeof str !== 'string' || !/^[A-Za-z0-9\-_]+$/.test(str)) {
    throw new Error('Invalid base64url characters.');
  }
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const runStreamTransform = async (bytes, stream, maxOutputBytes = SHARE_LIMITS.MAX_DECOMPRESSED_BYTES) => {
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxOutputBytes) {
      await reader.cancel();
      throw new Error('Decompressed share payload exceeds size limit.');
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
};

/**
 * カート内容と目標予算を圧縮してURLパラメータ用文字列にエンコードする
 */
export const encodeShareData = async ({ items, budget }) => {
  const validItems = validateCartItems(items);
  const validBudget = validateBudget(budget);

  const payload = {
    v: 1,
    b: validBudget,
    i: validItems.map((item) => ({
      t: item.title,
      p: item.price,
      q: item.quantity,
      s: item.shipping,
      pt: item.points,
      u: sanitizeHttpUrl(item.url),
      img: sanitizeHttpUrl(item.imageUrl),
      sn: item.url ? undefined : item.siteInfo?.siteName,
      inc: item.included === false ? 0 : undefined,
    })),
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));

  let encoded;
  if (typeof CompressionStream !== 'undefined') {
    const compressed = await runStreamTransform(jsonBytes, new CompressionStream('deflate-raw'));
    encoded = 'z' + bytesToBase64Url(compressed);
  } else {
    encoded = 'j' + bytesToBase64Url(jsonBytes);
  }

  if (encoded.length > SHARE_LIMITS.MAX_ENCODED_LENGTH) {
    throw new Error('Share URL exceeds maximum supported length.');
  }

  return encoded;
};

/**
 * URLパラメータからカート内容と目標予算を厳密に検証して復元する
 */
export const decodeShareData = async (encoded) => {
  if (typeof encoded !== 'string' || encoded.length < 2) {
    throw new Error('Invalid share parameter.');
  }
  if (encoded.length > SHARE_LIMITS.MAX_ENCODED_LENGTH) {
    throw new Error('Share parameter exceeds maximum length.');
  }

  const prefix = encoded[0];
  const body = encoded.slice(1);
  const bytes = base64UrlToBytes(body);

  let jsonBytes = bytes;
  if (prefix === 'z') {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('DecompressionStream is not supported in this browser.');
    }
    jsonBytes = await runStreamTransform(
      bytes,
      new DecompressionStream('deflate-raw'),
      SHARE_LIMITS.MAX_DECOMPRESSED_BYTES
    );
  } else if (prefix === 'j') {
    if (bytes.byteLength > SHARE_LIMITS.MAX_DECOMPRESSED_BYTES) {
      throw new Error('Share payload exceeds size limit.');
    }
  } else {
    throw new Error('Unknown share format.');
  }

  const parsed = JSON.parse(new TextDecoder().decode(jsonBytes));
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.i)) {
    throw new Error('Invalid share payload.');
  }

  const now = Date.now();
  const rawItems = parsed.i.slice(0, LIMITS.MAX_ITEMS).map((entry, idx) => {
    if (!entry || typeof entry !== 'object') return null;
    return {
      title: entry.t,
      price: entry.p,
      quantity: entry.q,
      shipping: entry.s,
      points: entry.pt,
      url: entry.u,
      imageUrl: entry.img,
      siteInfo: entry.sn ? { siteName: entry.sn } : undefined,
      included: entry.inc !== 0,
      addedAt: now - idx,
    };
  });

  const items = validateCartItems(rawItems);
  const budget = validateBudget(parsed.b);

  return { items, budget };
};
