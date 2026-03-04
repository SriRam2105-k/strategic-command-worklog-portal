
import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Shield, Search, Paperclip, CheckCheck, MessageSquare, ChevronLeft } from 'lucide-react';
import { User, UserRole, Message } from '../types';
import { dataService } from '../services/dataService';

interface Props {
  user: User;
}

const MessengerModule: React.FC<Props> = ({ user }) => {
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobileThreadListOpen, setIsMobileThreadListOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Use UserRole.COMMANDER as defined in types.ts
  const isCommander = user.role === UserRole.ADMIN;
  // Use UserRole.OPERATIVE as defined in types.ts
  const operatives = dataService.getUsers().filter(u => u.role === UserRole.STUDENT);

  useEffect(() => {
    setMessages(dataService.getMessages());
    const interval = setInterval(() => setMessages(dataService.getMessages()), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThread]);

  useEffect(() => {
    const markRead = (msgs: Message[]) => {
      msgs.forEach(m => {
        if (m.status !== 'READ' && m.recipientId === user.id) {
          dataService.markMessageAsRead(m.id);
        }
      });
    };

    if (isCommander && activeThread) {
      const threadMsgs = messages.filter(m => m.senderId === activeThread);
      markRead(threadMsgs);
    } else if (!isCommander) {
      // For operative, mark all messages received from anyone (likely HQ) as read
      const myMsgs = messages.filter(m => m.recipientId === user.id);
      markRead(myMsgs);
    }
  }, [messages, activeThread, isCommander, user.id]);

  const filteredMessages = messages.filter(m => {
    if (isCommander) {
      if (!activeThread) return false;
      return m.senderId === activeThread || m.recipientId === activeThread;
    } else {
      return m.senderId === user.id || m.recipientId === user.id;
    }
  });

  const handleSend = () => {
    if (!newMessage.trim() || (isCommander && !activeThread)) return;
    const admin = dataService.getUsers().find((u: User) => u.role === UserRole.ADMIN);
    const recipientId = isCommander ? activeThread! : (admin?.id || 'admin-not-found');

    if (!isCommander && !admin) {
      console.error("HQ Link not found. Message aborted.");
      return;
    }

    dataService.sendMessage({
      senderId: user.id,
      recipientId,
      senderRole: user.role,
      // Use UserRole.OPERATIVE and COMMANDER as defined in types.ts
      recipientRole: isCommander ? UserRole.STUDENT : UserRole.ADMIN,
      content: newMessage
    });

    setNewMessage('');
    setMessages(dataService.getMessages());
  };

  const handleSelectThread = (id: string) => {
    setActiveThread(id);
    setIsMobileThreadListOpen(false);
  };

  return (
    <div className="h-full flex gap-4 md:gap-6 overflow-hidden pb-4 min-h-0">
      {isCommander && (
        <div className={`
          ${isMobileThreadListOpen ? 'flex' : 'hidden md:flex'}
          w-full md:w-80 glass-panel rounded-2xl md:rounded-3xl overflow-hidden flex-col border border-slate-200 shadow-sm min-h-0
        `}>
          <div className="p-4 md:p-6 border-b border-slate-100 bg-white/50">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">Direct Messages</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search Students..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 custom-scrollbar">
            {operatives.map(op => (
              <button
                key={op.id}
                onClick={() => handleSelectThread(op.id)}
                className={`w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 transition-all ${activeThread === op.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${activeThread === op.id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                  {op.name[0]}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[11px] font-black uppercase tracking-tight truncate">{op.name}</p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${activeThread === op.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {op.rollNumber}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`
        ${!isMobileThreadListOpen || !isCommander ? 'flex' : 'hidden md:flex'}
        flex-1 flex flex-col glass-panel rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 relative shadow-2xl bg-white/80 min-h-0
      `}>
        {(!isCommander || activeThread) ? (
          <>
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                {isCommander && (
                  <button onClick={() => setIsMobileThreadListOpen(true)} className="md:hidden p-2 -ml-2 text-slate-400">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 border-2 border-white shadow-sm shrink-0">
                  {isCommander ? <UserIcon size={18} /> : <Shield size={18} />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-800 truncate">
                    {isCommander ? operatives.find(s => s.id === activeThread)?.name : 'ADMIN'}
                  </p>
                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SECURE CONNECTION ACTIVE
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar">
              {filteredMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] space-y-1`}>
                    <div className={`p-3.5 md:p-5 rounded-[1.5rem] md:rounded-[2rem] text-xs md:text-sm font-medium shadow-sm border ${msg.senderId === user.id
                      ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500'
                      : 'bg-white text-slate-700 rounded-tl-none border-slate-100'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 md:p-6 bg-slate-50/80 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2 md:gap-3 bg-white p-1.5 md:p-2 rounded-2xl md:rounded-[2rem] border-2 border-slate-200 shadow-inner">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-sm font-bold text-slate-700 px-3"
                />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-50">
            <MessageSquare size={48} className="text-indigo-300" />
            <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight uppercase">No Chat Selected</h3>
            <p className="text-slate-400 font-bold text-[9px] md:text-xs uppercase tracking-widest max-w-xs mx-auto">Select a student from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerModule;
