import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import impoLogo from '../assets/impo.png';
import { ArrowLeft } from 'lucide-react';

const ResetPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.');
      setEmail('');
    } catch (error) {
      console.error('Error al enviar email de restablecimiento:', error);
      setError(
        error.code === 'auth/user-not-found'
          ? 'No existe una cuenta con este correo electrónico.'
          : error.code === 'auth/invalid-email'
          ? 'El formato del correo electrónico no es válido.'
          : 'Error al enviar el correo de restablecimiento. Por favor, intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-impo-blue hover:text-impo-blue-hover transition-colors mr-4"
          >
            <ArrowLeft size={20} />
            <span className="ml-1 text-sm font-medium">Volver</span>
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
          Restablecer contraseña
        </h1>
        
        <p className="text-gray-600 text-center mb-8 text-sm">
          Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
            {success}
          </div>
        )}

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

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-impo-blue text-white py-3 px-4 rounded-xl font-semibold 
              ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-impo-blue-hover'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-impo-blue 
              transform transition-all duration-150 ease-in-out hover:shadow-md active:scale-[0.98]`}
          >
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-impo-blue hover:text-impo-blue-hover transition-colors"
          >
            ¿Recordaste tu contraseña? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm; 