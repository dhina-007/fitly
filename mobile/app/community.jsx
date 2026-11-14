import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants';
import { Card, AppHeader, Icon, Input, Button } from '../components/ui';
import { healthService } from '../services/health.service';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';

const FEED_CATEGORIES = [
  { key: 'announcement', label: 'Announcement', icon: 'Megaphone' },
  { key: 'workout', label: 'Workout', icon: 'Dumbbell' },
  { key: 'challenge', label: 'Challenge', icon: 'Trophy' },
  { key: 'nutrition', label: 'Nutrition', icon: 'Utensils' },
  { key: 'motivation', label: 'Motivation', icon: 'Sparkles' },
];

const COMMUNITY_CATEGORIES = [
  { key: 'workout', label: 'Workout' },
  { key: 'habits', label: 'Habits' },
  { key: 'steps', label: 'Steps' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'general', label: 'General' },
];

const COMMUNITY_ICONS = ['Users', 'Flame', 'Dumbbell', 'Droplets', 'Footprints', 'Trophy', 'Heart', 'Zap'];

function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now';
  const diffMs = Date.now() - new Date(dateInput).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CommunityScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile } = useAuthStore();
  const { showToast } = useAppStore();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'communities'

  // Admin: Create Feed Post Modal
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('announcement');
  const [postCommunityId, setPostCommunityId] = useState(null);
  const [postPinned, setPostPinned] = useState(false);

  // Admin: Create Community Modal
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commCategory, setCommCategory] = useState('workout');
  const [commIcon, setCommIcon] = useState('Users');
  const [commReward, setCommReward] = useState('Finisher Badge');
  const [commTaskHint, setCommTaskHint] = useState(
    'Complete your daily habits or workouts to automatically update this community.'
  );

  // Fetch Feed Posts
  const {
    data: feedRes,
    isLoading: feedLoading,
    refetch: refetchFeed,
  } = useQuery({
    queryKey: ['feedPosts'],
    queryFn: healthService.getFeedPosts,
  });

  // Fetch Communities
  const {
    data: communitiesRes,
    isLoading: communitiesLoading,
    refetch: refetchCommunities,
  } = useQuery({
    queryKey: ['communities'],
    queryFn: healthService.getCommunities,
  });

  const isAdmin = useMemo(
    () => Boolean(feedRes?.isAdmin || communitiesRes?.isAdmin || profile?.isAdmin || user?.isAdmin),
    [feedRes?.isAdmin, communitiesRes?.isAdmin, profile?.isAdmin, user?.isAdmin]
  );

  const posts = feedRes?.data || [];
  const feedJoined = Boolean(feedRes?.feedJoined);
  const communities = communitiesRes?.data || [];

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: (payload) => healthService.createFeedPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['feedPosts']);
      setPostTitle('');
      setPostContent('');
      setPostCategory('announcement');
      setPostCommunityId(null);
      setPostPinned(false);
      setPostModalVisible(false);
      showToast('Official feed post published!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Only Admins can publish feed posts', 'error');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => healthService.deleteFeedPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['feedPosts']);
      showToast('Feed post removed', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete post', 'error');
    },
  });

  const subscribeFeedMutation = useMutation({
    mutationFn: () => healthService.toggleSubscribeFeed(),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['feedPosts']);
      showToast(res?.message || 'Feed membership updated', 'success');
    },
  });

  const likePostMutation = useMutation({
    mutationFn: (id) => healthService.toggleLikeFeedPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['feedPosts']);
    },
  });

  const joinPostMutation = useMutation({
    mutationFn: (id) => healthService.toggleJoinFeedPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['feedPosts']);
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: (payload) => healthService.createCommunity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['communities']);
      setCommName('');
      setCommDesc('');
      setCommCategory('workout');
      setCommIcon('Users');
      setCommReward('Finisher Badge');
      setCommunityModalVisible(false);
      showToast('Community created & published to all users!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Only Admins can create communities', 'error');
    },
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: (id) => healthService.deleteCommunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['communities']);
      showToast('Community removed', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to remove community', 'error');
    },
  });

  const joinCommunityMutation = useMutation({
    mutationFn: ({ id, isJoined }) =>
      isJoined ? healthService.leaveCommunity(id) : healthService.joinCommunity(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['communities']);
      showToast(res?.message || 'Community membership updated', 'success');
    },
  });

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      showToast('Please enter feed post content', 'error');
      return;
    }
    createPostMutation.mutate({
      title: postTitle.trim(),
      content: postContent.trim(),
      category: postCategory,
      communityId: postCommunityId,
      isPinned: postPinned,
    });
  };

  const handleCreateCommunity = () => {
    if (!commName.trim()) {
      showToast('Please enter a community name', 'error');
      return;
    }
    createCommunityMutation.mutate({
      name: commName.trim(),
      description: commDesc.trim(),
      category: commCategory,
      icon: commIcon,
      reward: commReward.trim() || 'Community Badge',
      taskHint: commTaskHint.trim(),
    });
  };

  const renderFeedHeader = () => (
    <View style={styles.sectionHeaderBlock}>
      {/* Role info / Subscribe banner */}
      <Card style={[styles.bannerCard, isAdmin ? styles.bannerCardAdmin : styles.bannerCardMember]}>
        <View style={styles.bannerTopRow}>
          <View style={[styles.bannerIconWrap, isAdmin ? styles.bannerIconAdmin : styles.bannerIconMember]}>
            <Icon name={isAdmin ? 'Shield' : 'Megaphone'} size={18} color={isAdmin ? '#4F46E5' : '#059669'} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>
              {isAdmin ? 'Admin Feed Publisher' : 'Official Fitly Admin Feed'}
            </Text>
            <Text style={styles.bannerDesc}>
              {isAdmin
                ? 'Only Admins can publish feed posts. Members can join the feed, react, and participate.'
                : 'Published exclusively by Fitly Admin. Join the feed to stay synced with updates and challenges.'}
            </Text>
          </View>
        </View>

        {isAdmin ? (
          <Button
            title="+ Create Feed Post"
            onPress={() => setPostModalVisible(true)}
            style={styles.bannerActionBtn}
            testID="open-create-post-btn"
          />
        ) : (
          <TouchableOpacity
            style={[styles.subscribeBtn, feedJoined && styles.subscribeBtnJoined]}
            onPress={() => subscribeFeedMutation.mutate()}
            disabled={subscribeFeedMutation.isPending}
            testID="join-feed-btn"
          >
            <Icon
              name={feedJoined ? 'CheckCircle2' : 'Plus'}
              size={16}
              color={feedJoined ? '#047857' : '#FFFFFF'}
            />
            <Text style={[styles.subscribeBtnText, feedJoined && styles.subscribeBtnTextJoined]}>
              {feedJoined ? 'Joined Official Feed' : 'Join Official Feed'}
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    </View>
  );

  const renderPostItem = ({ item }) => {
    const catMeta = FEED_CATEGORIES.find((c) => c.key === item.category) || FEED_CATEGORIES[0];
    return (
      <Card style={styles.postCard} testID={`feed-post-${item._id}`}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Icon name="Shield" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.postAuthorCol}>
            <View style={styles.authorNameRow}>
              <Text style={styles.userName}>{item.authorName || 'Fitly Admin'}</Text>
              <View style={styles.adminChip}>
                <Text style={styles.adminChipText}>ADMIN</Text>
              </View>
              {item.isPinned && (
                <View style={styles.pinnedChip}>
                  <Text style={styles.pinnedChipText}>PINNED</Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>
              {catMeta.label} • {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => deletePostMutation.mutate(item._id)}
              style={styles.deleteIconBtn}
              testID={`delete-post-${item._id}`}
            >
              <Icon name="Trash2" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {!!item.title && <Text style={styles.postTitle}>{item.title}</Text>}
        <Text style={styles.postContent}>{item.content}</Text>

        {!!item.communityName && (
          <TouchableOpacity
            style={styles.linkedCommunityChip}
            onPress={() => setActiveTab('communities')}
          >
            <Icon name="Users" size={13} color={Colors.primary[700]} />
            <Text style={styles.linkedCommunityText}>Community: {item.communityName}</Text>
            <Icon name="ChevronRight" size={13} color={Colors.primary[600]} />
          </TouchableOpacity>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionBtn, item.userLiked && styles.actionBtnActiveLike]}
            onPress={() => likePostMutation.mutate(item._id)}
            testID={`like-post-${item._id}`}
          >
            <Icon
              name="Heart"
              size={16}
              color={item.userLiked ? Colors.error : Colors.textSecondary}
            />
            <Text style={[styles.actionText, item.userLiked && { color: Colors.error }]}>
              {item.likesCount || 0} Likes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.joinPostBtn, item.userJoined && styles.joinPostBtnActive]}
            onPress={() => joinPostMutation.mutate(item._id)}
            testID={`join-post-${item._id}`}
          >
            <Icon
              name={item.userJoined ? 'Check' : 'UserPlus'}
              size={15}
              color={item.userJoined ? '#047857' : '#FFFFFF'}
            />
            <Text style={[styles.joinPostBtnText, item.userJoined && styles.joinPostBtnTextActive]}>
              {item.userJoined ? `Joined (${item.joinedCount || 0})` : `Join Post (${item.joinedCount || 0})`}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderCommunitiesHeader = () => (
    <View style={styles.sectionHeaderBlock}>
      <Card style={[styles.bannerCard, isAdmin ? styles.bannerCardAdmin : styles.bannerCardMember]}>
        <View style={styles.bannerTopRow}>
          <View style={[styles.bannerIconWrap, isAdmin ? styles.bannerIconAdmin : styles.bannerIconMember]}>
            <Icon name={isAdmin ? 'Shield' : 'Zap'} size={18} color={isAdmin ? '#4F46E5' : '#059669'} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>
              {isAdmin ? 'Manage Fitly Communities' : 'Auto-Synced Communities'}
            </Text>
            <Text style={styles.bannerDesc}>
              {isAdmin
                ? 'Only Admins can create Communities. Members join communities and update them automatically as they finish tasks.'
                : 'Join any Admin-posted community below. Completing your daily Habits or Workouts automatically updates your joined communities!'}
            </Text>
          </View>
        </View>

        {isAdmin ? (
          <Button
            title="+ Create Community"
            onPress={() => setCommunityModalVisible(true)}
            style={styles.bannerActionBtn}
            testID="open-create-community-btn"
          />
        ) : (
          <View style={styles.quickTaskRow}>
            <TouchableOpacity
              style={styles.quickTaskBtn}
              onPress={() => router.push('/habits')}
            >
              <Icon name="CheckCircle2" size={14} color={Colors.primary[700]} />
              <Text style={styles.quickTaskBtnText}>Complete a Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickTaskBtn}
              onPress={() => router.push('/(tabs)/workout')}
            >
              <Icon name="Dumbbell" size={14} color={Colors.primary[700]} />
              <Text style={styles.quickTaskBtnText}>Log a Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </View>
  );

  const renderCommunityItem = ({ item }) => {
    const isJoined = Boolean(item.isJoined);
    const myTasks = item.myStats?.tasksCompleted || 0;
    const recentUpdates = item.updates || [];
    const leaderboard = item.leaderboard || [];

    return (
      <Card style={styles.communityCard} testID={`community-card-${item._id}`}>
        <View style={styles.communityTopRow}>
          <View style={styles.communityIconCircle}>
            <Icon name={item.icon || 'Users'} size={20} color="#059669" />
          </View>
          <View style={styles.communityTitleCol}>
            <View style={styles.communityNameRow}>
              <Text style={styles.communityName}>{item.name}</Text>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{String(item.category || 'general').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.communityMeta}>
              Posted by {item.createdByName || 'Fitly Admin'} • {item.memberCount || 0} members
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => deleteCommunityMutation.mutate(item._id)}
              style={styles.deleteIconBtn}
              testID={`delete-community-${item._id}`}
            >
              <Icon name="Trash2" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {!!item.description && <Text style={styles.communityDesc}>{item.description}</Text>}

        <View style={styles.rewardRow}>
          <Icon name="Award" size={14} color="#D97706" />
          <Text style={styles.rewardText}>Reward: {item.reward || 'Community Badge'}</Text>
        </View>

        <View style={styles.hintBox}>
          <Icon name="Zap" size={13} color={Colors.primary[700]} />
          <Text style={styles.hintText}>{item.taskHint}</Text>
        </View>

        {/* Join / Leave & My Sync Stats */}
        <View style={styles.communityActionRow}>
          {isJoined ? (
            <View style={styles.myProgressPill} testID={`community-my-tasks-${item._id}`}>
              <Icon name="CheckCircle2" size={14} color="#047857" />
              <Text style={styles.myProgressText}>
                Joined • {myTasks} {myTasks === 1 ? 'task' : 'tasks'} synced
              </Text>
            </View>
          ) : (
            <View style={styles.notJoinedPill}>
              <Text style={styles.notJoinedText}>Join to sync your completed tasks</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.joinCommBtn, isJoined && styles.leaveCommBtn]}
            onPress={() => joinCommunityMutation.mutate({ id: item._id, isJoined })}
            disabled={joinCommunityMutation.isPending}
            testID={`join-community-${item._id}`}
          >
            <Text style={[styles.joinCommBtnText, isJoined && styles.leaveCommBtnText]}>
              {isJoined ? 'Joined ✓' : 'Join Community'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top Members Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Active Members Leaderboard</Text>
            {leaderboard.slice(0, 3).map((m, idx) => (
              <View key={`${m.userId}-${idx}`} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>#{idx + 1}</Text>
                <Text style={styles.leaderName} numberOfLines={1}>{m.userName}</Text>
                <Text style={styles.leaderTasks}>{m.tasksCompleted || 0} tasks</Text>
              </View>
            ))}
          </View>
        )}

        {/* Live Automatic Task Updates */}
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>Automatic Task Updates</Text>
          {recentUpdates.length === 0 ? (
            <Text style={styles.emptyUpdatesText}>
              No completed tasks synced yet. Complete a habit or workout to post the first update!
            </Text>
          ) : (
            recentUpdates.slice(0, 4).map((upd, idx) => (
              <View
                key={`${upd.taskKey || idx}-${idx}`}
                style={styles.updateRow}
                testID={`community-update-${item._id}-${idx}`}
              >
                <View style={styles.updateDot} />
                <Text style={styles.updateText} numberOfLines={2}>
                  <Text style={styles.updateUser}>{upd.userName}</Text> completed{' '}
                  <Text style={styles.updateTask}>{upd.taskTitle}</Text> ({upd.taskCategory})
                </Text>
                <Text style={styles.updateTime}>{formatRelativeTime(upd.completedAt)}</Text>
              </View>
            ))
          )}
        </View>
      </Card>
    );
  };

  const isRefreshing = activeTab === 'feed' ? feedLoading : communitiesLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Community"
        showBack
        rightElement={
          <View style={[styles.headerRoleBadge, isAdmin ? styles.headerRoleAdmin : styles.headerRoleMember]}>
            <Icon name={isAdmin ? 'Shield' : 'User'} size={12} color={isAdmin ? '#4338CA' : '#047857'} />
            <Text style={[styles.headerRoleText, isAdmin ? styles.headerRoleTextAdmin : styles.headerRoleTextMember]}>
              {isAdmin ? 'ADMIN' : 'MEMBER'}
            </Text>
          </View>
        }
      />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
          testID="tab-feed"
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed ({posts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'communities' && styles.activeTab]}
          onPress={() => setActiveTab('communities')}
          testID="tab-communities"
        >
          <Text style={[styles.tabText, activeTab === 'communities' && styles.activeTabText]}>
            Communities ({communities.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'feed' ? (
        feedLoading && posts.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary[600]} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => String(item._id)}
            ListHeaderComponent={renderFeedHeader}
            renderItem={renderPostItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refetchFeed} />
            }
            ListEmptyComponent={
              <Card style={styles.emptyCard}>
                <Icon name="Megaphone" size={28} color={Colors.neutral[400]} />
                <Text style={styles.emptyTitle}>No feed posts yet</Text>
                <Text style={styles.emptyDesc}>
                  {isAdmin
                    ? 'Tap "+ Create Feed Post" above to share an official post.'
                    : 'Fitly Admin has not published any posts yet.'}
                </Text>
              </Card>
            }
          />
        )
      ) : communitiesLoading && communities.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => String(item._id)}
          ListHeaderComponent={renderCommunitiesHeader}
          renderItem={renderCommunityItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetchCommunities} />
          }
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Icon name="Users" size={28} color={Colors.neutral[400]} />
              <Text style={styles.emptyTitle}>No communities available</Text>
              <Text style={styles.emptyDesc}>
                {isAdmin
                  ? 'Tap "+ Create Community" above to launch your first community.'
                  : 'Fitly Admin has not created any communities yet.'}
              </Text>
            </Card>
          }
        />
      )}

      {/* ADMIN ONLY: Create Feed Post Modal */}
      <Modal
        visible={postModalVisible && isAdmin}
        transparent
        animationType="slide"
        onRequestClose={() => setPostModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPostModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Official Feed Post</Text>
                <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                  <Icon name="X" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Input
                label="Post Title (optional)"
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="e.g. Weekend 10K Step Challenge"
                testID="admin-post-title-input"
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipRow}>
                {FEED_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.selectChip, postCategory === cat.key && styles.selectChipActive]}
                    onPress={() => setPostCategory(cat.key)}
                  >
                    <Text style={[styles.selectChipText, postCategory === cat.key && styles.selectChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {communities.length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>Link Community (optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                    <TouchableOpacity
                      style={[styles.selectChip, !postCommunityId && styles.selectChipActive, { marginRight: 6 }]}
                      onPress={() => setPostCommunityId(null)}
                    >
                      <Text style={[styles.selectChipText, !postCommunityId && styles.selectChipTextActive]}>None</Text>
                    </TouchableOpacity>
                    {communities.map((c) => (
                      <TouchableOpacity
                        key={c._id}
                        style={[styles.selectChip, postCommunityId === c._id && styles.selectChipActive, { marginRight: 6 }]}
                        onPress={() => setPostCommunityId(c._id)}
                      >
                        <Text style={[styles.selectChipText, postCommunityId === c._id && styles.selectChipTextActive]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Input
                label="Message / Details"
                value={postContent}
                onChangeText={setPostContent}
                placeholder="Write an official announcement, workout tip, or challenge update..."
                multiline
                numberOfLines={4}
                testID="admin-post-content-input"
              />

              <TouchableOpacity
                style={styles.pinToggleRow}
                onPress={() => setPostPinned((p) => !p)}
              >
                <Icon
                  name={postPinned ? 'CheckSquare' : 'Square'}
                  size={18}
                  color={postPinned ? Colors.primary[600] : Colors.textSecondary}
                />
                <Text style={styles.pinToggleText}>Pin post to top of Feed</Text>
              </TouchableOpacity>

              <Button
                title={createPostMutation.isPending ? 'Publishing...' : 'Publish Feed Post'}
                onPress={handleCreatePost}
                disabled={createPostMutation.isPending}
                testID="submit-admin-post-btn"
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ADMIN ONLY: Create Community Modal */}
      <Modal
        visible={communityModalVisible && isAdmin}
        transparent
        animationType="slide"
        onRequestClose={() => setCommunityModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCommunityModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Community</Text>
                <TouchableOpacity onPress={() => setCommunityModalVisible(false)}>
                  <Icon name="X" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Input
                label="Community Name"
                value={commName}
                onChangeText={setCommName}
                placeholder="e.g. Early Risers Run Club"
                testID="admin-community-name-input"
              />

              <Input
                label="Description"
                value={commDesc}
                onChangeText={setCommDesc}
                placeholder="Describe goals and how members participate..."
                multiline
                numberOfLines={3}
                testID="admin-community-desc-input"
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipRow}>
                {COMMUNITY_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.selectChip, commCategory === cat.key && styles.selectChipActive]}
                    onPress={() => setCommCategory(cat.key)}
                  >
                    <Text style={[styles.selectChipText, commCategory === cat.key && styles.selectChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Icon</Text>
              <View style={styles.iconRow}>
                {COMMUNITY_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconChoice, commIcon === ic && styles.iconChoiceActive]}
                    onPress={() => setCommIcon(ic)}
                  >
                    <Icon name={ic} size={18} color={commIcon === ic ? '#FFFFFF' : Colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Reward / Badge"
                value={commReward}
                onChangeText={setCommReward}
                placeholder="e.g. 500 XP + Iron Streak Badge"
              />

              <Input
                label="Auto-Sync Task Rule Hint"
                value={commTaskHint}
                onChangeText={setCommTaskHint}
                placeholder="How completed user tasks update this community"
              />

              <Button
                title={createCommunityMutation.isPending ? 'Creating...' : 'Create Community'}
                onPress={handleCreateCommunity}
                disabled={createCommunityMutation.isPending}
                testID="submit-admin-community-btn"
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerRoleAdmin: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  headerRoleMember: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  headerRoleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerRoleTextAdmin: {
    color: '#4338CA',
  },
  headerRoleTextMember: {
    color: '#047857',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.lg,
    padding: 4,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  activeTab: {
    backgroundColor: Colors.primary[50],
  },
  tabText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary[700],
    fontWeight: Typography.weights.bold,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionHeaderBlock: {
    marginBottom: Spacing.md,
  },
  bannerCard: {
    padding: Spacing.md,
    borderWidth: 1,
  },
  bannerCardAdmin: {
    backgroundColor: '#F5F7FF',
    borderColor: '#C7D2FE',
  },
  bannerCardMember: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconAdmin: {
    backgroundColor: '#E0E7FF',
  },
  bannerIconMember: {
    backgroundColor: '#DCFCE7',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  bannerDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  bannerActionBtn: {
    marginTop: Spacing.md,
  },
  subscribeBtn: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary[600],
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  subscribeBtnJoined: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  subscribeBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  subscribeBtnTextJoined: {
    color: '#047857',
  },
  quickTaskRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickTaskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
  },
  quickTaskBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
  },
  postCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  postAuthorCol: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  adminChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  adminChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4338CA',
  },
  pinnedChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  pinnedChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  timeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  deleteIconBtn: {
    padding: 6,
  },
  postTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  postContent: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  linkedCommunityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: Spacing.sm,
  },
  linkedCommunityText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary[700],
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
  },
  actionBtnActiveLike: {
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
  },
  joinPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  joinPostBtnActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  joinPostBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  joinPostBtnTextActive: {
    color: '#047857',
  },
  communityCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  communityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  communityIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityTitleCol: {
    flex: 1,
  },
  communityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  communityName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  categoryPill: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  communityMeta: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  communityDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  rewardText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: '#B45309',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  hintText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.primary[800],
  },
  communityActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  myProgressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  myProgressText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#047857',
  },
  notJoinedPill: {
    flex: 1,
  },
  notJoinedText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  joinCommBtn: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  leaveCommBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  joinCommBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  leaveCommBtnText: {
    color: '#047857',
  },
  subSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subSectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  leaderRank: {
    width: 24,
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
    color: Colors.primary[700],
  },
  leaderName: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  leaderTasks: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#047857',
  },
  emptyUpdatesText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  updateDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  updateText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  updateUser: {
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  updateTask: {
    fontWeight: Typography.weights.semibold,
    color: Colors.primary[700],
  },
  updateTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  fieldLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  selectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  selectChipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  selectChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  selectChipTextActive: {
    color: '#FFFFFF',
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  iconChoice: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[100],
  },
  iconChoiceActive: {
    backgroundColor: Colors.primary[600],
  },
  pinToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    marginTop: 4,
  },
  pinToggleText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
});
