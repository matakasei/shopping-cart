import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import './ToastContainer.css';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div key={toast.id} className={`toast-item toast-${toast.type || 'info'}`}>
            <Icon size={18} className="toast-icon" />
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="通知を閉じる"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
