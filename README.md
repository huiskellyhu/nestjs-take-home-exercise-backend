## NestJS Feature Enhancement Assignment

A take-home exercise to add a feature to the NestJS starter repository.

Closed PR to merge in this branch, but please view the PR!

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

## Video Demo
https://github.com/user-attachments/assets/6d39d1a2-883b-4afe-9538-06d2b61a915f

Order of Operations:
1. Start server
2. Create 3 events (overlap between Hangout 1 and Hangout 2)
3. Get Breaktime event by id
4. View user Kelly to display all 3 events (Users were created beforehand)
5. MergeAll on user Kelly
6. Delete Breaktime event (verified by viewing user Kelly)
7. Run tests

## Project Takeaways
- Opened eyes to consider DB quirks when working with new technology stack (query results differ when filtering)
- Vulnerabilities for tradeoff of simple-enum vs enum in Postgres
- Nice practice for psql and accessing DB through terminal
- Insightful to NestJS and best practices (as someone new to NestJS)
