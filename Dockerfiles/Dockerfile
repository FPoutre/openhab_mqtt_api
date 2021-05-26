FROM node:16.2.0

WORKDIR /opt/openhab-mqtt-api

COPY bin/main.js package.json package-lock.json ./

RUN npm install

ENTRYPOINT ["node"]
CMD ["main.js"]
