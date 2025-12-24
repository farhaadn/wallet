
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Menu, Bell, Settings, Plus, LayoutGrid, List, TrendingUp, 
  ArrowLeftRight, X, ChevronRight, PieChart, Sparkles, Trash2, Edit2, Check, ArrowLeft, Calendar, Clock
} from 'lucide-react';
import AccountCard from './components/AccountCard';
import TransactionItem from './components/TransactionItem';
import { 
  INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_CATEGORIES
} from './constants';
import { 
  Account, Transaction, TransactionType, AccountType, Category, Currency 
} from './types';
import { getFinancialAdvice } from './services/geminiService';

const App: React.FC = () => {
  // Navigation View
  const [activeView, setActiveView] = useState<'dashboard' | 'records' | 'categories'>('dashboard');
  
  // App Data State with LocalStorage Persistence
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('zw_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('zw_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('zw_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // Persist to LocalStorage
  useEffect(() => localStorage.setItem('zw_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('zw_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('zw_categories', JSON.stringify(categories)), [categories]);

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(accounts.map(a => a.id));
  
  // UI States
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  
  // Modals for Category management (instead of prompt)
  const [showCatModal, setShowCatModal] = useState<{ type: 'cat' | 'sub', catId?: string } | null>(null);
  const [catInputValue, setCatInputValue] = useState('');

  // Transaction Form State
  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txAccount, setTxAccount] = useState<string>(accounts[0]?.id || '');
  const [txToAccount, setTxToAccount] = useState<string>(accounts[1]?.id || '');
  const [txCategory, setTxCategory] = useState<string>(categories[0]?.name || '');
  const [txSubCategory, setTxSubCategory] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().slice(0, 16));

  // Account Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>(AccountType.BANK);
  const [newAccCurrency, setNewAccCurrency] = useState<Currency>('IRR');
  const [newAccColor, setNewAccColor] = useState('#3b82f6');

  // Suggestions for notes
  const noteSuggestions = useMemo(() => {
    const notes = transactions.map(t => t.note).filter((n): n is string => !!n);
    return Array.from(new Set(notes));
  }, [transactions]);

  // Derived: Filtered Records
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => selectedAccountIds.includes(t.accountId) || (t.toAccountId && selectedAccountIds.includes(t.toAccountId)))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountIds]);

  // --- Handlers ---

  const handleSaveTransaction = () => {
    if (txAmount <= 0) return;
    const data: Transaction = {
      id: editingTransaction?.id || Math.random().toString(36).substr(2, 9),
      accountId: txAccount,
      toAccountId: txType === TransactionType.TRANSFER ? txToAccount : undefined,
      type: txType,
      category: txType === TransactionType.TRANSFER ? 'Transfer' : txCategory,
      subCategory: txSubCategory,
      amount: txAmount,
      currency: accounts.find(a => a.id === txAccount)?.currency || 'IRR',
      date: new Date(txDate).toISOString(),
      note: txNote
    };

    if (editingTransaction) {
      setAccounts(prev => prev.map(acc => {
        let b = acc.balance;
        if (acc.id === editingTransaction.accountId) b = editingTransaction.type === TransactionType.INCOME ? b - editingTransaction.amount : b + editingTransaction.amount;
        if (editingTransaction.type === TransactionType.TRANSFER && acc.id === editingTransaction.toAccountId) b = b - editingTransaction.amount;
        return { ...acc, balance: b };
      }));
      setTransactions(transactions.map(t => t.id === editingTransaction.id ? data : t));
    } else {
      setTransactions([data, ...transactions]);
    }

    setAccounts(prev => prev.map(acc => {
      let b = acc.balance;
      if (acc.id === txAccount) b = txType === TransactionType.INCOME ? b + txAmount : b - txAmount;
      if (txType === TransactionType.TRANSFER && acc.id === txToAccount) b = b + txAmount;
      return { ...acc, balance: b };
    }));

    setIsAddingTransaction(false);
    setEditingTransaction(null);
    setTxAmount(0);
    setTxNote('');
  };

  const handleDeleteTransaction = (id: string) => {
    if (!confirm("Delete this record?")) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    setTransactions(transactions.filter(t => t.id !== id));
    setAccounts(prev => prev.map(acc => {
      let b = acc.balance;
      if (acc.id === tx.accountId) b = tx.type === TransactionType.INCOME ? b - tx.amount : b + tx.amount;
      if (tx.type === TransactionType.TRANSFER && acc.id === tx.toAccountId) b = b - tx.amount;
      return { ...acc, balance: b };
    }));
  };

  const handleAddAccount = () => {
    if (!newAccName) return;
    const n: Account = { id: Date.now().toString(), name: newAccName, type: newAccType, balance: 0, currency: newAccCurrency, color: newAccColor };
    setAccounts([...accounts, n]);
    setIsAddingAccount(false);
    setNewAccName('');
  };

  const submitCatModal = () => {
    if (!catInputValue) return;
    if (showCatModal?.type === 'cat') {
      if (categories.some(c => c.name.toLowerCase() === catInputValue.toLowerCase())) { alert("Exists!"); return; }
      setCategories([...categories, { id: Date.now().toString(), name: catInputValue, subCategories: [] }]);
    } else if (showCatModal?.type === 'sub') {
      setCategories(categories.map(c => c.id === showCatModal.catId ? { ...c, subCategories: [...c.subCategories, catInputValue] } : c));
    }
    setCatInputValue('');
    setShowCatModal(null);
  };

  const deleteCategory = (cat: Category) => {
    if (transactions.some(t => t.category === cat.name)) { alert("Used in records. Delete records first."); return; }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    setCategories(categories.filter(c => c.id !== cat.id));
  };

  const deleteSubCategory = (cat: Category, sub: string) => {
    if (transactions.some(t => t.category === cat.name && t.subCategory === sub)) { alert("Used in records."); return; }
    if (!confirm(`Delete "${sub}"?`)) return;
    setCategories(categories.map(c => c.id === cat.id ? { ...c, subCategories: c.subCategories.filter(s => s !== sub) } : c));
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-zinc-950 flex flex-col relative overflow-hidden select-none">
      <header className="p-4 flex items-center justify-between sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md safe-top border-b border-zinc-900/50">
        <div className="flex items-center gap-3">
          <Menu className="w-6 h-6 text-zinc-400" />
          <h1 className="text-xl font-black tracking-tight text-white uppercase">ZenWallet</h1>
        </div>
        <Bell className="w-6 h-6 text-zinc-400" />
      </header>

      <main className="flex-1 overflow-hidden">
        {activeView === 'dashboard' && (
          <div className="p-4 space-y-6 pb-32 overflow-y-auto h-full no-scrollbar animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Accounts</h2>
              <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500"><Settings className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {accounts.map(acc => (
                <div key={acc.id} className="relative group">
                  <AccountCard account={acc} isSelected={selectedAccountIds.includes(acc.id)} onClick={() => setSelectedAccountIds(prev => prev.includes(acc.id) ? prev.filter(x => x !== acc.id) : [...prev, acc.id])} />
                  <button onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); }} className="absolute -top-1 -right-1 p-1 bg-zinc-800 rounded-full border border-zinc-700 z-10"><Edit2 className="w-3 h-3 text-zinc-400" /></button>
                </div>
              ))}
              <button onClick={() => setIsAddingAccount(true)} className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-zinc-800 h-24 text-zinc-500 gap-1 bg-zinc-900/20"><Plus className="w-5 h-5" /><span className="text-[10px] font-bold uppercase">Add</span></button>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/30 p-5 rounded-3xl border border-blue-500/20 shadow-xl">
              <div className="flex items-center justify-between mb-3 text-blue-400">
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">AI Insights</span></div>
                {!isLoadingAi && <button onClick={async () => { setIsLoadingAi(true); setAiInsight(await getFinancialAdvice(transactions, accounts)); setIsLoadingAi(false); }} className="text-[10px] px-3 py-1 bg-blue-600 rounded-full text-white font-black">ANALYZE</button>}
              </div>
              {isLoadingAi ? <div className="h-10 flex justify-center items-center"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : <p className="text-sm text-zinc-300 italic leading-relaxed">{aiInsight || "Tap analyze for AI feedback."}</p>}
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Activity</h2>
                 <button onClick={() => setActiveView('records')} className="text-blue-500 text-xs font-bold uppercase">See all</button>
               </div>
               <div className="bg-zinc-900/40 rounded-3xl overflow-hidden border border-zinc-900/50">
                 {filteredTransactions.slice(0, 5).map(tx => (
                   <div key={tx.id} className="relative group">
                     <TransactionItem transaction={tx} accountName={accounts.find(a => a.id === tx.accountId)?.name || 'Unknown'} />
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingTransaction(tx); setTxType(tx.type); setTxAmount(tx.amount); setTxAccount(tx.accountId); setTxCategory(tx.category); setTxSubCategory(tx.subCategory || ''); setTxNote(tx.note || ''); setTxDate(new Date(tx.date).toISOString().slice(0,16)); setIsAddingTransaction(true); }} className="p-2 bg-zinc-800 rounded-full text-blue-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTransaction(tx.id)} className="p-2 bg-zinc-800 rounded-full text-rose-500"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   </div>
                 ))}
                 {filteredTransactions.length === 0 && <div className="p-10 text-center text-zinc-600 text-sm italic">No records for selected accounts.</div>}
               </div>
            </div>
          </div>
        )}

        {activeView === 'records' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-400">
            <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-lg sticky top-0 z-20">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setActiveView('dashboard')} className="p-1 text-zinc-400"><ArrowLeft className="w-6 h-6" /></button>
                <h2 className="text-xl font-bold">Records</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {accounts.map(acc => (
                  <button key={acc.id} onClick={() => setSelectedAccountIds(prev => prev.includes(acc.id) ? prev.filter(x => x !== acc.id) : [...prev, acc.id])} className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${selectedAccountIds.includes(acc.id) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{acc.name}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-32">
              <div className="bg-zinc-900/40 rounded-3xl overflow-hidden border border-zinc-900/50">
                {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
                  <div key={tx.id} className="relative group">
                    <TransactionItem transaction={tx} accountName={accounts.find(a => a.id === tx.accountId)?.name || 'Unknown'} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingTransaction(tx); setTxType(tx.type); setTxAmount(tx.amount); setTxAccount(tx.accountId); setTxCategory(tx.category); setTxSubCategory(tx.subCategory || ''); setTxNote(tx.note || ''); setTxDate(new Date(tx.date).toISOString().slice(0,16)); setIsAddingTransaction(true); }} className="p-2 bg-zinc-800 rounded-full text-blue-400"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteTransaction(tx.id)} className="p-2 bg-zinc-800 rounded-full text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )) : <div className="p-20 text-center text-zinc-600">No records found.</div>}
              </div>
            </div>
          </div>
        )}

        {activeView === 'categories' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-400">
            <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-lg sticky top-0 z-20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveView('dashboard')} className="p-1 text-zinc-400"><ArrowLeft className="w-6 h-6" /></button>
                <h2 className="text-xl font-bold">Categories</h2>
              </div>
              <button onClick={() => setShowCatModal({ type: 'cat' })} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg"><Plus className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4 no-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-5 flex items-center justify-between bg-zinc-900/40">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-white">{cat.name}</span>
                      <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">{cat.subCategories.length} Subs</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setShowCatModal({ type: 'sub', catId: cat.id })} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full"><Plus className="w-5 h-5" /></button>
                      <button onClick={() => deleteCategory(cat)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                  {cat.subCategories.length > 0 && (
                    <div className="p-2 grid grid-cols-1 gap-1.5">
                      {cat.subCategories.map(sub => (
                        <div key={sub} className="flex justify-between items-center px-4 py-3 bg-zinc-950/30 text-sm text-zinc-400 border border-zinc-800/40 rounded-2xl">
                          <span className="font-medium">{sub}</span>
                          <button onClick={() => deleteSubCategory(cat, sub)} className="text-zinc-600 hover:text-rose-500 p-1"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Shared Modals */}
      {showCatModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold">Add {showCatModal.type === 'cat' ? 'Category' : 'Sub-category'}</h3>
            <input autoFocus placeholder="Name..." value={catInputValue} onChange={e => setCatInputValue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 outline-none focus:border-blue-600" />
            <div className="flex gap-2">
              <button onClick={() => { setShowCatModal(null); setCatInputValue(''); }} className="flex-1 py-4 bg-zinc-800 rounded-2xl font-bold">Cancel</button>
              <button onClick={submitCatModal} className="flex-1 py-4 bg-blue-600 rounded-2xl font-bold text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Plus Button */}
      <button onClick={() => { setEditingTransaction(null); setTxAmount(0); setTxNote(''); setIsAddingTransaction(true); }} className="fixed bottom-24 right-6 w-16 h-16 bg-blue-600 rounded-2xl shadow-2xl flex items-center justify-center text-white z-50 hover:scale-105 active:scale-90 transition-all border-t border-white/20"><Plus className="w-10 h-10" /></button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-800 flex justify-around p-3 pb-8 z-40 safe-bottom">
        <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'dashboard' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><LayoutGrid className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Home</span></button>
        <button onClick={() => setActiveView('records')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'records' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><ArrowLeftRight className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Records</span></button>
        <button onClick={() => setActiveView('categories')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'categories' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><PieChart className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Cats</span></button>
      </nav>

      {/* Form Modals (Transaction/Account) omitted for brevity but remain fully functional as per previous turn */}
      {/* (Adding just the Transaction Modal for completion of requirements) */}
      {isAddingTransaction && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 rounded-t-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto no-scrollbar max-h-[92dvh]">
            <div className="flex items-center justify-between"><h3 className="text-2xl font-black uppercase">{editingTransaction ? 'Edit' : 'New'} Record</h3><button onClick={() => setIsAddingTransaction(false)} className="p-2 bg-zinc-800 rounded-full"><X className="w-6 h-6" /></button></div>
            <div className="flex p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map(type => (
                <button key={type} onClick={() => setTxType(type)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${txType === type ? 'bg-zinc-800 text-blue-400' : 'text-zinc-600'}`}>{type}</button>
              ))}
            </div>
            <div className="space-y-4">
              <input type="number" value={txAmount || ''} onChange={(e) => setTxAmount(Number(e.target.value))} placeholder="0.00" className="w-full bg-zinc-950 border-2 border-zinc-800 focus:border-blue-600 rounded-[2rem] py-6 px-8 text-4xl font-black outline-none" />
              <div className="grid grid-cols-1 gap-4">
                <select value={txAccount} onChange={(e) => setTxAccount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 font-bold outline-none">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
                {txType === TransactionType.TRANSFER ? (
                  <select value={txToAccount} onChange={(e) => setTxToAccount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 font-bold outline-none">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 font-bold outline-none text-sm">{categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select>
                    <select value={txSubCategory} onChange={(e) => setTxSubCategory(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 font-bold outline-none text-sm"><option value="">None</option>{categories.find(c => c.name === txCategory)?.subCategories.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  </div>
                )}
                <input type="datetime-local" value={txDate} onChange={e => setTxDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-sm font-bold outline-none" />
                <div className="relative">
                  <input list="note-list" placeholder="Add a note..." value={txNote} onChange={(e) => setTxNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-sm outline-none" />
                  <datalist id="note-list">{noteSuggestions.map(n => <option key={n} value={n} />)}</datalist>
                </div>
              </div>
            </div>
            <button onClick={handleSaveTransaction} className="w-full bg-blue-600 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-600/20 active:scale-95 transition-all">Save Record</button>
          </div>
        </div>
      )}

      {(isAddingAccount || editingAccount) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
           <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 animate-in zoom-in duration-200">
             <div className="flex justify-between items-center"><h3 className="text-xl font-bold">{isAddingAccount ? 'New Account' : 'Edit Theme'}</h3><button onClick={() => {setIsAddingAccount(false); setEditingAccount(null);}}><X className="w-6 h-6 text-zinc-500" /></button></div>
             <div className="space-y-4">
               {isAddingAccount && (
                 <>
                   <input placeholder="Name" value={newAccName} onChange={e => setNewAccName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 outline-none" />
                   <div className="grid grid-cols-2 gap-3">
                     <select value={newAccType} onChange={e => setNewAccType(e.target.value as AccountType)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 font-bold outline-none">{Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}</select>
                     <select value={newAccCurrency} onChange={e => setNewAccCurrency(e.target.value as Currency)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 font-bold outline-none"><option value="IRR">IRR</option><option value="USD">USD</option><option value="EUR">EUR</option></select>
                   </div>
                 </>
               )}
               <input type="color" value={isAddingAccount ? newAccColor : editingAccount?.color} onChange={e => { const c = e.target.value; if(isAddingAccount) setNewAccColor(c); else if(editingAccount) setAccounts(accounts.map(a => a.id === editingAccount.id ? {...a, color: c} : a)); }} className="w-full h-14 bg-transparent border-none cursor-pointer" />
             </div>
             <button onClick={isAddingAccount ? handleAddAccount : () => setEditingAccount(null)} className="w-full py-4 bg-blue-600 rounded-2xl font-black text-white">{isAddingAccount ? 'Create' : 'Done'}</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
