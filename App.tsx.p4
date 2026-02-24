
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
    let newUpvotes = (post as any).upvotes !== undefined ? (post as any).upvotes : 0;
    if (newUserLiked && dir === 'up') { newLikes--; newUserLiked = false; newUpvotes = Math.max(0, newUpvotes - 1); }
    else if (newUserDownvoted && dir === 'down') { newLikes++; newUserDownvoted = false; }
    else if (newUserLiked && dir === 'down') { newLikes -= 2; newUserLiked = false; newUserDownvoted = true; newUpvotes = Math.max(0, newUpvotes - 1); }
    else if (newUserDownvoted && dir === 'up') { newLikes += 2; newUserDownvoted = false; newUserLiked = true; newUpvotes++; }
    else if (dir === 'up') { newLikes++; newUserLiked = true; newUpvotes++; }
    else { newLikes--; newUserDownvoted = true; }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: newLikes, upvotes: newUpvotes, userLiked: newUserLiked, userDownvoted: newUserDownvoted } : p));
    try {
      const { data: existing } = await supabase.from(table).select('*').eq('user_id', session.user.id).eq(idField, id).maybeSingle();
      if (existing) {
        if (existing.vote_type === dir) {
          await supabase.from(table).delete().eq('user_id', session.user.id).eq(idField, id);
          if (dir === 'up') await supabase.from('notifications').delete().match({ user_id: post.authorId, sender_id: session.user.id, type: 'like', post_id: id });
        } else {
          await supabase.from(table).update({ vote_type: dir }).eq('user_id', session.user.id).eq(idField, id);
          if (dir === 'down') await supabase.from('notifications').delete().match({ user_id: post.authorId, sender_id: session.user.id, type: 'like', post_id: id });
          if (dir === 'up' && post.authorId !== session.user.id) {
            const { data: existingNotif } = await supabase.from('notifications').select('id').match({ user_id: post.authorId, sender_id: session.user.id, type: 'like', post_id: id }).maybeSingle();
            if (!existingNotif) await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'like', content: `le ha gustado tu ${isNews ? 'noticia' : 'post'}`, post_id: id });
          }
        }
      } else {
        await supabase.from(table).insert({ user_id: session.user.id, [idField]: id, vote_type: dir });
        if (post.authorId !== session.user.id && dir === 'up') {
          const { data: existingNotif } = await supabase.from('notifications').select('id').match({ user_id: post.authorId, sender_id: session.user.id, type: 'like', post_id: id }).maybeSingle();
          if (!existingNotif) await supabase.from('notifications').insert({ user_id: post.authorId, sender_id: session.user.id, type: 'like', content: `le ha gustado tu ${isNews ? 'noticia' : 'post'}`, post_id: id });
        }
      }
    } catch (err) { setPosts(prev => prev.map(p => p.id === id ? originalPost : p)); setToast({ message: 'Error al registrar tu voto.', type: 'error' }); }
    finally { setTimeout(() => setProcessingVotes(prev => { const next = new Set(prev); next.delete(id); return next; }), 500); }
  }, [session, posts, processingVotes, supabase]);

  const handleToggleFollow = useCallback(async (userId: string) => {
    if (!session?.user || userId === session.user.id || processingFollows.has(userId)) return;
    const isCurrentlyFollowing = followedUserIds.has(userId);
    setProcessingFollows(prev => new Set(prev).add(userId));
    setFollowedUserIds(prev => { const next = new Set(prev); if (isCurrentlyFollowing) next.delete(userId); else next.add(userId); return next; });
    try {
      if (isCurrentlyFollowing) {
        await supabase.from('follows').delete().match({ follower_id: session.user.id, followed_id: userId });
        await supabase.from('notifications').delete().match({ user_id: userId, sender_id: session.user.id, type: 'follow' });
        setToast({ message: 'Has dejado de seguir a este usuario.', type: 'info' });
      } else {
        await supabase.from('follows').insert({ follower_id: session.user.id, followed_id: userId });
        const { data: existingNotif } = await supabase.from('notifications').select('id').match({ user_id: userId, sender_id: session.user.id, type: 'follow' }).maybeSingle();
        if (!existingNotif) await supabase.from('notifications').insert({ user_id: userId, sender_id: session.user.id, type: 'follow', content: `ha comenzado a seguirte` });
        setToast({ message: '¡Ahora sigues a este usuario!', type: 'success' });
      }
      await Promise.all([fetchFollows(), fetchUserProfile(session.user.id)]);
    } catch (error: any) { console.error('Error toggle follow:', error.message); fetchFollows(); }
    finally { setTimeout(() => setProcessingFollows(prev => { const next = new Set(prev); next.delete(userId); return next; }), 400); }
  }, [session, followedUserIds, processingFollows]);

  const handleUpdateUser = async (updatedUser: User) => {
    if (!session?.user) return;
    setCurrentUserData(updatedUser);
    const { error } = await supabase.from('profiles').update({
      name: updatedUser.name, last_name: updatedUser.lastName, username: updatedUser.username?.toLowerCase().trim(),
      birth_date: updatedUser.birthDate || null, position: updatedUser.position, department: updatedUser.department,
      job_category: updatedUser.jobCategory, administration_type: updatedUser.administrationType,
      country: updatedUser.country, region: updatedUser.region, bio: updatedUser.bio, interests: updatedUser.interests,
      avatar: updatedUser.avatar, notification_settings: updatedUser.notificationSettings, updated_at: new Date().toISOString()
    }).eq('id', session.user.id);
    if (!error) { await Promise.all([fetchUserProfile(session.user.id), fetchUsers(), fetchFeed()]); setToast({ message: 'Guardado', type: 'success' }); }
    else { console.error('Error updating profile:', error); setToast({ message: 'Error al actualizar perfil', type: 'error' }); }
  };
    
