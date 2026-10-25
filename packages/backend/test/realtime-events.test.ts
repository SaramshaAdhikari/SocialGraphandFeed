import { describe, expect, it } from 'vitest';
import { realtimeEventBus } from '../src/realtime/EventBus.js';

describe('relationship-aware realtime events', () => {
  it('delivers a new-post event only to the author followers', () => {
    const followerEvents: string[] = [];
    const unrelatedEvents: string[] = [];
    const removeFollower = realtimeEventBus.subscribe('usr_follower', (event) => followerEvents.push(event.type));
    const removeUnrelated = realtimeEventBus.subscribe('usr_unrelated', (event) => unrelatedEvents.push(event.type));

    realtimeEventBus.publish({
      type: 'post.created',
      author_id: 'usr_author',
      post_id: 'post_demo',
      follower_ids: ['usr_follower'],
    });

    removeFollower();
    removeUnrelated();
    expect(followerEvents).toEqual(['post.created']);
    expect(unrelatedEvents).toEqual([]);
  });

  it('routes likes to the post author and never to the actor', () => {
    const authorEvents: string[] = [];
    const actorEvents: string[] = [];
    const removeAuthor = realtimeEventBus.subscribe('usr_author', (event) => authorEvents.push(event.type));
    const removeActor = realtimeEventBus.subscribe('usr_actor', (event) => actorEvents.push(event.type));

    realtimeEventBus.publish({
      type: 'post.liked',
      actor_id: 'usr_actor',
      post_id: 'post_demo',
      author_id: 'usr_author',
    });

    removeAuthor();
    removeActor();
    expect(authorEvents).toEqual(['post.liked']);
    expect(actorEvents).toEqual([]);
  });
});
