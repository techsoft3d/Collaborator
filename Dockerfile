# Use lightweight Node.js image
FROM node:14-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files, including SSL certs
COPY . .

# Expose HTTPS port
EXPOSE 443

CMD ["npm", "start"]