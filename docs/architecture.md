# Architecture

- Each service is independently deployable and owns its own database.
- Clients talk to services over REST (optionally through an API gateway) and open a WebSocket connection to `realtime-service`.
- Services communicate asynchronously through events (implemented as direct HTTP calls to internal endpoints) and synchronously over REST where a direct answer is needed (e.g. bid-service checks item-service that the auction is open).
- Authentication: user-service issues a token that other services validate.
- Each service has its own folder in the repository root and its own Dockerfile; `npm start` runs all services, and a root `docker-compose.yml` is also provided.

## Repository layout (planned)
```
docs/
user-service/
item-service/
bid-service/
payment-service/
realtime-service/
docker-compose.yml
README.md
```
