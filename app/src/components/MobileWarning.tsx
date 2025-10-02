'use client';

import { useState, useEffect } from 'react';
import NeobrutalistButton from './NeobrutalistButton';

export default function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if user has already been warned
      const hasBeenWarned = localStorage.getItem('cvrd-mobile-warning-dismissed');
      if (hasBeenWarned === 'true') {
        setIsVisible(false);
        return;
      }

      const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
      const isMobileDevice = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 480; // Only very small screens
      
      setIsVisible(isMobileDevice || isSmallScreen);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-gray-800 rounded-lg shadow-[8px_8px_0px_0px_rgb(31,41,55)] max-w-md w-full p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Mobile Not Optimized
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            This web app is designed for desktop use. For the best experience, 
            please try it on a computer or tablet with a larger screen.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            This warning won&apos;t show again after you continue.
          </p>
          <div className="flex justify-center">
            <NeobrutalistButton
              onClick={() => {
                // Save dismissal to localStorage
                localStorage.setItem('cvrd-mobile-warning-dismissed', 'true');
                setIsVisible(false);
              }}
              color="blue"
              className="px-6 py-2"
            >
              Continue Anyway
            </NeobrutalistButton>
          </div>
        </div>
      </div>
    </div>
  );
}
