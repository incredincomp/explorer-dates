var module = { exports: {} }; var exports = module.exports; (function() {
var f=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports);var h=f((exports,module)=>{var vscode=require("vscode"),isWebRuntime=process.env.VSCODE_WEB==="true",inspectValue=isWebRuntime?a=>{if(typeof a=="string")return a;try{return JSON.stringify(a,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),LOG_LEVEL_ORDER=["debug","info","warn","error"],DEFAULT_CONSOLE_LEVEL="warn",TEST_CONSOLE_LEVEL=process.env.EXPLORER_DATES_TEST_MODE==="1"?"warn":null,Logger=class{constructor(){this.e=vscode.window.createOutputChannel("Explorer Dates"),this.o=!1,this.a=null,this.l=process.env.EXPLORER_DATES_TEST_MODE==="1",this.r=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this.r)||(this.r=DEFAULT_LOG_PROFILE),this.n=new Map,this.d=DEFAULT_CONSOLE_LEVEL,this.p(),this.a=vscode.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableLogging")||e.affectsConfiguration("explorerDates.consoleLogLevel"))&&this.p()})}p(){let e=vscode.workspace.getConfiguration("explorerDates");this.o=e.get("enableLogging",!1);let t=(process.env.EXPLORER_DATES_LOG_LEVEL||"").toLowerCase(),s=(e.get("consoleLogLevel",DEFAULT_CONSOLE_LEVEL)||"").toLowerCase(),i=TEST_CONSOLE_LEVEL||t||s||DEFAULT_CONSOLE_LEVEL;this.d=LOG_LEVEL_ORDER.includes(i)?i:DEFAULT_CONSOLE_LEVEL,TEST_CONSOLE_LEVEL&&(this.o=!1)}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this.r=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this.n.delete(e);return}this.n.clear()}debug(e,...t){this.o&&this.h("debug",null,e,t)}info(e,...t){this.h("info",null,e,t)}infoWithOptions(e,t,...s){this.h("info",e||null,t,s)}warn(e,...t){this.h("warn",null,e,t)}error(e,t,...s){let n=`[${new Date().toISOString()}] [ERROR] ${e}`;this.l||(this.e.appendLine(n),t instanceof Error?(this.e.appendLine(`Error: ${t.message}`),t.stack&&this.e.appendLine(`Stack: ${t.stack}`)):t&&this.e.appendLine(this.f(t)));let r=this.L(s);r.length>0&&!this.l&&r.forEach(l=>this.e.appendLine(this.f(l)));let o=[];t!=null&&o.push(t),r.length>0&&o.push(...r),this.c("error",n,o)}show(){this.e.show()}clear(){this.e.clear()}dispose(){this.e.dispose(),this.a&&(this.a.dispose(),this.a=null);let e="__explorerDatesLogger";typeof global<"u"&&global[e]===this?global[e]=null:typeof globalThis<"u"&&globalThis[e]===this?globalThis[e]=null:typeof globalThis<"u"&&globalThis.window?.[e]===this&&(globalThis.window[e]=null),loggerInstance===this&&(loggerInstance=null)}h(e,t,s,i){if(e==="debug"&&!this.o||this.E(e,t))return;let r=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${s}`;this.l||this.e.appendLine(r);let o=this.L(i);o.length>0&&!this.l&&o.forEach(l=>this.e.appendLine(this.f(l))),this.c(e,r,o)}L(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(s){return`<<log arg threw: ${s.message}>>`}})}f(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}E(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let s=(t.profile||"stress").toLowerCase();if(!this._(s))return!1;let i=Number(t.throttleLimit)||50,n=t.throttleKey,r=this.n.get(n)||{count:0,suppressed:0,noticeLogged:!1};if(r.count<i)return r.count+=1,this.n.set(n,r),!1;if(r.suppressed+=1,!r.noticeLogged){r.noticeLogged=!0;let o=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${n}" after ${i} entries (profile=${this.r})`;this.e.appendLine(o),this.c("info",o)}return this.n.set(n,r),!0}_(e){let t=this.r||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}w(e){let t=LOG_LEVEL_ORDER.indexOf(this.d),s=LOG_LEVEL_ORDER.indexOf(e);return t===-1||s===-1?!1:s>=t}c(e,t,s=[]){if(!this.w(e))return;(e==="warn"?console.warn:e==="error"?console.error:console.log).call(console,t,...s)}},GLOBAL_LOGGER_KEY="__explorerDatesLogger";function getLogger(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new Logger),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new Logger),globalThis.window&&(globalThis.window[GLOBAL_LOGGER_KEY]=globalThis[GLOBAL_LOGGER_KEY]),globalThis[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new Logger),loggerInstance)}var loggerInstance=null;module.exports={Logger,getLogger}});var c=f((exports,module)=>{var{getLogger}=h(),isWebBuild=process.env.VSCODE_WEB==="true",WebWorkerCtor=typeof globalThis<"u"&&typeof globalThis.Worker=="function"?globalThis.Worker:null,WorkerThreads=null,NodeFs=null,NodePath=null;if(!isWebBuild){try{WorkerThreads=eval("require")("worker_threads")}catch{WorkerThreads=null}try{NodeFs=eval("require")("fs")}catch{NodeFs=null}try{NodePath=eval("require")("path")}catch{NodePath=null}}var DEFAULT_WASM_PATH=(()=>{if(!NodePath)return null;try{return NodePath.join(__dirname,"..","..","assets","wasm","digest.wasm")}catch{return null}})(),PERFORMANCE_REPORT_INTERVAL_MS=3e4,PERFORMANCE_MIN_SAMPLE_COUNT=100,WORKER_SOURCE=`
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
`,IndexWorkerHost=class{constructor(e={}){this._logger=e.logger||getLogger(),this.g=this.b(e.wasmPath),this.u=this.O(),this.t=null,this.i=new Map,this.T=1,this.u&&(this.t=this.R(),this.t||(this.u=!1)),this.t||this._logger.debug("IndexWorkerHost disabled (worker support unavailable)")}isEnabled(){return!!this.t}async runTask(e,t){if(!this.t)return this.S(e,t);let s=this.T++;return new Promise((i,n)=>{this.i.set(s,{resolve:i,reject:n});try{this.k({id:s,task:e,payload:t})}catch(r){this.i.delete(s),n(r)}})}dispose(){this.t&&(isWebBuild?this.t.terminate():this.t.terminate(),this.t=null),this.i.clear()}O(){if(isWebBuild){let e=typeof globalThis.Blob=="function",t=typeof globalThis.URL=="function"||typeof globalThis.URL=="object",s=!!(globalThis.URL&&typeof globalThis.URL.createObjectURL=="function");return!!(WebWorkerCtor&&e&&t&&s)}return!!WorkerThreads}R(){if(isWebBuild){if(!WebWorkerCtor)return this._logger.debug("Web Worker constructor unavailable; worker disabled"),this.u=!1,null;let s=new Blob([WORKER_SOURCE],{type:"application/javascript"}),i=globalThis.URL.createObjectURL(s),n=new WebWorkerCtor(i);return n.onmessage=r=>this.m(r.data),n.onerror=r=>this._logger.debug("Index worker (web) error",r),n}if(!WorkerThreads||!WorkerThreads.Worker)return this._logger.debug("worker_threads unavailable; worker disabled"),this.u=!1,null;let e={eval:!0,workerData:{wasmPath:this.g}},t=new WorkerThreads.Worker(WORKER_SOURCE,e);return t.on("message",s=>this.m(s)),t.on("error",s=>this._logger.debug("Index worker error",s)),t}k(e){isWebBuild?this.t.postMessage(e):this.t.postMessage(e)}m(e){if(!e||typeof e!="object")return;if(e.type==="log"){let r=e.level||"info";(typeof this._logger[r]=="function"?this._logger[r].bind(this._logger):this._logger.info.bind(this._logger))(e.message||"[IndexWorker] log entry",e.details);return}let{id:t,result:s,error:i}=e,n=this.i.get(t);n&&(this.i.delete(t),i?n.reject(new Error(i.message||"Worker task failed")):n.resolve(s))}b(e){let t=e||process.env.EXPLORER_DATES_WASM_PATH||DEFAULT_WASM_PATH;if(!t||!NodeFs)return null;try{if(NodeFs.existsSync(t))return t}catch{}return null}S(e,t){switch(e){case"digest":return Promise.resolve((t||[]).map(s=>this.A(s)));default:return Promise.resolve(t)}}A(e={}){let t=[e.path||"",e.mtimeMs||0,e.size||0].join(":");return{path:e.path,hash:this.y(t),sizeBucket:this.P(e.size),ageBucket:this.C(e.mtimeMs)}}y(e){let t=0;if(!e)return"0";for(let s=0;s<e.length;s++)t=(t<<5)-t+e.charCodeAt(s),t|=0;return Math.abs(t).toString(16)}P(e){return!Number.isFinite(e)||e<=0||e<1024?"tiny":e<1024*100?"small":e<1024*1024?"medium":e<1024*1024*10?"large":"huge"}C(e){if(!Number.isFinite(e))return"unknown";let t=Date.now()-e;return t<0?"future":t<1e3*60?"minute":t<1e3*60*60?"hour":t<1e3*60*60*24?"day":t<1e3*60*60*24*7?"week":"old"}};module.exports={IndexWorkerHost}});var{IndexWorkerHost:g}=c(),{getLogger:d}=h(),u=class{constructor(e={}){this._logger=e.logger||d(),this.s=null,this.g=e.wasmPath}async initialize(){return this.s||(this.s=new g({logger:this._logger,wasmPath:this.g}),this._logger.debug("Incremental workers initialized")),this.s}getWorkerHost(){return this.s}isWorkerEnabled(){return this.s?.isEnabled()||!1}async runTask(e,t){return this.s||await this.initialize(),this.s.runTask(e,t)}dispose(){this.s&&(this.s.dispose(),this.s=null,this._logger.debug("Incremental workers disposed"))}};module.exports={IncrementalWorkersManager:u,IndexWorkerHost:g};
})(); (function(){const primaryKey="explorerDatesChunks";const legacyKey="__explorerDatesChunks";const registry=(globalThis[primaryKey]=globalThis[primaryKey]||globalThis[legacyKey]||(globalThis[legacyKey]={}));registry["incrementalWorkers"]=module.exports;})();
