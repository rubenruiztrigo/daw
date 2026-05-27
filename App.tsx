
import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { SocialFeed } from './components/SocialFeed';
import { ProfileView } from './components/ProfileView';
import { ProfileRoute } from './components/ProfileRoute';
import { MessagesView } from './components/MessagesView';
import { NewsHubView } from './components/NewsHubView';
import { SearchResultsView } from './components/SearchResultsView';
import { SettingsView } from './components/SettingsView';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { NotificationsView } from './components/NotificationsView';
import { ScrollManager } from './components/ScrollManager';
import { User, Post, Chat, Message, Notification, Comment, CalendarEvent } from './types';
import { supabase, REMEMBER_ME_KEY, SESSION_ALIVE_KEY } from './supabaseClient';
import { Loader2, Clock, X, Ban } from 'lucide-react';
import { SearchRoute } from './components/SearchRoute';
import { PostDetailsModal } from './components/PostDetailsModal';
import { PostDetailView } from './components/PostDetailView';
import { RegistrationDetailsModal } from './components/RegistrationDetailsModal';
import { TutorialModal } from './components/TutorialModal';
import { Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Lazy-loaded: only needed when user visits those pages (reduces initial bundle parse time)
const AdminPanelView = lazy(() => import('./components/AdminPanelView').then(m => ({ default: m.AdminPanelView })));
const StoreView = lazy(() => import('./components/StoreView').then(m => ({ default: m.StoreView })));
const CalendarView = lazy(() => import('./components/CalendarView').then(m => ({ default: m.CalendarView })));

const LazyFallback = () => <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={32} /></div>;
import { getSafeAvatar } from './utils/avatarUtils';
import { getMentionedUsernames } from './utils/mentionUtils';
import { isCacheFresh, setMemoryCache, getMemoryCache, isMemoryCacheFresh, safeLocalStorageSet } from './utils/cacheUtils';

const DEFAULT_NOTIFICATION_SETTINGS = {
  likes_post: true,
  likes_news: true,
  likes_comment: true,
  comments_post: true,
  comments_news: true,
  replies: true,
  follows: true,
  event_supports: true,
  reposts: true,
  mentions: true,
  rewards_accepted: true,
  novas_earned: true,
  badges_earned: true,
  ranking_weekly: true,
  maintenance_notices: true,
} as const;

const normalizeNotificationSettings = (settings?: unknown) => {
  const source = settings && typeof settings === 'object' && !Array.isArray(settings) ? settings as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(DEFAULT_NOTIFICATION_SETTINGS).map(([key, fallback]) => {
    const value = source[key];
    return [key, typeof value === 'boolean' ? value : fallback];
  })) as Record<keyof typeof DEFAULT_NOTIFICATION_SETTINGS, boolean>;
};

type AppView = 'feed' | 'profile' | 'messages' | 'news' | 'search' | 'settings' | 'notifications' | 'calendar';
type Theme = 'light' | 'dark';

// One-time localStorage cleanup to recover space from oversized legacy caches.
// Eviction order: least-valuable first. chat_msgs_* and chat_inline_posts_* are
// NEVER wiped here — they are critical for instant post/event rendering.
if (typeof window !== 'undefined' && sessionStorage.getItem('_ls_cleaned') !== '2') {
  sessionStorage.setItem('_ls_cleaned', '2');
  try {
    const usage = Object.keys(localStorage).reduce((n, k) => n + (localStorage.getItem(k)?.length ?? 0), 0);
    if (usage > 3_500_000) {
      // Round 1: evict large but easily-rebuilt caches — keep last_known_feed (instant posts on refresh)
      ['author_manifest', 'event_manifest', 'weekly_trends_cache',
       'last_known_following_feed', 'global_events_cache'].forEach(k => localStorage.removeItem(k));
    }
  } catch {}
}

// ── Module-level localStorage pre-parse ──────────────────────────────────────
// Parse once at module load so multiple useState initializers share the same
// parsed objects without redundant JSON.parse calls on the main thread.
const _lsFeed = (() => { try { const r = localStorage.getItem('last_known_feed'); if (r) { const p = JSON.parse(r); if (Array.isArray(p) && p.length > 0) return p; } } catch {} return null; })();
const _lsFollowingFeed = (() => { try { const r = localStorage.getItem('last_known_following_feed'); if (r) { const p = JSON.parse(r); if (Array.isArray(p) && p.length > 0) return p; } } catch {} return null; })();
const _lsNews = (() => { try { const r = localStorage.getItem('last_known_news'); if (r) { const p = JSON.parse(r); if (Array.isArray(p) && p.length > 0) return p; } } catch {} return null; })();
const _lsAuthorManifest: Record<string, any> = (() => { try { return JSON.parse(localStorage.getItem('author_manifest') || '{}'); } catch { return {}; } })();
const _lsEventManifest: Record<string, any> = (() => { try { return JSON.parse(localStorage.getItem('event_manifest') || '{}'); } catch { return {}; } })();
const _SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const _PROJECT_ID = _SUPABASE_URL.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || 'default';
const _AUTH_STORAGE_KEY = `sb-${_PROJECT_ID}-auth-token`;
const _lsSession = (() => { try { const r = localStorage.getItem(_AUTH_STORAGE_KEY); if (r) { const p = JSON.parse(r); if (p?.user?.id) return p; } } catch {} return null; })();
const _lsChats = (() => { try { if (!_lsSession?.user?.id) return null; const r = localStorage.getItem(`chat_list_${_lsSession.user.id}`); if (r) { const p = JSON.parse(r); if (Array.isArray(p) && p.length > 0) return p; } } catch {} return null; })();
const _lsNotifications = (() => { try { if (!_lsSession?.user?.id) return null; const r = localStorage.getItem(`last_known_notifications_${_lsSession.user.id}`); if (r) { const p = JSON.parse(r); if (Array.isArray(p) && p.length > 0) return p; } } catch {} return null; })();
const _lsUsers = (() => { try { const r = localStorage.getItem('last_known_users'); if (r) { const p = JSON.parse(r); if (Array.isArray(p) && p.length > 0) return p; } } catch {} return null; })();
// ─────────────────────────────────────────────────────────────────────────────

// Module-level in-memory caches for chat preview data — survive between fetchChatMessages
// calls within the same session without any DB or localStorage round-trip.
const _chatPostPreviews = new Map<string, any>();   // postId/newsId → inlineSharedPost
const _chatEventPreviews = new Map<string, any>();  // eventId → sharedEvent
const _chatProfilePreviews = new Map<string, any>(); // profileId → sharedProfile

