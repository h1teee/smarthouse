import React, { useState, useEffect } from 'react';
import styles from './AddressScreen.module.css';

interface AddressScreenProps {
  onBack?: () => void;
  onConfirm?: () => void;
}

interface AddressItem {
  id: number;
  full_address: string;
  lat: number;
  lng: number;
}

export const AddressScreen: React.FC<AddressScreenProps> = ({ onBack, onConfirm }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/addresses' + (searchQuery ? '?q=' + encodeURIComponent(searchQuery) : ''));
        if (res.ok) {
          const data = await res.json();
          setAddresses(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch addresses', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchAddresses();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleBack = () => {
    if (onBack) onBack();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className={styles.title}>Ваш адрес</h2>
      </header>

      <div className={styles.content}>
        <p className={styles.description}>
          Укажите адрес вашего дома, чтобы получать актуальную информацию от управляющей компании.
        </p>

        <div className={styles.searchContainer}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Улица, дом..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.addressList}>
          {loading ? (
            <div style={{color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '20px'}}>Загрузка...</div>
          ) : addresses.map((addr) => (
            <button
              key={addr.id}
              className={`${styles.addressCard} ${selectedAddress === addr.full_address ? styles['addressCard--selected'] : ''}`}
              onClick={() => setSelectedAddress(addr.full_address)}
            >
              <span>{addr.full_address}</span>
              {selectedAddress === addr.full_address && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          ))}
          {!loading && addresses.length === 0 && (
            <div style={{color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '20px'}}>Ничего не найдено</div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button 
          className={styles.confirmButton}
          disabled={!selectedAddress}
          onClick={handleConfirm}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
};