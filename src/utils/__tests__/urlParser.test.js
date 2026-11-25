import { describe, it, expect, vi } from 'vitest';
import { parseUrl, sanitizeHttpUrl, isDomainMatch, fetchUrlInfo } from '../urlParser';

describe('urlParser', () => {
  it('allows only http and https protocols', () => {
    expect(sanitizeHttpUrl('https://www.amazon.co.jp/dp/B000')).toBe('https://www.amazon.co.jp/dp/B000');
    expect(sanitizeHttpUrl('http://example.com/item')).toBe('http://example.com/item');
    expect(sanitizeHttpUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(sanitizeHttpUrl('not-a-url')).toBe('');
  });

  it('matches exact domains and genuine subdomains without spoofing', () => {
    expect(isDomainMatch('amazon.co.jp', 'amazon.co.jp')).toBe(true);
    expect(isDomainMatch('smile.amazon.co.jp', 'amazon.co.jp')).toBe(true);
    expect(isDomainMatch('evil-amazon.co.jp', 'amazon.co.jp')).toBe(false);
    expect(isDomainMatch('amazon.co.jp.evil.com', 'amazon.co.jp')).toBe(false);
  });

  it('parses known EC sites and falls back safely on unknown/spoofed domains', () => {
    expect(parseUrl('https://www.amazon.co.jp/dp/B0TEST').siteName).toBe('Amazon');
    expect(parseUrl('https://item.rakuten.co.jp/shop/item/').siteName).toBe('楽天');
    expect(parseUrl('https://store.shopping.yahoo.co.jp/shop/item.html').siteName).toBe('Yahoo!ショッピング');
    expect(parseUrl('https://fake-amazon.co.jp/dp/1').siteName).toBe('fake-amazon.co.jp');
    expect(parseUrl('javascript:alert(1)').siteName).toBe('手動入力');
  });

  it('handles fetchUrlInfo success, HTTP error, and timeout', async () => {
    const okFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          title: 'Test Product',
          image: { url: 'https://example.com/img.png' },
        },
      }),
    });

    const okResult = await fetchUrlInfo('https://example.com/p', { fetchImpl: okFetch });
    expect(okResult.ok).toBe(true);
    expect(okResult.data.title).toBe('Test Product');
    expect(okResult.data.image).toBe('https://example.com/img.png');

    const httpErrFetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const httpErrResult = await fetchUrlInfo('https://example.com/p', { fetchImpl: httpErrFetch });
    expect(httpErrResult.ok).toBe(false);
    expect(httpErrResult.reason).toBe('http_error');
    expect(httpErrResult.status).toBe(503);

    const abortFetch = vi.fn().mockImplementation((_, { signal }) =>
      new Promise((__, reject) => {
        signal.addEventListener('abort', () => {
          const err = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })
    );
    const timeoutResult = await fetchUrlInfo('https://example.com/p', {
      timeoutMs: 10,
      fetchImpl: abortFetch,
    });
    expect(timeoutResult.ok).toBe(false);
    expect(timeoutResult.reason).toBe('timeout');
  });
});
