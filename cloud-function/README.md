# Cloud Function

## Introducción
Este módulo contiene las funciones serverless que actúan como orquestadores y "puente" entre el frontend, los microservicios y la base de datos. Son responsables de recibir requests del usuario, validar datos, coordinar el flujo de feedback y asegurar que todo el procesamiento ocurra de forma segura, escalable y desacoplada.

## Arquitectura y decisiones técnicas
- **Google Cloud Functions (Python):** Permiten escalar automáticamente y responder a eventos HTTP o triggers de almacenamiento.
- **functions_framework:** Framework liviano para exponer endpoints HTTP y facilitar el testing local.
- **Firestore:** Utilizado para persistir el estado de los documentos, copetes y feedback de usuario.
- **requests:** Para integrar y comunicar con microservicios externos (por ejemplo, el adk-microservice).
- **CORS:** Implementado manualmente para asegurar que solo el frontend autorizado pueda interactuar con las funciones.

## Organización interna
- `main.py`: Archivo principal, contiene la lógica de las funciones (procesamiento de PDFs, feedback, manejo de CORS, integración con Firestore y microservicios).
- `requirements.txt`: Lista de dependencias necesarias para el entorno serverless.
- `run.py`: Script de utilidad para pruebas y debugging local.

## Relación con el sistema
- Las Cloud Functions son el "centro de control" del sistema: reciben todas las acciones del frontend y deciden cómo y cuándo llamar a los microservicios, actualizar Firestore o devolver respuestas al usuario.
- Permiten desacoplar el frontend del backend, facilitando la evolución y el mantenimiento del sistema sin afectar la experiencia del usuario.
- Son responsables de la seguridad, validación y trazabilidad de cada acción del usuario.

## Cultura de desarrollo
- El código está pensado para ser robusto, seguro y fácil de auditar.
- Se prioriza la claridad en los flujos de datos y la facilidad para agregar nuevas funciones o triggers.
- El despliegue y actualización se realiza automáticamente con el script `../deploy.sh` desde la raíz del proyecto. 