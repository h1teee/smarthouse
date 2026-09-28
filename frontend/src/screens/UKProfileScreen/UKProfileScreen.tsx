import React, { useState } from 'react';
import styles from './UKProfileScreen.module.css';

interface UKProfileScreenProps {
  onNavigate: (screen: any) => void;
}

export const UKProfileScreen: React.FC<UKProfileScreenProps> = ({ onNavigate }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('role');
    onNavigate('auth');
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <header className={`${styles.header} ${styles.animateStagger1}`}>
          <h1 className={styles.title}>Профиль</h1>
        </header>

        <section className={styles.animateStagger2}>
          <div className={styles.dispatcherCard}>
            <div className={styles.avatar}>
              <div className={styles.avatarInner}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <div className={styles.dispatcherInfo}>
              <div className={styles.nameRow}>
                <div className={styles.dispatcherName}>Модератор УК</div>
                <div className={styles.statusPill}>
                  <span className={styles.statusDotPulse} />
                  <span className={styles.statusText}>На смене</span>
                </div>
              </div>
              <div className={styles.dispatcherRole}>Старший диспетчер смены</div>
            </div>
          </div>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.statValue}>14</div>
              <div className={styles.statLabel}>Закрыто в смену</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ color: '#FF9F0A' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.statValue}>4.8</div>
              <div className={styles.statLabel}>Ср. оценка жильцов</div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.menuSection}>
          <h2 className={styles.sectionTitle}>Управление</h2>
          <div className={styles.menuList}>
            <button className={styles.menuItem} onClick={() => onNavigate('ukAnalytics')}>
              <div className={styles.menuIconWrapper} style={{ color: '#32D74B' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <span className={styles.menuText}>Аналитика ИИ</span>
              <span className={styles.menuArrow}>›</span>
            </button>
            <button className={styles.menuItem} onClick={() => onNavigate('ukArchive')}>
              <div className={styles.menuIconWrapper} style={{ color: '#0A84FF' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8v13H3V8" />
                  <path d="M1 3h22v5H1z" />
                  <path d="M10 12h4" />
                </svg>
              </div>
              <span className={styles.menuText}>Архив заявок</span>
              <span className={styles.menuArrow}>›</span>
            </button>
          </div>
        </section>

        <section className={styles.menuSection}>
          <h2 className={styles.sectionTitle}>Настройки</h2>
          <div className={styles.menuList}>
            <div className={styles.menuItem}>
              <div className={styles.menuIconWrapper} style={{ color: '#FF3B30' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <span className={styles.menuText}>Уведомления PUSH</span>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>
        </section>

        <div className={styles.actionContainer}>
          <button className={styles.endShiftButton} onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', width: '20px'}}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Завершить смену
          </button>
        </div>
      </div>
    </div>
  );
};