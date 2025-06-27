import React, { useState, useEffect } from 'react';
import impoLogo from '../../assets/impo.png';
import { auth } from '../../config/firebase';

//iconos de los items de nav (la casita y carpeta)
const HomeIcon = ({ className, color = "#939292" }) => (
  <svg 
    className={className} 
    width="28" 
    height="28" 
    viewBox="0 0 28 28" 
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M14 2.8L25.2 12.6V24.5C25.2 25.15 24.65 25.7 24 25.7H18.2C17.55 25.7 17 25.15 17 24.5V18.2H11V24.5C11 25.15 10.45 25.7 9.8 25.7H4C3.35 25.7 2.8 25.15 2.8 24.5V12.6L14 2.8Z" 
      fill={color}
    />
  </svg>
);

const FolderIcon = ({ className, color = "#939292" }) => (
  <svg 
    className={className} 
    width="28" 
    height="28" 
    viewBox="0 0 28 28" 
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 4.9H11.2L13.4 7.7H24C25.1 7.7 26 8.6 26 9.7V22.4C26 23.5 25.1 24.4 24 24.4H4C2.9 24.4 2 23.5 2 22.4V6.9C2 5.8 2.9 4.9 4 4.9Z" 
      fill={color}
      stroke={color === "#007FC0" ? "#007FC0" : "transparent"}
      strokeWidth="2"
    />
  </svg>
);

//menu icono hamburguesa (para mobile)
const MenuIcon = ({ className }) => (
  <div className={`relative ${className}`} style={{ width: '32px', height: '32px' }}>
    {/* el background */}
    <div 
      className="absolute inset-0 bg-white rounded-md"
      style={{ borderRadius: '4px' }}
    />
    
    {/* lineas del menu */}
    <div className="absolute" style={{ 
      width: '20px', 
      height: '15px',
      left: '6px',
      top: '8.5px'
    }}>
      {/* line 1 */}
      <div 
        className="absolute rounded-full"
        style={{
          width: '20px',
          height: '3px',
          left: '0px',
          top: '0px',
          backgroundColor: '#CECDCD',
          borderRadius: '8px'
        }}
      />
      
      {/* line 2 */}
      <div 
        className="absolute rounded-full"
        style={{
          width: '20px',
          height: '3px',
          left: '0px',
          top: '6px',
          backgroundColor: '#CECDCD',
          borderRadius: '8px'
        }}
      />
      
      {/* line 3 */}
      <div 
        className="absolute rounded-full"
        style={{
          width: '20px',
          height: '3px',
          left: '0px',
          top: '12px',
          backgroundColor: '#CECDCD',
          borderRadius: '8px'
        }}
      />
    </div>
  </div>
);

//cruz mobile
const CloseIcon = ({ className }) => (
  <svg 
    className={className} 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M18 6L6 18M6 6l12 12" 
      stroke="#9CA3AF" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const PersonIcon = ({ className, color = "#939292" }) => (
  <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="10" r="5" fill={color} />
    <rect x="6" y="18" width="16" height="6" rx="3" fill={color} />
  </svg>
);

const LogoutIcon = ({ className, color = "#939292" }) => (
  <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6H8C6.9 6 6 6.9 6 8V20C6 21.1 6.9 22 8 22H10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 16L22 14L16 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 14H10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Sidebar 
const Sidebar = ({ activeItem = 'inicio', onItemChange, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const token = await user.getIdTokenResult();
        setIsAdmin(token.claims.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [user]);

  const handleLogout = () => {
    auth.signOut();
  };

  const menuItems = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: HomeIcon
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: FolderIcon
    },
  ];
  if (isAdmin) {
    menuItems.push({
      id: 'admin',
      label: 'Admin',
      icon: PersonIcon
    });
  }

  const handleItemClick = (itemId) => {
    if (onItemChange) {
      onItemChange(itemId);
    }
    //cerrar menu si haces cick en un item
    handleCloseMobileMenu();
  };

  const handleCloseMobileMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      handleCloseMobileMenu();
    } else {
      setIsMobileMenuOpen(true);
    }
  };
  //contenido del sidebar (mismo en desktop y mobile)
  const sidebarContent = (
    <>      {/* Logo Section */}
      <div className="px-6 pt-2 pb-4 lg:p-6">
        <img 
          src={impoLogo} 
          alt="IMPO Logo" 
          className="w-full h-auto object-contain"
        />
      </div>

      {/* menu de nav */}
      <nav className="flex-1 mt-0 lg:mt-4">
        <ul className="space-y-0 px-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                    hover:bg-gray-50 group
                  `}
                >
                  <IconComponent 
                    className="flex-shrink-0 transition-colors duration-200" 
                    color={isActive ? '#007FC0' : '#939292'}
                  />
                  <span 
                    className={`
                      text-sm font-medium transition-colors duration-200
                      group-hover:text-[#007FC0]
                    `}
                    style={{ 
                      color: isActive ? '#007FC0' : '#939292' 
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Info de usuario */}
      {user && (
        <div className="px-4 pb-2 flex items-center space-x-3">
          <PersonIcon className="w-7 h-7" color="#007FC0" />
          <span className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">
            {user.displayName || (user.email ? user.email.split('@')[0] : '')}
          </span>
        </div>
      )}
      {/* Botón de cerrar sesión */}
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-red-50 group"
        >
          <LogoutIcon 
            className="flex-shrink-0 transition-colors duration-200" 
            color="#EF4444"
          />
          <span className="text-sm font-medium text-red-500 group-hover:text-red-600 transition-colors duration-200">
            Cerrar sesión
          </span>
        </button>
      </div>
    </>
  );
  return (
    <>      {/* boton para mobile */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 transition-all duration-200 hover:opacity-80"
      >
        <MenuIcon />
      </button>

      {/* sidebar para desktop */}
      <div className="hidden lg:flex bg-white h-screen w-52 shadow-lg flex-col">
        {sidebarContent}
      </div>      
      {isMobileMenuOpen && (
        <>
          {/* Mobile Sidebar */}
          <div className={`lg:hidden fixed left-0 top-0 bottom-0 w-52 bg-white shadow-2xl z-50 flex flex-col ${
            isClosing ? 'animate-slide-out' : 'animate-slide-in'
          }`}>            {/* Header con botón de cerrar */}
            <div className="flex items-center p-2">
              <button
                onClick={handleCloseMobileMenu}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <CloseIcon />
              </button>
            </div>
            
            {/* Sidebar content */}
            <div className="flex-1 flex flex-col">
              {sidebarContent}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;