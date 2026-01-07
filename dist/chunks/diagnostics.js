var f=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var g=f((exports,module)=>{var vscode=require("vscode"),fs=null,path=null;try{typeof process<"u"&&process.versions?.node&&process.env.VSCODE_WEB!=="true"&&(fs=eval("require")("fs"),path=eval("require")("path"))}catch{fs=null,path=null}var textDecoder=typeof globalThis.TextDecoder=="function"?new globalThis.TextDecoder("utf-8"):new(require("util")).TextDecoder("utf-8"),TemplateStore=class{constructor(){this.t=new Map,this.e=null}initialize(e){this.e=e?.extensionUri??null}async getTemplate(e){if(this.t.has(e))return this.t.get(e);let n=await this.n(e);return this.t.set(e,n),n}async n(e){let n=`${e}.html`;if(this.e){let o=vscode.Uri.joinPath(this.e,"assets","templates",n),s=await vscode.workspace.fs.readFile(o);return textDecoder.decode(s)}if(fs&&path){let o=path.resolve(__dirname,"..","..","assets","templates",n);return await fs.promises.readFile(o,"utf8")}throw new Error(`TemplateStore: Unable to load template "${e}" (missing extension context)`)}},templateStore=new TemplateStore;module.exports={templateStore,initializeTemplateStore:t=>templateStore.initialize(t)}});var A=f((pt,y)=>{function h(){return typeof performance<"u"&&performance.now&&performance.timeOrigin?Math.floor(performance.timeOrigin+performance.now()):typeof Date=="function"&&Date.now?Date.now():16409952e5}function E(t){return!!(t&&typeof t=="object"&&typeof t.getTime=="function")}function l(t){if(!t||isNaN(t))return"Invalid Date";if(typeof Intl<"u"&&Intl.DateTimeFormat)try{return new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(t)}catch{}let e=864e5,n=36e5,o=6e4,s=1e3,m=1970,p=Math.floor(t/e),u=t%e,S=Math.floor(u/n),i=Math.floor(u%n/o),w=Math.floor(u%o/s),O=m+Math.floor(p/365.25),C=Math.floor(p%365.25/30.44)+1,L=Math.floor(p%30.44)+1,N=String(Math.min(C,12)).padStart(2,"0"),B=String(Math.min(L,31)).padStart(2,"0"),U=String(S).padStart(2,"0"),F=String(i).padStart(2,"0"),R=String(w).padStart(2,"0");return`${N}/${B}/${O}, ${U}:${F}:${R}`}function x(t){if(E(t))return t;let e=typeof Date=="function"&&Date.prototype&&Date.prototype.constructor===Date;if(t==null){if(!e){let n=h();return{getTime:()=>n,toLocaleString:()=>l(n),toString:()=>l(n)}}return new Date}if(typeof t=="number")return e?new Date(t):{getTime:()=>t,toLocaleString:()=>l(t),toString:()=>l(t)};if(typeof t=="string"){let n=0;if(e)n=Date.parse(t);else{let o=parseFloat(t);n=isNaN(o)?0:o}return e?new Date(t):{getTime:()=>n,toLocaleString:()=>l(n),toString:()=>l(n)}}return e?new Date(t):{getTime:()=>0,toLocaleString:()=>"Invalid Date",toString:()=>"Invalid Date"}}y.exports={ensureDate:x,isDateLike:E,getCurrentTimestamp:h}});var M=f((ut,$)=>{var{templateStore:a}=g(),{ensureDate:b}=A(),k={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},P=/{{([A-Z0-9_]+)}}/g,H={OK:{section:"test-ok",status:"status-ok"},ISSUES_FOUND:{section:"test-warning",status:"status-warning"},FAILED:{section:"test-error",status:"status-error"}},j={section:"test-warning",status:"status-warning"},_=new Intl.NumberFormat(void 0,{maximumFractionDigits:1}),T=t=>{try{return b(t).toLocaleString()}catch{return"N/A"}},r=(t="")=>String(t).replace(/[&<>"']/g,e=>k[e]||e),c=(t,e={})=>t.replace(P,(n,o)=>e[o]??""),G=(t=0)=>{if(t<1024)return`${t} B`;let e=t/1024;if(e<1024)return`${_.format(e)} KB`;let n=e/1024;return`${_.format(n)} MB`},V=(t=0)=>{if(!t)return"0 B";let e=["B","KB","MB","GB","TB"],n=Math.min(Math.floor(Math.log(t)/Math.log(1024)),e.length-1);return n<=0?`${t} B`:`${(t/Math.pow(1024,n)).toFixed(2)} ${e[n]}`},d=(t,e=0)=>typeof t=="number"&&Number.isFinite(t)?t:e,q=(t,e=0)=>typeof t!="number"||Number.isNaN(t)?e>0?0 .toFixed(e):"0":t.toFixed(e),v=(t=[])=>t.join("")||'<tr><td colspan="3">No data collected yet.</td></tr>',z=(t=[])=>t.length?t.map(r).join(", "):"None",Y=t=>Array.isArray(t)?z(t):t==null?"N/A":r(typeof t=="object"?JSON.stringify(t):t),K=(t={})=>Object.entries(t).map(([e,n])=>{let o=Object.entries(n).map(([s,m])=>`
        <tr>
            <td><strong>${r(s)}:</strong></td>
            <td>${Y(m)}</td>
        </tr>
    `).join("");return`
        <div class="diagnostic-section">
            <h3>\u{1F50D} ${r(e)}</h3>
            <table>${o}</table>
        </div>
    `}).join(""),W=(t="")=>{let e=t.trim();return`<div class="${e.startsWith("CRITICAL:")?"issue-critical":"issue-warning"}">\u26A0\uFE0F ${r(e)}</div>`},J=([t,e={}])=>{let n=H[e.status]||j,o=Array.isArray(e.issues)&&e.issues.length?`
            <h3>Issues Found</h3>
            ${e.issues.map(W).join("")}
        `:"",s=e.settings?`<h3>Settings Snapshot</h3><pre>${r(JSON.stringify(e.settings,null,2))}</pre>`:"",m=Array.isArray(e.testFiles)&&e.testFiles.length?`
            <h3>File Tests</h3>
            ${e.testFiles.map(i=>`
                <div class="file-test">
                    \u{1F4C4} ${r(i.file||"Unknown")}:
                    ${i.exists?"\u2705 exists":"\u274C missing"} |
                    ${i.excluded?"\u{1F6AB} excluded":"\u2705 included"} |
                    ${i.hasDecoration?`\u{1F3F7}\uFE0F badge: ${r(i.badge||"n/a")}`:"\u274C no decoration"}
                </div>
            `).join("")}
        `:"",p=Array.isArray(e.tests)&&e.tests.length?`
            <h3>Test Results</h3>
            ${e.tests.map(i=>`
                <div class="badge-test">
                    ${i.success?"\u2705":"\u274C"} ${r(i.name||"Unnamed")}
                    ${i.error?` - ${r(i.error)}`:""}
                </div>
            `).join("")}
        `:"",u=e.metrics?`<h3>Performance Metrics</h3><pre>${r(JSON.stringify(e.metrics,null,2))}</pre>`:"",S=r(t.replace(/([A-Z])/g," $1").replace(/^./,i=>i.toUpperCase()));return`
        <div class="test-section ${n.section}">
            <h2>\u{1F9EA} ${S}</h2>
            <p class="${n.status}">Status: ${r(e.status||"UNKNOWN")}</p>
            ${o}
            ${s}
            ${m}
            ${p}
            ${u}
        </div>
    `},Z=(t={})=>{let e=Array.isArray(t.recommendations)&&t.recommendations.length?`
            <h3>\u{1F3AF} Recommendations</h3>
            <ul>${t.recommendations.map(n=>`<li>${r(n)}</li>`).join("")}</ul>
        `:"";return`
        <div class="summary">
            <h2>\u{1F4CB} Summary</h2>
            <p><strong>Total Tests:</strong> ${Object.keys(t.tests||{}).length}</p>
            <p><strong>Status:</strong> ${r(t.summary||"Unknown")}</p>
            <p><strong>Performance:</strong> ${r(t.performance||"Not recorded")}</p>
            ${e}
        </div>
    `};async function Q(t={}){let e=await a.getTemplate("api-info");return c(e,{VERSION:r(t.version||"unknown"),API_VERSION:r(t.apiVersion||"unknown")})}async function X(t=[]){let e=await a.getTemplate("workspace-activity"),n=[...t].sort((s,m)=>(m.modified?.getTime?.()||0)-(s.modified?.getTime?.()||0)),o=v(n.slice(0,50).map(s=>`
        <tr>
            <td>${r(s.path||"unknown")}</td>
            <td>${T(s.modified)}</td>
            <td>${G(s.size)}</td>
        </tr>
    `));return c(e,{TOTAL_FILES:n.length,MOST_RECENT:n.length?T(n[0].modified):"N/A",ROWS:o})}async function tt(t={}){let e=await a.getTemplate("diagnostics");return c(e,{SECTIONS:K(t)})}async function et(t={}){let e=await a.getTemplate("diagnostics-webview"),n=Object.entries(t.tests||{}).map(J).join("");return c(e,{VS_CODE_VERSION:r(t.vscodeVersion||"Unknown"),EXTENSION_VERSION:r(t.extensionVersion||"Unknown"),GENERATED_AT:T(t.timestamp||Date.now()),TEST_SECTIONS:n,SUMMARY_BLOCK:Z(t)})}async function nt(t={}){let e=await a.getTemplate("performance-card-basic");return c(e,{TOTAL_DECORATIONS:(t.totalDecorations??0).toString(),CACHE_HIT_RATE:t.cacheHitRate||"0%"})}async function rt(t=null){if(!t)return a.getTemplate("performance-card-advanced-empty");let e=await a.getTemplate("performance-card-advanced"),n=d(t.memoryUsagePercent,0);return c(e,{MEMORY_ITEMS:(t.memoryItems??0).toString(),MEMORY_USAGE:V(t.memoryUsage||0),MEMORY_USAGE_PERCENT:n.toString(),MEMORY_USAGE_PERCENT_LABEL:q(n,2),MEMORY_HIT_RATE:t.memoryHitRate||"0%",DISK_HIT_RATE:t.diskHitRate||"0%"})}async function ot(t=null){if(!t)return"";let e=await a.getTemplate("performance-card-batch"),n=t.isProcessing?"Active":"Idle",o=d(t.averageBatchTime,0).toFixed(2),s=typeof t.currentProgress=="number"?`${Math.max(0,Math.min(100,t.currentProgress*100)).toFixed(0)}%`:"0%";return c(e,{TOTAL_BATCHES:(t.totalBatches??0).toString(),AVERAGE_BATCH_TIME:o,CURRENT_STATUS:n,QUEUE_LENGTH:(t.queueLength??0).toString(),CURRENT_PROGRESS:s})}async function st(t={}){let e=await a.getTemplate("performance-card-summary");return c(e,{CACHE_HITS:(t.cacheHits??0).toString(),CACHE_MISSES:(t.cacheMisses??0).toString(),ERROR_COUNT:(t.errors??0).toString()})}async function it(t=null){if(!t)return"";let e=await a.getTemplate("performance-card-timing");return c(e,{AVG_GIT_BLAME:`${d(t.avgGitBlameMs,0)}ms`,GIT_CALLS:(t.gitBlameCalls??0).toString(),AVG_FILE_STAT:`${d(t.avgFileStatMs,0)}ms`,FILE_STAT_CALLS:(t.fileStatCalls??0).toString(),TOTAL_GIT_TIME:`${d(t.totalGitBlameTimeMs,0)}ms`,TOTAL_FILE_STAT_TIME:`${d(t.totalFileStatTimeMs,0)}ms`})}async function at(t={}){let e=await a.getTemplate("performance-analytics"),n=await Promise.all([nt(t),rt(t.advancedCache),ot(t.batchProcessor),st(t),it(t.performanceTiming)]);return c(e,{CARDS:n.filter(Boolean).join(`
`)})}$.exports={getApiInformationHtml:Q,generateWorkspaceActivityHTML:X,generateDiagnosticsHTML:tt,generateDiagnosticsWebview:et,generatePerformanceAnalyticsHTML:at}});var ct=M(),{templateStore:mt,initializeTemplateStore:I}=g(),D=!1;function lt(t){!D&&t&&(I(t),D=!0)}module.exports={...ct,templateStore:mt,initializeTemplateStore:I,ensureInitialized:lt};
