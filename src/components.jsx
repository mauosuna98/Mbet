import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { fmt, betOdds, betProfit, betTitle, selectionTitle, pickLabel } from './utils';

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

export function BetRow({ bet, onUpdate, onDelete, onCashout, onWin, compact, onClick }) {
  const statusColor = bet.status === 'won' ? '#4ade80'
    : bet.status === 'lost' ? '#f87171'
    : bet.status === 'cashout' ? (betProfit(bet) > 0 ? '#4ade80' : '#f87171')
    : bet.status === 'void' ? '#9ca39a'
    : '#d4af37';
  const profit = betProfit(bet);
  const odds = betOdds(bet);
  const isParlay = bet.type === 'parlay';
  const isSGP = bet.type === 'sgp';
  const isMulti = isParlay || isSGP;

  const statusLabel = bet.status === 'won' ? 'Ganada'
    : bet.status === 'lost' ? 'Perdida'
    : bet.status === 'cashout' ? 'Cashout'
    : bet.status === 'void' ? 'Anulada'
    : 'Pendiente';

  const typeBadge = isSGP ? 'SGP' : isParlay ? 'PARLAY' : null;
  const sportIcon = {
    'Fútbol': '⚽', 'Basketball': '🏀', 'Tenis': '🎾', 'Béisbol': '⚾',
    'NFL': '🏈', 'MMA': '🥊', 'Boxeo': '🥊', 'Hockey': '🏒', 'Otro': '🎯',
  };

  return (
    <div onClick={onClick} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 12, borderLeft: `3px solid ${statusColor}`, cursor: onClick ? 'pointer' : 'default', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: isMulti ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              {typeBadge && <span style={{ fontSize: 9, padding: '2px 6px', background: isSGP ? 'rgba(74,222,128,0.15)' : 'rgba(212,175,55,0.15)', color: isSGP ? '#4ade80' : '#d4af37', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em' }}>{typeBadge}</span>}
              <div style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>{betTitle(bet)}</div>
            </div>
            {!isMulti && bet.market && (
              <div className="mono" style={{ fontSize: 10, color: '#9ca39a' }}>
                {bet.market}
              </div>
            )}
            {!isMulti && (bet.line || bet.pick) && (
              <div style={{ fontSize: 12, color: '#e8e6df', marginTop: 2 }}>
                {pickLabel(bet.pick, bet.line)}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {!isMulti && (
              <div className="display" style={{ fontSize: 16, color: '#d4af37', lineHeight: 1 }}>
                {fmt.odds(odds)}
              </div>
            )}
            {isMulti && (
              <div className="display" style={{ fontSize: 16, color: '#d4af37', lineHeight: 1 }}>
                {fmt.odds(odds)}
              </div>
            )}
          </div>
        </div>

        {bet.bookmaker && (
          <div className="mono" style={{ fontSize: 9, color: '#7a7f77', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>{sportIcon[bet.sport] || ''} {bet.sport || ''}{bet.bookmaker ? ' · ' + bet.bookmaker : ''}</span>
            <span>{fmt.date(bet.date)}</span>
          </div>
        )}
      </div>

      {/* Selections for multi bets */}
      {isMulti && bet.selections && !compact && (
        <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.25)' }}>
          {bet.selections.map((sel, i) => (
            <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {!isSGP && <div style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', marginBottom: 2 }}>{selectionTitle(sel)}</div>}
                  {sel.market && <div className="mono" style={{ fontSize: 9, color: '#9ca39a' }}>{sel.market}</div>}
                  <div style={{ fontSize: 11, color: '#e8e6df', marginTop: 2 }}>{pickLabel(sel.pick, sel.line)}</div>
                </div>
                {sel.odds && (
                  <div className="mono" style={{ fontSize: 11, color: '#d4af37', flexShrink: 0 }}>
                    {fmt.odds(sel.odds)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer: stake & result */}
      <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: isMulti ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
        <div>
          <div className="mono" style={{ fontSize: 9, color: '#7a7f77', letterSpacing: '0.1em' }}>APOSTADO</div>
          <div style={{ fontSize: 13, color: '#e8e6df', fontWeight: 600 }}>${bet.stake.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 9, color: '#7a7f77', letterSpacing: '0.1em' }}>{statusLabel.toUpperCase()}</div>
          <div className="display" style={{ fontSize: 18, color: statusColor }}>
            {bet.status === 'pending'
              ? `+$${(bet.stake * (odds - 1)).toFixed(0)}`
              : bet.status === 'void'
                ? '—'
                : fmt.moneySign(profit).replace('.00', '')}
          </div>
        </div>
      </div>

      {bet.status === 'won' && bet.bonus > 0 && (
        <div style={{ padding: '6px 14px', background: 'rgba(74,222,128,0.08)', fontSize: 10, color: '#4ade80', display: 'flex', justifyContent: 'space-between' }}>
          <span>🎁 Bono incluido</span>
          <span className="mono">+${parseFloat(bet.bonus).toFixed(2)}</span>
        </div>
      )}

      {bet.status === 'cashout' && (
        <div style={{ padding: '6px 14px', background: 'rgba(212,175,55,0.06)', fontSize: 10, color: '#9ca39a', display: 'flex', justifyContent: 'space-between' }}>
          <span>Cashout recibido</span>
          <span className="mono">${bet.cashoutAmount?.toFixed(2)}</span>
        </div>
      )}

      {bet.status === 'pending' && onUpdate && !compact && (
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={(e) => { e.stopPropagation(); onWin ? onWin() : onUpdate('won'); }} style={{ flex: 1, padding: '8px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>GANADA</button>
            <button onClick={(e) => { e.stopPropagation(); onUpdate('lost'); }} style={{ flex: 1, padding: '8px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>PERDIDA</button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={(e) => { e.stopPropagation(); onCashout && onCashout(); }} style={{ flex: 1, padding: '6px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>CASHOUT</button>
            <button onClick={(e) => { e.stopPropagation(); onUpdate('void'); }} style={{ flex: 1, padding: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca39a', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>NULA</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca39a', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12}/></button>
          </div>
        </div>
      )}
      {bet.status !== 'pending' && onDelete && !compact && (
        <div style={{ padding: '6px 14px 10px' }}>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca39a', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>
            <Trash2 size={11} style={{ verticalAlign: 'middle' }}/> Eliminar
          </button>
        </div>
      )}
      {bet.notes && !compact && (
        <div style={{ padding: '6px 14px 10px' }}>
          <div style={{ padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 11, color: '#9ca39a', fontStyle: 'italic' }}>
            💭 {bet.notes}
          </div>
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
