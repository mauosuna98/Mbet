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
export const MARKETS = [
  'Ganador',
  'Ganador (incl. extra innings)',
  'Over/Under',
  'Hándicap',
  'Ambos anotan',
  'Doble oportunidad',
  'Marcador exacto',
  'Prop jugador',
  'Prop equipo',
  'Otro',
];
export const MOODS = [
  { emoji: '🔥', label: 'Pleno', value: 'focused' },
  { emoji: '😌', label: 'Tranquilo', value: 'calm' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😤', label: 'Frustrado', value: 'tilted' },
  { emoji: '😵', label: 'Perdido', value: 'chasing' },
];

// Parse "Team A vs Team B" into home/away
export function parseVs(text) {
  if (!text) return { home: '', away: '' };
  const m = text.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (m) return { home: m[1].trim(), away: m[2].trim() };
  return { home: text.trim(), away: '' };
}

// Convert decimal odds to American format
export function toAmerican(decimal) {
  const d = parseFloat(decimal);
  if (!d || d <= 1) return '—';
  if (d >= 2) {
    return '+' + Math.round((d - 1) * 100);
  } else {
    return '-' + Math.round(100 / (d - 1));
  }
}

// Convert American odds to decimal
// Accepts: "+150", "-200", "150" (positive implied), "+100" (even), etc.
// Returns decimal (e.g., 2.50) or 0 if invalid
export function fromAmerican(american) {
  if (american === null || american === undefined || american === '') return 0;
  const str = String(american).trim().replace(/\s+/g, '');
  if (!str) return 0;
  // Parse the sign + number
  const match = str.match(/^([+-]?)(\d+(?:\.\d+)?)$/);
  if (!match) return 0;
  const sign = match[1] || '+';
  const num = parseFloat(match[2]);
  if (!num || num < 100) return 0; // American odds minimum is +100 / -100
  if (sign === '+') {
    return +(1 + num / 100).toFixed(4);
  } else {
    return +(1 + 100 / num).toFixed(4);
  }
}

// Validates an American odds string (for input validation)
export function isValidAmerican(str) {
  if (!str) return false;
  const trimmed = String(str).trim();
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) return false;
  const decimal = fromAmerican(trimmed);
  return decimal > 1; // must produce a valid decimal odd > 1
}

