import React, { useState } from 'react';
import { Button } from '@/components/Button';
import styles from './AddressScreen.module.css';

/**
 * Экран 1.2 — Выбор адреса.
 * Premium Dark — Apple iOS Design Language.
 */
interface AddressScreenProps {
  onBack?: () => void;
  onConfirm?: () => void;
}

export const AddressScreen: React.FC<AddressScreenProps> = ({ onBack, onConfirm }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const MOCK_ADDRESSES = [
    'г. Ростов-на-Дону, пр. Космонавтов, 34а',
    'г. Ростов-на-Дону, ул. Большая Садовая, 125',
    'г. Ростов-на-Дону, ул. Пушкинская, 42',
  ];

  const handleBack = () => {
    console.log('[AddressScreen] Назад');
    if (onBack) onBack();
  };

  const handleConfirm = () => {
    // TODO: переход к следующему шагу с выбранным адресом
    console.log('[AddressScreen] Подтвердить адрес:', selectedAddress);
    if (onConfirm) onConfirm();
  };


  return (
    <div className={styles.screen}>
      {/* Ambient glow — живое свечение фона */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Верхняя навигация */}
      <header className={styles.topBar}>
        <button className={styles.backButton} onClick={handleBack} aria-label="Назад">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Назад
        </button>
      </header>

      {/* Основной контент */}
      <main className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Где вы живете?</h1>
        </div>

        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Например: г. Ростов-на-Дону, ул. Садовая..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.addressList}>
          {MOCK_ADDRESSES.map((address) => (
            <button
              key={address}
              className={`${styles.addressCard} ${selectedAddress === address ? styles['addressCard--selected'] : ''}`}
              onClick={() => setSelectedAddress(address)}
            >
              <span>{address}</span>
              {selectedAddress === address && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Нижняя панель */}
      <footer className={styles.footer}>
        <Button
          variant="primary"
          disabled={!selectedAddress}
          onClick={handleConfirm}
        >
          Подтвердить адрес
        </Button>
        <div className={styles.homeIndicator} aria-hidden="true" />
      </footer>
    </div>
  );
};
