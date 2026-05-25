init:
	node scripts/init-database.mjs --env app/.env.local 
	node scripts/scrape-wikipedia.mjs --write --env app/.env.local
	node scripts/scrape-fifa-rankings.mjs --write --env app/.env.local

update-results:
	node scripts/update-match-results.mjs --write --env app/.env.local

dev:
	cd app && npm install && npm run dev

build:
	cd app && npm install && npm run build

clean:
	cd app && rm -rf node_modules dist

.PHONY: all build clean init dev update-results