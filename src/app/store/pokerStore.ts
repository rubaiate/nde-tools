import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Peer, { DataConnection } from 'peerjs';

export interface Participant {
  user: string;
  score: number | null;
  submitted: boolean;
}

interface PokerState {
  // Connection
  peer: Peer | null;
  peerId: string | null;
  isHost: boolean;
  connections: Map<string, DataConnection>;

  // Project
  projectId: string | null;
  username: string | null;

  // Participants
  participants: Participant[];
  myScore: number | null;

  // Reveal status
  revealed: boolean;
  average: number | null;

  // Actions
  initializePeer: (username: string, isHost: boolean, projectId?: string) => Promise<void>;
  connect: (projectId: string, username: string) => void;
  submitScore: (score: number) => void;
  revealScores: () => void;
  resetVoting: () => void;
  disconnect: () => void;
  updateUsername: (newUsername: string) => void;
}

export const usePokerStore = create<PokerState>()(
  persist(
    (set, get) => ({
      peer: null,
      peerId: null,
      isHost: false,
      connections: new Map(),
      projectId: null,
      username: null,
      participants: [],
      myScore: null,
      revealed: false,
      average: null,

      initializePeer: async (username: string, isHost: boolean, projectId?: string) => {
        const state = get();

        // Clean up existing peer
        if (state.peer) {
          state.peer.destroy();
        }

        // Create new peer
        console.log("Initializing peer...");

        const restoredPeerId = state.peerId;
        const idToUse = isHost && projectId ? projectId : (restoredPeerId || undefined);

        const peerOptions = {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        };

        const peer = idToUse
          ? new Peer(idToUse, peerOptions)
          : new Peer(peerOptions);

        return new Promise((resolve, reject) => {
          peer.on('open', (id) => {
            console.log("Peer opened with ID:", id);
            set({
              peer,
              peerId: id,
              isHost,
              projectId: isHost ? id : projectId,
              username,
              participants: isHost ? [{ user: username, score: null, submitted: false }] : [],
            });

            console.log("peerId", id);
            if (isHost) {
              // Host listens for incoming connections
              peer.on('connection', (conn) => {
                console.log("Host received connection from:", conn.peer);
                const connections = get().connections;
                connections.set(conn.peer, conn);
                set({ connections: new Map(connections) });

                var usr: string | undefined;
                conn.on('data', (data: any) => {
                  console.log("Host received data from", conn.peer, ":", data);
                  var user = handleIncomingMessage(data, conn);
                  if (user) {
                    usr = user;
                  }
                });

                conn.on('close', () => {
                  console.log("Connection closed:", conn.peer);
                  const connections = get().connections;
                  connections.delete(conn.peer);
                  set({ connections: new Map(connections) });

                  // Remove participant
                  if (usr) {
                    const participants = get().participants.filter(p => p.user !== usr);
                    set({ participants });
                    broadcastStatus();
                  }
                });
              });
            }

            resolve();
          });

          peer.on('disconnected', () => {
            console.log("Peer disconnected from server.");
            if (!peer.destroyed) {
              console.log("Attempting to reconnect...");
              peer.reconnect();
            }
          });

          peer.on('error', (err) => {
            console.error('Peer error:', err);
            reject(err);
          });
        });
      },

      connect: (projectId: string, username: string) => {
        const state = get();
        if (!state.peer) return;

        console.log("Connecting to project:", projectId, "as", username);
        const conn = state.peer.connect(projectId);

        conn.on('open', () => {
          console.log("Connection to host opened");
          // Send connect message
          conn.send({
            type: 'connect',
            user: username,
          });

          const connections = state.connections;
          connections.set(conn.peer, conn);
          set({ connections: new Map(connections) });

          // Listen for data
          conn.on('data', (data: any) => {
            console.log("Client received data:", data);
            handleIncomingMessage(data, conn);
          });
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
        });
      },

      submitScore: (score: number) => {
        const state = get();

        set({ myScore: score });

        if (state.isHost) {
          // Host updates their own score
          const participants = state.participants.map(p =>
            p.user === state.username ? { ...p, score, submitted: true } : p
          );
          set({ participants });
          broadcastStatus();
        } else {
          // Send to host
          state.connections.forEach(conn => {
            console.log("Sending score to host:", score);
            conn.send({
              type: 'submitSP',
              user: state.username,
              score,
            });
          });
        }
      },

      revealScores: () => {
        const state = get();
        if (!state.isHost) return;

        // Calculate average
        const scores = state.participants
          .filter(p => p.submitted && p.score !== null)
          .map(p => p.score!);

        const average = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

        set({ revealed: true, average });

        // Broadcast reveal
        console.log("Broadcasting reveal");
        state.connections.forEach(conn => {
          conn.send({
            type: 'reveal',
          });
        });

        broadcastStatus();
      },

      resetVoting: () => {
        const state = get();
        if (!state.isHost) return;

        const participants = state.participants.map(p => ({
          ...p,
          score: null,
          submitted: false,
        }));

        set({ participants, revealed: false, average: null, myScore: null });
        broadcastStatus();
      },

      disconnect: () => {
        console.log("Disconnecting...");
        const state = get();

        state.connections.forEach(conn => conn.close());
        state.peer?.destroy();

        set({
          peer: null,
          peerId: null,
          connections: new Map(),
          projectId: null,
          username: null,
          participants: [],
          myScore: null,
          revealed: false,
          average: null,
        });
      },

      updateUsername: (newUsername: string) => {
        const state = get();
        const oldUsername = state.username;

        set({ username: newUsername });

        // Update self in participants list
        const participants = state.participants.map(p =>
          p.user === oldUsername ? { ...p, user: newUsername } : p
        );
        set({ participants });

        // Notify others
        if (state.isHost) {
          broadcastStatus();
        } else {
          // Send update message to host
          state.connections.forEach(conn => {
            conn.send({
              type: 'updateUser',
              user: oldUsername,
              newUser: newUsername,
            });
          });
        }
      },
    }),
    {
      name: 'poker-storage',
      partialize: (state) => ({
        peerId: state.peerId,
        username: state.username,
        projectId: state.projectId,
        isHost: state.isHost,
        myScore: state.myScore,
      }),
    }
  )
);

