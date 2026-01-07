const { getLogger } = require('../utils/logger');

const isWebBuild = process.env.VSCODE_WEB === 'true';
const WebWorkerCtor = typeof globalThis !== 'undefined' && typeof globalThis.Worker === 'function'
    ? globalThis.Worker
    : null;
let WorkerThreads = null;
let NodeFs = null;
let NodePath = null;
if (!isWebBuild) {
    try {
        WorkerThreads = eval('require')('worker_threads');
    } catch {
        WorkerThreads = null;
    }
    try {
        NodeFs = eval('require')('fs');
    } catch {
        NodeFs = null;
    }
    try {
        NodePath = eval('require')('path');
    } catch {
        NodePath = null;
    }
}

const DEFAULT_WASM_PATH = (() => {
    if (!NodePath) {
        return null;
    }
    try {
        return NodePath.join(__dirname, '..', '..', 'assets', 'wasm', 'digest.wasm');
    } catch {
        return null;
    }
})();

const PERFORMANCE_REPORT_INTERVAL_MS = 30000;
const PERFORMANCE_MIN_SAMPLE_COUNT = 100;

const WORKER_SOURCE = `
(function () {
    const isWeb = typeof self !== 'undefined' && typeof self.postMessage === 'function';
    let postMessageImpl = null;
    let subscribe = null;
    globalThis.__wasmHasher = null;
    const REPORT_INTERVAL_MS = ${PERFORMANCE_REPORT_INTERVAL_MS};
    const MIN_SAMPLE_COUNT = ${PERFORMANCE_MIN_SAMPLE_COUNT};

    function reportLog(level, message, details) {
        try {
            postMessageImpl({
                type: 'log',
                level,
                message,
                details
            });
        } catch (error) {
            // Swallow logging failures inside the worker to avoid breaking tasks
        }
    }

    if (isWeb) {
        postMessageImpl = (message) => self.postMessage(message);
        subscribe = (handler) => {
            self.onmessage = (event) => handler(event.data);
        };
    } else {
        const { parentPort, workerData } = require('worker_threads');
        let fs = null;
        try {
            fs = require('fs');
        } catch {
            fs = null;
        }
        const wasmPath = workerData && workerData.wasmPath;
        let wasmHasher = null;
        postMessageImpl = (message) => parentPort.postMessage(message);
        subscribe = (handler) => {
            parentPort.on('message', handler);
        };
        if (fs && wasmPath && typeof WebAssembly === 'object') {
            try {
                const bytes = fs.readFileSync(wasmPath);
                const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
                if (instance?.exports?.reset && instance.exports.feed && instance.exports.finish) {
                    wasmHasher = instance.exports;
                }
            } catch (error) {
                reportLog('warn', '[IndexWorker] Failed to initialize WASM digest', { error: error?.message || error });
            }
        }
        globalThis.__wasmHasher = wasmHasher;
    }

    subscribe(async (message) => {
        if (!message || typeof message !== 'object') {
            return;
        }

        const { id, task, payload } = message;
        try {
            const result = await handleTask(task, payload);
            postMessageImpl({ id, result });
        } catch (error) {
            postMessageImpl({
                id,
                error: {
                    message: error?.message || String(error)
                }
            });
        }
    });

    function handleTask(task, payload) {
        switch (task) {
            case 'digest':
                return (payload || []).map((entry) => digestEntry(entry));
            default:
                return payload;
        }
    }

    function digestEntry(entry = {}) {
        const hashBase = [
            entry.path || '',
            entry.mtimeMs || 0,
            entry.size || 0
        ].join(':');
        const hash = computeHash(hashBase);
        return {
            path: entry.path,
            hash,
            sizeBucket: bucketSize(entry.size),
            ageBucket: bucketAge(entry.mtimeMs)
        };
    }

    // Performance profiling for WASM vs JS fallback
    let performanceStats = {
        wasmCalls: 0,
        jsCalls: 0,
        wasmTotalTime: 0,
        jsTotalTime: 0,
        lastProfilingReport: 0
    };

    function computeHash(input) {
        const wasmHasher = globalThis.__wasmHasher;
        const startTime = performance.now();
        
        if (wasmHasher && typeof wasmHasher.reset === 'function') {
            try {
                wasmHasher.reset();
                for (let i = 0; i < input.length; i++) {
                    wasmHasher.feed(input.charCodeAt(i) & 0xffff);
                }
                const value = wasmHasher.finish() >>> 0;
                
                const endTime = performance.now();
                performanceStats.wasmCalls++;
                performanceStats.wasmTotalTime += (endTime - startTime);
                
                // Report performance metrics periodically
                reportPerformanceIfNeeded();
                
                return value.toString(16);
            } catch (error) {
                reportLog('warn', '[IndexWorker] WASM digest failure, falling back to JS', { error: error?.message || error });
                globalThis.__wasmHasher = null;
            }
        }
        
        const result = stableHash(input);
        const endTime = performance.now();
        performanceStats.jsCalls++;
        performanceStats.jsTotalTime += (endTime - startTime);
        
        reportPerformanceIfNeeded();
        return result;
    }
    
    function reportPerformanceIfNeeded() {
        const now = Date.now();
        
        if (now - performanceStats.lastProfilingReport > REPORT_INTERVAL_MS && 
            (performanceStats.wasmCalls > MIN_SAMPLE_COUNT || performanceStats.jsCalls > MIN_SAMPLE_COUNT)) {
            
            const wasmAvg = performanceStats.wasmCalls > 0 ? 
                (performanceStats.wasmTotalTime / performanceStats.wasmCalls) : 0;
            const jsAvg = performanceStats.jsCalls > 0 ? 
                (performanceStats.jsTotalTime / performanceStats.jsCalls) : 0;
            
            const report = {
                wasmCalls: performanceStats.wasmCalls,
                jsCalls: performanceStats.jsCalls,
                wasmAvgMs: Math.round(wasmAvg * 1000) / 1000,
                jsAvgMs: Math.round(jsAvg * 1000) / 1000,
                wasmBenefit: wasmAvg < jsAvg ? Math.round((1 - wasmAvg/jsAvg) * 100) + '% faster' : 'No benefit'
            };
            
            reportLog('info', '[IndexWorker] Hash performance profile', report);
            
            // Reset for next period
            performanceStats = {
                wasmCalls: 0,
                jsCalls: 0,
                wasmTotalTime: 0,
                jsTotalTime: 0,
                lastProfilingReport: now
            };
        }
    }

    function stableHash(input) {
        let hash = 0;
        if (!input) {
            return '0';
        }
        for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) - hash) + input.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    }

    function bucketSize(size) {
        if (!Number.isFinite(size) || size <= 0) {
            return 'tiny';
        }
        if (size < 1024) return 'tiny';
        if (size < 1024 * 100) return 'small';
        if (size < 1024 * 1024) return 'medium';
        if (size < 1024 * 1024 * 10) return 'large';
        return 'huge';
    }

    function bucketAge(mtimeMs) {
        if (!Number.isFinite(mtimeMs)) {
            return 'unknown';
        }
        const diff = Date.now() - mtimeMs;
        if (diff < 0) return 'future';
        if (diff < 1000 * 60) return 'minute';
        if (diff < 1000 * 60 * 60) return 'hour';
        if (diff < 1000 * 60 * 60 * 24) return 'day';
        if (diff < 1000 * 60 * 60 * 24 * 7) return 'week';
        return 'old';
    }
})();
`;

