FROM node:16.12.0-alpine3.11

WORKDIR /opt/openhab-mqtt-api

COPY bin/main.js package.json package-lock.json ./

RUN npm install

ENTRYPOINT ["node"]
CMD ["main.js"]
