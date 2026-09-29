import React, { useState, useEffect, useCallback } from 'react';
import { API_URL, getAuthHeaders } from '@/config/api';
import styles from './MainFeedScreen.module.css';

interface MainFeedScreenProps {
  onBack?: () => void;
  onNext?: () => void;
  onOpenCamera?: () => void;
  onOpenNotifications?: () => void;
  isActive?: boolean;
}

interface FeedItem {
  id: number;
  address_id: number;
  title: string;
  body: string;
  category: string;
  created_at: string;
}

const formatDisplayAddress = (addr: string): string => {
  if (!addr) return 'г. Ростов-на-Дону, ГСК-3. Мухина, д. 47';
  const cleaned = addr.replace(/^[^,]+(?:обл\.|область|край|респ\.|республика)[,\s]*/i, '').trim();
  return cleaned || addr;
};

export const MainFeedScreen: React.FC<MainFeedScreenProps> = ({ 
  onOpenCamera, 
  onOpenNotifications,
  isActive = true
}) => {
  const [activeTab, setActiveTab] = useState<'actual' | 'archive'>('actual');
  const [activeAddress, setActiveAddress] = useState<string>(() => {
    return localStorage.getItem('user_address') || 'г. Ростов-на-Дону, ГСК-3. Мухина, д. 47';
  });
  
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user_address');
    if (saved) setActiveAddress(saved);
  }, []);

  const fetchFeed = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await fetch(API_URL + '/api/feed', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setFeedItems(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Fetch when screen becomes active
  useEffect(() => {
    if (isActive) {
      fetchFeed();
    }
  }, [isActive, fetchFeed]);

  // Periodic background poll every 4 seconds to sync status changes from UK in real time
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      fetchFeed(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isActive, fetchFeed]);

  // Correct categorization without arbitrary index slice!
  const isArchiveItem = (item: FeedItem) => {
    return (
      item.category === 'request_rejected' || 
      item.category === 'archive' || 
      item.category === 'completed'
    );
  };

  const actualItems = feedItems.filter(item => !isArchiveItem(item));
  const archiveItems = feedItems.filter(item => isArchiveItem(item));

  const renderCard = (item: FeedItem, isArchiveTab: boolean) => {
    let cardClass = styles.statusActive;
    let badgeText = "В работе";
    let isDimmed = false;

    if (item.category === "request_pending") {
      cardClass = styles.statusWait;
      badgeText = "На проверке";
      isDimmed = false;
    } else if (item.category === "request_approved") {
      cardClass = styles.statusActive;
      badgeText = "Одобрено УК";
      isDimmed = false;
    } else if (item.category === "request_rejected") {
      cardClass = styles.statusArchive;
      badgeText = "Отклонено";
      isDimmed = true;
    } else if (item.category === "water") {
      cardClass = styles.statusWait;
      badgeText = "Ожидание";
    } else if (isArchiveTab || item.category === "archive") {
      cardClass = styles.statusArchive;
      badgeText = "Завершено";
      isDimmed = true;
    }

    return (
      <div 
        key={`${item.id}-${item.category}`} 
        className={`${styles.card} ${cardClass}`} 
        style={{ opacity: isDimmed ? 0.65 : 1 }}
      >
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.category === "request_pending" ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </>
              ) : item.category === "request_approved" ? (
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </>
              ) : item.category === "request_rejected" ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </>
              ) : isArchiveTab ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </>
              )}
            </svg>
          </div>
          <div className={styles.badge}>{badgeText}</div>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{item.title}</h3>
          <p className={styles.cardSubtitle}>{item.body}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.screen}>
      <div className={styles.appBackground} aria-hidden="true" />

      <div className={styles.contentLayer}>
        
        {/* Top Header Row: Address & Notifications */}
        <div className={styles.headerRow}>
          <div className={styles.addressContainer}>
            <div className={styles.addressWrap}>
              <span className={styles.addressText}>{formatDisplayAddress(activeAddress)}</span>
            </div>
          </div>
          
          <button 
            className={styles.bellButton}
            type="button"
            aria-label="Уведомления"
            onClick={onOpenNotifications}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div className={styles.notificationDot} />
          </button>
        </div>

        <div className={styles.scrollArea}>
          {/* Segmented Control / Filters */}
          <div className={styles.segmentedControlWrapper}>
            <div className={styles.segmentedControl}>
              <button 
                className={`${styles.segment} ${activeTab === 'actual' ? styles.active : styles.inactive}`}
                onClick={() => setActiveTab('actual')}
              >
                Актуальное
              </button>
              <button 
                className={`${styles.segment} ${activeTab === 'archive' ? styles.active : styles.inactive}`}
                onClick={() => setActiveTab('archive')}
              >
                Архив
              </button>
            </div>
          </div>

          {/* Feed Cards */}
          <div className={styles.feedList}>
            {isLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Загрузка...</div>
            ) : activeTab === 'actual' ? (
              actualItems.length > 0 ? (
                actualItems.map(item => renderCard(item, false))
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 20 }}>Нет актуальных новостей</div>
              )
            ) : (
              archiveItems.length > 0 ? (
                archiveItems.map(item => renderCard(item, true))
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 20 }}>Нет архива</div>
              )
            )}
          </div>
        </div>
      </div>

      <button className={styles.fab} onClick={onOpenCamera} aria-label="Сканировать объявление">
        <svg className={styles.fabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};
