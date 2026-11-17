# Project Overview

## Goal
Build an online auction platform as five independent microservices, one of which provides real-time communication over WebSockets.

## Core use cases
1. A user registers and logs in.
2. A seller creates an auction listing with a starting price and end time.
3. Buyers browse listings and place bids.
4. Everyone watching an auction sees new bids instantly (WebSocket).
5. When the auction ends, the highest bidder is the winner and pays for the item.

## Scope
**In scope:** the five services above, each with its own data store, communicating over REST and a message/event mechanism.

**Out of scope:** real payment providers (payments are simulated), a production-grade frontend.

## Technology
Node.js, Express, `ws` (WebSocket) and JSON Web Tokens. Data is stored in memory in each service. Services communicate over HTTP; the broker described in the architecture is replaced by direct HTTP calls for simplicity.
