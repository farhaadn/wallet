import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Split, Copy, Trash2, CheckCircle2 } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  accountName: string;
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
  onClick, 
  onDelete, 
  onClone,
  onSplit,
  onLongPress,
  isSelected
}) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const isTransfer = transaction.type === TransactionType.TRANSFER;
  const isExpense = transaction.type === TransactionType.EXPENSE;

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

    // If movement is detected (scroll or swipe), clear the long press timer
    if ((Math.abs(diffX) > 8 || Math.abs(diffY) > 8) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isSwiping) return;

    // Only allow horizontal swiping if not scrolling vertically much
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        setSwipeOffset(Math.max(diffX, swipeLimit));
      } else {
        setSwipeOffset(0);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsSwiping(false);
    if (swipeOffset < swipeLimit / 2) {
      setSwipeOffset(swipeLimit);
    } else {
      setSwipeOffset(0);
    }
  };

  const closeSwipe = () => setSwipeOffset(0);

  const displayTitle = transaction.subCategory || transaction.category;

  return (
    <div className="relative w-full overflow-hidden bg-[#1e1e1e]">
      <div 
        className="absolute inset-y-0 right-0 flex bg-rose-600 transition-opacity duration-200"
        style={{ width: `${Math.abs(swipeLimit)}px`, opacity: swipeOffset < -10 ? 1 : 0 }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onSplit?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/5 active:bg-rose-700"
        >
          <Split className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-bold uppercase">Split</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onClone?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/5 active:bg-rose-700"
        >
          <Copy className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-bold uppercase">Clone</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white active:bg-rose-700"
        >
          <Trash2 className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-bold uppercase">Delete</span>
        </button>
      </div>

      <div 
        onClick={() => {
          if (swipeOffset !== 0) {
            closeSwipe();
          } else {
            onClick?.();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className={`relative z-10 w-full flex items-center gap-4 px-4 py-2 border-b border-[#0e0e10]/40 cursor-pointer select-none h-[74px]
          ${isSelected ? 'bg-blue-600/20' : 'bg-[#1e1e1e] active:bg-zinc-800/40'}`}
      >
        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
          ${isSelected 
            ? 'bg-blue-500 text-white' 
            : (isIncome ? 'bg-emerald-500/10 text-emerald-500' : isTransfer ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500')
          }`}
        >
          {isSelected ? (
            <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-200" />
          ) : (
            isIncome ? <ArrowDownLeft className="w-4 h-4" /> : isTransfer ? <RefreshCcw className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center h-full gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`font-bold text-[14px] truncate ${isSelected ? 'text-blue-400' : 'text-zinc-100'}`}>
              {displayTitle}
            </h4>
            <span className={`font-black text-[14px] shrink-0 tracking-tight ${
              isIncome ? 'text-emerald-500' : 
              isTransfer ? 'text-blue-500' : 
              'text-rose-500'
            }`}>
              {isIncome ? '+' : isTransfer ? '' : '−'}{transaction.currency} {transaction.amount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase">
            <span className="truncate opacity-70 tracking-tight">{accountName}</span>
            <span className="shrink-0 ml-2 tracking-tighter opacity-60">
              {new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="h-[12px] flex items-center">
            {transaction.note ? (
              <span className="text-[10px] text-zinc-400 truncate opacity-50 font-medium italic">
                "{transaction.note}"
              </span>
            ) : (
              <div className="w-0 h-0 invisible" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;