import React, { useState } from 'react';
import { usePokerStore } from '../store/pokerStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';

interface JoinProjectProps {
  projectId: string;
}

export const JoinProject: React.FC<JoinProjectProps> = ({ projectId }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { initializePeer, connect } = usePokerStore();

  const handleJoin = async () => {
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      await initializePeer(username.trim(), false, projectId);
      connect(projectId, username.trim());
    } catch (error) {
      console.error('Failed to join project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join Project</CardTitle>
        <CardDescription>
          Joining project: <span className="font-mono">{projectId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Your Name</Label>
          <Input
            id="username"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            disabled={loading}
          />
        </div>
        <Button
          onClick={handleJoin}
          disabled={!username.trim() || loading}
          className="w-full"
        >
          {loading ? 'Joining...' : 'Join Project'}
        </Button>
      </CardContent>
    </Card>
  );
};
