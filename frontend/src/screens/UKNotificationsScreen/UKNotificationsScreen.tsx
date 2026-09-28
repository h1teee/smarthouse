import React, { useState } from 'react';
import styles from './UKNotificationsScreen.module.css';

interface UKNotificationsScreenProps {
  onBack: () => void;
  isResidentMode?: boolean;
}

export const UKNotificationsScreen: React.FC<UKNotificationsScreenProps> = ({ onBack, isResidentMode }) => {
  const [readIds, setReadIds] = useState<string[]>([]);

  const ukNotifications = [
    {
      id: '1',
      type: 'alert',
      title: 'Массовый сбой',
      text: 'ИИ зафиксировал 3 новые заявки по адресу Космонавтов 34а за последние 10 минут.',
      time: 'Только что',
      isUnread: true,
    },
    {
      id: '2',
      type: 'system',
      title: 'Система',
      text: 'Еженедельный отчет по району сформирован и доступен в Аналитике.',
      time: 'Вчера',
      isUnread: false,
    },
    {
      id: '3',
      type: 'info',
      title: 'Оповещение МАХ',
      text: 'Рассылка для ЖК Изумрудный успешно доставлена 850 жителям.',
      time: '15 Сен',
      isUnread: false,
    }
  ];

  const residentNotifications = [
    {
      id: 'r1',
      type: 'info',
      title: 'УК "Смарт Сити"',
      text: 'Напоминаем о необходимости передать показания счетчиков до 25 числа.',
      time: 'Сегодня',
      isUnread: true,
    },
    {
      id: 'r2',
      type: 'system',
      title: 'Квитанция',
      text: 'Счет за август оплачен успешно.',
      time: 'Вчера',
      isUnread: false,
    }
  ];

  const notifications = isResidentMode ? residentNotifications : ukNotifications;

  const handleReadAll = () => {
    setReadIds([...readIds, '1', '2', '3', 'r1', 'r2']);
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      setReadIds([...readIds, id]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return (
          <div className={`${styles.iconWrap} ${styles.iconAlert}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className={`${styles.iconWrap} ${styles.iconInfo}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        );
      case 'system':
      default:
        return (
          <div className={`${styles.iconWrap} ${styles.iconSystem}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.ambientGlow} />
      <div className={styles.content}>
        <div className={styles.navBar}>
          <div style={{ width: 80, display: 'flex', justifyContent: 'flex-start' }}>
            <button className={styles.backBtn} onClick={onBack}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Назад
            </button>
          </div>
          <div className={styles.navTitle}>Уведомления</div>
          <div style={{ width: 80, display: 'flex', justifyContent: 'flex-end' }}>
            {notifications.length > 0 && (
              <button className={styles.readAllBtn} onClick={handleReadAll}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className={styles.list}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(235, 235, 245, 0.6)' }}>
              Нет новых уведомлений
            </div>
          ) : (
            notifications.map(notif => {
              const isCurrentlyUnread = notif.isUnread && !readIds.includes(notif.id);
              
              return (
                <div 
                  key={notif.id} 
                  className={`${styles.item} ${isCurrentlyUnread ? styles.unread : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className={styles.unreadDotWrap}>
                    {isCurrentlyUnread && <div className={styles.unreadDot} />}
                  </div>
                  
                  {getIcon(notif.type)}

                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <h3 className={styles.itemTitle}>{notif.title}</h3>
                      <span className={styles.itemTime}>{notif.time}</span>
                    </div>
                    <p className={styles.itemText}>{notif.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
