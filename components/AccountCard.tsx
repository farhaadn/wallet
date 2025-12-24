import React from 'react';
import { Account } from '../types';
import { Wallet, Landmark, Coins, CreditCard } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Dimensions & Typography:
 * - Card Height: 84px (ثابت)
 * - Card Width: 1/3 grid (تقریبا ۱۳۲ پیکسل در موبایل)
 * - Account Name: 12px (text-[12px]) - قبلاً ۱۱ بود
 * - Balance: 15px (text-[15px]) - قبلاً ۱۳ بود
 * - Currency Label: 10px (text-[10px]) - قبلاً ۹ بود
 */
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
        backgroundColor: isSelected ? `${account.color}15` : '#1c1c1f'
      }}
      className={`relative flex flex-col items-start p-3 rounded-2xl transition-all border text-left h-[84px] w-full
        ${isSelected ? 'scale-95 ring-1 ring-offset-1 ring-offset-[#0e0e10] ring-zinc-800 shadow-[0_0_15px_-5px] shadow-current' : 'hover:border-zinc-700 bg-zinc-900/40'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div style={{ color: account.color }}>{getIcon()}</div>
        <span className="text-[12px] font-bold text-zinc-200 truncate max-w-[75px] uppercase tracking-tight">{account.name}</span>
      </div>
      <div className="mt-auto overflow-hidden w-full">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block leading-none mb-0.5">
          {account.currency}
        </span>
        <span className="text-[15px] font-black text-white tracking-tight leading-tight truncate block">
          {account.balance.toLocaleString(undefined, { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: account.currency === 'IRR' ? 0 : 2 
          })}
        </span>
      </div>
      {isSelected && (
         <div 
          style={{ backgroundColor: account.color }}
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px] shadow-current" 
         />
      )}
    </button>
  );
};

export default AccountCard;