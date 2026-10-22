'use client';

import { useState, useEffect, useRef } from 'react';

const PRESET_BANNERS = [
  { name: 'Synthwave', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Gaming Neon', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Cyberpunk', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80' },
  { name: 'Cosmic Space', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('welcome');
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [toastMessage, setToastMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);

  // Welcome Config State
  const [savedConfig, setSavedConfig] = useState(null);
  const [config, setConfig] = useState({
    enabled: true,
    channelId: '1562640532226842737',
    title: 'Welcome to {server}!',
    message: 'Hey {user}, welcome to the server! We are thrilled to have you here. You are our #{memberCount} member! 🚀',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
    embedColor: '#6366f1',
  });

  // Customer Chat State
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [chatSearch, setChatSearch] = useState('');

  // Start New Chat Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatTarget, setNewChatTarget] = useState('');
  const [newChatMsg, setNewChatMsg] = useState('Hello! How can we help you today?');
  const [isStartingChat, setIsStartingChat] = useState(false);

  const messageEndRef = useRef(null);

  // Check if welcome config was modified (dirty check)
  const isDirty = Boolean(
    savedConfig &&
    config &&
    JSON.stringify(config) !== JSON.stringify(savedConfig)
  );

  // Fetch initial welcome config & server status
  useEffect(() => {
    async function loadInitial() {
      try {
        const [statusRes, configRes, chatsRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/welcome'),
          fetch('/api/chats'),
        ]);

        if (statusRes.ok) setServerStatus('Dashboard Online');

        if (configRes.ok) {
          const data = await configRes.json();
          setConfig(data);
          setSavedConfig(data);
        }

        if (chatsRes.ok) {
          const chatData = await chatsRes.json();
          if (chatData?.conversations) {
            setConversations(chatData.conversations);
            if (chatData.conversations.length > 0) {
              setActiveUserId(chatData.conversations[0].userId);
            }
          }
        }
      } catch {
        setServerStatus('Offline / Local');
      }
    }
    loadInitial();
  }, []);

  // Poll chats periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/chats');
        if (res.ok) {
          const data = await res.json();
          if (data?.conversations) {
            setConversations(data.conversations);
          }
        }
      } catch {
        // Ignore poll error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat feed
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeUserId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Immediate save helper (used when clicking picture presets or toggle)
  const saveConfigDirectly = async (newConf, successMessage = '✅ Saved live to Discord Bot!') => {
    setConfig(newConf);
    setSavedConfig(newConf);
    setIsSaving(true);
    try {
      const res = await fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConf),
      });

      if (res.ok) {
        showToast(successMessage);
      } else {
        showToast('❌ Failed to save configuration.');
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWelcome = async () => {
    if (!isDirty) return;
    await saveConfigDirectly(config, '✅ All settings saved to Discord Bot!');
  };

  // Test welcome message directly from website
  const handleTestInDiscord = async () => {
    setIsTestingDiscord(true);
    try {
      const res = await fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', channelId: config.channelId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🚀 Test welcome card posted to Discord!');
      } else {
        showToast(`❌ Discord test error: ${data.error}`);
      }
    } catch (err) {
      showToast(`❌ Error testing card: ${err.message}`);
    } finally {
      setIsTestingDiscord(false);
    }
  };

  const insertVariable = (varName) => {
    setConfig((prev) => ({
      ...prev,
      message: `${prev.message} ${varName}`,
    }));
  };

  // Send Reply to Active Customer
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeUserId || isSendingReply) return;

    setIsSendingReply(true);
    const textToSend = replyText.trim();
    setReplyText('');

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          userId: activeUserId,
          text: textToSend,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const refreshed = await fetch('/api/chats').then((r) => r.json());
        if (refreshed?.conversations) {
          setConversations(refreshed.conversations);
        }
        showToast(data.discordNote || '✅ Reply dispatched to customer on Discord!');
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      showToast(`❌ Failed to send reply: ${err.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Start New Conversation
  const handleStartConversation = async (e) => {
    e.preventDefault();
    if (!newChatTarget.trim() || isStartingChat) return;

    setIsStartingChat(true);
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          target: newChatTarget.trim(),
          initialMessage: newChatMsg.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.conversation) {
        const refreshed = await fetch('/api/chats').then((r) => r.json());
        if (refreshed?.conversations) {
          setConversations(refreshed.conversations);
        }
        setActiveUserId(data.conversation.userId);
        setIsNewChatModalOpen(false);
        setNewChatTarget('');
        showToast('✅ Conversation started with customer!');
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      showToast(`❌ Failed: ${err.message}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  const activeConversation = conversations.find((c) => c.userId === activeUserId) || conversations[0];

  const filteredConversations = conversations.filter((c) =>
    c.username.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.userId.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(chatSearch.toLowerCase())
  );

  // Formatted preview values
  const previewTitle = (config.title || 'Welcome!')
    .replace(/{server}/g, 'Discord Community')
    .replace(/{user}/g, 'Alex')
    .replace(/{memberCount}/g, '142');

  const previewDesc = (config.message || '')
    .replace(/{server}/g, 'Discord Community')
    .replace(/{user}/g, '@Alex')
    .replace(/{memberCount}/g, '142');

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Start New Conversation Modal */}
      {isNewChatModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewChatModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start Customer Conversation</h3>
              <button className="modal-close" onClick={() => setIsNewChatModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleStartConversation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Customer Discord User ID or Username</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1562510434412798052 or CustomerName"
                  value={newChatTarget}
                  onChange={(e) => setNewChatTarget(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Message</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '80px' }}
                  value={newChatMsg}
                  onChange={(e) => setNewChatMsg(e.target.value)}
                  placeholder="Type opening message..."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsNewChatModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isStartingChat}
                >
                  {isStartingChat ? 'Starting...' : '🚀 Start Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7 7 0 0 1 5.07 11H5a1 1 0 0 1 0-2h.07A7 7 0 0 1 11 3.07V3a1 1 0 0 1 2 0v.07A7 7 0 0 1 18.93 9H19a1 1 0 0 1 0 2h-.07A7 7 0 0 1 13 16.93z"></path>
            </svg>
          </div>
          <div className="brand-text">
            <h2>ModPortal</h2>
            <span className="badge">Discord Bot Dashboard</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">COMMUNICATION</div>
          <button
            className={`nav-item ${activeTab === 'welcome' ? 'active' : ''}`}
            onClick={() => setActiveTab('welcome')}
          >
            <span className="nav-icon">👋</span>
            <span>Welcome Studio</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <span className="nav-icon">💬</span>
            <span>Customer Chats</span>
            <span className="pill">{conversations.length}</span>
          </button>

          <div className="nav-section-title">MANAGEMENT</div>
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            <span>Overview</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <span className="nav-icon">🛡️</span>
            <span>Moderation</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <span className="nav-icon">📜</span>
            <span>Audit Logs</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator-box">
            <div className="status-dot pulsing"></div>
            <div className="status-details">
              <p className="status-label">Bot Bridge</p>
              <p className="status-val">{serverStatus}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search settings, channels, chats..." />
          </div>

          <div className="topbar-actions">
            <div className="bot-badge">
              <span className="bot-status-ring"></span>
              <span>Bot: FYP Project#0105</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-body">
          {/* TAB 1: WELCOME MESSAGE STUDIO */}
          {activeTab === 'welcome' && (
            <>
              {/* Banner with Live Sync Status & Save Button */}
              <div className="welcome-banner">
                <div className="welcome-text">
                  <h1>Welcome Message Studio</h1>
                  <p>Customize the automated greeting, banner picture, and target channel. Changes save live to your bot!</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: isSaving ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                    {isSaving ? '💾 Saving...' : '🟢 Live Synced with Bot'}
                  </span>

                  {isDirty && (
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveWelcome}
                      disabled={isSaving}
                      style={{
                        animation: 'pulse 1.8s infinite',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 0 15px rgba(99, 102, 241, 0.6)'
                      }}
                    >
                      <span>{isSaving ? 'Saving...' : '💾 Save Changes'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Welcome Editor Grid */}
              <div className="welcome-editor-grid">
                {/* Form Editor */}
                <div className="editor-card">
                  <div className="editor-card-header">
                    <div className="editor-title">
                      <h3>Message Configuration</h3>
                      <p>Fine-tune how your bot greets newcomers</p>
                    </div>
                    <div className="switch-container">
                      <span style={{ fontSize: '0.8rem', color: config.enabled ? '#10b981' : '#94a3b8' }}>
                        {config.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => saveConfigDirectly({ ...config, enabled: e.target.checked }, e.target.checked ? '✅ Welcome messages enabled!' : '⚠️ Welcome messages disabled!')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Target Channel */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Welcome Channel (ID or #name)</span>
                      <span className="form-label-desc">e.g. 1562640532226842737 or #welcome</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 1562640532226842737 or #welcome"
                      value={config.channelId}
                      onChange={(e) => setConfig({ ...config, channelId: e.target.value })}
                      onBlur={() => saveConfigDirectly(config, '✅ Channel setting saved to bot!')}
                    />
                  </div>

                  {/* Embed Title */}
                  <div className="form-group">
                    <label className="form-label">Embed Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Welcome to {server}!"
                      value={config.title}
                      onChange={(e) => setConfig({ ...config, title: e.target.value })}
                      onBlur={() => saveConfigDirectly(config, '✅ Title saved to bot!')}
                    />
                  </div>

                  {/* Message Description */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Welcome Message Text</span>
                      <span className="form-label-desc">Supports Discord markdown</span>
                    </label>
                    <textarea
                      className="form-textarea"
                      value={config.message}
                      onChange={(e) => setConfig({ ...config, message: e.target.value })}
                      onBlur={() => saveConfigDirectly(config, '✅ Message text saved to bot!')}
                    />
                    <div className="tag-chips">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', alignSelf: 'center' }}>Click to insert:</span>
                      <button type="button" className="chip" onClick={() => insertVariable('{user}')}>
                        {'{user}'}
                      </button>
                      <button type="button" className="chip" onClick={() => insertVariable('{server}')}>
                        {'{server}'}
                      </button>
                      <button type="button" className="chip" onClick={() => insertVariable('{memberCount}')}>
                        {'{memberCount}'}
                      </button>
                    </div>
                  </div>

                  {/* Banner Image URL & Instant Preset Selectors */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Welcome Picture / Banner URL</span>
                      <span className="form-label-desc">Click any picture below to apply instantly</span>
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://example.com/banner.jpg"
                      value={config.imageUrl}
                      onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })}
                      onBlur={() => saveConfigDirectly(config, '✅ Picture URL saved to bot!')}
                    />
                    <div className="preset-list">
                      {PRESET_BANNERS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          className={`preset-btn ${config.imageUrl === preset.url ? 'selected' : ''}`}
                          style={{ backgroundImage: `url(${preset.url})` }}
                          onClick={() => {
                            // IMMEDIATELY SAVE NEW PICTURE TO BOT!
                            saveConfigDirectly({ ...config, imageUrl: preset.url }, `🖼️ Changed to ${preset.name} picture & saved live!`);
                          }}
                        >
                          <span className="preset-label">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Embed Color */}
                  <div className="form-group">
                    <label className="form-label">Embed Accent Color</label>
                    <div className="color-picker-row">
                      <input
                        type="color"
                        className="color-input"
                        value={config.embedColor}
                        onChange={(e) => setConfig({ ...config, embedColor: e.target.value })}
                        onBlur={() => saveConfigDirectly(config, '✅ Accent color saved to bot!')}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '130px' }}
                        value={config.embedColor}
                        onChange={(e) => setConfig({ ...config, embedColor: e.target.value })}
                        onBlur={() => saveConfigDirectly(config, '✅ Accent color saved to bot!')}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Left-border accent in Discord</span>
                    </div>
                  </div>
                </div>

                {/* Live Discord Simulation Preview */}
                <div className="preview-container">
                  <div className="editor-card" style={{ height: 'fit-content' }}>
                    <div className="editor-card-header">
                      <div className="editor-title">
                        <h3>Live Discord Preview</h3>
                        <p>Simulating how your card looks right now</p>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleTestInDiscord}
                        disabled={isTestingDiscord}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {isTestingDiscord ? 'Sending...' : '⚡ Test in Discord'}
                      </button>
                    </div>

                    <div className="discord-mockup">
                      <div className="discord-header">
                        <div className="discord-avatar">🤖</div>
                        <div className="discord-meta">
                          <span className="discord-bot-name">FYP Project</span>
                          <span className="discord-bot-tag">BOT</span>
                          <span className="discord-time">Today at 12:00 PM</span>
                        </div>
                      </div>

                      <div className="discord-mention-line">
                        Welcome <span className="discord-mention">@Alex</span>! 👋
                      </div>

                      <div
                        className="discord-embed"
                        style={{ borderLeftColor: config.embedColor || '#6366f1' }}
                      >
                        <div className="embed-top-row">
                          <div className="embed-content">
                            <div className="embed-title">{previewTitle}</div>
                            <div className="embed-desc">{previewDesc}</div>
                          </div>
                          <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                            alt="Avatar"
                            className="embed-thumb"
                          />
                        </div>

                        {config.imageUrl && config.imageUrl.trim() !== '' && (
                          <img
                            src={config.imageUrl}
                            alt="Welcome Banner"
                            className="embed-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}

                        <div className="embed-footer">
                          Member #142 • Discord Community
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.4rem' }}>💡 Instant Testing:</p>
                      <p>• Click the <b>⚡ Test in Discord</b> button above to see this card in your server right away.</p>
                      <p style={{ marginTop: '0.25rem' }}>• Or in Discord, type <code>/testwelcome</code> anytime!</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CUSTOMER LIVE CHAT INBOX */}
          {activeTab === 'chats' && (
            <div className="chat-workspace">
              {/* Chat Sidebar */}
              <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                  <div className="chat-sidebar-title-row">
                    <h3>Customer Inbox</h3>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsNewChatModalOpen(true)}
                    >
                      + New Chat
                    </button>
                  </div>
                  <input
                    type="text"
                    className="chat-search-input"
                    placeholder="Search customers..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                  />
                </div>

                <div className="conversation-list">
                  {filteredConversations.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.85rem' }}>
                      No conversations found.<br />
                      Click <b>+ New Chat</b> to start one!
                    </div>
                  ) : (
                    filteredConversations.map((conv) => {
                      const isActive = activeConversation?.userId === conv.userId;
                      const timeStr = conv.lastUpdated
                        ? new Date(conv.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';
                      return (
                        <button
                          key={conv.userId}
                          className={`conversation-item ${isActive ? 'active' : ''}`}
                          onClick={() => setActiveUserId(conv.userId)}
                        >
                          <img
                            src={conv.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                            alt={conv.username}
                            className="conv-avatar"
                          />
                          <div className="conv-info">
                            <div className="conv-top">
                              <span className="conv-name">{conv.username}</span>
                              <span className="conv-time">{timeStr}</span>
                            </div>
                            <p className="conv-preview">{conv.lastMessage || 'No messages yet'}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Main Chat Thread Area */}
              <div className="chat-main-area">
                {activeConversation ? (
                  <>
                    <div className="chat-main-header">
                      <div className="customer-profile">
                        <img
                          src={activeConversation.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                          alt={activeConversation.username}
                          className="conv-avatar"
                        />
                        <div className="customer-name-group">
                          <h4>{activeConversation.username}</h4>
                          <span className="customer-id-pill">ID: {activeConversation.userId}</span>
                        </div>
                      </div>
                      <span className="chat-badge">Direct Message (Discord)</span>
                    </div>

                    <div className="message-feed">
                      {activeConversation.messages && activeConversation.messages.length > 0 ? (
                        activeConversation.messages.map((msg) => {
                          const isBot = msg.sender === 'bot';
                          const time = msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '';
                          return (
                            <div key={msg.id} className={`chat-bubble-row ${isBot ? 'bot' : 'customer'}`}>
                              <span className="bubble-sender">{isBot ? '🤖 Support (Bot)' : msg.senderName || 'Customer'}</span>
                              <div className="chat-bubble">{msg.text}</div>
                              <span className="bubble-time">{time}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-sub)', marginTop: '2rem' }}>
                          No messages in this thread yet. Send a message below to start chatting!
                        </div>
                      )}
                      <div ref={messageEndRef} />
                    </div>

                    <form className="chat-input-bar" onSubmit={handleSendReply}>
                      <input
                        type="text"
                        className="chat-textarea"
                        placeholder={`Reply to ${activeConversation.username} on Discord...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={isSendingReply}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!replyText.trim() || isSendingReply}
                      >
                        {isSendingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Select a conversation or click &quot;+ New Chat&quot; to begin.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">🤖</div>
                <div className="stat-info">
                  <span className="stat-title">Bot Status</span>
                  <h3 className="stat-value">Connected</h3>
                  <p className="stat-sub">FYP Project#0105</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">💬</div>
                <div className="stat-info">
                  <span className="stat-title">Customer Chats</span>
                  <h3 className="stat-value">{conversations.length} Active</h3>
                  <p className="stat-sub">Live DMs bridge active</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">👋</div>
                <div className="stat-info">
                  <span className="stat-title">Welcome Messages</span>
                  <h3 className="stat-value">{config.enabled ? 'Enabled' : 'Disabled'}</h3>
                  <p className="stat-sub">Target: #{config.channelId || 'welcome'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
