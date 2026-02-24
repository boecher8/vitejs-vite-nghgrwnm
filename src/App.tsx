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

  // Sort tekst tilføjet her (color: '#333')
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
          <select style={inputStyle} value={formData.rve} onChange={e => setFormData({...formData, rve: e.target.value