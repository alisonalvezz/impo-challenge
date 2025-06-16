import React, { useEffect, useState, useRef } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { auth } from '../../config/firebase';
import axios from 'axios';
import CopeteGenerador from './CopeteGenerador';

const DocumentsIndex = ({ user }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const getToken = async () => {
    const user = auth.currentUser;
    if (user) return await user.getIdToken();
    return null;
  };

  useEffect(() => {
    if (user) fetchDocs();
    // eslint-disable-next-line
  }, [user]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get('https://backend-217609179837.us-central1.run.app/files/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(res.data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar documentos');
      setLoading(false);
    }
  };

  const handleNuevoDocumentoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = await getToken();
      await axios.post('https://backend-217609179837.us-central1.run.app/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      fetchDocs();
    } catch (err) {
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = docs.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedDoc) {
    return <CopeteGenerador doc={selectedDoc} onBack={() => setSelectedDoc(null)} />;
  }

  return (
    <div className="p-8 w-full font-inter">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Documentos</h2>
        <div className="relative w-full max-w-md flex justify-center">
          <input
            type="text"
            placeholder="Buscar"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-impo-blue text-sm"
          />
          <span className="absolute left-2 top-2.5 text-gray-400">
            <Search size={18} />
          </span>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <svg className="animate-spin h-8 w-8 text-impo-blue" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="#007FC0"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="#007FC0"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div
            onClick={handleNuevoDocumentoClick}
            className={`flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg h-40 cursor-pointer hover:border-impo-blue transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Plus size={32} className="text-impo-blue mb-2" />
            <span className="text-xs text-gray-600">{uploading ? 'Subiendo...' : 'Nuevo documento'}</span>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept="application/pdf,image/*,.doc,.docx,.txt"
            />
          </div>
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg h-40 cursor-pointer hover:border-impo-blue transition w-full"
            >
              <FileText size={32} className="text-gray-400 mb-2" />
              <span className="text-xs text-gray-700 text-center px-2 truncate">{doc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsIndex; 