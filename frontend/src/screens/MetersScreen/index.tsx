import React, { useState, useEffect } from 'react';
import styles from './MetersScreen.module.css';

interface MetersScreenProps {
  onBack: () => void;
}

export const MetersScreen: React.FC<MetersScreenProps> = ({ onBack }) => {
  const [prevWater, setPrevWater] = useState(0);
  const [prevElectricity, setPrevElectricity] = useState(0);

  const [water, setWater] = useState('');
  const [electricity, setElectricity] = useState('');
  
  const [isWaterSaving, setIsWaterSaving] = useState(false);
  const [isElecSaving, setIsElecSaving] = useState(false);

  useEffect(() => {
    const fetchMeters = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/meters', {
          headers: { 'X-User-ID': localStorage.getItem('user_id') || '1' }
        });
        if (res.ok) {
          const data = await res.json();
          setPrevWater(data.water || 0);
          setPrevElectricity(data.electricity || 0);
          setWater(String(data.water || 0));
          setElectricity(String(data.electricity || 0));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeters();
  }, []);

  const handleSaveWater = async () => {
    setIsWaterSaving(true);
    try {
      await fetch(import.meta.env.VITE_API_URL + '/api/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ water: parseFloat(water) || 0, electricity: prevElectricity })
      });
      setPrevWater(parseFloat(water) || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsWaterSaving(false);
    }
  };

  const handleSaveElectricity = async () => {
    setIsElecSaving(true);
    try {
      await fetch(import.meta.env.VITE_API_URL + '/api/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ water: prevWater, electricity: parseFloat(electricity) || 0 })
      });
      setPrevElectricity(parseFloat(electricity) || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsElecSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.ambientGlow} />

      <div className={styles.headerRow}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className={styles.title}>Счетчики</h1>
        <div style={{ width: 44 }} /> {/* Spacer for centering */}
      </div>

      <div className={styles.content}>
        
        {/* Hot Water */}
        <div className={styles.meterGroup}>
          <div className={styles.meterHeader}>
            <div className={styles.meterTitleRow}>
              <div className={`${styles.iconWrap} ${styles.blue}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <h2 className={styles.meterName}>Горячая вода</h2>
            </div>
            <span className={styles.meterStatusAlert}>До 25 авг</span>
          </div>
          
          <div className={styles.inputCard}>
            <div className={styles.inputMain}>
              <input 
                type="number"
                className={styles.inputValue} 
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', fontFamily: 'inherit' }}
                value={water}
                onChange={(e) => setWater(e.target.value)}
              />
              <span className={styles.inputUnit}>м³</span>
            </div>
            <div className={styles.inputSub}>Предыдущее: {prevWater} м³</div>
          </div>
          <button className={styles.submitBtn} onClick={handleSaveWater} disabled={isWaterSaving || parseFloat(water) === prevWater}>
            {isWaterSaving ? 'Сохранение...' : 'Передать показания'}
          </button>
        </div>

        {/* Cold Water */}
        <div className={styles.meterGroup}>
          <div className={styles.meterHeader}>
            <div className={styles.meterTitleRow}>
              <div className={`${styles.iconWrap} ${styles.cyan}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <h2 className={styles.meterName}>Холодная вода</h2>
            </div>
            <span className={styles.meterStatusOk}>Передано</span>
          </div>
          
          <div className={styles.inputCard}>
            <div className={styles.inputMain}>
              <span className={styles.inputValue}>320</span>
              <span className={styles.inputUnit}>м³</span>
            </div>
            <div className={styles.inputSub}>Предыдущее: 320 м³</div>
          </div>
          <button className={styles.submitBtnDisabled} disabled>Показания переданы</button>
        </div>

        {/* Electricity */}
        <div className={styles.meterGroup}>
          <div className={styles.meterHeader}>
            <div className={styles.meterTitleRow}>
              <div className={`${styles.iconWrap} ${styles.yellow}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h2 className={styles.meterName}>Электроэнергия</h2>
            </div>
            <span className={styles.meterStatusAlert}>До 25 авг</span>
          </div>
          
          <div className={styles.inputCard}>
            <div className={styles.inputMain}>
              <input 
                type="number"
                className={styles.inputValue} 
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', fontFamily: 'inherit' }}
                value={electricity}
                onChange={(e) => setElectricity(e.target.value)}
              />
              <span className={styles.inputUnit}>кВт</span>
            </div>
            <div className={styles.inputSub}>Предыдущее: {prevElectricity} кВт</div>
          </div>
          <button className={styles.submitBtn} onClick={handleSaveElectricity} disabled={isElecSaving || parseFloat(electricity) === prevElectricity}>
            {isElecSaving ? 'Сохранение...' : 'Передать показания'}
          </button>
        </div>

      </div>
    </div>
  );
};
