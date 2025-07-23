import React from 'react';
import { Clock, Sun, Sunset } from 'lucide-react';

interface PrayerData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerTimesProps {
  prayerTimes: PrayerData;
  currentTime: Date;
  darkMode: boolean;
}

const PrayerTimes: React.FC<PrayerTimesProps> = ({ prayerTimes, currentTime, darkMode }) => {
  // Get language from settings
  const settings = JSON.parse(localStorage.getItem('prayerAppSettings') || '{"language": "en"}');
  const language = settings.language || 'en';
  
  const prayerNames = {
    en: {
      Fajr: { name: 'Fajr', arabic: 'الفجر' },
      Sunrise: { name: 'Sunrise', arabic: 'الشروق' },
      Dhuhr: { name: 'Dhuhr', arabic: 'الظهر' },
      Asr: { name: 'Asr', arabic: 'العصر' },
      Sunset: { name: 'Sunset', arabic: 'الغروب' },
      Maghrib: { name: 'Maghrib', arabic: 'المغرب' },
      Isha: { name: 'Isha', arabic: 'العشাء' }
    },
    bn: {
      Fajr: { name: 'ফজর', arabic: 'الفجر' },
      Sunrise: { name: 'সূর্যোদয়', arabic: 'الشروق' },
      Dhuhr: { name: 'যোহর', arabic: 'الظهر' },
      Asr: { name: 'আসর', arabic: 'العصر' },
      Sunset: { name: 'সূর্যাস্ত', arabic: 'الغروب' },
      Maghrib: { name: 'মাগরিব', arabic: 'المغرب' },
      Isha: { name: 'এশা', arabic: 'العشاء' }
    }
  };
  
  const prayers = [
    { key: 'Fajr', name: prayerNames[language].Fajr.name, time: prayerTimes.Fajr, icon: Sun, arabic: prayerNames[language].Fajr.arabic },
    { key: 'Sunrise', name: prayerNames[language].Sunrise.name, time: prayerTimes.Sunrise, icon: Sun, arabic: prayerNames[language].Sunrise.arabic, isInfo: true },
    { key: 'Dhuhr', name: prayerNames[language].Dhuhr.name, time: prayerTimes.Dhuhr, icon: Sun, arabic: prayerNames[language].Dhuhr.arabic },
    { key: 'Asr', name: prayerNames[language].Asr.name, time: prayerTimes.Asr, icon: Sun, arabic: prayerNames[language].Asr.arabic },
    { key: 'Sunset', name: prayerNames[language].Sunset.name, time: prayerTimes.Sunset, icon: Sunset, arabic: prayerNames[language].Sunset.arabic, isInfo: true },
    { key: 'Maghrib', name: prayerNames[language].Maghrib.name, time: prayerTimes.Maghrib, icon: Sunset, arabic: prayerNames[language].Maghrib.arabic },
    { key: 'Isha', name: prayerNames[language].Isha.name, time: prayerTimes.Isha, icon: Clock, arabic: prayerNames[language].Isha.arabic },
  ];

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const getCurrentPrayer = () => {
    const now = currentTime;
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayerMinutes = prayers
      .filter(p => !p.isInfo)
      .map(prayer => {
        const time = parseTime(prayer.time);
        return {
          ...prayer,
          minutes: time.getHours() * 60 + time.getMinutes()
        };
      })
      .sort((a, b) => a.minutes - b.minutes);

    // Find current prayer
    let currentPrayer = prayerMinutes[prayerMinutes.length - 1]; // Default to Isha
    let nextPrayer = prayerMinutes[0]; // Default to Fajr next day

    for (let i = 0; i < prayerMinutes.length; i++) {
      if (currentTimeMinutes < prayerMinutes[i].minutes) {
        nextPrayer = prayerMinutes[i];
        currentPrayer = i === 0 ? prayerMinutes[prayerMinutes.length - 1] : prayerMinutes[i - 1];
        break;
      }
    }

    return { currentPrayer, nextPrayer };
  };

  const getTimeUntilNext = () => {
    const { nextPrayer } = getCurrentPrayer();
    const now = currentTime;
    const nextPrayerTime = parseTime(nextPrayer.time);
    
    // If next prayer is tomorrow (Fajr and current time is after Isha)
    if (nextPrayerTime.getHours() < now.getHours()) {
      nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
    }
    
    const timeDiff = nextPrayerTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return '00:00:00';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const { currentPrayer, nextPrayer } = getCurrentPrayer();
  const timeUntilNext = getTimeUntilNext();

  const convertTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div>
      {/* Prayer Times Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {prayers.map((prayer) => {
          const isCurrent = prayer.key === currentPrayer.key && !prayer.isInfo;
          const Icon = prayer.icon;
          
          return (
            <div
              key={prayer.key}
              className={`p-3 md:p-4 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                isCurrent
                  ? darkMode
                    ? 'bg-gradient-to-br from-red-800/50 to-pink-800/50 border-red-500/50 ring-2 ring-red-500/50'
                    : 'bg-gradient-to-br from-red-100 to-pink-100 border-red-300 ring-2 ring-red-300'
                  : prayer.isInfo
                    ? darkMode
                      ? 'bg-slate-800/30 border-slate-700/50'
                      : 'bg-slate-50 border-slate-200'
                    : darkMode
                      ? 'bg-slate-800/50 border-slate-700 hover:border-emerald-600/50'
                      : 'bg-white/70 border-emerald-100 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className={`p-1.5 md:p-2 rounded-lg ${
                  isCurrent
                    ? darkMode ? 'bg-red-600' : 'bg-red-500'
                    : prayer.isInfo
                      ? darkMode ? 'bg-slate-600' : 'bg-slate-400'
                      : darkMode ? 'bg-emerald-600' : 'bg-emerald-500'
                }`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                
                {isCurrent && (
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    darkMode ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {language === 'bn' ? 'চলমান' : 'Current'}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className={`text-sm md:text-base font-semibold mb-1 ${
                  isCurrent
                    ? darkMode ? 'text-red-300' : 'text-red-700'
                    : darkMode ? 'text-white' : 'text-slate-800'
                }`}>
                  {prayer.name}
                </h3>
                
                <p className={`text-xs md:text-sm mb-1 md:mb-2 opacity-75 ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {prayer.arabic}
                </p>
                
                <p className={`text-sm md:text-lg font-bold ${
                  isCurrent
                    ? darkMode ? 'text-red-300' : 'text-red-700'
                    : darkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  {convertTo12Hour(prayer.time)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrayerTimes;