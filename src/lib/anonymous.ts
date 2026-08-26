/**
 * Google Docs style Anonymous Animal Generator for anonymous voting.
 */

export interface AnonymousIdentity {
  name: string;
  color: string;
  bgClass: string;
  borderClass: string;
  emoji: string;
}

const ANIMALS = [
  { name: 'Anonimowy Borsuk', emoji: '🦡', color: '#10B981', bgClass: 'bg-emerald-500/20', borderClass: 'border-emerald-500' },
  { name: 'Anonimowy Wilk', emoji: '🐺', color: '#3B82F6', bgClass: 'bg-blue-500/20', borderClass: 'border-blue-500' },
  { name: 'Anonimowy Lis', emoji: '🦊', color: '#F97316', bgClass: 'bg-orange-500/20', borderClass: 'border-orange-500' },
  { name: 'Anonimowy Jeż', emoji: '🦔', color: '#8B5CF6', bgClass: 'bg-purple-500/20', borderClass: 'border-purple-500' },
  { name: 'Anonimowy Sokół', emoji: '🦅', color: '#06B6D4', bgClass: 'bg-cyan-500/20', borderClass: 'border-cyan-500' },
  { name: 'Anonimowy Bóbr', emoji: '🦫', color: '#D97706', bgClass: 'bg-amber-500/20', borderClass: 'border-amber-500' },
  { name: 'Anonimowy Ryś', emoji: '🐱', color: '#EC4899', bgClass: 'bg-pink-500/20', borderClass: 'border-pink-500' },
  { name: 'Anonimowy Niedźwiedź', emoji: '🐻', color: '#92400E', bgClass: 'bg-amber-800/20', borderClass: 'border-amber-700' },
  { name: 'Anonimowy Dzięcioł', emoji: '🐦', color: '#EF4444', bgClass: 'bg-red-500/20', borderClass: 'border-red-500' },
  { name: 'Anonimowy Orzeł', emoji: '🦅', color: '#EAB308', bgClass: 'bg-yellow-500/20', borderClass: 'border-yellow-500' },
  { name: 'Anonimowy Wydra', emoji: '🦦', color: '#14B8A6', bgClass: 'bg-teal-500/20', borderClass: 'border-teal-500' },
  { name: 'Anonimowy Kruk', emoji: '🐦‍⬛', color: '#6366F1', bgClass: 'bg-indigo-500/20', borderClass: 'border-indigo-500' },
  { name: 'Anonimowy Delfin', emoji: '🐬', color: '#0284C7', bgClass: 'bg-sky-500/20', borderClass: 'border-sky-500' },
  { name: 'Anonimowy Łoś', emoji: '🫎', color: '#A855F7', bgClass: 'bg-purple-600/20', borderClass: 'border-purple-500' },
  { name: 'Anonimowy Żubr', emoji: '🦬', color: '#78350F', bgClass: 'bg-stone-500/20', borderClass: 'border-stone-500' },
  { name: 'Anonimowy Szop', emoji: '🦝', color: '#64748B', bgClass: 'bg-slate-500/20', borderClass: 'border-slate-500' },
  { name: 'Anonimowy Chomik', emoji: '🐹', color: '#F59E0B', bgClass: 'bg-amber-400/20', borderClass: 'border-amber-400' },
  { name: 'Anonimowy Zając', emoji: '🐇', color: '#84CC16', bgClass: 'bg-lime-500/20', borderClass: 'border-lime-500' },
  { name: 'Anonimowy Pelikan', emoji: '🦤', color: '#F43F5E', bgClass: 'bg-rose-500/20', borderClass: 'border-rose-500' },
  { name: 'Anonimowy Kameleon', emoji: '🦎', color: '#22C55E', bgClass: 'bg-green-500/20', borderClass: 'border-green-500' },
  { name: 'Anonimowy Pingwin', emoji: '🐧', color: '#38BDF8', bgClass: 'bg-sky-400/20', borderClass: 'border-sky-400' },
  { name: 'Anonimowy Kangur', emoji: '🦘', color: '#FB923C', bgClass: 'bg-orange-400/20', borderClass: 'border-orange-400' },
  { name: 'Anonimowy Lemur', emoji: '🐒', color: '#C084FC', bgClass: 'bg-purple-400/20', borderClass: 'border-purple-400' },
  { name: 'Anonimowy Koala', emoji: '🐨', color: '#94A3B8', bgClass: 'bg-slate-400/20', borderClass: 'border-slate-400' },
  { name: 'Anonimowy Panda', emoji: '🐼', color: '#E2E8F0', bgClass: 'bg-slate-300/20', borderClass: 'border-slate-300' },
  { name: 'Anonimowy Foka', emoji: '🦭', color: '#2DD4BF', bgClass: 'bg-teal-400/20', borderClass: 'border-teal-400' },
  { name: 'Anonimowy Sowa', emoji: '🦉', color: '#B45309', bgClass: 'bg-amber-700/20', borderClass: 'border-amber-600' },
  { name: 'Anonimowy Flaming', emoji: '🦩', color: '#FB7185', bgClass: 'bg-rose-400/20', borderClass: 'border-rose-400' },
  { name: 'Anonimowy Żółw', emoji: '🐢', color: '#16A34A', bgClass: 'bg-green-600/20', borderClass: 'border-green-600' },
  { name: 'Anonimowy Kret', emoji: '🦔', color: '#475569', bgClass: 'bg-slate-600/20', borderClass: 'border-slate-600' },
];

/**
 * Computes a stable hash for a string.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Returns a stable anonymous identity for a Steam ID.
 */
export function getAnonymousIdentity(targetSteamId: string): AnonymousIdentity {
  const hash = hashString(targetSteamId);
  const index = hash % ANIMALS.length;
  return ANIMALS[index];
}
