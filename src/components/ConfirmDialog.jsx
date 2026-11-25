import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ dialog, onCancel }) => {
  useEffect(() => {
    if (!dialog) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, onCancel]);

  if (!dialog) return null;

  const {
    title = '確認',
    message,
    confirmLabel = '実行する',
    cancelLabel = 'キャンセル',
    danger = false,
    onConfirm,
  } = dialog;

  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="glass-panel confirm-modal fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          {danger && <AlertTriangle size={20} className="confirm-danger-icon" />}
          <h3>{title}</h3>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="btn confirm-cancel-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
