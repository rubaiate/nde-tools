import React, { useEffect, useState } from 'react';
import { usePokerStore } from './store/pokerStore';
import { CreateProject } from './components/CreateProject';
import { JoinProject } from './components/JoinProject';
import { VotingInterface } from './components/VotingInterface';

export default function App() {
  const [urlProjectId, setUrlProjectId] = useState<string | null>(null);
  const { projectId, username } = usePokerStore();

  useEffect(() => {
    // Check URL params for project ID
    const params = new URLSearchParams(window.location.search);
    const projectIdParam = params.get('project');
    if (projectIdParam) {
      setUrlProjectId(projectIdParam);
    }
  }, []);

  // Show voting interface if user has joined/created project
  if (projectId && username) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
        <VotingInterface />
      </div>
    );
  }

  // Show join interface if URL has project ID
  if (urlProjectId) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
        <JoinProject projectId={urlProjectId} />
      </div>
    );
  }

  // Show create project interface
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <CreateProject />
    </div>
  );
}
