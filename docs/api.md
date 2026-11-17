# API Summary (draft)

## user-service
- `POST /users/register`
- `POST /users/login`
- `GET /users/{id}`

## item-service
- `POST /items`
- `GET /items`
- `GET /items/{id}`

## bid-service
- `POST /items/{id}/bids`
- `GET /items/{id}/bids`

## payment-service
- `GET /payments/{id}`
- `POST /payments/{id}/pay`

## realtime-service (WebSocket)
- Connect: `ws://<host>/ws`
- Client message: `{"action":"subscribe","auctionId":"..."}`
- Server messages: `{"type":"bid.placed",...}`, `{"type":"auction.closed",...}`
