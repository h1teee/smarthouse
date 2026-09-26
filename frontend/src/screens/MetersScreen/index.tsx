import React from 'react';
import styles from './MetersScreen.module.css';

interface MetersScreenProps {
  onBack: () => void;
}

export const MetersScreen: React.FC<MetersScreenProps> = ({ onBack }) => {
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
              <span className={styles.inputValue}>148</span>
              <span className={styles.inputUnit}>м³</span>
            </div>
            <div className={styles.inputSub}>Предыдущее: 142 м³</div>
          </div>
          <button className={styles.submitBtn}>Передать показания</button>
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
              <span className={styles.inputValue}>8 450</span>
              <span className={styles.inputUnit}>кВт</span>
            </div>
            <div className={styles.inputSub}>Предыдущее: 8 200 кВт</div>
          </div>
          <button className={styles.submitBtn}>Передать показания</button>
        </div>

      </div>
    </div>
  );
};
