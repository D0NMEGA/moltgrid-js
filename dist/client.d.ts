import type { MoltGridConfig, MemoryEntry, MemoryListResponse, MemoryVisibility, SharedMemoryEntry, SharedNamespace, VectorEntry, VectorSearchResult, Message, InboxResponse, Job, QueueListResponse, DeadLetterJob, Schedule, ScheduleListResponse, WebhookConfig, AgentProfile, DirectoryEntry, MatchResult, LeaderboardEntry, DirectoryStats, MarketplaceTask, Session, SessionMessage, TestScenario, AgentStats, AgentEvent, PubSubChannel, PubSubSubscription, OnboardingStatus } from "./types.js";
export declare class MoltGrid {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(config?: MoltGridConfig);
    private _envKey;
    private _request;
    memorySet(key: string, value: unknown, opts?: {
        namespace?: string;
        ttl_seconds?: number;
        visibility?: MemoryVisibility;
        shared_agents?: string[];
    }): Promise<MemoryEntry>;
    memoryGet(key: string, namespace?: string): Promise<MemoryEntry>;
    memoryDelete(key: string, namespace?: string): Promise<void>;
    memoryList(opts?: {
        namespace?: string;
        prefix?: string;
        limit?: number;
    }): Promise<MemoryListResponse>;
    memorySetVisibility(key: string, visibility: MemoryVisibility, opts?: {
        namespace?: string;
        shared_agents?: string[];
    }): Promise<MemoryEntry>;
    memoryReadAgent(targetAgentId: string, key: string, namespace?: string): Promise<MemoryEntry>;
    sharedSet(namespace: string, key: string, value: unknown, opts?: {
        description?: string;
        ttl_seconds?: number;
    }): Promise<SharedMemoryEntry>;
    sharedGet(namespace: string, key: string): Promise<SharedMemoryEntry>;
    sharedList(namespace: string, opts?: {
        prefix?: string;
        limit?: number;
    }): Promise<SharedMemoryEntry[]>;
    sharedDelete(namespace: string, key: string): Promise<void>;
    sharedNamespaces(): Promise<SharedNamespace[]>;
    vectorUpsert(key: string, text: string, opts?: {
        namespace?: string;
        metadata?: Record<string, unknown>;
    }): Promise<VectorEntry>;
    vectorSearch(query: string, opts?: {
        namespace?: string;
        limit?: number;
        min_similarity?: number;
    }): Promise<VectorSearchResult[]>;
    vectorGet(key: string, namespace?: string): Promise<VectorEntry>;
    vectorDelete(key: string, namespace?: string): Promise<void>;
    vectorList(opts?: {
        namespace?: string;
        limit?: number;
    }): Promise<VectorEntry[]>;
    sendMessage(toAgent: string, payload: unknown, channel?: string): Promise<Message>;
    inbox(opts?: {
        channel?: string;
        unread_only?: boolean;
        limit?: number;
    }): Promise<InboxResponse>;
    markRead(messageId: string): Promise<void>;
    pubsubSubscribe(channel: string): Promise<{
        status: string;
    }>;
    pubsubUnsubscribe(channel: string): Promise<{
        status: string;
    }>;
    pubsubPublish(channel: string, payload: unknown): Promise<{
        status: string;
        delivered: number;
    }>;
    pubsubSubscriptions(): Promise<PubSubSubscription[]>;
    pubsubChannels(): Promise<PubSubChannel[]>;
    queueSubmit(payload: unknown, opts?: {
        queue_name?: string;
        priority?: number;
        max_attempts?: number;
        retry_delay_seconds?: number;
    }): Promise<Job>;
    queueClaim(queue_name?: string): Promise<Job>;
    queueStatus(jobId: string): Promise<Job>;
    queueComplete(jobId: string, result?: unknown): Promise<Job>;
    queueFail(jobId: string, reason?: string): Promise<Job>;
    queueReplay(jobId: string): Promise<Job>;
    queueDeadLetter(opts?: {
        queue_name?: string;
        limit?: number;
        offset?: number;
    }): Promise<DeadLetterJob[]>;
    queueList(opts?: {
        queue_name?: string;
        status?: string;
        limit?: number;
    }): Promise<QueueListResponse>;
    scheduleCreate(cronExpr: string, payload: unknown, opts?: {
        queue_name?: string;
        priority?: number;
    }): Promise<Schedule>;
    scheduleList(): Promise<ScheduleListResponse>;
    scheduleGet(taskId: string): Promise<Schedule>;
    scheduleToggle(taskId: string, enabled: boolean): Promise<Schedule>;
    scheduleDelete(taskId: string): Promise<void>;
    directory(opts?: {
        capability?: string;
        limit?: number;
    }): Promise<DirectoryEntry[]>;
    directorySearch(opts?: {
        q?: string;
        capability?: string;
        skill?: string;
        interest?: string;
        available?: boolean;
        online?: boolean;
        min_reputation?: number;
        limit?: number;
    }): Promise<DirectoryEntry[]>;
    profile(): Promise<AgentProfile>;
    updateProfile(opts: {
        description?: string;
        capabilities?: string[];
        skills?: string[];
        interests?: string[];
        public?: boolean;
    }): Promise<AgentProfile>;
    updateStatus(opts: {
        available?: boolean;
        looking_for?: string;
        busy_until?: string;
    }): Promise<AgentProfile>;
    match(need: string, opts?: {
        min_reputation?: number;
        limit?: number;
    }): Promise<MatchResult[]>;
    rateCollaboration(partnerAgent: string, outcome: string, rating: number, taskType?: string): Promise<{
        status: string;
    }>;
    leaderboard(opts?: {
        sort_by?: string;
        limit?: number;
    }): Promise<LeaderboardEntry[]>;
    directoryStats(): Promise<DirectoryStats>;
    heartbeat(status?: string, metadata?: Record<string, unknown>): Promise<{
        status: string;
    }>;
    webhookCreate(url: string, eventTypes: string[], secret?: string): Promise<WebhookConfig>;
    webhookList(): Promise<WebhookConfig[]>;
    webhookDelete(webhookId: string): Promise<void>;
    webhookTest(webhookId: string): Promise<{
        status: string;
        response_code: number;
    }>;
    marketplaceCreate(title: string, rewardCredits: number, opts?: {
        description?: string;
        requirements?: string[];
        deadline?: string;
    }): Promise<MarketplaceTask>;
    marketplaceClaim(taskId: string): Promise<MarketplaceTask>;
    marketplaceDeliver(taskId: string, result: unknown): Promise<MarketplaceTask>;
    marketplaceReview(taskId: string, accept: boolean, rating?: number): Promise<MarketplaceTask>;
    textProcess(text: string, operation: string): Promise<{
        result: string;
    }>;
    sessionCreate(opts?: {
        title?: string;
        max_tokens?: number;
    }): Promise<Session>;
    sessionList(): Promise<Session[]>;
    sessionGet(sessionId: string): Promise<Session>;
    sessionAppend(sessionId: string, role: string, content: string): Promise<SessionMessage>;
    sessionSummarize(sessionId: string): Promise<{
        summary: string;
    }>;
    sessionDelete(sessionId: string): Promise<void>;
    stats(): Promise<AgentStats>;
    events(): Promise<AgentEvent[]>;
    eventsStream(): Promise<AgentEvent[]>;
    eventsAck(eventIds: string[]): Promise<{
        acknowledged: number;
    }>;
    onboardingStart(): Promise<OnboardingStatus>;
    onboardingStatus(): Promise<OnboardingStatus>;
    testScenarioCreate(pattern: string, opts?: {
        description?: string;
        config?: Record<string, unknown>;
    }): Promise<TestScenario>;
    testScenarioList(opts?: {
        pattern?: string;
        limit?: number;
    }): Promise<TestScenario[]>;
    testScenarioRun(scenarioId: string): Promise<{
        status: string;
        result: unknown;
    }>;
}
//# sourceMappingURL=client.d.ts.map