// Pre-seed in-memory caches from localStorage on module load so the very first
// fetchChatMessages call after a page refresh already has preview data in memory.
try {
  const posts = JSON.parse(localStorage.getItem('chat_inline_posts_seed') || 'null');
  if (posts) Object.entries(posts).forEach(([k, v]) => _chatPostPreviews.set(k, v));
} catch {}
try {
  const evts = JSON.parse(localStorage.getItem('chat_shared_events_seed') || 'null');
  if (evts) Object.entries(evts).forEach(([k, v]) => _chatEventPreviews.set(k, v));
} catch {}
try {
  const profs = JSON.parse(localStorage.getItem('chat_shared_profiles_seed') || 'null');
  if (profs) Object.entries(profs).forEach(([k, v]) => _chatProfilePreviews.set(k, v));
} catch {}

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(() => _lsSession);
  const [isLoadingAuth, setIsLoadingAuth] = useState(() => _lsSession === null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const maintenanceModeRef = useRef(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(() => !!localStorage.getItem('cached_user_profile'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/noticias')) return 'news';
    if (path.startsWith('/inicio') || path === '/') return 'feed';
    if (path.startsWith('/chat') || path.startsWith('/ajustes') || path.startsWith('/busqueda')) return 'feed'; // Other main views
    return 'profile';
  });
  const [currentUserData, setCurrentUserData] = useState<User | null>(() => {
    const cached = localStorage.getItem('cached_user_profile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          return {
            ...parsed,
            notificationSettings: normalizeNotificationSettings(parsed.notificationSettings),
          };
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingProfileFeed, setIsLoadingProfileFeed] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const currentProfileIdRef = React.useRef<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeChatHasMore, setActiveChatHasMore] = useState(true);
  const [activeChatMessagesLoading, setActiveChatMessagesLoading] = useState(false);
  
  // COMMON HYDRATION LOGIC: Pre-calculate the combined feed from localStorage
  const hydratedFeed = useMemo(() => {
    const feedItems = (_lsFeed || []).map((p: any) => ({
      ...p,
      type: p.type || 'post',
      authorName: (p.authorName && p.authorName !== 'Usuario') ? p.authorName : (_lsAuthorManifest[p.authorId]?.name || p.authorName || 'Usuario'),
      linkedEvent: p.linkedEventId ? (_lsEventManifest[p.linkedEventId] ?? p.linkedEvent ?? null) : null
    }));
    const newsItems = (_lsNews || []).map((p: any) => ({
      ...p,
      type: 'news',
      authorName: (p.authorName && p.authorName !== 'Usuario') ? p.authorName : (_lsAuthorManifest[p.authorId]?.name || p.authorName || 'Usuario'),
      linkedEvent: p.linkedEventId ? (_lsEventManifest[p.linkedEventId] ?? p.linkedEvent ?? null) : null
    }));
    const combined = [...feedItems, ...newsItems];
    return Array.from(new Map(combined.map(p => [p.id, p])).values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const [posts, setPosts] = useState<Post[]>(hydratedFeed);

  const [profilePosts, setProfilePosts] = useState<Post[]>(() => {
    // PRE-SEEDING: If we are refreshing on a profile page, try to find the user's posts
    // in the general home feed cache to show them instantly.
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const identifier = parts[0]; 
    
    if (identifier && identifier !== 'inicio' && identifier !== 'noticias' && identifier !== 'ajustes' && identifier !== 'busqueda') {
      const lowId = identifier.toLowerCase();
      return hydratedFeed.filter(p => 
        p.authorUsername?.toLowerCase() === lowId || 
        p.authorId === identifier
      );
    }
    return [];
  });
  const [followingPosts, setFollowingPosts] = useState<Post[]>(() => {
    const items = (_lsFollowingFeed || []).map((p: any) => ({
      ...p,
      type: p.type || 'post',
      authorName: (p.authorName && p.authorName !== 'Usuario') ? p.authorName : (_lsAuthorManifest[p.authorId]?.name || p.authorName || 'Usuario'),
      linkedEvent: p.linkedEventId ? (_lsEventManifest[p.linkedEventId] ?? p.linkedEvent ?? null) : null
    }));
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  // HELPER: Update a post across ALL active feed states (Home, Following, Profile)
  const updateAllFeeds = useCallback((updater: (prev: Post[]) => Post[]) => {
    setPosts(updater);
    setFollowingPosts(updater);
    setProfilePosts(updater);
  }, []);

  const [chats, setChats] = useState<Chat[]>(() => {
    if (!_lsChats) return [];
    return _lsChats.map((c: any) => ({ ...c, timestamp: new Date(c.timestamp), messages: [] }));
  });
  const [chatsLoading, setChatsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>(() => _lsUsers || []);
  const [notifications, setNotifications] = useState<Notification[]>(() => _lsNotifications || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [selectedPostFromNotify, setSelectedPostFromNotify] = useState<Post | null>(null);
  const [globalEvents, setGlobalEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('global_events_cache');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.data) ? parsed.data : []);
    } catch { return []; }
  });
  // True while fetchGlobalEvents hasn't completed its first run (no cache existed on mount)
  const [globalEventsLoading, setGlobalEventsLoading] = useState<boolean>(() => {
    return !localStorage.getItem('global_events_cache');
  });
  const [storeRewards, setStoreRewards] = useState<any[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<any[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(false);
  const [hasMoreNews, setHasMoreNews] = useState(false);

  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [isLoadingMoreFollowing, setIsLoadingMoreFollowing] = useState(false);
  const [isLoadingMoreNews, setIsLoadingMoreNews] = useState(false);

  const [feedFetched, setFeedFetched] = useState(() => _lsFeed !== null);
  const [newsFeedFetched, setNewsFeedFetched] = useState(() => _lsNews !== null);
  const [weeklyTrends, setWeeklyTrends] = useState<{ tag: string, count: number }[] | null>(() => {
    try {
      const saved = localStorage.getItem('weekly_trends_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data || [];
      }
    } catch (e) {
      console.warn("Error loading weekly trends from cache:", e);
    }
    return null;
  });
  const [selectedRegistrationUserId, setSelectedRegistrationUserId] = useState<string | null>(null);
  const [selectedRegistrationUser, setSelectedRegistrationUser] = useState<User | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasTriggeredTutorial, setHasTriggeredTutorial] = useState(false);
  const [activeTourStepId, setActiveTourStepId] = useState<string | null>(null);
   const lastFetchIdRef = useRef(0);
  const lastProfileFetchIdRef = React.useRef(0);
  const lastProfileFetchTimeRef = React.useRef(0);


  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('followed_user_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [followerUserIds, setFollowerUserIds] = useState<Set<string>>(new Set());
  const [matchedUserIds, setMatchedUserIds] = useState<string[]>([]); // Cache for interest-based algorithm
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'admin'>(() => {
    const saved = sessionStorage.getItem('social_feed_tab');
    return (saved as any) || 'for-you';
  });
  const activeChatUserIdRef = React.useRef<string | null>(null);
  const activeTabRef = React.useRef(activeTab);
  const followedUserIdsRef = React.useRef(followedUserIds);
  const followerUserIdsRef = React.useRef(followerUserIds);
  const matchedUserIdsRef = React.useRef(matchedUserIds);
  const isFetchingRef = React.useRef(false); // Concurrency Lock (posts)
  const isFetchingNewsRef = React.useRef(false); // Concurrency Lock (news — independent)
  const currentViewRef = React.useRef<AppView>(currentView);
  const viewingUserIdRef = React.useRef<string | null>(viewingUserId);
  // Track last successful fetch time per tab to avoid redundant re-fetches on tab switch
  const tabLastFetchedRef = React.useRef<Record<string, number>>({});

  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('post_liked_ids'); if (s) return new Set<string>(JSON.parse(s)); } catch {}
    return new Set<string>();
  });
  const [votedUpIds, setVotedUpIds] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('news_voted_up'); if (s) return new Set<string>(JSON.parse(s)); } catch {}
    return new Set<string>();
  });
  const [votedDownIds, setVotedDownIds] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('news_voted_down'); if (s) return new Set<string>(JSON.parse(s)); } catch {}
    return new Set<string>();
  });
  const [repostedIds, setRepostedIds] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('reposted_ids'); if (s) return new Set<string>(JSON.parse(s)); } catch {}
    return new Set<string>();
  });

  useEffect(() => {
    if (votedUpIds.size > 0 || votedDownIds.size > 0) {
      try {
        localStorage.setItem('news_voted_up', JSON.stringify([...votedUpIds]));
        localStorage.setItem('news_voted_down', JSON.stringify([...votedDownIds]));
      } catch {}
    }
  }, [votedUpIds, votedDownIds]);

  useEffect(() => {
    if (likedIds.size > 0) {
      try { localStorage.setItem('post_liked_ids', JSON.stringify([...likedIds])); } catch {}
    }
  }, [likedIds]);

  useEffect(() => {
    if (repostedIds.size > 0) {
      try { localStorage.setItem('reposted_ids', JSON.stringify([...repostedIds])); } catch {}
    }
  }, [repostedIds]);


  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { viewingUserIdRef.current = viewingUserId; }, [viewingUserId]);
  useEffect(() => { followedUserIdsRef.current = followedUserIds; }, [followedUserIds]);
  useEffect(() => { followerUserIdsRef.current = followerUserIds; }, [followerUserIds]);
  useEffect(() => { matchedUserIdsRef.current = matchedUserIds; }, [matchedUserIds]);







  const resetUserState = React.useCallback(() => {
    setPosts([]);
    setFollowingPosts([]);
    setProfilePosts([]);
    setCurrentUserData(null);
    setChats([]);
    setNotifications([]);
    setFollowedUserIds(new Set());
    setFollowerUserIds(new Set());
    setMatchedUserIds([]);
    setLikedIds(new Set());
    setVotedUpIds(new Set());
    setVotedDownIds(new Set());
    setRepostedIds(new Set());
    setWeeklyTrends(null);
    setHasCheckedProfile(false);
    setFeedFetched(false);
    setNewsFeedFetched(false);
    isFetchingRef.current = false;
    isFetchingNewsRef.current = false;
    tabLastFetchedRef.current = {};
  }, []);

  // System: Auth recovery and session sync
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
        const sessionAlive = sessionStorage.getItem(SESSION_ALIVE_KEY) === 'true';
        if (!rememberMe && !sessionAlive) {
          // Browser was closed and reopened without "Recordar" — sign out
          await supabase.auth.signOut();
          setSession(null);
          setIsLoadingAuth(false);
          return;
        }
        // Keep session alive flag refreshed for the current browser session
        sessionStorage.setItem(SESSION_ALIVE_KEY, 'true');
      }
      setSession(session);
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Reset all user-specific state when the logged-in user changes (account switch)
  const prevUserIdRef = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    const newId = session?.user?.id;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== newId) {
      resetUserState();
    }
    prevUserIdRef.current = newId;
  }, [session?.user?.id]);

  // Check maintenance mode — delayed 3s on mount so critical queries (feed/profile) go first.
  // Checked every 60s and when the tab regains focus.
  useEffect(() => {
    const check = () => supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle()
      .then(({ data }) => {
        if (data !== null && data !== undefined) {
          const newValue = data.value === 'true';
          if (newValue !== maintenanceModeRef.current) {
            maintenanceModeRef.current = newValue;
            setMaintenanceMode(newValue);
          }
        }
      });
    const initialTimer = setTimeout(check, 3000);
    const interval = setInterval(check, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Maintenance notice popup - Global and persistent until seen (maintenance_notice flag in DB)
  const [maintenanceNotice, setMaintenanceNotice] = useState<{ id: string; start: string; end?: string | null; active?: boolean } | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    // 1. First, check if there is an active notice on the platform
    supabase.from('platform_settings').select('value').eq('key', 'maintenance_notice').maybeSingle().then(({ data: settingsData }) => {
      if (!settingsData?.value) return;
      try {
        const notice = JSON.parse(settingsData.value);
        if (!notice.active) return;

        const parseLocalDateToEndOfDay = (dateStr: string) => {
          const parts = dateStr.split('-');
          if (parts.length !== 3) return new Date(dateStr);
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          return new Date(y, m, d, 23, 59, 59, 999);
        };

        const now = new Date();
        const targetDateStr = notice.end || notice.start;
        const expirationDate = parseLocalDateToEndOfDay(targetDateStr);

        if (now > expirationDate) return; // Expired global notice

        // 2. If notice is active, check if THIS user needs to see it
        // If our local state says 'false', we force a DB check to bypass the 60s cache
        if (currentUserData && !currentUserData.maintenanceNotice) {
          supabase.from('profiles').select('maintenance_notice').eq('id', session.user.id).maybeSingle().then(({ data: profileData }) => {
            if (profileData?.maintenance_notice) {
              // Update local state and show notice
              setCurrentUserData(prev => prev ? { ...prev, maintenanceNotice: true } : prev);
              setMaintenanceNotice(notice);
            }
          });
        } else if (currentUserData?.maintenanceNotice) {
          // If we already know it's true, just show it
          setMaintenanceNotice(notice);
        }
      } catch (err) {
        console.error('[MaintenanceNotice] Error:', err);
      }
    });
  }, [session?.user?.id, currentUserData?.id]); // Watch for user ID changes

  const dismissMaintenanceNotice = async () => {
    if (!session?.user?.id) return;
    setMaintenanceNotice(null);
    
    // 1. Mark as false in the database
    const { error } = await supabase.from('profiles').update({ maintenance_notice: false }).eq('id', session.user.id);
    if (error) console.error('[dismissMaintenanceNotice] DB error:', error.message);
    
    // 2. Update local state and CACHE immediately so it doesn't reappear on refresh
    setCurrentUserData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, maintenanceNotice: false };
      safeLocalStorageSet('cached_user_profile', JSON.stringify(updated));
      return updated;
    });
  };

  const DISMISSED_VIRTUAL_KEY = 'dismissed_virtual_notifications';
  const [dismissedVirtualIds, setDismissedVirtualIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_VIRTUAL_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  // Combined notifications including virtual ones for pending users (admin only)
  const allNotifications = useMemo(() => {
    if (!session?.user || !currentUserData?.isAdmin) return notifications;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Map existing notifications: if they are registration-related but the user is 'pending',
    // force them back to 'registration_request' and update timestamp to reflect the latest action.
    const mappedNotifications = notifications.map(n => {
      if (n.type && n.type.startsWith('registration_')) {
        // Prefer status from notification sender object (fresh from DB in fetchNotifications)
        const currentStatus = (n as any).senderStatus || users.find(u => u.id === n.senderId)?.status;
        if (currentStatus === 'pending') {
          return { 
            ...n, 
            type: 'registration_request',
            timestamp: n.updatedAt || n.timestamp
          };
        }
      }
      return n;
    });

    const relevantUsers = users.filter(u => {
      if (u.status === 'pending') return true;
      if (u.updatedAt && new Date(u.updatedAt) > twentyFourHoursAgo) {
        return u.status === 'active' || u.status === 'rejected';
      }
      return false;
    });

    const registrationNotifyUserIds = new Set(
      mappedNotifications
        .filter(n => n.type.startsWith('registration_'))
        .map(n => n.senderId)
    );

    const virtualNotifications: Notification[] = relevantUsers
      .filter(u => {
        // Suprimimos la virtual si ya existe una notificación real de registro para este usuario
        // Esto evita que al aprobar/rechazar aparezcan dos notificaciones idénticas (la real y la virtual "reciente")
        return !registrationNotifyUserIds.has(u.id);
      })
      .filter(u => !dismissedVirtualIds.has(`virtual-${u.id}`))
      .map(u => {
        let content = 'Solicitud de registro';
        if (u.status === 'active') content += ' (aceptado)';
        else if (u.status === 'rejected') content += ' (rechazado)';

        return {
          id: `virtual-${u.id}`,
          type: 'registration_request',
          senderId: u.id,
          senderName: `${u.name} ${u.lastName || ''}`,
          senderAvatar: u.avatar || '',
          content: content,
          timestamp: u.updatedAt || u.joinedDate || now.toISOString(),
          updatedAt: u.updatedAt || u.joinedDate || now.toISOString(),
          isRead: u.status !== 'pending'
        };
      });

    const combined = [...mappedNotifications, ...virtualNotifications];
    
    // Sort by timestamp descending to ensure the most recent (now includes recently updated pending users) appear first.
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, users, currentUserData?.isAdmin, session?.user?.id, dismissedVirtualIds]);

  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' | 'info' } | null>(null);



  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    let timeoutId: any;
    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn(`[Timeout] Promise timed out after ${timeoutMs}ms`);
        resolve(fallback);
      }, timeoutMs);
    });
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  };


  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
  const getSafeNames = (u: any) => {
    const name = u?.name || 'Usuario';
    // Deep search for last name across multiple naming conventions
    const lastName = u?.lastName || u?.last_name || u?.surname || u?.apellidos || '';
    
    // Case-insensitive search to prevent duplicates like "Ruben Ruiz Ruiz"
    const fullName = (lastName.length > 0 && name.toLowerCase().includes(lastName.toLowerCase())) 
      ? name 
      : `${name} ${lastName}`.trim();
      
    const username = u?.username;
    const safeUsername = (username && !isUUID(username)) ? username : (isUUID(fullName) ? '' : (fullName.toLowerCase().replace(/\s/g, '') || ''));
    return { fullName, lastName, username: safeUsername };
  };

  const mapPostsData = useCallback((items: any[], type: 'post' | 'news', commentsMap: Map<string, any[]>, upvotedIds: Set<string>, downvotedIds: Set<string>, repostedIds: Set<string>, votedUpIds?: Set<string>) => {
    // Create a temporary map of known authors from the current users state and existing posts
    const knownAuthors = new Map<string, any>();
    const existingMetadata = new Map<string, any>();
    
    users.forEach(u => knownAuthors.set(u.id, u));
    if (currentUserData) knownAuthors.set(currentUserData.id, currentUserData);
    
    posts.forEach(p => existingMetadata.set(p.id, p));
    followingPosts.forEach(p => existingMetadata.set(p.id, p));
    
    [...posts, ...followingPosts].forEach(p => {
       if (p.authorId && !knownAuthors.has(p.authorId)) {
         if (p.authorName && p.authorName !== 'Usuario') {
            // Seeding from previous posts should be careful not to overwrite fresh data
            knownAuthors.set(p.authorId, { 
              name: p.authorName, // Keep full name as is
              username: p.authorUsername,
              avatar: p.authorAvatar,
              position: p.authorPosition,
              isOrganization: p.authorIsOrganization
            });
         }
       }
    });

    let newsVoteCache: Record<string, { up: number; down: number }> = {};
    if (type === 'news') {
      try { newsVoteCache = JSON.parse(localStorage.getItem('news_vote_counts') || '{}'); } catch {}
    }

    try {
      const manifest = JSON.parse(localStorage.getItem('author_manifest') || '{}');
      Object.entries(manifest).forEach(([id, meta]: [string, any]) => {
         if (!knownAuthors.has(id)) knownAuthors.set(id, meta);
      });
    } catch (e) {}

    const eventManifest = new Map<string, any>();
    try {
      const stored = JSON.parse(localStorage.getItem('event_manifest') || '{}');
      Object.entries(stored).forEach(([id, meta]: [string, any]) => eventManifest.set(id, meta));
    } catch (e) {}
    // Seed from in-memory posts state (survives even when localStorage is cleared)
    posts.forEach((p: any) => { if (p.linkedEventId && p.linkedEvent) eventManifest.set(p.linkedEventId, p.linkedEvent); });
    followingPosts.forEach((p: any) => { if (p.linkedEventId && p.linkedEvent) eventManifest.set(p.linkedEventId, p.linkedEvent); });
    // Seed from globalEvents already in memory (zero I/O) — overrides stale manifest entries
    globalEvents.forEach((e: any) => eventManifest.set(e.id, e));

    return (items || []).map(p => {
      const existing = existingMetadata.get(p.id);
      // Fallback: If p.author is missing (already mapped), try to reconstruct from existing fields
      const authorSource = p.author || knownAuthors.get(p.author_id) || (p.authorName ? {
        name: p.authorName.split(' ')[0],
        last_name: p.authorName.split(' ').slice(1).join(' '),
        username: p.authorUsername,
        avatar: p.authorAvatar,
        position: p.authorPosition
      } : null);
      
      const { fullName, username } = getSafeNames(authorSource);

      const eventId = p.event_id || p.linked_event_id;
      // DEEP PERSISTENCE: Never allow an existing event to be overwritten by 'undefined' if the ID is the same.
      // 1. Priority: Freshly fetched event data
      // 2. Fallback: Data stored in the persistent LocalStorage manifest
      // 3. Last Resort: Keep the event from the previous state of this same post
      let linkedEvent = p.linked_event || eventManifest.get(eventId);
      
      if (eventId && !linkedEvent) {
          linkedEvent = (existing as any)?.linkedEvent;
      }

      // If we found it but it's partial (missing title or image), try to merge with manifest
      if (eventId && linkedEvent) {
        const cached = eventManifest.get(eventId);
        if (cached && (!linkedEvent.title || !linkedEvent.image_url)) {
          linkedEvent = { ...cached, ...linkedEvent };
        }
      }
      
      const isLiked = (type === 'news' ? (votedUpIds?.has(p.id)) : likedIds.has(p.id));
      const isReposted = repostedIds.has(p.id);

      return {
        id: p.id,
        authorId: p.author_id,
        authorName: fullName,
        authorUsername: username,
        authorPosition: authorSource?.position || authorSource?.authorPosition || '',
        authorAvatar: getSafeAvatar(authorSource?.avatar || authorSource?.authorAvatar),
        title: p.titulo || p.title || '',
        content: p.content || '',
        imageUrl: p.image_url || existing?.imageUrl || [],
        docUrl: p.doc_url || existing?.docUrl,
        docName: p.doc_name || existing?.docName,
        timestamp: p.created_at || p.timestamp || existing?.timestamp,
        type: (p.titulo || p.title) ? 'news' : type,
        tags: p.tags || existing?.tags || [],
        // Determine base counts correctly whether p is a raw DB row or an already-mapped Post object
        likes: (() => {
          const baseLikes = p.likes_count ?? p.likes ?? existing?.likes ?? 0;
          return (isLiked && baseLikes === 0) ? 1 : baseLikes;
        })(),
        upvotes: (() => {
          const baseUp = p.up_votes_count ?? p.upvotes ?? newsVoteCache[p.id]?.up ?? existing?.upvotes ?? 0;
          return (isLiked && type === 'news' && baseUp === 0) ? 1 : baseUp;
        })(),
        downvotes: p.down_votes_count ?? p.downvotes ?? newsVoteCache[p.id]?.down ?? existing?.downvotes ?? 0,
        comments: p.comments_count ?? p.comments ?? existing?.comments ?? 0,
        reposts: (() => {
          const baseReposts = p.reposts_count ?? p.reposts ?? existing?.reposts ?? 0;
          return (isReposted && baseReposts === 0) ? 1 : baseReposts;
        })(),
        commentsList: commentsMap.get(p.id) || existing?.commentsList || [],
        userLiked: isLiked,
        userDownvoted: existing?.userDownvoted ?? votedDownIds.has(p.id),
        userReposted: isReposted,
        isPinned: p.is_pinned,
        pinnedAt: p.pinned_at,
        linkedEventId: p.event_id || p.linked_event_id,
        linkedEvent: linkedEvent || existing?.linkedEvent,
        showLinkPreview: p.show_link_preview !== false,
        linkPreviewUrl: p.link_preview_url ?? null,
        authorIsOrganization: !!(authorSource?.is_organization || authorSource?.isOrganization || authorSource?.authorIsOrganization || false),
        // PRESERVE author object for re-mapping
        author: authorSource
      };
    });
  }, [users, currentUserData, posts, followingPosts, globalEvents, likedIds, votedUpIds, votedDownIds, repostedIds]);



  const fetchUserInteractions = useCallback(async (force = false) => {
    if (!session?.user?.id) return;
    const cacheKey = `interactions_${session.user.id}`;
    const INTERACTIONS_STALE_MS = 3 * 60 * 1000; // 3 minutos

    // Return cached data if still fresh and not forced
    if (!force && isMemoryCacheFresh(cacheKey, INTERACTIONS_STALE_MS)) return;

    try {
      const [likes, votes, reposts] = await Promise.all([
        supabase.from('post_likes').select('post_id, vote_type').eq('user_id', session.user.id),
        supabase.from('news_votes').select('news_id, vote_type').eq('user_id', session.user.id),
        supabase.from('reposts').select('post_id, news_id').eq('user_id', session.user.id)
      ]);

      const newLiked = new Set<string>();
      const newVotedUp = new Set<string>();
      const newVotedDown = new Set<string>();
      const newReposted = new Set<string>();

      likes.data?.forEach(l => {
        if (l.vote_type === 'up') newLiked.add(l.post_id);
        else if (l.vote_type === 'down') newVotedDown.add(l.post_id); // Compatibility with some post types
      });

      votes.data?.forEach(v => {
        if (v.vote_type === 'up') newVotedUp.add(v.news_id);
        else if (v.vote_type === 'down') newVotedDown.add(v.news_id);
      });

      reposts.data?.forEach(r => {
        if (r.post_id) newReposted.add(r.post_id);
        if (r.news_id) newReposted.add(r.news_id);
      });

      setLikedIds(newLiked);
      setVotedUpIds(newVotedUp);
      setVotedDownIds(newVotedDown);
      setRepostedIds(newReposted);
      // Mark as cached so repeated calls within TTL are skipped
      setMemoryCache(cacheKey, true);
    } catch (err) {
      console.error("Error fetching global interactions:", err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserInteractions();
    }
  }, [session?.user?.id, fetchUserInteractions]);

  // Reactive UI refresh: Re-map posts when global interactions change
  useEffect(() => {
    if (posts.length > 0) {
      setPosts(prev => mapPostsData(prev, 'post', new Map(), likedIds, votedDownIds, repostedIds, votedUpIds));
    }
    if (followingPosts.length > 0) {
      setFollowingPosts(prev => mapPostsData(prev, 'post', new Map(), likedIds, votedDownIds, repostedIds, votedUpIds));
    }
    if (profilePosts.length > 0) {
      setProfilePosts(prev => mapPostsData(prev, 'post', new Map(), likedIds, votedDownIds, repostedIds, votedUpIds));
    }
  }, [likedIds, votedUpIds, votedDownIds, repostedIds]);

  const fetchFeed = useCallback(async (customOffset?: number, customType?: 'post' | 'news', authorId?: string, followedOnlyArg?: boolean, forcedFollowedIds?: Set<string>, isLoadMoreArg?: boolean, explicitlyReplaceFeed?: boolean, intendedTabArg?: string, _retryCount?: number) => {
    // RACE CONDITION PROTECTION: If this is a profile fetch, ensure it's for the current profile
    if (authorId && currentProfileIdRef.current !== authorId) {
       console.warn("[fetchFeed] Stale profile fetch discarded:", authorId);
       setIsLoadingProfileFeed(false);
       return;
    }
    
    // News is public (no RLS auth required) — allow fetching without session
    const isPublicNewsOnly = customType === 'news' && !authorId && !followedOnlyArg;
    if (!session?.user && !isPublicNewsOnly) return;

    // CONCURRENCY LOCK: news uses its own lock so it never blocks behind a posts fetch
    const newsOnlyFetch = customType === 'news' && !authorId && !isLoadMoreArg;
    if (newsOnlyFetch) {
      if (isFetchingNewsRef.current) return;
      isFetchingNewsRef.current = true;
    } else {
      if (isFetchingRef.current && !isLoadMoreArg) return;
      isFetchingRef.current = true;
    }

    try {
      const fetchId = authorId ? ++lastProfileFetchIdRef.current : ++lastFetchIdRef.current;
    const currentTab = intendedTabArg || activeTabRef.current;
    const isSocialTab = !authorId && (currentTab === 'following' || currentTab === 'for-you');

    // AUTO-RESOLVE TYPE: If no customType is provided, we derive it from the context.
    // In a profile (authorId present), we fetch both by default (undefined).
    // In main views, we fetch only what's relevant.
    const resolvedType = customType || (authorId ? undefined : (currentView === 'news' ? 'news' : 'post'));


    
    const followedOnly = followedOnlyArg !== undefined ? followedOnlyArg : (currentTab === 'following');
    const pOffset = customOffset || 0;
    const isLoadMore = isLoadMoreArg !== undefined ? isLoadMoreArg : (pOffset > 0);
    const pLimit = 10;

    const setTargetPosts = authorId 
      ? setProfilePosts 
      : ((isSocialTab && followedOnly) ? setFollowingPosts : setPosts);
    const setTargetHasMorePosts = authorId 
      ? (resolvedType === 'news' ? setHasMoreNews : setHasMorePosts) // Simplified for profile
      : ((isSocialTab && followedOnly) ? setHasMoreFollowing : setHasMorePosts);

    if (!isLoadMore || explicitlyReplaceFeed) {
      // Only show the loading spinner when there are no posts currently visible.
      // If cached posts are already on screen, keep them visible during the refresh.
      const currentVisible = authorId ? profilePosts : (followedOnly ? followingPosts : posts);
      if (currentVisible.filter(p => p.type === 'post').length === 0) {
        setIsLoadingFeed(true);
        setIsLoadingProfileFeed(true);
      }
    }



      const authorSelect = 'author:profiles!author_id(id, name, last_name, avatar, username, position, is_organization)';
      // linkedEvent is resolved client-side from eventManifest/globalEvents — no JOIN needed
      let postsQuery = supabase.from('posts').select(`id, created_at, content, author_id, event_id, linked_event_id, image_url, doc_url, doc_name, tags, is_pinned, pinned_at, show_link_preview, link_preview_url, likes_count, comments_count, reposts_count, ${authorSelect}`).order('created_at', { ascending: false });
      let newsQuery = supabase.from('news').select(`id, created_at, content, author_id, image_url, tags, title:titulo, is_pinned, pinned_at, show_link_preview, link_preview_url, likes_count, comments_count, up_votes_count, down_votes_count, reposts_count, ${authorSelect}`).order('created_at', { ascending: false });

      // Si el usuario tiene intereses, guardamos los author_id permitidos para
      // filtrar también los datos del prefetch que no pasan por la query.
      let interestAuthorIdSet: Set<string> | null = null;

      if (followedOnly && !authorId) {
        const targetFollowed = forcedFollowedIds || followedUserIdsRef.current;
        const matchIds = Array.from(targetFollowed);
        
        if (matchIds.length === 0) {
          // If following no one, force empty results immediately to avoid heavy queries
          postsQuery = postsQuery.eq('author_id', '00000000-0000-0000-0000-000000000000');
          newsQuery = newsQuery.eq('author_id', '00000000-0000-0000-0000-000000000000');
        } else if (matchIds.length === 1) {
          postsQuery = postsQuery.eq('author_id', matchIds[0]);
          newsQuery = newsQuery.eq('author_id', matchIds[0]);
        } else {
          postsQuery = postsQuery.in('author_id', matchIds);
          newsQuery = newsQuery.in('author_id', matchIds);
        }
      } else if (!authorId) {

        const myInterests = currentUserData?.interests || [];
        const myId = session?.user?.id;

        if (myInterests.length > 0 && myId) {
          // Fetch IDs of users who share at least one interest
          const { data: matchingProfiles } = await supabase
            .from('profiles')
            .select('id')
            .overlaps('interests', myInterests)
            .neq('id', myId);

          // Filtro de intereses: SÓLO se aplica a posts (pestaña "Para ti" de /inicio).
          // Las noticias (/noticias) no se filtran por intereses — se muestran todas.
          // Se incluye myId para que el usuario siga viendo sus propios posts.
          const matchIds = [myId, ...(matchingProfiles || []).map((p: any) => p.id)];
          postsQuery = postsQuery.in('author_id', matchIds);
          // Guardamos el set para poder filtrar también los datos del prefetch en cliente.
          interestAuthorIdSet = new Set(matchIds);
        }
        // Sin intereses seleccionados: feed global (sin filtro).
      } else {


        postsQuery = postsQuery.eq('author_id', authorId);
        newsQuery = newsQuery.eq('author_id', authorId);
      }



      let postsRes, newsRes;
      let initialLikes: any = { data: [] };
      let initialVotes: any = { data: [] };
      let initialReposts: any = { data: [] };

      // PHASE 1: Fetch posts and news — consume prefetch if available (started before React mounted)
      const prefetchPromise = (window as any).__prefetchPostsPromise as Promise<any[] | null> | undefined;
      const newsPrefetchPromise = (window as any).__prefetchNewsPromise as Promise<any[] | null> | undefined;
      
      // Clear prefetch immediately once we read it, so it can never be used twice or stale
      if (pOffset === 0) {
        if (prefetchPromise) (window as any).__prefetchPostsPromise = null;
        if (newsPrefetchPromise) (window as any).__prefetchNewsPromise = null;
      }

      // Do not use the prefetch promise if the user has interests, because the prefetch
      // is a global query and doesn't filter by user interests, which would cause older
      // interest-matching posts (like those with images) to be missing from the feed.
      const canUsePrefetch = prefetchPromise && customType !== 'news' && pOffset === 0 && !followedOnly && !authorId && !interestAuthorIdSet;
      const canUseNewsPrefetch = newsPrefetchPromise && customType !== 'post' && pOffset === 0 && !followedOnly && !authorId;

      try {
        const contentResults = await withTimeout(
          Promise.all([
            resolvedType === 'news'
              ? Promise.resolve({ data: [] })
              : canUsePrefetch
                ? prefetchPromise!.then(data => {
                    const arr = data || [];
                    if (interestAuthorIdSet) {
                      return { data: arr.filter((p: any) => interestAuthorIdSet!.has(p.author_id)) };
                    }
                    return { data: arr };
                  })
                : postsQuery.range(pOffset, pOffset + pLimit - 1),
            resolvedType === 'post'
              ? Promise.resolve({ data: [] })
              : canUseNewsPrefetch
                ? newsPrefetchPromise!.then(data => data && data.length > 0 ? { data } : newsQuery.range(pOffset, pOffset + pLimit - 1))
                : newsQuery.range(pOffset, pOffset + pLimit - 1),
          ]),
          15000,
          null
        );

        const retryCount = _retryCount || 0;
        if (contentResults === null) {
          if (retryCount < 2) {
            console.warn(`[fetchFeed] Content timeout — retry ${retryCount + 1}/2 in 3s...`);
            isFetchingRef.current = false;
            isFetchingNewsRef.current = false;
            setTimeout(() => fetchFeed(customOffset, customType, authorId, followedOnlyArg, forcedFollowedIds, isLoadMoreArg, explicitlyReplaceFeed, intendedTabArg, retryCount + 1), 3000);
          } else {
            console.warn("[fetchFeed] Content timeout — max retries reached, keeping current state.");
            setIsLoadingFeed(false);
            setIsLoadingMorePosts(false);
            setIsLoadingMoreNews(false);
            setIsLoadingProfileFeed(false);
          }
          return;
        }

        postsRes = contentResults[0];
        newsRes = contentResults[1];

        // CHECK IF THIS FETCH IS STILL RELEVANT (Prevents race conditions on navigation)
        const currentTargetId = authorId ? lastProfileFetchIdRef.current : lastFetchIdRef.current;
        if (fetchId !== currentTargetId) {
          console.log("[fetchFeed] Stale fetch ignored.");
          setIsLoadingProfileFeed(false);
          return;
        }


        if (postsRes?.error || newsRes?.error) {
          if (postsRes?.error) console.error("[fetchFeed] Posts Query Error:", postsRes.error);
          if (newsRes?.error) console.error("[fetchFeed] News Query Error:", newsRes.error);
          const isTimeout = postsRes?.error?.code === '57014' || newsRes?.error?.code === '57014';
          if (isTimeout && retryCount < 2) {
            console.warn(`[fetchFeed] Statement timeout — retry ${retryCount + 1}/2 in 3s...`);
            isFetchingRef.current = false;
            isFetchingNewsRef.current = false;
            setTimeout(() => fetchFeed(customOffset, customType, authorId, followedOnlyArg, forcedFollowedIds, isLoadMoreArg, explicitlyReplaceFeed, intendedTabArg, retryCount + 1), 3000);
            return;
          }
          setIsLoadingFeed(false);
          setIsLoadingMorePosts(false);
          setIsLoadingMoreNews(false);
          setIsLoadingProfileFeed(false);
          return;
        }
      } catch (qErr) {
        console.error("[fetchFeed] Query thrown error:", qErr);
        setIsLoadingFeed(false);
        setIsLoadingProfileFeed(false);
        return;
      }

      // PHASE 2: Fetch interaction metadata (NOW HANDLED GLOBALLY)
      // We skip the redundant background fetch here because fetchUserInteractions
      // already populated our sets which we use during mapping below.




      const freshPostsData = (postsRes.data || []) as any[];
      const freshNewsData = (newsRes.data || []) as any[];

      const allNewIds = [...freshPostsData, ...freshNewsData].map(p => p.id);

      // Kick off vote counts + user vote state in one background query — don't await so posts render immediately
      const voteCountsPromise = freshNewsData.length > 0
        ? supabase
            .from('news_votes')
            .select('news_id, vote_type, user_id')
            .in('news_id', freshNewsData.map((n: any) => n.id))
        : Promise.resolve({ data: [] as any[] });

      const rawBatchAll = [
        ...mapPostsData(freshPostsData, 'post', new Map(), likedIds, votedDownIds, repostedIds),
        ...mapPostsData(freshNewsData, 'news', new Map(), likedIds, votedDownIds, repostedIds, votedUpIds)
      ];
      
      // ENSURE NO DUPLICATES: Only include items of the requested type if resolvedType is set.
      // This prevents re-adding posts when only news were requested (and vice versa).
      const rawBatch = resolvedType 
        ? rawBatchAll.filter(p => p.type === resolvedType)
        : rawBatchAll;

      rawBatch.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // FAST UPDATE: Show fresh posts immediately after DB query — don't wait for event fetch.
      // rawBatch already has author data (JOIN) and events from cache (eventManifest).
      if (rawBatch.length > 0 && !isLoadMore) {
        // RACE CONDITION PROTECTION:
        // Use window.location.pathname directly for an immediate, non-delayed check.
        const path = window.location.pathname;
        const isProfilePath = !path.startsWith('/inicio') && !path.startsWith('/noticias') && path !== '/';
        
        // 1. If we are fetching for a social tab (Home Feed), but the user is currently on a profile page,
        //    DISCARD this update to prevent the Home Feed from overwriting the profile posts.
        if (!authorId && isProfilePath && !followedOnly) {
          console.warn("[fetchFeed] Discarding Home Feed update because user is on a profile.");
          return;
        }

        // 2. Tab mismatch check for Home Feed (only for posts, news are global)
        if (activeTabRef.current !== currentTab && !authorId && resolvedType !== 'news') return;
        if (!explicitlyReplaceFeed) {
          if (resolvedType) {
            // Preserva items de otros tipos (p.ej. news cuando se refrescan posts).
            setTargetPosts(prev => {
              const preserved = prev.filter(p => p.type !== resolvedType);
              const rawIds = new Set(rawBatch.map(p => p.id));
              
              const dedupedPreserved = preserved.filter(p => !rawIds.has(p.id)).map(p => ({
                ...p,
                type: p.type || (resolvedType === 'news' ? 'post' : 'news')
              }));
              
              const combined = [...rawBatch, ...dedupedPreserved];
              // FINAL SAFETY: Deduplicate by ID across ALL items
              const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
              return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            });
          } else {
            // Deduplicate even when replacing (just in case rawBatch has internal duplicates)
            const unique = Array.from(new Map(rawBatch.map(p => [p.id, p])).values());
            setTargetPosts(unique);
          }
        }
        setIsLoadingFeed(false);
        setIsLoadingProfileFeed(false);
        setFeedFetched(true);
        if (!customType || customType === 'news') setNewsFeedFetched(true);
      }

      if (allNewIds.length === 0) {
        const path = window.location.pathname;
        const isProfilePath = !path.startsWith('/inicio') && !path.startsWith('/noticias') && path !== '/';
        if (!authorId && isProfilePath && !followedOnly) return;
        if (activeTabRef.current !== currentTab && !authorId && resolvedType !== 'news') return;
        
        // PROTECTION: Only wipe the feed if it's currently empty, or if we have a successful
        // and explicit intention to replace it with a blank state (e.g. valid empty tab).
        if (!isLoadMore) {
          const currentPosts = authorId ? profilePosts : ((activeTabRef.current === 'following') ? followingPosts : posts);

          // PERSISTENCE GUARD: If we are on a profile and we already have posts for THIS user, 
          // DO NOT clear them if we get an empty result from a background update.
          if (authorId && currentPosts.length > 0 && allNewIds.length === 0) {
            const isSameUser = currentPosts.every(p => p.authorId === authorId || p.authorUsername === authorId);
            if (isSameUser) {
              console.warn("[fetchFeed] Persistence guard: Keeping current profile posts (empty result ignored).");
              setIsLoadingFeed(false);
              setIsLoadingProfileFeed(false);
              return;
            }
          }

          if (currentPosts.length > 0 && !explicitlyReplaceFeed) {
          } else if (resolvedType) {
             // Si fetchamos sólo un tipo y no hubo resultados, borramos únicamente
             // los items de ese tipo para no aniquilar los de otro tipo (p.ej. news).
             setTargetPosts(prev => prev.filter(p => p.type !== resolvedType));
             if (resolvedType === 'post') setTargetHasMorePosts(false);
             if (resolvedType === 'news') setHasMoreNews(false);
          } else {
             setTargetPosts([]);
             setTargetHasMorePosts(false);
             setHasMoreNews(false);
          }
        } else {
          if (resolvedType === 'post') setTargetHasMorePosts(false); 
          if (resolvedType === 'news') setHasMoreNews(false); 
        }
        
        setIsLoadingFeed(false); 
        setIsLoadingProfileFeed(false);
        return;
      }

      // METADATA ASSEMBLER
      // We already have joined author and event data from the main query!
      const authorMap = new Map<string, any>();
      const eventMap = new Map<string, any>();

      // Populate maps for secondary lookup
      [...freshPostsData, ...freshNewsData].forEach(p => {
         if (p.author) authorMap.set(p.author.id, { ...p.author, lastName: p.author.last_name });
         if (p.linked_event) eventMap.set(p.linked_event.id, p.linked_event);
      });

      const newBatch = [
        ...mapPostsData(freshPostsData, 'post', new Map(), likedIds, votedDownIds, repostedIds),
        ...mapPostsData(freshNewsData, 'news', new Map(), likedIds, votedDownIds, repostedIds, votedUpIds)
      ];

      let sortedBatch = newBatch.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Collect missing event IDs — will be fetched in background AFTER posts render
      const missingEventIds = [...new Set(
        sortedBatch
          .filter(p => p.linkedEventId && !p.linkedEvent)
          .map(p => p.linkedEventId as string)
      )];

      if (isLoadMore && !explicitlyReplaceFeed) {
        const path = window.location.pathname;
        const isProfilePath = !path.startsWith('/inicio') && !path.startsWith('/noticias') && path !== '/';
        if (!authorId && isProfilePath && !followedOnly) return;

        setTargetPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...sortedBatch.filter(p => !existingIds.has(p.id))].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
      } else {
        const path = window.location.pathname;
        const isProfilePath = !path.startsWith('/inicio') && !path.startsWith('/noticias') && path !== '/';
        if (!authorId && isProfilePath && !followedOnly) return;

        setTargetPosts(prev => {
          // GLOBAL UPDATE: Even if we are not replacing the feed, we update the metadata (names/avatars)
          // of EVERYTHING currently in the state using the fresh author data we just fetched.
          const newMap = new Map(sortedBatch.map(p => [p.id, p]));
          
          if (!explicitlyReplaceFeed && prev.length > 0) {
            const updatedPrev = prev.map(p => {
              const newData = newMap.get(p.id);
              // If we have fresh joined author data for this post's author, use it even if it's the same post ID
              const authorProfile = authorMap.get(p.authorId);
              const mergedLinkedEvent = (newData as any)?.linkedEvent || p.linkedEvent;
              if (authorProfile) {
                const { fullName } = getSafeNames(authorProfile);
                return { ...p, ...(newData as any), authorName: fullName, linkedEvent: mergedLinkedEvent };
              }
              return newData ? { ...p, ...(newData as any), linkedEvent: mergedLinkedEvent } : p;
            });
            const existingIds = new Set(prev.map(p => p.id));
            const specificallyNewItems = sortedBatch.filter(p => !existingIds.has(p.id));
            return [...specificallyNewItems, ...updatedPrev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          }
          // When replacing the feed for a specific type (e.g. only posts), preserve items of the
          // other type so news are not wiped when the home feed refreshes, and vice-versa.
          if (customType && sortedBatch.length > 0 && prev.length > 0) {
            const preserved = prev.filter(p => p.type !== customType);
            if (preserved.length > 0) {
              const newIds = new Set(sortedBatch.map(p => p.id));
              const deduped = preserved.filter(p => !newIds.has(p.id));
              return [...sortedBatch, ...deduped].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            }
          }
          return sortedBatch;
        });

        if (!authorId) {
          try {
            const storageKey = followedOnly ? 'last_known_following_feed' : 'last_known_feed';
            const toLight = (p: any) => ({
              id: p.id, authorId: p.authorId, authorName: p.authorName,
              authorUsername: p.authorUsername, authorPosition: p.authorPosition,
              authorAvatar: p.authorAvatar, title: p.title, content: p.content,
              timestamp: p.timestamp, type: p.type, tags: p.tags,
              likes: p.likes, upvotes: p.upvotes, downvotes: p.downvotes,
              comments: p.comments, reposts: p.reposts,
              isPinned: p.isPinned, linkedEventId: p.linkedEventId,
              authorIsOrganization: p.authorIsOrganization,
              imageUrl: p.imageUrl || [],
              docUrl: p.docUrl || null,
              docName: p.docName || null,
              showLinkPreview: p.showLinkPreview,
              linkPreviewUrl: p.linkPreviewUrl || null,
              linkedEvent: p.linkedEvent ? {
                id: p.linkedEvent.id, title: p.linkedEvent.title,
                event_date: p.linkedEvent.event_date, event_time: p.linkedEvent.event_time,
                type: p.linkedEvent.type, location: p.linkedEvent.location,
                image_url: p.linkedEvent.image_url || null, creator_id: p.linkedEvent.creator_id || null
              } : undefined
            });
            safeLocalStorageSet(storageKey, JSON.stringify(sortedBatch.slice(0, 10).map(toLight)));
            // Save news separately so /noticias shows instantly on next visit
            if (!followedOnly) {
              const newsOnly = sortedBatch.filter((p: any) => p.type === 'news');
              if (newsOnly.length > 0) safeLocalStorageSet('last_known_news', JSON.stringify(newsOnly.slice(0, 10).map(toLight)));
            }
          } catch { /* quota exceeded — skip cache, not critical */ }
        }
      }

      if (!customType || customType === 'post') setTargetHasMorePosts(freshPostsData.length === pLimit);
      if (!customType || customType === 'news') setHasMoreNews(freshNewsData.length === pLimit);

      // Show posts immediately — don't wait for manifest persistence below
      setIsLoadingFeed(false);
      setIsLoadingProfileFeed(false);
      setFeedFetched(true);
      if (!customType || customType === 'news') setNewsFeedFetched(true);

      // Background: fetch missing linked events and patch posts after they already appear
      if (missingEventIds.length > 0) {
        supabase
          .from('user_events')
          .select('id, title, event_date, event_time, type, location, description, image_url, creator_id')
          .in('id', missingEventIds)
          .then(({ data: eventsData }) => {
            if (!eventsData || eventsData.length === 0) return;
            const fetchedMap = new Map(eventsData.map((e: any) => [e.id, e]));
            try {
              const stored = JSON.parse(localStorage.getItem('event_manifest') || '{}');
              eventsData.forEach((e: any) => {
                stored[e.id] = { id: e.id, title: e.title, event_date: e.event_date, event_time: e.event_time, type: e.type, location: e.location, image_url: e.image_url || null, creator_id: e.creator_id || null };
              });
              safeLocalStorageSet('event_manifest', JSON.stringify(stored));
            } catch {}
            const missingSet = new Set(missingEventIds);
            updateAllFeeds(prev => prev.map(p =>
              p.linkedEventId && missingSet.has(p.linkedEventId) && !p.linkedEvent && fetchedMap.has(p.linkedEventId)
                ? { ...p, linkedEvent: fetchedMap.get(p.linkedEventId) }
                : p
            ) as typeof prev);
          })
          .catch(() => {});
      }

      // Apply correct vote counts + user vote state in background — single query for both
      if (freshNewsData.length > 0) {
        voteCountsPromise.then(({ data: voteCounts }) => {
          if (!voteCounts) return;
          const upMap = new Map<string, number>();
          const downMap = new Map<string, number>();
          const userUpVoted = new Set<string>();
          const userDownVoted = new Set<string>();
          const currentUserId = session?.user?.id;
          voteCounts.forEach((v: any) => {
            if (v.vote_type === 'up') upMap.set(v.news_id, (upMap.get(v.news_id) || 0) + 1);
            else if (v.vote_type === 'down') downMap.set(v.news_id, (downMap.get(v.news_id) || 0) + 1);
            if (v.user_id === currentUserId) {
              if (v.vote_type === 'up') userUpVoted.add(v.news_id);
              else if (v.vote_type === 'down') userDownVoted.add(v.news_id);
            }
          });
          const newsIdSet = new Set<string>(freshNewsData.map((n: any) => n.id));
          const patcher = (prev: Post[]) => prev.map(p => {
            if (!newsIdSet.has(p.id)) return p;
            const up = upMap.get(p.id) ?? 0;
            const down = downMap.get(p.id) ?? 0;
            const userLiked = userUpVoted.has(p.id);
            const userDownvoted = userDownVoted.has(p.id);
            if (p.upvotes === up && p.downvotes === down && p.userLiked === userLiked && p.userDownvoted === userDownvoted) return p;
            return { ...p, upvotes: up, downvotes: down, userLiked, userDownvoted };
          });
          updateAllFeeds(patcher);
          // Persist vote counts so next page load shows them instantly
          try {
            const existing_vc: Record<string, { up: number; down: number }> = JSON.parse(localStorage.getItem('news_vote_counts') || '{}');
            freshNewsData.forEach((n: any) => {
              existing_vc[n.id] = { up: upMap.get(n.id) ?? 0, down: downMap.get(n.id) ?? 0 };
            });
            localStorage.setItem('news_vote_counts', JSON.stringify(existing_vc));
          } catch {}
          // Update global voted sets so NewsCard arrow highlights reflect the correct state
          if (userUpVoted.size > 0 || userDownVoted.size > 0) {
            setVotedUpIds(prev => {
              const next = new Set(prev);
              userUpVoted.forEach(id => next.add(id));
              userDownVoted.forEach(id => next.delete(id));
              return next;
            });
            setVotedDownIds(prev => {
              const next = new Set(prev);
              userDownVoted.forEach(id => next.add(id));
              userUpVoted.forEach(id => next.delete(id));
              return next;
            });
          }
        }).catch(() => { /* non-critical */ });
      }

      // 4. Persistence & Metadata (Author/Event manifestos)
      try {
        const manifest = JSON.parse(localStorage.getItem('author_manifest') || '{}');
        const cleanBatch = sortedBatch.filter(p => p.authorName && p.authorName !== 'Usuario');
        cleanBatch.forEach(p => {
          manifest[p.authorId] = {
            name: p.authorName,
            username: p.authorUsername,
            avatar: p.authorAvatar,
            position: p.authorPosition,
            isOrganization: p.authorIsOrganization
          };
        });
        // Limit manifest to 100 most recent entries to prevent localStorage quota exceeded
        const manifestEntries = Object.entries(manifest);
        const trimmedManifest = manifestEntries.length > 100
          ? Object.fromEntries(manifestEntries.slice(-100))
          : manifest;
        safeLocalStorageSet('author_manifest', JSON.stringify(trimmedManifest));

        if (eventMap.size > 0) {
          const eventManifestStored = JSON.parse(localStorage.getItem('event_manifest') || '{}');
          eventMap.forEach((e: any, id) => {
            // Strip heavy fields to keep manifest small (image_url and creator_id needed for EventPreview)
            eventManifestStored[id] = {
              id: e.id, title: e.title, event_date: e.event_date,
              event_time: e.event_time, type: e.type, location: e.location,
              image_url: e.image_url || null, creator_id: e.creator_id || null
            };
          });
          // Limit to 30 entries
          const eventEntries = Object.entries(eventManifestStored);
          const trimmedEvents = eventEntries.length > 30
            ? Object.fromEntries(eventEntries.slice(-30))
            : eventManifestStored;
          safeLocalStorageSet('event_manifest', JSON.stringify(trimmedEvents));
        }
      } catch (cacheErr) {
        console.warn("Manifest update failed:", cacheErr);
      }

      setHasCheckedProfile(true);
      // Mark this tab as freshly fetched so tab-switches don't re-fetch immediately
      if (!authorId && !isLoadMore) {
        const tabKey = followedOnly ? 'following' : 'for-you';
        tabLastFetchedRef.current[tabKey] = Date.now();
      }
    } catch (err) {
      console.error("Critical error in fetchFeed:", err);
      const hasContent = posts.length > 0 || followingPosts.length > 0;
      if (!hasContent) {
        showToast("Error al cargar el feed.", "error");
      }
    } finally {
      setIsLoadingFeed(false);   
      setIsLoadingProfileFeed(false); 
      setFeedFetched(true);      
      if (!customType || customType === 'news') setNewsFeedFetched(true);
      setIsLoadingMorePosts(false);
      setIsLoadingMoreFollowing(false);
      setIsLoadingMoreNews(false);
      isFetchingRef.current = false;
      isFetchingNewsRef.current = false;
    }



  }, [session?.user?.id, showToast, posts, followingPosts, profilePosts, updateAllFeeds]); 





  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeLocalStorageSet('theme', theme);
  }, [theme]);

  // IMAGE PRELOADER REMOVED: downloading all images eagerly causes massive egress.
  // Images now load on demand with loading="lazy" in each component.


  const fetchUserProfile = useCallback(async (uid: string, force = false) => {
    if (!force) {
      try {
        const ts = Number(localStorage.getItem('cached_user_profile_ts') || 0);
        if (ts && Date.now() - ts < 60_000 && localStorage.getItem('cached_user_profile')) {
          setHasCheckedProfile(true);
          return;
        }
      } catch {}
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data) {
      const isExpelled = data.status === 'expelled' || (data.status === 'rejected' && (data.username || '').startsWith('userdeleted'));
      const isBannedInDB = data.is_banned === true;
      const banExpired = data.banned_until && new Date(data.banned_until) <= new Date();
      const isBanned = isBannedInDB && !banExpired;

      // Auto-cleanup expired ban in DB
      if (isBannedInDB && banExpired) {
        supabase.from('profiles').update({ is_banned: false }).eq('id', uid).then(({ error }) => {
          if (error) console.error('[fetchUserProfile] Error cleaning expired ban:', error);
        });
      }

      if (isExpelled || isBanned) {
        // Persistent Block: Clear local cache to ensure the user cannot bypass the block with stale data
        localStorage.removeItem('cached_user_profile');
        localStorage.removeItem('cached_user_profile_ts');
        
        // Force state updates to show the block screens
        const mappedUser = {
          id: data.id,
          name: data.name,
          lastName: data.last_name,
          username: data.username,
          status: isExpelled ? 'expelled' : data.status,
          isBanned: !!isBanned,
          bannedUntil: data.banned_until,
          isAdmin: false 
        };
        setCurrentUserData(mappedUser as User);
        setHasCheckedProfile(true);
        return;
      }

      const mappedUser = {
        id: data.id,
        name: data.name,
        lastName: data.last_name,
        username: data.username,
        email: data.email,
        birthDate: data.birth_date,
        position: data.position || 'Personal Público',
        institution: data.institution || 'Administración',
        jobCategory: data.job_category,
        avatar: getSafeAvatar(data.avatar),
        bio: data.bio || '',
        interests: data.interests || [],
        followers: data.followers_count || 0,
        following: data.following_count || 0,
        country: data.country,
        region: data.region,
        joinedDate: data.joined_date || data.created_at,
        updatedAt: data.updated_at || data.created_at,
        firstTime: data.first_time,
        novas: data.novas || 0,
        isAdmin: data.is_admin || false,
        isOrganization: data.is_organization || false,
        organizationName: data.name,
        organizationObjective: data.bio || '',
        roleDescription: data.role_description,
        administrationType: data.administration_type,
        status: data.status,
        chatSettings: data.chat_settings,
        notificationSettings: normalizeNotificationSettings(data.notification_settings),
        linkedOrganizationId: data.linked_organization_id || data.linkedOrganizationId || null,
        isBanned: data.is_banned || false,
        bannedUntil: data.banned_until || null,
        maintenanceNotice: data.maintenance_notice ?? false,
      };
      setCurrentUserData(mappedUser);
      safeLocalStorageSet('cached_user_profile', JSON.stringify(mappedUser));
      try { localStorage.setItem('cached_user_profile_ts', String(Date.now())); } catch {}
    }
    setHasCheckedProfile(true);
  }, []);

  const processMentions = useCallback(async (text: string, postId: string | null, newsId: string | null, type: 'post' | 'noticia' | 'comentario') => {
    if (!session?.user) return;
    const usernames = getMentionedUsernames(text);
    if (usernames.length === 0) return;

    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', usernames);

    if (mentionedUsers) {
      for (const u of mentionedUsers) {
        if (u.id !== session.user.id) {
          let content = '';
          if (type === 'comentario') {
            content = 'te ha mencionado en un comentario';
          } else if (type === 'post') {
            content = 'te ha mencionado en un post';
          } else if (type === 'noticia') {
            content = 'te ha mencionado en una noticia';
          } else {
            content = `te ha mencionado en un ${type}`;
          }

          // Comprobar si ya existe una notificación de mención para este contenido/usuario
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', u.id)
            .eq('sender_id', session.user.id)
            .eq('type', 'mention')
            .eq(postId ? 'post_id' : 'news_id', postId || newsId)
            .maybeSingle();

          if (existingNotif) {
            // Actualizar si ya existe para que aparezca como nueva
            await supabase
              .from('notifications')
              .update({ is_read: false, created_at: new Date().toISOString() })
              .eq('id', existingNotif.id);
          } else {
            await supabase.from('notifications').insert({
              user_id: u.id,
              sender_id: session.user.id,
              type: 'mention',
              content,
              post_id: postId || null,
              news_id: newsId || null,
            });
          }
        }
      }
    }
  }, [session?.user?.id]);

  const fetchUsers = useCallback(async (force = false) => {
    const USERS_STALE_MS = 10 * 60 * 1000; // 10 minutos
    if (!force && isMemoryCacheFresh('users_list', USERS_STALE_MS)) return;

    // Only fetch 50 most recent users for better performance.
    const { data, error } = await supabase.from('profiles').select('*').limit(50).order('updated_at', { ascending: false });
    if (error) { console.warn("[fetchUsers] Error:", error.message); return; }
    if (data) {
      const mappedUsers = data.map((u: any) => ({
        id: u.id,
        name: u.name,
        lastName: u.last_name,
        username: u.username,
        email: u.email,
        birthDate: u.birth_date,
        position: u.position || 'Personal Público',
        institution: u.institution || 'Administración',
        jobCategory: u.job_category,
        avatar: getSafeAvatar(u.avatar),
        bio: u.bio || '',
        interests: u.interests || [],
        followers: u.followers_count || 0,
        following: u.following_count || 0,
        country: u.country,
        region: u.region,
        joinedDate: u.joined_date || u.created_at,
        updatedAt: u.updated_at || u.created_at,
        firstTime: u.first_time,
        novas: u.novas || 0,
        isAdmin: u.is_admin || false,
        isOrganization: u.is_organization || false,
        organizationName: u.name,
        organizationObjective: u.bio || '',
        roleDescription: u.role_description,
        administrationType: u.administration_type,
        status: u.status,
        isBanned: u.is_banned || false,
        bannedUntil: u.banned_until || null,
        chatSettings: u.chat_settings,
        notificationSettings: u.notification_settings,
        linkedOrganizationId: u.linked_organization_id || u.linkedOrganizationId || null
      }));
      setUsers(mappedUsers);
      setMemoryCache('users_list', true);
      try { safeLocalStorageSet('last_known_users', JSON.stringify(mappedUsers)); } catch {};
    }
  }, []);

  const fetchFollows = useCallback(async (force = false) => {
    if (!session?.user) return { followed: new Set<string>(), followers: new Set<string>() };
    const FOLLOWS_STALE_MS = 5 * 60 * 1000; // 5 minutos
    const cacheKey = `follows_${session.user.id}`;
    if (!force && isMemoryCacheFresh(cacheKey, FOLLOWS_STALE_MS)) {
      return { followed: followedUserIdsRef.current, followers: followerUserIdsRef.current };
    }
    try {
      let cancelled = false;
      const result = await withTimeout((async () => {
        const [{ data: following }, { data: followers }] = await Promise.all([
          supabase.from('follows').select('followed_id').eq('follower_id', session.user.id),
          supabase.from('follows').select('follower_id').eq('followed_id', session.user.id)
        ]);
        if (cancelled) return { followed: followedUserIdsRef.current, followers: followerUserIdsRef.current };
        const followedSet = new Set(following?.map(f => f.followed_id) || []);
        const followerSet = new Set(followers?.map(f => f.follower_id) || []);

        safeLocalStorageSet('followed_user_ids', JSON.stringify(Array.from(followedSet)));

        setFollowedUserIds(followedSet);
        setFollowerUserIds(followerSet);
        setMemoryCache(cacheKey, true);
        return { followed: followedSet, followers: followerSet };
      })(), 8000, null);

      if (result === null) {
        cancelled = true;
        console.warn("[fetchFollows] Timeout — keeping current state.");
        return { followed: followedUserIdsRef.current, followers: followerUserIdsRef.current };
      }
      return result;
    } catch (e) {
      console.error("Error fetching follows:", e);
      return { followed: followedUserIdsRef.current, followers: followerUserIdsRef.current };
    }
  }, [session?.user?.id]);



  const handleToggleFollow = useCallback(async (userId: string) => {
    if (!session?.user || userId === session.user.id) return;
    const isCurrentlyFollowing = followedUserIds.has(userId);
    const drift = isCurrentlyFollowing ? -1 : 1;

    const previousFollowedSet = followedUserIds;
    const newFollowedSet = new Set(followedUserIds);
    if (isCurrentlyFollowing) newFollowedSet.delete(userId);
    else newFollowedSet.add(userId);
    setFollowedUserIds(newFollowedSet);

    setUsers(prev => prev.map(u => {
      if (u.id === userId) return { ...u, followers: Math.max(0, u.followers + drift) };
      if (u.id === session.user.id) return { ...u, following: Math.max(0, u.following + drift) };
      return u;
    }));
    setCurrentUserData(prev => prev ? { ...prev, following: Math.max(0, (prev.following || 0) + drift) } : prev);

    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('followed_id', userId);
        if (error) throw error;
        // Eliminar notificación de seguimiento al dejar de seguir para evitar acumulaciones
        await supabase.from('notifications').delete().eq('user_id', userId).eq('sender_id', session.user.id).eq('type', 'follow');
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: session.user.id, followed_id: userId });
        if (error) throw error;

        // Comprobar si ya existe una notificación de seguimiento para evitar duplicados
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('sender_id', session.user.id)
          .eq('type', 'follow')
          .maybeSingle();

        if (existingNotif) {
          // Si ya existe, simplemente la actualizamos y la marcamos como no leída
          await supabase
            .from('notifications')
            .update({ is_read: false, created_at: new Date().toISOString() })
            .eq('id', existingNotif.id);
        } else {
          await supabase.from('notifications').insert({ user_id: userId, sender_id: session.user.id, type: 'follow', content: `ha comenzado a seguirte` });
        }
      }

      const { followed } = await fetchFollows(true);
      await fetchUserProfile(session.user.id, true);
      await fetchUsers(true);

      if (activeTab === 'following') {
        tabLastFetchedRef.current['following'] = 0;
        fetchFeed(0, undefined, undefined, true, followed);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setFollowedUserIds(previousFollowedSet);
      setUsers(prev => prev.map(u => {
        if (u.id === userId) return { ...u, followers: Math.max(0, u.followers - drift) };
        if (u.id === session.user.id) return { ...u, following: Math.max(0, u.following - drift) };
        return u;
      }));
      setCurrentUserData(prev => prev ? { ...prev, following: Math.max(0, (prev.following || 0) - drift) } : prev);
      fetchFollows(true);
    }
  }, [session, followedUserIds, activeTab, fetchFollows, fetchFeed, fetchUsers, fetchUserProfile]);

  const fetchChats = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const CHAT_CACHE_KEY = `chat_list_${userId}`;
    setChatsLoading(true);

    // Fallback sin RPC: consulta directa a `messages` + `profiles` y
    // construye el mismo shape que devolvería get_chat_sidebar. Se usa si la
    // RPC no está disponible o devuelve error (p.ej. columna inexistente).
    const fallbackSidebar = async (): Promise<any[] | null> => {
      const { data: msgs, error: msgsErr } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, text, image_url, post_id, news_id, shared_profile_id, shared_event_id, is_read, is_deleted, created_at')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(200);
      if (msgsErr || !msgs) return null;

      const byOther = new Map<string, any>();
      for (const m of msgs) {
        const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id;
        if (!otherId) continue;
        if (!byOther.has(otherId)) byOther.set(otherId, m);
        if (byOther.size >= 10) break;
      }
      const otherIds = Array.from(byOther.keys());
      if (otherIds.length === 0) return [];

      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, last_name, avatar, username, position, institution, chat_settings')
        .in('id', otherIds);
      const pmap = new Map((profs || []).map((p: any) => [p.id, p]));

      return otherIds.map(oid => {
        const m = byOther.get(oid);
        const p: any = pmap.get(oid) || {};
        return {
          other_user_id: oid,
          sender_id: m.sender_id,
          created_at: m.created_at,
          is_read: m.is_read,
          is_deleted: m.is_deleted,
          msg_text: m.text,
          image_url: m.image_url,
          post_id: m.post_id,
          news_id: m.news_id,
          shared_profile_id: m.shared_profile_id,
          shared_event_id: m.shared_event_id,
          profile_username: p.username,
          profile_name: p.name,
          profile_last_name: p.last_name,
          profile_avatar: p.avatar,
          profile_position: p.position,
          profile_institution: p.institution,
          profile_chat_settings: p.chat_settings,
        };
      });
    };

    try {
      // La RPC get_chat_sidebar está rota en servidor (referencia a columna
      // inexistente → 400). Usamos directamente el fallback para evitar el
      // error ruidoso en la pestaña Network y en consola.
      const data = await fallbackSidebar();

      if (!data || data.length === 0) {
        setChatsLoading(false);
        return;
      }

      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');

      const buildSummary = (row: any, isSender: boolean) => {
        const trimmedText = (row.msg_text || '').trim();
        const hasImageUrl = !!(row.image_url && (Array.isArray(row.image_url) ? row.image_url.length > 0 : true));
        const isBase64 = trimmedText.includes('data:image') || trimmedText.includes(';base64,');
        const isDirectUrl = /^https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i.test(trimmedText);
        const hasImageInText = /https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?/i.test(trimmedText);
        const isImage = isBase64 || isDirectUrl || hasImageInText || hasImageUrl;
        const isProbablyData = !isImage && !trimmedText.startsWith('http') && (trimmedText.includes(';base64,') || (trimmedText.length > 60 && !trimmedText.includes(' ')));
        if (row.is_deleted) return isSender ? 'Eliminaste este mensaje' : 'Este mensaje ha sido eliminado';
        if (isProbablyData) return 'Adjunto';
        if (row.post_id || row.news_id) return isSender ? (row.news_id ? 'Enviaste una noticia' : 'Enviaste un post') : (row.news_id ? 'Te ha enviado una noticia' : 'Te ha enviado un post');
        if (row.shared_profile_id) return 'Perfil compartido';
        if (row.shared_event_id) return 'Evento compartido';
        if (isImage) return 'Imagen';
        if (trimmedText.startsWith('http')) return trimmedText;
        return trimmedText;
      };

      const sortedChats: Chat[] = data.map((row: any) => {
        const isSender = row.sender_id === userId;
        const otherId = row.other_user_id;
        const username = row.profile_username;
        const name = row.profile_name || 'Usuario';
        const lastName = row.profile_last_name || '';
        const rawName = `${name} ${lastName}`.trim();
        const safeUsername = (username && !isUUID(username)) ? username : (isUUID(rawName) ? '' : rawName.toLowerCase().replace(/\s/g, ''));
        return {
          id: otherId,
          participant: {
            id: otherId,
            name,
            lastName,
            username: safeUsername,
            avatar: getSafeAvatar(row.profile_avatar),
            position: row.profile_position || '',
            institution: row.profile_institution || '',
            chatSettings: row.profile_chat_settings
          },
          messages: [],
          lastMessage: buildSummary(row, isSender),
          timestamp: row.created_at ? new Date(row.created_at) : new Date(),
          lastMessageSenderId: row.sender_id,
          lastMessageIsRead: row.is_read
        };
      });

      // Preserve already-loaded messages, update sidebar metadata
      setChats(prev => {
        const prevMap = new Map(prev.map((c: any) => [c.id, c]));
        return sortedChats.map(c => {
          const existing = prevMap.get(c.id);
          return existing?.messages?.length > 0 ? { ...c, messages: existing.messages } : c;
        });
      });

      // Persist for instant next load
      try {
        safeLocalStorageSet(CHAT_CACHE_KEY, JSON.stringify(
          sortedChats.map(c => ({
            ...c,
            timestamp: c.timestamp instanceof Date ? c.timestamp.toISOString() : c.timestamp,
            messages: []
          }))
        ));
      } catch {}
    } catch (err) {
      console.error('Crash in fetchChats:', err);
    } finally {
      setChatsLoading(false);
    }
  }, [session?.user?.id]);

  const fetchChatMessages = useCallback(async (recipientId: string, offset: number = 0) => {
    const userId = session?.user?.id;
    if (!userId || !recipientId) return;

    const PAGE_SIZE = 15;
    const MSG_CACHE_KEY = `chat_msgs_${userId}_${recipientId}`;
    const INLINE_POSTS_KEY = `chat_inline_posts_${userId}`;
    const INLINE_EVENTS_KEY = `chat_shared_events_${userId}`;
    const INLINE_PROFILES_KEY = `chat_shared_profiles_${userId}`;

    setActiveChatMessagesLoading(true);

    // On first page only: show cached messages immediately before DB round-trip
    if (offset === 0) {
      try {
        const cached = localStorage.getItem(MSG_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cachedMessages = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            setChats(prev => prev.map(c => c.id === recipientId ? { ...c, messages: cachedMessages } : c));
          }
        }
      } catch {}
    }

    // ── Phase 1: fetch messages ──────────────────────────────────────────────────
    // Use a more robust filter to ensure we get messages between Me and Recipient
    // (sender=Me AND recipient=Them) OR (sender=Them AND recipient=Me)
    // We avoid the profiles join here because some environments may lack the FK relationships (PGRST200).
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, created_at, sender_id, recipient_id, text, is_read, post_id, news_id,
        shared_profile_id, shared_event_id, image_url, updated_at, is_deleted
      `)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    setActiveChatHasMore((data?.length ?? 0) >= PAGE_SIZE);
    
    if (error || !data) {
      console.error('Error fetching chat messages:', error);
      setActiveChatMessagesLoading(false);
      return;
    }

    if (data.length === 0) {
      setActiveChatMessagesLoading(false);
      return;
    }

    // ── Phase 1b: fetch profiles for the messages ────────────────────────────────
    // Since we removed the join, we fetch the sender/recipient profiles manually.
    const profileIds = [...new Set(data.flatMap(m => [m.sender_id, m.recipient_id]))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, last_name, avatar, username, position, institution, chat_settings')
      .in('id', profileIds);

    const profileMap = new Map((profilesData || []).map(p => [p.id, p]));
    const getProfile = (id: string) => profileMap.get(id);

    const orderedData = [...data].reverse();
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');

    const firstMsg = orderedData[0];
    const otherProfileId = firstMsg.sender_id === userId ? firstMsg.recipient_id : firstMsg.sender_id;
    const joinedProfile = getProfile(otherProfileId);
    const username = joinedProfile?.username;
    const name = joinedProfile?.name || 'Usuario';
    const lastName = joinedProfile?.last_name || '';
    const rawName = `${name} ${lastName}`.trim();
    const safeUsername = (username && !isUUID(username)) ? username : (isUUID(rawName) ? '' : (rawName.toLowerCase().replace(/\s/g, '') || ''));

    // Seed caches from in-memory maps first (zero-latency, no JSON.parse)
    let inlinePostsCache: Record<string, any> = Object.fromEntries(_chatPostPreviews);
    let inlineProfilesCache: Record<string, any> = Object.fromEntries(_chatProfilePreviews);
    let eventsCache: Map<string, any> = new Map(_chatEventPreviews);

    // Merge with localStorage for entries from previous sessions not yet in memory
    try {
      const stored = JSON.parse(localStorage.getItem(INLINE_POSTS_KEY) || '{}');
      for (const [k, v] of Object.entries(stored)) { if (!inlinePostsCache[k]) inlinePostsCache[k] = v; }
    } catch {}
    try {
      const stored = JSON.parse(localStorage.getItem(INLINE_PROFILES_KEY) || '{}');
      for (const [k, v] of Object.entries(stored)) { if (!inlineProfilesCache[k]) inlineProfilesCache[k] = v; }
    } catch {}
    try {
      const evRaw = localStorage.getItem('global_events_cache');
      const evArr = evRaw ? (Array.isArray(JSON.parse(evRaw)) ? JSON.parse(evRaw) : []) : [];
      evArr.forEach((e: any) => { if (!eventsCache.has(e.id)) eventsCache.set(e.id, e); });
    } catch {}
    try {
      const chatEvRaw = localStorage.getItem(INLINE_EVENTS_KEY);
      if (chatEvRaw) {
        Object.values(JSON.parse(chatEvRaw)).forEach((e: any) => { if (!eventsCache.has(e.id)) eventsCache.set(e.id, e); });
      }
    } catch {}

    // Build messages — all preview data comes directly from query JOINs or local cache
    const toImageUrls = (raw: any) => !raw ? null : Array.isArray(raw) ? (raw.length > 0 ? raw : null) : [raw];
    const buildMessages = (rawData: any[]) => {
      return rawData.map((m: any) => {
        const msgDate = m.created_at ? new Date(m.created_at) : new Date();

        // Previews come from local caches (populated by phase 2 fallback or prior sessions)
        const inlineSharedPost: any = (m.post_id || m.news_id)
          ? (inlinePostsCache[m.post_id || m.news_id] || _chatPostPreviews.get(m.post_id || m.news_id) || null)
          : null;
        const sharedEvent: any = m.shared_event_id
          ? (eventsCache.get(m.shared_event_id) || _chatEventPreviews.get(m.shared_event_id) || null)
          : null;
        const cachedP = m.shared_profile_id
          ? (inlineProfilesCache[m.shared_profile_id] || _chatProfilePreviews.get(m.shared_profile_id) || null)
          : null;
        const inlineSharedProfile: any = cachedP
          ? { id: cachedP.id, name: cachedP.name || '', lastName: cachedP.last_name || cachedP.lastName || '', username: cachedP.username || '', avatar: cachedP.avatar || null, position: cachedP.position || '', institution: cachedP.institution || '' }
          : null;

        return { id: m.id, senderId: m.sender_id, recipientId: m.recipient_id, text: m.text || '', timestamp: msgDate, isRead: m.is_read, postId: m.post_id, newsId: m.news_id, isPostShare: !!m.post_id || !!m.news_id, inlineSharedPost, inlineSharedProfile, sharedProfile: inlineSharedProfile, sharedProfileId: m.shared_profile_id, sharedEventId: m.shared_event_id, sharedEvent, imageUrl: m.image_url, updated_at: m.updated_at, is_deleted: m.is_deleted };
      });
    };

    const newestMsg = data[0];
    const newestDate = newestMsg.created_at ? new Date(newestMsg.created_at) : new Date();

    const applyMessages = (msgs: any[]) => {
      setChats(prev => {
        const existing = prev.find(c => c.id === recipientId);
        if (existing) {
          const merged = offset > 0
            ? [...msgs, ...existing.messages]
            : msgs;
          return prev.map(c => c.id === recipientId
            ? { ...c, messages: merged, ...(offset === 0 ? { timestamp: newestDate, lastMessageSenderId: newestMsg.sender_id, lastMessageIsRead: newestMsg.is_read } : {}) }
            : c);
        }
        const newChat = {
          id: recipientId,
          participant: {
            id: recipientId,
            name,
            lastName,
            username: safeUsername,
            avatar: getSafeAvatar(joinedProfile?.avatar),
            position: joinedProfile?.position || '',
            institution: joinedProfile?.institution || '',
            chatSettings: joinedProfile?.chat_settings
          },
          messages: msgs, lastMessage: msgs[msgs.length - 1]?.text || '',
          timestamp: newestDate, lastMessageSenderId: newestMsg.sender_id, lastMessageIsRead: newestMsg.is_read
        };
        return [...prev, newChat].sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
      });
    };

    // Build & show messages immediately — MessagesView's localPreviews handles display
    // while the background fetch below populates caches for next time.
    const messages = buildMessages(orderedData);
    applyMessages(messages);
    setActiveChatMessagesLoading(false);

    // ── Background: fetch any preview data not yet in cache ──────────────────────
    // Does NOT block applyMessages — previews from MessagesView.localPreviews fill the UI.
    // When done, persists to seed caches so future loads are instant.
    const missingPostIds    = [...new Set<string>(orderedData.filter((m: any) => m.post_id    && !inlinePostsCache[m.post_id]).map((m: any) => m.post_id as string))];
    const missingNewsIds    = [...new Set<string>(orderedData.filter((m: any) => m.news_id    && !inlinePostsCache[m.news_id]).map((m: any) => m.news_id as string))];
    const missingEventIds   = [...new Set<string>(orderedData.filter((m: any) => m.shared_event_id   && !eventsCache.has(m.shared_event_id)).map((m: any) => m.shared_event_id as string))];
    const missingProfileIds = [...new Set<string>(orderedData.filter((m: any) => m.shared_profile_id && !inlineProfilesCache[m.shared_profile_id]).map((m: any) => m.shared_profile_id as string))];
    const hasMissing = missingPostIds.length > 0 || missingNewsIds.length > 0 || missingEventIds.length > 0 || missingProfileIds.length > 0;

    const persistCaches = (msgs: any[]) => {
      if (offset !== 0) return;
      try {
        const payload = msgs.map((m: any) => ({ ...m, timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp }));
        safeLocalStorageSet(MSG_CACHE_KEY, JSON.stringify(payload));
      } catch {}
      try { safeLocalStorageSet('chat_inline_posts_seed', JSON.stringify(Object.fromEntries(_chatPostPreviews))); } catch {}
      try { safeLocalStorageSet('chat_shared_events_seed', JSON.stringify(Object.fromEntries(_chatEventPreviews))); } catch {}
      try { safeLocalStorageSet('chat_shared_profiles_seed', JSON.stringify(Object.fromEntries(_chatProfilePreviews))); } catch {}
    };

    if (!hasMissing) { persistCaches(messages); return; }

    (async () => {
      const [postsRes, newsRes, eventsRes, profilesRes] = await Promise.all([
        missingPostIds.length > 0    ? supabase.from('posts').select('id, content, image_url, author_id, type, created_at').in('id', missingPostIds)                                    : Promise.resolve({ data: [] as any[] }),
        missingNewsIds.length > 0    ? supabase.from('news').select('id, titulo, content, image_url, author_id, created_at').in('id', missingNewsIds)                                   : Promise.resolve({ data: [] as any[] }),
        missingEventIds.length > 0   ? supabase.from('user_events').select('id, title, event_date, event_time, location, image_url, description, creator_id').in('id', missingEventIds) : Promise.resolve({ data: [] as any[] }),
        missingProfileIds.length > 0 ? supabase.from('profiles').select('id, name, last_name, avatar, username, position, institution').in('id', missingProfileIds)                     : Promise.resolve({ data: [] as any[] }),
      ]);
      const allRaw = [...(postsRes.data || []), ...(newsRes.data || [])];
      const authorIds = [...new Set<string>(allRaw.map((p: any) => p.author_id).filter(Boolean))];
      const authorMap = new Map<string, any>();
      if (authorIds.length > 0) {
        const { data: authData } = await supabase.from('profiles').select('id, name, last_name, avatar, username, position, is_organization').in('id', authorIds);
        (authData || []).forEach((a: any) => authorMap.set(a.id, a));
      }
      (postsRes.data || []).forEach((p: any) => {
        const a = authorMap.get(p.author_id);
        const preview = { id: p.id, type: p.type || 'post', content: p.content || '', imageUrl: toImageUrls(p.image_url), title: null, authorId: p.author_id, authorName: a ? `${a.name || ''} ${a.last_name || ''}`.trim() : '', authorAvatar: a?.avatar || null, authorUsername: a?.username || null, authorPosition: a?.position || '', authorIsOrganization: a?.is_organization || false, timestamp: p.created_at ? new Date(p.created_at) : new Date() };
        inlinePostsCache[p.id] = preview; _chatPostPreviews.set(p.id, preview);
      });
      (newsRes.data || []).forEach((n: any) => {
        const a = authorMap.get(n.author_id);
        const preview = { id: n.id, type: 'news', content: n.content || '', imageUrl: toImageUrls(n.image_url), title: n.titulo || '', authorId: n.author_id || null, authorName: a ? `${a.name || ''} ${a.last_name || ''}`.trim() : '', authorAvatar: a?.avatar || null, authorUsername: a?.username || null, authorPosition: a?.position || '', authorIsOrganization: a?.is_organization || false, timestamp: n.created_at ? new Date(n.created_at) : new Date() };
        inlinePostsCache[n.id] = preview; _chatPostPreviews.set(n.id, preview);
      });
      (eventsRes.data || []).forEach((e: any) => { eventsCache.set(e.id, e); _chatEventPreviews.set(e.id, e); });
      (profilesRes.data || []).forEach((p: any) => {
        const mapped = { id: p.id, name: p.name || '', lastName: p.last_name || '', username: p.username || '', avatar: p.avatar || null, position: p.position || '', institution: p.institution || '' };
        inlineProfilesCache[p.id] = mapped; _chatProfilePreviews.set(p.id, mapped);
      });
      // Re-build messages with now-populated caches and update state + persist
      const patched = buildMessages(orderedData);
      applyMessages(patched);
      persistCaches(patched);
    })();
  }, [session?.user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('id, created_at, type, user_id, sender_id, content, is_read, post_id, news_id, updated_at, sender:profiles!sender_id(id, name, last_name, avatar, username, country, region, status, followers_count, following_count)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Clasifica una notificación en su clave de ajuste. null ⇒ no se filtra.
      const classifyKey = (n: any): string | null => {
        const t: string = n.type || '';
        const c: string = (n.content || '').toLowerCase();
        if (t === 'registration_request' || 
            t === 'registration_approved' || 
            t === 'registration_rejected' || 
            (t === 'system' && (c.includes('solicitud') || c.includes('aprobado') || c.includes('aceptado') || c.includes('rechazado'))) && !c.includes('canje')) return null;
        if (t === 'follow') return 'follows';
        if (t === 'mention') return 'mentions';
        if (t === 'repost') return 'reposts';
        if (t === 'event_support') return 'event_supports';
        if (t === 'reward_accepted') return 'rewards_accepted';
        if (t === 'reward_request') return null; // admin-only
        if (t === 'like') {
          if (c.includes('comentario')) return 'likes_comment';
          if (n.news_id || c.includes('noticia') || c.includes('flecha')) return 'likes_news';
          return 'likes_post';
        }
        if (t === 'comment') {
          if (c.includes('respondi')) return 'replies';
          if (n.news_id || c.includes('noticia')) return 'comments_news';
          return 'comments_post';
        }
        if (t === 'system') {
          if (c.includes('mantenimiento')) return 'maintenance_notices';
          if (c.includes('insignia')) return 'badges_earned';
          if (c.includes('ranking') || /top\s?[123]/i.test(c)) return 'ranking_weekly';
          if (c.includes('novas') || c.includes('enhorabuena') || c.includes('has ganado') || c.includes('ha ganado')) return 'novas_earned';
        }
        return null;
      };

      const settings: any = normalizeNotificationSettings(currentUserData?.notificationSettings);
      const isAllowed = (n: any) => {
        const key = classifyKey(n);
        if (!key) return true;
        return settings[key] !== false;
      };

      const mapped = data
        .filter(isAllowed)
        .map((n: any) => {
          const name = n.sender?.name || 'Usuario';
          const lastName = n.sender?.last_name || '';
          const rawName = `${name} ${lastName}`.trim();
          const isLegacyNewsNotif = !n.news_id && n.post_id && n.content?.toLowerCase().includes('noticia');
          return {
            id: n.id,
            type: n.type,
            senderName: rawName,
            senderId: n.sender_id,
            senderAvatar: getSafeAvatar(n.sender?.avatar),
            content: n.content,
            timestamp: n.created_at,
            isRead: n.is_read,
            postId: isLegacyNewsNotif ? undefined : n.post_id,
            newsId: isLegacyNewsNotif ? n.post_id : n.news_id,
            updatedAt: n.updated_at || n.created_at,
            senderStatus: n.sender?.status
          };
        });
      setNotifications(mapped);
      try { safeLocalStorageSet(`last_known_notifications_${session.user.id}`, JSON.stringify(mapped.slice(0, 30))); } catch {}
    }
  }, [session?.user?.id, currentUserData?.notificationSettings]);

  const fetchGlobalEvents = useCallback(async (forceRefresh?: boolean) => {
    const CACHE_KEY = 'global_events_cache';
    const MEM_CACHE_KEY = 'global_events';
    const STALE_MS = 30 * 60 * 1000; // 30 minutos — los eventos no cambian frecuentemente

    // Skip everything if in-memory cache is fresh (fastest path, zero I/O)
    if (!forceRefresh && isMemoryCacheFresh(MEM_CACHE_KEY, STALE_MS)) {
      setGlobalEventsLoading(false);
      return;
    }

    try {
      // SWR: Show stale data immediately, skip network if localStorage is fresh
      const cached = localStorage.getItem(CACHE_KEY);

      if (cached) {
        try {
          const { data: cachedData, timestamp } = JSON.parse(cached);

          if (!forceRefresh && Date.now() - timestamp < STALE_MS) {
            setGlobalEvents(prev => {
              const prevKey = prev.map((e: any) => e.id + e.event_date).join();
              const newKey = (cachedData || []).map((e: any) => e.id + e.event_date).join();
              if (prevKey === newKey) return prev;
              return cachedData;
            });
            setMemoryCache(MEM_CACHE_KEY, cachedData);
            setGlobalEventsLoading(false);
            return;
          }
          // Stale: show cached data while fetching fresh data in background
          setGlobalEvents(prev => {
            if (prev.length === 0 && cachedData?.length > 0) return cachedData;
            return prev;
          });
          setGlobalEventsLoading(false); // stale data counts as "loaded"
        } catch { /* ignore parse error */ }
      }

      // Use local date string (YYYY-MM-DD) for more robust comparison with event_date column
      const localToday = new Date().toLocaleDateString('en-CA');

      const { data, error } = await supabase
        .from('user_events')
        .select('id, creator_id, title, type, event_date, event_time, location, description, attendees_count, image_url')
        .gte('event_date', localToday)
        .order('event_date', { ascending: true });

      if (!error && data) {
        const mappedEvents = data.map(ev => ({
          id: ev.id,
          creator_id: ev.creator_id,
          title: ev.title,
          type: ev.type,
          event_date: ev.event_date,
          event_time: ev.event_time,
          location: ev.location,
          description: ev.description,
          attendees: ev.attendees_count,
          image_url: ev.image_url
        }));

        setGlobalEvents(prev => {
          // Lightweight fingerprint: IDs + dates (avoids slow JSON.stringify on large arrays)
          const prevKey = prev.map((e: any) => e.id + e.event_date).join();
          const newKey = mappedEvents.map(e => e.id + e.event_date).join();
          if (prevKey === newKey) return prev;
          return mappedEvents;
        });

        setMemoryCache(MEM_CACHE_KEY, mappedEvents);
        setGlobalEventsLoading(false);

        // Seed event_manifest so PostCard EventPreview renders immediately from cache next session
        try {
          const eventManifestStored = JSON.parse(localStorage.getItem('event_manifest') || '{}');
          mappedEvents.forEach((e: any) => {
            eventManifestStored[e.id] = {
              id: e.id, title: e.title, event_date: e.event_date,
              event_time: e.event_time, type: e.type, location: e.location,
              image_url: e.image_url || null, creator_id: e.creator_id || null
            };
          });
          safeLocalStorageSet('event_manifest', JSON.stringify(eventManifestStored));
        } catch { /* quota exceeded */ }

        try {
          const lightweight = mappedEvents.map(({ description: _desc, ...rest }: any) => rest);
          safeLocalStorageSet(CACHE_KEY, JSON.stringify({ data: lightweight, timestamp: Date.now() }));
        } catch { /* quota exceeded */ }
      } else {
        setGlobalEventsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching global events:', err);
      setGlobalEventsLoading(false);
    }
  }, []);

  const fetchStoreRewards = useCallback(async () => {
    const { data, error } = await supabase.from('rewards').select('id, name, cost_novas, icon_name, color').order('cost_novas', { ascending: true });
    if (!error && data) {
      setStoreRewards(data);
    }
  }, []);

  const fetchUserRedemptions = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('user_rewards').select('id, user_id, reward_id, status, created_at').eq('user_id', session.user.id);
    if (!error && data) {
      setUserRedemptions(data);
    }
  }, [session?.user?.id]);

  const handleApproveUser = async (userId: string, notificationId: string) => {
    if (!session?.user || !currentUserData?.isAdmin) return;

    const savedScroll = window.scrollY;
    // Optimistic update
    const resolvedLabel = ' (aceptado)';
    const now = new Date().toISOString();

    setNotifications(prev => {
      // Check if we already have a real notification for this request
      const hasReal = prev.some(n => n.senderId === userId && n.type === 'registration_request');
      
      if (hasReal) {
        return prev.map(n => {
          if (n.senderId === userId && (n.type === 'registration_request' || (n.type === 'system' && n.content.includes('Solicitud')))) {
            return { ...n, content: n.content.includes('(') ? n.content : n.content + resolvedLabel, isRead: true, updatedAt: now };
          }
          return n;
        });
      } else {
        // It was a virtual one, inject a real one optimistically
        const targetUser = users.find(u => u.id === userId);
        const virtualAsReal: Notification = {
          id: `opt-${userId}`, // temporary id
          type: 'registration_request',
          senderId: userId,
          senderName: targetUser ? `${targetUser.name} ${targetUser.lastName || ''}` : 'Usuario',
          senderAvatar: targetUser?.avatar || '',
          content: `Solicitud de registro${resolvedLabel}`,
          timestamp: now,
          updatedAt: now,
          isRead: true
        };
        return [virtualAsReal, ...prev];
      }
    });

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active', updatedAt: now } : u));
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: savedScroll, behavior: 'instant' })));

    const { error } = await supabase.rpc('fn_resolve_registration', {
      p_user_id: userId,
      p_notification_id: notificationId.startsWith('virtual-') ? null : notificationId,
      p_approve: true
    });
    if (error) {
      console.error("Error approving user:", error);
      alert("Error al aprobar usuario: " + error.message);
      // Rollback
      fetchNotifications();
      fetchUsers(true);
    } else {
      // Mark as first_time so the welcome notification and tutorial fire on their first login
      await supabase.from('profiles').update({ first_time: true }).eq('id', userId);
      // Small delay to ensure DB loop completes and triggers finish
      setTimeout(async () => {
        const scroll = window.scrollY;
        await fetchFeed();
        await fetchNotifications();
        await fetchUsers(true);
        requestAnimationFrame(() => window.scrollTo({ top: scroll, behavior: 'instant' }));
      }, 500);
    }
  };

  const handleRejectUser = async (userId: string, notificationId: string) => {
    if (!session?.user || !currentUserData?.isAdmin) return;

    const savedScroll = window.scrollY;
    // Optimistic update
    const resolvedLabel = ' (rechazado)';
    const now = new Date().toISOString();

    setNotifications(prev => {
      const hasReal = prev.some(n => n.senderId === userId && n.type === 'registration_request');
      if (hasReal) {
        return prev.map(n => {
          if (n.senderId === userId && (n.type === 'registration_request' || (n.type === 'system' && n.content.includes('Solicitud')))) {
            return { ...n, content: n.content.includes('(') ? n.content : n.content + resolvedLabel, isRead: true, updatedAt: now };
          }
          return n;
        });
      } else {
        const targetUser = users.find(u => u.id === userId);
        const virtualAsReal: Notification = {
          id: `opt-${userId}`,
          type: 'registration_request',
          senderId: userId,
          senderName: targetUser ? `${targetUser.name} ${targetUser.lastName || ''}` : 'Usuario',
          senderAvatar: targetUser?.avatar || '',
          content: `Solicitud de registro${resolvedLabel}`,
          timestamp: now,
          updatedAt: now,
          isRead: true
        };
        return [virtualAsReal, ...prev];
      }
    });

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected', updatedAt: now } : u));
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: savedScroll, behavior: 'instant' })));

    console.log("Rejecting user with notificationId:", notificationId);
    const { error } = await supabase.rpc('fn_resolve_registration', {
      p_user_id: userId,
      p_notification_id: notificationId.startsWith('virtual-') ? null : notificationId,
      p_approve: false
    });
    if (error) {
      console.error("Error rejecting user:", error);
      alert("Error al rechazar usuario: " + error.message);
      // Rollback
      fetchNotifications();
      fetchUsers(true);
    } else {
      const newUsername = await getNextDeletedUsername();
      await supabase.schema('id').from('users').update({ username: newUsername }).eq('id', userId);
      setTimeout(async () => {
        const scroll = window.scrollY;
        await fetchNotifications();
        await fetchUsers(true);
        requestAnimationFrame(() => window.scrollTo({ top: scroll, behavior: 'instant' }));
      }, 500);
    }
  };

  const handleApproveRedemption = async (userId: string, rewardId: string, notificationId: string) => {
    if (!session?.user || !currentUserData?.isAdmin) return;

    const { error } = await supabase.rpc('fn_resolve_reward', {
      p_user_id: userId,
      p_reward_id: rewardId,
      p_notification_id: notificationId,
      p_approve: true
    });

    if (error) {
      console.error("Error approving reward:", error);
      alert("Error al aprobar canje: " + error.message);
    } else {
      fetchUserRedemptions();
      fetchNotifications();
    }
  };

  const handleRedeemReward = async (rewardId: string, rewardName: string) => {
    if (!session?.user || !currentUserData) return;

    // Verificar si el usuario ya ha canjeado esta recompensa
    const existingRedemption = userRedemptions.find(r => r.reward_id === rewardId);
    if (existingRedemption) {
      alert("Ya has canjeado esta recompensa. Las recompensas solo pueden ser canjeadas una vez.");
      return;
    }

    const optimisticEntry = {
      id: `opt-${rewardId}-${Date.now()}`,
      user_id: session.user.id,
      reward_id: rewardId,
      status: 'solicitado',
      created_at: new Date().toISOString(),
    };
    const previousRedemptions = userRedemptions;
    setUserRedemptions(prev => [
      ...prev.filter(r => r.reward_id !== rewardId),
      optimisticEntry,
    ]);

    const { error } = await supabase.rpc('fn_request_reward', {
      p_reward_id: rewardId
    });

    if (error) {
      console.error("Error redeeming reward:", error);
      setUserRedemptions(previousRedemptions);
      
      // Mostrar mensaje de error apropiado
      let errorMsg = "Error al canjear la recompensa";
      if (error.message && error.message.includes("Ya has canjeado")) {
        errorMsg = "Ya has canjeado esta recompensa. Las recompensas solo pueden ser canjeadas una vez.";
      } else if (error.message && error.message.includes("suficientes Novas")) {
        errorMsg = error.message;
      }
      
      alert(errorMsg);
    } else {
      // Esperar a que se complete la actualización de redemptions
      await fetchUserRedemptions();
    }
  };

  const fetchWeeklyTrends = useCallback(async (force = false) => {
    if (!session?.user) return;

    // Cache check: if fresh (< 2 hours), skip fetch unless forced
    if (!force) {
      try {
        const cached = localStorage.getItem('weekly_trends_cache');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes cache instead of 2 hours
            if (data && data.length > 0) {
              setWeeklyTrends(data);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Error reading trends cache:", e);
        localStorage.removeItem('weekly_trends_cache');
      }
    }

    try {
      const now = new Date();
      const currentDay = now.getDay();
      const diffToMonday = (currentDay === 0 ? -6 : 1 - currentDay);
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const [{ data: postsTags }, { data: newsTags }] = await Promise.all([
        supabase.from('posts').select('tags').not('tags', 'is', null).gte('created_at', monday.toISOString()).lte('created_at', sunday.toISOString()),
        supabase.from('news').select('tags').not('tags', 'is', null).gte('created_at', monday.toISOString()).lte('created_at', sunday.toISOString())
      ]);

      const counts: Record<string, number> = {};
      const processTags = (data: any[] | null) => {
        if (!data) return;
        data.forEach(item => {
          // item.tags might be an array or a JSON string depending on Supabase version/driver
          let tagsArray: string[] = [];
          if (Array.isArray(item.tags)) {
            tagsArray = item.tags;
          } else if (typeof item.tags === 'string') {
            try { tagsArray = JSON.parse(item.tags); } catch { }
          }
          
          if (tagsArray && tagsArray.length > 0) {
            const uniqueTags = new Set(tagsArray.map(t => String(t).trim().toLowerCase()).filter(Boolean));
            uniqueTags.forEach(tag => {
              counts[tag] = (counts[tag] || 0) + 1;
            });
          }
        });
      };

      processTags(postsTags);
      processTags(newsTags);

      const topTags = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5) // Show top 5 instead of 3 to be more generous
        .map(([tag, count]) => ({ tag, count }));

      setWeeklyTrends(topTags);
      safeLocalStorageSet('weekly_trends_cache', JSON.stringify({ data: topTags, timestamp: Date.now() }));
    } catch (err) {
      console.error("Error fetching weekly trends:", err);
      // If it fails, clear trends to avoid showing ghost/stale data
      setWeeklyTrends([]);
      localStorage.removeItem('weekly_trends_cache');
    }
  }, [session]);
 
  useEffect(() => {
    if (!session?.user) return;
 
    // REAL-TIME TRENDS: Listen for any DB changes (Insert/Delete) to update trends live
    const trendsChannel = supabase
      .channel('public-trends-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchWeeklyTrends(true))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => fetchWeeklyTrends(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, () => fetchWeeklyTrends(true))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'news' }, () => fetchWeeklyTrends(true))
      .subscribe();
 
    return () => {
      supabase.removeChannel(trendsChannel);
    };
  }, [session, fetchWeeklyTrends]);



  const handleLoadMorePosts = useCallback(async () => {
    const effectiveHasMore = activeTab === 'following' ? hasMoreFollowing : hasMorePosts;
    if (isLoadingMorePosts || (!effectiveHasMore && !hasMoreNews)) return;
    setIsLoadingMorePosts(true);

    const postCount = posts.filter(p => p.type === 'post').length;
    const newsCount = posts.filter(p => p.type === 'news').length;

    if (effectiveHasMore) {
      await fetchFeed(postCount, 'post', undefined, activeTab === 'following', undefined, true);
    }

    setIsLoadingMorePosts(false);
  }, [isLoadingMorePosts, hasMorePosts, hasMoreFollowing, hasMoreNews, fetchFeed, posts, activeTab]);

  const handleLoadMoreNews = useCallback(async () => {
    if (isLoadingMoreNews || !hasMoreNews) return;
    setIsLoadingMoreNews(true);
    const count = posts.filter(p => p.type === 'news').length;
    await fetchFeed(count, 'news', undefined, activeTab === 'following');
    setIsLoadingMoreNews(false);
  }, [isLoadingMoreNews, hasMoreNews, fetchFeed, posts, activeTab]);

  const handleLoadMoreProfile = useCallback(async (authorId: string) => {
    if (isLoadingMorePosts) return;
    setIsLoadingMorePosts(true);
    const count = profilePosts.filter(p => p.authorId === authorId).length;
    await fetchFeed(count, undefined, authorId);
    setIsLoadingMorePosts(false);
  }, [isLoadingMorePosts, fetchFeed, profilePosts]);

  const handleFetchProfileContent = useCallback(async (authorId: string) => {
    if (!authorId) return;
    const now = Date.now();
    
    // Prevent redundant fetches for the same user within 5 seconds
    const isInitialLoad = profilePosts.length === 0;
    if (!isInitialLoad && currentProfileIdRef.current === authorId && (now - lastProfileFetchTimeRef.current < 5000)) return;

    currentProfileIdRef.current = authorId;
    lastProfileFetchTimeRef.current = now;
    setIsLoadingProfileFeed(true);
    
    // Carga inmediata de posts y noticias del perfil
    await fetchFeed(0, undefined, authorId, false, undefined, false, true);
  }, [fetchFeed, profilePosts.length]);

  const handleAddPost = async (content: string, type: 'post' | 'news', tags: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string, showLinkPreview?: boolean, linkPreviewUrl?: string | null) => {
    if (!session?.user) return;
    const isNews = type === 'news';
    const table = isNews ? 'news' : 'posts';

    if (isNews) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error: countError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', session.user.id)
        .gte('created_at', today.toISOString());

      if (countError) {
        console.error("Error al consultar el límite de noticias:", countError);
      }

      if (count !== null && count >= 2) {
        showToast("Solo puedes publicar hasta 2 noticias por día.", "error");
        return;
      }
    }

    const payload: any = {
      author_id: session.user.id,
      content,
      tags: tags || [],
      image_url: imageUrls || [],
      show_link_preview: showLinkPreview !== false,
      link_preview_url: linkPreviewUrl || null
    };

    if (isNews && title) payload.titulo = title;
    if (!isNews) {
      payload.doc_url = docUrl || null;
      payload.doc_name = docName || null;
      payload.event_id = eventId || null;
    }

    // Optimistic Update: Create a temporary post and add it to the UI immediately
    const tempId = `temp-${Date.now()}`;
    const rawName = `${currentUserData?.name || ''} ${currentUserData?.lastName || ''}`.trim();
    const authorUsername = currentUserData?.username;
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
    const authorName = (!rawName || rawName === 'Usuario' || isUUID(rawName)) ? (authorUsername ? `@${authorUsername}` : (rawName || 'Usuario')) : rawName;

    const optimisticPost: Post = {
      id: tempId,
      authorId: session.user.id,
      authorName: authorName,
      authorUsername: authorUsername || '',
      authorPosition: currentUserData?.position || '',
      authorAvatar: getSafeAvatar(currentUserData?.avatar),
      title: title || '',
      content: content,
      imageUrl: imageUrls || [],
      docUrl: docUrl || '',
      docName: docName || '',
      timestamp: new Date().toISOString(),
      type: isNews ? 'news' : 'post',
      tags: tags || [],
      likes: 0,
      comments: 0,
      reposts: 0,
      commentsList: [],
      userLiked: false,
      userDownvoted: false,
      userReposted: false,
      linkedEventId: eventId,
      linkedEvent: undefined,
      showLinkPreview: showLinkPreview !== false,
      linkPreviewUrl: linkPreviewUrl || null
    };

    // Update state immediately in all feeds
    updateAllFeeds(prev => [optimisticPost, ...prev]);

    // OPTIMISTIC TRENDS UPDATE: Update trends immediately without waiting for DB
    localStorage.removeItem('weekly_trends_cache');
    if (tags && tags.length > 0) {
      setWeeklyTrends(prev => {
        const currentTrends = prev || [];
        const newTrends = [...currentTrends];
        
        tags.forEach(t => {
          const lowerTag = t.toLowerCase();
          const existing = newTrends.find(item => item.tag.toLowerCase() === lowerTag);
          if (existing) {
            existing.count += 1;
          } else {
            newTrends.push({ tag: lowerTag, count: 1 });
          }
        });
        
        return newTrends.sort((a, b) => b.count - a.count).slice(0, 5);
      });
    }

    // BACKGROUND SYNC
    (async () => {
      try {
        const { data, error } = (isNews
          ? await supabase.from('news').insert(payload).select('*').maybeSingle()
          : await supabase.from('posts').insert(payload).select('*').maybeSingle()) as { data: any, error: any };

        if (!error && data) {
          let resolvedEvent = undefined;
          if (data.event_id || data.linked_event_id) {
            const { data: eventData } = await supabase.from('user_events').select('*').eq('id', data.event_id || data.linked_event_id).maybeSingle();
            resolvedEvent = eventData;
          }

          const confirmedPost: Post = { ...optimisticPost, id: data.id, timestamp: data.created_at, linkedEvent: resolvedEvent };
          updateAllFeeds(prev => prev.map(p => p.id === tempId ? confirmedPost : p));
          
          await processMentions(content, isNews ? null : data.id, isNews ? data.id : null, isNews ? 'noticia' : 'post');
          // Wait a bit for DB consistency before refreshing trends
          setTimeout(() => fetchWeeklyTrends(true), 1500);
        } else {
          updateAllFeeds(prev => prev.filter(p => p.id !== tempId));
          console.error(`❌ Error al insertar en ${table}:`, error);
          showToast(`No se pudo publicar: ${error?.message || 'Error desconocido'}`, "error");
        }
      } catch (err: any) {
        updateAllFeeds(prev => prev.filter(p => p.id !== tempId));
        console.error("❌ Error inesperado al publicar:", err);
        showToast("Error al conectar con el servidor.", "error");
      }
    })();


    // Resolve immediately! This tells the component the "publishing" phase of the button is DONE.
    return Promise.resolve();
  };
  const resolvePostOrNews = async (id: string): Promise<any | null> => {
    const local = [...posts, ...followingPosts, ...profilePosts].find(p => p.id === id);
    if (local) {
      return {
        ...local,
        authorId: local.authorId || local.author_id,
        author_id: local.author_id || local.authorId
      };
    }

    // Query posts
    const { data: pData } = await supabase
      .from('posts')
      .select('id, author_id, tags, content')
      .eq('id', id)
      .maybeSingle();

    if (pData) {
      return {
        id: pData.id,
        authorId: pData.author_id,
        author_id: pData.author_id,
        tags: pData.tags,
        content: pData.content,
        type: 'post'
      };
    }

    // Query news
    const { data: nData } = await supabase
      .from('news')
      .select('id, author_id, tags, content')
      .eq('id', id)
      .maybeSingle();

    if (nData) {
      return {
        id: nData.id,
        authorId: nData.author_id,
        author_id: nData.author_id,
        tags: nData.tags,
        content: nData.content,
        type: 'news'
      };
    }

    return null;
  };

  const resolveNotificationRecipient = async (id: string, fallbackType: 'post' | 'news') => {
    const local = [...posts, ...followingPosts, ...profilePosts].find(p => p.id === id);
    const localAuthorId = local?.authorId || local?.author_id;
    if (localAuthorId) return localAuthorId;

    const table = fallbackType === 'news' ? 'news' : 'posts';
    const { data } = await supabase
      .from(table)
      .select('author_id')
      .eq('id', id)
      .maybeSingle();

    return data?.author_id || null;
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!session?.user) return;
    const post = await resolvePostOrNews(postId);

    if (!post) return;
    const table = post.type === 'news' ? 'news_comments' : 'post_comments';
    const idField = post.type === 'news' ? 'news_id' : 'post_id';
    const { error } = await supabase.from(table).insert({ [idField]: postId, author_id: session.user.id, text });
    if (!error) {
      // Optimistic counter update
      updateAllFeeds(prev => prev.map(p => 
        p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
      ));

      const recipientId = await resolveNotificationRecipient(postId, post.type === 'news' ? 'news' : 'post');
      if (recipientId && recipientId !== session.user.id) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: recipientId,
          sender_id: session.user.id,
          type: 'comment',
          content: `ha hecho un comentario en tu ${post.type === 'news' ? 'noticia' : 'post'}`,
          post_id: post.type !== 'news' ? postId : null,
          news_id: post.type === 'news' ? postId : null
        });
        if (notifError) {
          console.error("❌ Error enviando notificación de comentario:", notifError, { recipientId, postId, type: post.type });
        }
      }
      await fetchNotifications();
      await processMentions(text, postId, null, 'comentario');
    }

  };

  const handleAddReply = async (commentId: string, text: string, parentReplyId?: string) => {
    if (!session?.user) {
      console.error("No session user found for reply");
      return null;
    }
    const isTempId = (id?: string) => !!id?.startsWith('temp-');
    if (isTempId(commentId) || isTempId(parentReplyId)) {
      console.error('Cannot save reply using temporary id', { commentId, parentReplyId });
      alert('Error al guardar respuesta: espera a que el comentario o respuesta anterior se guarde antes de continuar.');
      return null;
    }
    // Generate UUID client-side so realId is always known regardless of RLS SELECT policy
    const newReplyId = (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    const payload: any = {
      id: newReplyId,
      comment_id: commentId,
      author_id: session.user.id,
      text
    };
    if (parentReplyId) payload.parent_reply_id = parentReplyId;

    const { error } = await supabase.from('comment_replies').insert(payload);

    if (error) {
      console.error("❌ Error adding reply:", error);
      alert("Error al guardar respuesta: " + error.message);
    } else {

      // Find who we're replying to — query Supabase directly since global posts state
      // does not populate commentsList (comments are only loaded in PostDetailView).
      let recipientId: string | null = null;
      let notificationPostId: string | null = null;
      let notificationNewsId: string | null = null;
      let notificationContent = "ha respondido a tu comentario";

      if (parentReplyId) {
        // Reply to another reply — find the parent reply's author in comment_replies
        const { data: parentReplyData } = await supabase
          .from('comment_replies')
          .select('author_id, comment_id')
          .eq('id', parentReplyId)
          .maybeSingle();

        if (parentReplyData) {
          recipientId = parentReplyData.author_id;
          notificationContent = "ha respondido tu comentario";
          // Resolve post_id/news_id from the root comment
          const { data: pc } = await supabase
            .from('post_comments')
            .select('post_id')
            .eq('id', parentReplyData.comment_id)
            .maybeSingle();
          if (pc) {
            notificationPostId = pc.post_id;
          } else {
            const { data: nc } = await supabase
              .from('news_comments')
              .select('news_id')
              .eq('id', parentReplyData.comment_id)
              .maybeSingle();
            if (nc) notificationNewsId = nc.news_id;
          }
        }
      } else {
        // Direct reply to a comment — try post_comments first, then news_comments
        const { data: pcData } = await supabase
          .from('post_comments')
          .select('author_id, post_id')
          .eq('id', commentId)
          .maybeSingle();

        if (pcData) {
          recipientId = pcData.author_id;
          notificationPostId = pcData.post_id;
        } else {
          const { data: ncData } = await supabase
            .from('news_comments')
            .select('author_id, news_id')
            .eq('id', commentId)
            .maybeSingle();
          if (ncData) {
            recipientId = ncData.author_id;
            notificationNewsId = ncData.news_id;
          }
        }
      }

      if (recipientId && recipientId !== session.user.id) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          sender_id: session.user.id,
          type: 'comment',
          content: notificationContent,
          post_id: notificationPostId,
          news_id: notificationNewsId
        });
      }

      // Process mentions in replies
      await processMentions(text, null, null, 'comentario');

      // Optimistic counter update for the parent post/news
      const targetPostId = notificationPostId || notificationNewsId;
      if (targetPostId) {
        updateAllFeeds(prev => prev.map(p => p.id === targetPostId ? { ...p, comments: (p.comments || 0) + 1 } : p));
      }

      fetchFeed();
      return newReplyId;
    }
    return null;
  };

  const handleVote = async (id: string, dir: 'up' | 'down') => {
    if (isVoting || !session?.user) return;

    const post = await resolvePostOrNews(id);
    if (!post) {
      console.warn('Post not found for DB update:', id);
      return;
    }

    const isNews = post.type === 'news';
    setIsVoting(true);

    // Optimistic Update: Update all feeds
    // Determine current logical state from global markers
    const currentVote = (isNews && votedUpIds.has(id)) || (!isNews && likedIds.has(id)) ? 'up' : (votedDownIds.has(id) ? 'down' : null);
    const isTogglingOff = currentVote === dir;

    const updater = (prev: Post[]) => prev.map(p => {
      if (p.id === id) {
        let newLikes = p.likes || 0;
        let newUpvotes = p.upvotes !== undefined ? p.upvotes : p.likes;
        let newDownvotes = p.downvotes || 0;

        if (isTogglingOff) {
          // Toggle off
          if (dir === 'up') { newLikes -= 1; newUpvotes -= 1; }
          else if (dir === 'down') { newDownvotes -= 1; }
        } else {
          // Switching vote or new vote
          if (currentVote === 'up') { newLikes -= 1; newUpvotes -= 1; }
          if (currentVote === 'down') { newDownvotes -= 1; }
          
          if (dir === 'up') { newLikes += 1; newUpvotes += 1; }
          if (dir === 'down') { newDownvotes += 1; }
        }

        return { 
          ...p, 
          likes: Math.max(0, newLikes), 
          upvotes: Math.max(0, newUpvotes), 
          downvotes: Math.max(0, newDownvotes),
          userLiked: !isTogglingOff && dir === 'up', 
          userDownvoted: !isTogglingOff && dir === 'down' 
        };
      }
      return p;
    });

    updateAllFeeds(updater);

    // Update global markers with mutual exclusion
    if (isNews) {
      setVotedUpIds(prev => {
        const next = new Set(prev);
        if (dir === 'up') {
          if (isTogglingOff) next.delete(id); else next.add(id);
        } else {
          next.delete(id); // Downvote removes upvote
        }
        return next;
      });
      setVotedDownIds(prev => {
        const next = new Set(prev);
        if (dir === 'down') {
          if (isTogglingOff) next.delete(id); else next.add(id);
        } else {
          next.delete(id); // Upvote removes downvote
        }
        return next;
      });
    } else {
      setLikedIds(prev => {
        const next = new Set(prev);
        if (dir === 'up') {
          if (isTogglingOff) next.delete(id); else next.add(id);
        } else {
          next.delete(id); // Post downvote removes heart
        }
        return next;
      });
      setVotedDownIds(prev => {
        const next = new Set(prev);
        if (dir === 'down') {
          if (isTogglingOff) next.delete(id); else next.add(id);
        } else {
          next.delete(id); // Post upvote removes downvote
        }
        return next;
      });
    }

    try {
      const table = isNews ? 'news_votes' : 'post_likes';
      const idField = isNews ? 'news_id' : 'post_id';

      const { data: existingVote } = await supabase.from(table).select('*').eq('user_id', session.user.id).eq(idField, id).maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === dir) {
          await supabase.from(table).delete().eq('user_id', session.user.id).eq(idField, id);
        } else {
          await supabase.from(table).update({ vote_type: dir }).eq('user_id', session.user.id).eq(idField, id);
        }
      } else {
        await supabase.from(table).insert({ user_id: session.user.id, [idField]: id, vote_type: dir });

        // Notify author if it's an upvote
        const postAuthorId = await resolveNotificationRecipient(id, isNews ? 'news' : 'post');
        if (dir === 'up' && postAuthorId && postAuthorId !== session.user.id) {
          const notifIdField = isNews ? 'news_id' : 'post_id';
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', postAuthorId)
            .eq('sender_id', session.user.id)
            .eq(notifIdField, id)
            .eq('type', 'like')
            .maybeSingle();

          if (existingNotif) {
            await supabase
              .from('notifications')
              .update({ is_read: false, created_at: new Date().toISOString() })
              .eq('id', existingNotif.id);
          } else {
            const { error: notifError } = await supabase.from('notifications').insert({
              user_id: postAuthorId,
              sender_id: session.user.id,
              type: 'like',
              content: isNews ? 'ha dado flecha arriba a tu noticia' : 'ha dado me gusta a tu post',
              post_id: !isNews ? id : null,
              news_id: isNews ? id : null
            });
            if (notifError) {
              console.error('❌ Error enviando notificación de like:', notifError, { postAuthorId, id, isNews });
            }
          }
        }
      }
      await fetchNotifications();
    } catch (error) {
      console.error('Error in handleVote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!session?.user) return;

    // Optimistic update for all feeds
    updateAllFeeds(prev => prev.map(post => ({
      ...post,
      commentsList: (post.commentsList || []).map(comment => {
        if (comment.id === commentId) {
          const newUserLiked = !comment.userLiked;
          return {
            ...comment,
            userLiked: newUserLiked,
            likes: (comment.likes || 0) + (newUserLiked ? 1 : -1)
          };
        }
        return comment;
      })
    })));

    try {
      const { data: existingLike, error: fetchError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('comment_id', commentId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingLike) {
        const { error: deleteError } = await supabase.from('comment_likes').delete().eq('id', existingLike.id);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase.from('comment_likes').insert({
          user_id: session.user.id,
          comment_id: commentId
        });
        if (insertError) throw insertError;
      }

      // Update DB counter
      await supabase.rpc('fn_adjust_comment_likes', { p_comment_id: commentId, p_delta: existingLike ? -1 : 1 });
    } catch (error: any) {
      console.error('❌ Error in handleLikeComment:', error);
      fetchFeed();
      alert("Error al guardar el like: " + (error.message || "Desconocido"));
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!session?.user) return;
    if (!replyId || replyId.startsWith('temp-')) return;

    // Recursive helper to update reply in nested tree
    const updateReplyInTree = (replies: any[]): any[] => {
      return replies.map(reply => {
        if (reply.id === replyId) {
          const newUserLiked = !reply.userLiked;
          return {
            ...reply,
            userLiked: newUserLiked,
            likes: (reply.likes || 0) + (newUserLiked ? 1 : -1)
          };
        }
        if (reply.replies && reply.replies.length > 0) {
          return {
            ...reply,
            replies: updateReplyInTree(reply.replies)
          };
        }
        return reply;
      });
    };

    // Optimistic update for all feeds
    updateAllFeeds(prev => prev.map(post => ({
      ...post,
      commentsList: (post.commentsList || []).map(comment => ({
        ...comment,
        replies: updateReplyInTree(comment.replies || [])
      }))
    })));

    try {
      // Fetch existing like and reply info in parallel
      const [existingLikeRes, replyInfoRes] = await Promise.all([
        supabase.from('comment_likes').select('id').eq('user_id', session.user.id).eq('reply_id', replyId).maybeSingle(),
        supabase.from('comment_replies').select('likes, comment_id').eq('id', replyId).single(),
      ]);

      if (existingLikeRes.error) throw existingLikeRes.error;

      const existingLike = existingLikeRes.data;
      const replyRow = replyInfoRes.data;

      if (existingLike) {
        const { error: deleteError } = await supabase.from('comment_likes').delete().eq('id', existingLike.id);
        if (deleteError) throw deleteError;
        await supabase.from('comment_replies').update({ likes: Math.max(0, (replyRow?.likes || 1) - 1) }).eq('id', replyId);
      } else {
        const { error: insertError } = await supabase.from('comment_likes').insert({
          user_id: session.user.id,
          reply_id: replyId
        });
        if (insertError) throw insertError;
        await supabase.from('comment_replies').update({ likes: (replyRow?.likes || 0) + 1 }).eq('id', replyId);

        // Notify author
        const allReplies = [...posts, ...followingPosts, ...profilePosts].flatMap(p => (p.commentsList || []).flatMap(c => c.replies || []));
        const findInTree = (replies: any[]): any => {
          for (const r of replies) {
            if (r.id === replyId) return r;
            if (r.replies && r.replies.length > 0) {
              const found = findInTree(r.replies);
              if (found) return found;
            }
          }
          return null;
        };
        const reply = findInTree(allReplies);


        if (reply && reply.authorId && reply.authorId !== session.user.id) {
          // Nota: Como no hay columna reply_id en notifications, usamos el contenido para deduplicar 
          // las notificaciones de likes en respuestas para el mismo autor y emisor.
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', reply.authorId)
            .eq('sender_id', session.user.id)
            .eq('type', 'like')
            .eq('content', 'ha dado me gusta a tu respuesta')
            .maybeSingle();

          if (existingNotif) {
            await supabase
              .from('notifications')
              .update({ is_read: false, created_at: new Date().toISOString() })
              .eq('id', existingNotif.id);
          } else {
            await supabase.from('notifications').insert({
              user_id: reply.authorId,
              sender_id: session.user.id,
              type: 'like',
              content: 'ha dado me gusta a tu respuesta',
              post_id: null
            });
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error in handleLikeReply:', error);
      fetchFeed();
      alert("Error al guardar el like en respuesta: " + (error.message || "Desconocido"));
    }
  };

  const handleRepost = async (id: string) => {
    if (!session?.user) return;
    const post = await resolvePostOrNews(id);
    if (!post) {
      console.warn('Post not found for repost:', id);
      return;
    }

    const isNews = post.type === 'news';
    const idField = isNews ? 'news_id' : 'post_id';

    // Determine current state from global markers
    const isCurrentlyReposted = repostedIds.has(id);
    
    // Optimistic Update
    updateAllFeeds(prev => prev.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          reposts: Math.max(0, (p.reposts || 0) + (isCurrentlyReposted ? -1 : 1)), 
          userReposted: !isCurrentlyReposted 
        };
      }
      return p;
    }));

    setRepostedIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyReposted) next.delete(id); else next.add(id);
      return next;
    });

    try {
      const { data: existing } = await supabase
        .from('reposts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq(idField, id)
        .maybeSingle();

      if (existing) {
        await supabase.from('reposts').delete().eq('id', existing.id);
        // Opcional: Eliminar la notificación de repost si se deshace
        await supabase.from('notifications').delete().eq('sender_id', session.user.id).eq(idField, id).eq('type', 'repost');
      } else {
        await supabase.from('reposts').insert({
          user_id: session.user.id,
          [idField]: id
        });

        // Notify author
        const postAuthorId = await resolveNotificationRecipient(id, isNews ? 'news' : 'post');
        if (postAuthorId && postAuthorId !== session.user.id) {
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', postAuthorId)
            .eq('sender_id', session.user.id)
            .eq(idField, id)
            .eq('type', 'repost')
            .maybeSingle();

          if (existingNotif) {
            await supabase
              .from('notifications')
              .update({ is_read: false, created_at: new Date().toISOString() })
              .eq('id', existingNotif.id);
          } else {
            const { error: notifError } = await supabase.from('notifications').insert({
              user_id: postAuthorId,
              sender_id: session.user.id,
              type: 'repost',
              content: post.type === 'news' ? 'ha compartido tu noticia' : 'ha compartido tu publicación',
              post_id: post.type !== 'news' ? id : null,
              news_id: post.type === 'news' ? id : null
            });
            if (notifError) {
              console.error('❌ Error enviando notificación de repost:', notifError, { postAuthorId, id, type: post.type });
            }
          }
        }
      }
      await fetchNotifications();
    } catch (error) {
      console.error('Error in handleRepost:', error);
    }
  };

  const handleSearchHashtag = (tag: string) => {
    setSearchQuery(tag);
    // Usamos el formato ?=#hashtag para que sea visualmente limpio
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    navigate(`/buscar?=${cleanTag}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNotificationClick = async (postId?: string, senderId?: string, type?: string, newsId?: string) => {
    if (type === 'registration_request' && senderId) {
      handleViewRegistrationData(senderId);
      return;
    }
    
    const targetId = postId || newsId;
    if (!targetId) return;

    // Check if post exists, if not we could fetch it, but for now we navigate
    // handleNavigateToPost will check the type to choose the route
    
    // To ensure handleNavigateToPost works even if not loaded:
    if (newsId) {
      navigate(`/noticias/${newsId}`);
    } else {
      navigate(`/inicio/${targetId}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePost = async (postId: string) => {
    if (!session?.user) return;
    const post = await resolvePostOrNews(postId);
    if (!post) return;

    // Optimistic delete
    updateAllFeeds(prev => prev.filter(p => p.id !== postId));
    localStorage.removeItem('weekly_trends_cache');

    // OPTIMISTIC TRENDS UPDATE: Decrement tags if present (or extract from content as fallback)
    const tagsToDecrement = (post.tags && post.tags.length > 0)
      ? post.tags
      : (post.content?.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map((t: string) => t.slice(1)) || []);

    if (tagsToDecrement.length > 0) {
      setWeeklyTrends(prev => {
        if (!prev) return prev;
        return prev.map(item => {
          const lowerTag = item.tag.toLowerCase();
          const isMatching = tagsToDecrement.some((pt: string) => pt.toLowerCase() === lowerTag);
          if (isMatching) {
            return { ...item, count: Math.max(0, item.count - 1) };
          }
          return item;
        }).filter(item => item.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      });
    }

    const { error } = await supabase.rpc('fn_delete_post_secure', {
      p_post_id: postId,
      p_author_id: session.user.id,
      p_type: post.type
    });

    if (!error) {
      const isPostDetail = location.pathname.startsWith('/inicio/') || location.pathname.startsWith('/noticias/');
      if (isPostDetail && location.pathname.includes(postId)) {
        navigate(post.type === 'news' ? '/noticias' : '/inicio');
      }
      // Wait a bit more for DB consistency on delete
      setTimeout(() => fetchWeeklyTrends(true), 3500);
    } else {
      console.error('Error deleting post:', error.message);
      showToast('Error al eliminar el post: ' + error.message, 'error');
      // If error, we should probably fetchFeed to restore
      fetchFeed();
    }
  };


  const handleTogglePin = async (postId: string) => {
    if (!session?.user) return;
    const post = await resolvePostOrNews(postId);
    if (!post) return;

    const isPinned = !post.isPinned;
    const table = post.type === 'news' ? 'news' : 'posts';

    // Optimistic sync
    updateAllFeeds(prev => prev.map(p => p.id === postId ? { ...p, isPinned, pinnedAt: isPinned ? new Date().toISOString() : null } : p));

    const { error } = await supabase
      .from(table)
      .update({
        is_pinned: isPinned,
        pinned_at: isPinned ? new Date().toISOString() : null
      })
      .eq('id', postId)
      .eq('author_id', session.user.id);

    if (error) {
      console.error('Error toggling pin:', error.message);
      showToast('Error al fijar el post', 'error');
      fetchFeed();
    }
  };


  const handleSendMessage = useCallback(async (recipientId: string, text: string, postId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => {
    if (!session?.user) return;
    
    const table = scheduledAt ? 'scheduled_messages' : 'messages';
    const deliveryField = scheduledAt ? { deliver_at: scheduledAt.toISOString() } : {};

    const { error } = await supabase.from(table).insert({
      sender_id: session.user.id,
      recipient_id: recipientId,
      text,
      post_id: postId || null,
      news_id: newsId || null,
      shared_profile_id: sharedProfileId || null,
      shared_event_id: sharedEventId || null,
      image_url: imageUrls || [],
      ...deliveryField
    });
    
    if (!error && !scheduledAt) fetchChats();
    else if (error) {
      console.error('Error sending/scheduling message:', error.message);
      alert('Error al enviar/programar el mensaje: ' + error.message);
    }
  }, [session?.user?.id, fetchChats]);

  const handleEditMessage = async (recipientId: string, messageId: string, text: string) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('messages')
      .update({ text, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', session.user.id);

    if (!error) {
      await fetchChats();
    } else {
      console.error('Error editing message:', error.message);
      alert('Error al editar el mensaje: ' + error.message);
      throw error;
    }
  };

  const handleDeleteMessage = async (recipientId: string, messageId: string) => {
    if (!session?.user) return;
    if (messageId.startsWith('optimistic-')) return;
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', session.user.id);

    if (!error) {
      await fetchChats();
    } else {
      console.error('Error deleting message:', error.message);
      alert('Error al eliminar el mensaje: ' + error.message);
    }
  };

  const handleMarkChatAsRead = useCallback(async (chatId: string) => {
    if (!session?.user) return;
    // Update local state immediately so the badge disappears at once
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      return {
        ...c,
        lastMessageIsRead: true,
        messages: c.messages.map(m =>
          m.senderId === chatId && !m.isRead ? { ...m, isRead: true } : m
        ),
      };
    }));
    // Persist to DB — must be awaited so Supabase executes the query and fires the UPDATE event
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_id', session.user.id)
      .eq('sender_id', chatId)
      .eq('is_read', false);
  }, [session?.user?.id]);

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    const trimmed = query.trim();
    // Navegación con formato ?=valor o ?=#hashtag
    navigate(`/buscar?=${trimmed}`);
  };

  const handleStartChat = (targetUser: User) => {
    setActiveChatUserId(targetUser.id);
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
    const username = targetUser.username;
    const safeUsername = (username && !isUUID(username)) ? username : (targetUser.name && !isUUID(targetUser.name) ? targetUser.name.toLowerCase().replace(/\s/g, '') : targetUser.id);
    navigate(`/mensajes/${safeUsername}`);
  };

  const handleLogout = async () => {
    const userCacheKeys = [
      'cached_user_profile', 'cached_user_profile_ts',
      'last_known_feed', 'last_known_following_feed', 'last_known_news',
      'last_known_users', 'followed_user_ids',
      'post_liked_ids', 'reposted_ids',
      'news_voted_up', 'news_voted_down', 'news_vote_counts',
      'author_manifest', 'event_manifest',
      'weekly_trends_cache',
      'chat_inline_posts_seed', 'chat_shared_events_seed', 'chat_shared_profiles_seed',
      'remember_me_until', 'remember_me_session',
    ];
    userCacheKeys.forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem(SESSION_ALIVE_KEY);
    await supabase.auth.signOut();
  };

  const getNextDeletedUsername = async (): Promise<string> => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', 'userdeleted%');
    const usedNumbers = new Set(
      (data || [])
        .map(p => parseInt((p.username || '').replace('userdeleted', ''), 10))
        .filter(n => !isNaN(n))
    );
    let n = 1;
    while (usedNumbers.has(n)) n++;
    return `userdeleted${n}`;
  };

  const handleUpdateUser = async (updatedUser: User) => {
    // Actualización optimista en memoria para que la imagen de perfil cambie al instante
    setCurrentUserData(prev => {
      if (!prev || prev.id !== updatedUser.id) return prev;
      return { ...prev, ...updatedUser };
    });

    // Actualizar también la lista de usuarios en memoria
    setUsers(prev =>
      prev.map(u => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );

    // Actualizar avatar del participante en los chats existentes
    setChats(prev =>
      prev.map(chat =>
        chat.participant.id === updatedUser.id
          ? {
              ...chat,
              participant: {
                ...chat.participant,
                avatar: updatedUser.avatar,
                name: updatedUser.name,
                lastName: updatedUser.lastName,
                username: updatedUser.username,
              },
            }
          : chat
      )
    );

    // Actualizar avatar del autor en los posts ya cargados
    updateAllFeeds(prev =>
      prev.map(p =>
        p.authorId === updatedUser.id
          ? {
              ...p,
              authorAvatar: updatedUser.avatar,
              authorName: `${updatedUser.name} ${updatedUser.lastName || ''}`,
              authorUsername:
                updatedUser.username ||
                updatedUser.name.toLowerCase().replace(/\s/g, ''),
            }
          : p
      )
    );

    // Actualizar todos los campos en public.profiles para asegurar la persistencia
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updatedUser.name,
        last_name: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar || null,
        birth_date: updatedUser.birthDate || null,
        position: updatedUser.position || null,
        institution: updatedUser.institution || null,
        job_category: updatedUser.jobCategory || null,
        administration_type: updatedUser.administrationType || null,
        country: updatedUser.country || 'España',
        region: updatedUser.region || null,
        is_organization: updatedUser.isOrganization || false,
        gender: updatedUser.gender,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        linked_organization_id: updatedUser.linkedOrganizationId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedUser.id);

    if (error) {
      console.error('Profile update error details:', JSON.stringify(error));
      // En caso de error, recargar desde la BD para no dejar un estado inconsistente
      await fetchUserProfile(updatedUser.id);
      throw error;
    }

    // Sincronizar campos core con id.users
    const { error: idError } = await supabase
      .schema('id')
      .from('users')
      .update({
        name: updatedUser.name,
        last_name: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar || null,
        birth_date: updatedUser.birthDate || null,
        position: updatedUser.position || null,
        institution: updatedUser.institution || null,
        job_category: updatedUser.jobCategory || null,
        administration_type: updatedUser.administrationType || null,
        country: updatedUser.country || 'España',
        region: updatedUser.region || null,
        is_organization: updatedUser.isOrganization || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedUser.id);
    if (idError) {
      console.error('Error syncing id.users on profile update:', idError);
    }

    // Refrescar desde la BD para asegurarnos de que todo queda sincronizado
    // (force=true para saltar la caché de 60s y actualizar localStorage con los
    // intereses nuevos; si no, al refrescar la página se rehidrata de caché vieja).
    await fetchUserProfile(updatedUser.id, true);
  };

  const handlePromoteEvent = (event: CalendarEvent) => {
    if (!session?.user) return;
    const eventTag = (event.title || '')
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
    navigate('/inicio', {
      state: {
        initialContent: `¡Mira este evento! #${eventTag}`,
        prefilledEvent: event
      }
    });
  };

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      if (q !== searchQuery) setSearchQuery(q);
    } else if (['/inicio', '/noticias'].includes(location.pathname)) {
      setSearchQuery('');
    }
  }, [location.pathname, searchParams]); // REMOVED searchQuery from dependencies to prevent clearing while typing
  /* eslint-disable-next-line react-hooks/exhaustive-deps */

  const handleMarkNotificationsRead = useCallback(async (tab?: string, adminSubTab?: string) => {
    if (!session?.user || !tab) return;

    let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);

    if (tab === 'mentions') {
      query = query.eq('type', 'mention');
    } else if (tab === 'followers') {
      query = query.eq('type', 'follow');
    } else if (tab === 'all') {
      // Inclusivize: Mark as read everything that appears in 'all' tab.
      // EXCLUDE strictly what goes into the Admin tab (pending requests)
      query = query.not('type', 'in', '("registration_request","reward_request")')
        .not('content', 'ilike', '%Solicitud de%')
        .not('content', 'ilike', '%Canje de%');
      // Resolved ones (containing "(aceptado)") won't have these exact strings or will be handled
      // by the fact they are now considered 'social' notifications for the user.
    } else if (tab === 'admin') {
      if (adminSubTab === 'solicitudes') {
        query = query.or('type.eq.registration_request,and(type.eq.system,or(content.ilike.%solicitud%,content.ilike.%aprobado%,content.ilike.%rechazado%),content.not.ilike.%canje%)');
      } else if (adminSubTab === 'recompensas') {
        query = query.or('type.eq.reward_request,and(type.eq.system,content.ilike.%solicitud de canje%)');
      } else {
        query = query.or('type.eq.registration_request,type.eq.reward_request,and(type.eq.system,or(content.ilike.%solicitud%,content.ilike.%canje%),content.not.ilike.%aceptado%,content.not.ilike.%rechazado%)');
      }
    } else if (tab === 'rewards') {
      query = query.or('type.eq.reward_request,type.eq.reward_accepted,content.ilike.%canje%,content.ilike.%novas%,content.ilike.%insignia%,content.ilike.%enhorabuena%,content.ilike.%earned%,content.ilike.%has ganado%');
    }

    const { error } = await query;
    if (error) {
      console.error('[handleMarkNotificationsRead] Error:', error.message);
    } else {
      fetchNotifications();
    }
  }, [session?.user?.id, fetchNotifications]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeLocalStorageSet('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (session?.user) {
      // Run in parallel — both are lightweight and independent
      // force=true: on every session load (incl. refresh), re-check the profile from DB
      // so privileged fields like is_admin, status, is_banned reflect any admin change made server-side.
      fetchUserProfile(session.user.id, true);
      fetchFollows();
    }
  }, [session, fetchUserProfile, fetchFollows]);

  // Clave estable de intereses para invalidar el feed cuando cambian.
  const interestsKey = React.useMemo(
    () => (currentUserData?.interests || []).slice().sort().join('|'),
    [currentUserData?.interests]
  );
  const lastInterestsKeyRef = React.useRef<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    const FEED_STALE_MS = 5 * 60 * 1000; // 5 minutos

    const syncFeed = async () => {
      if (!session?.user) return;
      // If profile not ready yet, wait briefly and retry once
      const isProfileReady = hasCheckedProfile || !!currentUserData;
      if (!isProfileReady) {
        await new Promise(r => setTimeout(r, 800));
        if (!isSubscribed) return;
      }

      // Skip feed fetch if user is not viewing the feed — avoids saturating Supabase free tier
      // Check location.pathname directly to avoid race conditions with currentView state updates
      const path = window.location.pathname;
      const isFeedPath = path === '/inicio' || path === '/' || path.startsWith('/noticias');
      if (!isFeedPath || (currentView !== 'feed' && currentView !== 'news')) return;

      // Si cambiaron los intereses desde la última ejecución, invalidamos la
      // caché de frescura para forzar un re-fetch con el nuevo filtro.
      const interestsChanged = lastInterestsKeyRef.current !== null && lastInterestsKeyRef.current !== interestsKey;
      if (interestsChanged) {
        tabLastFetchedRef.current['for-you'] = 0;
        tabLastFetchedRef.current['following'] = 0;
      }
      lastInterestsKeyRef.current = interestsKey;

      const tabKey = activeTab === 'following' ? 'following' : 'for-you';
      const lastFetched = tabLastFetchedRef.current[tabKey] || 0;
      const age = Date.now() - lastFetched;
      const relevantType = currentView === 'news' ? 'news' : 'post';
      const hasData = activeTab === 'following'
        ? followingPosts.filter(p => p.type === relevantType).length > 0
        : posts.filter(p => p.type === relevantType).length > 0;

      // Skip if data is fresh and already loaded — prevents re-fetch on every tab switch
      if (hasData && age < FEED_STALE_MS && !interestsChanged) {
        return;
      }

      if (!hasData) {
        setIsLoadingFeed(true);
      }

      try {
        if (activeTab === 'following') {
          // Use cached followedUserIds from localStorage (already in ref) for instant fetch.
          // If ref is empty, fetch follows from DB first.
          let followed = followedUserIdsRef.current;
          if (followed.size === 0) {
            const result = await fetchFollows();
            followed = result.followed;
          }
          if (isSubscribed) await fetchFeed(0, 'post', undefined, true, followed, false, true, 'following');
        } else if (currentView === 'news') {
          // News hub: only news
          if (isSubscribed) await fetchFeed(0, 'news', undefined, false, undefined, false, true, 'for-you');
        } else {
          // Home feed: only posts — news are loaded separately when user opens /noticias
          if (isSubscribed) await fetchFeed(0, 'post', undefined, false, undefined, false, true, 'for-you');
        }

        // Prefetch del OTRO tab en segundo plano para que el cambio sea instantáneo.
        // Sólo si el otro tab no tiene datos aún y el usuario está en el feed.
        if (isSubscribed && currentView === 'feed') {
          const otherTab = activeTab === 'following' ? 'for-you' : 'following';
          const otherTabKey = otherTab;
          const otherHasData = otherTab === 'following'
            ? followingPosts.filter(p => p.type === 'post').length > 0
            : posts.filter(p => p.type === 'post').length > 0;
          const otherLastFetched = tabLastFetchedRef.current[otherTabKey] || 0;
          const otherFresh = Date.now() - otherLastFetched < FEED_STALE_MS;
          if (!otherHasData && !otherFresh) {
            if (otherTab === 'following') {
              let followed = followedUserIdsRef.current;
              if (followed.size === 0) {
                const result = await fetchFollows();
                followed = result.followed;
              }
              fetchFeed(0, 'post', undefined, true, followed, false, true, 'following').catch(() => {});
            } else {
              fetchFeed(0, 'post', undefined, false, undefined, false, true, 'for-you').catch(() => {});
            }
          }
        }
      } catch (e) {
        console.error("Error en syncFeed:", e);
      } finally {
        if (isSubscribed) setIsLoadingFeed(false);
      }
    };

    syncFeed();
    return () => { isSubscribed = false; };
  }, [activeTab, session?.user?.id, hasCheckedProfile, currentView, interestsKey]);

  // One-time Cleanup of potentially corrupted localStorage feed data
  useEffect(() => {
    const hasCleaned = sessionStorage.getItem('feed_cache_cleaned_v2');
    if (!hasCleaned) {
      localStorage.removeItem('last_known_feed');
      localStorage.removeItem('last_known_news');
      localStorage.removeItem('last_known_following_feed');
      sessionStorage.setItem('feed_cache_cleaned_v2', 'true');
      console.log('🧹 Feed cache cleaned to prevent news/posts mixing.');
      // After cleaning, trigger a fresh fetch if we are in a feed view
      if (currentView === 'feed' || currentView === 'news') {
        fetchFeed(0, currentView === 'news' ? 'news' : 'post');
      }
    }
  }, [currentView, fetchFeed]);

  // Fetch news on demand when /noticias is visited and news are not yet loaded.
  const handleFetchNews = useCallback(async () => {
    // If cached news is already visible, mark as fetched immediately and refresh in background
    setPosts(current => {
      const hasCached = current.some(p => p.type === 'news');
      if (hasCached) setNewsFeedFetched(true);
      return current;
    });
    await fetchFeed(0, 'news', undefined, false, undefined, false, true, 'for-you');
  }, [fetchFeed]);

  const handleTabChange = useCallback((tab: 'for-you' | 'following' | 'admin') => {
    if (tab === 'following' && followingPosts.length === 0) {
      setIsLoadingFeed(true);
      setFeedFetched(false); // reset so "No hay publicaciones" doesn't flash before fetch completes
    } else if (tab === 'for-you' && posts.length === 0) {
      setIsLoadingFeed(true);
      setFeedFetched(false);
    }
    setActiveTab(tab);
  }, [followingPosts.length, posts.length]);



  // Fire immediately on mount for cached data, then re-fetch when session is ready
  useEffect(() => {
    fetchGlobalEvents();
  }, [fetchGlobalEvents]);

  // Re-fetch events once authenticated in case the initial call ran unauthenticated (RLS)
  useEffect(() => {
    if (session?.user?.id) {
      fetchGlobalEvents(true);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user && hasCheckedProfile) {
      // SEQUENTIAL LOADING: Spread queries over time to avoid saturating Supabase free tier.
      // Each group waits for the previous to finish before starting.
      const timer1 = setTimeout(() => {
        fetchNotifications();
      }, 0);

      const timer1a = setTimeout(() => {
        fetchWeeklyTrends();
      }, 0);

      const timer2 = setTimeout(() => {
        fetchUsers();
      }, 0);

      const timer3 = setTimeout(() => {
        // Group C (0ms): Chats — sidebar is pre-loaded from cache; DB fetch refreshes it
        fetchChats();
      }, 0);

      const timer3b = setTimeout(() => {
        // Needed immediately so the rewards UI can render "Solicitado"/"Canjeado"
        // on refresh without a 15s delay.
        fetchUserRedemptions();
      }, 0);

      const timer4 = setTimeout(() => {
        // Group D (15s): Store catalog (lowest priority)
        fetchStoreRewards();
      }, 15000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer1a);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer3b);
        clearTimeout(timer4);
      };
    }
  }, [session?.user?.id, hasCheckedProfile, fetchUsers, fetchFollows, fetchUserRedemptions, fetchNotifications, fetchStoreRewards, fetchWeeklyTrends, fetchChats]);

  useEffect(() => {
    if (session?.user && users.length > 0) {
      const timer = setTimeout(() => {
        fetchChats();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [session?.user?.id, users.length, fetchChats]);

  // Keep ref in sync so realtime callbacks always see the current active chat
  useEffect(() => {
    activeChatUserIdRef.current = activeChatUserId;
  }, [activeChatUserId]);

  // Stable refs so the messages realtime channel never has stale closures
  const fetchChatsRef = useRef(fetchChats);
  const fetchChatMessagesRef = useRef(fetchChatMessages);
  useEffect(() => { fetchChatsRef.current = fetchChats; }, [fetchChats]);
  useEffect(() => { fetchChatMessagesRef.current = fetchChatMessages; }, [fetchChatMessages]);

  // Dedicated, always-alive subscription for messages — never torn down on navigation
  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    const msgChannel = supabase
      .channel(`messages_realtime_${userId}`)
      .on('postgres_changes' as any, { event: 'INSERT', table: 'messages', schema: 'public' } as any, (payload: any) => {
        const raw = payload.new;
        if (!raw) return;
        // Only handle messages involving this user
        const isIncoming = raw.recipient_id === userId;
        const isOutgoing = raw.sender_id === userId;
        if (!isIncoming && !isOutgoing) return;

        const otherId = isIncoming ? raw.sender_id : raw.recipient_id;
        const newMsg: Message = {
          id: raw.id,
          senderId: raw.sender_id,
          recipientId: raw.recipient_id,
          text: raw.text || '',
          timestamp: new Date(raw.created_at),
          isRead: raw.is_read,
          postId: raw.post_id || undefined,
          newsId: raw.news_id || undefined,
          isPostShare: !!(raw.post_id || raw.news_id),
          sharedProfileId: raw.shared_profile_id || undefined,
          sharedEventId: raw.shared_event_id || undefined,
          imageUrl: raw.image_url || [],
          updated_at: raw.updated_at,
          is_deleted: raw.is_deleted,
        };

        setChats(prev => {
          const idx = prev.findIndex(c => c.id === otherId);
          if (idx < 0) {
            // New conversation — fetch to build participant data, but don't block
            setTimeout(() => fetchChatsRef.current(), 0);
            return prev;
          }
          const chat = prev[idx];
          // Skip duplicate (e.g. sender already applied optimistic update)
          if (chat.messages?.some(m => m.id === newMsg.id)) return prev;
          const updatedChat: Chat = {
            ...chat,
            messages: [...(chat.messages || []), newMsg], // ascending: oldest→newest
            lastMessage: newMsg.text || (newMsg.imageUrl && newMsg.imageUrl.length > 0 ? 'Imagen' : ''),
            timestamp: newMsg.timestamp,
            lastMessageSenderId: newMsg.senderId,
            lastMessageIsRead: raw.is_read,
          };
          const rest = prev.filter((_, i) => i !== idx);
          return [updatedChat, ...rest];
        });
      })
      .on('postgres_changes' as any, { event: 'UPDATE', table: 'messages', schema: 'public' } as any, (payload: any) => {
        const raw = payload.new;
        if (!raw) return;
        if (raw.sender_id !== userId && raw.recipient_id !== userId) return;
        setChats(prev => prev.map(chat => {
          const otherId = raw.sender_id === userId ? raw.recipient_id : raw.sender_id;
          if (chat.id !== otherId) return chat;
          // Patch message in array (may be empty if chat not yet opened — that's fine)
          const updatedMessages = chat.messages.map(m =>
            m.id === raw.id
              ? { ...m, isRead: raw.is_read, text: raw.text ?? m.text, is_deleted: raw.is_deleted ?? m.is_deleted, updated_at: raw.updated_at }
              : m
          );
          const last = updatedMessages[updatedMessages.length - 1];
          // Always update lastMessageIsRead from payload so the chat list reflects reality
          // even when messages[] is empty (lazy-loaded)
          const newLastRead = raw.is_read !== undefined
            ? (last ? last.isRead : raw.is_read)
            : chat.lastMessageIsRead;
          return {
            ...chat,
            messages: updatedMessages,
            lastMessageIsRead: newLastRead,
          };
        }));
      })
      .on('postgres_changes' as any, { event: 'DELETE', table: 'messages', schema: 'public' } as any, () => {
        fetchChatsRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(msgChannel); };
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user) {
      // Throttle timers — prevents burst of Realtime events from firing multiple fetchFeed calls
      let feedThrottleTimer: ReturnType<typeof setTimeout> | null = null;
      let trendsThrottleTimer: ReturnType<typeof setTimeout> | null = null;
      let profileThrottleTimer: ReturnType<typeof setTimeout> | null = null;

      const throttledFeedRefresh = () => {
        if (feedThrottleTimer) return; // already scheduled
        feedThrottleTimer = setTimeout(() => {
          feedThrottleTimer = null;
          // Invalidar caché del tab actual para que el próximo syncFeed lo recargue
          tabLastFetchedRef.current[activeTabRef.current] = 0;
          if (currentView === 'feed' || currentView === 'news') {
            fetchFeed(0, currentView === 'news' ? 'news' : 'post', undefined, activeTabRef.current === 'following', undefined, false, false, activeTabRef.current);
          }
        }, 3000); // espera 3 segundos, agrupa múltiples eventos en uno solo
      };

      const throttledTrends = () => {
        if (trendsThrottleTimer) return;
        trendsThrottleTimer = setTimeout(() => {
          trendsThrottleTimer = null;
          fetchWeeklyTrends();
        }, 10000); // trends no son urgentes
      };

      const throttledProfileRefresh = () => {
        if (profileThrottleTimer) return;
        profileThrottleTimer = setTimeout(() => {
          profileThrottleTimer = null;
          if (session?.user) fetchUserProfile(session.user.id);
        }, 5000);
      };

      const channel = supabase
        .channel('app_realtime_sync')
        .on('postgres_changes' as any, { event: 'INSERT', table: 'posts', schema: 'public' } as any, (payload: any) => {
          if (payload.new?.author_id === session?.user?.id) return; // propio post, ya actualizado optimísticamente
          throttledFeedRefresh();
          throttledTrends();
        })
        .on('postgres_changes' as any, { event: 'DELETE', table: 'posts', schema: 'public' } as any, () => {
          throttledFeedRefresh();
        })
        .on('postgres_changes' as any, { event: 'INSERT', table: 'news', schema: 'public' } as any, (payload: any) => {
          if (payload.new?.author_id === session?.user?.id) return;
          throttledFeedRefresh();
          throttledTrends();
        })
        .on('postgres_changes' as any, { event: 'DELETE', table: 'news', schema: 'public' } as any, () => {
          throttledFeedRefresh();
        })
        .on('postgres_changes' as any, { event: 'UPDATE', table: 'profiles', schema: 'public', filter: `id=eq.${session.user.id}` } as any, () => {
          throttledProfileRefresh();
        })
        .on('postgres_changes' as any, { event: 'UPDATE', table: 'posts', schema: 'public' } as any, (payload: any) => {
          const updated = payload.new;
          if (!updated) return;
          updateAllFeeds(prev => prev.map(p => {
            if (p.id === updated.id) {
              return {
                ...p,
                likes: updated.likes_count !== undefined && updated.likes_count !== null ? updated.likes_count : p.likes,
                comments: updated.comments_count !== undefined && updated.comments_count !== null ? updated.comments_count : p.comments,
                reposts: updated.reposts_count !== undefined && updated.reposts_count !== null ? updated.reposts_count : p.reposts
              };
            }
            return p;
          }));
        })
        .on('postgres_changes' as any, { event: 'UPDATE', table: 'news', schema: 'public' } as any, (payload: any) => {
          const updated = payload.new;
          if (!updated) return;
          updateAllFeeds(prev => prev.map(p => {
            if (p.id === updated.id) {
              return {
                ...p,
                likes: updated.likes_count !== undefined && updated.likes_count !== null ? updated.likes_count : p.likes,
                upvotes: updated.up_votes_count !== undefined && updated.up_votes_count !== null ? updated.up_votes_count : p.upvotes,
                downvotes: updated.down_votes_count !== undefined && updated.down_votes_count !== null ? updated.down_votes_count : p.downvotes,
                comments: updated.comments_count !== undefined && updated.comments_count !== null ? updated.comments_count : p.comments,
                reposts: updated.reposts_count !== undefined && updated.reposts_count !== null ? updated.reposts_count : p.reposts
              };
            }
            return p;
          }));
        })
        .on('postgres_changes' as any, { event: '*', table: 'notifications', schema: 'public', filter: `user_id=eq.${session.user.id}` } as any, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        if (feedThrottleTimer) clearTimeout(feedThrottleTimer);
        if (trendsThrottleTimer) clearTimeout(trendsThrottleTimer);
        if (profileThrottleTimer) clearTimeout(profileThrottleTimer);
        supabase.removeChannel(channel);
      };
    }
  }, [session, fetchFeed, fetchChats, fetchUserProfile, fetchWeeklyTrends, fetchNotifications, currentView, updateAllFeeds]);

  // Keep currentView in sync with URL so syncFeed fetches the right content type
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/noticias')) {
      setCurrentView('news');
      // Only show loading state if there are no cached news items already on screen
      setPosts(current => {
        const hasCachedNews = current.some(p => p.type === 'news');
        if (!hasCachedNews) setNewsFeedFetched(false);
        return current;
      });
    } else if (path === '/inicio' || path === '/') {
      setCurrentView('feed');
    } else {
      // Check for profile paths (excluding other known static routes if necessary)
      const staticRoutes = ['/noticias', '/inicio', '/buscar', '/mensajes', '/notificaciones', '/recompensas', '/calendario', '/configuracion', '/panel-control'];
      const isStatic = staticRoutes.some(r => path.startsWith(r));
      if (!isStatic && path !== '/') {
        setCurrentView('profile');
      }
    }
  }, [location.pathname]);

  const handleViewChange = (view: AppView) => {
    if (view === 'profile') setViewingUserId(currentUserData?.id || null);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewRegistrationData = async (userId: string) => {
    setSelectedRegistrationUserId(userId);
    setSelectedRegistrationUser(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) { console.error('[handleViewRegistrationData]', error); return; }
      if (data) {
        setSelectedRegistrationUser({
          id: data.id,
          name: data.name || '',
          lastName: data.last_name || '',
          username: data.username || '',
          email: data.email || '',
          avatar: data.avatar || '',
          bio: data.bio || '',
          position: data.position || '',
          institution: data.institution || '',
          jobCategory: data.job_category || '',
          administrationType: data.administration_type || '',
          country: data.country || '',
          region: data.region || '',
          isOrganization: data.is_organization || false,
          status: data.status,
          interests: data.interests || [],
          followers: data.followers_count ?? 0,
          following: data.following_count ?? 0,
          joinedDate: data.created_at,
          birthDate: data.birth_date || '',
          linkedOrganizationId: data.linked_organization_id || null,
        });
      }
    } catch (e) {
      console.error('[handleViewRegistrationData]', e);
    }
  };

  const handleNavigateToProfile = async (userId: string) => {
    const normalizedId = userId?.trim();
    if (!normalizedId) return;

    const targetUser = users.find(u => {
      const sameId = u.id === normalizedId;
      const sameUsername = u.username?.toLowerCase() === normalizedId.toLowerCase();
      return sameId || sameUsername;
    });

    if (targetUser?.username) {
      navigate(`/${targetUser.username}`);
      return;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedId);
    const query = supabase
      .from('profiles')
      .select('username')
      .or(isUuid ? `id.eq.${normalizedId},username.eq.${normalizedId}` : `username.eq.${normalizedId}`)
      .maybeSingle();

    const { data, error } = await query;

    if (error) {
      console.error('[handleNavigateToProfile]', error);
      navigate(`/${normalizedId}`);
      return;
    }

    navigate(`/${data?.username || normalizedId}`);
  };

  useEffect(() => {
    if (session && currentUserData?.status === 'active' && currentUserData?.firstTime !== false && !showTutorial && !hasTriggeredTutorial) {
      setShowTutorial(true);
      setHasTriggeredTutorial(true);

      // Enviar notificación de bienvenida solo cuando first_time === true (primera sesión tras aprobación)
      if (currentUserData.firstTime === true) {
        supabase.from('notifications').insert({
          user_id: currentUserData.id,
          sender_id: currentUserData.id,
          type: 'system',
          content: '¡Te damos la bienvenida! Ya formas parte de Red Social.',
          is_read: false,
        }).then(({ error }) => {
          if (error) console.error('Error inserting welcome notification:', error);
        });
      }
    }
  }, [session, currentUserData?.id, currentUserData?.firstTime, currentUserData?.status, showTutorial, hasTriggeredTutorial]);

  const handleCloseTutorial = async () => {
    setShowTutorial(false);
    setActiveTourStepId(null);
    if (currentUserData) {
      // Actualización optimista inmediata para evitar que el efecto se dispare si hubiera algún retraso
      setCurrentUserData(prev => prev ? { ...prev, firstTime: false } : null);
      
      const { error } = await supabase
        .from('profiles')
        .update({ first_time: false })
        .eq('id', currentUserData.id);
      
      if (error) {
        console.error('Error updating first_time:', error);
        // Si fallara, podríamos revertir, pero lo más seguro es dejarlo en false localmente para no molestar al usuario
      }
    }
  };

  const handleNavigateToPost = async (postId: string, type?: 'post' | 'news') => {
    let resolvedType = type || [...posts, ...followingPosts, ...profilePosts].find(p => p.id === postId)?.type;
    if (!resolvedType) {
      const p = await resolvePostOrNews(postId);
      resolvedType = p?.type;
    }
    if (resolvedType === 'news') {
      navigate(`/noticias/${postId}`);
    } else {
      navigate(`/inicio/${postId}`);
    }
  };

  const handleNavigateToEvent = (userId: string, eventId: string) => {
    const targetUser = users.find(u => u.id === userId);
    const identifier = targetUser?.username || userId;
    navigate(`/${identifier}/${eventId}`);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    // Optimistic UI: remove immediately from real notifications state
    const previous = notifications;
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    // Virtual notifications (prefix "virtual-") are synthesized client-side from
    // pending/resolved users; they have no corresponding row in the DB.
    // Persist the dismissal in localStorage so they don't reappear on re-render.
    if (notificationId.startsWith('virtual-')) {
      setDismissedVirtualIds(prev => {
        const next = new Set(prev);
        next.add(notificationId);
        try { localStorage.setItem(DISMISSED_VIRTUAL_KEY, JSON.stringify([...next])); } catch {}
        return next;
      });
      return;
    }

    const { error, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('id', notificationId);
    if (error) {
      console.error('Error deleting notification:', error);
      alert('Error al borrar notificación: ' + error.message);
      setNotifications(previous);
      return;
    }
    if (count === 0) {
      console.warn('Notification delete affected 0 rows — probable RLS. id:', notificationId);
      alert('No se pudo borrar la notificación (permisos insuficientes). Revisa la política RLS de la tabla notifications.');
      setNotifications(previous);
    }
  };

  const PendingApprovalView = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
      <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-3xl p-10 text-center shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-zinc-800">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Clock size={40} className="animate-pulse" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Solicitud en revisión</h3>
        <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed font-medium">
          Tu registro ha sido completado con éxito. Un administrador debe revisar y aprobar tu solicitud para que puedas acceder a la red.
        </p>
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center space-x-2"
        >
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  const RejectedApprovalView = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
      <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-3xl p-10 text-center shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-zinc-800">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <X size={40} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Solicitud rechazada</h3>
        <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed font-medium">
          Lo sentimos, tu solicitud de registro ha sido rechazada por los administradores de la plataforma.
        </p>
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  const ExpelledView = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
      <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-3xl p-10 text-center shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-zinc-800">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Ban size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Cuenta expulsada</h3>
        <p className="text-slate-500 dark:text-gray-400 mb-6 leading-relaxed text-sm">
          Tu cuenta ha sido expulsada de la red por los administradores de la plataforma. Si crees que es un error, ponte en contacto con el equipo de soporte.
        </p>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 mb-6">
          <p className="text-red-600 dark:text-red-400 font-black text-sm">Acceso permanentemente revocado</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-slate-800 dark:bg-zinc-700 text-white font-bold rounded-2xl hover:bg-slate-900 dark:hover:bg-zinc-600 transition-all text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  const BannedView = ({ bannedUntil, onLogout }: { bannedUntil: string; onLogout: () => void }) => {
    const [now, setNow] = React.useState(Date.now());
    React.useEffect(() => {
      const t = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(t);
    }, []);
    const end = new Date(bannedUntil).getTime();
    const isPermanent = new Date(bannedUntil).getFullYear() >= 2090;
    const diff = Math.max(0, end - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
        <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-3xl p-10 text-center shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-zinc-800">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Ban size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Cuenta suspendida</h3>
          <p className="text-slate-500 dark:text-gray-400 mb-6 leading-relaxed text-sm">
            Tu cuenta ha sido suspendida temporalmente por los administradores de la plataforma.
          </p>
          {isPermanent ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 mb-6">
              <p className="text-red-600 dark:text-red-400 font-black text-sm">Suspensión permanente</p>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mb-6 space-y-1">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide">Tiempo restante</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                {days > 0 && <div className="text-center"><p className="text-2xl font-black text-slate-900 dark:text-white">{days}</p><p className="text-[10px] text-slate-400 font-bold">días</p></div>}
                <div className="text-center"><p className="text-2xl font-black text-slate-900 dark:text-white">{String(hours).padStart(2,'0')}</p><p className="text-[10px] text-slate-400 font-bold">horas</p></div>
                <div className="text-center"><p className="text-2xl font-black text-slate-900 dark:text-white">{String(mins).padStart(2,'0')}</p><p className="text-[10px] text-slate-400 font-bold">min</p></div>
                <div className="text-center"><p className="text-2xl font-black text-slate-900 dark:text-white">{String(secs).padStart(2,'0')}</p><p className="text-[10px] text-slate-400 font-bold">seg</p></div>
              </div>
            </div>
          )}
          <button onClick={onLogout} className="w-full py-3.5 bg-slate-800 dark:bg-zinc-700 text-white font-bold rounded-2xl hover:bg-slate-900 dark:hover:bg-zinc-600 transition-all text-sm">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  };

  const MaintenanceView = () => (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 15% 50%, #5ecece 0%, #7a5cbf 45%, #6b50b8 70%, #5e48b0 100%)' }}>
      {/* Orbes decorativos para suavizar el gradiente */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 0% 60%, #62d4d4cc 0%, transparent 55%)' }} />
      <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 40%, #7b5abfaa 0%, transparent 50%)' }} />

      <div className="w-full max-w-sm text-center relative z-10 space-y-10">

        {/* Logo + icono de mantenimiento */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            {/* Anillos pulsantes continuos — animación CSS pura, no se reinicia con re-renders */}
            <div className="absolute inset-0 rounded-3xl bg-white/30 animate-ring-pulse" />
            <div className="absolute inset-0 rounded-3xl bg-white/20 animate-ring-pulse-delayed" />
            <div className="relative w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-purple-900/30 border border-white/40">
              <img src="/img/novagob.brand_isotipo_blanco.svg" alt="Red Social" className="w-14 h-14 object-contain drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Texto principal */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
            En mantenimiento
          </h1>
          <p className="text-white/75 text-sm leading-relaxed">
            Estamos realizando mejoras para ofrecerte<br/>una experiencia aún mejor.
          </p>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-2 justify-center">
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-white/30" />
          <div className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-white/40" />
          </div>
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-white/30" />
        </div>

        {/* Pie */}
        <p className="text-white/40 text-[11px] font-bold tracking-[0.2em] uppercase">Red Social</p>
      </div>
    </div>
  );

  // Only show full-screen spinner if auth is resolving AND there's no cached data to show
  const hasMinimalData = posts.length > 0 || currentUserData !== null;
  if (isLoadingAuth && !hasMinimalData) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>;
  }


  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ScrollManager />
      <Routes>
        <Route path="/inicio-sesion" element={(!session && !isLoadingAuth) ? <Login /> : (session ? <Navigate to="/inicio" replace /> : null)} />
        <Route path="/registro" element={maintenanceMode ? MaintenanceView() : ((!session && !isLoadingAuth) || !currentUserData ? <Onboarding /> : <Navigate to="/inicio" replace />)} />

        <Route path="*" element={
          maintenanceMode && (!currentUserData?.isAdmin) ? (
            MaintenanceView()
          ) : (!session && !isLoadingAuth) ? (
            <Navigate to="/inicio-sesion" replace />
          ) :currentUserData?.isBanned ? (
            <BannedView bannedUntil={currentUserData.bannedUntil || new Date().toISOString()} onLogout={handleLogout} />
          ) : currentUserData?.status === 'rejected' && currentUserData?.username?.startsWith('userdeleted') ? (
            <ExpelledView />
          ) : currentUserData?.status === 'pending' ? (
            <PendingApprovalView />
          ) : currentUserData?.status === 'rejected' ? (
            <RejectedApprovalView />
          ) : !currentUserData && hasCheckedProfile ? (
            <Navigate to="/registro" replace />
          ) : !currentUserData ? (
             <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>
          ) : (
            <Layout
              user={currentUserData!}
              notifications={allNotifications}
              posts={posts}
              chats={chats}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              onLogout={handleLogout}
              globalEvents={globalEvents}
              globalEventsLoading={globalEventsLoading}
              theme={theme}
              onThemeChange={setTheme}
              language="es"
              onRefresh={fetchFeed}
              isLoading={isLoadingFeed}
              trendingTags={weeklyTrends}
              activeTourStepId={activeTourStepId}
              isTutorialActive={showTutorial}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/inicio" replace />} />
                <Route path="/inicio" element={
                  <SocialFeed 
                    posts={(activeTab === 'following' ? followingPosts : posts).filter(p => p.type === 'post')} 
                    user={currentUserData!} 
                    onLike={(id) => handleVote(id, 'up')}
                    onVote={handleVote}
                    onRepost={handleRepost}
                    onAddPost={handleAddPost}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onSharePost={() => {}}
                    onToggleFollow={handleToggleFollow}
                    onViewCalendar={() => navigate('/calendario')}
                    users={users}
                    onNavigateToProfile={handleNavigateToProfile}
                    onNavigateToPost={handleNavigateToPost}
                    onNavigateToEvent={(uid, eid) => navigate(`/${uid}/${eid}`)}
                    followedUserIds={followedUserIds}
                    followerUserIds={followerUserIds}
                    likedIds={likedIds}
                    votedUpIds={votedUpIds}
                    votedDownIds={votedDownIds}
                    repostedIds={repostedIds}
                    onSearchHashtag={handleSearchHashtag}
                    globalEvents={globalEvents}
                    chats={chats}
                    chatsLoading={chatsLoading}
                    onShareViaChat={handleSendMessage}
                    language="es" 
                    onLoadMore={handleLoadMorePosts} 
                    hasMore={activeTab === 'following' ? hasMoreFollowing : hasMorePosts} 
                    isLoadingMore={activeTab === 'following' ? isLoadingMoreFollowing : isLoadingMorePosts} 
                    initialContent={location.state?.initialContent} 
                    prefilledEvent={location.state?.prefilledEvent} 
                    onClearInitialContent={() => navigate(location.pathname, { replace: true, state: {} })} 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                    isLoading={isLoadingFeed}
                    feedFetched={feedFetched}
                  />
                } />
                <Route path="/noticias" element={<NewsHubView posts={posts.filter(p => p.type === 'news')} user={currentUserData!} onVote={(id, dir) => handleVote(id, dir)} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} currentUser={currentUserData!} users={users} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={handleNavigateToPost} onNavigateToEvent={(uid, eid) => navigate(`/${uid}/${eid}`)} followedUserIds={followedUserIds} followerUserIds={followerUserIds} likedIds={likedIds} votedUpIds={votedUpIds} votedDownIds={votedDownIds} repostedIds={repostedIds} onSearchHashtag={handleSearchHashtag} onLoadMore={handleLoadMoreNews} hasMore={hasMoreNews} isLoadingMore={isLoadingMoreNews} language="es" chats={chats} onShareViaChat={handleSendMessage} globalEvents={globalEvents} feedFetched={feedFetched} newsFeedFetched={newsFeedFetched} onFetchNews={handleFetchNews} />} />
                <Route path="/calendario" element={<Suspense fallback={<LazyFallback />}><CalendarView language={'es'} globalEvents={globalEvents} onRefreshEvents={fetchGlobalEvents} /></Suspense>} />
                <Route path="/mensajes/:chatId" element={<MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={handleSendMessage} onEditMessage={handleEditMessage} onDeleteMessage={handleDeleteMessage} onNavigateToProfile={handleNavigateToProfile} onViewPost={handleNavigateToPost} onNavigateToEvent={handleNavigateToEvent} onMarkChatAsRead={handleMarkChatAsRead} externalActiveId={activeChatUserId} users={users} globalEvents={globalEvents} language={'es'} onRefreshChats={fetchChats} onFetchChatMessages={fetchChatMessages} chatsLoading={chatsLoading} chatHasMore={activeChatHasMore} messagesLoading={activeChatMessagesLoading} />} />
                <Route path="/mensajes" element={<MessagesView user={currentUserData!} chats={chats} posts={posts} onSendMessage={handleSendMessage} onEditMessage={handleEditMessage} onDeleteMessage={handleDeleteMessage} onNavigateToProfile={handleNavigateToProfile} onViewPost={handleNavigateToPost} onNavigateToEvent={handleNavigateToEvent} onMarkChatAsRead={handleMarkChatAsRead} externalActiveId={activeChatUserId} users={users} globalEvents={globalEvents} language={'es'} onRefreshChats={fetchChats} onFetchChatMessages={fetchChatMessages} chatsLoading={chatsLoading} chatHasMore={activeChatHasMore} messagesLoading={activeChatMessagesLoading} />} />
                <Route path="/notificaciones" element={<NotificationsView notifications={allNotifications} onMarkAllRead={handleMarkNotificationsRead} onNotificationClick={handleNotificationClick} language={'es'} currentUser={currentUserData!} onApproveUser={handleApproveUser} onRejectUser={handleRejectUser} onApproveRedemption={handleApproveRedemption} onNavigateToProfile={handleNavigateToProfile} onViewRegistrationData={handleViewRegistrationData} users={users} rewards={storeRewards} onDeleteNotification={handleDeleteNotification} />} />
                <Route path="/recompensas" element={<Suspense fallback={<LazyFallback />}><StoreView user={currentUserData!} language={'es'} onRedeemReward={handleRedeemReward} storeRewards={storeRewards} userRedemptions={userRedemptions} /></Suspense>} />
                <Route path="/buscar" element={<SearchRoute posts={posts} users={users} onLike={(id) => handleVote(id, 'up')} onVote={(id, dir) => handleVote(id, dir)} onRepost={handleRepost} onAddComment={handleAddComment} onDeletePost={handleDeletePost} onViewChange={handleViewChange} currentUser={currentUserData!} followedUserIds={followedUserIds} followerUserIds={followerUserIds} likedIds={likedIds} votedUpIds={votedUpIds} votedDownIds={votedDownIds} repostedIds={repostedIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={handleNavigateToProfile} onSearchHashtag={handleSearchHashtag} chats={chats} onShareViaChat={handleSendMessage} language={'es'} onNavigateToPost={handleNavigateToPost} onNavigateToEvent={(uid, eid) => navigate(`/${uid}/${eid}`)} />} />
                <Route path="/inicio/:postId" element={<PostDetailView posts={posts} user={currentUserData!} onAddComment={handleAddComment} onAddReply={handleAddReply} onLike={(id) => handleVote(id, 'up')} onLikeComment={handleLikeComment} onLikeReply={handleLikeReply} onVote={handleVote} onRepost={handleRepost} onDeletePost={handleDeletePost} onSearchHashtag={handleSearchHashtag} onNavigateToProfile={handleNavigateToProfile} onNavigateToEvent={(uid, eid) => navigate(`/${uid}/${eid}`)} users={users} language={'es'} chats={chats} onShareViaChat={handleSendMessage} followedUserIds={followedUserIds} followerUserIds={followerUserIds} likedIds={likedIds} votedUpIds={votedUpIds} votedDownIds={votedDownIds} repostedIds={repostedIds} />} />
                <Route path="/noticias/:postId" element={<PostDetailView posts={posts} user={currentUserData!} onAddComment={handleAddComment} onAddReply={handleAddReply} onLike={(id) => handleVote(id, 'up')} onLikeComment={handleLikeComment} onLikeReply={handleLikeReply} onVote={handleVote} onRepost={handleRepost} onDeletePost={handleDeletePost} onSearchHashtag={handleSearchHashtag} onNavigateToProfile={handleNavigateToProfile} onNavigateToEvent={(uid, eid) => navigate(`/${uid}/${eid}`)} users={users} language={'es'} chats={chats} onShareViaChat={handleSendMessage} followedUserIds={followedUserIds} followerUserIds={followerUserIds} likedIds={likedIds} votedUpIds={votedUpIds} votedDownIds={votedDownIds} repostedIds={repostedIds} />} />
                <Route path="/configuracion" element={<SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} onLogout={() => supabase.auth.signOut()} onViewChange={handleViewChange} theme={theme} onThemeChange={setTheme} language={'es'} onLanguageChange={() => {}} />} />
                <Route path="/panel-control" element={currentUserData?.isAdmin ? <Suspense fallback={<LazyFallback />}><AdminPanelView currentUser={currentUserData!} users={users} onApproveUser={handleApproveUser} onRejectUser={handleRejectUser} onNavigateToProfile={handleNavigateToProfile} onRefreshUsers={() => fetchUsers(true)} onRefreshRewards={fetchStoreRewards} /></Suspense> : <Navigate to="/inicio" replace />} />
                <Route path="/:identifier/:eventId" element={<ProfileRoute users={users} currentUserData={currentUserData} posts={profilePosts} chats={chats} followerUserIds={followerUserIds} followedUserIds={followedUserIds} likedIds={likedIds} votedUpIds={votedUpIds} votedDownIds={votedDownIds} repostedIds={repostedIds} onUpdateUser={handleUpdateUser} onRepost={handleRepost} onToggleFollow={handleToggleFollow} onDeletePost={handleDeletePost} onNavigateToEvent={(uid, eid) => navigate(`/${uid}/${eid}`)} onStartChat={handleStartChat} onAddPost={handleAddPost} onPromoteEvent={handlePromoteEvent} onShareViaChat={handleSendMessage} focusedEventId={location.state?.scrollToEventId || null} onClearFocusedEvent={() => { }} onSearchHashtag={handleSearchHashtag} onNavigateToPost={handleNavigateToPost} onNavigateToProfile={handleNavigateToProfile} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onAddComment={handleAddComment} onAddReply={handleAddReply} onLikeComment={handleLikeComment} onLikeReply={handleLikeReply} onVoteComment={undefined} onPreviewImage={undefined} globalEvents={globalEvents} language="es" pinnedPosts={new Set(profilePosts.filter(p => p.isPinned && p.authorId === session?.user?.id).map(p => p.id))} onTogglePin={handleTogglePin} onSupportEvent={undefined} targetEventId={null} onClearTargetEvent={() => { }} onLoadMore={handleLoadMoreProfile} onFetchProfileContent={handleFetchProfileContent} hasMore={hasMorePosts} isLoadingMore={isLoadingMorePosts} hasMoreNews={hasMoreNews} isLoadingMoreNews={isLoadingMoreNews} />} />
                <Route path="/:identifier" element={<ProfileRoute users={users} currentUserData={currentUserData} posts={profilePosts} chats={chats} followerUserIds={followerUserIds} followedUserIds={followedUserIds} likedIds={likedIds} votedUpIds={votedUpIds} votedDownIds={votedDownIds} repostedIds={repostedIds} onUpdateUser={handleUpdateUser} onRepost={handleRepost} onToggleFollow={handleToggleFollow} onDeletePost={handleDeletePost} onNavigateToEvent={(uid, eid) => navigate(`/${uid}/${eid}`)} onStartChat={handleStartChat} onAddPost={handleAddPost} onPromoteEvent={handlePromoteEvent} onShareViaChat={handleSendMessage} focusedEventId={location.state?.scrollToEventId || null} onClearFocusedEvent={() => { }} onSearchHashtag={handleSearchHashtag} onNavigateToPost={handleNavigateToPost} onNavigateToProfile={handleNavigateToProfile} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onAddComment={handleAddComment} onAddReply={handleAddReply} onLikeComment={handleLikeComment} onLikeReply={handleLikeReply} onVoteComment={undefined} onPreviewImage={undefined} globalEvents={globalEvents} language="es" pinnedPosts={new Set(profilePosts.filter(p => p.isPinned && p.authorId === session?.user?.id).map(p => p.id))} onTogglePin={handleTogglePin} onSupportEvent={undefined} targetEventId={null} onClearTargetEvent={() => { }} onLoadMore={handleLoadMoreProfile} onFetchProfileContent={handleFetchProfileContent} hasMore={hasMorePosts} isLoadingMore={isLoadingMorePosts} hasMoreNews={hasMoreNews} isLoadingMoreNews={isLoadingMoreNews} />} />
              </Routes>
            </Layout>
          )
        }
        />
      </Routes>
      {selectedPostFromNotify && <PostDetailsModal post={selectedPostFromNotify} onClose={() => setSelectedPostFromNotify(null)} onAddComment={handleAddComment} onAddReply={handleAddReply} onLikeComment={handleLikeComment} onLikeReply={handleLikeReply} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onRepost={handleRepost} onNavigateToProfile={handleNavigateToProfile} onNavigateToEvent={(uid, eid) => navigate(`/${uid}/${eid}`)} onSearchHashtag={handleSearchHashtag} users={users} language={'es'} />}
      {selectedRegistrationUserId && (
        selectedRegistrationUser
          ? <RegistrationDetailsModal user={selectedRegistrationUser} users={users} onClose={() => { setSelectedRegistrationUserId(null); setSelectedRegistrationUser(null); }} />
          : <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"><Loader2 className="animate-spin text-white" size={36} /></div>
      )}
      {showTutorial && <TutorialModal onClose={handleCloseTutorial} onStepChange={setActiveTourStepId} language="es" />}

      {/* Popup aviso mantenimiento — una vez por usuario hasta que expire */}
      {maintenanceNotice && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 max-w-md w-full text-center animate-in zoom-in-95">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
              <Clock size={28} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Aviso de mantenimiento</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 whitespace-nowrap">
              Se realizará un mantenimiento el{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {new Date(maintenanceNotice.start).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>.
            </p>
            {maintenanceNotice.end && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 whitespace-nowrap">
                Finalización prevista el{' '}
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {new Date(maintenanceNotice.end).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>.
              </p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 mb-5">Durante este tiempo la plataforma podría no estar disponible.</p>
            <button
              onClick={dismissMaintenanceNotice}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center transform transition-all animate-in zoom-in-95">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${toast.type === 'error' ? 'bg-red-100 text-red-600' : toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              {toast.type === 'error' ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aviso</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-white transition-colors ${toast.type === 'error' ? 'bg-red-600 hover:bg-red-700' : toast.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

