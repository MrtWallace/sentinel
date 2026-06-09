.PHONY: dev test eval lint build clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

dev: ## Start backend + frontend (scripts/dev.sh)
	bash scripts/dev.sh

test: ## Run all backend unit tests
	cd agent && python3 -m unittest discover -s . -p "test_*.py" -v

eval: ## Run eval pipeline with a temporary mock backend
	cd agent && python3 eval_pipeline.py --auto-start --base-url http://127.0.0.1:18080

lint: ## Run frontend lint
	cd frontend && yarn lint

build: ## Build frontend
	cd frontend && yarn next:build

clean: ## Clean caches and temp files
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	rm -rf .pids .logs 2>/dev/null || true
