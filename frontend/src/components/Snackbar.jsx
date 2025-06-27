import React, { useEffect } from 'react';

export default function Snackbar({ open, message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  let bgColor = 'bg-gray-800';
  if (type === 'success') bgColor = 'bg-green-600';
  if (type === 'error') bgColor = 'bg-red-600';
  if (type === 'warning') bgColor = 'bg-yellow-500';

  return (
    <div
      className={`fixed left-1/2 bottom-8 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium transition-all duration-300 ${bgColor}`}
      style={{ minWidth: 200, maxWidth: 400 }}
      role="alert"
    >
      {message}
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
} 