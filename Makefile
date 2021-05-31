all: bin/main.js build

bin/main.js: src/main.ts
	npm install
	tsc --outDir bin $^

build:
	docker build -f Dockerfiles/Dockerfile -t openhab-mqtt:latest .

run:
	cd Dockerfiles && docker-compose up -d openhab-mqtt
