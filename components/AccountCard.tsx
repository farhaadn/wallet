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
      case 'BANK': return <Landmark className="w-3.5 h-3.5 opacity-70" />;
      case 'CASH': return <Wallet className="w-3.5 h-3.5 opacity-70" />;
      case 'CRYPTO': return <Coins className="w-3.5 h-3.5 opacity-70" />;
      default: return <CreditCard className="w-3.5 h-3.5 opacity-70" />;
    }
  };

  return (
    <button
      onClick={onClick}
      style={{ 
        borderColor: isSelected ? account.color : '#27272a',
        backgroundColor: isSelected ? `${account.color}15` : '#18181b40'
      }}
      className={`relative flex flex-col items-start p-2.5 rounded-xl transition-all border text-left h-[72px] w-full
        ${isSelected ? 'scale-95 ring-1 ring-offset-1 ring-offset-[#0e0e10] ring-zinc-800 shadow-[0_0_15px_-5px] shadow-current' : 'hover:border-zinc-700 bg-zinc-900/40'}`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <div style={{ color: account.color }}>{getIcon()}</div>
        <span className="text-[9px] font-bold text-zinc-300 truncate max-w-[60px] uppercase tracking-tighter">{account.name}</span>
      </div>
      <div className="mt-auto overflow-hidden w-full">
        <span className="text-[7px] uppercase tracking-tighter text-zinc-600 font-black block leading-none">
          {account.currency}
        </span>
        <span className="text-[10px] font-black text-white tracking-tighter leading-tight truncate block">
          {account.balance.toLocaleString(undefined, { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: account.currency === 'IRR' ? 0 : 2 
          })}
        </span>
      </div>
      {isSelected && (
         <div 
          style={{ backgroundColor: account.color }}
          className="absolute top-1 right-1 w-1 h-1 rounded-full animate-pulse shadow-[0_0_8px] shadow-current" 
         />
      )}
    </button>
  );
};

export default AccountCard;