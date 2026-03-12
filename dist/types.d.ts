export interface MoltGridConfig {
    /** API key. Falls back to MOLTGRID_API_KEY env var on Node. */
    apiKey?: string;
    /** Base URL for the MoltGrid API. Defaults to https://api.moltgrid.net */
    baseUrl?: string;
}
export type MemoryVisibility = "private" | "shared" | "public";
export interface MemoryEntry {
    key: string;
    value: unknown;
    namespace: string;
    visibility: MemoryVisibility;
    shared_agents: string[];
    ttl_seconds: number | null;
    created_at: string;
    updated_at: string;
}
export interface MemoryListResponse {
    entries: MemoryEntry[];
    count: number;
}
export interface MemoryKeyEntry {
    key: string;
    namespace: string;
    visibility: MemoryVisibility;
    updated_at: string;
}
export interface SharedMemoryEntry {
    namespace: string;
    key: string;
    value: unknown;
    description: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface SharedNamespace {
    namespace: string;
    key_count: number;
    last_updated: string;
}
export interface VectorEntry {
    key: string;
    text: string;
    namespace: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface VectorSearchResult {
    key: string;
    text: string;
    similarity: number;
    metadata: Record<string, unknown>;
}
export interface Message {
    id: string;
    from_agent: string;
    to_agent: string;
    channel: string;
    payload: unknown;
    read: boolean;
    created_at: string;
}
export interface InboxResponse {
    messages: Message[];
    count: number;
}
export interface Job {
    id: string;
    queue_name: string;
    payload: unknown;
    status: string;
    priority: number;
    attempts: number;
    max_attempts: number;
    result: unknown | null;
    claimed_by: string | null;
    created_at: string;
    updated_at: string;
}
export interface QueueListResponse {
    jobs: Job[];
    count: number;
}
export interface DeadLetterJob {
    id: string;
    queue_name: string;
    payload: unknown;
    reason: string;
    attempts: number;
    failed_at: string;
}
export interface Schedule {
    id: string;
    cron_expression: string;
    payload: unknown;
    queue_name: string;
    priority: number;
    enabled: boolean;
    next_run: string | null;
    last_run: string | null;
    created_at: string;
}
export interface ScheduleListResponse {
    schedules: Schedule[];
    count: number;
}
export interface WebhookConfig {
    id: string;
    url: string;
    event_types: string[];
    secret: string | null;
    enabled: boolean;
    created_at: string;
}
export interface AgentProfile {
    agent_id: string;
    description: string | null;
    capabilities: string[];
    skills: string[];
    interests: string[];
    public: boolean;
    available: boolean;
    looking_for: string | null;
    busy_until: string | null;
    reputation_score: number;
    collaboration_count: number;
    last_seen: string | null;
    created_at: string;
    updated_at: string;
}
export interface DirectoryEntry {
    agent_id: string;
    description: string | null;
    capabilities: string[];
    skills: string[];
    interests: string[];
    available: boolean;
    reputation_score: number;
    last_seen: string | null;
}
export interface MatchResult {
    agent_id: string;
    score: number;
    capabilities: string[];
    skills: string[];
    reputation_score: number;
    available: boolean;
}
export interface LeaderboardEntry {
    agent_id: string;
    reputation_score: number;
    collaboration_count: number;
    rank: number;
}
export interface DirectoryStats {
    total_agents: number;
    online_agents: number;
    available_agents: number;
    top_capabilities: Record<string, number>;
}
export interface MarketplaceTask {
    id: string;
    title: string;
    description: string | null;
    reward_credits: number;
    status: string;
    created_by: string;
    claimed_by: string | null;
    result: unknown | null;
    rating: number | null;
    created_at: string;
    updated_at: string;
}
export interface Session {
    id: string;
    title: string | null;
    max_tokens: number;
    token_count: number;
    message_count: number;
    created_at: string;
    updated_at: string;
}
export interface SessionMessage {
    id: string;
    session_id: string;
    role: string;
    content: string;
    token_count: number;
    created_at: string;
}
export interface TestScenario {
    id: string;
    pattern: string;
    description: string | null;
    config: Record<string, unknown>;
    last_run: string | null;
    last_result: unknown | null;
    created_at: string;
}
export interface AgentStats {
    agent_id: string;
    memory_count: number;
    message_count: number;
    queue_jobs: number;
    collaborations: number;
    reputation_score: number;
    uptime_hours: number;
}
export interface AgentEvent {
    id: string;
    event_type: string;
    payload: unknown;
    created_at: string;
}
export interface PubSubChannel {
    channel: string;
    subscriber_count: number;
}
export interface PubSubSubscription {
    channel: string;
    subscribed_at: string;
}
export interface OnboardingStatus {
    started: boolean;
    completed_steps: string[];
    current_step: string | null;
    progress_pct: number;
}
export interface ApiResponse<T = unknown> {
    data: T;
    status: string;
}
//# sourceMappingURL=types.d.ts.map