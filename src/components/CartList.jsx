import { useState, useMemo } from 'react';
import { ShoppingCart, Calculator, Save, Share2, Check, Sparkles, ArrowUpDown } from 'lucide-react';
import CartItem from './CartItem';
import BudgetBar from './BudgetBar';
import { formatJPY, getCartSummary, getItemBreakdown } from '../utils/cartUtils';
import './CartList.css';

const SORT_OPTIONS = [
  { value: 'added', label: '追加順' },
  { value: 'effective-asc', label: '実質価格が安い順' },
  { value: 'effective-desc', label: '実質価格が高い順' },
  { value: 'site', label: 'サイト別' },
];

const CartList = ({
  items,
  budget,
  onUpdateBudget,
  onUpdateItem,
  onRemove,
  onSaveCart,
  onLoadSample,
  onShareCart,
  onNotify,
}) => {
  const [cartName, setCartName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sortBy, setSortBy] = useState('added');
  const [siteFilter, setSiteFilter] = useState('all');

  const summary = getCartSummary(items);
  const pausedCount = items.length - summary.includedCount;

  const availableSites = useMemo(() => {
    const names = new Set(items.map((item) => item.siteInfo?.siteName || 'その他'));
    return Array.from(names);
  }, [items]);

  const activeSiteFilter = availableSites.includes(siteFilter) ? siteFilter : 'all';

  const displayedItems = useMemo(() => {
    const filtered =
      activeSiteFilter === 'all'
        ? items
        : items.filter((item) => (item.siteInfo?.siteName || 'その他') === activeSiteFilter);

    if (sortBy === 'added') return filtered;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'effective-asc') {
        return getItemBreakdown(a).effectiveTotal - getItemBreakdown(b).effectiveTotal;
      }
      if (sortBy === 'effective-desc') {
        return getItemBreakdown(b).effectiveTotal - getItemBreakdown(a).effectiveTotal;
      }
      if (sortBy === 'site') {
        const siteA = a.siteInfo?.siteName || 'その他';
        const siteB = b.siteInfo?.siteName || 'その他';
        return siteA.localeCompare(siteB, 'ja');
      }
      return 0;
    });
  }, [items, activeSiteFilter, sortBy]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!cartName.trim()) {
      onNotify?.('カートの名前を入力してください', 'error');
      return;
    }
    onSaveCart(cartName, items, summary.effectiveTotal);
    setCartName('');
    setIsSaving(false);
  };

  const handleShareClick = async () => {
    const ok = await onShareCart();
    if (ok) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  if (items.length === 0) {
    return (
      <div className="glass-panel empty-state">
        <ShoppingCart size={48} className="empty-icon" />
        <p className="empty-title">カートは空です。</p>
        <p className="empty-subtext">
          左のフォームから商品のURLを入力して追加するか、サンプル商品でお試しください。
        </p>
        <button
          type="button"
          className="btn btn-primary empty-sample-btn"
          onClick={onLoadSample}
        >
          <Sparkles size={18} /> サンプル商品を読み込む
        </button>
        <p className="empty-note">
          ※ Amazonや楽天などで自動取得できない場合も、商品名や価格を手動で入力・編集できます。
        </p>
      </div>
    );
  }

  return (
    <div className="cart-list-container">
      <BudgetBar
        budget={budget}
        onUpdateBudget={onUpdateBudget}
        currentTotal={summary.effectiveTotal}
      />

      {isSaving && (
        <div className="glass-panel save-dialog fade-in">
          <form onSubmit={handleSave} className="save-form">
            <label>このカートに名前を付けて保存</label>
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                placeholder="例：夏キャンプ用機材リスト"
                value={cartName}
                onChange={(e) => setCartName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">保存</button>
              <button type="button" className="btn" onClick={() => setIsSaving(false)}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {items.length > 1 && (
        <div className="cart-toolbar">
          {availableSites.length > 1 && (
            <div className="cart-filter-pills">
              <button
                type="button"
                className={`filter-pill ${activeSiteFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSiteFilter('all')}
              >
                すべて ({items.length})
              </button>
              {availableSites.map((site) => (
                <button
                  key={site}
                  type="button"
                  className={`filter-pill ${activeSiteFilter === site ? 'active' : ''}`}
                  onClick={() => setSiteFilter(site)}
                >
                  {site}
                </button>
              ))}
            </div>
          )}

          <div className="cart-sort-control">
            <ArrowUpDown size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="並び替え"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="cart-items">
        {displayedItems.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onUpdateItem={onUpdateItem}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div className="glass-panel summary-panel">
        <div className="summary-header">
          <h3 className="summary-title">
            <Calculator size={20} />
            お見積り合計（実質）
          </h3>
          <div className="summary-actions">
            <button
              type="button"
              className={`btn btn-share ${shareCopied ? 'copied' : ''}`}
              onClick={handleShareClick}
            >
              {shareCopied ? <Check size={16} /> : <Share2 size={16} />}
              {shareCopied ? 'URLをコピーしました' : 'リストを共有'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-save-cart"
              onClick={() => setIsSaving(true)}
            >
              <Save size={16} /> カートを保存する
            </button>
          </div>
        </div>

        <div className="summary-total">
          {formatJPY(summary.effectiveTotal)}
        </div>

        <div className="summary-breakdown">
          <span>商品小計 {formatJPY(summary.subtotal)}</span>
          {summary.shipping > 0 && <span>+ 送料 {formatJPY(summary.shipping)}</span>}
          {summary.points > 0 && (
            <span className="summary-points">- ポイント {summary.points.toLocaleString()}pt</span>
          )}
          <span className="summary-qty">
            （対象 {summary.totalQuantity}点{pausedCount > 0 ? ` / 保留 ${pausedCount}件` : ''}）
          </span>
        </div>

        {summary.siteSubtotals.length > 0 && (
          <div className="site-subtotals">
            <div className="site-subtotals-label">サイト別内訳</div>
            <div className="site-subtotals-grid">
              {summary.siteSubtotals.map((site) => (
                <div key={site.siteName} className="site-subtotal-card">
                  <div className="site-subtotal-name">
                    <span className="site-dot" style={{ backgroundColor: site.color }} />
                    <span>{site.siteName}</span>
                    <span className="site-subtotal-qty">({site.quantityCount}点)</span>
                  </div>
                  <div className="site-subtotal-amount">
                    <strong>{formatJPY(site.effectiveTotal)}</strong>
                    {site.shipping > 0 && (
                      <span className="site-subtotal-shipping">送料 {formatJPY(site.shipping)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartList;
