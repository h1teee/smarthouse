import React, { useState, useEffect } from 'react';
import styles from './UKDashboardScreen.module.css';

export interface UKDashboardScreenProps {
  onOpenRequest?: (id?: number) => void;
  onNavigate?: (screen: any) => void;
}

const filters = [
  { id: 'all', label: 'В работе' },
  { id: 'pending', label: 'Ожидают' },
  { id: 'approved', label: 'Одобрены' },
  { id: 'rejected', label: 'Отклонены' },
  { id: 'resolved', label: 'Архив' }
];

export const UKDashboardScreen: React.FC<UKDashboardScreenProps> = ({ 
  onOpenRequest,
  onNavigate
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/uk/requests?status=all');
      if (res.ok) {
        const data = await res.json();
        setRequests(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  const getFilteredRequests = () => {
    if (activeFilter === 'all') {
      return requests.filter(r => r.status !== 'resolved');
    }
    return requests.filter(r => r.status === activeFilter);
  };

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'pending': return { text: 'Ожидает решения', style: styles.statusBadgePending };
      case 'approved': return { text: 'Одобрено (В работе)', style: styles.statusBadgeOk };
      case 'rejected': return { text: 'Отклонено', style: styles.statusBadgeReject };
      case 'resolved': return { text: 'Завершено', style: styles.statusBadgeGray };
      default: return { text: 'Неизвестно', style: styles.statusBadgeGray };
    }
  };

  const getTypeIconColor = (type: string) => {
    if (type === 'water') return '#0A84FF'; // blue
    if (type === 'electricity') return '#FF9F0A'; // orange
    return '#8E8E93';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitleWrap}>
            <h1 className={styles.title}>Рабочий стол</h1>
            <p className={styles.subtitle}>Ждут проверки: {requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <button className={styles.iconBtn} onClick={handleRefresh}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? styles.spin : ''}>
              <path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.84-10.36L2 8"/>
            </svg>
          </button>
        </div>

        <div className={styles.filterScroll}>
          {filters.map(f => (
            <button 
              key={f.id}
              className={`${styles.filterChip} ${activeFilter === f.id ? styles.filterChipActive : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
              {f.id === 'pending' && <span className={styles.badgeCount}>{requests.filter(r => r.status === 'pending').length}</span>}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.contentList}>
        <div className={styles.quickActions}>
          <button className={styles.actionBtn} onClick={() => onNavigate && onNavigate('ukBroadcast')}>
            <div className={styles.actionIconWrap} style={{ background: '#30D15815', color: '#30D158' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span>Сделать<br/>рассылку</span>
          </button>
          <button className={styles.actionBtn} onClick={() => onNavigate && onNavigate('ukObjects')}>
            <div className={styles.actionIconWrap} style={{ background: '#0A84FF15', color: '#0A84FF' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </div>
            <span>Карта<br/>домов</span>
          </button>
        </div>

        {loading ? (
          <div style={{color:'#fff', textAlign:'center', marginTop:30}}>Загрузка...</div>
        ) : getFilteredRequests().length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✓</div>
            <div className={styles.emptyTitle}>Нет заявок</div>
            <div className={styles.emptyDesc}>В данной категории пусто</div>
          </div>
        ) : (
          getFilteredRequests().map(req => {
            const statusInfo = getStatusInfo(req.status);
            const iconColor = getTypeIconColor(req.type);

            return (
              <div 
                key={req.id} 
                className={`${styles.requestCard} ${styles.animateFadeIn}`}
                onClick={() => {
                  localStorage.setItem('selectedRequestId', String(req.id));
                  if (onOpenRequest) onOpenRequest(req.id);
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTypeRow}>
                    <div className={styles.typeIcon} style={{ background: `${iconColor}15`, color: iconColor }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <span className={styles.typeLabel}>{req.type === 'water' ? 'Водоснабжение' : req.type === 'electricity' ? 'Электричество' : 'Прочее'}</span>
                  </div>
                  <div className={`${styles.statusBadge} ${statusInfo.style}`}>
                    {statusInfo.text}
                  </div>
                </div>
                
                <h3 className={styles.cardTitle}>{req.title}</h3>
                <p className={styles.cardAddress}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  ID Адреса: {req.address_id}
                </p>
                
                <div className={styles.cardFooter}>
                  <span className={styles.cardTime}>15 мин. назад</span>
                  <div className={styles.cardArrow}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{height: 100}} />
    </div>
  );
};