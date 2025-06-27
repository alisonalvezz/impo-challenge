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
import unicodedata
import re

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

def limpiar_texto(texto):
    texto = unicodedata.normalize('NFC', texto)
    texto = ''.join(c for c in texto if c.isprintable())
    texto = re.sub(r'\s+', ' ', texto)
    texto = texto.strip()
    return texto

def process_with_adk_web_service(document_text, user_id="pdf-processor"):
    try:
        url = "https://adk-microservice-217609179837.us-central1.run.app/copete"
        response = requests.post(url, json={"texto": document_text}, timeout=120)
        if response.status_code == 200:
            copete = response.json().get("copete", "No se pudo extraer el copete del documento.")
            print(f"Copete recibido del microservicio: {copete}")
            return copete
        else:
            print(f"Error en microservicio: {response.text}")
            return f"Error al procesar el documento: {response.text}"
    except Exception as e:
        print(f"Error llamando al microservicio: {e}")
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

        document_text = limpiar_texto(document_text)
        print(f"Extracted {len(document_text)} characters from PDF (limpio)")
        
        doc_ref = firestore_client.collection('files').document(doc_id)
        doc_ref.set({"texto_extraido": document_text}, merge=True)
        
        copete = process_with_adk_web_service(document_text)
        
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

# --- Versión HTTP de process_pdf_agent con CORS ---
@functions_framework.http
def process_pdf_agent_http(request):
    # Manejo de CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    try:
        data = request.get_json()
        bucket_name = data.get("bucket")
        file_name = data.get("name")
        if not bucket_name or not file_name:
            return (json.dumps({'error': 'Faltan parámetros bucket o name'}), 400, {'Access-Control-Allow-Origin': '*'})

        partes = file_name.split("/")
        user_id = partes[0] if len(partes) > 1 else "system"
        doc_filename = partes[-1]
        doc_id = doc_filename.replace(".pdf", "")

        document_text = extract_text_from_pdf(bucket_name, file_name)
        if not document_text:
            raise Exception("Failed to extract text from PDF")

        document_text = limpiar_texto(document_text)
        doc_ref = firestore_client.collection('files').document(doc_id)
        doc_ref.set({"texto_extraido": document_text}, merge=True)
        copete = process_with_adk_web_service(document_text)
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
        respuesta = {
            'status': 'success',
            'file_name': file_name,
            'copete': copete
        }
        return (json.dumps(respuesta), 200, {'Access-Control-Allow-Origin': '*'})
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return (json.dumps({'error': str(e)}), 500, {'Access-Control-Allow-Origin': '*'})

FRONTEND_ORIGIN = 'https://frontend-217609179837.us-central1.run.app'

@functions_framework.http
def feedback_copete(request):
    # Manejo de CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    data = request.get_json()
    doc_id = data.get("doc_id")
    feedback_usuario = data.get("feedback_usuario")
    texto_original = data.get("texto_original")
    copete_actual = data.get("copete")

    if not doc_id or not feedback_usuario:
        return (json.dumps({"error": "Faltan parámetros"}), 400, {'Access-Control-Allow-Origin': FRONTEND_ORIGIN})

    doc_ref = firestore_client.collection('files').document(doc_id)
    doc = doc_ref.get()
    if not doc.exists:
        return (json.dumps({"error": "Documento no encontrado"}), 404, {'Access-Control-Allow-Origin': FRONTEND_ORIGIN})

    if not copete_actual:
        copete_actual = doc.to_dict().get("copete", "")
    if not copete_actual:
        return (json.dumps({"error": "No hay copete para refinar"}), 400, {'Access-Control-Allow-Origin': FRONTEND_ORIGIN})

    url = os.environ.get("ADK_FEEDBACK_URL", "https://adk-microservice-217609179837.us-central1.run.app/copete-feedback")
    payload = {
        "copete": copete_actual,
        "feedback_usuario": feedback_usuario,
        "texto_original": texto_original if texto_original is not None else ""
    }
    response = requests.post(url, json=payload, timeout=120)
    if response.status_code != 200:
        return (json.dumps({"error": "Error en microservicio", "detalle": response.text}), 500, {'Access-Control-Allow-Origin': FRONTEND_ORIGIN})
    copete_refinado = response.json().get("copete", "")
    if isinstance(copete_refinado, dict) and 'parts' in copete_refinado and copete_refinado['parts']:
        copete_refinado = copete_refinado['parts'][0].get('text', '')

    doc_ref.set({
        "copete": copete_refinado,
        "feedback_usuario": feedback_usuario
    }, merge=True)

    return (json.dumps({"copete": copete_refinado, "status": "ok"}), 200, {'Access-Control-Allow-Origin': FRONTEND_ORIGIN}) 