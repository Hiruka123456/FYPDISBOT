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

  // Moderation & Role Permissions State
  const [moderationConfig, setModerationConfig] = useState({
    globalEnabled: true,
    adminRoleId: '1562687268739747850',
    logChannelId: '1562687171079708784',
    dmOnAction: true,
    commands: {
      kick: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Kick Member', description: 'Kick a member from the server with an optional reason', category: 'punishment', icon: '👢' },
      ban: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Ban Member', description: 'Permanently ban a member with optional message purge', category: 'punishment', icon: '🔨' },
      unban: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Unban User', description: 'Revoke a ban for a user by their numeric Discord User ID', category: 'punishment', icon: '🔓' },
      timeout: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Timeout / Mute', description: 'Temporarily timeout a member (e.g. 5m, 1h, 1d, 7d)', category: 'punishment', icon: '⏳' },
      untimeout: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Remove Timeout', description: 'Clear the timeout/mute on a member immediately', category: 'punishment', icon: '🔊' },
      warn: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Warn Member', description: 'Issue an official logged warning to a member', category: 'warnings', icon: '⚠️' },
      warnings: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'View Warnings', description: 'List all active warnings and history for a user', category: 'warnings', icon: '📋' },
      clearwarn: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Clear Warnings', description: 'Delete all or a specific warning for a user', category: 'warnings', icon: '🧹' },
      purge: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Purge Messages', description: 'Bulk delete up to 100 messages in the current channel', category: 'channel', icon: '🗑️' },
      slowmode: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Set Slowmode', description: 'Set slowmode rate limit for chat (0s to disable)', category: 'channel', icon: '⏱️' },
      lock: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Lock Channel', description: 'Prevent @everyone from sending messages in the channel', category: 'channel', icon: '🔒' },
      unlock: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Unlock Channel', description: 'Restore message sending permissions for @everyone', category: 'channel', icon: '🔓' },
      nick: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Change Nickname', description: "Change or reset a member's server nickname", category: 'member', icon: '👤' },
      role: { enabled: true, allowedRoles: ['1562687268739747850'], name: 'Manage Roles', description: 'Add or remove a role from a member', category: 'member', icon: '🏷️' },
    },
  });
  const [savedModerationConfig, setSavedModerationConfig] = useState(null);
  const [serverRoles, setServerRoles] = useState([]);
  const [warningsList, setWarningsList] = useState([]);
  const [isSavingModeration, setIsSavingModeration] = useState(false);
  const [modCategoryFilter, setModCategoryFilter] = useState('all');
  const [modSearch, setModSearch] = useState('');
  const [modSubView, setModSubView] = useState('commands'); // 'commands' | 'warnings'

  // Ticketing System State
  const [tickets, setTickets] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);
  const [serverTextChannels, setServerTextChannels] = useState([]);
  const [ticketConfig, setTicketConfig] = useState({
    enabled: true,
    categoryId: '1562822100903923854',
    transcriptChannelId: '1562822217186803754',
    supportRoleId: '1562687268739747850',
    maxOpenPerUser: 5,
    openMessage: 'Welcome to your support ticket! A staff member will be with you shortly. Please describe your issue.',
    autoCloseHours: 0,
  });
  const [savedTicketConfig, setSavedTicketConfig] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isSendingTicketReply, setIsSendingTicketReply] = useState(false);
  const [isSavingTicketConfig, setIsSavingTicketConfig] = useState(false);
  const [ticketSubView, setTicketSubView] = useState('open'); // 'open' | 'closed' | 'settings'
  const [ticketSearch, setTicketSearch] = useState('');
  const [liveTicketMessages, setLiveTicketMessages] = useState([]);
  const ticketMsgEndRef = useRef(null);
  // Overview Tab State
  const [overviewData, setOverviewData] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [overviewMemberFilter, setOverviewMemberFilter] = useState('all'); // 'all' | 'humans' | 'bots'
  const [overviewMemberSearch, setOverviewMemberSearch] = useState('');

  const messageEndRef = useRef(null);
  // configRef keeps a live reference to config to avoid stale closures in onBlur handlers
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // Check if moderation config was modified
  const isModerationDirty = Boolean(
    savedModerationConfig &&
    JSON.stringify(moderationConfig) !== JSON.stringify(savedModerationConfig)
  );

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
        const [statusRes, configRes, chatsRes, inboxRes, logsRes, modRes, ticketsRes, overviewRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/welcome'),
          fetch('/api/chats'),
          fetch('/api/inbox'),
          fetch('/api/logs'),
          fetch('/api/moderation'),
          fetch('/api/tickets'),
          fetch('/api/overview'),
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

        if (modRes.ok) {
          const modData = await modRes.json();
          let mergedMod = modData?.config || {};

          // Read client-side localStorage backup so Vercel refresh never wipes settings
          try {
            const cachedMod = localStorage.getItem('modportal_moderation_config');
            if (cachedMod) {
              const parsedMod = JSON.parse(cachedMod);
              mergedMod = {
                ...mergedMod,
                ...parsedMod,
                adminRoleId: parsedMod.adminRoleId || mergedMod.adminRoleId || '1562687268739747850',
                commands: {
                  ...(mergedMod.commands || {}),
                  ...(parsedMod.commands || {}),
                },
              };
            }
          } catch {}

          if (!mergedMod.adminRoleId) mergedMod.adminRoleId = '1562687268739747850';

          setModerationConfig(mergedMod);
          setSavedModerationConfig(mergedMod);
          if (Array.isArray(modData?.roles)) setServerRoles(modData.roles);
          if (Array.isArray(modData?.warnings)) setWarningsList(modData.warnings);
        }

        if (ticketsRes.ok) {
          const td = await ticketsRes.json();
          if (Array.isArray(td?.tickets)) setTickets(td.tickets);
          if (Array.isArray(td?.categories)) setServerCategories(td.categories);
          if (Array.isArray(td?.textChannels)) setServerTextChannels(td.textChannels);
          if (Array.isArray(td?.roles) && td.roles.length > 0) setServerRoles(td.roles);

          let mergedTicketCfg = td?.config || {};
          try {
            const cachedTicket = localStorage.getItem('modportal_ticket_config');
            if (cachedTicket) {
              const parsedTicket = JSON.parse(cachedTicket);
              mergedTicketCfg = { ...mergedTicketCfg, ...parsedTicket };
            }
          } catch {}

          if (!mergedTicketCfg.categoryId) mergedTicketCfg.categoryId = '1562822100903923854';
          if (!mergedTicketCfg.transcriptChannelId) mergedTicketCfg.transcriptChannelId = '1562822217186803754';
          if (!mergedTicketCfg.supportRoleId) mergedTicketCfg.supportRoleId = '1562687268739747850';

          setTicketConfig(mergedTicketCfg);
          setSavedTicketConfig(mergedTicketCfg);
        }

        if (overviewRes && overviewRes.ok) {
          const ov = await overviewRes.json();
          if (ov?.success) setOverviewData(ov);
        }
      } catch {
        setServerStatus('Offline / Local');
      }
    }
    loadInitial();
  }, []);

  // Poll chats, logs, moderation, tickets, and overview periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [resChats, resLogs, resMod, resTix, resOv] = await Promise.all([
          fetch('/api/chats'),
          fetch('/api/logs'),
          fetch('/api/moderation'),
          fetch('/api/tickets'),
          fetch('/api/overview'),
        ]);
        if (resChats.ok) {
          const data = await resChats.json();
          if (data?.conversations) setConversations(data.conversations);
        }
        if (resLogs.ok) {
          const logsData = await resLogs.json();
          if (Array.isArray(logsData?.recentLogs)) setRecentLogs(logsData.recentLogs);
        }
        if (resMod.ok) {
          const modData = await resMod.json();
          if (Array.isArray(modData?.warnings)) setWarningsList(modData.warnings);
          if (Array.isArray(modData?.roles)) setServerRoles(modData.roles);
        }
        if (resTix.ok) {
          const td = await resTix.json();
          if (Array.isArray(td?.tickets)) setTickets(td.tickets);
        }
        if (resOv && resOv.ok) {
          const ov = await resOv.json();
          if (ov?.success) setOverviewData(ov);
        }
      } catch {
        // Ignore poll error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const res = await fetch('/api/overview');
      if (res.ok) {
        const d = await res.json();
        if (d?.success) {
          setOverviewData(d);
          showToast('📊 Server overview metrics updated!');
        }
      }
    } catch {} finally {
      setIsLoadingOverview(false);
    }
  };

  // Auto-scroll chat feed
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeUserId]);

  // Auto-scroll ticket chat
  useEffect(() => {
    ticketMsgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTicketMessages, activeTicketId]);

  // Fetch live messages when active ticket changes
  useEffect(() => {
    if (!activeTicketId) return;
    const t = tickets.find(tk => tk.id === activeTicketId || (tk.channelId && tk.channelId === activeTicketId));
    if (t) setLiveTicketMessages(t.messages || []);

    const targetChId = t?.channelId;
    if (!targetChId) return;

    // Poll live Discord messages every 3s while a ticket is selected
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/tickets?action=messages&channelId=${targetChId}`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d.messages)) setLiveTicketMessages(d.messages);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [activeTicketId]);

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

  // Moderation Configuration Handlers
  const handleSaveModeration = async (overrideCfg) => {
    const cfgToSave = overrideCfg || moderationConfig;
    setIsSavingModeration(true);
    try {
      try {
        localStorage.setItem('modportal_moderation_config', JSON.stringify(cfgToSave));
      } catch {}
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfgToSave),
      });
      if (res.ok) {
        const data = await res.json();
        setModerationConfig(data.config);
        setSavedModerationConfig(data.config);
        showToast('🛡️ Moderation settings & command roles saved to Discord Bot!');
      } else {
        showToast('❌ Failed to save moderation configuration.');
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSavingModeration(false);
    }
  };

  const handleToggleCommand = (cmdKey) => {
    const currentCmd = moderationConfig.commands?.[cmdKey] || {};
    const updated = {
      ...moderationConfig,
      commands: {
        ...moderationConfig.commands,
        [cmdKey]: {
          ...currentCmd,
          enabled: !currentCmd.enabled,
        },
      },
    };
    setModerationConfig(updated);
    handleSaveModeration(updated);
  };

  const handleToggleRoleForCommand = (cmdKey, roleId) => {
    const currentCmd = moderationConfig.commands?.[cmdKey] || {};
    const currentRoles = Array.isArray(currentCmd.allowedRoles) ? [...currentCmd.allowedRoles] : [];
    const exists = currentRoles.includes(roleId);
    const newRoles = exists
      ? currentRoles.filter((id) => id !== roleId)
      : [...currentRoles, roleId];

    const updated = {
      ...moderationConfig,
      commands: {
        ...moderationConfig.commands,
        [cmdKey]: {
          ...currentCmd,
          allowedRoles: newRoles,
        },
      },
    };
    setModerationConfig(updated);
    handleSaveModeration(updated);
  };

  const handleClearWarning = async (warnId, userId) => {
    try {
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_warn', warnId, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.warnings) setWarningsList(data.warnings);
        showToast('🧹 Warning record removed!');
      }
    } catch {}
  };

  // ─── Ticket Handlers ──────────────────────────────────────────────────────
  const handleSaveTicketConfig = async (overrideCfg) => {
    const cfgToSave = overrideCfg || ticketConfig;
    setIsSavingTicketConfig(true);
    try {
      try { localStorage.setItem('modportal_ticket_config', JSON.stringify(cfgToSave)); } catch {}
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', config: cfgToSave }),
      });
      if (res.ok) {
        setSavedTicketConfig(cfgToSave);
        showToast('🎫 Ticket system settings saved!');
      } else {
        showToast('❌ Failed to save ticket config.');
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSavingTicketConfig(false);
    }
  };

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim() || !activeTicketId || isSendingTicketReply) return;
    setIsSendingTicketReply(true);
    const text = ticketReply.trim();
    setTicketReply('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_message', ticketId: activeTicketId, content: text, authorName: 'Staff' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.message) setLiveTicketMessages(prev => [...prev, data.message]);
        showToast(data.discordSent ? '✅ Message sent to ticket channel!' : '✅ Saved (Discord send failed)');
      } else {
        showToast(`❌ ${data.error || 'Failed to send message'}`);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsSendingTicketReply(false);
    }
  };

  const handleCloseTicket = async (ticketId, reason = 'Closed from dashboard') => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close_ticket', ticketId, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed', closedAt: new Date().toISOString() } : t));
        if (activeTicketId === ticketId) setActiveTicketId(null);
        showToast('🔒 Ticket closed & transcript saved!');
      } else {
        showToast(`❌ ${data.error || 'Failed to close ticket'}`);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Delete this ticket record permanently?')) return;
    try {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_ticket', ticketId }),
      });
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      if (activeTicketId === ticketId) setActiveTicketId(null);
      showToast('🗑️ Ticket deleted.');
    } catch {}
  };

  const isTicketConfigDirty = Boolean(savedTicketConfig && JSON.stringify(ticketConfig) !== JSON.stringify(savedTicketConfig));

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
          <button
            className={`nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <span className="nav-icon">🎫</span>
            <span>Tickets</span>
            <span className="pill">{tickets.filter(t => t.status === 'open').length}</span>
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

          {/* TAB: TICKETS */}
          {activeTab === 'tickets' && (() => {
            const openTickets   = tickets.filter(t => t.status === 'open');
            const closedTickets = tickets.filter(t => t.status === 'closed');
            const filteredOpen  = openTickets.filter(t =>
              !ticketSearch || t.subject?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
              t.openedByName?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
              String(t.number).includes(ticketSearch)
            );
            const filteredClosed = closedTickets.filter(t =>
              !ticketSearch || t.subject?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
              t.openedByName?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
              String(t.number).includes(ticketSearch)
            );
            const activeTicket = tickets.find(t => t.id === activeTicketId || (t.channelId && t.channelId === activeTicketId)) || (activeTicketId ? null : openTickets[0]);

            return (
              <>
                {/* Header Banner */}
                <div className="welcome-banner">
                  <div className="welcome-text">
                    <h1>🎫 Support Tickets</h1>
                    <p>View and respond to open tickets live, review closed tickets with transcripts, and configure the ticketing system.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className={`btn ${ticketConfig.enabled ? 'btn-secondary' : 'btn-danger'}`}
                      style={{
                        background: ticketConfig.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        borderColor: ticketConfig.enabled ? '#10b981' : '#ef4444',
                        color: ticketConfig.enabled ? '#10b981' : '#ef4444',
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        const updated = { ...ticketConfig, enabled: !ticketConfig.enabled };
                        setTicketConfig(updated);
                        handleSaveTicketConfig(updated);
                      }}
                    >
                      {ticketConfig.enabled ? '🟢 Tickets: ACTIVE' : '🔴 Tickets: DISABLED'}
                    </button>
                  </div>
                </div>

                {/* Sub-view Switcher */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'open',     label: `🟢 Open Tickets`,    count: openTickets.length },
                    { key: 'closed',   label: `🔒 Closed Tickets`,  count: closedTickets.length },
                    { key: 'settings', label: `⚙️ Settings`,         count: null },
                  ].map(sv => (
                    <button
                      key={sv.key}
                      className={`btn ${ticketSubView === sv.key ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => { setTicketSubView(sv.key); setActiveTicketId(null); }}
                    >
                      {sv.label}
                      {sv.count !== null && (
                        <span style={{ padding: '1px 7px', borderRadius: '10px', fontSize: '0.75rem',
                          background: ticketSubView === sv.key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)' }}>
                          {sv.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* OPEN TICKETS VIEW */}
                {ticketSubView === 'open' && (
                  <div style={{ display: 'flex', gap: '1.25rem', height: '620px' }}>

                    {/* Ticket List Panel */}
                    <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                        placeholder="Search tickets..."
                        value={ticketSearch}
                        onChange={e => setTicketSearch(e.target.value)}
                      />
                      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {filteredOpen.length === 0 ? (
                          <div className="editor-card" style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-sub)' }}>
                            <span style={{ fontSize: '2.4rem', display: 'block', marginBottom: '0.6rem' }}>🎫</span>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                              No Open Tickets Right Now
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                              In Discord, type <code style={{ color: 'var(--primary)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>/ticket open</code> or click a panel button.
                            </p>
                            {closedTickets.length > 0 && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ fontSize: '0.8rem', padding: '6px 14px', width: '100%' }}
                                onClick={() => setTicketSubView('closed')}
                              >
                                📋 View {closedTickets.length} Closed Ticket(s) &amp; Transcripts
                              </button>
                            )}
                          </div>
                        ) : filteredOpen.map(ticket => {
                          const isSelected = activeTicket?.id === ticket.id || (ticket.channelId && activeTicket?.channelId === ticket.channelId);
                          return (
                          <div
                            key={ticket.id}
                            onClick={() => setActiveTicketId(ticket.channelId || ticket.id)}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                              border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                                #{ticket.number} — {ticket.openedByName}
                              </span>
                              <span style={{ fontSize: '0.72rem', opacity: 0.7,
                                color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, color: isSelected ? '#e0e7ff' : 'var(--text-sub)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ticket.subject}
                            </div>
                            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.7rem', padding: '1px 7px', borderRadius: '20px',
                                background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.15)',
                                color: isSelected ? '#fff' : '#10b981' }}>
                                🟢 Open
                              </span>
                              <span style={{ fontSize: '0.7rem', padding: '1px 7px', borderRadius: '20px',
                                background: isSelected ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)',
                                color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                                💬 {(ticket.messages || []).length}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>

                    {/* Chat Panel */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      {activeTicket ? (
                        <>
                          {/* Ticket Header */}
                          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                🎫 #{activeTicket.number} — {activeTicket.subject}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '2px' }}>
                                Opened by <b>{activeTicket.openedByName}</b> · {activeTicket.createdAt ? new Date(activeTicket.createdAt).toLocaleString() : ''}
                                {activeTicket.claimedByName && <span> · ✋ Claimed by {activeTicket.claimedByName}</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }}
                                onClick={() => handleCloseTicket(activeTicket.id)}
                              >
                                🔒 Close Ticket
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleDeleteTicket(activeTicket.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {/* Message Feed */}
                          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {liveTicketMessages.length === 0 ? (
                              <div style={{ textAlign: 'center', color: 'var(--text-sub)', marginTop: '3rem' }}>
                                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>💬</span>
                                No messages yet in this ticket.
                              </div>
                            ) : liveTicketMessages.map((msg, i) => {
                              const isStaff = msg.fromWeb || msg.isSystem;
                              const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                              return (
                                <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'column',
                                  alignItems: isStaff ? 'flex-end' : 'flex-start' }}>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                    {msg.author} · {time}
                                  </span>
                                  <div style={{
                                    maxWidth: '75%', padding: '0.6rem 0.9rem', borderRadius: '12px',
                                    background: isStaff ? 'var(--primary)' : 'var(--bg-secondary)',
                                    color: isStaff ? '#fff' : 'var(--text-main)',
                                    fontSize: '0.87rem', lineHeight: 1.5, wordBreak: 'break-word',
                                    borderBottomRightRadius: isStaff ? '4px' : '12px',
                                    borderBottomLeftRadius: isStaff ? '12px' : '4px',
                                  }}>
                                    {msg.content}
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={ticketMsgEndRef} />
                          </div>

                          {/* Reply Bar */}
                          <form onSubmit={handleSendTicketReply} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)',
                            display: 'flex', gap: '0.75rem' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ flex: 1, fontSize: '0.9rem' }}
                              placeholder={`Reply in ticket #${activeTicket.number} (sends to Discord channel too)...`}
                              value={ticketReply}
                              onChange={e => setTicketReply(e.target.value)}
                              disabled={isSendingTicketReply}
                            />
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={!ticketReply.trim() || isSendingTicketReply}
                            >
                              {isSendingTicketReply ? 'Sending...' : 'Send'}
                            </button>
                          </form>
                        </>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', color: 'var(--text-sub)', gap: '1rem' }}>
                          <span style={{ fontSize: '3rem' }}>🎫</span>
                          <div style={{ textAlign: 'center' }}>
                            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Select a Ticket</h3>
                            <p style={{ fontSize: '0.88rem' }}>Click a ticket from the list to view the conversation and reply.</p>
                          </div>
                          <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                            fontSize: '0.82rem', textAlign: 'center', maxWidth: '360px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                            💡 Use <b>/ticket open</b> in Discord or post a <b>/ticketpanel</b> button to let users create tickets.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CLOSED TICKETS VIEW */}
                {ticketSubView === 'closed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.85rem', maxWidth: '400px' }}
                      placeholder="Search closed tickets..."
                      value={ticketSearch}
                      onChange={e => setTicketSearch(e.target.value)}
                    />
                    {filteredClosed.length === 0 ? (
                      <div className="editor-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-sub)' }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🔒</span>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem' }}>No Closed Tickets</h4>
                        <p style={{ fontSize: '0.85rem' }}>Closed tickets with transcripts will appear here.</p>
                      </div>
                    ) : filteredClosed.map(ticket => (
                      <div key={ticket.id} className="editor-card" style={{ borderLeft: '4px solid #64748b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>#{ticket.number} — {ticket.subject}</span>
                              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px',
                                background: 'rgba(100,116,139,0.15)', color: '#64748b', fontWeight: 600 }}>
                                🔒 Closed
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              <span>👤 {ticket.openedByName}</span>
                              <span>📅 {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}</span>
                              {ticket.closedAt && <span>🔒 {new Date(ticket.closedAt).toLocaleDateString()}</span>}
                              {ticket.closedByName && <span>By: {ticket.closedByName}</span>}
                              <span>💬 {(ticket.messages || []).length} messages</span>
                            </div>
                            {ticket.closeReason && (
                              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Reason: "{ticket.closeReason}"
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem' }}
                              onClick={() => {
                                setActiveTicketId(ticket.id);
                                setLiveTicketMessages(ticket.messages || []);
                                setTicketSubView('transcript');
                              }}
                            >
                              📋 View Transcript
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', color: '#ef4444' }}
                              onClick={() => handleDeleteTicket(ticket.id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TRANSCRIPT VIEW */}
                {ticketSubView === 'transcript' && activeTicket && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }}
                        onClick={() => { setTicketSubView('closed'); setActiveTicketId(null); }}>
                        ← Back to Closed Tickets
                      </button>
                    </div>
                    <div className="editor-card">
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>📋 Transcript — Ticket #{activeTicket.number}</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                          <span>👤 {activeTicket.openedByName}</span>
                          <span>📋 {activeTicket.subject}</span>
                          <span>💬 {(activeTicket.messages || []).length} messages</span>
                          {activeTicket.closedAt && <span>🔒 Closed {new Date(activeTicket.closedAt).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '560px', overflowY: 'auto' }}>
                        {(activeTicket.messages || []).length === 0 ? (
                          <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '2rem' }}>No messages in transcript.</p>
                        ) : (activeTicket.messages || []).map((msg, i) => {
                          const isStaff = msg.fromWeb || msg.isSystem;
                          const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
                          return (
                            <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'column',
                              alignItems: isStaff ? 'flex-end' : 'flex-start' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                {msg.author} · {time}
                              </span>
                              <div style={{
                                maxWidth: '80%', padding: '0.6rem 0.9rem', borderRadius: '12px',
                                background: isStaff ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                                color: 'var(--text-main)', fontSize: '0.87rem', lineHeight: 1.5, wordBreak: 'break-word',
                                border: `1px solid ${isStaff ? 'rgba(99,102,241,0.3)' : 'var(--border-color)'}`,
                              }}>
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* SETTINGS VIEW */}
                {ticketSubView === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '760px' }}>

                    {/* Channels */}
                    <div className="editor-card" style={{ border: '1px solid var(--border-glow)' }}>
                      <div className="editor-card-header" style={{ marginBottom: '1.25rem' }}>
                        <div className="editor-title">
                          <h3>📁 Ticket Channels</h3>
                          <p>Configure where tickets are created and where transcripts are saved.</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group" style={{ maxWidth: '560px' }}>
                          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Ticket Category ID</span>
                            <button
                              type="button"
                              onClick={() => {
                                const u = { ...ticketConfig, categoryId: '1562822100903923854' };
                                setTicketConfig(u);
                                handleSaveTicketConfig(u);
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                            >
                              ⚡ Auto-fill Tickets Category (1562822100903923854)
                            </button>
                          </label>
                          <input type="text" className="form-input"
                            placeholder="e.g. 1562822100903923854"
                            value={ticketConfig.categoryId || ''}
                            onChange={e => setTicketConfig({ ...ticketConfig, categoryId: e.target.value })}
                            onBlur={() => handleSaveTicketConfig()}
                          />
                          {serverCategories.length > 0 && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {serverCategories.map(cat => (
                                <button key={cat.id} type="button"
                                  onClick={() => { const u = { ...ticketConfig, categoryId: cat.id }; setTicketConfig(u); handleSaveTicketConfig(u); }}
                                  style={{
                                    padding: '3px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
                                    border: `2px solid ${ticketConfig.categoryId === cat.id ? 'var(--primary)' : 'var(--border-color)'}`,
                                    background: ticketConfig.categoryId === cat.id ? 'rgba(99,102,241,0.2)' : 'var(--bg-secondary)',
                                    color: ticketConfig.categoryId === cat.id ? 'var(--primary)' : 'var(--text-muted)',
                                    transition: 'all 0.15s',
                                  }}>
                                  {ticketConfig.categoryId === cat.id ? '✓ ' : ''}📁 {cat.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="form-group" style={{ maxWidth: '560px' }}>
                          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Transcript Channel ID</span>
                            <button
                              type="button"
                              onClick={() => {
                                const u = { ...ticketConfig, transcriptChannelId: '1562822217186803754' };
                                setTicketConfig(u);
                                handleSaveTicketConfig(u);
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                            >
                              ⚡ Auto-fill #transcript (1562822217186803754)
                            </button>
                          </label>
                          <input type="text" className="form-input"
                            placeholder="e.g. 1562822217186803754"
                            value={ticketConfig.transcriptChannelId || ''}
                            onChange={e => setTicketConfig({ ...ticketConfig, transcriptChannelId: e.target.value })}
                            onBlur={() => handleSaveTicketConfig()}
                          />
                          {serverTextChannels.length > 0 && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {serverTextChannels.map(ch => (
                                <button key={ch.id} type="button"
                                  onClick={() => { const u = { ...ticketConfig, transcriptChannelId: ch.id }; setTicketConfig(u); handleSaveTicketConfig(u); }}
                                  style={{
                                    padding: '3px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
                                    border: `2px solid ${ticketConfig.transcriptChannelId === ch.id ? '#10b981' : 'var(--border-color)'}`,
                                    background: ticketConfig.transcriptChannelId === ch.id ? 'rgba(16,185,129,0.2)' : 'var(--bg-secondary)',
                                    color: ticketConfig.transcriptChannelId === ch.id ? '#10b981' : 'var(--text-muted)',
                                    transition: 'all 0.15s',
                                  }}>
                                  {ticketConfig.transcriptChannelId === ch.id ? '✓ ' : ''}#{ch.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Roles & Limits */}
                    <div className="editor-card">
                      <div className="editor-card-header" style={{ marginBottom: '1.25rem' }}>
                        <div className="editor-title">
                          <h3>🛡️ Roles &amp; Permissions</h3>
                          <p>Set which role can view and manage all tickets, and how many tickets a user can open.</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group" style={{ maxWidth: '560px' }}>
                          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Support Role ID</span>
                            <button
                              type="button"
                              onClick={() => {
                                const u = { ...ticketConfig, supportRoleId: '1562687268739747850' };
                                setTicketConfig(u);
                                handleSaveTicketConfig(u);
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                            >
                              ⚡ Auto-fill Admin Role (1562687268739747850)
                            </button>
                          </label>
                          <input type="text" className="form-input"
                            placeholder="e.g. 1562687268739747850"
                            value={ticketConfig.supportRoleId || ''}
                            onChange={e => setTicketConfig({ ...ticketConfig, supportRoleId: e.target.value })}
                            onBlur={() => handleSaveTicketConfig()}
                          />
                          {serverRoles.length > 0 && (
                            <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {serverRoles.map(role => (
                                <button key={role.id} type="button"
                                  onClick={() => { const u = { ...ticketConfig, supportRoleId: role.id }; setTicketConfig(u); handleSaveTicketConfig(u); }}
                                  style={{
                                    padding: '3px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                                    border: `2px solid ${ticketConfig.supportRoleId === role.id ? (role.color || '#6366f1') : 'var(--border-color)'}`,
                                    background: ticketConfig.supportRoleId === role.id ? `${role.color || '#6366f1'}22` : 'var(--bg-secondary)',
                                    color: ticketConfig.supportRoleId === role.id ? (role.color || '#6366f1') : 'var(--text-muted)',
                                    transition: 'all 0.15s',
                                  }}>
                                  {ticketConfig.supportRoleId === role.id ? '✓ ' : ''}{role.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="form-group" style={{ maxWidth: '220px' }}>
                          <label className="form-label">
                            <span>Max Open Tickets per User</span>
                            <span className="form-label-desc">0 = unlimited</span>
                          </label>
                          <input type="number" className="form-input" min="0" max="10"
                            value={ticketConfig.maxOpenPerUser ?? 1}
                            onChange={e => setTicketConfig({ ...ticketConfig, maxOpenPerUser: parseInt(e.target.value) || 0 })}
                            onBlur={() => handleSaveTicketConfig()}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Opening Message */}
                    <div className="editor-card">
                      <div className="editor-card-header" style={{ marginBottom: '1rem' }}>
                        <div className="editor-title">
                          <h3>💬 Opening Message</h3>
                          <p>First message the bot posts inside a newly created ticket channel.</p>
                        </div>
                      </div>
                      <div className="form-group">
                        <textarea
                          className="form-textarea"
                          style={{ minHeight: '80px' }}
                          value={ticketConfig.openMessage || ''}
                          onChange={e => setTicketConfig({ ...ticketConfig, openMessage: e.target.value })}
                          onBlur={() => handleSaveTicketConfig()}
                          placeholder="Welcome to your support ticket! A staff member will be with you shortly."
                        />
                      </div>
                    </div>

                    <button className="btn btn-primary"
                      onClick={() => handleSaveTicketConfig()}
                      disabled={isSavingTicketConfig}
                      style={{ alignSelf: 'flex-start', minWidth: '160px' }}>
                      {isSavingTicketConfig ? '⏳ Saving...' : '💾 Save All Settings'}
                    </button>

                    {/* Discord Commands Reference */}
                    <div className="editor-card" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="editor-title" style={{ marginBottom: '1rem' }}>
                        <h3>📖 Discord Commands</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                        {[
                          { cmd: '/ticket open [subject]', desc: 'Opens a new ticket for the user' },
                          { cmd: '/ticket close [reason]', desc: 'Closes current ticket & saves transcript' },
                          { cmd: '/ticket add @user', desc: 'Adds a user to the current ticket' },
                          { cmd: '/ticket remove @user', desc: 'Removes a user from the ticket' },
                          { cmd: '/ticketpanel [channel]', desc: 'Posts a button panel for users to open tickets' },
                          { cmd: '/settickets category: transcripts: supportrole:', desc: 'Configure ticket system via Discord' },
                        ].map(item => (
                          <div key={item.cmd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <code style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px',
                              fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0, color: 'var(--primary)' }}>
                              {item.cmd}
                            </code>
                            <span style={{ color: 'var(--text-sub)', lineHeight: 1.5 }}>{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

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

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (() => {
            const counts = overviewData?.counts || {
              totalMembers: 0,
              onlineMembers: 0,
              offlineMembers: 0,
              humansCount: 0,
              botsCount: 0,
              totalChannels: 0,
              textChannelsCount: 0,
              voiceChannelsCount: 0,
              categoriesCount: 0,
              rolesCount: 0,
              bansCount: 0,
              totalTickets: tickets.length,
              openTickets: tickets.filter(t => t.status === 'open').length,
              totalWarnings: warningsList.length,
            };

            const server = overviewData?.server || {
              name: 'Discord Community',
              id: '1562039371090362398',
            };

            const allMembers = overviewData?.members || [];
            const filteredMembers = allMembers
              .filter(m => {
                if (overviewMemberFilter === 'humans') return !m.isBot;
                if (overviewMemberFilter === 'bots') return m.isBot;
                return true;
              })
              .filter(m => {
                if (!overviewMemberSearch.trim()) return true;
                const q = overviewMemberSearch.toLowerCase();
                return (
                  m.username?.toLowerCase().includes(q) ||
                  m.globalName?.toLowerCase().includes(q) ||
                  m.id?.includes(q)
                );
              });

            const rolesList = overviewData?.roles || serverRoles || [];

            return (
              <>
                {/* Server Hero Banner */}
                <div className="welcome-banner" style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 50%, rgba(16,185,129,0.08) 100%)',
                  border: '1px solid var(--border-glow)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    {server.icon ? (
                      <img
                        src={server.icon}
                        alt={server.name}
                        style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid var(--primary)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
                      />
                    ) : (
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', fontWeight: 800, color: '#fff',
                        boxShadow: '0 0 20px rgba(99,102,241,0.4)',
                      }}>
                        {server.name?.charAt(0) || 'D'}
                      </div>
                    )}
                    <div className="welcome-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{server.name}</h1>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                          background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                        }}>
                          🟢 Bot Online
                        </span>
                        {server.boostTier > 0 && (
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                            background: 'rgba(244,63,94,0.2)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)',
                          }}>
                            🚀 Tier {server.boostTier}
                          </span>
                        )}
                      </div>
                      <p style={{ marginTop: '0.35rem', color: 'var(--text-sub)', fontSize: '0.85rem' }}>
                        Server ID: <code style={{ color: 'var(--primary)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px' }}>{server.id}</code>
                        {' · '}
                        <b>{counts.totalMembers}</b> Total Members
                        {' · '}
                        <b>{counts.onlineMembers}</b> Online Now
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={fetchOverview}
                      disabled={isLoadingOverview}
                      style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span style={{ display: 'inline-block', transform: isLoadingOverview ? 'rotate(360deg)' : 'none', transition: 'transform 0.8s' }}>🔄</span>
                      <span>{isLoadingOverview ? 'Refreshing...' : 'Refresh Stats'}</span>
                    </button>
                  </div>
                </div>

                {/* 6 Key Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

                  {/* Card 1: Total Members */}
                  <div className="editor-card" style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, var(--bg-card) 100%)',
                    borderLeft: '4px solid #6366f1',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Total Members</span>
                      <span style={{ fontSize: '1.5rem' }}>👥</span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
                      {counts.totalMembers}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                      <span>👤 {counts.humansCount} Humans</span>
                      <span>·</span>
                      <span>🤖 {counts.botsCount} Bots</span>
                    </div>
                  </div>

                  {/* Card 2: Online Presence */}
                  <div className="editor-card" style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, var(--bg-card) 100%)',
                    borderLeft: '4px solid #10b981',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Online Now</span>
                      <span style={{ fontSize: '1.5rem' }}>🟢</span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginBottom: '0.35rem' }}>
                      {counts.onlineMembers}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      💤 {counts.offlineMembers} Offline / Idle
                    </div>
                  </div>

                  {/* Card 3: Channels Overview */}
                  <div className="editor-card" style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, var(--bg-card) 100%)',
                    borderLeft: '4px solid #3b82f6',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Total Channels</span>
                      <span style={{ fontSize: '1.5rem' }}>💬</span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.35rem' }}>
                      {counts.totalChannels}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      💬 {counts.textChannelsCount} Text · 🔊 {counts.voiceChannelsCount} Voice · 📁 {counts.categoriesCount} Categories
                    </div>
                  </div>

                  {/* Card 4: Server Roles */}
                  <div className="editor-card" style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, var(--bg-card) 100%)',
                    borderLeft: '4px solid #8b5cf6',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Server Roles</span>
                      <span style={{ fontSize: '1.5rem' }}>🏷️</span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa', marginBottom: '0.35rem' }}>
                      {counts.rolesCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Admin &amp; Moderation hierarchy configured
                    </div>
                  </div>

                  {/* Card 5: Tickets Summary */}
                  <div className="editor-card" style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, var(--bg-card) 100%)',
                    borderLeft: '4px solid #f59e0b',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Support Tickets</span>
                      <span style={{ fontSize: '1.5rem' }}>🎫</span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.35rem' }}>
                      {counts.totalTickets}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      🟢 {counts.openTickets} Open · 🔒 {Math.max(0, counts.totalTickets - counts.openTickets)} Closed with Transcripts
                    </div>
                  </div>

                  {/* Card 6: Moderation & Audit */}
                  <div className="editor-card" style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 100%)',
                    borderLeft: '4px solid #ef4444',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Moderation &amp; Bans</span>
                      <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', marginBottom: '0.35rem' }}>
                      {counts.bansCount}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      🔨 {counts.bansCount} Bans · ⚠️ {counts.totalWarnings} Warnings issued
                    </div>
                  </div>

                </div>

                {/* Two-Column Layout: Member Roster (Left) + Structure & Roles (Right) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>

                  {/* LEFT: Member Roster */}
                  <div className="editor-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', margin: 0 }}>👥 Server Members ({counts.totalMembers})</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '2px' }}>Real-time member directory with role assignments</p>
                      </div>

                      {/* Filters */}
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {[
                          { key: 'all', label: `All (${allMembers.length})` },
                          { key: 'humans', label: `👤 Humans (${counts.humansCount})` },
                          { key: 'bots', label: `🤖 Bots (${counts.botsCount})` },
                        ].map(f => (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => setOverviewMemberFilter(f.key)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: `1px solid ${overviewMemberFilter === f.key ? 'var(--primary)' : 'var(--border-color)'}`,
                              background: overviewMemberFilter === f.key ? 'var(--primary)' : 'var(--bg-secondary)',
                              color: overviewMemberFilter === f.key ? '#fff' : 'var(--text-muted)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Member Search input */}
                    <div style={{ marginBottom: '1rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search members by username or ID..."
                        style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                        value={overviewMemberSearch}
                        onChange={e => setOverviewMemberSearch(e.target.value)}
                      />
                    </div>

                    {/* Member List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '520px', overflowY: 'auto' }}>
                      {filteredMembers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-sub)' }}>
                          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.4rem' }}>🔍</span>
                          <p style={{ fontSize: '0.85rem' }}>No members matched your search.</p>
                        </div>
                      ) : (
                        filteredMembers.map(m => {
                          const memberRoles = rolesList.filter(r => (m.roles || []).includes(r.id));

                          return (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem 0.9rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img
                                  src={m.avatar}
                                  alt={m.username}
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    border: m.isBot ? '2px solid #8b5cf6' : '2px solid var(--primary)',
                                  }}
                                />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                      {m.globalName || m.username}
                                    </span>
                                    {m.isBot && (
                                      <span style={{
                                        fontSize: '0.65rem',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        background: '#5865F2',
                                        color: '#fff',
                                        fontWeight: 700,
                                        letterSpacing: '0.5px',
                                      }}>
                                        BOT
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                    @{m.username} · ID: <code style={{ fontSize: '0.7rem' }}>{m.id}</code>
                                  </div>
                                </div>
                              </div>

                              {/* Roles */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                                {memberRoles.length > 0 ? (
                                  memberRoles.map(r => (
                                    <span
                                      key={r.id}
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        color: r.color && r.color !== '#94a3b8' ? r.color : 'var(--text-sub)',
                                        border: `1px solid ${r.color && r.color !== '#94a3b8' ? r.color + '55' : 'var(--border-color)'}`,
                                        background: r.color && r.color !== '#94a3b8' ? r.color + '15' : 'var(--bg-primary)',
                                      }}
                                    >
                                      {r.name}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    @everyone
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Server Structure & Roles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Roles Breakdown */}
                    <div className="editor-card" style={{ padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.05rem', margin: 0, marginBottom: '0.35rem' }}>🏷️ Server Roles ({rolesList.length})</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginBottom: '0.85rem' }}>Role hierarchy on your Discord server</p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '250px', overflowY: 'auto' }}>
                        {rolesList.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No custom roles created yet.</p>
                        ) : (
                          rolesList.map(r => (
                            <div
                              key={r.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg-secondary)',
                                borderLeft: `4px solid ${r.color || '#94a3b8'}`,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color || '#94a3b8' }} />
                                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: r.color || 'var(--text-main)' }}>
                                  {r.name}
                                </span>
                              </div>
                              <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.id}</code>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Channels Structure */}
                    <div className="editor-card" style={{ padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.05rem', margin: 0, marginBottom: '0.35rem' }}>📁 Channel Structure ({counts.totalChannels})</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginBottom: '0.85rem' }}>Categories, text &amp; voice channels</p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto' }}>
                        {(overviewData?.channels?.categories || []).map(cat => {
                          const childText = (overviewData?.channels?.text || []).filter(c => c.parentId === cat.id);
                          const childVoice = (overviewData?.channels?.voice || []).filter(c => c.parentId === cat.id);

                          return (
                            <div key={cat.id} style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                📁 {cat.name}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginLeft: '0.5rem' }}>
                                {childText.map(t => (
                                  <span key={t.id} style={{ fontSize: '0.74rem', padding: '1px 7px', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                                    #{t.name}
                                  </span>
                                ))}
                                {childVoice.map(v => (
                                  <span key={v.id} style={{ fontSize: '0.74rem', padding: '1px 7px', borderRadius: '4px', background: 'var(--bg-primary)', color: '#06b6d4' }}>
                                    🔊 {v.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Portal Jump Links */}
                    <div className="editor-card" style={{ padding: '1.25rem', background: 'var(--bg-secondary)' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.6rem' }}>⚡ Quick Actions</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                          onClick={() => setActiveTab('tickets')}
                        >
                          🎫 Support Tickets
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                          onClick={() => setActiveTab('moderation')}
                        >
                          ⚔️ Moderation
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                          onClick={() => setActiveTab('logs')}
                        >
                          📜 Audit Logs
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                          onClick={() => setActiveTab('welcome')}
                        >
                          👋 Welcome Studio
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </>
            );
          })()}

          {/* TAB: MODERATION */}
          {activeTab === 'moderation' && (() => {
            const MOD_CATEGORIES = [
              { key: 'all', label: 'All Commands', icon: '🛡️' },
              { key: 'punishment', label: 'Punishment', icon: '🔨' },
              { key: 'warnings', label: 'Warnings', icon: '⚠️' },
              { key: 'channel', label: 'Channel Mgmt', icon: '📁' },
              { key: 'member', label: 'Member Mgmt', icon: '👤' },
            ];

            const filteredCmds = Object.entries(moderationConfig.commands || {}).filter(([, cmd]) => {
              const catMatch = modCategoryFilter === 'all' || cmd.category === modCategoryFilter;
              const searchMatch = !modSearch.trim() ||
                cmd.name.toLowerCase().includes(modSearch.toLowerCase()) ||
                cmd.description.toLowerCase().includes(modSearch.toLowerCase());
              return catMatch && searchMatch;
            });

            const totalEnabled = Object.values(moderationConfig.commands || {}).filter(c => c.enabled).length;
            const totalCmds = Object.keys(moderationConfig.commands || {}).length;

            return (
              <>
                {/* Header Banner */}
                <div className="welcome-banner">
                  <div className="welcome-text">
                    <h1>⚔️ Moderation Control Center</h1>
                    <p>Enable/disable commands, assign roles, and manage all moderation settings from one place.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className={`btn ${moderationConfig.globalEnabled ? 'btn-secondary' : 'btn-danger'}`}
                      style={{
                        background: moderationConfig.globalEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        borderColor: moderationConfig.globalEnabled ? '#10b981' : '#ef4444',
                        color: moderationConfig.globalEnabled ? '#10b981' : '#ef4444',
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        const updated = { ...moderationConfig, globalEnabled: !moderationConfig.globalEnabled };
                        setModerationConfig(updated);
                        handleSaveModeration(updated);
                      }}
                    >
                      {moderationConfig.globalEnabled ? '🟢 Moderation: ACTIVE' : '🔴 Moderation: PAUSED'}
                    </button>
                    {isModerationDirty && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSaveModeration()}
                        disabled={isSavingModeration}
                        style={{ animation: 'pulse 1.8s infinite', boxShadow: '0 0 15px rgba(99,102,241,0.6)' }}
                      >
                        {isSavingModeration ? 'Saving...' : '💾 Save Changes'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-view Switcher */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <button
                    className={`btn ${modSubView === 'commands' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => setModSubView('commands')}
                  >
                    ⚙️ Commands &amp; Roles
                  </button>
                  <button
                    className={`btn ${modSubView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => setModSubView('settings')}
                  >
                    🔧 Global Settings
                  </button>
                  <button
                    className={`btn ${modSubView === 'warnings' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => setModSubView('warnings')}
                  >
                    <span>⚠️ Warning Records</span>
                    <span style={{
                      padding: '2px 7px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      background: modSubView === 'warnings' ? 'rgba(255,255,255,0.25)' : 'rgba(245,158,11,0.2)',
                    }}>{warningsList.length}</span>
                  </button>
                </div>

                {/* SUB-VIEW: GLOBAL SETTINGS */}
                {modSubView === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '760px' }}>

                    {/* Admin Role */}
                    <div className="editor-card" style={{ border: '1px solid var(--border-glow)' }}>
                      <div className="editor-card-header">
                        <div className="editor-title">
                          <h3>👑 Admin Role (Bypass All)</h3>
                          <p>Members with this role can use ALL moderation commands regardless of per-command role settings.</p>
                        </div>
                      </div>
                      <div className="form-group" style={{ maxWidth: '560px' }}>
                        <label className="form-label">
                          <span>Admin Role ID</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...moderationConfig, adminRoleId: '1562687268739747850' };
                              setModerationConfig(updated);
                              handleSaveModeration(updated);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                          >
                            ⚡ Auto-fill Admin Role (1562687268739747850)
                          </button>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 1562687268739747850"
                          value={moderationConfig.adminRoleId || ''}
                          onChange={(e) => setModerationConfig({ ...moderationConfig, adminRoleId: e.target.value })}
                          onBlur={() => handleSaveModeration()}
                        />
                        {serverRoles.length > 0 && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {serverRoles.map((role) => (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => {
                                  const updated = { ...moderationConfig, adminRoleId: role.id };
                                  setModerationConfig(updated);
                                  handleSaveModeration(updated);
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  border: `2px solid ${moderationConfig.adminRoleId === role.id ? (role.color || '#6366f1') : 'var(--border-color)'}`,
                                  background: moderationConfig.adminRoleId === role.id ? `${role.color || '#6366f1'}22` : 'var(--bg-secondary)',
                                  color: moderationConfig.adminRoleId === role.id ? (role.color || '#6366f1') : 'var(--text-sub)',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {moderationConfig.adminRoleId === role.id ? '✓ ' : ''}{role.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Log Channel */}
                    <div className="editor-card">
                      <div className="editor-card-header">
                        <div className="editor-title">
                          <h3>📋 Moderation Log Channel</h3>
                          <p>Moderation actions (kicks, bans, warns) will be posted to this channel automatically.</p>
                        </div>
                      </div>
                      <div className="form-group" style={{ maxWidth: '560px' }}>
                        <label className="form-label">
                          <span>Log Channel ID</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...moderationConfig, logChannelId: '1562687171079708784' };
                              setModerationConfig(updated);
                              handleSaveModeration(updated);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                          >
                            ⚡ Auto-fill #logs (1562687171079708784)
                          </button>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 1562687171079708784"
                          value={moderationConfig.logChannelId || ''}
                          onChange={(e) => setModerationConfig({ ...moderationConfig, logChannelId: e.target.value })}
                          onBlur={() => handleSaveModeration()}
                        />
                      </div>
                    </div>

                    {/* DM on action toggle */}
                    <div className="editor-card">
                      <div className="editor-card-header">
                        <div className="editor-title">
                          <h3>📬 DM Members on Action</h3>
                          <p>When enabled, the bot will DM the target member to inform them of the moderation action (ban, kick, warn, etc.).</p>
                        </div>
                        <div className="switch-container">
                          <span style={{ fontSize: '0.8rem', color: moderationConfig.dmOnAction ? '#10b981' : '#94a3b8' }}>
                            {moderationConfig.dmOnAction ? 'Enabled' : 'Disabled'}
                          </span>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={!!moderationConfig.dmOnAction}
                              onChange={() => {
                                const updated = { ...moderationConfig, dmOnAction: !moderationConfig.dmOnAction };
                                setModerationConfig(updated);
                                handleSaveModeration(updated);
                              }}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleSaveModeration()}
                      disabled={isSavingModeration}
                      style={{ alignSelf: 'flex-start', minWidth: '160px' }}
                    >
                      {isSavingModeration ? '⏳ Saving...' : '💾 Save All Settings'}
                    </button>
                  </div>
                )}

                {/* SUB-VIEW: COMMANDS & ROLES */}
                {modSubView === 'commands' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Stats Bar */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Total Commands', value: totalCmds, icon: '⚡', color: '#6366f1' },
                        { label: 'Active', value: totalEnabled, icon: '✅', color: '#10b981' },
                        { label: 'Disabled', value: totalCmds - totalEnabled, icon: '❌', color: '#ef4444' },
                        { label: 'Server Roles', value: serverRoles.length, icon: '🏷️', color: '#8b5cf6' },
                      ].map((s) => (
                        <div key={s.label} className="editor-card" style={{ flex: '1 1 140px', padding: '1rem', textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
                          <div style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>{s.icon}</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '2px' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Filter Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {MOD_CATEGORIES.map((cat) => {
                        const count = cat.key === 'all'
                          ? Object.keys(moderationConfig.commands || {}).length
                          : Object.values(moderationConfig.commands || {}).filter(c => c.category === cat.key).length;
                        return (
                          <button
                            key={cat.key}
                            onClick={() => setModCategoryFilter(cat.key)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: `2px solid ${modCategoryFilter === cat.key ? 'var(--primary)' : 'var(--border-color)'}`,
                              background: modCategoryFilter === cat.key ? 'var(--primary)' : 'var(--bg-secondary)',
                              color: modCategoryFilter === cat.key ? '#fff' : 'var(--text-sub)',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.15s',
                            }}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span style={{
                              fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px',
                              background: modCategoryFilter === cat.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)',
                            }}>{count}</span>
                          </button>
                        );
                      })}
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, minWidth: '180px', fontSize: '0.85rem', padding: '6px 12px' }}
                        placeholder="Search commands..."
                        value={modSearch}
                        onChange={(e) => setModSearch(e.target.value)}
                      />
                    </div>

                    {/* Command Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                      {filteredCmds.map(([cmdKey, cmd]) => {
                        const catColors = { punishment: '#ef4444', warnings: '#f59e0b', channel: '#3b82f6', member: '#8b5cf6' };
                        const catColor = catColors[cmd.category] || '#6366f1';
                        const isEnabled = cmd.enabled !== false;
                        const allowedRoles = Array.isArray(cmd.allowedRoles) ? cmd.allowedRoles : [];

                        return (
                          <div key={cmdKey} className="editor-card" style={{
                            borderLeft: `4px solid ${isEnabled ? catColor : 'var(--border-color)'}`,
                            opacity: isEnabled ? 1 : 0.6,
                            transition: 'all 0.2s',
                          }}>
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>{cmd.icon}</span>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>/{cmdKey}</div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '1px' }}>{cmd.name}</div>
                                </div>
                              </div>
                              <label className="switch" style={{ flexShrink: 0 }}>
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => handleToggleCommand(cmdKey)}
                                />
                                <span className="slider"></span>
                              </label>
                            </div>

                            {/* Description */}
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                              {cmd.description}
                            </p>

                            {/* Category Badge */}
                            <div style={{ marginBottom: '0.85rem' }}>
                              <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                                textTransform: 'uppercase', background: `${catColor}20`, color: catColor,
                              }}>
                                {cmd.category}
                              </span>
                            </div>

                            {/* Allowed Roles Section */}
                            <div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '0.5rem' }}>
                                🔑 Allowed Roles <span style={{ fontWeight: 400 }}>(Admin role always has access)</span>
                              </div>
                              {serverRoles.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                  {serverRoles.map((role) => {
                                    const isChecked = allowedRoles.includes(role.id);
                                    const roleCol = role.color || '#6366f1';
                                    return (
                                      <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => handleToggleRoleForCommand(cmdKey, role.id)}
                                        style={{
                                          padding: '3px 10px',
                                          borderRadius: '20px',
                                          border: `2px solid ${isChecked ? roleCol : 'var(--border-color)'}`,
                                          background: isChecked ? `${roleCol}22` : 'var(--bg-secondary)',
                                          color: isChecked ? roleCol : 'var(--text-muted)',
                                          cursor: 'pointer',
                                          fontSize: '0.76rem',
                                          fontWeight: isChecked ? 700 : 400,
                                          transition: 'all 0.15s',
                                        }}
                                      >
                                        {isChecked ? '✓ ' : ''}{role.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {allowedRoles.length > 0
                                    ? <span>✅ {allowedRoles.length} role ID(s) assigned</span>
                                    : <span style={{ color: '#f59e0b' }}>⚠️ No extra roles — only Admin role can use this</span>
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {filteredCmds.length === 0 && (
                      <div className="editor-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-sub)' }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🔍</span>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem' }}>No Commands Found</h4>
                        <p style={{ fontSize: '0.85rem' }}>Try a different category or clear your search query.</p>
                      </div>
                    )}

                    {/* Enable All / Disable All quick actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.82rem', color: '#10b981', borderColor: '#10b981' }}
                        onClick={() => {
                          const updated = {
                            ...moderationConfig,
                            commands: Object.fromEntries(
                              Object.entries(moderationConfig.commands || {}).map(([k, v]) => [k, { ...v, enabled: true }])
                            ),
                          };
                          setModerationConfig(updated);
                          handleSaveModeration(updated);
                        }}
                      >
                        ✅ Enable All Commands
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.82rem', color: '#ef4444', borderColor: '#ef4444' }}
                        onClick={() => {
                          const updated = {
                            ...moderationConfig,
                            commands: Object.fromEntries(
                              Object.entries(moderationConfig.commands || {}).map(([k, v]) => [k, { ...v, enabled: false }])
                            ),
                          };
                          setModerationConfig(updated);
                          handleSaveModeration(updated);
                        }}
                      >
                        ❌ Disable All Commands
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.82rem' }}
                        onClick={() => {
                          const adminId = moderationConfig.adminRoleId || '1562687268739747850';
                          const updated = {
                            ...moderationConfig,
                            commands: Object.fromEntries(
                              Object.entries(moderationConfig.commands || {}).map(([k, v]) => [k, { ...v, allowedRoles: [adminId] }])
                            ),
                          };
                          setModerationConfig(updated);
                          handleSaveModeration(updated);
                        }}
                      >
                        👑 Reset All Roles to Admin Only
                      </button>
                    </div>
                  </div>
                )}

                {/* SUB-VIEW: WARNINGS */}
                {modSubView === 'warnings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="editor-card" style={{ border: '1px solid var(--border-glow)' }}>
                      <div className="editor-card-header" style={{ marginBottom: '1rem' }}>
                        <div className="editor-title">
                          <h3>⚠️ Active Warning Records</h3>
                          <p>All member warnings issued via /warn command. Click ✕ to remove individual records.</p>
                        </div>
                      </div>

                      {warningsList.length === 0 ? (
                        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-sub)' }}>
                          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>✅</span>
                          <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem' }}>No Active Warnings</h4>
                          <p style={{ fontSize: '0.85rem' }}>When moderators issue /warn commands, records appear here.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {warningsList.map((warn) => (
                            <div
                              key={warn.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.85rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg-secondary)',
                                borderLeft: '4px solid #f59e0b',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                    ⚠️ {warn.username || warn.userId}
                                  </span>
                                  {warn.moderator && (
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px' }}>
                                      By: {warn.moderator}
                                    </span>
                                  )}
                                  {warn.timestamp && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {new Date(warn.timestamp).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {warn.reason && (
                                  <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', fontStyle: 'italic' }}>
                                    "{warn.reason}"
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleClearWarning(warn.id, warn.userId)}
                                style={{
                                  background: 'rgba(239,68,68,0.12)',
                                  border: '1px solid rgba(239,68,68,0.4)',
                                  color: '#ef4444',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

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

