import React, { useState } from 'react';
import impoLogo from '../assets/impo.png';
import { EyeIcon, EyeSlashIcon } from './icons/EyeIcons';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt with:', { email, password });
  };

  return (
    <div className="min-h-screen bg-impo-bg flex flex-col items-center justify-center p-4 font-inter">
      <div className="mb-16 -mt-20">
        <img 
          src={impoLogo} 
          alt="IMPO - Centro de Información Oficial"
          className="w-64 h-auto"
        />
      </div>
      
      <div className="w-full max-w-[550px] bg-white rounded-2xl shadow-xl p-8 transform transition-all">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">
          Inicia sesión
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Introduce tu email"
              className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-impo-blue focus:border-transparent transition duration-150 ease-in-out text-gray-900 text-sm font-normal placeholder:text-gray-400 placeholder:font-normal"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduce tu contraseña"
                className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-impo-blue focus:border-transparent transition duration-150 ease-in-out text-gray-900 text-sm font-normal placeholder:text-gray-400 placeholder:font-normal"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-impo-blue text-white py-3 px-4 rounded-xl font-semibold hover:bg-impo-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-impo-blue transform transition-all duration-150 ease-in-out hover:shadow-md active:scale-[0.98]"
          >
            Ingresar
          </button>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {}}
              className="text-sm font-medium text-impo-blue hover:text-impo-blue-hover transition-colors mt-4"
            >
              ¿Olvidaste la contraseña?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm; 