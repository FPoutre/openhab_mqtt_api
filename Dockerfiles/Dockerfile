FROM node:16.2.0-alpine3.11

WORKDIR /opt/openhab-mqtt-api

COPY bin/main.js package.json package-lock.json ./

RUN npm install

ENTRYPOINT ["node"]
CMD ["main.js", "$OPENHAB_HOST_IP", "$MQTT_HOST_IP"]
