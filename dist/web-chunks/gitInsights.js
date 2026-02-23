var module = { exports: {} }; var exports = module.exports; (function() {
var g=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports);var T=g((ne,R)=>{var d="__explorerDatesLogger",m=class{constructor(){this.n=null}i(e,t){if(this.n&&typeof this.n[e]=="function")try{return this.n[e](...t)}catch{}switch(e){case"debug":break;case"info":break;case"warn":break;case"error":break;default:break}}debug(...e){return this.i("debug",e)}info(...e){return this.i("info",e)}warn(...e){return this.i("warn",e)}error(...e){return this.i("error",e)}S(e){this.n=e}};function H(){return typeof global<"u"?(global[d]||(global[d]=new m),global[d]):typeof globalThis<"u"?(globalThis[d]||(globalThis[d]=new m),globalThis[d]):(y||(y=new m),y)}var _=class extends m{},y=null;R.exports={Logger:_,getLogger:H}});var W=g((ie,A)=>{var z=typeof process<"u"&&process.env?process.env:{},F=z.VSCODE_WEB==="true",E=null;if(!F)try{let{exec:r}=require("child_process"),{promisify:e}=require("util");E=e(r)}catch{E=null}A.exports={execAsync:E}});var I=g((exports,module)=>{var{getLogger}=T(),env=typeof process<"u"&&process.env?process.env:{},isWebBuild=env.VSCODE_WEB==="true",WebWorkerCtor=typeof globalThis<"u"&&typeof globalThis.Worker=="function"?globalThis.Worker:null,WorkerThreads=null,NodeFs=null,NodePath=null;if(!isWebBuild){try{WorkerThreads=eval("require")("worker_threads")}catch{WorkerThreads=null}try{NodeFs=eval("require")("fs")}catch{NodeFs=null}try{NodePath=eval("require")("path")}catch{NodePath=null}}var DEFAULT_WASM_PATH=(()=>{if(!NodePath)return null;try{return NodePath.join(__dirname,"..","..","assets","wasm","digest.wasm")}catch{return null}})(),PERFORMANCE_REPORT_INTERVAL_MS=3e4,PERFORMANCE_MIN_SAMPLE_COUNT=100,WORKER_SOURCE=`
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
`,IndexWorkerHost=class{constructor(e={}){this._logger=e.logger||getLogger(),this.c=this.u(e.wasmPath),this.o=this.h(),this.t=null,this.s=new Map,this.f=1,this.o&&(this.t=this.g(),this.t||(this.o=!1)),this.t||this._logger.debug("IndexWorkerHost disabled (worker support unavailable)")}isEnabled(){return!!this.t}async runTask(e,t){if(!this.t)return this.d(e,t);let s=this.f++;return new Promise((i,o)=>{this.s.set(s,{resolve:i,reject:o});try{this.m({id:s,task:e,payload:t})}catch(l){this.s.delete(s),o(l)}})}async dispose(){if(this.t){try{await this.t.terminate()}catch(e){this._logger.debug("Error terminating worker:",e)}this.t=null}this.s.clear()}h(){if(isWebBuild){let e=typeof globalThis.Blob=="function",t=typeof globalThis.URL=="function"||typeof globalThis.URL=="object",s=!!(globalThis.URL&&typeof globalThis.URL.createObjectURL=="function");return!!(WebWorkerCtor&&e&&t&&s)}return!!WorkerThreads}g(){if(isWebBuild){if(!WebWorkerCtor)return this._logger.debug("Web Worker constructor unavailable; worker disabled"),this.o=!1,null;let s=new Blob([WORKER_SOURCE],{type:"application/javascript"}),i=globalThis.URL.createObjectURL(s),o=new WebWorkerCtor(i);return o.onmessage=l=>this.l(l.data),o.onerror=l=>this._logger.debug("Index worker (web) error",l),o}if(!WorkerThreads||!WorkerThreads.Worker)return this._logger.debug("worker_threads unavailable; worker disabled"),this.o=!1,null;try{let i=(new Error("Worker creation stack").stack||"").split(`
`).slice(2,8).join(`
`)}catch{}let e={eval:!0,workerData:{wasmPath:this.c}},t=new WorkerThreads.Worker(WORKER_SOURCE,e);return t.on("message",s=>this.l(s)),t.on("error",s=>this._logger.debug("Index worker error",s)),t}m(e){isWebBuild?this.t.postMessage(e):this.t.postMessage(e)}l(e){if(!e||typeof e!="object")return;if(e.type==="log"){let l=e.level||"info";(typeof this._logger[l]=="function"?this._logger[l].bind(this._logger):this._logger.info.bind(this._logger))(e.message||"[IndexWorker] log entry",e.details);return}let{id:t,result:s,error:i}=e,o=this.s.get(t);o&&(this.s.delete(t),i?o.reject(new Error(i.message||"Worker task failed")):o.resolve(s))}u(e){let t=e||env.EXPLORER_DATES_WASM_PATH||DEFAULT_WASM_PATH;if(!t||!NodeFs)return null;try{if(NodeFs.existsSync(t))return t}catch{}return null}d(e,t){return e==="digest"?Promise.resolve((t||[]).map(s=>this.p(s))):Promise.resolve(t)}p(e={}){let t=[e.path||"",e.mtimeMs||0,e.size||0].join(":");return{path:e.path,hash:this.b(t),sizeBucket:this.w(e.size),ageBucket:this.k(e.mtimeMs)}}b(e){let t=0;if(!e)return"0";for(let s=0;s<e.length;s++)t=(t<<5)-t+e.charCodeAt(s),t|=0;return Math.abs(t).toString(16)}w(e){return!Number.isFinite(e)||e<=0||e<1024?"tiny":e<1024*100?"small":e<1024*1024?"medium":e<1024*1024*10?"large":"huge"}k(e){if(!Number.isFinite(e))return"unknown";let t=Date.now()-e;return t<0?"future":t<1e3*60?"minute":t<1e3*60*60?"hour":t<1e3*60*60*24?"day":t<1e3*60*60*24*7?"week":"old"}};module.exports={IndexWorkerHost}});var x=g((oe,N)=>{function q(){return typeof Date=="function"&&Date.now?Date.now():16409952e5}function v(r){return!!(r&&typeof r=="object"&&typeof r.getTime=="function")}function G(r){if(v(r))return r;if(typeof r=="number")return new Date(r);if(typeof r=="string"){let e=Date.parse(r);return isNaN(e)?new Date:new Date(e)}return new Date}function u(r=""){return r?r.replace(/\\/g,"/"):""}function K(r=""){let e=u(r);return e?e.split("/").filter(Boolean):[]}function C(r=""){let e=K(r);return e.length?e[e.length-1]:""}function $(r=""){let e=C(r),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}function V(r=""){let e=u(r),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}function X(...r){return u(r.filter(Boolean).join("/")).replace(/\/+/g,"/")}function J(r=""){return u(r).toLowerCase()}function Y(r=""){if(!r)return"";if(typeof r=="string")return r;if(typeof r.fsPath=="string"&&r.fsPath.length>0)return r.fsPath;if(typeof r.path=="string"&&r.path.length>0)return r.path;if(typeof r.toString=="function")try{return r.toString(!0)}catch{return r.toString()}return String(r)}function Q(r="",e=""){let t=u(r),s=u(e);return t&&s.startsWith(t)?s.substring(t.length).replace(/^\/+/,""):s}N.exports={ensureDate:G,isDateLike:v,getCurrentTimestamp:q,normalizePath:u,getFileName:C,getExtension:$,getDirectory:V,joinPath:X,getCacheKey:J,getUriPath:Y,getRelativePath:Q}});var L=g((exports,module)=>{var chunk=null;try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){try{chunk=dynamicRequire("../chunks/utils-shared-chunk")}catch{}try{chunk||(chunk=dynamicRequire("./chunks/utils-shared-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("../chunks/path-utils-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("./chunks/path-utils-chunk"))}catch{}}}catch{}if(chunk&&chunk.normalizePath)module.exports={normalizePath:chunk.normalizePath,getFileName:chunk.getFileName,getExtension:chunk.getExtension,getDirectory:chunk.getDirectory,joinPath:chunk.joinPath,getCacheKey:chunk.getCacheKey,getUriPath:chunk.getUriPath,getRelativePath:chunk.getRelativePath};else{let r=function(n=""){return n?n.replace(/\\/g,"/"):""},e=function(n=""){let a=r(n);return a?a.split("/").filter(Boolean):[]},t=function(n=""){let a=e(n);return a.length?a[a.length-1]:""},s=function(n=""){let a=t(n),c=a.lastIndexOf(".");return c<=0?"":a.substring(c).toLowerCase()},i=function(n=""){let a=r(n),c=a.lastIndexOf("/");return c===-1?"":a.substring(0,c)},o=function(...n){return r(n.filter(Boolean).join("/")).replace(/\/+/g,"/")},l=function(n=""){return r(n).toLowerCase()},h=function(n=""){if(!n)return"";if(typeof n=="string")return n;if(typeof n.fsPath=="string"&&n.fsPath.length>0)return n.fsPath;if(typeof n.path=="string"&&n.path.length>0)return n.path;if(typeof n.toString=="function")try{return n.toString(!0)}catch{return n.toString()}return String(n)},p=function(n="",a=""){let c=r(n),f=r(a);return c&&f.startsWith(c)?f.substring(c.length).replace(/^\/+/,""):f};normalizePath=r,getSegments=e,getFileName=t,getExtension=s,getDirectory=i,joinPath=o,getCacheKey=l,getUriPath=h,getRelativePath=p,module.exports={normalizePath:r,getFileName:t,getExtension:s,getDirectory:i,joinPath:o,getCacheKey:l,getUriPath:h,getRelativePath:p}}var normalizePath,getSegments,getFileName,getExtension,getDirectory,joinPath,getCacheKey,getUriPath,getRelativePath});var j=g((ae,D)=>{var{getLogger:Z}=T(),{execAsync:b}=W(),{IndexWorkerHost:ee}=I(),w;try{let r=x();r&&(w=r.getRelativePath)}catch{}w||(w=L().getRelativePath);var te=typeof process<"u"&&process.env?process.env:{},S=te.EXPLORER_DATES_DISABLE_GIT_FEATURES==="1",k=class{constructor(){this._logger=Z(),this.r=new Map,this.y=1e3,this.e=null,this.a=!1,this._metrics={gitBlameTimeMs:0,gitBlameCalls:0,cacheHits:0,cacheMisses:0}}async initialize(e={}){if(!this.a){if(S){this._logger.debug("\u{1F527} Git insights disabled via EXPLORER_DATES_DISABLE_GIT_FEATURES"),this.a=!0;return}if(this._logger.debug("\u{1F527} Initializing Git Insights Manager"),e.enableWorker&&e.enableWasm)try{this.e=new ee({logger:this._logger}),this.e.isEnabled()?this._logger.debug("\u{1F527} Git insights worker host enabled"):(this.e=null,this._logger.debug("\u{1F527} Git insights worker host disabled (not supported)"))}catch(t){this._logger.debug("\u{1F527} Failed to initialize git insights worker:",t.message),this.e=null}this.a=!0,this._logger.debug("\u{1F527} Git Insights Manager initialized")}}async dispose(){if(this._logger.debug("GitInsightsManager.dispose called"),this.e){try{typeof this.e.dispose=="function"&&(await this.e.dispose(),this._logger.debug("GitInsightsManager: awaited workerHost.dispose()"))}catch(e){this._logger.debug("Error disposing git insights worker:",e.message)}this.e=null}this.r.clear(),this.a=!1,this._logger.debug("\u{1F527} Git Insights Manager disposed")}async isGitAvailable(){if(S||!b)return!1;try{return await b("git --version",{timeout:1e3}),!0}catch{return!1}}async getGitBlameInfo(e,t=null){if(S||!b)return null;try{let s=require("vscode"),i=s.workspace.getWorkspaceFolder(s.Uri.file(e));if(!i)return null;let o=i.uri.fsPath||i.uri.path,l=w(o,e),h=this._(o,l,t),p=this.T(h);if(p)return this._metrics.cacheHits++,p;this._metrics.cacheMisses++;let n=Date.now();try{let{stdout:a}=await b(`git log -1 --format="%H|%an|%ae|%ad" -- "${l}"`,{cwd:i.uri.fsPath,timeout:2e3});if(!a||!a.trim())return null;let[c,f,O,U]=a.trim().split("|"),M={hash:c||"",authorName:f||"Unknown",authorEmail:O||"",authorDate:U||""};return this.E(h,M),M}finally{let a=Date.now()-n;this._metrics.gitBlameTimeMs+=a,this._metrics.gitBlameCalls++}}catch(s){return this._logger.debug(`Git blame failed for ${e}:`,s.message),null}}getInitials(e){if(!e||typeof e!="string")return null;let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?null:t.length===1?t[0].substring(0,2).toUpperCase():(t[0].charAt(0)+t[1].charAt(0)).toUpperCase()}clearCache(){this.r.clear(),this._logger.debug("\u{1F527} Git cache cleared")}getMetrics(){return{...this._metrics,cacheSize:this.r.size,workerEnabled:!!(this.e&&this.e.isEnabled&&this.e.isEnabled())}}async digestEntry(e){if(!this.e||!this.e.isEnabled())return null;try{let[t]=await this.e.runTask("digest",[e]);return t}catch(t){return this._logger.debug("Worker digest failed:",t.message),null}}_(e,t,s){let i=e||"unknown-workspace",o=t||"unknown-relative",l=Number.isFinite(s)?s:"unknown-mtime";return`${i}::${o}::${l}`}T(e){let t=this.r.get(e);return t?(t.lastAccess=Date.now(),t.value):null}E(e,t){if(this.r.size>=this.y){let s=null,i=1/0;for(let[o,l]of this.r.entries())l.lastAccess<i&&(i=l.lastAccess,s=o);s&&this.r.delete(s)}this.r.set(e,{value:t,lastAccess:Date.now()})}},P=null;function re(){return P||(P=new k),P}D.exports={GitInsightsManager:k,getGitInsightsManager:re}});var{getGitInsightsManager:B}=j();module.exports={default:B,getGitInsightsManager:B};
})(); (function(){const primaryKey="explorerDatesChunks";const legacyKey="__explorerDatesChunks";const registry=(globalThis[primaryKey]=globalThis[primaryKey]||globalThis[legacyKey]||(globalThis[legacyKey]={}));registry["gitInsights"]=module.exports;})();
