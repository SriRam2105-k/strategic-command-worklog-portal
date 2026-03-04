import React, { useState, useEffect } from 'react';
import { Search, Command, X, FileText, Users, User as UserIcon, MessageSquare, FolderOpen } from 'lucide-react';

interface SearchResult {
    id: string;
    type: 'user' | 'team' | 'project' | 'worklog' | 'message';
    title: string;
    subtitle?: string;
    icon: any;
}

interface SmartSearchProps {
    onNavigate: (tab: string, id?: string) => void;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        // Mock search - in real app, this would search through actual data
        const mockResults: SearchResult[] = [
            { id: '1', type: 'user', title: 'John Doe', subtitle: 'OP-101', icon: UserIcon },
            { id: '2', type: 'team', title: 'Alpha Team', subtitle: '5 members', icon: Users },
            { id: '3', type: 'project', title: 'Project Phoenix', subtitle: 'Active', icon: FolderOpen },
            { id: '4', type: 'worklog', title: 'Daily Progress Update', subtitle: '2 hours ago', icon: FileText },
        ];

        const filtered = mockResults.filter(r =>
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.subtitle?.toLowerCase().includes(query.toLowerCase())
        );

        setResults(filtered);
    }, [query]);

    const handleResultClick = (result: SearchResult) => {
        // Navigate based on result type
        switch (result.type) {
            case 'user':
                onNavigate('analytics', result.id);
                break;
            case 'team':
                onNavigate('teams', result.id);
                break;
            case 'project':
                onNavigate('projects', result.id);
                break;
            case 'worklog':
                onNavigate('worklogs', result.id);
                break;
            case 'message':
                onNavigate('messages', result.id);
                break;
        }
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white/90 border border-indigo-100 rounded-xl transition-all group"
            >
                <Search size={16} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-xs text-slate-500 group-hover:text-slate-700">Search...</span>
                <div className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md">
                    <Command size={10} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-bold">K</span>
                </div>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
                    <Search size={20} className="text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search users, teams, projects, worklogs..."
                        className="flex-1 text-lg font-semibold outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setQuery('');
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {results.length > 0 ? (
                        <div className="p-2">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleResultClick(result)}
                                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all group text-left"
                                >
                                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                        <result.icon size={18} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">{result.title}</p>
                                        {result.subtitle && (
                                            <p className="text-xs text-slate-500">{result.subtitle}</p>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 bg-slate-100 rounded-md">
                                        {result.type}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="text-center py-12">
                            <Search size={32} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No results found</p>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Command size={32} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Type to search...</p>
                            <p className="text-xs text-slate-400 mt-1">Search across users, teams, projects, and more</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartSearch;
