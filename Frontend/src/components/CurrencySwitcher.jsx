import React from 'react';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { Coins } from 'lucide-react';

export default function CurrencySwitcher({ compact = false }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-1 bg-[#071A1D] border border-[#214A47] p-1 rounded-xl shadow-inner">
      {!compact && (
        <span className="pl-2 pr-1 text-[#35E6A1] flex items-center gap-1 text-[11px] font-bold">
          <Coins className="w-3.5 h-3.5" />
        </span>
      )}
      {Object.values(CURRENCIES).map((c) => {
        const isSelected = currency === c.code;
        return (
          <button
            key={c.code}
            type="button"
            onClick={() => setCurrency(c.code)}
            title={`${c.name} (${c.code})`}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              isSelected
                ? 'bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] text-[#071A1D] font-extrabold shadow-sm scale-105'
                : 'text-[#B9C9C6] hover:text-white hover:bg-[#0B2426]'
            }`}
          >
            <span>{c.symbol}</span>
            <span className="text-[10px] uppercase">{c.code}</span>
          </button>
        );
      })}
    </div>
  );
}
