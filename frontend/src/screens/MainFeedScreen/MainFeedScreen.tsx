import React, { useState, useEffect } from 'react';
import styles from './MainFeedScreen.module.css';

interface MainFeedScreenProps {
  onBack?: () => void;
  onNext?: () => void;
  onOpenCamera?: () => void;
  onOpenNotifications?: () => void;
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

export const MainFeedScreen: React.FC<MainFeedScreenProps> = ({ onOpenCamera, onOpenNotifications }) => {
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

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/feed');
        if (res.ok) {
          const data = await res.json();
          setFeedItems(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch feed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const actualItems = feedItems.filter((_, i) => i < 5);
  const archiveItems = feedItems.filter((_, i) => i >= 5);

  const renderCard = (item: FeedItem, isArchive: boolean) => {
    const isWait = item.category === 'water';
    let cardClass = styles.statusActive;
    let badgeText = 'В работе';
    
    if (isArchive) {
      cardClass = styles.statusArchive;
      badgeText = 'Завершено';
    } else if (isWait) {
      cardClass = styles.statusWait;
      badgeText = 'Ожидание';
    }

    return (
      <div key={item.id} className={`${styles.card} ${cardClass}`} style={{ opacity: isArchive ? 0.6 : 1 }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isArchive ? (
                <polyline points="20 6 9 17 4 12"></polyline>
              ) : isWait ? (
                <>
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </>
              ) : (
                <>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
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
              actualItems.length > 0 ? actualItems.map(item => renderCard(item, false)) : <div style={{textAlign: 'center', opacity: 0.5, marginTop: 20}}>Нет актуальных новостей</div>
            ) : (
              archiveItems.length > 0 ? archiveItems.map(item => renderCard(item, true)) : <div style={{textAlign: 'center', opacity: 0.5, marginTop: 20}}>Нет архива</div>
            )}
          </div>
        </div>
      </div>

      <button className={styles.fab} onClick={onOpenCamera}>
        <svg className={styles.fabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};
