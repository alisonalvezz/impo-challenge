# adk-microservice

## Introducción
Este microservicio es el "cerebro legal" del sistema: se encarga de generar, refinar y validar copetes legales a partir de texto extraído de documentos. Utiliza agentes ADK y modelos de IA de Vertex AI para asegurar que los copetes sean precisos, claros y adaptados a la normativa uruguaya. Además, procesa el feedback de los usuarios para mejorar y ajustar los resultados.

## Arquitectura y decisiones técnicas
- **FastAPI:** Framework elegido por su velocidad, facilidad de documentación automática y compatibilidad con despliegues modernos (Docker, Cloud Run).
- **ADK (Agent Development Kit):** Permite definir agentes conversacionales y pipelines de procesamiento/refinamiento, asegurando modularidad y trazabilidad en la generación de copetes.
- **Vertex AI:** Motor de IA de Google Cloud, utilizado para la generación y validación de texto legal.
- **Docker:** El microservicio está containerizado para facilitar el despliegue, la escalabilidad y la portabilidad entre entornos.

## Organización interna
- `rag/`: Lógica de agentes, prompts, scripts de refinamiento y utilidades para el pipeline de copetes.
- `main.py`: Entrypoint del microservicio, define los endpoints HTTP para generación y feedback de copetes.
- `requirements.txt`: Dependencias necesarias para el entorno de ejecución.
- `Dockerfile`: Define la imagen para despliegue en Cloud Run u otros entornos compatibles.

## Relación con el sistema
- El adk-microservice es invocado exclusivamente por las Cloud Functions, nunca directamente por el frontend, asegurando así la seguridad y el control de acceso.
- Recibe texto extraído de PDFs y feedback de usuario, y devuelve copetes listos para ser mostrados o almacenados.
- Es el responsable de aplicar lógica legal avanzada, validaciones y ajustes según el feedback recibido.

## Cultura de desarrollo
- El código está pensado para ser modular, auditable y fácil de extender con nuevos agentes o reglas legales.
- Se prioriza la calidad del texto generado, la trazabilidad de los cambios y la facilidad para incorporar feedback humano.
- El despliegue y actualización se realiza automáticamente con el script `../deploy.sh` desde la raíz del proyecto. 