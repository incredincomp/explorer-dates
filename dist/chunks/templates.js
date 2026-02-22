var ee=Object.create;var L=Object.defineProperty;var te=Object.getOwnPropertyDescriptor;var re=Object.getOwnPropertyNames;var oe=Object.getPrototypeOf,ne=Object.prototype.hasOwnProperty;var f=(o,e)=>()=>(e||o((e={exports:{}}).exports,e),e.exports);var se=(o,e,t,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of re(e))!ne.call(o,n)&&n!==t&&L(o,n,{get:()=>e[n],enumerable:!(r=te(e,n))||r.enumerable});return o};var M=(o,e,t)=>(t=o!=null?ee(oe(o)):{},se(e||!o||!o.__esModule?L(t,"default",{value:o,enumerable:!0}):t,o));var x=f((We,O)=>{var g="__explorerDatesLogger",y=class{constructor(){this.s=null}a(e,t){if(this.s&&typeof this.s[e]=="function")try{return this.s[e](...t)}catch{}switch(e){case"debug":break;case"info":break;case"warn":break;case"error":break;default:break}}debug(...e){return this.a("debug",e)}info(...e){return this.a("info",e)}warn(...e){return this.a("warn",e)}error(...e){return this.a("error",e)}b(e){this.s=e}};function ae(){return typeof global<"u"?(global[g]||(global[g]=new y),global[g]):typeof globalThis<"u"?(globalThis[g]||(globalThis[g]=new y),globalThis[g]):(k||(k=new y),k)}var C=class extends y{},k=null;O.exports={Logger:C,getLogger:ae}});var P=f(($e,R)=>{var F=require("vscode");function ie(){try{return F?.env?.uiKind===F?.UIKind?.Web}catch{return!1}}R.exports={isWebEnvironment:ie}});var I=f((exports,module)=>{var chunk=null;try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){try{chunk=dynamicRequire("../chunks/utils-shared-chunk")}catch{}try{chunk||(chunk=dynamicRequire("./chunks/utils-shared-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("../chunks/path-utils-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("./chunks/path-utils-chunk"))}catch{}}}catch{}if(chunk&&chunk.normalizePath)module.exports={normalizePath:chunk.normalizePath,getFileName:chunk.getFileName,getExtension:chunk.getExtension,getDirectory:chunk.getDirectory,joinPath:chunk.joinPath,getCacheKey:chunk.getCacheKey,getUriPath:chunk.getUriPath,getRelativePath:chunk.getRelativePath};else{let o=function(i=""){return i?i.replace(/\\/g,"/"):""},e=function(i=""){let c=o(i);return c?c.split("/").filter(Boolean):[]},t=function(i=""){let c=e(i);return c.length?c[c.length-1]:""},r=function(i=""){let c=t(i),l=c.lastIndexOf(".");return l<=0?"":c.substring(l).toLowerCase()},n=function(i=""){let c=o(i),l=c.lastIndexOf("/");return l===-1?"":c.substring(0,l)},s=function(...i){return o(i.filter(Boolean).join("/")).replace(/\/+/g,"/")},a=function(i=""){return o(i).toLowerCase()},d=function(i=""){if(!i)return"";if(typeof i=="string")return i;if(typeof i.fsPath=="string"&&i.fsPath.length>0)return i.fsPath;if(typeof i.path=="string"&&i.path.length>0)return i.path;if(typeof i.toString=="function")try{return i.toString(!0)}catch{return i.toString()}return String(i)},h=function(i="",c=""){let l=o(i),b=o(c);return l&&b.startsWith(l)?b.substring(l.length).replace(/^\/+/,""):b};normalizePath=o,getSegments=e,getFileName=t,getExtension=r,getDirectory=n,joinPath=s,getCacheKey=a,getUriPath=d,getRelativePath=h,module.exports={normalizePath:o,getFileName:t,getExtension:r,getDirectory:n,joinPath:s,getCacheKey:a,getUriPath:d,getRelativePath:h}}var normalizePath,getSegments,getFileName,getExtension,getDirectory,joinPath,getCacheKey,getUriPath,getRelativePath});var N=f((Ne,$)=>{var T=class extends Error{constructor(e,t,r={}){super(t),this.code=e,this.context=r,this.name="ExtensionError"}},W={FILE_PERMISSION_DENIED:"FILE_PERMISSION_DENIED",WORKSPACE_TOO_LARGE:"WORKSPACE_TOO_LARGE",CHUNK_LOAD_FAILED:"CHUNK_LOAD_FAILED"};function ce(o){if(!o)return!1;let e=o.code||o?.name;return["EACCES","EPERM","EROFS","NoPermissions"].includes(e)}var _=class extends T{constructor(e,t,r={}){let{recoverable:n=!0,context:s={}}=r;super(W.CHUNK_LOAD_FAILED,`Failed to load ${e}: ${t}`,{chunkName:e,recoverable:n,...s}),this.name="ChunkLoadError",this.chunkName=e,this.recoverable=n}};function le(o,e,t={}){let r=require("vscode"),{userFacing:n=!0}=t,s=e?.recoverable??!0;n&&!s&&r.window.showErrorMessage(`Explorer Dates: ${o} feature unavailable. Please reinstall or rebuild the extension.`)}$.exports={ExtensionError:T,ERROR_CODES:W,isPermissionError:ce,ChunkLoadError:_,handleChunkFailure:le}});var U=f((qe,H)=>{function ue(){return typeof Date=="function"&&Date.now?Date.now():16409952e5}function q(o){return!!(o&&typeof o=="object"&&typeof o.getTime=="function")}function pe(o){if(q(o))return o;if(typeof o=="number")return new Date(o);if(typeof o=="string"){let e=Date.parse(o);return isNaN(e)?new Date:new Date(e)}return new Date}function m(o=""){return o?o.replace(/\\/g,"/"):""}function de(o=""){let e=m(o);return e?e.split("/").filter(Boolean):[]}function K(o=""){let e=de(o);return e.length?e[e.length-1]:""}function he(o=""){let e=K(o),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}function fe(o=""){let e=m(o),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}function me(...o){return m(o.filter(Boolean).join("/")).replace(/\/+/g,"/")}function ge(o=""){return m(o).toLowerCase()}function ye(o=""){if(!o)return"";if(typeof o=="string")return o;if(typeof o.fsPath=="string"&&o.fsPath.length>0)return o.fsPath;if(typeof o.path=="string"&&o.path.length>0)return o.path;if(typeof o.toString=="function")try{return o.toString(!0)}catch{return o.toString()}return String(o)}function we(o="",e=""){let t=m(o),r=m(e);return t&&r.startsWith(t)?r.substring(t.length).replace(/^\/+/,""):r}H.exports={ensureDate:pe,isDateLike:q,getCurrentTimestamp:ue,normalizePath:m,getFileName:K,getExtension:he,getDirectory:fe,joinPath:me,getCacheKey:ge,getUriPath:ye,getRelativePath:we}});var B=f((exports,module)=>{var chunk=null;try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){try{chunk=dynamicRequire("../chunks/utils-shared-chunk")}catch{}try{chunk||(chunk=dynamicRequire("./chunks/utils-shared-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("../chunks/date-helpers-chunk"))}catch{}try{chunk||(chunk=dynamicRequire("./chunks/date-helpers-chunk"))}catch{}}}catch{}if(chunk&&(chunk.ensureDate||chunk.isDateLike||chunk.getCurrentTimestamp))module.exports={ensureDate:chunk.ensureDate,isDateLike:chunk.isDateLike,getCurrentTimestamp:chunk.getCurrentTimestamp};else{let o=function(){return typeof Date=="function"&&Date.now?Date.now():16409952e5},e=function(r){return!!(r&&typeof r=="object"&&typeof r.getTime=="function")},t=function(r){if(e(r))return r;if(typeof r=="number")return new Date(r);if(typeof r=="string"){let n=Date.parse(r);return isNaN(n)?new Date:new Date(n)}return new Date};getCurrentTimestamp=o,isDateLike=e,ensureDate=t,module.exports={ensureDate:t,isDateLike:e,getCurrentTimestamp:o}}var getCurrentTimestamp,isDateLike,ensureDate});var V=f((Ke,G)=>{var u=require("vscode"),{isWebEnvironment:Ee}=P(),{normalizePath:be}=I(),{ExtensionError:Te,ERROR_CODES:De,isPermissionError:ve}=N(),w;try{let o=U();o&&(w=o.ensureDate)}catch{}w||(w=B().ensureDate);var j=process.env.VSCODE_WEB==="true",ke=process.env.EXPLORER_DATES_FORCE_VSCODE_FS==="1",p=null;if(!j&&!ke)try{p=require("fs").promises}catch{p=null}var D=class{constructor(){this.isWeb=j||Ee()}e(e){if(!e)return"";if(typeof e=="string")return e;if(e&&typeof e=="object"&&typeof e.fsPath=="string")return e.fsPath;if(e&&typeof e=="object"&&typeof e.path=="string")return e.path;if(typeof e=="object"){if(typeof e.fsPath=="string")return e.fsPath;if(typeof e.path=="string")return e.path}return String(e)}t(e){if(e&&typeof e=="object"&&typeof e.scheme=="string"&&typeof e.path=="string")return e;if(typeof e=="string")return u.Uri.file(e);if(e&&typeof e=="object"){if(e.uri&&e.uri!==e)try{return this.t(e.uri)}catch{}if(typeof e.fsPath=="string"&&e.fsPath.length>0)return u.Uri.file(e.fsPath);if(typeof e.path=="string"&&e.path.length>0)return u.Uri.file(e.path);if(typeof e.href=="string"&&e.href.length>0)return u.Uri.parse(e.href);if(typeof e.scheme=="string")return u.Uri.from({scheme:e.scheme,authority:e.authority||"",path:e.path||e.fsPath||"",query:e.query||"",fragment:e.fragment||""});if(typeof e.toString=="function")try{let t=e.toString(!0);if(t&&t!=="[object Object]")return u.Uri.parse(t)}catch{let t=e.toString();if(t&&t!=="[object Object]")return u.Uri.parse(t)}}throw new Error(`Unsupported target type: ${typeof e}`)}async stat(e){if(!this.isWeb&&p)return p.stat(this.e(e));let t=this.t(e),r=await u.workspace.fs.stat(t);return{...r,mtime:w(r.mtime),ctime:w(r.ctime),birthtime:w(r.ctime),isFile:()=>r.type===u.FileType.File,isDirectory:()=>r.type===u.FileType.Directory}}async readFile(e,t="utf8"){if(!this.isWeb&&p)return p.readFile(this.e(e),t);let r=this.t(e),n=await u.workspace.fs.readFile(r);return t===null||t==="binary"?n:new TextDecoder(t).decode(n)}async writeFile(e,t,r="utf8"){let n=this.e(e);try{if(!this.isWeb&&p)return p.writeFile(n,t,r);let s=this.t(e),a=typeof t=="string"?new TextEncoder().encode(t):t;await u.workspace.fs.writeFile(s,a)}catch(s){this.p("write file",n,s)}}async mkdir(e,t={recursive:!0}){let r=this.e(e);try{if(!this.isWeb&&p)return p.mkdir(r,t);let n=this.t(e);await u.workspace.fs.createDirectory(n)}catch(n){this.p("create directory",r,n)}}async readdir(e,t={withFileTypes:!1}){if(!this.isWeb&&p)return p.readdir(this.e(e),t);let r=this.t(e),n=await u.workspace.fs.readDirectory(r);return t.withFileTypes?n.map(([s,a])=>({name:s,isDirectory:()=>a===u.FileType.Directory,isFile:()=>a===u.FileType.File})):n.map(([s])=>s)}async delete(e,t={recursive:!1}){if(!this.isWeb&&p){let n=this.e(e);return t.recursive?p.rm?p.rm(n,t):p.rmdir(n,t):p.unlink(n)}let r=this.t(e);await u.workspace.fs.delete(r,t)}async exists(e){try{return await this.stat(e),!0}catch{return!1}}async ensureDirectory(e){let t=be(this.e(e));await this.mkdir(t,{recursive:!0})}p(e,t,r){throw ve(r)?new Te(De.FILE_PERMISSION_DENIED,`Permission denied while attempting to ${e}`,{path:t,code:r.code}):r}},Ce=new D;G.exports={FileSystemAdapter:D,fileSystem:Ce}});var S=f((He,X)=>{var xe=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],_e=Number(process.env.EXPLORER_DATES_DECORATION_POOL_SIZE||2048),Se=Number(process.env.EXPLORER_DATES_FLYWEIGHT_CACHE_SIZE||4096),Ae=Number(process.env.EXPLORER_DATES_WORKSPACE_BALANCED_THRESHOLD||15e3),Le=Number(process.env.EXPLORER_DATES_WORKSPACE_LARGE_THRESHOLD||25e4),z=Number(process.env.EXPLORER_DATES_WORKSPACE_EXTREME_THRESHOLD||4e5),Me=Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_MAX_RESULTS||Math.min(z+1,50001)),Oe={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"},Fe="explorerDatesChunks",Re="__explorerDatesChunks";X.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,DEFAULT_DECORATION_POOL_SIZE:_e,DEFAULT_FLYWEIGHT_CACHE_SIZE:Se,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:xe,WORKSPACE_SCALE_BALANCED_THRESHOLD:Ae,WORKSPACE_SCALE_LARGE_THRESHOLD:Le,WORKSPACE_SCALE_EXTREME_THRESHOLD:z,WORKSPACE_SCAN_MAX_RESULTS:Me,GLOBAL_STATE_KEYS:Oe,WEB_CHUNK_GLOBAL_KEY:Fe,LEGACY_WEB_CHUNK_GLOBAL_KEY:Re}});var Y=f((exports,module)=>{var{getLogger}=x();function createFallbackVscodeMinimal(){return{workspace:{workspaceFolders:[],getConfiguration:()=>({get:()=>{},async update(){},inspect:()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})})},ConfigurationTarget:{Global:1,Workspace:2,WorkspaceFolder:3}}}function resolveVscodeMinimal(){try{return require("vscode")}catch{return createFallbackVscodeMinimal()}}var MinimalSettingsCoordinator=class{constructor(e={}){this.m=e.defaultSection||"explorerDates",this.i=new Map,this.d=new Map,this.T=Number(process.env.EXPLORER_DATES_LOCK_WAIT_WARN_MS||1e3),this._logger=getLogger()}g(e,t){let n=(this.i.get(e)||Promise.resolve()).then(()=>t()),s=n.catch(()=>{});return this.i.set(e,s),n.finally(()=>{this.i.get(e)===s&&this.i.delete(e)}),n}l(e,t){return resolveVscodeMinimal().workspace.getConfiguration(e||void 0,t)}r(e,t){let r=t||this.m;return r?e.startsWith(`${r}.`)?{section:r,key:e.slice(r.length+1),fullKey:e}:e.includes(".")?{section:void 0,key:e,fullKey:e}:{section:r,key:e,fullKey:`${r}.${e}`}:{section:void 0,key:e,fullKey:e}}async updateSetting(e,t,r={}){return this.g(this.r(e,r.section).fullKey,async()=>{let n=this.r(e,r.section),s=this.l(n.section,r.resource);try{let a=this.y(r.scope,r.resource);return await s.update(n.key,t,a),{key:n.fullKey,updated:!0}}catch(a){try{this._logger.warn(`Configuration update failed for ${n.fullKey}: ${a&&a.message}`)}catch{}return{key:n.fullKey,updated:!1,error:a}}})}async applySettings(e,t={}){let r=Array.isArray(e)?e:Object.entries(e).map(([a,d])=>({key:a,value:d})),n=[];for(let a of r)try{n.push(await this.updateSetting(a.key,a.value,t))}catch(d){n.push({key:this.r(a.key,t.section).fullKey,updated:!1,error:d})}let s=n.filter(a=>a&&a.error);if(s.length>0){let a=s.map(h=>`${h.key}: ${h.error&&h.error.message?h.error.message:String(h.error)}`),d=new Error(`Failed to apply ${s.length} setting(s): ${a.join("; ")}`);throw d.details=s,d}return n}y(e,t){return e&&e!=="auto"?this.w(e)||resolveVscodeMinimal().ConfigurationTarget.Workspace:t?resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder:resolveVscodeMinimal().workspace.workspaceFolders&&resolveVscodeMinimal().workspace.workspaceFolders.length>0?resolveVscodeMinimal().ConfigurationTarget.Workspace:resolveVscodeMinimal().ConfigurationTarget.Global}w(e){switch(e){case"user":return resolveVscodeMinimal().ConfigurationTarget.Global;case"workspace":return resolveVscodeMinimal().ConfigurationTarget.Workspace;case"workspaceFolder":return resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder;default:return}}getValue(e,t={}){let{section:r,resource:n}=t||{},s=this.r(e,r);return this.l(s.section,n).get(s.key)}inspect(e,t={}){let{section:r,resource:n}=t||{},s=this.r(e,r);return this.l(s.section,n).inspect(s.key)}async clearSetting(e,t={}){return this.updateSetting(e,void 0,t)}getLockWaitStats(){let e={};for(let[t,r]of this.d.entries())e[t]={...r};return e}resetLockWaitStats(){this.d.clear()}},cachedCoordinator=null;function getSettingsCoordinator(options){if(!cachedCoordinator||options&&options.forceNew){try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){let o=null;try{o=dynamicRequire("../chunks/settings-coordinator-impl-chunk")}catch{}try{o||(o=dynamicRequire("../chunks/settingsCoordinator-impl-chunk"))}catch{}if(o&&typeof o.createSettingsCoordinatorImpl=="function")return cachedCoordinator=o.createSettingsCoordinatorImpl(options),cachedCoordinator}}catch{}try{let{WEB_CHUNK_GLOBAL_KEY:o,LEGACY_WEB_CHUNK_GLOBAL_KEY:e}=S(),t=typeof globalThis<"u"&&(globalThis[o]||globalThis[e])||null;if(t&&t.settingsCoordinatorImpl&&typeof t.settingsCoordinatorImpl.createSettingsCoordinatorImpl=="function")return cachedCoordinator=t.settingsCoordinatorImpl.createSettingsCoordinatorImpl(options),cachedCoordinator}catch{}cachedCoordinator=new MinimalSettingsCoordinator(options)}return cachedCoordinator}module.exports={getSettingsCoordinator,MinimalSettingsCoordinator}});var A=f((exports,module)=>{var vscode=require("vscode"),getLogger=()=>{try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){let o=dynamicRequire("./chunks/logger-chunk");if(o&&typeof o.getLogger=="function")return getLogger=o.getLogger,getLogger()}}catch{}try{return getLogger=x().getLogger,getLogger()}catch{return getLogger=()=>({debug:(()=>{})?.bind(console)||console.log,info:(()=>{}).bind(console),warn:(()=>{}).bind(console),error:(()=>{}).bind(console)}),getLogger()}},{fileSystem}=V(),{GLOBAL_STATE_KEYS}=S(),{getSettingsCoordinator}=Y(),logger=getLogger(),WorkspaceTemplatesManager=class{constructor(e){this.D=e,this.c=e?.globalState||null,this.h=GLOBAL_STATE_KEYS.TEMPLATE_STORE,this.o=fileSystem,this.E=getSettingsCoordinator(),this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),logger.info("Workspace Templates Manager initialized")}n(){return this.c?this.c.get(this.h,{}):{}}async u(e){if(!this.c)throw new Error("Template storage unavailable");await this.c.update(this.h,e)}f(e){return this.builtInTemplates[e]?this.builtInTemplates[e]:this.n()[e]}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"file-type","explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludedPatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"],"explorerDates.enableContextMenu":!0,"explorerDates.showGitInfo":"author"}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"absolute-long","explorerDates.colorScheme":"none","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"none","explorerDates.highContrastMode":!1,"explorerDates.excludedPatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"],"explorerDates.badgePriority":"size"}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"subtle","explorerDates.showFileSize":!1,"explorerDates.excludedPatterns":["**/node_modules/**","**/.git/**"],"explorerDates.fadeOldFiles":!1,"explorerDates.enableContextMenu":!1}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"recency","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"author","explorerDates.enableContextMenu":!0,"explorerDates.showStatusBar":!0,"explorerDates.smartExclusions":!0,"explorerDates.progressiveLoading":!0,"explorerDates.persistentCache":!0,"explorerDates.enableExportReporting":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"none","explorerDates.showFileSize":!1,"explorerDates.badgePriority":"time","explorerDates.enableContextMenu":!1,"explorerDates.progressiveLoading":!1}}}}async saveCurrentConfiguration(e,t=""){try{let r=vscode.workspace.getConfiguration("explorerDates"),n={},s=r.inspect();if(s)for(let[c,l]of Object.entries(s))l&&typeof l=="object"&&"workspaceValue"in l?n[`explorerDates.${c}`]=l.workspaceValue:l&&typeof l=="object"&&"globalValue"in l&&(n[`explorerDates.${c}`]=l.globalValue);let a={name:e,description:t,createdAt:new Date().toISOString(),version:"1.0.0",settings:n},d=e.toLowerCase().replace(/[^a-z0-9-]/g,"-"),h=this.n();h[d]=a,await this.u(h);let i=r.get("templateSyncPath","");if(i&&!this.o.isWeb)try{let c=`${i.replace(/[/\\]?$/,"")}/${d}.json`;await this.o.writeFile(c,JSON.stringify(a,null,2)),logger.info(`Synced template to ${c}`)}catch(c){logger.warn("Failed to sync template to disk path",c)}return vscode.window.showInformationMessage(`Template "${e}" saved successfully!`),logger.info(`Saved workspace template: ${e}`),!0}catch(r){return logger.error("Failed to save template:",r),vscode.window.showErrorMessage(`Failed to save template: ${r.message}`),!1}}async loadTemplate(e){try{let t=this.f(e);if(!t)throw new Error(`Template "${e}" not found`);let n=(await this.E.applySettings(t.settings,{scope:"workspace",reason:`apply-template:${e}`})).filter(a=>a.updated).length,s=n>0?`Template "${t.name}" applied with ${n} setting${n===1?"":"s"} updated.`:`Template "${t.name}" already matched your workspace.`;return vscode.window.showInformationMessage(s),logger.info(`Applied workspace template: ${t.name}`,{changedCount:n}),!0}catch(t){return logger.error("Failed to load template:",t),vscode.window.showErrorMessage(`Failed to load template: ${t.message}`),!1}}async getAvailableTemplates(){let e=[];for(let[t,r]of Object.entries(this.builtInTemplates))e.push({id:t,name:r.name,description:r.description,type:"built-in",createdAt:null});try{let t=this.n();for(let[r,n]of Object.entries(t))e.push({id:r,name:n.name,description:n.description,type:"custom",createdAt:n.createdAt})}catch(t){logger.error("Failed to load custom templates:",t)}return e}async deleteTemplate(e){try{if(this.builtInTemplates[e])return vscode.window.showErrorMessage("Cannot delete built-in templates"),!1;let t=this.n();if(!t[e])throw new Error(`Template "${e}" not found`);return delete t[e],await this.u(t),vscode.window.showInformationMessage(`Template "${e}" deleted successfully!`),logger.info(`Deleted workspace template: ${e}`),!0}catch(t){return logger.error("Failed to delete template:",t),vscode.window.showErrorMessage(`Failed to delete template: ${t.message}`),!1}}async exportTemplate(e,t){try{let r=this.f(e);if(!r)throw new Error(`Template "${e}" not found`);let n=JSON.stringify(r,null,2);if(this.o.isWeb){let a=encodeURIComponent(n);return await vscode.env.openExternal(vscode.Uri.parse(`data:application/json;charset=utf-8,${a}`)),vscode.window.showInformationMessage("Template download triggered in browser"),!0}let s=t instanceof vscode.Uri?t.fsPath:t;return await this.o.writeFile(s,n),vscode.window.showInformationMessage(`Template exported to ${s}`),logger.info(`Exported template ${e} to ${s}`),!0}catch(r){return logger.error("Failed to export template:",r),vscode.window.showErrorMessage(`Failed to export template: ${r.message}`),!1}}async importTemplate(e){try{let t=e instanceof vscode.Uri?e:vscode.Uri.file(e),r=await this.o.readFile(t,"utf8"),n=JSON.parse(r);if(!n.name||!n.settings)throw new Error("Invalid template format");let s=n.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),a=this.n();return a[s]=n,await this.u(a),vscode.window.showInformationMessage(`Template "${n.name}" imported successfully!`),logger.info(`Imported template: ${n.name}`),!0}catch(t){return logger.error("Failed to import template:",t),vscode.window.showErrorMessage(`Failed to import template: ${t.message}`),!1}}async showTemplateManager(){try{let e=await this.getAvailableTemplates(),t=vscode.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});t.webview.html=this.getTemplateManagerHtml(e),t.webview.onDidReceiveMessage(async r=>{switch(r.command){case"loadTemplate":await this.loadTemplate(r.templateId);break;case"deleteTemplate":{await this.deleteTemplate(r.templateId);let n=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:n});break}case"exportTemplate":{let n=await vscode.window.showSaveDialog({defaultUri:vscode.Uri.file(`${r.templateId}.json`),filters:{JSON:["json"]}});n&&await this.exportTemplate(r.templateId,n);break}case"saveConfig":{await this.saveCurrentConfiguration(r.name,r.description);let n=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:n});break}case"importTemplate":{let n=await vscode.window.showOpenDialog({canSelectMany:!1,filters:{JSON:["json"]}});if(n&&n[0]){await this.importTemplate(n[0]);let s=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:s})}break}}}),logger.info("Template Manager opened")}catch(e){logger.error("Failed to show template manager:",e),vscode.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(e){return`<!DOCTYPE html>
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
        </html>`}};module.exports={WorkspaceTemplatesManager}});var Q=f((Ue,Z)=>{var{WorkspaceTemplatesManager:J}=A();Z.exports={WorkspaceTemplatesManager:J,createWorkspaceTemplatesManager:o=>new J(o)}});var E=null,v=null;async function Pe(){if(!(E&&v))try{let o=await Promise.resolve().then(()=>M(Q()));E=o.WorkspaceTemplatesManager,v=o.createWorkspaceTemplatesManager}catch{try{E=(await Promise.resolve().then(()=>M(A()))).WorkspaceTemplatesManager,v=e=>new E(e)}catch(o){throw o}}}module.exports={WorkspaceTemplatesManager:E,createWorkspaceTemplatesManager:async o=>(await Pe(),v(o))};
