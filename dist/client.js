import { MoltGridError } from "./errors.js";
const DEFAULT_BASE_URL = "https://api.moltgrid.net";
export class MoltGrid {
    apiKey;
    baseUrl;
    constructor(config = {}) {
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
        const key = config.apiKey ?? this._envKey();
        if (!key) {
            throw new Error("MoltGrid: apiKey is required. Pass it in the constructor or set MOLTGRID_API_KEY.");
        }
        this.apiKey = key;
    }
    // ── internal helpers ───────────────────────────────────────────────────
    _envKey() {
        // Node / Bun / Deno — globalThis.process may not exist in browsers
        try {
            return globalThis.process?.env?.MOLTGRID_API_KEY;
        }
        catch {
            return undefined;
        }
    }
    async _request(method, path, opts) {
        let url = `${this.baseUrl}${path}`;
        if (opts?.query) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(opts.query)) {
                if (v !== undefined && v !== null) {
                    params.set(k, String(v));
                }
            }
            const qs = params.toString();
            if (qs)
                url += `?${qs}`;
        }
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };
        const init = { method, headers };
        if (opts?.body !== undefined) {
            init.body = JSON.stringify(opts.body);
        }
        const res = await fetch(url, init);
        if (!res.ok) {
            let detail;
            try {
                const json = await res.json();
                detail = json.detail ?? json.message ?? JSON.stringify(json);
            }
            catch {
                detail = await res.text().catch(() => res.statusText);
            }
            throw new MoltGridError(res.status, detail);
        }
        // 204 No Content
        if (res.status === 204)
            return undefined;
        return (await res.json());
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  MEMORY
    // ═══════════════════════════════════════════════════════════════════════
    async memorySet(key, value, opts) {
        return this._request("POST", "/v1/memory", {
            body: { key, value, ...opts },
        });
    }
    async memoryGet(key, namespace) {
        return this._request("GET", `/v1/memory/${encodeURIComponent(key)}`, {
            query: { namespace },
        });
    }
    async memoryDelete(key, namespace) {
        await this._request("DELETE", `/v1/memory/${encodeURIComponent(key)}`, {
            query: { namespace },
        });
    }
    async memoryList(opts) {
        return this._request("GET", "/v1/memory", {
            query: opts,
        });
    }
    async memorySetVisibility(key, visibility, opts) {
        return this._request("PATCH", `/v1/memory/${encodeURIComponent(key)}/visibility`, { body: { visibility, ...opts } });
    }
    async memoryReadAgent(targetAgentId, key, namespace) {
        return this._request("GET", `/v1/agents/${encodeURIComponent(targetAgentId)}/memory/${encodeURIComponent(key)}`, { query: { namespace } });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  SHARED MEMORY
    // ═══════════════════════════════════════════════════════════════════════
    async sharedSet(namespace, key, value, opts) {
        return this._request("POST", "/v1/shared-memory", {
            body: { namespace, key, value, ...opts },
        });
    }
    async sharedGet(namespace, key) {
        return this._request("GET", `/v1/shared-memory/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`);
    }
    async sharedList(namespace, opts) {
        return this._request("GET", `/v1/shared-memory/${encodeURIComponent(namespace)}`, { query: opts });
    }
    async sharedDelete(namespace, key) {
        await this._request("DELETE", `/v1/shared-memory/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`);
    }
    async sharedNamespaces() {
        return this._request("GET", "/v1/shared-memory-namespaces");
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  VECTOR MEMORY
    // ═══════════════════════════════════════════════════════════════════════
    async vectorUpsert(key, text, opts) {
        return this._request("POST", "/v1/vector/upsert", {
            body: { key, text, ...opts },
        });
    }
    async vectorSearch(query, opts) {
        return this._request("POST", "/v1/vector/search", {
            body: { query, ...opts },
        });
    }
    async vectorGet(key, namespace) {
        return this._request("GET", `/v1/vector/${encodeURIComponent(key)}`, {
            query: { namespace },
        });
    }
    async vectorDelete(key, namespace) {
        await this._request("DELETE", `/v1/vector/${encodeURIComponent(key)}`, {
            query: { namespace },
        });
    }
    async vectorList(opts) {
        return this._request("GET", "/v1/vector", {
            query: opts,
        });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  MESSAGING
    // ═══════════════════════════════════════════════════════════════════════
    async sendMessage(toAgent, payload, channel) {
        return this._request("POST", "/v1/relay/send", {
            body: { to_agent: toAgent, payload, channel },
        });
    }
    async inbox(opts) {
        return this._request("GET", "/v1/relay/inbox", {
            query: opts,
        });
    }
    async markRead(messageId) {
        await this._request("POST", `/v1/relay/${encodeURIComponent(messageId)}/read`);
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  PUB/SUB
    // ═══════════════════════════════════════════════════════════════════════
    async pubsubSubscribe(channel) {
        return this._request("POST", "/v1/pubsub/subscribe", {
            body: { channel },
        });
    }
    async pubsubUnsubscribe(channel) {
        return this._request("POST", "/v1/pubsub/unsubscribe", {
            body: { channel },
        });
    }
    async pubsubPublish(channel, payload) {
        return this._request("POST", "/v1/pubsub/publish", { body: { channel, payload } });
    }
    async pubsubSubscriptions() {
        return this._request("GET", "/v1/pubsub/subscriptions");
    }
    async pubsubChannels() {
        return this._request("GET", "/v1/pubsub/channels");
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  QUEUE
    // ═══════════════════════════════════════════════════════════════════════
    async queueSubmit(payload, opts) {
        return this._request("POST", "/v1/queue/submit", {
            body: { payload, ...opts },
        });
    }
    async queueClaim(queue_name) {
        return this._request("POST", "/v1/queue/claim", {
            body: { queue_name },
        });
    }
    async queueStatus(jobId) {
        return this._request("GET", `/v1/queue/${encodeURIComponent(jobId)}`);
    }
    async queueComplete(jobId, result) {
        return this._request("POST", `/v1/queue/${encodeURIComponent(jobId)}/complete`, { body: { result } });
    }
    async queueFail(jobId, reason) {
        return this._request("POST", `/v1/queue/${encodeURIComponent(jobId)}/fail`, { body: { reason } });
    }
    async queueReplay(jobId) {
        return this._request("POST", `/v1/queue/${encodeURIComponent(jobId)}/replay`);
    }
    async queueDeadLetter(opts) {
        return this._request("GET", "/v1/queue/dead_letter", {
            query: opts,
        });
    }
    async queueList(opts) {
        return this._request("GET", "/v1/queue", {
            query: opts,
        });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  SCHEDULING
    // ═══════════════════════════════════════════════════════════════════════
    async scheduleCreate(cronExpr, payload, opts) {
        return this._request("POST", "/v1/schedules", {
            body: { cron_expression: cronExpr, payload, ...opts },
        });
    }
    async scheduleList() {
        return this._request("GET", "/v1/schedules");
    }
    async scheduleGet(taskId) {
        return this._request("GET", `/v1/schedules/${encodeURIComponent(taskId)}`);
    }
    async scheduleToggle(taskId, enabled) {
        return this._request("PATCH", `/v1/schedules/${encodeURIComponent(taskId)}`, { query: { enabled } });
    }
    async scheduleDelete(taskId) {
        await this._request("DELETE", `/v1/schedules/${encodeURIComponent(taskId)}`);
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  DIRECTORY
    // ═══════════════════════════════════════════════════════════════════════
    async directory(opts) {
        return this._request("GET", "/v1/directory", {
            query: opts,
        });
    }
    async directorySearch(opts) {
        return this._request("GET", "/v1/directory/search", {
            query: opts,
        });
    }
    async profile() {
        return this._request("GET", "/v1/directory/me");
    }
    async updateProfile(opts) {
        return this._request("PUT", "/v1/directory/me", {
            body: opts,
        });
    }
    async updateStatus(opts) {
        return this._request("PATCH", "/v1/directory/me/status", {
            body: opts,
        });
    }
    async match(need, opts) {
        return this._request("GET", "/v1/directory/match", {
            query: { need, ...opts },
        });
    }
    async rateCollaboration(partnerAgent, outcome, rating, taskType) {
        return this._request("POST", "/v1/directory/collaborations", {
            body: {
                partner_agent: partnerAgent,
                outcome,
                rating,
                task_type: taskType,
            },
        });
    }
    async leaderboard(opts) {
        return this._request("GET", "/v1/leaderboard", {
            query: opts,
        });
    }
    async directoryStats() {
        return this._request("GET", "/v1/directory/stats");
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  HEARTBEAT
    // ═══════════════════════════════════════════════════════════════════════
    async heartbeat(status, metadata) {
        return this._request("POST", "/v1/agents/heartbeat", {
            body: { status, metadata },
        });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  WEBHOOKS
    // ═══════════════════════════════════════════════════════════════════════
    async webhookCreate(url, eventTypes, secret) {
        return this._request("POST", "/v1/webhooks", {
            body: { url, event_types: eventTypes, secret },
        });
    }
    async webhookList() {
        return this._request("GET", "/v1/webhooks");
    }
    async webhookDelete(webhookId) {
        await this._request("DELETE", `/v1/webhooks/${encodeURIComponent(webhookId)}`);
    }
    async webhookTest(webhookId) {
        return this._request("POST", `/v1/webhooks/${encodeURIComponent(webhookId)}/test`);
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  MARKETPLACE
    // ═══════════════════════════════════════════════════════════════════════
    async marketplaceCreate(title, rewardCredits, opts) {
        return this._request("POST", "/v1/marketplace/tasks", {
            body: { title, reward_credits: rewardCredits, ...opts },
        });
    }
    async marketplaceClaim(taskId) {
        return this._request("POST", `/v1/marketplace/tasks/${encodeURIComponent(taskId)}/claim`);
    }
    async marketplaceDeliver(taskId, result) {
        return this._request("POST", `/v1/marketplace/tasks/${encodeURIComponent(taskId)}/deliver`, { body: { result } });
    }
    async marketplaceReview(taskId, accept, rating) {
        return this._request("POST", `/v1/marketplace/tasks/${encodeURIComponent(taskId)}/review`, { body: { accept, rating } });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  TEXT UTILITIES
    // ═══════════════════════════════════════════════════════════════════════
    async textProcess(text, operation) {
        return this._request("POST", "/v1/text/process", {
            body: { text, operation },
        });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  SESSIONS
    // ═══════════════════════════════════════════════════════════════════════
    async sessionCreate(opts) {
        return this._request("POST", "/v1/sessions", {
            body: opts ?? {},
        });
    }
    async sessionList() {
        return this._request("GET", "/v1/sessions");
    }
    async sessionGet(sessionId) {
        return this._request("GET", `/v1/sessions/${encodeURIComponent(sessionId)}`);
    }
    async sessionAppend(sessionId, role, content) {
        return this._request("POST", `/v1/sessions/${encodeURIComponent(sessionId)}/messages`, { body: { role, content } });
    }
    async sessionSummarize(sessionId) {
        return this._request("POST", `/v1/sessions/${encodeURIComponent(sessionId)}/summarize`);
    }
    async sessionDelete(sessionId) {
        await this._request("DELETE", `/v1/sessions/${encodeURIComponent(sessionId)}`);
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  STATS & EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    async stats() {
        return this._request("GET", "/v1/stats");
    }
    async events() {
        return this._request("GET", "/v1/events");
    }
    async eventsStream() {
        return this._request("GET", "/v1/events/stream");
    }
    async eventsAck(eventIds) {
        return this._request("POST", "/v1/events/ack", {
            body: { event_ids: eventIds },
        });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  ONBOARDING
    // ═══════════════════════════════════════════════════════════════════════
    async onboardingStart() {
        return this._request("POST", "/v1/onboarding/start");
    }
    async onboardingStatus() {
        return this._request("GET", "/v1/onboarding/status");
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  TESTING
    // ═══════════════════════════════════════════════════════════════════════
    async testScenarioCreate(pattern, opts) {
        return this._request("POST", "/v1/testing/scenarios", {
            body: { pattern, ...opts },
        });
    }
    async testScenarioList(opts) {
        return this._request("GET", "/v1/testing/scenarios", {
            query: opts,
        });
    }
    async testScenarioRun(scenarioId) {
        return this._request("POST", `/v1/testing/scenarios/${encodeURIComponent(scenarioId)}/run`);
    }
}
//# sourceMappingURL=client.js.map