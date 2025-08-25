// =====================================================
// ACTIVITY LEAGUE ENDPOINT - MongoDB Atlas Version
// API endpoint per ottenere la classifica degli utenti più attivi
// =====================================================

import { createMongoDBService } from '../scripts/mongodbService.js';
import dotenv from 'dotenv';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

export default async function handler(req, res) {
    // Solo GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET requests are accepted'
        });
    }

    try {
        console.log('🏆 Activity league request received');
        
        // Estrai parametri query
        const {
            limit = '50',
            period = '7', // days
            username // per ottenere la posizione di un utente specifico
        } = req.query;

        // Valida parametri
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const periodDays = Math.max(1, parseInt(period) || 7);

        // Calcola date range
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateTo.getDate() - periodDays);

        // Crea servizio MongoDB
        const mongoService = createMongoDBService();
        
        // Connetti al database
        await mongoService.connect();

        // Ottieni leaderboard
        const leaderboardData = await mongoService.getActivityLeaderboard({
            limit: limitNum,
            dateFrom,
            dateTo
        });

        let userPosition = null;
        let userStats = null;

        // Se richiesto, trova la posizione dell'utente specifico
        if (username) {
            userStats = await mongoService.getUserActivityStats(username);
            
            // Trova la posizione dell'utente nella leaderboard
            const userIndex = leaderboardData.leaderboard.findIndex(
                user => user.username.toLowerCase() === username.toLowerCase()
            );
            
            if (userIndex !== -1) {
                userPosition = userIndex + 1;
            } else if (userStats) {
                // L'utente non è nella top list, calcola posizione approssimativa
                const usersAbove = leaderboardData.leaderboard.filter(
                    user => user.total_activity_score > userStats.total_activity_score
                ).length;
                userPosition = usersAbove + 1;
            }
        }

        console.log('✅ Activity league data retrieved:', {
            total_users: leaderboardData.total_users,
            period_days: periodDays,
            user_requested: username || 'none',
            user_position: userPosition
        });

        // Disconnetti
        await mongoService.disconnect();

        // Prepara risposta
        const response = {
            success: true,
            data: {
                leaderboard: leaderboardData.leaderboard.map((user, index) => ({
                    position: index + 1,
                    username: user.username,
                    activity_score: user.total_activity_score,
                    sessions: user.total_sessions,
                    total_events: user.total_events,
                    avg_session_minutes: user.avg_session_minutes,
                    high_engagement_sessions: user.high_engagement_sessions,
                    last_activity: user.last_activity,
                    
                    // Calcola badge/livello basato sul punteggio
                    activity_level: getActivityLevel(user.total_activity_score),
                    engagement_badge: getEngagementBadge(user.high_engagement_sessions, user.total_sessions)
                })),
                
                // Statistiche generali
                stats: {
                    total_users: leaderboardData.total_users,
                    period_days: periodDays,
                    date_from: dateFrom.toISOString(),
                    date_to: dateTo.toISOString(),
                    generated_at: leaderboardData.generated_at
                },
                
                // Dati utente specifico (se richiesto)
                user_data: username ? {
                    username: username,
                    position: userPosition,
                    stats: userStats,
                    activity_level: userStats ? getActivityLevel(userStats.total_activity_score) : null,
                    engagement_badge: userStats ? getEngagementBadge(userStats.high_engagement_sessions, userStats.total_sessions) : null
                } : null
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('❌ Activity league error:', error);
        
        // Graceful degradation
        res.status(200).json({
            success: false,
            error: 'Activity league temporarily unavailable',
            message: 'Unable to load activity data at the moment',
            data: {
                leaderboard: [],
                stats: {
                    total_users: 0,
                    period_days: parseInt(req.query.period || '7'),
                    error: true
                }
            }
        });
    }
}

// Helper function to determine activity level
function getActivityLevel(score) {
    if (score >= 500) return { level: 'Mars Commander', icon: '🚀', color: '#ff6b35' };
    if (score >= 300) return { level: 'Space Captain', icon: '👨‍🚀', color: '#f7931e' };
    if (score >= 150) return { level: 'Astronaut', icon: '🧑‍🚀', color: '#ffd700' };
    if (score >= 75) return { level: 'Space Cadet', icon: '🛸', color: '#4caf50' };
    if (score >= 25) return { level: 'Rookie', icon: '🌟', color: '#2196f3' };
    return { level: 'Explorer', icon: '🔭', color: '#9e9e9e' };
}

// Helper function to determine engagement badge
function getEngagementBadge(highEngagementSessions, totalSessions) {
    if (totalSessions === 0) return null;
    
    const ratio = highEngagementSessions / totalSessions;
    
    if (ratio >= 0.8) return { badge: 'Highly Engaged', icon: '🔥', color: '#e91e63' };
    if (ratio >= 0.6) return { badge: 'Very Active', icon: '⚡', color: '#ff9800' };
    if (ratio >= 0.4) return { badge: 'Active', icon: '💪', color: '#4caf50' };
    if (ratio >= 0.2) return { badge: 'Casual', icon: '👍', color: '#2196f3' };
    return { badge: 'Beginner', icon: '🌱', color: '#9e9e9e' };
}
