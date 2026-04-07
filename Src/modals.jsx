import React, { useState, useRef } from 'react';
import { Camera, Loader, Sparkles, Plus, Trash2, X, Key, Download, Upload } from 'lucide-react';
import { callClaude, SPORTS, MOODS, fmt, kellyStake, betOdds, betProfit, toCSV, fromCSV, downloadFile, computeStats } from './utils';
import { ModalShell, styles } from './components';

export function BetModal({ onClose, onSave, defaultBookmaker, bankroll }) {
  const [mode, setMode] = useState('single');
  const [form, setForm] = useState({
    event: '', sport: 'Fútbol', pick: '', odds: '', stake: '',
    bookmaker: defaultBookmaker || '', notes: '', date: new Date().toISOString().split('T')[0],
  });
  const [selections, setSelections] = useState([
    { event: '', sport: 'Fútbol', pick: '', odds: '' },
    { event: '', sport: 'Fútbol', pick: '', odds: '' },
  ]);
  const [showKelly, setShowKelly] = useState(false);
  const [kellyProb, setKellyProb] = useState('');

  const updateSel = (i, field, val) => {
    const next = [...selections];
    next[i] = { ...next[i], [field]: val };
    setSelections(next);
  };
  const addSel = () => setSelections([...selections, { event: '', sport: 'Fútbol', pick: '', odds: '' }]);
  const removeSel = (i) => setSelections(selections.filter((_, idx) => idx !== i));

  const parlayOdds = selections.reduce((p, s) => p * (parseFloat(s.odds) || 1), 1);
  const singleOdds = parseFloat(form.odds) || 0;
  const effectiveOdds = mode === 'parlay' ? parlayOdds : singleOdds;
  const stake = parseFloat(form.stake) || 0;
  const potential = stake * (effectiveOdds - 1);

  const kellyRec = kellyProb && effectiveOdds > 1
    ? kellyStake(bankroll, effectiveOdds, parseFloat(kellyProb) / 100)
    : 0;

  const submit = () => {
    const base = {
      id: Date.now().toString(),
      stake: parseFloat(form.stake),
      status: 'pending',
      date: form.date,
      bookmaker: form.bookmaker,
      notes: form.notes,
    };
    if (mode === 'parlay') {
      if (selections.length < 2 || selections.some(s => !s.event || !s.pick || !s.odds)) return;
      if (!form.stake) return;
      onSave({
        ...base,
        type: 'parlay',
        selections: selections.map(s => ({ ...s, odds: parseFloat(s.odds) })),
      });
    } else {
      if (!form.event || !form.pick || !form.odds || !form.stake) return;
      onSave({
        ...base,
        type: 'single',
        event: form.event,
        sport: form.sport,
        pick: form.pick,
        odds: parseFloat(form.odds),
      });
    }
  };

  return (
    <ModalShell onClose={onClose} title="NUEVA APUESTA">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(0,0,0,0.4)', padding: 4, borderRadius: 10 }}>
        <button onClick={() => setMode('single')} style={{
          flex: 1, padding: 10, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: mode === 'single' ? 'linear-gradient(180deg, #d4af37, #b8941f)' : 'transparent',
          color: mode === 'single' ? '#0a0d0a' : '#9ca39a',
        }}>SIMPLE</button>
        <button onClick={() => setMode('parlay')} style={{
          flex: 1, padding: 10, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: mode === 'parlay' ? 'linear-gradient(180deg, #d4af37, #b8941f)' : 'transparent',
          color: mode === 'parlay' ? '#0a0d0a' : '#9ca39a',
        }}>COMBINADA</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'single' ? (
          <>
            <div><label>Evento</label><input value={form.event} onChange={e => setForm({...form, event: e.target.value})} placeholder="Real Madrid vs Barcelona"/></div>
            <div><label>Deporte</label>
              <select value={form.sport} onChange={e => setForm({...form, sport: e.target.value})}>
                {SPORTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label>Selección / Pick</label><input value={form.pick} onChange={e => setForm({...form, pick: e.target.value})} placeholder="Madrid gana"/></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label>Cuota</label><input type="number" step="0.01" inputMode="decimal" value={form.odds} onChange={e => setForm({...form, odds: e.target.value})} placeholder="2.50"/></div>
              <div><label>Apuesta $</label><input type="number" step="0.01" inputMode="decimal" value={form.stake} onChange={e => setForm({...form, stake: e.target.value})} placeholder="100"/></div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selections.map((sel, i) => (
                <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 10, border: '1px solid rgba(212,175,55,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div className="mono gold" style={{ fontSize: 10, letterSpacing: '0.1em' }}>SELECCIÓN {i + 1}</div>
                    {selections.length > 2 && (
                      <button onClick={() => removeSel(i)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 2 }}><Trash2 size={14}/></button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={sel.event} onChange={e => updateSel(i, 'event', e.target.value)} placeholder="Evento" style={{ fontSize: 13, padding: '8px 10px' }}/>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <select value={sel.sport} onChange={e => updateSel(i, 'sport', e.target.value)} style={{ fontSize: 13, padding: '8px 10px' }}>
                        {SPORTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <input type="number" step="0.01" inputMode="decimal" value={sel.odds} onChange={e => updateSel(i, 'odds', e.target.value)} placeholder="Cuota" style={{ fontSize: 13, padding: '8px 10px' }}/>
                    </div>
                    <input value={sel.pick} onChange={e => updateSel(i, 'pick', e.target.value)} placeholder="Pick" style={{ fontSize: 13, padding: '8px 10px' }}/>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addSel} style={{ padding: 10, background: 'transparent', border: '1px dashed rgba(212,175,55,0.3)', color: '#d4af37', borderRadius: 10, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Plus size={14}/> Añadir selección
            </button>
            <div style={{ padding: 12, background: 'rgba(212,175,55,0.08)', borderRadius: 10, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 9, color: '#9ca39a', letterSpacing: '0.15em' }}>CUOTA COMBINADA</div>
              <div className="display gold" style={{ fontSize: 28 }}>{parlayOdds.toFixed(2)}</div>
            </div>
            <div><label>Apuesta $</label><input type="number" step="0.01" inputMode="decimal" value={form.stake} onChange={e => setForm({...form, stake: e.target.value})} placeholder="100"/></div>
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label>Casa de apuestas</label><input value={form.bookmaker} onChange={e => setForm({...form, bookmaker: e.target.value})} placeholder="Bet365"/></div>
          <div><label>Fecha</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}/></div>
        </div>

        <div><label>Notas (opcional)</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Por qué elegiste esta apuesta, contexto..." rows={2}/></div>

        {stake > 0 && effectiveOdds > 1 && (
          <div style={{ padding: 12, background: 'rgba(212,175,55,0.08)', borderRadius: 10, fontSize: 12, color: '#9ca39a', textAlign: 'center' }}>
            Ganancia potencial: <span className="display gold" style={{ fontSize: 20 }}>${potential.toFixed(2)}</span>
            <div style={{ fontSize: 10, marginTop: 4 }}>Retorno total: ${(stake + potential).toFixed(2)}</div>
          </div>
        )}

        {bankroll > 0 && effectiveOdds > 1 && (
          <div>
            <button onClick={() => setShowKelly(!showKelly)} style={{ width: '100%', padding: 10, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>
              🧠 {showKelly ? 'Ocultar' : 'Ver'} recomendación Kelly
            </button>
            {showKelly && (
              <div style={{ marginTop: 10, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 10 }}>
                <label>Tu estimación de probabilidad de ganar (%)</label>
                <input type="number" inputMode="decimal" value={kellyProb} onChange={e => setKellyProb(e.target.value)} placeholder="55" style={{ marginBottom: 8 }}/>
                {kellyRec > 0 && (
                  <div style={{ fontSize: 12, color: '#9ca39a', textAlign: 'center' }}>
                    Stake sugerido (¼ Kelly): <span className="display" style={{ color: '#4ade80', fontSize: 20 }}>${kellyRec.toFixed(2)}</span>
                    <button onClick={() => setForm({...form, stake: kellyRec.toFixed(2)})} style={{ marginLeft: 8, padding: '4px 10px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: 6, fontSize: 10, cursor: 'pointer' }}>USAR</button>
                  </div>
                )}
                {kellyProb && kellyRec === 0 && parseFloat(kellyProb) > 0 && (
                  <div style={{ fontSize: 11, color: '#f87171', textAlign: 'center' }}>
                    ⚠️ Con esa probabilidad Kelly recomienda NO apostar (valor esperado negativo)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button onClick={submit} style={styles.primaryBtn}>GUARDAR APUESTA</button>
      </div>
    </ModalShell>
  );
}

export function MovementModal({ type, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const submit = () => {
    if (!amount) return;
    onSave({ id: Date.now().toString(), type, amount: parseFloat(amount), date });
  };
  return (
    <ModalShell onClose={onClose} title={type === 'deposit' ? 'NUEVO DEPÓSITO' : 'NUEVO RETIRO'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label>Monto</label><input type="number" step="0.01" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus/></div>
        <div><label>Fecha</label><input type="date" value={date} onChange={e => setDate(e.target.value)}/></div>
        <button onClick={submit} style={{...styles.primaryBtn, background: type === 'deposit' ? 'linear-gradient(180deg, #4ade80, #22c55e)' : 'linear-gradient(180deg, #f87171, #dc2626)'}}>
          CONFIRMAR
        </button>
      </div>
    </ModalShell>
  );
}

export function TicketModal({ onClose, onSave, apiKey, openSettings, defaultBookmaker }) {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [mediaType, setMediaType] = useState('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setImageData(reader.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageData) return;
    if (!apiKey) { setError('Necesitas configurar tu API key en Ajustes.'); return; }
    setAnalyzing(true);
    setError('');
    try {
      const data = await callClaude(apiKey, [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
          { type: 'text', text: `Analiza este ticket de apuesta deportiva. Detecta si es apuesta simple o combinada (parlay/multiple).

Si es SIMPLE devuelve: {"type":"single","event":"equipo vs equipo","sport":"Fútbol|Basketball|Tenis|Béisbol|NFL|MMA|Boxeo|Hockey|Otro","pick":"selección","odds":2.50,"stake":100,"bookmaker":"nombre casa"}

Si es COMBINADA devuelve: {"type":"parlay","selections":[{"event":"...","sport":"...","pick":"...","odds":1.50},{"event":"...","sport":"...","pick":"...","odds":2.00}],"stake":100,"bookmaker":"nombre casa"}

Devuelve SOLO el JSON, sin markdown ni texto adicional. Todos los números deben ser números, no strings.` }
        ]
      }]);
      const text = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const obj = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      if (!obj.bookmaker && defaultBookmaker) obj.bookmaker = defaultBookmaker;
      setParsed(obj);
    } catch (err) {
      setError('No se pudo leer el ticket. Verifica tu API key o intenta con una foto más clara.');
    } finally {
      setAnalyzing(false);
    }
  };

  const save = () => {
    const base = {
      id: Date.now().toString(),
      stake: parseFloat(parsed.stake),
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      bookmaker: parsed.bookmaker || '',
      notes: '',
    };
    if (parsed.type === 'parlay') {
      onSave({ ...base, type: 'parlay', selections: parsed.selections.map(s => ({ ...s, odds: parseFloat(s.odds) })) });
    } else {
      onSave({ ...base, type: 'single', event: parsed.event, sport: parsed.sport, pick: parsed.pick, odds: parseFloat(parsed.odds) });
    }
  };

  const isParlay = parsed?.type === 'parlay';

  return (
    <ModalShell onClose={onClose} title="LECTURA DE TICKET">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!apiKey && (
          <div style={{ padding: 14, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, fontSize: 12 }}>
            <div style={{ color: '#d4af37', fontWeight: 600, marginBottom: 6 }}>⚠️ API Key requerida</div>
            <div style={{ color: '#9ca39a', marginBottom: 10 }}>La lectura IA necesita tu clave de Anthropic.</div>
            <button onClick={openSettings} style={{...styles.primaryBtn, padding: 10}}>Configurar ahora</button>
          </div>
        )}
        {!image && (
          <div onClick={() => fileRef.current?.click()} style={{ padding: 40, border: '2px dashed rgba(212,175,55,0.3)', borderRadius: 14, textAlign: 'center', cursor: 'pointer' }}>
            <Camera size={32} color="#d4af37" style={{ marginBottom: 10 }}/>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Toca para subir foto</div>
            <div className="mono" style={{ fontSize: 10, color: '#9ca39a', marginTop: 4 }}>JPG / PNG</div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }}/>
          </div>
        )}
        {image && !parsed && (
          <>
            <img src={image} alt="ticket" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 10, background: 'rgba(0,0,0,0.4)' }}/>
            {error && <div style={{ padding: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, fontSize: 12, color: '#f87171' }}>{error}</div>}
            <button onClick={analyze} disabled={analyzing || !apiKey} style={{...styles.primaryBtn, opacity: (analyzing || !apiKey) ? 0.6 : 1}}>
              {analyzing ? <><Loader size={15} className="spin"/> Leyendo...</> : <><Sparkles size={15}/> Analizar con IA</>}
            </button>
            <button onClick={() => { setImage(null); setImageData(null); }} style={styles.ghostBtn}>Cambiar imagen</button>
          </>
        )}
        {parsed && (
          <>
            <div style={{ padding: 14, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, fontSize: 12, color: '#4ade80' }}>
              ✓ Ticket leído como {isParlay ? 'COMBINADA' : 'SIMPLE'}. Verifica.
            </div>
            {isParlay ? (
              <>
                {parsed.selections.map((sel, i) => (
                  <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 10 }}>
                    <div className="mono gold" style={{ fontSize: 10, marginBottom: 8 }}>SELECCIÓN {i + 1}</div>
                    <input value={sel.event} onChange={e => { const n = {...parsed}; n.selections[i].event = e.target.value; setParsed(n); }} style={{ marginBottom: 6, fontSize: 13 }}/>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6 }}>
                      <input value={sel.pick} onChange={e => { const n = {...parsed}; n.selections[i].pick = e.target.value; setParsed(n); }} placeholder="Pick" style={{ fontSize: 13 }}/>
                      <input type="number" step="0.01" value={sel.odds} onChange={e => { const n = {...parsed}; n.selections[i].odds = e.target.value; setParsed(n); }} style={{ fontSize: 13 }}/>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div><label>Evento</label><input value={parsed.event} onChange={e => setParsed({...parsed, event: e.target.value})}/></div>
                <div><label>Deporte</label>
                  <select value={parsed.sport} onChange={e => setParsed({...parsed, sport: e.target.value})}>
                    {SPORTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label>Pick</label><input value={parsed.pick} onChange={e => setParsed({...parsed, pick: e.target.value})}/></div>
                <div><label>Cuota</label><input type="number" step="0.01" value={parsed.odds} onChange={e => setParsed({...parsed, odds: e.target.value})}/></div>
              </>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label>Apuesta $</label><input type="number" step="0.01" value={parsed.stake} onChange={e => setParsed({...parsed, stake: e.target.value})}/></div>
              <div><label>Casa</label><input value={parsed.bookmaker || ''} onChange={e => setParsed({...parsed, bookmaker: e.target.value})}/></div>
            </div>
            <button onClick={save} style={styles.primaryBtn}>GUARDAR</button>
          </>
        )}
      </div>
    </ModalShell>
  );
}

export function SettingsModal({ onClose, apiKey, onSave, limits, onLimitsChange, bets, movements, onImport }) {
  const [tab, setTab] = useState('api');
  const [key, setKey] = useState(apiKey || '');
  const [dailyLimit, setDailyLimit] = useState(limits.dailyLimit || '');
  const [weeklyLimit, setWeeklyLimit] = useState(limits.weeklyLimit || '');
  const [stopLoss, setStopLoss] = useState(limits.stopLossPct || '');
  const fileRef = useRef();

  const saveAll = () => {
    onSave(key.trim());
    onLimitsChange({
      dailyLimit: dailyLimit ? parseFloat(dailyLimit) : null,
      weeklyLimit: weeklyLimit ? parseFloat(weeklyLimit) : null,
      stopLossPct: stopLoss ? parseFloat(stopLoss) : null,
    });
    onClose();
  };

  const exportCSV = () => {
    const csv = toCSV(bets);
    downloadFile(csv, `mbet-apuestas-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };
  const exportBackup = () => {
    const data = JSON.stringify({ bets, movements, limits, version: 2, exportedAt: new Date().toISOString() }, null, 2);
    downloadFile(data, `mbet-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(reader.result);
          if (data.bets && data.movements) {
            onImport(data);
            alert('Backup restaurado ✓');
            onClose();
          }
        } else if (file.name.endsWith('.csv')) {
          const imported = fromCSV(reader.result);
          onImport({ bets: imported, movements });
          alert(`${imported.length} apuestas importadas ✓`);
          onClose();
        }
      } catch (err) {
        alert('Error al importar: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <ModalShell onClose={onClose} title="AJUSTES">
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(0,0,0,0.4)', padding: 4, borderRadius: 10 }}>
        {[['api', 'API'], ['limits', 'Límites'], ['data', 'Datos']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: 8, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: tab === id ? 'linear-gradient(180deg, #d4af37, #b8941f)' : 'transparent',
            color: tab === id ? '#0a0d0a' : '#9ca39a',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 14, background: 'rgba(212,175,55,0.06)', borderRadius: 10, fontSize: 12, color: '#9ca39a', lineHeight: 1.5 }}>
            Para usar la lectura de tickets y análisis IA necesitas una API key de Anthropic. Consigue la tuya en{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color: '#d4af37' }}>console.anthropic.com</a>.
            Tu clave se guarda solo en tu teléfono.
          </div>
          <div>
            <label>API Key de Anthropic</label>
            <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="sk-ant-..."/>
          </div>
          <button onClick={saveAll} style={styles.primaryBtn}>GUARDAR</button>
        </div>
      )}

      {tab === 'limits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 12, background: 'rgba(212,175,55,0.06)', borderRadius: 10, fontSize: 11, color: '#9ca39a' }}>
            Define límites para apostar con disciplina. Recibirás alertas cuando te acerques.
          </div>
          <div><label>Límite diario ($)</label><input type="number" inputMode="decimal" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} placeholder="Sin límite"/></div>
          <div><label>Límite semanal ($)</label><input type="number" inputMode="decimal" value={weeklyLimit} onChange={e => setWeeklyLimit(e.target.value)} placeholder="Sin límite"/></div>
          <div>
            <label>Stop-loss (% del bankroll)</label>
            <input type="number" inputMode="decimal" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="20"/>
            <div style={{ fontSize: 10, color: '#9ca39a', marginTop: 4 }}>Alerta cuando pierdas ese % del bankroll inicial del día</div>
          </div>
          <button onClick={saveAll} style={styles.primaryBtn}>GUARDAR</button>
        </div>
      )}

      {tab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={exportCSV} style={styles.ghostBtn}><Download size={15}/> Exportar CSV (Excel)</button>
          <button onClick={exportBackup} style={styles.ghostBtn}><Download size={15}/> Descargar backup completo</button>
          <button onClick={() => fileRef.current?.click()} style={styles.ghostBtn}><Upload size={15}/> Importar CSV o backup</button>
          <input ref={fileRef} type="file" accept=".csv,.json" onChange={handleImport} style={{ display: 'none' }}/>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }}/>
          <button onClick={() => { if (confirm('¿Borrar TODOS los datos? Esto no se puede deshacer.')) { localStorage.clear(); location.reload(); } }} style={styles.dangerBtn}>
            <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }}/> Borrar todos los datos
          </button>
        </div>
      )}
    </ModalShell>
  );
}

export function CloseDayModal({ onClose, onSave, todayStats }) {
  const [mood, setMood] = useState('neutral');
  const [reflection, setReflection] = useState('');

  const submit = () => {
    onSave({
      date: new Date().toISOString().split('T')[0],
      mood,
      reflection,
      stats: todayStats,
    });
  };

  return (
    <ModalShell onClose={onClose} title="CIERRE DEL DÍA">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 12, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 10, color: '#9ca39a', letterSpacing: '0.15em', marginBottom: 6 }}>RESULTADO HOY</div>
          <div className="display" style={{ fontSize: 38, color: todayStats.profit >= 0 ? '#4ade80' : '#f87171' }}>
            {fmt.moneySign(todayStats.profit)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: 11, color: '#9ca39a' }} className="mono">
            <span>{todayStats.count} APUESTAS</span>
            <span>{todayStats.won}W · {todayStats.lost}L</span>
          </div>
        </div>

        <div>
          <label>¿Cómo te sentiste hoy?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {MOODS.map(m => (
              <button key={m.value} onClick={() => setMood(m.value)} style={{
                padding: 10, border: '1px solid ' + (mood === m.value ? '#d4af37' : 'rgba(255,255,255,0.08)'),
                background: mood === m.value ? 'rgba(212,175,55,0.1)' : 'rgba(0,0,0,0.3)',
                borderRadius: 10, cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22 }}>{m.emoji}</div>
                <div style={{ fontSize: 9, color: '#9ca39a', marginTop: 2 }}>{m.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div><label>Reflexión (opcional)</label><textarea value={reflection} onChange={e => setReflection(e.target.value)} rows={3} placeholder="¿Qué aprendiste? ¿Qué harías distinto?"/></div>

        <button onClick={submit} style={styles.primaryBtn}>CERRAR DÍA</button>
      </div>
    </ModalShell>
  );
}
