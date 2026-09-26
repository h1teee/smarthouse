import React, { useState } from 'react';
import { Button } from '@/components/Button';
import styles from './AccountScreen.module.css';

/**
 * Экран 1.3 — Привязка лицевого счета.
 * Premium Dark — Apple iOS Design Language.
 */
interface AccountScreenProps {
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onBack, onNext, onSkip }) => {
  const [accountNumber, setAccountNumber] = useState('');

  const handleNext = () => {
    console.log('[AccountScreen] Привязать и продолжить', accountNumber);
    if (onNext) onNext();
  };

  const handleSkip = () => {
    console.log('[AccountScreen] Сделать позже');
    if (onSkip) onSkip();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.ambientGlow} aria-hidden="true" />

      <header className={styles.topBar}>
        <button className={styles.backButton} onClick={onBack} aria-label="Назад">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Назад
        </button>
      </header>

      <main className={styles.content}>
        <div className={styles.spacerTop} />
        
        <div className={styles.iconBox}>
          <svg className={styles.iconPlaceholder} viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D07EF7" />
                <stop offset="100%" stopColor="#BF5AF2" />
              </linearGradient>
            </defs>
            <path 
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
              stroke="url(#shieldGradient)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* Внутренний блик для объема */}
            <path 
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
              fill="url(#shieldGradient)"
              fillOpacity="0.15"
            />
          </svg>
        </div>

        <div className={styles.textBlock}>
          <h1 className={styles.title}>ЖКХ без сюрпризов</h1>
          <p className={styles.subtitle}>
            Добавьте лицевой счет сейчас, чтобы ИИ анализировал ваши квитанции и предупреждал об аномалиях в начислениях
          </p>
        </div>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            placeholder="Номер лицевого счета"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>

        <div className={styles.spacerBottom} />
      </main>

      <footer className={styles.footer}>
        <Button variant="primary" disabled={!accountNumber} onClick={handleNext}>
          Привязать и продолжить
        </Button>
        <Button variant="ghost" onClick={handleSkip}>
          Сделать позже
        </Button>
        <div className={styles.homeIndicator} aria-hidden="true" />
      </footer>
    </div>
  );
};
