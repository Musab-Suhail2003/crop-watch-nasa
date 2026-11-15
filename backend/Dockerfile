FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.6.9 /uv /usr/local/bin/uv
WORKDIR /app

# Dependencies first for layer caching (no dev tools in the image).
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app
RUN useradd --create-home appuser && mkdir -p /app/var && chown appuser /app/var
USER appuser

ENV PATH="/app/.venv/bin:$PATH" DATABASE_PATH=/app/var/cropwatch.db
EXPOSE 8000
# Hosts such as Render pass the port in $PORT; docker compose and local runs fall back to 8000.
# --proxy-headers: behind the host's HTTPS proxy, keep the client's https scheme and address.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
