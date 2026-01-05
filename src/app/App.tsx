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

    // Attempt to restore session
    const tryRestoreSession = async () => {
      if (username && projectId && !usePokerStore.getState().peer) {
        // If we have a username and project ID but no peer (e.g. reload)
        // Check if we were host
        const isHost = usePokerStore.getState().isHost;

        console.log("Restoring session...", { username, projectId, isHost });

        const { initializePeer, connect } = usePokerStore.getState();

        await initializePeer(username, isHost, projectId);

        if (!isHost) {
          // If we are participant, we need to reconnect to the host
          // Wait a bit for peer to be ready
          setTimeout(() => {
            connect(projectId, username);
          }, 500);
        }
      }
    };

    tryRestoreSession();
  }, [username, projectId]);

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
