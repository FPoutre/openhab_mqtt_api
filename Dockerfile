FROM node:latest

WORKDIR /opt/openhab-mqtt-api
COPY bin/main.js /opt/openhab-mqtt-api/main.js
COPY package.json /opt/openhab-mqtt-api/package.json
COPY package-lock.json /opt/openhab-mqtt-api/package-lock.json

RUN npm install
CMD node main.js