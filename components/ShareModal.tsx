
import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Copy, Check, Send, Flag, Search } from 'lucide-react';
import { Post, User, Chat } from '../types';
import { getSafeAvatar } from '../utils/avatarUtils';
import { supabase } from '../supabaseClient';

interface ShareModalProps {
  isOpen: boolean;
  post?: Post;
  event?: any;
  user?: User;
  onClose: () => void;
  onShare?: (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
  currentUser?: User;
  users?: User[];
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
  chats?: Chat[];
  chatsLoading?: boolean;
  language?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  post,
  event,
  user: sharedUser,
  onClose,
  onShare,
  currentUser,
  users = [],
  chats = [],
  chatsLoading = false,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [sentTo, setSentTo] = useState<string[]>([]);
  const [reportStep, setReportStep] = useState<'idle' | 'picking' | 'done'>('idle');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check on mount if user already reported this content
  React.useEffect(() => {
    if (!currentUser?.id || !post?.id) return;
    const isNews = post.type === 'news';
    supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', currentUser.id)
      .eq(isNews ? 'news_id' : 'post_id', post.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setAlreadyReported(true); setReportStep('done'); }
      });
  }, []);

  const REPORT_REASONS = [
    'Contenido inapropiado',
    'Spam o publicidad',
    'Desinformación o bulo',
    'Acoso o bullying',
    'Discurso de odio',
    'Otro',
  ];

  useScrollLock();

  const getPostBaseUrl = (postType?: string) => postType === 'news' ? 'noticias' : 'inicio';

  const shareUrl = sharedUser
    ? `https://red.novagob.org/${sharedUser.username || sharedUser.id}`
    : event
      ? `https://red.novagob.org/${event.creator_username || event.creator_id}/evento/${event.id}`
      : `https://red.novagob.org/${getPostBaseUrl(post?.type)}/${post?.id}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSend = (contact: Partial<User>) => {
    if (onShare) {
      const isNews = post?.type === 'news';
      onShare(
        contact.id,
        '',
        isNews ? undefined : post?.id,
        sharedUser?.id,
        event?.id,
        undefined,
        isNews ? post?.id : undefined,
        undefined
      );
    }
    setSentTo(prev => [...prev, contact.id]);
  };

  const checkAlreadyReported = () => {
    if (alreadyReported) return;
    setReportStep('picking');
  };

  const handleReport = async () => {
    const reason = selectedReason === 'Otro' ? (customReason.trim() || 'Otro') : selectedReason;
    if (!currentUser?.id || !reason || isReporting) return;
    setIsReporting(true);
    try {
      const isNews = post?.type === 'news';
      await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        post_id: !isNews ? post?.id : null,
        news_id: isNews ? post?.id : null,
        reason,
      });
    } catch {} // unique index violation = already reported, treat as success
    setIsReporting(false);
    setReportStep('done');
  };

  // Top 3 most recent unique chat participants — use participant data directly from chats
  const recentContacts = useMemo(() => {
    const seen = new Set<string>();
    const result: Partial<User>[] = [];
    for (const chat of chats) {
      if (result.length >= 3) break;
      const pid = chat.participant?.id;
      if (!pid || seen.has(pid) || pid === currentUser?.id) continue;
      seen.add(pid);
      result.push(chat.participant);
    }
    return result;
  }, [chats, currentUser?.id]);

  // Search results across all users
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter(u => u.id !== currentUser?.id)
      .filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [searchTerm, users, currentUser?.id]);

  const isSearching = searchTerm.trim().length > 0;
  const displayContacts: Partial<User>[] = isSearching ? searchResults : recentContacts;

  const isPostOrNews = !!post;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 md:p-16 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111] w-full max-w-sm rounded-[2.5rem] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Send size={16} />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {sharedUser ? 'Compartir Perfil' : event ? 'Compartir Evento' : post?.type === 'news' ? 'Compartir Noticia' : 'Compartir Post'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full text-slate-400 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Copy Link */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Enlace directo</label>
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <div className="flex-1 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-sm ${copied
                  ? 'bg-green-600 text-white scale-95'
                  : 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:shadow-md'
                }`}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span className="text-[10px] font-black">{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Send via chat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enviar por chat</label>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Contact list */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-hide pr-0.5">
              {chatsLoading && recentContacts.length === 0 && !isSearching ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-zinc-700 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-slate-200 dark:bg-zinc-700 rounded-full w-2/3" />
                      <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full w-1/3" />
                    </div>
                  </div>
                ))
              ) : displayContacts.length > 0 ? (
                displayContacts.map(contact => {
                  const isSent = sentTo.includes(contact.id ?? '');
                  return (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={getSafeAvatar(contact.avatar)}
                          className="w-9 h-9 rounded-xl object-cover border-2 border-white dark:border-zinc-800 shadow-sm"
                          alt=""
                        />
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {contact.name} {contact.lastName}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSend(contact)}
                        disabled={isSent}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 ${isSent
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isSent ? (
                          <span className="flex items-center gap-1"><Check size={11} strokeWidth={3} /> Enviado</span>
                        ) : 'Enviar'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-[11px] text-slate-400 py-3">
                  {isSearching ? 'Sin resultados' : 'No hay chats recientes'}
                </p>
              )}
            </div>
          </div>

          {/* Report — only for posts/news */}
          {isPostOrNews && (
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2">

              {/* Step: idle — simple button */}
              {reportStep === 'idle' && (
                <button
                  onClick={checkAlreadyReported}
                  disabled={alreadyReported}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 ${alreadyReported ? 'bg-slate-50 dark:bg-zinc-900/30 text-slate-400 border border-slate-100 dark:border-zinc-800 cursor-not-allowed' : 'bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-100 dark:border-red-900/30'}`}
                >
                  <Flag size={14} strokeWidth={2.5} />
                  {alreadyReported ? 'Reportado' : 'Reportar'}
                </button>
              )}

              {/* Step: picking reason */}
              {reportStep === 'picking' && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo del reporte</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {REPORT_REASONS.map(reason => (
                      <button
                        key={reason}
                        onClick={() => { setSelectedReason(reason); if (reason !== 'Otro') setCustomReason(''); }}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedReason === reason
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400'
                            : 'border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  {selectedReason === 'Otro' && (
                    <input
                      type="text"
                      placeholder="Describe el motivo..."
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setReportStep('idle'); setSelectedReason(''); setCustomReason(''); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleReport}
                      disabled={!selectedReason || (selectedReason === 'Otro' && !customReason.trim()) || isReporting}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {isReporting ? <><Check size={12} /> Enviando...</> : <><Flag size={12} /> Enviar reporte</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Step: done */}
              {reportStep === 'done' && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/30 text-slate-400 text-xs font-black border border-slate-100 dark:border-zinc-800">
                  Reportado
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
