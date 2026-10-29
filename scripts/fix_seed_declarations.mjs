import fs from 'node:fs';
import path from 'node:path';

const seedPath = path.resolve('packages/backend/src/db/seed.ts');
let content = fs.readFileSync(seedPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Clean up line 350
content = content.replace(
  `  const allUsers = [...coreUsers, ...extendedPersonas];
    const isExpanded = (options.mode ?? process.env.SEED_MODE ?? 'expanded') === 'expanded';

    const finalUsers = isExpanded ? [...allUsers, ...expandedPersonas] : allUsers;
    const finalComms = isExpanded ? [...communities, ...expandedCommunities] : communities;
    const finalPosts = isExpanded ? [...posts, ...expandedPosts] : posts;
    const finalComments = isExpanded ? [...comments, ...expandedComments] : comments;
    const finalFollows = isExpanded ? [...follows, ...expandedFollows] : follows;
    const finalMemberships = isExpanded ? [...memberships, ...expandedMemberships] : memberships;
    const finalVotes = isExpanded ? [...votes, ...expandedVotes] : votes;
    const finalSaves = isExpanded ? [...saves, ...expandedSaves] : saves;`,
  `  const allUsers = [...coreUsers, ...extendedPersonas];
  const isExpanded = (options.mode ?? process.env.SEED_MODE ?? 'expanded') === 'expanded';
  const finalUsers = isExpanded ? [...allUsers, ...expandedPersonas] : allUsers;`
);

// 2. Add finalComms right after communities array closes
content = content.replace(
  `    rules: [
        { id: 'r1', title: 'Token consistency', description: 'Reference design system primitives.' },
      ],
      created_at: new Date('2026-01-09T00:00:00.000Z'),
      updated_at: new Date('2026-01-09T00:00:00.000Z'),
    },
  ];`,
  `    rules: [
        { id: 'r1', title: 'Token consistency', description: 'Reference design system primitives.' },
      ],
      created_at: new Date('2026-01-09T00:00:00.000Z'),
      updated_at: new Date('2026-01-09T00:00:00.000Z'),
    },
  ];
  const finalComms = isExpanded ? [...communities, ...expandedCommunities] : communities;`
);

// 3. Add finalPosts right after posts array closes
content = content.replace(
  `      created_at: new Date('2026-10-14T12:00:00.000Z'),
      updated_at: new Date('2026-10-14T12:00:00.000Z'),
    },
  ];

  const allKnownPostIds`,
  `      created_at: new Date('2026-10-14T12:00:00.000Z'),
      updated_at: new Date('2026-10-14T12:00:00.000Z'),
    },
  ];
  const finalPosts = isExpanded ? [...posts, ...expandedPosts] : posts;

  const allKnownPostIds`
);

// 4. Add finalComments right after comments array closes
content = content.replace(
  `      created_at: new Date('2026-10-14T14:40:00.000Z'),
      updated_at: new Date('2026-10-14T14:40:00.000Z'),
    },
  ];
  const allKnownCommentIds`,
  `      created_at: new Date('2026-10-14T14:40:00.000Z'),
      updated_at: new Date('2026-10-14T14:40:00.000Z'),
    },
  ];
  const finalComments = isExpanded ? [...comments, ...expandedComments] : comments;
  const allKnownCommentIds`
);

// 5. Add finalFollows right after follows array closes
content = content.replace(
  `    { _id: 'flw_18_14', follower_id: 'usr_18', target_user_id: 'usr_14', created_at: new Date() },
  ];
  const allKnownFollowIds`,
  `    { _id: 'flw_18_14', follower_id: 'usr_18', target_user_id: 'usr_14', created_at: new Date() },
  ];
  const finalFollows = isExpanded ? [...follows, ...expandedFollows] : follows;
  const allKnownFollowIds`
);

// 6. Add finalMemberships right after memberships array closes
content = content.replace(
  `    { _id: 'mbr_14_des', user_id: 'usr_14', community_id: 'comm_design', created_at: new Date() },
  ];
  const allKnownMbrIds`,
  `    { _id: 'mbr_14_des', user_id: 'usr_14', community_id: 'comm_design', created_at: new Date() },
  ];
  const finalMemberships = isExpanded ? [...memberships, ...expandedMemberships] : memberships;
  const allKnownMbrIds`
);

// 7. Add finalVotes right after votes array closes
content = content.replace(
  `    { _id: 'vote_114_0', post_id: 'post_114', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
  ];
  const allKnownVoteIds`,
  `    { _id: 'vote_114_0', post_id: 'post_114', user_id: 'usr_0', direction: 1, created_at: new Date(), updated_at: new Date() },
  ];
  const finalVotes = isExpanded ? [...votes, ...expandedVotes] : votes;
  const allKnownVoteIds`
);

// 8. Add finalSaves right after saves array closes
content = content.replace(
  `    { _id: 'save_109_0', post_id: 'post_109', user_id: 'usr_0', created_at: new Date() },
  ];
  const allKnownSaveIds`,
  `    { _id: 'save_109_0', post_id: 'post_109', user_id: 'usr_0', created_at: new Date() },
  ];
  const finalSaves = isExpanded ? [...saves, ...expandedSaves] : saves;
  const allKnownSaveIds`
);

fs.writeFileSync(seedPath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully reorganized final* variables in seed.ts');
