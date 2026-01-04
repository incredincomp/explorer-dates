var m=(o,e)=>()=>(e||o((e={exports:{}}).exports,e),e.exports);var T=m((exports,module)=>{var vscode=require("vscode"),isWebRuntime=process.env.VSCODE_WEB==="true",inspectValue=isWebRuntime?o=>{if(typeof o=="string")return o;try{return JSON.stringify(o,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),LOG_LEVEL_ORDER=["debug","info","warn","error"],DEFAULT_CONSOLE_LEVEL="warn",Logger=class{constructor(){this.e=vscode.window.createOutputChannel("Explorer Dates"),this.p=!1,this.a=null,this.o=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this.o)||(this.o=DEFAULT_LOG_PROFILE),this.n=new Map,this.h=DEFAULT_CONSOLE_LEVEL,this.m(),this.a=vscode.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableLogging")||e.affectsConfiguration("explorerDates.consoleLogLevel"))&&this.m()})}m(){let e=vscode.workspace.getConfiguration("explorerDates");this.p=e.get("enableLogging",!1);let t=(e.get("consoleLogLevel",DEFAULT_CONSOLE_LEVEL)||"").toLowerCase();this.h=LOG_LEVEL_ORDER.includes(t)?t:DEFAULT_CONSOLE_LEVEL}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this.o=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this.n.delete(e);return}this.n.clear()}debug(e,...t){this.p&&this.l("debug",null,e,t)}info(e,...t){this.l("info",null,e,t)}infoWithOptions(e,t,...r){this.l("info",e||null,t,r)}warn(e,...t){this.l("warn",null,e,t)}error(e,t,...r){let s=`[${new Date().toISOString()}] [ERROR] ${e}`;this.e.appendLine(s),t instanceof Error?(this.e.appendLine(`Error: ${t.message}`),t.stack&&this.e.appendLine(`Stack: ${t.stack}`)):t&&this.e.appendLine(this.d(t));let i=this.g(r);i.length>0&&i.forEach(d=>this.e.appendLine(this.d(d))),this.u("error",s,[t,...i])}show(){this.e.show()}clear(){this.e.clear()}dispose(){this.e.dispose(),this.a&&(this.a.dispose(),this.a=null);let e="__explorerDatesLogger";typeof global<"u"&&global[e]===this?global[e]=null:typeof globalThis<"u"&&globalThis[e]===this?globalThis[e]=null:typeof window<"u"&&window[e]===this&&(window[e]=null),loggerInstance===this&&(loggerInstance=null)}l(e,t,r,n){if(e==="debug"&&!this.p||this.L(e,t))return;let i=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${r}`;this.e.appendLine(i);let d=this.g(n);d.length>0&&d.forEach(h=>this.e.appendLine(this.d(h))),this.u(e,i,d)}g(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(r){return`<<log arg threw: ${r.message}>>`}})}d(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}L(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let r=(t.profile||"stress").toLowerCase();if(!this.y(r))return!1;let n=Number(t.throttleLimit)||50,s=t.throttleKey,i=this.n.get(s)||{count:0,suppressed:0,noticeLogged:!1};if(i.count<n)return i.count+=1,this.n.set(s,i),!1;if(i.suppressed+=1,!i.noticeLogged){i.noticeLogged=!0;let d=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${s}" after ${n} entries (profile=${this.o})`;this.e.appendLine(d),this.u("info",d)}return this.n.set(s,i),!0}y(e){let t=this.o||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}b(e){let t=LOG_LEVEL_ORDER.indexOf(this.h),r=LOG_LEVEL_ORDER.indexOf(e);return t===-1||r===-1?!1:r>=t}u(e,t,r=[]){if(!this.b(e))return;(e==="warn"?console.warn:e==="error"?console.error:console.log).call(console,t,...r)}},GLOBAL_LOGGER_KEY="__explorerDatesLogger";function getLogger(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new Logger),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new Logger),globalThis[GLOBAL_LOGGER_KEY]):typeof window<"u"?(window[GLOBAL_LOGGER_KEY]||(window[GLOBAL_LOGGER_KEY]=new Logger),window[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new Logger),loggerInstance)}var loggerInstance=null;module.exports={Logger,getLogger}});var x=m((be,_)=>{var O=require("vscode");function Z(){try{return O?.env?.uiKind===O?.UIKind?.Web}catch{return!1}}_.exports={isWebEnvironment:Z}});var F=m((Te,v)=>{function g(o=""){return o?o.replace(/\\/g,"/"):""}function Q(o=""){let e=g(o);return e?e.split("/").filter(Boolean):[]}function S(o=""){let e=Q(o);return e.length?e[e.length-1]:""}function ee(o=""){let e=S(o),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}function te(o=""){let e=g(o),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}function re(...o){return g(o.filter(Boolean).join("/")).replace(/\/+/g,"/")}function oe(o=""){return g(o).toLowerCase()}function ne(o=""){if(!o)return"";if(typeof o=="string")return o;if(typeof o.fsPath=="string"&&o.fsPath.length>0)return o.fsPath;if(typeof o.path=="string"&&o.path.length>0)return o.path;if(typeof o.toString=="function")try{return o.toString(!0)}catch{return o.toString()}return String(o)}function se(o="",e=""){let t=g(o),r=g(e);return t&&r.startsWith(t)?r.substring(t.length).replace(/^\/+/,""):r}v.exports={normalizePath:g,getFileName:S,getExtension:ee,getDirectory:te,joinPath:re,getCacheKey:oe,getUriPath:ne,getRelativePath:se}});var C=m((Oe,I)=>{var L=class extends Error{constructor(e,t,r={}){super(t),this.code=e,this.context=r,this.name="ExtensionError"}},ie={FILE_PERMISSION_DENIED:"FILE_PERMISSION_DENIED",WORKSPACE_TOO_LARGE:"WORKSPACE_TOO_LARGE",CHUNK_LOAD_FAILED:"CHUNK_LOAD_FAILED"};function ae(o){if(!o)return!1;let e=o.code||o?.name;return["EACCES","EPERM","EROFS","NoPermissions"].includes(e)}I.exports={ExtensionError:L,ERROR_CODES:ie,isPermissionError:ae}});var P=m((_e,R)=>{function A(){return typeof performance<"u"&&performance.now&&performance.timeOrigin?Math.floor(performance.timeOrigin+performance.now()):typeof Date=="function"&&Date.now?Date.now():16409952e5}function M(o){return!!(o&&typeof o=="object"&&typeof o.getTime=="function")}function w(o){if(!o||isNaN(o))return"Invalid Date";if(typeof Intl<"u"&&Intl.DateTimeFormat)try{return new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(o)}catch{}let e=864e5,t=36e5,r=6e4,n=1e3,s=1970,i=4,d=Math.floor(o/e),h=o%e,E=Math.floor(h/t),f=Math.floor(h%t/r),u=Math.floor(h%r/n),z=s+Math.floor(d/365.25),K=Math.floor(d%365.25/30.44)+1,V=Math.floor(d%30.44)+1,q=String(Math.min(K,12)).padStart(2,"0"),H=String(Math.min(V,31)).padStart(2,"0"),Y=String(E).padStart(2,"0"),J=String(f).padStart(2,"0"),X=String(u).padStart(2,"0");return`${q}/${H}/${z}, ${Y}:${J}:${X}`}function le(o){if(M(o))return o;let e=typeof Date=="function"&&Date.prototype&&Date.prototype.constructor===Date;if(o==null){if(!e){let t=A();return{getTime:()=>t,toLocaleString:()=>w(t),toString:()=>w(t)}}return new Date}if(typeof o=="number")return e?new Date(o):{getTime:()=>o,toLocaleString:()=>w(o),toString:()=>w(o)};if(typeof o=="string"){let t=0;if(e)t=Date.parse(o);else{let r=parseFloat(o);t=isNaN(r)?0:r}return e?new Date(o):{getTime:()=>t,toLocaleString:()=>w(t),toString:()=>w(t)}}return e?new Date(o):{getTime:()=>0,toLocaleString:()=>"Invalid Date",toString:()=>"Invalid Date"}}R.exports={ensureDate:le,isDateLike:M,getCurrentTimestamp:A}});var k=m((xe,$)=>{var l=require("vscode"),{isWebEnvironment:ce}=x(),{normalizePath:pe}=F(),{ExtensionError:de,ERROR_CODES:ue,isPermissionError:fe}=C(),{ensureDate:y}=P(),G=process.env.VSCODE_WEB==="true",he=process.env.EXPLORER_DATES_FORCE_VSCODE_FS==="1",c=null;if(!G&&!he)try{c=require("fs").promises}catch{c=null}var D=class{constructor(){this.isWeb=G||ce()}t(e){if(!e)return"";if(typeof e=="string")return e;if(e&&typeof e=="object"&&typeof e.fsPath=="string")return e.fsPath;if(e&&typeof e=="object"&&typeof e.path=="string")return e.path;if(typeof e=="object"){if(typeof e.fsPath=="string")return e.fsPath;if(typeof e.path=="string")return e.path}return String(e)}r(e){if(e&&typeof e=="object"&&typeof e.scheme=="string"&&typeof e.path=="string")return e;if(typeof e=="string")return l.Uri.file(e);if(e&&typeof e=="object"){if(e.uri&&e.uri!==e)try{return this.r(e.uri)}catch{}if(typeof e.fsPath=="string"&&e.fsPath.length>0)return l.Uri.file(e.fsPath);if(typeof e.path=="string"&&e.path.length>0)return l.Uri.file(e.path);if(typeof e.href=="string"&&e.href.length>0)return l.Uri.parse(e.href);if(typeof e.scheme=="string")return l.Uri.from({scheme:e.scheme,authority:e.authority||"",path:e.path||e.fsPath||"",query:e.query||"",fragment:e.fragment||""});if(typeof e.toString=="function")try{let t=e.toString(!0);if(t&&t!=="[object Object]")return l.Uri.parse(t)}catch{let t=e.toString();if(t&&t!=="[object Object]")return l.Uri.parse(t)}}throw new Error(`Unsupported target type: ${typeof e}`)}async stat(e){if(!this.isWeb&&c)return c.stat(this.t(e));let t=this.r(e),r=await l.workspace.fs.stat(t);return{...r,mtime:y(r.mtime),ctime:y(r.ctime),birthtime:y(r.ctime),isFile:()=>r.type===l.FileType.File,isDirectory:()=>r.type===l.FileType.Directory}}async readFile(e,t="utf8"){if(!this.isWeb&&c)return c.readFile(this.t(e),t);let r=this.r(e),n=await l.workspace.fs.readFile(r);return t===null||t==="binary"?n:new TextDecoder(t).decode(n)}async writeFile(e,t,r="utf8"){let n=this.t(e);try{if(!this.isWeb&&c)return c.writeFile(n,t,r);let s=this.r(e),i=typeof t=="string"?new TextEncoder().encode(t):t;await l.workspace.fs.writeFile(s,i)}catch(s){this.w("write file",n,s)}}async mkdir(e,t={recursive:!0}){let r=this.t(e);try{if(!this.isWeb&&c)return c.mkdir(r,t);let n=this.r(e);await l.workspace.fs.createDirectory(n)}catch(n){this.w("create directory",r,n)}}async readdir(e,t={withFileTypes:!1}){if(!this.isWeb&&c)return c.readdir(this.t(e),t);let r=this.r(e),n=await l.workspace.fs.readDirectory(r);return t.withFileTypes?n.map(([s,i])=>({name:s,isDirectory:()=>i===l.FileType.Directory,isFile:()=>i===l.FileType.File})):n.map(([s])=>s)}async delete(e,t={recursive:!1}){if(!this.isWeb&&c){let n=this.t(e);return t.recursive?c.rm?c.rm(n,t):c.rmdir(n,t):c.unlink(n)}let r=this.r(e);await l.workspace.fs.delete(r,t)}async exists(e){try{return await this.stat(e),!0}catch{return!1}}async ensureDirectory(e){let t=pe(this.t(e));await this.mkdir(t,{recursive:!0})}w(e,t,r){throw fe(r)?new de(ue.FILE_PERMISSION_DENIED,`Permission denied while attempting to ${e}`,{path:t,code:r.code}):r}},me=new D;$.exports={FileSystemAdapter:D,fileSystem:me}});var N=m((Se,U)=>{var ge=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],we={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"};U.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:ge,GLOBAL_STATE_KEYS:we}});var B=m((ve,W)=>{var a=require("vscode"),{getLogger:Ee}=T(),{fileSystem:De}=k(),{GLOBAL_STATE_KEYS:Le}=N(),p=Ee(),b=class{constructor(e){this.T=e,this.c=e?.globalState||null,this.E=Le.TEMPLATE_STORE,this.s=De,this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),p.info("Workspace Templates Manager initialized")}i(){return this.c?this.c.get(this.E,{}):{}}async f(e){if(!this.c)throw new Error("Template storage unavailable");await this.c.update(this.E,e)}D(e){return this.builtInTemplates[e]?this.builtInTemplates[e]:this.i()[e]}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"file-type","explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludedPatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"],"explorerDates.enableContextMenu":!0,"explorerDates.showGitInfo":"author"}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"absolute-long","explorerDates.colorScheme":"none","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"none","explorerDates.highContrastMode":!1,"explorerDates.excludedPatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"],"explorerDates.badgePriority":"size"}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"subtle","explorerDates.showFileSize":!1,"explorerDates.excludedPatterns":["**/node_modules/**","**/.git/**"],"explorerDates.fadeOldFiles":!1,"explorerDates.enableContextMenu":!1}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"recency","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"author","explorerDates.enableContextMenu":!0,"explorerDates.showStatusBar":!0,"explorerDates.smartExclusions":!0,"explorerDates.progressiveLoading":!0,"explorerDates.persistentCache":!0,"explorerDates.enableExportReporting":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"none","explorerDates.showFileSize":!1,"explorerDates.badgePriority":"time","explorerDates.enableContextMenu":!1,"explorerDates.progressiveLoading":!1}}}}async saveCurrentConfiguration(e,t=""){try{let r=a.workspace.getConfiguration("explorerDates"),n={},s=r.inspect();if(s)for(let[f,u]of Object.entries(s))u&&typeof u=="object"&&"workspaceValue"in u?n[`explorerDates.${f}`]=u.workspaceValue:u&&typeof u=="object"&&"globalValue"in u&&(n[`explorerDates.${f}`]=u.globalValue);let i={name:e,description:t,createdAt:new Date().toISOString(),version:"1.0.0",settings:n},d=e.toLowerCase().replace(/[^a-z0-9-]/g,"-"),h=this.i();h[d]=i,await this.f(h);let E=r.get("templateSyncPath","");if(E&&!this.s.isWeb)try{let f=`${E.replace(/[/\\]?$/,"")}/${d}.json`;await this.s.writeFile(f,JSON.stringify(i,null,2)),p.info(`Synced template to ${f}`)}catch(f){p.warn("Failed to sync template to disk path",f)}return a.window.showInformationMessage(`Template "${e}" saved successfully!`),p.info(`Saved workspace template: ${e}`),!0}catch(r){return p.error("Failed to save template:",r),a.window.showErrorMessage(`Failed to save template: ${r.message}`),!1}}async loadTemplate(e){try{let t=this.D(e);if(!t)throw new Error(`Template "${e}" not found`);let r=a.workspace.getConfiguration();for(let[n,s]of Object.entries(t.settings))await r.update(n,s,a.ConfigurationTarget.Workspace);return a.window.showInformationMessage(`Template "${t.name}" applied successfully!`),p.info(`Applied workspace template: ${t.name}`),!0}catch(t){return p.error("Failed to load template:",t),a.window.showErrorMessage(`Failed to load template: ${t.message}`),!1}}async getAvailableTemplates(){let e=[];for(let[t,r]of Object.entries(this.builtInTemplates))e.push({id:t,name:r.name,description:r.description,type:"built-in",createdAt:null});try{let t=this.i();for(let[r,n]of Object.entries(t))e.push({id:r,name:n.name,description:n.description,type:"custom",createdAt:n.createdAt})}catch(t){p.error("Failed to load custom templates:",t)}return e}async deleteTemplate(e){try{if(this.builtInTemplates[e])return a.window.showErrorMessage("Cannot delete built-in templates"),!1;let t=this.i();if(!t[e])throw new Error(`Template "${e}" not found`);return delete t[e],await this.f(t),a.window.showInformationMessage(`Template "${e}" deleted successfully!`),p.info(`Deleted workspace template: ${e}`),!0}catch(t){return p.error("Failed to delete template:",t),a.window.showErrorMessage(`Failed to delete template: ${t.message}`),!1}}async exportTemplate(e,t){try{let r=this.D(e);if(!r)throw new Error(`Template "${e}" not found`);let n=JSON.stringify(r,null,2);if(this.s.isWeb){let i=encodeURIComponent(n);return await a.env.openExternal(a.Uri.parse(`data:application/json;charset=utf-8,${i}`)),a.window.showInformationMessage("Template download triggered in browser"),!0}let s=t instanceof a.Uri?t.fsPath:t;return await this.s.writeFile(s,n),a.window.showInformationMessage(`Template exported to ${s}`),p.info(`Exported template ${e} to ${s}`),!0}catch(r){return p.error("Failed to export template:",r),a.window.showErrorMessage(`Failed to export template: ${r.message}`),!1}}async importTemplate(e){try{let t=e instanceof a.Uri?e:a.Uri.file(e),r=await this.s.readFile(t,"utf8"),n=JSON.parse(r);if(!n.name||!n.settings)throw new Error("Invalid template format");let s=n.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),i=this.i();return i[s]=n,await this.f(i),a.window.showInformationMessage(`Template "${n.name}" imported successfully!`),p.info(`Imported template: ${n.name}`),!0}catch(t){return p.error("Failed to import template:",t),a.window.showErrorMessage(`Failed to import template: ${t.message}`),!1}}async showTemplateManager(){try{let e=await this.getAvailableTemplates(),t=a.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",a.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});t.webview.html=this.getTemplateManagerHtml(e),t.webview.onDidReceiveMessage(async r=>{switch(r.command){case"loadTemplate":await this.loadTemplate(r.templateId);break;case"deleteTemplate":{await this.deleteTemplate(r.templateId);let n=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:n});break}case"exportTemplate":{let n=await a.window.showSaveDialog({defaultUri:a.Uri.file(`${r.templateId}.json`),filters:{JSON:["json"]}});n&&await this.exportTemplate(r.templateId,n);break}case"saveConfig":{await this.saveCurrentConfiguration(r.name,r.description);let n=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:n});break}case"importTemplate":{let n=await a.window.showOpenDialog({canSelectMany:!1,filters:{JSON:["json"]}});if(n&&n[0]){await this.importTemplate(n[0]);let s=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:s})}break}}}),p.info("Template Manager opened")}catch(e){p.error("Failed to show template manager:",e),a.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(e){return`<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Template Manager</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                .header {
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .templates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                .template-item {
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    background-color: var(--vscode-editor-background);
                }
                .template-item.built-in {
                    border-left: 4px solid var(--vscode-charts-blue);
                }
                .template-item.custom {
                    border-left: 4px solid var(--vscode-charts-green);
                }
                .template-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .template-header h3 {
                    margin: 0;
                    color: var(--vscode-foreground);
                }
                .template-type {
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }
                .template-description {
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 15px;
                }
                .template-actions {
                    display: flex;
                    gap: 10px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                button.delete {
                    background-color: var(--vscode-errorForeground);
                    color: white;
                }
                button.delete:hover {
                    background-color: var(--vscode-errorForeground);
                    opacity: 0.8;
                }
                .actions {
                    margin-bottom: 30px;
                }
                .actions button {
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>\u{1F3A8} Explorer Dates Template Manager</h1>
                <p>Apply, manage, and share your decoration configurations</p>
            </div>
            
            <div class="actions">
                <button onclick="saveCurrentConfig()">\u{1F4BE} Save Current Config</button>
                <button onclick="importTemplate()">\u{1F4E5} Import Template</button>
            </div>

            <div class="templates-grid">
                ${e.map(r=>`
            <div class="template-item ${r.type}">
                <div class="template-header">
                    <h3>${r.name}</h3>
                    <span class="template-type">${r.type}</span>
                </div>
                <p class="template-description">${r.description}</p>
                ${r.createdAt?`<small>Created: ${new Date(r.createdAt).toLocaleDateString()}</small>`:""}
                <div class="template-actions">
                    <button onclick="loadTemplate('${r.id}')">Apply</button>
                    <button onclick="exportTemplate('${r.id}')">Export</button>
                    ${r.type==="custom"?`<button onclick="deleteTemplate('${r.id}')" class="delete">Delete</button>`:""}
                </div>
            </div>
        `).join("")}
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function loadTemplate(templateId) {
                    vscode.postMessage({ command: 'loadTemplate', templateId: templateId });
                }
                
                function deleteTemplate(templateId) {
                    if (confirm('Are you sure you want to delete this template?')) {
                        vscode.postMessage({ command: 'deleteTemplate', templateId: templateId });
                    }
                }
                
                function exportTemplate(templateId) {
                    vscode.postMessage({ command: 'exportTemplate', templateId: templateId });
                }
                
                function saveCurrentConfig() {
                    const name = prompt('Enter template name:');
                    if (name) {
                        const description = prompt('Enter description (optional):') || '';
                        vscode.postMessage({ command: 'saveConfig', name: name, description: description });
                    }
                }
                
                function importTemplate() {
                    vscode.postMessage({ command: 'importTemplate' });
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'refreshTemplates') {
                        location.reload();
                    }
                });
            </script>
        </body>
        </html>`}};W.exports={WorkspaceTemplatesManager:b}});var{WorkspaceTemplatesManager:j}=B();module.exports={WorkspaceTemplatesManager:j,createWorkspaceTemplatesManager:o=>new j(o)};
