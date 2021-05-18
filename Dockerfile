FROM node:latest

WORKDIR /root
COPY bin/main.js /root/main.js
COPY package.json /root/package.json
COPY package-lock.json /root/package-lock.json
RUN npm install

CMD node main.js