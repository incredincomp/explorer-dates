var f=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var S=f((gt,T)=>{var g=require("vscode");function L(){try{return g?.env?.uiKind===g?.UIKind?.Web}catch{return!1}}T.exports={isWebEnvironment:L}});var p=f((exports,module)=>{var vscode=require("vscode"),{isWebEnvironment}=S(),fs=null,path=null;try{let isWeb=isWebEnvironment()||typeof process<"u"&&process.env?.VSCODE_WEB==="true";!isWeb&&typeof process<"u"&&process.versions?.node&&(fs=eval("require")("fs"),path=eval("require")("path"))}catch{fs=null,path=null}var textDecoder=typeof globalThis.TextDecoder=="function"?new globalThis.TextDecoder("utf-8"):new(require("util")).TextDecoder("utf-8"),TemplateStore=class{constructor(){this.t=new Map,this.e=null}initialize(e){this.e=e?.extensionUri??null}async getTemplate(e){if(this.t.has(e))return this.t.get(e);let n=await this.n(e);return this.t.set(e,n),n}async n(e){let n=`${e}.html`;if(this.e){let r=vscode.Uri.joinPath(this.e,"assets","templates",n),i=await vscode.workspace.fs.readFile(r);return textDecoder.decode(i)}if(fs&&path){let r=path.resolve(__dirname,"..","..","assets","templates",n);return await fs.promises.readFile(r,"utf8")}throw new Error(`TemplateStore: Unable to load template "${e}" (missing extension context)`)}},templateStore=new TemplateStore;module.exports={templateStore,initializeTemplateStore:t=>templateStore.initialize(t)}});var w=f((Tt,A)=>{function B(){return typeof Date=="function"&&Date.now?Date.now():16409952e5}function y(t){return!!(t&&typeof t=="object"&&typeof t.getTime=="function")}function b(t){if(y(t))return t;if(typeof t=="number")return new Date(t);if(typeof t=="string"){let e=Date.parse(t);return isNaN(e)?new Date:new Date(e)}return new Date}function u(t=""){return t?t.replace(/\\/g,"/"):""}function R(t=""){let e=u(t);return e?e.split("/").filter(Boolean):[]}function E(t=""){let e=R(t);return e.length?e[e.length-1]:""}function x(t=""){let e=E(t),n=e.lastIndexOf(".");return n<=0?"":e.substring(n).toLowerCase()}function U(t=""){let e=u(t),n=e.lastIndexOf("/");return n===-1?"":e.substring(0,n)}function F(...t){return u(t.filter(Boolean).join("/")).replace(/\/+/g,"/")}function P(t=""){return u(t).toLowerCase()}function H(t=""){if(!t)return"";if(typeof t=="string")return t;if(typeof t.fsPath=="string"&&t.fsPath.length>0)return t.fsPath;if(typeof t.path=="string"&&t.path.length>0)return t.path;if(typeof t.toString=="function")try{return t.toString(!0)}catch{return t.toString()}return String(t)}function j(t="",e=""){let n=u(t),r=u(e);return n&&r.startsWith(n)?r.substring(n.length).replace(/^\/+/,""):r}A.exports={ensureDate:b,isDateLike:y,getCurrentTimestamp:B,normalizePath:u,getFileName:E,getExtension:x,getDirectory:U,joinPath:F,getCacheKey:P,getUriPath:H,getRelativePath:j}});var _=f((exports,module)=>{var chunk=null;try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){try{chunk=dynamicRequire("../chunks/utils-shared-chunk")}catch{}try{chunk||(chunk=dynamicRequire("./chunks/utils-shared-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("../chunks/date-helpers-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("./chunks/date-helpers-chunk"))}catch{}}}catch{}if(chunk&&(chunk.ensureDate||chunk.isDateLike||chunk.getCurrentTimestamp))module.exports={ensureDate:chunk.ensureDate,isDateLike:chunk.isDateLike,getCurrentTimestamp:chunk.getCurrentTimestamp};else{let t=function(){return typeof Date=="function"&&Date.now?Date.now():16409952e5},e=function(r){return!!(r&&typeof r=="object"&&typeof r.getTime=="function")},n=function(r){if(e(r))return r;if(typeof r=="number")return new Date(r);if(typeof r=="string"){let i=Date.parse(r);return isNaN(i)?new Date:new Date(i)}return new Date};getCurrentTimestamp=t,isDateLike=e,ensureDate=n,module.exports={ensureDate:n,isDateLike:e,getCurrentTimestamp:t}}var getCurrentTimestamp,isDateLike,ensureDate});var k=f((St,$)=>{var{templateStore:a}=p(),d;try{let t=w();t&&(d=t.ensureDate)}catch{}d||(d=_().ensureDate);var q={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},v=/{{([A-Z0-9_]+)}}/g,G={OK:{section:"test-ok",status:"status-ok"},ISSUES_FOUND:{section:"test-warning",status:"status-warning"},FAILED:{section:"test-error",status:"status-error"}},z={section:"test-warning",status:"status-warning"},D=new Intl.NumberFormat(void 0,{maximumFractionDigits:1}),h=t=>{try{return d(t).toLocaleString()}catch{return"N/A"}},s=(t="")=>String(t).replace(/[&<>"']/g,e=>q[e]||e),c=(t,e={})=>t.replace(v,(n,r)=>e[r]??""),V=(t=0)=>{if(t<1024)return`${t} B`;let e=t/1024;if(e<1024)return`${D.format(e)} KB`;let n=e/1024;return`${D.format(n)} MB`},W=(t=0)=>{if(!t)return"0 B";let e=["B","KB","MB","GB","TB"],n=Math.min(Math.floor(Math.log(t)/Math.log(1024)),e.length-1);return n<=0?`${t} B`:`${(t/Math.pow(1024,n)).toFixed(2)} ${e[n]}`},l=(t,e=0)=>typeof t=="number"&&Number.isFinite(t)?t:e,K=(t,e=0)=>typeof t!="number"||Number.isNaN(t)?e>0?0 .toFixed(e):"0":t.toFixed(e),Y=(t=[])=>t.join("")||'<tr><td colspan="3">No data collected yet.</td></tr>',J=(t=[])=>t.length?t.map(s).join(", "):"None",Z=t=>Array.isArray(t)?J(t):t==null?"N/A":s(typeof t=="object"?JSON.stringify(t):t),Q=(t={})=>Object.entries(t).map(([e,n])=>{let r=Object.entries(n).map(([i,m])=>`
        <tr>
            <td><strong>${s(i)}:</strong></td>
            <td>${Z(m)}</td>
        </tr>
    `).join("");return`
        <div class="diagnostic-section">
            <h3>\u{1F50D} ${s(e)}</h3>
            <table>${r}</table>
        </div>
    `}).join(""),X=(t="")=>{let e=t.trim();return`<div class="${e.startsWith("CRITICAL:")?"issue-critical":"issue-warning"}">\u26A0\uFE0F ${s(e)}</div>`},tt=([t,e={}])=>{let n=G[e.status]||z,r=Array.isArray(e.issues)&&e.issues.length?`
            <h3>Issues Found</h3>
            ${e.issues.map(X).join("")}
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
        `:"",N=Array.isArray(e.tests)&&e.tests.length?`
            <h3>Test Results</h3>
            ${e.tests.map(o=>`
                <div class="badge-test">
                    ${o.success?"\u2705":"\u274C"} ${s(o.name||"Unnamed")}
                    ${o.error?` - ${s(o.error)}`:""}
                </div>
            `).join("")}
        `:"",O=e.metrics?`<h3>Performance Metrics</h3><pre>${s(JSON.stringify(e.metrics,null,2))}</pre>`:"",M=s(t.replace(/([A-Z])/g," $1").replace(/^./,o=>o.toUpperCase()));return`
        <div class="test-section ${n.section}">
            <h2>\u{1F9EA} ${M}</h2>
            <p class="${n.status}">Status: ${s(e.status||"UNKNOWN")}</p>
            ${r}
            ${i}
            ${m}
            ${N}
            ${O}
        </div>
    `},et=(t={})=>{let e=Array.isArray(t.recommendations)&&t.recommendations.length?`
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
    `};async function nt(t={}){let e=await a.getTemplate("api-info");return c(e,{VERSION:s(t.version||"unknown"),API_VERSION:s(t.apiVersion||"unknown")})}async function rt(t=[]){let e=await a.getTemplate("workspace-activity"),n=[...t].sort((i,m)=>(m.modified?.getTime?.()||0)-(i.modified?.getTime?.()||0)),r=Y(n.slice(0,50).map(i=>`
        <tr>
            <td>${s(i.path||"unknown")}</td>
            <td>${h(i.modified)}</td>
            <td>${V(i.size)}</td>
        </tr>
    `));return c(e,{TOTAL_FILES:n.length,MOST_RECENT:n.length?h(n[0].modified):"N/A",ROWS:r})}async function st(t={}){let e=await a.getTemplate("diagnostics");return c(e,{SECTIONS:Q(t)})}async function it(t={}){let e=await a.getTemplate("diagnostics-webview"),n=Object.entries(t.tests||{}).map(tt).join("");return c(e,{VS_CODE_VERSION:s(t.vscodeVersion||"Unknown"),EXTENSION_VERSION:s(t.extensionVersion||"Unknown"),GENERATED_AT:h(t.timestamp||Date.now()),TEST_SECTIONS:n,SUMMARY_BLOCK:et(t)})}async function ot(t={}){let e=await a.getTemplate("performance-card-basic");return c(e,{TOTAL_DECORATIONS:(t.totalDecorations??0).toString(),CACHE_HIT_RATE:t.cacheHitRate||"0%"})}async function at(t=null){if(!t)return a.getTemplate("performance-card-advanced-empty");let e=await a.getTemplate("performance-card-advanced"),n=l(t.memoryUsagePercent,0);return c(e,{MEMORY_ITEMS:(t.memoryItems??0).toString(),MEMORY_USAGE:W(t.memoryUsage||0),MEMORY_USAGE_PERCENT:n.toString(),MEMORY_USAGE_PERCENT_LABEL:K(n,2),MEMORY_HIT_RATE:t.memoryHitRate||"0%",DISK_HIT_RATE:t.diskHitRate||"0%"})}async function ct(t=null){if(!t)return"";let e=await a.getTemplate("performance-card-batch"),n=t.isProcessing?"Active":"Idle",r=l(t.averageBatchTime,0).toFixed(2),i=typeof t.currentProgress=="number"?`${Math.max(0,Math.min(100,t.currentProgress*100)).toFixed(0)}%`:"0%";return c(e,{TOTAL_BATCHES:(t.totalBatches??0).toString(),AVERAGE_BATCH_TIME:r,CURRENT_STATUS:n,QUEUE_LENGTH:(t.queueLength??0).toString(),CURRENT_PROGRESS:i})}async function ut(t={}){let e=await a.getTemplate("performance-card-summary");return c(e,{CACHE_HITS:(t.cacheHits??0).toString(),CACHE_MISSES:(t.cacheMisses??0).toString(),ERROR_COUNT:(t.errors??0).toString()})}async function lt(t=null){if(!t)return"";let e=await a.getTemplate("performance-card-timing");return c(e,{AVG_GIT_BLAME:`${l(t.avgGitBlameMs,0)}ms`,GIT_CALLS:(t.gitBlameCalls??0).toString(),AVG_FILE_STAT:`${l(t.avgFileStatMs,0)}ms`,FILE_STAT_CALLS:(t.fileStatCalls??0).toString(),TOTAL_GIT_TIME:`${l(t.totalGitBlameTimeMs,0)}ms`,TOTAL_FILE_STAT_TIME:`${l(t.totalFileStatTimeMs,0)}ms`})}async function mt(t={}){let e=await a.getTemplate("performance-analytics"),n=await Promise.all([ot(t),at(t.advancedCache),ct(t.batchProcessor),ut(t),lt(t.performanceTiming)]);return c(e,{CARDS:n.filter(Boolean).join(`
`)})}$.exports={getApiInformationHtml:nt,generateWorkspaceActivityHTML:rt,generateDiagnosticsHTML:st,generateDiagnosticsWebview:it,generatePerformanceAnalyticsHTML:mt}});var ft=k(),{templateStore:dt,initializeTemplateStore:I}=p(),C=!1;function pt(t){!C&&t&&(I(t),C=!0)}module.exports={...ft,templateStore:dt,initializeTemplateStore:I,ensureInitialized:pt};
