# --- Stage 1: Build ---
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency listings
COPY package*.json ./

# Install packages
RUN npm ci

# Copy code assets
COPY . .

# Set default production api endpoint variable (points to our backend within network)
ARG VITE_API_URL=http://localhost:5000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Compile production package
RUN npm run build

# --- Stage 2: Production Server ---
FROM nginx:1.25-alpine

# Copy built files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support React Router SPA fallbacks
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
