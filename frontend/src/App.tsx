import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { AuthScreen } from '@/screens/AuthScreen';
import { AddressScreen } from '@/screens/AddressScreen';
import { AccountScreen } from '@/screens/AccountScreen';
import { MainFeedScreen } from '@/screens/MainFeedScreen';
import { CameraScreen } from '@/screens/CameraScreen';
import { RequestPreviewScreen } from '@/screens/RequestPreviewScreen';
import { UKDashboardScreen } from '@/screens/UKDashboardScreen';
import { UKBroadcastScreen } from '@/screens/UKBroadcastScreen';
import { UKObjectsScreen } from '@/screens/UKObjectsScreen';
import { UKProfileScreen } from '@/screens/UKProfileScreen';
import { UKAnalyticsScreen } from '@/screens/UKAnalyticsScreen';
import { UKNotificationsScreen } from '@/screens/UKNotificationsScreen';
import { UKArchiveScreen } from '@/screens/UKArchiveScreen';
import { UKModerationScreen } from '@/screens/UKModerationScreen';
import { BillsDashboardScreen } from '@/screens/BillsDashboardScreen';
import { BillAnalysisScreen } from '@/screens/BillAnalysisScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { MetersScreen } from '@/screens/MetersScreen';
import { TabBar } from '@/components/TabBar/TabBar';
import { UKTabBar } from '@/components/UKTabBar/UKTabBar';
import './App.css';

type ScreenType = 
  | 'auth' 
  | 'address' 
  | 'account' 
  | 'mainFeed' 
  | 'residentNotifications'
  | 'billsDashboard'
  | 'billAnalysis'
  | 'meters'
  | 'profile'
  | 'camera' 
  | 'requestPreview' 
  | 'ukDashboard' 
  | 'ukBroadcast'
  | 'ukObjects'
  | 'ukProfile'
  | 'ukModeration'
  | 'ukAnalytics'
  | 'ukNotifications'
  | 'ukArchive';

type Role = 'resident' | 'uk';

const residentScreens: ScreenType[] = [
  'auth', 'address', 'account', 'mainFeed', 'residentNotifications',
  'billsDashboard', 'billAnalysis', 'meters', 'profile', 
  'camera', 'requestPreview'
];

