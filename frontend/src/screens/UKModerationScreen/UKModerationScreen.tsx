import React, { useState, TouchEvent } from 'react';
import styles from './UKModerationScreen.module.css';

interface UKModerationScreenProps {
  onBack: () => void;
  onConfirm: () => void;
  onReject: () => void;
}

export const UKModerationScreen: React.FC<UKModerationScreenProps> = ({ 
  onBack, 
  onConfirm, 
  onReject 
}) => {
  const [title, setTitle] = useState('Отключение воды');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('14:00');
  const [details, setDetails] = useState('В связи с плановыми ремонтными работами в подвале дома будет отключено холодное и горячее водоснабжение.');

  const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);
  
  // Sheet state
  const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoadingReject, setIsLoadingReject] = useState(false);

  // Swipe logic
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 50) {
      setIsRejectSheetOpen(false);
      setTouchStartY(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleConfirm = async () => {
    setIsLoadingConfirm(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccessMsg('Успешно одобрено');
      setIsSuccess(true);
      setTimeout(() => {
        onConfirm();
        setTimeout(() => setIsSuccess(false), 500);
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingConfirm(false);
    }
  };

  const handleRejectSubmit = async () => {
    setIsLoadingReject(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsRejectSheetOpen(false);
      setSuccessMsg('Заявка отклонена');
      setIsSuccess(true);
      setTimeout(() => {
        onReject();
        setTimeout(() => setIsSuccess(false), 500);
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReject(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.screen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.ambientGlow} aria-hidden="true" />
        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(48, 209, 88, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#30D158' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#FFF' }}>{successMsg}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.ambientGlow} aria-hidden="true" />

      <header className={styles.topBar}>
        <button className={styles.backButton} onClick={onBack} aria-label="Назад">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Назад
        </button>
        <span className={styles.headerTitle}>Заявка</span>
        <div className={styles.placeholderRight} />
      </header>

      <main className={styles.content}>
        <div className={styles.photoCard}>
          <div className={styles.photoOverlayTop}>
            <div className={styles.photoBadge}>
              <span className={styles.photoBadgeDot} />
              <span>AI Распознано 98%</span>
            </div>
            <span className={styles.photoFilename}>IMG_20260920.HEIC</span>
          </div>

          <div className={styles.photoCenterMockup}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div className={styles.photoLines}>
              <div className={styles.mockLine} />
              <div className={`${styles.mockLine} ${styles.mockLineShort}`} />
            </div>
          </div>

          <div className={styles.photoOverlayBottom}>
            <span>Оригинал объявления с подъезда</span>
            <span>10 мин назад</span>
          </div>
        </div>

        <div className={styles.authorBadgeWrap}>
          <svg className={styles.authorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className={styles.authorInfo}>Автор: Иванов И.И., кв. 12</span>
        </div>

        <div className={styles.formSection}>
          <div className={styles.formSectionTitle}>Параметры публикации</div>
          <div className={styles.formGroup}>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Заголовок</span>
              <input 
                type="text" 
                className={styles.formInput} 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Тема уведомления"
              />
            </div>

            <div className={styles.formRow}>
              <span className={styles.formLabel}>Начало</span>
              <input 
                type="time" 
                className={styles.formInput} 
                value={start} 
                onChange={(e) => setStart(e.target.value)} 
              />
            </div>

            <div className={styles.formRow}>
              <span className={styles.formLabel}>Конец</span>
              <input 
                type="time" 
                className={styles.formInput} 
                value={end} 
                onChange={(e) => setEnd(e.target.value)} 
              />
            </div>

            <div className={styles.formRowVertical}>
              <span className={styles.formLabel}>Суть</span>
              <textarea 
                className={styles.formTextarea} 
                value={details} 
                onChange={(e) => setDetails(e.target.value)} 
                placeholder="Подробный текст для жителей..."
              />
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <button className={styles.primaryButton} onClick={handleConfirm} disabled={isLoadingConfirm}>
          {isLoadingConfirm ? 'Загрузка...' : 'Подтвердить и разослать PUSH'}
        </button>
        <button className={styles.secondaryButton} onClick={() => setIsRejectSheetOpen(true)}>
          Отклонить
        </button>
        <div className={styles.homeIndicator} aria-hidden="true" />
      </footer>

      {/* Reject Bottom Sheet */}
      <div 
        className={`${styles.bottomSheet} ${isRejectSheetOpen ? styles.show : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.grabberWrap} onClick={() => setIsRejectSheetOpen(false)}>
          <div className={styles.grabber} />
        </div>
        
        {isRejectSheetOpen && (
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>Причина отклонения</h2>
              <button className={styles.closeBtn} onClick={() => setIsRejectSheetOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <textarea
              className={styles.formTextarea}
              style={{ minHeight: '100px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}
              placeholder="Укажите причину для жителя..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            
            <button className={styles.primaryButton} style={{ background: '#FF3B30' }} onClick={handleRejectSubmit} disabled={isLoadingReject}>
              {isLoadingReject ? 'Отклонение...' : 'Отклонить заявку'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
