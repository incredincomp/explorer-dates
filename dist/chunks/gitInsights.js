var __defProp=Object.defineProperty;var __getOwnPropNames=Object.getOwnPropertyNames;var __name=(target,value)=>__defProp(target,"name",{value,configurable:!0});var __commonJS=(cb,mod)=>function(){return mod||(0,cb[__getOwnPropNames(cb)[0]])((mod={exports:{}}).exports,mod),mod.exports};var require_logger=__commonJS({"src/utils/logger.js"(exports2,module2){var GLOBAL_LOGGER_KEY="__explorerDatesLogger",LoggerFacade=class{static{__name(this,"LoggerFacade")}constructor(){this._impl=null}_call(method,args){if(this._impl&&typeof this._impl[method]=="function")try{return this._impl[method](...args)}catch{}switch(method){case"debug":typeof console.debug=="function"?console.debug(...args):console.log(...args);break;case"info":console.log(...args);break;case"warn":console.warn(...args);break;case"error":console.error(...args);break;default:console.log(...args);break}}debug(...args){return this._call("debug",args)}info(...args){return this._call("info",args)}warn(...args){return this._call("warn",args)}error(...args){return this._call("error",args)}_setImpl(impl){this._impl=impl}};function getLogger2(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new LoggerFacade),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new LoggerFacade),globalThis[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new LoggerFacade),loggerInstance)}__name(getLogger2,"getLogger");var Logger=class extends LoggerFacade{static{__name(this,"Logger")}},loggerInstance=null;module2.exports={Logger,getLogger:getLogger2}}});var require_execAsync=__commonJS({"src/utils/execAsync.js"(exports2,module2){var env2=typeof process<"u"&&process.env?process.env:{},isWebEnvironment2=env2.VSCODE_WEB==="true",execAsync=null;if(!isWebEnvironment2)try{let{exec}=require("child_process"),{promisify}=require("util");execAsync=promisify(exec)}catch{execAsync=null}module2.exports={execAsync}}});var require_env=__commonJS({"src/utils/env.js"(exports2,module2){var vscode=require("vscode");function isWebEnvironment2(){try{return vscode?.env?.uiKind===vscode?.UIKind?.Web}catch{return!1}}__name(isWebEnvironment2,"isWebEnvironment");module2.exports={isWebEnvironment:isWebEnvironment2}}});var require_indexWorkerHost=__commonJS({"src/workers/indexWorkerHost.js"(exports,module){var{getLogger}=require_logger(),{isWebEnvironment}=require_env(),env=typeof process<"u"&&process.env?process.env:{},isWebBuild=env.VSCODE_WEB==="true"||isWebEnvironment(),WebWorkerCtor=typeof globalThis<"u"&&typeof globalThis.Worker=="function"?globalThis.Worker:null,WorkerThreads=null,NodeFs=null,NodePath=null;if(!isWebBuild&&typeof process<"u"&&process.versions?.node){try{WorkerThreads=eval("require")("worker_threads")}catch{WorkerThreads=null}try{NodeFs=eval("require")("fs")}catch{NodeFs=null}try{NodePath=eval("require")("path")}catch{NodePath=null}}var DEFAULT_WASM_PATH=(()=>{if(!NodePath)return null;try{return NodePath.join(__dirname,"..","..","assets","wasm","digest.wasm")}catch{return null}})(),PERFORMANCE_REPORT_INTERVAL_MS=3e4,PERFORMANCE_MIN_SAMPLE_COUNT=100,WORKER_SOURCE=`
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
`,IndexWorkerHost=class{static{__name(this,"IndexWorkerHost")}constructor(options={}){this._logger=options.logger||getLogger(),this._wasmPath=this._resolveWasmPath(options.wasmPath),this._enabled=this._detectSupport(),this._worker=null,this._pending=new Map,this._nextId=1,this._enabled&&(this._worker=this._createWorker(),this._worker||(this._enabled=!1)),this._worker||this._logger.debug("IndexWorkerHost disabled (worker support unavailable)")}isEnabled(){return!!this._worker}async runTask(task,payload){if(!this._worker)return this._runInline(task,payload);let id=this._nextId++;return new Promise((resolve,reject)=>{this._pending.set(id,{resolve,reject});try{this._postMessage({id,task,payload})}catch(error){this._pending.delete(id),reject(error)}})}async dispose(){if(this._worker){try{await this._worker.terminate(),console.log("\u{1F41D} IndexWorkerHost: worker.terminate() awaited")}catch(error){this._logger.debug("Error terminating worker:",error)}this._worker=null}this._pending.clear()}_detectSupport(){if(isWebBuild){let hasBlob=typeof globalThis.Blob=="function",hasUrlCtor=typeof globalThis.URL=="function"||typeof globalThis.URL=="object",canCreateObjectUrl=!!(globalThis.URL&&typeof globalThis.URL.createObjectURL=="function");return!!(WebWorkerCtor&&hasBlob&&hasUrlCtor&&canCreateObjectUrl)}return!!WorkerThreads}_createWorker(){if(isWebBuild){if(!WebWorkerCtor)return this._logger.debug("Web Worker constructor unavailable; worker disabled"),this._enabled=!1,null;let blob=new Blob([WORKER_SOURCE],{type:"application/javascript"}),workerUrl=globalThis.URL.createObjectURL(blob),worker2=new WebWorkerCtor(workerUrl);return worker2.onmessage=event=>this._handleMessage(event.data),worker2.onerror=error=>this._logger.debug("Index worker (web) error",error),worker2}if(!WorkerThreads||!WorkerThreads.Worker)return this._logger.debug("worker_threads unavailable; worker disabled"),this._enabled=!1,null;try{let short=(new Error("Worker creation stack").stack||"").split(`
`).slice(2,8).join(`
`);console.log(`\u{1F41D} IndexWorkerHost creating worker. Stack:
`+short)}catch{}let workerOptions={eval:!0,workerData:{wasmPath:this._wasmPath}},worker=new WorkerThreads.Worker(WORKER_SOURCE,workerOptions);return worker.on("message",data=>this._handleMessage(data)),worker.on("error",error=>this._logger.debug("Index worker error",error)),worker}_postMessage(message){isWebBuild?this._worker.postMessage(message):this._worker.postMessage(message)}_handleMessage(message){if(!message||typeof message!="object")return;if(message.type==="log"){let level=message.level||"info";(typeof this._logger[level]=="function"?this._logger[level].bind(this._logger):this._logger.info.bind(this._logger))(message.message||"[IndexWorker] log entry",message.details);return}let{id,result,error}=message,pending=this._pending.get(id);pending&&(this._pending.delete(id),error?pending.reject(new Error(error.message||"Worker task failed")):pending.resolve(result))}_resolveWasmPath(explicitPath){let candidate=explicitPath||env.EXPLORER_DATES_WASM_PATH||DEFAULT_WASM_PATH;if(!candidate||!NodeFs)return null;try{if(NodeFs.existsSync(candidate))return candidate}catch{}return null}_runInline(task,payload){return task==="digest"?Promise.resolve((payload||[]).map(entry=>this._digestEntry(entry))):Promise.resolve(payload)}_digestEntry(entry={}){let hashBase=[entry.path||"",entry.mtimeMs||0,entry.size||0].join(":");return{path:entry.path,hash:this._stableHash(hashBase),sizeBucket:this._bucketSize(entry.size),ageBucket:this._bucketAge(entry.mtimeMs)}}_stableHash(input){let hash=0;if(!input)return"0";for(let i=0;i<input.length;i++)hash=(hash<<5)-hash+input.charCodeAt(i),hash|=0;return Math.abs(hash).toString(16)}_bucketSize(size){return!Number.isFinite(size)||size<=0||size<1024?"tiny":size<1024*100?"small":size<1024*1024?"medium":size<1024*1024*10?"large":"huge"}_bucketAge(mtimeMs){if(!Number.isFinite(mtimeMs))return"unknown";let diff=Date.now()-mtimeMs;return diff<0?"future":diff<1e3*60?"minute":diff<1e3*60*60?"hour":diff<1e3*60*60*24?"day":diff<1e3*60*60*24*7?"week":"old"}};module.exports={IndexWorkerHost}}});var require_utils_shared_chunk=__commonJS({"src/chunks/utils-shared-chunk.js"(exports2,module2){function getCurrentTimestamp(){return typeof Date=="function"&&Date.now?Date.now():16409952e5}__name(getCurrentTimestamp,"getCurrentTimestamp");function isDateLike(value){return!!(value&&typeof value=="object"&&typeof value.getTime=="function")}__name(isDateLike,"isDateLike");function ensureDate(value){if(isDateLike(value))return value;if(typeof value=="number")return new Date(value);if(typeof value=="string"){let parsed=Date.parse(value);return isNaN(parsed)?new Date:new Date(parsed)}return new Date}__name(ensureDate,"ensureDate");function normalizePath2(input=""){return input?input.replace(/\\/g,"/"):""}__name(normalizePath2,"normalizePath");function getSegments2(input=""){let normalized=normalizePath2(input);return normalized?normalized.split("/").filter(Boolean):[]}__name(getSegments2,"getSegments");function getFileName2(input=""){let segments=getSegments2(input);return segments.length?segments[segments.length-1]:""}__name(getFileName2,"getFileName");function getExtension2(input=""){let fileName=getFileName2(input),dotIndex=fileName.lastIndexOf(".");return dotIndex<=0?"":fileName.substring(dotIndex).toLowerCase()}__name(getExtension2,"getExtension");function getDirectory2(input=""){let normalized=normalizePath2(input),lastSlash=normalized.lastIndexOf("/");return lastSlash===-1?"":normalized.substring(0,lastSlash)}__name(getDirectory2,"getDirectory");function joinPath2(...segments){return normalizePath2(segments.filter(Boolean).join("/")).replace(/\/+/g,"/")}__name(joinPath2,"joinPath");function getCacheKey2(input=""){return normalizePath2(input).toLowerCase()}__name(getCacheKey2,"getCacheKey");function getUriPath2(target=""){if(!target)return"";if(typeof target=="string")return target;if(typeof target.fsPath=="string"&&target.fsPath.length>0)return target.fsPath;if(typeof target.path=="string"&&target.path.length>0)return target.path;if(typeof target.toString=="function")try{return target.toString(!0)}catch{return target.toString()}return String(target)}__name(getUriPath2,"getUriPath");function getRelativePath2(base="",target=""){let normalizedBase=normalizePath2(base),normalizedTarget=normalizePath2(target);return normalizedBase&&normalizedTarget.startsWith(normalizedBase)?normalizedTarget.substring(normalizedBase.length).replace(/^\/+/,""):normalizedTarget}__name(getRelativePath2,"getRelativePath");module2.exports={ensureDate,isDateLike,getCurrentTimestamp,normalizePath:normalizePath2,getFileName:getFileName2,getExtension:getExtension2,getDirectory:getDirectory2,joinPath:joinPath2,getCacheKey:getCacheKey2,getUriPath:getUriPath2,getRelativePath:getRelativePath2}}});var require_pathUtils=__commonJS({"src/utils/pathUtils.js"(exports,module){var chunk=null;try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){try{chunk=dynamicRequire("../chunks/utils-shared-chunk")}catch{}try{chunk||(chunk=dynamicRequire("./chunks/utils-shared-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("../chunks/path-utils-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("./chunks/path-utils-chunk"))}catch{}}}catch{}if(chunk&&chunk.normalizePath)module.exports={normalizePath:chunk.normalizePath,getFileName:chunk.getFileName,getExtension:chunk.getExtension,getDirectory:chunk.getDirectory,joinPath:chunk.joinPath,getCacheKey:chunk.getCacheKey,getUriPath:chunk.getUriPath,getRelativePath:chunk.getRelativePath};else{let normalizePath2=function(input=""){return input?input.replace(/\\/g,"/"):""},getSegments2=function(input=""){let normalized=normalizePath2(input);return normalized?normalized.split("/").filter(Boolean):[]},getFileName2=function(input=""){let segments=getSegments2(input);return segments.length?segments[segments.length-1]:""},getExtension2=function(input=""){let fileName=getFileName2(input),dotIndex=fileName.lastIndexOf(".");return dotIndex<=0?"":fileName.substring(dotIndex).toLowerCase()},getDirectory2=function(input=""){let normalized=normalizePath2(input),lastSlash=normalized.lastIndexOf("/");return lastSlash===-1?"":normalized.substring(0,lastSlash)},joinPath2=function(...segments){return normalizePath2(segments.filter(Boolean).join("/")).replace(/\/+/g,"/")},getCacheKey2=function(input=""){return normalizePath2(input).toLowerCase()},getUriPath2=function(target=""){if(!target)return"";if(typeof target=="string")return target;if(typeof target.fsPath=="string"&&target.fsPath.length>0)return target.fsPath;if(typeof target.path=="string"&&target.path.length>0)return target.path;if(typeof target.toString=="function")try{return target.toString(!0)}catch{return target.toString()}return String(target)},getRelativePath2=function(base="",target=""){let normalizedBase=normalizePath2(base),normalizedTarget=normalizePath2(target);return normalizedBase&&normalizedTarget.startsWith(normalizedBase)?normalizedTarget.substring(normalizedBase.length).replace(/^\/+/,""):normalizedTarget};normalizePath=normalizePath2,getSegments=getSegments2,getFileName=getFileName2,getExtension=getExtension2,getDirectory=getDirectory2,joinPath=joinPath2,getCacheKey=getCacheKey2,getUriPath=getUriPath2,getRelativePath=getRelativePath2,__name(normalizePath2,"normalizePath"),__name(getSegments2,"getSegments"),__name(getFileName2,"getFileName"),__name(getExtension2,"getExtension"),__name(getDirectory2,"getDirectory"),__name(joinPath2,"joinPath"),__name(getCacheKey2,"getCacheKey"),__name(getUriPath2,"getUriPath"),__name(getRelativePath2,"getRelativePath"),module.exports={normalizePath:normalizePath2,getFileName:getFileName2,getExtension:getExtension2,getDirectory:getDirectory2,joinPath:joinPath2,getCacheKey:getCacheKey2,getUriPath:getUriPath2,getRelativePath:getRelativePath2}}var normalizePath,getSegments,getFileName,getExtension,getDirectory,joinPath,getCacheKey,getUriPath,getRelativePath}});var require_git_insights_chunk=__commonJS({"src/chunks/git-insights-chunk.js"(exports2,module2){var{getLogger:getLogger2}=require_logger(),{execAsync}=require_execAsync(),{IndexWorkerHost:IndexWorkerHost2}=require_indexWorkerHost(),getRelativePath2;try{let shared=require_utils_shared_chunk();shared&&(getRelativePath2=shared.getRelativePath)}catch{}getRelativePath2||(getRelativePath2=require_pathUtils().getRelativePath);var env2=typeof process<"u"&&process.env?process.env:{},DISABLE_GIT_FEATURES=env2.EXPLORER_DATES_DISABLE_GIT_FEATURES==="1",GitInsightsManager=class{static{__name(this,"GitInsightsManager")}constructor(){this._logger=getLogger2(),this._gitCache=new Map,this._maxGitCacheEntries=1e3,this._workerHost=null,this._initialized=!1,this._metrics={gitBlameTimeMs:0,gitBlameCalls:0,cacheHits:0,cacheMisses:0}}async initialize(options={}){if(!this._initialized){if(DISABLE_GIT_FEATURES){this._logger.debug("\u{1F527} Git insights disabled via EXPLORER_DATES_DISABLE_GIT_FEATURES"),this._initialized=!0;return}if(this._logger.debug("\u{1F527} Initializing Git Insights Manager"),options.enableWorker&&options.enableWasm)try{this._workerHost=new IndexWorkerHost2({logger:this._logger}),this._workerHost.isEnabled()?this._logger.debug("\u{1F527} Git insights worker host enabled"):(this._workerHost=null,this._logger.debug("\u{1F527} Git insights worker host disabled (not supported)"))}catch(error){this._logger.debug("\u{1F527} Failed to initialize git insights worker:",error.message),this._workerHost=null}this._initialized=!0,this._logger.debug("\u{1F527} Git Insights Manager initialized")}}async dispose(){if(this._logger.debug("GitInsightsManager.dispose called"),this._workerHost){try{typeof this._workerHost.dispose=="function"&&(await this._workerHost.dispose(),this._logger.debug("GitInsightsManager: awaited workerHost.dispose()"))}catch(error){this._logger.debug("Error disposing git insights worker:",error.message)}this._workerHost=null}this._gitCache.clear(),this._initialized=!1,this._logger.debug("\u{1F527} Git Insights Manager disposed")}async isGitAvailable(){if(DISABLE_GIT_FEATURES||!execAsync)return!1;try{return await execAsync("git --version",{timeout:1e3}),!0}catch{return!1}}async getGitBlameInfo(filePath,statMtimeMs=null){if(DISABLE_GIT_FEATURES||!execAsync)return null;try{let vscode=require("vscode"),workspaceFolder=vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));if(!workspaceFolder)return null;let workspacePath=workspaceFolder.uri.fsPath||workspaceFolder.uri.path,relativePath=getRelativePath2(workspacePath,filePath),cacheKey=this._getGitCacheKey(workspacePath,relativePath,statMtimeMs),cached=this._getCachedGitInfo(cacheKey);if(cached)return this._metrics.cacheHits++,cached;this._metrics.cacheMisses++;let gitStartTime=Date.now();try{let{stdout}=await execAsync(`git log -1 --format="%H|%an|%ae|%ad" -- "${relativePath}"`,{cwd:workspaceFolder.uri.fsPath,timeout:2e3});if(!stdout||!stdout.trim())return null;let[hash,authorName,authorEmail,authorDate]=stdout.trim().split("|"),gitInfo={hash:hash||"",authorName:authorName||"Unknown",authorEmail:authorEmail||"",authorDate:authorDate||""};return this._setCachedGitInfo(cacheKey,gitInfo),gitInfo}finally{let gitDuration=Date.now()-gitStartTime;this._metrics.gitBlameTimeMs+=gitDuration,this._metrics.gitBlameCalls++}}catch(error){return this._logger.debug(`Git blame failed for ${filePath}:`,error.message),null}}getInitials(fullName){if(!fullName||typeof fullName!="string")return null;let parts=fullName.trim().split(/\s+/).filter(Boolean);return parts.length===0?null:parts.length===1?parts[0].substring(0,2).toUpperCase():(parts[0].charAt(0)+parts[1].charAt(0)).toUpperCase()}clearCache(){this._gitCache.clear(),this._logger.debug("\u{1F527} Git cache cleared")}getMetrics(){return{...this._metrics,cacheSize:this._gitCache.size,workerEnabled:!!(this._workerHost&&this._workerHost.isEnabled&&this._workerHost.isEnabled())}}async digestEntry(entry){if(!this._workerHost||!this._workerHost.isEnabled())return null;try{let[digest]=await this._workerHost.runTask("digest",[entry]);return digest}catch(error){return this._logger.debug("Worker digest failed:",error.message),null}}_getGitCacheKey(workspacePath,relativePath,mtimeMs){let safeWorkspace=workspacePath||"unknown-workspace",safeRelative=relativePath||"unknown-relative",safeMtime=Number.isFinite(mtimeMs)?mtimeMs:"unknown-mtime";return`${safeWorkspace}::${safeRelative}::${safeMtime}`}_getCachedGitInfo(cacheKey){let cached=this._gitCache.get(cacheKey);return cached?(cached.lastAccess=Date.now(),cached.value):null}_setCachedGitInfo(cacheKey,value){if(this._gitCache.size>=this._maxGitCacheEntries){let oldestKey=null,oldestAccess=1/0;for(let[key,entry]of this._gitCache.entries())entry.lastAccess<oldestAccess&&(oldestAccess=entry.lastAccess,oldestKey=key);oldestKey&&this._gitCache.delete(oldestKey)}this._gitCache.set(cacheKey,{value,lastAccess:Date.now()})}},gitInsightsManager=null;function getGitInsightsManager2(){return gitInsightsManager||(gitInsightsManager=new GitInsightsManager),gitInsightsManager}__name(getGitInsightsManager2,"getGitInsightsManager");module2.exports={GitInsightsManager,getGitInsightsManager:getGitInsightsManager2}}});var{getGitInsightsManager}=require_git_insights_chunk();module.exports={default:getGitInsightsManager,getGitInsightsManager};
//# sourceMappingURL=gitInsights.js.map
