FROM node:18-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install production dependencies
RUN npm ci

# Copy database schemas and generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Execute server
CMD ["npm", "start"]
