import { ExternalLink, Trash2, SplitSquareHorizontal } from 'lucide-react';
import { formatJPY, getItemBreakdown } from '../utils/cartUtils';
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

  const enriched = items.map((item) => ({
    item,
    breakdown: getItemBreakdown(item),
  }));

  const lowestEffective = Math.min(...enriched.map((e) => e.breakdown.effectiveTotal));

  return (
    <div className="compare-container fade-in">
      <div className="glass-panel">
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>
          <SplitSquareHorizontal size={20} /> 商品の比較（送料・ポイント考慮）
        </h2>

        <div className="compare-table-wrapper">
          <table className="compare-specs-table">
            <thead>
              <tr>
                <th className="spec-label-col"></th>
                {enriched.map(({ item }) => (
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
                <td className="spec-label">実質合計</td>
                {enriched.map(({ item, breakdown }) => {
                  const isLowest = breakdown.effectiveTotal === lowestEffective;
                  return (
                    <td
                      key={item.id}
                      className={`spec-value spec-price ${isLowest ? 'highlight-lowest' : ''}`}
                    >
                      {formatJPY(breakdown.effectiveTotal)}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="spec-label">最安値比</td>
                {enriched.map(({ item, breakdown }) => {
                  const isLowest = breakdown.effectiveTotal === lowestEffective;
                  const diffFromLowest = breakdown.effectiveTotal - lowestEffective;
                  return (
                    <td
                      key={item.id}
                      className={`spec-value ${isLowest ? 'highlight-lowest' : ''}`}
                    >
                      {isLowest ? (
                        <span className="badge-lowest">実質最安 ✨</span>
                      ) : (
                        <span className="price-diff">+{formatJPY(diffFromLowest)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="spec-label">本体価格</td>
                {enriched.map(({ item, breakdown }) => (
                  <td key={item.id} className="spec-value">
                    {formatJPY(breakdown.price)}
                    {breakdown.quantity > 1 && (
                      <span className="compare-qty-note"> × {breakdown.quantity}</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="spec-label">送料</td>
                {enriched.map(({ item, breakdown }) => (
                  <td key={item.id} className="spec-value">
                    {breakdown.shipping === 0 ? (
                      <span className="compare-free-badge">無料</span>
                    ) : (
                      `+${formatJPY(breakdown.shipping)}`
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="spec-label">ポイント</td>
                {enriched.map(({ item, breakdown }) => (
                  <td key={item.id} className="spec-value">
                    {breakdown.points > 0 ? (
                      <span className="compare-points-badge">
                        -{breakdown.points.toLocaleString()}pt
                      </span>
                    ) : (
                      <span className="price-diff">0pt</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="spec-label">サイト</td>
                {enriched.map(({ item }) => (
                  <td key={item.id} className="spec-value">
                    <span className="site-badge" style={{ backgroundColor: item.siteInfo.color }}>
                      {item.siteInfo.siteName}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="spec-label">操作</td>
                {enriched.map(({ item }) => (
                  <td key={item.id} className="spec-value">
                    <div className="action-buttons-center" style={{ justifyContent: 'center' }}>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon primary"
                          title="商品ページを開く"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <button
                        className="btn-icon danger"
                        onClick={() => onRemove(item.id)}
                        title="比較から削除"
                      >
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
