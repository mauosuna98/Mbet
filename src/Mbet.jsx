import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Plus, Minus, Camera, Brain, BarChart3, Trophy, Target, DollarSign, Activity, X, Loader, Sparkles, ArrowUpRight, ArrowDownRight, Settings, Key, Flame, Snowflake, Calendar, TrendingUp, AlertTriangle, CheckCircle, Filter } from 'lucide-react';
import { LS, callClaude, SPORTS, fmt, computeStats, groupStats, bankrollEvolution, monthlyStats, todayBets, betProfit, betOdds } from './utils';
import { Kpi, ActionBtn, ModalShell, BetRow, LineChart, styles } from './components';
import { BetModal, MovementModal, TicketModal, SettingsModal, CloseDayModal, CashoutModal, WinBonusModal } from './modals';

export default function Mbet() {
  const [tab, setTab] = useState('dashboard');
  const [bets, setBets] = useState([]);
  const [movements, setMovements] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [limits, setLimits] = useState({ dailyLimit: null, weeklyLimit: null, stopLossPct: null });
  const [dayClosings, setDayClosings] = useState([]);

  const [showBetModal, setShowBetModal] = useState(false);
  const [showMovModal, setShowMovModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCloseDay, setShowCloseDay] = useState(false);
  const [cashoutBet, setCashoutBet] = useState(null);
  const [winBonusBet, setWinBonusBet] = useState(null);

  // Filters for bets tab
  const [filters, setFilters] = useState({ sport: '', status: '', bookmaker: '', from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setBets(LS.get('mbet:bets') || []);
    setMovements(LS.get('mbet:movements') || []);
    setApiKey(LS.getRaw('mbet:apiKey') || '');
    setLimits(LS.get('mbet:limits') || { dailyLimit: null, weeklyLimit: null, stopLossPct: null });
    setDayClosings(LS.get('mbet:dayClosings') || []);
  }, []);

  const saveBets = (next) => { setBets(next); LS.set('mbet:bets', next); };
  const saveMovs = (next) => { setMovements(next); LS.set('mbet:movements', next); };
  const saveApiKey = (k) => { setApiKey(k); LS.setRaw('mbet:apiKey', k); };
  const saveLimits = (l) => { setLimits(l); LS.set('mbet:limits', l); };
  const saveDayClosings = (d) => { setDayClosings(d); LS.set('mbet:dayClosings', d); };

  const stats = useMemo(() => computeStats(bets, movements), [bets, movements]);
  const sportStats = useMemo(() => groupStats(bets, b => {
    if (b.type === 'parlay') return 'Parlay';
    if (b.type === 'sgp') return b.sport || 'SGP';
    return b.sport;
  }), [bets]);
  const bookmakerStats = useMemo(() => groupStats(bets, b => b.bookmaker || null), [bets]);
  const bankrollData = useMemo(() => bankrollEvolution(bets, movements), [bets, movements]);
  const monthly = useMemo(() => monthlyStats(bets), [bets]);
  const todays = useMemo(() => todayBets(bets), [bets]);

  // Today & week stats
  const today = new Date().toISOString().split('T')[0];
  const todayStats = useMemo(() => {
    const list = todays;
    const won = list.filter(b => b.status === 'won').length;
    const lost = list.filter(b => b.status === 'lost').length;
    const staked = list.reduce((s, b) => s + b.stake, 0);
    const profit = list.reduce((s, b) => s + betProfit(b), 0);
    return { count: list.length, won, lost, staked, profit };
  }, [todays]);

  const weekStats = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const since = d.toISOString().split('T')[0];
    const list = bets.filter(b => b.date >= since);
    const staked = list.reduce((s, b) => s + b.stake, 0);
    const profit = list.reduce((s, b) => s + betProfit(b), 0);
    return { count: list.length, staked, profit };
  }, [bets]);

  const prevWeekStats = useMemo(() => {
    const d1 = new Date(); d1.setDate(d1.getDate() - 14);
    const d2 = new Date(); d2.setDate(d2.getDate() - 7);
    const from = d1.toISOString().split('T')[0];
    const to = d2.toISOString().split('T')[0];
    const list = bets.filter(b => b.date >= from && b.date < to);
    return { profit: list.reduce((s, b) => s + betProfit(b), 0) };
  }, [bets]);

  // Alerts
  const alerts = useMemo(() => {
    const a = [];
    if (limits.dailyLimit && todayStats.staked >= limits.dailyLimit * 0.8) {
      a.push({ level: todayStats.staked >= limits.dailyLimit ? 'danger' : 'warn',
        msg: todayStats.staked >= limits.dailyLimit
          ? `🛑 Alcanzaste tu límite diario ($${limits.dailyLimit})`
          : `⚠️ Llevas ${((todayStats.staked / limits.dailyLimit) * 100).toFixed(0)}% de tu límite diario` });
    }
    if (limits.weeklyLimit && weekStats.staked >= limits.weeklyLimit * 0.8) {
      a.push({ level: weekStats.staked >= limits.weeklyLimit ? 'danger' : 'warn',
        msg: weekStats.staked >= limits.weeklyLimit
          ? `🛑 Alcanzaste tu límite semanal ($${limits.weeklyLimit})`
          : `⚠️ Llevas ${((weekStats.staked / limits.weeklyLimit) * 100).toFixed(0)}% de tu límite semanal` });
    }
    if (stats.currentStreakType === 'lost' && stats.currentStreak >= 3) {
      a.push({ level: 'warn', msg: `❄️ Racha de ${stats.currentStreak} perdidas — considera pausar` });
    }
    if (limits.stopLossPct && todayStats.profit < 0 && stats.bankroll > 0) {
      const lossPct = Math.abs(todayStats.profit) / (stats.bankroll - todayStats.profit) * 100;
      if (lossPct >= limits.stopLossPct) {
        a.push({ level: 'danger', msg: `🛑 Stop-loss activado: perdiste ${lossPct.toFixed(0)}% hoy` });
      }
    }
    return a;
  }, [limits, todayStats, weekStats, stats]);

  // Last used bookmaker
  const lastBookmaker = useMemo(() => {
    const withBm = bets.filter(b => b.bookmaker).slice(-1)[0];
    return withBm?.bookmaker || '';
  }, [bets]);

  // Filtered bets
  const filteredBets = useMemo(() => {
    return bets.filter(b => {
      if (filters.sport) {
        if (filters.sport === 'Parlay' && b.type !== 'parlay') return false;
        else if (filters.sport === 'SGP' && b.type !== 'sgp') return false;
        else if (filters.sport !== 'Parlay' && filters.sport !== 'SGP' && b.sport !== filters.sport) return false;
      }
      if (filters.status && b.status !== filters.status) return false;
      if (filters.bookmaker && b.bookmaker !== filters.bookmaker) return false;
      if (filters.from && b.date < filters.from) return false;
      if (filters.to && b.date > filters.to) return false;
      return true;
    });
  }, [bets, filters]);

  const uniqueBookmakers = [...new Set(bets.map(b => b.bookmaker).filter(Boolean))];

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #0f1a14 0%, #060806 60%)', color: '#e8e6df', fontFamily: 'ui-sans-serif, system-ui, sans-serif', paddingBottom: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;600&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; }
        .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .card { background: linear-gradient(180deg, rgba(20,28,22,0.9), rgba(12,16,13,0.9)); border: 1px solid rgba(212,175,55,0.12); border-radius: 14px; backdrop-filter: blur(10px); }
        .gold { color: #d4af37; }
        button { font-family: 'Inter', sans-serif; cursor: pointer; }
        input, select, textarea { font-family: 'Inter', sans-serif; background: rgba(0,0,0,0.4); border: 1px solid rgba(212,175,55,0.2); color: #e8e6df; padding: 12px 14px; border-radius: 10px; width: 100%; outline: none; font-size: 16px; }
        input:focus, select:focus, textarea:focus { border-color: #d4af37; }
        label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca39a; margin-bottom: 6px; display: block; font-weight: 600; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        a { color: #d4af37; }
      `}</style>

      <header style={{ padding: '40px 24px 20px', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingTop: 'max(40px, env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="display" style={{ fontSize: 42, lineHeight: 1, color: '#d4af37' }}>
              MBET<span style={{ color: '#4ade80' }}>.</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: '#9ca39a', marginTop: 4, letterSpacing: '0.2em' }}>
              BETTING INTELLIGENCE TERMINAL
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 10, color: '#9ca39a', letterSpacing: '0.15em' }}>BANKROLL</div>
              <div className="display" style={{ fontSize: 26, color: stats.bankroll >= 0 ? '#4ade80' : '#f87171' }}>
                ${stats.bankroll.toFixed(2)}
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} style={{ background: 'transparent', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37', padding: 8, borderRadius: 10, display: 'flex' }}>
              <Settings size={16}/>
            </button>
          </div>
        </div>
      </header>

      {alerts.length > 0 && (
        <div style={{ padding: '12px 24px 0' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              padding: '10px 14px', marginBottom: 8, borderRadius: 10, fontSize: 12,
              background: a.level === 'danger' ? 'rgba(248,113,113,0.1)' : 'rgba(212,175,55,0.08)',
              border: '1px solid ' + (a.level === 'danger' ? 'rgba(248,113,113,0.3)' : 'rgba(212,175,55,0.3)'),
              color: a.level === 'danger' ? '#f87171' : '#d4af37',
            }}>{a.msg}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, padding: '16px 24px 0', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Panel', icon: BarChart3 },
          { id: 'bets', label: 'Apuestas', icon: Target },
          { id: 'bank', label: 'Banca', icon: Wallet },
          { id: 'sports', label: 'Análisis', icon: Trophy },
          { id: 'ai', label: 'IA', icon: Brain },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? 'linear-gradient(180deg, #d4af37, #b8941f)' : 'transparent',
            color: tab === t.id ? '#0a0d0a' : '#9ca39a',
            border: '1px solid ' + (tab === t.id ? '#d4af37' : 'rgba(212,175,55,0.15)'),
            padding: '10px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <main style={{ padding: 24 }}>

        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <Kpi label="P&L Total" value={fmt.moneySign(stats.profit)} color={stats.profit >= 0 ? '#4ade80' : '#f87171'} icon={stats.profit >= 0 ? ArrowUpRight : ArrowDownRight} />
              <Kpi label="ROI" value={fmt.pct(stats.roi)} color={stats.roi >= 0 ? '#4ade80' : '#f87171'} icon={Activity} />
              <Kpi label="Win Rate" value={`${stats.winRate.toFixed(0)}%`} color="#d4af37" icon={Trophy} sub={`${stats.wonCount}W · ${stats.lostCount}L`} />
              <Kpi label="Apostado" value={`$${stats.totalStaked.toFixed(0)}`} color="#e8e6df" icon={DollarSign} sub={`${bets.length} apuestas`}/>
            </div>

            {bankrollData.length >= 2 && (
              <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div className="display" style={{ fontSize: 18, color: '#d4af37' }}>EVOLUCIÓN</div>
                  <div className="mono" style={{ fontSize: 10, color: '#9ca39a' }}>{bankrollData.length} PUNTOS</div>
                </div>
                <LineChart data={bankrollData} color={stats.profit >= 0 ? '#4ade80' : '#f87171'}/>
              </div>
            )}

            {/* Streaks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <div className="card" style={{ padding: 16 }}>
                <div className="mono" style={{ fontSize: 9, color: '#9ca39a', letterSpacing: '0.15em', marginBottom: 6 }}>RACHA ACTUAL</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div className="display" style={{ fontSize: 28, color: stats.currentStreakType === 'won' ? '#4ade80' : stats.currentStreakType === 'lost' ? '#f87171' : '#9ca39a' }}>
                    {stats.currentStreak || 0}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca39a' }}>
                    {stats.currentStreakType === 'won' ? '🔥 ganadas' : stats.currentStreakType === 'lost' ? '❄️ perdidas' : '—'}
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div className="mono" style={{ fontSize: 9, color: '#9ca39a', letterSpacing: '0.15em', marginBottom: 6 }}>MEJOR RACHA</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <div><span className="display" style={{ fontSize: 22, color: '#4ade80' }}>{stats.bestWinStreak}</span> <span style={{ fontSize: 10, color: '#9ca39a' }}>W</span></div>
                  <div><span className="display" style={{ fontSize: 22, color: '#f87171' }}>{stats.bestLossStreak}</span> <span style={{ fontSize: 10, color: '#9ca39a' }}>L</span></div>
                </div>
              </div>
            </div>

            {/* Week summary */}
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="display" style={{ fontSize: 18, color: '#d4af37' }}>ESTA SEMANA</div>
                <Calendar size={14} color="#d4af37"/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <div className="display" style={{ fontSize: 32, color: weekStats.profit >= 0 ? '#4ade80' : '#f87171' }}>
                  {fmt.moneySign(weekStats.profit)}
                </div>
                <div style={{ fontSize: 11, color: '#9ca39a', textAlign: 'right' }} className="mono">
                  {weekStats.count} APUESTAS<br/>
                  ${weekStats.staked.toFixed(0)} APOSTADO
                </div>
              </div>
              {prevWeekStats.profit !== 0 && (
                <div style={{ fontSize: 11, color: '#9ca39a', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  Semana pasada: <span style={{ color: prevWeekStats.profit >= 0 ? '#4ade80' : '#f87171' }}>{fmt.moneySign(prevWeekStats.profit)}</span>
                  {' · '}
                  {weekStats.profit > prevWeekStats.profit ? '📈 Mejorando' : '📉 Empeorando'}
                </div>
              )}
            </div>

            {/* Breakeven */}
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 10, color: '#9ca39a', letterSpacing: '0.15em', marginBottom: 8 }}>PUNTO DE EQUILIBRIO</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <div className="display" style={{ fontSize: 32, color: '#d4af37' }}>${Math.max(0, -stats.profit).toFixed(2)}</div>
                <div style={{ fontSize: 13, color: '#9ca39a' }}>
                  {stats.profit >= 0 ? 'Ya estás en positivo 🔥' : 'para recuperar'}
                </div>
              </div>
              <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, stats.totalReturn / Math.max(1, stats.totalStaked) * 100)}%`,
                  background: stats.profit >= 0 ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #d4af37, #f87171)',
                  transition: 'width 0.6s'
                }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <ActionBtn onClick={() => setShowTicketModal(true)} icon={Camera} label="Subir Ticket" sub="Lectura IA" />
              <ActionBtn onClick={() => setShowBetModal(true)} icon={Plus} label="Nueva Apuesta" sub="Manual" />
            </div>

            {todays.length > 0 && (
              <button onClick={() => setShowCloseDay(true)} style={{ ...styles.ghostBtn, marginBottom: 16, width: '100%' }}>
                <CheckCircle size={15}/> Cerrar día ({todays.length} apuestas)
              </button>
            )}

            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div className="display" style={{ fontSize: 18, color: '#d4af37' }}>ÚLTIMAS APUESTAS</div>
                <div className="mono" style={{ fontSize: 10, color: '#9ca39a' }}>{bets.length} TOTAL</div>
              </div>
              {bets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca39a', fontSize: 13 }}>
                  Sin apuestas aún. Empieza subiendo un ticket.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bets.slice(-5).reverse().map(b => <BetRow key={b.id} bet={b} compact />)}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'bets' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setShowTicketModal(true)} style={styles.primaryBtn}><Camera size={15}/> Ticket</button>
              <button onClick={() => setShowBetModal(true)} style={styles.ghostBtn}><Plus size={15}/> Manual</button>
            </div>

            <button onClick={() => setShowFilters(!showFilters)} style={{
              width: '100%', padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.15)', color: '#9ca39a', borderRadius: 10, fontSize: 12, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Filter size={13}/> Filtros {Object.values(filters).filter(Boolean).length > 0 && <span className="gold">({Object.values(filters).filter(Boolean).length})</span>}
            </button>

            {showFilters && (
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label>Deporte</label>
                    <select value={filters.sport} onChange={e => setFilters({...filters, sport: e.target.value})}>
                      <option value="">Todos</option>
                      {[...SPORTS, 'Parlay', 'SGP'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label>Estado</label>
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                      <option value="">Todos</option>
                      <option value="pending">Pendiente</option>
                      <option value="won">Ganada</option>
                      <option value="lost">Perdida</option>
                      <option value="void">Anulada</option>
                    </select>
                  </div>
                  {uniqueBookmakers.length > 0 && (
                    <div style={{ gridColumn: 'span 2' }}><label>Casa</label>
                      <select value={filters.bookmaker} onChange={e => setFilters({...filters, bookmaker: e.target.value})}>
                        <option value="">Todas</option>
                        {uniqueBookmakers.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                  )}
                  <div><label>Desde</label><input type="date" value={filters.from} onChange={e => setFilters({...filters, from: e.target.value})}/></div>
                  <div><label>Hasta</label><input type="date" value={filters.to} onChange={e => setFilters({...filters, to: e.target.value})}/></div>
                </div>
                <button onClick={() => setFilters({ sport: '', status: '', bookmaker: '', from: '', to: '' })} style={{ marginTop: 10, width: '100%', padding: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca39a', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>
                  Limpiar filtros
                </button>
              </div>
            )}

            {stats.pendingCount > 0 && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 12 }}>
                <span className="mono gold">{stats.pendingCount} PENDIENTES</span> · ${stats.pendingStake.toFixed(2)} en juego
              </div>
            )}
            {filteredBets.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca39a' }}>
                <Target size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
                <div>{bets.length === 0 ? 'Sin registros' : 'Sin resultados con esos filtros'}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...filteredBets].reverse().map(b => (
                  <BetRow key={b.id} bet={b} onUpdate={(status) => {
                    if (status === 'won') {
                      setWinBonusBet(b);
                    } else {
                      saveBets(bets.map(x => x.id === b.id ? { ...x, status } : x));
                    }
                  }} onCashout={() => setCashoutBet(b)} onDelete={() => {
                    saveBets(bets.filter(x => x.id !== b.id));
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'bank' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <Kpi label="Depósitos" value={`$${stats.deposits.toFixed(0)}`} color="#4ade80" icon={ArrowDownRight} />
              <Kpi label="Retiros" value={`$${stats.withdrawals.toFixed(0)}`} color="#f87171" icon={ArrowUpRight} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setShowMovModal('deposit')} style={{...styles.primaryBtn, background: 'linear-gradient(180deg, #4ade80, #22c55e)', color: '#0a0d0a'}}>
                <Plus size={15}/> Depósito
              </button>
              <button onClick={() => setShowMovModal('withdrawal')} style={{...styles.ghostBtn, borderColor: 'rgba(248,113,113,0.3)', color: '#f87171'}}>
                <Minus size={15}/> Retiro
              </button>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div className="display" style={{ fontSize: 18, color: '#d4af37', marginBottom: 14 }}>HISTORIAL</div>
              {movements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#9ca39a', fontSize: 13 }}>Sin movimientos</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...movements].reverse().map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, borderLeft: `3px solid ${m.type === 'deposit' ? '#4ade80' : '#f87171'}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{m.type === 'deposit' ? 'Depósito' : 'Retiro'}</div>
                        <div className="mono" style={{ fontSize: 10, color: '#9ca39a' }}>{fmt.dateLong(m.date)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="display" style={{ fontSize: 20, color: m.type === 'deposit' ? '#4ade80' : '#f87171' }}>
                          {m.type === 'deposit' ? '+' : '−'}${m.amount.toFixed(2)}
                        </div>
                        <button onClick={() => saveMovs(movements.filter(x => x.id !== m.id))} style={{ background: 'transparent', border: 'none', color: '#9ca39a', padding: 4 }}>
                          <X size={14}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'sports' && (
          <SportsTab sportStats={sportStats} bookmakerStats={bookmakerStats} monthly={monthly} dayClosings={dayClosings}/>
        )}

        {tab === 'ai' && <AITab apiKey={apiKey} openSettings={() => setShowSettings(true)} bets={bets}/>}

      </main>

      {showBetModal && <BetModal onClose={() => setShowBetModal(false)} defaultBookmaker={lastBookmaker} bankroll={stats.bankroll} onSave={(bet) => {
        saveBets([...bets, bet]);
        setShowBetModal(false);
      }} />}
      {showMovModal && <MovementModal type={showMovModal} onClose={() => setShowMovModal(false)} onSave={(mov) => {
        saveMovs([...movements, mov]);
        setShowMovModal(false);
      }} />}
      {showTicketModal && <TicketModal onClose={() => setShowTicketModal(false)} apiKey={apiKey} defaultBookmaker={lastBookmaker} openSettings={() => { setShowTicketModal(false); setShowSettings(true); }} onSave={(bet) => {
        saveBets([...bets, bet]);
        setShowTicketModal(false);
      }} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} apiKey={apiKey} onSave={saveApiKey} limits={limits} onLimitsChange={saveLimits} bets={bets} movements={movements} onImport={(data) => {
        if (data.bets) saveBets(data.bets);
        if (data.movements) saveMovs(data.movements);
        if (data.limits) saveLimits(data.limits);
      }} />}
      {showCloseDay && <CloseDayModal onClose={() => setShowCloseDay(false)} todayStats={todayStats} onSave={(closing) => {
        saveDayClosings([...dayClosings.filter(d => d.date !== closing.date), closing]);
        setShowCloseDay(false);
      }} />}
      {cashoutBet && <CashoutModal bet={cashoutBet} onClose={() => setCashoutBet(null)} onSave={(updated) => {
        saveBets(bets.map(x => x.id === updated.id ? updated : x));
        setCashoutBet(null);
      }} />}
      {winBonusBet && <WinBonusModal bet={winBonusBet} onClose={() => setWinBonusBet(null)} onSave={(updated) => {
        saveBets(bets.map(x => x.id === updated.id ? updated : x));
        setWinBonusBet(null);
      }} />}
    </div>
  );
}

function SportsTab({ sportStats, bookmakerStats, monthly, dayClosings }) {
  const [view, setView] = useState('sports');
  const best = sportStats[0];
  const worst = sportStats[sportStats.length - 1];

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(0,0,0,0.4)', padding: 4, borderRadius: 10 }}>
        {[['sports', 'Deportes'], ['books', 'Casas'], ['months', 'Meses'], ['journal', 'Diario']].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{
            flex: 1, padding: 10, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: view === id ? 'linear-gradient(180deg, #d4af37, #b8941f)' : 'transparent',
            color: view === id ? '#0a0d0a' : '#9ca39a',
          }}>{label}</button>
        ))}
      </div>

      {view === 'sports' && (
        <>
          {sportStats.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca39a' }}>
              <Trophy size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
              <div>Sin datos aún</div>
            </div>
          ) : (
            <>
              {best && best.profit > 0 && (
                <div className="card" style={{ padding: 20, marginBottom: 12, borderColor: 'rgba(74,222,128,0.3)', background: 'linear-gradient(180deg, rgba(74,222,128,0.08), rgba(12,16,13,0.9))' }}>
                  <div className="mono" style={{ fontSize: 10, color: '#4ade80', letterSpacing: '0.15em', marginBottom: 6 }}>🔥 MEJOR DEPORTE</div>
                  <div className="display" style={{ fontSize: 28, color: '#4ade80' }}>{best.key.toUpperCase()}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#9ca39a' }}>
                    <span className="mono">{fmt.moneySign(best.profit)}</span>
                    <span className="mono">ROI {best.roi.toFixed(1)}%</span>
                    <span className="mono">{best.won}W-{best.lost}L</span>
                  </div>
                </div>
              )}
              {worst && worst.profit < 0 && worst.key !== best?.key && (
                <div className="card" style={{ padding: 20, marginBottom: 16, borderColor: 'rgba(248,113,113,0.3)', background: 'linear-gradient(180deg, rgba(248,113,113,0.08), rgba(12,16,13,0.9))' }}>
                  <div className="mono" style={{ fontSize: 10, color: '#f87171', letterSpacing: '0.15em', marginBottom: 6 }}>❄️ PEOR DEPORTE</div>
                  <div className="display" style={{ fontSize: 28, color: '#f87171' }}>{worst.key.toUpperCase()}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#9ca39a' }}>
                    <span className="mono">{fmt.moneySign(worst.profit)}</span>
                    <span className="mono">ROI {worst.roi.toFixed(1)}%</span>
                    <span className="mono">{worst.won}W-{worst.lost}L</span>
                  </div>
                </div>
              )}
              <StatsList items={sportStats} label="RANKING POR DEPORTE"/>
            </>
          )}
        </>
      )}

      {view === 'books' && (
        bookmakerStats.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca39a' }}>
            <div>Sin datos de casas. Añade la casa al registrar apuestas.</div>
          </div>
        ) : <StatsList items={bookmakerStats} label="RANKING POR CASA"/>
      )}

      {view === 'months' && (
        monthly.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca39a' }}>
            <div>Sin datos mensuales aún</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <div className="display" style={{ fontSize: 18, color: '#d4af37', marginBottom: 14 }}>POR MES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {monthly.map(m => (
                <div key={m.month} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{new Date(m.month + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' })}</div>
                    <div className="display" style={{ fontSize: 20, color: m.profit >= 0 ? '#4ade80' : '#f87171' }}>
                      {fmt.moneySign(m.profit)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca39a' }} className="mono">
                    <span>{m.won + m.lost} cerradas</span>
                    <span>${m.staked.toFixed(0)} apostado</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {view === 'journal' && (
        dayClosings.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca39a' }}>
            <div>Sin cierres de día. Al final del día puedes cerrar tu jornada desde el panel.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...dayClosings].reverse().map(d => {
              const moodEmoji = { focused: '🔥', calm: '😌', neutral: '😐', tilted: '😤', chasing: '😵' }[d.mood] || '😐';
              return (
                <div key={d.date} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div className="mono" style={{ fontSize: 10, color: '#9ca39a', letterSpacing: '0.1em' }}>{fmt.dateLong(d.date)}</div>
                      <div style={{ fontSize: 20, marginTop: 2 }}>{moodEmoji}</div>
                    </div>
                    <div className="display" style={{ fontSize: 22, color: d.stats.profit >= 0 ? '#4ade80' : '#f87171' }}>
                      {fmt.moneySign(d.stats.profit)}
                    </div>
                  </div>
                  {d.reflection && <div style={{ fontSize: 12, color: '#e8e6df', fontStyle: 'italic', padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginTop: 6 }}>💭 {d.reflection}</div>}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function StatsList({ items, label }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="display" style={{ fontSize: 18, color: '#d4af37', marginBottom: 14 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(s => (
          <div key={s.key} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.key}</div>
              <div className="display" style={{ fontSize: 18, color: s.profit >= 0 ? '#4ade80' : '#f87171' }}>
                {fmt.moneySign(s.profit)}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca39a' }} className="mono">
              <span>ROI {s.roi.toFixed(1)}%</span>
              <span>{s.won}W · {s.lost}L</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AITab({ apiKey, openSettings, bets }) {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [sport, setSport] = useState('Fútbol');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!teamA || !teamB) return;
    if (!apiKey) { setError('Necesitas configurar tu API key en Ajustes.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await callClaude(apiKey, [{
        role: 'user',
        content: `Eres un analista experto en apuestas deportivas. Analiza el enfrentamiento de ${sport}: ${teamA} vs ${teamB}. ${context ? 'Contexto adicional: ' + context : ''}

Devuelve SOLO un JSON válido sin markdown con esta estructura exacta:
{
  "probA": 45,
  "probDraw": 25,
  "probB": 30,
  "fairOddsA": 2.22,
  "fairOddsDraw": 4.00,
  "fairOddsB": 3.33,
  "favorite": "${teamA}",
  "confidence": "media",
  "analysis": "Análisis breve de 2-3 frases en español sobre el enfrentamiento.",
  "keyFactors": ["factor 1", "factor 2", "factor 3"]
}

Las probabilidades deben sumar 100. Si el deporte no permite empate (tenis, NBA, NFL, MMA), pon probDraw en 0 y ajusta. Sé honesto sobre la incertidumbre.`
      }]);
      const text = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const obj = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      setResult(obj);
    } catch (err) {
      setError('Error al analizar. Verifica tu API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!apiKey && (
        <div className="card" style={{ padding: 20, marginBottom: 16, borderColor: 'rgba(212,175,55,0.3)' }}>
          <div className="display" style={{ fontSize: 18, color: '#d4af37', marginBottom: 8 }}>⚠️ API KEY REQUERIDA</div>
          <div style={{ fontSize: 13, color: '#9ca39a', marginBottom: 14 }}>
            Para usar el análisis IA necesitas configurar tu clave de Anthropic. Cuesta unos centavos por consulta.
          </div>
          <button onClick={openSettings} style={styles.primaryBtn}><Key size={15}/> Configurar API Key</button>
        </div>
      )}

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Brain size={20} color="#d4af37"/>
          <div className="display" style={{ fontSize: 20, color: '#d4af37' }}>ANÁLISIS IA</div>
        </div>
        <div style={{ fontSize: 12, color: '#9ca39a', marginBottom: 16 }}>
          Probabilidades estimadas. No es garantía — apuesta con responsabilidad.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label>Deporte</label>
            <select value={sport} onChange={e => setSport(e.target.value)}>
              {SPORTS.filter(s => s !== 'Otro').map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label>Equipo / Jugador A</label><input value={teamA} onChange={e => setTeamA(e.target.value)} placeholder="Real Madrid"/></div>
            <div><label>Equipo / Jugador B</label><input value={teamB} onChange={e => setTeamB(e.target.value)} placeholder="Barcelona"/></div>
          </div>
          <div><label>Contexto (opcional)</label><textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Lesiones, local, forma reciente..." rows={2}/></div>
          <button onClick={analyze} disabled={loading || !teamA || !teamB || !apiKey} style={{...styles.primaryBtn, opacity: (loading || !teamA || !teamB || !apiKey) ? 0.5 : 1}}>
            {loading ? <><Loader size={15} className="spin"/> Analizando...</> : <><Sparkles size={15}/> Calcular probabilidades</>}
          </button>
        </div>
      </div>

      {error && <div style={{ padding: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>{error}</div>}

      {result && (
        <div className="card" style={{ padding: 20 }}>
          <div className="mono" style={{ fontSize: 10, color: '#9ca39a', letterSpacing: '0.15em', marginBottom: 12 }}>PROBABILIDADES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
            <ProbBar label={teamA} pct={result.probA} fairOdds={result.fairOddsA} highlight={result.favorite === teamA}/>
            {result.probDraw > 0 && <ProbBar label="Empate" pct={result.probDraw} fairOdds={result.fairOddsDraw}/>}
            <ProbBar label={teamB} pct={result.probB} fairOdds={result.fairOddsB} highlight={result.favorite === teamB}/>
          </div>
          <div style={{ padding: 14, background: 'rgba(212,175,55,0.06)', borderRadius: 10, marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 9, color: '#d4af37', letterSpacing: '0.15em', marginBottom: 6 }}>ANÁLISIS</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{result.analysis}</div>
          </div>
          {result.keyFactors && (
            <div>
              <div className="mono" style={{ fontSize: 9, color: '#9ca39a', letterSpacing: '0.15em', marginBottom: 8 }}>FACTORES CLAVE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.keyFactors.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#e8e6df', paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>▸</span> {f}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 14, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: 11, color: '#9ca39a', textAlign: 'center' }}>
            Confianza del modelo: <span className="gold" style={{ fontWeight: 600 }}>{result.confidence}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProbBar({ label, pct, fairOdds, highlight }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' }}>
        <div style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? '#d4af37' : '#e8e6df' }}>
          {highlight && '★ '}{label}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <div className="mono" style={{ fontSize: 10, color: '#9ca39a' }}>{fmt.odds(fairOdds)}</div>
          <div className="display" style={{ fontSize: 18, color: highlight ? '#d4af37' : '#e8e6df' }}>{pct}%</div>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: highlight ? 'linear-gradient(90deg, #d4af37, #f4cf57)' : 'linear-gradient(90deg, #4ade80, #22c55e)',
          transition: 'width 0.8s ease',
        }}/>
      </div>
    </div>
  );
