FROM node:14.17-alpine3.13

WORKDIR /opt/openhab-mqtt-api

COPY ../bin/main.js ../package.json ../package-lock.json ./

RUN npm install

ENTRYPOINT ["node"]
CMD ["main.js"]
