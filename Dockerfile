# Use a lightweight Node.js base
FROM node:14-alpine

# Set working directory
WORKDIR /app

# Copy only root package files and install server deps
COPY package*.json ./
RUN npm install

# Copy everything else (including certs, client app, etc.)
COPY . .

# Build the frontend app inside the container
RUN cd public/demos/collaborator/client && \
    npm install && \
    npm run build:prod

# Expose HTTPS port
EXPOSE 443

# Start the app
CMD ["npm", "start"]
