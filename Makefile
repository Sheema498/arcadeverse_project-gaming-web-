# ArcadeVerse Make Helper Commands

.PHONY: install run test coverage docker-build docker-run clean

install:
	npm install

run:
	npm run start

test:
	npm run test

coverage:
	npm run coverage

docker-build:
	docker build -t arcadeverse .

docker-run:
	docker run -p 5173:5173 -v $(shell pwd):/app -v /app/node_modules arcadeverse

clean:
	rm -rf node_modules coverage dist
