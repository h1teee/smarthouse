import React, { useState, useEffect } from 'react';
import styles from './AuthScreen.module.css';

interface AuthScreenProps {
  onNext?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNext }) => {
  const [account, setAccount] = useState('');
  const [apartment, setApartment] = useState('');
  const [loading, setLoading] = useState(false);
  const FALLBACK_ADDRESSES = [
    { id: 1, full_address: 'Ростовская обл., г. Ростов-на-Дону, ГСК-3. Мухина, д. 47' },
    { id: 2, full_address: 'Ростовская обл., г. Ростов-на-Дону, пр. Космонавтов, 34а' },
    { id: 3, full_address: 'Ростовская обл., г. Ростов-на-Дону, ул. Большая Садовая, 125' },
    { id: 4, full_address: 'Ростовская обл., г. Ростов-на-Дону, ул. Пушкинская, 42' },
    { id: 5, full_address: 'Ростовская обл., г. Ростов-на-Дону, ст-ца. Елизаветинская, д. 77' },
    { id: 6, full_address: 'Ростовская обл., г. Ростов-на-Дону, Жлобы. Аэродромный, д. 6' },
  ];

  const [addresses, setAddresses] = useState<any[]>(FALLBACK_ADDRESSES);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const filteredAddresses = addresses
    .filter(a => a?.full_address && (!apartment || a.full_address.toLowerCase().includes(apartment.toLowerCase())))
    .slice(0, 10);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://smarthouse-backend.onrender.com';
    fetch(apiUrl + '/api/addresses')
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAddresses(data);
        }
      })
      .catch(() => {
        // Keep fallback addresses if API is down or slow to respond
      });
  }, []);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !apartment) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/login-by-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_number: account, apartment: apartment })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Счет или квартира не найдены');
      }

      // Сохраняем токен
      localStorage.setItem('user_id', String(data.user_id));
      localStorage.setItem('role', data.role);

      if (onNext) onNext();
    } catch (err: any) {
      setError(err.message || 'Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <div className={styles.ambientGlow} aria-hidden="true" />

        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="url(#paint1_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="paint0_linear" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#BF5AF2" />
                  <stop offset="1" stopColor="#8A2BE2" />
                </linearGradient>
                <linearGradient id="paint1_linear" x1="9" y1="12" x2="15" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#BF5AF2" />
                  <stop offset="1" stopColor="#8A2BE2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.title}>Мой Дом</h1>
          <p className={styles.subtitle}>Умная управляющая компания<br/>Лицевой счет</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <input 
              className={styles.input}
              placeholder="00-0000-0000"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Адрес</label>
            <div style={{ position: 'relative' }}>
              <input 
                className={styles.input}
                placeholder="Начните вводить адрес"
                value={apartment}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setApartment(e.target.value);
                  setShowDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
              />
              {showDropdown && filteredAddresses.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: 'rgba(30, 30, 30, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  marginTop: '8px',
                  zIndex: 100,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                  {filteredAddresses.map((a: any) => (
                    <div 
                      key={a.id} 
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        color: '#FFF',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setApartment(a.full_address);
                        setShowDropdown(false);
                      }}
                    >
                      {a.full_address}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Загрузка...' : 'Войти'}
          </button>
        </form>
        
        <div className={styles.demoNote}>
          <p>Для демо-входа используйте:</p>
          <p>Счет: <b>61-0001-0015</b> | Адрес: <b>Ростовская обл., г. Ростов-на-Дону, ГСК-3. Мухина, д. 47</b></p>
        </div>
      </main>
    </div>
  );
};