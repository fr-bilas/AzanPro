import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Volume2, VolumeX, MapPin, Languages, RefreshCw } from 'lucide-react';
import LocationService from '../services/LocationService';

interface SettingsMenuProps {
  darkMode: boolean;
  onLocationUpdate: (location: any) => void;
  onError: (error: string) => void;
}

interface SettingsState {
  notifications: boolean;
  volume: number;
  language: 'en' | 'bn';
  azanEnabled: boolean;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ darkMode, onLocationUpdate, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    notifications: true,
    volume: 90,
    language: 'en',
    azanEnabled: true
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('prayerAppSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: SettingsState) => {
    setSettings(newSettings);
    localStorage.setItem('prayerAppSettings', JSON.stringify(newSettings));
  };

  const handleNotificationToggle = async () => {
    const newSettings = { ...settings, notifications: !settings.notifications };
    
    if (newSettings.notifications) {
      // Request permission when enabling
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          onError('Notification permission denied');
          return;
        }
      }
    }
    
    saveSettings(newSettings);
  };

  const handleVolumeChange = (volume: number) => {
    const newSettings = { ...settings, volume };
    saveSettings(newSettings);
  };

  const handleLanguageToggle = () => {
    const newSettings = { ...settings, language: settings.language === 'en' ? 'bn' : 'en' };
    saveSettings(newSettings);
  };

  const handleAzanToggle = () => {
    const newSettings = { ...settings, azanEnabled: !settings.azanEnabled };
    saveSettings(newSettings);
  };

  const handleLocationRefresh = async () => {
    setLoading(true);
    try {
      const locationData = await LocationService.getCurrentLocation();
      onLocationUpdate(locationData);
      
      // Show success message
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed;
          top: 80px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 1000;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          📍 Location updated successfully!
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 3000);
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    en: {
      settings: 'Settings',
      notifications: 'Prayer Notifications',
      volume: 'Azan Volume',
      language: 'Language',
      location: 'Update Location',
      azanSound: 'Azan Sound',
      updating: 'Updating...'
    },
    bn: {
      settings: 'সেটিংস',
      notifications: 'নামাজের নোটিফিকেশন',
      volume: 'আযানের আওয়াজ',
      language: 'ভাষা',
      location: 'লোকেশন আপডেট',
      azanSound: 'আযানের শব্দ',
      updating: 'আপডেট হচ্ছে...'
    }
  };

  const t = texts[settings.language];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors touch-manipulation ${
          darkMode 
            ? 'bg-slate-800 hover:bg-slate-700 text-white' 
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
        }`}
        title={t.settings}
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Settings Panel */}
          <div className={`absolute right-0 top-12 w-80 rounded-xl border shadow-xl z-50 ${
            darkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <div className="p-4">
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                {t.settings}
              </h3>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {settings.notifications ? (
                    <Bell className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  ) : (
                    <BellOff className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  )}
                  <span className={`${darkMode ? 'text-white' : 'text-slate-700'}`}>
                    {t.notifications}
                  </span>
                </div>
                <button
                  onClick={handleNotificationToggle}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications 
                      ? 'bg-emerald-500' 
                      : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Azan Sound Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {settings.azanEnabled ? (
                    <Volume2 className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  ) : (
                    <VolumeX className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  )}
                  <span className={`${darkMode ? 'text-white' : 'text-slate-700'}`}>
                    {t.azanSound}
                  </span>
                </div>
                <button
                  onClick={handleAzanToggle}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.azanEnabled 
                      ? 'bg-emerald-500' 
                      : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.azanEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Volume Control */}
              <div className="mb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Volume2 className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-slate-700'}`} />
                  <span className={`${darkMode ? 'text-white' : 'text-slate-700'}`}>
                    {t.volume}: {settings.volume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${settings.volume}%, ${darkMode ? '#475569' : '#e2e8f0'} ${settings.volume}%, ${darkMode ? '#475569' : '#e2e8f0'} 100%)`
                  }}
                />
              </div>

              {/* Language Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Languages className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-slate-700'}`} />
                  <span className={`${darkMode ? 'text-white' : 'text-slate-700'}`}>
                    {t.language}
                  </span>
                </div>
                <button
                  onClick={handleLanguageToggle}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {settings.language === 'en' ? 'EN' : 'বাং'}
                </button>
              </div>

              {/* Location Update */}
              <button
                onClick={handleLocationRefresh}
                disabled={loading}
                className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors disabled:opacity-50 ${
                  darkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
                <span>{loading ? t.updating : t.location}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsMenu;