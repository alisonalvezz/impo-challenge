import functions_framework
import os
import json
import time
import requests
from google.auth import default
from google.auth.transport.requests import Request
from google.cloud import storage
from google.cloud import firestore
import PyPDF2
import io
from dotenv import load_dotenv
import uuid
from datetime import datetime
import pytz
import sys
import subprocess

sys.path.append(os.path.join(os.path.dirname(__file__), 'RAG'))

load_dotenv('.env')

storage_client = storage.Client()
firestore_client = firestore.Client()

def get_access_token():
    """Get access token using Application Default Credentials."""
    credentials, _ = default()
    credentials.refresh(Request())
    return credentials.token

def extract_text_from_pdf(bucket_name, file_name):
    """Extract text from a PDF file in Cloud Storage."""
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name)
        
        pdf_content = blob.download_as_bytes()
        
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
        text = ""
        
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

def process_with_adk_directly(document_text, user_id="pdf-processor"):
    """Process document text using ADK directamente (patrón moderno con sesión y mensaje)."""
    try:
        import asyncio
        from google.adk.runners import InMemoryRunner
        from google.genai.types import Part, UserContent
        from rag.agent import root_agent
        
        print("Inicializando ADK agent directamente...")
        prompt = f"Genera un copete para el siguiente documento legal:\n\n{document_text}"
        runner = InMemoryRunner(app_name="copete-generator", agent=root_agent)
        session = asyncio.run(runner.session_service.create_session(app_name=runner.app_name, user_id=user_id))
        content = UserContent(parts=[Part(text=prompt)])
        result = None
        for event in runner.run(user_id=session.user_id, session_id=session.id, new_message=content):
            if hasattr(event, 'content') and hasattr(event.content, 'parts'):
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        result = part.text
                        break
            if result:
                break
        print(f"ADK agent result: {result}")
        return result if result else "No se pudo extraer el copete del documento."
    except Exception as e:
        print(f"Error processing with ADK directly: {e}")
        return f"Error al procesar el documento: {str(e)}"

@functions_framework.cloud_event
def process_pdf_agent(cloud_event):
    """Cloud Function to process PDF files with Vertex AI Agent Engine."""
    try:
        bucket_name = cloud_event.data["bucket"]
        file_name = cloud_event.data["name"]
        
        print(f"Processing file: {file_name} from bucket: {bucket_name}")
        
        try:
            partes = file_name.split("/")
            user_id = partes[0] if len(partes) > 1 else "system"
            doc_filename = partes[-1]
            doc_id = doc_filename.replace(".pdf", "")
            print(f"🔍 Extracción de IDs: user_id={user_id}, doc_id={doc_id}")
        except Exception as e:
            print(f"⚠️ Error al extraer IDs del path: {e}")
            doc_id = file_name.replace(".pdf", "")
            user_id = "system"
        
        document_text = extract_text_from_pdf(bucket_name, file_name)
        if not document_text:
            raise Exception("Failed to extract text from PDF")
        
        print(f"Extracted {len(document_text)} characters from PDF")
        
        doc_ref = firestore_client.collection('files').document(doc_id)
        doc_ref.set({"texto_extraido": document_text}, merge=True)
        
        copete = process_with_adk_directly(document_text)
        
        print(f"Extracted copete: {copete}")
        
        doc_ref.set({
            'estado': 'generado',
            'copete': copete,
            'feedback_llm': {
                'validez': 'correcto',
                'motivo': 'Generado con RAG (Vertex AI Agent)',
                'sugerencia': ''
            },
            'fechaProcesado': firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        print(f"Result stored in Firestore for document: {file_name}")
        
        return {
            'status': 'success',
            'file_name': file_name,
            'copete': copete
        }
        
    except Exception as e:
        print(f"Error processing PDF: {e}")
        
        if 'file_name' in locals():
            doc_ref = firestore_client.collection('processed_documents').document(file_name)
            doc_ref.set({
                'file_name': file_name,
                'bucket_name': bucket_name if 'bucket_name' in locals() else 'unknown',
                'processed_at': firestore.SERVER_TIMESTAMP,
                'error': str(e),
                'status': 'error'
            })
        
        raise e 