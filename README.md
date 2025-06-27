# impo-challenge

## Introducción
Este proyecto es una solución integral para la gestión, procesamiento y enriquecimiento de documentos legales en IMPO, orientado a la automatización de copetes y resúmenes normativos. El sistema está pensado para instituciones, equipos jurídicos y usuarios que necesitan transformar grandes volúmenes de PDFs legales en información estructurada, validada y fácil de consumir.

## ¿Qué resuelve este sistema?
Permite cargar documentos legales (PDFs), extraer su texto, generar automáticamente un copete legal (resumen normativo) usando IA, refinarlo con feedback humano y almacenar todo el flujo en la nube. El usuario puede visualizar, copiar, descargar y dar feedback sobre los copetes, cerrando el ciclo de mejora continua.

## Arquitectura general
El sistema está compuesto por varios módulos desacoplados, cada uno con una responsabilidad clara:

- **Frontend (React):** Interfaz web moderna, responsiva y amigable, pensada para usuarios jurídicos y administrativos. Permite cargar documentos, visualizar copetes, dar feedback y navegar el historial.
- **adk-microservice (FastAPI):** Microservicio especializado en la generación y refinamiento de copetes legales. Utiliza agentes ADK y Vertex AI para asegurar calidad y contexto legal uruguayo.
- **Cloud Functions:** Orquestadores serverless que centralizan la lógica de integración, manejo de feedback, triggers y comunicación entre servicios. Son el nexo entre frontend, microservicios y Firestore.
- **backend:** Servicios auxiliares, autenticación, utilidades y lógica de soporte. Permite extender el sistema y conectar con otros servicios internos.
- **RAG:** Lógica avanzada de recuperación y generación de información legal, scripts de preparación de corpus y agentes de consulta. Es el "cerebro" documental del sistema.
- **Firestore:** Base de datos NoSQL en la nube, almacena documentos, copetes, feedback y el historial de procesamiento.

## Organización de carpetas
- `frontend/`: Todo el código de la interfaz web. Estructura modular por componentes, integración directa con Cloud Functions y manejo de estado local.
- `adk-microservice/`: Microservicio FastAPI. Contiene la lógica de agentes, prompts, pipeline de refinamiento y endpoints para generación y feedback de copetes.
- `cloud-function/`: Funciones serverless en Python. Aquí está la lógica de integración, endpoints HTTP para feedback, triggers automáticos y manejo de CORS.
- `backend/`: Servicios de apoyo, autenticación, utilidades y pruebas. Pensado para crecer y conectar con otros sistemas internos.
- `RAG/`: Scripts, agentes y lógica de recuperación/generación avanzada. Aquí se preparan los corpus, se configuran los agentes y se orquesta la interacción con Vertex AI.

## Relación entre módulos
- El **frontend** nunca habla directo con los microservicios: siempre pasa por una Cloud Function, que centraliza la lógica y asegura seguridad y compatibilidad.
- El **adk-microservice** es el encargado de la inteligencia legal: recibe texto y feedback, y devuelve copetes listos para mostrar o guardar.
- Las **Cloud Functions** son el "pegamento" del sistema: reciben requests del frontend, llaman a los microservicios, actualizan Firestore y devuelven siempre un formato amigable.
- El **backend** y **RAG** son piezas de soporte y cerebro documental, respectivamente, permitiendo escalar, auditar y mejorar el sistema.

## Notas de estilo y cultura
- El código y la arquitectura están pensados para ser claros, mantenibles y adaptados a la realidad uruguaya.
- Se prioriza la robustez, la trazabilidad y la facilidad de integración con otros sistemas del Estado o privados.
- Todo el despliegue y la actualización del sistema se realiza con el script `./deploy.sh` desde la raíz, para que no tengas que andar corriendo comandos sueltos.

## Deploy
Para desplegar todo el sistema, ejecuta:

```sh
./deploy.sh
```

Esto construye y despliega todos los servicios y funciones en Google Cloud.
