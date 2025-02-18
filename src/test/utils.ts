export async function poll<T>(fn: () => Promise<T>, timeout = 1000, interval = 10): Promise<T> {
    const timeoutAt = Date.now() + timeout;
    let error;
    while (Date.now() < timeoutAt) {
        try {
            return await fn();
        } catch (err) {
            error = err;
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    throw error;
}
