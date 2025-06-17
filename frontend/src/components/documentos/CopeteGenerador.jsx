import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../config/firebase';
import { doc as firestoreDoc, onSnapshot } from 'firebase/firestore';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent"></div>
    <p className="mt-4 text-gray-500">Generando copete...</p>
  </div>
);

export default function CopeteGenerador({ doc, onBack }) {
  const [generatedText, setGeneratedText] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estado, setEstado] = useState("pendiente");
  const [activeTab, setActiveTab] = useState("pdf");

  const isImage = doc.url && (doc.url.endsWith('.png') || doc.url.endsWith('.jpg') || doc.url.endsWith('.jpeg') || doc.url.endsWith('.gif'));
  const isPDF = doc.url && doc.url.endsWith('.pdf');

  const handleDocumentUpdate = useCallback((docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      setEstado(data.estado || "pendiente");
      if (data.texto_extraido) {
        setExtractedText(data.texto_extraido);
      }
      if (data.estado === "generado" && data.copete) {
        setGeneratedText(data.copete);
        setIsLoading(false);
      } else if (data.estado === "pendiente") {
        setIsLoading(true);
      } else if (data.estado === "error") {
        setError(data.errorMensaje || "Error desconocido al procesar el documento");
        setIsLoading(false);
      }
    } else {
      setError("Documento no encontrado en Firestore");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const documentRef = firestoreDoc(db, "files", doc.id);
    const unsubscribe = onSnapshot(documentRef, handleDocumentUpdate, (err) => {
      console.error("Error al escuchar cambios del documento:", err);
      setError("Error al cargar el copete");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [doc.id, handleDocumentUpdate]);

  return (
    <div className="flex h-screen bg-gray-50 font-inter relative">
      {/* Botón volver arriba a la derecha, semibold y responsive */}
      <button
        onClick={onBack}
        className="fixed top-2 right-2 sm:top-6 sm:right-8 text-impo-blue font-semibold hover:underline text-sm sm:text-base z-20 bg-white bg-opacity-80 px-2 py-1 rounded transition"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
      >
        &larr; Volver a documentos
      </button>
      <main className="flex-grow p-2 sm:p-4 md:p-8 flex flex-col">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 min-h-0">
          {/* a la izquierda el documento de origen */}
          <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full min-h-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Documento de origen</h2>
              <p className="text-sm text-gray-500 truncate">{doc.name}</p>
              
              {/* tabs para alternar entre PDF y texto extraído */}
              {isPDF && extractedText && (
                <div className="flex mt-3 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("pdf")}
                    className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === "pdf" 
                        ? "text-impo-blue border-b-2 border-impo-blue bg-blue-50" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    PDF Original
                  </button>
                  <button
                    onClick={() => setActiveTab("texto")}
                    className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === "texto" 
                        ? "text-impo-blue border-b-2 border-impo-blue bg-blue-50" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Texto Extraído
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 flex min-h-0 min-w-0">
              {activeTab === "texto" && extractedText ? (
                <div className="w-full h-full p-4 text-gray-700 bg-gray-50 overflow-auto text-sm leading-relaxed">
                  <div className="whitespace-pre-wrap">{extractedText}</div>
                </div>
              ) : isImage ? (
                <img src={doc.url} alt={doc.name} className="w-full h-full object-contain" />
              ) : isPDF ? (
                <iframe
                  src={doc.url}
                  title={doc.name}
                  className="w-full h-full"
                  style={{ minHeight: 0, minWidth: 0, border: 'none' }}
                  allowFullScreen
                />
              ) : (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-impo-blue underline">Ver documento</a>
              )}
            </div>
          </div>
          {/* a la derecha el copete generado por IA */}
          <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Copete generado por IA</h2>
              <p className="text-sm text-gray-500">
                {estado === "pendiente" ? "Procesando documento..." : 
                 estado === "generado" ? "Copete listo" : 
                 "Estado: " + estado}
              </p>
            </div>
            <div className="flex-grow p-4 relative">
              {isLoading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="w-full h-full p-4 text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              ) : (
                <div className="w-full h-full p-4 text-gray-700 bg-gray-50 rounded-md whitespace-pre-wrap overflow-auto">
                  {generatedText || "No se pudo generar el copete"}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 