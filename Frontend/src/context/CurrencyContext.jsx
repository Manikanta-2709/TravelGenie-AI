import React, { createContext, useContext, useState, useEffect } from 'react';

export const CURRENCIES = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rate: 1, // Base currency
    flag: '🇮🇳',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 0.012, // 1 USD ≈ 83.3 INR
    flag: '🇺🇸',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rate: 0.011, // 1 EUR ≈ 90.9 INR
    flag: '🇪🇺',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rate: 0.0095, // 1 GBP ≈ 105.2 INR
    flag: '🇬🇧',
  },
};

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('INR');

  // Helper to convert base INR amount to active currency number
  const convert = (inrAmount) => {
    const num = Number(inrAmount) || 0;
    const rate = CURRENCIES[currency]?.rate || 1;
    return Math.round(num * rate);
  };

  // Helper to format an INR base number into current currency display string
  const formatPrice = (inrAmount, options = {}) => {
    // If string has currency already or needs numeric extraction
    let numeric = inrAmount;
    if (typeof inrAmount === 'string') {
      const cleaned = inrAmount.replace(/[^0-9.]/g, '');
      numeric = parseFloat(cleaned) || 0;
    }

    const cur = CURRENCIES[currency] || CURRENCIES.INR;
    const converted = Math.round(numeric * cur.rate);

    if (options.noSymbol) {
      return converted.toLocaleString('en-US');
    }

    if (currency === 'INR') {
      return `₹${converted.toLocaleString('en-IN')}`;
    }
    return `${cur.symbol}${converted.toLocaleString('en-US')}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencies: CURRENCIES, convert, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
