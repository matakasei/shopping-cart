import { v4 as uuidv4 } from 'uuid';
import { parseUrl } from './urlParser';

const bytesToBase64Url = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlToBytes = (str) => {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const runStreamTransform = async (bytes, stream) => {
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const buffer = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(buffer);
};

/**
 * カート内容と目標予算を圧縮してURLパラメータ用文字列にエンコードする
 */
export const encodeShareData = async ({ items, budget }) => {
  const payload = {
    v: 1,
    b: budget != null && budget > 0 ? Number(budget) : null,
    i: items.map((item) => ({
      t: item.title,
      p: Number(item.price) || 0,
      q: Math.max(1, Number(item.quantity) || 1),
      s: Math.max(0, Number(item.shipping) || 0),
      pt: Math.max(0, Number(item.points) || 0),
      u: item.url || '',
      img: item.imageUrl || '',
      sn: item.url ? undefined : item.siteInfo?.siteName,
    })),
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));

  if (typeof CompressionStream !== 'undefined') {
    const compressed = await runStreamTransform(jsonBytes, new CompressionStream('deflate-raw'));
    return 'z' + bytesToBase64Url(compressed);
  }

  return 'j' + bytesToBase64Url(jsonBytes);
};

/**
 * URLパラメータからカート内容と目標予算を復元する
 */
export const decodeShareData = async (encoded) => {
  if (!encoded || encoded.length < 2) return null;

  const prefix = encoded[0];
  const body = encoded.slice(1);
  const bytes = base64UrlToBytes(body);

  let jsonBytes = bytes;
  if (prefix === 'z') {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('DecompressionStream is not supported in this browser.');
    }
    jsonBytes = await runStreamTransform(bytes, new DecompressionStream('deflate-raw'));
  } else if (prefix !== 'j') {
    throw new Error('Unknown share format.');
  }

  const parsed = JSON.parse(new TextDecoder().decode(jsonBytes));
  if (!parsed || !Array.isArray(parsed.i)) {
    throw new Error('Invalid share payload.');
  }

  const now = Date.now();
  const items = parsed.i.map((entry, idx) => {
    const url = typeof entry.u === 'string' ? entry.u : '';
    const siteInfo = url
      ? parseUrl(url)
      : {
          siteName: entry.sn || '手動入力',
          color: 'var(--color-other)',
          logoText: 'MEMO',
          domain: '',
        };

    return {
      id: uuidv4(),
      url,
      title: String(entry.t || '名称未設定の商品'),
      price: Math.max(0, Number(entry.p) || 0),
      quantity: Math.max(1, Number(entry.q) || 1),
      shipping: Math.max(0, Number(entry.s) || 0),
      points: Math.max(0, Number(entry.pt) || 0),
      imageUrl: typeof entry.img === 'string' ? entry.img : '',
      siteInfo,
      addedAt: now - idx,
    };
  });

  const budget = parsed.b != null && Number(parsed.b) > 0 ? Number(parsed.b) : null;

  return { items, budget };
};
