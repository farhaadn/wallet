import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Split, Copy, Trash2 } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  accountName: string;
  onClick?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  onSplit?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  accountName, 
  onClick, 
  onDelete, 
  onClone,
  onSplit 
}) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const isTransfer = transaction.type === TransactionType.TRANSFER;

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swipeLimit = -180; // Total width of revealed buttons

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, swipeLimit));
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeOffset < swipeLimit / 2) {
      setSwipeOffset(swipeLimit);
    } else {
      setSwipeOffset(0);
    }
  };

  const closeSwipe = () => setSwipeOffset(0);

  return (
    <div className="relative w-full overflow-hidden bg-[#0e0e10]">
      {/* Swipe Actions Background */}
      <div 
        className="absolute inset-y-0 right-0 flex bg-[#ef4444]"
        style={{ width: `${Math.abs(swipeLimit)}px` }}
      >
        <button 
          onClick={() => { onSplit?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/10"
        >
          <Split className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Split</span>
        </button>
        <button 
          onClick={() => { onClone?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/10"
        >
          <Copy className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Clone</span>
        </button>
        <button 
          onClick={() => { onDelete?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white"
        >
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Delete</span>
        </button>
      </div>

      {/* Main Content Item */}
      <button 
        onClick={swipeOffset === 0 ? onClick : closeSwipe}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className="relative z-10 w-full flex items-center gap-4 p-4 border-b border-zinc-900/50 bg-[#0e0e10] hover:bg-zinc-800/30 transition-transform duration-200 ease-out text-left"
      >
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center 
          ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : isTransfer ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
          {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : isTransfer ? <RefreshCcw className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-zinc-100 font-medium truncate">{transaction.category}</h4>
            <span className={`font-bold ${isIncome ? 'text-emerald-500' : isTransfer ? 'text-blue-500' : 'text-zinc-100'}`}>
              {isIncome ? '+' : isTransfer ? '' : '−'}{transaction.currency} {transaction.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">{accountName}</span>
              {transaction.note && <span className="italic opacity-70 truncate max-w-[120px]">"{transaction.note}"</span>}
            </div>
            <span className="flex-shrink-0">{new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default TransactionItem;