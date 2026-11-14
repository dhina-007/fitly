const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = 'http://localhost:3000/api';
const ADMIN_AUTH = {
  Authorization: 'Bearer dev-token-admin-user-uid-fitly',
  'Content-Type': 'application/json',
};
const MEMBER_AUTH = {
  Authorization: 'Bearer dev-token-dev-user-uid-12345',
  'Content-Type': 'application/json',
};

async function apiReq(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

test('Community & Feed Admin RBAC and automatic member task sync', async () => {
  let createdCommId = null;
  let createdPostId = null;
  let createdHabitId = null;

  try {
    // 1. Unauthenticated dev fallback never grants admin rights & blocks admin mutations (403)
    const unauthFeed = await apiReq('/community/feed');
    assert.equal(unauthFeed.status, 200);
    assert.equal(unauthFeed.data.isAdmin, false);
    const unauthCreatePost = await apiReq('/community/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { content: 'Should not publish' },
    });
    assert.equal(unauthCreatePost.status, 401);

    // 2. Role verification via endpoints
    const adminFeed = await apiReq('/community/feed', { headers: ADMIN_AUTH });
    assert.equal(adminFeed.status, 200);
    assert.equal(adminFeed.data.isAdmin, true);
    assert.ok(Array.isArray(adminFeed.data.data) && adminFeed.data.data.length >= 1);

    const memberFeed = await apiReq('/community/feed', { headers: MEMBER_AUTH });
    assert.equal(memberFeed.status, 200);
    assert.equal(memberFeed.data.isAdmin, false);

    // 3. Member cannot escalate privilege via profile update
    await apiReq('/auth/profile', {
      method: 'PUT',
      headers: MEMBER_AUTH,
      body: { isAdmin: true },
    });
    const memberProfileAfter = await apiReq('/auth/profile', { headers: MEMBER_AUTH });
    assert.equal(memberProfileAfter.status, 200);
    assert.equal(Boolean(memberProfileAfter.data.data?.isAdmin), false);

    // 4. Member is forbidden (403) from creating feed posts or communities
    const memberCreatePost = await apiReq('/community/feed', {
      method: 'POST',
      headers: MEMBER_AUTH,
      body: { title: 'Unauthorized', content: 'Should fail' },
    });
    assert.equal(memberCreatePost.status, 403);

    const memberCreateComm = await apiReq('/community/communities', {
      method: 'POST',
      headers: MEMBER_AUTH,
      body: { name: 'Unauthorized Club', description: 'Should fail' },
    });
    assert.equal(memberCreateComm.status, 403);

    // 5. Admin creates a new Community and a linked Feed Post
    const uniqueSuffix = Date.now();
    const adminCreateComm = await apiReq('/community/communities', {
      method: 'POST',
      headers: ADMIN_AUTH,
      body: {
        name: `QA AutoSync Club ${uniqueSuffix}`,
        description: 'Automated test community',
        category: 'habits',
        icon: 'Zap',
        reward: 'QA Badge',
      },
    });
    assert.equal(adminCreateComm.status, 201);
    createdCommId = adminCreateComm.data.data._id;
    assert.ok(createdCommId);

    const adminCreatePost = await apiReq('/community/feed', {
      method: 'POST',
      headers: ADMIN_AUTH,
      body: {
        title: `QA Official Announcement ${uniqueSuffix}`,
        content: 'Complete your own habit or workout to update the community.',
        category: 'announcement',
        communityId: createdCommId,
      },
    });
    assert.equal(adminCreatePost.status, 201);
    createdPostId = adminCreatePost.data.data._id;
    assert.ok(createdPostId);

    // 6. Member cannot delete Admin's post or community (403)
    const memberDelPost = await apiReq(`/community/feed/${createdPostId}`, {
      method: 'DELETE',
      headers: MEMBER_AUTH,
    });
    assert.equal(memberDelPost.status, 403);

    const memberDelComm = await apiReq(`/community/communities/${createdCommId}`, {
      method: 'DELETE',
      headers: MEMBER_AUTH,
    });
    assert.equal(memberDelComm.status, 403);

    // 7. Member subscribes to Official Feed (if not already) & joins/likes Admin post & joins Community
    if (!memberFeed.data.feedJoined) {
      const subRes = await apiReq('/community/feed/subscribe', {
        method: 'POST',
        headers: MEMBER_AUTH,
      });
      assert.equal(subRes.status, 200);
      assert.equal(subRes.data.data.feedJoined, true);
    }

    const likePostRes = await apiReq(`/community/feed/${createdPostId}/like`, {
      method: 'POST',
      headers: MEMBER_AUTH,
    });
    assert.equal(likePostRes.status, 200);
    assert.equal(likePostRes.data.data.userLiked, true);
    assert.equal(likePostRes.data.data.likesCount, 1);

    const joinPostRes = await apiReq(`/community/feed/${createdPostId}/join`, {
      method: 'POST',
      headers: MEMBER_AUTH,
    });
    assert.equal(joinPostRes.status, 200);
    assert.equal(joinPostRes.data.data.userJoined, true);
    assert.equal(joinPostRes.data.data.joinedCount, 1);

    const joinCommRes = await apiReq(`/community/communities/${createdCommId}/join`, {
      method: 'POST',
      headers: MEMBER_AUTH,
    });
    assert.equal(joinCommRes.status, 200);
    assert.equal(joinCommRes.data.data.isJoined, true);
    assert.equal(joinCommRes.data.data.memberCount, 1);

    // 8. Member creates & completes a Habit -> automatically updates joined community
    const habitRes = await apiReq('/habits', {
      method: 'POST',
      headers: MEMBER_AUTH,
      body: { name: `QA Morning Walk ${uniqueSuffix}`, icon: 'Footprints' },
    });
    assert.equal(habitRes.status, 201);
    createdHabitId = habitRes.data.data._id;

    const todayStr = new Date().toISOString().split('T')[0];
    const toggleHabitRes = await apiReq(`/habits/${createdHabitId}/toggle`, {
      method: 'POST',
      headers: MEMBER_AUTH,
      body: { date: todayStr },
    });
    assert.equal(toggleHabitRes.status, 200);
    assert.equal(toggleHabitRes.data.data.completed, true);
    assert.ok(toggleHabitRes.data.communityUpdatesCount >= 1);

    // Verify joined community reflects habit task automatically
    let commsList = await apiReq('/community/communities', { headers: MEMBER_AUTH });
    let qaComm = commsList.data.data.find((c) => c._id === createdCommId);
    assert.ok(qaComm);
    assert.equal(qaComm.myStats.tasksCompleted, 1);
    assert.ok(
      qaComm.updates.some((u) => u.taskTitle.includes(`QA Morning Walk ${uniqueSuffix}`)),
      'Expected habit completion update in community updates'
    );

    // 9. Member logs a Workout -> automatically increments joined community again
    const workoutRes = await apiReq('/workouts/logs', {
      method: 'POST',
      headers: MEMBER_AUTH,
      body: {
        workoutName: `QA Strength Session ${uniqueSuffix}`,
        durationMinutes: 25,
        caloriesBurned: 180,
        category: 'strength',
        date: todayStr,
      },
    });
    assert.equal(workoutRes.status, 201);
    assert.ok(workoutRes.data.communityUpdatesCount >= 1);

    commsList = await apiReq('/community/communities', { headers: MEMBER_AUTH });
    qaComm = commsList.data.data.find((c) => c._id === createdCommId);
    assert.equal(qaComm.myStats.tasksCompleted, 2);
    assert.ok(
      qaComm.updates.some((u) => u.taskTitle.includes(`QA Strength Session ${uniqueSuffix}`)),
      'Expected workout completion update in community updates'
    );
  } finally {
    if (createdHabitId) {
      await apiReq(`/habits/${createdHabitId}`, { method: 'DELETE', headers: MEMBER_AUTH });
    }
    if (createdPostId) {
      await apiReq(`/community/feed/${createdPostId}`, { method: 'DELETE', headers: ADMIN_AUTH });
    }
    if (createdCommId) {
      await apiReq(`/community/communities/${createdCommId}`, { method: 'DELETE', headers: ADMIN_AUTH });
    }
  }
});