// Helper functions
function handleIncomingMessage(data: any, conn: DataConnection): string | undefined {
  const state = usePokerStore.getState();

  switch (data.type) {
    case 'connect':
      if (state.isHost) {
        // Add new participant
        const participants = [...state.participants, {
          user: data.user,
          score: null,
          submitted: false,
        }];
        usePokerStore.setState({ participants });

        // Send current status to new participant
        conn.send({
          type: 'status',
          project: state.projectId,
          average: state.average,
          scores: state.revealed ? state.participants : state.participants.map(p => ({
            user: p.user,
            score: null,
            submitted: p.submitted,
          })),
          revealed: state.revealed,
        });

        // Broadcast to all
        broadcastStatus();
        return data.user;
      }
      break;

    case 'submitSP':
      if (state.isHost) {
        // Update participant score
        const participants = state.participants.map(p =>
          p.user === data.user ? { ...p, score: data.score, submitted: true } : p
        );
        usePokerStore.setState({ participants });
        broadcastStatus();
      }
      break;

    case 'updateUser':
      if (state.isHost) {
        // Find and update participant
        const participants = state.participants.map(p =>
          p.user === data.user ? { ...p, user: data.newUser } : p
        );
        usePokerStore.setState({ participants });
        broadcastStatus();
      }
      break;

    case 'status':
      // Update local state with status from host
      if (!state.isHost) {
        usePokerStore.setState({
          participants: data.scores,
          average: data.average,
          revealed: data.revealed,
        });
      }
      break;

    case 'reveal':
      if (!state.isHost) {
        usePokerStore.setState({ revealed: true });
      }
      break;
  }
}

function broadcastStatus() {
  console.log("Broadcasting status...");
  const state = usePokerStore.getState();
  if (!state.isHost) return;

  const statusMessage = {
    type: 'status',
    project: state.projectId,
    average: state.average,
    scores: state.revealed ? state.participants : state.participants.map(p => ({
      user: p.user,
      score: null,
      submitted: p.submitted,
    })),
    revealed: state.revealed,
  };

  state.connections.forEach(conn => {
    conn.send(statusMessage);
  });
}
