import React, { useEffect, useState, useRef } from 'react';
import { FileText, Plus, Search, Trash2, Calendar, ArrowUpDown } from 'lucide-react';
import { auth } from '../../config/firebase';
import axios from 'axios';
import CopeteGenerador from './CopeteGenerador';
import { useSnackbar } from '../SnackbarContext';
import ConfirmDialog from '../ConfirmDialog';

const DocumentsIndex = ({ user }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('fechaSubida'); // 'fechaSubida', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const showSnackbar = useSnackbar();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, docId: null });

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
      return res.data;
    } catch (err) {
      setError('Error al cargar documentos');
      setLoading(false);
      return [];
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
    if (docs.some(doc => doc.name === file.name)) {
      showSnackbar('Ya existe un archivo con ese nombre.', 'warning');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = await getToken();
      const response = await axios.post('https://backend-217609179837.us-central1.run.app/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const newDocId = response.data.id;
      showSnackbar('Archivo subido correctamente.', 'success');
      setTimeout(async () => {
        const updatedDocs = await fetchDocs();
        const newDoc = updatedDocs.find(doc => doc.id === newDocId);
        if (newDoc) {
          setSelectedDoc(newDoc);
        } else {
          fetchDocs();
        }
      }, 2000);
    } catch (err) {
      console.error('Error al subir archivo:', err);
      showSnackbar('Error al subir el archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = (docId, e) => {
    e.stopPropagation();
    setConfirmDialog({ open: true, docId });
  };

  const confirmDelete = async () => {
    const docId = confirmDialog.docId;
    setConfirmDialog({ open: false, docId: null });
    setDeletingDoc(docId);
    try {
      const token = await getToken();
      await axios.delete(`https://backend-217609179837.us-central1.run.app/files/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDocs();
      showSnackbar('Documento eliminado correctamente.', 'success');
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      showSnackbar('Error al eliminar el documento', 'error');
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortDocs = (documents) => {
    return documents.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'fechaSubida') {
        aValue = a.fechaSubida?.toDate?.() || new Date(0);
        bValue = b.fechaSubida?.toDate?.() || new Date(0);
      } else {
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filteredAndSortedDocs = sortDocs(
    docs.filter(doc => doc.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (selectedDoc) {
    return <CopeteGenerador doc={selectedDoc} onBack={() => setSelectedDoc(null)} />;
  }

  return (
    <div className="p-8 w-full font-inter">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Documentos</h2>
        
        {/* Filtros y ordenamiento */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 rounded bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-impo-blue text-sm"
            />
            <span className="absolute left-2 top-2.5 text-gray-400">
              <Search size={18} />
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleSort('fechaSubida')}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition ${
                sortBy === 'fechaSubida' 
                  ? 'bg-impo-blue text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar size={16} />
              Fecha
              <ArrowUpDown size={14} />
            </button>
            
            <button
              onClick={() => handleSort('name')}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition ${
                sortBy === 'name' 
                  ? 'bg-impo-blue text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={16} />
              Nombre
              <ArrowUpDown size={14} />
            </button>
          </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          
          {filteredAndSortedDocs.map((doc) => (
            <div
              key={doc.id}
              className="relative group bg-white border border-gray-200 rounded-lg h-40 cursor-pointer hover:border-impo-blue transition overflow-hidden"
            >
              {/* botón eliminar */}
              <button
                onClick={(e) => handleDeleteDoc(doc.id, e)}
                disabled={deletingDoc === doc.id}
                className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                title="Eliminar documento"
              >
                {deletingDoc === doc.id ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
              
              {/* contenido del documento */}
              <div
                onClick={() => setSelectedDoc(doc)}
                className="flex flex-col items-center justify-center h-full p-4"
              >
                <FileText size={32} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-700 text-center px-2 truncate w-full">{doc.name}</span>
                
                {/* fecha de subida */}
                {doc.fechaSubida && (
                  <span className="text-xs text-gray-500 mt-1">
                    {doc.fechaSubida.toDate ? 
                      doc.fechaSubida.toDate().toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) :
                      new Date(doc.fechaSubida).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    }
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={confirmDialog.open} message="¿Estás seguro de que quieres eliminar este documento?" onConfirm={confirmDelete} onCancel={() => setConfirmDialog({ open: false, docId: null })} />
    </div>
  );
};

export default DocumentsIndex; 