import React, { useState, useEffect } from 'react';
import { User, UserRole, Team } from '../types';
import { dataService } from '../services/dataService';
import { Users, MessageSquare, User as UserIcon, Circle, Search } from 'lucide-react';

interface TeamCollaborationPanelProps {
    user: User;
    onNavigate: (tab: string) => void;
}

const TeamCollaborationPanel: React.FC<TeamCollaborationPanelProps> = ({ user, onNavigate }) => {
    const [team, setTeam] = useState<Team | null>(null);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        loadTeamData();
    }, [user]);

    const loadTeamData = () => {
        if (user.teamId) {
            const userTeam = dataService.getTeams().find(t => t.id === user.teamId);
            if (userTeam) {
                setTeam(userTeam);
                const members = dataService.getUsers().filter(u => userTeam.studentIds.includes(u.id));
                setTeamMembers(members);
            }
        }
    };

    if (!team) {
        return (
            <div className="glass-panel rounded-3xl p-6 text-center">
                <Users size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Not assigned to a team</p>
            </div>
        );
    }

    const project = team.projectId ? dataService.getProjects().find(p => p.id === team.projectId) : null;
    const onlineMembers = teamMembers.filter(m => m.status === 'ONLINE' || m.status === 'PRESENT');

    return (
        <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users size={20} className="text-indigo-600" />
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Team Overview</h2>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </button>
            </div>

            {/* Team Header */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 rounded-2xl p-4 space-y-2">
                <h3 className="text-lg font-black text-slate-800">{team.name}</h3>
                {project && (
                    <p className="text-sm text-slate-600">
                        <span className="font-bold">Project:</span> {project.name}
                    </p>
                )}
                <div className="flex items-center gap-2">
                    <Circle size={8} className="text-green-500 fill-green-500" />
                    <span className="text-xs font-bold text-slate-700">
                        {onlineMembers.length} / {teamMembers.length} members online
                    </span>
                </div>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Members</p>
                <div className={`space-y-2 ${!isExpanded ? 'max-h-32' : 'max-h-64'} overflow-y-auto custom-scrollbar`}>
                    {teamMembers.map((member) => {
                        const isOnline = member.status === 'ONLINE' || member.status === 'PRESENT';
                        return (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all group"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                                        <UserIcon size={18} className="text-white" />
                                    </div>
                                    <div
                                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-400'
                                            }`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                                    <p className="text-xs text-slate-600">{member.rollNumber}</p>
                                </div>
                                {member.id !== user.id && (
                                    <button
                                        onClick={() => onNavigate('messages')}
                                        className="opacity-0 group-hover:opacity-100 p-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-all"
                                    >
                                        <MessageSquare size={14} className="text-white" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Project Progress */}
            {project && isExpanded && (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project Progress</p>
                    <div className="space-y-2">
                        {project.milestones.slice(0, 3).map((milestone) => (
                            <div key={milestone.id} className="flex items-center gap-2">
                                <div
                                    className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${milestone.isCompleted
                                            ? 'bg-green-500 border-green-500'
                                            : 'bg-white border-slate-300'
                                        }`}
                                >
                                    {milestone.isCompleted && <div className="w-2 h-2 bg-white rounded-sm" />}
                                </div>
                                <p className={`text-xs ${milestone.isCompleted ? 'text-slate-500 line-through' : 'text-slate-700 font-semibold'}`}>
                                    {milestone.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-200 flex gap-2">
                <button
                    onClick={() => onNavigate('messages')}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
                >
                    <MessageSquare size={14} /> Message Team
                </button>
                <button
                    onClick={() => onNavigate('teams')}
                    className="flex-1 px-4 py-2 bg-white/80 hover:bg-white border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
                >
                    <Search size={14} /> View Details
                </button>
            </div>
        </div>
    );
};

export default TeamCollaborationPanel;
