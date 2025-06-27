FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build
RUN ls -l /app/build

FROM nginx:alpine

# Copiar el build de React
COPY --from=build /app/build /usr/share/nginx/html

# Copiar la configuración de nginx directamente
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