// Format helpers
export const fmt = {
  money: (n) => `${n >= 0 ? '' : '-'}$${Math.abs(n).toFixed(2)}`,
  moneySign: (n) => `${n >= 0 ? '+' : ''}$${n.toFixed(2)}`,
  pct: (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`,
  odds: (decimal) => toAmerican(decimal),
  date: (iso) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
  dateLong: (iso) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
};

// Bet calculations
// A bet has: stake, status ('pending'|'won'|'lost'|'void'|'cashout'), bonus (optional), and:
//   - single: odds
//   - parlay/sgp: selections[] with odds each (parlay multiplies, sgp can use totalOdds override)
export function betOdds(bet) {
  if ((bet.type === 'parlay' || bet.type === 'sgp') && bet.selections) {
    if (bet.totalOdds) return parseFloat(bet.totalOdds);
    return bet.selections.reduce((p, s) => p * parseFloat(s.odds || 1), 1);
  }
  return parseFloat(bet.odds || 0);
}
export function betReturn(bet) {
  if (bet.status === 'won') return bet.stake * betOdds(bet) + (parseFloat(bet.bonus) || 0);
  if (bet.status === 'cashout') return bet.cashoutAmount || 0;
  return 0;
}
export function betProfit(bet) {
  if (bet.status === 'won') return bet.stake * (betOdds(bet) - 1) + (parseFloat(bet.bonus) || 0);
  if (bet.status === 'lost') return -bet.stake;
  if (bet.status === 'cashout') return (bet.cashoutAmount || 0) - bet.stake;
  return 0;
}

// Stats computation
export function computeStats(bets, movements) {
  const deposits = movements.filter(m => m.type === 'deposit').reduce((s, m) => s + m.amount, 0);
  const withdrawals = movements.filter(m => m.type === 'withdrawal').reduce((s, m) => s + m.amount, 0);
  const settled = bets.filter(b => b.status === 'won' || b.status === 'lost' || b.status === 'cashout');
  const totalStaked = settled.reduce((s, b) => s + b.stake, 0);
  const totalReturn = settled.reduce((s, b) => s + betReturn(b), 0);
  const profit = totalReturn - totalStaked;
  const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
  const wonCount = bets.filter(b => b.status === 'won').length;
  const lostCount = bets.filter(b => b.status === 'lost').length;
  const cashoutCount = bets.filter(b => b.status === 'cashout').length;
  const pendingCount = bets.filter(b => b.status === 'pending').length;
  // Cashouts con profit > 0 cuentan como win, <= 0 como loss
  const cashoutWins = bets.filter(b => b.status === 'cashout' && betProfit(b) > 0).length;
  const cashoutLosses = bets.filter(b => b.status === 'cashout' && betProfit(b) <= 0).length;
  const totalWins = wonCount + cashoutWins;
  const totalLosses = lostCount + cashoutLosses;
  const winRate = (totalWins + totalLosses) > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0;
  const pendingStake = bets.filter(b => b.status === 'pending').reduce((s, b) => s + b.stake, 0);
  const bankroll = deposits - withdrawals + profit - pendingStake;
  const avgStake = bets.length > 0 ? bets.reduce((s, b) => s + b.stake, 0) / bets.length : 0;

  // Current streak based on profit/loss (not just status)
  const sortedSettled = [...settled].sort((a, b) => new Date(a.date) - new Date(b.date));
  let currentStreak = 0;
  let currentStreakType = null;
  for (let i = sortedSettled.length - 1; i >= 0; i--) {
    const isWin = betProfit(sortedSettled[i]) > 0;
    const type = isWin ? 'won' : 'lost';
    if (currentStreakType === null) {
      currentStreakType = type;
      currentStreak = 1;
    } else if (type === currentStreakType) {
      currentStreak++;
    } else break;
  }

  // Best/worst historical streak
  let bestWinStreak = 0, bestLossStreak = 0, tmpW = 0, tmpL = 0;
  sortedSettled.forEach(b => {
    const isWin = betProfit(b) > 0;
    if (isWin) { tmpW++; tmpL = 0; bestWinStreak = Math.max(bestWinStreak, tmpW); }
    else { tmpL++; tmpW = 0; bestLossStreak = Math.max(bestLossStreak, tmpL); }
  });

  return {
    deposits, withdrawals, totalStaked, totalReturn, profit, roi,
    wonCount, lostCount, cashoutCount, pendingCount, winRate, pendingStake, bankroll,
    avgStake, currentStreak, currentStreakType, bestWinStreak, bestLossStreak,
  };
}

// Stats grouped by key extractor
export function groupStats(bets, keyFn) {
  const groups = {};
  bets.filter(b => b.status === 'won' || b.status === 'lost' || b.status === 'cashout').forEach(b => {
    const k = keyFn(b);
    if (!k) return;
    if (!groups[k]) groups[k] = { key: k, staked: 0, returned: 0, won: 0, lost: 0 };
    groups[k].staked += b.stake;
    groups[k].returned += betReturn(b);
    const isWin = betProfit(b) > 0;
    if (isWin) groups[k].won++;
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
  bets.filter(b => b.status === 'won' || b.status === 'lost' || b.status === 'cashout').forEach(b => {
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
  bets.filter(b => b.status === 'won' || b.status === 'lost' || b.status === 'cashout').forEach(b => {
    const m = b.date.substring(0, 7); // YYYY-MM
    if (!months[m]) months[m] = { month: m, staked: 0, profit: 0, won: 0, lost: 0 };
    months[m].staked += b.stake;
    months[m].profit += betProfit(b);
    const isWin = betProfit(b) > 0;
    if (isWin) months[m].won++;
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
// Display helpers
export function betTitle(bet) {
  if (bet.type === 'sgp' && bet.home && bet.away) return `SGP: ${bet.home} vs ${bet.away}`;
  if (bet.type === 'parlay') return `Parlay (${bet.selections?.length || 0})`;
  if (bet.home && bet.away) return `${bet.home} vs ${bet.away}`;
  return bet.event || '—';
}

export function selectionTitle(sel) {
  if (sel.home && sel.away) return `${sel.home} vs ${sel.away}`;
  return sel.event || '—';
}

export function pickLabel(pick, line) {
  const parts = [];
  if (line) parts.push(line);
  if (pick) parts.push(pick);
  return parts.join(' ');
}

export function toCSV(bets) {
  const headers = ['id', 'date', 'type', 'home', 'away', 'event', 'sport', 'bookmaker', 'market', 'line', 'pick', 'odds', 'stake', 'status', 'bonus', 'cashout', 'profit', 'notes'];
  const rows = bets.map(b => [
    b.id, b.date, b.type || 'single',
    b.home || '', b.away || '',
    betTitle(b),
    (b.type === 'parlay' ? b.selections?.map(s => s.sport).join(' | ') : b.sport) || '',
    b.bookmaker || '',
    b.market || '',
    b.line || '',
    (b.type === 'parlay' || b.type === 'sgp' ? b.selections?.map(s => s.pick).join(' | ') : b.pick) || '',
    betOdds(b).toFixed(2),
    b.stake, b.status,
    b.bonus || '',
    b.cashoutAmount || '',
    betProfit(b).toFixed(2),
    (b.notes || '').replace(/"/g, '""'),
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
