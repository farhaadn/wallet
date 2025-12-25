import React, { useState, useMemo, useEffect } from 'react';
import { 
  Menu, Bell, Settings, Plus, LayoutGrid, List, TrendingUp, MoreVertical,
  ArrowLeftRight, X, ChevronRight, PieChart, Trash2, Edit2, Check, ArrowLeft, Calendar, Clock, Search, Delete, Equal, Wallet, Landmark, Coins, CreditCard, Tag, ShoppingBag, Scissors, Utensils, ReceiptText
} from 'lucide-react';
import AccountCard from './components/AccountCard.tsx';
import TransactionItem from './components/TransactionItem.tsx';
import { 
  INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_CATEGORIES
} from './constants.tsx';
import { 
  Account, Transaction, TransactionType, AccountType, Category, Currency 
} from './types.ts';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#f43f5e', '#71717a'
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'records' | 'categories'>('dashboard');
  
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('fallet_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fallet_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('fallet_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('fallet_selected_accounts');
    if (saved) return JSON.parse(saved);
    return accounts.length > 0 ? [accounts[0].id] : [];
  });

  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // State for Modals
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [managingCategory, setManagingCategory] = useState<Category | null>(null);
  
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFromAccountPicker, setShowFromAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState<Category | null>(null);

  const [tempAccount, setTempAccount] = useState<Account | null>(null);
  const [isEditingCategoryName, setIsEditingCategoryName] = useState(false);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
  const [editingSubValue, setEditingSubValue] = useState('');
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newSubValue, setNewSubValue] = useState('');

  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('0');
  const [newAccType, setNewAccType] = useState<AccountType>(AccountType.BANK);
  const [newAccCurrency, setNewAccCurrency] = useState<Currency>('IRR');
  const [newAccColor, setNewAccColor] = useState('#2563eb');

  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [txAmountStr, setTxAmountStr] = useState<string>('0');
  const [txAccount, setTxAccount] = useState<string>(accounts[0]?.id || '');
  const [txToAccount, setTxToAccount] = useState<string>('');
  const [txCategory, setTxCategory] = useState<string>('');
  const [txSubCategory, setTxSubCategory] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');
  const [txDate, setTxDate] = useState<string>('');

  // Persistence
  useEffect(() => localStorage.setItem('fallet_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('fallet_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('fallet_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('fallet_selected_accounts', JSON.stringify(selectedAccountIds)), [selectedAccountIds]);

  const pushNav = () => window.history.pushState({ modal: true }, "");

  const transactionsToDisplay = useMemo(() => {
    const list: (Transaction & { perspective?: 'source' | 'target' })[] = [];
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sorted.forEach(tx => {
      if (tx.type !== TransactionType.TRANSFER) {
        if (selectedAccountIds.includes(tx.accountId)) {
          list.push(tx);
        }
      } else {
        if (selectedAccountIds.includes(tx.accountId)) {
          list.push({ ...tx, perspective: 'source' });
        }
        if (tx.toAccountId && selectedAccountIds.includes(tx.toAccountId)) {
          list.push({ ...tx, perspective: 'target' });
        }
      }
    });
    return list;
  }, [transactions, selectedAccountIds]);

  const transactionsWithPreBalance = useMemo(() => {
    const sortedAll = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const runningBalances = new Map<string, number>(accounts.map(a => [a.id, a.balance]));
    const resultMap = new Map<string, number>();

    for (const tx of sortedAll) {
      const sourceCurrent = runningBalances.get(tx.accountId) || 0;
      let sourceImpact = 0;
      if (tx.type === TransactionType.INCOME) sourceImpact = tx.amount;
      else if (tx.type === TransactionType.EXPENSE) sourceImpact = -tx.amount;
      else if (tx.type === TransactionType.TRANSFER) sourceImpact = -tx.amount;

      const sourcePreBalance = sourceCurrent - sourceImpact;
      resultMap.set(`${tx.id}-${tx.accountId}`, sourcePreBalance);
      runningBalances.set(tx.accountId, sourcePreBalance);

      if (tx.type === TransactionType.TRANSFER && tx.toAccountId) {
        const toCurrent = runningBalances.get(tx.toAccountId) || 0;
        const toImpact = tx.amount;
        const toPreBalance = toCurrent - toImpact;
        resultMap.set(`${tx.id}-${tx.toAccountId}`, toPreBalance);
        runningBalances.set(tx.toAccountId, toPreBalance);
      }
    }

    return transactionsToDisplay.map(tx => {
      const targetAccId = tx.perspective === 'target' ? tx.toAccountId! : tx.accountId;
      return {
        ...tx,
        preBalance: resultMap.get(`${tx.id}-${targetAccId}`)
      };
    });
  }, [transactions, accounts, transactionsToDisplay]);

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setTxAmountStr('0');
    setTxNote('');
    setTxDate(new Date().toISOString().slice(0, 16));
    setTxAccount(accounts[0]?.id || '');
    setTxToAccount(accounts.find(a => a.id !== accounts[0]?.id)?.id || '');
    setTxCategory(categories[0]?.name || '');
    setTxSubCategory('');
    setTxType(TransactionType.EXPENSE);
    pushNav();
    setIsAddingTransaction(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    if (selectedRecordIds.length > 0) {
      handleToggleRecordSelection(tx.id);
      return;
    }
    setEditingTransaction(tx); 
    setTxType(tx.type); 
    setTxAmountStr(tx.amount.toString()); 
    setTxAccount(tx.accountId); 
    setTxToAccount(tx.toAccountId || '');
    setTxCategory(tx.category); 
    setTxSubCategory(tx.subCategory || ''); 
    setTxNote(tx.note || ''); 
    setTxDate(tx.date.slice(0, 16)); 
    pushNav();
    setIsAddingTransaction(true);
  };

  const handleCloneTransaction = (tx: Transaction) => {
    setEditingTransaction(null);
    setTxType(tx.type);
    setTxAmountStr(tx.amount.toString());
    setTxAccount(tx.accountId);
    setTxToAccount(tx.toAccountId || '');
    setTxCategory(tx.category);
    setTxSubCategory(tx.subCategory || '');
    setTxNote(tx.note || '');
    setTxDate(new Date().toISOString().slice(0, 16));
    pushNav();
    setIsAddingTransaction(true);
  };

  const handleSaveTransaction = () => {
    let finalAmount = 0;
    try {
      const sanitized = txAmountStr.replace(/[^-()\d/*+.]/g, '');
      finalAmount = parseFloat(eval(sanitized));
    } catch {
      finalAmount = parseFloat(txAmountStr.replace(/,/g, ''));
    }
    if (isNaN(finalAmount) || finalAmount <= 0) return;
    const data: Transaction = {
      id: editingTransaction?.id || Math.random().toString(36).substr(2, 9),
      accountId: txAccount,
      toAccountId: txType === TransactionType.TRANSFER ? txToAccount : undefined,
      type: txType,
      category: txType === TransactionType.TRANSFER ? 'Transfer' : txCategory,
      subCategory: txSubCategory,
      amount: finalAmount,
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
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? data : t));
    } else {
      setTransactions(prev => [data, ...prev]);
    }
    setAccounts(prev => prev.map(acc => {
      let b = acc.balance;
      if (acc.id === txAccount) b = txType === TransactionType.INCOME ? b + finalAmount : b - finalAmount;
      if (txType === TransactionType.TRANSFER && acc.id === txToAccount) b = b + finalAmount;
      return { ...acc, balance: b };
    }));
    setIsAddingTransaction(false);
    setEditingTransaction(null);
  };

  const performDeleteTransaction = (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    setAccounts(prev => prev.map(acc => {
      let b = acc.balance;
      if (acc.id === tx.accountId) b = tx.type === TransactionType.INCOME ? b - tx.amount : b + tx.amount;
      if (tx.type === TransactionType.TRANSFER && acc.id === tx.toAccountId) b = b - tx.amount;
      return { ...acc, balance: b };
    }));
  };

  const handleBulkDelete = () => {
    if (!confirm(`Are you sure you want to delete ${selectedRecordIds.length} records?`)) return;
    selectedRecordIds.forEach(id => {
       const tx = transactions.find(t => t.id === id);
       if (!tx) return;
       setAccounts(prev => prev.map(acc => {
          let b = acc.balance;
          if (acc.id === tx.accountId) b = tx.type === TransactionType.INCOME ? b - tx.amount : b + tx.amount;
          if (tx.type === TransactionType.TRANSFER && acc.id === tx.toAccountId) b = b - tx.amount;
          return { ...acc, balance: b };
       }));
    });
    setTransactions(prev => prev.filter(t => !selectedRecordIds.includes(t.id)));
    setSelectedRecordIds([]);
  };

  const handleToggleRecordSelection = (id: string) => {
    setSelectedRecordIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddAccount = () => {
    if (!newAccName) return;
    setAccounts(prev => [...prev, { id: Date.now().toString(), name: newAccName, type: newAccType, balance: parseFloat(newAccBalance) || 0, currency: newAccCurrency, color: newAccColor }]);
    setIsAddingAccount(false);
  };

  const handleStartEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setTempAccount({ ...acc });
    setShowSettings(false);
    pushNav();
  };

  const handleUpdateAccount = () => {
    if (tempAccount) setAccounts(prev => prev.map(a => a.id === tempAccount.id ? tempAccount : a));
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) return;
    if (!confirm("Are you sure you want to delete this account? Transactions will lose their account link.")) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
    setSelectedAccountIds(prev => prev.filter(x => x !== id));
    setEditingAccount(null);
    setTempAccount(null);
  };

  const handleKeypadPress = (val: string) => {
    if (val === '=') {
      try {
        const sanitized = txAmountStr.replace(/[^-()\d/*+.]/g, '');
        setTxAmountStr(eval(sanitized).toString());
      } catch {}
      return;
    }
    setTxAmountStr(prev => {
      if (val === 'DEL') return prev.length > 1 ? prev.slice(0, -1) : '0';
      if (val === '.') return prev.includes('.') ? prev : prev + '.';
      if (['+', '-', '*', '/'].includes(val)) return prev + val;
      if (prev === '0' && !['+', '-', '*', '/'].includes(val)) return val;
      return prev + val;
    });
  };

  const updateCategoryName = (catId: string, newName: string) => {
    if (!newName) return;
    const oldName = categories.find(c => c.id === catId)?.name;
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: newName } : c));
    setTransactions(prev => prev.map(t => t.category === oldName ? { ...t, category: newName } : t));
    setIsEditingCategoryName(false);
    setManagingCategory(prev => prev ? { ...prev, name: newName } : null);
  };

  const deleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    const hasRecords = transactions.some(t => t.category === category.name);
    if (hasRecords) {
      alert("Cannot delete category: it has existing transaction records associated with it.");
      return;
    }
    if (!confirm("Are you sure you want to delete this category?")) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    setManagingCategory(null);
  };

  const handleAddSubCategory = (catId: string, name: string) => {
    if (!name) return;
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: [...c.subCategories, name] } : c));
    setManagingCategory(prev => prev ? { ...prev, subCategories: [...prev.subCategories, name] } : null);
    setNewSubValue('');
    setIsAddingSub(false);
  };

  const handleDeleteSubCategory = (catId: string, index: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const subName = cat.subCategories[index];
    const hasRecords = transactions.some(t => t.category === cat.name && t.subCategory === subName);
    if (hasRecords) {
      alert(`Cannot delete sub-category "${subName}": it has existing transaction records associated with it.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete "${subName}"?`)) return;
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.filter((_, i) => i !== index) } : c));
    setManagingCategory(prev => prev ? { ...prev, subCategories: prev.subCategories.filter((_, i) => i !== index) } : null);
  };

  const saveSubCategoryEdit = (catId: string, index: number, newSubName: string) => {
    const category = categories.find(c => c.id === catId);
    if (!category || !newSubName) { setEditingSubIndex(null); return; }
    const oldSubName = category.subCategories[index];
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.map((s, i) => i === index ? newSubName : s) } : c));
    setTransactions(prev => prev.map(t => (t.category === category.name && t.subCategory === oldSubName) ? { ...t, subCategory: newSubName } : t));
    setManagingCategory(prev => prev ? { ...prev, subCategories: prev.subCategories.map((s, i) => i === index ? newSubName : s) } : null);
    setEditingSubIndex(null);
  };

  const formatInputAmount = (str: string) => {
    if (/[\+\-\*\/]/.test(str)) return str;
    const num = parseFloat(str);
    if (isNaN(num)) return str;
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const getAmountFontSize = (str: string) => {
    if (str.length > 12) return 'text-2xl';
    if (str.length > 8) return 'text-3xl';
    return 'text-5xl';
  };

  const AccountIcon = ({ type, className }: { type: AccountType, className?: string }) => {
    switch (type) {
      case 'BANK': return <Landmark className={className} />;
      case 'CASH': return <Wallet className={className} />;
      case 'CRYPTO': return <Coins className={className} />;
      default: return <CreditCard className={className} />;
    }
  };

  const getCategoryIcon = (catName: string, className?: string) => {
    const cat = catName.toLowerCase();
    const finalClass = className || "w-6 h-6";
    if (cat.includes('shopping')) return <ShoppingBag className={finalClass} />;
    if (cat.includes('hair') || cat.includes('health')) return <Scissors className={finalClass} />;
    if (cat.includes('grocer') || cat.includes('food')) return <Utensils className={finalClass} />;
    if (cat.includes('loan') || cat.includes('rent') || cat.includes('maintenance')) return <ReceiptText className={finalClass} />;
    if (cat.includes('salary')) return <TrendingUp className={finalClass} />;
    return <Tag className={finalClass} />;
  };

  const toggleAccountSelection = (accId: string) => {
    setSelectedAccountIds(prev => prev.includes(accId) ? prev.filter(x => x !== accId) : [...prev, accId]);
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-[#0e0e10] flex flex-col relative overflow-hidden select-none">
      {/* Selection Header */}
      {selectedRecordIds.length > 0 && (
        <header className="p-4 flex items-center justify-between sticky top-0 z-[60] bg-blue-600 safe-top animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedRecordIds([])} className="p-1"><X className="w-6 h-6 text-white" /></button>
            <span className="text-xl font-medium text-white">{selectedRecordIds.length} Selected</span>
          </div>
          <button onClick={handleBulkDelete} className="p-3 bg-white/10 active:bg-white/20 rounded-[4px] transition-colors"><Trash2 className="w-6 h-6 text-white" /></button>
        </header>
      )}

      {/* Main Header */}
      <header className="p-4 px-3.5 flex items-center justify-between sticky top-0 z-30 bg-[#0e0e10]/90 backdrop-blur-md safe-top border-b border-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-medium tracking-tight text-white uppercase">Fallet</h1>
          </div>
        </div>
        <Bell className="w-6 h-6 text-zinc-400" />
      </header>

      <main className="flex-1 overflow-hidden">
        {activeView === 'dashboard' && (
          <div className="px-3 py-4 space-y-4 pb-40 overflow-y-auto h-full no-scrollbar animate-in fade-in duration-500">
            {/* Accounts Card */}
            <div className="bg-[#1e1e1e] rounded-[10px] border border-zinc-800/80 shadow-xl overflow-hidden">
              <div className="px-3.5 py-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-white tracking-tight">Accounts</h2>
                <button onClick={() => { setShowSettings(true); pushNav(); }} className="p-1.5 bg-white/5 rounded-lg text-zinc-500 hover:text-blue-400 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 px-3.5 pb-6">
                {accounts.map(acc => (
                  <AccountCard key={acc.id} account={acc} isSelected={selectedAccountIds.includes(acc.id)} onClick={() => toggleAccountSelection(acc.id)} />
                ))}
                <button onClick={() => { setIsAddingAccount(true); pushNav(); }} className="flex flex-col items-center justify-center p-2 rounded-[6px] border border-dashed border-zinc-800 h-[84px] text-zinc-500 gap-1 bg-[#1e1e1e]/20 hover:bg-[#1e1e1e]/40 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
                </button>
              </div>
            </div>

            {/* Last Records Card */}
            <div className="bg-[#1e1e1e] rounded-[10px] border border-zinc-800/80 shadow-xl overflow-hidden">
               <div className="px-3.5 py-5 flex items-center justify-between">
                 <h2 className="text-base font-bold text-white tracking-tight">Last records overview</h2>
                 <List className="w-4 h-4 text-zinc-500" />
               </div>
               <div className="w-full">
                 {transactionsWithPreBalance.slice(0, 5).map(tx => (
                   <TransactionItem key={`${tx.id}-${tx.perspective || 'solo'}`} transaction={tx} perspective={tx.perspective} preBalance={tx.preBalance} accountName={accounts.find(a => a.id === (tx.perspective === 'target' ? tx.toAccountId : tx.accountId))?.name || 'Unknown'} onClick={() => handleEditTransaction(tx)} onDelete={() => performDeleteTransaction(tx.id)} onClone={() => handleCloneTransaction(tx)} onLongPress={() => handleToggleRecordSelection(tx.id)} isSelected={selectedRecordIds.includes(tx.id)} fromAccountName={accounts.find(a => a.id === tx.accountId)?.name} toAccountName={accounts.find(a => a.id === tx.toAccountId)?.name} />
                 ))}
               </div>
               {transactionsToDisplay.length > 0 && (
                  <button onClick={() => { setActiveView('records'); pushNav(); }} className="w-full py-5 text-blue-500 font-bold text-[10px] uppercase tracking-[0.2em] border-t border-zinc-900/30 hover:bg-zinc-800/20 active:bg-zinc-800/40 transition-colors">Show more</button>
               )}
            </div>
          </div>
        )}

        {activeView === 'records' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-400 no-scrollbar">
             <div className="p-4 px-3.5 border-b border-zinc-900 bg-[#0e0e10]/80 backdrop-blur-lg sticky top-0 z-20">
               <div className="flex items-center gap-4 mb-4">
                 <button onClick={() => setActiveView('dashboard')} className="p-1 text-zinc-400"><ArrowLeft className="w-6 h-6" /></button>
                 <h2 className="text-xl font-bold">Records</h2>
               </div>
               <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1 pointer-events-auto">
                 {accounts.map(acc => (
                   <button 
                     key={acc.id} 
                     onClick={() => toggleAccountSelection(acc.id)} 
                     className={`flex-shrink-0 px-5 py-2 rounded-[6px] text-[10px] font-bold border transition-all uppercase tracking-wider ${selectedAccountIds.includes(acc.id) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-[#1e1e1e] border-zinc-800 text-zinc-500'}`}
                   >
                     {acc.name}
                   </button>
                 ))}
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-2 pb-32 no-scrollbar">
               <div className="bg-[#1e1e1e]/80 rounded-[10px] overflow-hidden border border-zinc-900/50">
                 {transactionsWithPreBalance.map(tx => (
                   <TransactionItem key={`${tx.id}-${tx.perspective || 'solo'}`} transaction={tx} perspective={tx.perspective} preBalance={tx.preBalance} accountName={accounts.find(a => a.id === (tx.perspective === 'target' ? tx.toAccountId : tx.accountId))?.name || 'Unknown'} onClick={() => handleEditTransaction(tx)} onDelete={() => performDeleteTransaction(tx.id)} onClone={() => handleCloneTransaction(tx)} onLongPress={() => handleToggleRecordSelection(tx.id)} isSelected={selectedRecordIds.includes(tx.id)} fromAccountName={accounts.find(a => a.id === tx.accountId)?.name} toAccountName={accounts.find(a => a.id === tx.toAccountId)?.name} />
                 ))}
               </div>
             </div>
           </div>
        )}

        {activeView === 'categories' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-400">
             <div className="p-4 px-3.5 border-b border-zinc-900 bg-[#0e0e10]/80 backdrop-blur-lg sticky top-0 z-20 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <button onClick={() => setActiveView('dashboard')} className="p-1 text-zinc-400"><ArrowLeft className="w-6 h-6" /></button>
                 <h2 className="text-xl font-bold">Categories</h2>
               </div>
               <button onClick={() => { const n = prompt("New category name:"); if(n) setCategories(prev => [...prev, { id: Date.now().toString(), name: n, subCategories: [] }]); }} className="p-2 text-blue-500 bg-blue-500/10 rounded-xl"><Plus className="w-6 h-6" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-3 pb-32 space-y-3 no-scrollbar">
               {categories.map(cat => (
                 <button key={cat.id} onClick={() => { setManagingCategory(cat); pushNav(); }} className="w-full bg-[#1e1e1e] border border-zinc-800/50 rounded-[10px] overflow-hidden shadow-lg px-3.5 py-6 flex items-center justify-between active:scale-[0.98] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="text-zinc-500 group-active:text-blue-500 transition-colors">{getCategoryIcon(cat.name, "w-6 h-6")}</div>
                      <span className="font-bold text-xl text-zinc-100 group-active:text-blue-500 transition-colors">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{cat.subCategories.length} Items</span>
                 </button>
               ))}
             </div>
           </div>
        )}
      </main>

      {/* FAB and Nav */}
      <button onClick={handleOpenNewTransaction} className={`fixed bottom-[114px] right-6 w-14 h-14 bg-blue-600 rounded-[12px] shadow-2xl flex items-center justify-center text-white z-50 hover:scale-105 active:scale-95 transition-all border-t border-white/20 ${selectedRecordIds.length > 0 ? 'scale-0' : 'scale-100'}`}><Plus className="w-8 h-8" /></button>

      <nav className={`fixed bottom-0 left-0 right-0 bg-[#0e0e10]/95 backdrop-blur-2xl border-t border-zinc-900 flex justify-around p-3 pb-10 z-40 safe-bottom transition-transform duration-300 ${selectedRecordIds.length > 0 ? 'translate-y-full' : 'translate-y-0'}`}>
        <button onClick={() => { setActiveView('dashboard'); }} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'dashboard' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><LayoutGrid className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Home</span></button>
        <button onClick={() => { setActiveView('records'); pushNav(); }} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'records' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><ArrowLeftRight className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Records</span></button>
        <button onClick={() => { setActiveView('categories'); pushNav(); }} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'categories' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><PieChart className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Cats</span></button>
      </nav>
    </div>
  );
};

export default App;