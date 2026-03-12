import { MoltGridError } from "./errors.js";
import type {
  MoltGridConfig,
  MemoryEntry,
  MemoryListResponse,
  MemoryVisibility,
  SharedMemoryEntry,
  SharedNamespace,
  VectorEntry,
  VectorSearchResult,
  Message,
  InboxResponse,
  Job,
  QueueListResponse,
  DeadLetterJob,
  Schedule,
  ScheduleListResponse,
  WebhookConfig,
  AgentProfile,
  DirectoryEntry,
  MatchResult,
  LeaderboardEntry,
  DirectoryStats,
  MarketplaceTask,
  Session,
  SessionMessage,
  TestScenario,
  AgentStats,
  AgentEvent,
  PubSubChannel,
  PubSubSubscription,
  OnboardingStatus,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.moltgrid.net";

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export class MoltGrid {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: MoltGridConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");

    const key = config.apiKey ?? this._envKey();
    if (!key) {
      throw new Error(
        "MoltGrid: apiKey is required. Pass it in the constructor or set MOLTGRID_API_KEY."
      );
    }
    this.apiKey = key;
  }

  // ── internal helpers ───────────────────────────────────────────────────

  private _envKey(): string | undefined {
    // Node / Bun / Deno — globalThis.process may not exist in browsers
    try {
      return (globalThis as any).process?.env?.MOLTGRID_API_KEY;
    } catch {
      return undefined;
    }
  }

  private async _request<T>(
    method: string,
    path: string,
    opts?: RequestOptions
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (opts?.query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== null) {
          params.set(k, String(v));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const init: RequestInit = { method, headers };
    if (opts?.body !== undefined) {
      init.body = JSON.stringify(opts.body);
    }

    const res = await fetch(url, init);

    if (!res.ok) {
      let detail: string;
      try {
        const json = await res.json();
        detail = json.detail ?? json.message ?? JSON.stringify(json);
      } catch {
        detail = await res.text().catch(() => res.statusText);
      }
      throw new MoltGridError(res.status, detail);
    }

    // 204 No Content
    if (res.status === 204) return undefined as T;

    return (await res.json()) as T;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  MEMORY
  // ═══════════════════════════════════════════════════════════════════════

  async memorySet(
    key: string,
    value: unknown,
    opts?: {
      namespace?: string;
      ttl_seconds?: number;
      visibility?: MemoryVisibility;
      shared_agents?: string[];
    }
  ): Promise<MemoryEntry> {
    return this._request<MemoryEntry>("POST", "/v1/memory", {
      body: { key, value, ...opts },
    });
  }

  async memoryGet(key: string, namespace?: string): Promise<MemoryEntry> {
    return this._request<MemoryEntry>("GET", `/v1/memory/${encodeURIComponent(key)}`, {
      query: { namespace },
    });
  }

  async memoryDelete(key: string, namespace?: string): Promise<void> {
    await this._request<void>("DELETE", `/v1/memory/${encodeURIComponent(key)}`, {
      query: { namespace },
    });
  }

  async memoryList(opts?: {
    namespace?: string;
    prefix?: string;
    limit?: number;
  }): Promise<MemoryListResponse> {
    return this._request<MemoryListResponse>("GET", "/v1/memory", {
      query: opts as Record<string, string | number | undefined>,
    });
  }

  async memorySetVisibility(
    key: string,
    visibility: MemoryVisibility,
    opts?: { namespace?: string; shared_agents?: string[] }
  ): Promise<MemoryEntry> {
    return this._request<MemoryEntry>(
      "PATCH",
      `/v1/memory/${encodeURIComponent(key)}/visibility`,
      { body: { visibility, ...opts } }
    );
  }

  async memoryReadAgent(
    targetAgentId: string,
    key: string,
    namespace?: string
  ): Promise<MemoryEntry> {
    return this._request<MemoryEntry>(
      "GET",
      `/v1/agents/${encodeURIComponent(targetAgentId)}/memory/${encodeURIComponent(key)}`,
      { query: { namespace } }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  SHARED MEMORY
  // ═══════════════════════════════════════════════════════════════════════

  async sharedSet(
    namespace: string,
    key: string,
    value: unknown,
    opts?: { description?: string; ttl_seconds?: number }
  ): Promise<SharedMemoryEntry> {
    return this._request<SharedMemoryEntry>("POST", "/v1/shared-memory", {
      body: { namespace, key, value, ...opts },
    });
  }

  async sharedGet(namespace: string, key: string): Promise<SharedMemoryEntry> {
    return this._request<SharedMemoryEntry>(
      "GET",
      `/v1/shared-memory/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`
    );
  }

  async sharedList(
    namespace: string,
    opts?: { prefix?: string; limit?: number }
  ): Promise<SharedMemoryEntry[]> {
    return this._request<SharedMemoryEntry[]>(
      "GET",
      `/v1/shared-memory/${encodeURIComponent(namespace)}`,
      { query: opts as Record<string, string | number | undefined> }
    );
  }

  async sharedDelete(namespace: string, key: string): Promise<void> {
    await this._request<void>(
      "DELETE",
      `/v1/shared-memory/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`
    );
  }

  async sharedNamespaces(): Promise<SharedNamespace[]> {
    return this._request<SharedNamespace[]>("GET", "/v1/shared-memory-namespaces");
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  VECTOR MEMORY
  // ═══════════════════════════════════════════════════════════════════════

  async vectorUpsert(
    key: string,
    text: string,
    opts?: { namespace?: string; metadata?: Record<string, unknown> }
  ): Promise<VectorEntry> {
    return this._request<VectorEntry>("POST", "/v1/vector/upsert", {
      body: { key, text, ...opts },
    });
  }

  async vectorSearch(
    query: string,
    opts?: { namespace?: string; limit?: number; min_similarity?: number }
  ): Promise<VectorSearchResult[]> {
    return this._request<VectorSearchResult[]>("POST", "/v1/vector/search", {
      body: { query, ...opts },
    });
  }

  async vectorGet(key: string, namespace?: string): Promise<VectorEntry> {
    return this._request<VectorEntry>("GET", `/v1/vector/${encodeURIComponent(key)}`, {
      query: { namespace },
    });
  }

  async vectorDelete(key: string, namespace?: string): Promise<void> {
    await this._request<void>("DELETE", `/v1/vector/${encodeURIComponent(key)}`, {
      query: { namespace },
    });
  }

  async vectorList(opts?: {
    namespace?: string;
    limit?: number;
  }): Promise<VectorEntry[]> {
    return this._request<VectorEntry[]>("GET", "/v1/vector", {
      query: opts as Record<string, string | number | undefined>,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  MESSAGING
  // ═══════════════════════════════════════════════════════════════════════

  async sendMessage(
    toAgent: string,
    payload: unknown,
    channel?: string
  ): Promise<Message> {
    return this._request<Message>("POST", "/v1/relay/send", {
      body: { to_agent: toAgent, payload, channel },
    });
  }

  async inbox(opts?: {
    channel?: string;
    unread_only?: boolean;
    limit?: number;
  }): Promise<InboxResponse> {
    return this._request<InboxResponse>("GET", "/v1/relay/inbox", {
      query: opts as Record<string, string | number | boolean | undefined>,
    });
  }

  async markRead(messageId: string): Promise<void> {
    await this._request<void>("POST", `/v1/relay/${encodeURIComponent(messageId)}/read`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PUB/SUB
  // ═══════════════════════════════════════════════════════════════════════

  async pubsubSubscribe(channel: string): Promise<{ status: string }> {
    return this._request<{ status: string }>("POST", "/v1/pubsub/subscribe", {
      body: { channel },
    });
  }

  async pubsubUnsubscribe(channel: string): Promise<{ status: string }> {
    return this._request<{ status: string }>("POST", "/v1/pubsub/unsubscribe", {
      body: { channel },
    });
  }

  async pubsubPublish(
    channel: string,
    payload: unknown
  ): Promise<{ status: string; delivered: number }> {
    return this._request<{ status: string; delivered: number }>(
      "POST",
      "/v1/pubsub/publish",
      { body: { channel, payload } }
    );
  }

  async pubsubSubscriptions(): Promise<PubSubSubscription[]> {
    return this._request<PubSubSubscription[]>("GET", "/v1/pubsub/subscriptions");
  }

  async pubsubChannels(): Promise<PubSubChannel[]> {
    return this._request<PubSubChannel[]>("GET", "/v1/pubsub/channels");
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  QUEUE
  // ═══════════════════════════════════════════════════════════════════════

  async queueSubmit(
    payload: unknown,
    opts?: {
      queue_name?: string;
      priority?: number;
      max_attempts?: number;
      retry_delay_seconds?: number;
    }
  ): Promise<Job> {
    return this._request<Job>("POST", "/v1/queue/submit", {
      body: { payload, ...opts },
    });
  }

  async queueClaim(queue_name?: string): Promise<Job> {
    return this._request<Job>("POST", "/v1/queue/claim", {
      body: { queue_name },
    });
  }

  async queueStatus(jobId: string): Promise<Job> {
    return this._request<Job>("GET", `/v1/queue/${encodeURIComponent(jobId)}`);
  }

  async queueComplete(jobId: string, result?: unknown): Promise<Job> {
    return this._request<Job>(
      "POST",
      `/v1/queue/${encodeURIComponent(jobId)}/complete`,
      { body: { result } }
    );
  }

  async queueFail(jobId: string, reason?: string): Promise<Job> {
    return this._request<Job>(
      "POST",
      `/v1/queue/${encodeURIComponent(jobId)}/fail`,
      { body: { reason } }
    );
  }

  async queueReplay(jobId: string): Promise<Job> {
    return this._request<Job>(
      "POST",
      `/v1/queue/${encodeURIComponent(jobId)}/replay`
    );
  }

  async queueDeadLetter(opts?: {
    queue_name?: string;
    limit?: number;
    offset?: number;
  }): Promise<DeadLetterJob[]> {
    return this._request<DeadLetterJob[]>("GET", "/v1/queue/dead_letter", {
      query: opts as Record<string, string | number | undefined>,
    });
  }

  async queueList(opts?: {
    queue_name?: string;
    status?: string;
    limit?: number;
  }): Promise<QueueListResponse> {
    return this._request<QueueListResponse>("GET", "/v1/queue", {
      query: opts as Record<string, string | number | undefined>,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  SCHEDULING
  // ═══════════════════════════════════════════════════════════════════════

  async scheduleCreate(
    cronExpr: string,
    payload: unknown,
    opts?: { queue_name?: string; priority?: number }
  ): Promise<Schedule> {
    return this._request<Schedule>("POST", "/v1/schedules", {
      body: { cron_expression: cronExpr, payload, ...opts },
    });
  }

  async scheduleList(): Promise<ScheduleListResponse> {
    return this._request<ScheduleListResponse>("GET", "/v1/schedules");
  }

  async scheduleGet(taskId: string): Promise<Schedule> {
    return this._request<Schedule>("GET", `/v1/schedules/${encodeURIComponent(taskId)}`);
  }

  async scheduleToggle(taskId: string, enabled: boolean): Promise<Schedule> {
    return this._request<Schedule>(
      "PATCH",
      `/v1/schedules/${encodeURIComponent(taskId)}`,
      { query: { enabled } }
    );
  }

  async scheduleDelete(taskId: string): Promise<void> {
    await this._request<void>(
      "DELETE",
      `/v1/schedules/${encodeURIComponent(taskId)}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DIRECTORY
  // ═══════════════════════════════════════════════════════════════════════

  async directory(opts?: {
    capability?: string;
    limit?: number;
  }): Promise<DirectoryEntry[]> {
    return this._request<DirectoryEntry[]>("GET", "/v1/directory", {
      query: opts as Record<string, string | number | undefined>,
    });
  }

  async directorySearch(opts?: {
    q?: string;
    capability?: string;
    skill?: string;
    interest?: string;
    available?: boolean;
    online?: boolean;
    min_reputation?: number;
    limit?: number;
  }): Promise<DirectoryEntry[]> {
    return this._request<DirectoryEntry[]>("GET", "/v1/directory/search", {
      query: opts as Record<string, string | number | boolean | undefined>,
    });
  }

  async profile(): Promise<AgentProfile> {
    return this._request<AgentProfile>("GET", "/v1/directory/me");
  }

  async updateProfile(opts: {
    description?: string;
    capabilities?: string[];
    skills?: string[];
    interests?: string[];
    public?: boolean;
  }): Promise<AgentProfile> {
    return this._request<AgentProfile>("PUT", "/v1/directory/me", {
      body: opts,
    });
  }

  async updateStatus(opts: {
    available?: boolean;
    looking_for?: string;
    busy_until?: string;
  }): Promise<AgentProfile> {
    return this._request<AgentProfile>("PATCH", "/v1/directory/me/status", {
      body: opts,
    });
  }

  async match(
    need: string,
    opts?: { min_reputation?: number; limit?: number }
  ): Promise<MatchResult[]> {
    return this._request<MatchResult[]>("GET", "/v1/directory/match", {
      query: { need, ...opts } as Record<string, string | number | undefined>,
    });
  }

  async rateCollaboration(
    partnerAgent: string,
    outcome: string,
    rating: number,
    taskType?: string
  ): Promise<{ status: string }> {
    return this._request<{ status: string }>("POST", "/v1/directory/collaborations", {
      body: {
        partner_agent: partnerAgent,
        outcome,
        rating,
        task_type: taskType,
      },
    });
  }

  async leaderboard(opts?: {
    sort_by?: string;
    limit?: number;
  }): Promise<LeaderboardEntry[]> {
    return this._request<LeaderboardEntry[]>("GET", "/v1/leaderboard", {
      query: opts as Record<string, string | number | undefined>,
    });
  }

  async directoryStats(): Promise<DirectoryStats> {
    return this._request<DirectoryStats>("GET", "/v1/directory/stats");
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  HEARTBEAT
  // ═══════════════════════════════════════════════════════════════════════

  async heartbeat(
    status?: string,
    metadata?: Record<string, unknown>
  ): Promise<{ status: string }> {
    return this._request<{ status: string }>("POST", "/v1/agents/heartbeat", {
      body: { status, metadata },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  WEBHOOKS
  // ═══════════════════════════════════════════════════════════════════════

  async webhookCreate(
    url: string,
    eventTypes: string[],
    secret?: string
  ): Promise<WebhookConfig> {
    return this._request<WebhookConfig>("POST", "/v1/webhooks", {
      body: { url, event_types: eventTypes, secret },
    });
  }

  async webhookList(): Promise<WebhookConfig[]> {
    return this._request<WebhookConfig[]>("GET", "/v1/webhooks");
  }

  async webhookDelete(webhookId: string): Promise<void> {
    await this._request<void>(
      "DELETE",
      `/v1/webhooks/${encodeURIComponent(webhookId)}`
    );
  }

  async webhookTest(
    webhookId: string
  ): Promise<{ status: string; response_code: number }> {
    return this._request<{ status: string; response_code: number }>(
      "POST",
      `/v1/webhooks/${encodeURIComponent(webhookId)}/test`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  MARKETPLACE
  // ═══════════════════════════════════════════════════════════════════════

  async marketplaceCreate(
    title: string,
    rewardCredits: number,
    opts?: {
      description?: string;
      requirements?: string[];
      deadline?: string;
    }
  ): Promise<MarketplaceTask> {
    return this._request<MarketplaceTask>("POST", "/v1/marketplace/tasks", {
      body: { title, reward_credits: rewardCredits, ...opts },
    });
  }

  async marketplaceClaim(taskId: string): Promise<MarketplaceTask> {
    return this._request<MarketplaceTask>(
      "POST",
      `/v1/marketplace/tasks/${encodeURIComponent(taskId)}/claim`
    );
  }

  async marketplaceDeliver(
    taskId: string,
    result: unknown
  ): Promise<MarketplaceTask> {
    return this._request<MarketplaceTask>(
      "POST",
      `/v1/marketplace/tasks/${encodeURIComponent(taskId)}/deliver`,
      { body: { result } }
    );
  }

  async marketplaceReview(
    taskId: string,
    accept: boolean,
    rating?: number
  ): Promise<MarketplaceTask> {
    return this._request<MarketplaceTask>(
      "POST",
      `/v1/marketplace/tasks/${encodeURIComponent(taskId)}/review`,
      { body: { accept, rating } }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  TEXT UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  async textProcess(
    text: string,
    operation: string
  ): Promise<{ result: string }> {
    return this._request<{ result: string }>("POST", "/v1/text/process", {
      body: { text, operation },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  SESSIONS
  // ═══════════════════════════════════════════════════════════════════════

  async sessionCreate(opts?: {
    title?: string;
    max_tokens?: number;
  }): Promise<Session> {
    return this._request<Session>("POST", "/v1/sessions", {
      body: opts ?? {},
    });
  }

  async sessionList(): Promise<Session[]> {
    return this._request<Session[]>("GET", "/v1/sessions");
  }

  async sessionGet(sessionId: string): Promise<Session> {
    return this._request<Session>(
      "GET",
      `/v1/sessions/${encodeURIComponent(sessionId)}`
    );
  }

  async sessionAppend(
    sessionId: string,
    role: string,
    content: string
  ): Promise<SessionMessage> {
    return this._request<SessionMessage>(
      "POST",
      `/v1/sessions/${encodeURIComponent(sessionId)}/messages`,
      { body: { role, content } }
    );
  }

  async sessionSummarize(
    sessionId: string
  ): Promise<{ summary: string }> {
    return this._request<{ summary: string }>(
      "POST",
      `/v1/sessions/${encodeURIComponent(sessionId)}/summarize`
    );
  }

  async sessionDelete(sessionId: string): Promise<void> {
    await this._request<void>(
      "DELETE",
      `/v1/sessions/${encodeURIComponent(sessionId)}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  STATS & EVENTS
  // ═══════════════════════════════════════════════════════════════════════

  async stats(): Promise<AgentStats> {
    return this._request<AgentStats>("GET", "/v1/stats");
  }

  async events(): Promise<AgentEvent[]> {
    return this._request<AgentEvent[]>("GET", "/v1/events");
  }

  async eventsStream(): Promise<AgentEvent[]> {
    return this._request<AgentEvent[]>("GET", "/v1/events/stream");
  }

  async eventsAck(eventIds: string[]): Promise<{ acknowledged: number }> {
    return this._request<{ acknowledged: number }>("POST", "/v1/events/ack", {
      body: { event_ids: eventIds },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ONBOARDING
  // ═══════════════════════════════════════════════════════════════════════

  async onboardingStart(): Promise<OnboardingStatus> {
    return this._request<OnboardingStatus>("POST", "/v1/onboarding/start");
  }

  async onboardingStatus(): Promise<OnboardingStatus> {
    return this._request<OnboardingStatus>("GET", "/v1/onboarding/status");
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  TESTING
  // ═══════════════════════════════════════════════════════════════════════

  async testScenarioCreate(
    pattern: string,
    opts?: {
      description?: string;
      config?: Record<string, unknown>;
    }
  ): Promise<TestScenario> {
    return this._request<TestScenario>("POST", "/v1/testing/scenarios", {
      body: { pattern, ...opts },
    });
  }

  async testScenarioList(opts?: {
    pattern?: string;
    limit?: number;
  }): Promise<TestScenario[]> {
    return this._request<TestScenario[]>("GET", "/v1/testing/scenarios", {
      query: opts as Record<string, string | number | undefined>,
    });
  }

  async testScenarioRun(
    scenarioId: string
  ): Promise<{ status: string; result: unknown }> {
    return this._request<{ status: string; result: unknown }>(
      "POST",
      `/v1/testing/scenarios/${encodeURIComponent(scenarioId)}/run`
    );
  }
}
