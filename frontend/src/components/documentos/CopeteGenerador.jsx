import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from "jspdf"; 
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { db, auth } from '../../config/firebase';
import { doc as firestoreDoc, onSnapshot } from 'firebase/firestore';
import { useSnackbar } from '../SnackbarContext';
import { ArrowLeft } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent"></div>
    <p className="mt-4 text-gray-500">Generando copete...</p>
  </div>
); 

function getPlainCopete(copete) {
  if (!copete) return "";
  if (typeof copete === "string") return copete;
  if (typeof copete === "object" && copete.parts && Array.isArray(copete.parts) && copete.parts[0]?.text) {
    return copete.parts[0].text;
  }
  if (typeof copete === "object") {
    return copete.text || JSON.stringify(copete);
  }
  return String(copete);
}

// Agregar estilos para el modal popup
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    minWidth: '320px',
    maxWidth: '90vw',
    boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  textarea: {
    width: '100%',
    minHeight: '80px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    padding: '0.5rem',
    marginTop: '1rem',
    marginBottom: '1rem',
    fontSize: '1rem',
    resize: 'vertical',
  },
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    background: '#eee',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1.5rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  sendBtn: {
    background: '#F58138',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1.5rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default function CopeteGenerador({ doc, onBack }) {
  const [generatedText, setGeneratedText] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estado, setEstado] = useState("pendiente");
  const [activeTab, setActiveTab] = useState("pdf");
  const showSnackbar = useSnackbar();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [previousCopete, setPreviousCopete] = useState(null);
  const CLOUD_FUNCTION_URL = "https://us-central1-impo-equipo1.cloudfunctions.net/feedback_copete";

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

  const generatePDF = () => {
    const pdf = new jsPDF();
    const text = generatedText;
    const save = doc.name.replace(".pdf", "_copete") + '.pdf';

    const pageWidth = pdf.internal.pageSize.width;
    const margin = 10; 
    const textWidth = pageWidth - margin * 2; 

    const formattedText = pdf.splitTextToSize(text, textWidth);

    pdf.text(formattedText, margin, 20);
    pdf.save(save);
  };

const exportToDocx = () => {
  const docx = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun(generatedText)],
          }),
        ],
      },
    ],
  });

  // Generate the .docx file
  Packer.toBlob(docx).then((blob) => {
    saveAs(blob, 'docx');
  });
};

  const handleCopyCopete = () => {
    navigator.clipboard.writeText(generatedText);
    showSnackbar('Copete copiado al portapapeles', 'success');
  };

  const handleOpenFeedback = () => setShowFeedbackBox(true);
  const handleCloseFeedback = () => {
    setShowFeedbackBox(false);
    setFeedback("");
  };

  const handleSendFeedback = async () => {
    setIsSendingFeedback(true);
    try {
      const payload = {
        doc_id: doc.id,
        feedback_usuario: feedback,
        texto_original: extractedText,
        copete: generatedText
      };
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Respuesta Cloud Function:', data);
        let nuevoCopete = data.copete;
        nuevoCopete = getPlainCopete(nuevoCopete);
        setPreviousCopete(generatedText);
        setGeneratedText(nuevoCopete);
        showSnackbar('¡Feedback enviado correctamente!', 'success');
        setShowFeedbackBox(false);
        setFeedback("");
      } else {
        showSnackbar('Error al enviar feedback', 'error');
      }
    } catch (error) {
      showSnackbar('Error de red al enviar feedback', 'error');
    } finally {
      setIsSendingFeedback(false);
    }
  };

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
        className="absolute -top-5 left-0 z-20 bg-white bg-opacity-80 p-2 rounded-full shadow hover:bg-gray-100 transition"
        title="Volver a documentos"
        aria-label="Volver a documentos"
      >
        <ArrowLeft size={28} className="text-impo-blue" />
      </button>
      <main className="flex-grow p-2 sm:p-4 md:p-8 flex flex-col pt-2">
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
              <div className='flex relative justify-end pr-4 space-x-2'>
                <button onClick={generatePDF} class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded pr-4">
                  <svg class="w-[28px] h-[28px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M5 17v-5h1.5a1.5 1.5 0 1 1 0 3H5m12 2v-5h2m-2 3h2M5 10V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1v6M5 19v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1M10 3v4a1 1 0 0 1-1 1H5m6 4v5h1.375A1.627 1.627 0 0 0 14 15.375v-1.75A1.627 1.627 0 0 0 12.375 12H11Z"/>
                  </svg>
                </button>

                <button onClick={exportToDocx} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded pl-4" name='2'>
                  <svg class="w-[28px] h-[28px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M5 10V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1v6M5 19v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1M10 3v4a1 1 0 0 1-1 1H5m14 9.006h-.335a1.647 1.647 0 0 1-1.647-1.647v-1.706a1.647 1.647 0 0 1 1.647-1.647L19 12M5 12v5h1.375A1.626 1.626 0 0 0 8 15.375v-1.75A1.626 1.626 0 0 0 6.375 12H5Zm9 1.5v2a1.5 1.5 0 0 1-1.5 1.5v0a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5v0a1.5 1.5 0 0 1 1.5 1.5Z"/>
                  </svg>
                </button>
                <button onClick={handleCopyCopete} class="bg-green-500 hover:bg-green-700 text-black font-bold py-2 px-4 rounded">
                  <svg class="w-[28px] h-[28px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="1" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-grow p-4 relative">
              {isLoading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="w-full h-full p-4 text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <div className="p-4 text-gray-700 bg-gray-50 rounded-md whitespace-pre-wrap overflow-auto h-full">
                    {getPlainCopete(generatedText) || "No se pudo generar el copete"}
                  </div>
                  <div style={{ position: 'absolute', bottom: 16, right: 24, display: 'flex', gap: '1rem' }}>
                    {previousCopete && (
                      <button
                        onClick={() => {
                          setGeneratedText(previousCopete);
                          setPreviousCopete(null);
                          showSnackbar('Volviste al copete original', 'info');
                        }}
                        style={{ background: '#eee', color: '#333', fontWeight: 600, padding: '0.5rem 1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: 'none' }}
                      >
                        Volver al copete original
                      </button>
                    )}
                    {!showFeedbackBox && (
                      <button
                        onClick={handleOpenFeedback}
                        style={{ background: '#F58138', color: 'white', fontWeight: 600, padding: '0.5rem 1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: 'none' }}
                      >
                        Dar feedback
                      </button>
                    )}
                  </div>
                  {showFeedbackBox && (
                    <div style={modalStyles.overlay}>
                      <div style={modalStyles.modal}>
                        <div style={{fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.5rem'}}>Escribe aquí tu feedback</div>
                        <textarea
                          style={modalStyles.textarea}
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          placeholder="Escribe tu feedback aquí..."
                          rows={4}
                          disabled={isSendingFeedback}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (feedback.trim() && !isSendingFeedback) handleSendFeedback();
                            }
                          }}
                        />
                        <div style={modalStyles.buttonRow}>
                          <button
                            style={modalStyles.cancelBtn}
                            onClick={handleCloseFeedback}
                            disabled={isSendingFeedback}
                          >
                            Cancelar
                          </button>
                          <button
                            style={modalStyles.sendBtn}
                            onClick={handleSendFeedback}
                            disabled={isSendingFeedback || !feedback.trim()}
                          >
                            {isSendingFeedback ? 'Enviando...' : 'Enviar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 