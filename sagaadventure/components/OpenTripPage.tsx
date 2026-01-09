
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Unlock, Lock, Tent, Coffee, Users, 
  CheckSquare, Square, Trash2, Plus, Map as MapIcon, Compass
} from 'lucide-react';
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp 
} from "firebase/firestore";
import { User } from 'firebase/auth';
import { db, appId } from '../services/firebase';
import { OpenTripTask } from '../types';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center py-4 rounded-3xl transition-all ${
        active ? 'bg-amber-400 text-amber-950 shadow-lg scale-110 z-10' : 'bg-sky-50 text-sky-300 hover:bg-sky-100'
      }`}
    >
      {icon}
    </button>
  );
};

interface OpenTripPageProps {
  user: User | null;
  onBack: () => void;
}

const OpenTripPage: React.FC<OpenTripPageProps> = ({ user, onBack }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'equip' | 'logistik' | 'peserta'>('equip');
  const [items, setItems] = useState<OpenTripTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [newPic, setNewPic] = useState('');

  const isDemoMode = !db;

  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem(`saga_tasks_${appId}`);
      if (saved) setItems(JSON.parse(saved));
      setLoading(false);
      return;
    }
    if (!user) return;
    const q = query(collection(db!, 'artifacts', appId, 'public', 'data', 'saga_opentrip_tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OpenTripTask[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, isDemoMode]);

  const saveToLocal = (newItems: OpenTripTask[]) => {
    setItems(newItems);
    localStorage.setItem(`saga_tasks_${appId}`, JSON.stringify(newItems));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    if (isDemoMode) {
      const newTask = { id: Date.now().toString(), task: newItem, pic: newPic || 'Team', category: activeTab, isDone: false, createdAt: new Date().toISOString() } as OpenTripTask;
      saveToLocal([newTask, ...items]);
      setNewItem(''); setNewPic(''); return;
    }
    try {
      await addDoc(collection(db!, 'artifacts', appId, 'public', 'data', 'saga_opentrip_tasks'), {
        task: newItem, pic: newPic || 'Team', category: activeTab, isDone: false, createdAt: serverTimestamp()
      });
      setNewItem(''); setNewPic('');
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (isDemoMode) {
      saveToLocal(items.map(item => item.id === id ? { ...item, isDone: !currentStatus } : item));
      return;
    }
    try {
      await updateDoc(doc(db!, 'artifacts', appId, 'public', 'data', 'saga_opentrip_tasks', id), { isDone: !currentStatus });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete item?")) {
      if (isDemoMode) { saveToLocal(items.filter(item => item.id !== id)); return; }
      try { await deleteDoc(doc(db!, 'artifacts', appId, 'public', 'data', 'saga_opentrip_tasks', id)); } catch (err) { console.error(err); }
    }
  };

  const filteredItems = items.filter(i => i.category === activeTab);
  const progress = filteredItems.length > 0 ? Math.round((filteredItems.filter(i => i.isDone).length / filteredItems.length) * 100) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-sky-50/20 relative overflow-hidden">
      {/* Subtle Minimalist Watermark - Reduced Size & Normal Weight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.01] pointer-events-none select-none rotate-90">
        <span className="text-[8vw] font-normal tracking-[0.5em] uppercase whitespace-nowrap">SAGA ADVENTURE</span>
      </div>

      <div className="p-8 bg-white rounded-b-[3.5rem] shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-10">
          <button onClick={onBack} className="p-3 bg-sky-50 rounded-full text-sky-600"><ChevronLeft size={20}/></button>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20 italic">Squad Ops</span>
          <button onClick={() => setIsAdmin(!isAdmin)} className={`p-3 rounded-2xl transition-all shadow-md ${isAdmin ? 'bg-amber-400 text-amber-950' : 'bg-sky-50 text-sky-200'}`}>
            {isAdmin ? <Unlock size={18}/> : <Lock size={18}/>}
          </button>
        </div>

        <div className="flex gap-4 mb-10">
          <TabButton active={activeTab === 'equip'} onClick={() => setActiveTab('equip')} icon={<Tent size={20}/>} />
          <TabButton active={activeTab === 'logistik'} onClick={() => setActiveTab('logistik')} icon={<Coffee size={20}/>} />
          <TabButton active={activeTab === 'peserta'} onClick={() => setActiveTab('peserta')} icon={<Users size={20}/>} />
        </div>

        <div className="h-2 bg-sky-100 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 bg-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between mt-3 px-1">
          <span className="text-[9px] font-black text-sky-900 uppercase italic">Status</span>
          <span className="text-[9px] font-black text-amber-600">{progress}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-4 relative z-10">
        {filteredItems.length === 0 ? (
          <div className="text-center p-16 opacity-10 flex flex-col items-center">
             <Compass size={48} className="mb-4" />
             <p className="text-sm font-black uppercase tracking-widest">No Data</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} onClick={() => handleToggle(item.id, item.isDone)} className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all active:scale-95 ${item.isDone ? 'bg-amber-50 border-amber-100 opacity-40' : 'bg-white border-sky-50 shadow-sm'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${item.isDone ? 'bg-amber-400 text-amber-950' : 'bg-sky-50 text-sky-600'}`}>
                  {item.isDone ? <CheckSquare size={22} /> : <Square size={22} />}
                </div>
                <div className="flex-1">
                  <p className={`font-normal text-[11px] uppercase tracking-tight ${item.isDone ? 'text-amber-900/40 line-through' : 'text-sky-900'}`}>{item.task}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[8px] font-black bg-sky-50 text-sky-400 px-3 py-1 rounded-full border border-sky-100 uppercase italic">{item.pic}</span>
                    {isAdmin && <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-stone-200 hover:text-red-400 p-1"><Trash2 size={16}/></button>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdmin && (
        <div className="p-8 bg-white border-t border-sky-50 rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom-full duration-500">
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="ADD TASK" className="w-full bg-sky-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-amber-400 outline-none" />
            <div className="flex gap-3">
              <input type="text" value={newPic} onChange={e => setNewPic(e.target.value)} placeholder="PIC" className="flex-1 bg-sky-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-amber-400 outline-none" />
              <button type="submit" className="bg-sky-900 text-white rounded-2xl px-8 py-4 font-black shadow-lg uppercase tracking-widest text-[9px]"><Plus size={18}/></button>
            </div>
          </form>
        </div>
      )}
      {!isAdmin && <div className="p-6 text-center text-[8px] font-black text-sky-200 uppercase tracking-[0.4em] italic">Operational Mode Only</div>}
    </div>
  );
};

export default OpenTripPage;
