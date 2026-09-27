import React, { useState, useEffect } from 'react';
import styles from './RequestPreviewScreen.module.css';
import { DEFAULT_ANNOUNCEMENT_IMAGE } from '@/screens/CameraScreen/CameraScreen';

interface RequestPreviewScreenProps {
  onBack?: () => void;
  onSubmit?: () => void;
  capturedImage?: string;
}

const ANALYSIS_STEPS = [
  'Распознавание текста на фото (OCR)...',
  'Анализ смысла текста...',
  'Извлечение дат и адресов...',
  'Формирование заявки...'
];

export const RequestPreviewScreen: React.FC<RequestPreviewScreenProps> = ({
  onBack,
  onSubmit,
  capturedImage = DEFAULT_ANNOUNCEMENT_IMAGE,
}) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const [eventType, setEventType] = useState('other');
  const [dates, setDates] = useState('');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');

  const eventLabels: Record<string, string> = {
    water: 'Отключение горячей воды',
    electricity: 'Отключение электричества',
    coldWater: 'Отключение холодной воды',
    heating: 'Ремонт системы отопления',
    other: 'Новое объявление',
  };

  useEffect(() => {
    if (!isProcessing) return;

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    const parseImage = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/requests/ai-recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: capturedImage })
        });
        if (res.ok) {
          const data = await res.json();
          setEventType(data.type || 'other');
          setDates(data.start_date && data.end_date ? data.start_date + ' — ' + data.end_date : 'Даты не найдены');
          setDescription(data.description || 'ИИ не смог извлечь детали');
          setProvider(data.title || 'Управляющая компания');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setIsProcessing(false), 2000);
      }
    };
    parseImage();

    return () => clearInterval(stepInterval);
  }, []);

  const handleSkipAnalysis = () => {
    setIsProcessing(false);
  };

  const [isLoadingSend, setIsLoadingSend] = useState(false);
  const handleSendToModeration = async () => {
    setIsLoadingSend(true);
    try {
      await fetch(import.meta.env.VITE_API_URL + '/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: eventType, 
          title: provider, 
          description: description + '\nДаты: ' + dates 
        })
      });
      setIsSuccess(true);
      setTimeout(() => {
        onSubmit?.();
      }, 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSend(false);
    }
  };

  if (isProcessing) {
    return (
      <div className={styles.screen}>
        <div className={styles.ambientGlow} aria-hidden="true" />
        <div className={styles.processingContentCenter}>
          <div className={styles.neuralHaloLarge} />
          <h2 className={styles.processingTitleMain}>Анализ объявления</h2>
          <p className={styles.processingSubtitleMain}>{ANALYSIS_STEPS[stepIndex]}</p>
          <div className={styles.progressBarTrackCenter}>
            <div 
              className={styles.progressBarFillCenter} 
              style={{ width: (((stepIndex + 1) / ANALYSIS_STEPS.length) * 100) + '%' }} 
            />
          </div>
        </div>
        <footer className={styles.footerProcessing}>
          <button className={styles.demoContinueBtn} onClick={handleSkipAnalysis}>Продолжить</button>
        </footer>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={styles.screen} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.ambientGlow} />
        <div className={styles.successHalo} />
        <div className={styles.successIconWrap}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className={styles.successTitle}>Успешно!</h2>
        <p className={styles.successSubtitle}>Заявка отправлена в УК.</p>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.ambientGlow} />
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Предпросмотр</h1>
        <div style={{ width: 44 }} />
      </header>
      <div className={styles.scrollContent}>
        <div className={styles.photoSummaryCard}>
          <div className={styles.photoContainer}>
            <img src={capturedImage} alt="Captured snippet" className={styles.snippetImg} />
          </div>
          <div className={styles.detectedTypeRow}>
            <div className={styles.detectedDot} />
            <span className={styles.detectedTypeLabel}>{eventLabels[eventType] || eventType}</span>
          </div>
        </div>
        <div className={styles.cardSection}>
          <div className={styles.cardHeader}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h3 className={styles.cardTitle}>Дата и время</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldValue}>{dates}</span>
            </div>
          </div>
        </div>
        <div className={styles.cardSection}>
          <div className={styles.cardHeader}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <h3 className={styles.cardTitle}>Детали</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldValue}>{description}</span>
            </div>
          </div>
        </div>
      </div>
      <footer className={styles.footerSticky}>
        <button 
          className={styles.primaryActionBtn} 
          onClick={handleSendToModeration}
          disabled={isLoadingSend}
        >
          {isLoadingSend ? 'Отправка...' : 'Отправить в УК'}
        </button>
      </footer>
    </div>
  );
};
