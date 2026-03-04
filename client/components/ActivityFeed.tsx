import React, { useState, useEffect } from 'react';
import { User, UserRole, ActivityEvent } from '../types';
import { dataService } from '../services/dataService';
import { LogIn, LogOut, FileText, Star, MessageSquare, Users, Activity, Clock } from 'lucide-react';

interface ActivityFeedProps {
    user: User;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ user }) => {
    const [activities, setActivities] = useState<ActivityEvent[]>([]);

    useEffect(() => {
        loadActivities();
    }, [user]);

    const loadActivities = () => {
        const logs = dataService.getAuditLogs();

        // Convert audit logs to activity events
        const events: ActivityEvent[] = logs.slice(0, 20).map(log => {
            let type: ActivityEvent['type'] = 'other';
            if (log.action.includes('Login') || log.action.includes('Established')) type = 'login';
            else if (log.action.includes('Logout') || log.action.includes('Terminated')) type = 'logout';
            else if (log.module === 'Worklog') type = 'worklog';
            else if (log.module === 'Review') type = 'review';
            else if (log.module === 'Message') type = 'message';
            else if (log.module === 'Team') type = 'team';

            return {
                id: log.id,
                userId: log.userId,
                userName: log.userName,
                action: log.action,
                type,
                timestamp: log.timestamp,
            };
        });

        // Filter based on role
        if (user.role === UserRole.STUDENT) {
            setActivities(events.filter(e => e.userId === user.id));
        } else {
            setActivities(events);
        }
    };

    const getIcon = (type: ActivityEvent['type']) => {
        switch (type) {
            case 'login': return LogIn;
            case 'logout': return LogOut;
            case 'worklog': return FileText;
            case 'review': return Star;
            case 'message': return MessageSquare;
            case 'team': return Users;
            case 'achievement': return Activity;
            default: return Clock;
        }
    };

    const getColor = (type: ActivityEvent['type']) => {
        switch (type) {
            case 'login': return 'from-green-500 to-emerald-600';
            case 'logout': return 'from-slate-500 to-slate-600';
            case 'worklog': return 'from-blue-500 to-blue-600';
            case 'review': return 'from-yellow-500 to-orange-600';
            case 'message': return 'from-indigo-500 to-indigo-600';
            case 'team': return 'from-cyan-500 to-cyan-600';
            case 'achievement': return 'from-pink-500 to-rose-600';
            default: return 'from-slate-400 to-slate-500';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const groupedActivities: Record<string, ActivityEvent[]> = activities.reduce((groups, activity) => {
        const date = new Date(activity.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label = 'Earlier';
        if (date.toDateString() === today.toDateString()) label = 'Today';
        else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';
        else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) label = 'This Week';

        if (!groups[label]) groups[label] = [];
        groups[label].push(activity);
        return groups;
    }, {} as Record<string, ActivityEvent[]>);

    return (
        <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Activity Feed</h2>
                <Activity size={20} className="text-indigo-600" />
            </div>

            <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {Object.entries(groupedActivities).map(([label, events]) => (
                    <div key={label} className="space-y-3">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 bg-white/80 backdrop-blur-sm py-1 z-10">
                            {label}
                        </p>
                        {events.map((activity) => {
                            const Icon = getIcon(activity.type);
                            const color = getColor(activity.type);

                            return (
                                <div key={activity.id} className="flex items-start gap-3 group">
                                    <div className={`p-2 bg-gradient-to-br ${color} rounded-xl shrink-0 group-hover:scale-110 transition-transform`}>
                                        <Icon size={14} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 leading-tight">
                                            {activity.userName}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">{activity.action}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{formatTime(activity.timestamp)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {activities.length === 0 && (
                    <div className="text-center py-8">
                        <Activity size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No recent activity</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
