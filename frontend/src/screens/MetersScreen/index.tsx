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
          headers: { 'X-User-ID': localStorage.getItem('user_id') || '' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.water) setPrevWater(data.water);
          if (data && data.electricity) setPrevElectricity(data.electricity);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchMeters();
  }, []);

  const handleSaveWater = () => {
    setIsWaterSaving(true);
    setTimeout(() => {
      setIsWaterSaving(false);
      setPrevWater(Number(water) || prevWater);
      setWater('');
    }, 1500);
  };

  const handleSaveElec = () => {
    setIsElecSaving(true);
    setTimeout(() => {
      setIsElecSaving(false);
      setPrevElectricity(Number(electricity) || prevElectricity);
      setElectricity('');
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.ambientGlow} />

      <header className={styles.navBar}>
        <button className={styles.backButton} onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Назад
        </button>
        <h2 className={styles.navTitle}>Показания счетчиков</h2>
        <div className={styles.navSpacer} />
      </header>

      <div className={styles.content}>
        
        <div className={styles.meterCard}>
          <div className={styles.meterHeader}>
            <div className={styles.meterIcon} style={{ background: 'rgba(10, 132, 255, 0.1)', color: '#0A84FF' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className={styles.meterInfo}>
              <h3 className={styles.meterTitle}>Водоснабжение</h3>
              <p className={styles.meterSub}>Предыдущее: {prevWater} м³</p>
            </div>
          </div>
          
          <div className={styles.inputRow}>
            <input 
              type="number" 
              className={styles.meterInput}
              placeholder="0.00"
              value={water}
              onChange={(e) => setWater(e.target.value)}
            />
            <span className={styles.unit}>м³</span>
          </div>

          <button 
            className={styles.saveBtn} 
            disabled={!water || isWaterSaving}
            onClick={handleSaveWater}
          >
            {isWaterSaving ? 'Отправка...' : 'Передать'}
          </button>
        </div>

        <div className={styles.meterCard}>
          <div className={styles.meterHeader}>
            <div className={styles.meterIcon} style={{ background: 'rgba(255, 159, 10, 0.1)', color: '#FF9F0A' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className={styles.meterInfo}>
              <h3 className={styles.meterTitle}>Электричество</h3>
              <p className={styles.meterSub}>Предыдущее: {prevElectricity} кВт⋅ч</p>
            </div>
          </div>
          
          <div className={styles.inputRow}>
            <input 
              type="number" 
              className={styles.meterInput}
              placeholder="0"
              value={electricity}
              onChange={(e) => setElectricity(e.target.value)}
            />
            <span className={styles.unit}>кВт⋅ч</span>
          </div>

          <button 
            className={styles.saveBtn} 
            disabled={!electricity || isElecSaving}
            onClick={handleSaveElec}
          >
            {isElecSaving ? 'Отправка...' : 'Передать'}
          </button>
        </div>

      </div>
    </div>
  );
};