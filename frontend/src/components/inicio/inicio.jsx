import React, { useState } from 'react';
import Sidebar from '../sidebar/sidebar.jsx';
import DocumentsIndex from '../documentos/DocumentsIndex.jsx';
import AdminAddUser from '../admin/AdminAddUser.jsx';

const Inicio = ({ user }) => {
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
        user={user}
      />
      {/* Contenido principal */}
      <div className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8">
        {activeTab === 'inicio' ? (
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            ¡Bienvenido/a{user && (user.displayName || user.email) ? `, ${user.displayName || (user.email ? user.email.split('@')[0] : '')}` : ''}!
          </h1>
        ) : activeTab === 'admin' ? (
          <AdminAddUser user={user} />
        ) : (
          <DocumentsIndex user={user} />
        )}
      </div>
    </div>
  );
};

export default Inicio;