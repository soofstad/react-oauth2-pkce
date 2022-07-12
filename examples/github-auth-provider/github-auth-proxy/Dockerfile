FROM python:3.10-slim
WORKDIR /code
EXPOSE 5000

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/code

RUN pip install --upgrade pip && \
    pip install poetry && \
    poetry config virtualenvs.create false

COPY pyproject.toml pyproject.toml
COPY poetry.lock poetry.lock

RUN poetry install
COPY . .
USER 1000
CMD ["python", "api.py"]

