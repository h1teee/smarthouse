import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/Button';
import styles from './CameraScreen.module.css';

export const DEFAULT_ANNOUNCEMENT_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
  <rect width="600" height="850" fill="#F8F8FA"/>
  <rect x="25" y="25" width="550" height="800" fill="#FFFFFF" stroke="#D1D1D6" stroke-width="1.5" rx="6"/>
  
  <!-- Header Stamp -->
  <rect x="50" y="55" width="160" height="32" rx="6" fill="#000000" opacity="0.06"/>
  <text x="60" y="76" font-family="-apple-system, sans-serif" font-size="13" font-weight="bold" fill="#2C2C2E">УК «СМАРТ СИТИ»</text>
  <text x="440" y="76" font-family="-apple-system, sans-serif" font-size="13" fill="#8E8E93">15.09.2026</text>

  <!-- Big Title -->
  <text x="300" y="160" font-family="-apple-system, sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="3">ОБЪЯВЛЕНИЕ</text>
  <line x1="140" y1="185" x2="460" y2="185" stroke="#BF5AF2" stroke-width="4" stroke-linecap="round"/>

  <!-- Subtitle -->
  <text x="300" y="235" font-family="-apple-system, sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="#1C1C1E">Уважаемые жители дома!</text>
  
  <!-- Main text -->
  <text x="65" y="290" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">Уведомляем вас, что через 2 недели,</text>
  <text x="65" y="325" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" fill="#FF3B30">с 15 по 19 октября 2026 г. (на 4 дня)</text>
  <text x="65" y="360" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">в связи с проведением плановых гидравлических испытаний</text>
  <text x="65" y="395" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">будет временно прекращена подача</text>
  <text x="65" y="435" font-family="-apple-system, sans-serif" font-size="21" font-weight="900" fill="#000000">ГОРЯЧЕГО ВОДОСНАБЖЕНИЯ</text>
  <text x="65" y="475" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">по адресу: ул. Космонавтов, д. 34а (все подъезды).</text>

  <!-- Notice block -->
  <rect x="55" y="520" width="490" height="90" rx="10" fill="#F2F2F7"/>
  <text x="75" y="555" font-family="-apple-system, sans-serif" font-size="15" font-weight="bold" fill="#1C1C1E">Время проведения работ:</text>
  <text x="75" y="585" font-family="-apple-system, sans-serif" font-size="15" fill="#3A3A3C">ежедневно с 09:00 до 18:00</text>

  <!-- Contacts -->
  <line x1="55" y1="650" x2="545" y2="650" stroke="#E5E5EA" stroke-width="1.5"/>
  <text x="65" y="690" font-family="-apple-system, sans-serif" font-size="15" font-weight="bold" fill="#1C1C1E">МУП «Теплосеть» / УК «Смарт Сити»</text>
  <text x="65" y="720" font-family="-apple-system, sans-serif" font-size="14" fill="#8E8E93">Диспетчерская служба (круглосуточно):</text>
  <text x="65" y="750" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" fill="#0A84FF">+7 (495) 777-12-34</text>
  
  <!-- Stamp circle -->
  <circle cx="480" cy="725" r="42" fill="none" stroke="#0040DD" stroke-width="2.5" opacity="0.6"/>
  <text x="480" y="722" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#0040DD" opacity="0.75" text-anchor="middle">МУП ТЕПЛОСЕТЬ</text>
  <text x="480" y="736" font-family="-apple-system, sans-serif" font-size="8" fill="#0040DD" opacity="0.75" text-anchor="middle">ДЛЯ ДОКУМЕНТОВ</text>
</svg>
`)}`;

