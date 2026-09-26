import React, { useState } from 'react';
import styles from './UKDashboardScreen.module.css';

export interface UKDashboardScreenProps {
  onOpenRequest?: (id?: number) => void;
  onNavigate?: (screen: any) => void;
}

const filters = [
  { id: 'all', label: 'Все заявки' },
  { id: 'new', label: 'Новые' },
  { id: 'pending', label: 'Ожидают' },
  { id: 'verified', label: 'Проверены' },
  { id: 'archive', label: 'Архив' }
];

const mockRequests = [
  {
    id: 1,
    title: 'Отключение горячей воды',
    address: 'ул. Космонавтов 34а, кв. 12',
    status: 'pending',
    isNew: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C12 2 6 8.5 6 13.5a6 6 0 0 0 12 0C18 8.5 12 2 12 2z" />
        <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.2" />
      </svg>
    )
  },
  {
    id: 2,
    title: 'Шум в подъезде',
    address: 'ул. Космонавтов 34а, кв. 45',
    status: 'approved',
    isNew: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    )
  },
  {
    id: 3,
    title: 'Протечка трубы',
    address: 'ул. Космонавтов 34б, кв. 8',
    status: 'rejected',
    isNew: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    )
  }
];

const statusLabels: Record<string, { label: string; colorClass: string }> = {
  pending: { label: 'Ожидает', colorClass: styles.statusPending },
  approved: { label: 'Подтверждено', colorClass: styles.statusApproved },
  rejected: { label: 'Отклонено', colorClass: styles.statusRejected }
};

export const UKDashboardScreen: React.FC<UKDashboardScreenProps> = ({ onOpenRequest, onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredRequests = mockRequests.filter(req => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'new') return req.isNew;
    if (activeFilter === 'pending') return req.status === 'pending';
    if (activeFilter === 'verified') return req.status === 'approved' || req.status === 'rejected';
    if (activeFilter === 'archive') return req.status === 'rejected'; // Mock archive logic
    return true;
  });

  return (
    <>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <header className={`${styles.header} ${styles.animateStagger1}`}>
            <h1 className={styles.title}>Панель УК</h1>
            <button 
              className={styles.bellButton} 
              type="button" 
              aria-label="Уведомления"
              onClick={() => onNavigate?.('ukNotifications')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div className={styles.notificationDot} />
            </button>
          </header>

          <section className={`${styles.metricsGrid} ${styles.animateStagger2}`}>
            <div className={styles.metricCard}>
              <span className={`${styles.metricValue} ${styles.purple}`}>5</span>
              <span className={styles.metricLabel}>Новые заявки</span>
            </div>
            <div className={styles.metricCard}>
              <span className={`${styles.metricValue} ${styles.indigo}`}>12</span>
              <span className={styles.metricLabel}>В работе</span>
            </div>
          </section>

          <section className={`${styles.filtersScroll} ${styles.animateStagger2}`}>
            {filters.map(filter => (
              <button
                key={filter.id}
                type="button"
                className={`${styles.filterChip} ${activeFilter === filter.id ? styles.filterChipActive : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </section>

          <section className={`${styles.requestsList} ${styles.animateStagger3}`}>
            {filteredRequests.map(req => (
              <div 
                key={req.id} 
                className={styles.requestCard}
                onClick={() => onOpenRequest?.(req.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onOpenRequest?.(req.id);
                  }
                }}
              >
                <div className={styles.requestIconBox}>
                  {req.icon}
                </div>
                
                <div className={styles.requestContent}>
                  <div className={styles.requestTitleRow}>
                    <span className={styles.requestTitle}>{req.title}</span>
                    <span className={`${styles.requestStatus} ${statusLabels[req.status].colorClass}`}>
                      {statusLabels[req.status].label}
                    </span>
                  </div>
                  <span className={styles.requestMeta}>{req.address}</span>
                </div>
                
                <div className={styles.requestChevron}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
};
