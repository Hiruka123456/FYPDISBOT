'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [ping, setPing] = useState('< 10 ms');
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [isSyncing, setIsSyncing] = useState(false);

  const checkStatus = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        setPing(`${latency} ms`);
        setServerStatus('Dashboard Online');
      } else {
        setServerStatus('Server Error');
      }
    } catch {
      setServerStatus('Disconnected');
      setPing('--');
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await checkStatus();
    setTimeout(() => {
      setIsSyncing(false);
    }, 500);
  };

  return (
    <div className="app-layout">
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
            <span className="badge">Next.js &bull; Vercel Ready</span>
          </div>
        </div>

        <nav className="sidebar-nav">
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
            <span className="pill">Ready</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'audit-logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-logs')}
          >
            <span className="nav-icon">📜</span>
            <span>Audit Logs</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'servers' ? 'active' : ''}`}
            onClick={() => setActiveTab('servers')}
          >
            <span className="nav-icon">🌐</span>
            <span>Servers</span>
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
              <p className="status-label">Next.js Runtime</p>
              <p className="status-val">{serverStatus}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-search">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search members, logs, rules..." />
          </div>

          <div className="topbar-actions">
            <div className="bot-badge">
              <span className="bot-status-ring"></span>
              <span>Bot Initialized</span>
            </div>
            <button className="btn btn-primary" onClick={handleSync}>
              <span>{isSyncing ? 'Checking...' : 'Sync Bot'}</span>
            </button>
          </div>
        </header>

        {/* Dashboard View Container */}
        <div className="dashboard-body">
          <div className="welcome-banner">
            <div className="welcome-text">
              <h1>Discord Bot Moderation Web (Next.js)</h1>
              <p>Your bot dashboard is configured with React &amp; Next.js, optimized for seamless Vercel deployment.</p>
            </div>
            <div className="banner-tag">Vercel Ready &bull; App Router</div>
          </div>

          {/* Quick Stats Cards */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">🤖</div>
              <div className="stat-info">
                <span className="stat-title">Bot Project</span>
                <h3 className="stat-value">Ready</h3>
                <p className="stat-sub">Online listener configured</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">⚛️</div>
              <div className="stat-info">
                <span className="stat-title">Web Stack</span>
                <h3 className="stat-value">Next.js / React</h3>
                <p className="stat-sub">Vercel optimized</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">🛡️</div>
              <div className="stat-info">
                <span className="stat-title">Moderation Ready</span>
                <h3 className="stat-value">Prepared</h3>
                <p className="stat-sub">UI slots initialized</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">⚡</div>
              <div className="stat-info">
                <span className="stat-title">Latency</span>
                <h3 className="stat-value">{ping}</h3>
                <p className="stat-sub">Local environment</p>
              </div>
            </div>
          </section>

          {/* Project Structure Overview */}
          <section className="content-cards">
            <div className="card card-large">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>Project Structure Overview</h3>
                  <p>Two separate projects ready for production</p>
                </div>
              </div>
              <div className="card-body">
                <div className="project-breakdown">
                  <div className="project-box">
                    <div className="proj-badge">Project 1</div>
                    <h4>🤖 /bot (Discord Bot)</h4>
                    <p>Handles the Discord Gateway connection so the bot stays online.</p>
                    <ul className="spec-list">
                      <li><span className="check">✓</span> <code>index.js</code> - Gateway client &amp; ready event</li>
                      <li><span className="check">✓</span> <code>package.json</code> - discord.js &amp; dotenv</li>
                      <li><span className="check">✓</span> <code>.env</code> - Discord bot token</li>
                    </ul>
                  </div>

                  <div className="project-box">
                    <div className="proj-badge">Project 2 (Vercel)</div>
                    <h4>⚛️ /web (Next.js Dashboard)</h4>
                    <p>Next.js / React moderation dashboard built for deployment on Vercel.</p>
                    <ul className="spec-list">
                      <li><span className="check">✓</span> <code>app/page.jsx</code> - React dashboard interface</li>
                      <li><span className="check">✓</span> <code>app/api/status/</code> - Next.js serverless route</li>
                      <li><span className="check">✓</span> <code>next.config.mjs</code> - Next.js configuration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
