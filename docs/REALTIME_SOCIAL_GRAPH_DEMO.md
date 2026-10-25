# Realtime social graph demo

This feature connects the existing MongoDB relationship and feed writes to an authenticated Server-Sent Events (SSE) stream. The stream sends small signals; the browser still fetches the feed through the normal API.

## Run the demo

Start the local stack and seed the shared fixtures:

```powershell
docker compose up --build -d
docker compose exec backend npm run seed --workspace=packages/backend
```

Open two independent browser windows at <http://localhost:3000>. Use separate users, or register a second local account.

1. In window A, follow the user represented in window B.
2. In window B, create a post.
3. Window A should show `Live social graph connected`, then a `new post available` indicator.
4. Click the indicator. The existing feed API refreshes and the new post appears without a full-page reload.
5. Open `/graph` in either window. The bounded neighborhood is read from persisted MongoDB follow edges.
6. Stop the backend container with `docker compose stop backend`, then start it again. The feed remains usable while the SSE client backs off and reconnects.

## Event rules

- `post.created` is delivered only to the post author's current followers.
- `follow.created` and `follow.deleted` are delivered to the target user.
- `post.liked` and `post.unliked` are delivered to the post author, not every follower.
- Events are emitted after the MongoDB mutation succeeds.
- Payloads contain identifiers and timestamps, not private feed contents.

The current event bus is process-local, which is appropriate for the single-container demo. A multi-instance deployment should replace the bus internals with Redis Pub/Sub while preserving the `publish` and `subscribe` interface.
