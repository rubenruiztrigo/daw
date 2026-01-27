
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
import { User, Post, Chat, Message, Notification, Comment, AppView } from './types';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');

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
      fetchFeed();
      fetchUsers();
      fetchFollows();
      fetchChats();
      fetchNotifications();

      const channel = supabase
        .channel('app_realtime_sync')
        .on('postgres_changes', { event: '*', table: 'posts' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'news' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'post_reposts' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'messages' }, () => fetchChats())
        .on('postgres_changes', { event: '*', table: 'notifications' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', table: 'profiles' }, () => {
           if (session?.user) fetchUserProfile(session.user.id);
           fetchUsers();
           fetchFeed();
        })
        .on('postgres_changes', { event: '*', table: 'follows' }, () => {
           fetchFollows();
           fetchUsers();
           if (session?.user) fetchUserProfile(session.user.id);
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
        bannerColor: data.banner_color,
        bio: data.bio || '',
        interests: data.interests || [],
        followers: data.followers_count || 0,
        following: data.following_count || 0,
        country: data.country,
        region: data.region,
        joinedDate: data.created_at,
        birthDate: data.birth_date // Corregido: mapeo de fecha de nacimiento
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
        bannerColor: u.banner_color,
        bio: u.bio || '',
        interests: u.interests || [],
        followers: u.followers_count || 0,
        following: u.following_count || 0,
        country: u.country,
        region: u.region,
        joinedDate: u.created_at,
        birthDate: u.birth_date // Corregido: mapeo de fecha de nacimiento
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

    if (error) {
      console.error('Error fetching chats:', error);
      return;
    }

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
    const { data, error } = await supabase
      .from('notifications')
      .select('*, sender:profiles!sender_id(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

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
  };

  const fetchFeed = async () => {
    if (!session?.user) return;
    const [
      { data: postsData },
      { data: newsData },
      { data: postComments },
      { data: newsComments },
      { data: myPostLikes },
      { data: myNewsVotes },
      { data: myReposts }
    ] = await Promise.all([
      supabase.from('posts').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('news').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('post_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('news_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('post_likes').select('post_id, vote_type').eq('user_id', session.user.id),
      supabase.from('news_votes').select('news_id, vote_type').eq('user_id', session.user.id),
      supabase.from('post_reposts').select('post_id').eq('user_id', session.user.id)
    ]);
    
    const commentsMap = new Map<string, Comment[]>();
    const processComments = (data: any[], idField: string) => {
      data?.forEach((c: any) => {
        const targetId = c[idField];
        const list = commentsMap.get(targetId) || [];
        list.push({
          id: c.id,
          authorId: c.author_id,
          authorName: `${c.author?.name} ${c.author?.last_name || ''}`,
          authorAvatar: c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_id}`,
          text: c.text,
          timestamp: c.created_at
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

    const formattedPosts: Post[] = (postsData || []).map((p: any) => ({
      id: p.id,
      authorId: p.author_id,
      authorName: `${p.author?.name} ${p.author?.last_name || ''}`,
      authorUsername: p.author?.username,
      authorPosition: p.author?.position,
      authorAvatar: p.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_id}`,
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
      userDownvoted: downvotedIds.has(p.id)
    }));

    const formattedNews: Post[] = (newsData || []).map((n: any) => ({
      id: n.id,
      authorId: n.author_id,
      authorName: `${n.author?.name} ${n.author?.last_name || ''}`,
      authorUsername: n.author?.username,
      authorPosition: n.author?.position,
      authorAvatar: n.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.author_id}`,
      content: n.content,
      imageUrl: n.image_url,
      timestamp: n.created_at,
      type: 'news',
      tags: n.tags || [],
      likes: n.likes_count || 0,
      reposts: 0,
      comments: n.comments_count || 0,
      commentsList: commentsMap.get(n.id) || [],
      userLiked: upvotedIds.has(n.id),
      userReposted: false,
      userDownvoted: downvotedIds.has(n.id)
    }));

    setPosts([...formattedPosts, ...formattedNews].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleToggleFollow = useCallback(async (userId: string) => {
    if (!session?.user || userId === session.user.id) return;
    const isCurrentlyFollowing = followedUserIds.has(userId);
    
    setFollowedUserIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) next.delete(userId);
      else next.add(userId);
      return next;
    });

    try {
      if (isCurrentlyFollowing) {
        await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('followed_id', userId);
      } else {
        await supabase.from('follows').insert({ follower_id: session.user.id, followed_id: userId });
        await supabase.from('notifications').insert({ user_id: userId, sender_id: session.user.id, type: 'follow', content: `ha comenzado a seguirte` });
      }
      
      await Promise.all([
        fetchFollows(),
        fetchUserProfile(session.user.id),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Error toggling follow:', error);
      fetchFollows();
    }
  }, [session, followedUserIds]);

  const handleUpdateUser = async (updatedUser: User) => {
    if (!session?.user) return;
    const cleanUsername = updatedUser.username?.toLowerCase().trim();
    setCurrentUserData(updatedUser);

    const { error } = await supabase.from('profiles').update({
        name: updatedUser.name, 
        last_name: updatedUser.lastName, 
        username: cleanUsername, 
        email: updatedUser.email, 
        birth_date: updatedUser.birthDate, 
        position: updatedUser.position, 
        department: updatedUser.department, 
        country: updatedUser.country, 
        region: updatedUser.region, 
        bio: updatedUser.bio, 
        interests: updatedUser.interests, 
        avatar: updatedUser.avatar, 
        banner_color: updatedUser.bannerColor,
        updated_at: new Date().toISOString()
      }).eq('id', session.user.id);

    if (!error) { 
      await Promise.all([
        fetchUserProfile(session.user.id),
        fetchUsers(),
        fetchFeed()
      ]);
    } else {
      console.error("Error updating profile:", error);
      fetchUserProfile(session.user.id);
    }
  };

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string) => {
    if (!session?.user) return;
    const table = type === 'news' ? 'news' : 'posts';
    const payload: any = { author_id: session.user.id, content, tags, image_url: imageUrl };
    if (type === 'post') { payload.doc_url = docUrl; payload.doc_name = docName; }
    const { error } = await supabase.from(table).insert(payload);
    if (!error) fetchFeed();
  };

  const handleVote = async (id: string, dir: 'up' | 'down') => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const table = post.type === 'news' ? 'news_votes' : 'post_likes';
    const idField = post.type === 'news' ? 'news_id' : 'post_id';
    const { data: existingVote } = await supabase.from(table).select('*').eq('user_id', session.user.id).eq(idField, id).maybeSingle();
    if (existingVote) {
      if (existingVote.vote_type === dir) await supabase.from(table).delete().eq('user_id', session.user.id).eq(idField, id); 
      else await supabase.from(table).update({ vote_type: dir }).eq('user_id', session.user.id).eq(idField, id); 
    } else { 
      await supabase.from(table).insert({ user_id: session.user.id, [idField]: id, vote_type: dir }); 
    }
    fetchFeed();
  };

  const handleSearchHashtag = (tag: string) => {
    setSearchQuery(tag);
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (view: AppView) => {
    if (view === 'profile') setViewingUserId(currentUserData?.id || null);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToProfile = (userId: string) => {
    setViewingUserId(userId);
    setCurrentView('profile');
  };

  const handleNavigateToPost = (postId: string) => {
    setSelectedPostId(postId);
    setCurrentView('post-detail');
  };

  const handleSendMessage = async (recipientId: string, text: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('messages').insert({ 
      sender_id: session.user.id, 
      recipient_id: recipientId, 
      text 
    });
    if (!error) fetchChats();
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
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        onSearchSubmit={handleSearchSubmit}
        onLogout={() => supabase.auth.signOut()}
        isViewingOwnProfile={isViewingOwnProfile}
      >
        {currentView === 'feed' && <SocialFeed posts={posts.filter(p => p.type === 'post')} user={currentUserData!} onLike={(id) => handleVote(id, 'up')} onRepost={() => {}} onAddPost={handleAddPost} onAddComment={() => {}} users={users} onNavigateToProfile={handleNavigateToProfile} followedUserIds={followedUserIds} onNavigateToPost={handleNavigateToPost} onSearchHashtag={handleSearchHashtag} />}
        {currentView === 'news' && <NewsHubView posts={posts.filter(p => p.type === 'news')} user={currentUserData!} onVote={handleVote} onAddPost={handleAddPost} onAddComment={() => {}} currentUser={currentUserData!} users={users} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={handleNavigateToPost} onSearchHashtag={handleSearchHashtag} />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'profile' && <ProfileView user={users.find(u => u.id === viewingUserId) || currentUserData!} isCurrentUser={isViewingOwnProfile} posts={posts} onUpdateUser={handleUpdateUser} currentUser={currentUserData!} onRepost={() => {}} onNavigateToProfile={handleNavigateToProfile} onToggleFollow={handleToggleFollow} isFollowed={followedUserIds.has(viewingUserId || '')} users={users} onNavigateToPost={handleNavigateToPost} onSearchHashtag={handleSearchHashtag} />}
        {currentView === 'messages' && <MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={handleSendMessage} onNavigateToProfile={handleNavigateToProfile} externalActiveId={activeChatUserId} />}
        {currentView === 'notifications' && <NotificationsView notifications={notifications} onMarkAllRead={() => {}} onNotificationClick={handleNavigateToPost} />}
        {currentView === 'search' && <SearchResultsView query={searchQuery} posts={posts} users={users} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={() => {}} onAddComment={() => {}} onViewChange={handleViewChange} currentUser={currentUserData!} followedUserIds={followedUserIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={handleNavigateToPost} onSearchHashtag={handleSearchHashtag} />}
        {currentView === 'settings' && <SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} onLogout={() => supabase.auth.signOut()} onViewChange={handleViewChange} theme={theme} onThemeChange={setTheme} />}
        {currentView === 'post-detail' && selectedPost && <FullPostView post={selectedPost} onAddComment={() => {}} onRepost={() => {}} onNavigateToProfile={handleNavigateToProfile} onBack={() => setCurrentView('feed')} onSearchHashtag={handleSearchHashtag} />}
      </Layout>
    </div>
  );
};

export default App;
