import { useState } from 'react';
import { Plus, Link2, Loader2, Info, PenLine } from 'lucide-react';
import { parseUrl, fetchUrlInfo, sanitizeHttpUrl } from '../utils/urlParser';
import { v4 as uuidv4 } from 'uuid';
import './AddItemForm.css';

const DEFAULT_MANUAL_SITE = {
  siteName: '手動入力',
  color: 'var(--color-other)',
  logoText: 'MEMO',
  domain: '',
};

const AddItemForm = ({ onAdd, onAddToCompare, defaultTarget = 'cart', onNotify }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [fetchNoticeMessage, setFetchNoticeMessage] = useState('');

  // フォームのステート
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [shipping, setShipping] = useState('0');
  const [points, setPoints] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [siteInfo, setSiteInfo] = useState(null);

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    const safeUrl = sanitizeHttpUrl(url);
    if (!safeUrl) {
      onNotify?.('http:// または https:// で始まる有効なURLを入力してください。', 'error');
      return;
    }

    setUrl(safeUrl);
    setIsLoading(true);
    setFetchNoticeMessage('');

    const parsedSiteInfo = parseUrl(safeUrl);
    setSiteInfo(parsedSiteInfo);

    const result = await fetchUrlInfo(safeUrl);

    if (result.data && (result.data.title || result.data.image)) {
      setTitle(result.data.title || '');
      setImageUrl(result.data.image || '');
      if (result.data.price) {
        setPrice(result.data.price);
      }
      if (!result.data.title) {
        setFetchNoticeMessage('商品名を自動取得できなかったため、手動で入力してください。');
      }
    } else if (result.reason === 'timeout') {
      setFetchNoticeMessage('情報取得がタイムアウトしました。手動で入力して追加できます。');
    } else if (result.reason === 'http_error' || result.reason === 'network_error') {
      setFetchNoticeMessage('外部サービスからの情報取得に失敗しました。手動で入力して追加できます。');
    } else {
      setFetchNoticeMessage('自動取得できなかった項目は手動で入力・編集できます。');
    }

    setIsLoading(false);
    setShowManualForm(true);
  };

  const handleOpenManualOnly = () => {
    setUrl('');
    setSiteInfo(DEFAULT_MANUAL_SITE);
    setFetchNoticeMessage('');
    setShowManualForm(true);
  };

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setPrice('');
    setQuantity('1');
    setShipping('0');
    setPoints('0');
    setImageUrl('');
    setSiteInfo(null);
    setFetchNoticeMessage('');
    setShowManualForm(false);
  };

  const buildItem = () => {
    if (!title.trim() || price === '') {
      onNotify?.('商品名と価格を入力してください', 'error');
      return null;
    }

    return {
      id: uuidv4(),
      url: url.trim(),
      title: title.trim(),
      price: Math.max(0, parseInt(price, 10) || 0),
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      shipping: Math.max(0, parseInt(shipping, 10) || 0),
      points: Math.max(0, parseInt(points, 10) || 0),
      imageUrl: imageUrl.trim(),
      siteInfo: siteInfo || (url.trim() ? parseUrl(url.trim()) : DEFAULT_MANUAL_SITE),
      addedAt: Date.now(),
    };
  };

  const handleSubmitTo = (target) => {
    const newItem = buildItem();
    if (!newItem) return;

    if (target === 'compare' && onAddToCompare) {
      onAddToCompare(newItem);
    } else {
      onAdd(newItem);
    }
    resetForm();
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    handleSubmitTo(defaultTarget);
  };

  return (
    <div className="glass-panel form-container">
      <h2 className="section-title">
        <Plus size={20} />
        商品を追加
      </h2>

      {!showManualForm ? (
        <form onSubmit={handleUrlSubmit} className="url-form">
          <p className="form-help">
            <Info size={16} className="form-help-icon" />
            <span>商品のURLを入力してください。サイト名や画像が自動取得されます。</span>
          </p>
          <div className="input-group">
            <div className="input-with-icon">
              <Link2 size={18} className="input-icon" />
              <input
                type="url"
                className="input-field"
                placeholder="https://amazon.co.jp/... または https://rakuten.co.jp/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !url}>
              {isLoading ? <Loader2 className="spin" size={18} /> : '次へ'}
            </button>
          </div>
          <p className="form-subnote">
            ※ 入力されたURL（http/httpsのみ）は、タイトル・画像取得のため外部サービス（Microlink）に送信されます。Amazon・楽天などは仕様上取得できない場合がありますが、次の画面で手動入力できます。
          </p>
          <button
            type="button"
            className="btn-text-link"
            onClick={handleOpenManualOnly}
          >
            <PenLine size={14} /> URLなしで手動入力する
          </button>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit} className="manual-form fade-in">
          <div className="site-badge-preview" style={{ backgroundColor: siteInfo?.color }}>
            {siteInfo?.siteName}
          </div>

          {fetchNoticeMessage && (
            <div className="fetch-notice">
              <Info size={15} />
              <span>{fetchNoticeMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label>商品名 <span className="required">*</span></label>
            <input
              type="text"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ワイヤレスイヤホン"
              required
            />
          </div>

          <div className="form-group">
            <label>本体価格 (円) <span className="required">*</span></label>
            <input
              type="number"
              className="input-field"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              required
              placeholder="例: 1500"
            />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>数量</label>
              <input
                type="number"
                className="input-field"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>送料 (円)</label>
              <input
                type="number"
                className="input-field"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                min="0"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>ポイント (pt)</label>
              <input
                type="number"
                className="input-field"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>画像URL (任意)</label>
            <input
              type="url"
              className="input-field"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {imageUrl && (
            <div className="image-preview">
              <img src={imageUrl} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setShowManualForm(false)}>
              戻る
            </button>
            {onAddToCompare && (
              <button
                type="button"
                className={`btn ${defaultTarget === 'compare' ? 'btn-primary' : ''}`}
                onClick={() => handleSubmitTo('compare')}
              >
                比較表に追加
              </button>
            )}
            <button
              type={defaultTarget === 'cart' ? 'submit' : 'button'}
              className={`btn ${defaultTarget === 'cart' ? 'btn-primary' : ''}`}
              onClick={defaultTarget === 'cart' ? undefined : () => handleSubmitTo('cart')}
            >
              カートに追加
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddItemForm;
