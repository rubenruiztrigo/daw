
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { RankingView } from './components/RankingView';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { User, Post } from './types';
import { MOCK_USER, MOCK_POSTS } from './constants';

type AppView = 'feed' | 'profile' | 'messages' | 'ranking';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('feed');
  const [user, setUser] = useState<User>(MOCK_USER);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  useEffect(() => {
    const onboardingDone = localStorage.getItem('novaOnboardingDone');
    if (onboardingDone) setHasCompletedOnboarding(true);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = (userData: Partial<User>) => {
    setUser({ ...MOCK_USER, ...userData } as User);
    setHasCompletedOnboarding(true);
    setIsAuthenticated(true);
    setIsRegistering(false);
    localStorage.setItem('novaOnboardingDone', 'true');
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = !post.userLiked;
        return {
          ...post,
          userLiked: isLiked,
          likes: isLiked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    }));
  };

  const handleAddPost = (content: string, type: 'post' | 'news', tags: string[]) => {
    const newPost: Post = {
      id: `p-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorPosition: user.position,
      authorAvatar: user.avatar,
      content,
      timestamp: new Date().toISOString(),
      type,
      tags,
      likes: 0,
      comments: 0,
      userLiked: false
    };
    setPosts([newPost, ...posts]);
  };

  if (isRegistering) return <Onboarding onComplete={handleOnboardingComplete} onCancel={() => setIsRegistering(false)} />;
  if (!isAuthenticated) return <Login onLogin={handleLogin} onRegister={() => setIsRegistering(true)} />;

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView} 
      user={user}
    >
      {currentView === 'feed' && (
        <SocialFeed 
          posts={posts} 
          user={user} 
          onLike={handleLike} 
          onAddPost={handleAddPost}
        />
      )}
      {currentView === 'profile' && <ProfileView user={user} posts={posts.filter(p => p.authorId === user.id)} />}
      {currentView === 'messages' && <MessagesView />}
      {currentView === 'ranking' && <RankingView posts={posts} onLike={handleLike} />}
    </Layout>
  );
};

export default App;
