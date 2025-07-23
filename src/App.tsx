import React, { useState, useEffect } from 'react';
import { Moon, Sun, MapPin } from 'lucide-react';
import PrayerTimes from './components/PrayerTimes';
import SettingsMenu from './components/SettingsMenu';
import LocationService from './services/LocationService';
import AudioService from './services/AudioService';

// Islamic Mosque Icon Component
const MosqueIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <defs>
      <linearGradient id="mosqueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.8"/>
      </linearGradient>
    </defs>
    
    {/* Main mosque dome */}
    <ellipse cx="12" cy="7" rx="7" ry="4" fill="url(#mosqueGrad)" fillOpacity="0.95"/>
    <path d="M12 2.5C7.5 2.5 5 4.5 5 7.5v2h14v-2c0-3-2.5-5-7-5z" fill="url(#mosqueGrad)" fillOpacity="0.98"/>
    
    {/* Twin minarets */}
    <rect x="2.5" y="1" width="2" height="10" rx="1" fill="url(#mosqueGrad)" fillOpacity="0.9"/>
    <rect x="19.5" y="1" width="2" height="10" rx="1" fill="url(#mosqueGrad)" fillOpacity="0.9"/>
    
    {/* Main mosque structure */}
    <rect x="5" y="9.5" width="14" height="12" rx="2" fill="url(#mosqueGrad)" fillOpacity="0.92"/>
    
    {/* Entrance arch */}
    <path d="M10.5 21.5v-6c0-1.1.7-1.5 1.5-1.5s1.5.4 1.5 1.5v6" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4"/>
    
    {/* Large prayer time clock - main feature */}
    <circle cx="12" cy="15" r="3.5" fill="rgba(255,255,255,0.95)" stroke="currentColor" strokeWidth="0.4"/>
    <circle cx="12" cy="15" r="0.4" fill="currentColor"/>
    
    {/* Clock hands pointing to prayer time */}
    <line x1="12" y1="15" x2="12" y2="12.2" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round"/>
    <line x1="12" y1="15" x2="14.5" y2="15" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round"/>
    
    {/* Clock numbers for prayer times */}
    <text x="12" y="12.5" textAnchor="middle" fontSize="1.5" fill="currentColor" fontWeight="bold">12</text>
    <text x="15.2" y="15.5" textAnchor="middle" fontSize="1.2" fill="currentColor">3</text>
    <text x="12" y="18.8" textAnchor="middle" fontSize="1.2" fill="currentColor">6</text>
    <text x="8.8" y="15.5" textAnchor="middle" fontSize="1.2" fill="currentColor">9</text>
    
    {/* Crescent moons on minarets */}
    <path d="M3.5 1.2 A0.4 0.4 0 0 1 3.5 0.4 A0.3 0.3 0 0 0 3.5 1.2" fill="currentColor" fillOpacity="0.9"/>
    <path d="M20.5 1.2 A0.4 0.4 0 0 1 20.5 0.4 A0.3 0.3 0 0 0 20.5 1.2" fill="currentColor" fillOpacity="0.9"/>
    
    {/* Main dome crescent */}
    <path d="M12 2.8 A0.5 0.5 0 0 1 12 1.8 A0.4 0.4 0 0 0 12 2.8" fill="currentColor" fillOpacity="0.95"/>
    
    {/* Mosque windows */}
    <rect x="7.5" y="11" width="1.5" height="3" rx="0.75" fill="rgba(255,255,255,0.4)"/>
    <rect x="15" y="11" width="1.5" height="3" rx="0.75" fill="rgba(255,255,255,0.4)"/>
    
    {/* Prayer time indicators around clock */}
    <circle cx="9.5" cy="12.5" r="0.3" fill="rgba(255,255,255,0.6)"/>
    <circle cx="14.5" cy="12.5" r="0.3" fill="rgba(255,255,255,0.6)"/>
    <circle cx="9.5" cy="17.5" r="0.3" fill="rgba(255,255,255,0.6)"/>
    <circle cx="14.5" cy="17.5" r="0.3" fill="rgba(255,255,255,0.6)"/>
  </svg>
);

