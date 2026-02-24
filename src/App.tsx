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
      <div style={{backgroundColor: '#00