import React, { useState, useEffect } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { jsPDF } from 'https://cdn.jsdelivr.net/npm/jspdf/+esm';
import logo from './logo.png'; 

// Tilføjer Montserrat globalt
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
  
  * { 
    font-family: 'Montserrat', sans-serif !important; 
    box-sizing: border-box; 
  }
  
  body { 
    margin: 0; 
    padding: 0; 
    background-color: #f8f9fa; 
  }

  input, button, select, textarea {
    font-family: 'Montserrat', sans-serif !important;
  }

  div::-webkit-scrollbar { display: none; }
`;
document.head.appendChild(styleTag);

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
  const [valgtKlub, setValgtKlub] = useState('Alle');
  const [valgteScores, setValgteScores] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');

  // NYT: State til versionshåndtering
  const [aktivVersion, setAktivVersion] = useState(1);
  const [spillerVersioner, setSpillerVersioner] = useState([]);
  const [gemmerVersion, setGemmerVersion] = useState(false);
  
  const initialFormData = {
    dato: new Date().toISOString().split('T')[0],
    navn: '', klub: '', aargang: '', foedt: '', rve: '', position: '', ben: '', bedoemt_af: '',
    teknik: 1, taktisk: 1, fysisk: 1, sammenhold: 1, speed: 1, indsats_rve: 1,
    pros: '', cons: '', udvikling: '', spillertype: '', niveau: '', video_link: '',
    spiller_billede: null,
    version: 1,  // NYT: version felt i initialFormData
    status: null  // NYT: status felt – null / 'skal_følges' / 'scouting_afsluttet'
  };

  const [formData, setFormData] = useState(initialFormData);

  const alleAargange = ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'];

  const manualUrl = "https://gkammcdnosumroyekagu.supabase.co/storage/v1/object/public/manual/scout_manual_2026_HIK.pdf";
  const ppModelUrl = "https://gkammcdnosumroyekagu.supabase.co/storage/v1/object/public/ppmodel/pp_model_2026.pdf";
  const bgImageUrl = "https://gkammcdnosumroyekagu.supabase.co/storage/v1/object/public/billeder/billede1hik.png";
  const logoPdfUrl = "https://gkammcdnosumroyekagu.supabase.co/storage/v1/object/public/logo/logo.png.png";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleUserSession(session.user);
    });
  }, []);

  // AUTOSAVE LOGIK
  useEffect(() => {
    if (visFormular && !redigeringsId) {
      localStorage.setItem('hik_scout_kladde', JSON.stringify(formData));
    }
  }, [formData, visFormular, redigeringsId]);

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

  // NYT: Gruppér spillere på navn – vis kun nyeste version per spiller på forsiden
  const getGruppereteSpillere = (filtrerede) => {
    const grouped = {};
    filtrerede.forEach(s => {
      const key = s.navn.toLowerCase().trim();
      if (!grouped[key]) {
        grouped[key] = s;
      } else {
        const eksisterendeVersion = grouped[key].version || 1;
        const nyVersion = s.version || 1;
        if (nyVersion > eksisterendeVersion) {
          grouped[key] = s;
        }
      }
    });
    return Object.values(grouped);
  };

  // NYT: Hent alle versioner for en spiller ved navn – RETTET: .eq matcher eksakt navn
  const hentVersionerForSpiller = async (navn) => {
    const { data } = await supabase
      .from('spillere')
      .select('*')
      .eq('navn', navn.trim())
      .order('version', { ascending: true });
    return data || [];
  };

  // NYT: Åbn spiller – hent alle versioner og åbn nyeste
  const aabneSpiller = async (s) => {
    const versioner = await hentVersionerForSpiller(s.navn);
    setSpillerVersioner(versioner);
    const nyeste = versioner.reduce((prev, curr) => 
      (curr.version || 1) > (prev.version || 1) ? curr : prev, versioner[0]);
    setFormData(nyeste);
    setRedigeringsId(nyeste.id);
    setAktivVersion(nyeste.version || 1);
    setVisFormular(true);
  };

  // NYT: Skift til en specifik version
  const skiftVersion = (v) => {
    const fundet = spillerVersioner.find(s => (s.version || 1) === v);
    if (fundet) {
      setFormData(fundet);
      setRedigeringsId(fundet.id);
      setAktivVersion(v);
    }
  };

  // NYT: Gem som ny version (V1–V5)
  const gemSomNyVersion = async () => {
    const eksisterendeVersioner = spillerVersioner.map(s => s.version || 1);
    const maxVersion = Math.max(...eksisterendeVersioner, 0);
    if (maxVersion >= 5) {
      alert("Maksimalt 5 versioner per spiller er nået. Slet en ældre version for at oprette ny.");
      return;
    }
    const nyVersionNummer = maxVersion + 1;
    setGemmerVersion(true);
    const samletScore = beregnScore();
    const rveTal = String(formData.rve).charAt(0);
    const { id: _fjernId, ...formUdenId } = formData;
    const dataTilGem = {
      ...formUdenId,
      version: nyVersionNummer,
      dato: new Date().toISOString().split('T')[0],
      samlet_score: parseFloat(samletScore.replace(',', '.')),
      rve: parseInt(rveTal),
      teknik: parseInt(formData.teknik),
      taktisk: parseInt(formData.taktisk),
      fysisk: parseInt(formData.fysisk),
      sammenhold: parseInt(formData.sammenhold),
      speed: parseInt(formData.speed),
      indsats_rve: parseInt(formData.indsats_rve)
    };
    if (!dataTilGem.video_link || dataTilGem.video_link.trim() === '') delete dataTilGem.video_link;
    const { error } = await supabase.from('spillere').insert([dataTilGem]);
    if (error) {
      alert("Fejl ved gem af ny version: " + error.message);
    } else {
      const opdatereteVersioner = await hentVersionerForSpiller(formData.navn);
      setSpillerVersioner(opdatereteVersioner);
      const nyRække = opdatereteVersioner.find(s => (s.version || 1) === nyVersionNummer);
      if (nyRække) {
        setFormData(nyRække);
        setRedigeringsId(nyRække.id);
        setAktivVersion(nyVersionNummer);
      }
      await hentSpillere();
    }
    setGemmerVersion(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFormData({ ...formData, spiller_billede: compressedDataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const formaterTal = (num) => {
    const n = parseFloat(num);
    return isNaN(n) ? '0,0' : n.toFixed(1).replace('.', ',');
  };

  const getScoreStyle = (score) => {
    const s = parseFloat(score);
    if (s >= 4.49) return { bgColor: '#1b5e20', textColor: 'white', label: 'Mørkegrøn', min: 4.5 };
    if (s >= 3.99) return { bgColor: '#4caf50', textColor: 'white', label: 'Grøn', min: 4.0 };
    if (s >= 3.49) return { bgColor: '#ccff90', textColor: 'black', label: 'Lysegrøn', min: 3.5 };
    if (s >= 3.00) return { bgColor: '#ffa726', textColor: 'black', label: 'Orange', min: 3.0 };
    return { bgColor: '#ef5350', textColor: 'white', label: 'Rød', min: 0 };
  };

  // NYT: Status badge style – SF (rød) og SA (blå)
  const getStatusBadge = (status) => {
    if (status === 'skal_følges') return { tekst: 'SF', bgColor: '#e53935', textColor: 'black' };
    if (status === 'scouting_afsluttet') return { tekst: 'SA', bgColor: '#0056a4', textColor: 'white' };
    return null;
  };

  // NYT: Skift status i formData lokalt – gemmes ved GEM RAPPORT
  const skiftStatus = (nyStatus) => {
    const statusVærdi = formData.status === nyStatus ? null : nyStatus;
    setFormData({ ...formData, status: statusVærdi });
  };

  const toggleScoreFilter = (label) => {
    if (label === 'Alle') {
      setValgteScores([]);
    } else {
      setValgteScores(prev => 
        prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
      );
    }
  };

  const getFiltreredeSpillere = () => {
    return spillere.filter(s => {
      const matchAargang = valgtAargang === 'Alle' || String(s.aargang) === valgtAargang;
      const matchKlub = valgtKlub === 'Alle' || s.klub === valgtKlub;
      const matchScore = valgteScores.length === 0 || valgteScores.includes(getScoreStyle(s.samlet_score).label);
      const matchSearch = s.navn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.klub.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAargang && matchKlub && matchScore && matchSearch;
    });
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
      indsats_rve: parseInt(formData.indsats_rve),
      version: aktivVersion || 1  // NYT: bevar versionsnummer ved gem
    };
    if (!formData.video_link || formData.video_link.trim() === '') delete dataTilGem.video_link;
    const { error } = redigeringsId 
      ? await supabase.from('spillere').update(dataTilGem).eq('id', redigeringsId)
      : await supabase.from('spillere').insert([dataTilGem]);
    
    if (error) {
      alert("Fejl ved gem: " + error.message);
    } else { 
      localStorage.removeItem('hik_scout_kladde');
      setVisFormular(false);
      // NYT: Nulstil version-state ved luk
      setSpillerVersioner([]);
      setAktivVersion(1);
      hentSpillere(); 
    }
  };

  const clean = (val) => (val === null || val === undefined || val === 'null' ? '' : val);

  const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const genererPDF = async (s) => {
    const doc = new jsPDF();
    const blue = [0, 86, 164];
    const yellow = [253, 239, 66];
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.rect(0, 0, 210, 35, 'F');
    try {
      const imgData = await getBase64ImageFromURL(logoPdfUrl);
      doc.addImage(imgData, 'PNG', 15, 7, 20, 20);
    } catch (e) { console.error("Kunne ikke hente logo:", e); }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("HOBRO IK SCOUTING RAPPORT", 45, 22);
    
    doc.setFontSize(9);
    doc.text(`Dato: ${clean(s.dato)}`, 165, 15);
    doc.text(`Bedømt af: ${clean(s.bedoemt_af)}`, 165, 20);
    // NYT: Vis version i PDF
    if (s.version && s.version > 0) {
      doc.text(`Version: V${s.version}`, 165, 25);
    }

    if (s.spiller_billede) {
        try {
            doc.addImage(s.spiller_billede, 'JPEG', 160, 40, 35, 45);
        } catch (e) { console.error("Kunne ikke indsætte spillerbillede:", e); }
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(clean(s.navn).toUpperCase(), 15, 50);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 53, 150, 53); 

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

    const boxX = 15;
    const boxY = 85;
    const boxWidth = 45;
    const centerX = boxX + (boxWidth / 2); 
    
    doc.setFillColor(blue[0], blue[1], blue[2]);
    doc.roundedRect(boxX, boxY, boxWidth, 20, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    
    doc.setFontSize(12);
    doc.text("SAMLET SCORE", centerX, boxY + 8, { align: "center" });
    
    doc.setFontSize(15);
    doc.text(formaterTal(s.samlet_score), centerX, boxY + 16, { align: "center" });

    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.text("KARAKTER (1-6)", 15, 115);

    const scores = [
      ["Teknik", s.teknik],
      ["Taktisk indsats", s.taktisk],
      ["Fysisk indsats", s.fysisk],
      ["Sammenhold/Indstilling", s.sammenhold],
      ["Speed/Motorik", s.speed],
      ["Generel indsats ift. RVE", s.indsats_rve]
    ];
    
    scores.forEach((item, index) => {
      const y = 125 + (index * 8);
      doc.setTextColor(0,0,0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(item[0], 15, y);
      doc.setFillColor(240, 240, 240);
      doc.rect(50, y-4, 100, 5, 'F');
      doc.setFillColor(yellow[0], yellow[1], yellow[2]);
      doc.rect(50, y-4, (Number(item[1] || 0) / 6) * 100, 5, 'F');
      doc.setFont("helvetica", "bold");
      doc.text(formaterTal(item[1]), 155, y);
    });

    let currentY = 180;
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

    if (clean(s.video_link)) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(blue[0], blue[1], blue[2]);
      doc.text("VIDEO LINK", 15, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const splitVideo = doc.splitTextToSize(clean(s.video_link), 180);
      doc.text(splitVideo, 15, currentY + 6);
      currentY += (splitVideo.length * 5) + 12;
    }

    // NYT: Filnavn inkluderer versionsnummer
    const versionSuffix = s.version ? `_V${s.version}` : '';
    doc.save(`Scouting_Rapport_${s.navn}${versionSuffix}.pdf`);
  };

  const eksporterTilCSV = () => {
    const filtreredeSpillere = getFiltreredeSpillere(); 
    if (filtreredeSpillere.length === 0) { alert("Ingen spillere at eksportere med de valgte filtre."); return; }
    const overskrifter = ["Navn", "Klub", "Niveau", "Årgang", "Fødselsdato", "RVE", "Foretrukket ben", "Samlet score"];
    const rækker = filtreredeSpillere.map(s => [s.navn, s.klub, s.niveau, s.aargang, s.foedt, s.rve, s.ben, formaterTal(s.samlet_score)]);
    let csvIndhold = "\uFEFF" + overskrifter.join(";") + "\n" + rækker.map(e => e.join(";")).join("\n");
    const blob = new Blob([csvIndhold], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `HIK_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const klubber = ['Alle', ...new Set(spillere.map(s => s.klub).filter(k => k))];

  const btnStyle = (active, customColor = null) => ({
    padding: '4px 10px', borderRadius: '20px', 
    border: customColor && !active ? `1px solid ${customColor}` : 'none', 
    backgroundColor: active ? (customColor || '#0056a4') : 'white', 
    color: active ? 'white' : 'black', 
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontSize: '11px', 
    whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal'
  });

  const topBtnStyle = (bg = 'white', color = '#0056a4') => ({
    backgroundColor: bg, border: 'none', padding: '6px 10px', 
    borderRadius: '4px', fontWeight: 'bold', color: color, 
    fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap',
    flex: '1', textAlign: 'center'
  });

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '12px', position: 'relative', zIndex: 2 };
  const areaStyle = { ...inputStyle, minHeight: '100px' };
  const labelStyle = { display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#444', marginBottom: '4px', marginTop: '10px', position: 'relative', zIndex: 2 };

  // NYT: Style til version-knapper
  const versionBtnStyle = (aktiv) => ({
    padding: '6px 14px',
    borderRadius: '20px',
    border: aktiv ? 'none' : '1px solid #0056a4',
    backgroundColor: aktiv ? '#0056a4' : 'white',
    color: aktiv ? 'white' : '#0056a4',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: aktiv ? '0 2px 6px rgba(0,86,164,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
    transition: 'all 0.15s ease'
  });

  if (!user) {
    return (
      <div style={{backgroundColor: '#0056a4', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
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
    <div style={{backgroundColor: '#f8f9fa', minHeight: '100vh', position: 'relative'}}>
      <header style={{backgroundColor: '#0056a4', color: 'white', padding: '8px 15px', position: 'sticky', top: 0, zIndex: 100}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
          <div style={{flex: '1'}}>
            <div style={{fontWeight: 'bold', fontSize: '0.95rem'}}>HIK Scouting</div>
            <div style={{fontSize: '0.6rem', opacity: 0.8}}>{user?.email}</div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px'}}>
            <div style={{display: 'flex', gap: '4px'}}>
               <button onClick={() => {
                   const gemt = localStorage.getItem('hik_scout_kladde');
                   if (gemt) {
                       if (confirm("Der findes en ugemt kladde. Vil du fortsætte, hvor du slap?")) {
                           setFormData(JSON.parse(gemt));
                       } else {
                           localStorage.removeItem('hik_scout_kladde');
                           setFormData(initialFormData);
                       }
                   } else {
                       setFormData(initialFormData);
                   }
                   setRedigeringsId(null);
                   // NYT: Nulstil version-state ved ny spiller
                   setSpillerVersioner([]);
                   setAktivVersion(1);
                   setVisFormular(true);
               }} style={topBtnStyle('#fdef42')}>OPRET SPILLER</button>
               <button onClick={handleLogout} style={topBtnStyle('#ff4d4d', 'white')}>LOG UD</button>
            </div>
            <div style={{display: 'flex', gap: '4px'}}>
              <button onClick={() => window.open(manualUrl, '_blank')} style={topBtnStyle()}>MANUAL</button>
              <button onClick={eksporterTilCSV} style={topBtnStyle()}>EXPORT</button>
              <button onClick={() => window.open(ppModelUrl, '_blank')} style={topBtnStyle()}>PP MODEL</button>
            </div>
          </div>
        </div>
        <div style={{backgroundColor: '#0056a4', paddingBottom: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px'}}>
          <input 
            type="text" 
            placeholder="Søg på navn eller klub..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', height: '32px', borderRadius: '6px', border: 'none', 
              padding: '0 12px', fontSize: '12px', outline: 'none', color: '#000'
            }}
          />
        </div>
      </header>

      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url('${bgImageUrl}')`, backgroundSize: '80%', 
        backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        opacity: 0.15, zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {visFormular ? (
          <div style={{padding: '15px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', marginTop: '10px'}}>
            
            {/* NYT: Versionsbånd – vises kun hvis der er flere versioner */}
            {spillerVersioner.length > 1 && (
              <div style={{
                backgroundColor: '#f0f4ff',
                border: '1px solid #d0ddf7',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 2
              }}>
                <span style={{fontSize: '11px', fontWeight: 'bold', color: '#0056a4', whiteSpace: 'nowrap'}}>VERSIONER:</span>
                {spillerVersioner.map(v => (
                  <button
                    key={v.id}
                    onClick={() => skiftVersion(v.version || 1)}
                    style={versionBtnStyle(aktivVersion === (v.version || 1))}
                  >
                    V{v.version || 1}
                    <span style={{fontSize: '9px', fontWeight: 'normal', marginLeft: '4px', opacity: 0.8}}>
                      {v.dato ? v.dato.slice(0, 7) : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <h2 style={{fontWeight: 'bold', position: 'relative', zIndex: 2}}>Stamdata & Billede</h2>
            
            <label style={labelStyle}>SPILLERBILLEDE</label>
            <div style={{marginBottom: '15px', position: 'relative', zIndex: 2}}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{marginBottom: '10px', fontSize: '12px'}} />
                {formData.spiller_billede && (
                    <div style={{marginTop: '5px'}}>
                        <img src={formData.spiller_billede} alt="Preview" style={{width: '80px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #0056a4'}} />
                        <button onClick={() => setFormData({...formData, spiller_billede: null})} style={{display: 'block', color: 'red', fontSize: '10px', background: 'none', border: 'none', padding: '2px', cursor: 'pointer'}}>Fjern billede</button>
                    </div>
                )}
            </div>

            <label style={labelStyle}>DATO</label>
            <input type="date" style={inputStyle} value={formData.dato} onChange={e => setFormData({...formData, dato: e.target.value})} />
            <input type="text" placeholder="Navn" style={inputStyle} value={formData.navn} onChange={e => setFormData({...formData, navn: e.target.value})} />
            <input type="text" placeholder="Klub" style={inputStyle} value={formData.klub} onChange={e => setFormData({...formData, klub: e.target.value})} />
            <input type="text" placeholder="Niveau" style={inputStyle} value={formData.niveau} onChange={e => setFormData({...formData, niveau: e.target.value})} />
            <input type="text" placeholder="Født (DD-MM-ÅÅ)" style={inputStyle} value={formData.foedt} onChange={e => setFormData({...formData, foedt: e.target.value})} />
            <div style={{display: 'flex', gap: '10px', position: 'relative', zIndex: 2}}>
                <div style={{flex: 1}}>
                    <label style={labelStyle}>ÅRGANG</label>
                    <select style={inputStyle} value={formData.aargang} onChange={e => setFormData({...formData, aargang: e.target.value})}>
                        <option value="">- Vælg -</option>
                        {alleAargange.map(aar => <option key={aar} value={aar}>{aar}</option>)}
                    </select>
                </div>
                <div style={{flex: 1}}>
                    <label style={labelStyle}>BEN</label>
                    <select style={inputStyle} value={formData.ben} onChange={e => setFormData({...formData, ben: e.target.value})}>
                        <option value="">- Vælg -</option>
                        {['Højre ben', 'Venstre ben', 'Begge ben'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>
            <label style={labelStyle}>SPILLERTYPE</label>
            <select style={inputStyle} value={formData.spillertype} onChange={e => setFormData({...formData, spillertype: e.target.value})}>
                <option value="">- Vælg -</option>
                {['Den høje', 'Spilfordeler', 'Den hurtige', 'Afslutteren', 'Den udfordrende', 'Den aggressive'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Position" style={inputStyle} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
            <label style={labelStyle}>RVE</label>
            <select style={inputStyle} value={formData.rve} onChange={e => setFormData({...formData, rve: e.target.value})}>
                <option value="">- Vælg -</option>
                <option value="1">1 (Lille)</option>
                <option value="2">2 (Mellem)</option>
                <option value="3">3 (Stor)</option>
            </select>
            <input type="text" placeholder="Bedømt af" style={inputStyle} value={formData.bedoemt_af} onChange={e => setFormData({...formData, bedoemt_af: e.target.value})} />
            
            <h2 style={{fontWeight: 'bold', marginTop: '30px', position: 'relative', zIndex: 2}}>Karakterer (1-6)</h2>
            {['teknik', 'taktisk', 'fysisk', 'sammenhold', 'speed', 'indsats_rve'].map(f => (
              <div key={f}>
                <label style={labelStyle}>{f === 'fysisk' ? 'FYSISK INDSATS' : f === 'sammenhold' ? 'SAMMENHOLD OG INDSTILLING' : f === 'speed' ? 'SPEED OG MOTORIK' : f === 'indsats_rve' ? 'GENEREL INDSATS IFT. RVE' : f.toUpperCase()}</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', marginTop: '5px', position: 'relative', zIndex: 2 }}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div
                      key={n}
                      onClick={() => setFormData({ ...formData, [f]: n })}
                      style={{
                        width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #0056a4',
                        backgroundColor: Number(formData[f]) === n ? '#0056a4' : 'white',
                        color: Number(formData[f]) === n ? 'white' : '#0056a4',
                        fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s ease'
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <h2 style={{fontWeight: 'bold', marginTop: '30px', position: 'relative', zIndex: 2}}>Notater & Medier</h2>
            <label style={labelStyle}>PROS</label><textarea style={areaStyle} value={formData.pros} onChange={e => setFormData({...formData, pros: e.target.value})} />
            <label style={labelStyle}>CONS</label><textarea style={areaStyle} value={formData.cons} onChange={e => setFormData({...formData, cons: e.target.value})} />
            <label style={labelStyle}>UDVIKLINGSPOTENTIALE</label><textarea style={areaStyle} value={formData.udvikling} onChange={e => setFormData({...formData, udvikling: e.target.value})} />
            <label style={labelStyle}>VIDEO LINK (URL)</label><input type="text" style={inputStyle} value={formData.video_link} onChange={e => setFormData({...formData, video_link: e.target.value})} />

            {/* NYT: STATUS KNAPPER – Skal følges / Scouting afsluttet */}
            <h2 style={{fontWeight: 'bold', marginTop: '30px', position: 'relative', zIndex: 2}}>Status</h2>
            <div style={{display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', position: 'relative', zIndex: 2}}>
              <button
                onClick={() => skiftStatus('skal_følges')}
                style={{
                  flex: 1, minWidth: '140px', padding: '12px',
                  backgroundColor: formData.status === 'skal_følges' ? '#e53935' : 'white',
                  color: formData.status === 'skal_følges' ? 'black' : '#333',
                  border: formData.status === 'skal_følges' ? 'none' : '2px solid #e53935',
                  borderRadius: '8px', fontWeight: 'bold', fontSize: '13px',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                {formData.status === 'skal_følges' ? '✓ ' : ''}SF – Skal følges
              </button>
              <button
                onClick={() => skiftStatus('scouting_afsluttet')}
                style={{
                  flex: 1, minWidth: '140px', padding: '12px',
                  backgroundColor: formData.status === 'scouting_afsluttet' ? '#0056a4' : 'white',
                  color: formData.status === 'scouting_afsluttet' ? 'black' : '#333',
                  border: formData.status === 'scouting_afsluttet' ? 'none' : '2px solid #0056a4',
                  borderRadius: '8px', fontWeight: 'bold', fontSize: '13px',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                {formData.status === 'scouting_afsluttet' ? '✓ ' : ''}SA – Scouting afsluttet
              </button>
            </div>
            
            {/* NYT: GEM SOM NY VERSION knap – vises altid når man redigerer eksisterende spiller */}
            {redigeringsId && (
              <div style={{
                margin: '20px 0 0 0',
                padding: '14px',
                backgroundColor: '#f0f4ff',
                border: '1px solid #d0ddf7',
                borderRadius: '8px',
                position: 'relative',
                zIndex: 2
              }}>
                <div style={{fontSize: '12px', color: '#0056a4', fontWeight: 'bold', marginBottom: '8px'}}>
                  GEM SOM NY VERSION
                </div>
                <div style={{fontSize: '11px', color: '#666', marginBottom: '10px'}}>
                  Gemmer en ny version ({spillerVersioner.length > 0 ? `V${Math.min(Math.max(...spillerVersioner.map(v => v.version || 1)) + 1, 5)}` : 'V2'}) og bevarer den nuværende rapport uændret. Maks. 5 versioner.
                </div>
                <button
                  onClick={gemSomNyVersion}
                  disabled={gemmerVersion || spillerVersioner.length >= 5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: spillerVersioner.length >= 5 ? '#ccc' : '#0056a4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: spillerVersioner.length >= 5 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    opacity: gemmerVersion ? 0.7 : 1
                  }}
                >
                  {gemmerVersion ? 'GEMMER...' : spillerVersioner.length >= 5 ? 'MAKS. VERSIONER NÅET (5/5)' : `➕ GEM SOM NY VERSION`}
                </button>
              </div>
            )}

            <button onClick={gemSpiller} style={{width: '100%', padding: '16px', backgroundColor: '#0056a4', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '12px', cursor: 'pointer', position: 'relative', zIndex: 2}}>GEM RAPPORT</button>
            <button onClick={() => {
              setVisFormular(false);
              // NYT: Nulstil version-state ved luk
              setSpillerVersioner([]);
              setAktivVersion(1);
            }} style={{width: '100%', padding: '12px', color: 'red', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', zIndex: 2}}>Fortryd</button>
          </div>
        ) : (
          <div style={{padding: '6px'}}>
            <div style={{display: 'flex', gap: '5px', marginBottom: '4px', overflowX: 'auto', paddingBottom: '3px'}}>
              {['Alle', ...alleAargange].map(aar => (
                <button key={aar} onClick={() => setValgtAargang(aar)} style={btnStyle(valgtAargang === aar)}>{aar}</button>
              ))}
            </div>
            <div style={{display: 'flex', gap: '5px', marginBottom: '4px', overflowX: 'auto', paddingBottom: '3px'}}>
              {klubber.map(klub => (
                <button key={klub} onClick={() => setValgtKlub(klub)} style={btnStyle(valgtKlub === klub)}>{klub}</button>
              ))}
            </div>
            <div style={{display: 'flex', gap: '5px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '3px'}}>
              <button onClick={() => toggleScoreFilter('Alle')} style={btnStyle(valgteScores.length === 0)}>Alle</button>
              <button onClick={() => toggleScoreFilter('Mørkegrøn')} style={btnStyle(valgteScores.includes('Mørkegrøn'), '#1b5e20')}>&gt;4,5</button>
              <button onClick={() => toggleScoreFilter('Grøn')} style={btnStyle(valgteScores.includes('Grøn'), '#4caf50')}>&gt;4,0</button>
              <button onClick={() => toggleScoreFilter('Lysegrøn')} style={btnStyle(valgteScores.includes('Lysegrøn'), '#ccff90')}>&gt;3,5</button>
              <button onClick={() => toggleScoreFilter('Orange')} style={btnStyle(valgteScores.includes('Orange'), '#ffa726')}>&gt;3,0</button>
              <button onClick={() => toggleScoreFilter('Rød')} style={btnStyle(valgteScores.includes('Rød'), '#ef5350')}>&lt;3,0</button>
            </div>

            {/* NYT: Forsiden bruger getGruppereteSpillere – ét kort per spiller */}
            {getGruppereteSpillere(getFiltreredeSpillere()).map(s => {
                const scoreStyle = getScoreStyle(s.samlet_score);
                // NYT: Find antal versioner for denne spiller til badge
                const antalVersioner = spillere.filter(sp => sp.navn.toLowerCase().trim() === s.navn.toLowerCase().trim()).length;
                return (
                  <div key={s.id} onClick={() => aabneSpiller(s)} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '4px 8px', borderRadius: '8px', marginBottom: '4px', 
                    display: 'grid', gridTemplateColumns: '2fr 1.5fr auto auto auto', alignItems: 'center', gap: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee'
                  }}>
                    <div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <div style={{fontWeight: 'bold', fontSize: '0.85rem', color: '#333', lineHeight: '1.2'}}>{s.navn}</div>
                        {/* NYT: Versionsbadge – vises kun hvis der er mere end 1 version */}
                        {antalVersioner > 1 && (
                          <span style={{
                            backgroundColor: '#e8f0fe',
                            color: '#0056a4',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            border: '1px solid #c5d3f5',
                            whiteSpace: 'nowrap'
                          }}>
                            V{s.version || 1} / {antalVersioner}
                          </span>
                        )}
                      </div>
                      <div style={{fontSize: '0.65rem', color: '#888'}}>{s.aargang} • {s.foedt}</div>
                    </div>
                    <div>
                      <div style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#0056a4', lineHeight: '1.2'}}>{s.klub}</div>
                      <div style={{fontSize: '0.6rem', color: '#666'}}>{s.ben}</div>
                    </div>
                    {/* NYT: SF/SA badge – samme størrelse og symmetri som scorefeltet */}
                    {(() => {
                      const badge = getStatusBadge(s.status);
                      return badge ? (
                        <div style={{
                          backgroundColor: badge.bgColor,
                          color: badge.textColor,
                          width: '30px', height: '30px',
                          borderRadius: '6px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: '0.75rem',
                          justifySelf: 'center', flexShrink: 0
                        }}>
                          {badge.tekst}
                        </div>
                      ) : <div style={{width: '30px'}} />;
                    })()}
                    <div style={{backgroundColor: scoreStyle.bgColor, color: scoreStyle.textColor, width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', justifySelf: 'center'}}>
                        {formaterTal(s.samlet_score)}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); genererPDF(s); }} style={{backgroundColor: '#fdef42', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '8px', fontWeight: 'bold', color: '#0056a4', cursor: 'pointer'}}>PDF</button>
                  </div>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
