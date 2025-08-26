import { useEffect } from 'react';

/**
 * Hook per gestire il layout mobile quando si apre la tastiera
 * Previene il layout shift su iOS Safari
 */
export const useViewportFix = () => {
  useEffect(() => {
    // Solo su mobile
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    let initialViewportHeight = window.innerHeight;
    let currentViewportHeight = window.innerHeight;

    const handleResize = () => {
      currentViewportHeight = window.innerHeight;
      
      // Se la viewport si è ridotta significativamente, probabilmente è aperta la tastiera
      const keyboardOpen = currentViewportHeight < initialViewportHeight * 0.75;
      
      if (keyboardOpen) {
        // Tastiera aperta: fissa il layout
        document.body.style.position = 'fixed';
        document.body.style.top = '0';
        document.body.style.left = '0';
        document.body.style.width = '100%';
        document.body.style.height = `${initialViewportHeight}px`;
        document.body.style.overflow = 'hidden';
        
        // Aggiungi classe per CSS specifici
        document.body.classList.add('keyboard-open');
        
        console.log('📱 Keyboard opened, layout fixed');
      } else {
        // Tastiera chiusa: ripristina il layout normale
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        
        // Rimuovi classe
        document.body.classList.remove('keyboard-open');
        
        console.log('📱 Keyboard closed, layout restored');
      }
    };

    const handleOrientationChange = () => {
      // Aggiorna la viewport height di riferimento dopo rotazione
      setTimeout(() => {
        initialViewportHeight = window.innerHeight;
        currentViewportHeight = window.innerHeight;
        console.log('📱 Orientation changed, viewport reset');
      }, 500);
    };

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      // Ripristina il layout se il componente viene smontato
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      document.body.classList.remove('keyboard-open');
    };
  }, []);
};
