
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { NewsHubView } from './components/NewsHubView';
import { CalendarView } from './components/CalendarView';
import { SearchResultsView } from './components/SearchResultsView';
import { SettingsView } from './components/SettingsView';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { PasswordRecover } from './components/PasswordRecover';
import { NotificationsView } from './components/NotificationsView';
import { FullPostView } from './components/FullPostView';
import { User, Post, Chat, Message, Notification, Comment, AppView, CommentReply, CalendarEvent } from './types';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';
import { Toast } from './components/Toast';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('feed');
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<AppView>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalEvents, setGlobalEvents] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [processingReposts, setProcessingReposts] = useState<Set<string>>(new Set());
  const [processingFollows, setProcessingFollows] = useState<Set<string>>(new Set());
  const [processingVotes, setProcessingVotes] = useState<Set<string>>(new Set());

  const [prefilledPostContent, setPrefilledPostContent] = useState<string | null>(null);
  const [prefilledEvent, setPrefilledEvent] = useState<CalendarEvent | null>(null);
  const [targetEventId, setTargetEventId] = useState<string | null>(null);

  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [followerUserIds, setFollowerUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
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

  useEffect(() => {
    if (session?.user && !isResettingPassword) {
      fetchUserProfile(session.user.id);
      fetchUsers();
      fetchFeed();
      fetchFollows();
      fetchChats();
      fetchNotifications();
      fetchGlobalEvents();

      const channel = supabase
        .channel('app_realtime_sync')
        .on('postgres_changes', { event: '*', table: 'posts', schema: 'public' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'news', schema: 'public' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'post_reposts', schema: 'public' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'user_events', schema: 'public' }, () => { fetchFeed(); fetchGlobalEvents(); })
        .on('postgres_changes', { event: '*', table: 'post_comments', schema: 'public' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'news_comments', schema: 'public' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'comment_replies', schema: 'public' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'messages', schema: 'public' }, () => fetchChats())
        .on('postgres_changes', { event: '*', table: 'notifications', schema: 'public' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', table: 'profiles', schema: 'public' }, () => { if (session?.user) fetchUserProfile(session.user.id); fetchUsers(); })
        .on('postgres_changes', { event: '*', table: 'follows', schema: 'public' }, () => { fetchFollows(); if (session?.user) fetchUserProfile(session.user.id); fetchUsers(); })
        .on('postgres_changes', { event: '*', table: 'post_likes', schema: 'public' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'news_votes', schema: 'public' }, () => fetchFeed())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [session, isResettingPassword]);

  const fetchUserProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setCurrentUserData({
      id: data.id,
      name: data.name,
      lastName: data.last_name,
      username: data.username,
      email: data.email,
      position: data.position || 'Personal Público',
      department: data.department || 'Administración',
      jobCategory: data.job_category,
      administrationType: data.administration_type,
      roleDescription: data.role_description,
      organizationName: data.organization_name,
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
      banner: data.banner,
      bannerColor: data.banner_color,
      bio: data.bio || '',
      interests: data.interests || [],
      followers: data.followers_count || 0,
      following: data.following_count || 0,
      country: data.country,
      region: data.region,
      joinedDate: data.created_at,
      birthDate: data.birth_date
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setUsers(data.map((u: any) => ({
      id: u.id,
      name: u.name,
      lastName: u.last_name,
      username: u.username,
      email: u.email,
      position: u.position || 'Personal Público',
      department: u.department || 'Administración',
      jobCategory: u.job_category,
      administrationType: u.administration_type,
      roleDescription: u.role_description,
      organizationName: u.organization_name,
      avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
      banner: u.banner,
      bannerColor: u.banner_color,
      bio: u.bio || '',
      interests: u.interests || [],
      followers: u.followers_count || 0,
      following: u.following_count || 0,
      country: u.country,
      region: u.region,
      joinedDate: u.created_at,
      birthDate: u.birth_date
    })));
  };

  const fetchFollows = async () => {
    if (!session?.user) return;
    const { data: following } = await supabase.from('follows').select('followed_id').eq('follower_id', session.user.id);
    const { data: followers } = await supabase.from('follows').select('follower_id').eq('followed_id', session.user.id);
    setFollowedUserIds(new Set(following?.map(f => f.followed_id) || []));
    setFollowerUserIds(new Set(followers?.map(f => f.follower_id) || []));
  };

  const fetchChats = async () => {
    if (!session?.user) return;
    const { data: messagesData } = await supabase.from('messages').select('*, sender:profiles!sender_id(*), recipient:profiles!recipient_id(*)').or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`).order('created_at', { ascending: true });
    const deletedPosts: any[] = []; // await supabase.from('posts_eliminados').select('post_id').eq('user_id', session.user.id);
    const deletedPostIds = new Set(deletedPosts?.map((p: any) => p.post_id) || []);

    const chatsMap = new Map<string, Chat>();
    messagesData?.forEach((m: any) => {
      const otherUser = m.sender_id === session.user.id ? m.recipient : m.sender;
      if (!otherUser) return;
      const chatId = otherUser.id;
      const chat = chatsMap.get(chatId) || { id: chatId, participant: { id: otherUser.id, name: otherUser.name, lastName: otherUser.last_name, username: otherUser.username, avatar: otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`, position: otherUser.position, department: otherUser.department }, messages: [], lastMessage: '', timestamp: new Date() };
      chat.messages.push({ id: m.id, senderId: m.sender_id, recipientId: m.recipient_id, text: m.text, timestamp: new Date(m.created_at), isRead: m.is_read, postId: m.post_id, isPostShare: m.is_post_share });
      chat.lastMessage = m.text;
      chat.timestamp = new Date(m.created_at);
      chatsMap.set(chatId, chat);
    });
    setChats(Array.from(chatsMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const fetchNotifications = async () => {
    if (!session?.user) return;
    const { data } = await supabase.from('notifications').select('*, sender:profiles!sender_id(*)').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (data) setNotifications(data.map((n: any) => ({ id: n.id, type: n.type, senderName: `${n.sender?.name} ${n.sender?.last_name || ''}`, senderAvatar: n.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender_id}`, content: n.content, timestamp: n.created_at, isRead: n.is_read, postId: n.post_id })));
  };

  const fetchGlobalEvents = async () => {
    const { data } = await supabase.from('user_events').select('*').gte('attendees_count', 2);
    if (data) setGlobalEvents(data.map(ev => ({ id: ev.id, creator_id: ev.creator_id, title: ev.title, type: ev.type as any, event_date: ev.event_date, event_time: ev.event_time, location: ev.location, description: ev.description, attendees: ev.attendees_count })));
  };

  const fetchFeed = async () => {
    if (!session?.user) return;
    try {
      const [
        { data: postsData }, { data: newsData }, { data: postComments }, { data: newsComments }, { data: repliesData },
        { data: myPostLikes }, { data: myNewsVotes }, { data: myReposts }, { data: eventsData }, { data: profilesData },
        { data: commentLikesData }
      ] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
        supabase.from('post_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
        supabase.from('news_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
        supabase.from('comment_replies').select('*').order('created_at', { ascending: true }),
        supabase.from('post_likes').select('post_id, vote_type').eq('user_id', session.user.id),
        supabase.from('news_votes').select('news_id, vote_type').eq('user_id', session.user.id),
        supabase.from('post_reposts').select('post_id').eq('user_id', session.user.id),
        supabase.from('user_events').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('comment_likes').select('comment_id').eq('user_id', session.user.id)
      ]);

      const profilesMap = new Map(); profilesData?.forEach(p => profilesMap.set(p.id, p));
      const eventsMap = new Map(); eventsData?.forEach(ev => eventsMap.set(ev.id, { id: ev.id, creator_id: ev.creator_id, title: ev.title, type: ev.type as any, event_date: ev.event_date, event_time: ev.event_time, location: ev.location, description: ev.description, attendees: ev.attendees_count }));

      // Calculate Global Votes for News
      const newsIds = (newsData || []).map((n: any) => n.id);
      let newsVotesMap = new Map<string, { up: number, down: number }>();

      if (newsIds.length > 0) {
        const { data: allNewsVotes } = await supabase
          .from('news_votes')
          .select('news_id, vote_type')
          .in('news_id', newsIds);

        allNewsVotes?.forEach((v: any) => {
          const current = newsVotesMap.get(v.news_id) || { up: 0, down: 0 };
          if (v.vote_type === 'up') current.up++;
          else if (v.vote_type === 'down') current.down++;
          newsVotesMap.set(v.news_id, current);
        });
      }

      // Calculate Comment Likes
      // Note: We need to fetch aggregate likes for comments. For efficiency, we might want a view or a separate query for heavy loads,
      // but for now we'll assume comments come with a 'likes' count column if we updated the table, OR we count them.
      // Since we didn't add a likes_count column to comments tables in the migration (just the linker table),
      // we might rely on the existing 'likes' column in comments tables if it exists, or defaults to 0.
      // Check database.sql: comment_replies has 'likes'. post_comments/news_comments usually have it too.

      const myCommentLikes = new Set(commentLikesData?.map((l: any) => l.comment_id) || []);

      const allReplies = (repliesData || []).map((r: any) => { const author = profilesMap.get(r.author_id); return { id: r.id, commentId: r.comment_id, parentReplyId: r.parent_reply_id, authorId: r.author_id, authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario', authorUsername: author?.username, authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.author_id}`, text: r.content, timestamp: r.created_at, likes: r.likes || 0, replies: [] }; });
      const buildReplyTree = (replies: any[]) => { const roots = new Map(); replies.forEach(r => { if (r.parentReplyId) { const parent = replies.find(pr => pr.id === r.parentReplyId); if (parent) (parent.replies = parent.replies || []).push(r); } else { const list = roots.get(r.commentId) || []; list.push(r); roots.set(r.commentId, list); } }); return roots; };
      const repliesMap = buildReplyTree(allReplies);
      const commentsMap = new Map();
      const processComments = (data: any[], idField: string) => data?.forEach((c: any) => {
        const targetId = c[idField];
        const list = commentsMap.get(targetId) || [];
        list.push({
          id: c.id,
          authorId: c.author_id,
          authorName: `${c.author?.name} ${c.author?.last_name || ''}`,
          authorUsername: c.author?.username,
          authorAvatar: c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_id}`,
          text: c.text,
          timestamp: c.created_at,
          likes: c.likes || 0,
          userLiked: myCommentLikes.has(c.id),
          replies: repliesMap.get(c.id) || []
        });
        commentsMap.set(targetId, list);
      });
      processComments(postComments || [], 'post_id'); processComments(newsComments || [], 'news_id');
      const upvotedIds = new Set([...(myPostLikes?.filter(l => l.vote_type === 'up').map(l => l.post_id) || []), ...(myNewsVotes?.filter(l => l.vote_type === 'up').map(l => l.news_id) || [])]);
      const downvotedIds = new Set([...(myPostLikes?.filter(l => l.vote_type === 'down').map(l => l.post_id) || []), ...(myNewsVotes?.filter(l => l.vote_type === 'down').map(l => l.news_id) || [])]);
      const repostedIds = new Set(myReposts?.map(r => r.post_id) || []);
      const formattedPosts = (postsData || []).map((p: any) => { const author = profilesMap.get(p.author_id); return { id: p.id, authorId: p.author_id, authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario', authorUsername: author?.username, authorPosition: author?.position, authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_id}`, content: p.content, imageUrl: p.image_url, docUrl: p.doc_url, docName: p.doc_name, timestamp: p.created_at, type: 'post', tags: p.tags || [], likes: p.likes_count || 0, reposts: p.reposts_count || 0, comments: p.comments_count || 0, commentsList: commentsMap.get(p.id) || [], userLiked: upvotedIds.has(p.id), userReposted: repostedIds.has(p.id), userDownvoted: downvotedIds.has(p.id), linkedEventId: p.linked_event_id, linkedEvent: p.linked_event_id ? eventsMap.get(p.linked_event_id) : undefined }; });
      const formattedNews = (newsData || []).map((n: any) => {
        const author = profilesMap.get(n.author_id);
        const votes = newsVotesMap.get(n.id) || { up: 0, down: 0 };
        return {
          id: n.id,
          authorId: n.author_id,
          authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario',
          authorUsername: author?.username,
          authorPosition: author?.position,
          authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.author_id}`,
          content: n.content,
          imageUrl: n.image_url,
          timestamp: n.created_at,
          type: 'news',
          tags: n.tags || [],
          likes: n.likes_count || 0, // Keep likes as score for sorting/logic if needed, but we have strict upvotes now
          upvotes: votes.up,
          downvotes: votes.down,
          reposts: n.reposts_count || 0,
          comments: n.comments_count || 0,
          commentsList: commentsMap.get(n.id) || [],
          userLiked: upvotedIds.has(n.id),
          userReposted: repostedIds.has(n.id),
          userDownvoted: downvotedIds.has(n.id)
        };
      });

      const { data: deletedPosts } = await supabase.from('posts_eliminados').select('post_id').eq('user_id', session.user.id);
      const deletedPostIds = new Set(deletedPosts?.map(p => p.post_id) || []);

      setPosts([...formattedPosts, ...formattedNews]
        .filter(p => !deletedPostIds.has(p.id))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      );
    } catch (e) { console.error("Error fetching feed:", e); }
  };

  const handleVote = useCallback(async (id: string, dir: 'up' | 'down') => {
    if (!session?.user || processingVotes.has(id)) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;

    setProcessingVotes(prev => new Set(prev).add(id));
    const isNews = post.type === 'news';
    const table = isNews ? 'news_votes' : 'post_likes';
    const idField = isNews ? 'news_id' : 'post_id';

    const originalPost = { ...post };
    let newLikes = post.likes;
    let newUserLiked = post.userLiked;
    let newUserDownvoted = post.userDownvoted;

    let newUpvotes = post.upvotes !== undefined ? post.upvotes : 0; // Default to 0 if undefined, though it should be set for news

    // Lógica Unificada para respuesta instantánea en UI
    if (newUserLiked && dir === 'up') {
      newLikes--;
      newUserLiked = false;
      newUpvotes = Math.max(0, newUpvotes - 1);
    }
    else if (newUserDownvoted && dir === 'down') {
      newLikes++;
      newUserDownvoted = false;
    }
    else if (newUserLiked && dir === 'down') {
      newLikes -= 2;
      newUserLiked = false;
      newUserDownvoted = true;
      newUpvotes = Math.max(0, newUpvotes - 1);
    }
    else if (newUserDownvoted && dir === 'up') {
      newLikes += 2;
      newUserDownvoted = false;
      newUserLiked = true;
      newUpvotes++;
    }
    else if (dir === 'up') {
      newLikes++;
      newUserLiked = true;
      newUpvotes++;
    }
    else {
      newLikes--;
      newUserDownvoted = true;
    }

    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: newLikes, upvotes: newUpvotes, userLiked: newUserLiked, userDownvoted: newUserDownvoted } : p));

    try {
      const { data: existing } = await supabase.from(table).select('*').eq('user_id', session.user.id).eq(idField, id).maybeSingle();
      if (existing) {
        if (existing.vote_type === dir) {
          await supabase.from(table).delete().eq('user_id', session.user.id).eq(idField, id);
        } else {
          await supabase.from(table).update({ vote_type: dir }).eq('user_id', session.user.id).eq(idField, id);
        }
      } else {
        await supabase.from(table).insert({ user_id: session.user.id, [idField]: id, vote_type: dir });
        if (post.authorId !== session.user.id && dir === 'up') {
          await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'like', content: `le ha gustado tu ${isNews ? 'noticia' : 'post'}`, post_id: id });
        }
      }
      fetchFeed();
    } catch (err) {
      setPosts(prev => prev.map(p => p.id === id ? originalPost : p));
      setToast({ message: "Error al registrar tu voto.", type: 'error' });
    } finally {
      setTimeout(() => {
        setProcessingVotes(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 500);
    }
  }, [session, posts, processingVotes, fetchFeed, supabase]);

  const handleToggleFollow = useCallback(async (userId: string) => {
    if (!session?.user || userId === session.user.id || processingFollows.has(userId)) return;
    const isCurrentlyFollowing = followedUserIds.has(userId);
    setProcessingFollows(prev => new Set(prev).add(userId));
    setFollowedUserIds(prev => { const next = new Set(prev); if (isCurrentlyFollowing) next.delete(userId); else next.add(userId); return next; });
    try {
      if (isCurrentlyFollowing) { await supabase.from('follows').delete().match({ follower_id: session.user.id, followed_id: userId }); setToast({ message: "Has dejado de seguir a este usuario.", type: 'info' }); }
      else { await supabase.from('follows').insert({ follower_id: session.user.id, followed_id: userId }); await supabase.from('notifications').insert({ user_id: userId, sender_id: session.user.id, type: 'follow', content: `ha comenzado a seguirte` }); setToast({ message: "¡Ahora sigues a este usuario!", type: 'success' }); }
      await Promise.all([fetchFollows(), fetchUserProfile(session.user.id), fetchUsers()]);
    } catch (error: any) { console.error("Error toggle follow:", error.message); fetchFollows(); }
    finally { setTimeout(() => setProcessingFollows(prev => { const next = new Set(prev); next.delete(userId); return next; }), 400); }
  }, [session, followedUserIds, processingFollows]);

  const handleUpdateUser = async (updatedUser: User) => {
    if (!session?.user) return;
    setCurrentUserData(updatedUser);
    const { error } = await supabase.from('profiles').update({
      name: updatedUser.name,
      last_name: updatedUser.lastName,
      username: updatedUser.username?.toLowerCase().trim(),
      email: updatedUser.email,
      birth_date: updatedUser.birthDate,
      position: updatedUser.position,
      department: updatedUser.department,
      job_category: updatedUser.jobCategory,
      administration_type: updatedUser.administrationType,
      role_description: updatedUser.roleDescription,
      organization_name: updatedUser.organizationName,
      country: updatedUser.country,
      region: updatedUser.region,
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      avatar: updatedUser.avatar,
      banner: updatedUser.banner,
      banner_color: updatedUser.bannerColor,
      updated_at: new Date().toISOString()
    }).eq('id', session.user.id);
    if (!error) {
      await Promise.all([fetchUserProfile(session.user.id), fetchUsers(), fetchFeed()]);
    }
  };

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, linkedEventId?: string) => {
    if (!session?.user) return;

    if (type === 'news') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', session.user.id)
        .gte('created_at', twentyFourHoursAgo);

      if (countError) {
        console.error("Error checking news limit:", countError.message);
      } else if (count !== null && count >= 2) {
        setToast({ message: "Límite: Solo puedes publicar 2 noticias cada 24 horas para evitar saturación.", type: 'error' });
        return;
      }
    }

    const table = type === 'news' ? 'news' : 'posts';
    const payload: any = { author_id: session.user.id, content, tags, image_url: imageUrl || null, updated_at: new Date().toISOString() };
    if (type === 'post') { payload.doc_url = docUrl || null; payload.doc_name = docName || null; if (linkedEventId) payload.linked_event_id = linkedEventId; }
    const { error } = await supabase.from(table).insert(payload);
    if (error) console.error("Error al publicar:", error.message); else fetchFeed();
  };

  const handleAddReply = async (commentId: string, text: string, parentReplyId?: string) => {
    if (!session?.user) return;
    try {
      const { data: newReply, error } = await supabase.from('comment_replies').insert({
        comment_id: commentId,
        parent_reply_id: parentReplyId || null,
        author_id: session.user.id,
        content: text
      }).select().single();

      if (error) throw error;

      // Buscar autor del comentario/respuesta para notificar
      let targetAuthorId: string | null = null;
      if (parentReplyId) {
        const { data: pr } = await supabase.from('comment_replies').select('author_id').eq('id', parentReplyId).single();
        targetAuthorId = pr?.author_id || null;
      } else {
        const { data: pc } = await supabase.from('post_comments').select('author_id').eq('id', commentId).maybeSingle();
        if (pc) targetAuthorId = pc.author_id;
        else {
          const { data: nc } = await supabase.from('news_comments').select('author_id').eq('id', commentId).maybeSingle();
          targetAuthorId = nc?.author_id || null;
        }
      }

      if (targetAuthorId && targetAuthorId !== session.user.id) {
        await supabase.from('notifications').insert({
          user_id: targetAuthorId,
          sender_id: session.user.id,
          type: 'comment',
          content: `ha respondido a tu comentario`,
          post_id: selectedPostId
        });
      }

      setToast({ message: "Respuesta publicada correctamente.", type: 'success' });
      fetchFeed();
    } catch (err: any) {
      console.error("Error adding reply:", err.message);
      setToast({ message: "No se pudo guardar la respuesta. Inténtalo de nuevo.", type: 'error' });
    }
  };

  const handleVoteComment = async (commentId: string) => {
    if (!session?.user) return;

    // Find comment in posts to optimally update state UI
    let targetComment: Comment | null = null;
    let targetPost: Post | null = null;

    // Naive search (optimization: pass post ID if possible, but map search is okay for now)
    for (const p of posts) {
      const found = p.commentsList.find(c => c.id === commentId);
      if (found) { targetComment = found; targetPost = p; break; }
    }

    if (!targetComment) return;

    const isLiked = targetComment.userLiked;

    // OPTIMISTIC UPDATE: Update UI immediately
    const updatePostState = (increment: number, newLikedStatus: boolean) => {
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id !== targetPost!.id) return p;

        // Helper to update deeply nested comments
        const updateComments = (list: Comment[]): Comment[] => {
          return list.map(c => {
            if (c.id === commentId) {
              return { ...c, likes: Math.max(0, c.likes + increment), userLiked: newLikedStatus };
            }
            if (c.replies && c.replies.length > 0) {
              // Also check replies (though they are CommentReply type, usually similar structure or needs casting)
              // Our Comment type includes replies: CommentReply[]. CommentReply has 'likes' too.
              // Let's assume recursion handles it if types align, otherwise we need to update replies specifically.
              // Since CommentReply is slightly different, let's just handle the top level for now or check type compatibility.
              // Actually, c.replies are objects.
              const updatedReplies = (c.replies as any[]).map(r => {
                if (r.id === commentId) return { ...r, likes: Math.max(0, r.likes + increment), userLiked: newLikedStatus }; // userLiked might not be on Reply type in TS yet?? Check types.ts
                return r;
              });
              return { ...c, replies: updatedReplies };
            }
            return c;
          });
        };

        const newComments = updateComments(p.commentsList);
        return { ...p, commentsList: newComments };
      }));
    };

    // Apply optimistic
    updatePostState(isLiked ? -1 : 1, !isLiked);

    try {
      if (isLiked) {
        await supabase.from('comment_likes').delete().eq('user_id', session.user.id).eq('comment_id', commentId);
      } else {
        await supabase.from('comment_likes').insert({ user_id: session.user.id, comment_id: commentId });
      }

      // No manual count update needed if trigger is installed.
      // We rely on fetchFeed eventually syncing, or the optimistic state holding.
      // To be safe, we can debounce fetch, but for now let's just leave the optimistic state
      // and maybe fetch silently.
      // fetchFeed(); // Removed immediate fetch to avoid flickering if server count hasn't updated yet (race condition)

    } catch (e) {
      console.error("Error voting comment", e);
      // Revert optimistic on error
      updatePostState(isLiked ? 1 : -1, isLiked);
    }
  };


  const handleRepost = async (postId: string) => {
    if (!session?.user || processingReposts.has(postId)) return;
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    setProcessingReposts(prev => new Set(prev).add(postId));
    const isAdding = !targetPost.userReposted;
    setPosts(prevPosts => prevPosts.map(p => { if (p.id === postId) return { ...p, userReposted: isAdding, reposts: isAdding ? p.reposts + 1 : Math.max(0, p.reposts - 1) }; return p; }));
    try {
      const { data: existingRepost } = await supabase.from('post_reposts').select('*').eq('user_id', session.user.id).eq('post_id', postId).maybeSingle();
      if (existingRepost) { await supabase.from('post_reposts').delete().eq('user_id', session.user.id).eq('post_id', postId); setToast({ message: "Has eliminado tu republicación.", type: 'info' }); }
      else { await supabase.from('post_reposts').insert({ user_id: session.user.id, post_id: postId }); if (targetPost.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: targetPost.authorId, sender_id: session.user.id, type: 'repost', content: `ha republicado tu post`, post_id: postId }); setToast({ message: "¡Publicación republicada!", type: 'success' }); }
    } catch (err: any) { fetchFeed(); } finally { setTimeout(() => setProcessingReposts(prev => { const next = new Set(prev); next.delete(postId); return next; }), 500); }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!session?.user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);

      if (error) throw error;

      await fetchNotifications();
      setToast({ message: "Notificaciones marcadas como leídas.", type: 'success' });
    } catch (err: any) {
      console.error("Error marking all read:", err.message);
      setToast({ message: "Error al actualizar notificaciones.", type: 'error' });
    }
  };

  const handleMarkChatAsRead = async (chatId: string) => {
    if (!session?.user) return;
    // Column messages.is_read does not exist, skipping update.
    // console.log("Skipping mark as read (column missing)");
    /*
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('recipient_id', session.user.id)
        .eq('sender_id', chatId)
        .eq('is_read', false);
      fetchChats();
    } catch (err) {
      console.error("Error marking chat as read:", err);
    }
    */
  };

  const handleNavigateToEvent = (userId: string, eventId: string) => { setViewingUserId(userId); setTargetEventId(eventId); setCurrentView('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleSendMessage = async (recipientId: string, text: string, postShareId?: string, profileShareId?: string) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: session.user.id,
        recipient_id: recipientId,
        text: text,
        post_id: postShareId,
        is_post_share: !!postShareId
      });

      if (error) throw error;

      // Opcional: Notificación de nuevo mensaje (si no existe un sistema de push/unread global)
      try {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          sender_id: session.user.id,
          type: 'follow', // O crear tipo 'message' si la tabla lo permite
          content: `te ha enviado un mensaje privado`
        });
      } catch (notifyErr) {
        console.warn("Could not send notification:", notifyErr);
      }

      fetchChats();
    } catch (err: any) {
      console.error("Error sending message:", err.message);
      setToast({ message: "Error al enviar el mensaje.", type: 'error' });
    }
  };

  const handleSendMessageFromShare = async (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string) => {
    await handleSendMessage(recipientId, text, sharedPostId, sharedProfileId);
    setToast({ message: "Contenido compartido por chat.", type: 'success' });
  };

  if (isLoadingAuth || (!currentUserData && session && !isResettingPassword)) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>;
  if (isResettingPassword) return <PasswordRecover onComplete={() => setIsResettingPassword(false)} />;
  if (!session) { if (isRegistering) return <Onboarding onComplete={() => setIsRegistering(false)} onCancel={() => setIsRegistering(false)} />; return <Login onLogin={() => { }} onRegister={() => setIsRegistering(true)} />; }

  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : null;
  const isViewingOwnProfile = !viewingUserId || viewingUserId === currentUserData?.id;

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Layout currentView={currentView} onViewChange={(v) => { if (v === 'profile') setViewingUserId(currentUserData?.id || null); setCurrentView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }} user={currentUserData!} notifications={notifications} globalEvents={globalEvents} posts={posts} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={(q) => { setSearchQuery(q); setCurrentView('search'); }} onLogout={() => supabase.auth.signOut()} isViewingOwnProfile={isViewingOwnProfile}>
        {currentView === 'feed' && <SocialFeed posts={posts.filter(p => p.type === 'post')} user={currentUserData!} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={(pid, t) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news_comments' : 'post_comments'; const idField = post.type === 'news' ? 'news_id' : 'post_id'; supabase.from(table).insert({ [idField]: pid, author_id: session.user.id, text: t }).then(() => { if (post.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu post`, post_id: pid }); fetchFeed(); }); }} users={users} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} followedUserIds={followedUserIds} followerUserIds={followerUserIds} onNavigateToPost={(id) => { setPreviousView('feed'); setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onDeletePost={(pid) => { if (!session?.user) return; const p = posts.find(x => x.id === pid); if (!p) return; const table = p.type === 'news' ? 'news' : 'posts'; supabase.from(table).delete().eq('id', pid).then(() => fetchFeed()); }} initialContent={prefilledPostContent} prefilledEvent={prefilledEvent} onClearInitialContent={() => { setPrefilledPostContent(null); setPrefilledEvent(null); }} onViewCalendar={() => setCurrentView('calendar')} onNavigateToEvent={handleNavigateToEvent} chats={chats} onShareViaChat={handleSendMessageFromShare} />}
        {currentView === 'news' && <NewsHubView posts={posts.filter(p => p.type === 'news')} user={currentUserData!} onVote={handleVote} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={(pid, t) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news_comments' : 'post_comments'; const idField = post.type === 'news' ? 'news_id' : 'post_id'; supabase.from(table).insert({ [idField]: pid, author_id: session.user.id, text: t }).then(() => { if (post.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu noticia`, post_id: pid }); fetchFeed(); }); }} currentUser={currentUserData!} users={users} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onNavigateToPost={(id) => { setPreviousView('news'); setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onDeletePost={(pid) => { if (!session?.user) return; supabase.from('posts_eliminados').insert({ post_id: pid, user_id: session.user.id }).then(() => fetchFeed()); }} chats={chats} followerUserIds={followerUserIds} onShareViaChat={handleSendMessageFromShare} />}
        {currentView === 'calendar' && <CalendarView onNavigateToEvent={handleNavigateToEvent} onPromoteEvent={(ev) => { setPrefilledPostContent(`📢 ¡Os invito a participar en este evento!\n\n${ev.title}\n\nhttps://redsocial.app/u/${ev.creator_id}/e/${ev.id} #Evento`); setPrefilledEvent(ev); setCurrentView('feed'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
        {currentView === 'profile' && <ProfileView user={users.find(u => u.id === viewingUserId) || currentUserData!} isCurrentUser={isViewingOwnProfile} posts={posts} onUpdateUser={handleUpdateUser} currentUser={currentUserData!} onRepost={handleRepost} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onToggleFollow={handleToggleFollow} isFollowed={followedUserIds.has(viewingUserId || '')} isFollower={followerUserIds.has(viewingUserId || '')} users={users} onNavigateToPost={(id) => { setPreviousView('profile'); setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onDeletePost={async (pid) => { if (!session?.user) return; const p = posts.find(x => x.id === pid); if (!p) return; const table = p.type === 'news' ? 'news' : 'posts'; await supabase.from(table).delete().eq('id', pid); fetchFeed(); }} onNavigateToEvent={handleNavigateToEvent} focusedEventId={targetEventId} onClearFocusedEvent={() => setTargetEventId(null)} onStartChat={(tu) => { setActiveChatUserId(tu.id); setCurrentView('messages'); }} onAddPost={handleAddPost} onPromoteEvent={(ev) => { setPrefilledPostContent(`📢 ¡Evento organizado!\n\n${ev.title}\n\nhttps://redsocial.app/u/${ev.creator_id}/e/${ev.id} #Evento`); setPrefilledEvent(ev); setCurrentView('feed'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} chats={chats} followerUserIds={followerUserIds} followedUserIds={followedUserIds} onShareViaChat={handleSendMessageFromShare} showMenuForPosts={isViewingOwnProfile} />}
        {currentView === 'messages' && <MessagesView user={currentUserData!} chats={chats} posts={posts} users={users} onSendMessage={handleSendMessage} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onViewPost={(pid) => { setPreviousView('messages'); setSelectedPostId(pid); setCurrentView('post-detail'); }} externalActiveId={activeChatUserId} onMarkChatAsRead={handleMarkChatAsRead} />}
        {currentView === 'notifications' && <NotificationsView notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} onNotificationClick={(id) => { if (id) { setSelectedPostId(id); setCurrentView('post-detail'); } }} />}
        {currentView === 'search' && <SearchResultsView query={searchQuery} posts={posts} users={users} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onAddComment={(pid, t) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news_comments' : 'post_comments'; const idField = post.type === 'news' ? 'news_id' : 'post_id'; supabase.from(table).insert({ [idField]: pid, author_id: session.user.id, text: t }).then(() => { if (post.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu post`, post_id: pid }); fetchFeed(); }); }} onDeletePost={async (pid) => { if (!session?.user) return; const p = posts.find(x => x.id === pid); if (!p) return; const { error: insErr } = await supabase.from('posts_eliminados').insert({ post_id: pid, user_id: session.user.id }); if (!insErr) { const table = p.type === 'news' ? 'news' : 'posts'; await supabase.from(table).delete().eq('id', pid); fetchFeed(); } }} onViewChange={(v) => { if (v === 'profile') setViewingUserId(currentUserData?.id || null); setCurrentView(v); }} currentUser={currentUserData!} followedUserIds={followedUserIds} followerUserIds={followerUserIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onNavigateToPost={(id) => { setPreviousView('search'); setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onNavigateToEvent={handleNavigateToEvent} chats={chats} onShareViaChat={handleSendMessageFromShare} />}
        {currentView === 'settings' && <SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} onLogout={() => supabase.auth.signOut()} onViewChange={(v) => setCurrentView(v)} theme={theme} onThemeChange={setTheme} />}
        {currentView === 'post-detail' && selectedPost && <FullPostView post={selectedPost} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onAddComment={(pid, t) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news_comments' : 'post_comments'; const idField = post.type === 'news' ? 'news_id' : 'post_id'; supabase.from(table).insert({ [idField]: pid, author_id: session.user.id, text: t }).then(() => { if (post.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu post`, post_id: pid }); fetchFeed(); }); }} onAddReply={handleAddReply} onVoteComment={handleVoteComment} onRepost={handleRepost} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onBack={() => setCurrentView(previousView)} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} users={users} onNavigateToEvent={handleNavigateToEvent} chats={chats} followerUserIds={followerUserIds} onShareViaChat={handleSendMessageFromShare} />}
      </Layout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
