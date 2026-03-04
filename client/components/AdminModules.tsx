
import React, { useState } from 'react';
import {
  Users, Briefcase, Activity, Search,
  ChevronRight, Download, FileText, Clock,
  Plus, X, ArrowRight, UserPlus, Check,
  Trash2, ListChecks, Key, Link2, Save
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { UserRole, AttendanceStatus, User, Team, Project, ProjectMilestone } from '../types';
import { exportToCSV } from '../services/exportService';

export const UserManagementModule: React.FC<{ user?: User }> = ({ user }) => {
  const [users, setUsers] = useState(dataService.getUsers());
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({ name: '', rollNumber: '', password: '' });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.rollNumber || !newUser.password) return;
    dataService.createUser({ name: newUser.name, rollNumber: newUser.rollNumber.toUpperCase(), password: newUser.password, role: UserRole.STUDENT });
    setUsers([...dataService.getUsers()]);
    setNewUser({ name: '', rollNumber: '', password: '' });
    setIsAdding(false);
    dataService.logAction(user?.id || 'admin', user?.name || 'Admin', `Created Student: ${newUser.rollNumber}`, 'Students');
  };

  const filteredUsers = users.filter(u => u.role === UserRole.STUDENT && (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/40 p-8 rounded-[2.5rem] border border-white shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter-custom uppercase">Student Registry</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Enrolled Student Data</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${isAdding ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white hover:bg-slate-900'}`}>
          {isAdding ? <X size={16} /> : <UserPlus size={16} />}
          {isAdding ? 'CANCEL' : 'ADD STUDENT'}
        </button>
      </div>

      {isAdding && (
        <div className="glass-glossy p-8 md:p-12 rounded-[3rem] bg-white shadow-2xl animate-stagger border-2 border-indigo-100">
          <form onSubmit={handleCreateUser} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" required placeholder="E.G. ALICE VANCE" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Roll Number</label>
                <input type="text" required placeholder="OP-XXX" value={newUser.rollNumber} onChange={e => setNewUser({ ...newUser, rollNumber: e.target.value })} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <input type="text" required placeholder="PASSWORD" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">REGISTER STUDENT <ArrowRight size={18} /></button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="glass-glossy p-6 rounded-[2.5rem] border border-white group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 transition-colors">{user.name[0]}</div>
              <div className="min-w-0">
                <h4 className="text-base font-black text-slate-900 uppercase truncate">{user.name}</h4>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{user.rollNumber}</p>
              </div>
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user.status === AttendanceStatus.ONLINE ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeamManagementModule: React.FC<{ user?: User }> = ({ user }) => {
  const [teams, setTeams] = useState(dataService.getTeams());
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: '', projectId: '' });
  const allUsers = dataService.getUsers();
  const students = allUsers.filter(u => u.role === UserRole.STUDENT);
  const projects = dataService.getProjects();

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name) return;
    dataService.createTeam({ name: newTeam.name.toUpperCase(), projectId: newTeam.projectId || undefined, studentIds: [] });
    setTeams([...dataService.getTeams()]);
    setIsAdding(false);
  };

  const toggleMemberAssignment = (teamId: string, studentId: string) => {
    const team = teams.find(t => t.id === String(teamId));
    if (!team) return;
    let newIds = [...team.studentIds];
    newIds = newIds.includes(String(studentId)) ? newIds.filter(id => String(id) !== String(studentId)) : [...newIds, String(studentId)];
    dataService.assignMembersToTeam(teamId, newIds);
    setTeams([...dataService.getTeams()]);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter-custom uppercase">Team Management</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Organize Project Teams</p>
        </div>
        <button onClick={() => { setIsAdding(!isAdding); setEditingTeamId(null); }} className={`px-6 py-3 text-[10px] md:text-xs font-black uppercase rounded-xl transition-all ${isAdding ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>{isAdding ? <X size={16} /> : <Plus size={16} />} {isAdding ? 'CANCEL' : 'NEW TEAM'}</button>
      </div>

      {isAdding && (
        <div className="glass-glossy p-6 md:p-10 rounded-[2.5rem] bg-white border-2 border-indigo-100">
          <form onSubmit={handleCreateTeam} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} placeholder="TEAM NAME" className="w-full px-6 py-4 rounded-2xl border bg-white/50 outline-none text-xs font-bold uppercase transition-all" />
              <select value={newTeam.projectId} onChange={e => setNewTeam({ ...newTeam, projectId: e.target.value })} className="w-full px-6 py-4 bg-white/50 border rounded-2xl text-xs font-bold uppercase outline-none">
                <option value="">SELECT PROJECT</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl">SUBMIT NEW TEAM</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {teams.map(team => {
          const members = students.filter(s => team.studentIds.map(String).includes(String(s.id)));
          const project = projects.find(p => p.id === team.projectId);
          const isEditing = editingTeamId === team.id;
          return (
            <div key={team.id} className={`glass-glossy p-6 md:p-8 rounded-[2rem] shadow-xl border-2 ${isEditing ? 'border-indigo-400' : 'border-white'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">{team.name}</h3>
                  <p className="text-[8px] md:text-[10px] font-black text-indigo-500 uppercase mt-1">Project: {project?.name || 'NONE'}</p>
                </div>
                <button onClick={() => setEditingTeamId(isEditing ? null : team.id)} className={`p-2.5 rounded-xl ${isEditing ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{isEditing ? <Check size={20} /> : <UserPlus size={20} />}</button>
              </div>

              {isEditing ? (
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-2 custom-scrollbar">
                  {students.map(s => {
                    const isAssigned = team.studentIds.map(String).includes(String(s.id));
                    return (
                      <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border ${isAssigned ? 'bg-indigo-50 border-indigo-200' : 'bg-white/50 border-white'}`}>
                        <p className="text-[10px] font-black text-slate-800">{s.name}</p>
                        <button onClick={() => toggleMemberAssignment(team.id, s.id)} className={`p-2 rounded-lg ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-400'}`}>{isAssigned ? <X size={14} /> : <Plus size={14} />}</button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 flex-1">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600">{member.name[0]}</div>
                        <p className="text-[10px] font-black text-slate-800 truncate">{member.name}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase ${member.status === AttendanceStatus.ONLINE ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{member.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ProjectManagementModule: React.FC<{ user?: User }> = ({ user }) => {
  const [projects, setProjects] = useState(dataService.getProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const teams = dataService.getTeams();

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    dataService.createProject({
      name: newProject.name.toUpperCase(),
      description: newProject.description,
      status: 'ACTIVE',
      milestones: []
    });
    setProjects([...dataService.getProjects()]);
    setIsAdding(false);
    setNewProject({ name: '', description: '' });
  };

  const handleToggleMilestone = (projectId: string, milestoneId: string) => {
    const project = projects.find(p => p.id === String(projectId));
    if (!project) return;
    const newM = project.milestones.map(m => m.id === String(milestoneId) ? { ...m, isCompleted: !m.isCompleted } : m);
    dataService.updateProjectMilestones(projectId, newM);
    setProjects([...dataService.getProjects()]);
  };

  const handleAddMilestone = (projectId: string) => {
    if (!newMilestone.trim()) return;
    const project = projects.find(p => p.id === String(projectId));
    if (!project) return;
    const milestone: ProjectMilestone = { id: `m_${Date.now()}`, label: newMilestone, isCompleted: false, priority: 'NORMAL' };
    dataService.updateProjectMilestones(projectId, [...project.milestones, milestone]);
    setProjects([...dataService.getProjects()]);
    setNewMilestone('');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter-custom uppercase">Project Management</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Visuals and Milestones</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className={`px-6 py-3 text-[10px] md:text-xs font-black uppercase rounded-xl transition-all ${isAdding ? 'bg-rose-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'}`}>{isAdding ? <X size={16} /> : <Plus size={16} />} {isAdding ? 'CANCEL' : 'NEW PROJECT'}</button>
      </div>

      {isAdding && (
        <div className="glass-glossy p-6 md:p-10 rounded-[2.5rem] bg-white border-2 border-blue-100">
          <form onSubmit={handleCreateProject} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <input type="text" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="PROJECT NAME" className="w-full px-6 py-4 rounded-2xl border bg-white/50 outline-none text-xs font-bold uppercase transition-all" />
              <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} placeholder="PROJECT DESCRIPTION..." className="w-full px-6 py-4 rounded-2xl border bg-white/50 outline-none text-xs font-bold transition-all" rows={3} />
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl">CREATE PROJECT</button>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {projects.map(project => {
          const linkedTeams = teams.filter(t => t.projectId === project.id);
          const completed = project.milestones.filter(m => m.isCompleted).length;
          const progress = project.milestones.length > 0 ? Math.round((completed / project.milestones.length) * 100) : 0;
          const isInspecting = selectedProjectId === project.id;
          return (
            <div key={project.id} className={`glass-glossy p-6 md:p-8 rounded-[2rem] transition-all border-2 ${isInspecting ? 'border-blue-400 col-span-full' : 'border-white'}`}>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className={`flex-1 ${isInspecting ? 'lg:max-w-md' : ''}`}>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tighter truncate">{project.name}</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Linked Teams: {linkedTeams.length}</p>
                  <p className="text-[11px] md:text-xs text-slate-600 mt-4 line-clamp-3">{project.description}</p>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden my-6"><div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-700" style={{ width: `${progress}%` }}></div></div>
                  <button onClick={() => setSelectedProjectId(isInspecting ? null : project.id)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">{isInspecting ? 'CLOSE' : 'MANAGE MILESTONES'} <ChevronRight size={14} /></button>
                </div>
                {isInspecting && (
                  <div className="flex-1 lg:pl-10 lg:border-l border-slate-100 space-y-6">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2"><ListChecks size={16} className="text-indigo-600" /> Milestones</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                      {project.milestones.map(m => (
                        <div key={m.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group/item ${m.isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                          <div className="flex items-center gap-4">
                            <button onClick={() => handleToggleMilestone(project.id, m.id)} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${m.isCompleted ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'bg-slate-100 text-slate-300'}`}><Check size={14} /></button>
                            <span className={`text-[11px] font-black uppercase ${m.isCompleted ? 'text-emerald-900' : 'text-slate-600'}`}>{m.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                      <input type="text" placeholder="NEW MILESTONE..." value={newMilestone} onChange={e => setNewMilestone(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddMilestone(project.id)} className="flex-1 px-5 py-3 rounded-xl border bg-slate-50/50 text-[10px] font-black uppercase outline-none" />
                      <button onClick={() => handleAddMilestone(project.id)} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">ADD</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SecurityModule: React.FC<{ user?: User }> = ({ user }) => {
  const logs = dataService.getAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [newUrl, setNewUrl] = useState(dataService.apiUrl);

  const handleUpdateLink = () => {
    dataService.updateApiUrl(newUrl);
    alert("HQ LINK PROTOCOL UPDATED");
  };

  const modules = ['ALL', ...new Set(logs.map(l => l.module))];

  const filtered = logs.filter(l => {
    const matchesSearch = l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'ALL' || l.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-10">
      <div className="glass-glossy p-8 md:p-12 rounded-[3rem] bg-white border-2 border-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl"></div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase flex items-center gap-3 mb-6 relative z-10">
          <Link2 className="text-indigo-600" /> Admin Link Configuration
        </h2>
        <div className="space-y-4 relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Data Script Endpoint</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="Google Apps Script URL..."
              className="flex-1 px-6 py-4 rounded-2xl border bg-slate-50 outline-none font-bold text-xs focus:ring-2 ring-indigo-500 transition-all"
            />
            <button onClick={handleUpdateLink} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
              <Save size={18} /> Update Link
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter-custom uppercase flex items-center gap-4">
              Mission <span className="text-indigo-600">Ledger</span>
              <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black tracking-widest uppercase">Live Audit</div>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Immutable Log of Command Actions</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 ring-indigo-500 transition-all"
            >
              {modules.map(m => <option key={String(m)} value={String(m)}>{String(m) === 'ALL' ? 'ALL DEPARTMENTS' : String(m).toUpperCase()}</option>)}
            </select>
            <div className="relative group flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="SEARCH OPERATIVES OR ACTIONS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="glass-glossy rounded-[2.5rem] overflow-hidden bg-white border border-slate-100 shadow-xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                <th className="p-6 text-[10px) font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Executed</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-indigo-50/50 transition-colors group">
                  <td className="p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{new Date(log.timestamp).toLocaleDateString()}</p>
                    <p className="text-[11px] font-black text-slate-800">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {log.userName[0]}
                      </div>
                      <span className="text-xs font-black text-slate-900 uppercase">{log.userName}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-tight">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-bold text-slate-700">{log.action}</span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2 text-[10px] font-black text-emerald-600 uppercase">
                      <Check size={12} /> SECURED
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Activity className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No logs found in current sector</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const ReportExportModule: React.FC<{ user?: User }> = ({ user }) => {
  const options = [
    { id: 'attendance', label: 'Attendance Report', desc: 'Detailed log of student presence.', icon: <Clock size={24} />, getData: () => dataService.getAttendance() },
    { id: 'worklogs', label: 'Worklog Archive', desc: 'Aggregated student activity.', icon: <FileText size={24} />, getData: () => dataService.getWorklogs() },
    { id: 'reviews', label: 'Peer Review Records', desc: 'Audit system feedback.', icon: <Users size={24} />, getData: () => dataService.getReviews() }
  ];
  return (
    <div className="space-y-10 py-6 animate-stagger">
      <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase">Data Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {options.map((option, i) => (
          <div key={option.id} className="glass-glossy p-8 rounded-[3rem] border border-white hover:border-blue-100 transition-all animate-stagger" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{option.icon}</div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2">{option.label}</h3>
            <p className="text-xs text-slate-500 font-medium mb-8">{option.desc}</p>
            <button onClick={() => exportToCSV(option.getData(), `Export_${option.id}`)} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"><Download size={16} /> DOWNLOAD REPORT</button>
          </div>
        ))}
      </div>
    </div>
  );
};
