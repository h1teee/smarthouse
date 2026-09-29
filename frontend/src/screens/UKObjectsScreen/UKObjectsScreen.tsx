import React, { useState, useEffect } from 'react';
import { YMaps, Map, Placemark, Clusterer } from '@pbe/react-yandex-maps';
import styles from './UKObjectsScreen.module.css';

type HouseStatus = 'ok' | 'repair' | 'critical';

interface MapObject {
  address_id: number;
  full_address: string;
  lat: number;
  lng: number;
  status: HouseStatus;
}

interface RequestItem {
  id: number;
  address_id: number;
  type: string;
  title: string;
  description: string;
  status: string;
}

export const UKObjectsScreen: React.FC = () => {
  const [houses, setHouses] = useState<MapObject[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<HouseStatus | 'all'>('all');
  
  
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [objRes, reqRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + '/api/uk/objects'),
          fetch(import.meta.env.VITE_API_URL + '/api/uk/requests')
        ]);
        const objData = await objRes.json();
        const reqData = await reqRes.json();
        if (Array.isArray(objData)) setHouses(objData);
        if (Array.isArray(reqData)) setRequests(reqData);
      } catch (err) {
        console.error('Failed to load map data', err);
      }
    };
    fetchData();
  }, []);

  const filteredHouses = houses.filter(h => {
    if (filterStatus !== 'all' && h.status !== filterStatus) return false;
    if (searchQuery && !h.full_address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedHouse = houses.find(h => h.address_id === selectedHouseId);
  const selectedHouseRequests = requests.filter(r => r.address_id === selectedHouseId && r.status !== 'resolved');

  const getPinColor = (status: HouseStatus) => {
    switch (status) {
      case 'critical': return '#EF4444';
      case 'repair': return '#F59E0B';
      case 'ok': return '#10B981';
      default: return '#10B981';
    }
  };

  const getProblemIcon = () => {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    );
  };

  const handleMapClick = () => {
    setSelectedHouseId(null);
    setIsFilterOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Background Map */}
      <div className={styles.mapBase}>
        <YMaps query={{ apikey: 'fe27ea2a-71dd-444a-95ec-3c22b1dc85bd' }}>
          <Map 
            defaultState={{ center: [47.2313, 39.7233], zoom: 12 }} 
            width="100%" 
            height="100%"
            onClick={handleMapClick}
            options={{ suppressMapOpenBlock: true }}
          >
            <Clusterer
              options={{
                preset: 'islands#invertedVioletClusterIcons',
                groupByCoordinates: false,
              }}
            >
              {filteredHouses.map(house => (
                <Placemark
                  key={house.address_id}
                  geometry={[house.lat, house.lng]}
                  options={{
                    preset: 'islands#circleIcon',
                    iconColor: getPinColor(house.status)
                  }}
                  onClick={(e: any) => {
                    // Stop propagation to prevent map click
                    if (e && e.get) {
                      e.get('domEvent')?.stopPropagation();
                    }
                    setSelectedHouseId(house.address_id);
                  }}
                />
              ))}
            </Clusterer>
          </Map>
        </YMaps>
      </div>

      {/* Floating Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Поиск адреса..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterBtnWrapper}>
          <button className={styles.filterBtn} onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
          
          <div className={`${styles.filterDropdown} ${isFilterOpen ? styles.open : ''}`}>
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupTitle}>Статус</div>
              <button className={`${styles.filterOption} ${filterStatus === 'all' ? styles.active : ''}`} onClick={() => setFilterStatus('all')}>Все</button>
              <button className={`${styles.filterOption} ${filterStatus === 'critical' ? styles.active : ''}`} onClick={() => setFilterStatus('critical')}>Критично</button>
              <button className={`${styles.filterOption} ${filterStatus === 'repair' ? styles.active : ''}`} onClick={() => setFilterStatus('repair')}>В ремонте</button>
              <button className={`${styles.filterOption} ${filterStatus === 'ok' ? styles.active : ''}`} onClick={() => setFilterStatus('ok')}>ОК</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className={`${styles.bottomSheet} ${selectedHouse ? styles.show : ''}`}>
        <div className={styles.grabberWrap} onClick={() => setSelectedHouseId(null)}>
          <div className={styles.grabber} />
        </div>
        
        {selectedHouse && (
          <>
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>{selectedHouse.full_address}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedHouseId(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            {selectedHouseRequests.length > 0 ? (
              <div className={styles.cardList}>
                {selectedHouseRequests.map(prob => (
                  <div key={prob.id} className={styles.problemCard}>
                    <div className={`${styles.cardIconWrap} ${styles.critical}`}>
                      {getProblemIcon()}
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardTitle}>{prob.title}</div>
                      <div className={styles.cardDesc}>{prob.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                Проблем нет. Дом в хорошем состоянии.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
