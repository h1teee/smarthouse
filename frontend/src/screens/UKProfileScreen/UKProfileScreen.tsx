import React, { useState } from 'react';
import styles from './UKProfileScreen.module.css';

interface UKProfileScreenProps {
  onNavigate: (screen: any) => void;
}

export const UKProfileScreen: React.FC<UKProfileScreenProps> = ({ onNavigate }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <header className={`${styles.header} ${styles.animateStagger1}`}>
          <h1 className={styles.title}>Диспетчерская</h1>
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
                <div className={styles.dispatcherName}>Александр</div>
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
              <div className={styles.statLabel}>Закрыто за смену</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrap} ${styles.orange}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.statValue}>12</div>
              <div className={styles.statLabel}>Заявок в работе</div>
            </div>
          </div>
        </section>

        <section className={styles.animateStagger3}>
          <div className={styles.settingsGroup}>
            <div className={styles.settingsItem} onClick={() => onNavigate('ukAnalytics')}>
              <span className={styles.settingsLabel}>Аналитика района</span>
              <div className={styles.settingsRight}>
                <span className={styles.badge}>Новое</span>
                <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            <div className={styles.settingsItem} onClick={() => onNavigate('ukArchive')}>
              <span className={styles.settingsLabel}>Архив рассылок МАХ</span>
              <div className={styles.settingsRight}>
                <svg className={styles.chevronIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            <div className={styles.settingsItem} onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
              <span className={styles.settingsLabel}>PUSH-уведомления</span>
              <div className={`${styles.toggle} ${notificationsEnabled ? styles.toggleOn : ''}`}>
                <div className={styles.toggleCircle} />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.animateStagger4}>
          <div className={styles.logoutCard}>
            <span className={styles.logoutText}>Завершить смену</span>
          </div>
        </section>

      </div>
    </div>
  );
};
