// =====================================================
// ACTIVITY TRACKING ENDPOINT - MongoDB Atlas Version
// API endpoint per salvare activity tracking in MongoDB Atlas
// Completamente asincrono e non bloccante
// =====================================================

import { createMongoDBService } from '../scripts/mongodbService.js';
import dotenv from 'dotenv';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

export default async function handler(req, res) {
    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are accepted'
        });
    }

    try {
        console.log('🎯 Activity tracking request received');
        
        // Valida i dati ricevuti
        const activityData = req.body;
        
        if (!activityData || typeof activityData !== 'object') {
            return res.status(400).json({
                error: 'Invalid data',
                message: 'Activity data is required'
            });
        }

        // Crea servizio MongoDB
        const mongoService = createMongoDBService();
        
        // Connetti al database
        await mongoService.connect();

        // Prepara i dati per MongoDB
        const serverTimestamp = new Date();
        const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const mongoActivityData = {
            activity_id: activityId,
            session_id: activityData.session_id,
            username: activityData.username || null,
            user_agent: activityData.user_agent,
            client_ip: getClientIP(req),
            timestamp: new Date(activityData.timestamp),
            server_timestamp: serverTimestamp,
            
            // Activity metrics
            events: activityData.events || [],
            session_duration: activityData.session_duration || 0,
            page_views: activityData.page_views || [],
            total_clicks: activityData.total_clicks || 0,
            total_scrolls: activityData.total_scrolls || 0,
            total_mousemoves: activityData.total_mousemoves || 0,
            
            // Calculated metrics
            activity_score: calculateActivityScore(activityData),
            engagement_level: calculateEngagementLevel(activityData),
            
            // Indexing fields
            created_at: serverTimestamp,
            date_key: serverTimestamp.toISOString().split('T')[0],
            username_lower: activityData.username?.toLowerCase() || null,
            
            // Metadata
            metadata: {
                source: 'isru-metrics-app',
                version: '2.0',
                endpoint: 'activity-tracking'
            }
        };

        // Salva nel database
        const result = await mongoService.saveActivity(mongoActivityData);
        
        console.log('✅ Activity data saved to MongoDB:', {
            activity_id: activityId,
            username: activityData.username,
            events_count: activityData.events?.length || 0,
            activity_score: mongoActivityData.activity_score
        });

        // Disconnetti
        await mongoService.disconnect();

        // Risposta di successo
        res.status(200).json({
            success: true,
            activity_id: activityId,
            activity_score: mongoActivityData.activity_score,
            engagement_level: mongoActivityData.engagement_level,
            processed_at: serverTimestamp.toISOString()
        });

    } catch (error) {
        console.error('❌ Activity tracking error:', error);
        
        // Graceful degradation - non bloccare l'utente
        res.status(200).json({
            success: false,
            message: 'Activity tracking temporarily unavailable',
            error: 'Service degraded but user experience not affected'
        });
    }
}

// Helper function to get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           'unknown';
}

// Calculate activity score based on user interactions
function calculateActivityScore(data) {
    const events = data.events || [];
    const sessionDuration = data.session_duration || 0;
    const pageViews = data.page_views || [];
    
    let score = 0;
    
    // Base score for session duration (1 point per minute)
    score += Math.floor(sessionDuration / 60000);
    
    // Points for different event types
    events.forEach(event => {
        switch (event.type) {
            case 'click':
                score += 2; // Clicks are valuable
                break;
            case 'feature_use':
                score += 5; // Feature usage is very valuable
                break;
            case 'page_view':
                score += 3; // Page views show engagement
                break;
            case 'scroll':
                score += 1; // Scrolling shows reading
                break;
            case 'tab_change':
                score += 2; // Tab changes show exploration
                break;
            case 'mousemove':
                score += 0.1; // Mouse movement shows attention
                break;
        }
    });
    
    // Bonus for multiple page views
    score += pageViews.length * 2;
    
    // Bonus for sustained engagement (longer sessions)
    if (sessionDuration > 300000) { // 5+ minutes
        score += 10;
    }
    if (sessionDuration > 600000) { // 10+ minutes
        score += 20;
    }
    
    return Math.round(score);
}

// Calculate engagement level
function calculateEngagementLevel(data) {
    const score = calculateActivityScore(data);
    const sessionDuration = data.session_duration || 0;
    const events = data.events || [];
    
    if (score >= 50 && sessionDuration > 600000) return 'very_high';
    if (score >= 30 && sessionDuration > 300000) return 'high';
    if (score >= 15 && events.length > 10) return 'medium';
    if (score >= 5) return 'low';
    return 'minimal';
}
