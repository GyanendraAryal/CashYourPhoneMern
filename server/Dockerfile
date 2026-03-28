# Use Node 18-alpine for a small footprint
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Environment variables (fallbacks)
ENV NODE_ENV=production
ENV PORT=4000

# Expose backend port
EXPOSE 4000

# Command to run the application
CMD ["npm", "start"]
