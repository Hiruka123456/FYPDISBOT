'use client';

import { useState, useEffect } from 'react';

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

  // Initial / Saved State vs Current Edited State for dirty check
  const [savedConfig, setSavedConfig] = useState(null);
  const [config, setConfig] = useState({
    enabled: true,
    channelId: '1562640532226842737',
    title: 'Welcome to {server}!',
    message: 'Hey {user}, welcome to the server! We are thrilled to have you here. You are our #{memberCount} member! 🚀',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    embedColor: '#6366f1',
  });

  // Calculate if there are unsaved modifications
  const isDirty = Boolean(
    savedConfig &&
    config &&
    JSON.stringify(config) !== JSON.stringify(savedConfig)
  );

  // Fetch initial welcome config and health status
  useEffect(() => {
    async function loadData() {
      try {
        const [statusRes, configRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/welcome'),
        ]);

        if (statusRes.ok) {
          setServerStatus('Dashboard Online');
        }

        if (configRes.ok) {
          const data = await configRes.json();
          setConfig(data);
          setSavedConfig(data);
        }
      } catch {
        setServerStatus('Offline / Local');
      }
    }
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSavedConfig(config); // Reset dirty state, button disappears!
        showToast('✅ Changes saved successfully!');
      } else {
        showToast('❌ Failed to save configuration.');
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (varName) => {
    setConfig((prev) => ({
      ...prev,
      message: `${prev.message} ${varName}`,
    }));
  };

  // Preview formatted text
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
          <div className="nav-section-title">FEATURES</div>
          <button
            className={`nav-item ${activeTab === 'welcome' ? 'active' : ''}`}
            onClick={() => setActiveTab('welcome')}
          >
            <span className="nav-icon">👋</span>
            <span>Welcome Message</span>
            <span className="pill">Active</span>
          </button>
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

          <div className="nav-section-title">SYSTEM</div>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator-box">
            <div className="status-dot pulsing"></div>
            <div className="status-details">
              <p className="status-label">Next.js System</p>
              <p className="status-val">{serverStatus}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Topbar (No duplicate save button) */}
        <header className="topbar">
          <div className="topbar-search">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search settings, channels, variables..." />
          </div>

          <div className="topbar-actions">
            <div className="bot-badge">
              <span className="bot-status-ring"></span>
              <span>Bot: FYP Project#0105</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="dashboard-body">
          {/* Banner with ONLY ONE conditional save button */}
          <div className="welcome-banner">
            <div className="welcome-text">
              <h1>Welcome Message Studio</h1>
              <p>Customize the automated greeting, image banner, embed styling, and target channel for new Discord members.</p>
            </div>

            {/* ONLY ONE Save Button: visible ONLY when something changed! */}
            {isDirty && (
              <button
                className="btn btn-primary"
                onClick={handleSave}
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

          {/* Welcome Editor Grid */}
          <div className="welcome-editor-grid">
            {/* Left Column: Form Editor */}
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
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
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

              {/* Banner Image URL */}
              <div className="form-group">
                <label className="form-label">
                  <span>Welcome Picture / Banner URL</span>
                  <span className="form-label-desc">Direct link to JPG, PNG, or GIF</span>
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/banner.jpg"
                  value={config.imageUrl}
                  onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })}
                />
                <div className="preset-list">
                  {PRESET_BANNERS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={`preset-btn ${config.imageUrl === preset.url ? 'selected' : ''}`}
                      style={{ backgroundImage: `url(${preset.url})` }}
                      onClick={() => setConfig({ ...config, imageUrl: preset.url })}
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
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '130px' }}
                    value={config.embedColor}
                    onChange={(e) => setConfig({ ...config, embedColor: e.target.value })}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sidebar color in Discord</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Discord Simulation Preview */}
            <div className="preview-container">
              <div className="editor-card" style={{ height: 'fit-content' }}>
                <div className="editor-card-header">
                  <div className="editor-title">
                    <h3>Live Discord Preview</h3>
                    <p>Real-time simulation of the welcome card</p>
                  </div>
                  <span className="badge" style={{ color: '#10b981' }}>Live Preview</span>
                </div>

                <div className="discord-mockup">
                  {/* Bot Message Header */}
                  <div className="discord-header">
                    <div className="discord-avatar">🤖</div>
                    <div className="discord-meta">
                      <span className="discord-bot-name">FYP Project</span>
                      <span className="discord-bot-tag">BOT</span>
                      <span className="discord-time">Today at 12:00 PM</span>
                    </div>
                  </div>

                  {/* Mention Line */}
                  <div className="discord-mention-line">
                    Welcome <span className="discord-mention">@Alex</span>! 👋
                  </div>

                  {/* Embed Card */}
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

                    {/* Banner Image */}
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

                {/* Helpful instructions */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.4rem' }}>💡 Quick Tips:</p>
                  <p>• Type <code>!testwelcome</code> in any Discord channel to test this card instantly.</p>
                  <p style={{ marginTop: '0.25rem' }}>• To get a Channel ID: In Discord, go to Settings &gt; Advanced &gt; turn on <b>Developer Mode</b>, then right-click your welcome channel and click <b>Copy Channel ID</b>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
