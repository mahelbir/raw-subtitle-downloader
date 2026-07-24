BUMP := $(word 2,$(MAKECMDGOALS))

version:
	@case "$(BUMP)" in \
	  patch|minor|major) ;; \
	  *) echo "usage: make version <patch|minor|major>"; exit 1 ;; \
	esac; \
	if [ -n "$$(git status --porcelain)" ]; then \
	  echo "working tree not clean; commit or stash first"; exit 1; \
	fi; \
	cur=$$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json); \
	if [ -z "$$cur" ]; then echo "could not read version from manifest.json"; exit 1; fi; \
	major="$${cur%%.*}"; rest="$${cur#*.}"; minor="$${rest%%.*}"; patch="$${rest#*.}"; \
	case "$(BUMP)" in \
	  major) major=$$((major + 1)); minor=0; patch=0 ;; \
	  minor) minor=$$((minor + 1)); patch=0 ;; \
	  patch) patch=$$((patch + 1)) ;; \
	esac; \
	new="$$major.$$minor.$$patch"; \
	sed -i.bak "s/\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"version\": \"$$new\"/" manifest.json && rm -f manifest.json.bak; \
	git add manifest.json; \
	git commit -m "$$new"; \
	git tag "v$$new"; \
	echo "bumped $$cur -> $$new; tagged v$$new (next: git push --follow-tags)"

patch minor major:
	@:

.PHONY: version patch minor major
