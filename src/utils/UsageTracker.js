export const UsageTracker = {
    // Pricing (USD per 1M tokens or per image) - Example Rates
    RATES: {
        'gpt-4o': { input: 5.00, output: 15.00 },
        'gpt-5.2': { input: 10.00, output: 30.00 },
        'dall-e-3': { per_image: 0.040 }, // Standard Quality
        'seedream-4-5': { per_image: 0.020 } // 카카오 Seedream 4.5
    },

    getLogs() {
        try {
            return JSON.parse(localStorage.getItem('ai_usage_logs') || '[]');
        } catch {
            return [];
        }
    },

    getBudget() {
        try {
            return JSON.parse(localStorage.getItem('ai_budget_settings') || '{"monthly_limit": 10.0, "current_spend": 0.0}');
        } catch {
            return { monthly_limit: 10.0, current_spend: 0.0 };
        }
    },

    saveBudget(settings) {
        localStorage.setItem('ai_budget_settings', JSON.stringify(settings));
    },

    // Log a text generation event
    logTextUsage(model, inputTokens, outputTokens, userId = 'default_user', featureId = 'General') {
        const rates = this.RATES[model] || { input: 0, output: 0 };
        const cost = ((inputTokens * rates.input) + (outputTokens * rates.output)) / 1_000_000;

        this._addLog({
            type: 'text',
            model,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost: parseFloat(cost.toFixed(6)),
            user_id: userId,
            feature_id: featureId
        });
    },

    // Log an image generation event
    logImageUsage(model, count = 1, userId = 'default_user', featureId = 'Creator') {
        const rate = (this.RATES[model]?.per_image || 0.040);
        const cost = rate * count;

        this._addLog({
            type: 'image',
            model,
            count,
            cost: parseFloat(cost.toFixed(6)),
            user_id: userId,
            feature_id: featureId
        });
    },

    _addLog(details) {
        const logs = this.getLogs();
        const budget = this.getBudget();

        const newLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...details
        };

        // Add to logs
        logs.unshift(newLog); // Newest first
        if (logs.length > 1000) logs.pop(); // Keep last 1000 logs locally

        localStorage.setItem('ai_usage_logs', JSON.stringify(logs));

        // Update Cumulative Spend
        budget.current_spend += newLog.cost;
        this.saveBudget(budget);

        // Soft Limit Check (80%)
        if (budget.current_spend >= budget.monthly_limit * 0.8 && budget.current_spend < budget.monthly_limit) {
            console.warn(`⚠️ Budget Alert: You have used ${(budget.current_spend / budget.monthly_limit * 100).toFixed(1)}% of your monthly limit.`);
        }
    },

    isBudgetExceeded() {
        const budget = this.getBudget();
        return budget.current_spend >= budget.monthly_limit;
    }
};