class IndexWorkerHost {
    constructor(options = {}) {
        this._logger = options.logger || getLogger();
        this._wasmPath = this._resolveWasmPath(options.wasmPath);
        this._enabled = this._detectSupport();
        this._worker = null;
        this._pending = new Map();
        this._nextId = 1;

        if (this._enabled) {
            this._worker = this._createWorker();
            if (!this._worker) {
                this._enabled = false;
            }
        }

        if (!this._worker) {
            this._logger.debug('IndexWorkerHost disabled (worker support unavailable)');
        }
    }

    isEnabled() {
        return !!this._worker;
    }

    async runTask(task, payload) {
        if (!this._worker) {
            return this._runInline(task, payload);
        }

        const id = this._nextId++;
        return new Promise((resolve, reject) => {
            this._pending.set(id, { resolve, reject });
            try {
                this._postMessage({ id, task, payload });
            } catch (error) {
                this._pending.delete(id);
                reject(error);
            }
        });
    }

    dispose() {
        if (this._worker) {
            if (isWebBuild) {
                this._worker.terminate();
            } else {
                this._worker.terminate();
            }
            this._worker = null;
        }
        this._pending.clear();
    }

    _detectSupport() {
        if (isWebBuild) {
            const hasBlob = typeof globalThis.Blob === 'function';
            const hasUrlCtor = typeof globalThis.URL === 'function' || typeof globalThis.URL === 'object';
            const canCreateObjectUrl = !!(globalThis.URL && typeof globalThis.URL.createObjectURL === 'function');
            return !!(WebWorkerCtor && hasBlob && hasUrlCtor && canCreateObjectUrl);
        }
        return !!WorkerThreads;
    }

