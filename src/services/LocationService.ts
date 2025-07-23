interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

class LocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      // Show loading indicator
      const loadingToast = this.showLoadingToast();

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Hide loading
            this.hideLoadingToast(loadingToast);
            
            // Get location name using reverse geocoding with faster timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 seconds
            
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                { 
                  signal: controller.signal,
                  headers: {
                    'User-Agent': 'PrayerTimesApp/1.0'
                  }
                }
              );
              
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                throw new Error('Failed to get location details');
              }
              
              const data = await response.json();
              
              const city = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.suburb ||
                          data.address?.county ||
                          data.address?.state ||
                          'Your Location';
              
              const country = data.address?.country || 'Found';
              
              resolve({
                latitude,
                longitude,
                city,
                country
              });
            } catch (geocodeError) {
              console.warn('Geocoding failed, using coordinates only:', geocodeError);
              // Fallback with just coordinates - faster response
              resolve({
                latitude,
                longitude,
                city: 'Your Location',
                country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
              });
            }
          } catch (error) {
            this.hideLoadingToast(loadingToast);
            reject(error);
          }
        },
        (error) => {
          this.hideLoadingToast(loadingToast);
          
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions and refresh the page.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your GPS/internet connection.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: false, // Faster but less accurate
          timeout: 8000, // Reduced timeout
          maximumAge: 600000 // 10 minutes cache - longer cache for faster subsequent loads
        }
      );
    });
  }
  
  static showLoadingToast(): HTMLElement {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <div style="
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        📍 Getting your location...
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(toast);
    return toast;
  }
  
  static hideLoadingToast(toast: HTMLElement) {
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }
}

export default LocationService;