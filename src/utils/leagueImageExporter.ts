/**
 * League Image Export Utility
 * 
 * Genera immagini condivisibili della Friends League
 * con il design e branding del sito I.S.R.U League
 */

export interface LeagueExportData {
  leaderboard: Array<{
    username: string;
    score: number;
    position: number;
    profilePicture?: string;
  }>;
  timestamp: string;
  totalFriends: number;
}

export class LeagueImageExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Design constants
  private readonly WIDTH = 800;
  private readonly HEIGHT = 1200;
  private readonly COLORS = {
    background: '#0a0a0a',
    backgroundGradient: '#1a1a1a',
    backgroundAccent: '#2a1a0a',
    primary: '#ff6b35',
    secondary: 'rgba(255, 107, 53, 0.3)',
    accent: '#ff6b35',
    text: '#ffffff',
    textSecondary: '#cccccc',
    cardBg: 'rgba(255, 107, 53, 0.1)',
    cardBorder: 'rgba(255, 107, 53, 0.3)'
  };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.WIDTH;
    this.canvas.height = this.HEIGHT;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateLeagueImage(data: LeagueExportData): Promise<string> {
    // Clear canvas
    this.ctx.fillStyle = this.COLORS.background;
    this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Draw background pattern
    await this.drawBackgroundPattern();
    
    // Draw header
    await this.drawHeader();
    
    // Draw league title
    await this.drawLeagueTitle(data);
    
    // Draw leaderboard
    await this.drawLeaderboard(data.leaderboard);
    
    // Draw footer
    await this.drawFooter(data);

    // Return as data URL
    return this.canvas.toDataURL('image/png', 0.9);
  }

  private async drawBackgroundPattern(): Promise<void> {
    // Dark Mars gradient background like countdown
    const gradient = this.ctx.createLinearGradient(0, 0, this.WIDTH, this.HEIGHT);
    gradient.addColorStop(0, this.COLORS.background);
    gradient.addColorStop(0.5, this.COLORS.backgroundGradient);
    gradient.addColorStop(1, this.COLORS.backgroundAccent);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Mars-themed decorative elements with orange glow
    this.ctx.fillStyle = 'rgba(255, 107, 53, 0.1)';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * this.WIDTH;
      const y = Math.random() * this.HEIGHT;
      const size = Math.random() * 20 + 5;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Add subtle scanning lines effect
    this.ctx.strokeStyle = 'rgba(255, 107, 53, 0.1)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.HEIGHT; i += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.WIDTH, i);
      this.ctx.stroke();
    }
  }

  private async drawHeader(): Promise<void> {
    // Header background with dark theme like countdown - increased height
    const headerHeight = 140;
    
    this.ctx.fillStyle = this.COLORS.background;
    this.ctx.fillRect(0, 0, this.WIDTH, headerHeight);
    
    // Orange border at bottom like countdown
    this.ctx.fillStyle = this.COLORS.primary;
    this.ctx.fillRect(0, headerHeight - 3, this.WIDTH, 3);

    // Mars rocket emoji and title with Courier New font - more margin from top
    this.ctx.fillStyle = this.COLORS.primary;
    this.ctx.font = 'bold 48px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(255, 107, 53, 0.5)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('🚀 I.S.R.U LEAGUE 🚀', this.WIDTH / 2, 65);

    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;

    this.ctx.font = 'bold 20px "Courier New", monospace';
    this.ctx.fillStyle = this.COLORS.textSecondary;
    this.ctx.fillText('FRIENDS COMPETITION LEADERBOARD', this.WIDTH / 2, 100);
  }

  private async drawLeagueTitle(data: LeagueExportData): Promise<void> {
    const y = 200; // Spostato più in basso per dare spazio all'header
    
    // Card background for title with dark theme
    this.drawCard(50, y - 30, this.WIDTH - 100, 80);
    
    this.ctx.fillStyle = this.COLORS.primary;
    this.ctx.font = 'bold 32px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(255, 107, 53, 0.5)';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText('🏆 FRIENDS LEAGUE', this.WIDTH / 2, y + 10);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    
    this.ctx.font = '18px "Courier New", monospace';
    this.ctx.fillStyle = this.COLORS.textSecondary;
    this.ctx.fillText(`${data.totalFriends} FRIENDS COMPETING`, this.WIDTH / 2, y + 35);
  }

  private async drawLeaderboard(leaderboard: LeagueExportData['leaderboard']): Promise<void> {
    const startY = 320; // Spostato più in basso per dare spazio al titolo
    const itemHeight = 80;
    const maxItems = Math.min(leaderboard.length, 10); // Show max 10

    for (let i = 0; i < maxItems; i++) {
      const friend = leaderboard[i];
      const y = startY + (i * itemHeight);
      
      await this.drawLeaderboardItem(friend, y, i);
    }

    // "And X more..." if there are more friends
    if (leaderboard.length > maxItems) {
      const y = startY + (maxItems * itemHeight);
      this.ctx.fillStyle = this.COLORS.text;
      this.ctx.font = 'italic 16px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`... and ${leaderboard.length - maxItems} more friends`, this.WIDTH / 2, y + 20);
    }
  }

  private async drawLeaderboardItem(friend: any, y: number, index: number): Promise<void> {
    const cardX = 50;
    const cardWidth = this.WIDTH - 100;
    const cardHeight = 70;
    
    // Card background with dark theme and subtle color hints for top 3
    let bgColor = this.COLORS.cardBg;
    if (index === 0) bgColor = 'rgba(255, 215, 0, 0.15)'; // Gold tint with transparency
    else if (index === 1) bgColor = 'rgba(192, 192, 192, 0.15)'; // Silver tint with transparency  
    else if (index === 2) bgColor = 'rgba(205, 127, 50, 0.15)'; // Bronze tint with transparency
    
    this.drawCard(cardX, y, cardWidth, cardHeight, bgColor);

    // Position badge
    const badgeColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : this.COLORS.primary;
    this.drawPositionBadge(cardX + 25, y + cardHeight/2, friend.position, badgeColor);

    // Username with Courier New - better positioning and padding
    this.ctx.fillStyle = this.COLORS.text;
    this.ctx.font = 'bold 20px "Courier New", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(friend.username, cardX + 85, y + 35);

    // Score with Courier New - better positioning and padding
    this.ctx.fillStyle = this.COLORS.primary;
    this.ctx.font = 'bold 24px "Courier New", monospace';
    this.ctx.textAlign = 'right';
    this.ctx.shadowColor = 'rgba(255, 107, 53, 0.3)';
    this.ctx.shadowBlur = 3;
    this.ctx.fillText(`${friend.score} PTS`, cardX + cardWidth - 25, y + 40);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;

    // Crown for winner - adjusted position
    if (index === 0) {
      this.ctx.font = '24px "Courier New", monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('👑', cardX + 85 + this.ctx.measureText(friend.username).width + 10, y + 35);
    }
  }

  private drawPositionBadge(x: number, y: number, position: number, color: string): void {
    // Circle background
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 25, 0, Math.PI * 2);
    this.ctx.fill();

    // Position number with Courier New
    this.ctx.fillStyle = position <= 3 ? '#ffffff' : this.COLORS.text;
    this.ctx.font = 'bold 18px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(position.toString(), x, y + 6);
  }

  private drawCard(x: number, y: number, width: number, height: number, bgColor = this.COLORS.cardBg): void {
    // Dark card background like countdown elements
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(x, y, width, height);
    
    // Orange border like countdown
    this.ctx.strokeStyle = this.COLORS.cardBorder;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    
    // Subtle inner glow effect
    this.ctx.strokeStyle = 'rgba(255, 107, 53, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
  }

  private async drawFooter(data: LeagueExportData): Promise<void> {
    const footerY = this.HEIGHT - 100;
    
    // Footer background with dark theme
    this.ctx.fillStyle = this.COLORS.background;
    this.ctx.fillRect(0, footerY, this.WIDTH, 100);
    
    // Orange top border
    this.ctx.fillStyle = this.COLORS.primary;
    this.ctx.fillRect(0, footerY, this.WIDTH, 2);

    // Timestamp and branding with Courier New
    this.ctx.fillStyle = this.COLORS.textSecondary;
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`GENERATED ON ${new Date(data.timestamp).toLocaleDateString()}`, this.WIDTH / 2, footerY + 25);
    
    this.ctx.fillStyle = this.COLORS.primary;
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillText('📱 I.S.R.U LEAGUE APP • ISRUCAMP.COM', this.WIDTH / 2, footerY + 50);
    
    // Mars mission tagline
    this.ctx.fillStyle = this.COLORS.primary;
    this.ctx.font = '12px "Courier New", monospace';
    this.ctx.fillText('🚀 PREPARING FOR MARS, ONE STEP AT A TIME', this.WIDTH / 2, footerY + 75);
  }

  downloadImage(dataUrl: string, filename = 'isru-league-leaderboard.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async shareImage(dataUrl: string): Promise<void> {
    if (navigator.share && navigator.canShare) {
      try {
        // Convert dataURL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'isru-league-leaderboard.png', { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'I.S.R.U League - Friends Leaderboard',
            text: 'Check out our I.S.R.U League competition! 🚀',
            files: [file]
          });
        }
      } catch (error) {
        console.log('Sharing failed:', error);
        // Fallback to download
        this.downloadImage(dataUrl);
      }
    } else {
      // Fallback to download
      this.downloadImage(dataUrl);
    }
  }
}
