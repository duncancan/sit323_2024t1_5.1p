# Use pre-built node image 
FROM node:16

# Create the working directory inside the container
WORKDIR /usr/src/app

# Install dependencies.
# A wildcard is used to ensure both package.json AND package-lock.json are copied, where applicable
# Dot (`.`) is the work directory specified above.
COPY package*.json ./
RUN npm install

# Bundle app source
COPY server.js .
# Could also run `COPY . .` before `RUN npm install` and that would copy everything across to workdir.

# Expose the port the app runs on
EXPOSE 3000
CMD ["node", "server.js"]