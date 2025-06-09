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

echo "🔐 Autenticando con la cuenta de servicio..."
gcloud auth activate-service-account --key-file="$CREDENTIALS_FILE"
gcloud config set project "$PROJECT_ID"

echo "🔧 Configurando Docker para Artifact Registry..."
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

echo "🚀 Desplegando frontend..."
gcloud run deploy "$FRONTEND_SERVICE" \
  --image "$FRONTEND_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated

echo "🚀 Desplegando backend..."
gcloud run deploy "$BACKEND_SERVICE" \
  --image "$BACKEND_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-secrets FIREBASE_CREDENTIALS_JSON_=FIREBASE_CREDENTIALS_JSON_:latest




echo "✅ ¡Deploy completo!"
