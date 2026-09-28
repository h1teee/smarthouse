import React, { useState } from 'react';
import styles from './AuthScreen.module.css';

interface AuthScreenProps {
  onNext?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNext }) => {
  const [account, setAccount] = useState('');
  const [apartment, setApartment] = useState('');
  const [loading, setLoading] = useState(false);
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
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <div className={styles.ambientGlow} aria-hidden="true" />

        <div className={styles.textBlock}>
          <h1 className={styles.title}>Вход</h1>
          <p className={styles.subtitle}>Введите данные вашего лицевого счета</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Лицевой счет</label>
            <input 
              className={styles.input}
              placeholder="Например, 61-0001-0015"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Квартира</label>
            <input 
              className={styles.input}
              placeholder="Например, 15"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Загрузка...' : 'Войти'}
          </button>
        </form>
      </main>
    </div>
  );
};