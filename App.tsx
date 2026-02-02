
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
import { UpdatePassword } from './components/UpdatePassword';
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalEvents, setGlobalEvents] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  const [processingReposts, setProcessingReposts] = useState<Set<string>>(new Set());
  const [processingFollows, setProcessingFollows] = useState<Set<string>>(new Set());

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
        .on('postgres_changes', { event: '*', table: 'posts' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'news' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'post_reposts' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'user_events' }, () => { fetchFeed(); fetchGlobalEvents(); })
        .on('postgres_changes', { event: '*', table: 'post_comments' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'news_comments' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'comment_replies' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'messages' }, () => fetchChats())
        .on('postgres_changes', { event: '*', table: 'notifications' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', table: 'profiles' }, () => { if (session?.user) fetchUserProfile(session.user.id); fetchUsers(); })
        .on('postgres_changes', { event: '*', table: 'follows' }, () => { fetchFollows(); if (session?.user) fetchUserProfile(session.user.id); fetchUsers(); })
        .on('postgres_changes', { event: '*', table: 'post_likes' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'news_votes' }, () => fetchFeed())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [session, isResettingPassword]);

  const fetchUserProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setCurrentUserData({ id: data.id, name: data.name, lastName: data.last_name, username: data.username, email: data.email, position: data.position || 'Personal Público', department: data.department || 'Administración', avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`, bio: data.bio || '', interests: data.interests || [], followers: data.followers_count || 0, following: data.following_count || 0, country: data.country, region: data.region, joinedDate: data.created_at, birthDate: data.birth_date });
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setUsers(data.map((u: any) => ({ id: u.id, name: u.name, lastName: u.last_name, username: u.username, email: u.email, position: u.position || 'Personal Público', department: u.department || 'Administración', avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`, bio: u.bio || '', interests: u.interests || [], followers: u.followers_count || 0, following: u.following_count || 0, country: u.country, region: u.region, joinedDate: u.created_at, birthDate: u.birth_date })));
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
    const chatsMap = new Map<string, Chat>();
    messagesData?.forEach((m: any) => {
      const otherUser = m.sender_id === session.user.id ? m.recipient : m.sender;
      if (!otherUser) return;
      const chatId = otherUser.id;
      const chat = chatsMap.get(chatId) || { id: chatId, participant: { id: otherUser.id, name: otherUser.name, lastName: otherUser.last_name, username: otherUser.username, avatar: otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`, position: otherUser.position, department: otherUser.department }, messages: [], lastMessage: '', timestamp: new Date() };
      chat.messages.push({ id: m.id, senderId: m.sender_id, recipientId: m.recipient_id, text: m.text, timestamp: new Date(m.created_at) });
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
        { data: myPostLikes }, { data: myNewsVotes }, { data: myReposts }, { data: eventsData }, { data: profilesData }
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
        supabase.from('profiles').select('*')
      ]);
      
      const profilesMap = new Map(); profilesData?.forEach(p => profilesMap.set(p.id, p));
      const eventsMap = new Map(); eventsData?.forEach(ev => eventsMap.set(ev.id, { id: ev.id, creator_id: ev.creator_id, title: ev.title, type: ev.type as any, event_date: ev.event_date, event_time: ev.event_time, location: ev.location, description: ev.description, attendees: ev.attendees_count }));
      const allReplies = (repliesData || []).map((r: any) => { const author = profilesMap.get(r.author_id); return { id: r.id, commentId: r.comment_id, parentReplyId: r.parent_reply_id, authorId: r.author_id, authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario', authorUsername: author?.username, authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.author_id}`, text: r.content, timestamp: r.created_at, likes: r.likes, replies: [] }; });
      const buildReplyTree = (replies: any[]) => { const roots = new Map(); replies.forEach(r => { if (r.parentReplyId) { const parent = replies.find(pr => pr.id === r.parentReplyId); if (parent) (parent.replies = parent.replies || []).push(r); } else { const list = roots.get(r.commentId) || []; list.push(r); roots.set(r.commentId, list); } }); return roots; };
      const repliesMap = buildReplyTree(allReplies);
      const commentsMap = new Map();
      const processComments = (data: any[], idField: string) => data?.forEach((c: any) => { const targetId = c[idField]; const list = commentsMap.get(targetId) || []; list.push({ id: c.id, authorId: c.author_id, authorName: `${c.author?.name} ${c.author?.last_name || ''}`, authorUsername: c.author?.username, authorAvatar: c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_id}`, text: c.text, timestamp: c.created_at, replies: repliesMap.get(c.id) || [] }); commentsMap.set(targetId, list); });
      processComments(postComments || [], 'post_id'); processComments(newsComments || [], 'news_id');
      const upvotedIds = new Set([...(myPostLikes?.filter(l => l.vote_type === 'up').map(l => l.post_id) || []), ...(myNewsVotes?.filter(l => l.vote_type === 'up').map(l => l.news_id) || [])]);
      const downvotedIds = new Set([...(myPostLikes?.filter(l => l.vote_type === 'down').map(l => l.post_id) || []), ...(myNewsVotes?.filter(l => l.vote_type === 'down').map(l => l.news_id) || [])]);
      const repostedIds = new Set(myReposts?.map(r => r.post_id) || []);
      const formattedPosts = (postsData || []).map((p: any) => { const author = profilesMap.get(p.author_id); return { id: p.id, authorId: p.author_id, authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario', authorUsername: author?.username, authorPosition: author?.position, authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_id}`, content: p.content, imageUrl: p.image_url, docUrl: p.doc_url, docName: p.doc_name, timestamp: p.created_at, type: 'post', tags: p.tags || [], likes: p.likes_count || 0, reposts: p.reposts_count || 0, comments: p.comments_count || 0, commentsList: commentsMap.get(p.id) || [], userLiked: upvotedIds.has(p.id), userReposted: repostedIds.has(p.id), userDownvoted: downvotedIds.has(p.id), linkedEventId: p.linked_event_id, linkedEvent: p.linked_event_id ? eventsMap.get(p.linked_event_id) : undefined }; });
      const formattedNews = (newsData || []).map((n: any) => { const author = profilesMap.get(n.author_id); return { id: n.id, authorId: n.author_id, authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario', authorUsername: author?.username, authorPosition: author?.position, authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.author_id}`, content: n.content, imageUrl: n.image_url, timestamp: n.created_at, type: 'news', tags: n.tags || [], likes: n.likes_count || 0, reposts: n.reposts_count || 0, comments: n.comments_count || 0, commentsList: commentsMap.get(n.id) || [], userLiked: upvotedIds.has(n.id), userReposted: repostedIds.has(n.id), userDownvoted: downvotedIds.has(n.id) }; });
      setPosts([...formattedPosts, ...formattedNews].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (e) { console.error("Error fetching feed:", e); }
  };

  const handleVote = useCallback(async (id: string, dir: 'up' | 'down') => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const isNews = post.type === 'news';
    const table = isNews ? 'news_votes' : 'post_likes';
    const idField = isNews ? 'news_id' : 'post_id';

    // Logica Optimista para respuesta instantánea en UI
    const originalPost = { ...post };
    let newLikes = post.likes;
    let newUserLiked = post.userLiked;
    let newUserDownvoted = post.userDownvoted;

    if (isNews) {
      if (dir === 'up') {
        if (newUserLiked) { newLikes = Math.max(0, newLikes - 1); newUserLiked = false; } 
        else { newLikes = newLikes + 1; newUserLiked = true; newUserDownvoted = false; }
      } else {
        if (newUserDownvoted) { newUserDownvoted = false; } 
        else { newUserDownvoted = true; if (newUserLiked) { newLikes = Math.max(0, newLikes - 1); newUserLiked = false; } }
      }
    } else {
      if (newUserLiked && dir === 'up') { newLikes--; newUserLiked = false; } 
      else if (newUserDownvoted && dir === 'down') { newLikes++; newUserDownvoted = false; } 
      else if (newUserLiked && dir === 'down') { newLikes -= 2; newUserLiked = false; newUserDownvoted = true; } 
      else if (newUserDownvoted && dir === 'up') { newLikes += 2; newUserDownvoted = false; newUserLiked = true; } 
      else if (dir === 'up') { newLikes++; newUserLiked = true; } 
      else { newLikes--; newUserDownvoted = true; }
    }

    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: newLikes, userLiked: newUserLiked, userDownvoted: newUserDownvoted } : p));

    try {
      const { data: existing } = await supabase.from(table).select('*').eq('user_id', session.user.id).eq(idField, id).maybeSingle();
      if (existing) {
        if (existing.vote_type === dir) await supabase.from(table).delete().eq('user_id', session.user.id).eq(idField, id);
        else await supabase.from(table).update({ vote_type: dir }).eq('user_id', session.user.id).eq(idField, id);
      } else {
        await supabase.from(table).insert({ user_id: session.user.id, [idField]: id, vote_type: dir });
        if (post.authorId !== session.user.id && dir === 'up') {
          await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'like', content: `le ha gustado tu ${isNews ? 'noticia' : 'post'}`, post_id: id });
        }
      }
    } catch (err) {
      setPosts(prev => prev.map(p => p.id === id ? originalPost : p));
      setToast({ message: "Error al registrar tu voto.", type: 'error' });
    }
  }, [session, posts]);

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
    const { error } = await supabase.from('profiles').update({ name: updatedUser.name, last_name: updatedUser.lastName, username: updatedUser.username?.toLowerCase().trim(), email: updatedUser.email, birth_date: updatedUser.birthDate, position: updatedUser.position, department: updatedUser.department, country: updatedUser.country, region: updatedUser.region, bio: updatedUser.bio, interests: updatedUser.interests, avatar: updatedUser.avatar, updated_at: new Date().toISOString() }).eq('id', session.user.id);
    if (!error) { fetchUserProfile(session.user.id); fetchUsers(); fetchFeed(); }
  };

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, linkedEventId?: string) => {
    if (!session?.user) return;
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

  const handleNavigateToEvent = (userId: string, eventId: string) => { setViewingUserId(userId); setTargetEventId(eventId); setCurrentView('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSendMessageFromShare = async (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string) => { if (!session?.user) return; await supabase.from('messages').insert({ sender_id: session.user.id, recipient_id: recipientId, text: text, is_post_share: !!sharedPostId, post_id: sharedPostId || null, is_profile_share: !!sharedProfileId, shared_profile_id: sharedProfileId || null }); setToast({ message: "Contenido compartido por chat.", type: 'success' }); };

  if (isLoadingAuth || (!currentUserData && session && !isResettingPassword)) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>;
  if (isResettingPassword) return <UpdatePassword onComplete={() => setIsResettingPassword(false)} />;
  if (!session) { if (isRegistering) return <Onboarding onComplete={() => setIsRegistering(false)} onCancel={() => setIsRegistering(false)} />; return <Login onLogin={() => {}} onRegister={() => setIsRegistering(true)} />; }

  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : null;
  const isViewingOwnProfile = !viewingUserId || viewingUserId === currentUserData?.id;

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Layout currentView={currentView} onViewChange={(v) => { if (v === 'profile') setViewingUserId(currentUserData?.id || null); setCurrentView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }} user={currentUserData!} notifications={notifications} globalEvents={globalEvents} posts={posts} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={(q) => { setSearchQuery(q); setCurrentView('search'); }} onLogout={() => supabase.auth.signOut()} isViewingOwnProfile={isViewingOwnProfile}>
        {currentView === 'feed' && <SocialFeed posts={posts.filter(p => p.type === 'post')} user={currentUserData!} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={(pid, t) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news_comments' : 'post_comments'; const idField = post.type === 'news' ? 'news_id' : 'post_id'; supabase.from(table).insert({ [idField]: pid, author_id: session.user.id, text: t }).then(() => { if (post.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu post`, post_id: pid }); }); }} users={users} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} followedUserIds={followedUserIds} followerUserIds={followerUserIds} onNavigateToPost={(id) => { setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onDeletePost={(pid) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news' : 'posts'; supabase.from(table).delete().eq('id', pid).eq('author_id', session.user.id); }} initialContent={prefilledPostContent} prefilledEvent={prefilledEvent} onClearInitialContent={() => { setPrefilledPostContent(null); setPrefilledEvent(null); }} onViewCalendar={() => setCurrentView('calendar')} onNavigateToEvent={handleNavigateToEvent} chats={chats} onShareViaChat={handleSendMessageFromShare} />}
        {currentView === 'news' && <NewsHubView posts={posts.filter(p => p.type === 'news')} user={currentUserData!} onVote={handleVote} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={(pid, t) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news_comments' : 'post_comments'; const idField = post.type === 'news' ? 'news_id' : 'post_id'; supabase.from(table).insert({ [idField]: pid, author_id: session.user.id, text: t }).then(() => { if (post.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu noticia`, post_id: pid }); }); }} currentUser={currentUserData!} users={users} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onNavigateToPost={(id) => { setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onDeletePost={(pid) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news' : 'posts'; supabase.from(table).delete().eq('id', pid).eq('author_id', session.user.id); }} chats={chats} followerUserIds={followerUserIds} onShareViaChat={handleSendMessageFromShare} />}
        {currentView === 'calendar' && <CalendarView onNavigateToEvent={handleNavigateToEvent} onPromoteEvent={(ev) => { setPrefilledPostContent(`📢 ¡Os invito a participar en este evento!\n\n${ev.title}\n\nhttps://redsocial.app/u/${ev.creator_id}/e/${ev.id} #Evento`); setPrefilledEvent(ev); setCurrentView('feed'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
        {currentView === 'profile' && <ProfileView user={users.find(u => u.id === viewingUserId) || currentUserData!} isCurrentUser={isViewingOwnProfile} posts={posts} onUpdateUser={handleUpdateUser} currentUser={currentUserData!} onRepost={handleRepost} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onToggleFollow={handleToggleFollow} isFollowed={followedUserIds.has(viewingUserId || '')} users={users} onNavigateToPost={(id) => { setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onDeletePost={(pid) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news' : 'posts'; supabase.from(table).delete().eq('id', pid).eq('author_id', session.user.id); }} onNavigateToEvent={handleNavigateToEvent} focusedEventId={targetEventId} onClearFocusedEvent={() => setTargetEventId(null)} onStartChat={(tu) => { setActiveChatUserId(tu.id); setCurrentView('messages'); }} onAddPost={handleAddPost} onPromoteEvent={(ev) => { setPrefilledPostContent(`📢 ¡Evento organizado!\n\n${ev.title}\n\nhttps://redsocial.app/u/${ev.creator_id}/e/${ev.id} #Evento`); setPrefilledEvent(ev); setCurrentView('feed'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} chats={chats} followerUserIds={followerUserIds} onShareViaChat={handleSendMessageFromShare} />}
        {currentView === 'messages' && <MessagesView user={currentUserData!} chats={chats} posts={posts} users={users} onSendMessage={(r, t) => supabase.from('messages').insert({ sender_id: session.user.id, recipient_id: r, text: t })} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onViewPost={(pid) => { setSelectedPostId(pid); setCurrentView('post-detail'); }} externalActiveId={activeChatUserId} />}
        {currentView === 'notifications' && <NotificationsView notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} onNotificationClick={(id) => { if (id) { setSelectedPostId(id); setCurrentView('post-detail'); } }} />}
        {currentView === 'search' && <SearchResultsView query={searchQuery} posts={posts} users={users} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onAddComment={(pid, t) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news_comments' : 'post_comments'; const idField = post.type === 'news' ? 'news_id' : 'post_id'; supabase.from(table).insert({ [idField]: pid, author_id: session.user.id, text: t }).then(() => { if (post.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu post`, post_id: pid }); }); }} onDeletePost={(pid) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news' : 'posts'; supabase.from(table).delete().eq('id', pid).eq('author_id', session.user.id); }} onViewChange={(v) => { if (v === 'profile') setViewingUserId(currentUserData?.id || null); setCurrentView(v); }} currentUser={currentUserData!} followedUserIds={followedUserIds} followerUserIds={followerUserIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onNavigateToPost={(id) => { setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onNavigateToEvent={handleNavigateToEvent} chats={chats} onShareViaChat={handleSendMessageFromShare} />}
        {currentView === 'settings' && <SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} onLogout={() => supabase.auth.signOut()} onViewChange={(v) => setCurrentView(v)} theme={theme} onThemeChange={setTheme} />}
        {currentView === 'post-detail' && selectedPost && <FullPostView post={selectedPost} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onAddComment={(pid, t) => { const post = posts.find(p => p.id === pid); if (!post) return; const table = post.type === 'news' ? 'news_comments' : 'post_comments'; const idField = post.type === 'news' ? 'news_id' : 'post_id'; supabase.from(table).insert({ [idField]: pid, author_id: session.user.id, text: t }).then(() => { if (post.authorId !== session.user.id) supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu post`, post_id: pid }); }); }} onAddReply={handleAddReply} onRepost={handleRepost} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onBack={() => setCurrentView('feed')} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} users={users} onNavigateToEvent={handleNavigateToEvent} chats={chats} followerUserIds={followerUserIds} onShareViaChat={handleSendMessageFromShare} />}
      </Layout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
