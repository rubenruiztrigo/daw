
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { NewsHubView } from './components/NewsHubView';
import { SearchResultsView } from './components/SearchResultsView';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { User, Post, Comment, Chat, Message } from './types';
import { MOCK_USER, MOCK_POSTS, MOCK_CHATS_INITIAL, MOCK_USERS_LIST } from './constants';
import { normalizeString } from './utils/stringUtils';

type AppView = 'feed' | 'profile' | 'messages' | 'ranking' | 'search';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('feed');
  const [currentUserData, setCurrentUserData] = useState<User>(MOCK_USER);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS_INITIAL);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  
  // Personas a las que el usuario actual sigue
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  
  // Personas que siguen al usuario actual (Simulado para probar 'Amigos')
  const [followerUserIds, setFollowerUserIds] = useState<Set<string>>(new Set(['u2', 'u3']));

  useEffect(() => {
    const onboardingDone = localStorage.getItem('novaOnboardingDone');
    if (onboardingDone) setHasCompletedOnboarding(true);
  }, []);

  // Actualizar los contadores del perfil del usuario actual basándonos en los Sets
  const user = useMemo(() => {
    return {
      ...currentUserData,
      following: followedUserIds.size + MOCK_USER.following,
      followers: followerUserIds.size + MOCK_USER.followers - 2 // -2 para compensar el mock inicial si es necesario
    };
  }, [currentUserData, followedUserIds.size, followerUserIds.size]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = (userData: Partial<User>) => {
    setCurrentUserData({ 
      ...MOCK_USER, 
      ...userData,
      joinedDate: new Date().toISOString() 
    } as User);
    setHasCompletedOnboarding(true);
    setIsAuthenticated(true);
    setIsRegistering(false);
    localStorage.setItem('novaOnboardingDone', 'true');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUserData(updatedUser);
  };

  const handleNavigateToProfile = (userId: string) => {
    setViewingUserId(userId);
    setSearchQuery('');
    setActiveSearchTerm('');
    setCurrentView('profile');
  };

  const handleViewChange = (view: AppView) => {
    if (view === 'profile') {
      setViewingUserId(user.id);
    } else {
      setViewingUserId(null);
    }

    if (view !== 'search') {
      setSearchQuery('');
      setActiveSearchTerm('');
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    setSearchQuery('');
    setActiveSearchTerm('');

    if (post.type === 'news') {
      setCurrentView('ranking');
    } else {
      setCurrentView('feed');
    }
    setViewingUserId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFollow = (userId: string) => {
    setFollowedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleShareToChat = (id: string, participant: any, isProfile = false) => {
    setChats(prevChats => {
      const existingChatIndex = prevChats.findIndex(c => c.participant.id === participant.id);
      
      let shareText = '';
      let postId: string | undefined = undefined;

      if (isProfile) {
        const profileUser = MOCK_USERS_LIST.find(u => u.id === id);
        shareText = `He compartido contigo el perfil de ${profileUser?.name || 'un colega'}: novasocial.app/u/${id}`;
      } else {
        const post = posts.find(p => p.id === id);
        shareText = `He compartido contigo esta publicación: "${post?.content.substring(0, 50)}..."`;
        postId = id;
      }

      const newMessage: Message = {
        id: `m-${Date.now()}`,
        senderId: user.id,
        text: shareText,
        timestamp: new Date(),
        isPostShare: !isProfile,
        postId: postId
      };

      if (existingChatIndex > -1) {
        const updatedChats = [...prevChats];
        updatedChats[existingChatIndex] = {
          ...updatedChats[existingChatIndex],
          messages: [...updatedChats[existingChatIndex].messages, newMessage],
          lastMessage: newMessage.text,
          timestamp: newMessage.timestamp
        };
        return updatedChats;
      } else {
        const newChat: Chat = {
          id: `c-${Date.now()}`,
          participant: participant,
          messages: [newMessage],
          lastMessage: newMessage.text,
          timestamp: newMessage.timestamp
        };
        return [newChat, ...prevChats];
      }
    });
  };

  const handleForwardMessage = (text: string, participant: any) => {
    setChats(prevChats => {
      const existingChatIndex = prevChats.findIndex(c => c.participant.id === participant.id);
      const newMessage: Message = {
        id: `m-fwd-${Date.now()}`,
        senderId: user.id,
        text: text,
        timestamp: new Date(),
        isForwarded: true
      };

      if (existingChatIndex > -1) {
        const updatedChats = [...prevChats];
        updatedChats[existingChatIndex] = {
          ...updatedChats[existingChatIndex],
          messages: [...updatedChats[existingChatIndex].messages, newMessage],
          lastMessage: newMessage.text,
          timestamp: newMessage.timestamp
        };
        return updatedChats;
      } else {
        const newChat: Chat = {
          id: `c-fwd-${Date.now()}`,
          participant: participant,
          messages: [newMessage],
          lastMessage: newMessage.text,
          timestamp: newMessage.timestamp
        };
        return [newChat, ...prevChats];
      }
    });
  };

  const handleSendMessage = (chatId: string, text: string) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId) {
        const newMessage: Message = {
          id: `m-${Date.now()}`,
          senderId: user.id,
          text,
          timestamp: new Date()
        };
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: text,
          timestamp: newMessage.timestamp
        };
      }
      return chat;
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

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = !post.userLiked;
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
      userLiked: false,
      userDownvoted: false
    };
    setPosts([newPost, ...posts]);
  };

  const handleAddComment = (postId: string, text: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newComment: Comment = {
          id: `c-${Date.now()}`,
          authorName: user.name,
          authorAvatar: user.avatar,
          text,
          timestamp: new Date().toISOString()
        };
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [...post.commentsList, newComment]
        };
      }
      return post;
    }));
  };

  const handleSearchSubmit = (query: string) => {
    setActiveSearchTerm(query);
    setSearchQuery(query);
    setCurrentView('search');
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim() || currentView === 'search') return posts;
    
    const normalizedQuery = normalizeString(searchQuery);
    return posts.filter(post => 
      normalizeString(post.content).includes(normalizedQuery) ||
      normalizeString(post.authorName).includes(normalizedQuery) ||
      post.tags.some(tag => normalizeString(tag).includes(normalizedQuery))
    );
  }, [posts, searchQuery, currentView]);

  const profileUser = useMemo(() => {
    if (!viewingUserId || viewingUserId === user.id) return user;
    return MOCK_USERS_LIST.find(u => u.id === viewingUserId) || user;
  }, [viewingUserId, user]);

  const isViewingOwnProfile = useMemo(() => {
    return !viewingUserId || viewingUserId === user.id;
  }, [viewingUserId, user.id]);

  if (isRegistering) return <Onboarding onComplete={handleOnboardingComplete} onCancel={() => setIsRegistering(false)} />;
  if (!isAuthenticated) return <Login onLogin={handleLogin} onRegister={() => setIsRegistering(true)} />;

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={handleViewChange} 
      user={user}
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
          onSearchHashtag={handleSearchSubmit}
          onSharePost={handleShareToChat}
          onNavigateToProfile={handleNavigateToProfile}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
          onToggleFollow={handleToggleFollow}
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
          onNavigateToProfile={handleNavigateToProfile}
          onShareProfile={handleShareToChat}
        />
      )}
      {currentView === 'messages' && (
        <MessagesView 
          user={user} 
          chats={chats} 
          onSendMessage={handleSendMessage} 
          onForwardMessage={handleForwardMessage}
          posts={posts}
          onViewPost={handleViewPost}
          onLike={handleLike}
          onVote={handleVote}
          onAddComment={handleAddComment}
        />
      )}
      {currentView === 'ranking' && (
        <NewsHubView 
          posts={filteredPosts.filter(p => p.type === 'news')} 
          user={user}
          onVote={handleVote} 
          onAddPost={handleAddPost} 
          onAddComment={handleAddComment}
          onSearchHashtag={handleSearchSubmit}
          onSharePost={handleShareToChat}
          onNavigateToProfile={handleNavigateToProfile}
          currentUser={user}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
          onToggleFollow={handleToggleFollow}
        />
      )}
      {currentView === 'search' && (
        <SearchResultsView 
          query={activeSearchTerm}
          posts={posts}
          onLike={handleLike} 
          onVote={handleVote} 
          onAddComment={handleAddComment}
          onViewChange={handleViewChange}
          onSearchHashtag={handleSearchSubmit}
          onSharePost={handleShareToChat}
          onNavigateToProfile={handleNavigateToProfile}
          currentUser={user}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
          onToggleFollow={handleToggleFollow}
        />
      )}
    </Layout>
  );
};

export default App;
