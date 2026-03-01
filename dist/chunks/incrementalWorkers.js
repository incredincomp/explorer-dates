var __defProp=Object.defineProperty;var __getOwnPropNames=Object.getOwnPropertyNames;var __name=(target,value)=>__defProp(target,"name",{value,configurable:!0});var __commonJS=(cb,mod)=>function(){return mod||(0,cb[__getOwnPropNames(cb)[0]])((mod={exports:{}}).exports,mod),mod.exports};var require_logger=__commonJS({"src/utils/logger.js"(exports2,module2){var GLOBAL_LOGGER_KEY="__explorerDatesLogger",LoggerFacade=class{static{__name(this,"LoggerFacade")}constructor(){this._impl=null}_call(method,args){if(this._impl&&typeof this._impl[method]=="function")try{return this._impl[method](...args)}catch{}switch(method){case"debug":typeof console.debug=="function"?console.debug(...args):console.log(...args);break;case"info":console.log(...args);break;case"warn":console.warn(...args);break;case"error":console.error(...args);break;default:console.log(...args);break}}debug(...args){return this._call("debug",args)}info(...args){return this._call("info",args)}warn(...args){return this._call("warn",args)}error(...args){return this._call("error",args)}_setImpl(impl){this._impl=impl}};function getLogger3(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new LoggerFacade),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new LoggerFacade),globalThis[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new LoggerFacade),loggerInstance)}__name(getLogger3,"getLogger");var Logger=class extends LoggerFacade{static{__name(this,"Logger")}},loggerInstance=null;module2.exports={Logger,getLogger:getLogger3}}});var require_env=__commonJS({"src/utils/env.js"(exports2,module2){var vscode=require("vscode");function isWebEnvironment2(){try{return vscode?.env?.uiKind===vscode?.UIKind?.Web}catch{return!1}}__name(isWebEnvironment2,"isWebEnvironment");module2.exports={isWebEnvironment:isWebEnvironment2}}});var require_indexWorkerHost=__commonJS({"src/workers/indexWorkerHost.js"(exports,module){var{getLogger}=require_logger(),{isWebEnvironment}=require_env(),env=typeof process<"u"&&process.env?process.env:{},isWebBuild=env.VSCODE_WEB==="true"||isWebEnvironment(),WebWorkerCtor=typeof globalThis<"u"&&typeof globalThis.Worker=="function"?globalThis.Worker:null,WorkerThreads=null,NodeFs=null,NodePath=null;if(!isWebBuild&&typeof process<"u"&&process.versions?.node){try{WorkerThreads=eval("require")("worker_threads")}catch{WorkerThreads=null}try{NodeFs=eval("require")("fs")}catch{NodeFs=null}try{NodePath=eval("require")("path")}catch{NodePath=null}}var DEFAULT_WASM_PATH=(()=>{if(!NodePath)return null;try{return NodePath.join(__dirname,"..","..","assets","wasm","digest.wasm")}catch{return null}})(),PERFORMANCE_REPORT_INTERVAL_MS=3e4,PERFORMANCE_MIN_SAMPLE_COUNT=100,WORKER_SOURCE=`
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
`+short)}catch{}let workerOptions={eval:!0,workerData:{wasmPath:this._wasmPath}},worker=new WorkerThreads.Worker(WORKER_SOURCE,workerOptions);return worker.on("message",data=>this._handleMessage(data)),worker.on("error",error=>this._logger.debug("Index worker error",error)),worker}_postMessage(message){isWebBuild?this._worker.postMessage(message):this._worker.postMessage(message)}_handleMessage(message){if(!message||typeof message!="object")return;if(message.type==="log"){let level=message.level||"info";(typeof this._logger[level]=="function"?this._logger[level].bind(this._logger):this._logger.info.bind(this._logger))(message.message||"[IndexWorker] log entry",message.details);return}let{id,result,error}=message,pending=this._pending.get(id);pending&&(this._pending.delete(id),error?pending.reject(new Error(error.message||"Worker task failed")):pending.resolve(result))}_resolveWasmPath(explicitPath){let candidate=explicitPath||env.EXPLORER_DATES_WASM_PATH||DEFAULT_WASM_PATH;if(!candidate||!NodeFs)return null;try{if(NodeFs.existsSync(candidate))return candidate}catch{}return null}_runInline(task,payload){return task==="digest"?Promise.resolve((payload||[]).map(entry=>this._digestEntry(entry))):Promise.resolve(payload)}_digestEntry(entry={}){let hashBase=[entry.path||"",entry.mtimeMs||0,entry.size||0].join(":");return{path:entry.path,hash:this._stableHash(hashBase),sizeBucket:this._bucketSize(entry.size),ageBucket:this._bucketAge(entry.mtimeMs)}}_stableHash(input){let hash=0;if(!input)return"0";for(let i=0;i<input.length;i++)hash=(hash<<5)-hash+input.charCodeAt(i),hash|=0;return Math.abs(hash).toString(16)}_bucketSize(size){return!Number.isFinite(size)||size<=0||size<1024?"tiny":size<1024*100?"small":size<1024*1024?"medium":size<1024*1024*10?"large":"huge"}_bucketAge(mtimeMs){if(!Number.isFinite(mtimeMs))return"unknown";let diff=Date.now()-mtimeMs;return diff<0?"future":diff<1e3*60?"minute":diff<1e3*60*60?"hour":diff<1e3*60*60*24?"day":diff<1e3*60*60*24*7?"week":"old"}};module.exports={IndexWorkerHost}}});var{IndexWorkerHost:IndexWorkerHost2}=require_indexWorkerHost(),{getLogger:getLogger2}=require_logger(),IncrementalWorkersManager=class{static{__name(this,"IncrementalWorkersManager")}constructor(options={}){this._logger=options.logger||getLogger2(),this._workerHost=null,this._wasmPath=options.wasmPath}async initialize(){return this._workerHost||(this._workerHost=new IndexWorkerHost2({logger:this._logger,wasmPath:this._wasmPath}),this._logger.debug("Incremental workers initialized")),this._workerHost}getWorkerHost(){return this._workerHost}isWorkerEnabled(){return this._workerHost?.isEnabled()||!1}async runTask(task,payload){return this._workerHost||await this.initialize(),this._workerHost.runTask(task,payload)}dispose(){this._workerHost&&(this._workerHost.dispose(),this._workerHost=null,this._logger.debug("Incremental workers disposed"))}};module.exports={IncrementalWorkersManager,IndexWorkerHost:IndexWorkerHost2};
//# sourceMappingURL=incrementalWorkers.js.map
