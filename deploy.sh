#!/bin/bash

set -e

CREDENTIALS_FILE="./backend/credenciales/clave-gcp.json"

PROJECT_ID="impo-equipo1"
REGION="us-central1"
REPOSITORY="demo-app"
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/frontend"
BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/backend"
ADK_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/adk-microservice"
FRONTEND_SERVICE="frontend"
BACKEND_SERVICE="backend"
ADK_SERVICE="adk-microservice"
BUCKET_NAME="impo-equipo1.firebasestorage.app"
CLOUD_FUNCTION_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/cloud_function"
CLOUD_FUNCTION_DIR="cloud-function"
CLOUD_FUNCTION_NAME="process-pdf-agent"
CLOUD_FUNCTION_FEEDBACK_NAME="feedback-copete"

echo "Autenticando con la cuenta de servicio"
gcloud auth activate-service-account --key-file="$CREDENTIALS_FILE"
gcloud config set project "$PROJECT_ID"

echo "Configurando Docker para Artifact Registry"
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

echo "Construyendo imágenes Docker (linux/amd64)"
docker build --platform linux/amd64 -t "$FRONTEND_IMAGE" ./frontend
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" ./backend
docker build --platform linux/amd64 -t "$ADK_IMAGE" ./adk-microservice
docker build --platform linux/amd64 -t "$CLOUD_FUNCTION_IMAGE" ./cloud-function

echo "Pusheando imágenes a Artifact Registry"
docker push "$FRONTEND_IMAGE"
docker push "$BACKEND_IMAGE"
docker push "$ADK_IMAGE"
docker push "$CLOUD_FUNCTION_IMAGE"

echo "Desplegando frontend en Cloud Run"
gcloud run deploy "$FRONTEND_SERVICE" \
  --image "$FRONTEND_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory=1G

echo "Desplegando backend en Cloud Run"
gcloud run deploy "$BACKEND_SERVICE" \
  --image "$BACKEND_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --service-account "firebase-adminsdk-fbsvc@impo-equipo1.iam.gserviceaccount.com" \
  --memory=1G

echo "Desplegando adk-microservice en Cloud Run"
gcloud run deploy "$ADK_SERVICE" \
  --image "$ADK_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory=2G

echo "Desplegando Cloud Function de procesamiento (por evento de bucket)"
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

echo "Desplegando Cloud Function feedback_copete (HTTP)"
gcloud functions deploy $CLOUD_FUNCTION_FEEDBACK_NAME \
  --gen2 \
  --runtime=python311 \
  --region=$REGION \
  --source=$CLOUD_FUNCTION_DIR \
  --entry-point=feedback_copete \
  --trigger-http \
  --memory=1GB \
  --timeout=540s \
  --set-env-vars="PROJECT_ID=$PROJECT_ID" \
  --allow-unauthenticated \
  --quiet

echo "✅ ¡Deploy completo de frontend, backend, adk-microservice y Cloud Functions!"