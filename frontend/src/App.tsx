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

type ScreenType = 
  | 'auth'
  | 'address'
  | 'account'
  | 'mainFeed'
  | 'residentNotifications'
  | 'camera'
  | 'requestPreview'
  | 'ukDashboard'
  | 'ukBroadcast'
  | 'ukObjects'
  | 'ukProfile'
  | 'ukAnalytics'
  | 'ukNotifications'
  | 'ukArchive'
  | 'ukModeration'
  | 'billsDashboard'
  | 'billAnalysis'
  | 'meters'
  | 'profile';

type Role = 'resident' | 'uk';

const residentScreens: ScreenType[] = [
  'auth', 'address', 'account', 'mainFeed', 'residentNotifications',
  'camera', 'requestPreview', 'billsDashboard', 'billAnalysis', 'meters', 'profile'
];

const screenOrder: ScreenType[] = [
  'auth', 'address', 'account', 'mainFeed', 'residentNotifications',
  'billsDashboard', 'billAnalysis', 'meters', 'profile', 'camera', 'requestPreview',
  'ukDashboard', 'ukBroadcast', 'ukObjects', 'ukProfile',
  'ukAnalytics', 'ukNotifications', 'ukArchive', 'ukModeration'
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('auth');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [lastResidentScreen, setLastResidentScreen] = useState<ScreenType>('auth');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    bridge.send('VKWebAppInit');
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isKeyboard = window.innerHeight < window.outerHeight * 0.75;
      setIsKeyboardOpen(isKeyboard);
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
      <header className="demoHeader">
        <div className="roleSegmentedControl">
          <button
            className={`roleSegment ${currentRole === 'resident' ? 'active' : ''}`}
            onClick={() => handleRoleChange('resident')}
          >
            Житель
          </button>
          <button
            className={`roleSegment ${currentRole === 'uk' ? 'active' : ''}`}
            onClick={() => handleRoleChange('uk')}
          >
            УК Модератор
          </button>
        </div>
      </header>

      <div className="appContainer">
        <div className={`screenWrapper ${getScreenClass('auth')}`}>
          <AuthScreen onNext={() => navigateTo('mainFeed')} />
        </div>

        <div className={`screenWrapper ${getScreenClass('address')}`}>
          <AddressScreen 
            onBack={() => navigateTo('auth')} 
            onConfirm={() => navigateTo('account')} 
          />
        </div>

        <div className={`screenWrapper ${getScreenClass('account')}`}>
          <AccountScreen 
            onBack={() => navigateTo('address')} 
            onNext={() => navigateTo('mainFeed')} 
            onSkip={() => navigateTo('mainFeed')} 
          />
        </div>

        <div className={`screenWrapper ${getScreenClass('mainFeed')}`}>
          <MainFeedScreen 
            onBack={() => navigateTo('account')} 
            onOpenCamera={() => navigateTo('camera')} 
            onOpenNotifications={() => navigateTo('residentNotifications')}
          />
        </div>

        <div className={`screenWrapper ${getScreenClass('residentNotifications')}`}>
          <UKNotificationsScreen onBack={() => navigateTo('mainFeed')} isResidentMode={true} />
        </div>

        <div className={`screenWrapper ${getScreenClass('billsDashboard')}`}>
          <BillsDashboardScreen 
            onDetailedAnalysis={() => navigateTo('billAnalysis')} 
            onNavigate={navigateTo}
          />
        </div>

        <div className={`screenWrapper ${getScreenClass('billAnalysis')}`}>
          <BillAnalysisScreen onBack={() => navigateTo('billsDashboard')} />
        </div>
        
        <div className={`screenWrapper ${getScreenClass('meters')}`}>
          <MetersScreen onBack={() => navigateTo('billsDashboard')} />
        </div>

        <div className={`screenWrapper ${getScreenClass('profile')}`}>
          <ProfileScreen onLogout={() => navigateTo('auth')} />
        </div>

        <div className={`screenWrapper ${getScreenClass('camera')}`}>
          <CameraScreen 
            onClose={() => navigateTo('mainFeed')} 
            onCapture={(img) => {
              setCapturedPhoto(img);
              navigateTo('requestPreview');
            }} 
          />
        </div>

        <div className={`screenWrapper ${getScreenClass('requestPreview')}`}>
          {currentScreen === 'requestPreview' && (
            <RequestPreviewScreen 
              onBack={() => navigateTo('camera')} 
              onSubmit={() => navigateTo('mainFeed')} 
              capturedImage={capturedPhoto}
            />
          )}
        </div>

        <div className={`screenWrapper ${getScreenClass('ukDashboard')}`}>
          <UKDashboardScreen onOpenRequest={() => navigateTo('ukModeration')} onNavigate={navigateTo} />
        </div>

        <div className={`screenWrapper ${getScreenClass('ukBroadcast')}`}>
          <UKBroadcastScreen />
        </div>

        <div className={`screenWrapper ${getScreenClass('ukObjects')}`}>
          <UKObjectsScreen />
        </div>

        <div className={`screenWrapper ${getScreenClass('ukProfile')}`}>
          <UKProfileScreen onNavigate={navigateTo} />
        </div>

        <div className={`screenWrapper ${getScreenClass('ukAnalytics')}`}>
          <UKAnalyticsScreen onBack={() => navigateTo('ukProfile')} />
        </div>

        <div className={`screenWrapper ${getScreenClass('ukNotifications')}`}>
          <UKNotificationsScreen onBack={() => navigateTo('ukDashboard')} />
        </div>

        <div className={`screenWrapper ${getScreenClass('ukArchive')}`}>
          <UKArchiveScreen onBack={() => navigateTo('ukProfile')} />
        </div>

        <div className={`screenWrapper ${getScreenClass('ukModeration')}`}>
          <UKModerationScreen 
            onBack={() => navigateTo('ukDashboard')} 
            onConfirm={() => navigateTo('ukDashboard')} 
            onReject={() => navigateTo('ukDashboard')} 
          />
        </div>
      </div>

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