import React from 'react';
import { usePokerStore } from '../store/pokerStore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Eye, RefreshCw, LogOut, Copy, Check } from 'lucide-react';

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

      {/* Poker Table Area */}
      <div className="relative w-full h-[500px] bg-muted/30 rounded-xl border border-border shadow-inner overflow-hidden flex items-center justify-center mb-8">

        {/* The Table */}
        <div className="relative w-[300px] h-[150px] md:w-[450px] md:h-[220px] bg-emerald-700 rounded-[100px] border-8 border-amber-900 shadow-2xl flex flex-col items-center justify-center text-white z-10">
          {/* Table Content */}
          <div className="text-center">
            {revealed && average !== null ? (
              <div className="flex flex-col items-center animate-in zoom-in spin-in-3">
                <span className="text-sm font-medium opacity-90 uppercase tracking-wider">Average</span>
                <span className="text-5xl font-bold">{average.toFixed(1)}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <span className="text-emerald-100 font-medium tracking-widest text-sm uppercase">Scrum Poker</span>
                <div className="w-12 h-1 bg-emerald-500/50 rounded-full" />
                {votedCount === participants.length && participants.length > 0 ? (
                  <span className="text-xs bg-emerald-900/50 px-2 py-1 rounded text-emerald-200">Everyone Voted</span>
                ) : (
                  <span className="text-xs text-emerald-300/80">Waiting for votes...</span>
                )}
              </div>
            )}
          </div>

          {/* Host Controls on Table */}
          {isHost && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {!revealed ? (
                <Button
                  onClick={revealScores}
                  disabled={!allVoted && participants.length > 0}
                  size="sm"
                  variant="secondary"
                  className="shadow-lg bg-emerald-900/50 hover:bg-emerald-900/80 text-emerald-50 border border-emerald-500/30"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Reveal
                </Button>
              ) : (
                <Button
                  onClick={resetVoting}
                  size="sm"
                  variant="secondary"
                  className="shadow-lg bg-emerald-900/50 hover:bg-emerald-900/80 text-emerald-50 border border-emerald-500/30"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Round
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Participants positioned around */}
        {participants.map((participant, index) => {
          // Calculate position
          // Start from -PI/2 (top)
          const angleStep = (2 * Math.PI) / (participants.length || 1);
          const angle = -Math.PI / 2 + index * angleStep;

          // Radii for the ellipse (table size + offset)
          // Table is approx 450x220, so radius X ~ 225+60, Y ~ 110+60
          // Adjust based on container size mainly
          const radiusX = 240; // Horizontal spread
          const radiusY = 160; // Vertical spread

          // If purely responsive, percentages are safer but harder to center perfectly with arbitrary size
          // Let's use CSS translate to center the item itself
          const leftStr = `calc(50% + ${Math.cos(angle) * radiusX}px)`;
          const topStr = `calc(50% + ${Math.sin(angle) * radiusY}px)`;

          return (
            <div
              key={participant.user}
              className="absolute flex flex-col items-center gap-2 w-24 z-20 transition-all duration-500 ease-in-out"
              style={{
                left: leftStr,
                top: topStr,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Card component */}
              <div className={`
                relative w-12 h-16 rounded-lg border-2 shadow-md flex items-center justify-center transition-all bg-card
                ${revealed && participant.score !== null ? 'border-primary bg-primary text-primary-foreground scale-110' : ''}
                ${!revealed && participant.submitted ? 'border-blue-500 bg-blue-50 -translate-y-2' : 'border-border bg-muted'}
              `}>
                {revealed && participant.score !== null ? (
                  <span className="text-xl font-bold">{participant.score}</span>
                ) : participant.submitted ? (
                  <div className="w-full h-full bg-blue-500/10 rounded-md backface-hidden" />
                ) : (
                  <span className="text-xs text-muted-foreground/50">?</span>
                )}
              </div>

              {/* Name Label */}
              <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-border/50 text-xs font-medium text-center truncate max-w-full">
                {participant.user}
              </div>
            </div>
          );
        })}
      </div>



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


    </div>
  );
};
