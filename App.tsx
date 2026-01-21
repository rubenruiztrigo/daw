

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
import { User, Post, Comment, Chat, Message, Notification } from './types';
import { MOCK_USER, MOCK_POSTS, MOCK_CHATS_INITIAL, MOCK_USERS_LIST } from './constants';
import { normalizeString } from './utils/stringUtils';

type AppView = 'feed' | 'profile' | 'messages' | 'ranking' | 'search' | 'settings';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('feed');
  const [currentUserData, setCurrentUserData] = useState<User>({
    ...MOCK_USER,
    username: 'anagarcia_innov'
  });
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS_INITIAL);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  
  // Estado global de usuarios para mantener contadores sincronizados
  const [users, setUsers] = useState<User[]>(MOCK_USERS_LIST.map(u => ({
    ...u,
    username: u.username || u.name.toLowerCase().replace(/\s/g, '') + (u.lastName ? u.lastName.toLowerCase().replace(/\s/g, '') : '')
  })));
  
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [followerUserIds, setFollowerUserIds] = useState<Set<string>>(new Set(['u2', 'u3']));

  useEffect(() => {
    const onboardingDone = localStorage.getItem('novaOnboardingDone');
    if (onboardingDone) setHasCompletedOnboarding(true);
    
    // Notificación inicial con el nuevo formato
    const sender = users.find(u => u.id === 'u2');
    if (sender) {
      setNotifications([
        {
          id: 'n1',
          type: 'follow',
          senderName: sender.name,
          senderAvatar: sender.avatar,
          content: `${sender.name} ${sender.lastName || ''}(${sender.username}) ha comenzado a seguirte`,
          timestamp: new Date().toISOString(),
          isRead: false
        }
      ]);
    }
  }, []);

  // El usuario actual siempre se deriva de la lista de usuarios para mantener contadores
  const user = useMemo(() => {
    const base = users.find(u => u.id === currentUserData.id) || currentUserData;
    return {
      ...base,
      following: followedUserIds.size + (base.following || 0),
      followers: followerUserIds.size + (base.followers || 0)
    };
  }, [currentUserData, followedUserIds.size, followerUserIds.size, users]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleToggleFollow = (userId: string) => {
    const isNowFollowing = !followedUserIds.has(userId);
    const targetUser = users.find(u => u.id === userId);

    if (!targetUser) return;

    // Actualizar contadores del perfil objetivo
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          followers: isNowFollowing ? (u.followers || 0) + 1 : Math.max(0, (u.followers || 0) - 1)
        };
      }
      return u;
    }));

    setFollowedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        // Notificación opcional de acción realizada
      }
      return next;
    });

    // Simular que recibimos un follow de vuelta o de otro usuario con el formato solicitado
    if (isNowFollowing) {
      setTimeout(() => {
        addNotification({
          type: 'follow',
          senderName: targetUser.name,
          senderAvatar: targetUser.avatar,
          content: `${targetUser.name} ${targetUser.lastName || ''}(${targetUser.username}) ha comenzado a seguirte`
        });
        // Si alguien nos sigue, sumamos 1 a nuestros seguidores
        setFollowerUserIds(prev => new Set(prev).add(targetUser.id));
      }, 2000);
    }
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = !post.userLiked;
        if (isLiked && post.authorId !== user.id) {
          addNotification({
            type: 'like',
            senderName: user.name,
            senderAvatar: user.avatar,
            content: `ha dado me gusta a tu ${post.type === 'news' ? 'noticia' : 'post'}`,
            postId: post.id
          });
        }
        return {
          ...post,
          userLiked: isLiked,
          userDownvoted: false,
          likes: isLiked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    }));
  };

  const handleVote = (postId: string, direction: 'up' | 'down') => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isUpvoting = direction === 'up';
        const isDownvoting = direction === 'down';
        
        let newLikes = post.likes;
        let newUserLiked = post.userLiked;
        let newUserDownvoted = !!post.userDownvoted;

        if (isUpvoting) {
          if (newUserLiked) {
            newLikes -= 1;
            newUserLiked = false;
          } else {
            newLikes += 1;
            newUserLiked = true;
            newUserDownvoted = false;
            if (post.authorId !== user.id) {
              addNotification({
                type: 'like',
                senderName: user.name,
                senderAvatar: user.avatar,
                content: `ha dado me gusta a tu noticia`,
                postId: post.id
              });
            }
          }
        } else if (isDownvoting) {
          if (newUserDownvoted) {
            newUserDownvoted = false;
          } else {
            if (newUserLiked) {
              newLikes -= 1;
              newUserLiked = false;
            }
            newUserDownvoted = true;
          }
        }

        return {
          ...post,
          likes: newLikes,
          userLiked: newUserLiked,
          userDownvoted: newUserDownvoted
        };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string, text: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newComment: Comment = {
          id: `c-${Date.now()}`,
          authorId: user.id,
          authorName: user.name,
          authorAvatar: user.avatar,
          text,
          timestamp: new Date().toISOString(),
          likes: 0,
          userLiked: false
        };
        
        if (post.authorId !== user.id) {
          addNotification({
            type: 'comment',
            senderName: user.name,
            senderAvatar: user.avatar,
            content: `ha comentado tu ${post.type === 'news' ? 'noticia' : 'post'}`,
            postId: post.id
          });
        }

        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [...post.commentsList, newComment]
        };
      }
      return post;
    }));
  };

  // Fix: Added handleAddPost to resolve compilation errors in SocialFeed and NewsHubView
  const handleAddPost = (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string) => {
    const newPost: Post = {
      id: `p-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorPosition: user.position,
      authorAvatar: user.avatar,
      content,
      imageUrl,
      docUrl,
      docName,
      timestamp: new Date().toISOString(),
      type,
      tags,
      likes: 0,
      comments: 0,
      commentsList: [],
      userLiked: false
    };
    setPosts(prev => [newPost, ...prev]);
  };

  // Fix: Added handleViewPost to resolve compilation error in MessagesView
  const handleViewPost = (postId: string) => {
    console.log('Navegando a publicación:', postId);
    // En una aplicación real, esto podría desplazarse a la publicación o abrir una vista específica
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
  };

  const handleMarkNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogin = () => setIsAuthenticated(true);
  const handleOnboardingComplete = (userData: Partial<User>) => {
    const newUser = { ...MOCK_USER, ...userData, joinedDate: new Date().toISOString() } as User;
    setCurrentUserData(newUser);
    setUsers(prev => [...prev, newUser]);
    setHasCompletedOnboarding(true);
    setIsAuthenticated(true);
    setIsRegistering(false);
    localStorage.setItem('novaOnboardingDone', 'true');
  };
  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUserData(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  const handleNavigateToProfile = (userId: string) => {
    setViewingUserId(userId);
    setSearchQuery('');
    setActiveSearchTerm('');
    setCurrentView('profile');
  };
  const handleViewChange = (view: AppView) => {
    if (view === 'profile') setViewingUserId(user.id);
    else setViewingUserId(null);
    if (view !== 'search') { setSearchQuery(''); setActiveSearchTerm(''); }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleSearchSubmit = (query: string) => { 
    setActiveSearchTerm(query); 
    setSearchQuery(query); 
    setCurrentView('search'); 
  };
  const handleShareToChat = (id: string, participant: any, isProfile = false) => {
    setChats(prevChats => {
      const existingChatIndex = prevChats.findIndex(c => c.participant.id === participant.id);
      let shareText = ''; let postId: string | undefined = undefined;
      if (isProfile) { 
        const profileUser = users.find(u => u.id === id); 
        shareText = `He compartido contigo el perfil de ${profileUser?.name || 'un colega'}: novasocial.app/u/${id}`; 
      } else { 
        const post = posts.find(p => p.id === id); 
        shareText = `He compartido contigo esta publicación: "${post?.content.substring(0, 50)}..."`; 
        postId = id; 
      }
      const newMessage: Message = { id: `m-${Date.now()}`, senderId: user.id, text: shareText, timestamp: new Date(), isPostShare: !isProfile, postId };
      if (existingChatIndex > -1) {
        const updatedChats = [...prevChats];
        updatedChats[existingChatIndex] = { ...updatedChats[existingChatIndex], messages: [...updatedChats[existingChatIndex].messages, newMessage], lastMessage: newMessage.text, timestamp: newMessage.timestamp };
        return updatedChats;
      } else {
        const newChat: Chat = { id: `c-${Date.now()}`, participant, messages: [newMessage], lastMessage: newMessage.text, timestamp: newMessage.timestamp };
        return [newChat, ...prevChats];
      }
    });
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim() || currentView === 'search') return posts;
    const normalizedQuery = normalizeString(searchQuery);
    return posts.filter(post => normalizeString(post.content).includes(normalizedQuery) || normalizeString(post.authorName).includes(normalizedQuery) || post.tags.some(tag => normalizeString(tag).includes(normalizedQuery)));
  }, [posts, searchQuery, currentView]);

  const profileUser = useMemo(() => {
    if (!viewingUserId || viewingUserId === user.id) return user;
    return users.find(u => u.id === viewingUserId) || user;
  }, [viewingUserId, user, users]);

  const isViewingOwnProfile = useMemo(() => !viewingUserId || viewingUserId === user.id, [viewingUserId, user.id]);

  if (isRegistering) return <Onboarding onComplete={handleOnboardingComplete} onCancel={() => setIsRegistering(false)} />;
  if (!isAuthenticated) return <Login onLogin={handleLogin} onRegister={() => setIsRegistering(true)} />;

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={handleViewChange} 
      user={user}
      notifications={notifications}
      onMarkNotificationsRead={handleMarkNotificationsAsRead}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={handleSearchSubmit}
      onUpdateUser={handleUpdateUser}
      isViewingOwnProfile={isViewingOwnProfile}
    >
      {currentView === 'feed' && (
        <SocialFeed 
          posts={filteredPosts.filter(p => p.type === 'post')} 
          user={user} 
          onLike={handleLike} 
          onAddPost={handleAddPost}
          onAddComment={handleAddComment}
          onDeletePost={handleDeletePost}
          onSearchHashtag={handleSearchSubmit}
          onSharePost={handleShareToChat}
          onNavigateToProfile={handleNavigateToProfile}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
          onToggleFollow={handleToggleFollow}
          users={users}
        />
      )}
      {currentView === 'profile' && (
        <ProfileView 
          user={profileUser} 
          isCurrentUser={isViewingOwnProfile}
          isFollowed={followedUserIds.has(profileUser.id)}
          isFollower={followerUserIds.has(profileUser.id)}
          onToggleFollow={handleToggleFollow}
          posts={posts.filter(p => p.authorId === profileUser.id)} 
          onUpdateUser={handleUpdateUser}
          onDeletePost={handleDeletePost}
          onNavigateToProfile={handleNavigateToProfile}
          onShareProfile={handleShareToChat}
          currentUser={user}
        />
      )}
      {currentView === 'ranking' && (
        <NewsHubView 
          posts={filteredPosts.filter(p => p.type === 'news')} 
          user={user}
          onVote={handleVote} 
          onAddPost={handleAddPost} 
          onAddComment={handleAddComment}
          onDeletePost={handleDeletePost}
          onSearchHashtag={handleSearchSubmit}
          onSharePost={handleShareToChat}
          onNavigateToProfile={handleNavigateToProfile}
          currentUser={user}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
          onToggleFollow={handleToggleFollow}
          users={users}
        />
      )}
      {currentView === 'search' && (
        <SearchResultsView 
          query={activeSearchTerm}
          posts={posts}
          onLike={handleLike} 
          onVote={handleVote} 
          onAddComment={handleAddComment}
          onDeletePost={handleDeletePost}
          onViewChange={handleViewChange}
          onSearchHashtag={handleSearchSubmit}
          onSharePost={handleShareToChat}
          onNavigateToProfile={handleNavigateToProfile}
          currentUser={user}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
          onToggleFollow={handleToggleFollow}
          users={users}
        />
      )}
      {currentView === 'messages' && (
        <MessagesView 
          user={user} 
          chats={chats} 
          onSendMessage={(id, text) => setChats(prev => prev.map(c => c.id === id ? { ...c, messages: [...c.messages, { id: Date.now().toString(), senderId: user.id, text, timestamp: new Date() }], lastMessage: text, timestamp: new Date() } : c))} 
          posts={posts}
          onViewPost={(id) => handleViewPost(id)}
          onLike={handleLike}
          onVote={handleVote}
          onAddComment={handleAddComment}
        />
      )}
      {currentView === 'settings' && (
        <SettingsView 
          user={user}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          onViewChange={handleViewChange}
        />
      )}
    </Layout>
  );
};

export default App;
