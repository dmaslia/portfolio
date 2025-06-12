#!/bin/bash

# Start the FastAPI server using uvicorn
cd /home/daniel/portfolio/backend
source /home/daniel/portfolio/backend/venv/bin/activate
exec uvicorn rag_server:app --host 0.0.0.0 --port 8000

