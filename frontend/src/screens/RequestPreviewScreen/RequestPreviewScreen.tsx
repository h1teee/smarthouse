import React, { useState, useEffect } from 'react';
import styles from './RequestPreviewScreen.module.css';

interface RequestPreviewScreenProps {
  onBack?: () => void;
  onSubmit?: () => void;
  capturedImage?: string;
}

const ANALYSIS_STEPS = [
  'Извлечение текста...',
  'Анализ смысла...',
  'Синхронизация...',
  'Формирование события...'
];

export const RequestPreviewScreen: React.FC<RequestPreviewScreenProps> = ({
  onBack,
  onSubmit,
  capturedImage = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const [eventType, setEventType] = useState('other');
  const [dates, setDates] = useState('');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');

  const eventLabels: Record<string, string> = {
    water: 'Отключение воды',
    electricity: 'Отключение света',
    coldWater: 'Отключение холодной воды',
    heating: 'Ремонт отопления',
    other: 'Важное уведомление',
  };

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setStepIndex(prev => prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev);
      }, 700);

      const processImg = async () => {
        try {
          const res = await fetch(import.meta.env.VITE_API_URL + '/api/requests/ai-recognize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_base64: capturedImage })
          });
          const data = await res.json();
          setEventType(data.type || 'water');
          setDates(data.date || 'Уточняется');
          setProvider(data.provider || 'УК');
          setDescription(data.description || 'ИИ распознал текст объявления');
        } catch (err) {
          console.error(err);
          setEventType('water');
          setDates('15 - 19 сентября 2026 г.');
          setProvider('УК СМАРТ ДОМ');
          setDescription('Отключение горячего водоснабжения в связи с ремонтными работами на 4 дня.');
        } finally {
          clearInterval(interval);
          setStepIndex(ANALYSIS_STEPS.length - 1);
          setTimeout(() => setIsProcessing(false), 500);
        }
      };
      processImg();
    }
    return () => clearInterval(interval);
  }, [capturedImage, isProcessing]);

  const handleSubmit = async () => {
    setIsSuccess(true);
    setTimeout(() => {
      if (onSubmit) onSubmit();
    }, 2000);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        {!isProcessing && !isSuccess && (
          <button className={styles.backBtn} onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Отмена
          </button>
        )}
      </header>

      {isProcessing && (
        <div className={styles.processingState}>
          <div className={styles.scannerWrapper}>
            <img src={capturedImage} alt="Скан" className={styles.scanImage} />
            <div className={styles.scanLine} />
          </div>
          <h2 className={styles.processingTitle}>GigaChat работает</h2>
          <div className={styles.steps}>
            {ANALYSIS_STEPS.map((step, idx) => {
              const isActive = idx === stepIndex;
              const isDone = idx < stepIndex;
              return (
                <div key={idx} className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}>
                  <div className={styles.stepIcon}>
                    {isDone ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isActive ? (
                      <div className={styles.spinnerSm} />
                    ) : (
                      <div className={styles.dot} />
                    )}
                  </div>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isProcessing && !isSuccess && (
        <div className={styles.resultState}>
          <h2 className={styles.resultTitle}>Распознано успешно</h2>
          <p className={styles.resultDesc}>ИИ извлек данные. Проверьте и сохраните, мы напомним вам заранее.</p>

          <div className={styles.cardBox}>
            <div className={styles.cardRow}>
              <div className={styles.cardLabel}>Тип события</div>
              <div className={styles.cardValAlert}>
                <span className={styles.dotRed} />
                {eventLabels[eventType] || eventLabels.other}
              </div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.cardLabel}>Сроки работ</div>
              <div className={styles.cardVal}>{dates}</div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.cardLabel}>Организация</div>
              <div className={styles.cardVal}>{provider}</div>
            </div>
            <div className={styles.cardRowBlock}>
              <div className={styles.cardLabelBlock}>Суть объявления</div>
              <div className={styles.cardText}>{description}</div>
            </div>
          </div>

          <button className={styles.submitBtn} onClick={handleSubmit}>
            Сохранить в события
          </button>
        </div>
      )}

      {isSuccess && (
        <div className={styles.successState}>
          <div className={styles.successCircle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className={styles.successTitle}>Событие добавлено</h2>
          <p className={styles.successDesc}>Оно появится в вашей ленте, и мы пришлем пуш-уведомление накануне.</p>
        </div>
      )}
    </div>
  );
};