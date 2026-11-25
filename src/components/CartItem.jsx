import { useState } from 'react';
import { ExternalLink, Trash2, SplitSquareHorizontal, Minus, Plus, Edit2, Check, Truck, Coins } from 'lucide-react';
import { formatJPY, getItemBreakdown } from '../utils/cartUtils';
import './CartItem.css';

const CartItem = ({ item, onUpdateItem, onRemove, onAddToCompare, isBookmarkView }) => {
  const { title, imageUrl, url, siteInfo } = item;
  const isIncluded = item.included !== false;
  const breakdown = getItemBreakdown(item);
  const { price, quantity, shipping, points, effectiveTotal } = breakdown;

  const [editingField, setEditingField] = useState(null); // 'title' | 'price' | 'shipping' | 'points' | null
  const [editValue, setEditValue] = useState('');

  const startEditing = (field, currentVal) => {
    if (isBookmarkView || !onUpdateItem) return;
    setEditingField(field);
    setEditValue(String(currentVal));
  };

  const commitEdit = () => {
    if (!editingField || !onUpdateItem) return;

    if (editingField === 'title') {
      const trimmed = editValue.trim();
      if (trimmed) {
        onUpdateItem(item.id, { title: trimmed });
      }
      setEditingField(null);
      return;
    }

    const numeric = parseInt(editValue, 10);
    if (!Number.isNaN(numeric) && numeric >= 0) {
      onUpdateItem(item.id, { [editingField]: numeric });
    }
    setEditingField(null);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  const showEffectiveSubtotal = quantity > 1 || shipping > 0 || points > 0;

  return (
    <div className={`glass-panel cart-item ${!isIncluded ? 'is-paused' : ''}`}>
      {!isBookmarkView && onUpdateItem && (
        <label className="cart-item-include-toggle" title={isIncluded ? '見積もりに含める（クリックで保留）' : '保留中（クリックで見積もりに戻す）'}>
          <input
            type="checkbox"
            checked={isIncluded}
            onChange={() => onUpdateItem(item.id, { included: !isIncluded })}
          />
        </label>
      )}

      <div className="cart-item-image">
        {imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <div className="no-image">{siteInfo.logoText}</div>
        )}
      </div>

      <div className="cart-item-content">
        <div className="cart-item-header">
          <div className="cart-item-badges">
            <span className="site-badge" style={{ backgroundColor: siteInfo.color }}>
              {siteInfo.siteName}
            </span>
            {!isIncluded && <span className="paused-badge">保留中</span>}
          </div>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="external-link">
              商品ページ <ExternalLink size={14} />
            </a>
          )}
        </div>

        {editingField === 'title' ? (
          <div className="title-edit-mode">
            <input
              type="text"
              className="title-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={commitEdit}
              autoFocus
            />
            <button
              className="btn-icon small success"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitEdit}
              aria-label="商品名を確定"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div className="cart-item-title-row">
            <h3 className="cart-item-title" title={title}>{title}</h3>
            {!isBookmarkView && onUpdateItem && (
              <button
                className="btn-icon tiny edit-inline-btn"
                onClick={() => startEditing('title', title)}
                title="商品名を編集"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}

        <div className="cart-item-price-container">
          {editingField === 'price' ? (
            <div className="price-edit-mode">
              <span className="currency-symbol">¥</span>
              <input
                type="number"
                className="price-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                autoFocus
                min="0"
              />
              <button
                className="btn-icon small success"
                onMouseDown={(e) => e.preventDefault()}
                onClick={commitEdit}
                aria-label="価格を確定"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="cart-item-price-row">
              <div className="cart-item-price">
                {formatJPY(price)}
                {!isBookmarkView && onUpdateItem && (
                  <button
                    className="btn-icon tiny edit-inline-btn"
                    onClick={() => startEditing('price', price)}
                    title="本体価格を編集"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
              {showEffectiveSubtotal && (
                <div className="effective-subtotal">
                  実質小計: <strong>{formatJPY(effectiveTotal)}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cart-item-modifiers">
          {editingField === 'shipping' ? (
            <div className="modifier-edit-chip">
              <Truck size={12} />
              <span>送料 ¥</span>
              <input
                type="number"
                className="modifier-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                autoFocus
                min="0"
              />
              <button
                className="btn-icon tiny success"
                onMouseDown={(e) => e.preventDefault()}
                onClick={commitEdit}
                aria-label="送料を確定"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`modifier-chip ${shipping > 0 ? 'has-shipping' : ''}`}
              onClick={() => startEditing('shipping', shipping)}
              title="クリックして送料を編集"
            >
              <Truck size={12} />
              <span>{shipping > 0 ? `送料 +${formatJPY(shipping)}` : '送料無料'}</span>
            </button>
          )}

          {editingField === 'points' ? (
            <div className="modifier-edit-chip">
              <Coins size={12} />
              <span>還元</span>
              <input
                type="number"
                className="modifier-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                autoFocus
                min="0"
              />
              <span>pt</span>
              <button
                className="btn-icon tiny success"
                onMouseDown={(e) => e.preventDefault()}
                onClick={commitEdit}
                aria-label="ポイントを確定"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`modifier-chip ${points > 0 ? 'has-points' : ''}`}
              onClick={() => startEditing('points', points)}
              title="クリックしてポイント還元を編集"
            >
              <Coins size={12} />
              <span>{points > 0 ? `-${points.toLocaleString()}pt` : 'ポイント 0pt'}</span>
            </button>
          )}
        </div>

        <div className="cart-item-actions">
          {!isBookmarkView && (
            <div className="quantity-control">
              <button
                className="btn-icon small"
                onClick={() => onUpdateItem(item.id, { quantity: Math.max(1, quantity - 1) })}
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="quantity">{quantity}</span>
              <button
                className="btn-icon small"
                onClick={() => onUpdateItem(item.id, { quantity: quantity + 1 })}
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          <div className="action-buttons">
            {!isBookmarkView && onAddToCompare && (
              <button
                className="btn-icon"
                onClick={() => onAddToCompare(item)}
                title="比較表にコピー"
              >
                <SplitSquareHorizontal size={18} />
              </button>
            )}
            <button
              className="btn-icon danger"
              onClick={() => onRemove(item.id)}
              title="削除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
