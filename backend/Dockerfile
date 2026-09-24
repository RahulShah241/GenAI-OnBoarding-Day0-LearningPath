FROM python:3.11-slim

WORKDIR /app

# Environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Initialize SQLite database & start Uvicorn server
CMD ["sh", "-c", "python migrate_to_sqlite.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
