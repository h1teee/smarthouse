import React, { useState, useEffect } from 'react';
import styles from './UKArchiveScreen.module.css';

interface UKArchiveScreenProps {
  onBack: () => void;
}

export const UKArchiveScreen: React.FC<UKArchiveScreenProps> = ({ onBack }) => {
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/api/feed')
      .then(r => r.json())
      .then(data => {
        setArchives(data || []);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.navBar}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Назад
        </button>
        <div className={styles.navTitle}>Архив рассылок</div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div style={{color: '#fff', textAlign: 'center'}}>Загрузка...</div>
        ) : archives.length === 0 ? (
          <div style={{color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40}}>Архив пуст</div>
        ) : (
          archives.map(arc => (
            <div key={arc.id} className={styles.archiveCard}>
              <div className={styles.cardHeader}>
                <div className={styles.dateBadge}>{new Date(arc.created_at).toLocaleDateString()}</div>
                <div className={styles.audienceBadge}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Все жильцы
                </div>
              </div>
              <div className={styles.messagePreview}>{arc.title} - {arc.body}</div>
              <div className={styles.statsRow}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Доставлено
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};