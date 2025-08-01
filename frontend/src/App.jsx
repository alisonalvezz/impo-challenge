import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Inicio from './components/inicio/inicio';
import { auth } from './config/firebase';
import { SnackbarProvider } from './components/SnackbarContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <SnackbarProvider>
      <div className="App">
        {user ? (
          <Inicio user={user} />
        ) : (
          <LoginForm />
        )}
      </div>
    </SnackbarProvider>
  );
}

export default App; 
