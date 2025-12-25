import React, { useState, useMemo, useEffect } from 'react';
import { 
  Menu, Bell, Settings, Plus, LayoutGrid, List, TrendingUp, MoreVertical,
  ArrowLeftRight, X, ChevronRight, PieChart, Trash2, Edit2, Check, ArrowLeft, Calendar, Clock, Search, Delete, Equal, Wallet, Landmark, Coins, CreditCard, ChevronDown, ChevronUp, Palette, Tag, CornerDownRight, ShoppingBag, Scissors, Utensils, ReceiptText, Circle
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

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('zw_selected_accounts');
    if (saved) return JSON.parse(saved);
    return accounts.length > 0 ? [accounts[0].id] : [];
  });

  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // State for Modals
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [managingCategory, setManagingCategory] = useState<Category | null>(null);
  
  // States for Entry Modal flow
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFromAccountPicker, setShowFromAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState<Category | null>(null);
  const [isSearchingCategory, setIsSearchingCategory] = useState(false);

  // Editing Category states
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
  useEffect(() => localStorage.setItem('zw_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('zw_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('zw_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('zw_selected_accounts', JSON.stringify(selectedAccountIds)), [selectedAccountIds]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (showCategoryPicker) {
        if (isSearchingCategory) setIsSearchingCategory(false);
        else if (selectedMainCategory) setSelectedMainCategory(null);
        else setShowCategoryPicker(false);
      }
      else if (showFromAccountPicker) setShowFromAccountPicker(false);
      else if (showToAccountPicker) setShowToAccountPicker(false);
      else if (isAddingTransaction) setIsAddingTransaction(false);
      else if (isAddingAccount) setIsAddingAccount(false);
      else if (editingAccount) setEditingAccount(null);
      else if (showAccountManager) setShowAccountManager(false);
      else if (managingCategory) setManagingCategory(null);
      else if (activeView !== 'dashboard') setActiveView('dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showCategoryPicker, isSearchingCategory, selectedMainCategory, showFromAccountPicker, showToAccountPicker, isAddingTransaction, isAddingAccount, editingAccount, showAccountManager, managingCategory, activeView]);

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
    setShowAccountManager(false);
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
      <header className="p-4 flex items-center justify-between sticky top-0 z-30 bg-[#0e0e10]/90 backdrop-blur-md safe-top border-b border-zinc-900/50">
        <div className="flex items-center gap-3">
          <Menu className="w-6 h-6 text-zinc-400" />
          <h1 className="text-xl font-medium tracking-tight text-white uppercase">ZenWallet</h1>
        </div>
        <Bell className="w-6 h-6 text-zinc-400" />
      </header>

      <main className="flex-1 overflow-hidden">
        {activeView === 'dashboard' && (
          <div className="px-2 py-4 space-y-4 pb-40 overflow-y-auto h-full no-scrollbar animate-in fade-in duration-500">
            {/* Accounts Card */}
            <div className="bg-[#1e1e1e] rounded-[8px] border border-zinc-800/80 shadow-xl overflow-hidden">
              <div className="px-4 py-4 flex items-center justify-between">
                <h2 className="text-base font-medium text-white tracking-tight">Accounts</h2>
                <button onClick={() => { setShowAccountManager(true); pushNav(); }} className="p-1.5 bg-white/5 rounded-lg text-zinc-500 hover:text-blue-400 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 px-3 pb-4">
                {accounts.map(acc => (
                  <AccountCard key={acc.id} account={acc} isSelected={selectedAccountIds.includes(acc.id)} onClick={() => toggleAccountSelection(acc.id)} />
                ))}
                <button onClick={() => { setIsAddingAccount(true); pushNav(); }} className="flex flex-col items-center justify-center p-2 rounded-[4px] border border-dashed border-zinc-800 h-[84px] text-zinc-500 gap-1 bg-[#1e1e1e]/20 hover:bg-[#1e1e1e]/40 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px] font-medium uppercase tracking-wider">Add</span>
                </button>
              </div>
            </div>

            {/* Last Records Card */}
            <div className="bg-[#1e1e1e] rounded-[8px] border border-zinc-800/80 shadow-xl overflow-hidden">
               <div className="px-4 py-4 flex items-center justify-between">
                 <h2 className="text-base font-medium text-white tracking-tight">Last records overview</h2>
                 <List className="w-4 h-4 text-zinc-500" />
               </div>
               <div className="w-full">
                 {transactionsWithPreBalance.slice(0, 5).map(tx => (
                   <TransactionItem key={`${tx.id}-${tx.perspective || 'solo'}`} transaction={tx} perspective={tx.perspective} preBalance={tx.preBalance} accountName={accounts.find(a => a.id === (tx.perspective === 'target' ? tx.toAccountId : tx.accountId))?.name || 'Unknown'} onClick={() => handleEditTransaction(tx)} onDelete={() => performDeleteTransaction(tx.id)} onClone={() => handleCloneTransaction(tx)} onLongPress={() => handleToggleRecordSelection(tx.id)} isSelected={selectedRecordIds.includes(tx.id)} fromAccountName={accounts.find(a => a.id === tx.accountId)?.name} toAccountName={accounts.find(a => a.id === tx.toAccountId)?.name} />
                 ))}
               </div>
               {transactionsToDisplay.length > 0 && (
                  <button onClick={() => { setActiveView('records'); pushNav(); }} className="w-full py-4 text-blue-500 font-medium text-[10px] uppercase tracking-[0.2em] border-t border-zinc-900/30 hover:bg-zinc-800/20 active:bg-zinc-800/40 transition-colors">Show more</button>
               )}
            </div>
          </div>
        )}

        {activeView === 'records' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-400 no-scrollbar">
             <div className="p-4 border-b border-zinc-900 bg-[#0e0e10]/80 backdrop-blur-lg sticky top-0 z-20">
               <div className="flex items-center gap-4 mb-4">
                 <button onClick={() => setActiveView('dashboard')} className="p-1 text-zinc-400"><ArrowLeft className="w-6 h-6" /></button>
                 <h2 className="text-xl font-medium">Records</h2>
               </div>
               <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2 pointer-events-auto">
                 {accounts.map(acc => (
                   <button 
                     key={acc.id} 
                     onClick={() => toggleAccountSelection(acc.id)} 
                     className={`flex-shrink-0 px-4 py-2 rounded-[4px] text-[10px] font-medium border transition-all uppercase tracking-wider ${selectedAccountIds.includes(acc.id) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-[#1e1e1e] border-zinc-800 text-zinc-500'}`}
                   >
                     {acc.name}
                   </button>
                 ))}
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-2 pb-32 no-scrollbar">
               <div className="bg-[#1e1e1e]/80 rounded-[8px] overflow-hidden border border-zinc-900/50">
                 {transactionsWithPreBalance.map(tx => (
                   <TransactionItem key={`${tx.id}-${tx.perspective || 'solo'}`} transaction={tx} perspective={tx.perspective} preBalance={tx.preBalance} accountName={accounts.find(a => a.id === (tx.perspective === 'target' ? tx.toAccountId : tx.accountId))?.name || 'Unknown'} onClick={() => handleEditTransaction(tx)} onDelete={() => performDeleteTransaction(tx.id)} onClone={() => handleCloneTransaction(tx)} onLongPress={() => handleToggleRecordSelection(tx.id)} isSelected={selectedRecordIds.includes(tx.id)} fromAccountName={accounts.find(a => a.id === tx.accountId)?.name} toAccountName={accounts.find(a => a.id === tx.toAccountId)?.name} />
                 ))}
               </div>
             </div>
           </div>
        )}

        {activeView === 'categories' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-400">
             <div className="p-4 border-b border-zinc-900 bg-[#0e0e10]/80 backdrop-blur-lg sticky top-0 z-20 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <button onClick={() => setActiveView('dashboard')} className="p-1 text-zinc-400"><ArrowLeft className="w-6 h-6" /></button>
                 <h2 className="text-xl font-medium">Categories</h2>
               </div>
               <button onClick={() => { const n = prompt("New category name:"); if(n) setCategories(prev => [...prev, { id: Date.now().toString(), name: n, subCategories: [] }]); }} className="p-2 text-blue-500 bg-blue-500/10 rounded-xl"><Plus className="w-6 h-6" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-2 pb-32 space-y-2 no-scrollbar">
               {categories.map(cat => (
                 <button key={cat.id} onClick={() => { setManagingCategory(cat); pushNav(); }} className="w-full bg-[#1e1e1e] border border-zinc-800/50 rounded-[4px] overflow-hidden shadow-lg p-5 flex items-center justify-between active:scale-[0.98] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="text-zinc-500 group-active:text-blue-500 transition-colors">{getCategoryIcon(cat.name, "w-6 h-6")}</div>
                      <span className="font-medium text-xl text-zinc-100 group-active:text-blue-500 transition-colors">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">{cat.subCategories.length} Items</span>
                 </button>
               ))}
             </div>
           </div>
        )}
      </main>

      {/* FAB and Nav - Curve increased to rounded-[12px] as requested */}
      <button onClick={handleOpenNewTransaction} className={`fixed bottom-[116px] right-6 w-14 h-14 bg-blue-600 rounded-[12px] shadow-2xl flex items-center justify-center text-white z-50 hover:scale-105 active:scale-95 transition-all border-t border-white/20 ${selectedRecordIds.length > 0 ? 'scale-0' : 'scale-100'}`}><Plus className="w-8 h-8" /></button>

      <nav className={`fixed bottom-0 left-0 right-0 bg-[#0e0e10]/95 backdrop-blur-2xl border-t border-zinc-900 flex justify-around p-3 pb-10 z-40 safe-bottom transition-transform duration-300 ${selectedRecordIds.length > 0 ? 'translate-y-full' : 'translate-y-0'}`}>
        <button onClick={() => { setActiveView('dashboard'); }} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'dashboard' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><LayoutGrid className="w-6 h-6" /><span className="text-[10px] font-medium uppercase tracking-tighter">Home</span></button>
        <button onClick={() => { setActiveView('records'); pushNav(); }} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'records' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><ArrowLeftRight className="w-6 h-6" /><span className="text-[10px] font-medium uppercase tracking-tighter">Records</span></button>
        <button onClick={() => { setActiveView('categories'); pushNav(); }} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'categories' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><PieChart className="w-6 h-6" /><span className="text-[10px] font-medium uppercase tracking-tighter">Cats</span></button>
      </nav>

      {/* Entry Modal */}
      {isAddingTransaction && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col safe-top animate-in slide-in-from-bottom duration-300">
           <div className="bg-blue-600 p-4 shrink-0"><div className="flex items-center justify-between mb-8"><button onClick={() => setIsAddingTransaction(false)}><X className="w-6 h-6 text-white" /></button><button onClick={handleSaveTransaction}><Check className="w-7 h-7 text-white" /></button></div><div className="flex gap-1 bg-blue-700/50 p-1 rounded-[10px] border border-blue-400/20">{(['INCOME', 'EXPENSE', 'TRANSFER'] as TransactionType[]).map(type => (<button key={type} onClick={() => { setTxType(type); if(type === 'TRANSFER') setTxCategory('Transfer'); }} className={`flex-1 py-3 text-[10px] font-medium uppercase tracking-widest rounded-[4px] transition-all ${txType === type ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 opacity-70'}`}>{type}</button>))}</div></div>
           <div className="flex-1 bg-blue-600 flex flex-col items-center justify-center px-8 relative overflow-hidden"><div className="flex items-center gap-3 text-white mb-8 w-full justify-center"><span className="text-4xl opacity-50 shrink-0">{txType === 'INCOME' ? '+' : txType === 'TRANSFER' ? '' : '−'}</span><span className={`font-light tracking-tighter truncate text-center leading-tight transition-all duration-300 ${getAmountFontSize(txAmountStr)}`}>{formatInputAmount(txAmountStr)}</span><span className="text-xl font-medium opacity-70 shrink-0">{accounts.find(a => a.id === txAccount)?.currency || 'IRR'}</span></div><div className="w-full grid grid-cols-2 gap-3"><button onClick={() => { setShowFromAccountPicker(true); pushNav(); }} className="flex flex-col items-center bg-blue-700/30 p-4 rounded-[10px] border border-blue-400/20"><span className="text-[8px] font-medium text-blue-100 uppercase tracking-widest opacity-60 mb-1">{txType === TransactionType.TRANSFER ? 'From' : 'Account'}</span><span className="text-white font-medium truncate w-full text-center text-sm">{accounts.find(a => a.id === txAccount)?.name || 'Select'}</span></button>{txType === TransactionType.TRANSFER ? (<button onClick={() => { setShowToAccountPicker(true); pushNav(); }} className="flex flex-col items-center bg-blue-700/30 p-4 rounded-[10px] border border-blue-400/20"><span className="text-[8px] font-medium text-blue-100 uppercase tracking-widest opacity-60 mb-1">To</span><span className="text-white font-medium truncate w-full text-center text-sm">{accounts.find(a => a.id === txToAccount)?.name || 'Select'}</span></button>) : (<button onClick={() => { setShowCategoryPicker(true); pushNav(); }} className="flex flex-col items-center bg-blue-700/30 p-4 rounded-[10px] border border-blue-400/20"><span className="text-[8px] font-medium text-blue-100 uppercase tracking-widest opacity-60 mb-1">Category</span><span className="text-white font-medium truncate w-full text-center text-sm">{txSubCategory ? txSubCategory : (txCategory || 'Select')}</span></button>)}</div></div>
           <div className="bg-[#1c1c1f] p-4 shrink-0"><div className="grid grid-cols-4 gap-2">{[7, 8, 9, '/', 4, 5, 6, '*', 1, 2, 3, '-', '.', 0, 'DEL', '+'].map((key, idx) => (<button key={idx} onClick={() => handleKeypadPress(key.toString())} className={`h-14 flex items-center justify-center rounded-[4px] text-2xl font-light transition-all active:scale-95 ${typeof key === 'number' || key === '.' ? 'text-zinc-100 bg-[#1e1e1e]' : 'text-zinc-500 bg-[#1e1e1e]/60'}`}>{key === 'DEL' ? <Delete className="w-6 h-6" /> : key === '/' ? '÷' : key}</button>))} <button onClick={() => handleKeypadPress('=')} className="h-14 col-span-4 flex items-center justify-center rounded-[4px] bg-blue-600/10 text-blue-500 active:bg-blue-600/20 transition-all"><Equal className="w-6 h-6" /></button></div><div className="grid grid-cols-2 gap-2 mt-4"><div className="bg-[#1e1e1e] rounded-[4px] px-4 py-3 flex items-center gap-2 border border-zinc-800"><Calendar className="w-4 h-4 text-zinc-600" /><input type="datetime-local" value={txDate} onChange={e => setTxDate(e.target.value)} className="bg-transparent outline-none text-[10px] font-medium text-zinc-400 w-full" /></div><div className="bg-[#1e1e1e] rounded-[4px] px-4 py-3 flex items-center gap-2 border border-zinc-800"><Edit2 className="w-4 h-4 text-zinc-600" /><input placeholder="Note..." value={txNote} onChange={e => setTxNote(e.target.value)} className="bg-transparent outline-none text-[10px] font-medium text-zinc-400 w-full" /></div></div></div>
        </div>
      )}

      {/* Account Manager Modal */}
      {showAccountManager && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-sm:w-full bg-[#1e1e1e] border border-zinc-800 rounded-[10px] p-6 space-y-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between"><h3 className="text-lg font-medium uppercase tracking-tight">Accounts</h3><button onClick={() => setShowAccountManager(false)} className="p-2 bg-[#0e0e10] rounded-full text-zinc-400"><X className="w-5 h-5" /></button></div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
               {accounts.map(acc => (
                 <div key={acc.id} className="flex items-center justify-between p-4 bg-[#0e0e10] border border-zinc-800 rounded-[4px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${acc.color}20`, color: acc.color }}>
                        <AccountIcon type={acc.type} className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{acc.name}</span>
                    </div>
                    <button onClick={() => handleStartEditAccount(acc)} className="p-2 text-blue-400 bg-blue-400/10 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                 </div>
               ))}
            </div>
            <button onClick={() => { setIsAddingAccount(true); setShowAccountManager(false); pushNav(); }} className="w-full py-4 bg-blue-600/10 border border-blue-600/30 rounded-[4px] font-medium text-blue-500 hover:bg-blue-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus className="w-5 h-5" /> New Account</button>
          </div>
        </div>
      )}

      {/* Account Form Modal */}
      {(isAddingAccount || editingAccount) && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-y-auto no-scrollbar py-12">
           <div className="w-full max-w-sm bg-[#1e1e1e] border border-zinc-800 rounded-[10px] p-8 space-y-6 animate-in zoom-in duration-200 shadow-2xl my-auto">
             <div className="flex justify-between items-center">
               <h3 className="text-xl font-medium uppercase tracking-tight">{isAddingAccount ? 'New Account' : 'Edit Account'}</h3>
               <button onClick={() => {setIsAddingAccount(false); setEditingAccount(null); setTempAccount(null);}}><X className="w-6 h-6 text-zinc-500 hover:text-white" /></button>
             </div>
             <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest ml-4">Account Name</span>
                  <input placeholder="Account Name" value={isAddingAccount ? newAccName : tempAccount?.name || ''} onChange={e => isAddingAccount ? setNewAccName(e.target.value) : setTempAccount(prev => prev ? {...prev, name: e.target.value} : null)} className="w-full bg-[#0e0e10] border border-zinc-800 rounded-[4px] py-4 px-6 outline-none focus:border-blue-500 font-medium text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest ml-4">Initial Balance</span>
                  <input type="number" placeholder="0" value={isAddingAccount ? newAccBalance : tempAccount?.balance || '0'} onChange={e => isAddingAccount ? setNewAccBalance(e.target.value) : setTempAccount(prev => prev ? {...prev, balance: parseFloat(e.target.value) || 0} : null)} className="w-full bg-[#0e0e10] border border-zinc-800 rounded-[4px] py-4 px-6 outline-none focus:border-blue-500 font-medium text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest ml-4">Account Type</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(AccountType).map(type => (
                      <button 
                        key={type} 
                        onClick={() => isAddingAccount ? setNewAccType(type) : setTempAccount(prev => prev ? {...prev, type} : null)} 
                        className={`p-3 rounded-[4px] border flex items-center gap-2 transition-all ${(isAddingAccount ? newAccType === type : tempAccount?.type === type) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0e0e10] border-zinc-800 text-zinc-500'}`}
                      >
                        <AccountIcon type={type} className="w-4 h-4" />
                        <span className="text-[10px] font-medium uppercase tracking-widest">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest ml-4">Color</span>
                  <div className="bg-[#0e0e10] p-6 rounded-[10px] border border-zinc-800/60">
                    <div className="grid grid-cols-4 gap-4">
                      {PRESET_COLORS.map(color => (
                        <button key={color} onClick={() => isAddingAccount ? setNewAccColor(color) : setTempAccount(prev => prev ? {...prev, color} : null)} style={{ backgroundColor: color }} className={`w-full aspect-square rounded-full border-2 transition-all ${(isAddingAccount ? newAccColor === color : tempAccount?.color === color) ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`} />
                      ))}
                    </div>
                  </div>
                </div>
             </div>
             <div className="flex flex-col gap-3 pt-2">
                <button onClick={isAddingAccount ? handleAddAccount : handleUpdateAccount} className="w-full py-5 bg-blue-600 rounded-[4px] font-medium text-white shadow-lg active:scale-95 transition-all uppercase tracking-widest">{isAddingAccount ? 'Create Account' : 'Save Changes'}</button>
                {editingAccount && <button onClick={() => handleDeleteAccount(editingAccount.id)} className="w-full py-4 text-rose-500 font-medium text-xs bg-rose-500/10 rounded-[4px] border border-rose-500/20 active:bg-rose-500/20 transition-all uppercase tracking-widest">Delete Account</button>}
             </div>
           </div>
        </div>
      )}

      {/* Category Selection Picker */}
      {showCategoryPicker && (
        <div className="fixed inset-0 z-[200] bg-[#0e0e10] flex flex-col safe-top animate-in slide-in-from-bottom duration-300 no-scrollbar">
           <header className="p-6 flex items-center justify-between border-b border-zinc-900">
             <div className="flex items-center gap-4">
               {selectedMainCategory ? (
                 <button onClick={() => setSelectedMainCategory(null)} className="p-2 bg-[#1e1e1e] rounded-full text-white"><ArrowLeft className="w-5 h-5" /></button>
               ) : (
                 <Tag className="w-6 h-6 text-blue-500" />
               )}
               <h3 className="text-xl font-medium uppercase tracking-tight">{selectedMainCategory ? selectedMainCategory.name : 'Category'}</h3>
             </div>
             <button onClick={() => { setShowCategoryPicker(false); setSelectedMainCategory(null); }} className="p-2 bg-[#1e1e1e] rounded-full text-zinc-400"><X className="w-6 h-6" /></button>
           </header>
           <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24">
              {selectedMainCategory ? (
                <>
                  <button onClick={() => { setTxCategory(selectedMainCategory.name); setTxSubCategory(''); setShowCategoryPicker(false); setSelectedMainCategory(null); }} className="w-full flex items-center justify-between p-5 bg-blue-600/10 border border-blue-500/30 rounded-[10px] transition-all"><span className="font-medium text-xl text-blue-500">All {selectedMainCategory.name}</span></button>
                  {selectedMainCategory.subCategories.map((sub, idx) => (
                    <button key={idx} onClick={() => { setTxCategory(selectedMainCategory.name); setTxSubCategory(sub); setShowCategoryPicker(false); setSelectedMainCategory(null); }} className="w-full flex items-center justify-between p-5 bg-[#1e1e1e] border border-zinc-800 rounded-[10px] active:scale-[0.98] transition-all"><span className="font-medium text-xl text-zinc-100">{sub}</span></button>
                  ))}
                </>
              ) : (
                categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedMainCategory(cat)} className="w-full flex items-center justify-between p-5 bg-[#1e1e1e] border border-zinc-800 rounded-[10px] active:scale-[0.98] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="text-zinc-500 group-active:text-blue-500 transition-colors">{getCategoryIcon(cat.name, "w-6 h-6")}</div>
                      <span className="font-medium text-xl text-zinc-100 group-active:text-blue-500 transition-colors">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">{cat.subCategories.length} Items</span>
                  </button>
                ))
              )}
           </div>
        </div>
      )}

      {/* Account Selection Pickers */}
      {(showFromAccountPicker || showToAccountPicker) && (
        <div className="fixed inset-0 z-[220] bg-[#0e0e10] flex flex-col safe-top animate-in slide-in-from-bottom duration-300 no-scrollbar">
           <header className="p-6 flex items-center justify-between border-b border-zinc-900">
             <div className="flex items-center gap-4">
               <Wallet className="w-6 h-6 text-blue-500" />
               <h3 className="text-xl font-medium uppercase tracking-tight">Select Account</h3>
             </div>
             <button onClick={() => { setShowFromAccountPicker(false); setShowToAccountPicker(false); }} className="p-2 bg-[#1e1e1e] rounded-full text-zinc-400"><X className="w-6 h-6" /></button>
           </header>
           <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 no-scrollbar">
              {accounts.map(acc => (
                <button 
                  key={acc.id} 
                  onClick={() => {
                    if (showFromAccountPicker) setTxAccount(acc.id);
                    else setTxToAccount(acc.id);
                    setShowFromAccountPicker(false);
                    setShowToAccountPicker(false);
                  }}
                  className="w-full flex items-center justify-between p-5 bg-[#1e1e1e] border border-zinc-800 rounded-[8px] active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div style={{ color: acc.color }}><AccountIcon type={acc.type} className="w-6 h-6" /></div>
                    <span className="font-medium text-xl text-zinc-100">{acc.name}</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-500">{acc.currency}</span>
                </button>
              ))}
           </div>
        </div>
      )}

      {/* Category Details/Manage */}
      {managingCategory && (
        <div className="fixed inset-0 z-[160] bg-[#0e0e10] flex flex-col p-6 safe-top animate-in slide-in-from-bottom duration-300 no-scrollbar">
           <div className="flex items-center justify-between mb-8">
             <button onClick={() => setManagingCategory(null)} className="p-2 text-zinc-500"><ArrowLeft className="w-6 h-6" /></button>
             <h3 className="text-xl font-medium uppercase tracking-tight">Category Details</h3>
             <button onClick={() => deleteCategory(managingCategory.id)} className="p-2 text-rose-500"><Trash2 className="w-5 h-5" /></button>
           </div>
           
           <div className="space-y-4 mb-6">
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest block ml-2">Category Name</span>
              {isEditingCategoryName ? (
                <div className="p-4 bg-[#1e1e1e] border border-zinc-800 rounded-[4px] flex items-center justify-between animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center gap-4 flex-1 mr-2">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 shrink-0">
                      {getCategoryIcon(managingCategory.name, "w-5 h-5")}
                    </div>
                    <input 
                      autoFocus 
                      value={editingCategoryValue} 
                      onChange={e => setEditingCategoryValue(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && updateCategoryName(managingCategory.id, editingCategoryValue)} 
                      className="bg-transparent border-b border-blue-500 outline-none text-xl font-medium text-white w-full" 
                    />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => updateCategoryName(managingCategory.id, editingCategoryValue)} className="p-2 bg-blue-600 rounded-lg text-white"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditingCategoryName(false)} className="p-2 bg-zinc-700 rounded-lg text-white"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#1e1e1e] rounded-[4px] border border-zinc-800 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500">
                      {getCategoryIcon(managingCategory.name, "w-5 h-5")}
                    </div>
                    <span className="text-2xl font-medium text-white">{managingCategory.name}</span>
                  </div>
                  <button onClick={() => { setIsEditingCategoryName(true); setEditingCategoryValue(managingCategory.name); }} className="p-2 text-zinc-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto px-1 space-y-2 pb-20 no-scrollbar">
              <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-zinc-500 uppercase tracking-widest px-2">Sub-categories</span><button onClick={() => setIsAddingSub(true)} className="text-blue-500 font-medium px-4 py-1.5 rounded-full text-sm hover:bg-blue-500/10 transition-colors"><Plus className="w-4 h-4" /></button></div>
              {isAddingSub && (
                <div className="p-4 bg-[#1e1e1e] border border-zinc-800 rounded-[4px] flex items-center justify-between animate-in fade-in zoom-in duration-200">
                  <input autoFocus placeholder="Sub-category name..." value={newSubValue} onChange={e => setNewSubValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(managingCategory.id, newSubValue)} className="bg-transparent outline-none font-medium text-white flex-1 mr-2" />
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleAddSubCategory(managingCategory.id, newSubValue)} className="p-2 bg-blue-600 rounded-lg text-white"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsAddingSub(false)} className="p-2 bg-zinc-700 rounded-lg text-white"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
              {managingCategory.subCategories.map((sub, idx) => (
                <div key={idx} className="p-4 bg-[#1e1e1e] rounded-[4px] flex items-center justify-between border border-zinc-800">
                   {editingSubIndex === idx ? (
                     <div className="flex items-center justify-between w-full">
                       <input autoFocus value={editingSubValue} onChange={e => setEditingSubValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveSubCategoryEdit(managingCategory.id, idx, editingSubValue)} className="bg-transparent border-b border-blue-500 outline-none font-medium text-white flex-1 mr-2" />
                       <div className="flex gap-1 shrink-0">
                        <button onClick={() => saveSubCategoryEdit(managingCategory.id, idx, editingSubValue)} className="p-2 bg-blue-600 rounded-lg text-white"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingSubIndex(null)} className="p-2 bg-zinc-700 rounded-lg text-white"><X className="w-4 h-4" /></button>
                       </div>
                     </div>
                   ) : (
                     <><span className="font-medium text-zinc-200">{sub}</span><div className="flex gap-2"><button onClick={() => { setEditingSubIndex(idx); setEditingSubValue(sub); }} className="p-2 text-zinc-500"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeleteSubCategory(managingCategory.id, idx)} className="p-2 text-zinc-500"><Trash2 className="w-4 h-4" /></button></div></>
                   )}
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default App;