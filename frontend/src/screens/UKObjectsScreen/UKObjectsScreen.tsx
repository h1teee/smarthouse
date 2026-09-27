import React, { useState, useEffect } from 'react';
import styles from './UKObjectsScreen.module.css';

export interface UKObjectsScreenProps {
  onNavigate?: (screen: any) => void;
}

const mapFilters = [
  { id: 'all', label: 'Все объекты' },
  { id: 'critical', label: 'Критичные состояния' },
  { id: 'repair', label: 'Ремонт' },
  { id: 'normal', label: 'В норме' }
];

export const UKObjectsScreen: React.FC<UKObjectsScreenProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [houses, setHouses] = useState<any[]>([]);

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/map/houses');
        if (res.ok) {
          const data = await res.json();
          setHouses(data || []);
        }
      } catch (err) {}
    };
    fetchHouses();
  }, []);

  const displayHouses = houses.map(h => ({
    id: h.id,
    lat: h.lat,
    lng: h.lng,
    status: h.incidents > 0 ? 'critical' : 'normal',
    title: h.address
  }));

  const filteredHouses = displayHouses.filter(house => {
    if (activeFilter === 'all') return true;
    return house.status === activeFilter;
  }).filter(house => house.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.container}>
      <header className={`${styles.header} ${styles.animateStagger1}`}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Объекты</h1>
          <button 
            className={styles.mapToggleButton}
            onClick={() => onNavigate?.('ukDashboard')}
          >
            Списком
          </button>
        </div>
        
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Поиск по адресу: ул. Садовая..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <section className={`${styles.filtersScroll} ${styles.animateStagger2}`}>
        {mapFilters.map(filter => (
          <button
            key={filter.id}
            type="button"
            className={`${styles.filterChip} ${activeFilter === filter.id ? styles.filterChipActive : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </section>

      <div className={`${styles.mapWrapper} ${styles.animateStagger3}`}>
        {/* Mock Map Background Layer */}
        <div className={styles.mapGrid} />
        
        {/* Dynamic Map Pins */}
        {filteredHouses.map((house, i) => (
          <div 
            key={house.id}
            className={`${styles.mapPin} ${house.status === 'critical' ? styles.pinCritical : styles.pinNormal}`}
            style={{
              top: `${20 + (i * 15)}%`,
              left: `${20 + (i * 20)}%`
            }}
          >
            <div className={styles.pinDot} />
            <div className={styles.pinPulse} />
            <div className={styles.pinTooltip}>
              {house.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};