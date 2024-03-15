# Base image
FROM node:20-bookworm-slim

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Copy the .env and .env.development files
COPY .env ./

# Creates a "dist" folder with the production build
RUN apt-get update && apt-get upgrade && apt-get install -y vim
RUN apt install openssl -y
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3002

# Start the server using the production build
CMD ["npm", "run", "start:prod"]