interface PrayerData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

function App() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setDarkMode(JSON.parse(savedTheme));
    }
    
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const parsedLocation = JSON.parse(savedLocation);
      setLocation(parsedLocation);
      fetchPrayerTimes(parsedLocation.latitude, parsedLocation.longitude);
    }

    // Request notification permission on app load
    setTimeout(() => {
      AudioService.requestNotificationPermission();
    }, 2000); // Wait 2 seconds before asking for permission
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const fetchPrayerTimes = async (latitude: number, longitude: number) => {
    try {
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=2`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prayer times');
      }
      
      const data = await response.json();
      setPrayerTimes(data.data.timings);
    } catch (err) {
      setError('Failed to fetch prayer times. Please try again.');
      console.error('Prayer times error:', err);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Request notification permission early
      await AudioService.requestNotificationPermission();
      
      const locationData = await LocationService.getCurrentLocation();
      setLocation(locationData);
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      await fetchPrayerTimes(locationData.latitude, locationData.longitude);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  // Auto-play azan when prayer time arrives
  useEffect(() => {
    if (prayerTimes && location) {
      const checkPrayerTime = () => {
        const prayers = [
          { name: 'Fajr', time: prayerTimes.Fajr },
          { name: 'Dhuhr', time: prayerTimes.Dhuhr },
          { name: 'Asr', time: prayerTimes.Asr },
          { name: 'Maghrib', time: prayerTimes.Maghrib },
          { name: 'Isha', time: prayerTimes.Isha },
        ];

        const now = currentTime;
        const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Check if current time matches any prayer time exactly
        prayers.forEach(prayer => {
          if (prayer.time.substring(0, 5) === currentTimeStr) {
            console.log(`Prayer time reached: ${prayer.name} at ${prayer.time}`);
            AudioService.playAzan();
            
            // Also check every 30 seconds for 2 minutes to ensure we don't miss it
            const extraChecks = [30, 60, 90, 120];
            extraChecks.forEach(seconds => {
              setTimeout(() => {
                const recheckTime = new Date();
                const recheckTimeStr = `${recheckTime.getHours().toString().padStart(2, '0')}:${recheckTime.getMinutes().toString().padStart(2, '0')}`;
                if (prayer.time.substring(0, 5) === recheckTimeStr) {
                  AudioService.playAzan();
                }
              }, seconds * 1000);
            });
          }
        });
      };
      
      checkPrayerTime();
    }
  }, [prayerTimes, currentTime]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-emerald-50 via-white to-blue-50'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-md border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-900/80 border-slate-700' 
          : 'bg-white/80 border-emerald-100'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              darkMode ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
            }`}>
              <MosqueIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                Prayer Times
              </h1>
              <p className={`text-sm ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {formatTime(currentTime)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors touch-manipulation ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <SettingsMenu 
              darkMode={darkMode}
              onLocationUpdate={(locationData) => {
                setLocation(locationData);
                localStorage.setItem('userLocation', JSON.stringify(locationData));
                fetchPrayerTimes(locationData.latitude, locationData.longitude);
              }}
              onError={setError}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 border border-red-200 text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Start Button or Prayer Times */}
        {!location ? (
          <div className="text-center">
            <div className={`inline-block p-8 rounded-2xl border ${
              darkMode 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-white/70 border-emerald-100'
            }`}>
              <div className="mb-6">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                }`}>
                  <MapPin className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className={`text-xl font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                Welcome to Prayer Times
              </h3>
              
              <p className={`mb-6 ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Allow location access to get accurate prayer times for your area
              </p>
              
              <button
                onClick={handleStart}
                disabled={loading}
                className={`px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${
                  darkMode
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg'
                }`}
              >
                {loading ? 'Getting Location...' : 'Start'}
              </button>
            </div>
          </div>
        ) : prayerTimes ? (
          <div className="space-y-6">
            {/* Date/Location and Next Prayer in same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Display */}
              <div className={`text-center p-4 md:p-6 rounded-2xl border ${
                darkMode 
                  ? 'bg-slate-800/50 border-slate-700 text-white' 
                  : 'bg-white/70 border-emerald-100 text-slate-800'
              }`}>
                <h2 className="text-lg md:text-xl font-bold mb-2">{formatDate(currentTime)}</h2>
                {location && (
                  <div className="flex items-center justify-center space-x-2 text-xs md:text-sm opacity-75">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{location.city}, {location.country}</span>
                  </div>
                )}
              </div>

              {/* Next Prayer Countdown */}
              <div className={`p-4 md:p-6 rounded-2xl border text-center ${
                darkMode 
                  ? 'bg-gradient-to-r from-emerald-800/50 to-teal-800/50 border-emerald-600/30' 
                  : 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-200'
              }`}>
                <h3 className={`text-sm md:text-lg font-semibold mb-2 ${
                  darkMode ? 'text-emerald-300' : 'text-emerald-800'
                }`}>
                  Next Prayer
                </h3>
                <div className={`text-xl md:text-2xl font-bold mb-1 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>
                  {(() => {
                    const prayers = [
                      { name: 'Fajr', time: prayerTimes.Fajr },
                      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
                      { name: 'Asr', time: prayerTimes.Asr },
                      { name: 'Maghrib', time: prayerTimes.Maghrib },
                      { name: 'Isha', time: prayerTimes.Isha },
                    ];

                    const now = currentTime;
                    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
                    
                    const prayerMinutes = prayers.map(prayer => {
                      const [hours, minutes] = prayer.time.split(':').map(Number);
                      return {
                        ...prayer,
                        minutes: hours * 60 + minutes
                      };
                    }).sort((a, b) => a.minutes - b.minutes);

                    let nextPrayer = prayerMinutes[0]; // Default to Fajr next day
                    for (let i = 0; i < prayerMinutes.length; i++) {
                      if (currentTimeMinutes < prayerMinutes[i].minutes) {
                        nextPrayer = prayerMinutes[i];
                        break;
                      }
                    }

                    const nextPrayerTime = new Date();
                    const [hours, minutes] = nextPrayer.time.split(':').map(Number);
                    nextPrayerTime.setHours(hours, minutes, 0, 0);
                    
                    if (nextPrayerTime.getHours() < now.getHours()) {
                      nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
                    }
                    
                    const timeDiff = nextPrayerTime.getTime() - now.getTime();
                    
                    if (timeDiff <= 0) return '00:00:00';
                    
                    const diffHours = Math.floor(timeDiff / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                    const diffSeconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                    
                    return `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`;
                  })()}
                </div>
                <p className={`text-xs md:text-sm ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {(() => {
                    const prayers = [
                      { name: 'Fajr', time: prayerTimes.Fajr },
                      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
                      { name: 'Asr', time: prayerTimes.Asr },
                      { name: 'Maghrib', time: prayerTimes.Maghrib },
                      { name: 'Isha', time: prayerTimes.Isha },
                    ];

                    const now = currentTime;
                    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
                    
                    const prayerMinutes = prayers.map(prayer => {
                      const [hours, minutes] = prayer.time.split(':').map(Number);
                      return {
                        ...prayer,
                        minutes: hours * 60 + minutes
                      };
                    }).sort((a, b) => a.minutes - b.minutes);

                    let nextPrayer = prayerMinutes[0];
                    for (let i = 0; i < prayerMinutes.length; i++) {
                      if (currentTimeMinutes < prayerMinutes[i].minutes) {
                        nextPrayer = prayerMinutes[i];
                        break;
                      }
                    }

                    const convertTo12Hour = (time24: string): string => {
                      const [hours, minutes] = time24.split(':').map(Number);
                      const period = hours >= 12 ? 'PM' : 'AM';
                      const hours12 = hours % 12 || 12;
                      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                    };

                    return `${nextPrayer.name} at ${convertTo12Hour(nextPrayer.time)}`;
                  })()}
                </p>
              </div>
            </div>

            <PrayerTimes 
              prayerTimes={prayerTimes} 
              currentTime={currentTime}
              darkMode={darkMode}
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className={`mt-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Loading prayer times...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;