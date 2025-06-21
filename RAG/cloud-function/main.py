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

def process_with_agent_engine(document_text, user_id="pdf-processor"):
    """Process document text using Vertex AI Agent Engine via REST API."""
    try:
        PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
        REGION = os.getenv("GOOGLE_CLOUD_LOCATION")
        AGENT_ENGINE_ID = os.getenv("AGENT_ENGINE_ID")
        
        if not all([PROJECT_ID, REGION, AGENT_ENGINE_ID]):
            raise Exception("Missing required environment variables")

        access_token = get_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        query_url = f"https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{REGION}/reasoningEngines/{AGENT_ENGINE_ID.split('/')[-1]}:streamQuery"
        query_payload = {
            "class_method": "stream_query",
            "input": {
                "input": f"Extrae el copete del siguiente documento:\n\n{document_text}"
            }
        }
        
        print("Sending direct query to agent engine...")
        query_response = requests.post(query_url, json=query_payload, headers=headers, stream=True)
        
        if query_response.status_code == 404:
            print(":streamQuery endpoint not found, trying alternative approach...")
            return "El agente no está configurado para responder a consultas directas. Se requiere configuración adicional."
        elif query_response.status_code == 400:
            print("Bad request, trying different payload format...")
            query_payload_alt = {
                "input": f"Extrae el copete del siguiente documento:\n\n{document_text}"
            }
            query_response = requests.post(query_url, json=query_payload_alt, headers=headers, stream=True)
            query_response.raise_for_status()
        else:
            query_response.raise_for_status()

        response_text = ""
        try:
            for line in query_response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data = line_str[6:]
                        if data and data != '[DONE]':
                            try:
                                event_data = json.loads(data)
                                if 'output' in event_data:
                                    response_text += event_data['output']
                                elif 'content' in event_data:
                                    response_text += str(event_data['content'])
                            except json.JSONDecodeError:
                                response_text += data
        except Exception as e:
            print(f"Error parsing streaming response: {e}")
            try:
                response_text = query_response.text
            except:
                response_text = "Error al procesar la respuesta del agente"
        
        return response_text.strip() if response_text else "No se pudo extraer el copete del documento."
        
    except Exception as e:
        print(f"Error processing with agent engine: {e}")
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
        
        copete = process_with_agent_engine(document_text)
        
        print(f"Extracted copete: {copete}")
        
        doc_ref = firestore_client.collection('files').document(doc_id)
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