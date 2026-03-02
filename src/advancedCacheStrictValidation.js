const { DEFAULT_PERSISTENT_CACHE_TTL } = require('./constants');

function toNumber(v) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    return NaN;
}

function normalizePersistedMetadataStrict(metadata, maxMemoryUsage, metrics) {
    if (!metadata) return null;
    if (typeof metadata !== 'object') return null;

    const rawTs = metadata.timestamp ?? metadata.ts;
    const rawLa = metadata.lastAccess ?? metadata.la;
    const rawTtl = metadata.ttl ?? metadata.tt;
    const rawSz = metadata.size ?? metadata.sz;

    const ts = toNumber(rawTs);
    const la = toNumber(rawLa);
    const ttl = toNumber(rawTtl);
    const sz = toNumber(rawSz);

    const tagsRaw = metadata.tags ?? metadata.tg;
    if (tagsRaw !== undefined && !Array.isArray(tagsRaw)) {
        metrics.persistentRejected++;
        return null;
    }

    // Require numeric timestamp/lastAccess/ttl/size and sanity checks
    if (!Number.isFinite(ts) || !Number.isFinite(la) || !Number.isFinite(ttl) || !Number.isFinite(sz)) {
        metrics.persistentRejected++;
        return null;
    }

    const now = Date.now();
    const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

    if (ttl <= 0 || ttl > TEN_YEARS_MS) {
        metrics.persistentRejected++;
        return null;
    }

    if (ts < now - TEN_YEARS_MS || ts > now + ONE_YEAR_MS) {
        metrics.persistentRejected++;
        return null;
    }
    if (la < now - TEN_YEARS_MS || la > now + ONE_YEAR_MS) {
        metrics.persistentRejected++;
        return null;
    }

    if (!Number.isFinite(sz) || sz <= 0) {
        metrics.persistentRejected++;
        return null;
    }

    const maxAllowedSize = Math.max(maxMemoryUsage * 10, 10 * 1024 * 1024);
    if (sz > maxAllowedSize) {
        metrics.persistentRejected++;
        return null;
    }

    return {
        timestamp: Number.isFinite(ts) ? ts : Date.now(),
        lastAccess: Number.isFinite(la) ? la : Date.now(),
        ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_PERSISTENT_CACHE_TTL,
        size: Number.isFinite(sz) ? sz : undefined,
        tags: Array.isArray(tagsRaw) ? tagsRaw : undefined,
        version: metadata.version ?? metadata.v ?? 1
    };
}

module.exports = {
    normalizePersistedMetadataStrict
};
