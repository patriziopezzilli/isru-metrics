import html2canvas from 'html2canvas';

class ProfileExportService {
  /**
   * Genera un'immagine PNG dal profilo utente
   */
  static async exportProfileAsImage(
    elementId: string, 
    username: string,
    format: 'png' | 'jpeg' = 'png'
  ): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Configurazione per una qualità ottimale
      const canvas = await html2canvas(element, {
        backgroundColor: '#fefdfb',
        scale: 2, // Alta risoluzione
        useCORS: true,
        allowTaint: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false, // Disabilita i log in produzione
        onclone: (clonedDoc) => {
          // Ottimizza il DOM clonato per l'export
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            // Assicura che tutti gli stili siano applicati correttamente
            clonedElement.style.transform = 'none';
            clonedElement.style.webkitTransform = 'none';
          }
        }
      });

      // Converte canvas in blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, `image/${format}`, 0.95);
      });

      // Crea nome file con timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `isru-profile-${username}-${timestamp}.${format}`;

      // Download del file
      this.downloadBlob(blob, filename);

      console.log(`✅ Profile exported successfully: ${filename}`);
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }

  /**
   * Crea un link temporaneo per il download
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Pulisce l'URL dopo un breve delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Condivide il profilo usando Web Share API (se supportata)
   */
  static async shareProfile(
    elementId: string, 
    username: string,
    title?: string
  ): Promise<void> {
    try {
      // Controlla se Web Share API è supportata
      if (!navigator.share) {
        // Fallback: export come immagine
        await this.exportProfileAsImage(elementId, username);
        return;
      }

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Genera l'immagine
      const canvas = await html2canvas(element, {
        backgroundColor: '#fefdfb',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false
      });

      // Converte in blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 0.95);
      });

      // Crea File object per la condivisione
      const file = new File([blob], `isru-profile-${username}.png`, {
        type: 'image/png'
      });

      // Condivide usando Web Share API
      await navigator.share({
        title: title || `${username}'s I.S.R.U League Profile`,
        text: `Check out ${username}'s profile in I.S.R.U League!`,
        files: [file]
      });

      console.log('✅ Profile shared successfully');
    } catch (error) {
      console.error('❌ Share failed:', error);
      // Fallback: export come immagine
      await this.exportProfileAsImage(elementId, username);
    }
  }

  /**
   * Copia l'immagine negli appunti (se supportato)
   */
  static async copyProfileToClipboard(elementId: string): Promise<void> {
    try {
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not supported');
      }

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Genera l'immagine
      const canvas = await html2canvas(element, {
        backgroundColor: '#fefdfb',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false
      });

      // Converte in blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 0.95);
      });

      // Copia negli appunti
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);

      console.log('✅ Profile copied to clipboard');
    } catch (error) {
      console.error('❌ Copy to clipboard failed:', error);
      throw error;
    }
  }

  /**
   * Ottimizza l'elemento per l'export (rimuove effetti che potrebbero causare problemi)
   */
  static prepareElementForExport(elementId: string): () => void {
    const element = document.getElementById(elementId);
    if (!element) return () => {};

    // Salva gli stili originali
    const originalStyles = {
      transform: element.style.transform,
      webkitTransform: element.style.webkitTransform,
      transition: element.style.transition,
      animation: element.style.animation
    };

    // Applica stili ottimizzati per l'export
    element.style.transform = 'none';
    element.style.webkitTransform = 'none';
    element.style.transition = 'none';
    element.style.animation = 'none';

    // Ritorna funzione per ripristinare gli stili
    return () => {
      element.style.transform = originalStyles.transform;
      element.style.webkitTransform = originalStyles.webkitTransform;
      element.style.transition = originalStyles.transition;
      element.style.animation = originalStyles.animation;
    };
  }
}

export default ProfileExportService;