    _createWorker() {
        if (isWebBuild) {
            if (!WebWorkerCtor) {
                this._logger.debug('Web Worker constructor unavailable; worker disabled');
                this._enabled = false;
                return null;
            }
            const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
            const workerUrl = globalThis.URL.createObjectURL(blob);
            const worker = new WebWorkerCtor(workerUrl);
            worker.onmessage = (event) => this._handleMessage(event.data);
            worker.onerror = (error) => this._logger.debug('Index worker (web) error', error);
            return worker;
        }

        if (!WorkerThreads || !WorkerThreads.Worker) {
            this._logger.debug('worker_threads unavailable; worker disabled');
            this._enabled = false;
            return null;
        }
        const workerOptions = {
            eval: true,
            workerData: {
                wasmPath: this._wasmPath
            }
        };
        const worker = new WorkerThreads.Worker(WORKER_SOURCE, workerOptions);
        worker.on('message', (data) => this._handleMessage(data));
        worker.on('error', (error) => this._logger.debug('Index worker error', error));
        return worker;
    }

    _postMessage(message) {
        if (isWebBuild) {
            this._worker.postMessage(message);
        } else {
            this._worker.postMessage(message);
        }
    }

    _handleMessage(message) {
        if (!message || typeof message !== 'object') {
            return;
        }
        if (message.type === 'log') {
            const level = message.level || 'info';
            const logMethod = typeof this._logger[level] === 'function' ? this._logger[level].bind(this._logger) : this._logger.info.bind(this._logger);
            logMethod(message.message || '[IndexWorker] log entry', message.details);
            return;
        }
        const { id, result, error } = message;
        const pending = this._pending.get(id);
        if (!pending) {
            return;
        }
        this._pending.delete(id);
        if (error) {
            pending.reject(new Error(error.message || 'Worker task failed'));
        } else {
            pending.resolve(result);
        }
    }

    _resolveWasmPath(explicitPath) {
        const candidate = explicitPath || process.env.EXPLORER_DATES_WASM_PATH || DEFAULT_WASM_PATH;
        if (!candidate || !NodeFs) {
            return null;
        }
        try {
            if (NodeFs.existsSync(candidate)) {
                return candidate;
            }
        } catch {
            // ignore fs errors
        }
        return null;
    }

    _runInline(task, payload) {
        switch (task) {
            case 'digest':
                return Promise.resolve((payload || []).map((entry) => this._digestEntry(entry)));
            default:
                return Promise.resolve(payload);
        }
    }

    _digestEntry(entry = {}) {
        const hashBase = [
            entry.path || '',
            entry.mtimeMs || 0,
            entry.size || 0
        ].join(':');
        return {
            path: entry.path,
            hash: this._stableHash(hashBase),
            sizeBucket: this._bucketSize(entry.size),
            ageBucket: this._bucketAge(entry.mtimeMs)
        };
    }

    _stableHash(input) {
        let hash = 0;
        if (!input) {
            return '0';
        }
        for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) - hash) + input.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    }

    _bucketSize(size) {
        if (!Number.isFinite(size) || size <= 0) {
            return 'tiny';
        }
        if (size < 1024) return 'tiny';
        if (size < 1024 * 100) return 'small';
        if (size < 1024 * 1024) return 'medium';
        if (size < 1024 * 1024 * 10) return 'large';
        return 'huge';
    }

    _bucketAge(mtimeMs) {
        if (!Number.isFinite(mtimeMs)) {
            return 'unknown';
        }
        const diff = Date.now() - mtimeMs;
        if (diff < 0) return 'future';
        if (diff < 1000 * 60) return 'minute';
        if (diff < 1000 * 60 * 60) return 'hour';
        if (diff < 1000 * 60 * 60 * 24) return 'day';
        if (diff < 1000 * 60 * 60 * 24 * 7) return 'week';
        return 'old';
    }
}

module.exports = { IndexWorkerHost };
