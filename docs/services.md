# Services

## 1. user-service
Registers users, authenticates them (issues tokens), manages profiles.
Data: users.

## 2. item-service
Creates, updates and lists auction items; stores starting price, end time and status (`open`, `closed`).
Data: items, categories.

## 3. bid-service
Accepts bids, validates them (auction open, bid higher than current highest, bidder is not the seller), stores bid history, publishes a `bid.placed` event.
Data: bids.

## 4. payment-service
Creates a payment record for the winner when an auction closes and simulates payment.
Data: payments.

## 5. realtime-service (WebSocket)
Clients connect and subscribe to an auction. The service consumes `bid.placed` and `auction.closed` events and pushes them to all subscribers of that auction.
Data: none persistent (connection/subscription state in memory).

## Events
| Event | Producer | Consumers |
|---|---|---|
| `bid.placed` | bid-service | realtime-service |
| `auction.closed` | item-service | realtime-service, payment-service |
