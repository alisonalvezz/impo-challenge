# Backend

## Introducción
El backend cumple el rol de soporte y extensión para la plataforma, brindando servicios auxiliares, autenticación y utilidades que permiten conectar el sistema principal con otros servicios internos o externos. Es el "taller" donde se preparan y validan datos, tokens y lógicas que no dependen directamente del flujo de copetes, pero son esenciales para la operación segura y escalable.

## Arquitectura y decisiones técnicas
- **Python** como lenguaje principal, por su versatilidad y compatibilidad con el ecosistema de Google Cloud y FastAPI.
- **Estructura modular**: cada subcarpeta tiene una responsabilidad clara (credenciales, lógica de negocio, utilidades, tests).
- **Pensado para crecer**: el backend puede incorporar nuevos microservicios, endpoints o integraciones según las necesidades de IMPO o de otras instituciones.

## Organización interna
- `credenciales/`: Almacena llaves, tokens y archivos sensibles necesarios para la autenticación con servicios de Google Cloud y otros sistemas.
- `app/`: Lógica principal del backend, donde se pueden agregar endpoints, utilidades o integraciones específicas.
- `tests/`: Pruebas unitarias y de integración para asegurar la calidad y robustez del backend.
- `get_token.py`: Script para obtener y gestionar access tokens, fundamental para la autenticación segura en el ecosistema cloud.
- `login.py`: Lógica de autenticación y generación de sesiones.

## Relación con el sistema
- El backend es el encargado de preparar y validar todo lo necesario para que el resto de los módulos funcionen de forma segura y eficiente.
- Si bien no es el "core" del pipeline de copetes, es fundamental para la integración con sistemas internos, la autenticación y la extensión futura del sistema.
- Permite a IMPO agregar lógica propia sin tocar el flujo principal de documentos y copetes.

## Cultura de desarrollo
- El código está pensado para ser seguro, mantenible y fácilmente auditable.
- Se prioriza la claridad, la separación de responsabilidades y la facilidad para agregar nuevas utilidades o integraciones.
- El despliegue y actualización se realiza automáticamente con el script `../deploy.sh` desde la raíz del proyecto.

## Deploy
El despliegue se realiza automáticamente con el script `../deploy.sh` desde la raíz del proyecto.



