
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Unlock, Lock, Tent, Coffee, Users, 
  CheckSquare, Square, Trash2, Plus, Info 
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
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
        active ? 'bg-white text-emerald-900 shadow-sm border border-stone-200' : 'text-stone-500 hover:bg-stone-200'
      }`}
    >
      {icon} {label}
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

  // Fallback to Local Storage if Firebase DB is not available
  const isDemoMode = !db;

  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem(`saga_tasks_${appId}`);
      if (saved) {
        setItems(JSON.parse(saved));
      }
      setLoading(false);
      return;
    }

    if (!user) return;
    const q = query(
      collection(db!, 'artifacts', appId, 'public', 'data', 'saga_opentrip_tasks'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OpenTripTask[];
      setItems(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trip data:", error);
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
      const newTask: OpenTripTask = {
        id: Date.now().toString(),
        task: newItem,
        pic: newPic || 'Tim SAGA',
        category: activeTab,
        isDone: false,
        createdAt: new Date().toISOString()
      };
      saveToLocal([newTask, ...items]);
      setNewItem('');
      setNewPic('');
      return;
    }

    try {
      await addDoc(collection(db!, 'artifacts', appId, 'public', 'data', 'saga_opentrip_tasks'), {
        task: newItem,
        pic: newPic || 'Tim SAGA',
        category: activeTab,
        isDone: false,
        notes: '',
        createdAt: serverTimestamp()
      });
      setNewItem('');
      setNewPic('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (isDemoMode) {
      const newItems = items.map(item => 
        item.id === id ? { ...item, isDone: !currentStatus } : item
      );
      saveToLocal(newItems);
      return;
    }

    try {
      const docRef = doc(db!, 'artifacts', appId, 'public', 'data', 'saga_opentrip_tasks', id);
      await updateDoc(docRef, { isDone: !currentStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Hapus item ini?")) return;

    if (isDemoMode) {
      saveToLocal(items.filter(item => item.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db!, 'artifacts', appId, 'public', 'data', 'saga_opentrip_tasks', id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(i => i.category === activeTab);
  const progress = filteredItems.length > 0 
    ? Math.round((filteredItems.filter(i => i.isDone).length / filteredItems.length) * 100) 
    : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="p-4 bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-stone-100 rounded-full">
            <ChevronLeft className="text-emerald-900"/>
          </button>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-[10px] font-bold border border-amber-200 mr-2">
                <Info size={10} /> DEMO MODE
              </div>
            )}
            <span className="text-xs font-medium text-stone-500">Mode Owner:</span>
            <button 
              onClick={() => setIsAdmin(!isAdmin)}
              className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-400'}`}
            >
              {isAdmin ? <Unlock size={18}/> : <Lock size={18}/>}
            </button>
          </div>
        </div>

        <div className="flex p-1 bg-stone-100 rounded-lg">
          <TabButton active={activeTab === 'equip'} onClick={() => setActiveTab('equip')} icon={<Tent size={16}/>} label="Alat" />
          <TabButton active={activeTab === 'logistik'} onClick={() => setActiveTab('logistik')} icon={<Coffee size={16}/>} label="Logistik" />
          <TabButton active={activeTab === 'peserta'} onClick={() => setActiveTab('peserta')} icon={<Users size={16}/>} label="Peserta" />
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-stone-500 mb-1">
            <span>Progress Persiapan</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
        {loading ? (
          <div className="text-center p-10 text-stone-400">Loading data...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center p-10 text-stone-400 border-2 border-dashed border-stone-300 rounded-xl">
            <p>Belum ada daftar tugas.</p>
            {isAdmin && <p className="text-xs mt-2">Gunakan form di bawah untuk menambah.</p>}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className={`p-4 rounded-xl border transition-all ${item.isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200 shadow-sm'}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => handleToggle(item.id, item.isDone)} className={`mt-1 flex-shrink-0 transition-colors ${item.isDone ? 'text-emerald-600' : 'text-stone-300 hover:text-stone-400'}`}>
                  {item.isDone ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${item.isDone ? 'text-stone-400 line-through' : 'text-stone-800'}`}>{item.task}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">PIC: {item.pic}</span>
                    {isAdmin && <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdmin && (
        <div className="p-4 bg-white border-t border-stone-200 shadow-lg">
          <form onSubmit={handleAdd} className="flex flex-col gap-2">
            <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={`Tambah item ${activeTab}...`} className="w-full border border-stone-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            <div className="flex gap-2">
              <input type="text" value={newPic} onChange={(e) => setNewPic(e.target.value)} placeholder="PIC (ex: Budi)" className="w-1/3 border border-stone-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              <button type="submit" className="flex-1 bg-emerald-800 text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-900"><Plus size={16}/> Tambah</button>
            </div>
          </form>
        </div>
      )}
      {!isAdmin && <div className="p-2 text-center bg-stone-100 text-xs text-stone-400">Mode Tim: Hanya bisa mencentang</div>}
    </div>
  );
};

export default OpenTripPage;
