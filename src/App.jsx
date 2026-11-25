import { useState, useEffect } from 'react';
import './App.css';
import AddItemForm from './components/AddItemForm';
import CartList from './components/CartList';
import SavedCartsList from './components/SavedCartsList';
import CompareList from './components/CompareList';
import { ShoppingCart, Archive, SplitSquareHorizontal, Share2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { createSampleCartItems } from './utils/cartUtils';
import { encodeShareData, decodeShareData } from './utils/shareUtils';

const STORAGE_KEYS = {
  items: 'multi-cart-items',
  saved: 'multi-cart-saved-lists',
  budget: 'multi-cart-budget',
};

function App() {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.items);
    return saved ? JSON.parse(saved) : [];
  });

  const [savedCarts, setSavedCarts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.saved);
    return saved ? JSON.parse(saved) : [];
  });

  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.budget);
    if (!saved) return null;
    const parsed = Number(saved);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  const [activeTab, setActiveTab] = useState('cart');
  const [pendingShareData, setPendingShareData] = useState(null);
  const [shareNotice, setShareNotice] = useState('');

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

    // URLからクエリを削除してリロード時の再適用を防ぐ
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);

    decodeShareData(encoded)
      .then((decoded) => {
        if (!decoded || decoded.items.length === 0) return;

        const existingSaved = localStorage.getItem(STORAGE_KEYS.items);
        const existingItems = existingSaved ? JSON.parse(existingSaved) : [];

        if (existingItems.length === 0) {
          setCartItems(decoded.items);
          if (decoded.budget) setBudget(decoded.budget);
          setShareNotice(`共有された見積もりリスト（${decoded.items.length}点）を読み込みました。`);
        } else {
          setPendingShareData(decoded);
        }
      })
      .catch((err) => {
        console.error('Failed to decode shared cart:', err);
      });
  }, []);

  const handleAcceptPendingShare = () => {
    if (!pendingShareData) return;
    setCartItems(pendingShareData.items);
    if (pendingShareData.budget) {
      setBudget(pendingShareData.budget);
    }
    setShareNotice(`共有された見積もりリスト（${pendingShareData.items.length}点）を読み込みました。`);
    setPendingShareData(null);
    setActiveTab('cart');
  };

  const handleAddToCart = (item) => {
    setCartItems((prev) => [item, ...prev]);
    setActiveTab('cart');
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
    if (window.confirm('現在のカートの中身をすべて削除しますか？')) {
      setCartItems([]);
    }
  };

  const handleLoadSample = () => {
    const samples = createSampleCartItems();
    setCartItems(samples);
    if (!budget) {
      setBudget(35000);
    }
    setActiveTab('cart');
  };

  const handleShareCart = async () => {
    try {
      const encoded = await encodeShareData({ items: cartItems, budget });
      const shareUrl = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      }
      window.prompt('以下のURLをコピーして共有してください', shareUrl);
      return true;
    } catch (err) {
      console.error('Failed to share cart:', err);
      alert('共有URLの作成に失敗しました');
      return false;
    }
  };

  const handleSaveCart = (name, items, total) => {
    const newSavedCart = {
      id: uuidv4(),
      name,
      items: [...items],
      total,
      savedAt: Date.now(),
    };

    setSavedCarts((prev) => [newSavedCart, ...prev]);
    alert(`「${name}」を保存しました`);
    setActiveTab('saved');
  };

  const handleRemoveSavedCart = (id) => {
    if (window.confirm('この保存済みカートを削除してもよろしいですか？')) {
      setSavedCarts((prev) => prev.filter((cart) => cart.id !== id));
    }
  };

  const handleRestoreCart = (cart) => {
    if (cartItems.length > 0) {
      if (!window.confirm('現在のカートの中身が上書きされます。よろしいですか？（現在のカートは消去されます）')) {
        return;
      }
    }

    const restoredItems = cart.items.map((item) => ({
      ...item,
      id: uuidv4(),
      addedAt: Date.now(),
    }));

    setCartItems(restoredItems);
    alert(`「${cart.name}」をカートに復元しました`);
    setActiveTab('cart');
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

      {shareNotice && (
        <div className="glass-panel share-notice fade-in">
          <span>{shareNotice}</span>
          <button type="button" className="btn-text-dismiss" onClick={() => setShareNotice('')}>
            閉じる
          </button>
        </div>
      )}

      <main className="main-grid">
        <div className="sidebar">
          <AddItemForm onAdd={handleAddToCart} />
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
              />
            </>
          ) : activeTab === 'compare' ? (
            <CompareList items={cartItems} onRemove={handleRemoveFromCart} />
          ) : (
            <SavedCartsList
              savedCarts={savedCarts}
              onRemoveCart={handleRemoveSavedCart}
              onRestoreCart={handleRestoreCart}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
