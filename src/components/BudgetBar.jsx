import { useState } from 'react';
import { Target, Edit2, X, Check, AlertTriangle } from 'lucide-react';
import { formatJPY } from '../utils/cartUtils';
import './BudgetBar.css';

const BUDGET_PRESETS = [10000, 30000, 50000];

const BudgetBar = ({ budget, onUpdateBudget, currentTotal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(budget ? String(budget) : '');

  const startEdit = () => {
    setInputValue(budget ? String(budget) : '30000');
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(inputValue, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      onUpdateBudget(parsed);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="glass-panel budget-panel fade-in">
        <form onSubmit={handleSubmit} className="budget-edit-form">
          <div className="budget-edit-label">
            <Target size={18} />
            <span>目標予算を設定（円）</span>
          </div>
          <div className="budget-edit-controls">
            <input
              type="number"
              className="input-field budget-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              min="1"
              placeholder="例: 30000"
              autoFocus
            />
            <button type="submit" className="btn btn-primary budget-save-btn">
              <Check size={16} /> 設定
            </button>
            <button type="button" className="btn budget-cancel-btn" onClick={() => setIsEditing(false)}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!budget || budget <= 0) {
    return (
      <div className="glass-panel budget-panel budget-unset">
        <div className="budget-unset-text">
          <Target size={18} className="budget-icon" />
          <span>目標予算を設定すると、残額やオーバーを一目で確認できます</span>
        </div>
        <div className="budget-presets">
          {BUDGET_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="budget-preset-btn"
              onClick={() => onUpdateBudget(preset)}
            >
              {formatJPY(preset)}
            </button>
          ))}
          <button type="button" className="budget-preset-btn custom" onClick={startEdit}>
            金額を指定
          </button>
        </div>
      </div>
    );
  }

  const diff = budget - currentTotal;
  const isOver = diff < 0;
  const ratio = currentTotal / budget;
  const percentage = Math.min(100, Math.round(ratio * 100));
  const rawPercentage = Math.round(ratio * 100);
  const statusClass = isOver ? 'is-over' : ratio >= 0.85 ? 'is-warning' : 'is-safe';

  return (
    <div className={`glass-panel budget-panel ${statusClass}`}>
      <div className="budget-header">
        <div className="budget-title-group">
          <Target size={18} className="budget-icon" />
          <span className="budget-label">目標予算: <strong>{formatJPY(budget)}</strong></span>
          <button
            type="button"
            className="btn-icon tiny"
            onClick={startEdit}
            title="目標予算を編集"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            className="btn-icon tiny"
            onClick={() => onUpdateBudget(null)}
            title="目標予算を解除"
          >
            <X size={13} />
          </button>
        </div>

        <div className={`budget-status ${statusClass}`}>
          {isOver ? (
            <>
              <AlertTriangle size={15} />
              <span>{formatJPY(Math.abs(diff))} 予算オーバー</span>
            </>
          ) : (
            <span>あと <strong>{formatJPY(diff)}</strong> 使えます</span>
          )}
        </div>
      </div>

      <div className="budget-progress-track" role="progressbar" aria-valuenow={rawPercentage} aria-valuemin={0} aria-valuemax={100}>
        <div className={`budget-progress-fill ${statusClass}`} style={{ width: `${percentage}%` }} />
      </div>

      <div className="budget-footer">
        <span>現在の実質合計: {formatJPY(currentTotal)}</span>
        <span>予算消化率: {rawPercentage}%</span>
      </div>
    </div>
  );
};

export default BudgetBar;
