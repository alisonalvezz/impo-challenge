import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminAddUser({ user }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    role: 'user'
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const token = await user.getIdTokenResult();
        setIsAdmin(token.claims.role === 'admin');
      }
    }
    checkAdmin();
  }, [user]);

  if (!isAdmin) {
    return (
      <div className="p-8 w-full font-inter flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceso denegado</h2>
        <p className="text-gray-500">Esta sección es solo para administradores.</p>
      </div>
    );
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const token = await user.getIdToken();
      await axios.post(
        'https://backend-217609179837.us-central1.run.app/admin/create-user',
        form,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess('Usuario creado exitosamente');
      setForm({ email: '', password: '', display_name: '', role: 'user' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 w-full font-inter flex flex-col items-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Agregar usuario</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-impo-blue focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-impo-blue focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            name="display_name"
            value={form.display_name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-impo-blue focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-impo-blue focus:border-transparent text-gray-900"
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-impo-blue text-white py-2 rounded font-semibold hover:bg-impo-blue-hover transition"
        >
          {loading ? 'Creando...' : 'Crear usuario'}
        </button>
        {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </form>
    </div>
  );
} 