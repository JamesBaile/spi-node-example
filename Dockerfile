#FROM hypriot/rpi-node:onbuild
#MAINTAINER James Baile <jamesbaile@emsolv.co.uk>

FROM node

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install
run npm install request

# Bundle app source
COPY . /usr/src/app

CMD [ "npm", "start" ]
