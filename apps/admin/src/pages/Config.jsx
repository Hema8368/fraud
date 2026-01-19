import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Config() {
  const [cfg, setCfg] = useState({ w_anom:0.3, thresholds:{ blockRisk:0.8, challengeRisk:0.6 } });

  async function load() {
    const r = await api('/admin/config');
    setCfg(r.config || cfg);
  }
  async function save() {
    await api('/admin/config', { method:'PUT', body: cfg });
    await load();
  }

  useEffect(()=>{ load(); }, []);

  return (
    <div className="container">
      <div className="h1">Risk Config</div>
      <div className="card">
        <div className="row" style={{marginBottom:12}}>
          <label style={{width:160}}>ML Weight (w_anom)</label>
          <input className="input" type="number" step="0.05" min="0" max="1"
            value={cfg.w_anom} onChange={e=>setCfg({...cfg, w_anom: Number(e.target.value)})} />
        </div>
        <div className="row" style={{marginBottom:12}}>
          <label style={{width:160}}>Challenge ≥</label>
          <input className="input" type="number" step="0.05" min="0" max="1"
            value={cfg.thresholds.challengeRisk}
            onChange={e=>setCfg({...cfg, thresholds:{...cfg.thresholds, challengeRisk:Number(e.target.value)}})} />
        </div>
        <div className="row" style={{marginBottom:12}}>
          <label style={{width:160}}>Block ≥</label>
          <input className="input" type="number" step="0.05" min="0" max="1"
            value={cfg.thresholds.blockRisk}
            onChange={e=>setCfg({...cfg, thresholds:{...cfg.thresholds, blockRisk:Number(e.target.value)}})} />
        </div>
        <button className="button" onClick={save}>Save</button>
      </div>
    </div>
  );
}