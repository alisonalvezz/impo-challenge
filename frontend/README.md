# Frontend

## Introducción
Este módulo es la cara visible del sistema: una aplicación web pensada para usuarios jurídicos, administrativos y técnicos de IMPO. Permite cargar documentos legales, visualizar copetes generados por IA, dar feedback y navegar el historial de procesamiento de manera intuitiva y eficiente.

## Arquitectura y decisiones técnicas
- **React (Create React App):** Elegido por su robustez, comunidad y facilidad para construir interfaces reactivas y modulares.
- **TailwindCSS:** Permite un diseño moderno, responsivo y coherente con la identidad visual institucional.
- **Context API:** Para manejo global de notificaciones y estados transversales.
- **Integración directa con Cloud Functions:** El frontend nunca se comunica directo con microservicios, siempre pasa por una función serverless que centraliza la lógica y asegura compatibilidad y seguridad.
- **Despliegue en Cloud Run:** Permite escalar la interfaz según la demanda y mantener alta disponibilidad.

## Organización interna
- `src/components/`: Componentes reutilizables y especializados. Ejemplo: `CopeteGenerador` (gestión de copetes y feedback), `Snackbar` (notificaciones), etc.
- `src/config/`: Configuración de Firebase y otros servicios externos.
- `public/`: Archivos estáticos, íconos y manifest de la app.
- `build/`: Salida de la build de producción (no tocar manualmente).

## Relación con el sistema
- El frontend es el punto de entrada para los usuarios y el único módulo que interactúa con humanos.
- Todas las acciones del usuario (cargar PDF, dar feedback, ver historial) disparan requests a Cloud Functions, que se encargan de la lógica y la integración con el backend y los microservicios.
- El diseño prioriza la experiencia de usuario, la accesibilidad y la robustez ante errores de red o backend.

## Cultura de desarrollo
- El código está pensado para ser claro, fácil de mantener y adaptable a nuevas necesidades institucionales.
- Se prioriza la experiencia del usuario uruguayo, con mensajes claros y flujos pensados para el trabajo jurídico real.
- El despliegue y actualización se realiza automáticamente con el script `../deploy.sh` desde la raíz del proyecto.
