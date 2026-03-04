
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, AttendanceStatus } from './types';
import { dataService } from './services/dataService';
import Sidebar from './components/Sidebar';
import AttendanceModule from './components/AttendanceModule';
import WorklogModule from './components/WorklogModule';
import PeerReviewModule from './components/PeerReviewModule';
import MessengerModule from './components/MessengerModule';
import AnalyticsModule from './components/AnalyticsModule';
import DashboardModule from './components/DashboardModule';
import NotificationCenter from './components/NotificationCenter';
import ToastManager from './components/ToastManager';
import LibraryModule from './components/LibraryModule';
import RewardFanfare from './components/RewardFanfare';
import { TeamManagementModule, ProjectManagementModule, SecurityModule, ReportExportModule, UserManagementModule } from './components/AdminModules';
import QuickActionsWidget from './components/QuickActionsWidget';
import SmartSearch from './components/SmartSearch';
import { LogOut, Shield, RefreshCw, Lock, ChevronRight, Menu, ShieldAlert, Activity, Wifi, WifiOff, Link2, Database, Server } from 'lucide-react';

const App: React.FC = () => {
  // --- AUTH BYPASS DISABLED: LOGIN PAGE NOW ACTIVE ---
  const BYPASS_AUTH = false;
  // ---------------------------------------------------------

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (BYPASS_AUTH) {
      // Pre-select the Command HQ user for immediate access (Dev Only)
      const users = dataService.getUsers();
      return users.find(u => u.role === UserRole.ADMIN) || users[0];
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAnalyticsUserId, setSelectedAnalyticsUserId] = useState<string | null>(null);
  const [showUrlConfig, setShowUrlConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(dataService.apiUrl);
  const [rankFanfare, setRankFanfare] = useState({ isOpen: false, title: '', level: 0 });
  const lastRankLevel = useRef<number>(0);

  useEffect(() => {
    refreshData();
  }, []);

  // Rank Change Watcher
  useEffect(() => {
    if (currentUser && currentUser.role === UserRole.STUDENT) {
      const currentRank = dataService.calculateUserRank(currentUser);
      if (lastRankLevel.current > 0 && currentRank.level > lastRankLevel.current) {
        setRankFanfare({ isOpen: true, title: currentRank.title, level: currentRank.level });
      }
      lastRankLevel.current = currentRank.level;
    }
  }, [currentUser]);

  // Dynamic Stars for background (Reduced for performance)
  const stars = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  const refreshData = async () => {
    setIsSyncing(true);
    const success = await dataService.syncWithBackend();
    setSyncSuccess(success);
    setIsSyncing(false);
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSyncing(true);

    try {
      const user = await dataService.login(loginData.identifier.trim(), loginData.password);

      if (user.role !== selectedRole) {
        setLoginError("FAILURE: ROLE MISMATCH");
        setIsSyncing(false);
        return;
      }

      setCurrentUser(user);
      dataService.updateAttendance(user.id, AttendanceStatus.ONLINE);
      dataService.logAction(user.id, user.name, `Link Established: ${selectedRole}`, "Auth");
    } catch (error: any) {
      setLoginError("FAILURE: INVALID CREDENTIALS");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      dataService.updateAttendance(currentUser.id, AttendanceStatus.OFFLINE);
      dataService.logAction(currentUser.id, currentUser.name, "Link Terminated", "Auth");
      setCurrentUser(null);
      setLoginData({ identifier: '', password: '' });
    }
  };

  // Render Login UI if no user is authenticated
  if (!currentUser) {
    const syncedUsers = dataService.getUsers();
    const opsCount = syncedUsers.filter(u => u.role === UserRole.STUDENT).length;
    const cmdCount = syncedUsers.filter(u => u.role === UserRole.ADMIN).length;

    return (
      <div className="h-full w-full auth-gradient flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Starry Background */}
        <div className="star-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: `${star.top}%`,
                left: `${star.left}%`,
                // @ts-ignore
                '--duration': `${star.duration}s`,
              }}
            />
          ))}
        </div>

        <div className="w-full max-w-md flex flex-col items-center gap-10 relative z-10 animate-stagger">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-glow-cyan border-4 border-white/10">
              <Shield className="text-white" size={32} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter-custom uppercase">WorkLog Portal</h1>
              <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.5em]">Professional Work Management</p>
            </div>
          </div>

          <div className="w-full bg-slate-900/40 rounded-[3rem] border border-white/10 backdrop-blur-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="space-y-8">
              {/* System Status */}
              <div className="flex items-center justify-between px-2 bg-black/20 py-3 rounded-2xl border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : syncSuccess ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isSyncing ? 'Syncing Data...' : syncSuccess ? 'System Online' : 'System Offline'}
                    </span>
                    {syncSuccess && (
                      <span className="text-[7px] font-bold text-slate-500 uppercase mt-1">
                        Active Users: {opsCount} Students | {cmdCount} Admins
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={refreshData} disabled={isSyncing} className="text-slate-500 hover:text-cyan-400 transition-colors">
                    <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              <div className="relative flex p-1 bg-black/40 rounded-2xl overflow-hidden">
                <button onClick={() => setSelectedRole(UserRole.STUDENT)} className={`relative z-10 flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${selectedRole === UserRole.STUDENT ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-glow-cyan' : 'text-slate-500 hover:text-slate-300'} rounded-xl transition-all`}>Student</button>
                <button onClick={() => setSelectedRole(UserRole.ADMIN)} className={`relative z-10 flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${selectedRole === UserRole.ADMIN ? 'text-white bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-glow-cyan' : 'text-slate-500 hover:text-slate-300'} rounded-xl transition-all`}>Admin</button>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                {loginError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3">
                    <ShieldAlert size={16} className="text-rose-500" />
                    <span className="text-[10px] font-black text-rose-500 uppercase leading-tight">{loginError}</span>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Roll Number</label>
                    <input type="text" placeholder="Enter your ID" value={loginData.identifier} onChange={e => setLoginData({ ...loginData, identifier: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-cyan-500/50 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Password</label>
                    <input type="password" placeholder="Enter password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-cyan-500/50 transition-colors" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className={`w-full py-6 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-glow-cyan hover:scale-[1.02] transition-all flex items-center justify-center gap-3 ${isSyncing ? 'bg-slate-700' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'}`}
                >
                  {isSyncing ? 'CONNECTING...' : 'Sign In'} <ChevronRight size={18} />
                </button>
              </form>


            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-full command-gradient overflow-x-hidden relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser.role} userName={currentUser.name} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="sticky top-0 h-16 md:h-24 px-4 md:px-12 flex items-center justify-between z-40 bg-white/60 backdrop-blur-md shrink-0 border-b border-indigo-100/50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:text-indigo-600 transition-colors"><Menu size={20} /></button>
            <div className="hidden sm:flex items-center gap-3 px-6 py-3 bg-white/70 rounded-2xl border border-indigo-100 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${currentUser.status === AttendanceStatus.ONLINE ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`}></span>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">STATUS: {currentUser.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SmartSearch onNavigate={(tab, id) => {
              setActiveTab(tab);
              if (id && tab === 'analytics') setSelectedAnalyticsUserId(id);
            }} />
            <button onClick={refreshData} className={`p-4 text-slate-500 hover:text-indigo-600 bg-white/50 border border-indigo-100 rounded-2xl transition-colors ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
            <NotificationCenter user={currentUser} onNavigate={setActiveTab} />
            <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-[10px] font-black uppercase shadow-glow-indigo transition-all"><LogOut size={14} /> <span>Sign Out</span></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto lg:overflow-y-auto px-4 md:px-12 pb-12 custom-scrollbar">
          <div className="max-w-[1500px] mx-auto py-6">
            {activeTab === 'dashboard' && <DashboardModule user={currentUser} onNavigate={setActiveTab} onSelectUser={(id) => { setSelectedAnalyticsUserId(id); setActiveTab('analytics'); }} />}
            {activeTab === 'attendance' && <AttendanceModule user={currentUser} onStatusChange={(s) => setCurrentUser({ ...currentUser, status: s })} onSelectUser={(id) => { setSelectedAnalyticsUserId(id); setActiveTab('analytics'); }} />}
            {activeTab === 'worklogs' && <WorklogModule user={currentUser} />}
            {activeTab === 'reviews' && <PeerReviewModule user={currentUser} />}
            {activeTab === 'messages' && <MessengerModule user={currentUser} />}
            {activeTab === 'reports' && <ReportExportModule />}
            {activeTab === 'analytics' && <AnalyticsModule targetUserId={selectedAnalyticsUserId} onResetTarget={() => setSelectedAnalyticsUserId(null)} />}
            {activeTab === 'teams' && <TeamManagementModule user={currentUser} />}
            {activeTab === 'projects' && <ProjectManagementModule user={currentUser} />}
            {activeTab === 'security' && <SecurityModule user={currentUser} />}
            {activeTab === 'personnel' && <UserManagementModule user={currentUser} />}
            {activeTab === 'library' && <LibraryModule user={currentUser} />}
          </div>
        </main>
      </div>
      <QuickActionsWidget user={currentUser} onNavigate={setActiveTab} />
      <ToastManager user={currentUser} />
      <RewardFanfare
        {...rankFanfare}
        onClose={() => setRankFanfare(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;
