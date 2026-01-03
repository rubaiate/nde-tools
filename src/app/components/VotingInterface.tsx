import React from 'react';
import { usePokerStore } from '../store/pokerStore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Eye, EyeOff, RefreshCw, LogOut, Copy, Check } from 'lucide-react';

const FIBONACCI_VALUES = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

export const VotingInterface: React.FC = () => {
  const {
    username,
    isHost,
    participants,
    myScore,
    revealed,
    average,
    submitScore,
    revealScores,
    resetVoting,
    disconnect,
    projectId,
  } = usePokerStore();

  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    if (projectId) {
      const url = `${window.location.origin}?project=${projectId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const allVoted = participants.length > 0 && participants.every(p => p.submitted);
  const votedCount = participants.filter(p => p.submitted).length;

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>NDE Story Points</CardTitle>
              <CardDescription>
                Logged in as: <span className="font-semibold">{username}</span>
                {isHost && <Badge className="ml-2" variant="secondary">Host</Badge>}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t text-muted-foreground w-full">
                <span className="text-xs font-medium whitespace-nowrap">Invite Project Link:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded select-all flex-1 text-center truncate pointer-events-auto">
                  {window.location.origin}?project={projectId}
                </code>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={copyToClipboard}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={disconnect}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants ({participants.length})
          </CardTitle>
          <CardDescription>
            {votedCount} of {participants.length} voted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {participants.map((participant) => (
              <div
                key={participant.user}
                className="p-4 border rounded-lg flex flex-col items-center justify-center gap-2 bg-card"
              >
                <span className="font-medium text-sm truncate max-w-full">
                  {participant.user}
                </span>
                <div className="flex items-center gap-2">
                  {revealed && participant.score !== null ? (
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {participant.score}
                    </Badge>
                  ) : participant.submitted ? (
                    <Badge variant="secondary">
                      <Eye className="h-3 w-3 mr-1" />
                      Voted
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results - Only show when revealed */}
      {revealed && average !== null && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Average Story Points</p>
              <p className="text-6xl font-bold text-primary">{average.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Cards */}
      {!revealed && (
        <Card>
          <CardHeader>
            <CardTitle>Select Your Estimate</CardTitle>
            <CardDescription>Choose a story point value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
              {FIBONACCI_VALUES.map((value) => (
                <Button
                  key={value}
                  variant={myScore === value ? 'default' : 'outline'}
                  className="h-20 text-2xl font-bold"
                  onClick={() => submitScore(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
            {myScore !== null && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Your vote: <span className="font-semibold">{myScore}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Host Controls */}
      {isHost && (
        <Card>
          <CardHeader>
            <CardTitle>Host Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            {!revealed ? (
              <Button
                onClick={revealScores}
                disabled={!allVoted}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Reveal Scores
              </Button>
            ) : (
              <Button
                onClick={resetVoting}
                variant="secondary"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                New Round
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
