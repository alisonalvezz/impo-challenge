import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import Inicio from './components/inicio/inicio';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  const handleLogin = () => {
    setCurrentPage('inicio');
  };

  return (
    <div className="App">
      {currentPage === 'login' ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <Inicio />
      )}
    </div>
  );
}

export default App; 