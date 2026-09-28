import React, { useState, useEffect } from 'react';
import styles from './UKNotificationsScreen.module.css';

interface UKNotificationsScreenProps {
  onBack: () => void;
  isResidentMode?: boolean;
}

export const UKNotificationsScreen: React.FC<UKNotificationsScreenProps> = ({ onBack, isResidentMode }) => {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isResidentMode) {
      fetch(import.meta.env.VITE_API_URL + '/api/notifications', {
        headers: { 'X-User-ID': localStorage.getItem('user_id') || '' }
      })
      .then(r => r.json())
      .then(data => {
        const formatted = (data || []).map((n: any) => ({
          id: String(n.id),
          type: n.category === 'water' || n.category === 'electricity' ? 'alert' : 'info',
          title: n.title,
          text: n.body,
          time: new Date(n.created_at).toLocaleDateString(),
          isUnread: true
        }));
        setNotifications(formatted);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
    } else {
      setNotifications([
        {
          id: '1',
          type: 'alert',
          title: 'Массовый сбой',
          text: 'Поступило 3 жалобы подряд по адресу Пушкинская 34А в течение 10 минут.',
          time: 'Только что',
          isUnread: true,
        },
        {
          id: '2',
          type: 'system',
          title: 'Отчет',
          text: 'Еженедельный отчет о проделанной работе готов к просмотру.',
          time: 'Вчера',
          isUnread: false,
        }
      ]);
      setLoading(false);
    }
  }, [isResidentMode]);

  const handleMarkAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      setReadIds([...readIds, id]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'system':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
    }
  };

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
        <div className={styles.navTitle}>Уведомления</div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div style={{color: '#fff', textAlign: 'center'}}>Загрузка...</div>
        ) : notifications.length === 0 ? (
          <div style={{color: '#fff', textAlign: 'center', opacity: 0.5, marginTop: 40}}>Нет уведомлений</div>
        ) : (
          notifications.map((notif) => {
            const isRead = !notif.isUnread || readIds.includes(notif.id);
            return (
              <div 
                key={notif.id} 
                className={`${styles.notificationCard} ${!isRead ? styles.unread : ''}`}
                onClick={() => handleMarkAsRead(notif.id)}
              >
                {!isRead && <div className={styles.unreadDot} />}
                
                <div className={`${styles.iconWrap} ${styles[notif.type]}`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className={styles.notifContent}>
                  <div className={styles.notifHeader}>
                    <h3 className={styles.notifTitle}>{notif.title}</h3>
                    <span className={styles.notifTime}>{notif.time}</span>
                  </div>
                  <p className={styles.notifText}>{notif.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};