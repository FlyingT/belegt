FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure instance directory exists for SQLite
RUN mkdir -p instance

# M3: Run as non-root user
RUN adduser --disabled-password --no-create-home --gecos '' appuser \
    && chown -R appuser:appuser /app/instance
USER appuser

EXPOSE 5000

# H3: Use gunicorn production WSGI server instead of Flask dev server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "4", "app:app"]
