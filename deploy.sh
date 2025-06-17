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

echo "autenticando con la cuenta de servicio"
gcloud auth activate-service-account --key-file="$CREDENTIALS_FILE"
gcloud config set project "$PROJECT_ID"

echo "configurando Docker para Artifact Registry"
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

echo "construyendo docker con arquitectura compatible :p"
docker build --platform linux/amd64 -t "$FRONTEND_IMAGE" ./frontend
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" ./backend

echo "pusheando imágenes a Artifact Registry"
docker push "$FRONTEND_IMAGE"
docker push "$BACKEND_IMAGE"

echo "construyendo docker de cloud function"
gcloud builds submit --tag "$CLOUD_FUNCTION_IMAGE" ./cloud-function

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

echo "desplegando cloud function (desde Dockerfile)"
gcloud functions deploy process_document \
  --trigger-event google.storage.object.finalize \
  --trigger-resource "gs://$BUCKET_NAME" \
  --region "$REGION" \
  --service-account "firebase-adminsdk-fbsvc@impo-equipo1.iam.gserviceaccount.com" \
  --image "$CLOUD_FUNCTION_IMAGE" \
  --entry-point process_document \
  --memory=512MB

echo "✅ ¡Deploy completo!"