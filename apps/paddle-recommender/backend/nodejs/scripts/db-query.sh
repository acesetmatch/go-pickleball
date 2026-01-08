#!/bin/bash

# Use environment variable for password (set PGPASSWORD=postgres before running)
# Or use connection string from .env file

if [ -z "$PGPASSWORD" ]; then
    echo "Please set PGPASSWORD environment variable:"
    echo "export PGPASSWORD=postgres"
    exit 1
fi

# Execute the query passed as argument
psql -h localhost -p 5433 -U postgres -d paddle_recommender_db "$@"
