// Storage helpers
export const LS = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  getRaw: (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
  setRaw: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// Anthropic API
export async function callClaude(apiKey, messages, max_tokens = 1000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens, messages }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return await res.json();
}

// Constants
export const SPORTS = ['Fútbol', 'Basketball', 'Tenis', 'Béisbol', 'NFL', 'MMA', 'Boxeo', 'Hockey', 'Otro'];
export const MOODS = [
  { emoji: '🔥', label: 'Pleno', value: 'focused' },
  { emoji: '😌', label: 'Tranquilo', value: 'calm' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😤', label: 'Frustrado', value: 'tilted' },
  { emoji: '😵', label: 'Perdido', value: 'chasing' },
];

// Format helpers
export const fmt = {
  money: (n) => `${n >= 0 ? '' : '-'}$${Math.abs(n).toFixed(2)}`,
  moneySign: (n) => `${n >= 0 ? '+' : ''}$${n.toFixed(2)}`,
  pct: (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`,
  date: (iso) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
  dateLong: (iso) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
};

// Bet calculations
// A bet has: stake, status ('pending'|'won'|'lost'|'void'), and either:
//   - single: odds (single selection)
//   - parlay: selections (array of {event, sport, pick, odds}), totalOdds is product
export function betOdds(bet) {
  if (bet.type === 'parlay' && bet.selections) {
    return bet.selections.reduce((p, s) => p * parseFloat(s.odds || 1), 1);
  }
  return parseFloat(bet.odds || 0);
}
export function betReturn(bet) {
  if (bet.status !== 'won') return 0;
  return bet.stake * betOdds(bet);
}
export function betProfit(bet) {
  if (bet.status === 'won') return bet.stake * (betOdds(bet) - 1);
  if (bet.status === 'lost') return -bet.stake;
  return 0;
}

// Stats computation
export function computeStats(bets, movements) {
  const deposits = movements.filter(m => m.type === 'deposit').reduce((s, m) => s + m.amount, 0);
  const withdrawals = movements.filter(m => m.type === 'withdrawal').reduce((s, m) => s + m.amount, 0);
  const settled = bets.filter(b => b.status === 'won' || b.status === 'lost');
  const totalStaked = settled.reduce((s, b) => s + b.stake, 0);
  const totalReturn = settled.reduce((s, b) => s + betReturn(b), 0);
  const profit = totalReturn - totalStaked;
  const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
  const wonCount = bets.filter(b => b.status === 'won').length;
  const lostCount = bets.filter(b => b.status === 'lost').length;
  const pendingCount = bets.filter(b => b.status === 'pending').length;
  const winRate = (wonCount + lostCount) > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;
  const pendingStake = bets.filter(b => b.status === 'pending').reduce((s, b) => s + b.stake, 0);
  const bankroll = deposits - withdrawals + profit - pendingStake;
  const avgStake = bets.length > 0 ? bets.reduce((s, b) => s + b.stake, 0) / bets.length : 0;

  // Current streak: consecutive same-result bets from the end
  const sortedSettled = [...settled].sort((a, b) => new Date(a.date) - new Date(b.date));
  let currentStreak = 0;
  let currentStreakType = null;
  for (let i = sortedSettled.length - 1; i >= 0; i--) {
    if (currentStreakType === null) {
      currentStreakType = sortedSettled[i].status;
      currentStreak = 1;
    } else if (sortedSettled[i].status === currentStreakType) {
      currentStreak++;
    } else break;
  }

  // Best/worst historical streak
  let bestWinStreak = 0, bestLossStreak = 0, tmpW = 0, tmpL = 0;
  sortedSettled.forEach(b => {
    if (b.status === 'won') { tmpW++; tmpL = 0; bestWinStreak = Math.max(bestWinStreak, tmpW); }
    else if (b.status === 'lost') { tmpL++; tmpW = 0; bestLossStreak = Math.max(bestLossStreak, tmpL); }
  });

  return {
    deposits, withdrawals, totalStaked, totalReturn, profit, roi,
    wonCount, lostCount, pendingCount, winRate, pendingStake, bankroll,
    avgStake, currentStreak, currentStreakType, bestWinStreak, bestLossStreak,
  };
}

// Stats grouped by key extractor
export function groupStats(bets, keyFn) {
  const groups = {};
  bets.filter(b => b.status === 'won' || b.status === 'lost').forEach(b => {
    const k = keyFn(b);
    if (!k) return;
    if (!groups[k]) groups[k] = { key: k, staked: 0, returned: 0, won: 0, lost: 0 };
    groups[k].staked += b.stake;
    groups[k].returned += betReturn(b);
    if (b.status === 'won') groups[k].won++;
    else groups[k].lost++;
  });
  return Object.values(groups).map(g => ({
    ...g,
    profit: g.returned - g.staked,
    roi: g.staked > 0 ? ((g.returned - g.staked) / g.staked) * 100 : 0,
  })).sort((a, b) => b.profit - a.profit);
}

// Bankroll evolution over time
export function bankrollEvolution(bets, movements) {
  const events = [];
  movements.forEach(m => events.push({ date: m.date, delta: m.type === 'deposit' ? m.amount : -m.amount, type: 'mov' }));
  bets.filter(b => b.status === 'won' || b.status === 'lost').forEach(b => {
    events.push({ date: b.date, delta: betProfit(b), type: 'bet' });
  });
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  return events.map(e => {
    running += e.delta;
    return { date: e.date, value: running };
  });
}

// Monthly aggregation
export function monthlyStats(bets) {
  const months = {};
  bets.filter(b => b.status === 'won' || b.status === 'lost').forEach(b => {
    const m = b.date.substring(0, 7); // YYYY-MM
    if (!months[m]) months[m] = { month: m, staked: 0, profit: 0, won: 0, lost: 0 };
    months[m].staked += b.stake;
    months[m].profit += betProfit(b);
    if (b.status === 'won') months[m].won++;
    else months[m].lost++;
  });
  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
}

// Today's bets
export function todayBets(bets) {
  const today = new Date().toISOString().split('T')[0];
  return bets.filter(b => b.date === today);
}

// Kelly criterion: optimal stake as fraction of bankroll
// f = (bp - q) / b where b=odds-1, p=win prob, q=1-p
export function kellyStake(bankroll, odds, winProb, fraction = 0.25) {
  if (odds <= 1 || winProb <= 0 || winProb >= 1 || bankroll <= 0) return 0;
  const b = odds - 1;
  const q = 1 - winProb;
  const f = (b * winProb - q) / b;
  if (f <= 0) return 0;
  return Math.max(0, bankroll * f * fraction); // quarter Kelly by default (more conservative)
}

// CSV export
export function toCSV(bets) {
  const headers = ['id', 'date', 'type', 'event', 'sport', 'bookmaker', 'pick', 'odds', 'stake', 'status', 'profit', 'notes'];
  const rows = bets.map(b => [
    b.id, b.date, b.type || 'single',
    (b.type === 'parlay' ? b.selections?.map(s => s.event).join(' | ') : b.event) || '',
    (b.type === 'parlay' ? b.selections?.map(s => s.sport).join(' | ') : b.sport) || '',
    b.bookmaker || '',
    (b.type === 'parlay' ? b.selections?.map(s => s.pick).join(' | ') : b.pick) || '',
    betOdds(b).toFixed(2),
    b.stake, b.status, betProfit(b).toFixed(2), (b.notes || '').replace(/"/g, '""'),
  ]);
  return [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
}

// Parse CSV back into bets
export function fromCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const cells = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) { cells.push(cur); cur = ''; }
      else cur += c;
    }
    cells.push(cur);
    const obj = {};
    headers.forEach((h, i) => obj[h] = cells[i]);
    return {
      id: obj.id || Date.now().toString() + Math.random(),
      date: obj.date,
      type: obj.type || 'single',
      event: obj.event,
      sport: obj.sport,
      bookmaker: obj.bookmaker || '',
      pick: obj.pick,
      odds: parseFloat(obj.odds) || 0,
      stake: parseFloat(obj.stake) || 0,
      status: obj.status || 'pending',
      notes: obj.notes || '',
    };
  });
}

export function downloadFile(content, filename, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
