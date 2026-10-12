# Default recipe: list all recipes with comments
default:
	@just --list

# dev: Run dev server
dev:
	bun i && bun run dev

# build: Build for production
build:
	bun run build

# preview: Build and run the production server (adapter-node)
preview: build
	node build/index.js

# reload: Clean and run dev server
reload: clean dev

# clean: Remove all build artifacts and dependencies
clean:
	rm -rf node_modules .svelte-kit build .svelte-kit

# fmt: Format project with oxfmt
fmt:
	bunx oxfmt .

# check: Run type checking
check:
	bun run check

# platforms: Fill [template].platforms from the registries (all templates, or the given ids)
platforms *ids:
	bun scripts/platforms.ts {{ids}}

# platforms-check: Fail if any template's platforms are stale
platforms-check *ids:
	bun scripts/platforms.ts --check {{ids}}
