import { TouchEvent, useState } from 'react';

export function useSwipeClose(onClose: () => void, threshold = 50) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > threshold) {
      onClose();
      setTouchStartY(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  return { onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd };
}
