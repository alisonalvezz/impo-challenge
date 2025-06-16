import React, { useState } from 'react';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent"></div>
    <p className="mt-4 text-gray-500">Generando copete...</p>
  </div>
);

export default function CopeteGenerador({ doc, onBack }) {
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isImage = doc.url && (doc.url.endsWith('.png') || doc.url.endsWith('.jpg') || doc.url.endsWith('.jpeg') || doc.url.endsWith('.gif'));
  const isPDF = doc.url && doc.url.endsWith('.pdf');

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
            </div>
            <div className="flex-1 flex min-h-0 min-w-0">
              {isImage ? (
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
              <h2 className="text-lg font-bold text-gray-800">Generado por IA</h2>
              <p className="text-sm text-gray-500">El copete resultante aparecerá aquí.</p>
            </div>
            <div className="flex-grow p-4 relative">
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="w-full h-full p-2 text-gray-700 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {error ? <p className="text-red-500">{error}</p> : generatedText}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 