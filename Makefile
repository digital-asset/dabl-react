
build:
	yarn install && yarn build
	mkdir -p lib
	sed  's|"lib/index.js"|"index.js":|g' package.json > lib/package.json
	rm -rf node_modules/
