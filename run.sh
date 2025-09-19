#!/bin/bash

export PYTHONPATH=$(pwd)

if [ "$1" == "test" ]; then
    source .venv/bin/activate
    pytest tests/
else
    # Install backend dependencies
    pip install -r backend/requirements.txt

    # Start the FastAPI application
    uvicorn backend.main:app --reload
fi
