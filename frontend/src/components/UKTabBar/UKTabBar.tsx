import React from 'react';
import styles from './UKTabBar.module.css';

interface UKTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const icons = {
  requests: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  ),
  broadcast: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    </svg>
  ),
  objects: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-3" />
      <path d="M9 9h1" />
      <path d="M9 13h1" />
      <path d="M9 17h1" />
    </svg>
  ),
  profile: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
};

const tabs = [
  { id: 'requests', label: 'Заявки', iconId: 'requests' },
  { id: 'broadcast', label: 'Рассылка', iconId: 'broadcast' },
  { id: 'objects', label: 'Объекты', iconId: 'objects' },
  { id: 'profile', label: 'Профиль', iconId: 'profile' },
];

export const UKTabBar: React.FC<UKTabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className={styles.tabBar} aria-label="Нижняя навигация">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={isActive}
          >
            <div className={styles.iconWrapper}>
              {icons[tab.iconId as keyof typeof icons]}
            </div>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
