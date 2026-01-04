var u=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports);var l=u((exports,module)=>{var vscode=require("vscode"),isWebRuntime=process.env.VSCODE_WEB==="true",inspectValue=isWebRuntime?a=>{if(typeof a=="string")return a;try{return JSON.stringify(a,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),LOG_LEVEL_ORDER=["debug","info","warn","error"],DEFAULT_CONSOLE_LEVEL="warn",Logger=class{constructor(){this.t=vscode.window.createOutputChannel("Explorer Dates"),this.u=!1,this.a=null,this.n=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this.n)||(this.n=DEFAULT_LOG_PROFILE),this.i=new Map,this.g=DEFAULT_CONSOLE_LEVEL,this.m(),this.a=vscode.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableLogging")||e.affectsConfiguration("explorerDates.consoleLogLevel"))&&this.m()})}m(){let e=vscode.workspace.getConfiguration("explorerDates");this.u=e.get("enableLogging",!1);let t=(e.get("consoleLogLevel",DEFAULT_CONSOLE_LEVEL)||"").toLowerCase();this.g=LOG_LEVEL_ORDER.includes(t)?t:DEFAULT_CONSOLE_LEVEL}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this.n=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this.i.delete(e);return}this.i.clear()}debug(e,...t){this.u&&this.l("debug",null,e,t)}info(e,...t){this.l("info",null,e,t)}infoWithOptions(e,t,...s){this.l("info",e||null,t,s)}warn(e,...t){this.l("warn",null,e,t)}error(e,t,...s){let n=`[${new Date().toISOString()}] [ERROR] ${e}`;this.t.appendLine(n),t instanceof Error?(this.t.appendLine(`Error: ${t.message}`),t.stack&&this.t.appendLine(`Stack: ${t.stack}`)):t&&this.t.appendLine(this.c(t));let r=this.p(s);r.length>0&&r.forEach(o=>this.t.appendLine(this.c(o))),this.f("error",n,[t,...r])}show(){this.t.show()}clear(){this.t.clear()}dispose(){this.t.dispose(),this.a&&(this.a.dispose(),this.a=null),loggerInstance===this&&(loggerInstance=null)}l(e,t,s,i){if(e==="debug"&&!this.u||this.L(e,t))return;let r=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${s}`;this.t.appendLine(r);let o=this.p(i);o.length>0&&o.forEach(d=>this.t.appendLine(this.c(d))),this.f(e,r,o)}p(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(s){return`<<log arg threw: ${s.message}>>`}})}c(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}L(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let s=(t.profile||"stress").toLowerCase();if(!this.E(s))return!1;let i=Number(t.throttleLimit)||50,n=t.throttleKey,r=this.i.get(n)||{count:0,suppressed:0,noticeLogged:!1};if(r.count<i)return r.count+=1,this.i.set(n,r),!1;if(r.suppressed+=1,!r.noticeLogged){r.noticeLogged=!0;let o=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${n}" after ${i} entries (profile=${this.n})`;this.t.appendLine(o),this.f("info",o)}return this.i.set(n,r),!0}E(e){let t=this.n||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}b(e){let t=LOG_LEVEL_ORDER.indexOf(this.g),s=LOG_LEVEL_ORDER.indexOf(e);return t===-1||s===-1?!1:s>=t}f(e,t,s=[]){if(!this.b(e))return;(e==="warn"?console.warn:e==="error"?console.error:console.log).call(console,t,...s)}},loggerInstance=null;function getLogger(){return loggerInstance||(loggerInstance=new Logger),loggerInstance}module.exports={Logger,getLogger}});var c=u((exports,module)=>{var{getLogger}=l(),isWebBuild=process.env.VSCODE_WEB==="true",WebWorkerCtor=typeof globalThis<"u"&&typeof globalThis.Worker=="function"?globalThis.Worker:null,WorkerThreads=null,NodeFs=null,NodePath=null;if(!isWebBuild){try{WorkerThreads=eval("require")("worker_threads")}catch{WorkerThreads=null}try{NodeFs=eval("require")("fs")}catch{NodeFs=null}try{NodePath=eval("require")("path")}catch{NodePath=null}}var DEFAULT_WASM_PATH=(()=>{if(!NodePath)return null;try{return NodePath.join(__dirname,"..","..","assets","wasm","digest.wasm")}catch{return null}})(),PERFORMANCE_REPORT_INTERVAL_MS=3e4,PERFORMANCE_MIN_SAMPLE_COUNT=100,WORKER_SOURCE=`
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
`,IndexWorkerHost=class{constructor(e={}){this.e=e.logger||getLogger(),this.d=this.T(e.wasmPath),this.h=this._(),this.s=null,this.o=new Map,this.O=1,this.h&&(this.s=this.k(),this.s||(this.h=!1)),this.s||this.e.debug("IndexWorkerHost disabled (worker support unavailable)")}isEnabled(){return!!this.s}async runTask(e,t){if(!this.s)return this.R(e,t);let s=this.O++;return new Promise((i,n)=>{this.o.set(s,{resolve:i,reject:n});try{this.S({id:s,task:e,payload:t})}catch(r){this.o.delete(s),n(r)}})}dispose(){this.s&&(isWebBuild?this.s.terminate():this.s.terminate(),this.s=null),this.o.clear()}_(){if(isWebBuild){let e=typeof globalThis.Blob=="function",t=typeof globalThis.URL=="function"||typeof globalThis.URL=="object",s=!!(globalThis.URL&&typeof globalThis.URL.createObjectURL=="function");return!!(WebWorkerCtor&&e&&t&&s)}return!!WorkerThreads}k(){if(isWebBuild){if(!WebWorkerCtor)return this.e.debug("Web Worker constructor unavailable; worker disabled"),this.h=!1,null;let s=new Blob([WORKER_SOURCE],{type:"application/javascript"}),i=globalThis.URL.createObjectURL(s),n=new WebWorkerCtor(i);return n.onmessage=r=>this.w(r.data),n.onerror=r=>this.e.debug("Index worker (web) error",r),n}if(!WorkerThreads||!WorkerThreads.Worker)return this.e.debug("worker_threads unavailable; worker disabled"),this.h=!1,null;let e={eval:!0,workerData:{wasmPath:this.d}},t=new WorkerThreads.Worker(WORKER_SOURCE,e);return t.on("message",s=>this.w(s)),t.on("error",s=>this.e.debug("Index worker error",s)),t}S(e){isWebBuild?this.s.postMessage(e):this.s.postMessage(e)}w(e){if(!e||typeof e!="object")return;if(e.type==="log"){let r=e.level||"info";(typeof this.e[r]=="function"?this.e[r].bind(this.e):this.e.info.bind(this.e))(e.message||"[IndexWorker] log entry",e.details);return}let{id:t,result:s,error:i}=e,n=this.o.get(t);n&&(this.o.delete(t),i?n.reject(new Error(i.message||"Worker task failed")):n.resolve(s))}T(e){let t=e||process.env.EXPLORER_DATES_WASM_PATH||DEFAULT_WASM_PATH;if(!t||!NodeFs)return null;try{if(NodeFs.existsSync(t))return t}catch{}return null}R(e,t){switch(e){case"digest":return Promise.resolve((t||[]).map(s=>this.y(s)));default:return Promise.resolve(t)}}y(e={}){let t=[e.path||"",e.mtimeMs||0,e.size||0].join(":");return{path:e.path,hash:this.P(t),sizeBucket:this.A(e.size),ageBucket:this.W(e.mtimeMs)}}P(e){let t=0;if(!e)return"0";for(let s=0;s<e.length;s++)t=(t<<5)-t+e.charCodeAt(s),t|=0;return Math.abs(t).toString(16)}A(e){return!Number.isFinite(e)||e<=0||e<1024?"tiny":e<1024*100?"small":e<1024*1024?"medium":e<1024*1024*10?"large":"huge"}W(e){if(!Number.isFinite(e))return"unknown";let t=Date.now()-e;return t<0?"future":t<1e3*60?"minute":t<1e3*60*60?"hour":t<1e3*60*60*24?"day":t<1e3*60*60*24*7?"week":"old"}};module.exports={IndexWorkerHost}});var{IndexWorkerHost:f}=c(),{getLogger:g}=l(),h=class{constructor(e={}){this.e=e.logger||g(),this.r=null,this.d=e.wasmPath}async initialize(){return this.r||(this.r=new f({logger:this.e,wasmPath:this.d}),this.e.debug("Incremental workers initialized")),this.r}getWorkerHost(){return this.r}isWorkerEnabled(){return this.r?.isEnabled()||!1}async runTask(e,t){return this.r||await this.initialize(),this.r.runTask(e,t)}dispose(){this.r&&(this.r.dispose(),this.r=null,this.e.debug("Incremental workers disposed"))}};module.exports={IncrementalWorkersManager:h,IndexWorkerHost:f};
