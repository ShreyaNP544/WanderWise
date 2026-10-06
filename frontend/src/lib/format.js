const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatINR = (amount) => inr.format(amount || 0);

export const plural = (n, word, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;
