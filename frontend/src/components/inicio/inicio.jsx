import React, { useState } from 'react';
import Sidebar from '../sidebar/sidebar.jsx';
import DocumentsIndex from '../documentos/DocumentsIndex.jsx';
import AdminAddUser from '../admin/AdminAddUser.jsx';
import img1 from '../../assets/1.png';
import img2 from '../../assets/2.png';
import img3 from '../../assets/3.png';
import img4 from '../../assets/4.png';
import img5 from '../../assets/5.png';

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
      {/* título y contenido */}
      <div className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8 overflow-y-auto">
        {activeTab === 'inicio' ? (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ¡Bienvenido/a{user && (user.displayName || user.email) ? `, ${user.displayName || (user.email ? user.email.split('@')[0] : '')}` : ''}!
            </h1>
            <p className="text-lg text-gray-600 mb-10">Esta es una guía rápida para usar la aplicación</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 1 */}
              <div className="relative flex flex-col bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute top-0 left-0 bg-impo-blue text-white w-8 h-8 flex items-center justify-center rounded-tl-xl rounded-br-lg font-bold">1</div>
                <img src={img1} alt="Paso 1: Navegar a Documentos" className="w-full rounded-lg shadow-sm border my-4"/>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Acceder a Documentos</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Utilice el menú lateral para dirigirse a la sección de <strong>Documentos</strong>.
                </p>
              </div>

              {/* 2 */}
              <div className="relative flex flex-col bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute top-0 left-0 bg-impo-blue text-white w-8 h-8 flex items-center justify-center rounded-tl-xl rounded-br-lg font-bold">2</div>
                <img src={img2} alt="Paso 2: Ver documentos existentes" className="w-full rounded-lg shadow-sm border my-4"/>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Visualizar sus Archivos</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Aquí podrá visualizar y gestionar todos los documentos que ha procesado previamente.
                </p>
              </div>

              {/*  3 */}
              <div className="relative flex flex-col bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute top-0 left-0 bg-impo-blue text-white w-8 h-8 flex items-center justify-center rounded-tl-xl rounded-br-lg font-bold">3</div>
                <img src={img3} alt="Paso 3: Subir un nuevo documento" className="w-full rounded-lg shadow-sm border my-4"/>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Cargar un Nuevo Documento</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Haga clic en el botón <strong>'Nuevo Documento'</strong> para iniciar el proceso de carga de un nuevo documento.
                </p>
              </div>

              {/* 4 */}
              <div className="relative flex flex-col bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute top-0 left-0 bg-impo-blue text-white w-8 h-8 flex items-center justify-center rounded-tl-xl rounded-br-lg font-bold">4</div>
                <img src={img4} alt="Paso 4: Seleccionar archivo" className="w-full rounded-lg shadow-sm border my-4"/>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Seleccionar el Archivo</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Navegue y seleccione el documento en formato PDF que desea procesar desde su dispositivo.
                </p>
              </div>

              {/* 5 */}
              <div className="relative flex flex-col bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute top-0 left-0 bg-impo-blue text-white w-8 h-8 flex items-center justify-center rounded-tl-xl rounded-br-lg font-bold">5</div>
                <img src={img5} alt="Paso 5: Ver resultado" className="w-full rounded-lg shadow-sm border my-4"/>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Obtener el Resultado</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Una vez procesado, el documento original y su copete estarán disponibles en su lista.
                </p>
              </div>
            </div>
          </div>
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