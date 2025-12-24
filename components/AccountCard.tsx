
import React from 'react';
import { Account } from '../types';
import { Wallet, Landmark, Coins, CreditCard } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, isSelected, onClick }) => {
  const getIcon = () => {
    switch (account.type) {
      case 'BANK': return <Landmark className="w-4 h-4 opacity-70" />;
      case 'CASH': return <Wallet className="w-4 h-4 opacity-70" />;
      case 'CRYPTO': return <Coins className="w-4 h-4 opacity-70" />;
      default: return <CreditCard className="w-4 h-4 opacity-70" />;
    }
  };

  return (
    <button
      onClick={onClick}
      style={{ 
        borderColor: isSelected ? account.color : '#27272a',
        backgroundColor: `${account.color}20` // 20 hex is approx 12% opacity
      }}
      className={`relative flex flex-col items-start p-3 rounded-xl transition-all border-2 text-left h-24 w-full
        ${isSelected ? 'scale-95' : 'hover:border-zinc-700 bg-zinc-900'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div style={{ color: account.color }}>{getIcon()}</div>
        <span className="text-xs font-medium text-zinc-300 truncate max-w-[80px]">{account.name}</span>
      </div>
      <div className="mt-auto">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">
          {account.currency}
        </span>
        <span className="text-sm font-bold text-white tracking-tight leading-tight">
          {account.balance.toLocaleString(undefined, { minimumFractionDigits: account.currency === 'IRR' ? 0 : 2 })}
        </span>
      </div>
      {isSelected && (
         <div 
          style={{ backgroundColor: account.color }}
          className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" 
         />
      )}
    </button>
  );
};

export default AccountCard;
