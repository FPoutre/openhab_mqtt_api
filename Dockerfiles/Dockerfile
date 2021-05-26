FROM node:latest

WORKDIR /opt/openhab-mqtt-api

COPY bin/main.js package.json package-lock.json ./

RUN npm install

ENTRYPOINT ["node"]
CMD ["main.js"]
