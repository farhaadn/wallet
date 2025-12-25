import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Split, Copy, Trash2, ShoppingBag, Scissors, Landmark, ReceiptText, Utensils } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  accountName: string;
  preBalance?: number;
  onClick?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  onSplit?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  accountName, 
  preBalance,
  onClick, 
  onDelete, 
  onClone,
  onSplit,
  onLongPress,
  isSelected
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
  const displayTitle = transaction.subCategory || transaction.category;

  const getCategoryIcon = () => {
    const cat = transaction.category.toLowerCase();
    if (cat.includes('shopping')) return <ShoppingBag className="w-4.5 h-4.5" />;
    if (cat.includes('hair') || cat.includes('health')) return <Scissors className="w-4.5 h-4.5" />;
    if (cat.includes('grocer') || cat.includes('food')) return <Utensils className="w-4.5 h-4.5" />;
    if (cat.includes('loan')) return <ReceiptText className="w-4.5 h-4.5" />;
    if (isIncome) return <ArrowDownLeft className="w-4.5 h-4.5" />;
    if (isTransfer) return <RefreshCcw className="w-4.5 h-4.5" />;
    return <ArrowUpRight className="w-4.5 h-4.5" />;
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#1e1e1e]">
      <div className="absolute inset-y-0 right-0 flex bg-rose-600 transition-opacity duration-200" style={{ width: `${Math.abs(swipeLimit)}px`, opacity: swipeOffset < -10 ? 1 : 0 }}>
        <button onClick={(e) => { e.stopPropagation(); onSplit?.(); closeSwipe(); }} className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/5 active:bg-rose-700"><Split className="w-4 h-4 mb-1" /><span className="text-[9px] font-bold uppercase">Split</span></button>
        <button onClick={(e) => { e.stopPropagation(); onClone?.(); closeSwipe(); }} className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/5 active:bg-rose-700"><Copy className="w-4 h-4 mb-1" /><span className="text-[9px] font-bold uppercase">Clone</span></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete?.(); closeSwipe(); }} className="flex-1 flex flex-col items-center justify-center text-white active:bg-rose-700"><Trash2 className="w-4 h-4 mb-1" /><span className="text-[9px] font-bold uppercase">Delete</span></button>
      </div>

      <div 
        onClick={() => (swipeOffset !== 0 ? closeSwipe() : onClick?.())}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)`, transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        className={`relative z-10 w-full flex items-center gap-3.5 px-4 py-3 border-b border-[#0e0e10]/30 cursor-pointer select-none min-h-[86px] ${isSelected ? 'bg-blue-600/20' : 'bg-[#1e1e1e] active:bg-zinc-800/40'}`}
      >
        <div className="relative flex-shrink-0 self-start mt-0.5">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${isIncome ? 'bg-emerald-500/80 text-white' : isTransfer ? 'bg-blue-500/80 text-white' : 'bg-rose-500/80 text-white'}`} style={{ backgroundColor: transaction.category.toLowerCase().includes('loan') ? '#06b6d4cc' : undefined }}>{getCategoryIcon()}</div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-start pr-1">
          <h4 className={`font-normal text-[16px] leading-tight truncate ${isSelected ? 'text-blue-400' : 'text-zinc-100'}`}>{displayTitle}</h4>
          <span className="text-[12px] text-[#a8a8a8] leading-tight font-medium mt-0.5 truncate uppercase tracking-tight opacity-50">{accountName}</span>
          {transaction.note && (
            <div className="mt-1 block">
              <span className="text-[13px] text-zinc-400 font-normal italic leading-snug break-words line-clamp-2">"{transaction.note}"</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-start gap-0.5 shrink-0 self-start mt-0.5">
          <span className={`font-medium text-[16px] tracking-tight leading-none whitespace-nowrap ${isIncome ? 'text-emerald-500' : isTransfer ? 'text-blue-500' : 'text-rose-500'}`}>{isIncome ? '' : isTransfer ? '' : '-'}{transaction.currency} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          {preBalance !== undefined && (<span className={`text-[11px] font-medium opacity-40 leading-none whitespace-nowrap ${isIncome ? 'text-emerald-500' : isTransfer ? 'text-blue-500' : 'text-rose-500'}`}>({transaction.currency} {preBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>)}
          <span className="text-[10px] font-medium text-[#a8a8a8] opacity-30 uppercase tracking-tighter mt-1">{new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;