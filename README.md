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
