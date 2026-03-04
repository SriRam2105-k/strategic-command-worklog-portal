import {
  User, UserRole, AttendanceStatus,
  Worklog, AttendanceRecord, Team,
  Project, Message, Notification, AuditLog, PeerReview, ProjectMilestone, ArchiveItem
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type NotificationCallback = (notification: Notification) => void;
const notificationSubscribers: NotificationCallback[] = [];

// Helper for API calls
const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },
  put: async (endpoint: string, data: any) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },
  delete: async (endpoint: string) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  }
};

// State holder (optional, can be removed if we fetch fresh every time, but keeping for compatibility)
let currentData: any = {
  users: [],
  teams: [],
  projects: [],
  worklogs: [],
  attendance: [],
  messages: [],
  notifications: [],
  auditLogs: [],
  reviews: [],
  archive: []
};
let isSynced = false;

export const dataService = {
  get isSynced() { return isSynced; },
  get apiUrl() { return API_URL; },

  async login(rollNumber: string, password: string): Promise<User> {
    const user = await api.post('/login', { rollNumber, password });
    return user;
  },

  async syncWithBackend(): Promise<boolean> {
    try {
      const data = await api.get('/sync');
      currentData = { ...data, auditLogs: data.auditlogs || [] }; // Handle casing difference if any
      isSynced = true;
      return true;
    } catch (e) {
      console.error("Sync Failure:", e);
      isSynced = false;
      return false;
    }
  },

  getUsers: () => currentData.users,
  getTeams: () => currentData.teams,
  getProjects: () => currentData.projects,
  getWorklogs: () => currentData.worklogs,
  getAttendance: () => currentData.attendance,
  getMessages: () => currentData.messages,
  getNotifications: () => currentData.notifications,
  getAuditLogs: () => currentData.auditLogs,
  getReviews: () => currentData.reviews,

  subscribeToNotifications: (cb: NotificationCallback) => {
    notificationSubscribers.push(cb);
    return () => {
      const index = notificationSubscribers.indexOf(cb);
      if (index > -1) notificationSubscribers.splice(index, 1);
    };
  },

  addNotification: async (params: { type: Notification['type'], message: string, priority?: Notification['priority'], actionTab?: string, actionLabel?: string, userId?: string }) => {
    const notif = await api.post('/notifications', {
      userId: params.userId,
      type: params.type,
      priority: params.priority || 'low',
      message: params.message,
      actionTab: params.actionTab,
      actionLabel: params.actionLabel,
      isRead: false,
      timestamp: new Date().toISOString(),
      actionRequired: !!params.actionTab
    });
    currentData.notifications.unshift(notif);
    notificationSubscribers.forEach(cb => cb(notif));
    return notif;
  },

  markAsRead: async (id: string) => {
    const updated = await api.put(`/notifications/${id}/read`, {});
    const n = currentData.notifications.find((notif: Notification) => notif.id === id);
    if (n) n.isRead = true;
  },

  markAllAsRead: async () => {
    await api.put('/notifications/read-all', {});
    currentData.notifications.forEach((n: Notification) => n.isRead = true);
  },

  clearNotifications: async () => {
    await api.post('/notifications/clear', {});
    currentData.notifications = [];
  },

  logAction: async (userId: string, userName: string, action: string, module: string) => {
    let finalId = userId;
    if (userId === 'admin' || userId === 'HQ') {
      const admin = currentData.users.find((u: User) => u.role === UserRole.ADMIN);
      if (admin) finalId = admin.id;
    }
    const log = await api.post('/audit-logs', { userId: finalId, userName, action, module, timestamp: new Date().toISOString() });
    currentData.auditLogs.unshift(log);
  },

  updateAttendance: async (studentId: string, status: AttendanceStatus) => {
    await api.put(`/users/${studentId}/status`, { status });
    const user = currentData.users.find((u: User) => u.id === studentId);
    if (user) user.status = status;

    const today = new Date().toISOString().split('T')[0];
    const existing = currentData.attendance.find((a: AttendanceRecord) => a.studentId === studentId && a.date === today && !a.logoutTime);

    if (status === AttendanceStatus.ONLINE) {
      if (!existing) {
        const record = await api.post('/attendance', {
          studentId,
          date: today,
          loginTime: new Date().toISOString(),
          status: AttendanceStatus.PRESENT
        });
        currentData.attendance.push(record);
      }
    } else if (status === AttendanceStatus.OFFLINE) {
      if (existing) {
        const logoutTime = new Date().toISOString();
        const loginTime = new Date(existing.loginTime).getTime();
        const sessionDuration = (new Date(logoutTime).getTime() - loginTime) / (1000 * 60 * 60); // Hours

        const updated = await api.put(`/attendance/${existing.id}`, {
          logoutTime,
          sessionDuration: parseFloat(sessionDuration.toFixed(2))
        });

        const idx = currentData.attendance.findIndex((a: AttendanceRecord) => a.id === existing.id);
        if (idx !== -1) currentData.attendance[idx] = updated;
      }
    }
  },

  createUser: async (user: Omit<User, 'id' | 'status'>) => {
    const newUser = await api.post('/users', { ...user, status: AttendanceStatus.OFFLINE });
    currentData.users.push(newUser);
    return newUser;
  },

  submitWorklog: async (log: Omit<Worklog, 'id' | 'timestamp' | 'status'>) => {
    const newLog = await api.post('/worklogs', { ...log, timestamp: new Date().toISOString(), status: 'SUBMITTED' });
    currentData.worklogs.push(newLog);
    return newLog;
  },

  sendMessage: async (msg: Omit<Message, 'id' | 'timestamp' | 'status'>) => {
    const newMsg = await api.post('/messages', { ...msg, timestamp: new Date().toISOString(), status: 'UNREAD' });
    currentData.messages.push(newMsg);
    return newMsg;
  },

  submitReviews: async (reviews: Omit<PeerReview, 'id'>[]) => {
    // We expect the backend to return { count: number, message: string }
    const response = await api.post('/reviews', reviews);

    // Optimistically add to local state
    // We need 'id' for local state, but backend only returns count. 
    // Ideally, we should fetch fresh reviews or better yet, sync.
    // For now, let's just push them with temp IDs or fetch specific ones?
    // Actually, syncWithBackend is safer to ensure consistency.
    // But to be responsive, we can push.

    const newReviews = reviews.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
    currentData.reviews.push(...newReviews);
    return response;
  },

  getDailyReviewAssignment: async (reviewerId: string) => {
    return await api.get(`/reviews/assignment/${reviewerId}`);
  },

  createProject: async (project: Omit<Project, 'id'>) => {
    const newProject = await api.post('/projects', project);
    currentData.projects.push(newProject);
    return newProject;
  },

  createTeam: async (team: Omit<Team, 'id'>) => {
    const newTeam = await api.post('/teams', team);
    currentData.teams.push(newTeam);
    return newTeam;
  },

  assignMembersToTeam: async (teamId: string, studentIds: string[]) => {
    const updatedTeam = await api.put(`/teams/${teamId}/members`, { studentIds });
    // Refresh local team data
    const idx = currentData.teams.findIndex((t: Team) => t.id === teamId);
    if (idx !== -1) currentData.teams[idx] = updatedTeam;
    // Also need to refresh users?
    // Ideally call syncWithBackend (sync) again to refresh everything.
    await dataService.syncWithBackend();
  },

  updateProjectMilestones: async (projectId: string, milestones: ProjectMilestone[]) => {
    const updatedProject = await api.put(`/projects/${projectId}/milestones`, { milestones });
    const idx = currentData.projects.findIndex((p: Project) => p.id === projectId);
    if (idx !== -1) currentData.projects[idx] = updatedProject;
  },

  markMessageAsRead: async (messageId: string) => {
    const updatedMsg = await api.put(`/messages/${messageId}/read`, {});
    const msg = currentData.messages.find((m: Message) => m.id === messageId);
    if (msg) msg.status = 'READ';
  },

  updateWorklogStatus: async (logId: string, status: Worklog['status']) => {
    const updatedLog = await api.put(`/worklogs/${logId}/status`, { status });
    const log = currentData.worklogs.find((l: Worklog) => l.id === logId);
    if (log) log.status = status;
  },

  getArchiveItems: () => currentData.archive,
  addArchiveItem: async (item: Omit<ArchiveItem, 'id' | 'timestamp'>) => {
    const newItem = await api.post('/archive', { ...item, timestamp: new Date().toISOString() });
    currentData.archive.unshift(newItem);
    return newItem;
  },
  removeArchiveItem: async (id: string) => {
    await api.delete(`/archive/${id}`);
    currentData.archive = currentData.archive.filter((i: ArchiveItem) => i.id !== id);
  },

  // Reward System Logic
  calculateUserRank: (user: User) => {
    const userLogs = currentData.worklogs.filter((l: Worklog) => l.studentId === user.id);
    const totalHours = userLogs.reduce((acc: number, l: any) => acc + l.hours, 0);
    const xp = Math.floor(totalHours * 10);

    if (xp > 500) return { title: 'Master Tactician', level: 5, xp };
    if (xp > 300) return { title: 'Senior Operative', level: 4, xp };
    if (xp > 150) return { title: 'Field Agent', level: 3, xp };
    if (xp > 50) return { title: 'Junior Operative', level: 2, xp };
    return { title: 'Recruit', level: 1, xp };
  },

  getUserTotalActivity: (userId: string) => {
    const user = currentData.users.find((u: User) => u.id === userId);
    if (!user) return 0;

    const userLogs = currentData.worklogs.filter((l: Worklog) => l.studentId === userId);
    const workHours = userLogs.reduce((acc: number, l: any) => acc + l.hours, 0);

    const attendance = currentData.attendance.filter((a: AttendanceRecord) => a.studentId === userId);
    let sessionHours = attendance.reduce((acc: number, a: AttendanceRecord) => acc + (a.sessionDuration || 0), 0);

    // If currently online, add the current session duration
    if (user.status === AttendanceStatus.ONLINE) {
      const today = new Date().toISOString().split('T')[0];
      const activeSession = attendance.find((a: AttendanceRecord) => a.date === today && !a.logoutTime);
      if (activeSession) {
        const currentDuration = (Date.now() - new Date(activeSession.loginTime).getTime()) / (1000 * 60 * 60);
        sessionHours += currentDuration;
      }
    }

    return parseFloat((workHours + sessionHours).toFixed(1));
  }
};
