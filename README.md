# SocialGraphandFeed

A React/Vite social feed with a Fastify API, MongoDB replica set, and Redis health check. The supported teammate workflow runs the full app and its checks in Docker; Node.js, npm, MongoDB, and Redis do not need to be installed on Windows.

## Run on Windows

Install Git and Docker Desktop with the Linux container engine enabled. From PowerShell:

```powershell
git clone https://github.com/SaramshaAdhikari/SocialGraphandFeed.git
Set-Location SocialGraphandFeed
docker compose up --build -d
```

Open <http://localhost:3000>. The API base is <http://localhost:4000/api/v1>; health is at <http://localhost:4000/api/v1/health>. See [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) for daily commands, tests, data handling, troubleshooting, and collaboration guidance.

Authentication uses MongoDB-backed server sessions in HttpOnly, SameSite cookies. After starting the app, seed sample content if needed, then explicitly bootstrap the existing `alex_dev` account as the development administrator. This only targets the configured local Compose database:

```powershell
# Only for a local development database. Seed sample content first if needed.
docker compose exec -T -e NODE_ENV=development -e DEV_ADMIN_BOOTSTRAP=true -e DEV_ADMIN_PASSWORD=admin backend npm run auth:bootstrap-admin --workspace=@socialgraph/backend
```

In explicitly configured development, the bootstrap assigns login ID `admin` and password `admin` to the existing `alex_dev` identity, preserving its ID, profile, and relationships. It stores a password hash and never resets an existing password on rerun. To intentionally reset credentials in local development only, add `-e DEV_ADMIN_RESET_PASSWORD=true`; to choose another password, replace `admin` in `DEV_ADMIN_PASSWORD`. The `admin` login alias and bootstrap are disabled in production. Production requires a unique `SESSION_SECRET` of at least 32 characters and an HTTPS `WEB_ORIGIN`. New users can register at `/register`.

## Shared Local Development Test Data

Each teammate runs a separate local MongoDB database. The version-controlled [shared test data instructions](docs/development/shared-test-data.md) provide the same small set of fictional users, posts, communities, comments, and relationships for consistent local development and demonstrations.

### Prerequisites and seed steps

Install Docker Desktop with its Linux container engine, then from the repository root in PowerShell start the local app and database:

```powershell
docker compose up --build -d
docker compose ps
```

Wait until `mongodb` is healthy. The Compose MongoDB service is `mongodb` (MongoDB 7.0.14), and its default database is `socialgraph` (`MONGODB_DB_NAME` in `.env` can select another database). No MongoDB username or password is configured by this local Compose file.

Open the MongoDB shell in that Compose service:

```powershell
docker compose exec mongodb mongosh
```

Copy and paste the full JavaScript seed block in `docs/development/shared-test-data.md` into `mongosh`. Its first line selects `socialgraph`; if you customized `MONGODB_DB_NAME`, change that database name there first. The shell prints how many documents it inserted or found already present for each collection.

The verification commands below also use the default name `socialgraph`. If `MONGODB_DB_NAME` is customized, replace the `mongosh socialgraph` database argument in both commands with that local database name.

Verify the expected counts from PowerShell:

```powershell
docker compose exec mongodb mongosh socialgraph --quiet --eval 'const marker="shared-test-data-v1"; printjson({users:db.users.countDocuments({seed_key:marker}),posts:db.posts.countDocuments({seed_key:marker}),comments:db.comments.countDocuments({seed_key:marker}),follows:db.follows.countDocuments({seed_key:marker}),communities:db.communities.countDocuments({seed_key:marker}),memberships:db.community_memberships.countDocuments({seed_key:marker}),votes:db.post_votes.countDocuments({seed_key:marker}),saves:db.post_saves.countDocuments({seed_key:marker})})'
```

Expected counts are 3 users, 4 posts, 4 comments, 3 follows, 2 communities, 4 memberships, 5 votes, and 2 saves. Reapply by pasting the same block again; it inserts only missing seed-owned IDs. It never updates or deletes existing records. If a stable ID or unique username/slug/relationship is already owned by another record, the preflight stops and reports the conflict. Do not remove or rename the conflicting record to force the seed; choose a new seed version with distinct IDs instead.

To check that seeded posts, comments, follows, memberships, votes, and saves reference seeded records, run:

```powershell
docker compose exec mongodb mongosh socialgraph --quiet --eval 'const marker="shared-test-data-v1"; const users=db.users.find({seed_key:marker},{_id:1}).toArray().map(x=>x._id); const posts=db.posts.find({seed_key:marker},{_id:1}).toArray().map(x=>x._id); const comments=db.comments.find({seed_key:marker},{_id:1}).toArray().map(x=>x._id); const communities=db.communities.find({seed_key:marker},{_id:1}).toArray().map(x=>x._id); printjson({orphanAuthors:db.posts.countDocuments({seed_key:marker,author_id:{$nin:users}}),orphanCommentPosts:db.comments.countDocuments({seed_key:marker,post_id:{$nin:posts}}),orphanReplies:db.comments.countDocuments({seed_key:marker,parent_id:{$ne:null,$nin:comments}}),orphanFollows:db.follows.countDocuments({seed_key:marker,$or:[{follower_id:{$nin:users}},{target_user_id:{$nin:users}}]}),orphanMemberships:db.community_memberships.countDocuments({seed_key:marker,$or:[{user_id:{$nin:users}},{community_id:{$nin:communities}}]}),orphanVotes:db.post_votes.countDocuments({seed_key:marker,$or:[{post_id:{$nin:posts}},{user_id:{$nin:users}}]}),orphanSaves:db.post_saves.countDocuments({seed_key:marker,$or:[{post_id:{$nin:posts}},{user_id:{$nin:users}}]})})'
```

All `orphan*` results should be `0`.

If `docker compose exec` cannot connect, check `docker compose ps` and `docker compose logs mongodb --tail=80`, then wait for MongoDB's health check or restart the local stack with `docker compose up -d`. If a shell opens but writes go to the wrong database, check the `MONGODB_DB_NAME` value in `.env` and the script's first `getSiblingDB` line. If you see an authentication error, this Compose service has no configured MongoDB authentication; confirm you are connecting to this local `mongodb` service and not another MongoDB instance, and do not put production credentials in the seed file. If a host-side Mongo shell is used instead, the Compose port is `127.0.0.1:${MONGODB_HOST_PORT:-27027}`; the `docker compose exec` command avoids host-port differences.

> Before performing development checks that depend on database records, read `docs/development/shared-test-data.md` and apply its seed commands to the intended local development database if the required test records are absent. Never run these commands against a production database, and never clear or overwrite existing user data to prepare the test environment.

Community membership source-of-truth and the original sidebar/detail mismatch are documented in [docs/COMMUNITY_MEMBERSHIP.md](docs/COMMUNITY_MEMBERSHIP.md).

## Repository layout

- `packages/frontend`: React and Vite UI
- `packages/backend`: Fastify API, MongoDB persistence, and Redis health integration
- `packages/shared`: shared TypeBox API contracts
- `docker-compose.yml`: complete application stack
- `docker-compose.test.yml`: isolated MongoDB/Redis services and Docker test runner
