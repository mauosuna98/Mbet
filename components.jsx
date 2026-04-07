import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { fmt, betOdds, betProfit } from './utils';

export const styles = {
  primaryBtn: { flex: 1, background: 'linear-gradient(180deg, #d4af37, #b8941f)', color: '#0a0d0a', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' },
  ghostBtn: { flex: 1, background: 'transparent', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)', padding: '14px', borderRadius: 12, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' },
  dangerBtn: { background: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', padding: '12px', borderRadius: 10, fontSize: 13, cursor: 'pointer', width: '100%' },
};

export function Kpi({ label, value, color = '#e8e6df', icon: Icon, sub }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div className="mono" style={{ fontSize: 9, color: '#9ca39a', letterSpacing: '0.15em' }}>{label.toUpperCase()}</div>
        {Icon && <Icon size={14} color={color} style={{ opacity: 0.6 }} />}
      </div>
      <div className="display" style={{ fontSize: 26, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="mono" style={{ fontSize: 9, color: '#9ca39a', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function ActionBtn({ icon: Icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} className="card" style={{ padding: 18, textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.2)' }}>
      <Icon size={20} color="#d4af37" style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e6df' }}>{label}</div>
      <div className="mono" style={{ fontSize: 9, color: '#9ca39a', letterSpacing: '0.1em', marginTop: 2 }}>{sub.toUpperCase()}</div>
    </button>
  );
}

export function ModalShell({ children, onClose, title }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: 24, paddingBottom: 'max(24px, env(safe-area-inset-bottom))', border: '1px solid rgba(212,175,55,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="display" style={{ fontSize: 22, color: '#d4af37' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca39a', padding: 6, cursor: 'pointer' }}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function BetRow({ bet, onUpdate, onDelete, compact, onClick }) {
  const statusColor = bet.status === 'won' ? '#4ade80' : bet.status === 'lost' ? '#f87171' : bet.status === 'void' ? '#9ca39a' : '#d4af37';
  const profit = betProfit(bet);
  const odds = betOdds(bet);
  const isParlay = bet.type === 'parlay';
  const displayEvent = isParlay ? `Parlay (${bet.selections?.length || 0})` : bet.event;
  const displayPick = isParlay ? bet.selections?.map(s => s.pick).join(' + ') : bet.pick;
  const displaySport = isParlay ? 'Combinada' : bet.sport;

  return (
    <div onClick={onClick} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, borderLeft: `3px solid ${statusColor}`, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            {isParlay && <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(212,175,55,0.15)', color: '#d4af37', borderRadius: 4, fontWeight: 700 }}>PARLAY</span>}
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEvent}</div>
          </div>
          <div className="mono" style={{ fontSize: 10, color: '#9ca39a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displaySport} · {displayPick} · @{odds.toFixed(2)}
          </div>
          {bet.bookmaker && <div className="mono" style={{ fontSize: 9, color: '#7a7f77', marginTop: 2 }}>{bet.bookmaker} · {fmt.date(bet.date)}</div>}
        </div>
        <div style={{ textAlign: 'right', marginLeft: 10 }}>
          <div className="display" style={{ fontSize: 16, color: statusColor }}>
            {bet.status === 'pending' ? `$${bet.stake}` : bet.status === 'void' ? '—' : fmt.moneySign(profit).replace('.00', '')}
          </div>
          <div className="mono" style={{ fontSize: 9, color: '#9ca39a', textTransform: 'uppercase' }}>{bet.status === 'won' ? 'Ganada' : bet.status === 'lost' ? 'Perdida' : bet.status === 'void' ? 'Anulada' : 'Pendiente'}</div>
        </div>
      </div>
      {bet.status === 'pending' && onUpdate && !compact && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={(e) => { e.stopPropagation(); onUpdate('won'); }} style={{ flex: 1, padding: '6px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>GANADA</button>
          <button onClick={(e) => { e.stopPropagation(); onUpdate('lost'); }} style={{ flex: 1, padding: '6px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>PERDIDA</button>
          <button onClick={(e) => { e.stopPropagation(); onUpdate('void'); }} style={{ padding: '6px 8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca39a', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>NULA</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca39a', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12}/></button>
        </div>
      )}
      {bet.status !== 'pending' && onDelete && !compact && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ marginTop: 8, padding: '4px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca39a', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>
          <Trash2 size={11} style={{ verticalAlign: 'middle' }}/> Eliminar
        </button>
      )}
      {bet.notes && !compact && (
        <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 11, color: '#9ca39a', fontStyle: 'italic' }}>
          💭 {bet.notes}
        </div>
      )}
    </div>
  );
}

// Simple SVG line chart
export function LineChart({ data, color = '#d4af37', height = 160 }) {
  if (!data || data.length < 2) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca39a', fontSize: 12 }}>Datos insuficientes</div>;
  }
  const w = 320, h = height, pad = 20;
  const values = data.map(d => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const step = (w - pad * 2) / (data.length - 1);
  const scaleY = (v) => h - pad - ((v - min) / range) * (h - pad * 2);
  const points = data.map((d, i) => `${pad + i * step},${scaleY(d.value)}`).join(' ');
  const areaPath = `M ${pad},${scaleY(0)} L ${points.split(' ').join(' L ')} L ${pad + (data.length - 1) * step},${scaleY(0)} Z`;
  const linePath = `M ${points.split(' ').join(' L ')}`;
  const zeroY = scaleY(0);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <line x1={pad} y1={zeroY} x2={w - pad} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeDasharray="2 4"/>
      <path d={areaPath} fill="url(#areaGrad)"/>
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.length <= 30 && data.map((d, i) => (
        <circle key={i} cx={pad + i * step} cy={scaleY(d.value)} r="2.5" fill={color}/>
      ))}
    </svg>
  );
}
