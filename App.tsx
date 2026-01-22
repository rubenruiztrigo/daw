
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { NewsHubView } from './components/NewsHubView';
import { SearchResultsView } from './components/SearchResultsView';
import { SettingsView } from './components/SettingsView';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { NotificationsView } from './components/NotificationsView';
import { User, Post, Chat, Message, Notification, Comment } from './types';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

type AppView = 'feed' | 'profile' | 'messages' | 'news' | 'search' | 'settings' | 'notifications';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
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

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile(session.user.id);
      fetchFeed();
      fetchUsers();
      fetchFollows();
      fetchChats();
      fetchNotifications();

      const channel = supabase
        .channel('app_realtime_v13')
        .on('postgres_changes', { event: '*', table: 'posts' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'post_likes' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'post_comments' }, () => fetchFeed())
        .on('postgres_changes', { event: '*', table: 'notifications' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', table: 'profiles' }, () => {
           if (session?.user) fetchUserProfile(session.user.id);
           fetchUsers();
        })
        .on('postgres_changes', { event: '*', table: 'follows' }, () => fetchFollows())
        .on('postgres_changes', { event: '*', table: 'messages' }, () => fetchChats())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

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
        gender: data.gender,
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
        gender: u.gender,
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
    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*), recipient:profiles!recipient_id(*)')
      .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
      .order('created_at', { ascending: true });

    if (messages) {
      const chatGroups = new Map<string, Chat>();
      messages.forEach((m: any) => {
        const isSender = m.sender_id === session.user.id;
        const otherId = isSender ? m.recipient_id : m.sender_id;
        const otherProfile = isSender ? m.recipient : m.sender;
        if (!chatGroups.has(otherId)) {
          chatGroups.set(otherId, {
            id: otherId,
            participant: {
              id: otherId,
              name: otherProfile?.name,
              lastName: otherProfile?.last_name,
              avatar: otherProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`,
              position: otherProfile?.position,
              department: otherProfile?.department
            },
            messages: [],
            lastMessage: '',
            timestamp: new Date()
          });
        }
        const chat = chatGroups.get(otherId)!;
        chat.messages.push({
          id: m.id,
          senderId: m.sender_id,
          recipientId: m.recipient_id,
          text: m.text,
          timestamp: new Date(m.created_at)
        });
        chat.lastMessage = m.text;
        chat.timestamp = new Date(m.created_at);
      });
      setChats(Array.from(chatGroups.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    }
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

  const fetchFeed = async () => {
    if (!session?.user) return;
    const [
      { data: postsData },
      { data: postComments },
      { data: myPostLikes }
    ] = await Promise.all([
      supabase.from('posts').select('*, author:profiles!author_id(*)').order('created_at', { ascending: false }),
      supabase.from('post_comments').select('*, author:profiles!author_id(*)').order('created_at', { ascending: true }),
      supabase.from('post_likes').select('post_id, vote_type').eq('user_id', session.user.id)
    ]);
    
    const commentsMap = new Map<string, Comment[]>();
    postComments?.forEach((c: any) => {
      const list = commentsMap.get(c.post_id) || [];
      list.push({
        id: c.id,
        authorId: c.author_id,
        authorName: `${c.author?.name} ${c.author?.last_name || ''}`,
        authorAvatar: c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_id}`,
        text: c.text,
        timestamp: c.created_at
      });
      commentsMap.set(c.post_id, list);
    });

    const upvotedPosts = new Set(myPostLikes?.filter(l => l.vote_type === 'up').map(l => l.post_id) || []);
    const downvotedPosts = new Set(myPostLikes?.filter(l => l.vote_type === 'down').map(l => l.post_id) || []);

    const formattedPosts: Post[] = (postsData || []).map((p: any) => ({
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
      type: p.type as 'post' | 'news',
      tags: p.tags || [],
      likes: p.likes_count || 0,
      comments: p.comments_count || 0,
      commentsList: commentsMap.get(p.id) || [],
      userLiked: upvotedPosts.has(p.id),
      userDownvoted: downvotedPosts.has(p.id)
    }));
    setPosts(formattedPosts);
  };

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string) => {
    if (!session?.user) return;
    const payload: any = { 
      author_id: session.user.id, 
      content, 
      type,
      tags, 
      image_url: imageUrl,
      doc_url: docUrl,
      doc_name: docName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('posts').insert(payload);
    if (!error) fetchFeed();
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: session.user.id,
      text,
      created_at: new Date().toISOString()
    });
    if (!error) fetchFeed();
  };

  const handleVote = async (id: string, dir: 'up' | 'down') => {
    if (!session?.user) return;
    const { data: existingVote } = await supabase
      .from('post_likes')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('post_id', id)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === dir) {
        await supabase.from('post_likes').delete().eq('user_id', session.user.id).eq('post_id', id);
      } else {
        await supabase.from('post_likes').update({ vote_type: dir }).eq('user_id', session.user.id).eq('post_id', id);
      }
    } else {
      await supabase.from('post_likes').insert({ user_id: session.user.id, post_id: id, vote_type: dir });
    }
    fetchFeed();
  };

  const handleDeletePost = async (postId: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('author_id', session.user.id);
    if (!error) fetchFeed();
  };

  const handleToggleFollow = async (userId: string) => {
    if (!session?.user || userId === session.user.id) return;
    if (followedUserIds.has(userId)) {
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('followed_id', userId);
    } else {
      await supabase.from('follows').insert({ follower_id: session.user.id, followed_id: userId });
    }
    fetchFollows();
  };

  const handleSendMessage = async (recipientId: string, text: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      recipient_id: recipientId,
      text,
      created_at: new Date().toISOString()
    });
    if (!error) fetchChats();
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
  };

  const handleStartChat = (targetUser: User) => {
    setActiveChatUserId(targetUser.id);
    setCurrentView('messages');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const { error } = await supabase.from('profiles').update({
        name: updatedUser.name,
        last_name: updatedUser.lastName,
        username: updatedUser.username,
        position: updatedUser.position,
        department: updatedUser.department,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        avatar: updatedUser.avatar,
        updated_at: new Date().toISOString()
      }).eq('id', updatedUser.id);
    if (!error) fetchUserProfile(updatedUser.id);
  };

  const handleMarkNotificationsRead = async () => {
    if (!session?.user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id);
    fetchNotifications();
  };

  const handleViewChange = (view: AppView) => {
    if (view === 'profile') setViewingUserId(currentUserData?.id || null);
    if (view === 'notifications') handleMarkNotificationsRead();
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToProfile = (userId: string) => {
    setViewingUserId(userId);
    setCurrentView('profile');
  };

  if (isLoadingAuth || (!currentUserData && session)) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  if (!session) {
    if (isRegistering) return <Onboarding onComplete={() => setIsRegistering(false)} onCancel={() => setIsRegistering(false)} />;
    return <Login onLogin={() => {}} onRegister={() => setIsRegistering(true)} />;
  }

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
      isViewingOwnProfile={!viewingUserId || viewingUserId === currentUserData?.id}
      onLogout={() => supabase.auth.signOut()}
    >
      {currentView === 'feed' && <SocialFeed posts={posts.filter(p => p.type === 'post')} user={currentUserData!} onLike={(id) => handleVote(id, 'up')} onAddPost={handleAddPost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} users={users} onNavigateToProfile={handleNavigateToProfile} followedUserIds={followedUserIds} />}
      {currentView === 'news' && <NewsHubView posts={posts.filter(p => p.type === 'news')} user={currentUserData!} onVote={(id, dir) => handleVote(id, dir)} onAddPost={handleAddPost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} currentUser={currentUserData!} users={users} onNavigateToProfile={handleNavigateToProfile} followedUserIds={followedUserIds} />}
      {currentView === 'profile' && <ProfileView user={users.find(u => u.id === viewingUserId) || currentUserData!} isCurrentUser={!viewingUserId || viewingUserId === currentUserData?.id} posts={posts} onUpdateUser={handleUpdateUser} onDeletePost={handleDeletePost} currentUser={currentUserData!} onAddComment={handleAddComment} onLike={(id) => handleVote(id, 'up')} onVote={(id, dir) => handleVote(id, dir)} onNavigateToProfile={handleNavigateToProfile} onStartChat={handleStartChat} isFollowed={followedUserIds.has(viewingUserId || '')} isFollower={followerUserIds.has(viewingUserId || '')} onToggleFollow={handleToggleFollow} users={users} />}
      {currentView === 'messages' && <MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={handleSendMessage} onNavigateToProfile={handleNavigateToProfile} externalActiveId={activeChatUserId} />}
      {currentView === 'notifications' && <NotificationsView notifications={notifications} onMarkAllRead={handleMarkNotificationsRead} />}
      {currentView === 'search' && <SearchResultsView query={searchQuery} posts={posts} users={users} onLike={(id) => handleVote(id, 'up')} onVote={(id, dir) => handleVote(id, dir)} onAddComment={handleAddComment} onDeletePost={handleDeletePost} onViewChange={handleViewChange} currentUser={currentUserData!} followedUserIds={followedUserIds} followerUserIds={followerUserIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={handleNavigateToProfile} />}
      {currentView === 'settings' && <SettingsView user={currentUserData!} onUpdateUser={() => {}} onLogout={() => supabase.auth.signOut()} onViewChange={handleViewChange} theme={theme} onThemeChange={setTheme} />}
    </Layout>
    </div>
  );
};

export default App;
