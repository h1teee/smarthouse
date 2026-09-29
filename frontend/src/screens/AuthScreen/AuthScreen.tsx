import React, { useState, useEffect } from 'react';
import styles from './AuthScreen.module.css';

interface AuthScreenProps {
  onNext?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNext }) => {
  const [account, setAccount] = useState('');
  const [apartment, setApartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/api/addresses')
      .then(res => res.json())
      .then(data => setAddresses(data || []))
      .catch(() => {});
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
            <input 
              className={styles.input}
              placeholder="Выберите адрес"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              list="address-list"
            />
            <datalist id="address-list">
              {addresses.map((a: any) => (
                <option key={a.id} value={a.full_address} />
              ))}
            </datalist>
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