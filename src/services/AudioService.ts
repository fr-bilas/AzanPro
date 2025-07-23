class AudioService {
  private static audio: HTMLAudioElement | null = null;
  private static allahuAkbarAudio: HTMLAudioElement | null = null;
  private static isInitialized = false;
  private static lastPlayedTime = 0;
  
  // Single reliable azan source
  private static azanUrl = '/audio/azan1.mp3';
  private static allahuAkbarUrl = '/audio/allahu-akbar.mp3';
  
  static initialize() {
    if (this.isInitialized) return;
    
    // Create audio element with better settings
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = 0.9;
    this.audio.loop = false;
    this.audio.crossOrigin = 'anonymous';
    
    // Create Allahu Akbar audio element
    this.allahuAkbarAudio = new Audio();
    this.allahuAkbarAudio.preload = 'auto';
    this.allahuAkbarAudio.volume = 1.0;
    this.allahuAkbarAudio.loop = false;
    this.allahuAkbarAudio.crossOrigin = 'anonymous';
    
    // Load azan source
    this.loadAzan();
    this.loadAllahuAkbar();
    
    this.isInitialized = true;
    console.log('AudioService initialized');
  }
  
  static loadAzan() {
    if (!this.audio) return;
    
    this.audio.src = this.azanUrl;
    
    this.audio.addEventListener('error', (e) => {
      console.warn('Azan source failed, will use notification only', e);
    }, { once: true });
    
    this.audio.addEventListener('canplaythrough', () => {
      console.log('Azan loaded successfully');
    }, { once: true });
    
    // Preload the audio
    this.audio.load();
  }
  
  static loadAllahuAkbar() {
    if (!this.allahuAkbarAudio) return;
    
    this.allahuAkbarAudio.src = this.allahuAkbarUrl;
    
    this.allahuAkbarAudio.addEventListener('error', (e) => {
      console.warn('Allahu Akbar audio failed, will use text-to-speech', e);
    }, { once: true });
    
    this.allahuAkbarAudio.addEventListener('canplaythrough', () => {
      console.log('Allahu Akbar audio loaded successfully');
    }, { once: true });
    
    // Preload the audio
    this.allahuAkbarAudio.load();
  }
  
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  static async playAllahuAkbar(): Promise<void> {
    console.log('Playing Allahu Akbar');
    
    try {
      // Initialize if not done
      if (!this.isInitialized) {
        this.initialize();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get settings
      const settings = JSON.parse(localStorage.getItem('prayerAppSettings') || '{"azanEnabled": true, "volume": 90}');
      
      if (!settings.azanEnabled) {
        console.log('Azan disabled in settings');
        return;
      }
      
      if (this.allahuAkbarAudio) {
        this.allahuAkbarAudio.currentTime = 0;
        this.allahuAkbarAudio.volume = settings.volume / 100;
        
        const playPromise = this.allahuAkbarAudio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Allahu Akbar playing successfully');
        }
      } else {
        // Fallback to text-to-speech
        this.speakAllahuAkbar();
      }
    } catch (error) {
      console.error('Failed to play Allahu Akbar:', error);
      // Fallback to text-to-speech
      this.speakAllahuAkbar();
    }
  }
  
  static speakAllahuAkbar() {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Allahu Akbar');
      utterance.lang = 'ar-SA'; // Arabic
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      speechSynthesis.speak(utterance);
      console.log('Speaking Allahu Akbar via text-to-speech');
    }
  }
  
  static async playAzan(): Promise<void> {
    // Prevent multiple plays within 1 minute
    const now = Date.now();
    if (now - this.lastPlayedTime < 60000) {
      console.log('Azan already played recently, skipping');
      return;
    }
    this.lastPlayedTime = now;
    
    console.log('PlayAzan called');
    
    // Get settings
    const settings = JSON.parse(localStorage.getItem('prayerAppSettings') || '{"azanEnabled": true, "volume": 90, "notifications": true}');
    
    // Play Allahu Akbar first
    await this.playAllahuAkbar();
    
    // Wait 2 seconds then play azan if enabled
    setTimeout(async () => {
      if (!settings.azanEnabled) {
        console.log('Azan disabled in settings, only showing notification');
        this.showAzanNotification();
        return;
      }
      
      await this.playFullAzan(settings);
    }, 2000);
  }
  
  static async playFullAzan(settings: any): Promise<void> {
    try {
      // Initialize if not done
      if (!this.isInitialized) {
        this.initialize();
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (this.audio) {
        // Reset audio to beginning
        this.audio.currentTime = 0;
        
        // Ensure volume is up
        this.audio.volume = settings.volume / 100;
        
        // Try to play audio with user gesture
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Azan playing successfully');
          
          // Show notification as well
          if (settings.notifications) {
            this.showAzanNotification();
          }
          
          // Play for 10 seconds then fade out
          setTimeout(() => {
            if (this.audio && !this.audio.paused) {
              this.fadeOutAndStop();
            }
          }, 10000);
        }
      } else {
        throw new Error('Audio not initialized');
      }
    } catch (error) {
      console.error('Failed to play azan:', error);
      // Always show notification and visual alert as fallback
      if (settings.notifications) {
        this.showAzanNotification();
      }
      this.showVisualAlert();
    }
  }
  
  static fadeOutAndStop() {
    if (!this.audio) return;
    
    const fadeInterval = setInterval(() => {
      if (this.audio && this.audio.volume > 0.1) {
        this.audio.volume -= 0.1;
      } else {
        clearInterval(fadeInterval);
        if (this.audio) {
          this.audio.pause();
          this.audio.currentTime = 0;
          // Reset volume from settings for next time
          const settings = JSON.parse(localStorage.getItem('prayerAppSettings') || '{"volume": 90}');
          this.audio.volume = settings.volume / 100;
        }
      }
    }, 200);
  }
  
  static showAzanNotification() {
    console.log('Showing azan notification');
    
    // Check if notifications are enabled
    const settings = JSON.parse(localStorage.getItem('prayerAppSettings') || '{"notifications": true}');
    if (!settings.notifications) {
      console.log('Notifications disabled in settings');
      return;
    }
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🕌 Prayer Time', {
        body: 'It\'s time for prayer (Salah)',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiMxMGI5ODEiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Im0yIDIgMjAgMjBNMiAyMiAyMiAyIi8+CjxwYXRoIGQ9Im0xMiAxLTMgOSAzIDlzNi0zIDktOWMwLTItMi00LTktNFoiLz4KPC9zdmc+Cjwvc3ZnPgo=',
        badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiMxMGI5ODEiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Im0yIDIgMjAgMjBNMiAyMiAyMiAyIi8+CjxwYXRoIGQ9Im0xMiAxLTMgOSAzIDlzNi0zIDktOWMwLTItMi00LTktNFoiLz4KPC9zdmc+Cjwvc3ZnPgo=',
        tag: 'prayer-time',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200]
      });
      
      // Auto close after 15 seconds
      setTimeout(() => notification.close(), 15000);
    }
    
    // Vibrate for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }
  
  static showVisualAlert() {
    console.log('Showing visual alert');
    
    // Remove any existing alert
    const existingAlert = document.getElementById('prayer-alert');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    // Create visual alert overlay
    const alertDiv = document.createElement('div');
    alertDiv.id = 'prayer-alert';
    alertDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(16, 185, 129, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        animation: pulse 1s infinite;
        cursor: pointer;
      ">
        <div>
          <div style="font-size: 64px; margin-bottom: 20px;">🕌</div>
          <div style="font-size: 32px; margin-bottom: 10px;">Prayer Time</div>
          <div style="font-size: 18px; margin-bottom: 10px;">It's time for Salah</div>
          <div style="font-size: 14px; opacity: 0.8;">Tap to dismiss</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remove after 12 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 12000);
    
    // Add click to dismiss
    alertDiv.addEventListener('click', () => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    });
  }
  
  static stopAzan(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
  
  // Test function to check if audio works
  // Removed test function as we removed the selector
}

// Initialize audio service when user first interacts with page
let userInteracted = false;
const initializeOnInteraction = () => {
  if (!userInteracted) {
    AudioService.initialize();
    userInteracted = true;
    console.log('Audio initialized on user interaction');
  }
};

// Multiple event listeners for better compatibility
document.addEventListener('click', initializeOnInteraction, { once: true });
document.addEventListener('touchstart', initializeOnInteraction, { once: true });
document.addEventListener('keydown', initializeOnInteraction, { once: true });

export default AudioService;