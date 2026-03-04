
import React, { useState, useMemo } from 'react';
import {
    Archive,
    Search,
    Plus,
    X,
    ExternalLink,
    FileText,
    Shield,
    BookOpen,
    Download,
    Trash2,
    Filter
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { User, UserRole, ArchiveItem } from '../types';

const LibraryModule: React.FC<{ user: User }> = ({ user }) => {
    const [items, setItems] = useState<ArchiveItem[]>(dataService.getArchiveItems());
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | ArchiveItem['category']>('ALL');
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        category: 'MANUAL' as ArchiveItem['category'],
        url: ''
    });

    const isAdmin = user.role === UserRole.ADMIN;

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.title || !newItem.url) return;

        const item = await dataService.addArchiveItem({
            ...newItem,
            addedBy: user.name
        });

        setItems(dataService.getArchiveItems());
        setIsAdding(false);
        setNewItem({ title: '', description: '', category: 'MANUAL', url: '' });
    };

    const handleDeleteItem = async (id: string) => {
        if (!window.confirm('PERMANENTLY DELETE THIS ASSET FROM ARCHIVE?')) return;
        await dataService.removeArchiveItem(id);
        setItems(dataService.getArchiveItems());
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [
        { id: 'MANUAL', label: 'Field Manuals', icon: <BookOpen size={18} />, color: 'indigo' },
        { id: 'ASSET', label: 'Intel Assets', icon: <Shield size={18} />, color: 'blue' },
        { id: 'PROTOCOL', label: 'Standard Protocols', icon: <FileText size={18} />, color: 'emerald' }
    ];

    return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter-custom uppercase flex items-center gap-4">
                        Command <span className="text-indigo-600">Archive</span>
                        <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black tracking-widest uppercase">Classified</div>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Central Intelligence & Resource Repository</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {isAdmin && (
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isAdding ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl'}`}
                        >
                            {isAdding ? <X size={16} /> : <Plus size={16} />}
                            {isAdding ? 'CANCEL' : 'DECLASSIFY ASSET'}
                        </button>
                    )}
                    <div className="relative group flex-1 sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="SEARCH SECURE FILES..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 ring-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {isAdding && (
                <div className="glass-panel p-8 md:p-12 rounded-[3rem] border-2 border-indigo-100 bg-white shadow-2xl animate-scale-in">
                    <form onSubmit={handleAddItem} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Title</label>
                                <input required type="text" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} placeholder="E.G. QUANTUM PROTOCOL" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 ring-indigo-500 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Channel (URL)</label>
                                <input required type="text" value={newItem.url} onChange={e => setNewItem({ ...newItem, url: e.target.value })} placeholder="HTTPS://..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification</label>
                                <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value as any })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 ring-indigo-500 transition-all">
                                    <option value="MANUAL">FIELD MANUAL</option>
                                    <option value="ASSET">INTEL ASSET</option>
                                    <option value="PROTOCOL">STANDARD PROTOCOL</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                <input type="text" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="BRIEF OVERVIEW..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500 transition-all" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-glow-indigo hover:bg-slate-900 transition-all">STORE IN ARCHIVE</button>
                    </form>
                </div>
            )}

            <div className="flex flex-wrap gap-4 border-b border-slate-100 pb-8">
                <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                    ALL ASSETS
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`flex items-center gap-3 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item, i) => (
                    <div key={item.id} className="glass-panel p-8 rounded-[2.5rem] border border-white hover:border-indigo-200 transition-all group relative animate-stagger" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${item.category === 'MANUAL' ? 'bg-indigo-50 text-indigo-600' : item.category === 'ASSET' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {item.category === 'MANUAL' ? <BookOpen size={24} /> : item.category === 'ASSET' ? <Shield size={24} /> : <FileText size={24} />}
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{item.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-8 line-clamp-2">{item.description || 'No detailed intel available for this asset.'}</p>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added by {item.addedBy}</span>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-slate-900 uppercase tracking-widest transition-colors"
                            >
                                ACCESS FILE <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                            <Archive size={40} />
                        </div>
                        <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest">No Intelligence Assets Found</h4>
                        <p className="text-xs text-slate-400 mt-2">Adjust your filters or declassify new assets above.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryModule;
