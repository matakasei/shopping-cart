import { v4 as uuidv4 } from 'uuid';
import { parseUrl } from './urlParser';

const jpyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
});

export const formatJPY = (amount) => jpyFormatter.format(Math.round(Number(amount) || 0));

/**
 * 1商品の金額内訳を計算する
 * 実質合計 = 本体価格 × 数量 + 送料 - ポイント還元
 */
export const getItemBreakdown = (item) => {
  const price = Math.max(0, Number(item.price) || 0);
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const shipping = Math.max(0, Number(item.shipping) || 0);
  const points = Math.max(0, Number(item.points) || 0);

  const subtotal = price * quantity;
  const paymentTotal = subtotal + shipping;
  const effectiveTotal = paymentTotal - points;

  return {
    price,
    quantity,
    shipping,
    points,
    subtotal,
    paymentTotal,
    effectiveTotal,
  };
};

/**
 * カート全体の集計とサイト別小計を計算する
 */
export const getCartSummary = (items) => {
  const totals = items.reduce(
    (acc, item) => {
      const b = getItemBreakdown(item);
      acc.subtotal += b.subtotal;
      acc.shipping += b.shipping;
      acc.points += b.points;
      acc.paymentTotal += b.paymentTotal;
      acc.effectiveTotal += b.effectiveTotal;
      acc.totalQuantity += b.quantity;
      return acc;
    },
    {
      subtotal: 0,
      shipping: 0,
      points: 0,
      paymentTotal: 0,
      effectiveTotal: 0,
      totalQuantity: 0,
    }
  );

  const siteMap = new Map();
  items.forEach((item) => {
    const siteName = item.siteInfo?.siteName || 'その他';
    const color = item.siteInfo?.color || 'var(--color-other)';
    const b = getItemBreakdown(item);

    if (!siteMap.has(siteName)) {
      siteMap.set(siteName, {
        siteName,
        color,
        itemCount: 0,
        quantityCount: 0,
        subtotal: 0,
        shipping: 0,
        points: 0,
        effectiveTotal: 0,
      });
    }

    const entry = siteMap.get(siteName);
    entry.itemCount += 1;
    entry.quantityCount += b.quantity;
    entry.subtotal += b.subtotal;
    entry.shipping += b.shipping;
    entry.points += b.points;
    entry.effectiveTotal += b.effectiveTotal;
  });

  const siteSubtotals = Array.from(siteMap.values()).sort(
    (a, b) => b.effectiveTotal - a.effectiveTotal
  );

  return {
    ...totals,
    siteSubtotals,
  };
};

/**
 * 初回お試し用のサンプル商品データを生成する
 */
export const createSampleCartItems = () => {
  const now = Date.now();
  const samples = [
    {
      url: 'https://www.amazon.co.jp/dp/B0SAMPLE01',
      title: 'Anker Soundcore Liberty 4 NC ワイヤレスイヤホン',
      price: 12990,
      quantity: 1,
      shipping: 0,
      points: 130,
      imageUrl: '',
    },
    {
      url: 'https://item.rakuten.co.jp/sample-shop/thermos-mug/',
      title: 'サーモス 真空断熱マグカップ 350ml（まとめ買い）',
      price: 2480,
      quantity: 2,
      shipping: 550,
      points: 248,
      imageUrl: '',
    },
    {
      url: 'https://store.shopping.yahoo.co.jp/sample/mx-master-3s.html',
      title: 'ロジクール MX MASTER 3S ワイヤレスマウス',
      price: 14800,
      quantity: 1,
      shipping: 0,
      points: 740,
      imageUrl: '',
    },
  ];

  return samples.map((s, index) => ({
    id: uuidv4(),
    ...s,
    siteInfo: parseUrl(s.url),
    addedAt: now - index * 1000,
  }));
};
