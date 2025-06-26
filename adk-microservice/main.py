from fastapi import FastAPI
from pydantic import BaseModel
from rag.agent import root_agent, Agent, GEMINI_MODEL
from google.adk.runners import InMemoryRunner
from google.genai.types import Part, UserContent
import asyncio
from google.adk.agents import SequentialAgent

app = FastAPI()

class CopeteRequest(BaseModel):
    texto: str

class FeedbackRequest(BaseModel):
    copete: str
    feedback_usuario: str

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
