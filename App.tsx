
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { NewsHubView } from './components/NewsHubView';
import { SearchResultsView } from './components/SearchResultsView';
import { SettingsView } from './components/SettingsView';
import { Dashboard } from './components/Dashboard';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { User, Post, Comment, Chat, Message, Notification, Tender } from './types';
import { normalizeString } from './utils/stringUtils';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

type AppView = 'feed' | 'profile' | 'messages' | 'ranking' | 'search' | 'settings' | 'tenders';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('feed');
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<User[]>([]);
  
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [followerUserIds, setFollowerUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setCurrentUserData(null);
        setPosts([]);
        setUsers([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile(session.user.id);
      fetchFeed();
      fetchUsers();
    }
  }, [session]);

  const fetchUserProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (data) {
      setCurrentUserData({
        id: data.id,
        name: data.name,
        lastName: data.last_name,
        position: data.position || 'Personal Público',
        department: data.department || 'Administración',
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        bio: data.bio || '',
        interests: data.interests || [],
        followers: data.followers_count || 0,
        following: data.following_count || 0,
        joinedDate: data.created_at,
        country: data.country,
        region: data.region
      });
    }
  };

  const fetchFeed = async () => {
    if (!session?.user) return;

    const [postsRes, newsRes, postLikesRes, newsLikesRes] = await Promise.all([
      supabase.from('posts').select('*, author:profiles!author_id(*), comments:post_comments(*, author:profiles!author_id(*))').order('created_at', { ascending: false }),
      supabase.from('news').select('*, author:profiles!author_id(*), comments:news_comments(*, author:profiles!author_id(*))').order('created_at', { ascending: false }),
      supabase.from('post_likes').select('post_id, vote_type').eq('user_id', session.user.id),
      supabase.from('news_likes').select('news_id, vote_type').eq('user_id', session.user.id)
    ]);

    const userPostLikes = new Set(postLikesRes.data?.map(l => l.post_id) || []);
    const userNewsLikes = new Map(newsLikesRes.data?.map(l => [l.news_id, l.vote_type]) || []);

    const allItems: Post[] = [];

    if (postsRes.data) {
      allItems.push(...postsRes.data.map((p: any) => ({
        id: p.id,
        authorId: p.author_id,
        authorName: p.author ? `${p.author.name} ${p.author.last_name || ''}` : 'Usuario',
        authorPosition: p.author?.position || 'Técnico',
        authorAvatar: p.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_id}`,
        content: p.content,
        imageUrl: p.image_url,
        docUrl: p.doc_url,
        docName: p.doc_name,
        timestamp: p.created_at,
        type: 'post',
        tags: p.tags || [],
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        commentsList: (p.comments || []).map((c: any) => ({
          id: c.id,
          authorName: c.author ? `${c.author.name} ${c.author.last_name || ''}` : 'Usuario',
          authorAvatar: c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_id}`,
          text: c.text,
          timestamp: c.created_at
        })),
        userLiked: userPostLikes.has(p.id)
      })));
    }

    if (newsRes.data) {
      allItems.push(...newsRes.data.map((p: any) => ({
        id: p.id,
        authorId: p.author_id,
        authorName: p.author ? `${p.author.name} ${p.author.last_name || ''}` : 'Institución',
        authorPosition: p.author?.position || 'Administración',
        authorAvatar: p.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_id}`,
        content: p.content,
        imageUrl: p.image_url,
        timestamp: p.created_at,
        type: 'news',
        tags: p.tags || [],
        likes: p.likes_count || 0, // Net Score
        upvotes: p.up_votes_count || 0,
        downvotes: p.down_votes_count || 0,
        comments: p.comments_count || 0,
        commentsList: (p.comments || []).map((c: any) => ({
          id: c.id,
          authorName: c.author ? `${c.author.name} ${c.author.last_name || ''}` : 'Usuario',
          authorAvatar: c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_id}`,
          text: c.text,
          timestamp: c.created_at
        })),
        userLiked: userNewsLikes.get(p.id) === 'up',
        userDownvoted: userNewsLikes.get(p.id) === 'down'
      })));
    }

    setPosts(allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      setUsers(data.map((u: any) => ({
        id: u.id,
        name: u.name,
        lastName: u.last_name,
        position: u.position || 'Personal Público',
        department: u.department || 'Administración',
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
        bio: u.bio || '',
        interests: u.interests || [],
        followers: u.followers_count || 0,
        following: u.following_count || 0,
        joinedDate: u.created_at,
        country: u.country,
        region: u.region
      })));
    }
  };

  const handleLike = async (postId: string) => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const table = post.type === 'post' ? 'post_likes' : 'news_likes';
    const idField = post.type === 'post' ? 'post_id' : 'news_id';

    const { error } = await supabase
      .from(table)
      .upsert({ 
        user_id: session.user.id, 
        [idField]: postId, 
        vote_type: 'up' 
      });

    if (!error) fetchFeed();
  };

  const handleVote = async (postId: string, direction: 'up' | 'down') => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const table = post.type === 'post' ? 'post_likes' : 'news_likes';
    const idField = post.type === 'post' ? 'post_id' : 'news_id';

    const { error } = await supabase
      .from(table)
      .upsert({ 
        user_id: session.user.id, 
        [idField]: postId, 
        vote_type: direction 
      });

    if (!error) fetchFeed();
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const table = post.type === 'post' ? 'post_comments' : 'news_comments';
    const idField = post.type === 'post' ? 'post_id' : 'news_id';

    const { error } = await supabase
      .from(table)
      .insert({
        author_id: session.user.id,
        [idField]: postId,
        text: text
      });

    if (!error) fetchFeed();
  };

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string) => {
    if (!session?.user) return;
    const table = type === 'post' ? 'posts' : 'news';
    
    const payload: any = {
      author_id: session.user.id,
      content,
      tags,
      image_url: imageUrl
    };

    if (type === 'post') {
      payload.doc_url = docUrl;
      payload.doc_name = docName;
    }

    const { error } = await supabase.from(table).insert(payload);

    if (!error) {
      await fetchFeed();
    }
  };

  const handleDeletePost = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (confirm(`¿Estás seguro de que deseas eliminar esta ${post.type === 'post' ? 'publicación' : 'noticia'}?`)) {
      const table = post.type === 'post' ? 'posts' : 'news';
      const { error } = await supabase.from(table).delete().eq('id', postId);
      if (!error) fetchFeed();
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updatedUser.name,
        last_name: updatedUser.lastName,
        position: updatedUser.position,
        department: updatedUser.department,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        country: updatedUser.country,
        region: updatedUser.region
      })
      .eq('id', updatedUser.id);

    if (!error) {
      setCurrentUserData(updatedUser);
      fetchUsers();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleViewChange = (view: AppView) => {
    if (view === 'profile') setViewingUserId(currentUserData?.id || null);
    else setViewingUserId(null);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToProfile = (userId: string) => {
    setViewingUserId(userId);
    setCurrentView('profile');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!session) {
    if (isRegistering) {
      return <Onboarding onComplete={() => setIsRegistering(false)} onCancel={() => setIsRegistering(false)} />;
    }
    return <Login onLogin={() => {}} onRegister={() => setIsRegistering(true)} />;
  }

  if (!currentUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
          <p className="text-slate-500 font-bold">Iniciando conexión segura...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={handleViewChange} 
      user={currentUserData}
      notifications={notifications}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={(q) => { setSearchQuery(q); setActiveSearchTerm(q); setCurrentView('search'); }}
      onUpdateUser={handleUpdateUser}
    >
      {currentView === 'feed' && (
        <SocialFeed 
          posts={posts.filter(p => p.type === 'post')} 
          user={currentUserData} 
          onLike={handleLike} 
          onAddPost={handleAddPost}
          onAddComment={handleAddComment}
          onDeletePost={handleDeletePost}
          onNavigateToProfile={handleNavigateToProfile}
          users={users}
        />
      )}
      {currentView === 'ranking' && (
        <NewsHubView 
          posts={posts.filter(p => p.type === 'news')} 
          user={currentUserData}
          onVote={handleVote} 
          onAddPost={handleAddPost} 
          onAddComment={handleAddComment}
          onDeletePost={handleDeletePost}
          onNavigateToProfile={handleNavigateToProfile}
          currentUser={currentUserData}
          users={users}
        />
      )}
      {currentView === 'profile' && (
        <ProfileView 
          user={users.find(u => u.id === viewingUserId) || currentUserData} 
          isCurrentUser={!viewingUserId || viewingUserId === currentUserData.id}
          posts={posts.filter(p => p.authorId === (viewingUserId || currentUserData.id))} 
          onUpdateUser={handleUpdateUser}
          onDeletePost={handleDeletePost}
          onNavigateToProfile={handleNavigateToProfile}
          currentUser={currentUserData}
        />
      )}
      {currentView === 'search' && (
        <SearchResultsView 
          query={activeSearchTerm}
          posts={posts}
          users={users}
          onLike={handleLike}
          onVote={handleVote}
          onAddComment={handleAddComment}
          onDeletePost={handleDeletePost}
          onViewChange={handleViewChange}
          onSearchHashtag={(tag) => { setSearchQuery(tag); setActiveSearchTerm(tag); setCurrentView('search'); }}
          onNavigateToProfile={handleNavigateToProfile}
          currentUser={currentUserData}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
          onToggleFollow={() => {}}
        />
      )}
      {currentView === 'tenders' && (
        <Dashboard 
          favorites={favorites} 
          toggleFavorite={(t) => {}} 
          isAIEnabled={true} 
          keywords={currentUserData.interests} 
        />
      )}
      {currentView === 'messages' && (
        <MessagesView 
          user={currentUserData} 
          chats={chats} 
          onSendMessage={() => {}} 
          posts={posts}
        />
      )}
      {currentView === 'settings' && (
        <SettingsView 
          user={currentUserData}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          onViewChange={handleViewChange}
        />
      )}
    </Layout>
  );
};

export default App;
