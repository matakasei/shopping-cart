import { useState } from 'react';
import { Archive, Trash2, RotateCcw, ChevronDown, ChevronUp, Share2, Target } from 'lucide-react';
import { formatJPY } from '../utils/cartUtils';
import './SavedCartsList.css';

const SavedCartsList = ({ savedCarts, onRemoveCart, onRestoreCart, onShareSavedCart }) => {
  const [expandedCartId, setExpandedCartId] = useState(null);

  if (savedCarts.length === 0) {
    return (
      <div className="glass-panel empty-state">
        <Archive size={48} className="empty-icon" />
        <p>保存されたカートはありません。</p>
      </div>
    );
  }

  const toggleExpand = (id) => {
    setExpandedCartId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="saved-carts-container">
      <h2 className="section-title">
        <Archive size={20} />
        保存済みカート一覧
      </h2>

      <div className="saved-carts-list">
        {savedCarts.map((cart) => {
          const date = new Date(cart.savedAt).toLocaleString('ja-JP');
          const isExpanded = expandedCartId === cart.id;

          return (
            <div key={cart.id} className="glass-panel saved-cart-card">
              <button
                type="button"
                className="saved-cart-header"
                onClick={() => toggleExpand(cart.id)}
                aria-expanded={isExpanded}
                aria-controls={`saved-cart-details-${cart.id}`}
              >
                <div className="saved-cart-info">
                  <h3 className="saved-cart-name">{cart.name}</h3>
                  <div className="saved-cart-meta">
                    <span>{date}</span>
                    <span>•</span>
                    <span>商品数: {cart.items.length}点</span>
                    {cart.budget > 0 && (
                      <>
                        <span>•</span>
                        <span className="saved-cart-budget-tag">
                          <Target size={12} /> 予算 {formatJPY(cart.budget)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="saved-cart-total">
                  {formatJPY(cart.total)}
                </div>
                <span className="btn-icon saved-cart-chevron" aria-hidden="true">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </span>
              </button>

              {isExpanded && (
                <div id={`saved-cart-details-${cart.id}`} className="saved-cart-details fade-in">
                  <div className="saved-cart-items-preview">
                    {cart.items.map((item, idx) => (
                      <div key={idx} className="preview-item">
                        <span className="preview-item-name">
                          {item.included === false ? '【保留】' : ''}
                          {item.title}
                        </span>
                        <span className="preview-item-qty">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="saved-cart-actions">
                    <button
                      className="btn btn-danger"
                      onClick={() => onRemoveCart(cart.id)}
                    >
                      <Trash2 size={16} /> 削除
                    </button>
                    {onShareSavedCart && (
                      <button
                        className="btn btn-share"
                        onClick={() => onShareSavedCart(cart)}
                      >
                        <Share2 size={16} /> URL共有
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => onRestoreCart(cart)}
                    >
                      <RotateCcw size={16} /> 現在のカートに復元する
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedCartsList;
