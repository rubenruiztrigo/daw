
  const handleSupportEvent = async (event: CalendarEvent) => {
    if (!session?.user) return;
    setGlobalEvents(prev => prev.map(e => e.id === event.id ? { ...e, attendees: (e.attendees || 0) + 1 } : e));
    try {
      const { error } = await supabase.from('event_supports').insert({ user_id: session.user.id, event_id: event.id });
      if (error) { if (error.code === '23505') setToast({ message: 'Ya has apoyado este evento.', type: 'info' }); else throw error; }
      else {
        setToast({ message: '¡Estás apoyando este evento!', type: 'success' });
        if (event.creator_id !== session.user.id) {
          const { data: existing } = await supabase.from('notifications').select('id').match({ user_id: event.creator_id, sender_id: session.user.id, type: 'like', content: `está apoyando tu evento: ${event.title}` }).maybeSingle();
          if (!existing) await supabase.from('notifications').insert({ user_id: event.creator_id, sender_id: session.user.id, type: 'like', content: `está apoyando tu evento: ${event.title}` });
        }
      }
      fetchGlobalEvents();
    } catch (e: any) { console.error('Error supporting event:', e); setToast({ message: 'Error al apoyar evento.', type: 'error' }); fetchGlobalEvents(); }
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
      if (existingRepost) { await supabase.from('post_reposts').delete().eq('user_id', session.user.id).eq('post_id', postId); await supabase.from('notifications').delete().match({ user_id: targetPost.authorId, sender_id: session.user.id, type: 'repost', post_id: postId }); setToast({ message: 'Has eliminado tu republicación.', type: 'info' }); }
      else {
        await supabase.from('post_reposts').insert({ user_id: session.user.id, post_id: postId });
        if (targetPost.authorId !== session.user.id) {
          const { data: existingNotif } = await supabase.from('notifications').select('id').match({ user_id: targetPost.authorId, sender_id: session.user.id, type: 'repost', post_id: postId }).maybeSingle();
          if (!existingNotif) supabase.from('notifications').insert({ user_id: targetPost.authorId, sender_id: session.user.id, type: 'repost', content: `ha republicado tu post`, post_id: postId });
        }
        setToast({ message: '¡Publicación republicada!', type: 'success' });
      }
    } catch (err: any) { fetchFeed(); } finally { setTimeout(() => setProcessingReposts(prev => { const next = new Set(prev); next.delete(postId); return next; }), 500); }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!session?.user) return;
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
      if (error) throw error;
      await fetchNotifications();
      setToast({ message: 'Notificaciones marcadas como leídas.', type: 'success' });
    } catch (err: any) { console.error('Error marking all read:', err.message); setToast({ message: 'Error al actualizar notificaciones.', type: 'error' }); }
  };

  const handleMarkChatAsRead = async (chatId: string) => {
    if (!session?.user) return;
    setChats(prevChats => prevChats.map(c => {
      if (c.id === chatId) {
        const updatedMessages = c.messages.map(m => { if (m.senderId === chatId && !m.isRead) return { ...m, isRead: true }; return m; });
        return { ...c, messages: updatedMessages };
      }
      return c;
    }));
    try {
      await supabase.from('messages').update({ is_read: true }).eq('recipient_id', session.user.id).eq('sender_id', chatId).eq('is_read', false);
      fetchNotifications();
    } catch (err) { console.error('Error marking chat as read:', err); fetchChats(); }
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
      const { error } = await supabase.from('messages').insert({ sender_id: session.user.id, recipient_id: recipientId, text: encryptMessage(text), post_id: postShareId, is_post_share: !!postShareId, shared_profile_id: profileShareId, shared_event_id: sharedEventId });
      if (error) throw error;
      fetchChats();
    } catch (err: any) { console.error('Error sending message:', err.message); setToast({ message: 'Error al enviar el mensaje.', type: 'error' }); }
  };

  const handleSendMessageFromShare = async (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string, sharedEventId?: string) => {
    await handleSendMessage(recipientId, text, sharedPostId, sharedProfileId, sharedEventId);
    setToast({ message: 'Contenido compartido por chat.', type: 'success' });
  };
    
