import React from 'react';
import { ExternalLink, Trash2, SplitSquareHorizontal } from 'lucide-react';
import './CompareList.css';

const CompareList = ({ items, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="glass-panel empty-state fade-in">
        <SplitSquareHorizontal size={48} className="empty-icon" />
        <p>比較する商品がありません。</p>
        <p className="empty-subtext">カートに商品を追加してから比較タブを開いてください。</p>
      </div>
    );
  }

  // 価格順でソートしたコピーを作成して最安値を判定
  const sortedByPrice = [...items].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedByPrice[0].price;

  return (
    <div className="compare-container fade-in">
      <div className="glass-panel">
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>
          <SplitSquareHorizontal size={20} /> 商品の比較
        </h2>
        
        <div className="compare-table-wrapper">
          <table className="compare-specs-table">
            <thead>
              <tr>
                <th className="spec-label-col"></th>
                {items.map(item => (
                  <th key={item.id} className="spec-product-col">
                    <div className="spec-image-container">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} />
                      ) : (
                        <div className="no-image-small">{item.siteInfo.logoText}</div>
                      )}
                    </div>
                    <div className="spec-title" title={item.title}>
                      {item.title}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="spec-label">価格</td>
                {items.map(item => {
                  const isLowest = item.price === lowestPrice;
                  const formattedPrice = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(item.price);
                  return (
                    <td key={item.id} className={`spec-value spec-price ${isLowest ? 'highlight-lowest' : ''}`}>
                      {formattedPrice}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="spec-label">最安値比</td>
                {items.map(item => {
                  const isLowest = item.price === lowestPrice;
                  const diffFromLowest = item.price - lowestPrice;
                  const formattedDiff = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(diffFromLowest);
                  return (
                    <td key={item.id} className={`spec-value ${isLowest ? 'highlight-lowest' : ''}`}>
                      {isLowest ? (
                        <span className="badge-lowest">最安値 ✨</span>
                      ) : (
                        <span className="price-diff">+{formattedDiff}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="spec-label">サイト</td>
                {items.map(item => (
                  <td key={item.id} className="spec-value">
                    <span className="site-badge" style={{ backgroundColor: item.siteInfo.color }}>
                      {item.siteInfo.siteName}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="spec-label">操作</td>
                {items.map(item => (
                  <td key={item.id} className="spec-value">
                    <div className="action-buttons-center" style={{ justifyContent: 'center' }}>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-icon primary" title="商品ページを開く">
                        <ExternalLink size={16} />
                      </a>
                      <button className="btn-icon danger" onClick={() => onRemove(item.id)} title="比較から削除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareList;
