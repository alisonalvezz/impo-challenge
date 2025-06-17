import os
import tempfile
import json

from google.cloud import storage, firestore
from firebase_admin import initialize_app

from vertexai import init, rag
from vertexai.generative_models import GenerativeModel, SafetySetting, Tool

initialize_app()
db = firestore.Client()
storage_client = storage.Client()

init(project="impo-equipo1", location="us-central1")

gemini_model = GenerativeModel("gemini-2.0-flash")

SAFETY_SETTINGS = [
    SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
    SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
    SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
    SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
]

CORPUS_RESOURCE_NAME = "projects/impo-equipo1/locations/us-central1/ragCorpora/4611686018427387904"

def get_or_create_corpus():
    """Obtiene el corpus existente"""
    try:
        print(f"✅ Usando corpus existente: {CORPUS_RESOURCE_NAME}")
        return CORPUS_RESOURCE_NAME
        
    except Exception as e:
        print(f"⚠️ Error al obtener corpus: {e}")
        return None

def extraer_texto_pdf(path_pdf: str) -> str:
    try:
        import fitz
        texto = ""
        with fitz.open(path_pdf) as doc:
            for page in doc:
                texto += page.get_text()
        return texto.strip()
    except Exception as e:
        print(f"⚠️ Error al extraer texto del PDF: {e}")
        return ""

def generar_y_verificar_copete_rag(texto_extraido: str) -> tuple[str, dict]:
    """
    Consulta el RAG Engine con el texto extraído y recibe el copete + verificación.
    """
    try:
        corpus_name = get_or_create_corpus()
        if not corpus_name:
            raise Exception("No se pudo obtener el corpus")
        
        rag_resource = rag.RagResource(rag_corpus=corpus_name)

        rag_retrieval_tool = Tool.from_retrieval(
            retrieval=rag.Retrieval(
                source=rag.VertexRagStore(
                    rag_resources=[rag_resource],
                    rag_retrieval_config=rag.RagRetrievalConfig(
                        top_k=3,
                        vector_distance_threshold=0.5,
                    )
                )
            )
        )
        
        rag_model = GenerativeModel(
            "gemini-2.0-flash",
            tools=[rag_retrieval_tool],
            safety_settings=SAFETY_SETTINGS
        )
        
        prompt = "Tu tarea es generar un resumen breve, también llamado copete, que describa con claridad y precisión el contenido principal del documento legal. El copete debe ser de 2 a 3 líneas como máximo. Evitá lenguaje técnico innecesario y priorizá la claridad y utilidad para un lector general."
        
        response = rag_model.generate_content(
            prompt,
            generation_config={"temperature": 0.2, "max_output_tokens": 512}
        )
        
        texto = response.text.strip()

        verif_prompt = f"""
Este es un resumen legal generado (copete):
---
{texto}

Evaluá si es correcto, claro y útil. Respondé en JSON con estos campos:
- "validez": "correcto" | "incompleto" | "incorrecto"
- "motivo": explicación breve
- "sugerencia": si aplica, sugerí una mejora textual
"""
        try:
            verif_response = gemini_model.generate_content(
                verif_prompt,
                generation_config={"temperature": 0.2, "max_output_tokens": 256},
                safety_settings=SAFETY_SETTINGS,
            )
            veredicto = json.loads(verif_response.text)
        except Exception:
            print("⚠️ No se pudo interpretar la respuesta del modelo. Respuesta cruda:", verif_response.text)
            veredicto = {
                "validez": "indeterminado",
                "motivo": "No se pudo interpretar",
                "sugerencia": ""
            }
        
        return texto, veredicto
        
    except Exception as e:
        print(f"❌ Error en RAG: {e}")
        return generar_copete_sin_rag(texto_extraido)

def generar_copete_sin_rag(texto_extraido: str) -> tuple[str, dict]:
    """Genera copete sin RAG como fallback"""
    try:
        prompt = f"""
Basándote en el siguiente texto legal, generá un copete breve, claro y útil:

{texto_extraido[:2000]}  # Limitar a 2000 caracteres para evitar tokens excesivos

Generá un copete que sea:
- Breve (máximo 3 oraciones)
- Claro y comprensible
- Útil para entender el contenido del documento
"""

        response = gemini_model.generate_content(
            prompt,
            generation_config={"temperature": 0.2, "max_output_tokens": 512},
            safety_settings=SAFETY_SETTINGS,
        )
        
        texto = response.text.strip()
        
        veredicto = {
            "validez": "correcto",
            "motivo": "Generado sin RAG (fallback)",
            "sugerencia": ""
        }
        
        return texto, veredicto
        
    except Exception as e:
        print(f"❌ Error en fallback: {e}")
        return "No se pudo generar el copete", {
            "validez": "error",
            "motivo": str(e),
            "sugerencia": ""
        }

def process_document(event, context):
    bucket_name = event["bucket"]
    file_path = event["name"]

    print(f"📄 Procesando archivo: {file_path} del bucket {bucket_name}")

    if not file_path.endswith(".pdf"):
        print("⚠️ No es un PDF. Se ignora.")
        return

    try:
        partes = file_path.split("/")
        user_id = partes[0]
        doc_filename = partes[-1]
        doc_id = doc_filename.replace(".pdf", "")
        print(f"🔍 Extracción de IDs: user_id={user_id}, doc_id={doc_id}")
    except Exception:
        print("⚠️ Path malformado.")
        return

    doc_ref = db.collection("files").document(doc_id)
    doc_ref.set({"estado": "procesando"}, merge=True)

    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_path)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            blob.download_to_filename(temp_file.name)
            temp_path = temp_file.name

        texto = extraer_texto_pdf(temp_path)

        # (Opcional) guardar el texto extraído en el documento
        doc_ref.set({"texto_extraido": texto}, merge=True)

        copete, veredicto = generar_y_verificar_copete_rag(texto)

        doc_ref.set({
            "estado": "generado",
            "copete": copete,
            "feedback_llm": veredicto,
            "fechaProcesado": firestore.SERVER_TIMESTAMP
        }, merge=True)

    except Exception as e:
        print(f"❌ Error al procesar documento: {e}")
        doc_ref.set({"estado": "error", "errorMensaje": str(e)}, merge=True)

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"⚠️ No se pudo borrar el archivo temporal: {e}")