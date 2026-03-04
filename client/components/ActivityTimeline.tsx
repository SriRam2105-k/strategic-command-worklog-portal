import React, { useState, useEffect } from 'react';
import { User, UserRole, ActivityEvent } from '../types';
import { dataService } from '../services/dataService';
import { Clock, LogIn, LogOut, FileText, Star, MessageSquare, Users, Activity as ActivityIcon } from 'lucide-react';

interface ActivityTimelineProps {
    user: User;
    limit?: number;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ user, limit = 10 }) => {
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        loadActivities();
    }, [user]);

    const loadActivities = () => {
        const logs = dataService.getAuditLogs();

        const events: ActivityEvent[] = logs.map(log => {
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

        // Filter by user if not admin
        const filtered = user.role === UserRole.STUDENT
            ? events.filter(e => e.userId === user.id)
            : events;

        setActivities(filtered);
    };

    const getIcon = (type: ActivityEvent['type']) => {
        switch (type) {
            case 'login': return LogIn;
            case 'logout': return LogOut;
            case 'worklog': return FileText;
            case 'review': return Star;
            case 'message': return MessageSquare;
            case 'team': return Users;
            default: return Clock;
        }
    };

    const getColor = (type: ActivityEvent['type']) => {
        switch (type) {
            case 'login': return 'border-green-500 bg-green-50';
            case 'logout': return 'border-slate-400 bg-slate-50';
            case 'worklog': return 'border-blue-500 bg-blue-50';
            case 'review': return 'border-yellow-500 bg-yellow-50';
            case 'message': return 'border-indigo-500 bg-indigo-50';
            case 'team': return 'border-cyan-500 bg-cyan-50';
            default: return 'border-slate-300 bg-slate-50';
        }
    };

    const getIconColor = (type: ActivityEvent['type']) => {
        switch (type) {
            case 'login': return 'text-green-600';
            case 'logout': return 'text-slate-500';
            case 'worklog': return 'text-blue-600';
            case 'review': return 'text-yellow-600';
            case 'message': return 'text-indigo-600';
            case 'team': return 'text-cyan-600';
            default: return 'text-slate-500';
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
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const displayedActivities = showAll ? activities : activities.slice(0, limit);

    return (
        <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock size={20} className="text-indigo-600" />
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Activity Timeline</h2>
                </div>
                {activities.length > limit && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        {showAll ? 'Show Less' : `View All (${activities.length})`}
                    </button>
                )}
            </div>

            <div className="relative space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {/* Timeline Line */}
                <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent" />

                {displayedActivities.map((activity, index) => {
                    const Icon = getIcon(activity.type);
                    const color = getColor(activity.type);
                    const iconColor = getIconColor(activity.type);

                    return (
                        <div key={activity.id} className="relative flex gap-4 group">
                            {/* Timeline Icon */}
                            <div className={`relative z-10 w-7 h-7 rounded-full border-2 ${color} flex items-center justify-center shrink-0`}>
                                <Icon size={14} className={iconColor} />
                            </div>

                            {/* Content Card */}
                            <div className="flex-1 pb-2">
                                <div className="bg-white/80 hover:bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 mb-0.5">
                                                {user.role === UserRole.ADMIN && activity.userName}
                                                {user.role === UserRole.STUDENT && 'You'}
                                            </p>
                                            <p className="text-xs text-slate-600 leading-relaxed">{activity.action}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${color}`}>
                                            {activity.type}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                        <Clock size={10} className="text-slate-400" />
                                        <p className="text-[10px] text-slate-500 font-semibold">{formatTime(activity.timestamp)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {displayedActivities.length === 0 && (
                    <div className="text-center py-12">
                        <ActivityIcon size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No activity to display</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTimeline;
