import React from 'react';
import { Button } from '@/components/Button';
import logoSrc from '@/assets/logo.svg';
import styles from './AuthScreen.module.css';

/**
 * Экран 1.1 — Бесшовная авторизация.
 * Premium Dark — Apple iOS Design Language.
 */
interface AuthScreenProps {
  onNext?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNext }) => {
  const handleContinue = () => {
    console.log('[AuthScreen] Продолжить через МАХ');
    if (onNext) onNext();
  };

  return (
    <div className={styles.screen}>
      {/* Центральный контент */}
      <main className={styles.content}>
        {/* Ambient glow — живое свечение */}
        <div className={styles.ambientGlow} aria-hidden="true" />

        <div className={styles.logoWrap}>
          <img
            className={styles.logo}
            src={logoSrc}
            alt="Smart Home"
          />
        </div>

        <div className={styles.textBlock}>
          <h1 className={styles.title}>
            Умный дом в<br />
            вашем кармане
          </h1>
          <p className={styles.subtitle}>
            Узнавайте об отключениях<br />
            первыми и влияйте на жизнь<br />
            дома
          </p>
        </div>
      </main>

      {/* Нижняя панель */}
      <footer className={styles.footer}>
        <Button variant="primary" onClick={handleContinue}>
          Продолжить через МАХ
        </Button>
        <div className={styles.homeIndicator} aria-hidden="true" />
      </footer>
    </div>
  );
};
