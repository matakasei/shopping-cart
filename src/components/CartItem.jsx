import React, { useState } from 'react';
import { ExternalLink, Trash2, BookmarkPlus, Minus, Plus, Edit2, Check } from 'lucide-react';
import './CartItem.css';

const CartItem = ({ item, onUpdateQuantity, onUpdatePrice, onRemove, onBookmark, isBookmarkView }) => {
  const { title, price, imageUrl, url, siteInfo, quantity } = item;
  
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState(price);

  const handlePriceSubmit = () => {
    if (onUpdatePrice && !isNaN(editPriceValue) && editPriceValue >= 0) {
      onUpdatePrice(item.id, editPriceValue);
    }
    setIsEditingPrice(false);
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePriceSubmit();
    } else if (e.key === 'Escape') {
      setEditPriceValue(price);
      setIsEditingPrice(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  
  return (
    <div className="glass-panel cart-item">
      <div className="cart-item-image">
        {imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <div className="no-image">{siteInfo.logoText}</div>
        )}
      </div>
      
      <div className="cart-item-content">
        <div className="cart-item-header">
          <span className="site-badge" style={{ backgroundColor: siteInfo.color }}>
            {siteInfo.siteName}
          </span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="external-link">
            商品ページ <ExternalLink size={14} />
          </a>
        </div>
        
        <h3 className="cart-item-title" title={title}>{title}</h3>
        
        <div className="cart-item-price-container">
          {isEditingPrice ? (
            <div className="price-edit-mode">
              <span className="currency-symbol">¥</span>
              <input 
                type="number" 
                className="price-input"
                value={editPriceValue}
                onChange={(e) => setEditPriceValue(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                onBlur={handlePriceSubmit}
                autoFocus
                min="0"
              />
              <button className="btn-icon small success" onMouseDown={(e) => e.preventDefault()} onClick={handlePriceSubmit}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="cart-item-price">
              {formattedPrice}
              {!isBookmarkView && onUpdatePrice && (
                <button className="btn-icon tiny edit-price-btn" onClick={() => setIsEditingPrice(true)} title="価格を編集">
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="cart-item-actions">
          {!isBookmarkView && (
            <div className="quantity-control">
              <button 
                className="btn-icon small" 
                onClick={() => onUpdateQuantity(item.id, Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="quantity">{quantity}</span>
              <button 
                className="btn-icon small" 
                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
          )}
          
          <div className="action-buttons">
            {!isBookmarkView && onBookmark && (
              <button 
                className="btn-icon" 
                onClick={() => onBookmark(item)}
                title="ブックマークに保存"
              >
                <BookmarkPlus size={18} />
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
