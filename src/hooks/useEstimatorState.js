import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  safeReadStorage,
  safeWriteStorage,
  validateCartItems,
  validateSavedCarts,
  validateBudget,
  LIMITS,
} from '../utils/storageUtils';
import { createSampleCartItems, createSampleCompareItems } from '../utils/cartUtils';

export const STORAGE_KEYS = {
  items: 'multi-cart-items',
  compare: 'multi-cart-compare-items',
  saved: 'multi-cart-saved-lists',
  budget: 'multi-cart-budget',
};

/**
 * カート・比較表・保存済みリスト・目標予算の状態管理と localStorage 同期を担うカスタムフック
 */
export const useEstimatorState = (onNotify) => {
  const [cartItems, setCartItems] = useState(() =>
    safeReadStorage(STORAGE_KEYS.items, validateCartItems, [])
  );
  const [compareItems, setCompareItems] = useState(() =>
    safeReadStorage(STORAGE_KEYS.compare, validateCartItems, [])
  );
  const [savedCarts, setSavedCarts] = useState(() =>
    safeReadStorage(STORAGE_KEYS.saved, validateSavedCarts, [])
  );
  const [budget, setBudgetState] = useState(() => {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEYS.budget);
      return validateBudget(raw);
    } catch {
      return null;
    }
  });

  const quotaWarnedRef = useRef(false);

  const persist = useCallback(
    (key, value) => {
      const res = safeWriteStorage(key, value);
      if (!res.ok && res.reason === 'quota_exceeded' && !quotaWarnedRef.current) {
        quotaWarnedRef.current = true;
        onNotify?.('ブラウザの保存容量上限に達したため、一部データを保存できませんでした。', 'error');
      }
    },
    [onNotify]
  );

  useEffect(() => {
    persist(STORAGE_KEYS.items, cartItems);
  }, [cartItems, persist]);

  useEffect(() => {
    persist(STORAGE_KEYS.compare, compareItems);
  }, [compareItems, persist]);

  useEffect(() => {
    persist(STORAGE_KEYS.saved, savedCarts);
  }, [savedCarts, persist]);

  useEffect(() => {
    persist(STORAGE_KEYS.budget, budget && budget > 0 ? String(budget) : null);
  }, [budget, persist]);

  const setBudget = useCallback((nextBudget) => {
    setBudgetState(validateBudget(nextBudget));
  }, []);

  const addCartItem = useCallback(
    (item) => {
      if (cartItems.length >= LIMITS.MAX_ITEMS) {
        onNotify?.(`カートに追加できる上限（${LIMITS.MAX_ITEMS}件）に達しています。`, 'error');
        return false;
      }
      setCartItems((prev) => [item, ...prev].slice(0, LIMITS.MAX_ITEMS));
      return true;
    },
    [cartItems.length, onNotify]
  );

  const updateCartItem = useCallback((id, patch) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const removeCartItem = useCallback((id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const loadSampleCart = useCallback(() => {
    setCartItems(createSampleCartItems());
    setBudgetState((prev) => prev || 35000);
  }, []);

  const addCompareItem = useCallback(
    (item) => {
      if (compareItems.length >= LIMITS.MAX_ITEMS) {
        onNotify?.(`比較表に追加できる上限（${LIMITS.MAX_ITEMS}件）に達しています。`, 'error');
        return false;
      }
      setCompareItems((prev) => [item, ...prev].slice(0, LIMITS.MAX_ITEMS));
      return true;
    },
    [compareItems.length, onNotify]
  );

  const removeCompareItem = useCallback((id) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
  }, []);

  const loadSampleCompare = useCallback(() => {
    setCompareItems(createSampleCompareItems());
  }, []);

  const saveCurrentCart = useCallback(
    (name, items, total) => {
      const newSavedCart = {
        id: uuidv4(),
        name: String(name).trim().slice(0, LIMITS.MAX_CART_NAME_LENGTH),
        items: [...items],
        total,
        budget: budget && budget > 0 ? budget : null,
        savedAt: Date.now(),
      };
      setSavedCarts((prev) => [newSavedCart, ...prev].slice(0, LIMITS.MAX_SAVED_CARTS));
    },
    [budget]
  );

  const removeSavedCart = useCallback((id) => {
    setSavedCarts((prev) => prev.filter((cart) => cart.id !== id));
  }, []);

  const restoreSavedCart = useCallback((cart) => {
    const restoredItems = validateCartItems(
      cart.items.map((item) => ({
        ...item,
        id: uuidv4(),
        addedAt: Date.now(),
      }))
    );
    setCartItems(restoredItems);
    if (cart.budget && cart.budget > 0) {
      setBudgetState(validateBudget(cart.budget));
    }
  }, []);

  const replaceCartFromShare = useCallback((items, sharedBudget) => {
    setCartItems(validateCartItems(items));
    if (sharedBudget) {
      setBudgetState(validateBudget(sharedBudget));
    }
  }, []);

  return {
    cartItems,
    compareItems,
    savedCarts,
    budget,
    setBudget,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    loadSampleCart,
    addCompareItem,
    removeCompareItem,
    clearCompare,
    loadSampleCompare,
    saveCurrentCart,
    removeSavedCart,
    restoreSavedCart,
    replaceCartFromShare,
  };
};
