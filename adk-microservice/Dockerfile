FROM python:3.10-slim
WORKDIR /app
# Instalar git para poder instalar desde GitHub
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"] 