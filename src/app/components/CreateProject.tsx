import React, { useState } from 'react';
import { usePokerStore } from '../store/pokerStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Copy, Check } from 'lucide-react';

export const CreateProject: React.FC = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { initializePeer, projectId } = usePokerStore();

  const handleCreate = async () => {
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      await initializePeer(username.trim(), true);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (projectId) {
      const url = `${window.location.origin}?project=${projectId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (projectId) {
    const url = `${window.location.origin}?project=${projectId}`;
    
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Project Created!</CardTitle>
          <CardDescription>Share this URL with your team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project URL</Label>
            <div className="flex gap-2">
              <Input
                value={url}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Project ID: <span className="font-mono font-semibold">{projectId}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
        <CardDescription>Start a new story point estimation session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Your Name</Label>
          <Input
            id="username"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            disabled={loading}
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={!username.trim() || loading}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </CardContent>
    </Card>
  );
};
