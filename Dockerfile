# Use lightweight alpine node image
FROM node:18-alpine

# Set target directory
WORKDIR /app

# Copy lock and package lists
COPY package*.json ./

# Install npm requirements
RUN npm install

# Copy application files
COPY . .

# Expose server port
EXPOSE 5173

# Execute dev container server
CMD ["npm", "run", "start"]
