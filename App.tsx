
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
  
  // Bloqueos de acciones para evitar doble ejecución por clics rápidos
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
        .on('postgres_changes', { event: '*', table: 'user_events' }, () => {
          fetchFeed();
          fetchGlobalEvents();
        })
        .on('postgres_changes', { event: '*', table: 'post_comments' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'news_comments' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'comment_replies' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'messages' }, () => fetchChats())
        .on('postgres_changes', { event: '*', table: 'notifications' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', table: 'profiles' }, () => {
           if (session?.user) fetchUserProfile(session.user.id);
           fetchUsers();
        })
        .on('postgres_changes', { event: '*', table: 'follows' }, () => {
           fetchFollows();
           if (session?.user) fetchUserProfile(session.user.id);
           fetchUsers();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, isResettingPassword]);

  const fetchUserProfile = async (uid: string) => {
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
        birthDate: data.birth_date
      });
    }
  };

  const fetchUsers = async () => {
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
        birthDate: u.birth_date
      })));
    }
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
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*), recipient:profiles!recipient_id(*)')
      .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
      .order('created_at', { ascending: true });

    if (error) return;

    const chatsMap = new Map<string, Chat>();

    messagesData?.forEach((m: any) => {
      const isSender = m.sender_id === session.user.id;
      const otherUser = isSender ? m.recipient : m.sender;
      if (!otherUser) return;

      const chatId = otherUser.id;
      const chat = chatsMap.get(chatId) || {
        id: chatId,
        participant: {
          id: otherUser.id,
          name: otherUser.name,
          lastName: otherUser.last_name,
          username: otherUser.username,
          avatar: otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`,
          position: otherUser.position,
          department: otherUser.department
        },
        messages: [],
        lastMessage: '',
        timestamp: new Date()
      };

      const message: Message = {
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        text: m.text,
        timestamp: new Date(m.created_at)
      };

      chat.messages.push(message);
      chat.lastMessage = m.text;
      chat.timestamp = new Date(m.created_at);
      chatsMap.set(chatId, chat);
    });

    setChats(Array.from(chatsMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const fetchNotifications = async () => {
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
        senderAvatar: n.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender_id}`,
        content: n.content,
        timestamp: n.created_at,
        isRead: n.is_read,
        postId: n.post_id
      })));
    }
  };

  const fetchGlobalEvents = async () => {
    const { data } = await supabase
      .from('user_events')
      .select('*')
      .gte('attendees_count', 2);
    if (data) {
      setGlobalEvents(data.map(ev => ({
        id: ev.id,
        creator_id: ev.creator_id,
        title: ev.title,
        type: ev.type as any,
        event_date: ev.event_date,
        event_time: ev.event_time,
        location: ev.location,
        description: ev.description,
        attendees: ev.attendees_count
      })));
    }
  };

  const fetchFeed = async () => {
    if (!session?.user) return;
    try {
      const [
        { data: postsData },
        { data: newsData },
        { data: postComments },
        { data: newsComments },
        { data: repliesData },
        { data: myPostLikes },
        { data: myNewsVotes },
        { data: myReposts },
        { data: eventsData },
        { data: profilesData }
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
      
      const profilesMap = new Map<string, any>();
      profilesData?.forEach(p => profilesMap.set(p.id, p));

      const eventsMap = new Map<string, CalendarEvent>();
      eventsData?.forEach(ev => {
        eventsMap.set(ev.id, {
          id: ev.id,
          creator_id: ev.creator_id,
          title: ev.title,
          type: ev.type as any,
          event_date: ev.event_date,
          event_time: ev.event_time,
          location: ev.location,
          description: ev.description,
          attendees: ev.attendees_count
        });
      });

      const allReplies: CommentReply[] = (repliesData || []).map((r: any) => {
        const author = profilesMap.get(r.author_id);
        return {
          id: r.id,
          commentId: r.comment_id,
          parentReplyId: r.parent_reply_id,
          authorId: r.author_id,
          authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario',
          authorUsername: author?.username,
          authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.author_id}`,
          text: r.content,
          timestamp: r.created_at,
          likes: r.likes,
          replies: []
        };
      });

      const buildReplyTree = (replies: CommentReply[]) => {
        const replyMap = new Map<string, CommentReply>();
        const roots: Map<string, CommentReply[]> = new Map();
        replies.forEach(r => replyMap.set(r.id, r));
        
        replies.forEach(r => {
          if (r.parentReplyId && replyMap.has(r.parentReplyId)) {
            const parent = replyMap.get(r.parentReplyId)!;
            parent.replies = parent.replies || [];
            parent.replies.push(r);
          } else {
            const list = roots.get(r.commentId) || [];
            list.push(r);
            roots.set(r.commentId, list);
          }
        });
        return roots;
      };

      const repliesMap = buildReplyTree(allReplies);

      const commentsMap = new Map<string, Comment[]>();
      const processComments = (data: any[], idField: string) => {
        data?.forEach((c: any) => {
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
      const repostedIds = new Set(myReposts?.map(r => r.post_id) || []);

      const formattedPosts: Post[] = (postsData || []).map((p: any) => {
        const author = profilesMap.get(p.author_id);
        return {
          id: p.id,
          authorId: p.author_id,
          authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario',
          authorUsername: author?.username,
          authorPosition: author?.position,
          authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_id}`,
          content: p.content,
          imageUrl: p.image_url,
          docUrl: p.doc_url,
          docName: p.doc_name,
          timestamp: p.created_at,
          type: 'post',
          tags: p.tags || [],
          likes: p.likes_count || 0,
          reposts: p.reposts_count || 0,
          comments: p.comments_count || 0,
          commentsList: commentsMap.get(p.id) || [],
          userLiked: upvotedIds.has(p.id),
          userReposted: repostedIds.has(p.id),
          userDownvoted: downvotedIds.has(p.id),
          linkedEventId: p.linked_event_id,
          linkedEvent: p.linked_event_id ? eventsMap.get(p.linked_event_id) : undefined
        };
      });

      const formattedNews: Post[] = (newsData || []).map((n: any) => {
        const author = profilesMap.get(n.author_id);
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
          likes: n.likes_count || 0,
          reposts: n.reposts_count || 0,
          comments: n.comments_count || 0,
          commentsList: commentsMap.get(n.id) || [],
          userLiked: upvotedIds.has(n.id),
          userReposted: repostedIds.has(n.id),
          userDownvoted: downvotedIds.has(n.id)
        };
      });

      setPosts([...formattedPosts, ...formattedNews].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (e) {
      console.error("Error fetching feed:", e);
    }
  };

  const handleToggleFollow = useCallback(async (userId: string) => {
    if (!session?.user || userId === session.user.id || processingFollows.has(userId)) return;
    
    const isCurrentlyFollowing = followedUserIds.has(userId);

    // Bloqueo inmediato
    setProcessingFollows(prev => new Set(prev).add(userId));

    // Actualización optimista del estado local (Set de IDs)
    setFollowedUserIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) next.delete(userId); else next.add(userId);
      return next;
    });

    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from('follows')
          .delete()
          .match({ 
            follower_id: session.user.id, 
            followed_id: userId 
          });
        
        setToast({ message: "Has dejado de seguir a este usuario.", type: 'info' });
      } else {
        await supabase
          .from('follows')
          .insert({ 
            follower_id: session.user.id, 
            followed_id: userId 
          });

        await supabase.from('notifications').insert({ 
          user_id: userId, 
          sender_id: session.user.id, 
          type: 'follow', 
          content: `ha comenzado a seguirte` 
        });
        
        setToast({ message: "¡Ahora sigues a este usuario!", type: 'success' });
      }
      
      // Actualizamos datos reales desde la DB (los contadores los gestiona el trigger v2)
      await Promise.all([
        fetchFollows(),
        fetchUserProfile(session.user.id),
        fetchUsers()
      ]);
    } catch (error: any) { 
      console.error("Error en toggle seguimiento:", error.message);
      setToast({ message: "Error al actualizar seguimiento.", type: 'error' });
      // Revertir estado local en caso de fallo
      fetchFollows();
    } finally {
      // Desbloqueo tras un pequeño delay
      setTimeout(() => {
        setProcessingFollows(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }, 400);
    }
  }, [session, followedUserIds, processingFollows]);

  const handleUpdateUser = async (updatedUser: User) => {
    if (!session?.user) return;
    setCurrentUserData(updatedUser);
    const { error } = await supabase.from('profiles').update({
        name: updatedUser.name, last_name: updatedUser.lastName, username: updatedUser.username?.toLowerCase().trim(), 
        email: updatedUser.email, birth_date: updatedUser.birthDate, position: updatedUser.position, department: updatedUser.department, 
        country: updatedUser.country, region: updatedUser.region, bio: updatedUser.bio, interests: updatedUser.interests, 
        avatar: updatedUser.avatar, updated_at: new Date().toISOString()
      }).eq('id', session.user.id);
    if (!error) { fetchUserProfile(session.user.id); fetchUsers(); fetchFeed(); }
  };

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, linkedEventId?: string) => {
    if (!session?.user) return;
    const table = type === 'news' ? 'news' : 'posts';
    
    const payload: any = { 
      author_id: session.user.id, 
      content, 
      tags, 
      image_url: imageUrl || null,
      updated_at: new Date().toISOString()
    };
    
    if (type === 'post') { 
      payload.doc_url = docUrl || null; 
      payload.doc_name = docName || null; 
      if (linkedEventId) {
        payload.linked_event_id = linkedEventId; 
      }
    }
    
    const { error } = await supabase.from(table).insert(payload);
    
    if (error) {
      console.error("Error al publicar:", error.message);
      setToast({ message: "No se pudo publicar. Inténtalo de nuevo.", type: "error" });
    } else {
      fetchFeed();
    }
  };

  const handlePromoteEvent = (event: any) => {
    if (!session?.user) return;
    
    const content = `📢 ¡Os invito a participar en este evento que he organizado en NovaGob!\n\n${event.title}\n\nPuedes consultar todos los detalles e inscribirte aquí: https://redsocial.app/u/${event.creator_id}/e/${event.id} #EventoNovaGob #InnovacionPublica`;
    
    setPrefilledPostContent(content);
    setPrefilledEvent({
      id: event.id,
      creator_id: event.creator_id,
      title: event.title,
      type: event.type,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location,
      description: event.description,
      attendees: event.attendees
    });
    
    setCurrentView('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setToast({ message: "Hemos preparado el texto de promoción. ¡Revisalo y publica!", type: "info" });
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!session?.user || !currentUserData) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const table = post.type === 'news' ? 'news_comments' : 'post_comments';
    const idField = post.type === 'news' ? 'news_id' : 'post_id';
    const { error } = await supabase.from(table).insert({ [idField]: postId, author_id: session.user.id, text: text });
    if (!error && post.authorId !== session.user.id) {
      await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'comment', content: `comentó en tu ${post.type === 'news' ? 'noticia' : 'post'}`, post_id: postId });
    }
    fetchFeed();
  };

  const handleAddReply = async (commentId: string, text: string, parentReplyId?: string) => {
    if (!session?.user || !currentUserData) return;
    const { error } = await supabase.from('comment_replies').insert({ 
      comment_id: commentId, 
      parent_reply_id: parentReplyId || null,
      author_id: session.user.id, 
      content: text 
    });
    if (error) { console.error("Error storing reply:", error.message); return; }
    fetchFeed(); 
  };

  const handleMarkAllRead = async () => {
    if (!session?.user) return;
    const { error = null } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
    if (!error) fetchNotifications();
  };

  const handleVote = async (id: string, dir: 'up' | 'down') => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    
    const table = post.type === 'news' ? 'news_votes' : 'post_likes';
    const idField = post.type === 'news' ? 'news_id' : 'post_id';
    
    const { data: existingVote } = await supabase.from(table).select('*').eq('user_id', session.user.id).eq(idField, id).maybeSingle();
    
    if (existingVote) {
      if (existingVote.vote_type === dir) {
        await supabase.from(table).delete().eq('user_id', session.user.id).eq(idField, id);
      } else {
        await supabase.from(table).update({ vote_type: dir }).eq('user_id', session.user.id).eq(idField, id);
        if (dir === 'up' && post.authorId !== session.user.id) {
          await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'like', content: `reaccionó a tu ${post.type === 'news' ? 'noticia' : 'post'}`, post_id: id });
        }
      }
    } else {
      await supabase.from(table).insert({ user_id: session.user.id, [idField]: id, vote_type: dir });
      if (dir === 'up' && post.authorId !== session.user.id) {
        await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'like', content: `reaccionó a tu ${post.type === 'news' ? 'noticia' : 'post'}`, post_id: id });
      }
    }
    fetchFeed();
  };

  const handleRepost = async (postId: string) => {
    if (!session?.user || processingReposts.has(postId)) return;
    
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    setProcessingReposts(prev => new Set(prev).add(postId));

    const isAdding = !targetPost.userReposted;
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          userReposted: isAdding,
          reposts: isAdding ? p.reposts + 1 : Math.max(0, p.reposts - 1)
        };
      }
      return p;
    }));

    try {
      const { data: existingRepost } = await supabase
        .from('post_reposts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (existingRepost) {
        await supabase
          .from('post_reposts')
          .delete()
          .eq('user_id', session.user.id)
          .eq('post_id', postId);
        
        setToast({ message: "Has eliminado tu republicación.", type: 'info' });
      } else {
        await supabase
          .from('post_reposts')
          .insert({ 
            user_id: session.user.id, 
            post_id: postId 
          });

        setToast({ message: "¡Publicación republicada con éxito!", type: 'success' });
      }
      
    } catch (err: any) {
      console.error("Error en repost:", err.message);
      setToast({ message: "No se pudo completar la acción. Revisa tu conexión.", type: 'error' });
      fetchFeed(); 
    } finally {
      setTimeout(() => {
        setProcessingReposts(prev => {
            const next = new Set(prev);
            next.delete(postId);
            return next;
        });
      }, 500);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const table = post.type === 'news' ? 'news' : 'posts';
    const { error } = await supabase.from(table).delete().eq('id', postId).eq('author_id', session.user.id);
    if (!error) fetchFeed();
  };

  const handleViewChange = (view: AppView) => {
    if (view === 'profile') setViewingUserId(currentUserData?.id || null);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToEvent = (userId: string, eventId: string) => {
    setViewingUserId(userId);
    setTargetEventId(eventId);
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoadingAuth || (!currentUserData && session && !isResettingPassword)) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>;
  if (isResettingPassword) return <UpdatePassword onComplete={() => setIsResettingPassword(false)} />;
  if (!session) {
    if (isRegistering) return <Onboarding onComplete={() => setIsRegistering(false)} onCancel={() => setIsRegistering(false)} />;
    return <Login onLogin={() => {}} onRegister={() => setIsRegistering(true)} />;
  }

  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : null;
  const isViewingOwnProfile = !viewingUserId || viewingUserId === currentUserData?.id;

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Layout 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        user={currentUserData!} 
        notifications={notifications} 
        globalEvents={globalEvents}
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        onSearchSubmit={(q) => { setSearchQuery(q); setCurrentView('search'); }}
        onLogout={() => supabase.auth.signOut()} 
        isViewingOwnProfile={isViewingOwnProfile}
      >
        {currentView === 'feed' && <SocialFeed posts={posts.filter(p => p.type === 'post')} user={currentUserData!} onLike={(id) => handleVote(id, 'up')} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={handleAddComment} users={users} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} followedUserIds={followedUserIds} onNavigateToPost={(id) => { setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onDeletePost={handleDeletePost} initialContent={prefilledPostContent} prefilledEvent={prefilledEvent} onClearInitialContent={() => { setPrefilledPostContent(null); setPrefilledEvent(null); }} onViewCalendar={() => setCurrentView('calendar')} onNavigateToEvent={handleNavigateToEvent} />}
        {currentView === 'news' && <NewsHubView posts={posts.filter(p => p.type === 'news')} user={currentUserData!} onVote={handleVote} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={handleAddComment} currentUser={currentUserData!} users={users} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onNavigateToPost={(id) => { setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onDeletePost={handleDeletePost} />}
        {currentView === 'calendar' && <CalendarView onNavigateToEvent={handleNavigateToEvent} onPromoteEvent={handlePromoteEvent} />}
        {currentView === 'profile' && <ProfileView 
          user={users.find(u => u.id === viewingUserId) || currentUserData!} 
          isCurrentUser={isViewingOwnProfile} 
          posts={posts} 
          onUpdateUser={handleUpdateUser} 
          currentUser={currentUserData!} 
          onRepost={handleRepost} 
          onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} 
          onToggleFollow={handleToggleFollow} 
          isFollowed={followedUserIds.has(viewingUserId || '')} 
          users={users} 
          onNavigateToPost={(id) => { setSelectedPostId(id); setCurrentView('post-detail'); }} 
          onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} 
          onDeletePost={handleDeletePost} 
          onNavigateToEvent={handleNavigateToEvent} 
          focusedEventId={targetEventId} 
          onClearFocusedEvent={() => setTargetEventId(null)} 
          onStartChat={(targetUser) => {
            setActiveChatUserId(targetUser.id);
            setCurrentView('messages');
          }}
          onAddPost={handleAddPost}
          onPromoteEvent={handlePromoteEvent}
        />}
        {currentView === 'messages' && <MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={(r, t) => supabase.from('messages').insert({ sender_id: session.user.id, recipient_id: r, text: t }).then(() => fetchChats())} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} externalActiveId={activeChatUserId} />}
        {currentView === 'notifications' && <NotificationsView notifications={notifications} onMarkAllRead={handleMarkAllRead} onNotificationClick={(id) => { if (id) { setSelectedPostId(id); setCurrentView('post-detail'); } }} />}
        {currentView === 'search' && <SearchResultsView query={searchQuery} posts={posts} users={users} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} onViewChange={handleViewChange} currentUser={currentUserData!} followedUserIds={followedUserIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onNavigateToPost={(id) => { setSelectedPostId(id); setCurrentView('post-detail'); }} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} onNavigateToEvent={handleNavigateToEvent} />}
        {currentView === 'settings' && <SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} onLogout={() => supabase.auth.signOut()} onViewChange={handleViewChange} theme={theme} onThemeChange={setTheme} />}
        {currentView === 'post-detail' && selectedPost && <FullPostView post={selectedPost} onAddComment={handleAddComment} onAddReply={handleAddReply} onRepost={handleRepost} onNavigateToProfile={(id) => { setViewingUserId(id); setTargetEventId(null); setCurrentView('profile'); }} onBack={() => setCurrentView('feed')} onSearchHashtag={(t) => { setSearchQuery(t); setCurrentView('search'); }} users={users} onNavigateToEvent={handleNavigateToEvent} />}
      </Layout>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
