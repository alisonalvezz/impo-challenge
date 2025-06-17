import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Inicio from './components/inicio/inicio';
import { auth } from './config/firebase';
import { User } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
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
    <div className="App">
      {user ? (
        <Inicio user={user} />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}

export default App; 