FROM python:3.9-slim-buster

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# para Cloud Functions, no necesitamos un CMD explícito aca,
# ya que gcloud functions deploy se encarga de eso con --entry-point. esto es solo para claridad de lo que la imagen contendría.

#CMD ["python", "-m", "functions_framework", "--target", "process_document", "--signature-type", "event"] 