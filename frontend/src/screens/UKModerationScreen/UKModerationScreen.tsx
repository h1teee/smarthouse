import React, { useState, useEffect, TouchEvent } from 'react';
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
  const [request, setRequest] = useState<any>(null);
  const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);
  
  // Sheet state
  const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoadingReject, setIsLoadingReject] = useState(false);

  // Swipe logic
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      const idStr = localStorage.getItem('selectedRequestId');
      if (!idStr) return;
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/uk/requests?status=all');
        if (res.ok) {
          const list = await res.json();
          const req = list.find((r: any) => String(r.id) === idStr);
          if (req) {
            setRequest(req);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRequest();
  }, []);

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
    if (!request) return;
    setIsLoadingConfirm(true);
    try {
      await fetch(import.meta.env.VITE_API_URL + '/api/uk/requests/' + request.id + '/approve', { method: 'POST' });
      setSuccessMsg('Заявка одобрена');
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
    if (!request) return;
    setIsLoadingReject(true);
    try {
      await fetch(import.meta.env.VITE_API_URL + '/api/uk/requests/' + request.id + '/reject', { method: 'POST' });
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

  if (!request) {
    return <div className={styles.screen} style={{padding: 20, textAlign: 'center', color: '#fff'}}>Загрузка...</div>;
  }

  return (
    <div className={styles.screen}>
      <div className={styles.ambientGlow} aria-hidden="true" />
      
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.headerTitle}>Заявка #{request.id}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.badgeWrapper}>
            <div className={styles.badge}>Новая</div>
          </div>
          <h1 className={styles.title}>{request.title}</h1>
          
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{request.start_date || 'Нет данных'} — {request.end_date || 'Нет данных'}</span>
            </div>
            <div className={styles.infoRow}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>г. Ростов-на-Дону, тип: {request.type}</span>
            </div>
          </div>

          <div className={styles.detailsBlock}>
            <h3 className={styles.detailsTitle}>Детали заявки</h3>
            <p className={styles.detailsText}>{request.description}</p>
          </div>
        </div>

        {request.status === 'pending' && (
          <div className={styles.actions}>
            <button 
              className={styles.approveBtn}
              onClick={handleConfirm}
              disabled={isLoadingConfirm}
            >
              {isLoadingConfirm ? <span className={styles.spinner} /> : 'Подтвердить'}
            </button>
            <button 
              className={styles.rejectBtn}
              onClick={() => setIsRejectSheetOpen(true)}
            >
              Отклонить
            </button>
          </div>
        )}
      </div>

      {isRejectSheetOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsRejectSheetOpen(false)} />
          <div 
            className={styles.bottomSheet}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.dragHandle} />
            <h2 className={styles.sheetTitle}>Причина отклонения</h2>
            <textarea
              className={styles.textarea}
              placeholder="Опишите причину отклонения заявки..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <button 
              className={styles.submitRejectBtn}
              onClick={handleRejectSubmit}
              disabled={isLoadingReject || !rejectReason.trim()}
            >
              {isLoadingReject ? <span className={styles.spinner} /> : 'Отклонить заявку'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
