import { ActivityEvent } from '../types';

export interface SSEClientOptions {
  missionId: string;
  lastEventId?: string;
  onEvent: (event: ActivityEvent) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function subscribeToMissionStream({
  missionId,
  lastEventId,
  onEvent,
  onComplete,
  onError
}: SSEClientOptions): () => void {
  let url = `/api/missions/${encodeURIComponent(missionId)}/stream`;
  if (lastEventId) {
    url += `?lastEventId=${encodeURIComponent(lastEventId)}`;
  }

  const eventSource = new EventSource(url);
  let isClosed = false;

  const handleMessage = (e: MessageEvent) => {
    try {
      const raw = JSON.parse(e.data);
      const data: ActivityEvent = {
        ...raw,
        id: raw.id || e.lastEventId,
        event_type: raw.event_type || raw.eventType,
        mission_id: raw.mission_id || raw.missionId,
        conversation_id: raw.conversation_id || raw.conversationId,
        created_at: raw.created_at || raw.timestamp || new Date().toISOString()
      };
      onEvent(data);

      if (data.event_type === 'mission.completed' || data.event_type === 'mission.failed') {
        if (onComplete) onComplete();
        cleanup();
      }
    } catch (err: any) {
      console.warn('[SSE Parser Error]:', err.message);
    }
  };

  // Known backend lifecycle event types
  const eventTypes = [
    'mission.started',
    'tool.discovered',
    'understanding.completed',
    'plan.created',
    'step.started',
    'tool.executing',
    'tool.completed',
    'tool.failed',
    'verification.started',
    'verification.completed',
    'mission.completed',
    'mission.failed'
  ];

  eventTypes.forEach(evtType => {
    eventSource.addEventListener(evtType, handleMessage);
  });

  // Standard fallback message listener
  eventSource.onmessage = handleMessage;

  eventSource.onerror = (err) => {
    if (isClosed) return;
    // When stream closes naturally at end of mission
    if (eventSource.readyState === EventSource.CLOSED) {
      if (onComplete) onComplete();
      cleanup();
    } else {
      if (onError) onError(new Error('SSE stream connection error'));
    }
  };

  const cleanup = () => {
    if (isClosed) return;
    isClosed = true;
    try {
      eventSource.close();
    } catch {}
  };

  return cleanup;
}
