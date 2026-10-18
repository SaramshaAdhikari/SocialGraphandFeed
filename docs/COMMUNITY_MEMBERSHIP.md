# Community membership state

## Root cause

The Recommended Hubs sidebar rendered a hard-coded set of communities and always showed **Join**. It did not fetch membership state or call the membership API. The hub detail page loaded `is_member` from the API but then changed a separate React state flag locally, without persisting the change. Those two views therefore described different state.

The database also contained stale `communities.members_count` values. For example, the existing `systems` row had a stored count of 1,420 while its `community_memberships` rows contained two relationships. These rows included `usr_0` as a member. The discrepancy did not mean the user had been joined based on a username: the persisted relationship itself existed. No membership rows were inserted or deleted to fix the display.

## Authoritative data and behavior

`community_memberships` is the sole authority for membership. A membership is the pair `(user_id, community_id)`, with `user_id` the stable internal ID and `community_id` the internal community ID. The unique `uniq_user_community` index prevents duplicate pairs. `communities.members_count` is a derived display counter; community reads, listings, search results, and membership responses compute it from relationship rows. On backend startup the counter reconciliation updates only stale `members_count` fields in a MongoDB transaction. It never manufactures or removes membership relationships.

The current development-only identity boundary resolves the `X-Dev-User-Id` header to an internal user ID when the bypass is enabled outside production. Production rejects that header. This selector is not login or authentication. Future verified authentication middleware should set `request.userId` to the stable internal ID and replace the dev header resolver; membership service methods already accept that ID directly. Real registration, login, logout, and session management are intentionally deferred.

Join uses `POST /api/v1/communities/:slug/join`; Leave uses `DELETE` on that route. Both are idempotent and require identity. The relationship write and derived counter update run in one MongoDB transaction. A failure rejects the request and rolls back the transaction. The views render membership and count from the API response, and update them only after a successful mutation. There is no frontend membership cache; remounts and refreshes fetch the current server state.

In Docker development, `VITE_DEV_USER_ID` defaults to the seeded internal user ID `usr_0`, and the frontend is configured to use the live API. Change this selector only for local development. It must never be treated as a credential or enabled in production.
