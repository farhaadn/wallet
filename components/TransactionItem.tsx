
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, DollarSign } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  accountName: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, accountName }) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const isTransfer = transaction.type === TransactionType.TRANSFER;

  return (
    <div className="flex items-center gap-4 p-4 border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center 
        ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : isTransfer ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
        {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : isTransfer ? <RefreshCcw className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-zinc-100 font-medium truncate">{transaction.category}</h4>
          <span className={`font-bold ${isIncome ? 'text-emerald-500' : isTransfer ? 'text-blue-500' : 'text-zinc-100'}`}>
            {isIncome ? '+' : isTransfer ? '' : '-'}{transaction.currency} {transaction.amount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <span className="truncate">{accountName}</span>
            {transaction.note && <span className="italic opacity-70 truncate max-w-[150px]">"{transaction.note}"</span>}
          </div>
          <span>{new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
