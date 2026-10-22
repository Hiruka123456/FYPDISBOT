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

  // Inbox / Settings State
  const [inboxConfig, setInboxConfig] = useState({ channelId: '' });
  const [savedInboxConfig, setSavedInboxConfig] = useState(null);
  const [isSavingInbox, setIsSavingInbox] = useState(false);

  // Server Audit Logs State
  const [logsConfig, setLogsConfig] = useState({
    globalEnabled: true,
    defaultChannelId: '1562687171079708784',
    categories: {
      messages: { enabled: true, channelId: '', name: 'Message Events', description: 'Message deletions, edits, and bulk message purges', icon: '💬' },
      members: { enabled: true, channelId: '', name: 'Member Events', description: 'Member joins, leaves, role assignments, and nickname changes', icon: '👥' },
      moderation: { enabled: true, channelId: '', name: 'Moderation Events', description: 'Bans, unbans, kicks, and timeouts / mutes', icon: '🔨' },
      channels: { enabled: true, channelId: '', name: 'Channel Events', description: 'Channel creations, deletions, and permission changes', icon: '📁' },
      roles: { enabled: true, channelId: '', name: 'Role Events', description: 'Role creations, deletions, and permission modifications', icon: '🏷️' },
      voice: { enabled: true, channelId: '', name: 'Voice Events', description: 'Voice channel joins, leaves, and channel switches', icon: '🔊' },
      server: { enabled: true, channelId: '', name: 'Server Updates', description: 'Server name, icon, invite, and community updates', icon: '🌐' },
    },
  });
  const [savedLogsConfig, setSavedLogsConfig] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsCategoryFilter, setLogsCategoryFilter] = useState('all');
  const [logsSubView, setLogsSubView] = useState('settings'); // 'settings' | 'feed'
  const [isSavingLogs, setIsSavingLogs] = useState(false);
  const [isTestingLogs, setIsTestingLogs] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');

  const messageEndRef = useRef(null);
  // configRef keeps a live reference to config to avoid stale closures in onBlur handlers
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // Check if logs config was modified
  const isLogsDirty = Boolean(
    savedLogsConfig &&
    JSON.stringify(logsConfig) !== JSON.stringify(savedLogsConfig)
  );

  // Check if inbox config was modified
  const isInboxDirty = Boolean(
    savedInboxConfig &&
    JSON.stringify(inboxConfig) !== JSON.stringify(savedInboxConfig)
  );

  // Check if welcome config was modified (dirty check)
  const isDirty = Boolean(
    savedConfig &&
    config &&
    JSON.stringify(config) !== JSON.stringify(savedConfig)
  );

  // Fetch initial welcome config, server status, chats, inbox config & logs
  useEffect(() => {
    async function loadInitial() {
      try {
        const [statusRes, configRes, chatsRes, inboxRes, logsRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/welcome'),
          fetch('/api/chats'),
          fetch('/api/inbox'),
          fetch('/api/logs'),
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

        if (inboxRes.ok) {
          const inboxData = await inboxRes.json();
          setInboxConfig(inboxData);
          setSavedInboxConfig(inboxData);
        }

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          let mergedConfig = logsData?.config || {};

          // Read client-side localStorage backup so Vercel refresh never wipes settings
          try {
            const cached = localStorage.getItem('modportal_logs_config');
            if (cached) {
              const parsedCache = JSON.parse(cached);
              mergedConfig = {
                ...mergedConfig,
                ...parsedCache,
                defaultChannelId: parsedCache.defaultChannelId || mergedConfig.defaultChannelId || '1562687171079708784',
                categories: {
                  ...(mergedConfig.categories || {}),
                  ...(parsedCache.categories || {}),
                },
              };
            }
          } catch {}

          if (!mergedConfig.defaultChannelId || mergedConfig.defaultChannelId === '1562655416062705815') {
            mergedConfig.defaultChannelId = '1562687171079708784';
          }

          setLogsConfig(mergedConfig);
          setSavedLogsConfig(mergedConfig);
          if (Array.isArray(logsData?.recentLogs)) {
            setRecentLogs(logsData.recentLogs);
          }
        }
      } catch {
        setServerStatus('Offline / Local');
      }
    }
    loadInitial();
  }, []);

  // Poll chats and logs periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [resChats, resLogs] = await Promise.all([
          fetch('/api/chats'),
          fetch('/api/logs'),
        ]);
        if (resChats.ok) {
          const data = await resChats.json();
          if (data?.conversations) {
            setConversations(data.conversations);
          }
        }
        if (resLogs.ok) {
          const logsData = await resLogs.json();
          if (Array.isArray(logsData?.recentLogs)) {
            setRecentLogs(logsData.recentLogs);
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

  // Save Inbox Config to /api/inbox
  const handleSaveInbox = async () => {
    if (!isInboxDirty) return;
    setIsSavingInbox(true);
    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inboxConfig),
      });
      if (res.ok) {
        setSavedInboxConfig(inboxConfig);
        showToast('📥 Inbox channel saved! All replies will go there.');
      } else {
        showToast('❌ Failed to save inbox settings.');
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSavingInbox(false);
    }
  };

  // Save inbox immediately on blur
  const saveInboxDirectly = async (newCfg) => {
    setInboxConfig(newCfg);
    setSavedInboxConfig(newCfg);
    try {
      await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCfg),
      });
      showToast('📥 Inbox channel saved to bot!');
    } catch {}
  };

  // Save Logs Configuration
  const handleSaveLogs = async (overrideCfg) => {
    const cfgToSave = overrideCfg || logsConfig;
    setIsSavingLogs(true);
    try {
      try {
        localStorage.setItem('modportal_logs_config', JSON.stringify(cfgToSave));
      } catch {}
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfgToSave),
      });
      if (res.ok) {
        const data = await res.json();
        setLogsConfig(data.config);
        setSavedLogsConfig(data.config);
        showToast('🛡️ Audit Logs settings saved and synced with Discord!');
      } else {
        showToast('❌ Failed to save audit logs settings.');
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSavingLogs(false);
    }
  };

  // Test Audit Log in Discord
  const handleTestLogs = async (targetChannelId) => {
    setIsTestingLogs(true);
    const ch = (targetChannelId || logsConfig.defaultChannelId || '1562687171079708784').trim();
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', channelId: ch }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('🚀 Test audit log posted to Discord channel!');
      } else {
        showToast(`❌ Discord test error: ${data.error || 'Failed to send'}`);
      }
    } catch (err) {
      showToast(`❌ Test error: ${err.message}`);
    } finally {
      setIsTestingLogs(false);
    }
  };

  const handleToggleCategory = (catKey) => {
    const current = logsConfig.categories?.[catKey] || {};
    const updated = {
      ...logsConfig,
      categories: {
        ...logsConfig.categories,
        [catKey]: {
          ...current,
          enabled: !current.enabled,
        },
      },
    };
    setLogsConfig(updated);
    handleSaveLogs(updated);
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
      if (res.ok && data.success) {
        const refreshed = await fetch('/api/chats').then((r) => r.json());
        if (refreshed?.conversations) {
          setConversations(refreshed.conversations);
        }
        showToast(data.note || (data.dmSent ? '✅ Reply sent to customer on Discord!' : '✅ Reply saved (DM may be blocked by customer)'));
      } else {
        showToast(`❌ Error: ${data.error || 'Unknown error'}`);
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
      if (res.ok && data.success) {
        // Refresh conversations list
        const refreshed = await fetch('/api/chats').then((r) => r.json());
        if (refreshed?.conversations) {
          setConversations(refreshed.conversations);
        }
        // Select the new conversation
        if (data.conversation?.userId) {
          setActiveUserId(data.conversation.userId);
        }
        setIsNewChatModalOpen(false);
        setNewChatTarget('');
        setNewChatMsg('Hello! How can we help you today?');
        showToast(data.note || (data.dmSent
          ? '✅ Chat started & message sent to customer on Discord!'
          : `⚠️ Chat created in dashboard (DM not delivered: ${data.dmError || 'DMs blocked by privacy settings'})`));
      } else {
        showToast(`❌ ${data.error || 'Could not start conversation'}`);
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
                  <span>Customer Discord User ID</span>
                  <span className="form-label-desc">Must be a real Discord user (not the bot ID)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 496682662522519563"
                  value={newChatTarget}
                  onChange={(e) => setNewChatTarget(e.target.value)}
                  required
                  autoFocus
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block', lineHeight: 1.4 }}>
                  💡 <b>How to get User ID:</b> In Discord, go to User Settings ⚙️ → Advanced → turn ON <b>Developer Mode</b>. Then right-click the customer&apos;s name or avatar and click <b>Copy User ID</b>.
                </span>
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
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span>Bot Settings</span>
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
                      onBlur={() => saveConfigDirectly(configRef.current, '✅ Channel setting saved to bot!')}
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
                      onBlur={() => saveConfigDirectly(configRef.current, '✅ Title saved to bot!')}
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
                      onBlur={() => saveConfigDirectly(configRef.current, '✅ Message text saved to bot!')}
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
                      onBlur={() => saveConfigDirectly(configRef.current, '✅ Picture URL saved to bot!')}
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
                        onBlur={() => saveConfigDirectly(configRef.current, '✅ Accent color saved to bot!')}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '130px' }}
                        value={config.embedColor}
                        onChange={(e) => setConfig({ ...config, embedColor: e.target.value })}
                        onBlur={() => saveConfigDirectly(configRef.current, '✅ Accent color saved to bot!')}
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

          {/* TAB: BOT SETTINGS (Inbox Channel) */}
          {activeTab === 'settings' && (
            <>
              <div className="welcome-banner">
                <div className="welcome-text">
                  <h1>Bot Settings</h1>
                  <p>Configure the Inbox channel — all customer DMs and support replies go here.</p>
                </div>
                {isInboxDirty && (
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveInbox}
                    disabled={isSavingInbox}
                    style={{ animation: 'pulse 1.8s infinite', boxShadow: '0 0 15px rgba(99,102,241,0.6)' }}
                  >
                    {isSavingInbox ? 'Saving...' : '💾 Save Changes'}
                  </button>
                )}
              </div>

              <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Inbox Channel Card */}
                <div className="editor-card">
                  <div className="editor-card-header">
                    <div className="editor-title">
                      <h3>📥 Inbox Channel</h3>
                      <p>Every customer DM and every reply you send will be logged here on Discord</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span>Inbox Channel ID</span>
                      <span className="form-label-desc">Paste the Discord channel ID (right-click channel → Copy ID)</span>
                    </label>
                    <input
                      id="inbox-channel-id"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 1234567890123456789"
                      value={inboxConfig.channelId || ''}
                      onChange={(e) => setInboxConfig({ ...inboxConfig, channelId: e.target.value })}
                      onBlur={() => saveInboxDirectly(inboxConfig)}
                    />
                  </div>

                  {/* Status indicator */}
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: inboxConfig.channelId ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                    border: `1px solid ${inboxConfig.channelId ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.85rem',
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>{inboxConfig.channelId ? '✅' : '⚠️'}</span>
                    <span style={{ color: inboxConfig.channelId ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                      {inboxConfig.channelId
                        ? `Inbox set to channel ID: ${inboxConfig.channelId}`
                        : 'No inbox channel set — messages will not be forwarded to Discord'}
                    </span>
                  </div>
                </div>

                {/* How it works card */}
                <div className="editor-card" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="editor-title" style={{ marginBottom: '1rem' }}>
                    <h3>💡 How the Inbox Works</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📩</span>
                      <span>When a <b>customer DMs the bot</b>, the message is forwarded to this Inbox channel as an embed, showing their username and ID.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📤</span>
                      <span>When you <b>reply from the dashboard</b> or use <code>/reply</code>, the reply also gets logged here so your team can track everything.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🔔</span>
                      <span>Use Discord's <b>notification settings</b> on this channel to get instant alerts when customers reach out.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⌨️</span>
                      <span>You can also use <code>/reply userid:&lt;ID&gt; message:&lt;text&gt;</code> directly in Discord to send a DM and log it here.</span>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <>
              {/* Header Banner */}
              <div className="welcome-banner">
                <div className="welcome-text">
                  <h1>Server Audit Logs</h1>
                  <p>Comprehensive logging for all Discord server events — track who did it, what was done, and to whom.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    className={`btn ${logsConfig.globalEnabled ? 'btn-secondary' : 'btn-danger'}`}
                    style={{
                      background: logsConfig.globalEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      borderColor: logsConfig.globalEnabled ? '#10b981' : '#ef4444',
                      color: logsConfig.globalEnabled ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      const updated = { ...logsConfig, globalEnabled: !logsConfig.globalEnabled };
                      setLogsConfig(updated);
                      handleSaveLogs(updated);
                    }}
                  >
                    {logsConfig.globalEnabled ? '🟢 System: ACTIVE' : '🔴 System: PAUSED'}
                  </button>
                  {isLogsDirty && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSaveLogs()}
                      disabled={isSavingLogs}
                      style={{ animation: 'pulse 1.8s infinite', boxShadow: '0 0 15px rgba(99,102,241,0.6)' }}
                    >
                      {isSavingLogs ? 'Saving...' : '💾 Save Changes'}
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-view switcher */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  className={`btn ${logsSubView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setLogsSubView('settings')}
                >
                  ⚙️ Category Controls & Routing
                </button>
                <button
                  className={`btn ${logsSubView === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => setLogsSubView('feed')}
                >
                  <span>📜 Live Audit Stream</span>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    background: logsSubView === 'feed' ? 'rgba(255,255,255,0.25)' : 'rgba(99,102,241,0.2)',
                  }}>
                    {recentLogs.length}
                  </span>
                </button>
              </div>

              {/* SUB-VIEW 1: SETTINGS & ROUTING */}
              {logsSubView === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Master / Default Log Channel */}
                    <div className="editor-card" style={{ border: '1px solid var(--border-glow)' }}>
                      <div className="editor-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div className="editor-title">
                          <h3>🌐 Master Log Channel</h3>
                          <p>All categories will route to this channel by default unless a specific channel ID is set below.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            onClick={() => handleTestLogs(logsConfig.defaultChannelId)}
                            disabled={isTestingLogs}
                          >
                            <span>{isTestingLogs ? '⏳' : '🧪'}</span>
                            <span>{isTestingLogs ? 'Testing...' : 'Test Channel in Discord'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            onClick={() => handleSaveLogs()}
                            disabled={isSavingLogs}
                          >
                            {isSavingLogs ? 'Saving...' : '💾 Save Channel'}
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ maxWidth: '620px' }}>
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Master Channel ID</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...logsConfig, defaultChannelId: '1562687171079708784' };
                              setLogsConfig(updated);
                              handleSaveLogs(updated);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              textDecoration: 'underline',
                            }}
                          >
                            ⚡ Auto-Fill #logs (1562687171079708784)
                          </button>
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 1562687171079708784 (#logs)"
                            value={logsConfig.defaultChannelId || ''}
                            onChange={(e) => setLogsConfig({ ...logsConfig, defaultChannelId: e.target.value })}
                            onBlur={() => handleSaveLogs()}
                          />
                        </div>
                      </div>

                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: logsConfig.defaultChannelId ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                        border: `1px solid ${logsConfig.defaultChannelId ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{logsConfig.defaultChannelId ? '✅' : '💡'}</span>
                          <span style={{ color: logsConfig.defaultChannelId ? '#10b981' : '#f59e0b', fontWeight: 500 }}>
                            {logsConfig.defaultChannelId
                              ? `Master channel active: ${logsConfig.defaultChannelId} (#logs)`
                              : 'No channel set. Click "Auto-Fill #logs" above or type your Channel ID.'}
                          </span>
                        </div>
                        {logsConfig.defaultChannelId && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                            Persisted & Synced across refreshes
                          </span>
                        )}
                      </div>
                    </div>

                  {/* Category Grid */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Event Categories & Channel Routing</h3>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      Turn individual event categories ON or OFF, and choose whether they share the master channel or go to their own separate channel.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                      {Object.entries(logsConfig.categories || {}).map(([key, cat]) => {
                        const isEnabled = cat.enabled !== false;
                        const hasCustomChannel = Boolean(cat.channelId && cat.channelId.trim());
                        const activeChannelId = hasCustomChannel ? cat.channelId.trim() : (logsConfig.defaultChannelId || '').trim();

                        return (
                          <div
                            key={key}
                            className="editor-card"
                            style={{
                              padding: '1.25rem',
                              background: 'var(--bg-card)',
                              border: `1px solid ${isEnabled ? 'var(--border-color)' : 'rgba(239,68,68,0.2)'}`,
                              opacity: isEnabled ? 1 : 0.65,
                              transition: 'var(--transition)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <span style={{ fontSize: '1.4rem' }}>{cat.icon || '📌'}</span>
                                  <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{cat.name}</h4>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '2px' }}>{cat.description}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCategory(key)}
                                  className={`btn btn-sm ${isEnabled ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 10px',
                                    background: isEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)',
                                    borderColor: isEnabled ? '#10b981' : '#ef4444',
                                    color: isEnabled ? '#10b981' : '#ef4444',
                                  }}
                                >
                                  {isEnabled ? 'Enabled' : 'Disabled'}
                                </button>
                              </div>

                              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>
                                    <span>Custom Channel ID (Optional Override)</span>
                                  </label>
                                  {cat.channelId && cat.channelId.trim() && (
                                    <button
                                      type="button"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#818cf8',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                      }}
                                      onClick={() => handleTestLogs(cat.channelId)}
                                    >
                                      🧪 Test Channel
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem', marginTop: '4px' }}
                                  placeholder={logsConfig.defaultChannelId ? `Inherits Master (${logsConfig.defaultChannelId})` : 'e.g. 1562687171079708784'}
                                  value={cat.channelId || ''}
                                  onChange={(e) => {
                                    setLogsConfig({
                                      ...logsConfig,
                                      categories: {
                                        ...logsConfig.categories,
                                        [key]: { ...cat, channelId: e.target.value },
                                      },
                                    });
                                  }}
                                  onBlur={() => handleSaveLogs()}
                                />
                              </div>
                            </div>

                            {/* Status indicator pill */}
                            <div style={{
                              marginTop: '0.75rem',
                              padding: '0.45rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              background: !isEnabled
                                ? 'rgba(239,68,68,0.08)'
                                : hasCustomChannel
                                ? 'rgba(16,185,129,0.08)'
                                : activeChannelId
                                ? 'rgba(99,102,241,0.08)'
                                : 'rgba(245,158,11,0.08)',
                              border: `1px solid ${
                                !isEnabled
                                  ? 'rgba(239,68,68,0.25)'
                                  : hasCustomChannel
                                  ? 'rgba(16,185,129,0.25)'
                                  : activeChannelId
                                  ? 'rgba(99,102,241,0.25)'
                                  : 'rgba(245,158,11,0.25)'
                              }`,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                            }}>
                              <span>{!isEnabled ? '🔴' : hasCustomChannel ? '🟢' : activeChannelId ? '🔵' : '🟡'}</span>
                              <span style={{
                                color: !isEnabled ? '#ef4444' : hasCustomChannel ? '#10b981' : activeChannelId ? '#818cf8' : '#f59e0b',
                                fontWeight: 500,
                              }}>
                                {!isEnabled
                                  ? 'Logging Disabled'
                                  : hasCustomChannel
                                  ? `Dedicated Channel: ${cat.channelId}`
                                  : activeChannelId
                                  ? `Using Master Channel: ${activeChannelId}`
                                  : 'No Channel Set (Uses #logs fallback)'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* SUB-VIEW 2: LIVE AUDIT FEED */}
              {logsSubView === 'feed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Filter & Search Bar */}
                  <div className="editor-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {[
                        { key: 'all', label: 'All Events', icon: '⚡' },
                        { key: 'messages', label: 'Messages', icon: '💬' },
                        { key: 'members', label: 'Members', icon: '👥' },
                        { key: 'moderation', label: 'Moderation', icon: '🔨' },
                        { key: 'channels', label: 'Channels', icon: '📁' },
                        { key: 'roles', label: 'Roles', icon: '🏷️' },
                        { key: 'voice', label: 'Voice', icon: '🔊' },
                        { key: 'server', label: 'Server', icon: '🌐' },
                      ].map((tab) => {
                        const count = tab.key === 'all'
                          ? recentLogs.length
                          : recentLogs.filter((l) => l.category === tab.key).length;

                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setLogsCategoryFilter(tab.key)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              border: `1px solid ${logsCategoryFilter === tab.key ? 'var(--primary)' : 'var(--border-color)'}`,
                              background: logsCategoryFilter === tab.key ? 'var(--primary)' : 'var(--bg-secondary)',
                              color: logsCategoryFilter === tab.key ? '#fff' : 'var(--text-sub)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'var(--transition)',
                            }}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: logsCategoryFilter === tab.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)',
                            }}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                      placeholder="Search live events by user, action, moderator, or channel..."
                      value={logsSearch}
                      onChange={(e) => setLogsSearch(e.target.value)}
                    />
                  </div>

                  {/* Logs Event Feed */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(() => {
                      const filtered = recentLogs
                        .filter((l) => logsCategoryFilter === 'all' || l.category === logsCategoryFilter)
                        .filter((l) => {
                          if (!logsSearch.trim()) return true;
                          const q = logsSearch.toLowerCase();
                          return (
                            (l.title && l.title.toLowerCase().includes(q)) ||
                            (l.user && l.user.toLowerCase().includes(q)) ||
                            (l.executor && l.executor.toLowerCase().includes(q)) ||
                            (l.channel && l.channel.toLowerCase().includes(q)) ||
                            (l.details && l.details.toLowerCase().includes(q))
                          );
                        });

                      if (filtered.length === 0) {
                        return (
                          <div className="editor-card" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-sub)' }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🛡️</span>
                            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem' }}>No Audit Events Found</h4>
                            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                              {logsSearch ? 'No events matched your search query.' : 'Perform actions in your Discord server (delete a message, edit a channel, assign a role) to see them appear live!'}
                            </p>
                          </div>
                        );
                      }

                      return filtered.map((item) => {
                        const timeStr = item.timestamp
                          ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : '';

                        const catColor = {
                          messages: '#ef4444',
                          members: '#10b981',
                          moderation: '#dc2626',
                          channels: '#3b82f6',
                          roles: '#8b5cf6',
                          voice: '#06b6d4',
                          server: '#f59e0b',
                        }[item.category] || 'var(--primary)';

                        return (
                          <div
                            key={item.id}
                            className="editor-card"
                            style={{
                              padding: '1rem 1.25rem',
                              borderLeft: `4px solid ${catColor}`,
                              background: 'var(--bg-card)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  background: `${catColor}20`,
                                  color: catColor,
                                }}>
                                  {item.category}
                                </span>
                                <h4 style={{ fontSize: '0.92rem', fontWeight: 600 }}>{item.title}</h4>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{timeStr}</span>
                            </div>

                            {/* Metadata Pills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem' }}>
                              {item.executor && (
                                <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                  👤 <b>By:</b> {item.executor}
                                </span>
                              )}
                              {item.user && (
                                <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                  🎯 <b>Target:</b> {item.user}
                                </span>
                              )}
                              {item.channel && (
                                <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                  📁 <b>Channel:</b> {item.channel}
                                </span>
                              )}
                            </div>

                            {/* Details quote block */}
                            {item.details && (
                              <div style={{
                                marginTop: '0.25rem',
                                padding: '0.5rem 0.75rem',
                                background: 'var(--bg-primary)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                borderLeft: '2px solid var(--border-color)',
                                wordBreak: 'break-word',
                              }}>
                                {item.details}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

