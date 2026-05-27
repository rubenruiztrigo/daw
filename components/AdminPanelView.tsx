import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Gift, ChevronLeft, ChevronUp, ChevronDown, CheckCircle2, XCircle, Trash2,
  Search, Loader2, RefreshCw, UserCheck, UserX, Plus, Edit2, X, Check,
  Medal, Heart, Calendar, MapPin, Ban, UserMinus, ShieldOff, FileText,
  Save, Hash, Building2, User as UserIcon, Upload, Newspaper,
  BookOpen, Trophy, Coffee, Award, Star, Crown,
  Zap, Flame, Globe, Rocket, Sparkles, Music, Camera, Palette,
  Briefcase, GraduationCap, Lightbulb, Target, Shield, Landmark,
  Leaf, Sun, Diamond, Gem, Coins, Handshake, ThumbsUp,
  Megaphone, Bell, Lock, Key, Smile, Flag, Ticket, Layers,
  Bike, Car, Plane, Ship, Train, Bus, TreePine, Mountain,
  Cloud, Wind, Waves, Flower2, Bird, Fish, Turtle,
  Pizza, Apple, Cherry, Salad, Soup, UtensilsCrossed,
  Dumbbell, Footprints, HeartHandshake, Telescope, Microscope,
  Cpu, Wifi, Database, Server, Code2, Terminal, GitBranch,
  PenTool, Brush, Scissors, Ruler, Wrench, Hammer, HardHat,
  Home, School, Hospital, Church, Store, Hotel, Tent,
  Map as MapIcon, Compass, Navigation, Route, ParkingCircle,
  Phone, Mail, MessageCircle, Send, Radio, Tv, Headphones,
  ClipboardList, FileCheck, FolderOpen, Archive, Inbox,
  Clock, Hourglass, AlarmClock, Timer, Watch,
  BarChart2, PieChart, TrendingUp, Activity, Sigma, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { User, BADGE_CATALOG } from '../types';
import { LinkPreview } from './LinkPreview';
import { EventPreview } from './EventPreview';
import { getSafeAvatar } from '../utils/avatarUtils';
import { decodeEmail } from '../utils/emailUtils';
import { PUBLIC_INTERESTS } from '../constants';

interface AdminPanelViewProps {
  currentUser: User;
  users: User[];
  onApproveUser: (userId: string, notificationId: string) => void;
  onRejectUser: (userId: string, notificationId: string) => void;
  onNavigateToProfile: (userId: string) => void;
  onRefreshUsers: () => void;
  onRefreshRewards?: () => void;
}

type Tab = 'usuarios' | 'eventos' | 'recompensas' | 'intereses' | 'insignias' | 'mantenimiento' | 'novas';

const DEFAULT_BADGE_IMG = '/img/insignias/insignia-degradado.png';

const RewardIconMap: Record<string, React.FC<any>> = {
  Gift, Trophy, Star, Crown, Award, Medal, Diamond, Gem, Sparkles, Ticket, Flag, Coins,
  Zap, Flame, Rocket, Target, Shield, Layers,
  Heart, Smile, ThumbsUp, Handshake, HeartHandshake, Users: UserIcon, Megaphone, Bell, MessageCircle,
  BookOpen, GraduationCap, Lightbulb, Telescope, Microscope, Compass,
  Briefcase, Building2, Landmark, HardHat, Wrench, Hammer, ClipboardList, FileCheck, FolderOpen,
  Cpu, Code2, Terminal, Database, Server, Wifi, GitBranch, BarChart2, TrendingUp,
  Globe, Leaf, Sun, TreePine, Mountain, Waves, Cloud, Wind, Flower2,
  Music, Camera, Palette, PenTool, Brush, Tv, Headphones, Radio, Send,
  Home, School, Hospital, Store, Hotel, Tent,
  Clock, Hourglass, AlarmClock, Timer, Watch,
  Key, Lock, Coffee, Dumbbell, Footprints, Newspaper, Map: MapIcon, Navigation, Activity,
};

export const REWARD_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-600' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-600' },
  green:   { bg: 'bg-green-100',   text: 'text-green-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-600' },
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-600' },
  red:     { bg: 'bg-red-100',     text: 'text-red-600' },
  pink:    { bg: 'bg-pink-100',    text: 'text-pink-600' },
  indigo:  { bg: 'bg-indigo-100',  text: 'text-indigo-600' },
  cyan:    { bg: 'bg-cyan-100',    text: 'text-cyan-600' },
  yellow:  { bg: 'bg-yellow-100',  text: 'text-yellow-600' },
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-600' },
};

const getRewardIcon = (r: any): React.FC<any> => {
  const name = (r.name || '').toLowerCase();
  if (name.includes('supernova')) return Trophy;
  if (name.includes('congreso')) return Building2;
  return RewardIconMap[r.icon_name] || Gift;
};

const getRewardColors = (r: any) => REWARD_COLOR_MAP[r.color] || REWARD_COLOR_MAP.purple;

const getBadgeImg = (b: any): string => {
  if (b?.image_url) return b.image_url;
  if (b?.iconUrl) return b.iconUrl;
  const id = (b?.id || '').toLowerCase();
  // Ranking
  if (id === 'ranking_top1') return '/img/insignias/top-1.png';
  if (id === 'ranking_top2') return '/img/insignias/top-2.png';
  if (id === 'ranking_top3') return '/img/insignias/top-3.png';
  // Congresos
  if (id.includes('congress_2025') || id.includes('congress_2026')) return '/img/insignias/Congreso_2025.png';
  if (id.includes('congress')) return '/img/insignias/Congreso_2024.png';
  // Eventos especiales
  if (id.includes('innovalencia')) return '/img/insignias/InnoValencia.png';
  if (id.includes('burocrac')) return '/img/insignias/Burocrac_IA.png';
  if (id.includes('innovamos')) return '/img/insignias/InnovamosLab.png';
  // Premios
  if (id.startsWith('award_') || b?.category === 'premio' || b?.category === 'premios_excelencia') return '/img/insignias/Excelencia_2025.png';
  return DEFAULT_BADGE_IMG;
};


