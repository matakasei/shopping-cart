import { describe, it, expect } from 'vitest';
import { encodeShareData, decodeShareData, SHARE_LIMITS } from '../shareUtils';

describe('shareUtils', () => {
  it('roundtrips cart items and budget through encode/decode', async () => {
    const input = {
      budget: 30000,
      items: [
        {
          title: 'イヤホン',
          price: 12990,
          quantity: 1,
          shipping: 0,
          points: 130,
          url: 'https://www.amazon.co.jp/dp/B0SAMPLE',
          imageUrl: '',
          included: false,
        },
      ],
    };

    const encoded = await encodeShareData(input);
    const decoded = await decodeShareData(encoded);

    expect(decoded.budget).toBe(30000);
    expect(decoded.items).toHaveLength(1);
    expect(decoded.items[0].title).toBe('イヤホン');
    expect(decoded.items[0].price).toBe(12990);
    expect(decoded.items[0].points).toBe(130);
    expect(decoded.items[0].included).toBe(false);
    expect(decoded.items[0].siteInfo.siteName).toBe('Amazon');
  });

  it('rejects oversized or malformed share parameters', async () => {
    const oversized = 'z' + 'A'.repeat(SHARE_LIMITS.MAX_ENCODED_LENGTH + 1);
    await expect(decodeShareData(oversized)).rejects.toThrow();
    await expect(decodeShareData('xInvalid')).rejects.toThrow();
  });
});
