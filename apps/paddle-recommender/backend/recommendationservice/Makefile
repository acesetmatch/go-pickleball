.PHONY: help install dev test clean docker-up docker-down migrate

help:
	@echo "Available commands:"
	@echo "  install       Install dependencies"
	@echo "  dev           Run development server"
	@echo "  test          Run tests"
	@echo "  test-unit     Run unit tests"
	@echo "  test-integration Run integration tests"
	@echo "  clean         Clean up temporary files"
	@echo "  docker-up     Start Docker containers"
	@echo "  docker-down   Stop Docker containers"
	@echo "  docker-logs   View Docker logs"
	@echo "  migrate       Run database migrations"
	@echo "  format        Format code with black and isort"
	@echo "  lint          Run linters"
	@echo "  sync-data     Sync paddle data"
	@echo "  init-vectors  Initialize vector store"
	@echo "  benchmark     Run performance benchmarks"

install:
	pip install -r requirements/dev.txt
	pre-commit install

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v --cov=app --cov-report=html

test-unit:
	pytest tests/unit/ -v

test-integration:
	pytest tests/integration/ -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage

docker-up:
	docker-compose -f docker/docker-compose.yml up -d

docker-down:
	docker-compose -f docker/docker-compose.yml down

docker-logs:
	docker-compose -f docker/docker-compose.yml logs -f

migrate:
	alembic upgrade head

format:
	black app/ tests/
	isort app/ tests/

lint:
	flake8 app/ tests/
	mypy app/

sync-data:
	python scripts/sync_paddle_data.py

init-vectors:
	python scripts/init_vector_store.py

benchmark:
	python scripts/benchmark.py
