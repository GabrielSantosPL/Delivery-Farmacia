import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '650px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div
        className="app-modal-panel"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal-header">
          <h3>{title}</h3>
          <button type="button" className="app-modal-close" onClick={onClose} title="Fechar">
            ✕
          </button>
        </div>
        <div className="app-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
