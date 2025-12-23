FROM node:24-alpine

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY server.ts ./
COPY tsconfig.json ./
COPY lib/ ./lib/
COPY controllers/ ./controllers/
COPY middleware/ ./middleware/
COPY repositories/ ./repositories/
COPY services/ ./services/

# Copy public assets and data
COPY public/ ./public/
COPY data/ ./data/

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the server
CMD ["npm", "start"]
