#!/bin/bash

set -e

CREDENTIALS_FILE="./backend/credenciales/clave-gcp.json"

PROJECT_ID="impo-equipo1"
REGION="us-central1"
REPOSITORY="demo-app"
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/frontend"
BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/backend"
FRONTEND_SERVICE="frontend"
BACKEND_SERVICE="backend"
BUCKET_NAME="impo-equipo1.firebasestorage.app"
CLOUD_FUNCTION_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/cloud_function"
CLOUD_FUNCTION_DIR="RAG/cloud-function"
CLOUD_FUNCTION_NAME="process-pdf-agent-v4"

echo "autenticando con la cuenta de servicio"
gcloud auth activate-service-account --key-file="$CREDENTIALS_FILE"
gcloud config set project "$PROJECT_ID"

echo "configurando Docker para Artifact Registry"
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

echo "construyendo docker con arquitectura compatible :p"
docker build --platform linux/amd64 -t "$FRONTEND_IMAGE" ./frontend
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" ./backend
# docker build --platform linux/amd64 -t "$CLOUD_FUNCTION_IMAGE" ./cloud-function

echo "pusheando imágenes a Artifact Registry"
docker push "$FRONTEND_IMAGE"
docker push "$BACKEND_IMAGE"
# docker push "$CLOUD_FUNCTION_IMAGE"

echo "dsplegando frontend"
gcloud run deploy "$FRONTEND_SERVICE" \
  --image "$FRONTEND_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory=1G

echo "desplegando backend"
gcloud run deploy "$BACKEND_SERVICE" \
  --image "$BACKEND_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --service-account "firebase-adminsdk-fbsvc@impo-equipo1.iam.gserviceaccount.com" \
  --memory=1G

gcloud builds submit RAG/cloud-run --tag gcr.io/$PROJECT_ID/rag-cloudrun

gcloud run deploy rag-cloudrun \
  --image gcr.io/$PROJECT_ID/rag-cloudrun \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,AGENT_ENGINE_ID=$AGENT_ENGINE_ID

echo "Desplegando Cloud Function ADK local..."
gcloud functions deploy $CLOUD_FUNCTION_NAME \
  --gen2 \
  --runtime=python311 \
  --region=$REGION \
  --source=$CLOUD_FUNCTION_DIR \
  --entry-point=process_pdf_agent \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=$BUCKET_NAME" \
  --memory=4GB \
  --timeout=540s \
  --set-env-vars="PROJECT_ID=$PROJECT_ID" \
  --quiet

echo "✅ ¡Deploy de Cloud Function ADK local completo!"

echo "✅ ¡Deploy completo!"