interface CameraScreenProps {
  onClose?: () => void;
  onCapture?: (imageData?: string) => void;
  onGallery?: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onClose,
  onCapture,
}) => {
  // Flash mode: only 'off' and 'on' as requested
  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          });
        } catch {
          // Fallback to default camera if environment camera is not available
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (mounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => console.warn('Camera play warning:', e));
          }
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error('Camera access error:', err);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const cycleFlash = () => {
    setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setPreviewImage(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleShutterClick = async () => {
    try {
      const video = videoRef.current;
      const track = streamRef.current?.getVideoTracks()[0];

      let torchUsed = false;
      if (flashMode === 'on' && track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities() as any;
        if (caps.torch) {
          try {
            await track.applyConstraints({ advanced: [{ torch: true } as any] });
            torchUsed = true;
            // Short pause to allow sensor to adjust exposure to the flash
            await new Promise((r) => setTimeout(r, 250));
          } catch (e) {
            console.warn('Torch constraint error:', e);
          }
        }
      }

      let capturedDataUrl: string | null = null;

      // 1. Try ImageCapture API if supported by browser/device
      if (track && (window as any).ImageCapture) {
        try {
          const imageCapture = new (window as any).ImageCapture(track);
          const blob = await imageCapture.takePhoto();
          if (blob && blob.size > 0) {
            capturedDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (e) {
          console.warn('ImageCapture takePhoto fallback to canvas:', e);
        }
      }

      // 2. Fallback to drawing current video frame to canvas
      if (!capturedDataUrl && video) {
        const width = video.videoWidth || video.clientWidth || 1280;
        const height = video.videoHeight || video.clientHeight || 720;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      }

      // Turn off torch immediately
      if (torchUsed && track) {
        track.applyConstraints({ advanced: [{ torch: false } as any] }).catch(() => {});
      }

      if (capturedDataUrl && capturedDataUrl.startsWith('data:image')) {
        setPreviewImage(capturedDataUrl);
      }
    } catch (err) {
      console.error('Shutter error:', err);
    }
  };

  const handleRetake = () => {
    setPreviewImage(null);
    // Ensure video stream remains active and playing
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className={styles.screen}>
      {/* Hidden file input for native device gallery */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Viewfinder background (Always in DOM to prevent black screen) ── */}
      <div className={styles.viewfinder}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* ── Preview Mode Overlay (Renders on top without unmounting video) ── */}
      {previewImage ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '16px',
            }}
          >
            <img
              src={previewImage}
              alt="Предпросмотр"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          </div>
          <footer
            className={styles.bottomBar}
            style={{
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'rgba(0,0,0,0.85)',
            }}
          >
            <Button
              variant="ghost"
              onClick={handleRetake}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
              }}
            >
              Переснять
            </Button>
            <Button
              variant="primary"
              onClick={() => onCapture?.(previewImage)}
              style={{ flex: 1 }}
            >
              Продолжить
            </Button>
          </footer>
        </div>
      ) : (
        <>
          {/* ── Top bar ───────────────────────────────────── */}
          <header className={styles.topBar}>
            <button
              className={styles.topBtn}
              onClick={onClose}
              aria-label="Закрыть"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className={styles.topPill}>
              <span>ДОКУМЕНТ</span>
            </div>

            <button
              className={styles.topBtn}
              onClick={cycleFlash}
              aria-label={`Вспышка: ${flashMode === 'on' ? 'Включена' : 'Выключена'}`}
            >
              <svg width="15" height="22" viewBox="0 0 14 22" fill="none">
                <path
                  d="M8 1L1 12.5H6.5L5.5 21L13 9.5H7.5L8 1Z"
                  stroke="#FFFFFF"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  fill={flashMode === 'on' ? '#FFFFFF' : 'none'}
                />
              </svg>
              {flashMode === 'off' && (
                <span className={styles.flashSlash}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <line
                      x1="2"
                      y1="20"
                      x2="20"
                      y2="2"
                      stroke="#FFFFFF"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}
            </button>
          </header>

          {/* ── Scanner overlay ───────────────────────────── */}
          <div className={styles.scannerOverlay}>
            <div className={styles.scannerFrame}>
              <span className={`${styles.corner} ${styles.cornerTL}`} />
              <span className={`${styles.corner} ${styles.cornerTR}`} />
              <span className={`${styles.corner} ${styles.cornerBL}`} />
              <span className={`${styles.corner} ${styles.cornerBR}`} />
            </div>
            <p className={styles.hint}>Наведите камеру на бумажное объявление</p>
          </div>

          {/* ── Bottom bar ────────────────────────────────── */}
          <footer className={styles.bottomBar}>
            <div className={styles.bottomGradient} aria-hidden="true" />

            <div className={styles.bottomControls}>
              {/* Gallery button */}
              <button
                className={styles.galleryBtn}
                onClick={handleGalleryClick}
                aria-label="Загрузить из галереи"
                title="Загрузить из галереи"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="2"
                    y="3"
                    width="20"
                    height="18"
                    rx="4"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                  />
                  <circle cx="8.5" cy="9.5" r="2" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path
                    d="M2 17L7.5 12.5C8.33 11.83 9.67 11.83 10.5 12.5L16 17"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 15L15.88 13.12C16.71 12.29 18.04 12.29 18.88 13.12L22 16.25"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Shutter button */}
              <button
                className={styles.shutterBtn}
                onClick={handleShutterClick}
                aria-label="Сделать снимок"
              >
                <span className={styles.shutterInner} />
              </button>

              {/* Spacer */}
              <div style={{ width: 44, height: 44 }} />
            </div>
          </footer>

          {/* ── Home Indicator ────────────────────────────── */}
          <div className={styles.homeIndicator} aria-hidden="true" />
        </>
      )}
    </div>
  );
};