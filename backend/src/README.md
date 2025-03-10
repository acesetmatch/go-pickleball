<!-- @format -->

# Backend README

## Overview

This backend application is designed to manage paddle data for a pickleball application. It provides APIs for creating, retrieving, updating, and deleting paddle information.

## Prerequisites

- Docker
- Go (for running the application)

## Getting Started

### Running the Application

1. **Build and run the Docker container** for PostgreSQL:

   ```bash
   docker run --name pickleball-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pickleball_db -p 5432:5432 -d postgres
   ```

2. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

3. **Install dependencies** (if any):

   ```bash
   go mod tidy
   ```

4. **Run the application**:
   ```bash
   go run .
   ```

### Accessing the PostgreSQL Database

To access the PostgreSQL database running in the Docker container, use the following command:

```bash
docker exec -it pickleball-postgres psql -U postgres -d pickleball_db
```

This command will open a PostgreSQL interactive terminal where you can run SQL queries against the `pickleball_db` database.

### Database Commands

Once inside the PostgreSQL terminal, you can use the following commands:

- **List all tables**:

  ```sql
  \dt
  ```

- **Describe a specific table** (e.g., paddles):

  ```sql
  \d paddles
  ```

- **Query data from a table**:
  ```sql
  SELECT * FROM paddles;
  ```

### API Endpoints

- **Create Paddle**: `POST /api/paddle`
- **Get Paddle by ID**: `GET /api/paddle/{paddle_id}`
- **Update Paddle**: `PUT /api/paddle/{paddle_id}`
- **Delete Paddle**: `DELETE /api/paddle/{paddle_id}`

### Example Curl Commands

#### Upload a Paddle

To upload a paddle, use the following curl command:

```bash
curl -X POST \
  http://localhost:8080/api/paddle \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ENGAGE-PURSUIT-MX-6.0-2023-42069",
    "metadata": {
      "brand": "Engage",
      "model": "Pursuit MX 6.0",
      "serial_code": "2023-42069"
    },
    "specs": {
      "shape": "Hybrid",
      "surface": "Composite",
      "average_weight": 220.0,
      "core": 15.0,
      "paddle_length": 16.5,
      "paddle_width": 7.5,
      "grip_length": 4.5,
      "grip_type": "Comfort",
      "grip_circumference": 4.0
    },
    "performance": {
      "power": 75.0,
      "pop": 70.0,
      "spin": 3000.0,
      "twist_weight": 200.0,
      "swing_weight": 220.0,
      "balance_point": 30.0
    }
  }'
```

#### Get a Paddle by ID

To retrieve a paddle by its ID, use the following curl command:

```bash
curl -X GET \
  http://localhost:8080/api/paddle/ENGAGE-PURSUIT-MX-6.0-2023-42069 \
  -H "Content-Type: application/json"
```

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
