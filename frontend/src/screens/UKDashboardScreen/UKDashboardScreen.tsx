import React, { useState, useEffect } from 'react';
import styles from './UKDashboardScreen.module.css';

export interface UKDashboardScreenProps {
  onOpenRequest?: (id?: number) => void;
  onNavigate?: (screen: any) => void;
}

const filters = [
  { id: 'all', label: 'Все заявки' },
  { id: 'pending', label: 'В работе' },
  { id: 'approved', label: 'Одобрено' },
  { id: 'rejected', label: 'Отклонено' }
];

export const UKDashboardScreen: React.FC<UKDashboardScreenProps> = ({ onOpenRequest, onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/uk/requests?status=' + activeFilter);
        if (res.ok) {
          const data = await res.json();
          setRequests(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [activeFilter]);

  const renderIcon = (type: string) => {
    if (type === 'water') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C12 2 6 8.5 6 13.5a6 6 0 0 0 12 0C18 8.5 12 2 12 2z" />
          <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.2" />
        </svg>
      );
    }
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <header className={styles.header}>
            <h1 className={styles.title}>Учет заявок</h1>
          </header>

          <div className={styles.searchContainer}>
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Поиск по заявкам..." className={styles.searchInput} />
            </div>
            
            <div className={styles.filterScroll}>
              <div className={styles.filtersWrapper}>
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    className={`${styles.filterBtn} ${activeFilter === filter.id ? styles.active : ''}`}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.list}>
            {isLoading ? (
              <div style={{textAlign: 'center', padding: 20, color: '#888'}}>Загрузка...</div>
            ) : requests.length > 0 ? (
              requests.map(req => (
                <div 
                  key={req.id} 
                  className={styles.card}
                  onClick={() => {
                    localStorage.setItem('selectedRequestId', String(req.id));
                    if (onOpenRequest) onOpenRequest(req.id);
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div className={`${styles.cardIcon} ${req.status === 'pending' ? styles.warning : styles.info}`}>
                      {renderIcon(req.type)}
                    </div>
                    {req.status === 'pending' && <span className={styles.badgeNew}>Новая</span>}
                  </div>
                  <h3 className={styles.cardTitle}>{req.title}</h3>
                  <p className={styles.cardAddress}>ID: {req.id} • Дата: {req.start_date}</p>
                </div>
              ))
            ) : (
              <div style={{textAlign: 'center', padding: 20, color: '#888', opacity: 0.5}}>Нет заявок</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
