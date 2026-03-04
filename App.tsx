
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/Layout';
import { SocialFeedV2 as SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { NewsHubView } from './components/NewsHubView';
import { CalendarView } from './components/CalendarView';
import { SearchResultsView } from './components/SearchResultsView';
import { SettingsView } from './components/SettingsView';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { NotificationsView } from './components/NotificationsView';
import { StoreView } from './components/StoreView';
import { User, Post, Chat, Message, Notification, Comment, CalendarEvent } from './types';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';
import { SearchRoute } from './components/SearchRoute';
import { PostDetailsModal } from './components/PostDetailsModal';
import { PostDetailView } from './components/PostDetailView';
import { Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

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

  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [followerUserIds, setFollowerUserIds] = useState<Set<string>>(new Set());

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
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        bio: data.bio || '',
        interests: data.interests || [],
        followers: data.followers_count || 0,
        following: data.following_count || 0,
        country: data.country,
        region: data.region,
        joinedDate: data.created_at,
        novas: data.novas || 0,
        isAdmin: data.is_admin || false,
        chatSettings: data.chat_settings,
        notificationSettings: data.notification_settings
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
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
        bio: u.bio || '',
        interests: u.interests || [],
        followers: u.followers_count || 0,
        following: u.following_count || 0,
        country: u.country,
        region: u.region,
        joinedDate: u.created_at,
        novas: u.novas || 0,
        isAdmin: u.is_admin || false,
        chatSettings: u.chat_settings,
        notificationSettings: u.notification_settings
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
                avatar: joinedProfile?.avatar || localProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`,
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
            sharedEvent: m.shared_event
          };

          chat.messages.push(message);

          // Generar un resumen legible para la barra lateral
          let summary = (m.text || '').trim();
          const trimmedText = (m.text || '').trim();
          // Strict detection: Base64 or very long technical strings without spaces
          const isProbablyData = trimmedText.includes(';base64,') || (trimmedText.length > 60 && !trimmedText.includes(' '));
          const isImage = trimmedText.startsWith('data:image') ||
            trimmedText.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i) ||
            (trimmedText.startsWith('http') && trimmedText.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i));

          if (isProbablyData && !isImage) summary = `📁 Adjunto`;
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
    const { data } = await supabase
      .from('notifications')
      .select('*, sender:profiles!sender_id(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type,
        senderName: `${n.sender?.name} ${n.sender?.last_name || ''}`,
        senderId: n.sender_id,
        senderAvatar: n.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender_id}`,
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

  const fetchFeed = useCallback(async () => {
    if (!session?.user) return;
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
      supabase.from('posts').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('news').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('post_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('news_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('comment_replies').select('*, author:profiles!author_id(*)').order('created_at', { ascending: true }),
      supabase.from('post_likes').select('post_id, vote_type').eq('user_id', session.user.id),
      supabase.from('news_votes').select('news_id, vote_type').eq('user_id', session.user.id),
      supabase.from('reposts').select('post_id, news_id').eq('user_id', session.user.id)
    ]);

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
        authorAvatar: r.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.author_id}`,
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
          authorAvatar: c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_id}`,
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
      authorAvatar: p.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_id}`,
      content: p.content,
      imageUrl: p.image_url,
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
      userReposted: repostedIds.has(p.id)
    })) || [];

    const allPosts = [...mapPosts(postsData || [], 'post'), ...mapPosts(newsData || [], 'news')];
    setPosts(allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [session?.user?.id]);

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string) => {
    if (!session?.user) return;
    const isNews = type === 'news';
    const table = isNews ? 'news' : 'posts';

    const payload: any = {
      author_id: session.user.id,
      content,
      tags: tags || [],
      image_url: imageUrl || null
    };

    if (!isNews) {
      payload.doc_url = docUrl || null;
      payload.doc_name = docName || null;
    }

    const { error } = await supabase.from(table).insert(payload);

    if (!error) {
      await fetchFeed();
    } else {
      console.error(`Error al publicar en la tabla ${table}:`, error.message);
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
    navigate(`/search?q=${encodeURIComponent(tag)}`);
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
    const table = post?.type === 'news' ? 'news' : 'posts';
    const { error } = await supabase.from(table).delete().eq('id', postId).eq('author_id', session.user.id);
    if (!error) fetchFeed();
  };

  const handleSendMessage = async (recipientId: string, text: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('messages').insert({ sender_id: session.user.id, recipient_id: recipientId, text });
    if (!error) fetchChats();
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
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleStartChat = (targetUser: User) => {
    setActiveChatUserId(targetUser.id);
    navigate(`/messages/${targetUser.username || targetUser.id}`);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const { error } = await supabase.from('profiles').update({
      name: updatedUser.name,
      last_name: updatedUser.lastName,
      username: updatedUser.username,
      email: updatedUser.email,
      gender: updatedUser.gender,
      birth_date: updatedUser.birthDate,
      position: updatedUser.position,
      department: updatedUser.department,
      job_category: updatedUser.jobCategory,
      administration_type: updatedUser.administrationType,
      country: updatedUser.country,
      region: updatedUser.region,
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      avatar: updatedUser.avatar,
      chat_settings: updatedUser.chatSettings,
      notification_settings: updatedUser.notificationSettings,
      updated_at: new Date().toISOString()
    }).eq('id', updatedUser.id);
    if (!error) fetchUserProfile(updatedUser.id);
  };

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      if (q !== searchQuery) setSearchQuery(q);
    } else if (['/feed', '/news'].includes(location.pathname)) {
      setSearchQuery('');
    }
  }, [location.pathname, searchParams]); // REMOVED searchQuery from dependencies to prevent clearing while typing
  /* eslint-disable-next-line react-hooks/exhaustive-deps */

  const handleMarkNotificationsRead = useCallback(async () => {
    if (!session?.user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id);
    fetchNotifications();
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
    }
  }, [session, fetchUserProfile, fetchFeed, fetchUsers, fetchFollows, fetchUserRedemptions, fetchNotifications, fetchGlobalEvents, fetchStoreRewards]);

  useEffect(() => {
    if (session?.user && users.length > 0) {
      fetchChats();
    }
  }, [session, users.length, fetchChats]);

  useEffect(() => {
    if (session?.user) {
      const channel = supabase
        .channel('app_realtime_sync')
        .on('postgres_changes' as any, { event: '*', table: 'posts', schema: 'public' } as any, () => fetchFeed())
        .on('postgres_changes' as any, { event: '*', table: 'news', schema: 'public' } as any, () => fetchFeed())
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

  const handleNavigateToProfile = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    const identifier = targetUser?.username || userId;
    navigate(`/${identifier}`);
  };

  const handleNavigateToPost = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  if (isLoadingAuth || (!currentUserData && session)) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>;

  if (!session) {
    if (isRegistering) return <Onboarding onComplete={() => setIsRegistering(false)} onCancel={() => setIsRegistering(false)} />;
    return <Login onLogin={() => { }} onRegister={() => setIsRegistering(true)} />;
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Layout
        currentView={currentView}
        onViewChange={handleViewChange}
        user={currentUserData!}
        notifications={notifications}
        posts={posts}
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
      >
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<SocialFeed posts={posts.filter(p => p.type === 'post')} user={currentUserData!} onLike={(id) => handleVote(id, 'up')} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} users={users} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={handleNavigateToPost} followedUserIds={followedUserIds} onSearchHashtag={handleSearchHashtag} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={handleSearchSubmit} globalEvents={globalEvents} />} />
          <Route path="/news" element={<NewsHubView posts={posts.filter(p => p.type === 'news')} user={currentUserData!} onVote={(id, dir) => handleVote(id, dir)} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} currentUser={currentUserData!} users={users} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={handleNavigateToPost} followedUserIds={followedUserIds} onSearchHashtag={handleSearchHashtag} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={handleSearchSubmit} />} />
          <Route path="/calendar" element={<CalendarView language={'es'} />} />
          <Route path="/messages/:chatId" element={<MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={handleSendMessage} onNavigateToProfile={handleNavigateToProfile} onMarkChatAsRead={handleMarkChatAsRead} externalActiveId={activeChatUserId} users={users} globalEvents={globalEvents} language={'es'} />} />
          <Route path="/messages" element={<MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={handleSendMessage} onNavigateToProfile={handleNavigateToProfile} onMarkChatAsRead={handleMarkChatAsRead} externalActiveId={activeChatUserId} users={users} globalEvents={globalEvents} language={'es'} />} />
          <Route path="/notifications" element={<NotificationsView notifications={notifications} onMarkAllRead={handleMarkNotificationsRead} onNotificationClick={handleNotificationClick} language={'es'} currentUser={currentUserData!} onApproveUser={handleApproveUser} onRejectUser={handleRejectUser} onApproveRedemption={handleApproveRedemption} onNavigateToProfile={handleNavigateToProfile} />} />
          <Route path="/store" element={<StoreView user={currentUserData!} language={'es'} onRedeemReward={handleRedeemReward} storeRewards={storeRewards} userRedemptions={userRedemptions} />} />
          <Route path="/search" element={<SearchRoute posts={posts} users={users} onLike={(id) => handleVote(id, 'up')} onVote={(id, dir) => handleVote(id, dir)} onRepost={handleRepost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} onViewChange={handleViewChange} currentUser={currentUserData!} followedUserIds={followedUserIds} followerUserIds={followerUserIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={handleNavigateToProfile} onSearchHashtag={handleSearchHashtag} chats={chats} onShareViaChat={handleSendMessage} language={'es'} onNavigateToPost={handleNavigateToPost} onNavigateToEvent={(uid, eid) => navigate(`/calendar`, { state: { eventId: eid } })} />} />
          <Route path="/post/:postId" element={<PostDetailView posts={posts} user={currentUserData!} onAddComment={handleAddComment} onAddReply={handleAddReply} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onSearchHashtag={handleSearchHashtag} onNavigateToProfile={handleNavigateToProfile} users={users} language={'es'} />} />
          <Route path="/settings" element={<SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} onLogout={() => supabase.auth.signOut()} onViewChange={handleViewChange} theme={theme} onThemeChange={setTheme} language={'es'} />} />
          <Route path="/:username" element={<ProfileView user={users.find(u => u.username === location.pathname.slice(1) || u.id === location.pathname.slice(1)) || currentUserData!} isCurrentUser={session?.user?.id === users.find(u => u.username === location.pathname.slice(1) || u.id === location.pathname.slice(1))?.id || location.pathname.slice(1) === currentUserData?.username} posts={posts} onUpdateUser={handleUpdateUser} onDeletePost={handleDeletePost} currentUser={currentUserData!} onAddComment={handleAddComment} onLike={(id) => handleVote(id, 'up')} onVote={(id, dir) => handleVote(id, dir)} onRepost={handleRepost} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={handleNavigateToPost} onStartChat={handleStartChat} isFollowed={followedUserIds.has(users.find(u => u.username === location.pathname.slice(1) || u.id === location.pathname.slice(1))?.id || '')} isFollower={followerUserIds.has(users.find(u => u.username === location.pathname.slice(1) || u.id === location.pathname.slice(1))?.id || '')} onToggleFollow={handleToggleFollow} users={users} onSearchHashtag={handleSearchHashtag} />} />
        </Routes>
      </Layout>
      {selectedPostFromNotify && <PostDetailsModal post={selectedPostFromNotify} onClose={() => setSelectedPostFromNotify(null)} onAddComment={handleAddComment} onAddReply={handleAddReply} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onNavigateToProfile={handleNavigateToProfile} onSearchHashtag={handleSearchHashtag} currentUser={currentUserData!} users={users} onShareViaChat={handleStartChat} />}
    </div>
  );
};

export default App;
