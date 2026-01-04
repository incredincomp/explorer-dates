var module = { exports: {} }; var exports = module.exports; (function() {
var h=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports);var d=h((exports,module)=>{var vscode=require("vscode"),isWebRuntime=process.env.VSCODE_WEB==="true",inspectValue=isWebRuntime?r=>{if(typeof r=="string")return r;try{return JSON.stringify(r,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),LOG_LEVEL_ORDER=["debug","info","warn","error"],DEFAULT_CONSOLE_LEVEL="warn",Logger=class{constructor(){this.s=vscode.window.createOutputChannel("Explorer Dates"),this.f=!1,this.u=null,this.i=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this.i)||(this.i=DEFAULT_LOG_PROFILE),this.o=new Map,this.m=DEFAULT_CONSOLE_LEVEL,this.L(),this.u=vscode.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableLogging")||e.affectsConfiguration("explorerDates.consoleLogLevel"))&&this.L()})}L(){let e=vscode.workspace.getConfiguration("explorerDates");this.f=e.get("enableLogging",!1);let t=(e.get("consoleLogLevel",DEFAULT_CONSOLE_LEVEL)||"").toLowerCase();this.m=LOG_LEVEL_ORDER.includes(t)?t:DEFAULT_CONSOLE_LEVEL}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this.i=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this.o.delete(e);return}this.o.clear()}debug(e,...t){this.f&&this.h("debug",null,e,t)}info(e,...t){this.h("info",null,e,t)}infoWithOptions(e,t,...s){this.h("info",e||null,t,s)}warn(e,...t){this.h("warn",null,e,t)}error(e,t,...s){let i=`[${new Date().toISOString()}] [ERROR] ${e}`;this.s.appendLine(i),t instanceof Error?(this.s.appendLine(`Error: ${t.message}`),t.stack&&this.s.appendLine(`Stack: ${t.stack}`)):t&&this.s.appendLine(this.g(t));let n=this.w(s);n.length>0&&n.forEach(a=>this.s.appendLine(this.g(a))),this.d("error",i,[t,...n])}show(){this.s.show()}clear(){this.s.clear()}dispose(){this.s.dispose(),this.u&&(this.u.dispose(),this.u=null);let e="__explorerDatesLogger";typeof global<"u"&&global[e]===this?global[e]=null:typeof globalThis<"u"&&globalThis[e]===this?globalThis[e]=null:typeof window<"u"&&window[e]===this&&(window[e]=null),loggerInstance===this&&(loggerInstance=null)}h(e,t,s,o){if(e==="debug"&&!this.f||this.E(e,t))return;let n=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${s}`;this.s.appendLine(n);let a=this.w(o);a.length>0&&a.forEach(c=>this.s.appendLine(this.g(c))),this.d(e,n,a)}w(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(s){return`<<log arg threw: ${s.message}>>`}})}g(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}E(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let s=(t.profile||"stress").toLowerCase();if(!this._(s))return!1;let o=Number(t.throttleLimit)||50,i=t.throttleKey,n=this.o.get(i)||{count:0,suppressed:0,noticeLogged:!1};if(n.count<o)return n.count+=1,this.o.set(i,n),!1;if(n.suppressed+=1,!n.noticeLogged){n.noticeLogged=!0;let a=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${i}" after ${o} entries (profile=${this.i})`;this.s.appendLine(a),this.d("info",a)}return this.o.set(i,n),!0}_(e){let t=this.i||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}O(e){let t=LOG_LEVEL_ORDER.indexOf(this.m),s=LOG_LEVEL_ORDER.indexOf(e);return t===-1||s===-1?!1:s>=t}d(e,t,s=[]){if(!this.O(e))return;(e==="warn"?console.warn:e==="error"?console.error:console.log).call(console,t,...s)}},GLOBAL_LOGGER_KEY="__explorerDatesLogger";function getLogger(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new Logger),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new Logger),globalThis[GLOBAL_LOGGER_KEY]):typeof window<"u"?(window[GLOBAL_LOGGER_KEY]||(window[GLOBAL_LOGGER_KEY]=new Logger),window[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new Logger),loggerInstance)}var loggerInstance=null;module.exports={Logger,getLogger}});var b=h(($,w)=>{var C=process.env.VSCODE_WEB==="true",p=null;if(!C)try{let{exec:r}=require("child_process"),{promisify:e}=require("util");p=e(r)}catch{p=null}w.exports={execAsync:p}});var E=h((exports,module)=>{var{getLogger}=d(),isWebBuild=process.env.VSCODE_WEB==="true",WebWorkerCtor=typeof globalThis<"u"&&typeof globalThis.Worker=="function"?globalThis.Worker:null,WorkerThreads=null,NodeFs=null,NodePath=null;if(!isWebBuild){try{WorkerThreads=eval("require")("worker_threads")}catch{WorkerThreads=null}try{NodeFs=eval("require")("fs")}catch{NodeFs=null}try{NodePath=eval("require")("path")}catch{NodePath=null}}var DEFAULT_WASM_PATH=(()=>{if(!NodePath)return null;try{return NodePath.join(__dirname,"..","..","assets","wasm","digest.wasm")}catch{return null}})(),PERFORMANCE_REPORT_INTERVAL_MS=3e4,PERFORMANCE_MIN_SAMPLE_COUNT=100,WORKER_SOURCE=`
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
`,IndexWorkerHost=class{constructor(e={}){this.e=e.logger||getLogger(),this.y=this.T(e.wasmPath),this.c=this.k(),this.r=null,this.a=new Map,this.R=1,this.c&&(this.r=this.S(),this.r||(this.c=!1)),this.r||this.e.debug("IndexWorkerHost disabled (worker support unavailable)")}isEnabled(){return!!this.r}async runTask(e,t){if(!this.r)return this.A(e,t);let s=this.R++;return new Promise((o,i)=>{this.a.set(s,{resolve:o,reject:i});try{this.P({id:s,task:e,payload:t})}catch(n){this.a.delete(s),i(n)}})}dispose(){this.r&&(isWebBuild?this.r.terminate():this.r.terminate(),this.r=null),this.a.clear()}k(){if(isWebBuild){let e=typeof globalThis.Blob=="function",t=typeof globalThis.URL=="function"||typeof globalThis.URL=="object",s=!!(globalThis.URL&&typeof globalThis.URL.createObjectURL=="function");return!!(WebWorkerCtor&&e&&t&&s)}return!!WorkerThreads}S(){if(isWebBuild){if(!WebWorkerCtor)return this.e.debug("Web Worker constructor unavailable; worker disabled"),this.c=!1,null;let s=new Blob([WORKER_SOURCE],{type:"application/javascript"}),o=globalThis.URL.createObjectURL(s),i=new WebWorkerCtor(o);return i.onmessage=n=>this.b(n.data),i.onerror=n=>this.e.debug("Index worker (web) error",n),i}if(!WorkerThreads||!WorkerThreads.Worker)return this.e.debug("worker_threads unavailable; worker disabled"),this.c=!1,null;let e={eval:!0,workerData:{wasmPath:this.y}},t=new WorkerThreads.Worker(WORKER_SOURCE,e);return t.on("message",s=>this.b(s)),t.on("error",s=>this.e.debug("Index worker error",s)),t}P(e){isWebBuild?this.r.postMessage(e):this.r.postMessage(e)}b(e){if(!e||typeof e!="object")return;if(e.type==="log"){let n=e.level||"info";(typeof this.e[n]=="function"?this.e[n].bind(this.e):this.e.info.bind(this.e))(e.message||"[IndexWorker] log entry",e.details);return}let{id:t,result:s,error:o}=e,i=this.a.get(t);i&&(this.a.delete(t),o?i.reject(new Error(o.message||"Worker task failed")):i.resolve(s))}T(e){let t=e||process.env.EXPLORER_DATES_WASM_PATH||DEFAULT_WASM_PATH;if(!t||!NodeFs)return null;try{if(NodeFs.existsSync(t))return t}catch{}return null}A(e,t){switch(e){case"digest":return Promise.resolve((t||[]).map(s=>this.I(s)));default:return Promise.resolve(t)}}I(e={}){let t=[e.path||"",e.mtimeMs||0,e.size||0].join(":");return{path:e.path,hash:this.M(t),sizeBucket:this.C(e.size),ageBucket:this.W(e.mtimeMs)}}M(e){let t=0;if(!e)return"0";for(let s=0;s<e.length;s++)t=(t<<5)-t+e.charCodeAt(s),t|=0;return Math.abs(t).toString(16)}C(e){return!Number.isFinite(e)||e<=0||e<1024?"tiny":e<1024*100?"small":e<1024*1024?"medium":e<1024*1024*10?"large":"huge"}W(e){if(!Number.isFinite(e))return"unknown";let t=Date.now()-e;return t<0?"future":t<1e3*60?"minute":t<1e3*60*60?"hour":t<1e3*60*60*24?"day":t<1e3*60*60*24*7?"week":"old"}};module.exports={IndexWorkerHost}});var y=h((K,O)=>{function l(r=""){return r?r.replace(/\\/g,"/"):""}function W(r=""){let e=l(r);return e?e.split("/").filter(Boolean):[]}function _(r=""){let e=W(r);return e.length?e[e.length-1]:""}function G(r=""){let e=_(r),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}function D(r=""){let e=l(r),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}function v(...r){return l(r.filter(Boolean).join("/")).replace(/\/+/g,"/")}function F(r=""){return l(r).toLowerCase()}function N(r=""){if(!r)return"";if(typeof r=="string")return r;if(typeof r.fsPath=="string"&&r.fsPath.length>0)return r.fsPath;if(typeof r.path=="string"&&r.path.length>0)return r.path;if(typeof r.toString=="function")try{return r.toString(!0)}catch{return r.toString()}return String(r)}function U(r="",e=""){let t=l(r),s=l(e);return t&&s.startsWith(t)?s.substring(t.length).replace(/^\/+/,""):s}O.exports={normalizePath:l,getFileName:_,getExtension:G,getDirectory:D,joinPath:v,getCacheKey:F,getUriPath:N,getRelativePath:U}});var k=h((V,T)=>{var{getLogger:x}=d(),{execAsync:f}=b(),{IndexWorkerHost:B}=E(),{getRelativePath:j}=y(),g=class{constructor(){this.e=x(),this.n=new Map,this.G=1e3,this.t=null,this.p=!1,this.l={gitBlameTimeMs:0,gitBlameCalls:0,cacheHits:0,cacheMisses:0}}async initialize(e={}){if(!this.p){if(this.e.debug("\u{1F527} Initializing Git Insights Manager"),e.enableWorker&&e.enableWasm)try{this.t=new B({logger:this.e}),this.t.isEnabled()?this.e.debug("\u{1F527} Git insights worker host enabled"):(this.t=null,this.e.debug("\u{1F527} Git insights worker host disabled (not supported)"))}catch(t){this.e.debug("\u{1F527} Failed to initialize git insights worker:",t.message),this.t=null}this.p=!0,this.e.debug("\u{1F527} Git Insights Manager initialized")}}dispose(){if(this.t){try{this.t.dispose()}catch(e){this.e.debug("Error disposing git insights worker:",e.message)}this.t=null}this.n.clear(),this.p=!1,this.e.debug("\u{1F527} Git Insights Manager disposed")}async isGitAvailable(){if(!f)return!1;try{return await f("git --version",{timeout:1e3}),!0}catch{return!1}}async getGitBlameInfo(e,t=null){if(!f)return null;try{let s=require("vscode"),o=s.workspace.getWorkspaceFolder(s.Uri.file(e));if(!o)return null;let i=o.uri.fsPath||o.uri.path,n=j(i,e),a=this.D(i,n,t),c=this.v(a);if(c)return this.l.cacheHits++,c;this.l.cacheMisses++;let S=Date.now();try{let{stdout:u}=await f(`git log -1 --format="%H|%an|%ae|%ad" -- "${n}"`,{cwd:o.uri.fsPath,timeout:2e3});if(!u||!u.trim())return null;let[A,P,I,M]=u.trim().split("|"),L={hash:A||"",authorName:P||"Unknown",authorEmail:I||"",authorDate:M||""};return this.F(a,L),L}finally{let u=Date.now()-S;this.l.gitBlameTimeMs+=u,this.l.gitBlameCalls++}}catch(s){return this.e.debug(`Git blame failed for ${e}:`,s.message),null}}getInitials(e){if(!e||typeof e!="string")return null;let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?null:t.length===1?t[0].substring(0,2).toUpperCase():(t[0].charAt(0)+t[1].charAt(0)).toUpperCase()}clearCache(){this.n.clear(),this.e.debug("\u{1F527} Git cache cleared")}getMetrics(){return{...this.l,cacheSize:this.n.size,workerEnabled:!!(this.t&&this.t.isEnabled&&this.t.isEnabled())}}async digestEntry(e){if(!this.t||!this.t.isEnabled())return null;try{let[t]=await this.t.runTask("digest",[e]);return t}catch(t){return this.e.debug("Worker digest failed:",t.message),null}}D(e,t,s){let o=e||"unknown-workspace",i=t||"unknown-relative",n=Number.isFinite(s)?s:"unknown-mtime";return`${o}::${i}::${n}`}v(e){let t=this.n.get(e);return t?(t.lastAccess=Date.now(),t.value):null}F(e,t){if(this.n.size>=this.G){let s=null,o=1/0;for(let[i,n]of this.n.entries())n.lastAccess<o&&(o=n.lastAccess,s=i);s&&this.n.delete(s)}this.n.set(e,{value:t,lastAccess:Date.now()})}},m=null;function H(){return m||(m=new g),m}T.exports={GitInsightsManager:g,getGitInsightsManager:H}});var{getGitInsightsManager:R}=k();module.exports={default:R,getGitInsightsManager:R};
})(); (globalThis.__explorerDatesChunks = globalThis.__explorerDatesChunks || {})["gitInsights"] = module.exports;
