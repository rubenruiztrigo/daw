
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/Layout';
import { SocialFeedV2 as SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { ProfileRoute } from './components/ProfileRoute';
import { MessagesView } from './components/MessagesView';
import { NewsHubView } from './components/NewsHubView';
import { CalendarView } from './components/CalendarView';
import { SearchResultsView } from './components/SearchResultsView';
import { SettingsView } from './components/SettingsView';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { NotificationsView } from './components/NotificationsView';
import { StoreView } from './components/StoreView';
import { ScrollManager } from './components/ScrollManager';
import { User, Post, Chat, Message, Notification, Comment, CalendarEvent } from './types';
import { supabase } from './supabaseClient';
import { Loader2, Clock, X } from 'lucide-react';
import { SearchRoute } from './components/SearchRoute';
import { PostDetailsModal } from './components/PostDetailsModal';
import { PostDetailView } from './components/PostDetailView';
import { RegistrationDetailsModal } from './components/RegistrationDetailsModal';
import { Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getSafeAvatar } from './utils/avatarUtils';

type AppView = 'feed' | 'profile' | 'messages' | 'news' | 'search' | 'settings' | 'notifications' | 'calendar';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('feed');
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [selectedPostFromNotify, setSelectedPostFromNotify] = useState<Post | null>(null);
  const [globalEvents, setGlobalEvents] = useState<CalendarEvent[]>([]);
  const [storeRewards, setStoreRewards] = useState<any[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<any[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [postsLimit, setPostsLimit] = useState(10);
  const [newsLimit, setNewsLimit] = useState(10);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [isLoadingMoreNews, setIsLoadingMoreNews] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [weeklyTrends, setWeeklyTrends] = useState<{ tag: string, count: number }[]>([]);
  const [selectedRegistrationUserId, setSelectedRegistrationUserId] = useState<string | null>(null);

  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [followerUserIds, setFollowerUserIds] = useState<Set<string>>(new Set());

  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);


  const fetchUserProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) {
      setCurrentUserData({
        id: data.id,
        name: data.name,
        lastName: data.last_name,
        username: data.username,
        email: data.email,
        position: data.position || 'Personal Público',
        department: data.department || 'Administración',
        jobCategory: data.job_category,
        avatar: getSafeAvatar(data.avatar),
        bio: data.bio || '',
        interests: data.interests || [],
        followers: data.followers_count || 0,
        following: data.following_count || 0,
        country: data.country,
        region: data.region,
        joinedDate: data.created_at,
        novas: data.novas || 0,
        isAdmin: data.is_admin || false,
        isOrganization: data.is_organization || false,
        organizationName: data.name,
        organizationObjective: data.bio || '',
        roleDescription: data.role_description,
        administrationType: data.administration_type,
        status: data.status,
        chatSettings: data.chat_settings,
        notificationSettings: data.notification_settings,
        linkedOrganizationId: data.linked_organization_id || data.linkedOrganizationId || null
      });
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      setUsers(data.map((u: any) => ({
        id: u.id,
        name: u.name,
        lastName: u.last_name,
        username: u.username,
        email: u.email,
        position: u.position || 'Personal Público',
        department: u.department || 'Administración',
        jobCategory: u.job_category,
        avatar: getSafeAvatar(u.avatar),
        bio: u.bio || '',
        interests: u.interests || [],
        followers: u.followers_count || 0,
        following: u.following_count || 0,
        country: u.country,
        region: u.region,
        joinedDate: u.created_at,
        novas: u.novas || 0,
        isAdmin: u.is_admin || false,
        isOrganization: u.is_organization || false,
        organizationName: u.name,
        organizationObjective: u.bio || '',
        roleDescription: u.role_description,
        administrationType: u.administration_type,
        status: u.status,
        chatSettings: u.chat_settings,
        notificationSettings: u.notification_settings,
        linkedOrganizationId: u.linked_organization_id || u.linkedOrganizationId || null
      })));
    }
  }, []);

  const fetchFollows = useCallback(async () => {
    if (!session?.user) return;
    const { data: following } = await supabase.from('follows').select('followed_id').eq('follower_id', session.user.id);
    const { data: followers } = await supabase.from('follows').select('follower_id').eq('followed_id', session.user.id);
    setFollowedUserIds(new Set(following?.map(f => f.followed_id) || []));
    setFollowerUserIds(new Set(followers?.map(f => f.follower_id) || []));
  }, [session?.user?.id]);

  const handleToggleFollow = useCallback(async (userId: string) => {
    if (!session?.user || userId === session.user.id) return;
    const isCurrentlyFollowing = followedUserIds.has(userId);
    const newFollowedSet = new Set(followedUserIds);
    if (isCurrentlyFollowing) {
      newFollowedSet.delete(userId);
    } else {
      newFollowedSet.add(userId);
    }
    setFollowedUserIds(newFollowedSet);
    try {
      if (isCurrentlyFollowing) {
        await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('followed_id', userId);
      } else {
        await supabase.from('follows').insert({ follower_id: session.user.id, followed_id: userId });
        await supabase.from('notifications').insert({ user_id: userId, sender_id: session.user.id, type: 'follow', content: `ha comenzado a seguirte` });
      }
      await Promise.all([fetchFollows(), fetchUsers()]);
    } catch (error) {
      console.error('Error toggling follow:', error);
      fetchFollows();
    }
  }, [session, followedUserIds]);

  const fetchChats = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    try {
      // Intentar obtener mensajes con joins (forma ideal)
      let { data: messages, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(*), recipient:profiles!recipient_id(*)')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      // Si falla el Join o no devuelve nada pero el usuario dice que hay datos,
      // intentamos una consulta simple sin joins por si el cache de relaciones está mal
      if (error || !messages || messages.length === 0) {
        const { data: simpleMessages, error: simpleError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: true });

        if (!simpleError && simpleMessages && simpleMessages.length > 0) {
          messages = simpleMessages;
        }
      }

      if (messages && messages.length > 0) {
        const chatGroups = new Map<string, Chat>();

        messages.forEach((m: any) => {
          const isSender = m.sender_id === userId;
          const otherId = isSender ? m.recipient_id : m.sender_id;

          if (!otherId) return;

          const getProfile = (p: any) => Array.isArray(p) ? p[0] : p;
          const joinedProfile = getProfile(isSender ? m.recipient : m.sender);

          // Fallback: Si no viene en el join, buscar en nuestra lista local de usuarios
          const localProfile = users.find(u => u.id === otherId);

          if (!chatGroups.has(otherId)) {
            chatGroups.set(otherId, {
              id: otherId,
              participant: {
                id: otherId,
                name: joinedProfile?.name || localProfile?.name || 'Usuario',
                lastName: joinedProfile?.last_name || localProfile?.lastName || '',
                username: joinedProfile?.username || localProfile?.username || '',
                avatar: getSafeAvatar(joinedProfile?.avatar || localProfile?.avatar),
                position: joinedProfile?.position || localProfile?.position || '',
                department: joinedProfile?.department || localProfile?.department || '',
                chatSettings: joinedProfile?.chat_settings || localProfile?.chatSettings
              },
              messages: [],
              lastMessage: '',
              timestamp: new Date()
            });
          }

          const chat = chatGroups.get(otherId)!;
          const msgDate = m.created_at ? new Date(m.created_at) : new Date();

          const message = {
            id: m.id,
            senderId: m.sender_id,
            recipientId: m.recipient_id,
            text: m.text || '',
            timestamp: msgDate,
            isRead: m.is_read,
            postId: m.post_id,
            isPostShare: !!m.post_id,
            sharedProfile: m.shared_profile,
            sharedProfileId: m.shared_profile_id,
            sharedEventId: m.shared_event_id,
            sharedEvent: m.shared_event,
            updated_at: m.updated_at,
            is_deleted: m.is_deleted
          };

          chat.messages.push(message);

          // Generar un resumen legible para la barra lateral
          let summary = (m.text || '').trim();
          const trimmedText = (m.text || '').trim();
          // Strict detection: Base64 or very long technical strings without spaces
          const imageRegex = /https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?/i;
          const isBase64 = trimmedText.includes('data:image') || trimmedText.includes(';base64,');
          const isDirectUrl = !!trimmedText.match(/^https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i);
          const hasImageInText = !!trimmedText.match(imageRegex);

          const isImage = isBase64 || isDirectUrl || hasImageInText;
          const isProbablyData = !isImage && !trimmedText.startsWith('http') && (trimmedText.includes(';base64,') || (trimmedText.length > 60 && !trimmedText.includes(' ')));

          if (m.is_deleted) {
            summary = isSender ? `Eliminaste este mensaje` : `Este mensaje ha sido eliminado`;
          } else if (isProbablyData) summary = `📁 Adjunto`;
          else if (m.post_id) summary = `📝 Post compartido`;
          else if (m.shared_profile_id || m.shared_profile) summary = `👤 Perfil compartido`;
          else if (m.shared_event_id || m.shared_event) summary = `📅 Evento compartido`;
          else if (isImage) summary = `Imagen`;
          else if (trimmedText.startsWith('http')) summary = `🔗 Enlace`;
          else summary = trimmedText;

          chat.lastMessage = summary;
          chat.timestamp = msgDate;
        });

        const sortedChats = Array.from(chatGroups.values()).sort((a, b) => {
          const tA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const tB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return tB - tA;
        });

        setChats(sortedChats);
      } else {
        setChats([]);
      }
    } catch (err) {
      console.error('Crash in fetchChats:', err);
    }
  }, [session?.user?.id, users]);


  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*, sender:profiles!sender_id(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type,
        senderName: n.sender ? `${n.sender.name} ${n.sender.last_name || ''}` : '',
        senderId: n.sender_id,
        senderAvatar: getSafeAvatar(n.sender?.avatar),
        content: n.content,
        timestamp: n.created_at,
        isRead: n.is_read,
        postId: n.post_id
      })));
    }
  }, [session?.user?.id]);

  const fetchGlobalEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (!error && data) {
        setGlobalEvents(data.map(ev => ({
          id: ev.id,
          creator_id: ev.creator_id,
          title: ev.title,
          type: ev.type,
          event_date: ev.event_date,
          event_time: ev.event_time,
          location: ev.location,
          description: ev.description,
          attendees: ev.attendees_count
        })));
      }
    } catch (err) {
      console.error('Error fetching global events:', err);
    }
  }, []);

  const fetchStoreRewards = useCallback(async () => {
    const { data, error } = await supabase.from('rewards').select('*').order('cost_novas', { ascending: true });
    if (!error && data) {
      setStoreRewards(data);
    }
  }, []);

  const fetchUserRedemptions = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('user_rewards').select('*').eq('user_id', session.user.id);
    if (!error && data) {
      setUserRedemptions(data);
    }
  }, [session?.user?.id]);

  const handleApproveUser = async (userId: string, notificationId: string) => {
    if (!session?.user || !currentUserData?.isAdmin) return;
    const { error } = await supabase.rpc('fn_resolve_registration', {
      p_user_id: userId,
      p_notification_id: notificationId,
      p_approve: true
    });
    if (error) {
      console.error("Error approving user:", error);
      alert("Error al aprobar usuario: " + error.message);
    } else {
      fetchFeed(); // Refresh to see active user
      fetchNotifications();
    }
  };

  const handleRejectUser = async (userId: string, notificationId: string) => {
    if (!session?.user || !currentUserData?.isAdmin) return;
    const { error } = await supabase.rpc('fn_resolve_registration', {
      p_user_id: userId,
      p_notification_id: notificationId,
      p_approve: false
    });
    if (error) {
      console.error("Error rejecting user:", error);
      alert("Error al rechazar usuario: " + error.message);
    } else {
      fetchNotifications();
    }
  };

  const handleApproveRedemption = async (userId: string, rewardId: string, notificationId: string) => {
    if (!session?.user || !currentUserData?.isAdmin) return;

    const { error } = await supabase.rpc('fn_resolve_reward', {
      p_user_id: userId,
      p_reward_id: rewardId,
      p_notification_id: notificationId,
      p_approve: true
    });

    if (error) {
      console.error("Error approving reward:", error);
      alert("Error al aprobar canje: " + error.message);
    } else {
      fetchUserRedemptions();
      fetchNotifications();
    }
  };

  const handleRedeemReward = async (rewardId: string, rewardName: string) => {
    if (!session?.user || !currentUserData) return;

    const { error } = await supabase.rpc('fn_request_reward', {
      p_reward_id: rewardId
    });

    if (error) {
      console.error("Error redeeming reward:", error);
      alert("Error al canjear: " + error.message);
    } else {
      fetchUserRedemptions();
    }
  };

  const fetchWeeklyTrends = useCallback(async () => {
    if (!session?.user) return;

    try {
      const now = new Date();
      const currentDay = now.getDay();
      const diffToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const [{ data: postsTags }, { data: newsTags }] = await Promise.all([
        supabase.from('posts').select('tags').gte('created_at', monday.toISOString()).lte('created_at', sunday.toISOString()),
        supabase.from('news').select('tags').gte('created_at', monday.toISOString()).lte('created_at', sunday.toISOString())
      ]);

      const counts: Record<string, number> = {};
      const processTags = (data: { tags: string[] | null }[] | null) => {
        data?.forEach(item => {
          item.tags?.forEach(tag => {
            const cleanTag = tag.trim();
            if (cleanTag) counts[cleanTag] = (counts[cleanTag] || 0) + 1;
          });
        });
      };

      processTags(postsTags);
      processTags(newsTags);

      const topTags = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag, count]) => ({ tag, count }));

      setWeeklyTrends(topTags);
    } catch (err) {
      console.error("Error fetching weekly trends:", err);
    }
  }, [session]);
  const fetchFeed = useCallback(async () => {
    if (!session?.user) return;
    try {
      const [
        { data: postsData },
        { data: newsData },
        { data: postComments },
        { data: newsComments },
        { data: commentReplies },
        { data: myPostLikes },
        { data: myNewsVotes },
        { data: myReposts }
      ] = await Promise.all([
        supabase.from('posts').select('*, is_pinned, pinned_at, author:profiles!author_id(*)').order('created_at', { ascending: false }).range(0, postsLimit - 1),
        supabase.from('news').select('*, is_pinned, pinned_at, author:profiles!author_id(*)').order('created_at', { ascending: false }).range(0, newsLimit - 1),
        supabase.from('post_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
        supabase.from('news_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
        supabase.from('comment_replies').select('*, author:profiles!author_id(*)').order('created_at', { ascending: true }),
        supabase.from('post_likes').select('post_id, vote_type').eq('user_id', session.user.id),
        supabase.from('news_votes').select('news_id, vote_type').eq('user_id', session.user.id),
        supabase.from('reposts').select('post_id, news_id').eq('user_id', session.user.id)
      ]);

      setHasMorePosts(postsData && postsData.length === postsLimit ? true : false);
      setHasMoreNews(newsData && newsData.length === newsLimit ? true : false);


      console.log('Fetched postsData:', postsData?.length, 'items. Pinned count:', postsData?.filter(p => p.is_pinned).length);
      console.log('Fetched newsData:', newsData?.length, 'items. Pinned count:', newsData?.filter(p => p.is_pinned).length);

      const commentsMap = new Map<string, Comment[]>();
      const repliesMap = new Map<string, any[]>();
      const allRepliesById = new Map<string, any>();

      // First pass: create objects for all replies and index by ID
      commentReplies?.forEach((r: any) => {
        const replyObj = {
          id: r.id,
          commentId: r.comment_id,
          parentReplyId: r.parent_reply_id,
          authorId: r.author_id,
          authorName: `${r.author?.name} ${r.author?.last_name || ''}`,
          authorUsername: r.author?.username || r.author?.name?.toLowerCase().replace(/\s/g, ''),
          authorAvatar: getSafeAvatar(r.author?.avatar),
          text: r.text,
          timestamp: r.created_at,
          replies: []
        };
        allRepliesById.set(r.id, replyObj);
      });

      // Second pass: build the tree
      commentReplies?.forEach((r: any) => {
        const replyObj = allRepliesById.get(r.id);
        if (r.parent_reply_id && allRepliesById.has(r.parent_reply_id)) {
          // Nest under parent reply
          const parent = allRepliesById.get(r.parent_reply_id);
          parent.replies.push(replyObj);
        } else {
          // Top level reply for this comment
          const targetId = r.comment_id;
          const list = repliesMap.get(targetId) || [];
          list.push(replyObj);
          repliesMap.set(targetId, list);
        }
      });

      const processComments = (data: any[], idField: string) => {
        data?.forEach((c: any) => {
          const targetId = c[idField];
          const list = commentsMap.get(targetId) || [];
          list.push({
            id: c.id,
            authorId: c.author_id,
            authorName: `${c.author?.name} ${c.author?.last_name || ''}`,
            authorUsername: c.author?.username || c.author?.name?.toLowerCase().replace(/\s/g, ''),
            authorAvatar: getSafeAvatar(c.author?.avatar),
            text: c.text,
            timestamp: c.created_at,
            replies: repliesMap.get(c.id) || []
          });
          commentsMap.set(targetId, list);
        });
      };
      processComments(postComments || [], 'post_id');
      processComments(newsComments || [], 'news_id');

      const upvotedIds = new Set([
        ...(myPostLikes?.filter(l => l.vote_type === 'up').map(l => l.post_id) || []),
        ...(myNewsVotes?.filter(l => l.vote_type === 'up').map(l => l.news_id) || [])
      ]);
      const downvotedIds = new Set([
        ...(myPostLikes?.filter(l => l.vote_type === 'down').map(l => l.post_id) || []),
        ...(myNewsVotes?.filter(l => l.vote_type === 'down').map(l => l.news_id) || [])
      ]);
      const repostedIds = new Set([
        ...(myReposts?.map(r => r.post_id).filter(Boolean) || []),
        ...(myReposts?.map(r => r.news_id).filter(Boolean) || [])
      ]);

      const mapPosts = (items: any[], type: 'post' | 'news') => items?.map(p => ({
        id: p.id,
        authorId: p.author_id,
        authorName: `${p.author?.name} ${p.author?.last_name || ''}`,
        authorUsername: p.author?.username || p.author?.name.toLowerCase().replace(/\s/g, ''),
        authorPosition: p.author?.position,
        authorAvatar: getSafeAvatar(p.author?.avatar),
        title: p.titulo,
        content: p.content,
        imageUrl: p.image_url || [],
        docUrl: p.doc_url,
        docName: p.doc_name,
        timestamp: p.created_at,
        type: type,
        tags: p.tags || [],
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        reposts: p.reposts_count || 0,
        commentsList: commentsMap.get(p.id) || [],
        userLiked: upvotedIds.has(p.id),
        userDownvoted: downvotedIds.has(p.id),
        userReposted: repostedIds.has(p.id),
        isPinned: p.is_pinned,
        pinnedAt: p.pinned_at
      })) || [];

      const allPosts = [...mapPosts(postsData || [], 'post'), ...mapPosts(newsData || [], 'news')];
      setPosts(allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } finally {
      setIsLoadingMorePosts(false);
      setIsLoadingMoreNews(false);
      setIsLoadingFeed(false);
    }
  }, [session?.user?.id, postsLimit, newsLimit]);

  const handleLoadMorePosts = useCallback(async () => {
    if (isLoadingMorePosts || !hasMorePosts) return;
    setIsLoadingMorePosts(true);
    setPostsLimit(prev => prev + 10);
  }, [isLoadingMorePosts, hasMorePosts]);

  const handleLoadMoreNews = useCallback(async () => {
    if (isLoadingMoreNews || !hasMoreNews) return;
    setIsLoadingMoreNews(true);
    setNewsLimit(prev => prev + 10);
  }, [isLoadingMoreNews, hasMoreNews]);

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string) => {
    if (!session?.user) return;
    const isNews = type === 'news';
    const table = isNews ? 'news' : 'posts';

    if (isNews) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error: countError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', session.user.id)
        .gte('created_at', today.toISOString());

      if (countError) {
        console.error("Error al consultar el límite de noticias:", countError);
      }

      if (count !== null && count >= 2) {
        showToast("Solo puedes publicar hasta 2 noticias por día.", "error");
        return;
      }
    }

    const payload: any = {
      author_id: session.user.id,
      content,
      tags: tags || [],
      image_url: imageUrls || []
    };

    if (isNews && title) {
      payload.titulo = title;
    }

    if (!isNews) {
      payload.doc_url = docUrl || null;
      payload.doc_name = docName || null;
      payload.event_id = eventId || null;
    }

    try {
      const { data, error } = await supabase.from(table)
        .insert(payload)
        .select('*, author:profiles!author_id(*)')
        .single();

      if (!error && data) {
        console.log(`✅ Publicado correctamente en ${table}`);

        // Optimistic update: map the new record to our Post type and add it to state immediately
        const newPost: Post = {
          id: data.id,
          authorId: data.author_id,
          authorName: `${data.author?.name} ${data.author?.last_name || ''}`,
          authorUsername: data.author?.username || data.author?.name.toLowerCase().replace(/\s/g, ''),
          authorPosition: data.author?.position,
          authorAvatar: getSafeAvatar(data.author?.avatar),
          title: data.titulo,
          content: data.content,
          imageUrl: data.image_url || [],
          docUrl: data.doc_url,
          docName: data.doc_name,
          timestamp: data.created_at,
          type: isNews ? 'news' : 'post',
          tags: data.tags || [],
          likes: 0,
          comments: 0,
          reposts: 0,
          commentsList: [],
          userLiked: false,
          userDownvoted: false,
          userReposted: false
        };

        setPosts(prev => [newPost, ...prev]);

        // Removed fetchFeed() here because the newPost already contains the full data
        // from the insert(...).select() call. Calling fetchFeed() in the background
        // causes a flicker if it resolves before the database fully indexes the new row.
      } else {
        console.error(`❌ Error de Supabase al insertar en ${table}:`, error);
        alert(`No se pudo publicar: ${error.message}`);
      }
    } catch (err: any) {
      console.error("❌ Error inesperado al publicar:", err);
      alert("Ocurrió un error inesperado al publicar la noticia.");
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const table = post.type === 'news' ? 'news_comments' : 'post_comments';
    const idField = post.type === 'news' ? 'news_id' : 'post_id';
    const { error } = await supabase.from(table).insert({ [idField]: postId, author_id: session.user.id, text });
    if (!error) {
      if (post.authorId !== session.user.id) {
        await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `ha hecho un comentario en tu ${post.type === 'news' ? 'noticia' : 'post'}`, post_id: postId });
      }
      fetchFeed();
    }
  };

  const handleAddReply = async (commentId: string, text: string, parentReplyId?: string) => {
    if (!session?.user) {
      console.error("No session user found for reply");
      return;
    }
    console.log("💾 Attempting to save reply:", { commentId, text, parentReplyId, userId: session.user.id });
    const payload: any = {
      comment_id: commentId,
      author_id: session.user.id,
      text
    };
    if (parentReplyId) payload.parent_reply_id = parentReplyId;

    const { data, error } = await supabase.from('comment_replies').insert(payload).select();

    if (error) {
      console.error("❌ Error adding reply:", error);
      alert("Error al guardar respuesta: " + error.message);
    } else {
      console.log("✅ Reply saved successfully:", data);

      // Find who were we replying to (either a comment or another reply)
      let recipientId: string | null = null;
      let notificationContent = "ha respondido a tu comentario";

      if (parentReplyId) {
        // Find the parent reply
        const allReplies = posts.flatMap(p => p.commentsList.flatMap(c => c.replies || []));
        const parentReply = allReplies.find(r => r.id === parentReplyId);
        if (parentReply) {
          recipientId = parentReply.authorId;
          notificationContent = "ha respondido a tu respuesta";
        }
      } else {
        // Find the root comment
        const comment = [...(posts.flatMap(p => p.commentsList))].find(c => c.id === commentId);
        if (comment) {
          recipientId = comment.authorId || null;
        }
      }

      if (recipientId && recipientId !== session.user.id) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          sender_id: session.user.id,
          type: 'comment',
          content: notificationContent,
          post_id: null
        });
      }

      fetchFeed();
    }
  };

  const handleVote = async (id: string, dir: 'up' | 'down') => {
    if (isVoting || !session?.user) return;
    setIsVoting(true);
    console.log('🚀 handleVote triggered:', { id, dir });

    try {
      const post = posts.find(p => p.id === id);
      if (!post) {
        console.warn('Post not found for vote:', id);
        return;
      }
      const isNews = post.type === 'news';
      const table = isNews ? 'news_votes' : 'post_likes';
      const idField = isNews ? 'news_id' : 'post_id';

      const { data: existingVote } = await supabase.from(table).select('*').eq('user_id', session.user.id).eq(idField, id).maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === dir) {
          console.log('🗑️ Removing existing vote');
          await supabase.from(table).delete().eq('user_id', session.user.id).eq(idField, id);
        } else {
          console.log('🔄 Updating vote type');
          await supabase.from(table).update({ vote_type: dir }).eq('user_id', session.user.id).eq(idField, id);
        }
      } else {
        console.log('➕ Creating new vote');
        await supabase.from(table).insert({ user_id: session.user.id, [idField]: id, vote_type: dir });
      }

      await fetchFeed();
    } catch (error) {
      console.error('Error in handleVote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleRepost = async (id: string) => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const isNews = post.type === 'news';
    const idField = isNews ? 'news_id' : 'post_id';

    try {
      const { data: existing } = await supabase.from('reposts').select('id').eq('user_id', session.user.id).eq(idField, id).maybeSingle();

      if (existing) {
        await supabase.from('reposts').delete().eq('id', existing.id);
      } else {
        await supabase.from('reposts').insert({ user_id: session.user.id, [idField]: id });

        // Notify author
        if (post.authorId !== session.user.id) {
          await supabase.from('notifications').insert({
            user_id: post.authorId,
            sender_id: session.user.id,
            type: 'repost',
            content: 'ha compartido tu publicación',
            post_id: id
          });
        }
      }
      await fetchFeed();
    } catch (error) {
      console.error('Error in handleRepost:', error);
    }
  };

  const handleSearchHashtag = (tag: string) => {
    setSearchQuery(tag);
    navigate(`/buscar?q=${encodeURIComponent(tag)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNotificationClick = (postId?: string) => {
    if (!postId) return;
    const post = posts.find(p => p.id === postId);
    if (post) setSelectedPostFromNotify(post);
  };

  const handleDeletePost = async (postId: string) => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const { error } = await supabase.rpc('fn_delete_post_secure', {
      p_post_id: postId,
      p_author_id: session.user.id,
      p_type: post.type
    });

    if (!error) {
      await fetchFeed();
      // If we are in the detail view for this post, go back to the correct section
      const isPostDetail = location.pathname.startsWith('/inicio/') || location.pathname.startsWith('/noticias/');
      if (isPostDetail && location.pathname.includes(postId)) {
        navigate(post.type === 'news' ? '/noticias' : '/inicio');
      }
    } else {
      console.error('Error deleting post:', error.message);
      alert('Error al eliminar el post: ' + error.message);
    }
  };

  const handleTogglePin = async (postId: string) => {
    console.log('handleTogglePin called for:', postId);
    if (!session?.user) {
      console.log('No session user found');
      return;
    }
    const post = posts.find(p => p.id === postId);
    if (!post) {
      console.log('Post not found in state:', postId);
      return;
    }

    const isPinned = !post.isPinned;
    const table = post.type === 'news' ? 'news' : 'posts';

    console.log(`Toggling pin: ${isPinned} on table: ${table} for user: ${session.user.id}`);

    const { data: updatedData, error } = await supabase
      .from(table)
      .update({
        is_pinned: isPinned,
        pinned_at: isPinned ? new Date().toISOString() : null
      })
      .eq('id', postId)
      .eq('author_id', session.user.id)
      .select();

    if (!error) {
      console.log('Pin update result:', updatedData);
      if (updatedData && updatedData.length > 0) {
        console.log('Pin toggled successfully in Supabase for:', postId);
      } else {
        console.warn('Success reported by Supabase but 0 rows were updated. Check author_id mismatch or RLS.');
        // Debug: Log the post author_id if available
        if (post.authorId !== session.user.id) {
          console.error(`Mismatch: Post authorId is ${post.authorId}, but session user is ${session.user.id}`);
        }
      }
      await fetchFeed();
    } else {
      console.error('Error toggling pin:', error.message);
      alert('Error al anclar/desanclar el post: ' + error.message);
    }
  };

  const handleSendMessage = async (recipientId: string, text: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('messages').insert({ sender_id: session.user.id, recipient_id: recipientId, text });
    if (!error) fetchChats();
  };

  const handleEditMessage = async (recipientId: string, messageId: string, text: string) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('messages')
      .update({ text, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', session.user.id);

    if (!error) {
      await fetchChats();
    } else {
      console.error('Error editing message:', error.message);
      alert('Error al editar el mensaje: ' + error.message);
      throw error;
    }
  };

  const handleDeleteMessage = async (recipientId: string, messageId: string) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', session.user.id);

    if (!error) {
      await fetchChats();
    } else {
      console.error('Error deleting message:', error.message);
      alert('Error al eliminar el mensaje: ' + error.message);
    }
  };

  const handleMarkChatAsRead = useCallback(async (chatId: string) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_id', session.user.id)
      .eq('sender_id', chatId)
      .eq('is_read', false);

    if (!error) {
      fetchChats();
    }
  }, [session?.user?.id, fetchChats]);

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    navigate(`/buscar?q=${encodeURIComponent(query)}`);
  };

  const handleStartChat = (targetUser: User) => {
    setActiveChatUserId(targetUser.id);
    navigate(`/mensajes/${targetUser.username || targetUser.id}`);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    // Actualización optimista en memoria para que la imagen de perfil cambie al instante
    setCurrentUserData(prev => {
      if (!prev || prev.id !== updatedUser.id) return prev;
      return { ...prev, ...updatedUser };
    });

    // Actualizar también la lista de usuarios en memoria
    setUsers(prev =>
      prev.map(u => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );

    // Actualizar avatar del participante en los chats existentes
    setChats(prev =>
      prev.map(chat =>
        chat.participant.id === updatedUser.id
          ? {
              ...chat,
              participant: {
                ...chat.participant,
                avatar: updatedUser.avatar,
                name: updatedUser.name,
                lastName: updatedUser.lastName,
                username: updatedUser.username,
              },
            }
          : chat
      )
    );

    // Actualizar avatar del autor en los posts ya cargados
    setPosts(prev =>
      prev.map(p =>
        p.authorId === updatedUser.id
          ? {
              ...p,
              authorAvatar: updatedUser.avatar,
              authorName: `${updatedUser.name} ${updatedUser.lastName || ''}`,
              authorUsername:
                updatedUser.username ||
                updatedUser.name.toLowerCase().replace(/\s/g, ''),
            }
          : p
      )
    );

    const { error } = await supabase
      .from('profiles')
      .update({
        name: updatedUser.name,
        last_name: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        gender: updatedUser.gender,
        birth_date: updatedUser.birthDate || null,
        position: updatedUser.position,
        department: updatedUser.department,
        job_category: updatedUser.jobCategory,
        administration_type: updatedUser.administrationType,
        country: updatedUser.country,
        region: updatedUser.region,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        avatar: updatedUser.avatar,
        linked_organization_id: updatedUser.linkedOrganizationId ?? null,
        // Mapping organizationName to 'name' and organizationObjective to 'bio'
        // since organization_name and organization_objective columns don't exist
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedUser.id);

    if (error) {
      console.error('Profile update error details:', JSON.stringify(error));
      // En caso de error, recargar desde la BD para no dejar un estado inconsistente
      await fetchUserProfile(updatedUser.id);
      throw error;
    }

    // Refrescar desde la BD para asegurarnos de que todo queda sincronizado
    await fetchUserProfile(updatedUser.id);
  };

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      if (q !== searchQuery) setSearchQuery(q);
    } else if (['/inicio', '/noticias'].includes(location.pathname)) {
      setSearchQuery('');
    }
  }, [location.pathname, searchParams]); // REMOVED searchQuery from dependencies to prevent clearing while typing
  /* eslint-disable-next-line react-hooks/exhaustive-deps */

  const handleMarkNotificationsRead = useCallback(async (tab?: string, adminSubTab?: string) => {
    if (!session?.user) return;

    let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);

    if (tab === 'mentions') {
      query = query.eq('type', 'mention');
    } else if (tab === 'followers') {
      query = query.eq('type', 'follow');
    } else if (tab === 'all') {
      // Non-admin "all" notifications
      query = query.not('type', 'in', '("registration_request","reward_request")');
    } else if (tab === 'admin') {
      if (adminSubTab === 'solicitudes') {
        query = query.or('type.eq.registration_request,and(type.eq.system,or(content.ilike.%solicitud%,content.ilike.%aprobado%,content.ilike.%rechazado%)),not(content.ilike.%canje%)');
      } else if (adminSubTab === 'recompensas') {
        query = query.or('type.eq.reward_request,type.eq.reward_accepted,content.ilike.%canje%');
      } else {
        query = query.or('type.eq.registration_request,type.eq.reward_request,type.eq.reward_accepted,content.ilike.%solicitud%,content.ilike.%canje%');
      }
    } else if (tab === 'rewards') {
      query = query.or('type.eq.reward_request,type.eq.reward_accepted,content.ilike.%canje%');
    }

    const { error } = await query;
    if (!error) fetchNotifications();
  }, [session?.user?.id, fetchNotifications]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile(session.user.id);
      fetchFeed();
      fetchUsers();
      fetchFollows();
      fetchUserRedemptions();
      fetchNotifications();
      fetchGlobalEvents();
      fetchStoreRewards();
      fetchWeeklyTrends();
    }
  }, [session, fetchUserProfile, fetchFeed, fetchUsers, fetchFollows, fetchUserRedemptions, fetchNotifications, fetchGlobalEvents, fetchStoreRewards, fetchWeeklyTrends]);

  useEffect(() => {
    if (session?.user && users.length > 0) {
      fetchChats();
    }
  }, [session, users.length, fetchChats]);

  useEffect(() => {
    if (session?.user) {
      const channel = supabase
        .channel('app_realtime_sync')
        .on('postgres_changes' as any, { event: '*', table: 'posts', schema: 'public' } as any, (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new?.author_id === session?.user?.id) return;
          fetchFeed();
        })
        .on('postgres_changes' as any, { event: '*', table: 'news', schema: 'public' } as any, (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new?.author_id === session?.user?.id) return;
          fetchFeed();
        })
        .on('postgres_changes' as any, { event: '*', table: 'profiles', schema: 'public' } as any, () => {
          if (session?.user) fetchUserProfile(session.user.id);
          fetchUsers();
        })
        .on('postgres_changes' as any, { event: '*', table: 'follows', schema: 'public' } as any, () => {
          fetchFollows();
          fetchUsers();
        })
        .on('postgres_changes' as any, { event: '*', table: 'messages', schema: 'public' } as any, () => {
          fetchChats();
        })
        .on('postgres_changes' as any, { event: '*', table: 'notifications', schema: 'public', filter: `user_id=eq.${session.user.id}` } as any, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, fetchFeed, fetchUsers, fetchFollows, fetchChats, fetchUserProfile]);

  const handleViewChange = (view: AppView) => {
    if (view === 'profile') setViewingUserId(currentUserData?.id || null);
    if (view === 'notifications') handleMarkNotificationsRead();
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewRegistrationData = (userId: string) => {
    setSelectedRegistrationUserId(userId);
  };

  const handleNavigateToProfile = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    const identifier = targetUser?.username || userId;
    navigate(`/${identifier}`);
  };

  const handleNavigateToPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post?.type === 'news') {
      navigate(`/noticias/${postId}`);
    } else {
      navigate(`/inicio/${postId}`);
    }
  };

  const PendingApprovalView = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
      <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-3xl p-10 text-center shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-zinc-800">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Clock size={40} className="animate-pulse" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Solicitud en revisión</h3>
        <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed font-medium">
          Tu registro ha sido completado con éxito. Un administrador debe revisar y aprobar tu solicitud para que puedas acceder a la red.
          <br /><br />
          Recibirás una notificación cuando tu cuenta esté activa.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center space-x-2"
        >
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  const RejectedApprovalView = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
      <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-3xl p-10 text-center shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-zinc-800">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <X size={40} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Solicitud rechazada</h3>
        <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed font-medium">
          Lo sentimos, tu solicitud de registro ha sido rechazada por los administradores de la plataforma.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  if (isLoadingAuth || (!currentUserData && session)) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>;

  // Status-based redirection logic
  if (session && currentUserData) {
    if (currentUserData.status === 'pending') return <PendingApprovalView />;
    if (currentUserData.status === 'rejected') return <RejectedApprovalView />;
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ScrollManager />
      <Routes>
        <Route path="/inicio-sesion" element={!session ? <Login onLogin={() => navigate('/inicio')} onRegister={() => navigate('/registro')} /> : <Navigate to="/inicio" replace />} />
        <Route path="/registro" element={!session ? <Onboarding onComplete={() => navigate('/inicio-sesion')} onCancel={() => navigate('/inicio-sesion')} /> : <Navigate to="/inicio" replace />} />

        <Route path="*" element={
          !session ? (
            <Navigate to="/inicio-sesion" replace />
          ) : (
            <Layout
              currentView={currentView}
              onViewChange={handleViewChange}
              user={currentUserData!}
              notifications={notifications}
              posts={posts}
              chats={chats}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              isViewingOwnProfile={!viewingUserId || viewingUserId === currentUserData?.id}
              onLogout={() => supabase.auth.signOut()}
              globalEvents={globalEvents}
              theme={theme}
              onThemeChange={setTheme}
              language="es"
              onRefresh={fetchFeed}
              isLoading={isLoadingFeed}
              trendingTags={weeklyTrends}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/inicio" replace />} />
                <Route path="/inicio" element={<SocialFeed posts={posts.filter(p => p.type === 'post')} user={currentUserData!} onLike={(id) => handleVote(id, 'up')} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} users={users} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={handleNavigateToPost} followedUserIds={followedUserIds} onSearchHashtag={handleSearchHashtag} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={handleSearchSubmit} globalEvents={globalEvents} chats={chats} onShareViaChat={handleSendMessage} language="es" onLoadMore={handleLoadMorePosts} hasMore={hasMorePosts} isLoadingMore={isLoadingMorePosts} />} />
                <Route path="/noticias" element={<NewsHubView posts={posts.filter(p => p.type === 'news')} user={currentUserData!} onVote={(id, dir) => handleVote(id, dir)} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} currentUser={currentUserData!} users={users} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={handleNavigateToPost} followedUserIds={followedUserIds} onSearchHashtag={handleSearchHashtag} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={handleSearchSubmit} onLoadMore={handleLoadMoreNews} hasMore={hasMoreNews} isLoadingMore={isLoadingMoreNews} language="es" />} />
                <Route path="/calendario" element={<CalendarView language={'es'} />} />
                <Route path="/mensajes/:chatId" element={<MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={handleSendMessage} onEditMessage={handleEditMessage} onDeleteMessage={handleDeleteMessage} onNavigateToProfile={handleNavigateToProfile} onMarkChatAsRead={handleMarkChatAsRead} externalActiveId={activeChatUserId} users={users} globalEvents={globalEvents} language={'es'} />} />
                <Route path="/mensajes" element={<MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={handleSendMessage} onEditMessage={handleEditMessage} onDeleteMessage={handleDeleteMessage} onNavigateToProfile={handleNavigateToProfile} onMarkChatAsRead={handleMarkChatAsRead} externalActiveId={activeChatUserId} users={users} globalEvents={globalEvents} language={'es'} />} />
                <Route path="/notificaciones" element={<NotificationsView notifications={notifications} onMarkAllRead={handleMarkNotificationsRead} onNotificationClick={handleNotificationClick} language={'es'} currentUser={currentUserData!} onApproveUser={handleApproveUser} onRejectUser={handleRejectUser} onApproveRedemption={handleApproveRedemption} onNavigateToProfile={handleNavigateToProfile} onViewRegistrationData={handleViewRegistrationData} users={users} />} />
                <Route path="/recompensas" element={<StoreView user={currentUserData!} language={'es'} onRedeemReward={handleRedeemReward} storeRewards={storeRewards} userRedemptions={userRedemptions} />} />
                <Route path="/buscar" element={<SearchRoute posts={posts} users={users} onLike={(id) => handleVote(id, 'up')} onVote={(id, dir) => handleVote(id, dir)} onRepost={handleRepost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} onViewChange={handleViewChange} currentUser={currentUserData!} followedUserIds={followedUserIds} followerUserIds={followerUserIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={handleNavigateToProfile} onSearchHashtag={handleSearchHashtag} chats={chats} onShareViaChat={handleSendMessage} language={'es'} onNavigateToPost={handleNavigateToPost} onNavigateToEvent={(uid, eid) => navigate(`/calendario`, { state: { eventId: eid } })} />} />
                <Route path="/inicio/:postId" element={<PostDetailView posts={posts} user={currentUserData!} onAddComment={handleAddComment} onAddReply={handleAddReply} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onDeletePost={handleDeletePost} onSearchHashtag={handleSearchHashtag} onNavigateToProfile={handleNavigateToProfile} onNavigateToEvent={(uid, eid) => navigate(`/calendario`, { state: { eventId: eid } })} users={users} language={'es'} />} />
                <Route path="/noticias/:postId" element={<PostDetailView posts={posts} user={currentUserData!} onAddComment={handleAddComment} onAddReply={handleAddReply} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onDeletePost={handleDeletePost} onSearchHashtag={handleSearchHashtag} onNavigateToProfile={handleNavigateToProfile} onNavigateToEvent={(uid, eid) => navigate(`/calendario`, { state: { eventId: eid } })} users={users} language={'es'} />} />
                <Route path="/configuracion" element={<SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} onLogout={() => supabase.auth.signOut()} onViewChange={handleViewChange} theme={theme} onThemeChange={setTheme} language={'es'} />} />
                <Route path="/:identifier" element={<ProfileRoute users={users} currentUserData={currentUserData} posts={posts} chats={chats} followerUserIds={followerUserIds} followedUserIds={followedUserIds} onUpdateUser={handleUpdateUser} onRepost={handleRepost} onToggleFollow={handleToggleFollow} onDeletePost={handleDeletePost} onNavigateToEvent={(uid, eid) => navigate(`/calendario`, { state: { eventId: eid } })} onStartChat={handleStartChat} onAddPost={handleAddPost} onPromoteEvent={undefined} onShareViaChat={handleSendMessage} focusedEventId={location.state?.scrollToEventId || null} onClearFocusedEvent={() => { }} onSearchHashtag={handleSearchHashtag} onNavigateToPost={handleNavigateToPost} onNavigateToProfile={handleNavigateToProfile} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onAddComment={handleAddComment} onAddReply={handleAddReply} onVoteComment={undefined} onPreviewImage={undefined} globalEvents={globalEvents} language="es" pinnedPosts={new Set(posts.filter(p => p.isPinned && p.authorId === session?.user?.id).map(p => p.id))} onTogglePin={handleTogglePin} onSupportEvent={undefined} targetEventId={null} onClearTargetEvent={() => { }} />} />
              </Routes>
            </Layout>
          )
        }
        />
      </Routes>
      {selectedPostFromNotify && <PostDetailsModal post={selectedPostFromNotify} onClose={() => setSelectedPostFromNotify(null)} onAddComment={handleAddComment} onAddReply={handleAddReply} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onNavigateToProfile={handleNavigateToProfile} onNavigateToEvent={(uid, eid) => navigate(`/calendario`, { state: { eventId: eid } })} onSearchHashtag={handleSearchHashtag} users={users} language={'es'} />}
      {selectedRegistrationUserId && (
        <RegistrationDetailsModal
          user={users.find(u => u.id === selectedRegistrationUserId)!}
          onClose={() => setSelectedRegistrationUserId(null)}
        />
      )}
      {toast && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center transform transition-all animate-in zoom-in-95">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${toast.type === 'error' ? 'bg-red-100 text-red-600' : toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              {toast.type === 'error' ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aviso</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-white transition-colors ${toast.type === 'error' ? 'bg-red-600 hover:bg-red-700' : toast.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
