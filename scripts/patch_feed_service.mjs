import fs from 'fs';

const filePath = 'packages/backend/src/services/FeedService.ts';
let code = fs.readFileSync(filePath, 'utf8');

const target = `    } else if (scope === 'communities') {\r
      scopeFilter = { community_id: { $exists: true, $ne: null as any } };\r
    }`;

const replacement = `    } else if (scope === 'communities') {\r
      if (currentUserId) {\r
        const mbrsCol = this.db.collection<CommunityMembershipDoc>(COLLECTIONS.COMMUNITY_MEMBERSHIPS);\r
        const memberships = await mbrsCol.find({ user_id: currentUserId }).toArray();\r
        const joinedCommIds = memberships.map((m) => m.community_id);\r
        if (joinedCommIds.length === 0) {\r
          return {\r
            success: true,\r
            data: [],\r
            next_cursor: null,\r
            has_more: false,\r
            meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) },\r
          };\r
        }\r
        scopeFilter = { community_id: { $in: joinedCommIds } };\r
      } else {\r
        scopeFilter = { community_id: { $exists: true, $ne: null as any } };\r
      }\r
    }`;

if (!code.includes(target)) {
  console.error('Target not found!');
  process.exit(1);
}

code = code.replace(target, replacement);
fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated FeedService.ts');
