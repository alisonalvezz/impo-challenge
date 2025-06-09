import React, { useState } from 'react';
import Sidebar from '../sidebar/sidebar';

const Inicio = () => {
  const [activeTab, setActiveTab] = useState('inicio');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        activeItem={activeTab} 
        onItemChange={handleTabChange} 
      />      {/* Contenido principal */}
      <div className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          ¡Bienvenido/a!
        </h1>
      </div>
    </div>
  );
};

export default Inicio;