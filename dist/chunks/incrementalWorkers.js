var c=(l,e)=>()=>(e||l((e={exports:{}}).exports,e),e.exports);var f=c((S,d)=>{var a="__explorerDatesLogger",i=class{constructor(){this.s=null}o(e,r){if(this.s&&typeof this.s[e]=="function")try{return this.s[e](...r)}catch{}switch(e){case"debug":break;case"info":break;case"warn":break;case"error":break;default:break}}debug(...e){return this.o("debug",e)}info(...e){return this.o("info",e)}warn(...e){return this.o("warn",e)}error(...e){return this.o("error",e)}w(e){this.s=e}};function T(){return typeof global<"u"?(global[a]||(global[a]=new i),global[a]):typeof globalThis<"u"?(globalThis[a]||(globalThis[a]=new i),globalThis[a]):(u||(u=new i),u)}var h=class extends i{},u=null;d.exports={Logger:h,getLogger:T}});var b=c((E,p)=>{var m=require("vscode");function y(){try{return m?.env?.uiKind===m?.UIKind?.Web}catch{return!1}}p.exports={isWebEnvironment:y}});var w=c((exports,module)=>{var{getLogger}=f(),{isWebEnvironment}=b(),env=typeof process<"u"&&process.env?process.env:{},isWebBuild=env.VSCODE_WEB==="true"||isWebEnvironment(),WebWorkerCtor=typeof globalThis<"u"&&typeof globalThis.Worker=="function"?globalThis.Worker:null,WorkerThreads=null,NodeFs=null,NodePath=null;if(!isWebBuild&&typeof process<"u"&&process.versions?.node){try{WorkerThreads=eval("require")("worker_threads")}catch{WorkerThreads=null}try{NodeFs=eval("require")("fs")}catch{NodeFs=null}try{NodePath=eval("require")("path")}catch{NodePath=null}}var DEFAULT_WASM_PATH=(()=>{if(!NodePath)return null;try{return NodePath.join(__dirname,"..","..","assets","wasm","digest.wasm")}catch{return null}})(),PERFORMANCE_REPORT_INTERVAL_MS=3e4,PERFORMANCE_MIN_SAMPLE_COUNT=100,WORKER_SOURCE=`
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
`,IndexWorkerHost=class{constructor(e={}){this._logger=e.logger||getLogger(),this.a=this.l(e.wasmPath),this.n=this.c(),this.e=null,this.t=new Map,this.u=1,this.n&&(this.e=this.h(),this.e||(this.n=!1)),this.e||this._logger.debug("IndexWorkerHost disabled (worker support unavailable)")}isEnabled(){return!!this.e}async runTask(e,r){if(!this.e)return this.f(e,r);let t=this.u++;return new Promise((n,s)=>{this.t.set(t,{resolve:n,reject:s});try{this.g({id:t,task:e,payload:r})}catch(o){this.t.delete(t),s(o)}})}async dispose(){if(this.e){try{await this.e.terminate()}catch(e){this._logger.debug("Error terminating worker:",e)}this.e=null}this.t.clear()}c(){if(isWebBuild){let e=typeof globalThis.Blob=="function",r=typeof globalThis.URL=="function"||typeof globalThis.URL=="object",t=!!(globalThis.URL&&typeof globalThis.URL.createObjectURL=="function");return!!(WebWorkerCtor&&e&&r&&t)}return!!WorkerThreads}h(){if(isWebBuild){if(!WebWorkerCtor)return this._logger.debug("Web Worker constructor unavailable; worker disabled"),this.n=!1,null;let t=new Blob([WORKER_SOURCE],{type:"application/javascript"}),n=globalThis.URL.createObjectURL(t),s=new WebWorkerCtor(n);return s.onmessage=o=>this.i(o.data),s.onerror=o=>this._logger.debug("Index worker (web) error",o),s}if(!WorkerThreads||!WorkerThreads.Worker)return this._logger.debug("worker_threads unavailable; worker disabled"),this.n=!1,null;try{let n=(new Error("Worker creation stack").stack||"").split(`
`).slice(2,8).join(`
`)}catch{}let e={eval:!0,workerData:{wasmPath:this.a}},r=new WorkerThreads.Worker(WORKER_SOURCE,e);return r.on("message",t=>this.i(t)),r.on("error",t=>this._logger.debug("Index worker error",t)),r}g(e){isWebBuild?this.e.postMessage(e):this.e.postMessage(e)}i(e){if(!e||typeof e!="object")return;if(e.type==="log"){let o=e.level||"info";(typeof this._logger[o]=="function"?this._logger[o].bind(this._logger):this._logger.info.bind(this._logger))(e.message||"[IndexWorker] log entry",e.details);return}let{id:r,result:t,error:n}=e,s=this.t.get(r);s&&(this.t.delete(r),n?s.reject(new Error(n.message||"Worker task failed")):s.resolve(t))}l(e){let r=e||env.EXPLORER_DATES_WASM_PATH||DEFAULT_WASM_PATH;if(!r||!NodeFs)return null;try{if(NodeFs.existsSync(r))return r}catch{}return null}f(e,r){return e==="digest"?Promise.resolve((r||[]).map(t=>this.d(t))):Promise.resolve(r)}d(e={}){let r=[e.path||"",e.mtimeMs||0,e.size||0].join(":");return{path:e.path,hash:this.m(r),sizeBucket:this.p(e.size),ageBucket:this.b(e.mtimeMs)}}m(e){let r=0;if(!e)return"0";for(let t=0;t<e.length;t++)r=(r<<5)-r+e.charCodeAt(t),r|=0;return Math.abs(r).toString(16)}p(e){return!Number.isFinite(e)||e<=0||e<1024?"tiny":e<1024*100?"small":e<1024*1024?"medium":e<1024*1024*10?"large":"huge"}b(e){if(!Number.isFinite(e))return"unknown";let r=Date.now()-e;return r<0?"future":r<1e3*60?"minute":r<1e3*60*60?"hour":r<1e3*60*60*24?"day":r<1e3*60*60*24*7?"week":"old"}};module.exports={IndexWorkerHost}});var{IndexWorkerHost:k}=w(),{getLogger:_}=f(),g=class{constructor(e={}){this._logger=e.logger||_(),this.r=null,this.a=e.wasmPath}async initialize(){return this.r||(this.r=new k({logger:this._logger,wasmPath:this.a}),this._logger.debug("Incremental workers initialized")),this.r}getWorkerHost(){return this.r}isWorkerEnabled(){return this.r?.isEnabled()||!1}async runTask(e,r){return this.r||await this.initialize(),this.r.runTask(e,r)}dispose(){this.r&&(this.r.dispose(),this.r=null,this._logger.debug("Incremental workers disposed"))}};module.exports={IncrementalWorkersManager:g,IndexWorkerHost:k};
