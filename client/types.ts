
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export enum AttendanceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  OD = 'OD'
}

export interface User {
  id: string;
  name: string;
  rollNumber: string;
  password?: string;
  role: UserRole;
  teamId?: string;
  lastLogin?: string;
  status: AttendanceStatus;
}

export interface Team {
  id: string;
  name: string;
  projectId?: string;
  studentIds: string[];
}

export interface ProjectMilestone {
  id: string;
  label: string;
  isCompleted: boolean;
  priority: 'CRITICAL' | 'NORMAL' | 'LOW';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED';
  milestones: ProjectMilestone[];
}

export interface Worklog {
  id: string;
  studentId: string;
  projectId: string;
  date: string;
  content: string;
  hours: number;
  timestamp: string;
  status: 'SUBMITTED' | 'REVIEWED';
}

export interface PeerReview {
  id: string;
  reviewerId: string;
  studentId: string;
  teamId: string;
  date: string;
  studentRating: number;
  teamRating: number;
  studentFeedback: string;
  teamFeedback: string;
  reviewMethod: 'FACE_TO_FACE' | 'PHONE_CALL' | 'ONLINE_MEETING';
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  loginTime: string;
  logoutTime?: string;
  status: AttendanceStatus;
  sessionDuration?: number;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  senderRole: UserRole;
  recipientRole: UserRole;
  content: string;
  timestamp: string;
  status: 'READ' | 'UNREAD';
  attachmentUrl?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'admin';
  priority: 'high' | 'medium' | 'low';
  message: string;
  actionRequired?: boolean;
  actionTab?: string;
  actionLabel?: string;
  isRead: boolean;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  module: string;
}

export interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  category: 'MANUAL' | 'ASSET' | 'PROTOCOL';
  url: string;
  addedBy: string;
  timestamp: string;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  action: string;
  type: 'login' | 'logout' | 'worklog' | 'review' | 'message' | 'achievement' | 'team' | 'other';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
  progress?: number;
  maxProgress?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  role?: UserRole;
  color?: string;
}
