import { useState, useMemo } from 'react';
import {
  ExternalLink,
  Trash2,
  SplitSquareHorizontal,
  ArrowUpDown,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { formatJPY, getItemBreakdown } from '../utils/cartUtils';
import { sanitizeHttpUrl } from '../utils/urlParser';
import './CompareList.css';

const CompareList = ({ items, onRemove, onClear, onAddToCart, onLoadSample }) => {
  const [sortByCheapest, setSortByCheapest] = useState(true);

  const targetItems = useMemo(() => {
    const withBreakdown = items.map((item) => ({
      item,
      breakdown: getItemBreakdown(item),
    }));

    if (sortByCheapest) {
      return [...withBreakdown].sort(
        (a, b) => a.breakdown.effectiveTotal - b.breakdown.effectiveTotal
      );
    }
    return withBreakdown;
  }, [items, sortByCheapest]);

  if (items.length === 0) {
    return (
      <div className="glass-panel empty-state fade-in">
        <SplitSquareHorizontal size={48} className="empty-icon" />
        <p className="empty-title">比較表は空です。</p>
        <p className="empty-subtext">
          左のフォームから比較したい商品を追加するか、カート内の商品から「比較表にコピー」で追加できます。
        </p>
        {onLoadSample && (
          <button
            type="button"
            className="btn btn-primary empty-sample-btn"
            onClick={onLoadSample}
          >
            <Sparkles size={18} /> 比較サンプルを読み込む
          </button>
        )}
      </div>
    );
  }

  const lowestEffective = Math.min(...targetItems.map((e) => e.breakdown.effectiveTotal));

  return (
    <div className="compare-container fade-in">
      <div className="glass-panel compare-panel">
        <div className="compare-header-bar">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            <SplitSquareHorizontal size={20} /> 商品の比較（送料・ポイント考慮）
          </h2>

          <div className="compare-controls">
            <button
              type="button"
              className={`compare-sort-btn ${sortByCheapest ? 'active' : ''}`}
              onClick={() => setSortByCheapest((prev) => !prev)}
            >
              <ArrowUpDown size={14} />
              {sortByCheapest ? '実質価格が安い順' : '追加順'}
            </button>
            {onClear && (
              <button
                type="button"
                className="btn btn-danger compare-clear-btn"
                onClick={onClear}
              >
                すべてクリア
              </button>
            )}
          </div>
        </div>

        <div className="compare-table-wrapper">
          <table className="compare-specs-table">
            <thead>
              <tr>
                <th className="spec-label-col"></th>
                {targetItems.map(({ item }) => (
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
                {targetItems.map(({ item, breakdown }) => {
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
                {targetItems.map(({ item, breakdown }) => {
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
                {targetItems.map(({ item, breakdown }) => (
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
                {targetItems.map(({ item, breakdown }) => (
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
                {targetItems.map(({ item, breakdown }) => (
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
                {targetItems.map(({ item }) => (
                  <td key={item.id} className="spec-value">
                    <span className="site-badge" style={{ backgroundColor: item.siteInfo.color }}>
                      {item.siteInfo.siteName}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="spec-label">操作</td>
                {targetItems.map(({ item }) => {
                  const safeUrl = sanitizeHttpUrl(item.url);
                  return (
                    <td key={item.id} className="spec-value">
                      <div className="action-buttons-center" style={{ justifyContent: 'center' }}>
                        {onAddToCart && (
                          <button
                            className="btn-icon primary"
                            onClick={() => onAddToCart(item)}
                            title="この商品をカートに追加"
                            aria-label={`${item.title}をカートに追加`}
                          >
                            <ShoppingCart size={16} />
                          </button>
                        )}
                        {safeUrl && (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon primary"
                            title="商品ページを開く"
                            aria-label={`${item.title}の商品ページを開く`}
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button
                          className="btn-icon danger"
                          onClick={() => onRemove(item.id)}
                          title="比較から削除"
                          aria-label={`${item.title}を比較から削除`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareList;
