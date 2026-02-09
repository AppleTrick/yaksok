import { MOCK_SUPPLEMENTS_DB, MockSupplement } from './mockData';

// Simulate API latency
const SIMULATED_DELAY_MS = 300;

export const searchSupplements = async (query: string): Promise<MockSupplement[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!query.trim()) {
                resolve([]);
                return;
            }

            const lowerQuery = query.toLowerCase();
            const results = MOCK_SUPPLEMENTS_DB.filter(item =>
                item.name.toLowerCase().includes(lowerQuery) ||
                item.category?.toLowerCase().includes(lowerQuery) ||
                item.efficacy?.toLowerCase().includes(lowerQuery)
            );

            resolve(results);
        }, SIMULATED_DELAY_MS);
    });
};
