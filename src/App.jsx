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
import { encodeShareData, decodeShareData } from './utils/shareUtils';
import { useEstimatorState, STORAGE_KEYS } from './hooks/useEstimatorState';
import { safeReadStorage, validateCartItems } from './utils/storageUtils';

function App() {
  const [activeTab, setActiveTab] = useState('cart');
  const [pendingShareData, setPendingShareData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

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

  const {
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
  } = useEstimatorState(showToast);

  const [mobileFormOpen, setMobileFormOpen] = useState(() => cartItems.length === 0);

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

        const existingItems = safeReadStorage(STORAGE_KEYS.items, validateCartItems, []);

        if (existingItems.length === 0) {
          replaceCartFromShare(decoded.items, decoded.budget);
          showToast(`共有された見積もりリスト（${decoded.items.length}点）を読み込みました。`, 'success');
        } else {
          setPendingShareData(decoded);
        }
      })
      .catch((err) => {
        console.error('Failed to decode shared cart:', err);
        showToast('共有URLの読み込みに失敗しました', 'error');
      });
  }, [replaceCartFromShare, showToast]);

  const handleAcceptPendingShare = () => {
    if (!pendingShareData) return;
    replaceCartFromShare(pendingShareData.items, pendingShareData.budget);
    showToast(`共有された見積もりリスト（${pendingShareData.items.length}点）を読み込みました。`, 'success');
    setPendingShareData(null);
    setActiveTab('cart');
  };

  const handleAddToCart = (item) => {
    if (!addCartItem(item)) return;
    setActiveTab('cart');
    showToast(`「${item.title}」をカートに追加しました`, 'success');
  };

  const handleAddToCompare = (item) => {
    if (!addCompareItem(item)) return;
    setActiveTab('compare');
    showToast(`「${item.title}」を比較表に追加しました`, 'success');
  };

  const handleCopyCartItemToCompare = (item) => {
    const copied = {
      ...item,
      id: uuidv4(),
      included: true,
      addedAt: Date.now(),
    };
    if (!addCompareItem(copied)) return;
    showToast(`「${item.title}」を比較表にコピーしました`, 'info');
  };

  const handleSendCompareItemToCart = (item) => {
    const copied = {
      ...item,
      id: uuidv4(),
      included: true,
      addedAt: Date.now(),
    };
    if (!addCartItem(copied)) return;
    showToast(`「${item.title}」をカートに追加しました`, 'success');
  };

  const handleClearCart = () => {
    setConfirmDialog({
      title: 'カートをすべてクリア',
      message: '現在のカートの中身をすべて削除しますか？この操作は取り消せません。',
      confirmLabel: 'すべて削除',
      danger: true,
      onConfirm: () => {
        clearCart();
        setConfirmDialog(null);
        showToast('カートを空にしました', 'info');
      },
    });
  };

  const handleClearCompare = () => {
    setConfirmDialog({
      title: '比較表をすべてクリア',
      message: '比較表の商品をすべて削除しますか？',
      confirmLabel: 'すべて削除',
      danger: true,
      onConfirm: () => {
        clearCompare();
        setConfirmDialog(null);
        showToast('比較表を空にしました', 'info');
      },
    });
  };

  const handleLoadSample = () => {
    loadSampleCart();
    setActiveTab('cart');
    showToast('サンプル商品を読み込みました', 'info');
  };

  const handleLoadCompareSample = () => {
    loadSampleCompare();
    setActiveTab('compare');
    showToast('比較サンプル商品を読み込みました', 'info');
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
    saveCurrentCart(name, items, total);
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
        removeSavedCart(id);
        setConfirmDialog(null);
        showToast('保存済みカートを削除しました', 'info');
      },
    });
  };

  const handleRestoreCart = (cart) => {
    if (cartItems.length > 0) {
      setConfirmDialog({
        title: 'カートを上書き復元',
        message: `現在のカートの中身を消去し、「${cart.name}」の内容で上書きしますか？`,
        confirmLabel: '上書きして復元',
        danger: false,
        onConfirm: () => {
          restoreSavedCart(cart);
          setConfirmDialog(null);
          showToast(`「${cart.name}」をカートに復元しました`, 'success');
          setActiveTab('cart');
        },
      });
      return;
    }
    restoreSavedCart(cart);
    showToast(`「${cart.name}」をカートに復元しました`, 'success');
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

      <main className="main-grid">
        <div className="sidebar">
          <button
            type="button"
            className="glass-panel mobile-add-toggle"
            aria-expanded={mobileFormOpen}
            onClick={() => setMobileFormOpen((prev) => !prev)}
          >
            <span className="mobile-add-toggle-label">
              <Plus size={18} /> 商品を追加
            </span>
            {mobileFormOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className={`sidebar-form-wrapper ${mobileFormOpen ? 'is-open' : ''}`}>
            <AddItemForm
              onAdd={handleAddToCart}
              onAddToCompare={handleAddToCompare}
              defaultTarget={activeTab === 'compare' ? 'compare' : 'cart'}
              onNotify={showToast}
            />
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
              <SplitSquareHorizontal size={18} /> 比較表 ({compareItems.length})
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
                onUpdateItem={updateCartItem}
                onRemove={removeCartItem}
                onAddToCompare={handleCopyCartItemToCompare}
                onSaveCart={handleSaveCart}
                onLoadSample={handleLoadSample}
                onShareCart={handleShareCart}
                onNotify={showToast}
              />
            </>
          ) : activeTab === 'compare' ? (
            <CompareList
              items={compareItems}
              onRemove={removeCompareItem}
              onClear={handleClearCompare}
              onAddToCart={handleSendCompareItemToCart}
              onLoadSample={handleLoadCompareSample}
            />
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
