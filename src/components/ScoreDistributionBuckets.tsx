import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress } from '@material-ui/core';

interface User {
  username: string;
  totalPoints: number;
}

interface Bucket {
  start: number;
  end: number;
  users: User[];
  isCurrentUserBucket: boolean;
}

interface ScoreDistributionBucketsProps {
  currentUsername?: string;
}

const USERS_PER_BUCKET = 200;
const MAX_PAGES = 50; // Safety limit
const PAGE_SIZE = 200;

export const ScoreDistributionBuckets: React.FC<ScoreDistributionBucketsProps> = ({ currentUsername }) => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAllUsers = async () => {
      setLoading(true);
      setError(null);
      let allUsers: User[] = [];
      let foundUserBucket = -1;
      try {
        for (let page = 1; page <= MAX_PAGES; page++) {
          const res = await fetch(`/api/universal-proxy?api=isru-leaderboard-pages&page=${page}&limit=${PAGE_SIZE}`);
          if (!res.ok) break;
          const data = await res.json();
          if (!data.results || data.results.length === 0) break;
          allUsers = allUsers.concat(data.results.map((u: any) => ({ username: u.username, totalPoints: u.totalPoints })));
          if (data.results.length < PAGE_SIZE) break;
        }
        // Bucket users
        const buckets: Bucket[] = [];
        for (let i = 0; i < allUsers.length; i += USERS_PER_BUCKET) {
          const usersInBucket = allUsers.slice(i, i + USERS_PER_BUCKET);
          const start = i + 1;
          const end = i + usersInBucket.length;
          const isCurrentUserBucket = currentUsername
            ? usersInBucket.some(u => u.username.toLowerCase() === currentUsername.toLowerCase())
            : false;
          buckets.push({ start, end, users: usersInBucket, isCurrentUserBucket });
        }
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

  return (
    <Card elevation={0} style={{ marginBottom: 32, background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)', border: '1px solid #e6ddd4' }}>
      <CardContent>
        <Typography variant="h5" style={{ fontWeight: 600, color: '#3c3530', marginBottom: 16 }}>
          Score Distribution (by groups of 200)
        </Typography>
        {buckets.map((bucket, idx) => (
          <Box key={idx} mb={2} p={2} style={{ borderRadius: 12, background: bucket.isCurrentUserBucket ? '#e0dfca' : '#fff', border: bucket.isCurrentUserBucket ? '2px solid #8b7355' : '1px solid #e6ddd4' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" style={{ fontWeight: 500, color: bucket.isCurrentUserBucket ? '#8b7355' : '#3c3530' }}>
                Users {bucket.start} - {bucket.end}
              </Typography>
              <Chip label={`${bucket.users.length} users`} size="small" style={{ backgroundColor: '#a0916c', color: 'white', fontWeight: 600, borderRadius: 8 }} />
            </Box>
            {bucket.isCurrentUserBucket && currentUsername && (
              <Typography variant="body2" style={{ color: '#8b7355', marginTop: 8 }}>
                You are in this group!
              </Typography>
            )}
            <LinearProgress variant="determinate" value={Math.min(100, (bucket.users.length / USERS_PER_BUCKET) * 100)} style={{ height: 8, borderRadius: 8, marginTop: 8, backgroundColor: '#e6ddd4' }} />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};
