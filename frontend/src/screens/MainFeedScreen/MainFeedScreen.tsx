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

export const MainFeedScreen: React.FC<MainFeedScreenProps> = ({ onOpenCamera, onOpenNotifications }) => {
  const [activeTab, setActiveTab] = useState<'actual' | 'archive'>('actual');
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [activeAddress, setActiveAddress] = useState('ул. Пушкина, 34');
  
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/feed', {
          headers: { 'X-User-ID': userId || '' }
        });
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

  const actualItems = feedItems.filter((_, i) => i < 15);
  const archiveItems = [];

  const renderCard = (item: FeedItem, isArchive: boolean) => {
    const isWait = item.category === 'water' || item.category === 'electricity';
    let cardClass = styles.statusActive;
    let badgeText = 'В работе';
    
    if (isArchive) {
      cardClass = styles.statusArchive;
      badgeText = 'Закрыто';
    } else if (isWait) {
      cardClass = styles.statusWait;
      badgeText = 'Внимание';
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
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </>
              ) : (
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              )}
            </svg>
          </div>
          <div className={styles.cardStatus}>{badgeText}</div>
          <div className={styles.cardTime}>{new Date(item.created_at).toLocaleDateString()}</div>
        </div>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardDesc}>{item.body}</p>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.addressSelectorWrap}>
            <button 
              className={styles.addressSelector}
              onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
            >
              <span>{activeAddress}</span>
              <svg 
                className={`${styles.chevron} ${isAddressDropdownOpen ? styles.chevronOpen : ''}`} 
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isAddressDropdownOpen && (
              <div className={styles.addressDropdown}>
                <div className={styles.dropdownItemActive}>{activeAddress}</div>
                <div className={styles.dropdownItem} onClick={() => { setActiveAddress('ЖК «Лесной», д. 5'); setIsAddressDropdownOpen(false); }}>ЖК «Лесной», д. 5</div>
              </div>
            )}
          </div>
          <button className={styles.bellBtn} onClick={onOpenNotifications}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <div className={styles.bellDot} />
          </button>
        </div>
      </header>

      <div className={styles.scrollContent}>
        <div className={styles.cameraBanner} onClick={onOpenCamera}>
          <div className={styles.cameraBannerBg} />
          <div className={styles.cameraBannerContent}>
            <div className={styles.cameraIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <div className={styles.cameraTextWrap}>
              <h3 className={styles.cameraTitle}>Распознавание ИИ</h3>
              <p className={styles.cameraDesc}>Сфотографируйте объявление в подъезде для анализа</p>
            </div>
            <div className={styles.cameraArrow}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.tabContainer}>
          <div className={styles.tabsBg}>
            <button 
              className={`${styles.tab} ${activeTab === 'actual' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('actual')}
            >
              Актуальное
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'archive' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('archive')}
            >
              Архив
            </button>
          </div>
        </div>

        <div className={styles.feedList}>
          {isLoading ? (
            <div className={styles.emptyState}>Загрузка...</div>
          ) : feedItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                </svg>
              </div>
              <h3>Пока здесь пусто</h3>
              <p>Как только УК опубликует новости, они появятся в ленте.</p>
            </div>
          ) : activeTab === 'actual' ? (
            actualItems.map(item => renderCard(item, false))
          ) : (
            archiveItems.map(item => renderCard(item, true))
          )}
        </div>
      </div>
    </div>
  );
};