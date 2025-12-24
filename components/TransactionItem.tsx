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

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const swipeLimit = -180;

  // Long Press Timer
  const longPressTimer = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Start Long Press Timer
    if (onLongPress) {
      longPressTimer.current = window.setTimeout(() => {
        onLongPress();
        // Feedback via vibration if available
        if ('vibrate' in navigator) navigator.vibrate(50);
      }, 600);
    }

    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // If moved more than 10px, it's a swipe, not a long press
    if (Math.abs(diff) > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isSwiping) return;

    // Only allow swiping to the left
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, swipeLimit));
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsSwiping(false);
    
    // Snap logic
    if (swipeOffset < swipeLimit / 2) {
      setSwipeOffset(swipeLimit);
    } else {
      setSwipeOffset(0);
    }
  };

  const closeSwipe = () => setSwipeOffset(0);

  return (
    <div className="relative w-full overflow-hidden bg-[#0e0e10]">
      {/* Background Actions (Revealed underneath) */}
      <div 
        className="absolute inset-y-0 right-0 flex bg-rose-600 transition-opacity duration-200"
        style={{ width: `${Math.abs(swipeLimit)}px`, opacity: swipeOffset < -10 ? 1 : 0 }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onSplit?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/5 active:bg-rose-700"
        >
          <Split className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Split</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onClone?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white border-r border-white/5 active:bg-rose-700"
        >
          <Copy className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Clone</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(); closeSwipe(); }}
          className="flex-1 flex flex-col items-center justify-center text-white active:bg-rose-700"
        >
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Delete</span>
        </button>
      </div>

      {/* Main Content Layer */}
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
        className={`relative z-10 w-full flex items-center gap-4 p-4 border-b border-zinc-900/50 cursor-pointer select-none
          ${isSelected ? 'bg-blue-600/20' : 'bg-[#0e0e10] active:bg-zinc-800/40'}`}
      >
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
          ${isSelected 
            ? 'bg-blue-500 text-white' 
            : (isIncome ? 'bg-emerald-500/10 text-emerald-500' : isTransfer ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')
          }`}
        >
          {isSelected ? (
            <CheckCircle2 className="w-6 h-6 animate-in zoom-in duration-200" />
          ) : (
            isIncome ? <ArrowDownLeft className="w-5 h-5" /> : isTransfer ? <RefreshCcw className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`font-medium truncate ${isSelected ? 'text-blue-400' : 'text-zinc-100'}`}>{transaction.category}</h4>
            <span className={`font-bold ${isIncome ? 'text-emerald-500' : isTransfer ? 'text-blue-500' : (isSelected ? 'text-blue-400' : 'text-zinc-100')}`}>
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
      </div>
    </div>
  );
};

export default TransactionItem;