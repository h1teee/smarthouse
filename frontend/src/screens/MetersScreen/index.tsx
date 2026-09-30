import React, { useState, useEffect } from 'react';
import { API_URL, getAuthHeaders } from '@/config/api';
import styles from './MetersScreen.module.css';

interface MetersScreenProps {
  onBack: () => void;
}

export const MetersScreen: React.FC<MetersScreenProps> = ({ onBack }) => {
  const [prevWater, setPrevWater] = useState(0);
  const [prevColdWater, setPrevColdWater] = useState(0);
  const [prevElectricity, setPrevElectricity] = useState(0);

  const [water, setWater] = useState('');
  const [coldWater, setColdWater] = useState('');
  const [electricity, setElectricity] = useState('');
  
  const [isWaterSaving, setIsWaterSaving] = useState(false);
  const [isColdWaterSaving, setIsColdWaterSaving] = useState(false);
  const [isElecSaving, setIsElecSaving] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const fetchMeters = async () => {
      try {
        const res = await fetch(API_URL + '/api/meters', {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setPrevWater(data.water || 0);
          setPrevColdWater(data.cold_water || 0);
          setPrevElectricity(data.electricity || 0);
          setWater(String(data.water || ''));
          setColdWater(String(data.cold_water || ''));
          setElectricity(String(data.electricity || ''));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeters();
  }, []);

  const handleSaveWater = async () => {
    const val = parseFloat(water);
    if (isNaN(val)) return;
    setIsWaterSaving(true);
    try {
      const res = await fetch(API_URL + '/api/meters', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ water: val })
      });
      if (res.ok) {
        setPrevWater(val);
        showToast('Показания ГВС успешно переданы');
      }
    } catch (e) {
      console.error(e);
      showToast('Ошибка при передаче показаний');
    } finally {
      setIsWaterSaving(false);
    }
  };

  const handleSaveColdWater = async () => {
    const val = parseFloat(coldWater);
    if (isNaN(val)) return;
    setIsColdWaterSaving(true);
    try {
      const res = await fetch(API_URL + '/api/meters', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cold_water: val })
      });
      if (res.ok) {
        setPrevColdWater(val);
        showToast('Показания ХВС успешно переданы');
      }
    } catch (e) {
      console.error(e);
      showToast('Ошибка при передаче показаний');
    } finally {
      setIsColdWaterSaving(false);
    }
  };

  const handleSaveElectricity = async () => {
    const val = parseFloat(electricity);
    if (isNaN(val)) return;
    setIsElecSaving(true);
    try {
      const res = await fetch(API_URL + '/api/meters', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ electricity: val })
      });
      if (res.ok) {
        setPrevElectricity(val);
        showToast('Показания электричества переданы');
      }
    } catch (e) {
      console.error(e);
      showToast('Ошибка при передаче показаний');
    } finally {
      setIsElecSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.ambientGlow} />

      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18, 18, 22, 0.95)',
          border: '1px solid rgba(48, 209, 88, 0.4)',
          borderRadius: '20px',
          padding: '8px 16px',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(16px)'
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#30D158' }} />
          {toastMessage}
        </div>
      )}

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
              <h2 className={styles.meterName}>Горячая вода (ГВС)</h2>
            </div>
            <span className={styles.meterStatusAlert}>До 25 числа</span>
          </div>
          
          <div className={styles.inputCard}>
            <div className={styles.inputMain}>
              <input 
                type="number"
                step="0.01"
                className={styles.inputValue} 
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', fontFamily: 'inherit' }}
                value={water}
                onChange={(e) => setWater(e.target.value)}
              />
              <span className={styles.inputUnit}>м³</span>
            </div>
            <div className={styles.inputSub}>Предыдущее: {prevWater} м³</div>
          </div>
          <button 
            className={styles.submitBtn} 
            onClick={handleSaveWater} 
            disabled={isWaterSaving || parseFloat(water) === prevWater || !water.trim()}
          >
            {isWaterSaving ? 'Передача в УК...' : parseFloat(water) === prevWater ? 'Показания переданы' : 'Передать показания'}
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
              <h2 className={styles.meterName}>Холодная вода (ХВС)</h2>
            </div>
            <span className={styles.meterStatusAlert}>До 25 числа</span>
          </div>
          
          <div className={styles.inputCard}>
            <div className={styles.inputMain}>
              <input 
                type="number"
                step="0.01"
                className={styles.inputValue} 
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', fontFamily: 'inherit' }}
                value={coldWater}
                onChange={(e) => setColdWater(e.target.value)}
              />
              <span className={styles.inputUnit}>м³</span>
            </div>
            <div className={styles.inputSub}>Предыдущее: {prevColdWater} м³</div>
          </div>
          <button 
            className={styles.submitBtn} 
            onClick={handleSaveColdWater} 
            disabled={isColdWaterSaving || parseFloat(coldWater) === prevColdWater || !coldWater.trim()}
          >
            {isColdWaterSaving ? 'Передача в УК...' : parseFloat(coldWater) === prevColdWater ? 'Показания переданы' : 'Передать показания'}
          </button>
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
            <span className={styles.meterStatusAlert}>До 25 числа</span>
          </div>
          
          <div className={styles.inputCard}>
            <div className={styles.inputMain}>
              <input 
                type="number"
                step="0.01"
                className={styles.inputValue} 
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', outline: 'none', fontFamily: 'inherit' }}
                value={electricity}
                onChange={(e) => setElectricity(e.target.value)}
              />
              <span className={styles.inputUnit}>кВт</span>
            </div>
            <div className={styles.inputSub}>Предыдущее: {prevElectricity} кВт</div>
          </div>
          <button 
            className={styles.submitBtn} 
            onClick={handleSaveElectricity} 
            disabled={isElecSaving || parseFloat(electricity) === prevElectricity || !electricity.trim()}
          >
            {isElecSaving ? 'Передача в УК...' : parseFloat(electricity) === prevElectricity ? 'Показания переданы' : 'Передать показания'}
          </button>
        </div>

      </div>
    </div>
  );
};
