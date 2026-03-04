import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Plus, FileText, Clock, MessageSquare, BarChart3, UserPlus, Users, FileDown, Shield, X } from 'lucide-react';

interface QuickActionsWidgetProps {
    user: User;
    onNavigate: (tab: string) => void;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ user, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);

    const studentActions = [
        { id: 'worklog', label: 'Submit Worklog', icon: FileText, color: 'from-blue-500 to-blue-600', tab: 'worklogs' },
        { id: 'attendance', label: 'Attendance', icon: Clock, color: 'from-green-500 to-green-600', tab: 'attendance' },
        { id: 'message', label: 'Send Message', icon: MessageSquare, color: 'from-indigo-500 to-indigo-600', tab: 'messages' },
        { id: 'analytics', label: 'My Analytics', icon: BarChart3, color: 'from-cyan-500 to-cyan-600', tab: 'analytics' },
    ];

    const adminActions = [
        { id: 'user', label: 'Add User', icon: UserPlus, color: 'from-blue-500 to-blue-600', tab: 'personnel' },
        { id: 'team', label: 'Manage Teams', icon: Users, color: 'from-green-500 to-green-600', tab: 'teams' },
        { id: 'report', label: 'Export Report', icon: FileDown, color: 'from-indigo-500 to-indigo-600', tab: 'reports' },
        { id: 'security', label: 'Security Logs', icon: Shield, color: 'from-red-500 to-red-600', tab: 'security' },
    ];

    const actions = user.role === UserRole.ADMIN ? adminActions : studentActions;

    const handleActionClick = (tab: string) => {
        onNavigate(tab);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
            {/* Action Buttons */}
            {isOpen && (
                <div className="flex flex-col gap-3 animate-scale-in">
                    {actions.map((action, index) => (
                        <button
                            key={action.id}
                            onClick={() => handleActionClick(action.tab)}
                            className="group flex items-center gap-3 px-6 py-4 bg-white/90 hover:bg-white backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`p-2 bg-gradient-to-br ${action.color} rounded-xl`}>
                                <action.icon size={18} className="text-white" />
                            </div>
                            <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-5 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-full shadow-glow-indigo transition-all hover:scale-110 ${isOpen ? 'rotate-45' : ''}`}
            >
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <Plus size={24} className="text-white" />
                )}
            </button>
        </div>
    );
};

export default QuickActionsWidget;
