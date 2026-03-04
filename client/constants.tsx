
import React from 'react';
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Users,
  Briefcase,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  FileDown,
  UserPlus,
  Archive
} from 'lucide-react';
import { UserRole } from './types';

export const APP_NAME = "STRATEGIC COMMAND";
export const SUB_NAME = "FORCE INTERFACE";

export const NAVIGATION = [
  { id: 'dashboard', label: 'COMMAND HUD', icon: <LayoutDashboard size={20} />, roles: [UserRole.STUDENT, UserRole.ADMIN] },
  { id: 'attendance', label: 'DEPLOYMENT PULSE', icon: <Clock size={20} />, roles: [UserRole.STUDENT, UserRole.ADMIN] },
  { id: 'worklogs', label: 'MISSION INTEL', icon: <BookOpen size={20} />, roles: [UserRole.STUDENT, UserRole.ADMIN] },
  { id: 'reviews', label: 'SYNERGY AUDIT', icon: <Users size={20} />, roles: [UserRole.STUDENT, UserRole.ADMIN] },
  { id: 'personnel', label: 'OPERATIVES', icon: <UserPlus size={20} />, roles: [UserRole.ADMIN] },
  { id: 'teams', label: 'DIVISIONS', icon: <Users size={20} />, roles: [UserRole.ADMIN] },
  { id: 'projects', label: 'OPERATIONS', icon: <Briefcase size={20} />, roles: [UserRole.ADMIN] },
  { id: 'reports', label: 'INTEL REPORTS', icon: <FileDown size={20} />, roles: [UserRole.ADMIN] },
  { id: 'analytics', label: 'FORCE TELEMETRY', icon: <BarChart3 size={20} />, roles: [UserRole.ADMIN] },
  { id: 'messages', label: 'SECURE COMMS', icon: <MessageSquare size={20} />, roles: [UserRole.STUDENT, UserRole.ADMIN] },
  { id: 'library', label: 'COMMAND ARCHIVE', icon: <Archive size={20} />, roles: [UserRole.STUDENT, UserRole.ADMIN] },
  { id: 'security', label: 'COMMAND LOGS', icon: <ShieldCheck size={20} />, roles: [UserRole.ADMIN] },
];

export const THEME_GRADIENT = "from-slate-900 to-blue-900";
export const THEME_COLOR = "blue-600";
