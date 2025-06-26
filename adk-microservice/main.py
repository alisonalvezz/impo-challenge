from fastapi import FastAPI
from pydantic import BaseModel
from rag.agent import root_agent, Agent, GEMINI_MODEL
from google.adk.runners import InMemoryRunner
from google.genai.types import Part, UserContent
import asyncio
from google.adk.agents import SequentialAgent
from google.adk.utils import instructions_utils
import logging
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend-217609179837.us-central1.run.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CopeteRequest(BaseModel):
    texto: str

class FeedbackRequest(BaseModel):
    copete: str
    feedback_usuario: str
    texto_original: str

@app.post("/copete")
async def generar_copete(req: CopeteRequest):
    prompt = f"Genera un copete para el siguiente documento legal:\n\n{req.texto}"
    runner = InMemoryRunner(app_name="copete-generator", agent=root_agent)
    session = await runner.session_service.create_session(app_name=runner.app_name, user_id="api-user")
    content = UserContent(parts=[Part(text=prompt)])
    result = None
    for event in runner.run(user_id=session.user_id, session_id=session.id, new_message=content):
        if hasattr(event, 'content') and hasattr(event.content, 'parts'):
            for part in event.content.parts:
                if hasattr(part, 'text') and part.text:
                    result = part.text
    return {"copete": result or "No se pudo extraer el copete."}

async def build_user_feedback_instruction(readonly_context): 
    return await instructions_utils.inject_session_state(
        '''
Recibes un copete legal y un feedback del usuario.
Tu tarea es refinar el copete según la sugerencia, manteniendo el estilo legal, claridad y formato.
[Copete actual]
{input}
[Feedback del usuario]
{input_2}
Devuelve solo el copete refinado, en texto plano.
''',
        readonly_context,
    )

def create_user_feedback_agent():
    return Agent(
        name="UserFeedbackAgent",
        model=GEMINI_MODEL,
        instruction=build_user_feedback_instruction,
        output_key="input"
    )

async def build_finalizer_instruction(readonly_context):
    return await instructions_utils.inject_session_state(
        '''
Eres un abogado editor final especializado en copetes legales. Recibes un copete legal ya revisado y el texto original del documento.
Tu tarea es:
- Buscar en el texto original si hay un número de ley específico (ej: "Ley 26.522", "Decreto 1234/2020", etc.)
- Si no hay número específico, usar "Ley" seguido de un número apropiado basado en el contexto (ej: "Ley 27.078" para telecomunicaciones)
- Asegurarte de que el copete comience con el formato correcto "Ley XXXXX"
- Corregir cualquier detalle de formato, puntuación u ortografía
- Mantener la claridad y precisión legal
- Devolver solo el copete final, en texto plano, sin explicaciones ni markup

[Copete recibido]
{input}

[Texto original del documento]
{texto_original}

Recuerda: Si el copete trata sobre telecomunicaciones, usar "Ley 27.078". Si es sobre medios audiovisuales, usar "Ley 26.522". Si no hay contexto específico, usar "Ley 27.000".
''',
        readonly_context,
    )

def create_finalizer_agent():
    return Agent(
        name="FinalizerAgent",
        model=GEMINI_MODEL,
        instruction=build_finalizer_instruction,
        output_key="input"
    )

@app.post("/copete-feedback")
async def refinar_copete_feedback(req: FeedbackRequest):
    
    runner = InMemoryRunner(app_name="copete-feedback", agent=SequentialAgent(
        name="FeedbackPipeline",
        sub_agents=[create_user_feedback_agent(), create_finalizer_agent()],
        description="Refina el copete según feedback del usuario y finaliza el formato."
    ))
    
    initial_state = {
        "input": req.copete,
        "input_2": req.feedback_usuario,
        "texto_original": req.texto_original
    }
    
    session = await runner.session_service.create_session(
        app_name=runner.app_name,
        user_id="api-user",
        state=initial_state
    )

    # Ejecutar el pipeline con un mensaje simple para activarlo
    final_response = ""
    async for event in runner.run_async(
        user_id=session.user_id, 
        session_id=session.id,
        new_message=UserContent(parts=[Part(text="Procesar feedback")])
    ):
        if hasattr(event, 'content') and event.content:
            final_response = event.content
            logging.info(f"[RESPONSE] {final_response}")
    
    # Extraer el texto plano si la respuesta es un objeto con 'parts'
    copete_text = final_response
    if isinstance(final_response, dict) and 'parts' in final_response and final_response['parts']:
        copete_text = final_response['parts'][0].get('text', '')
    
    # Devolver respuesta JSON válida
    return {"copete": copete_text} 