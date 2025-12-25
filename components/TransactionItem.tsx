import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Split, Copy, Trash2, ShoppingBag, Scissors, Landmark, ReceiptText, Utensils } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  accountName: string;
  perspective?: 'source' | 'target';
  preBalance?: number;
  onClick?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  onSplit?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  fromAccountName?: string;
  toAccountName?: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  accountName, 
  perspective,
  preBalance,
  onClick, 
  onDelete, 
  onClone,
  onSplit,
  onLongPress,
  isSelected,
  fromAccountName,
  toAccountName
}) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const isTransfer = transaction.type === TransactionType.TRANSFER;

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const swipeLimit = -180;

  const longPressTimer = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (onLongPress && !isSelected) {
      longPressTimer.current = window.setTimeout(() => {
        onLongPress();
        if ('vibrate' in navigator) navigator.vibrate(50);
      }, 600);
    }
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    if ((Math.abs(diffX) > 8 || Math.abs(diffY) > 8) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isSwiping) return;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) setSwipeOffset(Math.max(diffX, swipeLimit));
      else setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    setIsSwiping(false);
    if (swipeOffset < swipeLimit / 2) setSwipeOffset(swipeLimit);
    else setSwipeOffset(0);
  };

  const closeSwipe = () => setSwipeOffset(0);

  const getDisplayTitle = () => {
    if (isTransfer) {
      return perspective === 'target' ? 'Transfer, deposit' : 'Transfer, withdraw';
    }
    return transaction.subCategory || transaction.category;
  };

  const getCategoryIcon = () => {
    const cat = transaction.category.toLowerCase();
    if (isTransfer) {
      return <ArrowLeftRight className="w-5 h-5 text-white" />;
    }
    if (cat.includes('shopping')) return <ShoppingBag className="w-4 h-4" />;
    if (cat.includes('hair') || cat.includes('health')) return <Scissors className="w-4 h-4" />;
    if (cat.includes('grocer') || cat.includes('food')) return <Utensils className="w-4 h-4" />;
    if (cat.includes('loan')) return <ReceiptText className="w-4 h-4" />;
    if (isIncome) return <ArrowDownLeft className="w-4 h-4" />;
    return <ArrowUpRight className="w-4 h-4" />;
  };

  const getAmountColor = () => {
    if (isTransfer) {
      return perspective === 'target' ? 'text-emerald-500' : 'text-rose-500';
    }
    return isIncome ? 'text-emerald-500' : 'text-rose-500';
  };

  const getAmountPrefix = () => {
    if (isTransfer) {
      return perspective === 'source' ? '-' : '';
    }
    return isIncome ? '' : '-';
  };

  const getIconBgColor = () => {
    if (isTransfer) return 'bg-[#008b9b]'; 
    if (transaction.category.toLowerCase().includes('loan')) return 'bg-[#06b6d4cc]';
    return isIncome ? 'bg-emerald-500/80' : 'bg-rose-500/80';
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#1e1e1e]">
      <div className="absolute inset-y-0 right-0 flex bg-rose-600 transition-opacity duration-200" style={{ width: `${Math.abs(swipeLimit)}px`, opacity: swipeOffset < -10 ? 1 : 0 }}>
        <button onClick={(e) => { e.stopPropagation(); onSplit?.(); closeSwipe(); }} className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/5 active:bg-rose-700"><Split className="w-4 h-4 mb-1" /><span className="text-[9px] font-medium uppercase">Split</span></button>
        <button onClick={(e) => { e.stopPropagation(); onClone?.(); closeSwipe(); }} className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/5 active:bg-rose-700"><Copy className="w-4 h-4 mb-1" /><span className="text-[9px] font-medium uppercase">Clone</span></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete?.(); closeSwipe(); }} className="flex-1 flex flex-col items-center justify-center text-white active:bg-rose-700"><Trash2 className="w-4 h-4 mb-1" /><span className="text-[9px] font-medium uppercase">Delete</span></button>
      </div>

      <div 
        onClick={() => (swipeOffset !== 0 ? closeSwipe() : onClick?.())}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)`, transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        className={`relative z-10 w-full flex items-center gap-2 px-2.5 py-3 border-b border-[#0e0e10]/30 cursor-pointer select-none min-h-[82px] ${isSelected ? 'bg-blue-600/20' : 'bg-[#1e1e1e] active:bg-zinc-800/40'}`}
      >
        <div className="relative flex-shrink-0 self-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${getIconBgColor()} text-white shadow-lg`}>
            {getCategoryIcon()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center pr-1">
          <h4 className={`font-medium text-[15px] leading-tight truncate ${isSelected ? 'text-blue-400' : 'text-zinc-100'}`}>{getDisplayTitle()}</h4>
          
          <div className="flex items-center gap-1 mt-0.5">
             {isTransfer ? (
                <span className="text-[11px] text-[#a8a8a8] font-normal truncate opacity-60">
                  {fromAccountName} <span className="mx-0.5 opacity-40">→</span> {toAccountName}
                </span>
             ) : (
                <span className="text-[11px] text-[#a8a8a8] leading-tight font-normal truncate uppercase tracking-tight opacity-40">{accountName}</span>
             )}
          </div>

          {transaction.note && (
            <div className="mt-0.5 block">
              <span className="text-[11px] text-zinc-500 font-normal italic leading-tight truncate max-w-full block">"{transaction.note}"</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-center gap-0.5 shrink-0 self-center">
          <span className={`font-medium text-[15px] tracking-tight leading-none whitespace-nowrap ${getAmountColor()}`}>
            {getAmountPrefix()}{transaction.currency} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {preBalance !== undefined && (
            <span className="text-[10px] font-normal text-emerald-500 opacity-50 leading-none whitespace-nowrap mt-1">
              ({transaction.currency} {preBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </span>
          )}
          <span className="text-[9px] font-normal text-[#a8a8a8] opacity-40 uppercase tracking-tighter mt-1">{new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;