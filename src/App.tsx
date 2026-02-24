import React, { useState, useEffect } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://gkammcdnosumroyekagu.supabase.co';
const supabaseKey = 'sb_publishable_5Ww3Bq0uS5n3BZfPRdyxiA_DEkuoSDr';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function HobroScoutingApp() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [valgtAargang, setValgtAargang] = useState('Alle');
  const [visFormular, setVisFormular] = useState(false);
  const [redigeringsId, setRedigeringsId] = useState(null);
  const [spillere, setSpillere] = useState([]);
  
  const initialFormData = {
    dato: new Date().toISOString().split('T')[0],
    navn: '', klub: '', aargang: '2014', foedt: '', rve: '1', position: '', ben: 'Højre', bedoemt_af: '',
    teknik: 1, taktisk: 1, fysisk: 1, sammenhold: 1, speed: 1, indsats_rve: 1,
    pros: '', cons: '', udvikling: '', oplevelse: 'Middel', proces: 'Skal følges',
    spillertype: 'Spilfordeler'
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => { if (isLoggedIn) hentSpillere(); }, [isLoggedIn]);

  const hentSpillere = async () => {
    const { data, error } = await supabase.from('spillere').select('*').order('samlet_score', { ascending: false });
    if (!error) setSpillere(data || []);
  };

  const beregnScore = () => {
    const sum = Number(formData.teknik) + Number(formData.taktisk) + Number(formData.fysisk) + 
                Number(formData.sammenhold) + Number(formData.speed) + Number(formData.indsats_rve);
    return (sum / 6).toFixed(1);
  };

  const aabenNyFormular = () => {
    setFormData(initialFormData);
    setRedigeringsId(null);
    setVisFormular(true);
  };

  const aabenRedigering = (spiller) => {
    setFormData(spiller);
    setRedigeringsId(spiller.id);
    setVisFormular(true);
  };

  const gemSpiller = async () => {
    const dataTilGem = { ...formData, samlet_score: beregnScore() };
    
    let error;
    if (redigeringsId) {
      const { error: updateError } = await supabase.from('spillere').update(dataTilGem).eq('id', redigeringsId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('spillere').insert([dataTilGem]);
      error = insertError;
    }

    if (error) alert("Fejl: " + error.message);
    else { 
      alert(redigeringsId ? "Rapport opdateret!" : "Rapport gemt!"); 
      setVisFormular(false); 
      hentSpillere(); 
    }
  };

  const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', color: '#333' };

  if (!isLoggedIn) {
    return (
      <div style={{backgroundColor: '#0056a4', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'sans-serif', padding: '20px'}}>
        <h1 style={{marginBottom: '20px', letterSpacing: '2px', textAlign: 'center'}}>HOBRO IK SCOUTING</h1>
        <input 
          type="text" 
          placeholder="Password" 
          style={inputStyle} 
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (password === 'HIK1234' ? setIsLoggedIn(true) : alert('Forkert!'))} 
        />
        <button 
          onClick={() => password === 'HIK1234' ? setIsLoggedIn(true) : alert('Forkert!')} 
          style={{padding: '10px 30px', backgroundColor: '#fdef42', border: 'none', borderRadius: '5px', fontWeight: 'bold', color: '#0056a4'}}
        >
          LOG IND
        </button>
      </div>
    );
  }

  return (
    <div style={{fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh'}}>
      <header style={{backgroundColor: '#0056a4', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontWeight: 'bold'}}>HIK Scouting</span>
        <button onClick={aabenNyFormular} style={{backgroundColor: '#fdef42', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', color: '#0056a4'}}>+ NY SPILLER</button>
      </header>

      {visFormular ? (
        <div style={{padding: '20px', backgroundColor: 'white'}}>
          <h3>{redigeringsId ? 'Rediger Rapport' : 'Stamdata & Tid'}</h3>
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>DATO</label>
          <input type="date" style={inputStyle} value={formData.dato} onChange={e => setFormData({...formData, dato: e.target.value})} />
          
          <input type="text" placeholder="Navn" style={inputStyle} value={formData.navn} onChange={e => setFormData({...formData, navn: e.target.value})} />
          <input type="text" placeholder="Klub" style={inputStyle} value={formData.klub} onChange={e => setFormData({...formData, klub: e.target.value})} />
          <input type="text" placeholder="Født (DD-MM-ÅÅ)" style={inputStyle} value={formData.foedt} onChange={e => setFormData({...formData, foedt: e.target.value})} />
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>ÅRGANG</label>
          <select style={inputStyle} value={formData.aargang} onChange={e => setFormData({...formData, aargang: e.target.value})}>
            {['2013', '2014', '2015', '2016', '2017', '2018', '2019'].map(aar => (
              <option key={aar} value={aar}>{aar}</option>
            ))}
          </select>

          <label style={{fontSize: '12px', fontWeight: 'bold'}}>SPILLERTYPE</label>
          <select style={inputStyle} value={formData.spillertype} onChange={e => setFormData({...formData, spillertype: e.target.value})}>
            {['Den høje', 'Spilfordeler', 'Den hurtige', 'Afslutteren', 'Den udfordrende', 'Den aggressive'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>RVE (1-3)</label>
          <select style={inputStyle} value={formData.rve} onChange={e => setFormData({...formData, rve: e.target.value})}>
            <option value="1">1 (Lille)</option><option value="2">2 (Mellem)</option><option value="3">3 (Stor)</option>
          </select>

          <input type="text" placeholder="Position" style={inputStyle} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>FORETRUKKET BEN</label>
          <select style={inputStyle} value={formData.ben} onChange={e => setFormData({...formData, ben: e.target.value})}>
            <option value="Højre">Højre</option><option value="Venstre">Venstre</option><option value="Begge">Begge</option>
          </select>
          
          <input type="text" placeholder="Bedømt af" style={inputStyle} value={formData.bedoemt_af} onChange={e => setFormData({...formData, bedoemt_af: e.target.value})} />

          <h3>Karakterer (1-6)</h3>
          {['teknik', 'taktisk', 'fysisk', 'sammenhold', 'speed', 'indsats_rve'].map(felt => (
            <div key={felt} style={{marginBottom: '5px'}}>
              <label style={{fontSize: '12px'}}>{felt.toUpperCase()}</label>
              <select style={inputStyle} value={formData[felt]} onChange={e => setFormData({...formData, [felt]: e.target.value})}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}

          <h3>Noter & Vurdering</h3>
          <textarea placeholder="Pros" style={{...inputStyle, height: '60px'}} value={formData.pros} onChange={e => setFormData({...formData, pros: e.target.value})} />
          <textarea placeholder="Cons" style={{...inputStyle, height: '60px'}} value={formData.cons} onChange={e => setFormData({...formData, cons: e.target.value})} />
          <textarea placeholder="Udviklingsmuligheder" style={{...inputStyle, height: '60px'}} value={formData.udvikling} onChange={e => setFormData({...formData, udvikling: e.target.value})} />

          <button onClick={gemSpiller} style={{width: '100%', padding: '15px', backgroundColor: '#0056a4', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold'}}>
            {redigeringsId ? 'OPDATER RAPPORT' : 'GEM RAPPORT'}
          </button>
          <button onClick={() => setVisFormular(false)} style={{width: '100%', padding: '10px', color: 'red', background: 'none', border: 'none'}}>Fortryd</button>
        </div>
      ) : (
        <div style={{padding: '15px'}}>
          <div style={{display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px'}}>
            {['Alle', '2013', '2014', '2015', '2016', '2017', '2018', '2019'].map(aar => (
              <button key={aar} onClick={() => setValgtAargang(aar)} style={{padding: '8px 15px', borderRadius: '20px', border: 'none', flexShrink: 0, backgroundColor: valgtAargang === aar ? '#0056a4' : 'white', color: valgtAargang === aar ? 'white' : 'black'}}>{aar}</button>
            ))}
          </div>
          {spillere.filter(s => valgtAargang === 'Alle' || String(s.aargang) === valgtAargang).map(s => (
            <div key={s.id} onClick={() => aabenRedigering(s)} style={{backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '5px solid #fdef42', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
              <div>
                <div style={{fontWeight: 'bold'}}>{s.navn} ({s.aargang})</div>
                <div style={{fontSize: '11px', color: '#666', marginBottom: '4px'}}>{s.klub} • {s.position}</div>
                <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                  <span style={{fontSize: '10px', backgroundColor: '#0056a4', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold'}}>
                    {s.spillertype || 'Udefineret'}
                  </span>
                  <span style={{fontSize: '10px', color: '#999'}}>RVE: {s.rve}</span>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{backgroundColor: '#0056a4', color: 'white', padding: '10px', borderRadius: '5px', fontWeight: 'bold', minWidth: '35px', textAlign: 'center'}}>{s.samlet_score}</div>
                <span style={{color: '#0056a4', fontSize: '20px'}}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}