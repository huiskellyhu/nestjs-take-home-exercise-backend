## NestJS Feature Enhancement Assignment

A take-home exercise to add a feature to the NestJS starter repository.

## Project setup

### 1. Install dependencies
 
```bash
npm install
```
 
### 2. Set up PostgreSQL
 
Install PostgreSQL locally (or run it in Docker) and create a database:
 
```sql
CREATE DATABASE events_db;
```

### 3. Configure environment variables
 
The app reads DB connection info from environment variables, falling back to sensible local defaults if unset:
 
| Variable | Default |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `DB_NAME` | `events_db` |

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
