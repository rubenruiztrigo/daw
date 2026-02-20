
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Language } from './utils/translations';
import { encryptMessage, decryptMessage } from './utils/encryption';
import { notifyUserApproved, notifyUserRejected } from './utils/emailService';
import { Layout } from './components/Layout';
import { SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { ProfileRoute } from './components/ProfileRoute';
import { MessagesView } from './components/MessagesView';
import { NewsHubView } from './components/NewsHubView';
import { CalendarView } from './components/CalendarView';
import { SearchResultsView } from './components/SearchResultsView';
import { SearchRoute } from './components/SearchRoute'; // Added import
import { SettingsView } from './components/SettingsView';
import { Onboarding } from './components/Onboarding';
import { ShareModal } from './components/ShareModal';
import { StoreView } from './components/StoreView';
import { Login } from './components/Login';
import { PasswordRecover } from './components/PasswordRecover';
import { NotificationsView } from './components/NotificationsView';
import { FullPostView } from './components/FullPostView';
import { User, Post, Chat, Message, Notification, Comment, AppView, CommentReply, CalendarEvent, BADGE_CATALOG } from './types';
import { supabase } from './supabaseClient';
import { Loader2, X } from 'lucide-react';
import { Toast } from './components/Toast';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { PendingAccount } from './components/PendingAccount';
import { RejectedAccount } from './components/RejectedAccount';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  // const [currentView, setCurrentView] = useState<AppView>('feed'); // Removed in favor of Router
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const currentUserDataRef = useRef<User | null>(null); // Added ref for realtime
  // const [viewingUserId, setViewingUserId] = useState<string | null>(null); // Handled by URL param
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<string>('/feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalEvents, setGlobalEvents] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'es');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [processingReposts, setProcessingReposts] = useState<Set<string>>(new Set());
  const [processingFollows, setProcessingFollows] = useState<Set<string>>(new Set());
  const [processingVotes, setProcessingVotes] = useState<Set<string>>(new Set());
  const [pinnedPosts, setPinnedPosts] = useState<Set<string>>(() => {
    try {
      const savedPins = localStorage.getItem('pinned_posts');
      return savedPins ? new Set(JSON.parse(savedPins)) : new Set();
    } catch (e) {
      console.error("Error parsing pinned posts", e);
      return new Set();
    }
  });

  const [sharingEvent, setSharingEvent] = useState<CalendarEvent | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);

  const [prefilledPostContent, setPrefilledPostContent] = useState<string | null>(null);
  const [prefilledEvent, setPrefilledEvent] = useState<CalendarEvent | null>(null);
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [targetCalendarDate, setTargetCalendarDate] = useState<Date | null>(null);

  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [followerUserIds, setFollowerUserIds] = useState<Set<string>>(new Set());

  const [notificationsLimit, setNotificationsLimit] = useState(15);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);

  const [hasNewPosts, setHasNewPosts] = useState(false);

  const handleRefreshFeed = async () => {
    setIsLoadingMore(true);
    await fetchFeed(0, 30);
    setHasNewPosts(false);
    setFeedOffset(30);
    setIsLoadingMore(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll Persistence Logic
  useEffect(() => {
    const currentPath = location.pathname;

    // Restore scroll position
    const savedPosition = sessionStorage.getItem(`scroll_${currentPath}`);
    if (savedPosition) {
      // Timeout to ensure content is rendered before scrolling
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedPosition, 10), behavior: 'instant' });
      }, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Save scroll position when navigating away
    return () => {
      sessionStorage.setItem(`scroll_${currentPath}`, window.scrollY.toString());
    };
  }, [location.pathname]);

  // Clear search query when navigating away from search
  useEffect(() => {
    if (!location.pathname.startsWith('/search')) {
      setSearchQuery('');
    }
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') {
        // let the useEffect for session/status handle navigation
      }
      if (event === 'PASSWORD_RECOVERY' || (session && (session as any).type === 'recovery')) {
        setIsResettingPassword(true); // Helper state, but we should rely on route
        navigate('/recover-password');
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentUserData(null);
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('pinned_posts', JSON.stringify(Array.from(pinnedPosts)));
  }, [pinnedPosts]);

  const handleTogglePin = (postId: string) => {
    setPinnedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (session?.user && !isResettingPassword) {
      // Trigger weekly ranking rewards check
      supabase.rpc('assign_weekly_ranking_badges').then(({ error }) => {
        if (error) console.error("Error checking ranking rewards:", error);
      });

      fetchUserProfile(session.user.id);
      fetchUsers();
      fetchFeed(0, 30); // Initial load: 30 items
      setFeedOffset(30); // Prepare next offset
      fetchFollows();

      // ... (rest of logic)
      fetchChats();
      fetchNotifications();
      fetchGlobalEvents();

      const channel = supabase
        .channel('app_realtime_main')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          // Check if it's a new post or news
          if ((payload.table === 'posts' || payload.table === 'news') && payload.eventType === 'INSERT') {
            const newRecord = payload.new as any;
            // Only notify if the content is NOT from the current user
            if (newRecord && newRecord.author_id !== session.user.id) {
              setHasNewPosts(true);
            }
          }
        })
        .subscribe();

      // Listen for profile status changes (e.g. approval)
      const profileChannel = supabase
        .channel(`public:profiles:${session.user.id}`)
        .on('postgres_changes', {
          event: '*', // Listen for INSERT and UPDATE
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`
        }, (payload) => {
          if (payload.eventType === 'DELETE') {
            console.log("Profile deleted via Realtime");
            setCurrentUserData({ id: session.user.id, status: 'rejected' } as any);
          } else {
            const newProfile = payload.new as any;
            if (newProfile) {
              console.log("Profile updated/created via Realtime!");
              // Refresh profile on any change to own profile
              fetchUserProfile(session.user.id);

              if (newProfile.status === 'active' && currentUserDataRef.current?.status !== 'active') { // Modified line
                setToast({ message: "¡Tu cuenta ha sido aprobada! Bienvenido.", type: 'success' });
              } else if (newProfile.status === 'rejected' && currentUserDataRef.current?.status !== 'rejected') { // Modified line
                setToast({ message: "Tu cuenta ha sido rechazada.", type: 'error' });
              }
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(profileChannel);
      };
    }
  }, [session, isResettingPassword]);

  // Sync ref for realtime callback
  useEffect(() => {
    currentUserDataRef.current = currentUserData;
  }, [currentUserData]);

  // Polling effect for pending users (Fallback for Realtime)
  useEffect(() => {
    let interval: any;
    if (session?.user && currentUserData?.status === 'pending') {
      interval = setInterval(() => {
        // Silent fetch to check status
        supabase.from('profiles').select('status').eq('id', session.user.id).maybeSingle().then(({ data }) => {
          if (data && data.status === 'active') {
            console.log("Profile activated via Polling!");
            fetchUserProfile(session.user.id);
            setToast({ message: "¡Tu cuenta ha sido aprobada!", type: 'success' });
            // Navigation handled by status effect below
          } else if (data && data.status === 'rejected') {
            fetchUserProfile(session.user.id);
          } else if (!data) {
            console.log("Profile missing (Polling) -> Rejected");
            fetchUserProfile(session.user.id);
          }
        });
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [session, currentUserData?.status]);

  // Main Authentication & Status Routing Effect
  useEffect(() => {
    if (isLoadingAuth) return;

    const currentPath = location.pathname;
    const isPublicRoute = ['/login', '/register', '/recover-password'].includes(currentPath);

    if (!session && !isPublicRoute) {
      navigate('/login');
      return;
    }

    if (session && isPublicRoute && !isResettingPassword) {
      // If logged in and trying to access public auth routes, redirect to app
      // But checking status first
      if (currentUserData) {
        if (currentUserData.status === 'pending') navigate('/account/pending');
        else if (currentUserData.status === 'rejected') navigate('/account/rejected');
        else navigate('/feed');
      }
      return;
    }

    if (session && currentUserData) {
      if (currentUserData.status === 'pending' && currentPath !== '/account/pending') {
        navigate('/account/pending');
      } else if (currentUserData.status === 'rejected' && currentPath !== '/account/rejected') {
        navigate('/account/rejected');
      } else if (currentUserData.status === 'active') {
        // Prevent active users from seeing status pages
        if (currentPath === '/account/pending' || currentPath === '/account/rejected') {
          navigate('/feed');
        }
      }
    }
  }, [session, currentUserData, isLoadingAuth, location.pathname, isResettingPassword, navigate]);

  const fetchUserProfile = async (uid: string) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    const { data: badges } = await supabase.from('user_badges').select('badge_id, created_at').eq('user_id', uid);

    if (profile) {
      const now = new Date();
      const day = now.getDay();
      const isWeekend = day === 0 || day === 6;

      const lastMonday = new Date(now);
      if (!isWeekend) {
        lastMonday.setDate(now.getDate() - (day - 1));
        lastMonday.setHours(0, 0, 0, 0);
      }

      const filteredBadges = (badges || []).filter(b => {
        return true;
      });

      setCurrentUserData({
        id: profile.id,
        name: profile.name,
        lastName: profile.last_name,
        username: profile.username,
        email: profile.email,
        position: profile.position || 'Personal Público',
        department: profile.department || 'Administración',
        jobCategory: profile.job_category,
        administrationType: profile.administration_type,
        roleDescription: profile.role_description,
        organizationName: profile.organization_name,
        avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
        banner: profile.banner,
        bannerColor: profile.banner_color,
        // status: profile.status, // Removed duplicate
        bio: profile.bio || '',
        interests: profile.interests || [],
        followers: profile.followers_count || 0,
        following: profile.following_count || 0,
        country: profile.country,
        region: profile.region,
        joinedDate: profile.created_at,
        birthDate: profile.birth_date,
        badges: filteredBadges.map(b => ({ id: b.badge_id, created_at: b.created_at })),
        notificationSettings: profile.notification_settings,
        chatSettings: profile.chat_settings,
        status: profile.status,
        isAdmin: profile.is_admin,
        isOrganization: profile.is_organization,
        organizationObjective: profile.organization_objective || (profile.is_organization ? profile.bio : '')
      });
    } else {
      console.log("Profile not found -> Rejected state");
      setCurrentUserData({ id: uid, status: 'rejected' } as any);
    }
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: allBadges } = await supabase.from('user_badges').select('user_id, badge_id, created_at');

    if (profiles) {
      const now = new Date();
      const day = now.getDay();
      const isWeekend = day === 0 || day === 6;
      const lastMonday = new Date(now);
      if (!isWeekend) {
        lastMonday.setDate(now.getDate() - (day - 1));
        lastMonday.setHours(0, 0, 0, 0);
      }

      const badgesByUserId = (allBadges || []).reduce((acc: any, curr: any) => {
        const badgeInfo = BADGE_CATALOG.find(cat => cat.id === curr.badge_id);

        if (!acc[curr.user_id]) acc[curr.user_id] = [];
        acc[curr.user_id].push({ id: curr.badge_id, created_at: curr.created_at });
        return acc;
      }, {});

      setUsers(profiles.map((u: any) => ({
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
        birthDate: u.birth_date,
        badges: badgesByUserId[u.id] || [],
        notificationSettings: u.notification_settings,
        isOrganization: u.is_organization,
        organizationObjective: u.organization_objective
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
    const { data: messagesData } = await supabase.from('messages').select('*, sender:profiles!sender_id(*), recipient:profiles!recipient_id(*), shared_profile:profiles!shared_profile_id(*)').or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`).order('created_at', { ascending: true });
    const deletedPosts: any[] = []; // await supabase.from('posts_deleted').select('post_id').eq('user_id', session.user.id);
    const deletedPostIds = new Set(deletedPosts?.map((p: any) => p.post_id) || []);

    const chatsMap = new Map<string, Chat>();
    messagesData?.forEach((m: any) => {
      const otherUser = m.sender_id === session.user.id ? m.recipient : m.sender;
      if (!otherUser) return;
      const chatId = otherUser.id;
      const chat = chatsMap.get(chatId) || { id: chatId, participant: { id: otherUser.id, name: otherUser.name, lastName: otherUser.last_name, username: otherUser.username, avatar: otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`, position: otherUser.position, department: otherUser.department, notificationSettings: otherUser.notification_settings }, messages: [], lastMessage: '', timestamp: new Date() };

      let sharedEventData = undefined;
      if (m.shared_event_id) {
        sharedEventData = globalEvents.find(e => e.id === m.shared_event_id);
        // If not in global (e.g. past event or restricted), we might miss it. 
        // Ideally we should fetch, but for now relying on globalEvents is a good start or we do a bulk fetch later.
      }

      chat.messages.push({
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        text: decryptMessage(m.text),
        timestamp: new Date(m.created_at),
        isRead: m.is_read,
        postId: m.post_id,
        isPostShare: m.is_post_share,
        sharedProfile: m.shared_profile ? {
          id: m.shared_profile.id,
          name: m.shared_profile.name,
          lastName: m.shared_profile.last_name,
          username: m.shared_profile.username,
          avatar: m.shared_profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.shared_profile.id}`,
          position: m.shared_profile.position,
          department: m.shared_profile.department
        } : undefined,
        sharedEventId: m.shared_event_id,
        sharedEvent: sharedEventData
      });
      chat.lastMessage = decryptMessage(m.text);
      chat.timestamp = new Date(m.created_at);
      chatsMap.set(chatId, chat);
    });
    setChats(Array.from(chatsMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const fetchNotifications = async () => {
    if (!session?.user) return;
    const { data, count } = await supabase
      .from('notifications')
      .select('*, sender:profiles!sender_id(*)', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(0, notificationsLimit - 1);

    if (data) {
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type,
        senderName: n.sender ? `${n.sender.name} ${n.sender.last_name || ''}` : 'NovaGob',
        senderId: n.sender_id, // Add senderId
        senderAvatar: n.sender?.avatar || (n.type === 'system' ? '/novagob-logo.png' : `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender_id}`),
        content: n.content,
        timestamp: n.created_at,
        isRead: n.is_read,
        postId: n.post_id
      }))
        .filter(n => !n.content.toLowerCase().includes('mensaje privado') && !n.content.toLowerCase().includes('private message') && n.type !== 'message' && n.type !== 'chat'));
      if (count !== null) setHasMoreNotifications(data.length < count);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [notificationsLimit]);

  const fetchGlobalEvents = async () => {
    const { data } = await supabase.from('user_events').select('*');
    if (data) setGlobalEvents(data.map(ev => ({ id: ev.id, creator_id: ev.creator_id, title: ev.title, type: ev.type as any, event_date: ev.event_date, event_time: ev.event_time, location: ev.location, description: ev.description, attendees: ev.attendees_count })));
  };

  const [feedOffset, setFeedOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ... (keep earlier useEffects)

  const fetchFeed = async (offset = 0, limit = 30) => {
    if (!session?.user) return;
    console.log(`Fetching feed with offset: ${offset}, limit: ${limit}`);
    try {
      // 1. Fetch Posts and News in parallel (paginated)
      const [
        { data: postsData, error: postsError }, { data: newsData, error: newsError },
        { data: myPostLikes }, { data: myNewsVotes }, { data: myReposts }, { data: globalEventsData }, { data: profilesData },
        { data: commentLikesData }
      ] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1),
        supabase.from('news').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1),
        supabase.from('post_likes').select('post_id, vote_type').eq('user_id', session.user.id),
        supabase.from('news_votes').select('news_id, vote_type').eq('user_id', session.user.id),
        supabase.from('post_reposts').select('post_id').eq('user_id', session.user.id),
        supabase.from('user_events').select('*').gte('attendees_count', 2),
        supabase.from('profiles').select('*'),
        supabase.from('comment_likes').select('comment_id').eq('user_id', session.user.id)
      ]);

      const profilesMap = new Map(); (profilesData || []).forEach(p => profilesMap.set(p.id, p));
      const eventsMap = new Map(); (globalEventsData || []).forEach(ev => eventsMap.set(ev.id, { id: ev.id, creator_id: ev.creator_id, title: ev.title, type: ev.type as any, event_date: ev.event_date, event_time: ev.event_time, location: ev.location, description: ev.description, attendees: ev.attendees_count }));

      // 1.5. Check for linked events that might be missing from the filtered globalEvents list (attendees >= 2)
      // This is crucial for event promotion previews to work even if the event is new/has few attendees.
      const linkedEventIds = new Set((postsData || []).map(p => p.linked_event_id).filter(Boolean));
      const missingEventIds = Array.from(linkedEventIds).filter(id => !eventsMap.has(id));

      if (missingEventIds.length > 0) {
        const { data: missingEvents } = await supabase.from('user_events').select('*').in('id', missingEventIds);
        if (missingEvents) {
          missingEvents.forEach((ev: any) => {
            // We add them to eventsMap for rendering, but NOT to globalEventsData state to keep the "Upcoming Events" list filtered.
            eventsMap.set(ev.id, { id: ev.id, creator_id: ev.creator_id, title: ev.title, type: ev.type as any, event_date: ev.event_date, event_time: ev.event_time, location: ev.location, description: ev.description, attendees: ev.attendees_count });
          });
        }
      }

      // 2. Collect IDs for related data fetching
      const postIds = (postsData || []).map(p => p.id);
      const newsIds = (newsData || []).map(n => n.id);
      const allIds = [...postIds, ...newsIds];

      if (allIds.length === 0 && offset > 0) {
        setHasMorePosts(false);
        return;
      }

      // 3. Fetch related data (Comments) specific to these posts/news
      let postComments: any[] = [];
      let newsComments: any[] = [];

      if (postIds.length > 0) {
        const { data: pc } = await supabase.from('post_comments').select('*, author:profiles!author_id(*)').in('post_id', postIds).order('created_at', { ascending: false });
        postComments = pc || [];
      }

      if (newsIds.length > 0) {
        const { data: nc } = await supabase.from('news_comments').select('*, author:profiles!author_id(*)').in('news_id', newsIds).order('created_at', { ascending: false });
        newsComments = nc || [];
      }

      const commentIds = [...postComments.map(c => c.id), ...newsComments.map(c => c.id)];
      // Fetch replies for these comments
      let repliesData: any[] = [];
      if (commentIds.length > 0) {
        const { data: rd } = await supabase.from('comment_replies').select('*').in('comment_id', commentIds).order('created_at', { ascending: true });
        repliesData = rd || [];
      }

      // Calculate Global Votes for News (only for fetched news)
      let newsVotesMap = new Map<string, { up: number, down: number }>();
      if (newsIds.length > 0) {
        const { data: allNewsVotes } = await supabase
          .from('news_votes')
          .select('news_id, vote_type')
          .in('news_id', newsIds);

        (allNewsVotes || []).forEach((v: any) => {
          const current = newsVotesMap.get(v.news_id) || { up: 0, down: 0 };
          if (v.vote_type === 'up') current.up++;
          else if (v.vote_type === 'down') current.down++;
          newsVotesMap.set(v.news_id, current);
        });
      }

      // ... (Rest of processing logic relies on standard variables)
      const myCommentLikes = new Set(commentLikesData?.map((l: any) => l.comment_id) || []);
      const allReplies = (repliesData || []).map((r: any) => { const author = profilesMap.get(r.author_id); return { id: r.id, commentId: r.comment_id, parentReplyId: r.parent_reply_id, authorId: r.author_id, authorName: author ? `${author.name} ${author.last_name || ''}` : 'Usuario', authorUsername: author?.username, authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.author_id}`, text: r.content, timestamp: r.created_at, likes: r.likes || 0, replies: [] }; });
      const buildReplyTree = (replies: any[]) => { const roots = new Map(); replies.forEach(r => { if (r.parentReplyId) { const parent = replies.find(pr => pr.id === r.parentReplyId); if (parent) (parent.replies = parent.replies || []).push(r); } else { const list = roots.get(r.commentId) || []; list.push(r); roots.set(r.commentId, list); } }); return roots; };
      const repliesMap = buildReplyTree(allReplies);
      const commentsMap = new Map();
      const processComments = (data: any[], idField: string) => (data || []).forEach((c: any) => {
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
          likes: n.likes_count || 0,
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

      const { data: deletedPosts } = await supabase.from('posts_deleted').select('post_id').eq('user_id', session.user.id);
      const deletedPostIds = new Set(deletedPosts?.map(p => p.post_id) || []);

      const newItems = [...formattedPosts, ...formattedNews]
        .filter(p => !deletedPostIds.has(p.id))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log(`Fetched ${newItems.length} items. Offset: ${offset}`);

      if (offset === 0) {
        setPosts(newItems);
        setHasMorePosts(newItems.length >= limit); // Heuristic
      } else {
        setPosts(prev => {
          // Dedup?
          const existingIds = new Set(prev.map(p => p.id));
          const filteredNew = newItems.filter(p => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });
        if (newItems.length < limit) setHasMorePosts(false);
      }

    } catch (e) { console.error("Error fetching feed:", e); }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMorePosts) return;
    setIsLoadingMore(true);

    // Unified strategy: Load 10 items per scroll
    const limit = 10;
    await fetchFeed(feedOffset, limit);
    setFeedOffset(prev => prev + limit);
    setIsLoadingMore(false);
  };

  // Update initial fetch to update offset
  // We need to modify the useEffect calling fetchFeed too.
  // ...


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
          // Delete notification if it was an upvote
          if (dir === 'up') {
            await supabase.from('notifications')
              .delete()
              .match({ user_id: post.authorId, sender_id: session.user.id, type: 'like', post_id: id });
          }
        } else {
          await supabase.from(table).update({ vote_type: dir }).eq('user_id', session.user.id).eq(idField, id);
          // If switching from up to down, delete notification
          if (dir === 'down') {
            await supabase.from('notifications')
              .delete()
              .match({ user_id: post.authorId, sender_id: session.user.id, type: 'like', post_id: id });
          }
          // If switching from down to up, create notification
          if (dir === 'up' && post.authorId !== session.user.id) {
            const { data: existingNotif } = await supabase.from('notifications').select('id').match({ user_id: post.authorId, sender_id: session.user.id, type: 'like', post_id: id }).maybeSingle();
            if (!existingNotif) {
              await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'like', content: `le ha gustado tu ${isNews ? 'noticia' : 'post'}`, post_id: id });
            }
          }
        }
      } else {
        await supabase.from(table).insert({ user_id: session.user.id, [idField]: id, vote_type: dir });
        if (post.authorId !== session.user.id && dir === 'up') {
          const { data: existingNotif } = await supabase.from('notifications').select('id').match({ user_id: post.authorId, sender_id: session.user.id, type: 'like', post_id: id }).maybeSingle();
          if (!existingNotif) {
            await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'like', content: `le ha gustado tu ${isNews ? 'noticia' : 'post'}`, post_id: id });
          }
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
      if (isCurrentlyFollowing) {
        await supabase.from('follows').delete().match({ follower_id: session.user.id, followed_id: userId });
        await supabase.from('notifications').delete().match({ user_id: userId, sender_id: session.user.id, type: 'follow' });
        setToast({ message: "Has dejado de seguir a este usuario.", type: 'info' });
      } else {
        await supabase.from('follows').insert({ follower_id: session.user.id, followed_id: userId });
        const { data: existingNotif } = await supabase.from('notifications').select('id').match({ user_id: userId, sender_id: session.user.id, type: 'follow' }).maybeSingle();
        if (!existingNotif) {
          await supabase.from('notifications').insert({ user_id: userId, sender_id: session.user.id, type: 'follow', content: `ha comenzado a seguirte` });
        }
        setToast({ message: "¡Ahora sigues a este usuario!", type: 'success' });
      }
      await Promise.all([fetchFollows(), fetchUserProfile(session.user.id), fetchUsers()]);
    } catch (error: any) { console.error("Error toggle follow:", error.message); fetchFollows(); }
    finally { setTimeout(() => setProcessingFollows(prev => { const next = new Set(prev); next.delete(userId); return next; }), 400); }
  }, [session, followedUserIds, processingFollows]);

  const handleUpdateUser = async (updatedUser: User) => {
    if (!session?.user) return;
    setCurrentUserData(updatedUser);

    // For organizations, mapped 'bio' input to 'organizationObjective' in EditProfileModal
    // But in SettingsView, we map it to 'organizationObjective'. 
    // We should ensure we save to the correct column.

    const { error } = await supabase.from('profiles').update({
      name: updatedUser.name,
      last_name: updatedUser.lastName,
      username: updatedUser.username?.toLowerCase().trim(),
      // email: updatedUser.email, // Removed to avoid schema issues if column missing or read-only
      birth_date: updatedUser.birthDate || null, // Ensure empty string becomes null to avoid 400 error
      position: updatedUser.position,
      department: updatedUser.department,
      job_category: updatedUser.jobCategory,
      administration_type: updatedUser.administrationType,
      // role_description: updatedUser.roleDescription, // Removed as it likely doesn't exist in DB
      // organization_objective: ... (Already removed)
      country: updatedUser.country,
      region: updatedUser.region,
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      avatar: updatedUser.avatar,
      // banner: updatedUser.banner, // Removed potential schema mismatch
      // banner_color: updatedUser.bannerColor, // Removed potential schema mismatch
      notification_settings: updatedUser.notificationSettings,
      updated_at: new Date().toISOString()
    }).eq('id', session.user.id);
    if (!error) {
      await Promise.all([fetchUserProfile(session.user.id), fetchUsers(), fetchFeed()]);
      setToast({ message: "Guardado", type: 'success' });
    } else {
      console.error("Error updating profile:", error);
      setToast({ message: "Error al actualizar perfil", type: 'error' });
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
    const { data: newPost, error } = await supabase.from(table).insert(payload).select().single();

    if (error) {
      console.error("Error al publicar:", error.message);
    } else {
      // Handle Mentions
      const mentionMatches = content.match(/@(\w+)/g);
      if (mentionMatches) {
        const uniqueMentions = [...new Set(mentionMatches.map(m => m.slice(1)))]; // Remove @ and dedup

        for (const username of uniqueMentions) {
          const mentionedUser = users.find(u => u.username?.toLowerCase() === username.toLowerCase());
          if (mentionedUser && mentionedUser.id !== session.user.id && mentionedUser.notificationSettings?.mentions !== false) {
            await supabase.from('notifications').insert({
              user_id: mentionedUser.id,
              sender_id: session.user.id,
              type: 'mention',
              content: `te ha mencionado en una publicación`,
              post_id: newPost.id
            });
          }
        }
      }

      fetchFeed();
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const table = post.type === 'news' ? 'news_comments' : 'post_comments';
    const idField = post.type === 'news' ? 'news_id' : 'post_id';

    try {
      await supabase.from(table).insert({ [idField]: postId, author_id: session.user.id, text });

      // Notify post author (if not self)
      if (post.authorId !== session.user.id) {
        await supabase.from('notifications').insert({
          user_id: post.authorId,
          sender_id: session.user.id,
          type: 'comment',
          content: `comentó en tu ${post.type === 'news' ? 'noticia' : 'post'}`,
          post_id: postId
        });
      }

      // Handle Mentions
      const mentionMatches = text.match(/@(\w+)/g);
      if (mentionMatches) {
        const uniqueMentions = [...new Set(mentionMatches.map(m => m.slice(1)))];

        for (const username of uniqueMentions) {
          const mentionedUser = users.find(u => u.username?.toLowerCase() === username.toLowerCase());
          // Don't notify if self-mention or if mentioned user is the post author (avoid double notification if they get a comment notif already? Actually mention is distinct)
          // Let's notify even if post author, because it's a specific mention.
          if (mentionedUser && mentionedUser.id !== session.user.id && mentionedUser.notificationSettings?.mentions !== false) {
            await supabase.from('notifications').insert({
              user_id: mentionedUser.id,
              sender_id: session.user.id,
              type: 'mention',
              content: `te ha mencionado en un comentario`,
              post_id: postId
            });
          }
        }
      }

      fetchFeed();
    } catch (e: any) {
      console.error("Error adding comment:", e);
      setToast({ message: "Error al publicar comentario.", type: 'error' });
    }
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
      let relatedPostId = selectedPostId; // Might need to ensure this is set correctly in context, usually it is when modal is open

      if (parentReplyId) {
        const { data: pr } = await supabase.from('comment_replies').select('author_id').eq('id', parentReplyId).single();
        targetAuthorId = pr?.author_id || null;
      } else {
        const { data: pc } = await supabase.from('post_comments').select('author_id, post_id').eq('id', commentId).maybeSingle();
        if (pc) { targetAuthorId = pc.author_id; relatedPostId = pc.post_id || relatedPostId; }
        else {
          const { data: nc } = await supabase.from('news_comments').select('author_id, news_id').eq('id', commentId).maybeSingle();
          targetAuthorId = nc?.author_id || null;
          relatedPostId = nc?.news_id || relatedPostId;
        }
      }

      if (targetAuthorId && targetAuthorId !== session.user.id) {
        await supabase.from('notifications').insert({
          user_id: targetAuthorId,
          sender_id: session.user.id,
          type: 'comment', // Or 'reply' if we had it, but 'comment' is fine with "ha respondido" content
          content: `ha respondido a tu comentario`,
          post_id: relatedPostId
        });
      }

      // Handle Mentions
      const mentionMatches = text.match(/@(\w+)/g);
      if (mentionMatches) {
        const uniqueMentions = [...new Set(mentionMatches.map(m => m.slice(1)))];

        for (const username of uniqueMentions) {
          const mentionedUser = users.find(u => u.username?.toLowerCase() === username.toLowerCase());
          if (mentionedUser && mentionedUser.id !== session.user.id && mentionedUser.notificationSettings?.mentions !== false) {
            await supabase.from('notifications').insert({
              user_id: mentionedUser.id,
              sender_id: session.user.id,
              type: 'mention',
              content: `te ha mencionado en una respuesta`,
              post_id: relatedPostId
            });
          }
        }
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
        await supabase.from('notifications').delete().match({ user_id: targetComment.authorId, sender_id: session.user.id, type: 'like', post_id: targetPost?.id });
      } else {
        await supabase.from('comment_likes').insert({ user_id: session.user.id, comment_id: commentId });

        // Notify comment author
        if (targetComment.authorId !== session.user.id) {
          const { data: existing } = await supabase.from('notifications').select('id').match({ user_id: targetComment.authorId, sender_id: session.user.id, type: 'like', content: 'le ha gustado tu comentario' }).maybeSingle(); // Content key for dedup? Or just type/sender/recipient
          // Better unique constraint would be comment_id if we store it. But notifications table links to post_id usually.
          // Let's rely on standard dedup pattern.
          if (!existing) {
            await supabase.from('notifications').insert({
              user_id: targetComment.authorId,
              sender_id: session.user.id,
              type: 'like',
              content: `le ha gustado tu comentario`,
              post_id: targetPost?.id
            });
          }
        }
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

  const handleSupportEvent = async (event: CalendarEvent) => {
    if (!session?.user) return;

    // Optimistic update
    setGlobalEvents(prev => prev.map(e => e.id === event.id ? { ...e, attendees: (e.attendees || 0) + 1 } : e));

    try {
      const { error } = await supabase.from('event_supports').insert({
        user_id: session.user.id,
        event_id: event.id
      });

      if (error) {
        if (error.code === '23505') { // Unique violation
          setToast({ message: "Ya has apoyado este evento.", type: 'info' });
        } else {
          throw error;
        }
      } else {
        setToast({ message: "¡Estás apoyando este evento!", type: 'success' });
        if (event.creator_id !== session.user.id) {
          const { data: existing } = await supabase.from('notifications').select('id').match({ user_id: event.creator_id, sender_id: session.user.id, type: 'like', content: `está apoyando tu evento: ${event.title}` }).maybeSingle();
          if (!existing) {
            await supabase.from('notifications').insert({
              user_id: event.creator_id,
              sender_id: session.user.id,
              type: 'like',
              content: `está apoyando tu evento: ${event.title}`
            });
          }
        }
      }
      fetchGlobalEvents();
    } catch (e: any) {
      console.error("Error supporting event:", e);
      setToast({ message: "Error al apoyar evento.", type: 'error' });
      fetchGlobalEvents();
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
      if (existingRepost) {
        await supabase.from('post_reposts').delete().eq('user_id', session.user.id).eq('post_id', postId);
        await supabase.from('notifications').delete().match({ user_id: targetPost.authorId, sender_id: session.user.id, type: 'repost', post_id: postId });
        setToast({ message: "Has eliminado tu republicación.", type: 'info' });
      } else {
        await supabase.from('post_reposts').insert({ user_id: session.user.id, post_id: postId });
        if (targetPost.authorId !== session.user.id) {
          const { data: existingNotif } = await supabase.from('notifications').select('id').match({ user_id: targetPost.authorId, sender_id: session.user.id, type: 'repost', post_id: postId }).maybeSingle();
          if (!existingNotif) {
            supabase.from('notifications').insert({ user_id: targetPost.authorId, sender_id: session.user.id, type: 'repost', content: `ha republicado tu post`, post_id: postId });
          }
        }
        setToast({ message: "¡Publicación republicada!", type: 'success' });
      }
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

    // Optimistic UI Update: Mark relevant messages as read locally
    setChats(prevChats => prevChats.map(c => {
      if (c.id === chatId) {
        // Mark last message and any other unread messages as read
        const updatedMessages = c.messages.map(m => {
          if (m.senderId === chatId && !m.isRead) {
            return { ...m, isRead: true };
          }
          return m;
        });
        return { ...c, messages: updatedMessages };
      }
      return c;
    }));

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('recipient_id', session.user.id)
        .eq('sender_id', chatId)
        .eq('is_read', false);

      // We can fetch, but optimistic update handles the immediate feedback.
      // fetchChats(); // Only if needed to sync exactly. Realtime might handle it eventually.
      fetchNotifications();
    } catch (err) {
      console.error("Error marking chat as read:", err);
      // Revert if error? (Optional, but usually not critical for read status)
      fetchChats();
    }
  };

  const handleNavigateToProfile = (userId: string) => {
    const targetUser = users.find(u => u.id === userId) || (currentUserData?.id === userId ? currentUserData : null);
    const identifier = targetUser?.username || userId;
    navigate(`/${identifier}`);
  };

  const handleNavigateToEvent = (userId: string, eventId: string) => {
    setTargetEventId(eventId);
    handleNavigateToProfile(userId);
  };

  const handleNavigateToCalendarDate = (date: Date) => {
    setTargetCalendarDate(date);
    navigate('/calendar');
  };

  const handleSendMessage = async (recipientId: string, text: string, postShareId?: string, profileShareId?: string, sharedEventId?: string) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: session.user.id,
        recipient_id: recipientId,
        text: encryptMessage(text),
        post_id: postShareId,
        is_post_share: !!postShareId,
        shared_profile_id: profileShareId,
        shared_event_id: sharedEventId
      });

      if (error) throw error;



      fetchChats();
    } catch (err: any) {
      console.error("Error sending message:", err.message);
      setToast({ message: "Error al enviar el mensaje.", type: 'error' });
    }
  };

  const handleSendMessageFromShare = async (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string, sharedEventId?: string) => {
    await handleSendMessage(recipientId, text, sharedPostId, sharedProfileId, sharedEventId);
    setToast({ message: "Contenido compartido por chat.", type: 'success' });
  };

  const handleDeletePost = async (postId: string) => {
    if (!session?.user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // 1. Insert into posts_deleted (Log/Backup)
    const { error: backupError } = await supabase.from('posts_deleted').insert({
      post_id: postId,
      user_id: session.user.id,
      content: post.content,
      image_url: post.imageUrl,
      post_type: post.type,
      original_created_at: post.timestamp
    });

    if (backupError) {
      console.error("Error backing up post:", backupError);
      // Decide logic: if we fail to backup, do we delete? 
      // User request "Quiero que se almacene". If storage fails, we should probably warn or try anyway if it's already deleted?
      // Let's assume strict compliance: "If backup fails, warn user".
      // But usually user just wants deletion. Let's log error but proceed if it's unique constraint (already backed up).
      if (backupError.code !== '23505') { // 23505 = distinct violation
        setToast({ message: "Error al registrar eliminación. Inténtalo de nuevo.", type: 'error' });
        return;
      }
    }

    // 2. Delete from original table
    const table = post.type === 'news' ? 'news' : 'posts';
    const { error: deleteError } = await supabase.from(table).delete().eq('id', postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      setToast({ message: "No se pudo eliminar el post.", type: 'error' });
    } else {
      setToast({ message: "Post eliminado correctamente.", type: 'success' });
      fetchFeed();
    }
  };

  // Render Logic
  if (isLoadingAuth) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>;

  const handleApproveUser = async (userId: string, notificationId?: string) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
      if (error) throw error;

      if (notificationId) {
        // Optimistic update for UI
        const user = users.find(u => u.id === userId);
        const name = user ? `${user.name} ${user.lastName || ''}`.trim() : 'Usuario';
        const content = `Solicitud de ${name} aceptada`;

        setNotifications(prev => prev.map(n =>
          (n.senderId === userId && n.type === 'registration_request')
            ? { ...n, content: content, isRead: true, type: 'system' }
            : n
        ));

        // Call Secure RPC to update globally
        const { error: rpcError } = await supabase.rpc('resolve_registration_request', {
          target_user_id: userId,
          request_status: 'active'
        });

        if (rpcError) throw rpcError;
      }

      setToast({ message: "Usuario aprobado correctamente.", type: 'success' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      await fetchNotifications();
    } catch (err: any) {
      console.error("Error approving user:", err.message);
      setToast({ message: "Error al aprobar usuario.", type: 'error' });
    }
  };

  const handleRejectUser = async (userId: string, notificationId?: string) => {
    if (!session?.user) return;
    try {
      const { error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
      if (error) throw error;

      if (notificationId) {
        // Optimistic update for UI
        const user = users.find(u => u.id === userId);
        const name = user ? `${user.name} ${user.lastName || ''}`.trim() : 'Usuario';
        const content = `Solicitud de ${name} rechazada`;

        setNotifications(prev => prev.map(n =>
          (n.senderId === userId && n.type === 'registration_request')
            ? { ...n, content: content, isRead: true, type: 'system' }
            : n
        ));

        // Call Secure RPC to update globally
        const { error: rpcError } = await supabase.rpc('resolve_registration_request', {
          target_user_id: userId,
          request_status: 'rejected'
        });

        if (rpcError) throw rpcError;
      }

      setToast({ message: "Usuario rechazado.", type: 'success' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
      await fetchNotifications();
    } catch (err: any) {
      console.error("Error rejecting user:", err.message);
      setToast({ message: "Error al rechazar usuario.", type: 'error' });
    }
  };

  // We remove the conditional returns regarding pending/rejected/auth here because we use Routes now.
  // However, we still need to conditionally render the Layout only for app routes.


  const PostDetailWrapper = () => {
    const { postId } = useParams();
    const post = posts.find(p => p.id === postId);
    if (!post) return <div className="p-10 text-center">{language === 'es' ? 'Post no encontrado' : 'Post not found'}</div>;

    return (
      <FullPostView
        post={post}
        currentUser={currentUserData!}
        onDeletePost={handleDeletePost}
        onLike={(id) => handleVote(id, 'up')}
        onVote={handleVote}
        onAddComment={handleAddComment}
        onAddReply={handleAddReply}
        onVoteComment={handleVoteComment}
        onRepost={handleRepost}
        onNavigateToProfile={handleNavigateToProfile}
        onBack={() => navigate(-1)}
        onSearchHashtag={(t) => navigate(`/search?q=${encodeURIComponent(t)}`)}
        users={users}
        onNavigateToEvent={handleNavigateToEvent}
        chats={chats}
        followerUserIds={followerUserIds}
        onShareViaChat={handleSendMessageFromShare}
        language={language}
      />
    );
  };






  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => { navigate('/feed'); }} onRegister={() => navigate('/register')} />} />
        <Route path="/register" element={<Onboarding onComplete={() => navigate('/account/pending')} onCancel={() => navigate('/login')} />} />
        <Route path="/recover-password" element={<PasswordRecover onComplete={() => navigate('/login')} />} />

        <Route path="/account/pending" element={
          <PendingAccount onLogout={() => { supabase.auth.signOut(); navigate('/login'); }} />
        } />
        <Route path="/account/rejected" element={
          <RejectedAccount onLogout={() => { supabase.auth.signOut(); navigate('/login'); }} />
        } />

        <Route path="/*" element={
          (!session || !currentUserData) ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>
          ) : (
            <Layout
              user={currentUserData!}
              notifications={notifications}
              globalEvents={globalEvents}
              posts={posts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
              onLogout={() => {
                sessionStorage.clear();
                supabase.auth.signOut();
                navigate('/login');
              }}
              language={language}
              onRefresh={handleRefreshFeed}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/feed" replace />} />
                <Route path="/feed" element={
                  <SocialFeed
                    posts={posts.filter(p => p.type === 'post')}
                    onLoadMore={handleLoadMore}
                    hasMore={hasMorePosts}
                    isLoadingMore={isLoadingMore}
                    user={currentUserData!}
                    onLike={(id) => handleVote(id, 'up')}
                    onVote={handleVote}
                    onRepost={handleRepost}
                    onAddPost={handleAddPost}
                    onAddComment={handleAddComment}
                    users={users}
                    onNavigateToProfile={handleNavigateToProfile}
                    followedUserIds={followedUserIds}
                    followerUserIds={followerUserIds}
                    onToggleFollow={handleToggleFollow}
                    onNavigateToPost={(id) => navigate(`/post/${id}`)}
                    onSearchHashtag={(t) => navigate(`/search?q=${encodeURIComponent(t)}`)}
                    onDeletePost={handleDeletePost}
                    initialContent={prefilledPostContent}
                    prefilledEvent={prefilledEvent}
                    onClearInitialContent={() => { setPrefilledPostContent(null); setPrefilledEvent(null); }}
                    onViewCalendar={() => navigate('/calendar')}
                    onNavigateToEvent={handleNavigateToEvent}
                    chats={chats}
                    onShareViaChat={handleSendMessageFromShare}
                    language={language}
                    hasNewContent={hasNewPosts}
                    onRefresh={handleRefreshFeed}
                    pinnedPosts={pinnedPosts}
                    onTogglePin={handleTogglePin}
                  />
                } />
                <Route path="/news" element={
                  <NewsHubView
                    posts={posts.filter(p => p.type === 'news')}
                    onLoadMore={handleLoadMore}
                    hasMore={hasMorePosts}
                    isLoadingMore={isLoadingMore}
                    user={currentUserData!}
                    onVote={handleVote}
                    onRepost={handleRepost}
                    onAddPost={handleAddPost}
                    onAddComment={handleAddComment}
                    currentUser={currentUserData!}
                    users={users}
                    onNavigateToProfile={handleNavigateToProfile}
                    onNavigateToPost={(id) => navigate(`/post/${id}`)}
                    onSearchHashtag={(t) => navigate(`/search?q=${encodeURIComponent(t)}`)}
                    onDeletePost={handleDeletePost}
                    chats={chats}
                    followerUserIds={followerUserIds}
                    onShareViaChat={handleSendMessageFromShare}
                    language={language}
                    hasNewContent={hasNewPosts}
                    onRefresh={handleRefreshFeed}
                  />
                } />
                <Route path="/calendar" element={
                  <CalendarView
                    onNavigateToEvent={handleNavigateToEvent}
                    onPromoteEvent={(ev) => {
                      setPrefilledPostContent(`📢 ¡Os invito a participar en este evento!\n\n${ev.title}\n\nhttps://red.novagob.org/u/${ev.creator_id}/e/${ev.id} #Evento`);
                      setPrefilledEvent(ev);
                      navigate('/feed');
                    }}
                    onSupportEvent={handleSupportEvent}
                    onShareEvent={setSharingEvent}
                    initialDate={targetCalendarDate}
                    language={language}
                  />
                } />
                <Route path="/messages/:chatId?" element={
                  <MessagesView
                    user={currentUserData!}
                    chats={chats}
                    posts={posts}
                    users={users}
                    onSendMessage={handleSendMessage}
                    onNavigateToProfile={handleNavigateToProfile}
                    onViewPost={(pid) => navigate(`/post/${pid}`)}
                    externalActiveId={activeChatUserId}
                    onMarkChatAsRead={handleMarkChatAsRead}
                    onNavigateToEvent={handleNavigateToEvent}
                    globalEvents={globalEvents}
                    language={language}
                  />
                } />
                <Route path="/notifications" element={
                  <NotificationsView
                    notifications={notifications}
                    onMarkAllRead={handleMarkAllNotificationsRead}
                    onNotificationClick={(id) => { if (id) navigate(`/post/${id}`); }}
                    onLoadMore={() => setNotificationsLimit(prev => prev + 10)}
                    hasMore={hasMoreNotifications}
                    language={language}
                    onApproveUser={handleApproveUser}
                    onRejectUser={handleRejectUser}
                    currentUser={currentUserData!}
                  />
                } />
                <Route path="/store" element={<StoreView user={currentUserData!} language={language} />} />

                <Route path="/settings" element={<SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} onLogout={() => { sessionStorage.clear(); supabase.auth.signOut(); navigate('/login'); }} onViewChange={(v) => navigate(`/${v}`)} theme={theme} onThemeChange={setTheme} language={language} onLanguageChange={setLanguage} />} />
                <Route path="/search" element={
                  <SearchRoute
                    posts={posts}
                    users={users}
                    onLike={(id) => handleVote(id, 'up')}
                    onVote={handleVote}
                    onRepost={handleRepost}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onViewChange={(v) => { if (v === 'profile') handleNavigateToProfile(currentUserData?.id || ''); else navigate(`/${v}`); }}
                    currentUser={currentUserData!}
                    followedUserIds={followedUserIds}
                    followerUserIds={followerUserIds}
                    onToggleFollow={handleToggleFollow}
                    onNavigateToProfile={handleNavigateToProfile}
                    onNavigateToPost={(id) => navigate(`/post/${id}`)}
                    onSearchHashtag={(t) => navigate(`/search?q=${encodeURIComponent(t)}`)}
                    onNavigateToEvent={handleNavigateToEvent}
                    chats={chats}
                    onShareViaChat={handleSendMessageFromShare}
                    language={language}
                  />
                } />
                <Route path="/post/:postId" element={<PostDetailWrapper />} />
                <Route path="/:username" element={
                  <ProfileRoute
                    users={users}
                    currentUserData={currentUserData}
                    posts={posts}
                    chats={chats}
                    followerUserIds={followerUserIds}
                    followedUserIds={followedUserIds}
                    onUpdateUser={handleUpdateUser}
                    onRepost={handleRepost}
                    onToggleFollow={handleToggleFollow}
                    onDeletePost={handleDeletePost}
                    onNavigateToEvent={handleNavigateToEvent}
                    onStartChat={(tu) => { navigate(`/messages/${tu.id}`); }}
                    onAddPost={handleAddPost}
                    onPromoteEvent={(ev) => { setPrefilledPostContent(ev.description || `📢 ¡Evento organizado!\n\n${ev.title}\n\n#Evento`); setPrefilledEvent(ev); navigate('/feed'); }}
                    onShareViaChat={handleSendMessageFromShare}
                    pinnedPosts={pinnedPosts}
                    onTogglePin={handleTogglePin}
                    focusedEventId={targetEventId}
                    onClearFocusedEvent={() => setTargetEventId(null)}
                    onSearchHashtag={(t) => { setSearchQuery(t); navigate(`/search?q=${encodeURIComponent(t)}`); }}
                    onNavigateToPost={(id) => navigate(`/post/${id}`)}
                    onNavigateToProfile={handleNavigateToProfile}
                    onLike={(id) => handleVote(id, 'up')}
                    onVote={handleVote}
                    onAddComment={handleAddComment}
                    globalEvents={globalEvents}
                    language={language}
                  />
                } />
              </Routes>
            </Layout>
          )
        } />
      </Routes>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {sharingPost && <ShareModal post={sharingPost} onClose={() => setSharingPost(null)} onShare={handleSendMessageFromShare} currentUser={currentUserData!} users={users} followedUserIds={followedUserIds} followerUserIds={followerUserIds} />}
      {sharingEvent && <ShareModal event={sharingEvent} onClose={() => setSharingEvent(null)} onShare={handleSendMessageFromShare} currentUser={currentUserData!} users={users} followedUserIds={followedUserIds} followerUserIds={followerUserIds} />}
    </div>
  );
};

export default App;
