var u=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports);var d=u((exports,module)=>{var vscode=require("vscode"),isWebRuntime=process.env.VSCODE_WEB==="true",inspectValue=isWebRuntime?r=>{if(typeof r=="string")return r;try{return JSON.stringify(r,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),LOG_LEVEL_ORDER=["debug","info","warn","error"],DEFAULT_CONSOLE_LEVEL="warn",TEST_CONSOLE_LEVEL=process.env.EXPLORER_DATES_TEST_MODE==="1"?"warn":null,Logger=class{constructor(){this.t=vscode.window.createOutputChannel("Explorer Dates"),this.a=!1,this.l=null,this.h=process.env.EXPLORER_DATES_TEST_MODE==="1",this.i=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this.i)||(this.i=DEFAULT_LOG_PROFILE),this.n=new Map,this.p=DEFAULT_CONSOLE_LEVEL,this.m(),this.l=vscode.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableLogging")||e.affectsConfiguration("explorerDates.consoleLogLevel"))&&this.m()})}m(){let e=vscode.workspace.getConfiguration("explorerDates");this.a=e.get("enableLogging",!1);let t=(process.env.EXPLORER_DATES_LOG_LEVEL||"").toLowerCase(),s=(e.get("consoleLogLevel",DEFAULT_CONSOLE_LEVEL)||"").toLowerCase(),n=TEST_CONSOLE_LEVEL||t||s||DEFAULT_CONSOLE_LEVEL;this.p=LOG_LEVEL_ORDER.includes(n)?n:DEFAULT_CONSOLE_LEVEL,TEST_CONSOLE_LEVEL&&(this.a=!1)}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this.i=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this.n.delete(e);return}this.n.clear()}debug(e,...t){this.a&&this.c("debug",null,e,t)}info(e,...t){this.c("info",null,e,t)}infoWithOptions(e,t,...s){this.c("info",e||null,t,s)}warn(e,...t){this.c("warn",null,e,t)}error(e,t,...s){let o=`[${new Date().toISOString()}] [ERROR] ${e}`;this.h||(this.t.appendLine(o),t instanceof Error?(this.t.appendLine(`Error: ${t.message}`),t.stack&&this.t.appendLine(`Stack: ${t.stack}`)):t&&this.t.appendLine(this.g(t)));let i=this.E(s);i.length>0&&!this.h&&i.forEach(h=>this.t.appendLine(this.g(h)));let a=[];t!=null&&a.push(t),i.length>0&&a.push(...i),this.d("error",o,a)}show(){this.t.show()}clear(){this.t.clear()}dispose(){this.t.dispose(),this.l&&(this.l.dispose(),this.l=null);let e="__explorerDatesLogger";typeof global<"u"&&global[e]===this?global[e]=null:typeof globalThis<"u"&&globalThis[e]===this?globalThis[e]=null:typeof globalThis<"u"&&globalThis.window?.[e]===this&&(globalThis.window[e]=null),loggerInstance===this&&(loggerInstance=null)}c(e,t,s,n){if(e==="debug"&&!this.a||this._(e,t))return;let i=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${s}`;this.h||this.t.appendLine(i);let a=this.E(n);a.length>0&&!this.h&&a.forEach(h=>this.t.appendLine(this.g(h))),this.d(e,i,a)}E(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(s){return`<<log arg threw: ${s.message}>>`}})}g(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}_(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let s=(t.profile||"stress").toLowerCase();if(!this.w(s))return!1;let n=Number(t.throttleLimit)||50,o=t.throttleKey,i=this.n.get(o)||{count:0,suppressed:0,noticeLogged:!1};if(i.count<n)return i.count+=1,this.n.set(o,i),!1;if(i.suppressed+=1,!i.noticeLogged){i.noticeLogged=!0;let a=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${o}" after ${n} entries (profile=${this.i})`;this.t.appendLine(a),this.d("info",a)}return this.n.set(o,i),!0}w(e){let t=this.i||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}b(e){let t=LOG_LEVEL_ORDER.indexOf(this.p),s=LOG_LEVEL_ORDER.indexOf(e);return t===-1||s===-1?!1:s>=t}d(e,t,s=[]){if(!this.b(e))return;(e==="warn"?console.warn:e==="error"?console.error:console.log).call(console,t,...s)}},GLOBAL_LOGGER_KEY="__explorerDatesLogger";function getLogger(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new Logger),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new Logger),globalThis.window&&(globalThis.window[GLOBAL_LOGGER_KEY]=globalThis[GLOBAL_LOGGER_KEY]),globalThis[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new Logger),loggerInstance)}var loggerInstance=null;module.exports={Logger,getLogger}});var w=u(($,_)=>{var D=process.env.VSCODE_WEB==="true",p=null;if(!D)try{let{exec:r}=require("child_process"),{promisify:e}=require("util");p=e(r)}catch{p=null}_.exports={execAsync:p}});var b=u((exports,module)=>{var{getLogger}=d(),isWebBuild=process.env.VSCODE_WEB==="true",WebWorkerCtor=typeof globalThis<"u"&&typeof globalThis.Worker=="function"?globalThis.Worker:null,WorkerThreads=null,NodeFs=null,NodePath=null;if(!isWebBuild){try{WorkerThreads=eval("require")("worker_threads")}catch{WorkerThreads=null}try{NodeFs=eval("require")("fs")}catch{NodeFs=null}try{NodePath=eval("require")("path")}catch{NodePath=null}}var DEFAULT_WASM_PATH=(()=>{if(!NodePath)return null;try{return NodePath.join(__dirname,"..","..","assets","wasm","digest.wasm")}catch{return null}})(),PERFORMANCE_REPORT_INTERVAL_MS=3e4,PERFORMANCE_MIN_SAMPLE_COUNT=100,WORKER_SOURCE=`
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
`,IndexWorkerHost=class{constructor(e={}){this._logger=e.logger||getLogger(),this.T=this.O(e.wasmPath),this.u=this.S(),this.s=null,this.o=new Map,this.R=1,this.u&&(this.s=this.y(),this.s||(this.u=!1)),this.s||this._logger.debug("IndexWorkerHost disabled (worker support unavailable)")}isEnabled(){return!!this.s}async runTask(e,t){if(!this.s)return this.A(e,t);let s=this.R++;return new Promise((n,o)=>{this.o.set(s,{resolve:n,reject:o});try{this.k({id:s,task:e,payload:t})}catch(i){this.o.delete(s),o(i)}})}dispose(){this.s&&(isWebBuild?this.s.terminate():this.s.terminate(),this.s=null),this.o.clear()}S(){if(isWebBuild){let e=typeof globalThis.Blob=="function",t=typeof globalThis.URL=="function"||typeof globalThis.URL=="object",s=!!(globalThis.URL&&typeof globalThis.URL.createObjectURL=="function");return!!(WebWorkerCtor&&e&&t&&s)}return!!WorkerThreads}y(){if(isWebBuild){if(!WebWorkerCtor)return this._logger.debug("Web Worker constructor unavailable; worker disabled"),this.u=!1,null;let s=new Blob([WORKER_SOURCE],{type:"application/javascript"}),n=globalThis.URL.createObjectURL(s),o=new WebWorkerCtor(n);return o.onmessage=i=>this.L(i.data),o.onerror=i=>this._logger.debug("Index worker (web) error",i),o}if(!WorkerThreads||!WorkerThreads.Worker)return this._logger.debug("worker_threads unavailable; worker disabled"),this.u=!1,null;let e={eval:!0,workerData:{wasmPath:this.T}},t=new WorkerThreads.Worker(WORKER_SOURCE,e);return t.on("message",s=>this.L(s)),t.on("error",s=>this._logger.debug("Index worker error",s)),t}k(e){isWebBuild?this.s.postMessage(e):this.s.postMessage(e)}L(e){if(!e||typeof e!="object")return;if(e.type==="log"){let i=e.level||"info";(typeof this._logger[i]=="function"?this._logger[i].bind(this._logger):this._logger.info.bind(this._logger))(e.message||"[IndexWorker] log entry",e.details);return}let{id:t,result:s,error:n}=e,o=this.o.get(t);o&&(this.o.delete(t),n?o.reject(new Error(n.message||"Worker task failed")):o.resolve(s))}O(e){let t=e||process.env.EXPLORER_DATES_WASM_PATH||DEFAULT_WASM_PATH;if(!t||!NodeFs)return null;try{if(NodeFs.existsSync(t))return t}catch{}return null}A(e,t){switch(e){case"digest":return Promise.resolve((t||[]).map(s=>this.P(s)));default:return Promise.resolve(t)}}P(e={}){let t=[e.path||"",e.mtimeMs||0,e.size||0].join(":");return{path:e.path,hash:this.I(t),sizeBucket:this.C(e.size),ageBucket:this.M(e.mtimeMs)}}I(e){let t=0;if(!e)return"0";for(let s=0;s<e.length;s++)t=(t<<5)-t+e.charCodeAt(s),t|=0;return Math.abs(t).toString(16)}C(e){return!Number.isFinite(e)||e<=0||e<1024?"tiny":e<1024*100?"small":e<1024*1024?"medium":e<1024*1024*10?"large":"huge"}M(e){if(!Number.isFinite(e))return"unknown";let t=Date.now()-e;return t<0?"future":t<1e3*60?"minute":t<1e3*60*60?"hour":t<1e3*60*60*24?"day":t<1e3*60*60*24*7?"week":"old"}};module.exports={IndexWorkerHost}});var S=u((K,O)=>{function l(r=""){return r?r.replace(/\\/g,"/"):""}function W(r=""){let e=l(r);return e?e.split("/").filter(Boolean):[]}function T(r=""){let e=W(r);return e.length?e[e.length-1]:""}function v(r=""){let e=T(r),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}function G(r=""){let e=l(r),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}function N(...r){return l(r.filter(Boolean).join("/")).replace(/\/+/g,"/")}function F(r=""){return l(r).toLowerCase()}function U(r=""){if(!r)return"";if(typeof r=="string")return r;if(typeof r.fsPath=="string"&&r.fsPath.length>0)return r.fsPath;if(typeof r.path=="string"&&r.path.length>0)return r.path;if(typeof r.toString=="function")try{return r.toString(!0)}catch{return r.toString()}return String(r)}function B(r="",e=""){let t=l(r),s=l(e);return t&&s.startsWith(t)?s.substring(t.length).replace(/^\/+/,""):s}O.exports={normalizePath:l,getFileName:T,getExtension:v,getDirectory:G,joinPath:N,getCacheKey:F,getUriPath:U,getRelativePath:B}});var y=u((q,R)=>{var{getLogger:x}=d(),{execAsync:f}=w(),{IndexWorkerHost:j}=b(),{getRelativePath:H}=S(),m=process.env.EXPLORER_DATES_DISABLE_GIT_FEATURES==="1",g=class{constructor(){this._logger=x(),this.r=new Map,this.D=1e3,this.e=null,this.f=!1,this._metrics={gitBlameTimeMs:0,gitBlameCalls:0,cacheHits:0,cacheMisses:0}}async initialize(e={}){if(!this.f){if(m){this._logger.debug("\u{1F527} Git insights disabled via EXPLORER_DATES_DISABLE_GIT_FEATURES"),this.f=!0;return}if(this._logger.debug("\u{1F527} Initializing Git Insights Manager"),e.enableWorker&&e.enableWasm)try{this.e=new j({logger:this._logger}),this.e.isEnabled()?this._logger.debug("\u{1F527} Git insights worker host enabled"):(this.e=null,this._logger.debug("\u{1F527} Git insights worker host disabled (not supported)"))}catch(t){this._logger.debug("\u{1F527} Failed to initialize git insights worker:",t.message),this.e=null}this.f=!0,this._logger.debug("\u{1F527} Git Insights Manager initialized")}}dispose(){if(this.e){try{this.e.dispose()}catch(e){this._logger.debug("Error disposing git insights worker:",e.message)}this.e=null}this.r.clear(),this.f=!1,this._logger.debug("\u{1F527} Git Insights Manager disposed")}async isGitAvailable(){if(m||!f)return!1;try{return await f("git --version",{timeout:1e3}),!0}catch{return!1}}async getGitBlameInfo(e,t=null){if(m||!f)return null;try{let s=require("vscode"),n=s.workspace.getWorkspaceFolder(s.Uri.file(e));if(!n)return null;let o=n.uri.fsPath||n.uri.path,i=H(o,e),a=this.W(o,i,t),h=this.v(a);if(h)return this._metrics.cacheHits++,h;this._metrics.cacheMisses++;let k=Date.now();try{let{stdout:c}=await f(`git log -1 --format="%H|%an|%ae|%ad" -- "${i}"`,{cwd:n.uri.fsPath,timeout:2e3});if(!c||!c.trim())return null;let[P,I,C,M]=c.trim().split("|"),L={hash:P||"",authorName:I||"Unknown",authorEmail:C||"",authorDate:M||""};return this.G(a,L),L}finally{let c=Date.now()-k;this._metrics.gitBlameTimeMs+=c,this._metrics.gitBlameCalls++}}catch(s){return this._logger.debug(`Git blame failed for ${e}:`,s.message),null}}getInitials(e){if(!e||typeof e!="string")return null;let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?null:t.length===1?t[0].substring(0,2).toUpperCase():(t[0].charAt(0)+t[1].charAt(0)).toUpperCase()}clearCache(){this.r.clear(),this._logger.debug("\u{1F527} Git cache cleared")}getMetrics(){return{...this._metrics,cacheSize:this.r.size,workerEnabled:!!(this.e&&this.e.isEnabled&&this.e.isEnabled())}}async digestEntry(e){if(!this.e||!this.e.isEnabled())return null;try{let[t]=await this.e.runTask("digest",[e]);return t}catch(t){return this._logger.debug("Worker digest failed:",t.message),null}}W(e,t,s){let n=e||"unknown-workspace",o=t||"unknown-relative",i=Number.isFinite(s)?s:"unknown-mtime";return`${n}::${o}::${i}`}v(e){let t=this.r.get(e);return t?(t.lastAccess=Date.now(),t.value):null}G(e,t){if(this.r.size>=this.D){let s=null,n=1/0;for(let[o,i]of this.r.entries())i.lastAccess<n&&(n=i.lastAccess,s=o);s&&this.r.delete(s)}this.r.set(e,{value:t,lastAccess:Date.now()})}},E=null;function z(){return E||(E=new g),E}R.exports={GitInsightsManager:g,getGitInsightsManager:z}});var{getGitInsightsManager:A}=y();module.exports={default:A,getGitInsightsManager:A};
