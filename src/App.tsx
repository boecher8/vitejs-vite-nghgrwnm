import React, { useState, useEffect } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { jsPDF } from 'https://cdn.jsdelivr.net/npm/jspdf/+esm';
import logo from './logo.png'; 

const supabaseUrl = 'https://gkammcdnosumroyekagu.supabase.co';
const supabaseKey = 'sb_publishable_5Ww3Bq0uS5n3BZfPRdyxiA_DEkuoSDr';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function HobroScoutingApp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [spillere, setSpillere] = useState([]);
  const [visFormular, setVisFormular] = useState(false);
  const [redigeringsId, setRedigeringsId] = useState(null);
  const [valgtAargang, setValgtAargang] = useState('Alle');
  
  const initialFormData = {
    dato: new Date().toISOString().split('T')[0],
    navn: '', klub: '', aargang: '2014', foedt: '', rve: '1', position: '', ben: 'Højre', bedoemt_af: '',
    teknik: 1, taktisk: 1, fysisk: 1, sammenhold: 1, speed: 1, indsats_rve: 1,
    pros: '', cons: '', udvikling: '', spillertype: 'Spilfordeler', niveau: '', video_link: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  // LINKET TIL DIN PDF FIL I SUPABASE
  const manualUrl = "https://gkammcdnosumroyekagu.supabase.co/storage/v1/object/public/manual/scout_manual_2026_HIK.pdf"

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleUserSession(session.user);
    });
  }, []);

  const handleUserSession = async (currUser) => {
    setUser(currUser);
    hentSpillere();
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login fejl: " + error.message);
    else handleUserSession(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const hentSpillere = async () => {
    const { data } = await supabase
      .from('spillere')
      .select('*')
      .order('samlet_score', { ascending: false });
    setSpillere(data || []);
  };

  const formaterTal = (num) => {
    const n = parseFloat(num);
    return isNaN(n) ? '0,0' : n.toFixed(1).replace('.', ',');
  };

  const getScoreStyle = (score) => {
    const s = parseFloat(score);
    let bgColor = '#ef5350'; 
    let textColor = 'white';
    if (s >= 4.5) bgColor = '#1b5e20';
    else if (s >= 3,99) bgColor = '#4caf50';
    else if (s >= 3.49) { bgColor = '#ccff90'; textColor = 'black'; }
    else if (s >= 2.49) { bgColor = '#ffa726'; textColor = 'black'; }
    return { backgroundColor: bgColor, color: textColor };
  };

  const beregnScore = () => {
    const sum = Number(formData.teknik) + Number(formData.taktisk) + Number(formData.fysisk) + 
                Number(formData.sammenhold) + Number(formData.speed) + Number(formData.indsats_rve);
    return (sum / 6).toFixed(1);
  };

  const gemSpiller = async () => {
    const samletScore = beregnScore();
    const rveTal = String(formData.rve).charAt(0); 
    const dataTilGem = { 
      ...formData, 
      samlet_score: parseFloat(samletScore.replace(',', '.')),
      rve: parseInt(rveTal),
      teknik: parseInt(formData.teknik),
      taktisk: parseInt(formData.taktisk),
      fysisk: parseInt(formData.fysisk),
      sammenhold: parseInt(formData.sammenhold),
      speed: parseInt(formData.speed),
      indsats_rve: parseInt(formData.indsats_rve)
    };
    
    if (!formData.video_link || formData.video_link.trim() === '') delete dataTilGem.video_link;

    const { error } = redigeringsId 
      ? await supabase.from('spillere').update(dataTilGem).eq('id', redigeringsId)
      : await supabase.from('spillere').insert([dataTilGem]);

    if (error) alert("Fejl ved gem: " + error.message);
    else { setVisFormular(false); hentSpillere(); }
  };

  const clean = (val) => (val === null || val === undefined || val === 'null' ? '' : val);

  const genererPDF = (s) => {
    const doc = new jsPDF();
    const blue = [0, 86, 164];
    const yellow = [253, 239, 66];
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HOBRO IK SCOUTING RAPPORT", 15, 22);
    doc.setFontSize(9);
    doc.text(`Dato: ${clean(s.dato)}`, 165, 15);
    doc.text(`Bedømt af: ${clean(s.bedoemt_af)}`, 165, 20);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(clean(s.navn).toUpperCase(), 15, 50);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 53, 195, 53);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Klub: ${clean(s.klub)}`, 15, 62);
    doc.text(`Årgang: ${clean(s.aargang)}`, 15, 68);
    doc.text(`Født: ${clean(s.foedt)}`, 15, 74);
    doc.text(`Niveau: ${clean(s.niveau)}`, 15, 80);
    doc.text(`Position: ${clean(s.position)}`, 85, 62);
    doc.text(`Type: ${clean(s.spillertype)}`, 85, 68);
    doc.text(`RVE: ${clean(s.rve)}`, 85, 74);
    doc.text(`Foretrukket ben: ${clean(s.ben)}`, 85, 80);
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.roundedRect(155, 58, 45, 25, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SAMLET SCORE", 157, 68);
    doc.setFontSize(16);
    doc.text(formaterTal(s.samlet_score), 173, 78);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.text("KARAKTER (1-6)", 15, 100);
    const scores = [["Teknik", s.teknik], ["Taktisk", s.taktisk], ["Fysisk indsats", s.fysisk], ["Sammenhold og Indstilling", s.sammenhold], ["Speed og motorik", s.speed], ["Generel indsats ift. RVE", s.indsats_rve]];
    scores.forEach((item, index) => {
      const y = 110 + (index * 8);
      doc.setTextColor(0,0,0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(item[0], 15, y);
      doc.setFillColor(240, 240, 240);
      doc.rect(70, y-4, 90, 5, 'F');
      doc.setFillColor(yellow[0], yellow[1], yellow[2]);
      doc.rect(70, y-4, (Number(item[1] || 0) / 6) * 90, 5, 'F');
      doc.setFont("helvetica", "bold");
      doc.text(formaterTal(item[1]), 165, y);
    });
    let currentY = 170;
    [["PROS", s.pros], ["CONS", s.cons], ["UDVIKLINGSPOTENTIALE", s.udvikling]].forEach(sek => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(blue[0], blue[1], blue[2]);
      doc.text(sek[0], 15, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0,0,0);
      const splitText = doc.splitTextToSize(clean(sek[1]) || '-', 180);
      doc.text(splitText, 15, currentY + 6);
      currentY += (splitText.length * 5) + 12;
    });
    doc.save(`Scouting_Rapport_${s.navn}.pdf`);
  };

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '12px' };
  const areaStyle = { ...inputStyle, minHeight: '100px', fontFamily: 'sans-serif' };
  const labelStyle = { display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#444', marginBottom: '4px', marginTop: '10px' };

  if (!user) {
    return (
      <div style={{backgroundColor: '#0056a4', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif'}}>
        <img src={logo} alt="Logo" style={{width: '120px', marginBottom: '10px'}} />
        <div style={{width: '100%', maxWidth: '320px', backgroundColor: 'white', padding: '25px', borderRadius: '12px'}}>
          <input type="email" placeholder="Email" style={inputStyle} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Adgangskode" style={inputStyle} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          <button onClick={handleLogin} style={{width: '100%', padding: '14px', backgroundColor: '#fdef42', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: '#0056a4', cursor: 'pointer'}}>LOG IND</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
      <header style={{backgroundColor: '#0056a4', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100}}>
        <div style={{flex: 1}}>
          <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>HIK Scouting</div>
          <div style={{fontSize: '0.7rem', opacity: 0.8}}>{user?.email}</div>
        </div>
        <div style={{display: 'flex', gap: '8px', flexShrink: 0}}>
          <button onClick={() => window.open(manualUrl, '_blank')} style={{backgroundColor: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', color: '#0056a4', fontSize: '12px', cursor: 'pointer'}}>SCOUT MANUAL</button>
          <button onClick={() => {setFormData(initialFormData); setRedigeringsId(null); setVisFormular(true);}} style={{backgroundColor: '#fdef42', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', color: '#0056a4', fontSize: '12px'}}>+ NY SPILLER</button>
          <button onClick={handleLogout} style={{backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px'}}>LOG UD</button>
        </div>
      </header>

      {visFormular ? (
        <div style={{padding: '15px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white'}}>
          <h2 style={{fontWeight: 'bold'}}>Stamdata</h2>
          <label style={labelStyle}>DATO</label>
          <input type="date" style={inputStyle} value={formData.dato} onChange={e => setFormData({...formData, dato: e.target.value})} />
          <input type="text" placeholder="Navn" style={inputStyle} value={formData.navn} onChange={e => setFormData({...formData, navn: e.target.value})} />
          <input type="text" placeholder="Klub" style={inputStyle} value={formData.klub} onChange={e => setFormData({...formData, klub: e.target.value})} />
          <input type="text" placeholder="Niveau" style={inputStyle} value={formData.niveau} onChange={e => setFormData({...formData, niveau: e.target.value})} />
          <input type="text" placeholder="Født (DD-MM-ÅÅ)" style={inputStyle} value={formData.foedt} onChange={e => setFormData({...formData, foedt: e.target.value})} />
          <div style={{display: 'flex', gap: '10px'}}><div style={{flex: 1}}><label style={labelStyle}>ÅRGANG</label><select style={inputStyle} value={formData.aargang} onChange={e => setFormData({...formData, aargang: e.target.value})}>{['2013', '2014', '2015', '2016', '2017', '2018', '2019'].map(aar => <option key={aar} value={aar}>{aar}</option>)}</select></div><div style={{flex: 1}}><label style={labelStyle}>BEN</label><select style={inputStyle} value={formData.ben} onChange={e => setFormData({...formData, ben: e.target.value})}>{['Højre', 'Venstre', 'Begge'].map(b => <option key={b} value={b}>{b}</option>)}</select></div></div>
          <label style={labelStyle}>SPILLERTYPE</label>
          <select style={inputStyle} value={formData.spillertype} onChange={e => setFormData({...formData, spillertype: e.target.value})}>{['Den høje', 'Spilfordeler', 'Den hurtige', 'Afslutteren', 'Den udfordrende', 'Den aggressive'].map(t => <option key={t} value={t}>{t}</option>)}</select>
          <input type="text" placeholder="Position" style={inputStyle} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
          <label style={labelStyle}>RVE</label>
          <select style={inputStyle} value={formData.rve} onChange={e => setFormData({...formData, rve: e.target.value})}>
            <option value="1">1 (Lille)</option>
            <option value="2">2 (Mellem)</option>
            <option value="3">3 (Stor)</option>
          </select>
          <input type="text" placeholder="Bedømt af" style={inputStyle} value={formData.bedoemt_af} onChange={e => setFormData({...formData, bedoemt_af: e.target.value})} />
          <h2 style={{fontWeight: 'bold', marginTop: '30px'}}>Karakterer (1-6)</h2>
          {['teknik', 'taktisk', 'fysisk', 'sammenhold', 'speed', 'indsats_rve'].map(f => (
            <div key={f}><label style={labelStyle}>{f === 'fysisk' ? 'FYSISK INDSATS' : f === 'sammenhold' ? 'SAMMENHOLD OG INDSTILLING' : f === 'speed' ? 'SPEED OG MOTORIK' : f === 'indsats_rve' ? 'GENEREL INDSATS IFT. RVE' : f.toUpperCase()}</label><select style={inputStyle} value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          ))}
          <h2 style={{fontWeight: 'bold', marginTop: '30px'}}>Notater & Medier</h2>
          <label style={labelStyle}>PROS</label><textarea style={areaStyle} value={formData.pros} onChange={e => setFormData({...formData, pros: e.target.value})} />
          <label style={labelStyle}>CONS</label><textarea style={areaStyle} value={formData.cons} onChange={e => setFormData({...formData, cons: e.target.value})} />
          <label style={labelStyle}>UDVIKLINGSPOTENTIALE</label><textarea style={areaStyle} value={formData.udvikling} onChange={e => setFormData({...formData, udvikling: e.target.value})} />
          <label style={labelStyle}>VIDEO LINK (URL)</label><input type="text" style={inputStyle} value={formData.video_link} onChange={e => setFormData({...formData, video_link: e.target.value})} />
          <button onClick={gemSpiller} style={{width: '100%', padding: '16px', backgroundColor: '#0056a4', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer'}}>GEM RAPPORT</button>
          <button onClick={() => setVisFormular(false)} style={{width: '100%', padding: '12px', color: 'red', background: 'none', border: 'none', cursor: 'pointer'}}>Fortryd</button>
        </div>
      ) : (
        <div style={{padding: '8px'}}>
          <div style={{display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '5px'}}>
            {['Alle', '2013', '2014', '2015', '2016', '2017', '2018', '2019'].map(aar => (
              <button key={aar} onClick={() => setValgtAargang(aar)} style={{padding: '5px 12px', borderRadius: '20px', border: 'none', backgroundColor: valgtAargang === aar ? '#0056a4' : 'white', color: valgtAargang === aar ? 'white' : 'black', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer'}}>{aar}</button>
            ))}
          </div>
          {spillere.filter(s => valgtAargang === 'Alle' || String(s.aargang) === valgtAargang).map(s => {
            const scoreStyle = getScoreStyle(s.samlet_score);
            return (
              <div key={s.id} onClick={() => {setFormData(s); setRedigeringsId(s.id); setVisFormular(true);}} style={{
                backgroundColor: 'white', padding: '12px', borderRadius: '8px', marginBottom: '8px', 
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr auto', alignItems: 'center', gap: '15px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee'
              }}>
                <div>
                  <div style={{fontWeight: 'bold', fontSize: '1.1rem', color: '#333'}}>{s.navn}</div>
                  <div style={{fontSize: '0.8rem', color: '#888'}}>{s.aargang} • {s.dato}</div>
                </div>
                <div>
                  <div style={{fontWeight: 'bold', fontSize: '1rem', color: '#0056a4'}}>{s.klub}</div>
                  <div style={{fontSize: '0.75rem', color: '#666'}}>{s.spillertype} • {s.position}</div>
                </div>
                <div style={{...scoreStyle, width: '45px', height: '45px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', justifySelf: 'center'}}>
                    {formaterTal(s.samlet_score)}
                </div>
                <button onClick={(e) => { e.stopPropagation(); genererPDF(s); }} style={{backgroundColor: '#fdef42', border: 'none', borderRadius: '4px', padding: '8px 12px', fontSize: '10px', fontWeight: 'bold', color: '#0056a4', cursor: 'pointer'}}>PDF</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}