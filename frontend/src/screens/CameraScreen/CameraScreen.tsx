import React, { useState, useRef, useEffect } from 'react';
import styles from './CameraScreen.module.css';

export const DEFAULT_ANNOUNCEMENT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
  <rect width="600" height="850" fill="#F8F8FA"/>
  <rect x="25" y="25" width="550" height="800" fill="#FFFFFF" stroke="#D1D1D6" stroke-width="1.5" rx="6"/>
  <rect x="50" y="55" width="160" height="32" rx="6" fill="#000000" opacity="0.06"/>
  <text x="60" y="76" font-family="-apple-system, sans-serif" font-size="13" font-weight="bold" fill="#2C2C2E">УК СМАРТ ДОМ</text>
  <text x="440" y="76" font-family="-apple-system, sans-serif" font-size="13" fill="#8E8E93">15.09.2026</text>
  <text x="300" y="160" font-family="-apple-system, sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="3">ВНИМАНИЕ</text>
  <line x1="140" y1="185" x2="460" y2="185" stroke="#BF5AF2" stroke-width="4" stroke-linecap="round"/>
  <text x="300" y="235" font-family="-apple-system, sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="#1C1C1E">Уважаемые жильцы!</text>
  <text x="65" y="290" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">Уведомляем вас, что в связи с ремонтом,</text>
  <text x="65" y="325" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" fill="#FF3B30">с 15 по 19 сентября 2026 г. (на 4 дня)</text>
  <text x="65" y="360" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">в связи с проведением плановых работ</text>
  <text x="65" y="395" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">будет полностью прекращена подача</text>
  <text x="65" y="435" font-family="-apple-system, sans-serif" font-size="21" font-weight="900" fill="#000000">ГОРЯЧЕГО ВОДОСНАБЖЕНИЯ</text>
  <text x="65" y="475" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">по адресу: ул. Пушкинская, д. 34А.</text>
  <rect x="55" y="520" width="490" height="90" rx="10" fill="#F2F2F7"/>
  <text x="300" y="555" font-family="-apple-system, sans-serif" font-size="15" fill="#1C1C1E" text-anchor="middle">Просим вас заблаговременно сделать запасы.</text>
  <text x="300" y="580" font-family="-apple-system, sans-serif" font-size="15" fill="#1C1C1E" text-anchor="middle">Приносим извинения за временные неудобства.</text>
  <path d="M70 680 Q 90 650 120 680 T 170 680" fill="none" stroke="#0055FF" stroke-width="3"/>
  <text x="70" y="730" font-family="-apple-system, sans-serif" font-size="15" font-weight="bold" fill="#000000">А.В. Смирнов</text>
  <text x="70" y="750" font-family="-apple-system, sans-serif" font-size="14" fill="#8E8E93">Главный инженер УК</text>
  <text x="400" y="750" font-family="-apple-system, sans-serif" font-size="14" font-weight="bold" fill="#0055FF">+7 (863) 222-33-44</text>
</svg>
`)}`;

interface CameraScreenProps {
  onBack: () => void;
  onPhotoTaken: (photoBase64: string) => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ onBack, onPhotoTaken }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const str = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(str);
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = str;
        }
      } catch (err) {
        console.log('No camera access', err);
        setHasCamera(false);
      }
    };
    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (hasCamera && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
        onPhotoTaken(dataUrl);
      }
    } else {
      onPhotoTaken(DEFAULT_ANNOUNCEMENT_IMAGE);
    }
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.headerTitle}>Сфотографируйте объявление</div>
        <div style={{ width: 24 }} />
      </header>

      <div className={styles.viewport}>
        {hasCamera === true ? (
          <>
            <video ref={videoRef} autoPlay playsInline className={styles.videoStream} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        ) : (
          <div className={styles.demoImageWrapper}>
            <div className={styles.demoBanner}>Режим демо: Камера недоступна, используется тестовое фото</div>
            <img src={DEFAULT_ANNOUNCEMENT_IMAGE} alt="Тестовое фото" className={styles.demoImage} />
          </div>
        )}
        
        <div className={styles.overlayScanner}>
          <div className={styles.cornerTopLeft} />
          <div className={styles.cornerTopRight} />
          <div className={styles.cornerBottomLeft} />
          <div className={styles.cornerBottomRight} />
        </div>
      </div>

      <div className={styles.controls}>
        <p className={styles.instruction}>Наведите камеру на текст объявления. Мы распознаем его с помощью ИИ и добавим в ваши события.</p>
        <button className={styles.captureBtn} onClick={handleCapture}>
          <div className={styles.captureInner} />
        </button>
      </div>
    </div>
  );
};