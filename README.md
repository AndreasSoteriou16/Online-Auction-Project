# Online Auction Platform

A microservices-based online auction system. Users list items, place bids, and see bids update in real time over WebSockets.

Full project description: see the [`docs`](docs/) folder.

- [Project overview](docs/overview.md)
- [Services](docs/services.md)
- [Architecture](docs/architecture.md)
- [API summary](docs/api.md)

## Services

| Service | Responsibility | Communication |
|---|---|---|
| user-service | Registration, login, profiles | REST |
| item-service | Auction listings, categories, end times | REST |
| bid-service | Placing and validating bids, highest bid | REST |
| payment-service | Payment for won auctions | REST |
| realtime-service | Live bid updates and auction-ended events | WebSocket |

## How to run

Requirements: [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm start
```

This starts all five services:

| Service | URL |
|---|---|
| user-service | http://localhost:3001 |
| item-service | http://localhost:3002 |
| bid-service | http://localhost:3003 |
| payment-service | http://localhost:3004 |
| realtime-service | http://localhost:3005 (WebSocket at `ws://localhost:3005/ws`) |

Open http://localhost:3005 for a live feed page: enter an auction id, subscribe, and watch bids arrive.

### Test

With the services running, in a second terminal:

```bash
npm test
```

The smoke test registers two users, creates a 4-second auction, places bids, checks the WebSocket events, and checks that a payment is created for the winner.

## Technology

Node.js, Express, `ws` (WebSocket), JSON Web Tokens. Each service keeps its data in memory (it resets when the service restarts). Services call each other over HTTP; internal endpoints are protected with a shared key.
