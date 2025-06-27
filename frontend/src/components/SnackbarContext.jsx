import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from './Snackbar';

const SnackbarContext = createContext();

export function SnackbarProvider({ children }) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'info' });

  const showSnackbar = useCallback((message, type = 'info', duration = 3000) => {
    setSnackbar({ open: true, message, type, duration });
  }, []);

  const handleClose = useCallback(() => {
    setSnackbar(s => ({ ...s, open: false }));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        duration={snackbar.duration}
        onClose={handleClose}
      />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar debe usarse dentro de un SnackbarProvider');
  return context.showSnackbar;
} 