import React, { useState, useEffect, TouchEvent } from 'react';
import styles from './UKModerationScreen.module.css';
import { createPortal } from 'react-dom';

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
  
  const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoadingReject, setIsLoadingReject] = useState(false);

  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  if (!request) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Назад
          </button>
        </div>
        <div style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Загрузка...</div>
      </div>
    );
  }

  const isWater = request.type === 'water';
  const iconColor = isWater ? '#0A84FF' : '#FF9F0A';

  return (
    <div className={styles.container}>
      {isSuccess && createPortal(
        <div className={styles.successOverlay}>
          <div className={styles.successContent}>
            <div className={styles.successCircle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className={styles.successText}>{successMsg}</div>
          </div>
        </div>,
        document.body
      )}

      <div className={styles.ambientGlow} aria-hidden="true" />
      
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Назад
        </button>
        <div className={styles.headerTitle}>Проверка заявки</div>
      </div>

      <div className={styles.scrollContent}>
        <div className={styles.cardPreview}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap} style={{ background: `${iconColor}15`, color: iconColor }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.cardType}>{isWater ? 'Водоснабжение' : 'Ремонт / Свет'}</div>
          </div>
          <h2 className={styles.cardTitle}>{request.title}</h2>
          <p className={styles.cardDesc}>{request.description}</p>
          
          <div className={styles.timeInfo}>
            <div className={styles.timeLabel}>Начало работ:</div>
            <div className={styles.timeVal}>{request.start_date || 'Не указано'}</div>
          </div>
          <div className={styles.timeInfo}>
            <div className={styles.timeLabel}>Завершение работ:</div>
            <div className={styles.timeVal}>{request.end_date || 'Не указано'}</div>
          </div>
        </div>

        {request.status === 'pending' && (
          <div className={styles.actionButtons}>
            <button 
              className={styles.approveBtn}
              onClick={handleConfirm}
              disabled={isLoadingConfirm}
            >
              {isLoadingConfirm ? <span className={styles.spinner} /> : 'Одобрить'}
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
            className={styles.rejectSheet}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.grabber} />
            <h3 className={styles.sheetTitle}>Причина отклонения</h3>
            <textarea
              className={styles.reasonInput}
              placeholder="Укажите причину (необязательно, но желательно)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <button 
              className={styles.submitRejectBtn}
              onClick={handleRejectSubmit}
              disabled={isLoadingReject}
            >
              {isLoadingReject ? <span className={styles.spinner} /> : 'Отклонить заявку'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};