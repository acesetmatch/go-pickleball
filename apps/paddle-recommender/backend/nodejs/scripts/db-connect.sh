#!/bin/bash

# Load DATABASE_URL from .env file (safer approach)
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not found. Make sure .env file exists with DATABASE_URL set."
    exit 1
fi

# Connect using the DATABASE_URL from .env
psql "$DATABASE_URL" "$@"
