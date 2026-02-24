
  if (isLoadingAuth) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>;

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => { navigate('/feed'); }} onRegister={() => navigate('/register')} />} />
        <Route path="/register" element={<Onboarding onComplete={() => navigate('/account/pending')} onCancel={() => navigate('/login')} />} />
        <Route path="/recover-password" element={<PasswordRecover onComplete={() => navigate('/login')} />} />
        <Route path="/account/pending" element={<PendingAccount onLogout={() => { supabase.auth.signOut(); navigate('/login'); }} />} />
        <Route path="/account/rejected" element={<RejectedAccount onLogout={() => { supabase.auth.signOut(); navigate('/login'); }} />} />
        <Route path="/*" element={
          (!session || !currentUserData) ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black"><Loader2 className="animate-spin text-brand" size={48} /></div>
          ) : (
            <Layout
              user={currentUserData!} notifications={notifications} globalEvents={globalEvents} posts={posts}
              searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
              onLogout={() => { sessionStorage.clear(); supabase.auth.signOut(); navigate('/login'); }}
              language={language} onRefresh={handleRefreshFeed} theme={theme} onThemeChange={setTheme}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/feed" replace />} />
                <Route path="/feed" element={
                  <SocialFeed
                    posts={posts.filter(p => p.type === 'post')} onLoadMore={handleLoadMore} hasMore={hasMorePosts}
                    isLoadingMore={isLoadingMore} user={currentUserData!} onLike={(id) => handleVote(id, 'up')}
                    onVote={handleVote} onRepost={handleRepost} onAddPost={handleAddPost} onAddComment={handleAddComment}
                    users={users} onNavigateToProfile={handleNavigateToProfile} followedUserIds={followedUserIds}
                    followerUserIds={followerUserIds} onToggleFollow={handleToggleFollow} onNavigateToPost={(id) => navigate(`/post/${id}`)}
                    onSearchHashtag={(t) => navigate(`/search?q=${encodeURIComponent(t)}`)} onDeletePost={handleDeletePost}
                    initialContent={prefilledPostContent} prefilledEvent={prefilledEvent} onClearInitialContent={() => { setPrefilledPostContent(null); setPrefilledEvent(null); }}
                    onViewCalendar={() => navigate('/calendar')} onNavigateToEvent={handleNavigateToEvent} chats={chats}
                    onShareViaChat={handleSendMessageFromShare} language={language} hasNewContent={hasNewPosts} onRefresh={handleRefreshFeed}
                    pinnedPosts={pinnedPosts} onTogglePin={handleTogglePin}
                  />
                } />
                <Route path="/news" element={
                  <NewsHubView
                    posts={posts.filter(p => p.type === 'news')} onLoadMore={handleLoadMore} hasMore={hasMorePosts}
                    isLoadingMore={isLoadingMore} user={currentUserData!} onVote={handleVote} onRepost={handleRepost}
                    onAddPost={handleAddPost} onAddComment={handleAddComment} currentUser={currentUserData!} users={users}
                    onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={(id) => navigate(`/post/${id}`)}
                    onSearchHashtag={(t) => navigate(`/search?q=${encodeURIComponent(t)}`)} onDeletePost={handleDeletePost}
                    chats={chats} followerUserIds={followerUserIds} onShareViaChat={handleSendMessageFromShare}
                    language={language} hasNewContent={hasNewPosts} onRefresh={handleRefreshFeed}
                  />
                } />
                <Route path="/calendar" element={<CalendarView onNavigateToEvent={handleNavigateToEvent} onPromoteEvent={(ev) => { setPrefilledPostContent(`📢 ¡Os invito a participar en este evento!\n\n${ev.title}\n\nhttps://red.novagob.org/u/${ev.creator_id}/e/${ev.id} #Evento`); setPrefilledEvent(ev); navigate('/feed'); }} onSupportEvent={handleSupportEvent} onShareEvent={setSharingEvent} initialDate={targetCalendarDate} language={language} />} />
                <Route path="/messages" element={<MessagesView chats={chats} currentUser={currentUserData!} onSendMessage={handleSendMessage} onMarkAsRead={handleMarkChatAsRead} activeChatUserId={activeChatUserId} onSelectChat={setActiveChatUserId} language={language} onNavigateToProfile={handleNavigateToProfile} />} />
                <Route path="/notifications" element={<NotificationsView notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} onNavigateToPost={(id) => navigate(`/post/${id}`)} onNavigateToProfile={handleNavigateToProfile} onLoadMore={() => { const newLimit = notificationsLimit + 15; setNotificationsLimit(newLimit); fetchNotifications(newLimit); }} hasMore={hasMoreNotifications} language={language} onApproveUser={handleApproveUser} onRejectUser={handleRejectUser} />} />
                <Route path="/store" element={<StoreView user={currentUserData!} onUpdateUser={handleUpdateUser} language={language} />} />
                <Route path="/settings" element={<SettingsView user={currentUserData!} onUpdateUser={handleUpdateUser} theme={theme} onThemeChange={setTheme} language={language} onLanguageChange={setLanguage} />} />
                <Route path="/search" element={<SearchRoute users={users} posts={posts} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={(id) => navigate(`/post/${id}`)} currentUser={currentUserData!} followedUserIds={followedUserIds} onToggleFollow={handleToggleFollow} language={language} />} />
                <Route path="/post/:postId" element={<PostDetailWrapper />} />
                <Route path="/:identifier" element={<ProfileRoute currentUser={currentUserData!} users={users} posts={posts} followedUserIds={followedUserIds} onToggleFollow={handleToggleFollow} onNavigateToProfile={handleNavigateToProfile} onNavigateToPost={(id) => navigate(`/post/${id}`)} onDeletePost={handleDeletePost} onLike={(id) => handleVote(id, 'up')} onVote={handleVote} onAddComment={handleAddComment} onRepost={handleRepost} onSearchHashtag={(t) => navigate(`/search?q=${encodeURIComponent(t)}`)} onAddReply={handleAddReply} onVoteComment={handleVoteComment} chats={chats} followerUserIds={followerUserIds} onShareViaChat={handleSendMessageFromShare} language={language} targetEventId={targetEventId} onClearTargetEvent={() => setTargetEventId(null)} onNavigateToEvent={handleNavigateToEvent} onSupportEvent={handleSupportEvent} onPromoteEvent={(ev) => { setPrefilledPostContent(`📢 ¡Os invito a participar en este evento!\n\n${ev.title}\n\nhttps://red.novagob.org/u/${ev.creator_id}/e/${ev.id} #Evento`); setPrefilledEvent(ev); navigate('/feed'); }} onTogglePin={handleTogglePin} pinnedPosts={pinnedPosts} />} />
              </Routes>
            </Layout>
          )
        } />
      </Routes>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {sharingEvent && <ShareModal isOpen={true} onClose={() => setSharingEvent(null)} type='event' data={sharingEvent} users={users} onShare={handleSendMessageFromShare} language={language} />}
      {sharingPost && <ShareModal isOpen={true} onClose={() => setSharingPost(null)} type='post' data={sharingPost} users={users} onShare={handleSendMessageFromShare} language={language} />}
    </div>
  );
};

export default App;
    
