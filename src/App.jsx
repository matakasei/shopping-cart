import { useState, useEffect, useCallback } from 'react';
import './App.css';
import AddItemForm from './components/AddItemForm';
import CartList from './components/CartList';
import SavedCartsList from './components/SavedCartsList';
import CompareList from './components/CompareList';
import ToastContainer from './components/ToastContainer';
import ConfirmDialog from './components/ConfirmDialog';
import { ShoppingCart, Archive, SplitSquareHorizontal, Share2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { createSampleCartItems } from './utils/cartUtils';
import { encodeShareData, decodeShareData } from './utils/shareUtils';

const STORAGE_KEYS = {
  items: 'multi-cart-items',
  saved: 'multi-cart-saved-lists',
  budget: 'multi-cart-budget',
};

const safeReadStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
};

function App() {
  const [cartItems, setCartItems] = useState(() => safeReadStorage(STORAGE_KEYS.items, []));
  const [savedCarts, setSavedCarts] = useState(() => safeReadStorage(STORAGE_KEYS.saved, []));

  const [budget, setBudget] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.budget);
      if (!saved) return null;
      const parsed = Number(saved);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('cart');
  const [pendingShareData, setPendingShareData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [mobileFormOpen, setMobileFormOpen] = useState(() => cartItems.length === 0);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = uuidv4();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(savedCarts));
  }, [savedCarts]);

  useEffect(() => {
    if (budget && budget > 0) {
      localStorage.setItem(STORAGE_KEYS.budget, String(budget));
    } else {
      localStorage.removeItem(STORAGE_KEYS.budget);
    }
  }, [budget]);

  // URLパラメータ (?s=...) から共有データを読み込む
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('s');
    if (!encoded) return;

    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);

    decodeShareData(encoded)
      .then((decoded) => {
        if (!decoded || decoded.items.length === 0) return;

        const existingItems = safeReadStorage(STORAGE_KEYS.items, []);

        if (existingItems.length === 0) {
          setCartItems(decoded.items);
          if (decoded.budget) setBudget(decoded.budget);
          showToast(`共有された見積もりリスト（${decoded.items.length}点）を読み込みました。`, 'success');
        } else {
          setPendingShareData(decoded);
        }
      })
      .catch((err) => {
        console.error('Failed to decode shared cart:', err);
        showToast('共有URLの読み込みに失敗しました', 'error');
      });
  }, [showToast]);

  const handleAcceptPendingShare = () => {
    if (!pendingShareData) return;
    setCartItems(pendingShareData.items);
    if (pendingShareData.budget) {
      setBudget(pendingShareData.budget);
    }
    showToast(`共有された見積もりリスト（${pendingShareData.items.length}点）を読み込みました。`, 'success');
    setPendingShareData(null);
    setActiveTab('cart');
  };

  const handleAddToCart = (item) => {
    setCartItems((prev) => [item, ...prev]);
    setActiveTab('cart');
    showToast(`「${item.title}」をカートに追加しました`, 'success');
  };

  const handleUpdateItem = (id, patch) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setConfirmDialog({
      title: 'カートをすべてクリア',
      message: '現在のカートの中身をすべて削除しますか？この操作は取り消せません。',
      confirmLabel: 'すべて削除',
      danger: true,
      onConfirm: () => {
        setCartItems([]);
        setConfirmDialog(null);
        showToast('カートを空にしました', 'info');
      },
    });
  };

  const handleLoadSample = () => {
    const samples = createSampleCartItems();
    setCartItems(samples);
    if (!budget) {
      setBudget(35000);
    }
    setActiveTab('cart');
    showToast('サンプル商品を読み込みました', 'info');
  };

  const sharePayload = async (itemsToShare, budgetToShare) => {
    try {
      const encoded = await encodeShareData({ items: itemsToShare, budget: budgetToShare });
      const shareUrl = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('共有URLをクリップボードにコピーしました', 'success');
        return true;
      }
      window.prompt('以下のURLをコピーして共有してください', shareUrl);
      return true;
    } catch (err) {
      console.error('Failed to share cart:', err);
      showToast('共有URLの作成に失敗しました', 'error');
      return false;
    }
  };

  const handleShareCart = () => sharePayload(cartItems, budget);

  const handleShareSavedCart = (cart) => sharePayload(cart.items, cart.budget ?? null);

  const handleSaveCart = (name, items, total) => {
    const newSavedCart = {
      id: uuidv4(),
      name,
      items: [...items],
      total,
      budget: budget && budget > 0 ? budget : null,
      savedAt: Date.now(),
    };

    setSavedCarts((prev) => [newSavedCart, ...prev]);
    showToast(`「${name}」を保存しました`, 'success');
    setActiveTab('saved');
  };

  const handleRemoveSavedCart = (id) => {
    setConfirmDialog({
      title: '保存済みカートを削除',
      message: 'この保存済みカートを削除してもよろしいですか？',
      confirmLabel: '削除する',
      danger: true,
      onConfirm: () => {
        setSavedCarts((prev) => prev.filter((cart) => cart.id !== id));
        setConfirmDialog(null);
        showToast('保存済みカートを削除しました', 'info');
      },
    });
  };

  const applyRestoreCart = (cart) => {
    const restoredItems = cart.items.map((item) => ({
      ...item,
      id: uuidv4(),
      addedAt: Date.now(),
    }));

    setCartItems(restoredItems);
    if (cart.budget && cart.budget > 0) {
      setBudget(cart.budget);
    }
    showToast(`「${cart.name}」をカートに復元しました`, 'success');
    setActiveTab('cart');
  };

  const handleRestoreCart = (cart) => {
    if (cartItems.length > 0) {
      setConfirmDialog({
        title: 'カートを上書き復元',
        message: `現在のカートの中身を消去し、「${cart.name}」の内容で上書きしますか？`,
        confirmLabel: '上書きして復元',
        danger: false,
        onConfirm: () => {
          applyRestoreCart(cart);
          setConfirmDialog(null);
        },
      });
      return;
    }
    applyRestoreCart(cart);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Multi-Cart Estimator</h1>
        <p>複数のECサイトの商品をまとめて予算を見積もる</p>
      </header>

      {pendingShareData && (
        <div className="glass-panel share-banner fade-in">
          <div className="share-banner-text">
            <Share2 size={18} />
            <span>
              URLに共有された見積もりリスト（{pendingShareData.items.length}点）が含まれています。現在のカートを上書きして読み込みますか？
            </span>
          </div>
          <div className="share-banner-actions">
            <button type="button" className="btn btn-primary" onClick={handleAcceptPendingShare}>
              読み込む
            </button>
            <button type="button" className="btn" onClick={() => setPendingShareData(null)}>
              現在のカートを維持
            </button>
          </div>
        </div>
      )}

      <main className="main-grid">
        <div className="sidebar">
          <button
            type="button"
            className="glass-panel mobile-add-toggle"
            onClick={() => setMobileFormOpen((prev) => !prev)}
          >
            <span className="mobile-add-toggle-label">
              <Plus size={18} /> 商品をカートに追加
            </span>
            {mobileFormOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className={`sidebar-form-wrapper ${mobileFormOpen ? 'is-open' : ''}`}>
            <AddItemForm onAdd={handleAddToCart} onNotify={showToast} />
          </div>
        </div>

        <div className="main-content">
          <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              className={`btn ${activeTab === 'cart' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('cart')}
              style={{
                flex: 1,
                backgroundColor: activeTab !== 'cart' ? 'rgba(0,0,0,0.05)' : undefined,
                color: activeTab !== 'cart' ? 'var(--color-text-muted)' : undefined,
              }}
            >
              <ShoppingCart size={18} /> 現在のカート ({cartItems.length})
            </button>
            <button
              className={`btn ${activeTab === 'compare' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('compare')}
              style={{
                flex: 1,
                backgroundColor: activeTab !== 'compare' ? 'rgba(0,0,0,0.05)' : undefined,
                color: activeTab !== 'compare' ? 'var(--color-text-muted)' : undefined,
              }}
            >
              <SplitSquareHorizontal size={18} /> 比較表
            </button>
            <button
              className={`btn ${activeTab === 'saved' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('saved')}
              style={{
                flex: 1,
                backgroundColor: activeTab !== 'saved' ? 'rgba(0,0,0,0.05)' : undefined,
                color: activeTab !== 'saved' ? 'var(--color-text-muted)' : undefined,
              }}
            >
              <Archive size={18} /> 保存済みリスト ({savedCarts.length})
            </button>
          </div>

          {activeTab === 'cart' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title"><ShoppingCart size={20} /> カート一覧</h2>
                {cartItems.length > 0 && (
                  <button className="btn btn-danger" onClick={handleClearCart} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    すべてクリア
                  </button>
                )}
              </div>
              <CartList
                items={cartItems}
                budget={budget}
                onUpdateBudget={setBudget}
                onUpdateItem={handleUpdateItem}
                onRemove={handleRemoveFromCart}
                onSaveCart={handleSaveCart}
                onLoadSample={handleLoadSample}
                onShareCart={handleShareCart}
                onNotify={showToast}
              />
            </>
          ) : activeTab === 'compare' ? (
            <CompareList items={cartItems} onRemove={handleRemoveFromCart} />
          ) : (
            <SavedCartsList
              savedCarts={savedCarts}
              onRemoveCart={handleRemoveSavedCart}
              onRestoreCart={handleRestoreCart}
              onShareSavedCart={handleShareSavedCart}
            />
          )}
        </div>
      </main>
      <ConfirmDialog dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
