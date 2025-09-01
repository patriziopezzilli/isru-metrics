import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress, IconButton, Collapse } from '@material-ui/core';
import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons';

interface User {
  username: string;
  totalPoints: number;
}

interface Bucket {
  minScore: number;
  maxScore: number;
  users: User[];
  isCurrentUserBucket: boolean;
}

interface ScoreDistributionBucketsProps {
  currentUsername?: string;
}

const SCORE_RANGE = 70; // Points per bucket
const MAX_USERS = 2000; // Only show first 2000 users
const MAX_PAGES = 10; // Safety limit
const PAGE_SIZE = 200;

export const ScoreDistributionBuckets: React.FC<ScoreDistributionBucketsProps> = ({ currentUsername }) => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAllUsers = async () => {
      setLoading(true);
      setError(null);
      let allUsers: User[] = [];
      try {
        // Fetch the score distribution data
        const response = await fetch(`/api/universal-proxy?api=isru-leaderboard`);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        if (!data.scoreDistribution || !Array.isArray(data.scoreDistribution)) {
          throw new Error('Invalid API response structure');
        }
        
        // Extract all users from the score distribution
        data.scoreDistribution.forEach((scoreItem: any) => {
          if (scoreItem.users && Array.isArray(scoreItem.users)) {
            scoreItem.users.forEach((user: any) => {
              allUsers.push({
                username: user.username,
                totalPoints: scoreItem.score
              });
            });
          }
        });
        
        // Limit to first 2000 users (they should already be sorted by score desc)
        allUsers = allUsers.slice(0, MAX_USERS);
        
        console.log('Total users extracted:', allUsers.length);
        console.log('Sample users:', allUsers.slice(0, 5));
        
        // Group users by score ranges (buckets of 70 points)
        const scoreMap = new Map<number, User[]>();
        
        allUsers.forEach(user => {
          const bucketKey = Math.floor(user.totalPoints / SCORE_RANGE) * SCORE_RANGE;
          if (!scoreMap.has(bucketKey)) {
            scoreMap.set(bucketKey, []);
          }
          scoreMap.get(bucketKey)!.push(user);
        });
        
        console.log('Score buckets created:', scoreMap.size);
        console.log('Bucket keys:', Array.from(scoreMap.keys()).sort((a, b) => b - a));
        
        // Create buckets from highest to lowest score
        const buckets: Bucket[] = [];
        const sortedKeys = Array.from(scoreMap.keys()).sort((a, b) => b - a);
        
        sortedKeys.forEach(bucketKey => {
          const users = scoreMap.get(bucketKey)!;
          const minScore = bucketKey;
          const maxScore = bucketKey + SCORE_RANGE - 1;
          const isCurrentUserBucket = currentUsername
            ? users.some(u => u.username.toLowerCase() === currentUsername.toLowerCase())
            : false;
          buckets.push({ minScore, maxScore, users, isCurrentUserBucket });
        });
        
        console.log('Final buckets created:', buckets.length);
        console.log('Buckets:', buckets);
        
        if (isMounted) setBuckets(buckets);
      } catch (err) {
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAllUsers();
    return () => { isMounted = false; };
  }, [currentUsername]);

  if (loading) return <Box p={3}><Typography>Loading score distribution...</Typography></Box>;
  if (error) return <Box p={3}><Typography color="error">{error}</Typography></Box>;
  if (buckets.length === 0) return <Box p={3}><Typography>No score distribution data available</Typography></Box>;

  return (
    <Card elevation={0} style={{ marginBottom: 32, background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)', border: '2px solid #ff7043', position: 'relative' }}>
      {/* Badge NEW */}
      <Box 
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          backgroundColor: '#ff7043',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          boxShadow: '0 2px 4px rgba(255, 112, 67, 0.3)',
          zIndex: 1
        }}
      >
        NEW
      </Box>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
          <Typography variant="h5" style={{ fontWeight: 600, color: '#3c3530', marginBottom: 0 }}>
            Score Distribution
          </Typography>
          <IconButton 
            size="small"
            style={{ 
              color: '#8b7355',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        <Collapse in={expanded}>
          <Box style={{ marginTop: 16 }}>
        {buckets.map((bucket, idx) => (
          <Box key={idx} mb={2} p={2} style={{ borderRadius: 12, background: bucket.isCurrentUserBucket ? '#e0dfca' : '#fff', border: bucket.isCurrentUserBucket ? '2px solid #8b7355' : '1px solid #e6ddd4' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" style={{ fontWeight: 500, color: bucket.isCurrentUserBucket ? '#8b7355' : '#3c3530' }}>
                {bucket.minScore} - {bucket.maxScore} points
              </Typography>
              <Chip label={`${bucket.users.length} users`} size="small" style={{ backgroundColor: '#a0916c', color: 'white', fontWeight: 600, borderRadius: 8 }} />
            </Box>
            {bucket.isCurrentUserBucket && currentUsername && (
              <Typography variant="body2" style={{ color: '#8b7355', marginTop: 8 }}>
                You are in this group!
              </Typography>
            )}
            <LinearProgress variant="determinate" value={Math.min(100, (bucket.users.length / 50) * 100)} style={{ height: 8, borderRadius: 8, marginTop: 8, backgroundColor: '#e6ddd4' }} />
          </Box>
        ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