const screenOrder: ScreenType[] = [
  'auth',
  'address',
  'account',
  'mainFeed',
  'residentNotifications',
  'billsDashboard',
  'billAnalysis',
  'meters',
  'profile',
  'camera',
  'requestPreview',
  'ukDashboard',
  'ukBroadcast',
  'ukObjects',
  'ukProfile',
  'ukModeration',
  'ukAnalytics',
  'ukNotifications',
  'ukArchive',
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('auth');
  const [lastResidentScreen, setLastResidentScreen] = useState<ScreenType>('auth');
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>(undefined);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // 1. Инициализация MAX Bridge
    bridge.send('VKWebAppInit');

    // 2. Роутинг (Deep Linking из чат-бота)
    const urlParams = new URLSearchParams(window.location.search);
    const initialScreen = urlParams.get('screen') as ScreenType;
    if (initialScreen && screenOrder.includes(initialScreen)) {
      setCurrentScreen(initialScreen);
    }

    // 3. Отслеживание клавиатуры
    const handleResize = () => {
      // Если высота окна меньше 600px, скорее всего открыта клавиатура
      setIsKeyboardOpen(window.innerHeight < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentRole: Role = residentScreens.includes(currentScreen) ? 'resident' : 'uk';

  const handleRoleChange = (newRole: Role) => {
    if (newRole === 'resident') {
      setCurrentScreen(lastResidentScreen);
    } else {
      setCurrentScreen('ukDashboard');
    }
  };

  const navigateTo = (screen: ScreenType) => {
    if (residentScreens.includes(screen)) {
      setLastResidentScreen(screen);
    }
    setCurrentScreen(screen);
  };

  const getScreenClass = (screen: ScreenType) => {
    const currentIndex = screenOrder.indexOf(currentScreen);
    const screenIndex = screenOrder.indexOf(screen);
    if (screenIndex === currentIndex) return 'active';
    if (screenIndex < currentIndex) return 'slide-left';
    return 'slide-right';
  };

  return (
    <div className="appRoot">
      {/* Демо-ползунок переключения ролей — вынесен в верхний бар, никогда не перекрывает заголовки */}
      <header className="demoHeader">
        <div className="roleSegmentedControl">
          <button
            className={`roleSegment ${currentRole === 'resident' ? 'active' : ''}`}
            onClick={() => handleRoleChange('resident')}
          >
            👤 Житель
          </button>
          <button
            className={`roleSegment ${currentRole === 'uk' ? 'active' : ''}`}
            onClick={() => handleRoleChange('uk')}
          >
            🏢 УК Модератор
          </button>
        </div>
      </header>

      <div className="appContainer">
        {/* Экран 1.1: Авторизация */}
        <div className={`screenWrapper ${getScreenClass('auth')}`}>
          <AuthScreen onNext={() => navigateTo('address')} />
        </div>

        {/* Экран 1.2: Адрес */}
        <div className={`screenWrapper ${getScreenClass('address')}`}>
          <AddressScreen 
            onBack={() => navigateTo('auth')} 
            onConfirm={() => navigateTo('account')} 
          />
        </div>

        {/* Экран 1.3: Лицевой счёт */}
        <div className={`screenWrapper ${getScreenClass('account')}`}>
          <AccountScreen 
            onBack={() => navigateTo('address')} 
            onNext={() => navigateTo('mainFeed')} 
            onSkip={() => navigateTo('mainFeed')} 
          />
        </div>

        {/* Экран 2.1: Главная лента жителя */}
        <div className={`screenWrapper ${getScreenClass('mainFeed')}`}>
          <MainFeedScreen 
            onBack={() => navigateTo('account')} 
            onOpenCamera={() => navigateTo('camera')} 
            onOpenNotifications={() => navigateTo('residentNotifications')}
          />
        </div>

        {/* Экран Уведомлений Жителя */}
        <div className={`screenWrapper ${getScreenClass('residentNotifications')}`}>
          <UKNotificationsScreen onBack={() => navigateTo('mainFeed')} isResidentMode={true} />
        </div>

        {/* Экран 4.1: Счета ЖКХ */}
        <div className={`screenWrapper ${getScreenClass('billsDashboard')}`}>
          <BillsDashboardScreen 
            onDetailedAnalysis={() => navigateTo('billAnalysis')} 
            onNavigate={navigateTo}
          />
        </div>

        {/* Экран 4.2: ИИ Анализ квитанции */}
        <div className={`screenWrapper ${getScreenClass('billAnalysis')}`}>
          <BillAnalysisScreen onBack={() => navigateTo('billsDashboard')} />
        </div>
        
        {/* Экран Счетчики */}
        <div className={`screenWrapper ${getScreenClass('meters')}`}>
          <MetersScreen onBack={() => navigateTo('billsDashboard')} />
        </div>

        {/* Профиль */}
        <div className={`screenWrapper ${getScreenClass('profile')}`}>
          <ProfileScreen />
        </div>

        {/* Экран 2.2: Камера */}
        <div className={`screenWrapper ${getScreenClass('camera')}`}>
          <CameraScreen 
            onClose={() => navigateTo('mainFeed')} 
            onCapture={(img) => {
              setCapturedPhoto(img);
              navigateTo('requestPreview');
            }} 
          />
        </div>

        {/* Экран 2.3 + 2.4: Распознавание и превью заявки */}
        <div className={`screenWrapper ${getScreenClass('requestPreview')}`}>
          {currentScreen === 'requestPreview' && (
            <RequestPreviewScreen 
              onBack={() => navigateTo('camera')} 
              onSubmit={() => navigateTo('mainFeed')} 
              capturedImage={capturedPhoto}
            />
          )}
        </div>

        {/* Экран 3.1: Главная панель УК */}
        <div className={`screenWrapper ${getScreenClass('ukDashboard')}`}>
          <UKDashboardScreen onOpenRequest={() => navigateTo('ukModeration')} onNavigate={navigateTo} />
        </div>

        {/* Экран 3.3: Рассылка УК */}
        <div className={`screenWrapper ${getScreenClass('ukBroadcast')}`}>
          <UKBroadcastScreen />
        </div>

        {/* Экран 3.4: Объекты УК (Карта) */}
        <div className={`screenWrapper ${getScreenClass('ukObjects')}`}>
          <UKObjectsScreen />
        </div>

        {/* Экран 3.5: Профиль УК */}
        <div className={`screenWrapper ${getScreenClass('ukProfile')}`}>
          <UKProfileScreen onNavigate={navigateTo} />
        </div>

        {/* Экран Аналитики УК */}
        <div className={`screenWrapper ${getScreenClass('ukAnalytics')}`}>
          <UKAnalyticsScreen onBack={() => navigateTo('ukProfile')} />
        </div>

        {/* Экран Уведомлений УК */}
        <div className={`screenWrapper ${getScreenClass('ukNotifications')}`}>
          <UKNotificationsScreen onBack={() => navigateTo('ukDashboard')} />
        </div>

        {/* Экран Архива рассылок УК */}
        <div className={`screenWrapper ${getScreenClass('ukArchive')}`}>
          <UKArchiveScreen onBack={() => navigateTo('ukProfile')} />
        </div>

        {/* Экран 3.2: Проверка и публикация УК */}
        <div className={`screenWrapper ${getScreenClass('ukModeration')}`}>
          <UKModerationScreen 
            onBack={() => navigateTo('ukDashboard')} 
            onConfirm={() => navigateTo('ukDashboard')} 
            onReject={() => navigateTo('ukDashboard')} 
          />
        </div>
      </div>

      {/* Глобальный TabBar для жителя */}
      {['mainFeed', 'billsDashboard', 'billAnalysis', 'meters', 'profile'].includes(currentScreen) && !isKeyboardOpen && (
        <TabBar 
          currentTab={currentScreen === 'profile' ? 'account' : currentScreen === 'mainFeed' ? 'mainFeed' : 'billsDashboard'} 
          onChangeTab={(tab) => {
            if (tab === 'mainFeed') navigateTo('mainFeed');
            if (tab === 'billsDashboard') navigateTo('billsDashboard');
            if (tab === 'account') navigateTo('profile');
          }} 
        />
      )}

      {/* Глобальный TabBar для УК */}
      {['ukDashboard', 'ukBroadcast', 'ukObjects', 'ukProfile'].includes(currentScreen) && !isKeyboardOpen && (
        <UKTabBar 
          activeTab={
            currentScreen === 'ukDashboard' ? 'requests' : 
            currentScreen === 'ukBroadcast' ? 'broadcast' : 
            currentScreen === 'ukObjects' ? 'objects' : 'profile'
          } 
          onTabChange={(tab) => {
            if (tab === 'requests') navigateTo('ukDashboard');
            if (tab === 'broadcast') navigateTo('ukBroadcast');
            if (tab === 'objects') navigateTo('ukObjects');
            if (tab === 'profile') navigateTo('ukProfile');
          }} 
        />
      )}
    </div>
  );
};

export default App;
