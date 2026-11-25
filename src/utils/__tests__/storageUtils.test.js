import { describe, it, expect } from 'vitest';
import {
  validateCartItems,
  validateSavedCarts,
  validateBudget,
  safeReadStorage,
  safeWriteStorage,
  LIMITS,
} from '../storageUtils';

describe('storageUtils', () => {
  it('validates and normalizes cart items and strips unsafe URLs', () => {
    const items = validateCartItems([
      {
        title: '  テスト商品  ',
        price: 1500,
        quantity: 0,
        shipping: -100,
        points: '250',
        url: 'javascript:alert(1)',
        imageUrl: 'https://example.com/a.png',
        included: false,
      },
      { title: '' }, // invalid: empty title
      null,
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('テスト商品');
    expect(items[0].quantity).toBe(1);
    expect(items[0].shipping).toBe(0);
    expect(items[0].points).toBe(250);
    expect(items[0].url).toBe('');
    expect(items[0].imageUrl).toBe('https://example.com/a.png');
    expect(items[0].included).toBe(false);
  });

  it('caps items at MAX_ITEMS', () => {
    const many = Array.from({ length: LIMITS.MAX_ITEMS + 20 }, (_, i) => ({
      title: `Item ${i}`,
      price: 100,
    }));
    expect(validateCartItems(many)).toHaveLength(LIMITS.MAX_ITEMS);
  });

  it('validates saved carts and budgets', () => {
    const saved = validateSavedCarts([
      {
        name: 'Camp List',
        items: [{ title: 'Tent', price: 20000 }],
        total: 20000,
        budget: 30000,
      },
      { name: '', items: [] },
    ]);
    expect(saved).toHaveLength(1);
    expect(saved[0].budget).toBe(30000);
    expect(validateBudget(-5)).toBeNull();
    expect(validateBudget(50000)).toBe(50000);
  });

  it('handles corrupted storage and QuotaExceededError safely', () => {
    const brokenStorage = {
      getItem: () => '{broken json',
      setItem: () => {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      },
      removeItem: () => {},
    };

    expect(safeReadStorage('k', validateCartItems, [], brokenStorage)).toEqual([]);
    const writeRes = safeWriteStorage('k', [1, 2, 3], brokenStorage);
    expect(writeRes.ok).toBe(false);
    expect(writeRes.reason).toBe('quota_exceeded');
  });
});