const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const extractFirstUrl = (text?: string): string | null => {
  if (!text) return null;
  const m = text.match(URL_REGEX);
  return m ? m[0] : null;
};
const toImageArray = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return [raw];
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; size?: 'sm' | 'md' }> = ({ title, onClose, children, size = 'md' }) => {
  useScrollLock(true);
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 pt-20 pb-24 sm:p-4" onClick={onClose}>
      <div className={`bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-2xl w-full flex flex-col max-h-full sm:max-h-[96vh] overflow-hidden ${size === 'sm' ? 'sm:max-w-xs' : 'sm:max-w-lg'}`} onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-black text-slate-900 dark:text-white text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 mb-2 scrollbar-modal">{children}</div>
      </div>
    </div>
  );
};

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUser, users, onApproveUser, onRejectUser, onRefreshUsers, onRefreshRewards
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');
  const [search, setSearch] = useState('');

  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'eventos', label: 'Eventos', icon: Calendar },
    { id: 'recompensas', label: 'Recompensas', icon: Gift },
    { id: 'intereses', label: 'Intereses', icon: Heart },
    { id: 'insignias', label: 'Insignias', icon: Medal },
    { id: 'novas', label: 'Novas', icon: Coins },
    { id: 'mantenimiento', label: 'Administración', icon: Wrench },
  ];

  /* ═══════════ MANTENIMIENTO ═══════════ */
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  useEffect(() => {
    supabase.from('platform_settings').select('value').eq('key', 'maintenance_mode').maybeSingle().then(({ data }) => {
      if (data) setMaintenanceMode(data.value === 'true');
    });
  }, []);

  const toggleMaintenance = async () => {
    const next = !maintenanceMode;
    setLoadingMaintenance(true);
    await supabase.from('platform_settings').upsert({ key: 'maintenance_mode', value: String(next), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setMaintenanceMode(next);
    setLoadingMaintenance(false);
  };

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeStart, setNoticeStart] = useState('');
  const [noticeEnd, setNoticeEnd] = useState('');
  const [sendingNotice, setSendingNotice] = useState(false);
  const [noticeSent, setNoticeSent] = useState(false);
  const [activeNotice, setActiveNotice] = useState<{ id: string; start: string; end?: string | null; active?: boolean } | null>(null);

  const fetchActiveNotice = useCallback(async () => {
    const { data, error } = await supabase.from('platform_settings').select('value').eq('key', 'maintenance_notice').maybeSingle();
    
    if (error) {
      console.error('[AdminPanel] Error fetching maintenance_notice:', error);
      return;
    }

    if (!data?.value) {
      console.log('[AdminPanel] No maintenance notice found in DB');
      setActiveNotice(null);
      return;
    }

    try {
      const notice = JSON.parse(data.value);
      if (notice && notice.active) {
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

        if (now > expirationDate) {
          setActiveNotice(null);
          // Auto-deactivate in DB since it's expired
          const updated = { ...notice, active: false };
          supabase.from('platform_settings').upsert(
            { key: 'maintenance_notice', value: JSON.stringify(updated), updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          ).then(({ error }) => {
            if (error) console.error('[AdminPanel] Auto-deactivate expired notice error:', error);
          });
        } else {
          setActiveNotice(notice);
        }
      } else {
        setActiveNotice(null);
      }
    } catch (err) {
      console.error('[AdminPanel] JSON Parse error:', err);
      setActiveNotice(null);
    }
  }, []);

  useEffect(() => { fetchActiveNotice(); }, [fetchActiveNotice]);

  const deactivateNotice = async () => {
    if (!activeNotice) return;
    setSendingNotice(true);
    
    console.log('[AdminPanel] Attempting deactivation...');

    // Method 1: Try the RPC function (Cleanest)
    const { error: rpcError } = await supabase.rpc('deactivate_maintenance_notice');
    
    if (!rpcError) {
      console.log('[AdminPanel] Deactivated via RPC');
      setActiveNotice(null);
      setSendingNotice(false);
      return;
    }

    console.warn('[AdminPanel] RPC failed, trying direct update:', rpcError);

    // Method 2: Fallback to direct updates (Requires the RLS policy I gave you)
    try {
      const updated = { ...activeNotice, active: false };
      const [settingsRes, profilesRes] = await Promise.all([
        supabase.from('platform_settings').upsert(
          { key: 'maintenance_notice', value: JSON.stringify(updated), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        ),
        supabase.from('profiles').update({ maintenance_notice: false }).neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      if (settingsRes.error) throw settingsRes.error;
      
      console.log('[AdminPanel] Deactivated via Direct Update');
      setActiveNotice(null);
    } catch (err: any) {
      console.error('[AdminPanel] All deactivation methods failed:', err);
      alert('Error al desactivar: ' + (err.message || 'Error de conexión'));
    } finally {
      setSendingNotice(false);
    }
  };

  const sendMaintenanceNotice = async () => {
    if (!noticeStart) return;
    setSendingNotice(true);
    const id = `notice_${Date.now()}`;
    const notice = { id, start: noticeStart, end: noticeEnd || null, sentAt: new Date().toISOString(), active: true };
    
    console.log('[AdminPanel] Launching notice...');

    // Method 1: Try the RPC function (Must update everyone via SECURITY DEFINER)
    const { error: rpcError } = await supabase.rpc('launch_maintenance_notice', { 
      notice_data: notice 
    });

    if (!rpcError) {
      console.log('[AdminPanel] Launched via RPC successfully');
      setActiveNotice(notice);
      setSendingNotice(false);
      setNoticeSent(true);
      setTimeout(() => { setShowNoticeModal(false); setNoticeSent(false); setNoticeStart(''); setNoticeEnd(''); }, 1500);
      return;
    }

    console.error('[AdminPanel] RPC launch FAILED:', rpcError);
    // If it's a 404, the function hasn't been created in Supabase SQL Editor
    if (rpcError.code === 'P0001' || rpcError.message?.includes('not found')) {
      alert('ERROR: La función de base de datos no existe. Por favor, ejecuta el script SQL en Supabase.');
    } else {
      alert('Error de base de datos (RPC): ' + rpcError.message);
    }

    // Method 2: Fallback to direct update (Only works for the admin's own profile due to RLS)
    console.warn('[AdminPanel] Falling back to direct update (Limited by RLS)');
    try {
      const [settingsRes] = await Promise.all([
        supabase.from('platform_settings').upsert(
          { key: 'maintenance_notice', value: JSON.stringify(notice), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        ),
        supabase.from('profiles').update({ maintenance_notice: true }).neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      if (settingsRes.error) throw settingsRes.error;

      setActiveNotice(notice);
      setNoticeSent(true);
      setTimeout(() => { setShowNoticeModal(false); setNoticeSent(false); setNoticeStart(''); setNoticeEnd(''); }, 1500);
    } catch (err: any) {
      alert('Error crítico: No se pudo actualizar a todos los usuarios. ' + (err.message || ''));
    } finally {
      setSendingNotice(false);
    }
  };

  /* ═══════════ REPORTES ═══════════ */
  const [adminSubTab, setAdminSubTab] = useState<'reportes' | 'mantenimiento'>('reportes');
  const [reportedItems, setReportedItems] = useState<{
    id: string;
    type: 'post' | 'news';
    content: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string;
    createdAt: string;
    reports: { id: string; reporterName: string; reporterUsername: string; reporterAvatar: string; reason: string; createdAt: string }[];
  }[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const { data: rawReports } = await supabase
        .from('reports')
        .select('id, created_at, post_id, news_id, reason, reporter:profiles!reporter_id(id, name, last_name, username, avatar)')
        .order('created_at', { ascending: false });

      if (!rawReports || rawReports.length === 0) { setReportedItems([]); return; }

      const postIds = [...new Set(rawReports.filter(r => r.post_id).map(r => r.post_id as string))];
      const newsIds = [...new Set(rawReports.filter(r => r.news_id).map(r => r.news_id as string))];

      const [{ data: postsData }, { data: newsData }] = await Promise.all([
        postIds.length > 0
          ? supabase.from('posts').select('id, content, created_at, author:profiles!author_id(name, last_name, username, avatar)').in('id', postIds)
          : Promise.resolve({ data: [] }),
        newsIds.length > 0
          ? supabase.from('news').select('id, content, titulo, created_at, author:profiles!author_id(name, last_name, username, avatar)').in('id', newsIds)
          : Promise.resolve({ data: [] }),
      ]);

      const grouped: Record<string, any> = {};

      const addReport = (itemId: string, type: 'post' | 'news', contentText: string, auth: any, createdAt: string, report: any) => {
        if (!grouped[itemId]) {
          grouped[itemId] = {
            id: itemId,
            type,
            content: contentText,
            authorName: `${auth?.name || ''} ${auth?.last_name || ''}`.trim() || auth?.username || '',
            authorUsername: auth?.username || '',
            authorAvatar: auth?.avatar || '',
            createdAt,
            reports: [],
          };
        }
        const rep = report.reporter || {};
        grouped[itemId].reports.push({
          id: report.id,
          reporterName: `${rep.name || ''} ${rep.last_name || ''}`.trim() || rep.username || 'Usuario',
          reporterUsername: rep.username || '',
          reporterAvatar: rep.avatar || '',
          reason: report.reason || '',
          createdAt: report.created_at,
        });
      };

      for (const r of rawReports) {
        if (r.post_id) {
          const p = (postsData || []).find((x: any) => x.id === r.post_id);
          if (p) {
            const auth = Array.isArray(p.author) ? p.author[0] : p.author;
            addReport(r.post_id, 'post', p.content || '', auth, p.created_at, r);
          }
        } else if (r.news_id) {
          const n = (newsData || []).find((x: any) => x.id === r.news_id);
          if (n) {
            const auth = Array.isArray(n.author) ? n.author[0] : n.author;
            addReport(r.news_id, 'news', n.titulo || n.content || '', auth, n.created_at, r);
          }
        }
      }

      setReportedItems(Object.values(grouped));
    } finally {
      setReportsLoading(false);
    }
  }, []);

  /* ═══════════ NOVAS ═══════════ */
  const [novaStartDate, setNovaStartDate] = useState('');
  const [novaEndDate, setNovaEndDate] = useState('');
  const [savingNovaPeriod, setSavingNovaPeriod] = useState(false);
  const [novaPeriodSaved, setNovaPeriodSaved] = useState(false);
  const [resettingNovas, setResettingNovas] = useState(false);
  const [confirmResetNovas, setConfirmResetNovas] = useState(false);
  const [deleteBadgeConfirm, setDeleteBadgeConfirm] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [exportingNovas, setExportingNovas] = useState(false);
  const [top10Users, setTop10Users] = useState<{ username: string; email: string; novas: number }[]>([]);

  useEffect(() => {
    if (activeTab !== 'novas') return;
    supabase.from('platform_settings').select('key, value').in('key', ['nova_period_start', 'nova_period_end']).then(({ data }) => {
      if (!data) return;
      const start = data.find(d => d.key === 'nova_period_start');
      const end = data.find(d => d.key === 'nova_period_end');
      if (start?.value) setNovaStartDate(start.value);
      if (end?.value) setNovaEndDate(end.value);
    });
    supabase.from('profiles').select('username, email, novas').order('novas', { ascending: false }).limit(10).then(({ data }) => {
      if (data) setTop10Users(data.map(u => ({ username: u.username || '', email: decodeEmail(u.email) || '', novas: u.novas || 0 })));
    });
  }, [activeTab]);

  const saveNovaPeriod = async () => {
    setSavingNovaPeriod(true);
    await supabase.from('platform_settings').upsert([
      { key: 'nova_period_start', value: novaStartDate, updated_at: new Date().toISOString() },
      { key: 'nova_period_end', value: novaEndDate, updated_at: new Date().toISOString() },
    ], { onConflict: 'key' });
    setSavingNovaPeriod(false);
    setNovaPeriodSaved(true);
    setTimeout(() => setNovaPeriodSaved(false), 2500);
  };

  const resetAllNovas = async () => {
    setResettingNovas(true);
    const { error } = await supabase.rpc('reset_all_novas_and_history');
    if (error) {
      console.error('[reset_all_novas_and_history] RPC error:', error.message);
      alert('Error al reiniciar novas: ' + error.message);
      setResettingNovas(false);
      return;
    }
    setResettingNovas(false);
    setConfirmResetNovas(false);
    setTop10Users([]);
    setUserDetails({});
  };

  const exportNovas = () => {
    setExportingNovas(true);
    const headers = ['Username', 'Email', 'Novas'];
    const rows = top10Users.map(u => [u.username, u.email, String(u.novas)]);

    if (exportFormat === 'csv') {
      const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'top10_novas.csv'; a.click();
      URL.revokeObjectURL(url);
    } else {
      // Excel (tab-separated with BOM for proper encoding)
      const tsv = '\uFEFF' + [headers, ...rows].map(r => r.join('\t')).join('\n');
      const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'top10_novas.xls'; a.click();
      URL.revokeObjectURL(url);
    }
    setExportingNovas(false);
  };

  /* ═══════════ USUARIOS ═══════════ */
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'banned' | 'rejected' | 'expelled' | 'admins'>('all');
  const [togglingAdminId, setTogglingAdminId] = useState<string | null>(null);
  const [confirmToggleAdmin, setConfirmToggleAdmin] = useState<{ user: User; makeAdmin: boolean } | null>(null);
  const [manageAdminsOpen, setManageAdminsOpen] = useState(false);
  const [manageAdminsSearch, setManageAdminsSearch] = useState('');
  const [userDetails, setUserDetails] = useState<Record<string, any>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [userDetailModal, setUserDetailModal] = useState<User | null>(null);
  const [showNovaHistory, setShowNovaHistory] = useState(false);
  const [showBadgeSection, setShowBadgeSection] = useState(false);
  const [editingField, setEditingField] = useState<'username' | 'email' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingField, setSavingField] = useState(false);
  const [swipedContent, setSwipedContent] = useState<{ type: 'post' | 'news'; id: string } | null>(null);
  const [contentModal, setContentModal] = useState<{ user: User } | null>(null);
  const [contentData, setContentData] = useState<{ posts: any[]; news: any[]; events: Record<string, any>; loading: boolean }>({ posts: [], news: [], events: {}, loading: false });
  const [contentTab, setContentTab] = useState<'posts' | 'news'>('posts');
  const [contentSearch, setContentSearch] = useState('');
  const [banModal, setBanModal] = useState<{ user: User } | null>(null);
  const [banDays, setBanDays] = useState('7');
  const [banningId, setBanningId] = useState<string | null>(null);
  const [unbanningId, setUnbanningId] = useState<string | null>(null);
  const [banTimeModal, setBanTimeModal] = useState<{ user: User } | null>(null);
  const [banTimeNow, setBanTimeNow] = useState(Date.now());
  const [expelModal, setExpelModal] = useState<{ user: User } | null>(null);
  const [expellingId, setExpellingId] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isExpelled = (u: User) => u.status === 'rejected' && (!u.username || u.username === '' || (u.username || '').startsWith('userdeleted'));

  const activeUsers = users.filter(u => u.status === 'active' && !u.isBanned).length;
  const bannedUsers = users.filter(u => !!u.isBanned).length;
  const rejectedUsers = users.filter(u => u.status === 'rejected' && !isExpelled(u)).length;
  const expelledUsers = users.filter(u => isExpelled(u)).length;
  const adminUsers = users.filter(u => u.isAdmin).length;

  const filteredUsers = users
    .filter(u => {
      let matchesFilter = true;
      if (userFilter === 'active') matchesFilter = u.status === 'active' && !u.isBanned;
      else if (userFilter === 'banned') matchesFilter = !!u.isBanned;
      else if (userFilter === 'rejected') matchesFilter = u.status === 'rejected' && !isExpelled(u);
      else if (userFilter === 'expelled') matchesFilter = isExpelled(u);
      else if (userFilter === 'admins') matchesFilter = !!u.isAdmin;
      const matchesSearch = !search || `${u.name} ${u.lastName || ''} ${decodeEmail((u as any).email) || ''}`.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
      return `${a.name} ${a.lastName || ''}`.localeCompare(`${b.name} ${b.lastName || ''}`, 'es');
    });

  const fetchUserDetail = async (uid: string, force = false) => {
    if (!force && userDetails[uid]) return;
    setLoadingDetail(uid);
    try {
      const { data: resetData } = await supabase.from('platform_settings').select('value').eq('key', 'nova_last_reset').maybeSingle();
      const lastReset = resetData?.value || '1970-01-01';
      const [profileRes, postsRes, newsRes, badgesRes, rankingRes, novaHistoryRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', uid),
        supabase.from('news').select('id', { count: 'exact', head: true }).eq('author_id', uid),
        supabase.from('user_badges').select('badge_id, created_at').eq('user_id', uid),
        supabase.from('ranking_history').select('badge_id, created_at').eq('user_id', uid),
        supabase.from('novas_history').select('motivo, novas, created_at').eq('user_id', uid).gte('created_at', lastReset).order('created_at', { ascending: false }),
      ]);
      const novaHistory = (novaHistoryRes.data || []).map((r: any) => ({
        content: `Has ganado ${r.novas} novas ${r.motivo}`,
        created_at: r.created_at,
      }));
      // Compute badge counts: user_badges (assigned) + ranking_history (earned)
      const badgeCountMap: Record<string, number> = {};
      (badgesRes.data || []).forEach((ub: any) => {
        badgeCountMap[ub.badge_id] = (badgeCountMap[ub.badge_id] || 0) + 1;
      });
      (rankingRes.data || []).forEach((rh: any) => {
        badgeCountMap[rh.badge_id] = (badgeCountMap[rh.badge_id] || 0) + 1;
      });
      const allBadgeIds = Object.keys(badgeCountMap);
      setUserDetails(prev => ({
        ...prev,
        [uid]: {
          profile: profileRes.data,
          postCount: postsRes.count ?? 0,
          newsCount: newsRes.count ?? 0,
          badges: badgesRes.data || [],
          badgeCounts: badgeCountMap,
          allBadgeIds,
          novaHistory,
        }
      }));
    } catch {}
    setLoadingDetail(null);
  };

  const handleOpenUserDetail = (u: User) => {
    setUserDetailModal(u);
    setShowNovaHistory(false);
    setShowBadgeSection(false);
    fetchUserDetail(u.id, true);
  };

  const handleSaveField = async () => {
    if (!userDetailModal || !editingField || !editValue.trim()) return;
    setSavingField(true);
    const payload = editingField === 'username'
      ? { username: editValue.trim().toLowerCase().replace(/\s+/g, '') }
      : { email: editValue.trim().toLowerCase() };
    // username y email son campos core → id.users (el trigger sync_core_to_profiles propaga a profiles)
    const { error } = await supabase.schema('id').from('users').update(payload).eq('id', userDetailModal.id);
    if (!error) {
      setUserDetailModal(prev => prev ? { ...prev, ...(editingField === 'username' ? { username: payload.username } : { email: (payload as any).email }) } : prev);
    }
    setEditingField(null);
    setSavingField(false);
  };

  const handleOpenContent = async (u: User) => {
    setContentModal({ user: u });
    setContentTab('posts');
    setContentSearch('');
    setContentData({ posts: [], news: [], events: {}, loading: true });

    const [postsRes, newsRes] = await Promise.all([
      supabase.from('posts').select('id, content, image_url, linked_event_id, event_id, created_at, likes_count, comments_count').eq('author_id', u.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('news').select('id, title:titulo, content, image_url, created_at').eq('author_id', u.id).order('created_at', { ascending: false }).limit(20),
    ]);

    const posts = postsRes.data || [];
    const rawNews = newsRes.data || [];

    // Contar votos reales desde news_votes
    let news = rawNews;
    if (rawNews.length > 0) {
      const newsIds = rawNews.map((n: any) => n.id);
      const { data: votesData } = await supabase
        .from('news_votes')
        .select('news_id, vote_type')
        .in('news_id', newsIds)
        .eq('vote_type', 'up');
      const voteCount: Record<string, number> = {};
      (votesData || []).forEach((v: any) => { voteCount[v.news_id] = (voteCount[v.news_id] || 0) + 1; });
      news = rawNews.map((n: any) => ({ ...n, up_votes_count: voteCount[n.id] ?? 0 }));
    }

    // Mostrar contenido inmediatamente sin esperar eventos
    setContentData({ posts, news, events: {}, loading: false });

    // Cargar eventos vinculados en segundo plano
    const eventIds = [...new Set(posts.map((p: any) => p.linked_event_id || p.event_id).filter(Boolean))];
    if (eventIds.length > 0) {
      supabase.from('user_events').select('id, title, event_date, event_time, type, location, description, image_url, creator_id').in('id', eventIds).then(({ data: evData }) => {
        const eventsMap: Record<string, any> = {};
        (evData || []).forEach((ev: any) => { eventsMap[ev.id] = ev; });
        setContentData(prev => ({ ...prev, events: eventsMap }));
      });
    }
  };

  const handleDeleteContent = async (type: 'post' | 'news', id: string) => {
    const { error } = await supabase.rpc('admin_delete_reported_content', {
      content_type: type,
      content_id: id,
    });
    if (error) { console.error('[admin_delete_reported_content]', error.message); return; }
    setContentData(prev => ({
      ...prev,
      posts: type === 'post' ? prev.posts.filter(p => p.id !== id) : prev.posts,
      news: type === 'news' ? prev.news.filter(n => n.id !== id) : prev.news,
    }));
    setReportedItems(prev => prev.filter(item => item.id !== id));
    setSwipedContent(null);
  };

  const handleBan = async () => {
    if (!banModal) return;
    setBanningId(banModal.user.id);
    const days = parseInt(banDays);
    const banned_until = days === 0 ? '2099-01-01T00:00:00Z' : new Date(Date.now() + days * 86400000).toISOString();
    
    // Use the secure RPC function to bypass RLS issues
    const { error } = await supabase.rpc('ban_user', { 
      target_user_id: banModal.user.id, 
      ban_duration_iso: banned_until 
    });
    
    if (error) {
      console.error('[handleBan] Error:', error.message);
      alert('Error crítico al banear: ' + error.message);
    } else {
      setBanModal(null);
      onRefreshUsers();
    }
    setBanningId(null);
  };

  const handleUnban = async (u: User) => {
    setUnbanningId(u.id);
    // Use the secure RPC function for unbanning
    const { error } = await supabase.rpc('unban_user', { 
      target_user_id: u.id 
    });
    
    if (error) {
      console.error('[handleUnban] Error:', error.message);
      alert('Error crítico al desbanear: ' + error.message);
    } else {
      onRefreshUsers();
    }
    setUnbanningId(null);
  };

  const handleToggleAdminConfirm = async () => {
    if (!confirmToggleAdmin) return;
    const { user, makeAdmin } = confirmToggleAdmin;
    setTogglingAdminId(user.id);
    const { error } = await supabase.from('profiles').update({ is_admin: makeAdmin }).eq('id', user.id);
    setTogglingAdminId(null);
    setConfirmToggleAdmin(null);
    if (error) {
      alert('Error al cambiar permisos: ' + error.message);
      return;
    }
    onRefreshUsers();
  };

  const handleExpel = (u: User) => {
    setExpelModal({ user: u });
  };

  const handleExpelConfirm = async () => {
    if (!expelModal) return;
    setExpellingId(expelModal.user.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'rejected',
          username: null 
        })
        .eq('id', expelModal.user.id);

      if (error) {
        alert('Error al expulsar al usuario: ' + error.message);
      } else {
        setExpelModal(null);
        onRefreshUsers();
      }
    } catch (e: any) {
      console.error('Exception expelling user:', e);
      alert('Error al expulsar al usuario: ' + e.message);
    }
    setExpellingId(null);
  };

  useEffect(() => {
    if (!banTimeModal) return;
    const t = setInterval(() => setBanTimeNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [banTimeModal]);

  /* ═══════════ EVENTOS ═══════════ */
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [eventModal, setEventModal] = useState<any | null>(null);
  const [eventAttendees, setEventAttendees] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [deleteEventConfirm, setDeleteEventConfirm] = useState<{ id: string; title: string } | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('user_events')
      .select('id, title, event_date, event_time, type, location, description, image_url, attendees_count, creator_id')
      .order('event_date', { ascending: false });
    if (error) console.error('Error fetching events:', error);
    setEvents(data || []);
    setLoadingEvents(false);
  }, []);

  const handleSaveEvent = async () => {
    if (!eventModal) return;
    setSavingEvent(true);
    const newCount = parseInt(eventAttendees) || 0;
    const { error } = await supabase
      .from('user_events')
      .update({ attendees_count: newCount })
      .eq('id', eventModal.id);
    if (error) { alert('Error al guardar: ' + error.message); setSavingEvent(false); return; }
    setEvents(prev => prev.map(e => e.id === eventModal.id ? { ...e, attendees_count: newCount } : e));
    setEventModal(null);
    setSavingEvent(false);
  };

  const handleDeleteEvent = async (id: string) => {
    setDeleteEventConfirm(null);
    setDeletingEventId(id);
    const { error } = await supabase.from('user_events').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar el evento: ' + error.message);
    } else {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
    setDeletingEventId(null);
  };

  /* ═══════════ RECOMPENSAS ═══════════ */
  const [rewards, setRewards] = useState<any[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [topNovas, setTopNovas] = useState<number | null>(null);
  const [rewardModal, setRewardModal] = useState<{ mode: 'create' | 'edit'; data?: any } | null>(null);
  const [rwName, setRwName] = useState('');
  const [rwNovas, setRwNovas] = useState('');
  const [rwIcon, setRwIcon] = useState('');
  const [rwColor, setRwColor] = useState('purple');
  const [rwIconOpen, setRwIconOpen] = useState(false);
  const [savingReward, setSavingReward] = useState(false);

  const fetchRewards = useCallback(async () => {
    setLoadingRewards(true);
    const [{ data }, { data: topUser }] = await Promise.all([
      supabase.from('rewards').select('*').order('cost_novas', { ascending: true }),
      supabase.from('profiles').select('novas').not('novas', 'is', null).order('novas', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setRewards(data || []);
    if (topUser) setTopNovas(topUser.novas);
    setLoadingRewards(false);
  }, []);

  const openRewardModal = (mode: 'create' | 'edit', r?: any) => {
    setRwName(r?.name || '');
    setRwNovas(r?.cost_novas?.toString() || '');
    setRwIcon(r?.icon_name || '');
    setRwColor(r?.color || 'purple');
    setRwIconOpen(false);
    setRewardModal({ mode, data: r });
  };

  const handleSaveReward = async () => {
    if (!rwName.trim() || !rwNovas.trim()) return;
    setSavingReward(true);
    const payload = {
      name: rwName.trim(),
      cost_novas: parseInt(rwNovas),
      icon_name: rwIcon.trim() || 'Gift',
      color: rwColor,
    };
    if (rewardModal?.mode === 'create') {
      const { data, error } = await supabase.from('rewards').insert(payload).select().maybeSingle();
      if (error) { alert('Error al crear: ' + error.message); }
      else if (data) { setRewards(prev => [...prev, data]); onRefreshRewards?.(); }
    } else if (rewardModal?.data?.id) {
      const { error } = await supabase.from('rewards').update(payload).eq('id', rewardModal.data.id);
      if (error) { alert('Error al actualizar: ' + error.message); }
      else { setRewards(prev => prev.map(r => r.id === rewardModal.data.id ? { ...r, ...payload } : r)); onRefreshRewards?.(); }
    }
    setRewardModal(null);
    setSavingReward(false);
  };

  const [deleteRewardConfirm, setDeleteRewardConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deletingRewardId, setDeletingRewardId] = useState<string | null>(null);

  const handleDeleteReward = async (id: string) => {
    setDeleteRewardConfirm(null);
    setDeletingRewardId(id);
    const { error } = await supabase.from('rewards').delete().eq('id', id);
    if (error) { alert('Error al eliminar: ' + error.message); setDeletingRewardId(null); return; }
    setRewards(prev => prev.filter(r => r.id !== id));
    setDeletingRewardId(null);
    onRefreshRewards?.();
  };

  /* ═══════════ INTERESES ═══════════ */
  const [dbInterests, setDbInterests] = useState<string[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [savingInterest, setSavingInterest] = useState(false);

  const fetchInterests = useCallback(async () => {
    setLoadingInterests(true);
    const { data } = await supabase.from('platform_interests').select('name').order('name');
    if (data && data.length > 0) {
      setDbInterests(data.map((d: any) => d.name));
    } else {
      setDbInterests([...PUBLIC_INTERESTS]);
    }
    setLoadingInterests(false);
  }, []);

  const handleAddInterest = async () => {
    const name = newInterest.trim();
    if (!name) return;
    setSavingInterest(true);
    const { error } = await supabase.from('platform_interests').insert({ name });
    if (!error) {
      setDbInterests(prev => [...prev, name].sort());
      setNewInterest('');
    } else {
      alert('Error al añadir. Asegúrate de que existe la tabla platform_interests en Supabase.');
    }
    setSavingInterest(false);
  };

  const [deleteInterestConfirm, setDeleteInterestConfirm] = useState<string | null>(null);
  const [editingInterest, setEditingInterest] = useState<string | null>(null);
  const [editInterestValue, setEditInterestValue] = useState('');
  const [savingInterestEdit, setSavingInterestEdit] = useState(false);

  const handleDeleteInterest = async (name: string) => {
    setDeleteInterestConfirm(null);
    await supabase.from('platform_interests').delete().eq('name', name);
    setDbInterests(prev => prev.filter(i => i !== name));
  };

  const handleEditInterest = async (oldName: string) => {
    const newName = editInterestValue.trim();
    if (!newName || newName === oldName) { setEditingInterest(null); return; }
    setSavingInterestEdit(true);
    const { error } = await supabase.from('platform_interests').update({ name: newName }).eq('name', oldName);
    if (!error) setDbInterests(prev => prev.map(i => i === oldName ? newName : i).sort());
    setSavingInterestEdit(false);
    setEditingInterest(null);
  };

  /* ═══════════ INSIGNIAS ═══════════ */
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [badgeCatFilter, setBadgeCatFilter] = useState<string>('all');
  const [badgeSearch, setBadgeSearch] = useState('');
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [badgeModal, setBadgeModal] = useState<{ mode: 'create' | 'edit'; data?: any } | null>(null);
  const [bdName, setBdName] = useState('');
  const [bdCategory, setBdCategory] = useState('congreso');
  const [bdNovas, setBdNovas] = useState('');
  const [bdImage, setBdImage] = useState('');
  const [bdUploadingImg, setBdUploadingImg] = useState(false);
  const [savingBadge, setSavingBadge] = useState(false);
  const imgFileRef = useRef<HTMLInputElement>(null);
  const [assignModal, setAssignModal] = useState<{ badge: any; mode: 'assign' | 'unassign' } | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [badgeHolderIds, setBadgeHolderIds] = useState<Set<string>>(new Set());
  const [loadingBadgeHolders, setLoadingBadgeHolders] = useState(false);

  /* ── Import badges from CSV/Excel ── */
  const [importModal, setImportModal] = useState(false);
  const [importBadgeSearch, setImportBadgeSearch] = useState('');
  const [importSelectedBadge, setImportSelectedBadge] = useState<any | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRunning, setImportRunning] = useState(false);
  const [importResult, setImportResult] = useState<{ assigned: number; notFound: string[]; alreadyHad: number } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const parseEmailsFromFile = async (file: File): Promise<string[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const emails: string[] = [];
    for (const row of rows) {
      // Column A is index 0
      const cell = String(row[0] ?? '').trim().toLowerCase();
      if (cell && cell.includes('@')) emails.push(cell);
    }
    return [...new globalThis.Set(emails)];
  };

  const runImport = async () => {
    if (!importSelectedBadge || !importFile) return;
    setImportRunning(true);
    setImportResult(null);
    try {
      const emails = await parseEmailsFromFile(importFile);
      if (emails.length === 0) { alert('No se encontraron correos válidos en el archivo.'); setImportRunning(false); return; }

      // Look up user_ids from emails in profiles
      const { data: profiles } = await supabase.from('profiles').select('id, email').in('email', emails);
      const foundMap = new globalThis.Map((profiles || []).map((p: any) => [p.email.toLowerCase(), p.id]));
      const notFound = emails.filter(e => !foundMap.has(e));

      const foundIds = [...foundMap.values()];
      if (foundIds.length === 0) { setImportResult({ assigned: 0, notFound, alreadyHad: 0 }); setImportRunning(false); return; }

      // Check which users already have this badge
      const { data: existing } = await supabase.from('user_badges').select('user_id').eq('badge_id', importSelectedBadge.id).in('user_id', foundIds);
      const alreadyHadSet = new Set((existing || []).map((r: any) => r.user_id));
      const toInsert = foundIds.filter(id => !alreadyHadSet.has(id));

      if (toInsert.length > 0) {
        const rows = toInsert.map(user_id => ({ user_id, badge_id: importSelectedBadge.id }));
        const { error } = await supabase.from('user_badges').insert(rows);
        if (error) { alert('Error al asignar insignias: ' + error.message); setImportRunning(false); return; }

        const novaValue = importSelectedBadge.nova_reward || importSelectedBadge.value || 0;

        // Send notification + add novas to each newly assigned user in parallel
        await Promise.all(toInsert.map(async (userId) => {
          await supabase.from('notifications').insert({
            user_id: userId,
            sender_id: userId,
            type: 'system',
            content: `Has recibido la insignia "${importSelectedBadge.label}"${novaValue > 0 ? ` y has ganado ${novaValue} novas` : ''}.`,
            is_read: false,
          });
          if (novaValue > 0) {
            const { error: rpcErr } = await supabase.rpc('add_novas', { target_user_id: userId, delta: novaValue });
            if (rpcErr) {
              const { data: p } = await supabase.from('profiles').select('novas').eq('id', userId).single();
              await supabase.from('profiles').update({ novas: (p?.novas || 0) + novaValue }).eq('id', userId);
            }
          }
        }));
      }

      setImportResult({ assigned: toInsert.length, notFound, alreadyHad: alreadyHadSet.size });
    } catch (e: any) {
      alert('Error procesando el archivo: ' + e.message);
    }
    setImportRunning(false);
  };

  const openAssignModal = async (badge: any, mode: 'assign' | 'unassign') => {
    setAssignSearch('');
    setAssignModal({ badge, mode });
    setLoadingBadgeHolders(true);
    const { data } = await supabase.from('user_badges').select('user_id').eq('badge_id', badge.id);
    setBadgeHolderIds(new Set((data || []).map((r: any) => r.user_id)));
    setLoadingBadgeHolders(false);
  };

  const fetchBadges = useCallback(async () => {
    setLoadingBadges(true);
    const { data: dbBadges } = await supabase.from('badges').select('id, label, nova_reward, category, image_url').order('label');
    const merged: any[] = [...BADGE_CATALOG.map(b => ({ ...b, _source: 'catalog' }))];
    if (dbBadges) {
      dbBadges.forEach((db: any) => {
        const idx = merged.findIndex(m => m.id.toLowerCase() === db.id.toLowerCase());
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...db, _source: 'db' };
        } else {
          merged.push({ ...db, _source: 'db' });
        }
      });
    }
    setAllBadges(merged);
    setLoadingBadges(false);
  }, []);

  const openBadgeModal = (mode: 'create' | 'edit', b?: any) => {
    setBdName(b?.label || '');
    setBdCategory(b?.category || 'congreso');
    setBdNovas(b?.nova_reward?.toString() || b?.value?.toString() || '');
    setBdImage(b?.image_url || b?.iconUrl || '');
    setBadgeModal({ mode, data: b });
  };

  const handleBadgeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBdUploadingImg(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('badge-images').upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('badge-images').getPublicUrl(path);
      setBdImage(publicUrl);
    }
    setBdUploadingImg(false);
    if (imgFileRef.current) imgFileRef.current.value = '';
  };

  const handleSaveBadge = async () => {
    if (!bdName.trim()) return;
    setSavingBadge(true);
    const payload = {
      label: bdName.trim(),
      category: bdCategory,
      nova_reward: parseInt(bdNovas) || 0,
      image_url: bdImage.trim() || null,
    };
    if (badgeModal?.mode === 'create') {
      const id = bdName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const { data, error } = await supabase.from('badges').insert({ id, ...payload }).select().maybeSingle();
      if (error) { alert('Error al crear: ' + error.message); setSavingBadge(false); return; }
      if (data) setAllBadges(prev => [...prev, { ...data, _source: 'db' }]);
    } else if (badgeModal?.data?.id) {
      const { error } = await supabase.from('badges').upsert({ id: badgeModal.data.id, ...payload }, { onConflict: 'id' });
      if (error) { alert('Error al guardar: ' + error.message); setSavingBadge(false); return; }
      setAllBadges(prev => prev.map(b => b.id === badgeModal.data.id ? { ...b, ...payload, image_url: payload.image_url, _source: 'db' } : b));
    }
    setBadgeModal(null);
    setSavingBadge(false);
    fetchBadges();
  };

  const handleDeleteBadge = (b: any) => {
    if (b._source === 'catalog') { alert('Las insignias del catálogo base no se pueden eliminar desde aquí.'); return; }
    setDeleteBadgeConfirm(b);
  };

  const confirmDeleteBadge = async () => {
    if (!deleteBadgeConfirm) return;
    await supabase.from('badges').delete().eq('id', deleteBadgeConfirm.id);
    setAllBadges(prev => prev.filter(x => x.id !== deleteBadgeConfirm.id));
    setDeleteBadgeConfirm(null);
  };

  const handleAssignBadge = async (userId: string, badge: any) => {
    setAssigningId(userId);
    const { error: insertErr } = await supabase.from('user_badges').insert({ user_id: userId, badge_id: badge.id });
    if (insertErr) { setAssigningId(null); return; }
    setBadgeHolderIds(prev => new Set([...prev, userId]));
    const novaValue = Number(badge.nova_reward ?? badge.value ?? 0);
    if (novaValue > 0) {
      const { error: rpcErr } = await supabase.rpc('add_novas', { target_user_id: userId, delta: novaValue });
      if (rpcErr) {
        const { data: p } = await supabase.from('profiles').select('novas').eq('id', userId).single();
        await supabase.from('profiles').update({ novas: (p?.novas || 0) + novaValue }).eq('id', userId);
      }
      await supabase.from('notifications').insert({
        user_id: userId,
        sender_id: userId,
        type: 'system',
        content: `Has recibido la insignia "${badge.label}" y has ganado ${novaValue} novas.`,
        is_read: false,
      });
    }
    setAssigningId(null);
  };

  const handleUnassignBadge = async (userId: string, badge: any) => {
    setAssigningId(userId);
    await supabase.from('user_badges').delete().eq('user_id', userId).eq('badge_id', badge.id);
    setBadgeHolderIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    const novaValue = Number(badge.nova_reward ?? badge.value ?? 0);
    if (novaValue > 0) {
      const { data: p } = await supabase.from('profiles').select('novas').eq('id', userId).single();
      const currentNovas = p?.novas || 0;
      const delta = -Math.min(novaValue, currentNovas); // never pushes below 0
      const { error: rpcErr } = await supabase.rpc('add_novas', { target_user_id: userId, delta });
      if (rpcErr) {
        await supabase.from('profiles').update({ novas: currentNovas + delta }).eq('id', userId);
      }
    }
    setAssigningId(null);
  };

  useEffect(() => {
    if (users.length === 0) {
      setLoadingUsers(true);
      onRefreshUsers();
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) setLoadingUsers(false);
  }, [users.length]);

  useEffect(() => {
    if (activeTab === 'eventos' && events.length === 0) fetchEvents();
    if (activeTab === 'recompensas' && rewards.length === 0) fetchRewards();
    if (activeTab === 'intereses' && dbInterests.length === 0) fetchInterests();
    if (activeTab === 'insignias' && allBadges.length === 0) fetchBadges();
    if (activeTab === 'mantenimiento') fetchReports();
  }, [activeTab]);

  useEffect(() => {
    fetchEvents();
    fetchBadges();
  }, []);

  const badgeCategories = [
    { id: 'congreso', label: 'Congreso' },
    { id: 'ranking',  label: 'Ranking' },
    { id: 'premio',   label: 'Premio' },
    { id: 'evento',   label: 'Evento' },
  ];

  const statusBadge = (status?: string, username?: string) => {
    if (status === 'active') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold">Activo</span>;
    if (status === 'pending') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold">Pendiente</span>;
    if (status === 'rejected' && (!username || username === '' || (username || '').startsWith('userdeleted'))) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">Expulsado</span>;
    if (status === 'rejected') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold">Rechazado</span>;
    return null;
  };

  const banLabel = (days: string) => {
    const map: Record<string, string> = { '1': '1 día', '3': '3 días', '7': '1 semana', '14': '2 semanas', '30': '1 mes', '0': 'Permanente' };
    return map[days] || `${days} días`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-[#0a0a0a] border-b border-slate-100 dark:border-zinc-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 py-4">
            <button onClick={() => navigate('/configuracion')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={20} className="text-slate-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600 rounded-xl">
                <LayoutDashboard size={18} className="text-white" />
              </div>
              <h1 className="font-black text-slate-900 dark:text-white text-lg leading-none">Panel de Control</h1>
            </div>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}>
                <tab.icon size={15} />
                {tab.label}
                {tab.id === 'usuarios' && bannedUsers > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{bannedUsers}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 pb-28 space-y-4">

        {/* ═══════════ USUARIOS ═══════════ */}
        {activeTab === 'usuarios' && (
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
              </div>
              <button onClick={onRefreshUsers} className="p-2.5 bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 hover:text-purple-600 transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-1 min-w-0">
                {(['all', 'active', 'banned', 'rejected', 'expelled', 'admins'] as const).map(f => (
                  <button key={f} onClick={() => setUserFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      userFilter === f ? 'bg-purple-600 text-white' : 'bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}>
                    {f === 'all' ? `Todos (${users.length})` : f === 'active' ? `Activos (${activeUsers})` : f === 'banned' ? `Baneados (${bannedUsers})` : f === 'rejected' ? `Rechazados (${rejectedUsers})` : f === 'expelled' ? `Expulsados (${expelledUsers})` : `Administradores (${adminUsers})`}
                  </button>
                ))}
              </div>
              {userFilter === 'admins' && (
                <button
                  onClick={() => { setManageAdminsSearch(''); setManageAdminsOpen(true); }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                  <Plus size={14} /> Gestionar
                </button>
              )}
            </div>
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
              {loadingUsers ? (
                <div className="py-12 flex justify-center"><Loader2 size={22} className="animate-spin text-purple-400" /></div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No hay usuarios</div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                  {filteredUsers.map(u => (
                    <div key={u.id}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button onClick={() => handleOpenUserDetail(u)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                          <img src={getSafeAvatar(u.avatar)} className="w-10 h-10 rounded-full object-cover shrink-0 hover:opacity-80 transition-opacity" alt="" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{u.name} {u.lastName}</span>
                              {statusBadge(u.status, u.username)}
                              {u.isBanned && u.bannedUntil && new Date(u.bannedUntil) > new Date() && (
                                <button onClick={e => { e.stopPropagation(); setBanTimeModal({ user: u }); }} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold flex items-center gap-0.5 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"><Ban size={9} />Baneado</button>
                              )}
                              {u.isOrganization
                                ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold flex items-center gap-0.5"><Building2 size={9} />Organización</span>
                                : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 font-bold flex items-center gap-0.5"><UserIcon size={9} />Personal</span>
                              }
                              {u.isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-bold">Admin</span>}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          {u.status === 'pending' && (
                            <>
                              <button onClick={() => onApproveUser(u.id, `virtual-${u.id}`)} className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="Aprobar"><CheckCircle2 size={15} /></button>
                              <button onClick={() => onRejectUser(u.id, `virtual-${u.id}`)} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-lg hover:bg-red-200 transition-colors" title="Rechazar"><XCircle size={15} /></button>
                            </>
                          )}
                          <button onClick={() => handleOpenContent(u)} className="p-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30 dark:hover:text-purple-400 transition-colors" title="Ver contenido"><FileText size={15} /></button>
                          {!isExpelled(u) && (
                            <>
                              {u.isBanned && u.bannedUntil && new Date(u.bannedUntil) > new Date() ? (
                                <button onClick={() => handleUnban(u)} disabled={unbanningId === u.id} className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50" title="Quitar baneo">
                                  {unbanningId === u.id ? <Loader2 size={15} className="animate-spin" /> : <ShieldOff size={15} />}
                                </button>
                              ) : (
                                <button onClick={() => setBanModal({ user: u })} className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors" title="Banear"><Ban size={15} /></button>
                              )}
                              <button onClick={() => handleExpel(u)} disabled={expellingId === u.id} className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50" title="Expulsar">
                                {expellingId === u.id ? <Loader2 size={15} className="animate-spin" /> : <UserMinus size={15} />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ EVENTOS ═══════════ */}
        {activeTab === 'eventos' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  placeholder={`Buscar entre ${events.length} eventos...`}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
              </div>
              <button onClick={fetchEvents} className="p-2 text-slate-400 hover:text-purple-600 transition-colors"><RefreshCw size={16} /></button>
            </div>
            {loadingEvents ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
            ) : (
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                {events.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">No hay eventos</div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                    {events.filter(ev => !eventSearch || (ev.title || '').toLowerCase().includes(eventSearch.toLowerCase())).map(ev => (
                      <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <button
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          onClick={() => { setEventModal(ev); setEventAttendees((ev.attendees_count ?? 0).toString()); }}
                        >
                          {ev.image_url
                            ? <img src={ev.image_url} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                            : <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0"><Calendar size={20} className="text-purple-600" /></div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{ev.title}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Calendar size={11} />{ev.event_date ? formatDate(ev.event_date) : '—'}</span>
                              {ev.location && <span className="flex items-center gap-1"><MapPin size={11} />{ev.location}</span>}
                            </div>
                          </div>
                          <div className="shrink-0 text-right mr-2">
                            <p className="text-lg font-black text-purple-600">{ev.attendees_count ?? 0}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">apoyos</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setDeleteEventConfirm({ id: ev.id, title: ev.title })}
                          disabled={deletingEventId === ev.id}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                          title="Eliminar evento"
                        >
                          {deletingEventId === ev.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ RECOMPENSAS ═══════════ */}
        {activeTab === 'recompensas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Recompensas</p>
              <div className="flex gap-2">
                <button onClick={fetchRewards} className="p-2 text-slate-400 hover:text-purple-600 transition-colors"><RefreshCw size={16} /></button>
                <button onClick={() => openRewardModal('create')} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors">
                  <Plus size={14} /> Nueva
                </button>
              </div>
            </div>
            {loadingRewards ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
            ) : (
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                {rewards.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">No hay recompensas</div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                    {rewards.map(r => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getRewardColors(r).bg}`}>
                          {React.createElement(getRewardIcon(r), { size: 18, className: getRewardColors(r).text })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{r.name}</p>
                          <p className="text-xs text-slate-400">
                            {r.name?.toLowerCase().includes('supernova') && topNovas !== null ? `${topNovas} novas` : `${r.cost_novas} novas`}
                          </p>
                        </div>
                        <button onClick={() => openRewardModal('edit', r)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteRewardConfirm({ id: r.id, name: r.name })} disabled={deletingRewardId === r.id} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50">
                          {deletingRewardId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ INTERESES ═══════════ */}
        {activeTab === 'intereses' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-zinc-400">Intereses disponibles en la red. Aparecen en Configuración → Intereses.</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={newInterest} onChange={e => setNewInterest(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddInterest(); }}
                  placeholder="Nuevo interés..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
              </div>
              <button onClick={handleAddInterest} disabled={savingInterest || !newInterest.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-50">
                {savingInterest ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Añadir
              </button>
            </div>
            {loadingInterests ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-purple-600" /></div>
            ) : (
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                {dbInterests.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">No hay intereses</div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                    {dbInterests.map(interest => (
                      <div key={interest} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center shrink-0"><Heart size={14} className="text-rose-500" /></div>
                        {editingInterest === interest ? (
                          <input
                            autoFocus
                            value={editInterestValue}
                            onChange={e => setEditInterestValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditInterest(interest);
                              if (e.key === 'Escape') setEditingInterest(null);
                            }}
                            className="flex-1 text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-zinc-800 border border-purple-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          <span className="flex-1 text-sm font-bold text-slate-800 dark:text-white">{interest}</span>
                        )}
                        {editingInterest === interest ? (
                          <>
                            <button onClick={() => handleEditInterest(interest)} disabled={savingInterestEdit} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50">
                              {savingInterestEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            </button>
                            <button onClick={() => setEditingInterest(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingInterest(interest); setEditInterestValue(interest); }} className="p-1.5 text-slate-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => setDeleteInterestConfirm(interest)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ INSIGNIAS ═══════════ */}
        {activeTab === 'insignias' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={badgeSearch}
                  onChange={e => setBadgeSearch(e.target.value)}
                  placeholder={`Buscar entre ${allBadges.length} insignias...`}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
              </div>
              <button onClick={fetchBadges} className="p-2 text-slate-400 hover:text-purple-600 transition-colors"><RefreshCw size={16} /></button>
              <button onClick={() => { setImportModal(true); setImportBadgeSearch(''); setImportSelectedBadge(null); setImportFile(null); setImportResult(null); }} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors border border-slate-200 dark:border-zinc-700">
                <Download size={14} /> Importar
              </button>
              <button onClick={() => openBadgeModal('create')} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors">
                <Plus size={14} /> Nueva
              </button>
            </div>
            {/* Filtro por categoría */}
            <div className="flex gap-2 flex-wrap">
              {[{ id: 'all', label: 'Todas' }, ...badgeCategories].map(c => (
                <button key={c.id} onClick={() => setBadgeCatFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${badgeCatFilter === c.id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:border-purple-400'}`}>
                  {c.label}
                </button>
              ))}
            </div>
            {loadingBadges ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-purple-600" /></div>
            ) : (() => {
              const filtered = allBadges.filter(b =>
                (badgeCatFilter === 'all' || b.category === badgeCatFilter) &&
                (!badgeSearch || (b.label || '').toLowerCase().includes(badgeSearch.toLowerCase()))
              );
              const grouped = badgeCategories.map(cat => ({
                ...cat,
                badges: filtered.filter(b => b.category === cat.id).sort((a, b) => (a.label || '').localeCompare(b.label || '', 'es')),
              })).filter(g => g.badges.length > 0);
              const uncategorized = filtered.filter(b => !badgeCategories.some(c => c.id === b.category));

              const renderBadgeRow = (b: any) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <img src={getBadgeImg(b)} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-zinc-800" alt={b.label} onError={e => { (e.target as HTMLImageElement).src = DEFAULT_BADGE_IMG; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{b.label}</p>
                    {(b.nova_reward || b.value) && <span className="text-[10px] font-bold text-purple-600">{b.nova_reward || b.value} novas</span>}
                  </div>
                  <button onClick={() => openAssignModal(b, 'assign')} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Asignar"><UserCheck size={14} /></button>
                  <button onClick={() => openAssignModal(b, 'unassign')} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Desasignar"><UserX size={14} /></button>
                  <button onClick={() => openBadgeModal('edit', b)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteBadge(b)} disabled={b._source === 'catalog'} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title={b._source === 'catalog' ? 'Catálogo base' : 'Eliminar'}><Trash2 size={14} /></button>
                </div>
              );

              if (filtered.length === 0) return <div className="py-12 text-center text-slate-400 text-sm bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800">No se encontraron insignias</div>;

              return (
                <div className="space-y-3">
                  {grouped.map(g => (
                    <div key={g.id} className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">{g.label}</span>
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                        {g.badges.map(renderBadgeRow)}
                      </div>
                    </div>
                  ))}
                  {uncategorized.length > 0 && (
                    <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Otros</span>
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                        {uncategorized.map(renderBadgeRow)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════ NOVAS ═══════════ */}
        {activeTab === 'novas' && (
          <div className="space-y-5">

            {/* Periodo */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                  <Coins size={20} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">Periodo de novas</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Define el rango de fechas en que los usuarios pueden acumular novas</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Inicio</label>
                  <input
                    type="date"
                    value={novaStartDate}
                    onChange={e => setNovaStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Fin</label>
                  <input
                    type="date"
                    value={novaEndDate}
                    onChange={e => setNovaEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
              </div>
              <button
                onClick={saveNovaPeriod}
                disabled={savingNovaPeriod || !novaStartDate || !novaEndDate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold transition-all disabled:opacity-50"
              >
                {savingNovaPeriod ? <Loader2 size={15} className="animate-spin" /> : novaPeriodSaved ? <CheckCircle2 size={15} /> : <Save size={15} />}
                {novaPeriodSaved ? 'Guardado' : 'Guardar periodo'}
              </button>
            </div>

            {/* Top 10 + Exportar */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">Top 10 usuarios</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Ranking por novas acumuladas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors ${exportFormat === 'csv' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                    >CSV</button>
                    <button
                      onClick={() => setExportFormat('excel')}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors ${exportFormat === 'excel' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                    >Excel</button>
                  </div>
                  <button
                    onClick={exportNovas}
                    disabled={exportingNovas || top10Users.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Download size={14} />
                    Exportar
                  </button>
                </div>
              </div>
              {top10Users.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {top10Users.map((u, i) => (
                    <div key={u.username} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">@{u.username}</p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{decodeEmail(u.email)}</p>
                      </div>
                      <span className="text-sm font-black text-purple-600 dark:text-purple-400 shrink-0">{u.novas.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reinicio */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border-2 border-red-100 dark:border-red-900/40 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <RefreshCw size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm mb-1">Reinicio de novas</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Restablece a 0 las novas de todos los usuarios. Esta acción no se puede deshacer.
                  </p>
                  <button
                    onClick={() => setConfirmResetNovas(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all"
                  >
                    <RefreshCw size={15} />
                    Reiniciar todas las novas
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ ADMINISTRACIÓN ═══════════ */}
        {activeTab === 'mantenimiento' && (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl w-fit">
              {(['reportes', 'mantenimiento'] as const).map(sub => (
                <button
                  key={sub}
                  onClick={() => setAdminSubTab(sub)}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                    adminSubTab === sub
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                  }`}
                >
                  {sub === 'reportes' ? <Flag size={14} /> : <Wrench size={14} />}
                  {sub === 'reportes' ? 'Reportes' : 'Mantenimiento'}
                </button>
              ))}
            </div>

            {/* ── Reportes ── */}
            {adminSubTab === 'reportes' && (
              <div className="space-y-3">
                {reportsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
                ) : reportedItems.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800">
                    <Flag size={32} className="mx-auto text-slate-200 dark:text-zinc-700 mb-3" />
                    <p className="text-sm font-bold text-slate-400">Sin reportes pendientes</p>
                  </div>
                ) : (
                  reportedItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">

                      {/* Card estilo feed */}
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getSafeAvatar(item.authorAvatar)}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-white dark:border-zinc-800 shadow-sm"
                            alt=""
                          />
                          <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{item.authorName}</span>
                            {item.authorUsername && (
                              <span className="text-xs text-slate-400 dark:text-zinc-500">@{item.authorUsername}</span>
                            )}
                            <span className="text-slate-200 dark:text-zinc-700 text-xs">·</span>
                            <span className="text-xs text-slate-400 dark:text-zinc-500">{formatDate(item.createdAt)}</span>
                            <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${item.reports.length >= 3 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                              {item.reports.length} {item.reports.length === 1 ? 'reporte' : 'reportes'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-zinc-300 line-clamp-3 leading-snug whitespace-pre-wrap mt-2 pl-[52px] pr-[80px]">{item.content}</p>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50 dark:border-zinc-800/60">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${item.type === 'news' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                              {item.type === 'news' ? 'Noticia' : 'Post'}
                            </span>
                            <button
                              onClick={() => setExpandedReport(item.id)}
                              className="text-[11px] font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center gap-1 transition-colors"
                            >
                              <Flag size={12} />
                              Ver Reportes
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteContent(item.type === 'news' ? 'news' : 'post', item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold transition-colors"
                          >
                            <Trash2 size={13} />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Mantenimiento ── */}
            {adminSubTab === 'mantenimiento' && (
              <div className="space-y-4">
                {/* Modo mantenimiento */}
                <div className={`rounded-2xl border-2 p-6 transition-all ${maintenanceMode ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-700' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#111]'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${maintenanceMode ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-slate-100 dark:bg-zinc-800'}`}>
                      <Wrench size={26} className={maintenanceMode ? 'text-orange-600' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Modo mantenimiento</h3>
                        {maintenanceMode && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500 text-white uppercase tracking-wide">Activo</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Cuando está activo, todos los usuarios excepto los administradores verán una pantalla de mantenimiento al intentar acceder a la plataforma.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setShowNoticeModal(true)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all"
                        >
                          <Bell size={15} />
                          Aviso Mantenimiento
                        </button>
                        <button
                          onClick={toggleMaintenance}
                          disabled={loadingMaintenance}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                            maintenanceMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600'
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                        >
                          {loadingMaintenance ? <Loader2 size={15} className="animate-spin" /> : <Wrench size={15} />}
                          {maintenanceMode ? 'Desactivar mantenimiento' : 'Activar mantenimiento'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aviso activo */}
                {activeNotice && (
                  <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Clock size={22} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">Aviso de mantenimiento activo</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500 text-white uppercase tracking-wide">Activo</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-zinc-400">
                          Inicio:{' '}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {new Date(activeNotice.start).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </p>
                        {activeNotice.end && (
                          <p className="text-sm text-slate-500 dark:text-zinc-500">
                            Fin:{' '}
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {new Date(activeNotice.end).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </p>
                        )}
                        <button
                          onClick={deactivateNotice}
                          className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition-all"
                        >
                          <X size={13} />
                          Desactivar aviso
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════ MODALS ═══════════ */}

      {/* ═══ MODAL DETALLE USUARIO ═══ */}
      {userDetailModal && (
        <Modal title={userDetailModal.name + (userDetailModal.lastName ? ' ' + userDetailModal.lastName : '')} onClose={() => setUserDetailModal(null)}>
          {/* Cabecera: avatar + novas toggle */}
          <div className="flex items-center gap-3 mb-3">
            <img src={getSafeAvatar(userDetailModal.avatar)} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-zinc-800 shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                {statusBadge(userDetailModal.status, userDetailModal.username)}
                {userDetailModal.isBanned && userDetailModal.bannedUntil && new Date(userDetailModal.bannedUntil) > new Date() && (
                  <button onClick={() => setBanTimeModal({ user: userDetailModal })} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold flex items-center gap-0.5 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"><Ban size={9} />Baneado</button>
                )}
                {userDetailModal.isOrganization
                  ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center gap-0.5"><Building2 size={9} />Organización</span>
                  : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center gap-0.5"><UserIcon size={9} />Personal</span>}
                {userDetailModal.isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">Admin</span>}
              </div>
              {userDetailModal.username && <p className="text-xs text-slate-400">@{userDetailModal.username}</p>}
            </div>
            <div className="flex items-stretch gap-1.5 shrink-0">
              <button
                onClick={() => { setShowNovaHistory(v => !v); setShowBadgeSection(false); }}
                className={`rounded-xl px-3 py-1.5 flex items-baseline gap-1 border transition-colors ${showNovaHistory ? 'bg-purple-600 border-purple-600' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/40'}`}
                title="Ver historial de novas"
              >
                <p className={`text-lg font-black ${showNovaHistory ? 'text-white' : 'text-purple-600'}`}>{userDetails[userDetailModal.id]?.profile?.novas ?? userDetailModal.novas ?? 0}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wide ${showNovaHistory ? 'text-purple-200' : 'text-purple-400'}`}>novas</p>
              </button>
              <button
                onClick={() => { setShowBadgeSection(v => !v); setShowNovaHistory(false); }}
                className={`rounded-xl px-3 py-1.5 flex items-center justify-center border transition-colors ${showBadgeSection ? 'bg-amber-500 border-amber-500' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}
                title="Ver insignias"
              >
                <Medal size={18} className={showBadgeSection ? 'text-white' : 'text-amber-500'} />
              </button>
            </div>
          </div>

          {loadingDetail === userDetailModal.id ? (
            <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin text-purple-500" /></div>
          ) : userDetails[userDetailModal.id] ? (() => {
            const d = userDetails[userDetailModal.id];
            const p = d.profile || {};

            /* ── Vista: Insignias ── */
            if (showBadgeSection) {
              const badgeIds: string[] = d.allBadgeIds || [];
              return (
                <div className="animate-in fade-in duration-150">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Insignias</p>
                  {badgeIds.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">Sin insignias</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {badgeIds.map((badge_id: string) => {
                        const cat = BADGE_CATALOG.find(b => b.id.toLowerCase() === badge_id.toLowerCase());
                        const dbEntry = allBadges.find((b: any) => b.id === badge_id);
                        const label = cat?.label || dbEntry?.label || badge_id;
                        const isAssigned = (d.badges || []).some((ub: any) => ub.badge_id === badge_id);
                        return (
                          <div key={badge_id} className={`flex items-center gap-2 rounded-xl px-2.5 py-2.5 border ${isAssigned ? 'bg-slate-50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}>
                            <img src={getBadgeImg({ id: badge_id, category: cat?.category })} className="w-7 h-7 rounded object-cover shrink-0" alt="" />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex-1 leading-tight">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* ── Vista: Historial de novas ── */
            if (showNovaHistory) {
              return (
                <div className="animate-in fade-in duration-150">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Historial de novas</p>
                  {d.novaHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">Sin historial disponible</p>
                  ) : (
                    <div className="space-y-1.5">
                      {d.novaHistory.map((rh: any, i: number) => {
                        const m = (rh.content || '').match(/Has ganado (\d+) novas por (.+)/i);
                        const amount = m ? m[1] : null;
                        const reason = m ? m[2] : rh.content;
                        return (
                          <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-xl px-3 py-2.5">
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">por {reason}</p>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{rh.created_at ? formatDate(rh.created_at) : '—'}</p>
                            </div>
                            <span className="text-sm font-black text-purple-600 shrink-0">{amount ? `+${amount}` : '+'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* ── Vista: Datos del usuario ── */
            const fields = userDetailModal.isOrganization ? [] : [
              { label: 'Cargo', value: userDetailModal.position || '—' },
              { label: 'Organización', value: userDetailModal.institution || '—' },
              { label: 'Categoría profesional', value: p.job_category || '—' },
              { label: 'Tipo de Organización', value: p.administration_type || '—' },
            ];
            const cell = (label: string, value: React.ReactNode) => (
              <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-400 text-[9px] uppercase tracking-wide font-bold mb-0.5">{label}</p>
                <p className="font-bold text-slate-800 dark:text-white text-xs truncate">{value}</p>
              </div>
            );
            return (
              <div className="space-y-3">
                {p.bio && (
                  <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-400 italic">"{p.bio}"</div>
                )}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {/* Nombre de usuario — editable */}
                  <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-slate-400 text-[9px] uppercase tracking-wide font-bold">Nombre de usuario</p>
                      <button onClick={() => { setEditingField('username'); setEditValue(userDetailModal.username || ''); }} className="p-0.5 text-slate-300 hover:text-purple-500 transition-colors"><Edit2 size={11} /></button>
                    </div>
                    {editingField === 'username' ? (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-slate-400 text-xs">@</span>
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSaveField(); if (e.key === 'Escape') { e.stopPropagation(); setEditingField(null); } }}
                          className="flex-1 bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-purple-500" />
                        <button onClick={handleSaveField} disabled={savingField} className="p-1 text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">
                          {savingField ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                        </button>
                        <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={10} /></button>
                      </div>
                    ) : (
                      <p className="font-bold text-slate-800 dark:text-white text-xs truncate">{userDetailModal.username ? `@${userDetailModal.username}` : '—'}</p>
                    )}
                  </div>
                  {/* Email — editable */}
                  <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-slate-400 text-[9px] uppercase tracking-wide font-bold">Email</p>
                      <button onClick={() => { setEditingField('email'); setEditValue(decodeEmail((userDetailModal as any).email || p.email || '')); }} className="p-0.5 text-slate-300 hover:text-purple-500 transition-colors"><Edit2 size={11} /></button>
                    </div>
                    {editingField === 'email' ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSaveField(); if (e.key === 'Escape') { e.stopPropagation(); setEditingField(null); } }}
                          className="flex-1 bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-purple-500" />
                        <button onClick={handleSaveField} disabled={savingField} className="p-1 text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">
                          {savingField ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                        </button>
                        <button onClick={() => setEditingField(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={10} /></button>
                      </div>
                    ) : (
                      <p className="font-bold text-slate-800 dark:text-white text-xs truncate">{decodeEmail((userDetailModal as any).email || p.email) || '—'}</p>
                    )}
                  </div>
                  {fields.map(item => (
                    <div key={item.label} className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-zinc-800">
                      <p className="text-slate-400 text-[9px] uppercase tracking-wide font-bold mb-0.5">{item.label}</p>
                      <p className="font-bold text-slate-800 dark:text-white text-xs truncate">{item.value}</p>
                    </div>
                  ))}
                  {userDetailModal.isOrganization
                    ? cell('Tipo de Organización', p.administration_type || '—')
                    : cell('Fecha de Nacimiento', p.birth_date ? formatDate(p.birth_date) : '—')
                  }
                  {cell('Seguidores / Siguiendo', `${p.followers_count ?? 0} / ${p.following_count ?? 0}`)}
                  {cell('Región', p.region || '—')}
                  {cell('País', p.country || '—')}
                </div>
              </div>
            );
          })() : null}
        </Modal>
      )}

      {deleteEventConfirm && (
        <Modal title="Eliminar evento" size="sm" onClose={() => setDeleteEventConfirm(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿Seguro que quieres eliminar <span className="font-bold text-slate-900 dark:text-white">"{deleteEventConfirm.title}"</span>?
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteEventConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDeleteEvent(deleteEventConfirm.id)} disabled={deletingEventId === deleteEventConfirm.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {deletingEventId === deleteEventConfirm.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteRewardConfirm && (
        <Modal title="Eliminar recompensa" size="sm" onClose={() => setDeleteRewardConfirm(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿Seguro que quieres eliminar <span className="font-bold text-slate-900 dark:text-white">"{deleteRewardConfirm.name}"</span>?
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteRewardConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDeleteReward(deleteRewardConfirm.id)} disabled={deletingRewardId === deleteRewardConfirm.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {deletingRewardId === deleteRewardConfirm.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteInterestConfirm && (
        <Modal title="Eliminar interés" size="sm" onClose={() => setDeleteInterestConfirm(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿Seguro que quieres eliminar <span className="font-bold text-slate-900 dark:text-white">"{deleteInterestConfirm}"</span>?
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteInterestConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={() => handleDeleteInterest(deleteInterestConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {manageAdminsOpen && (
        <Modal title="Gestionar administradores" onClose={() => setManageAdminsOpen(false)} size="md">
          <div className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={manageAdminsSearch}
                onChange={e => setManageAdminsSearch(e.target.value)}
                placeholder="Buscar usuario..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-[#111] rounded-xl border border-slate-100 dark:border-zinc-800">
              {users
                .filter(u => {
                  if (u.status !== 'active') return false;
                  if (!manageAdminsSearch) return true;
                  const q = manageAdminsSearch.toLowerCase();
                  return `${u.name} ${u.lastName || ''} ${u.username || ''} ${decodeEmail((u as any).email) || ''}`.toLowerCase().includes(q);
                })
                .sort((a, b) => {
                  if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
                  return `${a.name} ${a.lastName || ''}`.localeCompare(`${b.name} ${b.lastName || ''}`, 'es');
                })
                .slice(0, 100)
                .map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                    <img src={getSafeAvatar(u.avatar)} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{u.name} {u.lastName}</span>
                        {u.isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-bold">Admin</span>}
                      </div>
                      {u.username && <p className="text-xs text-slate-400 truncate">@{u.username}</p>}
                    </div>
                    <button
                      onClick={() => setConfirmToggleAdmin({ user: u, makeAdmin: !u.isAdmin })}
                      disabled={togglingAdminId === u.id}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                        u.isAdmin
                          ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}
                    >
                      {togglingAdminId === u.id ? <Loader2 size={13} className="animate-spin" /> : (u.isAdmin ? <ShieldOff size={13} /> : <Shield size={13} />)}
                      {u.isAdmin ? 'Quitar' : 'Añadir'}
                    </button>
                  </div>
                ))}
              {users.filter(u => u.status === 'active' && (!manageAdminsSearch || `${u.name} ${u.lastName || ''} ${u.username || ''}`.toLowerCase().includes(manageAdminsSearch.toLowerCase()))).length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400">No hay resultados</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {confirmToggleAdmin && (
        <Modal title={confirmToggleAdmin.makeAdmin ? 'Convertir en administrador' : 'Quitar administrador'} onClose={() => setConfirmToggleAdmin(null)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              {confirmToggleAdmin.makeAdmin ? (
                <>Se otorgarán permisos de administrador a <span className="font-bold text-slate-900 dark:text-white">{confirmToggleAdmin.user.name} {confirmToggleAdmin.user.lastName || ''}</span>. Podrá acceder al Panel de Control y a todas las acciones administrativas.</>
              ) : (
                <>Se retirarán los permisos de administrador a <span className="font-bold text-slate-900 dark:text-white">{confirmToggleAdmin.user.name} {confirmToggleAdmin.user.lastName || ''}</span>. Perderá el acceso al Panel de Control.</>
              )}
              {confirmToggleAdmin.user.id === currentUser.id && !confirmToggleAdmin.makeAdmin && (
                <> <span className="font-bold text-red-500">Estás quitándote tus propios permisos; perderás el acceso al panel.</span></>
              )}
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmToggleAdmin(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={handleToggleAdminConfirm} disabled={!!togglingAdminId}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  confirmToggleAdmin.makeAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-500 hover:bg-red-600'
                }`}>
                {togglingAdminId ? <Loader2 size={15} className="animate-spin" /> : (confirmToggleAdmin.makeAdmin ? <Shield size={15} /> : <ShieldOff size={15} />)}
                {confirmToggleAdmin.makeAdmin ? 'Convertir' : 'Quitar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmResetNovas && (
        <Modal title="Reiniciar novas" onClose={() => setConfirmResetNovas(false)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Se van a restablecer a <span className="font-bold text-slate-900 dark:text-white">0</span> las novas de <span className="font-bold text-slate-900 dark:text-white">todos los usuarios</span> y se borrará todo el historial de novas. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmResetNovas(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={resetAllNovas} disabled={resettingNovas}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {resettingNovas ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                Reiniciar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteBadgeConfirm && (
        <Modal title="Eliminar insignia" onClose={() => setDeleteBadgeConfirm(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <img src={getBadgeImg(deleteBadgeConfirm)} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" onError={e => { (e.target as HTMLImageElement).src = DEFAULT_BADGE_IMG; }} />
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{deleteBadgeConfirm.label}</p>
                <p className="text-xs text-slate-400 capitalize">{deleteBadgeConfirm.category}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              ¿Seguro que quieres eliminar esta insignia? Esta acción <span className="font-bold text-red-500">no se puede deshacer</span>.
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeleteBadgeConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={confirmDeleteBadge} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {banModal && (
        <Modal title={`Banear a ${banModal.user.name} ${banModal.user.lastName}`} onClose={() => setBanModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-zinc-400">Selecciona la duración del baneo.</p>
            <div className="grid grid-cols-3 gap-2">
              {[['1','1 día'],['3','3 días'],['7','1 semana'],['14','2 semanas'],['30','1 mes'],['0','Permanente']].map(([val, label]) => (
                <button key={val} onClick={() => setBanDays(val)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${banDays === val ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:border-amber-400'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setBanModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={handleBan} disabled={!!banningId}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {banningId ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                Banear {banLabel(banDays)}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {contentModal && (
        <Modal title={`Contenido de ${contentModal.user.name}${contentModal.user.lastName ? ' ' + contentModal.user.lastName : ''}`} onClose={() => { setContentModal(null); setContentSearch(''); setSwipedContent(null); }}>
          <div className="space-y-3">
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setContentTab('posts'); setContentSearch(''); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${contentTab === 'posts' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>
                <FileText size={13} /> Posts {!contentData.loading && `(${contentData.posts.length})`}
              </button>
              <button onClick={() => { setContentTab('news'); setContentSearch(''); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${contentTab === 'news' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>
                <Newspaper size={13} /> Noticias {!contentData.loading && `(${contentData.news.length})`}
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={contentSearch} onChange={e => setContentSearch(e.target.value)} placeholder="Buscar por contenido..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>
            {contentData.loading ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-purple-500" /></div>
            ) : contentTab === 'posts' ? (
              contentData.posts.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">{contentSearch ? 'Sin resultados' : 'Sin posts publicados'}</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-modal">
                  {contentData.posts.filter(p => !contentSearch || (p.content || '').toLowerCase().includes(contentSearch.toLowerCase())).map(post => {
                    const images = toImageArray(post.image_url);
                    const linkUrl = extractFirstUrl(post.content);
                    const linkedEvent = contentData.events[post.linked_event_id || post.event_id];
                    const isSwiped = swipedContent?.type === 'post' && swipedContent.id === post.id;
                    return (
                      <div key={post.id} className="relative overflow-hidden rounded-xl">
                        {isSwiped && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteContent('post', post.id); }}
                            className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center gap-1.5 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        )}
                        <div
                          onClick={() => { if (isSwiped) { setSwipedContent(null); return; } setContentModal(null); navigate(`/inicio/${post.id}`); }}
                          onContextMenu={e => { e.preventDefault(); setSwipedContent(isSwiped ? null : { type: 'post', id: post.id }); }}
                          className={`relative bg-slate-50 dark:bg-zinc-900/50 rounded-xl px-3 py-2.5 border border-slate-100 dark:border-zinc-800 space-y-2 select-none cursor-pointer hover:border-purple-200 dark:hover:border-purple-900/50 transition-all duration-200 ${isSwiped ? '-translate-x-24' : 'translate-x-0'}`}
                        >
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">{post.content || '—'}</p>
                          {images.length > 0 && (
                            <div className={`grid gap-1 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {images.map((img, i) => (
                                <img key={i} src={img} alt="" className="w-full rounded-lg object-cover max-h-40" />
                              ))}
                            </div>
                          )}
                          {!images.length && linkUrl && <LinkPreview url={linkUrl} />}
                          {linkedEvent && (
                            <EventPreview event={linkedEvent} language="es" isCompact />
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span>{formatDate(post.created_at)}</span>
                            <span>❤ {post.likes_count ?? 0}</span>
                            <span>💬 {post.comments_count ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              contentData.news.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">{contentSearch ? 'Sin resultados' : 'Sin noticias publicadas'}</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-modal">
                  {contentData.news.filter(n => !contentSearch || (n.title || '').toLowerCase().includes(contentSearch.toLowerCase()) || (n.content || '').toLowerCase().includes(contentSearch.toLowerCase())).map(item => {
                    const images = toImageArray(item.image_url);
                    const linkUrl = extractFirstUrl(item.content);
                    const isSwiped = swipedContent?.type === 'news' && swipedContent.id === item.id;
                    return (
                      <div key={item.id} className="relative overflow-hidden rounded-xl">
                        {isSwiped && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteContent('news', item.id); }}
                            className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center gap-1.5 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        )}
                        <div
                          onClick={() => { if (isSwiped) { setSwipedContent(null); return; } setContentModal(null); navigate(`/noticias/${item.id}`); }}
                          onContextMenu={e => { e.preventDefault(); setSwipedContent(isSwiped ? null : { type: 'news', id: item.id }); }}
                          className={`relative bg-slate-50 dark:bg-zinc-900/50 rounded-xl px-3 py-2.5 border border-slate-100 dark:border-zinc-800 select-none cursor-pointer hover:border-purple-200 dark:hover:border-purple-900/50 transition-all duration-200 ${isSwiped ? '-translate-x-24' : 'translate-x-0'}`}
                        >
                          {item.title && <p className="text-sm font-black text-slate-800 dark:text-white leading-snug">{item.title}</p>}
                          <div className="flex items-end gap-3">
                            <div className="flex-1 min-w-0">
                              {item.content && <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-4 leading-relaxed">{item.content}</p>}
                            </div>
                            {images.length > 0 && (
                              <img src={images[0]} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
                            )}
                          </div>
                          {!images.length && linkUrl && <div className="mt-1"><LinkPreview url={linkUrl} /></div>}
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5">
                            <span>{formatDate(item.created_at)}</span>
                            <span>▲ {item.up_votes_count ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </Modal>
      )}

      {/* ═══ MODAL AVISO MANTENIMIENTO ═══ */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 w-full max-w-md animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Bell size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Aviso de mantenimiento</h3>
              </div>
              <button onClick={() => { setShowNoticeModal(false); setNoticeStart(''); setNoticeEnd(''); setNoticeSent(false); }} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Inicio del mantenimiento *</label>
                <input
                  type="date"
                  value={noticeStart}
                  onChange={e => setNoticeStart(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Fin del mantenimiento <span className="font-normal text-slate-400">(opcional)</span></label>
                <input
                  type="date"
                  value={noticeEnd}
                  onChange={e => setNoticeEnd(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button
                onClick={sendMaintenanceNotice}
                disabled={!noticeStart || sendingNotice || noticeSent}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                  noticeSent ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {sendingNotice ? <Loader2 size={15} className="animate-spin" /> : noticeSent ? <CheckCircle2 size={15} /> : <Bell size={15} />}
                {noticeSent ? 'Aviso enviado' : sendingNotice ? 'Enviando...' : 'Enviar aviso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {banTimeModal && (() => {
        const end = new Date(banTimeModal.user.bannedUntil!).getTime();
        const isPermanent = new Date(banTimeModal.user.bannedUntil!).getFullYear() >= 2090;
        const diff = Math.max(0, end - banTimeNow);
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return (
          <Modal title="Tiempo de baneo restante" size="sm" onClose={() => setBanTimeModal(null)}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <img src={getSafeAvatar(banTimeModal.user.avatar)} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                <p className="font-bold text-slate-800 dark:text-white text-sm">{banTimeModal.user.name} {banTimeModal.user.lastName}</p>
              </div>
              {isPermanent ? (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 text-center">
                  <p className="text-red-600 dark:text-red-400 font-black text-sm">Suspensión permanente</p>
                </div>
              ) : (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 text-center space-y-2">
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wide">Tiempo restante</p>
                  <div className="flex items-center justify-center gap-4">
                    {days > 0 && (
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{days}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">días</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-900 dark:text-white">{String(hours).padStart(2, '0')}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">horas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-900 dark:text-white">{String(mins).padStart(2, '0')}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-900 dark:text-white">{String(secs).padStart(2, '0')}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">seg</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {expelModal && (
        <Modal title="Expulsar usuario" onClose={() => setExpelModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <img src={getSafeAvatar(expelModal.user.avatar)} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{expelModal.user.name} {expelModal.user.lastName}</p>
                <p className="text-xs text-slate-400">{decodeEmail((expelModal.user as any).email)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿Seguro que quieres expulsar a <span className="font-bold text-slate-900 dark:text-white">{expelModal.user.name}{expelModal.user.lastName ? ' ' + expelModal.user.lastName : ''}</span>? Su cuenta quedará desactivada.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setExpelModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={handleExpelConfirm} disabled={!!expellingId}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {expellingId ? <Loader2 size={15} className="animate-spin" /> : <UserMinus size={15} />}
                Expulsar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {eventModal && (
        <Modal title="Detalles del evento" onClose={() => setEventModal(null)}>
          <div className="space-y-4">
            {/* Imagen */}
            {eventModal.image_url && (
              <img src={eventModal.image_url} className="w-full h-40 rounded-xl object-cover" alt="" />
            )}

            {/* Título + apoyos */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-black text-slate-900 dark:text-white leading-snug">{eventModal.title}</p>
              <div className="shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-purple-500">
                <input
                  type="number" min="0" value={eventAttendees}
                  onChange={e => setEventAttendees(e.target.value)}
                  className="w-10 text-center text-base font-black text-purple-600 bg-transparent focus:outline-none dark:text-purple-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">apoyos</span>
                <div className="flex flex-col ml-0.5">
                  <button type="button" onClick={() => setEventAttendees(v => String(Math.max(0, parseInt(v || '0') + 1)))} className="text-slate-400 hover:text-purple-600 leading-none">
                    <ChevronUp size={12} />
                  </button>
                  <button type="button" onClick={() => setEventAttendees(v => String(Math.max(0, parseInt(v || '0') - 1)))} className="text-slate-400 hover:text-purple-600 leading-none">
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Fecha, hora, tipo */}
            <div className="flex flex-wrap gap-2">
              {eventModal.event_date && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg">
                  <Calendar size={12} className="text-purple-500" />
                  {formatDate(eventModal.event_date)}
                  {eventModal.event_time && ` · ${eventModal.event_time.slice(0, 5)}`}
                </span>
              )}
              {eventModal.type && (
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
                  eventModal.type === 'online'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                }`}>
                  {eventModal.type === 'online' ? 'Online' : 'Presencial'}
                </span>
              )}
            </div>

            {/* Ubicación */}
            {eventModal.location && (
              <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{eventModal.location}</span>
              </div>
            )}

            {/* Descripción */}
            {eventModal.description && (
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
                {eventModal.description}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setEventModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={handleSaveEvent} disabled={savingEvent}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {savingEvent ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {rewardModal && (() => {
        const REWARD_ICONS: { name: string; icon: React.FC<any> }[] = [
          // Premios y logros
          { name: 'Gift', icon: Gift }, { name: 'Trophy', icon: Trophy }, { name: 'Star', icon: Star },
          { name: 'Crown', icon: Crown }, { name: 'Award', icon: Award }, { name: 'Medal', icon: Medal },
          { name: 'Diamond', icon: Diamond }, { name: 'Gem', icon: Gem }, { name: 'Sparkles', icon: Sparkles },
          { name: 'Ticket', icon: Ticket }, { name: 'Flag', icon: Flag }, { name: 'Coins', icon: Coins },
          // Acción y energía
          { name: 'Zap', icon: Zap }, { name: 'Flame', icon: Flame }, { name: 'Rocket', icon: Rocket },
          { name: 'Target', icon: Target }, { name: 'Shield', icon: Shield }, { name: 'Layers', icon: Layers },
          // Personas y social
          { name: 'Heart', icon: Heart }, { name: 'Smile', icon: Smile }, { name: 'ThumbsUp', icon: ThumbsUp },
          { name: 'Handshake', icon: Handshake }, { name: 'HeartHandshake', icon: HeartHandshake }, { name: 'Users', icon: Users },
          { name: 'Megaphone', icon: Megaphone }, { name: 'Bell', icon: Bell }, { name: 'MessageCircle', icon: MessageCircle },
          // Educación y conocimiento
          { name: 'BookOpen', icon: BookOpen }, { name: 'GraduationCap', icon: GraduationCap }, { name: 'Lightbulb', icon: Lightbulb },
          { name: 'Telescope', icon: Telescope }, { name: 'Microscope', icon: Microscope }, { name: 'Compass', icon: Compass },
          // Trabajo y empresa
          { name: 'Briefcase', icon: Briefcase }, { name: 'Building2', icon: Building2 }, { name: 'Landmark', icon: Landmark },
          { name: 'HardHat', icon: HardHat }, { name: 'Wrench', icon: Wrench }, { name: 'Hammer', icon: Hammer },
          { name: 'ClipboardList', icon: ClipboardList }, { name: 'FileCheck', icon: FileCheck }, { name: 'FolderOpen', icon: FolderOpen },
          // Tecnología
          { name: 'Cpu', icon: Cpu }, { name: 'Code2', icon: Code2 }, { name: 'Terminal', icon: Terminal },
          { name: 'Database', icon: Database }, { name: 'Server', icon: Server }, { name: 'Wifi', icon: Wifi },
          { name: 'GitBranch', icon: GitBranch }, { name: 'BarChart2', icon: BarChart2 }, { name: 'TrendingUp', icon: TrendingUp },
          // Naturaleza y mundo
          { name: 'Globe', icon: Globe }, { name: 'Leaf', icon: Leaf }, { name: 'Sun', icon: Sun },
          { name: 'TreePine', icon: TreePine }, { name: 'Mountain', icon: Mountain }, { name: 'Waves', icon: Waves },
          { name: 'Cloud', icon: Cloud }, { name: 'Wind', icon: Wind }, { name: 'Flower2', icon: Flower2 },
          // Arte y comunicación
          { name: 'Music', icon: Music }, { name: 'Camera', icon: Camera }, { name: 'Palette', icon: Palette },
          { name: 'PenTool', icon: PenTool }, { name: 'Brush', icon: Brush }, { name: 'Tv', icon: Tv },
          { name: 'Headphones', icon: Headphones }, { name: 'Radio', icon: Radio }, { name: 'Send', icon: Send },
          // Lugares
          { name: 'Home', icon: Home }, { name: 'School', icon: School }, { name: 'Hospital', icon: Hospital },
          { name: 'Store', icon: Store }, { name: 'Hotel', icon: Hotel }, { name: 'Tent', icon: Tent },
          // Tiempo
          { name: 'Clock', icon: Clock }, { name: 'Hourglass', icon: Hourglass }, { name: 'Calendar', icon: Calendar },
          { name: 'Timer', icon: Timer }, { name: 'Watch', icon: Watch }, { name: 'AlarmClock', icon: AlarmClock },
          // Otros
          { name: 'Key', icon: Key }, { name: 'Lock', icon: Lock }, { name: 'Coffee', icon: Coffee },
          { name: 'Dumbbell', icon: Dumbbell }, { name: 'Footprints', icon: Footprints }, { name: 'Newspaper', icon: Newspaper },
          { name: 'Map', icon: MapIcon }, { name: 'Navigation', icon: Navigation }, { name: 'Activity', icon: Activity },
        ];
        const COLOR_OPTIONS: { label: string; key: string; swatch: string }[] = [
          { label: 'Morado',   key: 'purple',  swatch: 'bg-purple-500' },
          { label: 'Azul',     key: 'blue',    swatch: 'bg-blue-500' },
          { label: 'Verde',    key: 'green',   swatch: 'bg-green-500' },
          { label: 'Esmeralda',key: 'emerald', swatch: 'bg-emerald-500' },
          { label: 'Ámbar',    key: 'amber',   swatch: 'bg-amber-500' },
          { label: 'Naranja',  key: 'orange',  swatch: 'bg-orange-500' },
          { label: 'Rojo',     key: 'red',     swatch: 'bg-red-500' },
          { label: 'Rosa',     key: 'pink',    swatch: 'bg-pink-500' },
          { label: 'Índigo',   key: 'indigo',  swatch: 'bg-indigo-500' },
          { label: 'Cian',     key: 'cyan',    swatch: 'bg-cyan-500' },
          { label: 'Amarillo', key: 'yellow',  swatch: 'bg-yellow-500' },
          { label: 'Pizarra',  key: 'slate',   swatch: 'bg-slate-500' },
        ];
        const selectedColors = REWARD_COLOR_MAP[rwColor] || REWARD_COLOR_MAP.purple;
        const selectedIconDef = REWARD_ICONS.find(i => i.name === rwIcon) || REWARD_ICONS[0];
        return (
        <Modal title={rewardModal.mode === 'create' ? 'Nueva recompensa' : 'Editar recompensa'} onClose={() => setRewardModal(null)}>
          <div className="space-y-4">

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Nombre</label>
              <input value={rwName} onChange={e => setRwName(e.target.value)} placeholder="Nombre de la recompensa"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Novas equivalentes</label>
              <input type="number" min="0" value={rwNovas} onChange={e => setRwNovas(e.target.value)} placeholder="Ej: 50"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>

            {/* Selector de icono */}
            <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setRwIconOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selectedColors.bg}`}>
                    {React.createElement(selectedIconDef.icon, { size: 14, className: selectedColors.text })}
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Icono: {rwIcon || 'Gift'}</span>
                </div>
                {rwIconOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>
              {rwIconOpen && (
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-7 gap-1.5 max-h-44 overflow-y-auto scrollbar-modal">
                    {REWARD_ICONS.map(({ name, icon }) => (
                      <button key={name} type="button" onClick={() => setRwIcon(name)}
                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border-2 transition-all ${
                          rwIcon === name
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-zinc-700'
                        }`}
                        title={name}>
                        {React.createElement(icon, { size: 16, className: rwIcon === name ? 'text-purple-600' : 'text-slate-500 dark:text-zinc-400' })}
                        <span className="text-[8px] text-slate-400 leading-none truncate w-full text-center">{name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 dark:border-zinc-700 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Color</p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {COLOR_OPTIONS.map(({ label, key, swatch }) => (
                        <button key={key} type="button" onClick={() => setRwColor(key)}
                          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
                            rwColor === key ? 'border-purple-500' : 'border-transparent hover:bg-slate-100 dark:hover:bg-zinc-700'
                          }`}
                          title={label}>
                          <div className={`w-5 h-5 rounded-full ${swatch}`} />
                          <span className="text-[8px] text-slate-400 leading-none truncate w-full text-center">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setRewardModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={handleSaveReward} disabled={savingReward || !rwName.trim() || !rwNovas.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {savingReward ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
              </button>
            </div>
          </div>
        </Modal>
        );
      })()}

      {badgeModal && (
        <Modal title={badgeModal.mode === 'create' ? 'Nueva insignia' : 'Editar insignia'} onClose={() => setBadgeModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Nombre</label>
              <input value={bdName} onChange={e => setBdName(e.target.value)} placeholder="Nombre de la insignia"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Categoría</label>
              <select value={bdCategory} onChange={e => setBdCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white">
                {badgeCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Novas de recompensa</label>
              <input type="number" min="0" value={bdNovas} onChange={e => setBdNovas(e.target.value)} placeholder="Ej: 10"
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Imagen</label>
              {/* Preview */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={bdImage || DEFAULT_BADGE_IMG}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                  alt="preview"
                  onError={e => { (e.target as HTMLImageElement).src = DEFAULT_BADGE_IMG; }}
                />
                <div className="flex-1 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => imgFileRef.current?.click()}
                    disabled={bdUploadingImg}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-zinc-600 text-xs text-slate-500 dark:text-zinc-400 hover:border-purple-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                  >
                    {bdUploadingImg ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {bdUploadingImg ? 'Subiendo…' : 'Subir desde dispositivo'}
                  </button>
                  {bdImage && bdImage !== DEFAULT_BADGE_IMG && (
                    <button type="button" onClick={() => setBdImage('')} className="w-full text-[11px] text-red-400 hover:text-red-600 transition-colors">
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>
              {/* Biblioteca de imágenes */}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Biblioteca</p>
              <div className="grid grid-cols-4 gap-2">
                {/* Imagen por defecto */}
                {[
                  { src: DEFAULT_BADGE_IMG, label: 'Por defecto' },
                  { src: '/img/insignias/Congreso_2024.png', label: 'Congreso 2024' },
                  { src: '/img/insignias/Congreso_2025.png', label: 'Congreso 2025' },
                  { src: '/img/insignias/Excelencia_2025.png', label: 'Excelencia 2025' },
                  { src: '/img/insignias/InnoValencia.png', label: 'InnoValencia' },
                  { src: '/img/insignias/InnovamosLab.png', label: 'Innovamos Lab' },
                  { src: '/img/insignias/Burocrac_IA.png', label: 'Burocrac_IA' },
                  { src: '/img/insignias/top-1.png', label: 'TOP 1' },
                  { src: '/img/insignias/top-2.png', label: 'TOP 2' },
                  { src: '/img/insignias/top-3.png', label: 'TOP 3' },
                ].map(({ src, label }) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setBdImage(src)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all ${
                      bdImage === src ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-transparent hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <img src={src} className="w-10 h-10 rounded-lg object-cover" alt={label}
                      onError={e => { (e.target as HTMLImageElement).src = DEFAULT_BADGE_IMG; }} />
                    <span className="text-[8px] text-slate-400 text-center leading-none truncate w-full">{label}</span>
                  </button>
                ))}
              </div>
              <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBadgeImageUpload} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setBadgeModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={handleSaveBadge} disabled={savingBadge || !bdName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {savingBadge ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {assignModal && (
        <Modal title={assignModal.mode === 'assign' ? `Asignar "${assignModal.badge.label}"` : `Desasignar "${assignModal.badge.label}"`} onClose={() => { setAssignModal(null); setAssignSearch(''); }}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl">
              <img src={getBadgeImg(assignModal.badge)} className="w-10 h-10 rounded-xl object-cover" alt="" />
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{assignModal.badge.label}</p>
                <p className="text-xs text-slate-400 capitalize">{assignModal.badge.category} · {assignModal.badge.nova_reward || assignModal.badge.value || 0} novas</p>
              </div>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={assignSearch} onChange={e => setAssignSearch(e.target.value)} placeholder="Buscar usuario..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-modal">
              {loadingBadgeHolders ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-purple-400" /></div>
              ) : (() => {
                const filtered = users.filter(u => {
                  if (u.status !== 'active') return false;
                  const hasBadge = badgeHolderIds.has(u.id);
                  if (assignModal.mode === 'assign' && hasBadge) return false;
                  if (assignModal.mode === 'unassign' && !hasBadge) return false;
                  return !assignSearch || `${u.name} ${u.lastName || ''}`.toLowerCase().includes(assignSearch.toLowerCase());
                });
                if (filtered.length === 0) return (
                  <p className="text-center text-sm text-slate-400 py-6">
                    {assignModal.mode === 'assign' ? 'Todos los usuarios ya tienen esta insignia' : 'Ningún usuario tiene esta insignia'}
                  </p>
                );
                return filtered.map(u => (
                  <button key={u.id}
                    onClick={() => assignModal.mode === 'assign' ? handleAssignBadge(u.id, assignModal.badge) : handleUnassignBadge(u.id, assignModal.badge)}
                    disabled={assigningId === u.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 disabled:opacity-50">
                    <img src={getSafeAvatar(u.avatar)} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{u.name} {u.lastName}</p>
                      <p className="text-xs text-slate-400 truncate">{u.position}</p>
                    </div>
                    {assigningId === u.id ? <Loader2 size={14} className="animate-spin text-purple-600 shrink-0" /> : (
                      assignModal.mode === 'assign'
                        ? <UserCheck size={14} className="text-green-500 shrink-0" />
                        : <UserX size={14} className="text-amber-500 shrink-0" />
                    )}
                  </button>
                ));
              })()}
            </div>
          </div>
        </Modal>
      )}

      {importModal && (
        <Modal title="Importar insignia por email" onClose={() => setImportModal(false)}>
          <div className="space-y-4">
            {/* Badge selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Insignia</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={importBadgeSearch}
                  onChange={e => setImportBadgeSearch(e.target.value)}
                  placeholder="Buscar insignia..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1 scrollbar-modal">
                {allBadges
                  .filter(b => !importBadgeSearch || b.label.toLowerCase().includes(importBadgeSearch.toLowerCase()))
                  .map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setImportSelectedBadge(b)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left border ${
                        importSelectedBadge?.id === b.id
                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <img src={getBadgeImg(b)} className="w-8 h-8 rounded-lg object-cover shrink-0"
                        alt="" onError={e => { (e.target as HTMLImageElement).src = DEFAULT_BADGE_IMG; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{b.label}</p>
                        <p className="text-xs text-slate-400 capitalize">{b.category} · {b.nova_reward || b.value || 0} novas</p>
                      </div>
                      {importSelectedBadge?.id === b.id && <Check size={14} className="text-purple-500 shrink-0" />}
                    </button>
                  ))}
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Archivo de emails (.csv, .xlsx, .xls)</label>
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-600 text-sm text-slate-500 dark:text-zinc-400 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <Upload size={16} />
                {importFile ? importFile.name : 'Seleccionar archivo'}
              </button>
              <input ref={importFileRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden" onChange={e => { const f = e.target.files?.[0] || null; setImportFile(f); setImportResult(null); e.target.value = ''; }} />
              <p className="text-xs text-slate-400 mt-1.5 text-center">El archivo debe ser una columna de emails sin cabecera.</p>
              {importFile && (
                <p className="text-xs text-slate-400 mt-0.5 text-center">{importFile.name}</p>
              )}
            </div>

            {/* Result */}
            {importResult && (
              <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 space-y-1.5">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">✓ {importResult.assigned} insignias asignadas</p>
                {importResult.alreadyHad > 0 && (
                  <p className="text-xs text-slate-500">{importResult.alreadyHad} usuarios ya tenían la insignia</p>
                )}
                {importResult.notFound.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-amber-500 mb-1">{importResult.notFound.length} emails no encontrados:</p>
                    <div className="max-h-24 overflow-y-auto space-y-0.5">
                      {importResult.notFound.map(email => (
                        <p key={email} className="text-xs text-slate-400 truncate">{email}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setImportModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button
                onClick={runImport}
                disabled={importRunning || !importSelectedBadge || !importFile}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {importRunning ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {importRunning ? 'Importando…' : 'Importar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal popup reportes */}
      {expandedReport && (() => {
        const item = reportedItems.find(i => i.id === expandedReport);
        if (!item) return null;
        return ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setExpandedReport(null)}
          >
            <div
              className="bg-white dark:bg-[#111] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-zinc-800 flex flex-col max-h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                <p className="text-sm font-black text-slate-900 dark:text-white">Reportes</p>
                <button
                  onClick={() => setExpandedReport(null)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lista */}
              <div className="overflow-y-auto flex-1 min-h-0 divide-y divide-slate-50 dark:divide-zinc-800/60">
                {item.reports.map(rep => (
                  <div key={rep.id} className="flex items-start gap-3 px-5 py-3.5">
                    <img src={getSafeAvatar(rep.reporterAvatar)} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-white dark:border-zinc-800" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200">{rep.reporterName}</p>
                      {rep.reporterUsername && <p className="text-[10px] text-slate-400 dark:text-zinc-500">@{rep.reporterUsername}</p>}
                      {rep.reason && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                          {rep.reason}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0 pt-0.5">{formatDate(rep.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
};
