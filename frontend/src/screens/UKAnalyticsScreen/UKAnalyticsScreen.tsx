import React, { useState, useEffect } from 'react';
import styles from './UKAnalyticsScreen.module.css';

interface UKAnalyticsScreenProps {
  onBack: () => void;
}

export const UKAnalyticsScreen: React.FC<UKAnalyticsScreenProps> = ({ onBack }) => {
  const weeklyData = [
    { day: 'Пн', value: 40 },
    { day: 'Вт', value: 65 },
    { day: 'Ср', value: 85 },
    { day: 'Чт', value: 50 },
    { day: 'Пт', value: 90 },
    { day: 'Сб', value: 30 },
    { day: 'Вс', value: 20 },
  ];

  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [aiText, setAiText] = useState('Загрузка анализа от GigaChat...');
  const [stats, setStats] = useState({
    total_requests: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/api/uk/analytics/ai')
      .then(r => r.json())
      .then(data => {
        if (data.analysis) setAiText(data.analysis);
      })
      .catch(err => setAiText('Не удалось загрузить аналитику'));

    fetch(import.meta.env.VITE_API_URL + '/api/uk/analytics')
      .then(r => r.json())
      .then(data => {
        if (data) setStats(data);
      })
      .catch(err => console.error(err));
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
        <div className={styles.navTitle}>Аналитика</div>
      </div>

      <div className={styles.content}>
        <div className={styles.aiSummary}>
          <div className={styles.aiTitle}>ИИ Анализ за неделю</div>
          <div className={styles.aiText}>
            {aiText}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>Статус заявок</div>
          <div className={styles.progressList}>
            <div className={styles.progressItem}>
              <div className={styles.progressLabelWrap}>
                <span>Всего заявок</span>
                <span className={styles.progressValue}>{stats.total_requests}</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: '100%', background: '#0A84FF' }} />
              </div>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressLabelWrap}>
                <span>Одобрено / В работе</span>
                <span className={styles.progressValue}>{stats.approved}</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: stats.total_requests ? `${(stats.approved / stats.total_requests) * 100}%` : '0%', background: '#30D158' }} />
              </div>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressLabelWrap}>
                <span>Ожидают решения</span>
                <span className={styles.progressValue}>{stats.pending}</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: stats.total_requests ? `${(stats.pending / stats.total_requests) * 100}%` : '0%', background: '#FF9F0A' }} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>Активность жителей</div>
          <div className={styles.barChart}>
            {weeklyData.map((d, i) => (
              <div className={styles.barCol} key={i} onClick={() => setActiveBar(i)}>
                <div className={styles.barWrap}>
                  <div 
                    className={`${styles.barFill} ${activeBar === i ? styles.barActive : ''}`} 
                    style={{ height: `${d.value}%` }} 
                  />
                  {activeBar === i && (
                    <div className={styles.tooltip}>{d.value}</div>
                  )}
                </div>
                <div className={styles.barLabel}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{height: '40px'}} />
      </div>
    </div>
  );
};