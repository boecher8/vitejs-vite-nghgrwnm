import React, { useState, useEffect } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import logo from './logo.png'; 

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
    spillertype: 'Spilfordeler',
    niveau: '' 
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => { if (isLoggedIn) hentSpillere(); }, [isLoggedIn]);

  const hentSpillere = async () => {
    const { data, error } = await supabase
      .from('spillere')
      .select('*')
      .order('samlet_score', { ascending: false }) // Sorterer efter højeste score
      .order('dato', { ascending: false });        // Ved ens score, tag den nyeste dato
    
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

  // Kompakt input stil med Segoe UI
  const inputStyle = { 
    width: '100%', 
    padding: '8px', 
    marginBottom: '8px', 
    borderRadius: '4px', 
    border: '1px solid #ccc', 
    boxSizing: 'border-box', 
    color: '#333',
    fontSize: '14px',
    fontFamily: '"Segoe UI", Tahoma, sans-serif'
  };

  if (!isLoggedIn) {
    return (
      <div style={{backgroundColor: '#0056a4', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: '"Segoe UI", Tahoma, sans-serif', padding: '20px'}}>
        <img 
          src={logo} 
          alt="HIK Logo" 
          style={{width: '160px', marginBottom: '20px', objectFit: 'contain'}} 
        />
        <h1 style={{marginBottom: '20px', letterSpacing: '2px', textAlign: 'center', fontSize: '1.4rem', fontWeight: '400'}}>HOBRO IK SCOUTING</h1>
        <div style={{width: '100%', maxWidth: '280px'}}>
          <input 
            type="password" 
            placeholder="Password" 
            style={inputStyle} 
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (password === 'HIK1234' ? setIsLoggedIn(true) : alert('Forkert!'))} 
          />
          <button 
            onClick={() => password === 'HIK1234' ? setIsLoggedIn(true) : alert('Forkert!')} 
            style={{width: '100%', padding: '10px', backgroundColor: '#fdef42', border: 'none', borderRadius: '4px', fontWeight: 'bold', color: '#0056a4', cursor: 'pointer', fontSize: '14px'}}
          >
            LOG IND
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
      fontSize: '14px', 
      backgroundColor: '#f0f2f5', 
      minHeight: '100vh',
      color: '#333',
      lineHeight: '1.4'
    }}>
      <header style={{backgroundColor: '#0056a4', color: 'white', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100}}>
        <span style={{fontWeight: 'bold', fontSize: '16px'}}>HIK Scouting</span>
        <button onClick={aabenNyFormular} style={{backgroundColor: '#fdef42', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', color: '#0056a4', fontSize: '13px'}}>+ NY SPILLER</button>
      </header>

      {visFormular ? (
        <div style={{padding: '15px', backgroundColor: 'white'}}>
          <h3 style={{marginTop: 0, fontSize: '16px', fontWeight: '600'}}>{redigeringsId ? 'Rediger Rapport' : 'Stamdata & Tid'}</h3>
          
          <label style={{fontSize: '11px', fontWeight: 'bold', color: '#666'}}>DATO</label>
          <input type="date" style={inputStyle} value={formData.dato} onChange={e => setFormData({...formData, dato: e.target.value})} />
          
          <input type="text" placeholder="Navn" style={inputStyle} value={formData.navn} onChange={e => setFormData({...formData, navn: e.target.value})} />
          <input type="text" placeholder="Klub" style={inputStyle} value={formData.klub} onChange={e => setFormData({...formData, klub: e.target.value})} />
          <input type="text" placeholder="Niveau (f.eks. Liga 1)" style={inputStyle} value={formData.niveau} onChange={e => setFormData({...formData, niveau: e.target.value})} />
          <input type="text" placeholder="Født (DD-MM-ÅÅ)" style={inputStyle} value={formData.foedt} onChange={e => setFormData({...formData, foedt: e.target.value})} />
          
          <label style={{fontSize: '11px', fontWeight: 'bold', color: '#666'}}>ÅRGANG</label>
          <select style={inputStyle} value={formData.aargang} onChange={e => setFormData({...formData, aargang: e.target.value})}>
            {['2013', '2014', '2015', '2016', '2017', '2018', '2019'].map(aar => (
              <option key={aar} value={aar}>{aar}</option>
            ))}
          </select>

          <label style={{fontSize: '11px', fontWeight: 'bold', color: '#666'}}>SPILLERTYPE</label>
          <select style={inputStyle} value={formData.spillertype} onChange={e => setFormData({...formData, spillertype: e.target.value})}>
            {['Den høje', 'Spilfordeler', 'Den hurtige', 'Afslutteren', 'Den udfordrende', 'Den aggressive'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <label style={{fontSize: '11px', fontWeight: 'bold', color: '#666'}}>RVE (1-3)</label>
          <select style={inputStyle} value={formData.rve} onChange={e => setFormData({...formData, rve: e.target.value})}>
            <option value="1">1 (Lille)</option><option value="2">2 (Mellem)</option><option value="3">3 (Stor)</option>
          </select>

          <input type="text" placeholder="Position" style={inputStyle} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
          
          <label style={{fontSize: '11px', fontWeight: 'bold', color: '#666'}}>FORETRUKKET BEN</label>
          <select style={inputStyle} value={formData.ben} onChange={e => setFormData({...formData, ben: e.target.value})}>
            <option value="Højre">Højre</option><option value="Venstre">Venstre</option><option value="Begge">Begge</option>
          </select>
          
          <input type="text" placeholder="Bedømt af" style={inputStyle} value={formData.bedoemt_af} onChange={e => setFormData({...formData, bedoemt_af: e.target.value})} />

          <h3 style={{fontSize: '16px', fontWeight: '600'}}>Karakterer (1-6)</h3>
          {['teknik', 'taktisk', 'fysisk', 'sammenhold', 'speed', 'indsats_rve'].map(felt => (
            <div key={felt} style={{marginBottom: '4px'}}>
              <label style={{fontSize: '11px', color: '#666'}}>{felt.toUpperCase()}</label>
              <select style={inputStyle} value={formData[felt]} onChange={e => setFormData({...formData, [felt]: e.target.value})}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}

          <h3 style={{fontSize: '16px', fontWeight: '600'}}>Noter</h3>
          <textarea placeholder="Pros" style={{...inputStyle, height: '50px'}} value={formData.pros} onChange={e => setFormData({...formData, pros: e.target.value})} />
          <textarea placeholder="Cons" style={{...inputStyle, height: '50px'}} value={formData.cons} onChange={e => setFormData({...formData, cons: e.target.value})} />
          <textarea placeholder="Udviklingsmuligheder" style={{...inputStyle, height: '50px'}} value={formData.udvikling} onChange={e => setFormData({...formData, udvikling: e.target.value})} />

          <button onClick={gemSpiller} style={{width: '100%', padding: '12px', backgroundColor: '#0056a4', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', marginTop: '10px'}}>
            {redigeringsId ? 'OPDATER RAPPORT' : 'GEM RAPPORT'}
          </button>
          <button onClick={() => setVisFormular(false)} style={{width: '100%', padding: '10px', color: 'red', background: 'none', border: 'none', fontSize: '13px'}}>Fortryd</button>
        </div>
      ) : (
        <div style={{padding: '12px'}}>
          <div style={{display: 'flex', gap: '6px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px'}}>
            {['Alle', '2013', '2014', '2015', '2016', '2017', '2018', '2019'].map(aar => (
              <button key={aar} onClick={() => setValgtAargang(aar)} style={{padding: '6px 12px', borderRadius: '15px', border: 'none', flexShrink: 0, backgroundColor: valgtAargang === aar ? '#0056a4' : 'white', color: valgtAargang === aar ? 'white' : 'black', fontSize: '13px'}}>{aar}</button>
            ))}
          </div>
          {spillere.filter(s => valgtAargang === 'Alle' || String(s.aargang) === valgtAargang).map(s => (
            <div key={s.id} onClick={() => aabenRedigering(s)} style={{backgroundColor: 'white', padding: '12px', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #fdef42', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
              <div style={{flex: 1}}>
                <div style={{fontWeight: '600', fontSize: '15px'}}>{s.navn} ({s.aargang})</div>
                <div style={{fontSize: '11px', color: '#777', margin: '2px 0'}}>
                   {s.dato} • {s.klub} {s.niveau ? `• ${s.niveau}` : ''}
                </div>
                <div style={{display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px'}}>
                  <span style={{fontSize: '10px', backgroundColor: '#0056a4', color: 'white', padding: '1px 7px', borderRadius: '10px', fontWeight: 'bold'}}>
                    {s.spillertype || 'Udefineret'}
                  </span>
                  <span style={{fontSize: '10px', color: '#999'}}>Pos: {s.position} • RVE: {s.rve}</span>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div style={{
                  backgroundColor: 
                    Number(s.samlet_score) > 4.49 ? '#2e7d32' : 
                    Number(s.samlet_score) > 3.49 ? '#66bb6a' : 
                    Number(s.samlet_score) > 2.99 ? '#c8e6c9' : 
                    Number(s.samlet_score) > 2.49 ? '#ffa726' : 
                    '#ef5350',
                  color: (Number(s.samlet_score) > 2.99 && Number(s.samlet_score) < 3.5) ? '#333' : 'white',
                  padding: '8px', 
                  borderRadius: '4px', 
                  fontWeight: 'bold', 
                  minWidth: '35px', 
                  textAlign: 'center',
                  fontSize: '15px'
                }}>
                  {s.samlet_score}
                </div>
                <span style={{color: '#0056a4', fontSize: '18px'}}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}