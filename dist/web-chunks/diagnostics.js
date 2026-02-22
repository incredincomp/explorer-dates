var module = { exports: {} }; var exports = module.exports; (function() {
var f=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var d=f((exports,module)=>{var vscode=require("vscode"),fs=null,path=null;try{typeof process<"u"&&process.versions?.node&&process.env.VSCODE_WEB!=="true"&&(fs=eval("require")("fs"),path=eval("require")("path"))}catch{fs=null,path=null}var textDecoder=typeof globalThis.TextDecoder=="function"?new globalThis.TextDecoder("utf-8"):new(require("util")).TextDecoder("utf-8"),TemplateStore=class{constructor(){this.t=new Map,this.e=null}initialize(e){this.e=e?.extensionUri??null}async getTemplate(e){if(this.t.has(e))return this.t.get(e);let n=await this.n(e);return this.t.set(e,n),n}async n(e){let n=`${e}.html`;if(this.e){let r=vscode.Uri.joinPath(this.e,"assets","templates",n),i=await vscode.workspace.fs.readFile(r);return textDecoder.decode(i)}if(fs&&path){let r=path.resolve(__dirname,"..","..","assets","templates",n);return await fs.promises.readFile(r,"utf8")}throw new Error(`TemplateStore: Unable to load template "${e}" (missing extension context)`)}},templateStore=new TemplateStore;module.exports={templateStore,initializeTemplateStore:t=>templateStore.initialize(t)}});var y=f((ft,S)=>{function O(){return typeof Date=="function"&&Date.now?Date.now():16409952e5}function g(t){return!!(t&&typeof t=="object"&&typeof t.getTime=="function")}function I(t){if(g(t))return t;if(typeof t=="number")return new Date(t);if(typeof t=="string"){let e=Date.parse(t);return isNaN(e)?new Date:new Date(e)}return new Date}function u(t=""){return t?t.replace(/\\/g,"/"):""}function M(t=""){let e=u(t);return e?e.split("/").filter(Boolean):[]}function T(t=""){let e=M(t);return e.length?e[e.length-1]:""}function L(t=""){let e=T(t),n=e.lastIndexOf(".");return n<=0?"":e.substring(n).toLowerCase()}function B(t=""){let e=u(t),n=e.lastIndexOf("/");return n===-1?"":e.substring(0,n)}function R(...t){return u(t.filter(Boolean).join("/")).replace(/\/+/g,"/")}function x(t=""){return u(t).toLowerCase()}function U(t=""){if(!t)return"";if(typeof t=="string")return t;if(typeof t.fsPath=="string"&&t.fsPath.length>0)return t.fsPath;if(typeof t.path=="string"&&t.path.length>0)return t.path;if(typeof t.toString=="function")try{return t.toString(!0)}catch{return t.toString()}return String(t)}function b(t="",e=""){let n=u(t),r=u(e);return n&&r.startsWith(n)?r.substring(n.length).replace(/^\/+/,""):r}S.exports={ensureDate:I,isDateLike:g,getCurrentTimestamp:O,normalizePath:u,getFileName:T,getExtension:L,getDirectory:B,joinPath:R,getCacheKey:x,getUriPath:U,getRelativePath:b}});var E=f((exports,module)=>{var chunk=null;try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){try{chunk=dynamicRequire("../chunks/utils-shared-chunk")}catch{}try{chunk||(chunk=dynamicRequire("./chunks/utils-shared-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("../chunks/date-helpers-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("./chunks/date-helpers-chunk"))}catch{}}}catch{}if(chunk&&(chunk.ensureDate||chunk.isDateLike||chunk.getCurrentTimestamp))module.exports={ensureDate:chunk.ensureDate,isDateLike:chunk.isDateLike,getCurrentTimestamp:chunk.getCurrentTimestamp};else{let t=function(){return typeof Date=="function"&&Date.now?Date.now():16409952e5},e=function(r){return!!(r&&typeof r=="object"&&typeof r.getTime=="function")},n=function(r){if(e(r))return r;if(typeof r=="number")return new Date(r);if(typeof r=="string"){let i=Date.parse(r);return isNaN(i)?new Date:new Date(i)}return new Date};getCurrentTimestamp=t,isDateLike=e,ensureDate=n,module.exports={ensureDate:n,isDateLike:e,getCurrentTimestamp:t}}var getCurrentTimestamp,isDateLike,ensureDate});var _=f((pt,w)=>{var{templateStore:a}=d(),p;try{let t=y();t&&(p=t.ensureDate)}catch{}p||(p=E().ensureDate);var F={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},P=/{{([A-Z0-9_]+)}}/g,H={OK:{section:"test-ok",status:"status-ok"},ISSUES_FOUND:{section:"test-warning",status:"status-warning"},FAILED:{section:"test-error",status:"status-error"}},j={section:"test-warning",status:"status-warning"},A=new Intl.NumberFormat(void 0,{maximumFractionDigits:1}),h=t=>{try{return p(t).toLocaleString()}catch{return"N/A"}},s=(t="")=>String(t).replace(/[&<>"']/g,e=>F[e]||e),c=(t,e={})=>t.replace(P,(n,r)=>e[r]??""),q=(t=0)=>{if(t<1024)return`${t} B`;let e=t/1024;if(e<1024)return`${A.format(e)} KB`;let n=e/1024;return`${A.format(n)} MB`},G=(t=0)=>{if(!t)return"0 B";let e=["B","KB","MB","GB","TB"],n=Math.min(Math.floor(Math.log(t)/Math.log(1024)),e.length-1);return n<=0?`${t} B`:`${(t/Math.pow(1024,n)).toFixed(2)} ${e[n]}`},l=(t,e=0)=>typeof t=="number"&&Number.isFinite(t)?t:e,z=(t,e=0)=>typeof t!="number"||Number.isNaN(t)?e>0?0 .toFixed(e):"0":t.toFixed(e),V=(t=[])=>t.join("")||'<tr><td colspan="3">No data collected yet.</td></tr>',v=(t=[])=>t.length?t.map(s).join(", "):"None",K=t=>Array.isArray(t)?v(t):t==null?"N/A":s(typeof t=="object"?JSON.stringify(t):t),W=(t={})=>Object.entries(t).map(([e,n])=>{let r=Object.entries(n).map(([i,m])=>`
        <tr>
            <td><strong>${s(i)}:</strong></td>
            <td>${K(m)}</td>
        </tr>
    `).join("");return`
        <div class="diagnostic-section">
            <h3>\u{1F50D} ${s(e)}</h3>
            <table>${r}</table>
        </div>
    `}).join(""),Y=(t="")=>{let e=t.trim();return`<div class="${e.startsWith("CRITICAL:")?"issue-critical":"issue-warning"}">\u26A0\uFE0F ${s(e)}</div>`},J=([t,e={}])=>{let n=H[e.status]||j,r=Array.isArray(e.issues)&&e.issues.length?`
            <h3>Issues Found</h3>
            ${e.issues.map(Y).join("")}
        `:"",i=e.settings?`<h3>Settings Snapshot</h3><pre>${s(JSON.stringify(e.settings,null,2))}</pre>`:"",m=Array.isArray(e.testFiles)&&e.testFiles.length?`
            <h3>File Tests</h3>
            ${e.testFiles.map(o=>`
                <div class="file-test">
                    \u{1F4C4} ${s(o.file||"Unknown")}:
                    ${o.exists?"\u2705 exists":"\u274C missing"} |
                    ${o.excluded?"\u{1F6AB} excluded":"\u2705 included"} |
                    ${o.hasDecoration?`\u{1F3F7}\uFE0F badge: ${s(o.badge||"n/a")}`:"\u274C no decoration"}
                </div>
            `).join("")}
        `:"",k=Array.isArray(e.tests)&&e.tests.length?`
            <h3>Test Results</h3>
            ${e.tests.map(o=>`
                <div class="badge-test">
                    ${o.success?"\u2705":"\u274C"} ${s(o.name||"Unnamed")}
                    ${o.error?` - ${s(o.error)}`:""}
                </div>
            `).join("")}
        `:"",C=e.metrics?`<h3>Performance Metrics</h3><pre>${s(JSON.stringify(e.metrics,null,2))}</pre>`:"",N=s(t.replace(/([A-Z])/g," $1").replace(/^./,o=>o.toUpperCase()));return`
        <div class="test-section ${n.section}">
            <h2>\u{1F9EA} ${N}</h2>
            <p class="${n.status}">Status: ${s(e.status||"UNKNOWN")}</p>
            ${r}
            ${i}
            ${m}
            ${k}
            ${C}
        </div>
    `},Z=(t={})=>{let e=Array.isArray(t.recommendations)&&t.recommendations.length?`
            <h3>\u{1F3AF} Recommendations</h3>
            <ul>${t.recommendations.map(n=>`<li>${s(n)}</li>`).join("")}</ul>
        `:"";return`
        <div class="summary">
            <h2>\u{1F4CB} Summary</h2>
            <p><strong>Total Tests:</strong> ${Object.keys(t.tests||{}).length}</p>
            <p><strong>Status:</strong> ${s(t.summary||"Unknown")}</p>
            <p><strong>Performance:</strong> ${s(t.performance||"Not recorded")}</p>
            ${e}
        </div>
    `};async function Q(t={}){let e=await a.getTemplate("api-info");return c(e,{VERSION:s(t.version||"unknown"),API_VERSION:s(t.apiVersion||"unknown")})}async function X(t=[]){let e=await a.getTemplate("workspace-activity"),n=[...t].sort((i,m)=>(m.modified?.getTime?.()||0)-(i.modified?.getTime?.()||0)),r=V(n.slice(0,50).map(i=>`
        <tr>
            <td>${s(i.path||"unknown")}</td>
            <td>${h(i.modified)}</td>
            <td>${q(i.size)}</td>
        </tr>
    `));return c(e,{TOTAL_FILES:n.length,MOST_RECENT:n.length?h(n[0].modified):"N/A",ROWS:r})}async function tt(t={}){let e=await a.getTemplate("diagnostics");return c(e,{SECTIONS:W(t)})}async function et(t={}){let e=await a.getTemplate("diagnostics-webview"),n=Object.entries(t.tests||{}).map(J).join("");return c(e,{VS_CODE_VERSION:s(t.vscodeVersion||"Unknown"),EXTENSION_VERSION:s(t.extensionVersion||"Unknown"),GENERATED_AT:h(t.timestamp||Date.now()),TEST_SECTIONS:n,SUMMARY_BLOCK:Z(t)})}async function nt(t={}){let e=await a.getTemplate("performance-card-basic");return c(e,{TOTAL_DECORATIONS:(t.totalDecorations??0).toString(),CACHE_HIT_RATE:t.cacheHitRate||"0%"})}async function rt(t=null){if(!t)return a.getTemplate("performance-card-advanced-empty");let e=await a.getTemplate("performance-card-advanced"),n=l(t.memoryUsagePercent,0);return c(e,{MEMORY_ITEMS:(t.memoryItems??0).toString(),MEMORY_USAGE:G(t.memoryUsage||0),MEMORY_USAGE_PERCENT:n.toString(),MEMORY_USAGE_PERCENT_LABEL:z(n,2),MEMORY_HIT_RATE:t.memoryHitRate||"0%",DISK_HIT_RATE:t.diskHitRate||"0%"})}async function st(t=null){if(!t)return"";let e=await a.getTemplate("performance-card-batch"),n=t.isProcessing?"Active":"Idle",r=l(t.averageBatchTime,0).toFixed(2),i=typeof t.currentProgress=="number"?`${Math.max(0,Math.min(100,t.currentProgress*100)).toFixed(0)}%`:"0%";return c(e,{TOTAL_BATCHES:(t.totalBatches??0).toString(),AVERAGE_BATCH_TIME:r,CURRENT_STATUS:n,QUEUE_LENGTH:(t.queueLength??0).toString(),CURRENT_PROGRESS:i})}async function it(t={}){let e=await a.getTemplate("performance-card-summary");return c(e,{CACHE_HITS:(t.cacheHits??0).toString(),CACHE_MISSES:(t.cacheMisses??0).toString(),ERROR_COUNT:(t.errors??0).toString()})}async function ot(t=null){if(!t)return"";let e=await a.getTemplate("performance-card-timing");return c(e,{AVG_GIT_BLAME:`${l(t.avgGitBlameMs,0)}ms`,GIT_CALLS:(t.gitBlameCalls??0).toString(),AVG_FILE_STAT:`${l(t.avgFileStatMs,0)}ms`,FILE_STAT_CALLS:(t.fileStatCalls??0).toString(),TOTAL_GIT_TIME:`${l(t.totalGitBlameTimeMs,0)}ms`,TOTAL_FILE_STAT_TIME:`${l(t.totalFileStatTimeMs,0)}ms`})}async function at(t={}){let e=await a.getTemplate("performance-analytics"),n=await Promise.all([nt(t),rt(t.advancedCache),st(t.batchProcessor),it(t),ot(t.performanceTiming)]);return c(e,{CARDS:n.filter(Boolean).join(`
`)})}w.exports={getApiInformationHtml:Q,generateWorkspaceActivityHTML:X,generateDiagnosticsHTML:tt,generateDiagnosticsWebview:et,generatePerformanceAnalyticsHTML:at}});var ct=_(),{templateStore:ut,initializeTemplateStore:$}=d(),D=!1;function lt(t){!D&&t&&($(t),D=!0)}module.exports={...ct,templateStore:ut,initializeTemplateStore:$,ensureInitialized:lt};
})(); (function(){const primaryKey="explorerDatesChunks";const legacyKey="__explorerDatesChunks";const registry=(globalThis[primaryKey]=globalThis[primaryKey]||globalThis[legacyKey]||(globalThis[legacyKey]={}));registry["diagnostics"]=module.exports;})();
