import { describe, it, expect } from 'vitest';
import { formatJPY, getItemBreakdown, getCartSummary } from '../cartUtils';

describe('cartUtils', () => {
  it('calculates per-item breakdown with quantity, shipping, and points', () => {
    const breakdown = getItemBreakdown({
      price: 2480,
      quantity: 2,
      shipping: 550,
      points: 248,
    });

    expect(breakdown.subtotal).toBe(4960);
    expect(breakdown.paymentTotal).toBe(5510);
    expect(breakdown.effectiveTotal).toBe(5262);
  });

  it('excludes paused items from cart summary and aggregates by site', () => {
    const items = [
      {
        id: '1',
        title: 'Item A',
        price: 10000,
        quantity: 1,
        shipping: 0,
        points: 100,
        included: true,
        siteInfo: { siteName: 'Amazon', color: '#f97316' },
      },
      {
        id: '2',
        title: 'Item B',
        price: 3000,
        quantity: 2,
        shipping: 500,
        points: 200,
        included: true,
        siteInfo: { siteName: '楽天', color: '#bf0000' },
      },
      {
        id: '3',
        title: 'Paused Item',
        price: 50000,
        quantity: 1,
        shipping: 1000,
        points: 0,
        included: false,
        siteInfo: { siteName: 'Amazon', color: '#f97316' },
      },
    ];

    const summary = getCartSummary(items);
    expect(summary.includedCount).toBe(2);
    expect(summary.totalQuantity).toBe(3);
    expect(summary.subtotal).toBe(16000);
    expect(summary.shipping).toBe(500);
    expect(summary.points).toBe(300);
    expect(summary.effectiveTotal).toBe(16200);
    expect(summary.siteSubtotals).toHaveLength(2);
    expect(summary.siteSubtotals[0].siteName).toBe('Amazon');
    expect(summary.siteSubtotals[0].effectiveTotal).toBe(9900);
    expect(summary.siteSubtotals[1].siteName).toBe('楽天');
    expect(summary.siteSubtotals[1].effectiveTotal).toBe(6300);
  });

  it('formats JPY currency', () => {
    expect(formatJPY(12990)).toContain('12,990');
  });
});
