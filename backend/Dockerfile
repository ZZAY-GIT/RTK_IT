FROM python:3.12-slim


WORKDIR /app


RUN pip install poetry

ENV POETRY_VIRTUALENVS_CREATE=false
ENV POETRY_NO_INTERACTION=1

COPY pyproject.toml poetry.lock* ./

RUN poetry install --no-root


COPY backend/ ./backend/
COPY README.md ./


ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["python", "backend/run.py"]
