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
          <table className="compare-table">
            <thead>
              <tr>
                <th>画像</th>
                <th>サイト</th>
                <th>商品名</th>
                <th>価格</th>
                <th>差額 (最安値比)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isLowest = item.price === lowestPrice;
                const diffFromLowest = item.price - lowestPrice;
                const formattedPrice = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(item.price);
                const formattedDiff = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(diffFromLowest);

                return (
                  <tr key={item.id} className={isLowest ? 'highlight-lowest' : ''}>
                    <td className="col-image">
                      <div className="compare-image-container">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} />
                        ) : (
                          <div className="no-image-small">{item.siteInfo.logoText}</div>
                        )}
                      </div>
                    </td>
                    <td className="col-site">
                      <span className="site-badge" style={{ backgroundColor: item.siteInfo.color }}>
                        {item.siteInfo.siteName}
                      </span>
                    </td>
                    <td className="col-title">
                      <div className="title-wrapper" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className="col-price">
                      <div className="price-value">{formattedPrice}</div>
                    </td>
                    <td className="col-diff">
                      {isLowest ? (
                        <span className="badge-lowest">最安値 ✨</span>
                      ) : (
                        <span className="price-diff">+{formattedDiff}</span>
                      )}
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons-center">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-icon primary" title="商品ページを開く">
                          <ExternalLink size={16} />
                        </a>
                        <button className="btn-icon danger" onClick={() => onRemove(item.id)} title="カートから削除">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareList;
