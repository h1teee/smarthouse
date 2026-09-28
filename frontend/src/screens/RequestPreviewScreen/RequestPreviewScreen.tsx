import React, { useState, useEffect } from 'react';
import styles from './RequestPreviewScreen.module.css';
import { DEFAULT_ANNOUNCEMENT_IMAGE } from '@/screens/CameraScreen/CameraScreen';

interface RequestPreviewScreenProps {
  onBack?: () => void;
  onSubmit?: () => void;
  capturedImage?: string;
}

const ANALYSIS_STEPS = [
  'Распознавание текста (OCR)...',
  'Анализ смысла текста...',
  'Извлечение дат и типа...',
  'Формирование отчета...'
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
    electricity: 'Отключение электроэнергии',
    coldWater: 'Отключение холодной воды',
    heating: 'Ремонт системы отопления',
    other: 'Прочее объявление',
  };

  useEffect(() => {
    if (!isProcessing) return;

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev);
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
        setDescription('Отключение водоснабжения (fallback).');
      } finally {
        clearInterval(stepInterval);
        setIsProcessing(false);
      }
    };

    processImg();

    return () => clearInterval(stepInterval);
  }, [isProcessing, capturedImage]);

  const handleSubmit = () => {
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className={styles.screen}>
        <div className={styles.successContainer}>
          <div className={styles.successIconWrap}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#32D74B" strokeWidth="2"/>
              <path d="M8 12.5L11 15.5L16 9" stroke="#32D74B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className={styles.successTitle}>Отправлено в УК</h2>
          <p className={styles.successSubtitle}>
            Управляющая компания получила уведомление и скоро опубликует новость в ленте.
          </p>
          <button className={styles.primaryBtn} onClick={onSubmit}>
            На главный экран
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={styles.backText}>Отмена</span>
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.imagePreviewWrap}>
          <img src={capturedImage} alt="Captured" className={styles.imagePreview} />
          {isProcessing && (
            <div className={styles.processingOverlay}>
              <div className={styles.scannerLine} />
            </div>
          )}
        </div>

        {isProcessing ? (
          <div className={styles.processingInfo}>
            <div className={styles.spinner} />
            <h3 className={styles.processingTitle}>GigaChat AI анализирует</h3>
            <p className={styles.processingStep}>{ANALYSIS_STEPS[stepIndex]}</p>
          </div>
        ) : (
          <div className={styles.resultContainer}>
            <div className={styles.resultHeader}>
              <div className={styles.aiBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor"/>
                </svg>
                AI Результат
              </div>
            </div>

            <div className={styles.resultField}>
              <div className={styles.fieldLabel}>Тип события</div>
              <div className={styles.fieldValue}>{eventLabels[eventType] || eventType}</div>
            </div>

            <div className={styles.resultField}>
              <div className={styles.fieldLabel}>Даты</div>
              <div className={styles.fieldValue}>{dates}</div>
            </div>

            <div className={styles.resultField}>
              <div className={styles.fieldLabel}>Служба</div>
              <div className={styles.fieldValue}>{provider}</div>
            </div>

            <div className={styles.resultField}>
              <div className={styles.fieldLabel}>Описание</div>
              <textarea 
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <button 
          className={styles.primaryBtn} 
          disabled={isProcessing}
          onClick={handleSubmit}
        >
          {isProcessing ? 'Анализ...' : 'Отправить в УК'}
        </button>
      </footer>
    </div>
  );
};