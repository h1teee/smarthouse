import React, { useState } from 'react';
import styles from './UKArchiveScreen.module.css';

interface UKArchiveScreenProps {
  onBack: () => void;
}

const mockArchives = [
  {
    id: '1',
    date: '19 Сен 2026',
    audience: 'Все дома',
    message: 'Уважаемые жители! Завтра (20.09) с 10:00 до 15:00 будет проводиться проверка пожарной сигнализации.',
    delivered: 1420
  },
  {
    id: '2',
    date: '18 Сен 2026',
    audience: 'ул. Космонавтов 34а',
    message: 'Авария на линии ГВС. Бригада уже работает, ориентировочное время восстановления — 14:00.',
    delivered: 340
  },
  {
    id: '3',
    date: '15 Сен 2026',
    audience: 'ЖК Изумрудный',
    message: 'Опубликованы новые квитанции за август. Оплатить можно в приложении без комиссии.',
    delivered: 850
  }
];

export const UKArchiveScreen: React.FC<UKArchiveScreenProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');

  const filtered = mockArchives.filter(a => 
    a.message.toLowerCase().includes(search.toLowerCase()) || 
    a.audience.toLowerCase().includes(search.toLowerCase())
  );

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

      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Поиск по рассылкам..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.list}>
        {filtered.map(item => (
          <div key={item.id} className={styles.archiveCard}>
            <div className={styles.cardHeader}>
              <div className={styles.badge}>{item.audience}</div>
              <div className={styles.cardDate}>{item.date}</div>
            </div>
            <div className={styles.cardMessage}>
              {item.message}
            </div>
            <div className={styles.cardFooter}>
              <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className={styles.statusText}>Доставлено: {item.delivered} чел.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
