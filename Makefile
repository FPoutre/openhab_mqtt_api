all: bin/main.js build

bin/main.js: src/main.ts
	npm install
	tsc --outDir bin $^
	#mv src/main.js bin/main.js

build:
	docker build -f Dockerfiles/Dockerfile -t openhab-mqtt:latest .

run:
	cd Dockerfiles && docker-compose up -d openhab-mqtt
	#docker run --name openhab-mqtt --hostname openhab-mqtt --network host openhab-mqtt:latest
