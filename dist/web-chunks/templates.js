var module = { exports: {} }; var exports = module.exports; (function() {
var w=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports);var R=w((exports,module)=>{var vscode=require("vscode"),isWebRuntime=process.env.VSCODE_WEB==="true",inspectValue=isWebRuntime?r=>{if(typeof r=="string")return r;try{return JSON.stringify(r,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),LOG_LEVEL_ORDER=["debug","info","warn","error"],DEFAULT_CONSOLE_LEVEL="warn",Logger=class{constructor(){this.e=vscode.window.createOutputChannel("Explorer Dates"),this.u=!1,this.a=null,this.o=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this.o)||(this.o=DEFAULT_LOG_PROFILE),this.n=new Map,this.g=DEFAULT_CONSOLE_LEVEL,this.w(),this.a=vscode.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableLogging")||e.affectsConfiguration("explorerDates.consoleLogLevel"))&&this.w()})}w(){let e=vscode.workspace.getConfiguration("explorerDates");this.u=e.get("enableLogging",!1);let t=(e.get("consoleLogLevel",DEFAULT_CONSOLE_LEVEL)||"").toLowerCase();this.g=LOG_LEVEL_ORDER.includes(t)?t:DEFAULT_CONSOLE_LEVEL}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this.o=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this.n.delete(e);return}this.n.clear()}debug(e,...t){this.u&&this.l("debug",null,e,t)}info(e,...t){this.l("info",null,e,t)}infoWithOptions(e,t,...o){this.l("info",e||null,t,o)}warn(e,...t){this.l("warn",null,e,t)}error(e,t,...o){let s=`[${new Date().toISOString()}] [ERROR] ${e}`;this.e.appendLine(s),t instanceof Error?(this.e.appendLine(`Error: ${t.message}`),t.stack&&this.e.appendLine(`Stack: ${t.stack}`)):t&&this.e.appendLine(this.p(t));let i=this.E(o);i.length>0&&i.forEach(u=>this.e.appendLine(this.p(u))),this.d("error",s,[t,...i])}show(){this.e.show()}clear(){this.e.clear()}dispose(){this.e.dispose(),this.a&&(this.a.dispose(),this.a=null);let e="__explorerDatesLogger";typeof global<"u"&&global[e]===this?global[e]=null:typeof globalThis<"u"&&globalThis[e]===this?globalThis[e]=null:typeof window<"u"&&window[e]===this&&(window[e]=null),loggerInstance===this&&(loggerInstance=null)}l(e,t,o,n){if(e==="debug"&&!this.u||this.b(e,t))return;let i=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${o}`;this.e.appendLine(i);let u=this.E(n);u.length>0&&u.forEach(g=>this.e.appendLine(this.p(g))),this.d(e,i,u)}E(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(o){return`<<log arg threw: ${o.message}>>`}})}p(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}b(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let o=(t.profile||"stress").toLowerCase();if(!this.T(o))return!1;let n=Number(t.throttleLimit)||50,s=t.throttleKey,i=this.n.get(s)||{count:0,suppressed:0,noticeLogged:!1};if(i.count<n)return i.count+=1,this.n.set(s,i),!1;if(i.suppressed+=1,!i.noticeLogged){i.noticeLogged=!0;let u=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${s}" after ${n} entries (profile=${this.o})`;this.e.appendLine(u),this.d("info",u)}return this.n.set(s,i),!0}T(e){let t=this.o||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}O(e){let t=LOG_LEVEL_ORDER.indexOf(this.g),o=LOG_LEVEL_ORDER.indexOf(e);return t===-1||o===-1?!1:o>=t}d(e,t,o=[]){if(!this.O(e))return;(e==="warn"?console.warn:e==="error"?console.error:console.log).call(console,t,...o)}},GLOBAL_LOGGER_KEY="__explorerDatesLogger";function getLogger(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new Logger),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new Logger),globalThis[GLOBAL_LOGGER_KEY]):typeof window<"u"?(window[GLOBAL_LOGGER_KEY]||(window[GLOBAL_LOGGER_KEY]=new Logger),window[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new Logger),loggerInstance)}var loggerInstance=null;module.exports={Logger,getLogger}});var $=w((We,G)=>{var P=require("vscode");function pe(){try{return P?.env?.uiKind===P?.UIKind?.Web}catch{return!1}}G.exports={isWebEnvironment:pe}});var V=w((Be,N)=>{function E(r=""){return r?r.replace(/\\/g,"/"):""}function de(r=""){let e=E(r);return e?e.split("/").filter(Boolean):[]}function U(r=""){let e=de(r);return e.length?e[e.length-1]:""}function fe(r=""){let e=U(r),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}function he(r=""){let e=E(r),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}function me(...r){return E(r.filter(Boolean).join("/")).replace(/\/+/g,"/")}function ge(r=""){return E(r).toLowerCase()}function we(r=""){if(!r)return"";if(typeof r=="string")return r;if(typeof r.fsPath=="string"&&r.fsPath.length>0)return r.fsPath;if(typeof r.path=="string"&&r.path.length>0)return r.path;if(typeof r.toString=="function")try{return r.toString(!0)}catch{return r.toString()}return String(r)}function Ee(r="",e=""){let t=E(r),o=E(e);return t&&o.startsWith(t)?o.substring(t.length).replace(/^\/+/,""):o}N.exports={normalizePath:E,getFileName:U,getExtension:fe,getDirectory:he,joinPath:me,getCacheKey:ge,getUriPath:we,getRelativePath:Ee}});var B=w((je,W)=>{var F=class extends Error{constructor(e,t,o={}){super(t),this.code=e,this.context=o,this.name="ExtensionError"}},ye={FILE_PERMISSION_DENIED:"FILE_PERMISSION_DENIED",WORKSPACE_TOO_LARGE:"WORKSPACE_TOO_LARGE",CHUNK_LOAD_FAILED:"CHUNK_LOAD_FAILED"};function De(r){if(!r)return!1;let e=r.code||r?.name;return["EACCES","EPERM","EROFS","NoPermissions"].includes(e)}W.exports={ExtensionError:F,ERROR_CODES:ye,isPermissionError:De}});var q=w((Ke,z)=>{function j(){return typeof performance<"u"&&performance.now&&performance.timeOrigin?Math.floor(performance.timeOrigin+performance.now()):typeof Date=="function"&&Date.now?Date.now():16409952e5}function K(r){return!!(r&&typeof r=="object"&&typeof r.getTime=="function")}function D(r){if(!r||isNaN(r))return"Invalid Date";if(typeof Intl<"u"&&Intl.DateTimeFormat)try{return new Intl.DateTimeFormat("en-US",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(r)}catch{}let e=864e5,t=36e5,o=6e4,n=1e3,s=1970,i=4,u=Math.floor(r/e),g=r%e,m=Math.floor(g/t),f=Math.floor(g%t/o),h=Math.floor(g%o/n),S=s+Math.floor(u/365.25),x=Math.floor(u%365.25/30.44)+1,C=Math.floor(u%30.44)+1,M=String(Math.min(x,12)).padStart(2,"0"),ae=String(Math.min(C,31)).padStart(2,"0"),le=String(m).padStart(2,"0"),ce=String(f).padStart(2,"0"),ue=String(h).padStart(2,"0");return`${M}/${ae}/${S}, ${le}:${ce}:${ue}`}function Le(r){if(K(r))return r;let e=typeof Date=="function"&&Date.prototype&&Date.prototype.constructor===Date;if(r==null){if(!e){let t=j();return{getTime:()=>t,toLocaleString:()=>D(t),toString:()=>D(t)}}return new Date}if(typeof r=="number")return e?new Date(r):{getTime:()=>r,toLocaleString:()=>D(r),toString:()=>D(r)};if(typeof r=="string"){let t=0;if(e)t=Date.parse(r);else{let o=parseFloat(r);t=isNaN(o)?0:o}return e?new Date(r):{getTime:()=>t,toLocaleString:()=>D(t),toString:()=>D(t)}}return e?new Date(r):{getTime:()=>0,toLocaleString:()=>"Invalid Date",toString:()=>"Invalid Date"}}z.exports={ensureDate:Le,isDateLike:K,getCurrentTimestamp:j}});var J=w((ze,H)=>{var l=require("vscode"),{isWebEnvironment:be}=$(),{normalizePath:Te}=V(),{ExtensionError:Oe,ERROR_CODES:_e,isPermissionError:Se}=B(),{ensureDate:v}=q(),Y=process.env.VSCODE_WEB==="true",xe=process.env.EXPLORER_DATES_FORCE_VSCODE_FS==="1",c=null;if(!Y&&!xe)try{c=require("fs").promises}catch{c=null}var b=class{constructor(){this.isWeb=Y||be()}t(e){if(!e)return"";if(typeof e=="string")return e;if(e&&typeof e=="object"&&typeof e.fsPath=="string")return e.fsPath;if(e&&typeof e=="object"&&typeof e.path=="string")return e.path;if(typeof e=="object"){if(typeof e.fsPath=="string")return e.fsPath;if(typeof e.path=="string")return e.path}return String(e)}r(e){if(e&&typeof e=="object"&&typeof e.scheme=="string"&&typeof e.path=="string")return e;if(typeof e=="string")return l.Uri.file(e);if(e&&typeof e=="object"){if(e.uri&&e.uri!==e)try{return this.r(e.uri)}catch{}if(typeof e.fsPath=="string"&&e.fsPath.length>0)return l.Uri.file(e.fsPath);if(typeof e.path=="string"&&e.path.length>0)return l.Uri.file(e.path);if(typeof e.href=="string"&&e.href.length>0)return l.Uri.parse(e.href);if(typeof e.scheme=="string")return l.Uri.from({scheme:e.scheme,authority:e.authority||"",path:e.path||e.fsPath||"",query:e.query||"",fragment:e.fragment||""});if(typeof e.toString=="function")try{let t=e.toString(!0);if(t&&t!=="[object Object]")return l.Uri.parse(t)}catch{let t=e.toString();if(t&&t!=="[object Object]")return l.Uri.parse(t)}}throw new Error(`Unsupported target type: ${typeof e}`)}async stat(e){if(!this.isWeb&&c)return c.stat(this.t(e));let t=this.r(e),o=await l.workspace.fs.stat(t);return{...o,mtime:v(o.mtime),ctime:v(o.ctime),birthtime:v(o.ctime),isFile:()=>o.type===l.FileType.File,isDirectory:()=>o.type===l.FileType.Directory}}async readFile(e,t="utf8"){if(!this.isWeb&&c)return c.readFile(this.t(e),t);let o=this.r(e),n=await l.workspace.fs.readFile(o);return t===null||t==="binary"?n:new TextDecoder(t).decode(n)}async writeFile(e,t,o="utf8"){let n=this.t(e);try{if(!this.isWeb&&c)return c.writeFile(n,t,o);let s=this.r(e),i=typeof t=="string"?new TextEncoder().encode(t):t;await l.workspace.fs.writeFile(s,i)}catch(s){this.y("write file",n,s)}}async mkdir(e,t={recursive:!0}){let o=this.t(e);try{if(!this.isWeb&&c)return c.mkdir(o,t);let n=this.r(e);await l.workspace.fs.createDirectory(n)}catch(n){this.y("create directory",o,n)}}async readdir(e,t={withFileTypes:!1}){if(!this.isWeb&&c)return c.readdir(this.t(e),t);let o=this.r(e),n=await l.workspace.fs.readDirectory(o);return t.withFileTypes?n.map(([s,i])=>({name:s,isDirectory:()=>i===l.FileType.Directory,isFile:()=>i===l.FileType.File})):n.map(([s])=>s)}async delete(e,t={recursive:!1}){if(!this.isWeb&&c){let n=this.t(e);return t.recursive?c.rm?c.rm(n,t):c.rmdir(n,t):c.unlink(n)}let o=this.r(e);await l.workspace.fs.delete(o,t)}async exists(e){try{return await this.stat(e),!0}catch{return!1}}async ensureDirectory(e){let t=Te(this.t(e));await this.mkdir(t,{recursive:!0})}y(e,t,o){throw Se(o)?new Oe(_e.FILE_PERMISSION_DENIED,`Permission denied while attempting to ${e}`,{path:t,code:o.code}):o}},Ce=new b;H.exports={FileSystemAdapter:b,fileSystem:Ce}});var Z=w((qe,X)=>{var Fe=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],ve={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"};X.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:Fe,GLOBAL_STATE_KEYS:ve}});var oe=w((Ye,re)=>{var ke="__explorerDatesVscode",y=null,T=null,O=!1;function Ae(){try{return globalThis[ke]}catch{return}}function te(){if(T)return T;let r={get:()=>{},async update(){},inspect:()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})};return T={workspace:{workspaceFolders:[],getConfiguration:()=>r},ConfigurationTarget:{Global:1,Workspace:2,WorkspaceFolder:3}},T}var Ie=new Set(["MODULE_NOT_FOUND","ERR_MODULE_NOT_FOUND","WEB_NATIVE_MODULE"]);function Me(r){return!r||r.code&&Ie.has(r.code)?!0:(typeof r.message=="string"?r.message:"").includes("Cannot find module 'vscode'")}function L(){let r=Ae();if(r)return y=k(r),O=!1,y;if(y&&!O)return y;try{y=k(require("vscode")),O=!1}catch(e){if(Me(e))y=k(te()),O=!0;else throw e}return y}var p=new Proxy({},{get(r,e){return L()[e]},set(r,e,t){return L()[e]=t,!0},has(r,e){return e in L()},ownKeys(){return Reflect.ownKeys(L())},getOwnPropertyDescriptor(r,e){let t=Object.getOwnPropertyDescriptor(L(),e);return t&&(t.configurable=!0),t}}),Re="explorerDates",Q="__explorerDatesConfigWrapped";function ee(r){return!r||typeof r!="object"?{get:()=>{},async update(){},inspect:()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})}:(typeof r.get!="function"&&(r.get=()=>{}),typeof r.update!="function"&&(r.update=async()=>{}),typeof r.inspect!="function"&&(r.inspect=()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})),r)}function k(r){if(!r)return te();r.ConfigurationTarget||(r.ConfigurationTarget={Global:1,Workspace:2,WorkspaceFolder:3}),r.workspace||(r.workspace={});let e=r.workspace.getConfiguration;if(typeof e=="function"&&!e[Q]){let t=function(...o){let n=e.apply(this,o);return ee(n)};t[Q]=!0,r.workspace.getConfiguration=t}else typeof e!="function"&&(r.workspace.getConfiguration=()=>ee());return Array.isArray(r.workspace.workspaceFolders)||(r.workspace.workspaceFolders=[]),r}var _=class{constructor(e={}){this._=e.defaultSection||Re}getValue(e,t={}){let{section:o,resource:n}=t,s=this.f(e,o);return this.h(s.section,n).get(s.key)}inspect(e,t={}){let{section:o,resource:n}=t,s=this.f(e,o);return this.h(s.section,n).inspect(s.key)}async updateSetting(e,t,o={}){let{scope:n="auto",resource:s,section:i,reason:u="",force:g=!1}=o,m=this.f(e,i),f=this.h(m.section,s),h=this.S(n,s),S=f.get(m.key),x=f.inspect(m.key),C=this.x(x,h);return t!==void 0&&this.C(S,t)&&!g&&C!==void 0?{key:m.fullKey,updated:!1,reason:"unchanged"}:(await f.update(m.key,t,h),{key:m.fullKey,updated:!0})}async applySettings(e,t={}){let o=Array.isArray(e)?e:Object.entries(e).map(([s,i])=>({key:s,value:i})),n=[];for(let s of o){let i={...t,...s.options||{}};n.push(await this.updateSetting(s.key,s.value,i))}return n}async clearSetting(e,t={}){return this.updateSetting(e,void 0,t)}h(e,t){return p.workspace.getConfiguration(e||void 0,t)}f(e,t){let o=t||this._;if(!o)return{section:void 0,key:e,fullKey:e};if(e.startsWith(`${o}.`)){let n=e.slice(o.length+1);return{section:o,key:n,fullKey:e}}return e.includes(".")?{section:void 0,key:e,fullKey:e}:{section:o,key:e,fullKey:`${o}.${e}`}}S(e,t){return e&&e!=="auto"?this.F(e)||p.ConfigurationTarget.Workspace:t?p.ConfigurationTarget.WorkspaceFolder:p.workspace.workspaceFolders&&p.workspace.workspaceFolders.length>0?p.ConfigurationTarget.Workspace:p.ConfigurationTarget.Global}F(e){switch(e){case"user":return p.ConfigurationTarget.Global;case"workspace":return p.ConfigurationTarget.Workspace;case"workspaceFolder":return p.ConfigurationTarget.WorkspaceFolder;default:return}}k(e){switch(e){case p.ConfigurationTarget.Global:return"user";case p.ConfigurationTarget.Workspace:return"workspace";case p.ConfigurationTarget.WorkspaceFolder:return"workspaceFolder";default:return"unknown"}}C(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(typeof e=="object")try{return JSON.stringify(e)===JSON.stringify(t)}catch{return!1}return!1}x(e,t){if(e)switch(t){case p.ConfigurationTarget.Global:return e.globalValue;case p.ConfigurationTarget.Workspace:return e.workspaceValue;case p.ConfigurationTarget.WorkspaceFolder:return e.workspaceFolderValue;default:return}}},A=null;function Pe(r){return(!A||r&&r.forceNew)&&(A=new _(r)),A}re.exports={SettingsCoordinator:_,getSettingsCoordinator:Pe}});var se=w((He,ne)=>{var a=require("vscode"),{getLogger:Ge}=R(),{fileSystem:$e}=J(),{GLOBAL_STATE_KEYS:Ue}=Z(),{getSettingsCoordinator:Ne}=oe(),d=Ge(),I=class{constructor(e){this.A=e,this.c=e?.globalState||null,this.D=Ue.TEMPLATE_STORE,this.s=$e,this.v=Ne(),this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),d.info("Workspace Templates Manager initialized")}i(){return this.c?this.c.get(this.D,{}):{}}async m(e){if(!this.c)throw new Error("Template storage unavailable");await this.c.update(this.D,e)}L(e){return this.builtInTemplates[e]?this.builtInTemplates[e]:this.i()[e]}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"file-type","explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludedPatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"],"explorerDates.enableContextMenu":!0,"explorerDates.showGitInfo":"author"}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"absolute-long","explorerDates.colorScheme":"none","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"none","explorerDates.highContrastMode":!1,"explorerDates.excludedPatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"],"explorerDates.badgePriority":"size"}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"subtle","explorerDates.showFileSize":!1,"explorerDates.excludedPatterns":["**/node_modules/**","**/.git/**"],"explorerDates.fadeOldFiles":!1,"explorerDates.enableContextMenu":!1}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"recency","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"author","explorerDates.enableContextMenu":!0,"explorerDates.showStatusBar":!0,"explorerDates.smartExclusions":!0,"explorerDates.progressiveLoading":!0,"explorerDates.persistentCache":!0,"explorerDates.enableExportReporting":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"none","explorerDates.showFileSize":!1,"explorerDates.badgePriority":"time","explorerDates.enableContextMenu":!1,"explorerDates.progressiveLoading":!1}}}}async saveCurrentConfiguration(e,t=""){try{let o=a.workspace.getConfiguration("explorerDates"),n={},s=o.inspect();if(s)for(let[f,h]of Object.entries(s))h&&typeof h=="object"&&"workspaceValue"in h?n[`explorerDates.${f}`]=h.workspaceValue:h&&typeof h=="object"&&"globalValue"in h&&(n[`explorerDates.${f}`]=h.globalValue);let i={name:e,description:t,createdAt:new Date().toISOString(),version:"1.0.0",settings:n},u=e.toLowerCase().replace(/[^a-z0-9-]/g,"-"),g=this.i();g[u]=i,await this.m(g);let m=o.get("templateSyncPath","");if(m&&!this.s.isWeb)try{let f=`${m.replace(/[/\\]?$/,"")}/${u}.json`;await this.s.writeFile(f,JSON.stringify(i,null,2)),d.info(`Synced template to ${f}`)}catch(f){d.warn("Failed to sync template to disk path",f)}return a.window.showInformationMessage(`Template "${e}" saved successfully!`),d.info(`Saved workspace template: ${e}`),!0}catch(o){return d.error("Failed to save template:",o),a.window.showErrorMessage(`Failed to save template: ${o.message}`),!1}}async loadTemplate(e){try{let t=this.L(e);if(!t)throw new Error(`Template "${e}" not found`);let n=(await this.v.applySettings(t.settings,{scope:"workspace",reason:`apply-template:${e}`})).filter(i=>i.updated).length,s=n>0?`Template "${t.name}" applied with ${n} setting${n===1?"":"s"} updated.`:`Template "${t.name}" already matched your workspace.`;return a.window.showInformationMessage(s),d.info(`Applied workspace template: ${t.name}`,{changedCount:n}),!0}catch(t){return d.error("Failed to load template:",t),a.window.showErrorMessage(`Failed to load template: ${t.message}`),!1}}async getAvailableTemplates(){let e=[];for(let[t,o]of Object.entries(this.builtInTemplates))e.push({id:t,name:o.name,description:o.description,type:"built-in",createdAt:null});try{let t=this.i();for(let[o,n]of Object.entries(t))e.push({id:o,name:n.name,description:n.description,type:"custom",createdAt:n.createdAt})}catch(t){d.error("Failed to load custom templates:",t)}return e}async deleteTemplate(e){try{if(this.builtInTemplates[e])return a.window.showErrorMessage("Cannot delete built-in templates"),!1;let t=this.i();if(!t[e])throw new Error(`Template "${e}" not found`);return delete t[e],await this.m(t),a.window.showInformationMessage(`Template "${e}" deleted successfully!`),d.info(`Deleted workspace template: ${e}`),!0}catch(t){return d.error("Failed to delete template:",t),a.window.showErrorMessage(`Failed to delete template: ${t.message}`),!1}}async exportTemplate(e,t){try{let o=this.L(e);if(!o)throw new Error(`Template "${e}" not found`);let n=JSON.stringify(o,null,2);if(this.s.isWeb){let i=encodeURIComponent(n);return await a.env.openExternal(a.Uri.parse(`data:application/json;charset=utf-8,${i}`)),a.window.showInformationMessage("Template download triggered in browser"),!0}let s=t instanceof a.Uri?t.fsPath:t;return await this.s.writeFile(s,n),a.window.showInformationMessage(`Template exported to ${s}`),d.info(`Exported template ${e} to ${s}`),!0}catch(o){return d.error("Failed to export template:",o),a.window.showErrorMessage(`Failed to export template: ${o.message}`),!1}}async importTemplate(e){try{let t=e instanceof a.Uri?e:a.Uri.file(e),o=await this.s.readFile(t,"utf8"),n=JSON.parse(o);if(!n.name||!n.settings)throw new Error("Invalid template format");let s=n.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),i=this.i();return i[s]=n,await this.m(i),a.window.showInformationMessage(`Template "${n.name}" imported successfully!`),d.info(`Imported template: ${n.name}`),!0}catch(t){return d.error("Failed to import template:",t),a.window.showErrorMessage(`Failed to import template: ${t.message}`),!1}}async showTemplateManager(){try{let e=await this.getAvailableTemplates(),t=a.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",a.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});t.webview.html=this.getTemplateManagerHtml(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"loadTemplate":await this.loadTemplate(o.templateId);break;case"deleteTemplate":{await this.deleteTemplate(o.templateId);let n=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:n});break}case"exportTemplate":{let n=await a.window.showSaveDialog({defaultUri:a.Uri.file(`${o.templateId}.json`),filters:{JSON:["json"]}});n&&await this.exportTemplate(o.templateId,n);break}case"saveConfig":{await this.saveCurrentConfiguration(o.name,o.description);let n=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:n});break}case"importTemplate":{let n=await a.window.showOpenDialog({canSelectMany:!1,filters:{JSON:["json"]}});if(n&&n[0]){await this.importTemplate(n[0]);let s=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:s})}break}}}),d.info("Template Manager opened")}catch(e){d.error("Failed to show template manager:",e),a.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(e){return`<!DOCTYPE html>
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
                ${e.map(o=>`
            <div class="template-item ${o.type}">
                <div class="template-header">
                    <h3>${o.name}</h3>
                    <span class="template-type">${o.type}</span>
                </div>
                <p class="template-description">${o.description}</p>
                ${o.createdAt?`<small>Created: ${new Date(o.createdAt).toLocaleDateString()}</small>`:""}
                <div class="template-actions">
                    <button onclick="loadTemplate('${o.id}')">Apply</button>
                    <button onclick="exportTemplate('${o.id}')">Export</button>
                    ${o.type==="custom"?`<button onclick="deleteTemplate('${o.id}')" class="delete">Delete</button>`:""}
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
            <\/script>
        </body>
        </html>`}};ne.exports={WorkspaceTemplatesManager:I}});var{WorkspaceTemplatesManager:ie}=se();module.exports={WorkspaceTemplatesManager:ie,createWorkspaceTemplatesManager:r=>new ie(r)};
})(); (globalThis.__explorerDatesChunks = globalThis.__explorerDatesChunks || {})["templates"] = module.exports;
