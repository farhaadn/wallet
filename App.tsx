import React, { useState, useMemo, useEffect } from 'react';
import { 
  Menu, Bell, Settings, Plus, LayoutGrid, List, TrendingUp, MoreVertical,
  ArrowLeftRight, X, ChevronRight, PieChart, Trash2, Edit2, Check, ArrowLeft, Calendar, Clock, Search, Delete, Equal, Wallet, Landmark, Coins, CreditCard, ChevronDown, ChevronUp, Palette
} from 'lucide-react';
import AccountCard from './components/AccountCard';
import TransactionItem from './components/TransactionItem';
import { 
  INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_CATEGORIES
} from './constants';
import { 
  Account, Transaction, TransactionType, AccountType, Category, Currency 
} from './types';

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

  useEffect(() => localStorage.setItem('zw_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('zw_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('zw_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('zw_selected_accounts', JSON.stringify(selectedAccountIds)), [selectedAccountIds]);

  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [tempAccount, setTempAccount] = useState<Account | null>(null);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFromAccountPicker, setShowFromAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const [managingCategory, setManagingCategory] = useState<Category | null>(null);
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

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => selectedAccountIds.includes(t.accountId) || (t.toAccountId && selectedAccountIds.includes(t.toAccountId)))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountIds]);

  const totalBalance = useMemo(() => {
    return accounts
      .filter(a => selectedAccountIds.includes(a.id))
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts, selectedAccountIds]);

  const transactionsWithPreBalance = useMemo(() => {
    const sortedAll = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const runningBalances = new Map<string, number>(accounts.map(a => [a.id, a.balance]));
    const resultMap = new Map<string, number>();

    for (const tx of sortedAll) {
      const current = runningBalances.get(tx.accountId) || 0;
      let impact = 0;
      if (tx.type === TransactionType.INCOME) impact = tx.amount;
      if (tx.type === TransactionType.EXPENSE) impact = -tx.amount;
      if (tx.type === TransactionType.TRANSFER) impact = -tx.amount;

      const preBalance = current - impact;
      resultMap.set(tx.id, preBalance);
      runningBalances.set(tx.accountId, preBalance);

      if (tx.type === TransactionType.TRANSFER && tx.toAccountId) {
        const toCurrent = runningBalances.get(tx.toAccountId) || 0;
        const toImpact = tx.amount;
        runningBalances.set(tx.toAccountId, toCurrent - toImpact);
      }
    }

    return filteredTransactions.map(tx => ({
      ...tx,
      preBalance: resultMap.get(tx.id)
    }));
  }, [transactions, accounts, filteredTransactions]);

  const balanceTrend = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTx = transactions.filter(t => 
      (selectedAccountIds.includes(t.accountId) || (t.toAccountId && selectedAccountIds.includes(t.toAccountId))) &&
      new Date(t.date) >= thirtyDaysAgo
    );

    let netChange = 0;
    recentTx.forEach(t => {
      const isFrom = selectedAccountIds.includes(t.accountId);
      const isTo = t.toAccountId && selectedAccountIds.includes(t.toAccountId);
      
      if (t.type === TransactionType.INCOME && isFrom) netChange += t.amount;
      if (t.type === TransactionType.EXPENSE && isFrom) netChange -= t.amount;
      if (t.type === TransactionType.TRANSFER) {
        if (isFrom && !isTo) netChange -= t.amount;
        if (!isFrom && isTo) netChange += t.amount;
      }
    });

    const previousBalance = totalBalance - netChange;
    const percentageChange = previousBalance === 0 
      ? (totalBalance > 0 ? 100 : 0) 
      : ((totalBalance - previousBalance) / Math.abs(previousBalance)) * 100;

    return {
      percentage: percentageChange.toFixed(1),
      isPositive: percentageChange >= 0
    };
  }, [transactions, selectedAccountIds, totalBalance]);

  const flatCategories = useMemo(() => {
    const list: { main: string, sub?: string, display: string }[] = [];
    categories.forEach(cat => {
      list.push({ main: cat.name, display: cat.name });
      cat.subCategories.forEach(sub => {
        list.push({ main: cat.name, sub: sub, display: `${cat.name} › ${sub}` });
      });
    });
    return list;
  }, [categories]);

  const filteredFlatCategories = useMemo(() => {
    if (!categorySearch) return flatCategories;
    return flatCategories.filter(c => c.display.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [flatCategories, categorySearch]);

  const getLocalISOString = (date: Date = new Date()) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - tzoffset);
    return localDate.toISOString().slice(0, 16);
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setTxAmountStr('0');
    setTxNote('');
    setTxDate(getLocalISOString());
    setTxAccount(accounts[0]?.id || '');
    setTxToAccount(accounts.find(a => a.id !== accounts[0]?.id)?.id || '');
    setTxCategory(categories[0]?.name || '');
    setTxSubCategory('');
    setTxType(TransactionType.EXPENSE);
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
    setTxDate(getLocalISOString(new Date(tx.date))); 
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
    setTxDate(getLocalISOString());
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
        if (acc.id === editingTransaction.accountId) {
          b = editingTransaction.type === TransactionType.INCOME ? b - editingTransaction.amount : b + editingTransaction.amount;
        }
        if (editingTransaction.type === TransactionType.TRANSFER && acc.id === editingTransaction.toAccountId) {
          b = b - editingTransaction.amount;
        }
        return { ...acc, balance: b };
      }));
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? data : t));
    } else {
      setTransactions(prev => [data, ...prev]);
    }

    setAccounts(prev => prev.map(acc => {
      let b = acc.balance;
      if (acc.id === txAccount) {
        b = txType === TransactionType.INCOME ? b + finalAmount : b - finalAmount;
      }
      if (txType === TransactionType.TRANSFER && acc.id === txToAccount) {
        b = b + finalAmount;
      }
      return { ...acc, balance: b };
    }));

    setIsAddingTransaction(false);
    setEditingTransaction(null);
  };

  const performDeleteTransaction = (id: string) => {
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

  const handleDeleteTransaction = (id: string) => {
    if (!confirm('Delete this record?')) return;
    performDeleteTransaction(id);
  };

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedRecordIds.length} records permanently?`)) return;
    selectedRecordIds.forEach(id => performDeleteTransaction(id));
    setSelectedRecordIds([]);
  };

  const handleToggleRecordSelection = (id: string) => {
    setSelectedRecordIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddAccount = () => {
    if (!newAccName) return;
    const n: Account = { 
      id: Date.now().toString(), 
      name: newAccName, 
      type: newAccType, 
      balance: parseFloat(newAccBalance) || 0, 
      currency: newAccCurrency, 
      color: newAccColor 
    };
    setAccounts(prev => [...prev, n]);
    setIsAddingAccount(false);
    setNewAccName('');
    setNewAccBalance('0');
  };

  const handleStartEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setTempAccount({ ...acc });
    setShowAccountManager(false);
  };

  const handleUpdateAccount = () => {
    if (tempAccount) {
      setAccounts(prev => prev.map(a => a.id === tempAccount.id ? tempAccount : a));
    }
    setEditingAccount(null);
    setTempAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    const hasTransactions = transactions.some(t => t.accountId === id || t.toAccountId === id);
    if (hasTransactions) {
      alert("This account has transaction records and cannot be deleted.");
      return;
    }
    if (accounts.length <= 1) return;
    if (!confirm("Delete account?")) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
    setSelectedAccountIds(prev => prev.filter(x => x !== id));
    setEditingAccount(null);
    setTempAccount(null);
    setShowAccountManager(false);
  };

  const handleKeypadPress = (val: string) => {
    if (val === '=') {
      try {
        const sanitized = txAmountStr.replace(/[^-()\d/*+.]/g, '');
        const result = eval(sanitized);
        setTxAmountStr(result.toString());
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

  const deleteCategory = (catId: string) => {
    const catName = categories.find(c => c.id === catId)?.name;
    const hasTransactions = transactions.some(t => t.category === catName);
    if (hasTransactions) {
      alert("Category in use.");
      return;
    }
    if (!confirm(`Delete category?`)) return;
    setCategories(prev => prev.filter(c => c.id !== catId));
    setManagingCategory(null);
  };

  const updateCategoryName = (catId: string, newName: string) => {
    if (!newName) return;
    const oldCat = categories.find(c => c.id === catId);
    if (!oldCat) return;
    const oldName = oldCat.name;
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: newName } : c));
    setTransactions(prev => prev.map(t => t.category === oldName ? { ...t, category: newName } : t));
    setIsEditingCategoryName(false);
    setManagingCategory(prev => prev ? { ...prev, name: newName } : null);
  };

  const saveSubCategoryEdit = (catId: string, index: number, newSubName: string) => {
    const category = categories.find(c => c.id === catId);
    if (!category || !newSubName) {
      setEditingSubIndex(null);
      return;
    }
    const oldSubName = category.subCategories[index];
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        const nextSubs = [...c.subCategories];
        nextSubs[index] = newSubName;
        return { ...c, subCategories: nextSubs };
      }
      return c;
    }));
    setTransactions(prev => prev.map(t => 
      (t.category === category.name && t.subCategory === oldSubName) 
        ? { ...t, subCategory: newSubName } 
        : t
    ));
    setManagingCategory(prev => {
      if (!prev) return null;
      const nextSubs = [...prev.subCategories];
      nextSubs[index] = newSubName;
      return { ...prev, subCategories: nextSubs };
    });
    setEditingSubIndex(null);
  };

  const handleAddSubCategory = (catId: string, subName: string) => {
    if (!subName) {
      setIsAddingSub(false);
      return;
    }
    setCategories(prev => prev.map(c => 
      c.id === catId ? { ...c, subCategories: [...c.subCategories, subName] } : c
    ));
    setManagingCategory(prev => prev ? { ...prev, subCategories: [...prev.subCategories, subName] } : null);
    setIsAddingSub(false);
    setNewSubValue('');
  };

  const handleDeleteSubCategory = (catId: string, index: number) => {
    const category = categories.find(c => c.id === catId);
    if (!category) return;
    const subName = category.subCategories[index];
    const hasTransactions = transactions.some(t => t.category === category.name && t.subCategory === subName);
    if (hasTransactions) {
      alert("Sub-category in use.");
      return;
    }
    if (!confirm("Delete?")) return;
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        const nextSubs = [...c.subCategories];
        nextSubs.splice(index, 1);
        return { ...c, subCategories: nextSubs };
      }
      return c;
    }));
    setManagingCategory(prev => {
      if (!prev) return null;
      const nextSubs = [...prev.subCategories];
      nextSubs.splice(index, 1);
      return { ...prev, subCategories: nextSubs };
    });
  };

  const formatInputAmount = (str: string) => {
    const isMath = /[\+\-\*\/]/.test(str);
    if (isMath) return str;
    const num = parseFloat(str);
    if (isNaN(num)) return str;
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const getAmountFontSize = (str: string) => {
    const length = str.length;
    if (length > 20) return 'text-xl';
    if (length > 15) return 'text-2xl';
    if (length > 10) return 'text-3xl';
    if (length > 7) return 'text-4xl';
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

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-[#0e0e10] flex flex-col relative overflow-hidden select-none">
      {/* Header */}
      {selectedRecordIds.length > 0 ? (
        <header className="p-4 flex items-center justify-between sticky top-0 z-[60] bg-blue-600 safe-top animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedRecordIds([])} className="p-1"><X className="w-6 h-6 text-white" /></button>
            <span className="text-xl font-bold text-white">{selectedRecordIds.length} Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkDelete} className="p-3 bg-white/10 active:bg-white/20 rounded-2xl transition-colors"><Trash2 className="w-6 h-6 text-white" /></button>
          </div>
        </header>
      ) : (
        <header className="p-4 flex items-center justify-between sticky top-0 z-30 bg-[#0e0e10]/90 backdrop-blur-md safe-top border-b border-zinc-900/50">
          <div className="flex items-center gap-3">
            <Menu className="w-6 h-6 text-zinc-400" />
            <h1 className="text-xl font-black tracking-tight text-white uppercase">ZenWallet</h1>
          </div>
          <Bell className="w-6 h-6 text-zinc-400" />
        </header>
      )}

      <main className="flex-1 overflow-hidden">
        {activeView === 'dashboard' && (
          <div className="p-4 space-y-6 pb-40 overflow-y-auto h-full no-scrollbar animate-in fade-in duration-500">
            {/* Accounts section... */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Accounts</h2>
              <button onClick={() => setShowAccountManager(true)} className="p-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors"><Settings className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {accounts.map(acc => (
                <AccountCard key={acc.id} account={acc} isSelected={selectedAccountIds.includes(acc.id)} onClick={() => setSelectedAccountIds(prev => prev.includes(acc.id) ? prev.filter(x => x !== acc.id) : [...prev, acc.id])} />
              ))}
              <button onClick={() => setIsAddingAccount(true)} className="flex flex-col items-center justify-center p-2 rounded-2xl border border-dashed border-zinc-800 h-[84px] text-zinc-500 gap-1 bg-[#1e1e1e]/20"><Plus className="w-4 h-4" /><span className="text-[9px] font-bold uppercase tracking-wider">Add</span></button>
            </div>

            {/* Redesigned Last Records Card Section */}
            <div className="bg-[#1e1e1e] rounded-[2rem] border border-zinc-800 shadow-xl overflow-hidden">
               <div className="p-6 pb-2 flex items-center justify-between">
                 <h2 className="text-lg font-bold text-white tracking-tight">Last records overview</h2>
                 <List className="w-5 h-5 text-zinc-500" />
               </div>
               <div className="w-full">
                 {transactionsWithPreBalance.slice(0, 5).map(tx => (
                   <TransactionItem 
                    key={tx.id} 
                    transaction={tx} 
                    preBalance={tx.preBalance}
                    accountName={accounts.find(a => a.id === tx.accountId)?.name || 'Unknown'} 
                    onClick={() => handleEditTransaction(tx)}
                    onDelete={() => handleDeleteTransaction(tx.id)}
                    onClone={() => handleCloneTransaction(tx)}
                    onLongPress={() => handleToggleRecordSelection(tx.id)}
                    isSelected={selectedRecordIds.includes(tx.id)}
                   />
                 ))}
                 {filteredTransactions.length === 0 && <div className="p-10 text-center text-zinc-600 text-sm italic">No records found.</div>}
               </div>
               {filteredTransactions.length > 0 && (
                  <button onClick={() => setActiveView('records')} className="w-full py-4 text-blue-500 font-bold text-xs uppercase tracking-widest border-t border-zinc-900/30 hover:bg-zinc-800/20 active:bg-zinc-800/40">Show more</button>
               )}
            </div>

            {/* Balance Trend Card Fixed Layout */}
            <div className="bg-[#1e1e1e] rounded-[2rem] p-6 border border-zinc-800 shadow-xl space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-lg font-bold text-white tracking-tight">Balance Trend</span>
                 <MoreVertical className="w-5 h-5 text-zinc-500" />
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Today</span>
                 <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                    <span className="text-2xl font-black text-white shrink-0 truncate">
                      {accounts.find(a => selectedAccountIds.includes(a.id))?.currency || 'IRR'} {totalBalance.toLocaleString()}
                    </span>
                    <span className={`font-bold text-sm tracking-tight flex items-center gap-1 shrink-0 ${balanceTrend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {balanceTrend.isPositive ? '>' : '<'} {balanceTrend.isPositive ? '+' : ''}{balanceTrend.percentage}% 
                    </span>
                 </div>
                 <span className="text-[9px] opacity-60 font-bold text-zinc-500 uppercase">vs last 30d</span>
               </div>
               
               <div className="h-24 w-full relative mt-4">
                 <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor:'rgba(37, 99, 235, 0.4)', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'rgba(37, 99, 235, 0)', stopOpacity:1}} />
                      </linearGradient>
                    </defs>
                    <path d="M 0 80 Q 50 80, 100 85 T 200 80 Q 250 80, 270 50 T 320 20 L 400 20" fill="none" stroke="#3b82f6" strokeWidth="3" />
                    <path d="M 0 80 Q 50 80, 100 85 T 200 80 Q 250 80, 270 50 T 320 20 L 400 20 L 400 100 L 0 100 Z" fill="url(#grad)" />
                 </svg>
                 <div className="flex justify-between mt-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                    <span>30d ago</span>
                    <span>Today</span>
                 </div>
               </div>
               <button className="w-full pt-4 text-blue-500 font-bold text-xs uppercase tracking-widest border-t border-zinc-800/50 text-left">Show more</button>
            </div>
          </div>
        )}

        {/* Records and Categories views... */}
        {activeView === 'records' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-400">
             <div className="p-4 border-b border-zinc-900 bg-[#0e0e10]/80 backdrop-blur-lg sticky top-0 z-20">
               <div className="flex items-center gap-4 mb-4">
                 <button onClick={() => setActiveView('dashboard')} className="p-1 text-zinc-400"><ArrowLeft className="w-6 h-6" /></button>
                 <h2 className="text-xl font-bold">Records</h2>
               </div>
               <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                 {accounts.map(acc => (
                   <button key={acc.id} onClick={() => setSelectedAccountIds(prev => prev.includes(acc.id) ? prev.filter(x => x !== acc.id) : [...prev, acc.id])} className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-bold border transition-all uppercase tracking-wider ${selectedAccountIds.includes(acc.id) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1e1e1e] border-zinc-800 text-zinc-500'}`}>{acc.name}</button>
                 ))}
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 pb-32">
               <div className="bg-[#1e1e1e]/80 rounded-[2rem] overflow-hidden border border-zinc-900/50">
                 {transactionsWithPreBalance.map(tx => (
                   <TransactionItem key={tx.id} transaction={tx} preBalance={tx.preBalance} accountName={accounts.find(a => a.id === tx.accountId)?.name || 'Unknown'} onClick={() => handleEditTransaction(tx)} onDelete={() => handleDeleteTransaction(tx.id)} onClone={() => handleCloneTransaction(tx)} onLongPress={() => handleToggleRecordSelection(tx.id)} isSelected={selectedRecordIds.includes(tx.id)} />
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
                 <h2 className="text-xl font-bold">Categories</h2>
               </div>
               <button onClick={() => { const n = prompt("Name:"); if(n) setCategories(prev => [...prev, { id: Date.now().toString(), name: n, subCategories: [] }]); }} className="p-2 text-blue-500"><Plus className="w-6 h-6" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-3 no-scrollbar">
               {categories.map(cat => (
                 <button key={cat.id} onClick={() => setManagingCategory(cat)} className="w-full bg-[#1e1e1e] border border-zinc-800/50 rounded-[1.5rem] overflow-hidden shadow-lg p-4 flex items-center justify-between active:scale-[0.98] transition-all">
                     <div className="flex flex-col items-start"><span className="font-bold text-white text-base">{cat.name}</span><span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">{cat.subCategories.length} Sub-items</span></div>
                     <ChevronRight className="w-5 h-5 text-zinc-700" />
                 </button>
               ))}
             </div>
           </div>
        )}
      </main>

      {/* Detail Management Modal Refined Center Alignment */}
      {managingCategory && (
        <div className="fixed inset-0 z-[160] bg-[#0e0e10] flex flex-col p-6 safe-top animate-in slide-in-from-bottom duration-300">
           <div className="flex items-center justify-between mb-8">
             <button onClick={() => setManagingCategory(null)} className="p-2 text-zinc-500 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6" /></button>
             <h3 className="text-xl font-bold uppercase tracking-tight">Manage Details</h3>
             <button onClick={() => deleteCategory(managingCategory.id)} className="p-2 text-rose-500 bg-rose-500/10 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
           </div>

           <div className="bg-[#1e1e1e] p-6 h-36 rounded-[2.5rem] border border-zinc-800 mb-8 flex flex-col justify-center overflow-hidden">
             <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-2 px-1 text-left">Category Name</span>
             <div className="flex items-center justify-start w-full gap-4 relative">
                {isEditingCategoryName ? (
                  <div className="flex items-center gap-2 w-full pr-14">
                    <input 
                      autoFocus 
                      value={editingCategoryValue} 
                      onChange={e => setEditingCategoryValue(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && updateCategoryName(managingCategory.id, editingCategoryValue)}
                      className="bg-[#0e0e10] border-b border-blue-500 outline-none text-xl font-bold text-white flex-1 py-2 px-4 rounded text-left" 
                    />
                    <button 
                      onClick={() => updateCategoryName(managingCategory.id, editingCategoryValue)} 
                      className="absolute right-0 p-3 bg-blue-600 rounded-xl text-white shadow-lg active:scale-90 transition-all z-10"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full relative h-12">
                    <span className="text-2xl font-bold text-white truncate text-left pr-14 leading-tight">{managingCategory.name}</span>
                    <button onClick={() => { setIsEditingCategoryName(true); setEditingCategoryValue(managingCategory.name); }} className="absolute right-0 p-3 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                  </div>
                )}
             </div>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sub-categories</span>
                <button onClick={() => setIsAddingSub(true)} className="text-blue-500 font-bold flex items-center gap-1 bg-blue-500/10 px-4 py-1.5 rounded-full text-sm active:scale-95 transition-all"><Plus className="w-4 h-4" /> Add New</button>
              </div>
              <div className="space-y-2">
                 {isAddingSub && (
                   <div className="p-4 bg-[#1e1e1e] border-2 border-blue-500/50 rounded-2xl animate-in slide-in-from-top duration-200 flex items-center gap-4">
                     <input autoFocus placeholder="New..." value={newSubValue} onChange={e => setNewSubValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(managingCategory.id, newSubValue)} className="bg-transparent outline-none font-bold text-white flex-1" />
                     <button onClick={() => handleAddSubCategory(managingCategory.id, newSubValue)} className="p-2 bg-blue-600 rounded-lg text-white"><Check className="w-4 h-4" /></button>
                   </div>
                 )}
                 {managingCategory.subCategories.map((sub, idx) => (
                   <div key={idx} className="p-4 bg-[#1e1e1e] rounded-2xl flex items-center justify-between border border-zinc-800">
                      {editingSubIndex === idx ? (
                        <>
                          <input autoFocus value={editingSubValue} onChange={e => setEditingSubValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveSubCategoryEdit(managingCategory.id, idx, editingSubValue)} className="bg-transparent border-b border-blue-500 outline-none font-bold text-white flex-1" />
                          <button onClick={() => saveSubCategoryEdit(managingCategory.id, idx, editingSubValue)} className="p-2 bg-blue-600 rounded-lg text-white ml-2"><Check className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-zinc-200">{sub}</span>
                          <div className="flex gap-2">
                             <button onClick={() => { setEditingSubIndex(idx); setEditingSubValue(sub); }} className="p-2 text-zinc-500 hover:text-blue-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                             <button onClick={() => handleDeleteSubCategory(managingCategory.id, idx)} className="p-2 text-zinc-500 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </>
                      )}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* FAB... */}
      <button onClick={handleOpenNewTransaction} className={`fixed bottom-[116px] right-6 w-14 h-14 bg-blue-600 rounded-2xl shadow-2xl flex items-center justify-center text-white z-50 hover:scale-105 active:scale-95 transition-all border-t border-white/20 ${selectedRecordIds.length > 0 ? 'scale-0' : 'scale-100'}`}><Plus className="w-8 h-8" /></button>

      {/* Navigation... */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-[#0e0e10]/95 backdrop-blur-2xl border-t border-zinc-900 flex justify-around p-3 pb-10 z-40 safe-bottom transition-transform duration-300 ${selectedRecordIds.length > 0 ? 'translate-y-full' : 'translate-y-0'}`}>
        <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'dashboard' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><LayoutGrid className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Home</span></button>
        <button onClick={() => setActiveView('records')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'records' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><ArrowLeftRight className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Records</span></button>
        <button onClick={() => setActiveView('categories')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'categories' ? 'text-blue-500 scale-110' : 'text-zinc-500'}`}><PieChart className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Cats</span></button>
      </nav>

      {/* Account Editor Redesigned with Grid Color Picker */}
      {(isAddingAccount || editingAccount) && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-y-auto no-scrollbar py-12">
           <div className="w-full max-w-sm bg-[#1e1e1e] border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 animate-in zoom-in duration-200 shadow-2xl my-auto">
             <div className="flex justify-between items-center">
               <h3 className="text-xl font-bold uppercase tracking-tight">{isAddingAccount ? 'New Account' : 'Edit Account'}</h3>
               <button onClick={() => {setIsAddingAccount(false); setEditingAccount(null); setTempAccount(null);}}><X className="w-6 h-6 text-zinc-500 hover:text-white" /></button>
             </div>
             <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-4">Account Name</span>
                  <input placeholder="Wallet Name" value={isAddingAccount ? newAccName : tempAccount?.name || ''} onChange={e => isAddingAccount ? setNewAccName(e.target.value) : setTempAccount(prev => prev ? {...prev, name: e.target.value} : null)} className="w-full bg-[#0e0e10] border border-zinc-800 rounded-2xl py-4 px-6 outline-none focus:border-blue-500 font-bold text-white" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-4">Initial Balance</span>
                  <input type="number" placeholder="0" value={isAddingAccount ? newAccBalance : tempAccount?.balance || '0'} onChange={e => isAddingAccount ? setNewAccBalance(e.target.value) : setTempAccount(prev => prev ? {...prev, balance: parseFloat(e.target.value) || 0} : null)} className="w-full bg-[#0e0e10] border border-zinc-800 rounded-2xl py-4 px-6 outline-none focus:border-blue-500 font-bold text-white" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-4">Account Type</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(AccountType).map(type => (
                      <button key={type} onClick={() => isAddingAccount ? setNewAccType(type) : setTempAccount(prev => prev ? {...prev, type} : null)} className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${(isAddingAccount ? newAccType === type : tempAccount?.type === type) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0e0e10] border-zinc-800 text-zinc-500'}`}>
                        <AccountIcon type={type} className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Accent Color</span>
                    <div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: isAddingAccount ? newAccColor : tempAccount?.color || '#2563eb' }} />
                  </div>
                  <div className="bg-[#0e0e10] p-4 rounded-3xl border border-zinc-800">
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      {PRESET_COLORS.map(color => (
                        <button 
                          key={color} 
                          onClick={() => isAddingAccount ? setNewAccColor(color) : setTempAccount(prev => prev ? {...prev, color} : null)} 
                          style={{ backgroundColor: color }} 
                          className={`w-full aspect-square rounded-full border-2 transition-all ${(isAddingAccount ? newAccColor === color : tempAccount?.color === color) ? 'border-white scale-110 shadow-[0_0_10px] shadow-current' : 'border-transparent opacity-60'}`} 
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{isAddingAccount ? newAccColor : tempAccount?.color || '#2563eb'}</span>
                      <div className="relative flex items-center">
                        <Palette className="w-4 h-4 text-zinc-400 pointer-events-none absolute right-2" />
                        <input 
                           type="color" 
                           value={isAddingAccount ? newAccColor : tempAccount?.color || '#2563eb'} 
                           onChange={e => {
                              const v = e.target.value;
                              if (isAddingAccount) setNewAccColor(v);
                              else setTempAccount(prev => prev ? {...prev, color: v} : null);
                           }}
                           className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer opacity-0 absolute inset-0"
                        />
                        <button className="bg-[#1e1e1e] border border-zinc-800 rounded-lg px-8 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">Custom</button>
                      </div>
                    </div>
                  </div>
                </div>
             </div>

             <div className="flex flex-col gap-2 pt-2">
                <button onClick={isAddingAccount ? handleAddAccount : handleUpdateAccount} className="w-full py-5 bg-blue-600 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all uppercase tracking-widest">{isAddingAccount ? 'Create Account' : 'Update Wallet'}</button>
                {editingAccount && <button onClick={() => handleDeleteAccount(editingAccount.id)} className="w-full py-4 text-rose-500 font-bold text-sm bg-rose-500/10 rounded-2xl border border-rose-500/20 active:bg-rose-500/20 transition-all uppercase tracking-widest">Delete Account</button>}
             </div>
           </div>
        </div>
      )}

      {/* Account Manager Modal... */}
      {showAccountManager && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-sm:w-full bg-[#1e1e1e] border border-zinc-800 rounded-[2.5rem] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-bold uppercase tracking-tight">Manage Accounts</h3>
               <button onClick={() => setShowAccountManager(false)} className="p-2 bg-[#0e0e10] rounded-full text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
               {accounts.map(acc => (
                 <div key={acc.id} className="flex items-center justify-between p-4 bg-[#0e0e10] border border-zinc-800 rounded-2xl group">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${acc.color}20`, color: acc.color }}><AccountIcon type={acc.type} className="w-5 h-5" /></div>
                       <span className="font-bold">{acc.name}</span>
                    </div>
                    <button onClick={() => handleStartEditAccount(acc)} className="p-2 text-blue-400 bg-blue-400/10 rounded-xl hover:bg-blue-400/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                 </div>
               ))}
            </div>
            <button onClick={() => { setIsAddingAccount(true); setShowAccountManager(false); }} className="w-full py-4 bg-[#0e0e10] border border-zinc-700 rounded-2xl font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus className="w-5 h-5" /> New Account</button>
          </div>
        </div>
      )}

      {/* Entry Modal... */}
      {isAddingTransaction && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col safe-top animate-in slide-in-from-bottom duration-300">
           <div className="bg-blue-600 p-4 shrink-0">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setIsAddingTransaction(false)}><X className="w-6 h-6 text-white" /></button>
                <button onClick={handleSaveTransaction}><Check className="w-7 h-7 text-white" /></button>
              </div>
              <div className="flex gap-1 bg-blue-700/50 p-1 rounded-2xl border border-blue-400/20">
                {(['INCOME', 'EXPENSE', 'TRANSFER'] as TransactionType[]).map(type => (
                  <button key={type} onClick={() => { setTxType(type); if(type === 'TRANSFER') setTxCategory('Transfer'); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${txType === type ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 opacity-70'}`}>
                    {type}
                  </button>
                ))}
              </div>
           </div>
           <div className="flex-1 bg-blue-600 flex flex-col items-center justify-center px-8 relative overflow-hidden">
              <div className="flex items-center gap-3 text-white mb-8 w-full justify-center">
                <span className="text-4xl opacity-50 shrink-0">{txType === 'INCOME' ? '+' : txType === 'TRANSFER' ? '' : '−'}</span>
                <span className={`font-light tracking-tighter truncate text-center leading-tight transition-all duration-300 ${getAmountFontSize(txAmountStr)}`}>
                  {formatInputAmount(txAmountStr)}
                </span>
                <span className="text-xl font-bold opacity-70 shrink-0">{accounts.find(a => a.id === txAccount)?.currency || 'IRR'}</span>
              </div>
              <div className="w-full grid grid-cols-2 gap-3">
                 <button onClick={() => setShowFromAccountPicker(true)} className="flex flex-col items-center bg-blue-700/30 p-4 rounded-3xl border border-blue-400/20">
                    <span className="text-[8px] font-bold text-blue-100 uppercase tracking-widest opacity-60 mb-1">{txType === TransactionType.TRANSFER ? 'From' : 'Account'}</span>
                    <span className="text-white font-bold truncate w-full text-center text-sm">{accounts.find(a => a.id === txAccount)?.name || 'Select'}</span>
                 </button>
                 {txType === TransactionType.TRANSFER ? (
                   <button onClick={() => setShowToAccountPicker(true)} className="flex flex-col items-center bg-blue-700/30 p-4 rounded-3xl border border-blue-400/20">
                      <span className="text-[8px] font-bold text-blue-100 uppercase tracking-widest opacity-60 mb-1">To</span>
                      <span className="text-white font-bold truncate w-full text-center text-sm">{accounts.find(a => a.id === txToAccount)?.name || 'Select'}</span>
                   </button>
                 ) : (
                   <button onClick={() => setShowCategoryPicker(true)} className="flex flex-col items-center bg-blue-700/30 p-4 rounded-3xl border border-blue-400/20">
                      <span className="text-[8px] font-bold text-blue-100 uppercase tracking-widest opacity-60 mb-1">Category</span>
                      <span className="text-white font-bold truncate w-full text-center text-sm">{txSubCategory ? txSubCategory : (txCategory || 'Select')}</span>
                   </button>
                 )}
              </div>
           </div>
           <div className="bg-[#1c1c1f] p-4 shrink-0">
              <div className="grid grid-cols-4 gap-2">
                 {[7, 8, 9, '/', 4, 5, 6, '*', 1, 2, 3, '-', '.', 0, 'DEL', '+'].map((key, idx) => (
                   <button key={idx} onClick={() => handleKeypadPress(key.toString())} className={`h-14 flex items-center justify-center rounded-2xl text-2xl font-light transition-all active:scale-95 ${typeof key === 'number' || key === '.' ? 'text-zinc-100 bg-[#1e1e1e]' : 'text-zinc-500 bg-[#1e1e1e]/60'}`}>
                     {key === 'DEL' ? <Delete className="w-6 h-6" /> : key === '/' ? '÷' : key}
                   </button>
                 ))}
                 <button onClick={() => handleKeypadPress('=')} className="h-14 col-span-4 flex items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 active:bg-blue-600/20 transition-all">
                   <Equal className="w-6 h-6" />
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                 <div className="bg-[#1e1e1e] rounded-xl px-4 py-3 flex items-center gap-2 border border-zinc-800">
                    <Calendar className="w-4 h-4 text-zinc-600" />
                    <input type="datetime-local" value={txDate} onChange={e => setTxDate(e.target.value)} className="bg-transparent outline-none text-[10px] font-bold text-zinc-400 w-full" />
                 </div>
                 <div className="bg-[#1e1e1e] rounded-xl px-4 py-3 flex items-center gap-2 border border-zinc-800">
                    <Edit2 className="w-4 h-4 text-zinc-600" />
                    <input placeholder="Note..." value={txNote} onChange={e => setTxNote(e.target.value)} className="bg-transparent outline-none text-[10px] font-bold text-zinc-400 w-full" />
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;