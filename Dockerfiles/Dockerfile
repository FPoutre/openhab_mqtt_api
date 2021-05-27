FROM node:12.22.1-alpine3.10

WORKDIR /opt/openhab-mqtt-api

COPY bin/main.js package.json package-lock.json ./

RUN npm install

ENTRYPOINT ["node"]
CMD ["main.js"]
