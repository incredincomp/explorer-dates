var ai=Object.defineProperty;var d=(a,e)=>ai(a,"name",{value:e,configurable:!0});var S=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports);var M=S((exports,module)=>{var vscode=require("vscode"),isWebRuntime=!1,inspectValue=isWebRuntime?a=>{if(typeof a=="string")return a;try{return JSON.stringify(a,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),ke=class ke{constructor(){this._outputChannel=vscode.window.createOutputChannel("Explorer Dates"),this._isEnabled=!1,this._configurationWatcher=null,this._logProfile=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this._logProfile)||(this._logProfile=DEFAULT_LOG_PROFILE),this._throttleState=new Map,this._updateConfig(),this._configurationWatcher=vscode.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.enableLogging")&&this._updateConfig()})}_updateConfig(){let e=vscode.workspace.getConfiguration("explorerDates");this._isEnabled=e.get("enableLogging",!1)}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this._logProfile=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this._throttleState.delete(e);return}this._throttleState.clear()}debug(e,...t){this._isEnabled&&this._logInternal("debug",null,e,t)}info(e,...t){this._logInternal("info",null,e,t)}infoWithOptions(e,t,...i){this._logInternal("info",e||null,t,i)}warn(e,...t){this._logInternal("warn",null,e,t)}error(e,t,...i){let s=`[${new Date().toISOString()}] [ERROR] ${e}`;this._outputChannel.appendLine(s),t instanceof Error?(this._outputChannel.appendLine(`Error: ${t.message}`),t.stack&&this._outputChannel.appendLine(`Stack: ${t.stack}`)):t&&this._outputChannel.appendLine(this._serializeArg(t));let r=this._evaluateArgs(i);r.length>0&&r.forEach(n=>this._outputChannel.appendLine(this._serializeArg(n)))}show(){this._outputChannel.show()}clear(){this._outputChannel.clear()}dispose(){this._outputChannel.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),loggerInstance===this&&(loggerInstance=null)}_logInternal(e,t,i,o){if(e==="debug"&&!this._isEnabled||this._shouldThrottle(e,t))return;let r=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${i}`;this._outputChannel.appendLine(r);let n=this._evaluateArgs(o);n.length>0&&n.forEach(l=>this._outputChannel.appendLine(this._serializeArg(l))),(e==="warn"?console.warn:e==="error"?console.error:console.log)(r,...n)}_evaluateArgs(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(i){return`<<log arg threw: ${i.message}>>`}})}_serializeArg(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}_shouldThrottle(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let i=(t.profile||"stress").toLowerCase();if(!this._isProfileActive(i))return!1;let o=Number(t.throttleLimit)||50,s=t.throttleKey,r=this._throttleState.get(s)||{count:0,suppressed:0,noticeLogged:!1};if(r.count<o)return r.count+=1,this._throttleState.set(s,r),!1;if(r.suppressed+=1,!r.noticeLogged){r.noticeLogged=!0;let n=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${s}" after ${o} entries (profile=${this._logProfile})`;this._outputChannel.appendLine(n)}return this._throttleState.set(s,r),!0}_isProfileActive(e){let t=this._logProfile||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}};d(ke,"Logger");var Logger=ke,loggerInstance=null;function getLogger(){return loggerInstance||(loggerInstance=new Logger),loggerInstance}d(getLogger,"getLogger");module.exports={Logger,getLogger}});var ne=S((Po,ht)=>{var $e=require("vscode"),ge={en:{now:"now",minutes:"m",hours:"h",days:"d",weeks:"w",months:"mo",years:"y",justNow:"just now",minutesAgo:d(a=>`${a} minute${a!==1?"s":""} ago`,"minutesAgo"),hoursAgo:d(a=>`${a} hour${a!==1?"s":""} ago`,"hoursAgo"),yesterday:"yesterday",daysAgo:d(a=>`${a} day${a!==1?"s":""} ago`,"daysAgo"),lastModified:"Last modified",refreshSuccess:"Date decorations refreshed",activationError:"Explorer Dates failed to activate",errorAccessingFile:"Error accessing file for decoration"},es:{now:"ahora",minutes:"m",hours:"h",days:"d",weeks:"s",months:"m",years:"a",justNow:"ahora mismo",minutesAgo:d(a=>`hace ${a} minuto${a!==1?"s":""}`,"minutesAgo"),hoursAgo:d(a=>`hace ${a} hora${a!==1?"s":""}`,"hoursAgo"),yesterday:"ayer",daysAgo:d(a=>`hace ${a} d\xEDa${a!==1?"s":""}`,"daysAgo"),lastModified:"\xDAltima modificaci\xF3n",refreshSuccess:"Decoraciones de fecha actualizadas",activationError:"Explorer Dates no se pudo activar",errorAccessingFile:"Error al acceder al archivo para decoraci\xF3n"},fr:{now:"maintenant",minutes:"m",hours:"h",days:"j",weeks:"s",months:"m",years:"a",justNow:"\xE0 l'instant",minutesAgo:d(a=>`il y a ${a} minute${a!==1?"s":""}`,"minutesAgo"),hoursAgo:d(a=>`il y a ${a} heure${a!==1?"s":""}`,"hoursAgo"),yesterday:"hier",daysAgo:d(a=>`il y a ${a} jour${a!==1?"s":""}`,"daysAgo"),lastModified:"Derni\xE8re modification",refreshSuccess:"D\xE9corations de date actualis\xE9es",activationError:"\xC9chec de l'activation d'Explorer Dates",errorAccessingFile:"Erreur lors de l'acc\xE8s au fichier pour la d\xE9coration"},de:{now:"jetzt",minutes:"Min",hours:"Std",days:"T",weeks:"W",months:"Mon",years:"J",justNow:"gerade eben",minutesAgo:d(a=>`vor ${a} Minute${a!==1?"n":""}`,"minutesAgo"),hoursAgo:d(a=>`vor ${a} Stunde${a!==1?"n":""}`,"hoursAgo"),yesterday:"gestern",daysAgo:d(a=>`vor ${a} Tag${a!==1?"en":""}`,"daysAgo"),lastModified:"Zuletzt ge\xE4ndert",refreshSuccess:"Datumsdekorationen aktualisiert",activationError:"Explorer Dates konnte nicht aktiviert werden",errorAccessingFile:"Fehler beim Zugriff auf Datei f\xFCr Dekoration"},ja:{now:"\u4ECA",minutes:"\u5206",hours:"\u6642\u9593",days:"\u65E5",weeks:"\u9031",months:"\u30F6\u6708",years:"\u5E74",justNow:"\u305F\u3063\u305F\u4ECA",minutesAgo:d(a=>`${a}\u5206\u524D`,"minutesAgo"),hoursAgo:d(a=>`${a}\u6642\u9593\u524D`,"hoursAgo"),yesterday:"\u6628\u65E5",daysAgo:d(a=>`${a}\u65E5\u524D`,"daysAgo"),lastModified:"\u6700\u7D42\u66F4\u65B0",refreshSuccess:"\u65E5\u4ED8\u88C5\u98FE\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",activationError:"Explorer Dates\u306E\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F",errorAccessingFile:"\u30D5\u30A1\u30A4\u30EB\u30A2\u30AF\u30BB\u30B9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"},zh:{now:"\u73B0\u5728",minutes:"\u5206\u949F",hours:"\u5C0F\u65F6",days:"\u5929",weeks:"\u5468",months:"\u6708",years:"\u5E74",justNow:"\u521A\u521A",minutesAgo:d(a=>`${a}\u5206\u949F\u524D`,"minutesAgo"),hoursAgo:d(a=>`${a}\u5C0F\u65F6\u524D`,"hoursAgo"),yesterday:"\u6628\u5929",daysAgo:d(a=>`${a}\u5929\u524D`,"daysAgo"),lastModified:"\u6700\u540E\u4FEE\u6539",refreshSuccess:"\u65E5\u671F\u88C5\u9970\u5DF2\u5237\u65B0",activationError:"Explorer Dates \u6FC0\u6D3B\u5931\u8D25",errorAccessingFile:"\u8BBF\u95EE\u6587\u4EF6\u88C5\u9970\u65F6\u51FA\u9519"}},Ee=class Ee{constructor(){this._currentLocale="en",this._configurationWatcher=null,this._updateLocale(),this._configurationWatcher=$e.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.locale")&&this._updateLocale()})}_updateLocale(){let t=$e.workspace.getConfiguration("explorerDates").get("locale","auto");t==="auto"&&(t=$e.env.language.split("-")[0]),ge[t]||(t="en"),this._currentLocale=t}getString(e,...t){let o=(ge[this._currentLocale]||ge.en)[e];return typeof o=="function"?o(...t):o||ge.en[e]||e}getCurrentLocale(){return this._currentLocale}formatDate(e,t={}){try{return e.toLocaleDateString(this._currentLocale,t)}catch{return e.toLocaleDateString("en",t)}}dispose(){this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),ae===this&&(ae=null)}};d(Ee,"LocalizationManager");var pe=Ee,ae=null;function ni(){return ae||(ae=new pe),ae}d(ni,"getLocalization");ht.exports={LocalizationManager:pe,getLocalization:ni}});var Me=S((Io,ut)=>{var Z=require("vscode");function ci(){var a,e;try{return((a=Z==null?void 0:Z.env)==null?void 0:a.uiKind)===((e=Z==null?void 0:Z.UIKind)==null?void 0:e.Web)}catch{return!1}}d(ci,"isWebEnvironment");ut.exports={isWebEnvironment:ci}});var B=S((zo,pt)=>{function K(a=""){return a?a.replace(/\\/g,"/"):""}d(K,"normalizePath");function li(a=""){let e=K(a);return e?e.split("/").filter(Boolean):[]}d(li,"getSegments");function gt(a=""){let e=li(a);return e.length?e[e.length-1]:""}d(gt,"getFileName");function di(a=""){let e=gt(a),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}d(di,"getExtension");function hi(a=""){let e=K(a),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}d(hi,"getDirectory");function ui(...a){return K(a.filter(Boolean).join("/")).replace(/\/+/g,"/")}d(ui,"joinPath");function gi(a=""){return K(a).toLowerCase()}d(gi,"getCacheKey");function pi(a=""){if(!a)return"";if(typeof a=="string")return a;if(typeof a.fsPath=="string"&&a.fsPath.length>0)return a.fsPath;if(typeof a.path=="string"&&a.path.length>0)return a.path;if(typeof a.toString=="function")try{return a.toString(!0)}catch{return a.toString()}return String(a)}d(pi,"getUriPath");function mi(a="",e=""){let t=K(a),i=K(e);return t&&i.startsWith(t)?i.substring(t.length).replace(/^\/+/,""):i}d(mi,"getRelativePath");pt.exports={normalizePath:K,getFileName:gt,getExtension:di,getDirectory:hi,joinPath:ui,getCacheKey:gi,getUriPath:pi,getRelativePath:mi}});var G=S((Oo,ft)=>{var L=require("vscode"),{isWebEnvironment:fi}=Me(),{normalizePath:wi}=B(),mt=!1,k=null;if(!mt)try{k=require("fs").promises}catch{k=null}var Pe=class Pe{constructor(){this.isWeb=mt||fi()}_toPath(e){return e?typeof e=="string"?e:e instanceof L.Uri?e.fsPath||e.path:String(e):""}_toUri(e){if(e instanceof L.Uri)return e;if(typeof e=="string")return L.Uri.file(e);throw new Error(`Unsupported target type: ${typeof e}`)}async stat(e){if(!this.isWeb&&k)return k.stat(this._toPath(e));let t=this._toUri(e),i=await L.workspace.fs.stat(t);return{...i,mtime:new Date(i.mtime),ctime:new Date(i.ctime),birthtime:new Date(i.ctime),isFile:d(()=>i.type===L.FileType.File,"isFile"),isDirectory:d(()=>i.type===L.FileType.Directory,"isDirectory")}}async readFile(e,t="utf8"){if(!this.isWeb&&k)return k.readFile(this._toPath(e),t);let i=this._toUri(e),o=await L.workspace.fs.readFile(i);return t===null||t==="binary"?o:new TextDecoder(t).decode(o)}async writeFile(e,t,i="utf8"){if(!this.isWeb&&k)return k.writeFile(this._toPath(e),t,i);let o=this._toUri(e),s=typeof t=="string"?new TextEncoder().encode(t):t;await L.workspace.fs.writeFile(o,s)}async mkdir(e,t={recursive:!0}){if(!this.isWeb&&k)return k.mkdir(this._toPath(e),t);let i=this._toUri(e);await L.workspace.fs.createDirectory(i)}async readdir(e,t={withFileTypes:!1}){if(!this.isWeb&&k)return k.readdir(this._toPath(e),t);let i=this._toUri(e),o=await L.workspace.fs.readDirectory(i);return t.withFileTypes?o.map(([s,r])=>({name:s,isDirectory:d(()=>r===L.FileType.Directory,"isDirectory"),isFile:d(()=>r===L.FileType.File,"isFile")})):o.map(([s])=>s)}async delete(e,t={recursive:!1}){if(!this.isWeb&&k){let o=this._toPath(e);return t.recursive?k.rm?k.rm(o,t):k.rmdir(o,t):k.unlink(o)}let i=this._toUri(e);await L.workspace.fs.delete(i,t)}async exists(e){try{return await this.stat(e),!0}catch{return!1}}async ensureDirectory(e){let t=wi(this._toPath(e));await this.mkdir(t,{recursive:!0})}};d(Pe,"FileSystemAdapter");var me=Pe,vi=new me;ft.exports={FileSystemAdapter:me,fileSystem:vi}});var vt=S((No,wt)=>{var I=require("vscode"),{getLogger:_i}=M(),{fileSystem:bi}=G(),{normalizePath:Ae,getRelativePath:yi,getFileName:Ci}=B(),Re=class Re{constructor(){this._logger=_i(),this._fs=bi,this._commonExclusions=["node_modules",".npm",".yarn","coverage","nyc_output","dist","build","out","target","bin","obj",".vscode",".idea",".vs",".vscode-test",".git",".svn",".hg",".bzr",".pnpm-store","bower_components","jspm_packages","tmp","temp",".tmp",".cache",".parcel-cache",".DS_Store","Thumbs.db","__pycache__",".pytest_cache",".tox","venv",".env",".virtualenv","vendor",".docker","logs","*.log"],this._patternScores=new Map,this._workspaceAnalysis=new Map,this._logger.info("SmartExclusionManager initialized")}async cleanupAllWorkspaceProfiles(){let e=I.workspace.getConfiguration("explorerDates"),t=e.get("workspaceExclusionProfiles",{}),i=!1;for(let[o,s]of Object.entries(t)){let r=Array.isArray(s)?s:[],n=this._dedupeList(r);this._areListsEqual(r,n)||(t[o]=n,i=!0,this._logger.debug(`Deduped workspace exclusions for ${o}`,{before:r.length,after:n.length}))}i?(await e.update("workspaceExclusionProfiles",t,I.ConfigurationTarget.Global),this._logger.info("Cleaned up duplicate workspace exclusions",{workspaceCount:Object.keys(t).length})):this._logger.debug("Workspace exclusion profiles already clean")}async analyzeWorkspace(e){try{let t=Ae((e==null?void 0:e.fsPath)||(e==null?void 0:e.path)||""),i={detectedPatterns:[],suggestedExclusions:[],projectType:"unknown",riskFolders:[]};i.projectType=await this._detectProjectType(e);let o=await this._scanForExclusionCandidates(e,t),s=this._scorePatterns(o,i.projectType);return i.detectedPatterns=o,i.suggestedExclusions=s.filter(r=>r.score>.7).map(r=>r.pattern),i.riskFolders=s.filter(r=>r.riskLevel==="high").map(r=>r.pattern),this._workspaceAnalysis.set(t,i),this._logger.info(`Workspace analysis complete for ${t}`,i),i}catch(t){return this._logger.error("Failed to analyze workspace",t),null}}async _detectProjectType(e){let t=[{file:"package.json",type:"javascript"},{file:"pom.xml",type:"java"},{file:"Cargo.toml",type:"rust"},{file:"setup.py",type:"python"},{file:"requirements.txt",type:"python"},{file:"Gemfile",type:"ruby"},{file:"composer.json",type:"php"},{file:"go.mod",type:"go"},{file:"CMakeLists.txt",type:"cpp"},{file:"Dockerfile",type:"docker"}];if(!e)return"unknown";for(let i of t)try{let o=I.Uri.joinPath(e,i.file);if(await this._fs.exists(o))return i.type}catch{}return"unknown"}async _scanForExclusionCandidates(e,t,i=2){let o=[],s=d(async(r,n=0)=>{if(!(n>i))try{let c=await this._fs.readdir(r,{withFileTypes:!0});for(let l of c)if(l.isDirectory()){let u=I.Uri.joinPath(r,l.name),h=Ae(u.fsPath||u.path),v=yi(t,h);this._commonExclusions.includes(l.name)&&o.push({name:l.name,path:v,type:"common",size:await this._getDirectorySize(u)});let g=await this._getDirectorySize(u);g>10485760&&o.push({name:l.name,path:v,type:"large",size:g}),await s(u,n+1)}}catch{}},"scanDirectory");return await s(e),o}async _getDirectorySize(e){try{let t=await this._fs.readdir(e,{withFileTypes:!0}),i=0,o=0;for(let s of t){if(o>100)break;if(s.isFile())try{let r=I.Uri.joinPath(e,s.name),n=await this._fs.stat(r);i+=n.size,o++}catch{}}return i}catch{return 0}}_scorePatterns(e,t){return e.map(i=>{let o=0,s="low";switch(i.type==="common"&&(o+=.8),i.size>100*1024*1024?(o+=.9,s="high"):i.size>10*1024*1024&&(o+=.5,s="medium"),t){case"javascript":["node_modules",".npm","coverage","dist","build"].includes(i.name)&&(o+=.9);break;case"python":["__pycache__",".pytest_cache","venv",".env"].includes(i.name)&&(o+=.9);break;case"java":["target","build",".gradle"].includes(i.name)&&(o+=.9);break}return["src","lib","app","components","pages"].includes(i.name.toLowerCase())&&(o=0,s="none"),{pattern:i.name,path:i.path,score:Math.min(o,1),riskLevel:s,size:i.size,type:i.type}})}async getWorkspaceExclusions(e){let t=I.workspace.getConfiguration("explorerDates"),i=t.get("workspaceExclusionProfiles",{}),o=this._getWorkspaceKey(e),s=i[o]||[],r=this._dedupeList(s);if(r.length!==s.length){i[o]=r;try{await t.update("workspaceExclusionProfiles",i,I.ConfigurationTarget.Global),this._logger.info(`Cleaned duplicate exclusions for ${o}`,{before:s.length,after:r.length})}catch(n){this._logger.warn(`Failed to persist cleaned exclusions for ${o}`,n)}}return r}async saveWorkspaceExclusions(e,t){let i=I.workspace.getConfiguration("explorerDates"),o=i.get("workspaceExclusionProfiles",{}),s=this._getWorkspaceKey(e),r=this._dedupeList(t);if(Array.isArray(o[s])?this._areListsEqual(o[s],r):!1){this._logger.debug(`No workspace exclusion changes for ${s}`);return}o[s]=r,await i.update("workspaceExclusionProfiles",o,I.ConfigurationTarget.Global),this._logger.info(`Saved workspace exclusions for ${s}`,r)}async getCombinedExclusions(e){let t=I.workspace.getConfiguration("explorerDates"),i=t.get("excludedFolders",[]),o=t.get("excludedPatterns",[]),s=t.get("smartExclusions",!0),r=[...i],n=[...o],c=await this.getWorkspaceExclusions(e);if(r.push(...c),s){let l=await this.analyzeWorkspace(e);l&&r.push(...l.suggestedExclusions)}return r=[...new Set(r)],n=[...new Set(n)],{folders:r,patterns:n}}_getWorkspaceKey(e){if(!e)return"unknown-workspace";let t=e.fsPath||e.path||"";return Ci(t)||Ae(t)}async suggestExclusions(e){let t=await this.analyzeWorkspace(e),i=this._dedupeList((t==null?void 0:t.suggestedExclusions)||[]);if(!t||i.length===0)return;let o=await this.getWorkspaceExclusions(e),s=i.filter(l=>!o.includes(l));if(s.length===0){this._logger.debug("No new smart exclusions detected",{workspace:this._getWorkspaceKey(e)});return}let r=this._mergeExclusions(o,s);await this.saveWorkspaceExclusions(e,r);let n=s.length===1?`Explorer Dates automatically excluded "${s[0]}" to keep Explorer responsive.`:`Explorer Dates automatically excluded ${s.length} folders to keep Explorer responsive.`,c=await I.window.showInformationMessage(`${n} Keep these exclusions?`,"Keep","Review","Revert");c==="Revert"?(await this.saveWorkspaceExclusions(e,o),I.window.showInformationMessage("Smart exclusions reverted. Decorations will refresh for the restored folders."),this._logger.info("User reverted smart exclusions",{reverted:s})):c==="Review"?(this._showExclusionReview(t),this._logger.info("User reviewing smart exclusions",{pending:s})):this._logger.info("User kept smart exclusions",{accepted:s})}_dedupeList(e=[]){return Array.from(new Set(e.filter(Boolean)))}_mergeExclusions(e=[],t=[]){return this._dedupeList([...e||[],...t||[]])}_areListsEqual(e=[],t=[]){return e.length!==t.length?!1:e.every((i,o)=>i===t[o])}_showExclusionReview(e){let t=I.window.createWebviewPanel("exclusionReview","Smart Exclusion Review",I.ViewColumn.One,{enableScripts:!0});t.webview.html=this._generateReviewHTML(e)}_generateReviewHTML(e){let t=d(o=>{if(o<1024)return`${o} B`;let s=o/1024;return s<1024?`${s.toFixed(1)} KB`:`${(s/1024).toFixed(1)} MB`},"formatSize"),i=e.detectedPatterns.map(o=>`
            <tr>
                <td>${o.name}</td>
                <td>${o.path}</td>
                <td>${t(o.size)}</td>
                <td>${o.type}</td>
                <td>
                    <input type="checkbox" ${e.suggestedExclusions.includes(o.name)?"checked":""}>
                </td>
            </tr>
        `).join("");return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Smart Exclusion Review</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
                    th { background-color: var(--vscode-editor-background); font-weight: bold; }
                    .project-info { background: var(--vscode-editor-background); padding: 15px; border-radius: 4px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>\u{1F9E0} Smart Exclusion Review</h1>
                <div class="project-info">
                    <strong>Project Type:</strong> ${e.projectType}<br>
                    <strong>Detected Patterns:</strong> ${e.detectedPatterns.length}<br>
                    <strong>Suggested Exclusions:</strong> ${e.suggestedExclusions.length}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Folder</th>
                            <th>Path</th>
                            <th>Size</th>
                            <th>Type</th>
                            <th>Exclude</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${i}
                    </tbody>
                </table>
            </body>
            </html>
        `}};d(Re,"SmartExclusionManager");var Ie=Re;wt.exports={SmartExclusionManager:Ie}});var bt=S((Uo,_t)=>{var J=require("vscode"),{getLogger:xi}=M(),Le=class Le{constructor(){this._logger=xi(),this._processingQueue=[],this._isProcessing=!1,this._batchSize=50,this._processedCount=0,this._totalCount=0,this._statusBar=null,this._configurationWatcher=null,this._metrics={totalBatches:0,averageBatchTime:0,totalProcessingTime:0},this._logger.info("BatchProcessor initialized")}initialize(){let e=J.workspace.getConfiguration("explorerDates");this._batchSize=e.get("batchSize",50),this._statusBar=J.window.createStatusBarItem(J.StatusBarAlignment.Left,-1e3),this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=J.workspace.onDidChangeConfiguration(t=>{t.affectsConfiguration("explorerDates.batchSize")&&(this._batchSize=J.workspace.getConfiguration("explorerDates").get("batchSize",50),this._logger.debug(`Batch size updated to: ${this._batchSize}`))})}queueForProcessing(e,t,i={}){let o={id:Date.now()+Math.random(),uris:Array.isArray(e)?e:[e],processor:t,priority:i.priority||"normal",background:i.background||!1,onProgress:i.onProgress,onComplete:i.onComplete};return o.priority==="high"?this._processingQueue.unshift(o):this._processingQueue.push(o),this._logger.debug(`Queued batch ${o.id} with ${o.uris.length} URIs`),this._isProcessing||this._startProcessing(),o.id}async _startProcessing(){if(this._isProcessing)return;this._isProcessing=!0,this._processedCount=0,this._totalCount=this._processingQueue.reduce((t,i)=>t+i.uris.length,0),this._logger.info(`Starting batch processing: ${this._totalCount} items in ${this._processingQueue.length} batches`),this._updateStatusBar();let e=Date.now();try{for(;this._processingQueue.length>0;){let t=this._processingQueue.shift();await this._processBatch(t),t.background||await this._sleep(1)}}catch(t){this._logger.error("Batch processing failed",t)}finally{this._isProcessing=!1,this._hideStatusBar();let t=Date.now()-e;this._updateMetrics(t),this._logger.info(`Batch processing completed in ${t}ms`)}}async _processBatch(e){let t=Date.now();this._logger.debug(`Processing batch ${e.id} with ${e.uris.length} URIs`);try{let i=this._chunkArray(e.uris,this._batchSize);for(let o=0;o<i.length;o++){let s=i[o],r=[];for(let n of s){try{let c=await e.processor(n);r.push({uri:n,result:c,success:!0}),this._processedCount++}catch(c){r.push({uri:n,error:c,success:!1}),this._processedCount++,this._logger.debug(`Failed to process ${n.fsPath}`,c)}this._updateStatusBar(),e.onProgress&&e.onProgress({processed:this._processedCount,total:this._totalCount,current:n})}await this._sleep(0),!e.background&&o<i.length-1&&await this._sleep(5)}e.onComplete&&e.onComplete({processed:e.uris.length,success:!0,duration:Date.now()-t})}catch(i){this._logger.error(`Batch ${e.id} processing failed`,i),e.onComplete&&e.onComplete({processed:0,success:!1,error:i,duration:Date.now()-t})}this._metrics.totalBatches++}async processDirectoryProgressively(e,t,i={}){let o=i.maxFiles||1e3;try{let s=new J.RelativePattern(e,"**/*"),r=await J.workspace.findFiles(s,null,o);if(r.length===0){this._logger.debug(`No files found in directory: ${e.fsPath}`);return}return this._logger.info(`Processing directory progressively: ${r.length} files in ${e.fsPath}`),this.queueForProcessing(r,t,{priority:"normal",background:!0,...i})}catch(s){throw this._logger.error("Progressive directory processing failed",s),s}}async refreshInBackground(e,t,i={}){return this.queueForProcessing(e,t,{background:!0,priority:"low",...i})}async refreshVisible(e,t,i={}){return this.queueForProcessing(e,t,{background:!1,priority:"high",...i})}_chunkArray(e,t){let i=[];for(let o=0;o<e.length;o+=t)i.push(e.slice(o,o+t));return i}_sleep(e){return new Promise(t=>setTimeout(t,e))}_updateStatusBar(){if(!this._statusBar)return;let e=this._totalCount>0?Math.round(this._processedCount/this._totalCount*100):0;this._statusBar.text=`$(sync~spin) Processing files... ${e}% (${this._processedCount}/${this._totalCount})`,this._statusBar.tooltip="Explorer Dates is processing file decorations",this._statusBar.show()}_hideStatusBar(){this._statusBar&&this._statusBar.hide()}_updateMetrics(e){this._metrics.totalProcessingTime+=e,this._metrics.totalBatches>0&&(this._metrics.averageBatchTime=this._metrics.totalProcessingTime/this._metrics.totalBatches)}getMetrics(){return{...this._metrics,isProcessing:this._isProcessing,queueLength:this._processingQueue.length,currentProgress:this._totalCount>0?this._processedCount/this._totalCount:0}}cancelAll(){this._processingQueue.length=0,this._hideStatusBar(),this._logger.info("All batch processing cancelled")}cancelBatch(e){let t=this._processingQueue.findIndex(i=>i.id===e);if(t!==-1){let i=this._processingQueue.splice(t,1)[0];return this._logger.debug(`Cancelled batch ${e} with ${i.uris.length} URIs`),!0}return!1}dispose(){this.cancelAll(),this._statusBar&&this._statusBar.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("BatchProcessor disposed",this.getMetrics())}};d(Le,"BatchProcessor");var ze=Le;_t.exports={BatchProcessor:ze}});var ce=S((Go,yt)=>{var Di=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],Si={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"};yt.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:Di,GLOBAL_STATE_KEYS:Si}});var Ft=S((Ho,St)=>{var Ct=require("vscode"),{getLogger:Fi}=M(),{fileSystem:Ti}=G(),{GLOBAL_STATE_KEYS:xt,DEFAULT_PERSISTENT_CACHE_TTL:Dt}=ce(),We=class We{constructor(e){this._logger=Fi(),this._context=e,this._memoryCache=new Map,this._maxMemoryUsage=50*1024*1024,this._currentMemoryUsage=0,this._persistentCacheEnabled=!0,this._storage=(e==null?void 0:e.globalState)||null,this._storageKey=xt.ADVANCED_CACHE,this._metadataKey=xt.ADVANCED_CACHE_METADATA,this._fs=Ti,this._configurationWatcher=null,this._metrics={memoryHits:0,memoryMisses:0,diskHits:0,diskMisses:0,evictions:0,persistentLoads:0,persistentSaves:0},this._cleanupInterval=null,this._saveInterval=null,this._memoryDirty=!1,this._skipNextPersistentSave=!1,this._logger.info("AdvancedCache initialized")}async initialize(){try{await this._loadConfiguration(),this._persistentCacheEnabled&&await this._loadPersistentCache(),this._startIntervals(),this._logger.info("Advanced cache system initialized",{persistentEnabled:this._persistentCacheEnabled&&!!this._storage,maxMemoryUsage:this._maxMemoryUsage,storage:this._storage?"globalState":"memory-only"})}catch(e){this._logger.error("Failed to initialize cache system",e)}}async _loadConfiguration(){let e=Ct.workspace.getConfiguration("explorerDates");this._persistentCacheEnabled=e.get("persistentCache",!0),this._maxMemoryUsage=e.get("maxMemoryUsage",50)*1024*1024,this._ensureConfigurationWatcher()}_ensureConfigurationWatcher(){this._configurationWatcher||(this._configurationWatcher=Ct.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.persistentCache")||e.affectsConfiguration("explorerDates.maxMemoryUsage"))&&this._loadConfiguration()}))}_createCacheEntry(e,t={}){let i=Date.now();return{value:e,size:t.size??this._estimateSize(e),ttl:t.ttl??Dt,tags:t.tags&&t.tags.length>0?[...t.tags]:void 0,version:t.version??1,timestamp:t.timestamp??i,lastAccess:t.lastAccess??i}}_touchEntry(e){e.lastAccess=Date.now()}_serializeMetadata(e){return{ts:e.timestamp,la:e.lastAccess,ttl:e.ttl,sz:e.size,tg:e.tags,v:e.version}}_normalizePersistedMetadata(e){return e?{timestamp:e.timestamp??e.ts??Date.now(),lastAccess:e.lastAccess??e.la??Date.now(),ttl:e.ttl??e.tt??Dt,size:e.size??e.sz,tags:e.tags??e.tg,version:e.version??e.v??1}:null}_hydratePersistedEntry(e){if(!e)return null;let t=this._normalizePersistedMetadata(e.metadata||e.meta);return t?this._createCacheEntry(e.data??e.value,t):null}_serializeEntry(e){return{data:e.value,metadata:this._serializeMetadata(e)}}async get(e){let t=this._memoryCache.get(e);if(t){if(this._isValid(t))return this._metrics.memoryHits++,this._touchEntry(t),t.value;this._removeFromMemory(e)}if(this._metrics.memoryMisses++,this._persistentCacheEnabled){let i=await this._getFromPersistentCache(e);if(i)return this._addToMemory(e,i,{skipDirtyFlag:!0}),this._metrics.diskHits++,i.value}return this._metrics.diskMisses++,null}async set(e,t,i={}){let o=this._createCacheEntry(t,{ttl:i.ttl,tags:i.tags,version:i.version});this._addToMemory(e,o),this._persistentCacheEnabled&&this._schedulePersistentSave()}_addToMemory(e,t,i={}){let{skipDirtyFlag:o=!1}=i;this._currentMemoryUsage+t.size>this._maxMemoryUsage&&this._evictOldestItems(t.size),this._memoryCache.has(e)&&this._removeFromMemory(e),this._memoryCache.set(e,t),this._currentMemoryUsage+=t.size,o||(this._memoryDirty=!0,this._skipNextPersistentSave=!1),this._logger.debug(`Added to cache: ${e} (${t.size} bytes)`)}_removeFromMemory(e){let t=this._memoryCache.get(e);t&&(this._memoryCache.delete(e),this._currentMemoryUsage-=t.size,this._memoryDirty=!0,this._skipNextPersistentSave=!1)}_evictOldestItems(e){let t=Array.from(this._memoryCache.entries());t.sort((o,s)=>o[1].lastAccess-s[1].lastAccess);let i=0;for(let[o,s]of t)if(this._removeFromMemory(o),i+=s.size,this._metrics.evictions++,i>=e)break;this._logger.debug(`Evicted items to free ${i} bytes`)}_isValid(e){return e?Date.now()-e.timestamp<e.ttl:!1}_estimateSize(e){switch(typeof e){case"string":return e.length*2;case"number":return 8;case"boolean":return 4;case"object":return e===null?4:JSON.stringify(e).length*2;default:return 100}}async _loadPersistentCache(){if(!this._storage){let e=this._fs.isWeb?"web":"desktop";this._logger.debug(`Persistent storage unavailable in ${e} environment - running in memory-only mode`);return}try{let e=this._storage.get(this._storageKey,{}),t=0,i=0;for(let[o,s]of Object.entries(e)){let r=this._hydratePersistedEntry(s);if(r&&this._isValid(r)){this._addToMemory(o,r,{skipDirtyFlag:!0}),t++;continue}i++}this._memoryDirty=!1,this._metrics.persistentLoads++,this._logger.info(`Loaded persistent cache: ${t} items (${i} expired)`)}catch(e){this._logger.error("Failed to load persistent cache from globalState",e)}}async _savePersistentCache(){if(!(!this._persistentCacheEnabled||!this._storage)){if(this._skipNextPersistentSave){this._logger.debug("Skipping persistent cache save (runtime reset requested)"),this._skipNextPersistentSave=!1;return}if(!this._memoryDirty){this._logger.debug("Persistent cache unchanged - skipping save");return}try{let e={};for(let[t,i]of this._memoryCache.entries())this._isValid(i)&&(e[t]=this._serializeEntry(i));await this._storage.update(this._storageKey,e),this._metrics.persistentSaves++,this._memoryDirty=!1,this._logger.debug(`Saved persistent cache: ${Object.keys(e).length} items`)}catch(e){this._logger.error("Failed to save persistent cache to globalState",e)}}}async _getFromPersistentCache(e){if(!this._storage)return null;let i=this._storage.get(this._storageKey,{})[e],o=this._hydratePersistedEntry(i);return o&&this._isValid(o)?o:null}_schedulePersistentSave(){this._storage&&(this._saveTimeout&&clearTimeout(this._saveTimeout),this._saveTimeout=setTimeout(()=>{this._savePersistentCache()},5e3))}_startIntervals(){this._cleanupInterval=setInterval(()=>{this._cleanupExpiredItems()},300*1e3),this._storage&&this._persistentCacheEnabled&&(this._saveInterval=setInterval(()=>{this._savePersistentCache()},600*1e3))}_cleanupExpiredItems(){let e=[];for(let[t,i]of this._memoryCache.entries())this._isValid(i)||e.push(t);for(let t of e)this._removeFromMemory(t);e.length>0&&this._logger.debug(`Cleaned up ${e.length} expired cache items`)}invalidateByTags(e){let t=[];for(let[i,o]of this._memoryCache.entries())o.tags&&o.tags.some(s=>e.includes(s))&&t.push(i);for(let i of t)this._removeFromMemory(i);this._logger.debug(`Invalidated ${t.length} items by tags:`,e)}invalidateByPattern(e){let t=[],i=new RegExp(e);for(let o of this._memoryCache.keys())i.test(o)&&t.push(o);for(let o of t)this._removeFromMemory(o);this._logger.debug(`Invalidated ${t.length} items by pattern: ${e}`)}clear(){this._memoryCache.clear(),this._currentMemoryUsage=0,this._memoryDirty=!0,this._logger.info("Cache cleared")}resetRuntimeOnly(){this._memoryCache.clear(),this._currentMemoryUsage=0,this._memoryDirty=!1,this._skipNextPersistentSave=!0,this._logger.info("Runtime cache cleared (persistent snapshot preserved)")}getStats(){let e=this._metrics.memoryHits+this._metrics.memoryMisses>0?(this._metrics.memoryHits/(this._metrics.memoryHits+this._metrics.memoryMisses)*100).toFixed(2):"0",t=this._metrics.diskHits+this._metrics.diskMisses>0?(this._metrics.diskHits/(this._metrics.diskHits+this._metrics.diskMisses)*100).toFixed(2):"0";return{...this._metrics,memoryItems:this._memoryCache.size,memoryUsage:this._currentMemoryUsage,memoryUsagePercent:(this._currentMemoryUsage/this._maxMemoryUsage*100).toFixed(2),memoryHitRate:`${e}%`,diskHitRate:`${t}%`,persistentEnabled:this._persistentCacheEnabled}}async dispose(){this._cleanupInterval&&clearInterval(this._cleanupInterval),this._saveInterval&&clearInterval(this._saveInterval),this._saveTimeout&&clearTimeout(this._saveTimeout),this._persistentCacheEnabled&&this._storage&&await this._savePersistentCache(),this.clear(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("Advanced cache disposed",this.getStats())}};d(We,"AdvancedCache");var Oe=We;St.exports={AdvancedCache:Oe}});var kt=S((Vo,Tt)=>{var p=require("vscode"),{getLogger:ki}=M(),{getExtension:$i}=B(),Be=class Be{constructor(){this._logger=ki(),this._currentThemeKind=p.window.activeColorTheme.kind,this._themeChangeListeners=[],this._setupThemeChangeDetection(),this._logger.info("ThemeIntegrationManager initialized",{currentTheme:this._getThemeKindName(this._currentThemeKind)})}_setupThemeChangeDetection(){p.window.onDidChangeActiveColorTheme(e=>{let t=this._currentThemeKind;this._currentThemeKind=e.kind,this._logger.debug("Theme changed",{from:this._getThemeKindName(t),to:this._getThemeKindName(e.kind)}),this._themeChangeListeners.forEach(i=>{try{i(e,t)}catch(o){this._logger.error("Theme change listener failed",o)}})})}_getThemeKindName(e){switch(e){case p.ColorThemeKind.Light:return"Light";case p.ColorThemeKind.Dark:return"Dark";case p.ColorThemeKind.HighContrast:return"High Contrast";default:return"Unknown"}}onThemeChange(e){return this._themeChangeListeners.push(e),{dispose:d(()=>{let t=this._themeChangeListeners.indexOf(e);t!==-1&&this._themeChangeListeners.splice(t,1)},"dispose")}}getAdaptiveColors(){let e=this._currentThemeKind===p.ColorThemeKind.Light;return this._currentThemeKind===p.ColorThemeKind.HighContrast?this._getHighContrastColors():e?this._getLightThemeColors():this._getDarkThemeColors()}_getLightThemeColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("list.warningForeground"),old:new p.ThemeColor("list.errorForeground"),javascript:new p.ThemeColor("symbolIcon.functionForeground"),css:new p.ThemeColor("symbolIcon.colorForeground"),html:new p.ThemeColor("symbolIcon.snippetForeground"),json:new p.ThemeColor("symbolIcon.stringForeground"),markdown:new p.ThemeColor("symbolIcon.textForeground"),python:new p.ThemeColor("symbolIcon.classForeground"),subtle:new p.ThemeColor("list.inactiveSelectionForeground"),muted:new p.ThemeColor("list.deemphasizedForeground"),emphasis:new p.ThemeColor("list.highlightForeground")}}_getDarkThemeColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("charts.yellow"),old:new p.ThemeColor("charts.red"),javascript:new p.ThemeColor("symbolIcon.functionForeground"),css:new p.ThemeColor("charts.purple"),html:new p.ThemeColor("charts.orange"),json:new p.ThemeColor("symbolIcon.stringForeground"),markdown:new p.ThemeColor("charts.yellow"),python:new p.ThemeColor("symbolIcon.classForeground"),subtle:new p.ThemeColor("list.inactiveSelectionForeground"),muted:new p.ThemeColor("list.deemphasizedForeground"),emphasis:new p.ThemeColor("list.highlightForeground")}}_getHighContrastColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("list.warningForeground"),old:new p.ThemeColor("list.errorForeground"),javascript:new p.ThemeColor("list.highlightForeground"),css:new p.ThemeColor("list.warningForeground"),html:new p.ThemeColor("list.errorForeground"),json:new p.ThemeColor("list.highlightForeground"),markdown:new p.ThemeColor("list.warningForeground"),python:new p.ThemeColor("list.errorForeground"),subtle:new p.ThemeColor("list.highlightForeground"),muted:new p.ThemeColor("list.inactiveSelectionForeground"),emphasis:new p.ThemeColor("list.focusHighlightForeground")}}getColorForContext(e,t="normal"){let i=this.getAdaptiveColors();switch(e){case"success":case"recent":return t==="subtle"?i.subtle:i.veryRecent;case"warning":case"medium":return t==="subtle"?i.muted:i.recent;case"error":case"old":return t==="subtle"?i.emphasis:i.old;case"javascript":case"typescript":return i.javascript;case"css":case"scss":case"less":return i.css;case"html":case"xml":return i.html;case"json":case"yaml":return i.json;case"markdown":case"text":return i.markdown;case"python":return i.python;default:return t==="subtle"?i.muted:i.subtle}}applyThemeAwareColorScheme(e,t="",i=0){if(e==="none")return;if(e==="adaptive")return this._getAdaptiveColorForFile(t,i);let o=this.getAdaptiveColors();switch(e){case"recency":return i<36e5?o.veryRecent:i<864e5?o.recent:o.old;case"file-type":return this._getFileTypeColor(t);case"subtle":return i<36e5?o.subtle:i<6048e5?o.muted:o.emphasis;case"vibrant":return this._getVibrantSelectionAwareColor(i);case"custom":return i<36e5?new p.ThemeColor("explorerDates.customColor.veryRecent"):i<864e5?new p.ThemeColor("explorerDates.customColor.recent"):new p.ThemeColor("explorerDates.customColor.old");default:return}}_getVibrantSelectionAwareColor(e){return e<36e5?new p.ThemeColor("list.highlightForeground"):e<864e5?new p.ThemeColor("list.warningForeground"):new p.ThemeColor("list.errorForeground")}_getAdaptiveColorForFile(e,t){let i=this._getFileTypeColor(e);if(i)return i;let o=this.getAdaptiveColors();return t<36e5?o.veryRecent:t<864e5?o.recent:o.old}_getFileTypeColor(e){let t=$i(e),i=this.getAdaptiveColors();return[".js",".ts",".jsx",".tsx",".mjs"].includes(t)?i.javascript:[".css",".scss",".sass",".less",".stylus"].includes(t)?i.css:[".html",".htm",".xml",".svg"].includes(t)?i.html:[".json",".yaml",".yml",".toml"].includes(t)?i.json:[".md",".markdown",".txt",".rst"].includes(t)?i.markdown:[".py",".pyx",".pyi"].includes(t)?i.python:null}getSuggestedColorScheme(){switch(this._currentThemeKind){case p.ColorThemeKind.Light:return"vibrant";case p.ColorThemeKind.Dark:return"recency";case p.ColorThemeKind.HighContrast:return"none";default:return"recency"}}getIconThemeIntegration(){return{iconTheme:p.workspace.getConfiguration("workbench").get("iconTheme"),suggestions:{"vs-seti":{recommendedColorScheme:"file-type",description:"File-type colors complement Seti icons perfectly"},"material-icon-theme":{recommendedColorScheme:"subtle",description:"Subtle colors work well with Material icons"},"vscode-icons":{recommendedColorScheme:"recency",description:"Recency-based colors pair nicely with VS Code icons"}}}}async autoConfigureForTheme(){try{let e=p.workspace.getConfiguration("explorerDates"),t=e.get("colorScheme","none");if(t==="none"||t==="auto"){let i=this.getSuggestedColorScheme();await e.update("colorScheme",i,p.ConfigurationTarget.Global),this._logger.info(`Auto-configured color scheme for ${this._getThemeKindName(this._currentThemeKind)} theme: ${i}`),await p.window.showInformationMessage(`Explorer Dates adapted to your ${this._getThemeKindName(this._currentThemeKind)} theme`,"Customize","OK")==="Customize"&&await p.commands.executeCommand("workbench.action.openSettings","explorerDates.colorScheme")}}catch(e){this._logger.error("Failed to auto-configure for theme",e)}}getCurrentThemeInfo(){return{kind:this._currentThemeKind,kindName:this._getThemeKindName(this._currentThemeKind),isLight:this._currentThemeKind===p.ColorThemeKind.Light,isDark:this._currentThemeKind===p.ColorThemeKind.Dark,isHighContrast:this._currentThemeKind===p.ColorThemeKind.HighContrast,suggestedColorScheme:this.getSuggestedColorScheme(),adaptiveColors:this.getAdaptiveColors()}}dispose(){this._themeChangeListeners.length=0,this._logger.info("ThemeIntegrationManager disposed")}};d(Be,"ThemeIntegrationManager");var Ne=Be;Tt.exports={ThemeIntegrationManager:Ne}});var Et=S((Jo,$t)=>{var O=require("vscode"),{getLogger:Ei}=M(),{getLocalization:Mi}=ne(),{getFileName:Pi}=B(),je=class je{constructor(){this._logger=Ei(),this._l10n=Mi(),this._isAccessibilityMode=!1,this._keyboardNavigationEnabled=!0,this._focusIndicators=new Map,this._configurationWatcher=null,this._loadConfiguration(),this._setupConfigurationListener(),this._logger.info("AccessibilityManager initialized",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled})}_loadConfiguration(){let e=O.workspace.getConfiguration("explorerDates");this._isAccessibilityMode=e.get("accessibilityMode",!1),!e.has("accessibilityMode")&&this._detectScreenReader()&&this._logger.info("Screen reader detected - consider enabling accessibility mode in settings"),this._keyboardNavigationEnabled=e.get("keyboardNavigation",!0)}_setupConfigurationListener(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=O.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.accessibilityMode")||e.affectsConfiguration("explorerDates.keyboardNavigation"))&&(this._loadConfiguration(),this._logger.debug("Accessibility configuration updated",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled}))})}getAccessibleTooltip(e,t,i,o,s=null){if(!this._isAccessibilityMode)return null;let r=Pi(e),n=this._formatAccessibleDate(t),c=this._formatAccessibleDate(i),l=`File: ${r}. `;return l+=`Last modified: ${n}. `,l+=`Created: ${c}. `,o!==void 0&&(l+=`Size: ${this._formatAccessibleFileSize(o)}. `),s&&s.authorName&&(l+=`Last modified by: ${s.authorName}. `),l+=`Full path: ${e}`,l}_formatAccessibleDate(e){let i=new Date().getTime()-e.getTime(),o=Math.floor(i/(1e3*60)),s=Math.floor(i/(1e3*60*60)),r=Math.floor(i/(1e3*60*60*24));return o<1?"just now":o<60?`${o} ${o===1?"minute":"minutes"} ago`:s<24?`${s} ${s===1?"hour":"hours"} ago`:r<7?`${r} ${r===1?"day":"days"} ago`:e.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}_formatAccessibleFileSize(e){if(e<1024)return`${e} bytes`;let t=e/1024;if(t<1024)return`${Math.round(t)} kilobytes`;let i=t/1024;return`${Math.round(i*10)/10} megabytes`}getAccessibleBadge(e){if(!this._isAccessibilityMode)return e;let t=e.split("|"),i=t[0],o=t[1],s=t.length>2?t[2]:null,r=this._expandTimeAbbreviation(i);return o&&(r+=` ${this._expandSizeAbbreviation(o)}`),s&&(r+=` by ${s.replace("\u2022","")}`),r}_expandTimeAbbreviation(e){let t={m:" minutes ago",h:" hours ago",d:" days ago",w:" weeks ago",mo:" months ago",yr:" years ago",min:" minutes ago",hrs:" hours ago",day:" days ago",wk:" weeks ago"},i=e;for(let[o,s]of Object.entries(t))if(e.endsWith(o)){i=e.slice(0,-o.length)+s;break}return i}_expandSizeAbbreviation(e){if(!e.startsWith("~"))return e;let t=e.slice(1);return t.endsWith("B")?t.slice(0,-1)+" bytes":t.endsWith("K")?t.slice(0,-1)+" kilobytes":t.endsWith("M")?t.slice(0,-1)+" megabytes":t}createFocusIndicator(e,t){if(!this._keyboardNavigationEnabled)return null;let i=Math.random().toString(36).substr(2,9);return this._focusIndicators.set(i,{element:e,description:t,timestamp:Date.now()}),{id:i,dispose:d(()=>{this._focusIndicators.delete(i)},"dispose")}}announceToScreenReader(e,t="polite"){this._isAccessibilityMode&&(t==="assertive"?O.window.showWarningMessage(e):this._logger.debug("Screen reader announcement",{message:e,priority:t}))}getKeyboardShortcutHelp(){return[{key:"Ctrl+Shift+D (Cmd+Shift+D)",command:"Toggle date decorations",description:"Show or hide file modification times in Explorer"},{key:"Ctrl+Shift+C (Cmd+Shift+C)",command:"Copy file date",description:"Copy selected file's modification date to clipboard"},{key:"Ctrl+Shift+I (Cmd+Shift+I)",command:"Show file details",description:"Display detailed information about selected file"},{key:"Ctrl+Shift+R (Cmd+Shift+R)",command:"Refresh decorations",description:"Refresh all file modification time decorations"},{key:"Ctrl+Shift+A (Cmd+Shift+A)",command:"Show workspace activity",description:"Open workspace file activity analysis"},{key:"Ctrl+Shift+F (Cmd+Shift+F)",command:"Toggle fade old files",description:"Toggle fading effect for old files"}]}async showKeyboardShortcutsHelp(){let e=this.getKeyboardShortcutHelp();await O.window.showInformationMessage("Keyboard shortcuts help available in output panel","Show Shortcuts").then(t=>{if(t==="Show Shortcuts"){let i=O.window.createOutputChannel("Explorer Dates Shortcuts");i.appendLine("Explorer Dates Keyboard Shortcuts"),i.appendLine("====================================="),i.appendLine(""),e.forEach(o=>{i.appendLine(`${o.key}`),i.appendLine(`  Command: ${o.command}`),i.appendLine(`  Description: ${o.description}`),i.appendLine("")}),i.show()}})}shouldEnhanceAccessibility(){return this._isAccessibilityMode||this._detectScreenReader()}_detectScreenReader(){return O.workspace.getConfiguration("editor").get("accessibilitySupport")==="on"}getAccessibilityRecommendations(){let e=[];return this._detectScreenReader()&&(e.push({type:"setting",setting:"explorerDates.accessibilityMode",value:!0,reason:"Enable enhanced tooltips and screen reader optimizations"}),e.push({type:"setting",setting:"explorerDates.colorScheme",value:"none",reason:"Colors may not be useful with screen readers"}),e.push({type:"setting",setting:"explorerDates.dateDecorationFormat",value:"relative-long",reason:"Longer format is more descriptive for screen readers"})),O.window.activeColorTheme.kind===O.ColorThemeKind.HighContrast&&e.push({type:"setting",setting:"explorerDates.highContrastMode",value:!0,reason:"Optimize for high contrast themes"}),e}async applyAccessibilityRecommendations(){let e=this.getAccessibilityRecommendations();if(e.length===0){O.window.showInformationMessage("No accessibility recommendations at this time.");return}let t=O.workspace.getConfiguration("explorerDates"),i=0;for(let o of e)if(o.type==="setting")try{await t.update(o.setting.replace("explorerDates.",""),o.value,O.ConfigurationTarget.Global),i++,this._logger.info(`Applied accessibility recommendation: ${o.setting} = ${o.value}`)}catch(s){this._logger.error(`Failed to apply recommendation: ${o.setting}`,s)}i>0&&O.window.showInformationMessage(`Applied ${i} accessibility recommendations. Restart may be required for all changes to take effect.`)}dispose(){this._focusIndicators.clear(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("AccessibilityManager disposed")}};d(je,"AccessibilityManager");var Ue=je;$t.exports={AccessibilityManager:Ue}});var At=S((Qo,Pt)=>{var{MAX_BADGE_LENGTH:Mt}=ce();function Ai(a=0,e="auto"){let t=typeof a=="number"&&!Number.isNaN(a)?a:0;if(e==="bytes")return`~${t}B`;let i=t/1024;if(e==="kb")return`~${i.toFixed(1)}K`;let o=i/1024;return e==="mb"?`~${o.toFixed(1)}M`:t<1024?`~${t}B`:i<1024?`~${Math.round(i)}K`:`~${o.toFixed(1)}M`}d(Ai,"formatFileSize");function Ii(a){if(a)return a.length>Mt?a.substring(0,Mt):a}d(Ii,"trimBadge");Pt.exports={formatFileSize:Ai,trimBadge:Ii}});var Ot=S((Zo,Lt)=>{var m=require("vscode"),{getLogger:Ri}=M(),{getLocalization:zi}=ne(),{fileSystem:Li}=G(),{SmartExclusionManager:Oi}=vt(),{BatchProcessor:Wi}=bt(),{AdvancedCache:Ni}=Ft(),{ThemeIntegrationManager:Bi}=kt(),{AccessibilityManager:Ui}=Et(),{formatFileSize:ji,trimBadge:It}=At(),{getFileName:He,getExtension:fe,getCacheKey:Gi,normalizePath:ve,getRelativePath:Hi,getUriPath:Y}=B(),{DEFAULT_CACHE_TIMEOUT:Rt,DEFAULT_MAX_CACHE_SIZE:qi,MONTH_ABBREVIATIONS:Vi,GLOBAL_STATE_KEYS:Ki}=ce(),{isWebEnvironment:Ji}=Me(),we=3e4,Ge="::",H=d((a="")=>{let e=typeof a=="string"?a:Y(a),t=ve(e);return He(t)||t||"unknown"},"describeFile"),zt=!1,le=null;if(!zt)try{let{exec:a}=require("child_process"),{promisify:e}=require("util");le=e(a)}catch{le=null}var Ve=class Ve{constructor(){this._onDidChangeFileDecorations=new m.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event,this._decorationCache=new Map,this._decorationPool=new Map,this._decorationPoolOrder=[],this._decorationPoolStats={hits:0,misses:0},this._maxDecorationPoolSize=512,this._badgeFlyweightCache=new Map,this._badgeFlyweightOrder=[],this._badgeFlyweightLimit=2048,this._badgeFlyweightStats={hits:0,misses:0},this._readableDateFlyweightCache=new Map,this._readableDateFlyweightOrder=[],this._readableDateFlyweightLimit=2048,this._readableFlyweightStats={hits:0,misses:0},this._enableDecorationPool=process.env.EXPLORER_DATES_ENABLE_DECORATION_POOL!=="0",this._enableFlyweights=process.env.EXPLORER_DATES_ENABLE_FLYWEIGHTS!=="0",this._lightweightMode=process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE==="1",this._memorySheddingEnabled=process.env.EXPLORER_DATES_MEMORY_SHEDDING==="1",this._memorySheddingThresholdMB=Number(process.env.EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB||3),this._memorySheddingActive=!1,this._memoryBaselineMB=this._memorySheddingEnabled?this._safeHeapUsedMB():0,this._memoryShedCacheLimit=Number(process.env.EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT||1e3),this._memoryShedRefreshIntervalMs=Number(process.env.EXPLORER_DATES_MEMORY_SHED_REFRESH_MS||6e4),this._refreshIntervalOverride=null,this._forceCacheBypass=process.env.EXPLORER_DATES_FORCE_CACHE_BYPASS==="1",this._lightweightPurgeInterval=Number(process.env.EXPLORER_DATES_LIGHTWEIGHT_PURGE_INTERVAL||400),this._isWeb=zt||Ji(),this._baselineDesktopCacheTimeout=Rt*4,this._maxDesktopCacheTimeout=this._baselineDesktopCacheTimeout,this._lastCacheTimeoutBoostLookups=0,this._maxCacheSize=qi,this._fileSystem=Li,this._gitAvailable=!this._isWeb&&!!le,this._gitWarningShown=!1,this._cacheNamespace=null,this._cacheKeyStats=new Map,this._logger=Ri(),this._l10n=zi(),this._smartExclusion=new Oi,this._batchProcessor=new Wi,this._progressiveLoadingJobs=new Set,this._progressiveLoadingEnabled=!1,this._advancedCache=null,this._configurationWatcher=null,this._gitCache=new Map,this._maxGitCacheEntries=1e3,this._themeIntegration=new Bi,this._accessibility=new Ui,this._stressLogOptions={profile:"stress",throttleKey:"decorations:request",throttleLimit:Number(process.env.EXPLORER_DATES_LOG_INFO_LIMIT||50)},this._metrics={totalDecorations:0,cacheHits:0,cacheMisses:0,errors:0,gitBlameTimeMs:0,gitBlameCalls:0,fileStatTimeMs:0,fileStatCalls:0},this._refreshTimer=null,this._refreshInterval=6e4,this._incrementalRefreshTimers=new Set,this._incrementalRefreshInProgress=!1,this._scheduledRefreshPending=!1;let e=m.workspace.getConfiguration("explorerDates"),t=e.get("cacheTimeout",we);this._hasCustomCacheTimeout=this._detectCacheTimeoutOverride(e,t),this._cacheTimeout=this._resolveCacheTimeout(t),this._performanceMode=e.get("performanceMode",!1),this._updateCacheNamespace(e),this._lightweightMode&&(this._performanceMode=!0,this._enableDecorationPool=!1,this._enableFlyweights=!1,this._cacheTimeout=Math.min(this._cacheTimeout,5e3),this._maxCacheSize=Math.min(this._maxCacheSize,64),this._logger.info("Lightweight mode: decoration pooling and flyweight caches disabled; cache timeout capped at 5s")),this._performanceMode||this._setupFileWatcher(),this._setupConfigurationWatcher(),this._performanceMode||this._setupPeriodicRefresh(),this._logger.info(`FileDateDecorationProvider initialized (performanceMode: ${this._performanceMode})`),this._forceCacheBypass&&this._logger.warn("Force cache bypass mode enabled - decoration caches will be skipped"),this._enableDecorationPool||this._logger.warn("Decoration pool disabled via EXPLORER_DATES_ENABLE_DECORATION_POOL=0"),this._enableFlyweights||this._logger.warn("Flyweight caches disabled via EXPLORER_DATES_ENABLE_FLYWEIGHTS=0"),this._lightweightMode&&this._logger.warn("Lightweight mode enabled via EXPLORER_DATES_LIGHTWEIGHT_MODE=1 (performanceMode forced on)"),this._memorySheddingEnabled&&this._logger.warn(`Memory shedding enabled (threshold ${this._memorySheddingThresholdMB} MB); will stretch refresh interval and shrink cache if exceeded.`),this._previewSettings=null,this._extensionContext=null}applyPreviewSettings(e){let t=!!this._previewSettings;e&&typeof e=="object"?(this._previewSettings=Object.assign({},e),this._logger.info("\u{1F504} Applied preview settings",this._previewSettings)):(this._previewSettings=null,this._logger.info("\u{1F504} Cleared preview settings"));let i=this._decorationCache.size;if(this._decorationCache.clear(),this._clearDecorationPool("preview-mode-change"),this._logger.info(`\u{1F5D1}\uFE0F Cleared memory cache (${i} items) for preview mode change`),this._advancedCache)try{typeof this._advancedCache.clear=="function"?(this._advancedCache.clear(),this._logger.info("\u{1F5D1}\uFE0F Cleared advanced cache for preview mode change")):this._logger.warn("\u26A0\uFE0F Advanced cache does not support clear operation")}catch(o){this._logger.warn("\u26A0\uFE0F Failed to clear advanced cache:",o.message)}this._previewSettings&&!t?this._logger.info("\u{1F3AD} Entered preview mode - caching disabled"):!this._previewSettings&&t&&this._logger.info("\u{1F3AD} Exited preview mode - caching re-enabled"),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Fired decoration refresh event for preview change")}async testDecorationProvider(){this._logger.info("\u{1F9EA} Testing decoration provider functionality...");let e=m.workspace.workspaceFolders;if(!e||e.length===0){this._logger.error("\u274C No workspace folders available for testing");return}let t=m.Uri.joinPath(e[0].uri,"package.json");try{let i=await this.provideFileDecoration(t);this._logger.info("\u{1F9EA} Test decoration result:",{file:"package.json",success:!!i,badge:i==null?void 0:i.badge,hasTooltip:!!(i!=null&&i.tooltip),hasColor:!!(i!=null&&i.color)}),this._onDidChangeFileDecorations.fire(t),this._logger.info("\u{1F504} Fired decoration change event for test file")}catch(i){this._logger.error("\u274C Test decoration failed:",i)}}forceRefreshAllDecorations(){this._logger.info("\u{1F504} Force refreshing ALL decorations..."),this._cancelIncrementalRefreshTimers(),this._decorationCache.clear(),this._clearDecorationPool("force-refresh"),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Triggered global decoration refresh")}startProviderCallMonitoring(){this._providerCallCount=0,this._providerCallFiles=new Set;let e=this.provideFileDecoration.bind(this);this.provideFileDecoration=async(t,i)=>{this._providerCallCount++;let o=Y(t)||(t==null?void 0:t.toString(!0))||"unknown";return this._providerCallFiles.add(ve(o)),this._logger.info(`\u{1F50D} Provider called ${this._providerCallCount} times for: ${H(t||o)}`),await e(t,i)},this._logger.info("\u{1F4CA} Started provider call monitoring")}getProviderCallStats(){return{totalCalls:this._providerCallCount||0,uniqueFiles:this._providerCallFiles?this._providerCallFiles.size:0,calledFiles:this._providerCallFiles?Array.from(this._providerCallFiles):[]}}_setupFileWatcher(){let e=m.workspace.createFileSystemWatcher("**/*");e.onDidChange(t=>this.refreshDecoration(t)),e.onDidCreate(t=>this.refreshDecoration(t)),e.onDidDelete(t=>this.clearDecoration(t)),this._fileWatcher=e}_setupPeriodicRefresh(){let e=m.workspace.getConfiguration("explorerDates"),t=e.get("badgeRefreshInterval",6e4),i=this._refreshIntervalOverride||t;if(this._refreshInterval=i,this._logger.info(`Setting up periodic refresh with interval: ${this._refreshInterval}ms`),this._refreshTimer&&(clearInterval(this._refreshTimer),this._refreshTimer=null),this._cancelIncrementalRefreshTimers(),!e.get("showDateDecorations",!0)){this._logger.info("Decorations disabled, skipping periodic refresh setup");return}this._refreshTimer=setInterval(()=>{if(this._incrementalRefreshInProgress){this._logger.debug("Periodic refresh skipped - incremental refresh already running");return}this._logger.debug("Periodic refresh triggered - scheduling incremental refresh"),this._scheduleIncrementalRefresh("periodic")},this._refreshInterval),this._logger.info("Periodic refresh timer started")}_resolveUriFromCacheEntry(e,t){if(t!=null&&t.uri)return t.uri;if(!e)return null;try{return m.Uri.file(e)}catch(i){return this._logger.debug(`Failed to rebuild URI from cache key: ${e}`,i),null}}_cancelIncrementalRefreshTimers(){var e;if((e=this._incrementalRefreshTimers)!=null&&e.size){for(let t of this._incrementalRefreshTimers)clearTimeout(t);this._incrementalRefreshTimers.clear()}this._incrementalRefreshInProgress=!1}_scheduleIncrementalRefresh(e="manual"){if(this._scheduledRefreshPending){this._logger.debug(`Incremental refresh (${e}) skipped - refresh already pending`);return}this._incrementalRefreshInProgress&&(this._logger.debug(`Incremental refresh (${e}) already in progress, cancelling pending timers and rescheduling`),this._cancelIncrementalRefreshTimers());let t=Array.from(this._decorationCache.entries());if(t.length===0){this._logger.debug(`No cached decorations to refresh for ${e}, falling back to global refresh`),this._onDidChangeFileDecorations.fire(void 0);return}let i=t.map(([c,l])=>{let u=this._resolveUriFromCacheEntry(c,l);return u?{cacheKey:c,uri:u}:null}).filter(Boolean);if(i.length===0){this._logger.debug(`Failed to resolve URIs for ${e} incremental refresh, firing global refresh`),this._onDidChangeFileDecorations.fire(void 0);return}let o=40,s=Math.ceil(i.length/o),r=Math.min(4e3,Math.max(750,Math.floor(this._refreshInterval*.25))),n=s>1?Math.max(25,Math.floor(r/s)):0;this._incrementalRefreshInProgress=!0,this._scheduledRefreshPending=!0,this._logger.debug(`Incremental refresh (${e}) scheduled for ${i.length} items in ${s} batches (spacing: ${n}ms)`);for(let c=0;c<s;c++){let l=i.slice(c*o,(c+1)*o),u=c===0?0:n*c,h=setTimeout(()=>{try{l.forEach(({cacheKey:v,uri:g})=>{this._markCacheEntryForRefresh(v),this._onDidChangeFileDecorations.fire(g)})}finally{this._incrementalRefreshTimers.delete(h),this._incrementalRefreshTimers.size===0&&(this._incrementalRefreshInProgress=!1,this._scheduledRefreshPending=!1,this._logger.debug(`Incremental refresh (${e}) completed`))}},u);this._incrementalRefreshTimers.add(h)}}_markCacheEntryForRefresh(e){if(!e)return;let t=this._decorationCache.get(e);if(t){let i=Date.now()-t.timestamp;i>this._cacheTimeout*.75?(t.forceRefresh=!0,this._logger.debug(`Marked stale entry for refresh: ${e} (age: ${Math.round(i/1e3)}s)`)):this._logger.debug(`Skipped refresh for fresh entry: ${e} (age: ${Math.round(i/1e3)}s, threshold: ${Math.round(this._cacheTimeout*.75/1e3)}s)`)}if(this._advancedCache)try{let i=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this._advancedCache.invalidateByPattern(i)}catch(i){this._logger.debug(`Could not invalidate advanced cache for ${e}: ${i.message}`)}}_setupConfigurationWatcher(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=m.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration("explorerDates")){this._logger.debug("Configuration changed, updating settings");let t=m.workspace.getConfiguration("explorerDates"),i=t.get("cacheTimeout",we);this._hasCustomCacheTimeout=this._detectCacheTimeoutOverride(t,i),this._cacheTimeout=this._resolveCacheTimeout(i),this._maxCacheSize=t.get("maxCacheSize",1e4);let o=this._updateCacheNamespace(t);if(e.affectsConfiguration("explorerDates.performanceMode")){let r=t.get("performanceMode",!1);r!==this._performanceMode&&(this._performanceMode=r,this._logger.info(`Performance mode changed to: ${r}`),r&&this._fileWatcher?(this._fileWatcher.dispose(),this._fileWatcher=null,this._logger.info("File watcher disabled for performance mode")):!r&&!this._fileWatcher&&(this._setupFileWatcher(),this._logger.info("File watcher enabled (performance mode off)")),r&&this._refreshTimer?(clearInterval(this._refreshTimer),this._refreshTimer=null,this._logger.info("Periodic refresh disabled for performance mode")):!r&&!this._refreshTimer&&(this._setupPeriodicRefresh(),this._logger.info("Periodic refresh enabled (performance mode off)")),this.refreshAll({reason:"performance-mode-change"}))}e.affectsConfiguration("explorerDates.badgeRefreshInterval")&&(this._refreshInterval=t.get("badgeRefreshInterval",6e4),this._logger.info(`Badge refresh interval updated to: ${this._refreshInterval}ms`),this._performanceMode||this._setupPeriodicRefresh());let s=e.affectsConfiguration("explorerDates.showDateDecorations")||e.affectsConfiguration("explorerDates.dateDecorationFormat")||e.affectsConfiguration("explorerDates.excludedFolders")||e.affectsConfiguration("explorerDates.excludedPatterns")||e.affectsConfiguration("explorerDates.highContrastMode")||e.affectsConfiguration("explorerDates.fadeOldFiles")||e.affectsConfiguration("explorerDates.fadeThreshold")||e.affectsConfiguration("explorerDates.colorScheme")||e.affectsConfiguration("explorerDates.showGitInfo")||e.affectsConfiguration("explorerDates.customColors")||e.affectsConfiguration("explorerDates.showFileSize")||e.affectsConfiguration("explorerDates.fileSizeFormat");(s||o)&&this.refreshAll({preservePersistentCache:!0,reason:s?"configuration-change":"namespace-change"}),e.affectsConfiguration("explorerDates.progressiveLoading")&&this._applyProgressiveLoadingSetting().catch(r=>{this._logger.error("Failed to reconfigure progressive loading",r)}),e.affectsConfiguration("explorerDates.showDateDecorations")&&!this._performanceMode&&this._setupPeriodicRefresh()}})}_detectCacheTimeoutOverride(e,t){if(typeof t=="number"&&t!==we)return!0;if(!e||typeof e.inspect!="function")return!1;try{let i=e.inspect("cacheTimeout");if(!i)return!1;if(typeof i=="object"&&(typeof i.globalValue=="number"||typeof i.workspaceValue=="number"||typeof i.workspaceFolderValue=="number"))return!0;if(i.cacheTimeout&&typeof i.cacheTimeout=="object"){let o=i.cacheTimeout;if(typeof o.globalValue=="number"||typeof o.workspaceValue=="number"||typeof o.workspaceFolderValue=="number"){let r=o.globalValue??o.workspaceValue??o.workspaceFolderValue;return typeof r=="number"&&r!==we}}}catch{return!1}return!1}_resolveCacheTimeout(e){return this._isWeb||this._hasCustomCacheTimeout?e:Math.max(this._baselineDesktopCacheTimeout,e||this._baselineDesktopCacheTimeout)}_getGitCacheKey(e,t,i){let o=e||"unknown-workspace",s=t||"unknown-relative",r=Number.isFinite(i)?i:"unknown-mtime";return`${o}::${s}::${r}`}_getCachedGitInfo(e){let t=this._gitCache.get(e);return t?(t.lastAccess=Date.now(),t.value):null}_setCachedGitInfo(e,t){if(this._gitCache.size>=this._maxGitCacheEntries){let i=null,o=1/0;for(let[s,r]of this._gitCache.entries())r.lastAccess<o&&(o=r.lastAccess,i=s);i&&this._gitCache.delete(i)}this._gitCache.set(e,{value:t,lastAccess:Date.now()})}async _applyProgressiveLoadingSetting(){if(!this._batchProcessor)return;if(this._performanceMode){this._logger.info("Progressive loading disabled due to performance mode"),this._cancelProgressiveWarmupJobs(),this._progressiveLoadingEnabled=!1;return}let t=m.workspace.getConfiguration("explorerDates").get("progressiveLoading",!0);if(this._progressiveLoadingEnabled=t,!t){this._logger.info("Progressive loading disabled via explorerDates.progressiveLoading"),this._cancelProgressiveWarmupJobs();return}let i=m.workspace.workspaceFolders;!i||i.length===0||(this._cancelProgressiveWarmupJobs(),i.forEach(o=>{let s=this._batchProcessor.processDirectoryProgressively(o.uri,async r=>{try{await this.provideFileDecoration(r)}catch(n){this._logger.debug("Progressive warmup processor failed",n)}},{background:!0,priority:"low",maxFiles:500});s&&this._progressiveLoadingJobs.add(s)}),this._logger.info(`Progressive loading queued for ${i.length} workspace folder(s).`))}_cancelProgressiveWarmupJobs(){if(!(!this._progressiveLoadingJobs||this._progressiveLoadingJobs.size===0)){if(this._batchProcessor)for(let e of this._progressiveLoadingJobs)this._batchProcessor.cancelBatch(e);this._progressiveLoadingJobs.clear()}}refreshDecoration(e){let t=this._getCacheKey(e);if(this._decorationCache.delete(t),this._advancedCache)try{this._advancedCache.invalidateByPattern(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}catch(i){this._logger.debug(`Could not invalidate advanced cache for ${H(e)}: ${i.message}`)}this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F504} Refreshed decoration cache for: ${H(e)}`)}clearDecoration(e){let t=this._getCacheKey(e);this._decorationCache.delete(t),this._advancedCache&&this._logger.debug(`Advanced cache entry will expire naturally: ${H(e)}`),this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F5D1}\uFE0F Cleared decoration cache for: ${H(e)}`)}clearAllCaches(){this._cancelIncrementalRefreshTimers();let e=this._decorationCache.size;this._decorationCache.clear(),this._clearDecorationPool("clearAllCaches"),this._logger.info(`Cleared memory cache (was ${e} items)`),this._advancedCache&&(this._advancedCache.clear(),this._logger.info("Cleared advanced cache")),this._metrics.cacheHits=0,this._metrics.cacheMisses=0,this._logger.info("All caches cleared successfully")}refreshAll(e={}){let{preservePersistentCache:t=!1,reason:i="manual-refresh"}=e;this._cancelIncrementalRefreshTimers(),this._decorationCache.clear(),this._clearDecorationPool("refreshAll"),this._gitCache.clear(),this._advancedCache&&(t&&typeof this._advancedCache.resetRuntimeOnly=="function"?this._advancedCache.resetRuntimeOnly():this._advancedCache.clear()),this._onDidChangeFileDecorations.fire(void 0);let o=t?" (persistent cache preserved)":"";this._logger.info(`All decorations refreshed (${i})${o}`)}async _isExcludedSimple(e){let t=m.workspace.getConfiguration("explorerDates"),i=Y(e);if(!i)return!1;let o=ve(i),s=He(o),r=fe(i),n=t.get("forceShowForFileTypes",[]);if(n.length>0&&n.includes(r))return this._logger.debug(`File type ${r} is forced to show: ${i}`),!1;let c=t.get("enableTroubleShootingMode",!1);c&&this._logger.info(`\u{1F50D} Checking exclusion for: ${s} (ext: ${r})`);let l=t.get("excludedFolders",["node_modules",".git","dist","build","out",".vscode-test"]),u=t.get("excludedPatterns",["**/*.tmp","**/*.log","**/.git/**","**/node_modules/**"]);for(let h of l){let v=h.replace(/^\/+|\/+$/g,"");if(o.includes(`/${v}/`)||o.endsWith(`/${v}`))return c?this._logger.info(`\u274C File excluded by folder: ${i} (${h})`):this._logger.debug(`File excluded by folder: ${i} (${h})`),!0}for(let h of u)if(h.includes("node_modules")&&o.includes("/node_modules/")||h.includes(".git/**")&&o.includes("/.git/")||h.includes("*.tmp")&&s.endsWith(".tmp")||h.includes("*.log")&&s.endsWith(".log"))return!0;return c&&this._logger.info(`\u2705 File NOT excluded: ${s} (ext: ${r})`),!1}async _isExcluded(e){let t=m.workspace.getConfiguration("explorerDates"),i=Y(e);if(!i)return!1;let o=ve(i),s=He(o),r=m.workspace.getWorkspaceFolder(e);if(r){let n=await this._smartExclusion.getCombinedExclusions(r.uri);for(let c of n.folders)if(new RegExp(`(^|/)${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(o))return this._logger.debug(`File excluded by folder rule: ${i} (folder: ${c})`),!0;for(let c of n.patterns){let l=c.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),u=new RegExp(l);if(u.test(o)||u.test(s))return this._logger.debug(`File excluded by pattern: ${i} (pattern: ${c})`),!0}}else{let n=t.get("excludedFolders",[]),c=t.get("excludedPatterns",[]);for(let l of n)if(new RegExp(`(^|/)${l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(o))return!0;for(let l of c){let u=l.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),h=new RegExp(u);if(h.test(o)||h.test(s))return!0}}return!1}_manageCacheSize(){if(this._decorationCache.size>this._maxCacheSize){this._logger.debug(`Cache size (${this._decorationCache.size}) exceeds max (${this._maxCacheSize}), cleaning old entries`);let e=Math.floor(this._maxCacheSize*.2),t=Array.from(this._decorationCache.entries());t.sort((i,o)=>i[1].timestamp-o[1].timestamp);for(let i=0;i<e&&i<t.length;i++)this._decorationCache.delete(t[i][0]);this._logger.debug(`Removed ${e} old cache entries`)}}_maybeExtendCacheTimeout(){if(this._isWeb||this._hasCustomCacheTimeout)return;let e=this._metrics.cacheHits+this._metrics.cacheMisses;if(e<200)return;let t=this._metrics.cacheHits/e;if(t<.9||this._cacheTimeout>=this._maxDesktopCacheTimeout||e<=this._lastCacheTimeoutBoostLookups||e-this._lastCacheTimeoutBoostLookups<100)return;let o=this._cacheTimeout;this._cacheTimeout=Math.min(this._cacheTimeout+Rt,this._maxDesktopCacheTimeout),this._lastCacheTimeoutBoostLookups=e,this._logger.info("\u2699\uFE0F Cache timeout extended (max 8min)",{previousTimeout:o,newTimeout:this._cacheTimeout,hitRate:Number(t.toFixed(2)),totalLookups:e})}async _getCachedDecoration(e,t){if(this._forceCacheBypass)return this._logger.debug(`\u26A0\uFE0F Cache bypass enabled - recalculating decoration for: ${t}`),null;if(this._advancedCache)try{let o=await this._advancedCache.get(e);if(o)return this._metrics.cacheHits++,this._logger.debug(`\u{1F9E0} Advanced cache hit for: ${t}`),o}catch(o){this._logger.debug(`Advanced cache error: ${o.message}`)}let i=this._decorationCache.get(e);if(i){if(i.forceRefresh)this._decorationCache.delete(e),this._logger.debug(`\u{1F6AB} Memory cache bypassed (forced refresh) for: ${t}`);else if(Date.now()-i.timestamp<this._cacheTimeout)return this._metrics.cacheHits++,this._logger.debug(`\u{1F4BE} Memory cache hit for: ${t}`),i.decoration}return null}async _storeDecorationInCache(e,t,i,o){if(this._forceCacheBypass)return;this._manageCacheSize();let s={decoration:t,timestamp:Date.now()};if(o&&(s.uri=o),this._decorationCache.set(e,s),this._advancedCache)try{await this._advancedCache.set(e,t,{ttl:this._cacheTimeout}),this._logger.debug(`\u{1F9E0} Stored in advanced cache: ${i}`)}catch(r){this._logger.debug(`Failed to store in advanced cache: ${r.message}`)}this._maybeExtendCacheTimeout()}_getFlyweightValue(e,t,i,o,s,r){if(!this._enableFlyweights||!o)return r&&r.misses++,s();if(e.has(o))return r&&r.hits++,e.get(o);r&&r.misses++;let n=s();if(e.set(o,n),t.push(o),t.length>i){let c=t.shift();c&&e.delete(c)}return n}_safeHeapUsedMB(){try{let e=process!=null&&process.memoryUsage?process.memoryUsage().heapUsed:0;return Number((e/1024/1024).toFixed(2))}catch{return 0}}_maybeShedWorkload(){if(!this._memorySheddingEnabled||this._memorySheddingActive)return;let e=this._safeHeapUsedMB();if(!e)return;if(!this._memoryBaselineMB){this._memoryBaselineMB=e;return}let t=e-this._memoryBaselineMB;t>=this._memorySheddingThresholdMB&&(this._memorySheddingActive=!0,this._maxCacheSize=Math.min(this._maxCacheSize,this._memoryShedCacheLimit),this._refreshIntervalOverride=Math.max(this._refreshIntervalOverride||this._refreshInterval||this._memoryShedRefreshIntervalMs,this._memoryShedRefreshIntervalMs),this._logger.warn(`Memory shedding activated (delta ${t.toFixed(2)} MB >= ${this._memorySheddingThresholdMB} MB); cache size capped at ${this._maxCacheSize} and refresh interval stretched to ${this._refreshIntervalOverride}ms`),this._setupPeriodicRefresh())}_acquireDecorationFromPool({badge:e,tooltip:t,color:i}){if(!this._enableDecorationPool){this._decorationPoolStats.misses++;let r=new m.FileDecoration(e||"??");return t&&(r.tooltip=t),i&&(r.color=i),r.propagate=!1,r}if(!e)return new m.FileDecoration("??");let o=this._buildDecorationPoolKey(e,t,i);if(o&&this._decorationPool.has(o))return this._decorationPoolStats.hits++,this._decorationPool.get(o);let s=new m.FileDecoration(e);if(t&&(s.tooltip=t),i&&(s.color=i),s.propagate=!1,o&&(this._decorationPool.set(o,s),this._decorationPoolOrder.push(o),this._decorationPoolOrder.length>this._maxDecorationPoolSize)){let r=this._decorationPoolOrder.shift();r&&r!==o&&this._decorationPool.delete(r)}return this._decorationPoolStats.misses++,s}_buildDecorationPoolKey(e,t,i){let o=e||"",s=t||"",r=this._getColorIdentifier(i);return`${o}::${r}::${s}`}_getColorIdentifier(e){if(!e)return"none";if(typeof e=="string")return e;if(e.id)return e.id;try{return JSON.stringify(e)}catch{return String(e)}}_clearDecorationPool(e="unspecified"){this._decorationPool.size!==0&&(this._decorationPool.clear(),this._decorationPoolOrder.length=0,this._logger.debug(`\u{1F9FC} Cleared decoration pool (${e})`))}_purgeLightweightCaches(e="lightweight"){this._lightweightMode&&(this._decorationCache.size>0&&this._decorationCache.clear(),this._clearDecorationPool(e),this._badgeFlyweightCache.size>0&&(this._badgeFlyweightCache.clear(),this._badgeFlyweightOrder.length=0),this._readableDateFlyweightCache.size>0&&(this._readableDateFlyweightCache.clear(),this._readableDateFlyweightOrder.length=0),this._logger.debug(`\u{1F9FD} Purged lightweight caches (${e})`))}_maybePurgeLightweightCaches(){var t;if(!this._lightweightMode)return;if(this._lightweightPurgeInterval<=0){this._purgeLightweightCaches("lightweight-interval-disabled");return}let e=((t=this._metrics)==null?void 0:t.totalDecorations)||0;e>0&&e%this._lightweightPurgeInterval===0&&this._purgeLightweightCaches("lightweight-interval")}_buildBadgeDescriptor({formatType:e,diffMinutes:t,diffHours:i,diffDays:o,diffWeeks:s,diffMonths:r,date:n}){let c=d((l,u=null)=>({value:l,key:u?`badge:${e||"default"}:${u}`:null}),"build");switch(e){case"relative-short":case"relative-long":return t<1?c("\u25CF\u25CF","just"):t<60?c(`${Math.min(t,99)}m`,`m:${Math.min(t,99)}`):i<24?c(`${Math.min(i,23)}h`,`h:${Math.min(i,23)}`):o<7?c(`${o}d`,`d:${o}`):s<4?c(`${s}w`,`w:${s}`):r<12?c(`${r}M`,`M:${r}`):c("1y","y:1");case"absolute-short":case"absolute-long":{let l=n.getDate(),u=`${Vi[n.getMonth()]}${l<10?"0"+l:l}`,h=[n.getMonth(),l];return e==="absolute-long"&&h.push(n.getFullYear()),c(u,`abs:${h.join("-")}`)}case"technical":return t<60?c(`${t}m`,`tech:m:${t}`):i<24?c(`${i}h`,`tech:h:${i}`):c(`${o}d`,`tech:d:${o}`);case"minimal":return i<1?c("\u2022\u2022","min:now"):i<24?c("\u25CB\u25CB","min:hours"):c("\u2500\u2500","min:days");default:return t<60?c(`${t}m`,`smart:m:${t}`):i<24?c(`${i}h`,`smart:h:${i}`):c(`${o}d`,`smart:d:${o}`)}}_formatDateBadge(e,t,i=null){let s=i!==null?i:new Date().getTime()-e.getTime();if(s<0)return this._logger.debug(`File has future modification time (diffMs: ${s}), treating as just modified`),"\u25CF\u25CF";let r=Math.floor(s/(1e3*60)),n=Math.floor(s/(1e3*60*60)),c=Math.floor(s/(1e3*60*60*24)),l=Math.floor(c/7),u=Math.floor(c/30),h=this._buildBadgeDescriptor({formatType:t,diffMinutes:r,diffHours:n,diffDays:c,diffWeeks:l,diffMonths:u,date:e});return this._getFlyweightValue(this._badgeFlyweightCache,this._badgeFlyweightOrder,this._badgeFlyweightLimit,h.key,()=>h.value,this._badgeFlyweightStats)}_formatFileSize(e,t="auto"){return ji(e,t)}_buildReadableDescriptor(e,t,i,o,s){let r=e.toDateString()===t.toDateString();return i<1?{key:"readable:just",factory:d(()=>this._l10n.getString("justNow"),"factory")}:i<60?{key:`readable:minutes:${i}`,factory:d(()=>this._l10n.getString("minutesAgo",i),"factory")}:o<24&&r?{key:`readable:hours:${o}`,factory:d(()=>this._l10n.getString("hoursAgo",o),"factory")}:s<7?s===1?{key:"readable:yesterday",factory:d(()=>this._l10n.getString("yesterday"),"factory")}:{key:`readable:days:${s}`,factory:d(()=>this._l10n.getString("daysAgo",s),"factory")}:null}_getColorByScheme(e,t,i=""){if(t==="none")return;let s=new Date().getTime()-e.getTime(),r=Math.floor(s/(1e3*60*60)),n=Math.floor(s/(1e3*60*60*24));switch(t){case"recency":return r<1?new m.ThemeColor("charts.green"):r<24?new m.ThemeColor("charts.yellow"):new m.ThemeColor("charts.red");case"file-type":{let c=fe(i);return[".js",".ts",".jsx",".tsx"].includes(c)?new m.ThemeColor("charts.blue"):[".css",".scss",".less"].includes(c)?new m.ThemeColor("charts.purple"):[".html",".htm",".xml"].includes(c)?new m.ThemeColor("charts.orange"):[".json",".yaml",".yml"].includes(c)?new m.ThemeColor("charts.green"):[".md",".txt",".log"].includes(c)?new m.ThemeColor("charts.yellow"):[".py",".rb",".php"].includes(c)?new m.ThemeColor("charts.red"):new m.ThemeColor("editorForeground")}case"subtle":return r<1?new m.ThemeColor("editorInfo.foreground"):n<7?new m.ThemeColor("editorWarning.foreground"):new m.ThemeColor("editorError.foreground");case"vibrant":return r<1?new m.ThemeColor("terminal.ansiGreen"):r<24?new m.ThemeColor("terminal.ansiYellow"):n<7?new m.ThemeColor("terminal.ansiMagenta"):new m.ThemeColor("terminal.ansiRed");case"custom":return r<1?new m.ThemeColor("explorerDates.customColor.veryRecent"):r<24?new m.ThemeColor("explorerDates.customColor.recent"):new m.ThemeColor("explorerDates.customColor.old");default:return}}_generateBadgeDetails({filePath:e,stat:t,diffMs:i,dateFormat:o,badgePriority:s,showFileSize:r,fileSizeFormat:n,gitBlame:c,showGitInfo:l}){let u=this._formatDateBadge(t.mtime,o,i),h=this._formatDateReadable(t.mtime),v=this._formatDateReadable(t.birthtime),g=u;if(this._logger.debug(`\u{1F3F7}\uFE0F Badge generation for ${H(e)}: badgePriority=${s}, showGitInfo=${l}, hasGitBlame=${!!c}, authorName=${c==null?void 0:c.authorName}, previewMode=${!!this._previewSettings}`),s==="author"&&(c!=null&&c.authorName)){let w=this._getInitials(c.authorName);w&&(g=w,this._logger.debug(`\u{1F3F7}\uFE0F Using author initials badge: "${w}" (from ${c.authorName})`))}else if(s==="size"&&r){let w=this._formatCompactSize(t.size);w&&(g=w,this._logger.debug(`\u{1F3F7}\uFE0F Using size badge: "${w}"`))}else this._logger.debug(`\u{1F3F7}\uFE0F Using time badge: "${u}" (badgePriority=${s})`);return{badge:u,displayBadge:g,readableModified:h,readableCreated:v,fileSizeLabel:r?this._formatFileSize(t.size,n):null}}async _buildTooltipContent({filePath:e,resourceUri:t,stat:i,badgeDetails:o,gitBlame:s,shouldUseAccessibleTooltips:r,fileSizeFormat:n,isCodeFile:c}){let l=H(e),u=fe(e);if(r){let g=this._accessibility.getAccessibleTooltip(e,i.mtime,i.birthtime,i.size,s);if(g)return this._logger.info(`\u{1F50D} Using accessible tooltip (${g.length} chars): "${g.substring(0,50)}..."`),g;this._logger.info("\u{1F50D} Accessible tooltip generation failed, using rich tooltip")}let h=`\u{1F4C4} File: ${l}
`;h+=`\u{1F4DD} Last Modified: ${o.readableModified}
`,h+=`   ${this._formatFullDate(i.mtime)}

`,h+=`\u{1F4C5} Created: ${o.readableCreated}
`,h+=`   ${this._formatFullDate(i.birthtime)}

`;let v=o.fileSizeLabel||this._formatFileSize(i.size,n||"auto");if(h+=`\u{1F4CA} Size: ${v} (${i.size.toLocaleString()} bytes)
`,u&&(h+=`\u{1F3F7}\uFE0F Type: ${u.toUpperCase()} file
`),c)try{let g=t||e,U=(await this._fileSystem.readFile(g,"utf8")).split(`
`).length;h+=`\u{1F4CF} Lines: ${U.toLocaleString()}
`}catch{}return h+=`\u{1F4C2} Path: ${e}`,s&&(h+=`

\u{1F464} Last Modified By: ${s.authorName}`,s.authorEmail&&(h+=` (${s.authorEmail})`),s.authorDate&&(h+=`
   ${s.authorDate}`)),h}_formatDateReadable(e){let t=new Date,i=t.getTime()-e.getTime(),o=Math.floor(i/(1e3*60)),s=Math.floor(i/(1e3*60*60)),r=Math.floor(i/(1e3*60*60*24)),n=this._buildReadableDescriptor(e,t,o,s,r);return n?this._getFlyweightValue(this._readableDateFlyweightCache,this._readableDateFlyweightOrder,this._readableDateFlyweightLimit,n.key,n.factory,this._readableFlyweightStats):e.getFullYear()===t.getFullYear()?this._l10n.formatDate(e,{month:"short",day:"numeric"}):this._l10n.formatDate(e,{month:"short",day:"numeric",year:"numeric"})}async _getGitBlameInfo(e,t=null){if(!this._gitAvailable||!le)return null;try{let i=m.workspace.getWorkspaceFolder(m.Uri.file(e));if(!i)return null;let o=i.uri.fsPath||i.uri.path,s=Hi(o,e),r=this._getGitCacheKey(o,s,t),n=this._getCachedGitInfo(r);if(n)return n;let c=Date.now();try{let{stdout:l}=await le(`git log -1 --format="%H|%an|%ae|%ad" -- "${s}"`,{cwd:i.uri.fsPath,timeout:2e3});if(!l||!l.trim())return null;let[u,h,v,g]=l.trim().split("|"),w={hash:u||"",authorName:h||"Unknown",authorEmail:v||"",authorDate:g||""};return this._setCachedGitInfo(r,w),w}finally{let l=Date.now()-c;this._metrics.gitBlameTimeMs+=l,this._metrics.gitBlameCalls++}}catch{return null}}_getInitials(e){if(!e||typeof e!="string")return null;let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?null:t.length===1?t[0].substring(0,2).toUpperCase():(t[0][0]+(t[1][0]||"")).substring(0,2).toUpperCase()}_formatCompactSize(e){if(typeof e!="number"||isNaN(e))return null;let t=["B","K","M","G","T"],i=0,o=e;for(;o>=1024&&i<t.length-1;)o=o/1024,i++;let s=Math.round(o),r=t[i];if(s<=9)return`${s}${r}`;let n=String(s);return n.length>=2?n.slice(0,2):n}_formatFullDate(e){let t={year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"};return e.toLocaleString("en-US",t)}_getCacheKey(e){let t=Gi(Y(e));return this._cacheNamespace?`${this._cacheNamespace}${Ge}${t}`:t}_stripNamespaceFromCacheKey(e){if(!e||typeof e!="string")return e;let t=e.indexOf(Ge);return t===-1?e:e.slice(t+Ge.length)}_stableHash(e){let t=typeof e=="string"?e:JSON.stringify(e),i=0;for(let o=0;o<t.length;o++)i=(i<<5)-i+t.charCodeAt(o),i|=0;return Math.abs(i).toString(16)}_buildCacheNamespace(e){try{let t=e||m.workspace.getConfiguration("explorerDates"),i={dateDecorationFormat:t.get("dateDecorationFormat","smart"),showGitInfo:t.get("showGitInfo",!0),showFileSize:t.get("showFileSize",!1),fileSizeFormat:t.get("fileSizeFormat","auto"),colorScheme:t.get("colorScheme","recency"),highContrastMode:t.get("highContrastMode",!1),fadeOldFiles:t.get("fadeOldFiles",!1),fadeThreshold:t.get("fadeThreshold",72),badgePriority:t.get("badgePriority","time"),showDateDecorations:t.get("showDateDecorations",!0),excludedFolders:(t.get("excludedFolders",[])||[]).join("|"),excludedPatterns:(t.get("excludedPatterns",[])||[]).join("|"),customColors:JSON.stringify(t.get("customColors",{})),metadataVersion:2};return`ns-${this._stableHash(i).slice(0,8)}`}catch(t){return this._logger.debug(`Failed to build cache namespace: ${t.message}`),"ns-default"}}_updateCacheNamespace(e){let t=this._buildCacheNamespace(e);if(t&&t!==this._cacheNamespace){let i=this._cacheNamespace;return this._cacheNamespace=t,this._logger.info(`Cache namespace updated (${i||"unset"} \u2192 ${t})`),!0}return!1}_isFileNotFoundError(e){return e?e.code==="ENOENT"?!0:typeof e.message=="string"&&e.message.includes("ENOENT"):!1}async provideFileDecoration(e,t){var o,s,r;let i=Date.now();try{if(!e){this._logger.error("\u274C Invalid URI provided to provideFileDecoration:",e);return}let n=Y(e);if(!n){this._logger.error("\u274C Could not resolve path for URI in provideFileDecoration:",e);return}let c=H(n),l=e.scheme||"file";if(l!=="file"){this._logger.debug(`\u23ED\uFE0F Skipping decoration for ${c} (unsupported scheme: ${l})`);return}this._performanceMode||(this._logger.debug(`\u{1F50D} VSCODE REQUESTED DECORATION: ${c} (${n})`),this._logger.infoWithOptions(this._stressLogOptions,`\u{1F4CA} Call context: token=${!!t}, cancelled=${t==null?void 0:t.isCancellationRequested}`));let u=m.workspace.getConfiguration("explorerDates"),h=d((T,re)=>{if(this._previewSettings&&Object.prototype.hasOwnProperty.call(this._previewSettings,T)){let dt=this._previewSettings[T];return this._logger.debug(`\u{1F3AD} Using preview value for ${T}: ${dt} (config has: ${u.get(T,re)})`),dt}return u.get(T,re)},"_get");if(this._previewSettings&&this._logger.infoWithOptions(this._stressLogOptions,`\u{1F3AD} Processing ${c} in PREVIEW MODE with settings:`,()=>this._previewSettings),!h("showDateDecorations",!0)){this._performanceMode||this._logger.infoWithOptions(this._stressLogOptions,`\u274C RETURNED UNDEFINED: Decorations disabled globally for ${c}`);return}if(await this._isExcludedSimple(e)){this._performanceMode||this._logger.infoWithOptions(this._stressLogOptions,`\u274C File excluded: ${c}`);return}this._logger.debug(`\u{1F50D} Processing file: ${c}`);let v=this._getCacheKey(e);if(this._previewSettings)this._logger.debug(`\u{1F504} Skipping cache due to active preview settings for: ${c}`);else{let T=await this._getCachedDecoration(v,c);if(T)return T}if(this._metrics.cacheMisses++,this._logger.debug(`\u274C Cache miss for: ${c} (key: ${v.substring(0,50)}...)`),t!=null&&t.isCancellationRequested){this._logger.debug(`Decoration cancelled for: ${n}`);return}let g=Date.now(),w;try{w=await this._fileSystem.stat(e)}catch(T){if(this._metrics.fileStatTimeMs+=Date.now()-g,this._metrics.fileStatCalls++,this._isFileNotFoundError(T)){this._logger.debug(`\u23ED\uFE0F Skipping decoration for ${c}: file not found (${T.message||T})`);return}throw T}if(this._metrics.fileStatTimeMs+=Date.now()-g,this._metrics.fileStatCalls++,!(typeof w.isFile=="function"?w.isFile():!0))return;let N=w.mtime instanceof Date?w.mtime:new Date(w.mtime),_e=w.birthtime instanceof Date?w.birthtime:new Date(w.birthtime||w.ctime||w.mtime),he={mtime:N,birthtime:_e,size:w.size},te=Date.now()-N.getTime(),be=h("dateDecorationFormat","smart"),P=this._performanceMode?"none":h("colorScheme","none"),ie=h("highContrastMode",!1),ue=this._performanceMode?!1:h("showFileSize",!1),ye=h("fileSizeFormat","auto"),oe=h("accessibilityMode",!1),b=this._performanceMode?!1:h("fadeOldFiles",!1),X=h("fadeThreshold",30),se=this._performanceMode?"none":h("showGitInfo","none"),q=this._performanceMode?"time":h("badgePriority","time");this._lightweightMode&&(P="none",ue=!1,oe=!1,se="none",q="time");let xe=(se!=="none"||q==="author")&&this._gitAvailable&&!this._performanceMode,nt=xe?se:"none";q==="author"&&!xe&&(q="time");let ct=xe?await this._getGitBlameInfo(n,N.getTime()):null,De=this._generateBadgeDetails({filePath:n,stat:he,diffMs:te,dateFormat:be,badgePriority:q,showFileSize:ue,fileSizeFormat:ye,gitBlame:ct,showGitInfo:nt}),oi=fe(n),si=[".js",".ts",".jsx",".tsx",".py",".rb",".php",".java",".cpp",".c",".cs",".go",".rs",".kt",".swift"].includes(oi),lt=oe&&((o=this._accessibility)==null?void 0:o.shouldEnhanceAccessibility());this._logger.debug(`\u{1F50D} Tooltip generation for ${c}: accessibilityMode=${oe}, shouldUseAccessible=${lt}, previewMode=${!!this._previewSettings}`);let Se=await this._buildTooltipContent({filePath:n,resourceUri:e,stat:he,badgeDetails:De,gitBlame:nt==="none"?null:ct,shouldUseAccessibleTooltips:lt,fileSizeFormat:ye,isCodeFile:si}),V;P!=="none"&&(V=this._themeIntegration?this._themeIntegration.applyThemeAwareColorScheme(P,n,te):this._getColorByScheme(N,P,n)),this._logger.debug(`\u{1F3A8} Color scheme setting: ${P}, using color: ${V?"yes":"no"}`);let Fe=It(De.displayBadge)||It(De.badge)||"??";(s=this._accessibility)!=null&&s.shouldEnhanceAccessibility()&&(Fe=this._accessibility.getAccessibleBadge(Fe));let A,j=V;j&&(j=this._enhanceColorForSelection(j),this._logger.debug(`\u{1F3A8} Added enhanced color: ${j.id||j} (original: ${(V==null?void 0:V.id)||V})`)),b&&Math.floor(te/864e5)>X&&(j=new m.ThemeColor("editorGutter.commentRangeForeground")),ie&&(j=new m.ThemeColor("editorWarning.foreground"),this._logger.info(`\u{1F506} Applied high contrast color (overriding colorScheme=${P})`));let Te=Se&&Se.length<500?Se:void 0;try{A=this._acquireDecorationFromPool({badge:Fe,tooltip:Te,color:j}),Te&&this._logger.debug(`\u{1F4DD} Added tooltip (${Te.length} chars)`)}catch(T){this._logger.error("\u274C Failed to create decoration:",T),A=new m.FileDecoration("!!"),A.propagate=!1}if(this._logger.debug(`\u{1F3A8} Color/contrast check for ${c}: colorScheme=${P}, highContrastMode=${ie}, hasColor=${!!j}, previewMode=${!!this._previewSettings}`),this._previewSettings?this._logger.debug(`\u{1F504} Skipping cache storage due to preview mode for: ${c}`):await this._storeDecorationInCache(v,A,c,e),this._metrics.totalDecorations++,this._maybeShedWorkload(),this._maybePurgeLightweightCaches(),!(A!=null&&A.badge)){this._logger.error(`\u274C Decoration badge is invalid for: ${c}`);return}let ri=Date.now()-i;return this._performanceMode||(this._logger.infoWithOptions(this._stressLogOptions,`\u2705 Decoration created for: ${c} (badge: ${A.badge||"undefined"}) - Cache key: ${v.substring(0,30)}...`),this._logger.infoWithOptions(this._stressLogOptions,"\u{1F3AF} RETURNING DECORATION TO VSCODE:",()=>{var T,re;return{file:c,badge:A.badge,hasTooltip:!!A.tooltip,hasColor:!!A.color,colorType:(re=(T=A.color)==null?void 0:T.constructor)==null?void 0:re.name,processingTimeMs:ri,decorationType:A.constructor.name}})),A}catch(n){this._metrics.errors++;let c=i?Date.now()-i:0,l=H(e),u=Y(e)||"unknown-uri";this._logger.error(`\u274C DECORATION ERROR for ${l}:`,{error:n.message,stack:(r=n.stack)==null?void 0:r.split(`
`)[0],processingTimeMs:c,uri:u}),this._logger.error(`\u274C CRITICAL ERROR DETAILS for ${l}: ${n.message}`),this._logger.error(`\u274C Error type: ${n.constructor.name}`),this._logger.error(`\u274C Full stack: ${n.stack}`),this._logger.info(`\u274C RETURNED UNDEFINED: Error occurred for ${l}`);return}}getMetrics(){let e={...this._metrics,cacheSize:this._decorationCache.size,cacheHitRate:this._metrics.cacheHits+this._metrics.cacheMisses>0?(this._metrics.cacheHits/(this._metrics.cacheHits+this._metrics.cacheMisses)*100).toFixed(2)+"%":"0.00%",forceCacheBypass:this._forceCacheBypass,decorationPoolEnabled:this._enableDecorationPool,flyweightsEnabled:this._enableFlyweights,lightweightMode:this._lightweightMode,memorySheddingEnabled:this._memorySheddingEnabled,memorySheddingActive:this._memorySheddingActive};e.decorationPool={size:this._decorationPool.size,hits:this._decorationPoolStats.hits,misses:this._decorationPoolStats.misses},e.badgeFlyweight={...this._badgeFlyweightStats,cacheSize:this._badgeFlyweightCache.size},e.readableFlyweight={...this._readableFlyweightStats,cacheSize:this._readableDateFlyweightCache.size},this._advancedCache&&(e.advancedCache=this._advancedCache.getStats()),this._batchProcessor&&(e.batchProcessor=this._batchProcessor.getMetrics());let t=Array.from(this._decorationCache.keys()).slice(0,5).map(i=>this._stripNamespaceFromCacheKey(i));return e.cacheDebugging={memoryCacheKeys:t,cacheTimeout:this._cacheTimeout,maxCacheSize:this._maxCacheSize,keyStatsSize:this._cacheKeyStats?this._cacheKeyStats.size:0,cacheNamespace:this._cacheNamespace},e.performanceTiming={avgGitBlameMs:this._metrics.gitBlameCalls>0?(this._metrics.gitBlameTimeMs/this._metrics.gitBlameCalls).toFixed(1):"0.0",avgFileStatMs:this._metrics.fileStatCalls>0?(this._metrics.fileStatTimeMs/this._metrics.fileStatCalls).toFixed(1):"0.0",totalGitBlameTimeMs:this._metrics.gitBlameTimeMs,totalFileStatTimeMs:this._metrics.fileStatTimeMs,gitBlameCalls:this._metrics.gitBlameCalls,fileStatCalls:this._metrics.fileStatCalls},e}async initializeAdvancedSystems(e){try{if(this._extensionContext=e,this._isWeb&&await this._maybeWarnAboutGitLimitations(),this._performanceMode){this._logger.info("Performance mode enabled - skipping advanced cache, batch processor, and progressive loading");return}this._advancedCache=new Ni(e),await this._advancedCache.initialize(),this._logger.info("Advanced cache initialized"),this._batchProcessor.initialize(),this._logger.info("Batch processor initialized"),await this._applyProgressiveLoadingSetting(),m.workspace.getConfiguration("explorerDates").get("autoThemeAdaptation",!0)&&(await this._themeIntegration.autoConfigureForTheme(),this._logger.info("Theme integration configured")),this._accessibility.shouldEnhanceAccessibility()&&(await this._accessibility.applyAccessibilityRecommendations(),this._logger.info("Accessibility recommendations applied"));try{await this._smartExclusion.cleanupAllWorkspaceProfiles()}catch(i){this._logger.warn("Failed to clean workspace exclusion profiles",i)}if(m.workspace.workspaceFolders)for(let i of m.workspace.workspaceFolders)try{await this._smartExclusion.suggestExclusions(i.uri),this._logger.info(`Smart exclusions analyzed for: ${i.name}`)}catch(o){this._logger.error(`Failed to analyze smart exclusions for ${i.name}`,o)}this._logger.info("Advanced systems initialized successfully")}catch(t){this._logger.error("Failed to initialize advanced systems",t)}}async _maybeWarnAboutGitLimitations(){var e;if(!this._gitWarningShown){this._gitWarningShown=!0;try{let t=(e=this._extensionContext)==null?void 0:e.globalState,i=Ki.WEB_GIT_NOTICE;if(t==null?void 0:t.get(i,!1))return;if(t!=null&&t.update)try{await t.update(i,!0)}catch(s){this._logger.debug("Failed to persist Git limitation notice flag",s)}Promise.resolve().then(()=>{m.window.showInformationMessage("Explorer Dates: Git attribution badges are unavailable on VS Code for Web. Time-based decorations remain available.")})}catch(t){this._logger.debug("Failed to display Git limitation notice",t)}}}_enhanceColorForSelection(e){let t={"charts.yellow":"list.warningForeground","charts.red":"list.errorForeground","charts.green":"list.highlightForeground","charts.blue":"symbolIcon.functionForeground","charts.purple":"symbolIcon.classForeground","charts.orange":"list.warningForeground","terminal.ansiYellow":"list.warningForeground","terminal.ansiGreen":"list.highlightForeground","terminal.ansiRed":"list.errorForeground","terminal.ansiBlue":"symbolIcon.functionForeground","terminal.ansiMagenta":"symbolIcon.classForeground","terminal.ansiCyan":"symbolIcon.stringForeground","editorGutter.commentRangeForeground":"list.deemphasizedForeground","editorWarning.foreground":"list.warningForeground","editorError.foreground":"list.errorForeground","editorInfo.foreground":"list.highlightForeground"},i=e.id||e,o=t[i];return o?(this._logger.debug(`\u{1F527} Enhanced color ${i} \u2192 ${o} for better selection visibility`),new m.ThemeColor(o)):e}async dispose(){this._logger.info("Disposing FileDateDecorationProvider",this.getMetrics()),this._refreshTimer&&(clearInterval(this._refreshTimer),this._refreshTimer=null,this._logger.info("Cleared periodic refresh timer")),this._cancelIncrementalRefreshTimers(),this._advancedCache&&await this._advancedCache.dispose(),this._cancelProgressiveWarmupJobs(),this._batchProcessor&&this._batchProcessor.dispose(),this._accessibility&&typeof this._accessibility.dispose=="function"&&this._accessibility.dispose(),this._decorationCache.clear(),this._clearDecorationPool("dispose"),this._gitCache.clear(),this._onDidChangeFileDecorations.dispose(),this._fileWatcher&&this._fileWatcher.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null)}};d(Ve,"FileDateDecorationProvider");var qe=Ve;Lt.exports={FileDateDecorationProvider:qe}});var Wt=S((exports,module)=>{var vscode=require("vscode"),{fileSystem}=G(),{getFileName,getRelativePath}=B(),isWeb=!1,childProcess=null;function loadChildProcess(){return!childProcess&&!isWeb&&(childProcess=eval("require")("child_process")),childProcess}d(loadChildProcess,"loadChildProcess");function registerCoreCommands({context:a,fileDateProvider:e,logger:t,l10n:i}){let o=[];o.push(vscode.commands.registerCommand("explorerDates.refreshDateDecorations",()=>{try{if(e){e.clearAllCaches(),e.refreshAll();let s=(i==null?void 0:i.getString("refreshSuccess"))||"Date decorations refreshed - all caches cleared";vscode.window.showInformationMessage(s),t.info("Date decorations refreshed manually with cache clear")}}catch(s){t.error("Failed to refresh decorations",s),vscode.window.showErrorMessage(`Failed to refresh decorations: ${s.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.previewConfiguration",s=>{try{e&&(e.applyPreviewSettings(s),t.info("Configuration preview applied",s))}catch(r){t.error("Failed to apply configuration preview",r)}})),o.push(vscode.commands.registerCommand("explorerDates.clearPreview",()=>{try{e&&(e.applyPreviewSettings(null),t.info("Configuration preview cleared"))}catch(s){t.error("Failed to clear configuration preview",s)}})),o.push(vscode.commands.registerCommand("explorerDates.showMetrics",()=>{try{if(e){let s=e.getMetrics(),r=`Explorer Dates Metrics:
Total Decorations: ${s.totalDecorations}
Cache Size: ${s.cacheSize}
Cache Hits: ${s.cacheHits}
Cache Misses: ${s.cacheMisses}
Cache Hit Rate: ${s.cacheHitRate}
Errors: ${s.errors}`;s.advancedCache&&(r+=`

Advanced Cache:
Memory Items: ${s.advancedCache.memoryItems}
Memory Usage: ${(s.advancedCache.memoryUsage/1024/1024).toFixed(2)} MB
Memory Hit Rate: ${s.advancedCache.memoryHitRate}
Disk Hit Rate: ${s.advancedCache.diskHitRate}
Evictions: ${s.advancedCache.evictions}`),s.batchProcessor&&(r+=`

Batch Processor:
Queue Length: ${s.batchProcessor.queueLength}
Is Processing: ${s.batchProcessor.isProcessing}
Average Batch Time: ${s.batchProcessor.averageBatchTime.toFixed(2)}ms`),vscode.window.showInformationMessage(r,{modal:!0}),t.info("Metrics displayed",s)}}catch(s){t.error("Failed to show metrics",s),vscode.window.showErrorMessage(`Failed to show metrics: ${s.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.openLogs",()=>{try{t.show()}catch(s){t.error("Failed to open logs",s),vscode.window.showErrorMessage(`Failed to open logs: ${s.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.showCurrentConfig",()=>{try{let s=vscode.workspace.getConfiguration("explorerDates"),r={highContrastMode:s.get("highContrastMode"),badgePriority:s.get("badgePriority"),colorScheme:s.get("colorScheme"),accessibilityMode:s.get("accessibilityMode"),dateDecorationFormat:s.get("dateDecorationFormat"),showGitInfo:s.get("showGitInfo"),showFileSize:s.get("showFileSize")},n=`Current Explorer Dates Configuration:

${Object.entries(r).map(([c,l])=>`${c}: ${JSON.stringify(l)}`).join(`
`)}`;vscode.window.showInformationMessage(n,{modal:!0}),t.info("Current configuration displayed",r)}catch(s){t.error("Failed to show configuration",s)}})),o.push(vscode.commands.registerCommand("explorerDates.resetToDefaults",async()=>{try{let s=vscode.workspace.getConfiguration("explorerDates");await s.update("highContrastMode",!1,vscode.ConfigurationTarget.Global),await s.update("badgePriority","time",vscode.ConfigurationTarget.Global),await s.update("accessibilityMode",!1,vscode.ConfigurationTarget.Global),vscode.window.showInformationMessage("Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately."),t.info("Reset problematic settings to defaults"),e&&(e.clearAllCaches(),e.refreshAll())}catch(s){t.error("Failed to reset settings",s),vscode.window.showErrorMessage(`Failed to reset settings: ${s.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.toggleDecorations",()=>{try{let s=vscode.workspace.getConfiguration("explorerDates"),r=s.get("showDateDecorations",!0);s.update("showDateDecorations",!r,vscode.ConfigurationTarget.Global);let n=r?(i==null?void 0:i.getString("decorationsDisabled"))||"Date decorations disabled":(i==null?void 0:i.getString("decorationsEnabled"))||"Date decorations enabled";vscode.window.showInformationMessage(n),t.info(`Date decorations toggled to: ${!r}`)}catch(s){t.error("Failed to toggle decorations",s),vscode.window.showErrorMessage(`Failed to toggle decorations: ${s.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.copyFileDate",async s=>{try{let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=await fileSystem.stat(r),c=(n.mtime instanceof Date?n.mtime:new Date(n.mtime)).toLocaleString();await vscode.env.clipboard.writeText(c),vscode.window.showInformationMessage(`Copied to clipboard: ${c}`),t.info(`File date copied for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to copy file date",r),vscode.window.showErrorMessage(`Failed to copy file date: ${r.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.showFileDetails",async s=>{try{let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=await fileSystem.stat(r),c=getFileName(r.fsPath||r.path),l=(e==null?void 0:e._formatFileSize(n.size,"auto"))||`${n.size} bytes`,u=(n.mtime instanceof Date?n.mtime:new Date(n.mtime)).toLocaleString(),h=(n.birthtime instanceof Date?n.birthtime:new Date(n.birthtime||n.mtime)).toLocaleString(),v=`File: ${c}
Size: ${l}
Modified: ${u}
Created: ${h}
Path: ${r.fsPath||r.path}`;vscode.window.showInformationMessage(v,{modal:!0}),t.info(`File details shown for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to show file details",r),vscode.window.showErrorMessage(`Failed to show file details: ${r.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.toggleFadeOldFiles",()=>{try{let s=vscode.workspace.getConfiguration("explorerDates"),r=s.get("fadeOldFiles",!1);s.update("fadeOldFiles",!r,vscode.ConfigurationTarget.Global);let n=r?"Fade old files disabled":"Fade old files enabled";vscode.window.showInformationMessage(n),t.info(`Fade old files toggled to: ${!r}`)}catch(s){t.error("Failed to toggle fade old files",s),vscode.window.showErrorMessage(`Failed to toggle fade old files: ${s.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.showFileHistory",async s=>{try{if(isWeb){vscode.window.showInformationMessage("Git history is unavailable on VS Code for Web.");return}let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=vscode.workspace.getWorkspaceFolder(r);if(!n){vscode.window.showWarningMessage("File is not in a workspace");return}let l=`git log --oneline -10 -- "${getRelativePath(n.uri.fsPath||n.uri.path,r.fsPath||r.path)}"`;loadChildProcess().exec(l,{cwd:n.uri.fsPath,timeout:3e3},(h,v)=>{if(h){h.message.includes("not a git repository")?vscode.window.showWarningMessage("This file is not in a Git repository"):vscode.window.showErrorMessage(`Git error: ${h.message}`);return}if(!v.trim()){vscode.window.showInformationMessage("No Git history found for this file");return}let g=v.trim(),w=getFileName(r.fsPath||r.path);vscode.window.showInformationMessage(`Recent commits for ${w}:

${g}`,{modal:!0})}),t.info(`File history requested for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to show file history",r),vscode.window.showErrorMessage(`Failed to show file history: ${r.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.compareWithPrevious",async s=>{try{if(isWeb){vscode.window.showInformationMessage("Git comparisons are unavailable on VS Code for Web.");return}let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}if(!vscode.workspace.getWorkspaceFolder(r)){vscode.window.showWarningMessage("File is not in a workspace");return}await vscode.commands.executeCommand("git.openChange",r),t.info(`Git diff opened for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to compare with previous version",r),vscode.window.showErrorMessage(`Failed to compare with previous version: ${r.message}`)}})),o.push(vscode.commands.registerCommand("explorerDates.applyCustomColors",async()=>{try{let r=vscode.workspace.getConfiguration("explorerDates").get("customColors",{veryRecent:"#00ff00",recent:"#ffff00",old:"#ff0000"}),n=`To use custom colors with Explorer Dates, add the following to your settings.json:

"workbench.colorCustomizations": {
  "explorerDates.customColor.veryRecent": "${r.veryRecent}",
  "explorerDates.customColor.recent": "${r.recent}",
  "explorerDates.customColor.old": "${r.old}"
}

Also set: "explorerDates.colorScheme": "custom"`,c=await vscode.window.showInformationMessage("Custom colors configuration",{modal:!0,detail:n},"Copy to Clipboard","Open Settings");if(c==="Copy to Clipboard"){let l=`"workbench.colorCustomizations": {
  "explorerDates.customColor.veryRecent": "${r.veryRecent}",
  "explorerDates.customColor.recent": "${r.recent}",
  "explorerDates.customColor.old": "${r.old}"
}`;await vscode.env.clipboard.writeText(l),vscode.window.showInformationMessage("Custom color configuration copied to clipboard")}else c==="Open Settings"&&await vscode.commands.executeCommand("workbench.action.openSettings","workbench.colorCustomizations");t.info("Custom colors help displayed")}catch(s){t.error("Failed to apply custom colors",s),vscode.window.showErrorMessage(`Failed to apply custom colors: ${s.message}`)}})),o.forEach(s=>a.subscriptions.push(s))}d(registerCoreCommands,"registerCoreCommands");module.exports={registerCoreCommands}});var Bt=S((is,Nt)=>{var $=require("vscode"),{getLogger:Yi}=M(),Je=class Je{constructor(e){this._logger=Yi(),this._provider=e,this._testResults=[]}async runComprehensiveDiagnostics(){var t,i;this._logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let e={timestamp:new Date().toISOString(),vscodeVersion:$.version,extensionVersion:(i=(t=$.extensions.getExtension("incredincomp.explorer-dates"))==null?void 0:t.packageJSON)==null?void 0:i.version,tests:{}};return e.tests.vscodeSettings=await this._testVSCodeSettings(),e.tests.providerRegistration=await this._testProviderRegistration(),e.tests.fileProcessing=await this._testFileProcessing(),e.tests.decorationCreation=await this._testDecorationCreation(),e.tests.cacheAnalysis=await this._testCacheAnalysis(),e.tests.extensionConflicts=await this._testExtensionConflicts(),e.tests.uriPathIssues=await this._testURIPathIssues(),this._logger.info("\u{1F50D} Comprehensive diagnostics completed",e),e}async _testVSCodeSettings(){let e=$.workspace.getConfiguration("explorer"),t=$.workspace.getConfiguration("workbench"),i=$.workspace.getConfiguration("explorerDates"),o={"explorer.decorations.badges":e.get("decorations.badges"),"explorer.decorations.colors":e.get("decorations.colors"),"workbench.colorTheme":t.get("colorTheme"),"explorerDates.showDateDecorations":i.get("showDateDecorations"),"explorerDates.colorScheme":i.get("colorScheme"),"explorerDates.showGitInfo":i.get("showGitInfo")},s=[];return o["explorer.decorations.badges"]===!1&&s.push("CRITICAL: explorer.decorations.badges is disabled"),o["explorer.decorations.colors"]===!1&&s.push("WARNING: explorer.decorations.colors is disabled"),o["explorerDates.showDateDecorations"]===!1&&s.push("CRITICAL: explorerDates.showDateDecorations is disabled"),{status:s.length>0?"ISSUES_FOUND":"OK",settings:o,issues:s}}async _testProviderRegistration(){let e=[];if(!this._provider)return e.push("CRITICAL: Decoration provider is null/undefined"),{status:"FAILED",issues:e};typeof this._provider.provideFileDecoration!="function"&&e.push("CRITICAL: provideFileDecoration method missing"),this._provider.onDidChangeFileDecorations||e.push("WARNING: onDidChangeFileDecorations event emitter missing");let t=$.Uri.file("/test/path");try{let i=await this._provider.provideFileDecoration(t);this._logger.debug("Provider test call completed",{result:!!i})}catch(i){e.push(`ERROR: Provider test call failed: ${i.message}`)}return{status:e.length>0?"ISSUES_FOUND":"OK",providerActive:!!this._provider,issues:e}}async _testFileProcessing(){let e=$.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace folders available"]};let t=[],i=[];try{let o=["package.json","README.md","extension.js","src/logger.js"];for(let s of o){let r=$.Uri.joinPath(e[0].uri,s);try{await $.workspace.fs.stat(r);let n=this._provider._isExcludedSimple?await this._provider._isExcludedSimple(r):!1,c=await this._provider.provideFileDecoration(r);t.push({file:s,exists:!0,excluded:n,hasDecoration:!!c,badge:c==null?void 0:c.badge,uri:r.toString()})}catch(n){t.push({file:s,exists:!1,error:n.message})}}}catch(o){i.push(`File processing test failed: ${o.message}`)}return{status:i.length>0?"ISSUES_FOUND":"OK",testFiles:t,issues:i}}async _testDecorationCreation(){let e=[],t=[];try{let o=new $.FileDecoration("test");e.push({name:"Simple decoration",success:!0,badge:o.badge})}catch(o){e.push({name:"Simple decoration",success:!1,error:o.message}),t.push("CRITICAL: Cannot create simple FileDecoration")}try{let o=new $.FileDecoration("test","Test tooltip");e.push({name:"Decoration with tooltip",success:!0,hasTooltip:!!(o&&o.tooltip)})}catch(o){e.push({name:"Decoration with tooltip",success:!1,error:o.message}),t.push("WARNING: Cannot create FileDecoration with tooltip")}try{let o=new $.FileDecoration("test","Test tooltip",new $.ThemeColor("charts.red"));e.push({name:"Decoration with color",success:!0,hasColor:!!o.color})}catch(o){e.push({name:"Decoration with color",success:!1,error:o.message}),t.push("WARNING: Cannot create FileDecoration with color")}let i=["1d","10m","2h","!!","\u25CF\u25CF","JA12","123456789"];for(let o of i)try{let s=new $.FileDecoration(o);e.push({name:`Badge format: ${o}`,success:!0,badge:s.badge,length:o.length})}catch(s){e.push({name:`Badge format: ${o}`,success:!1,error:s.message}),o.length<=8&&t.push(`WARNING: Valid badge format '${o}' failed`)}return{status:t.length>0?"ISSUES_FOUND":"OK",tests:e,issues:t}}async _testCacheAnalysis(){var i;let e={memoryCache:{size:((i=this._provider._decorationCache)==null?void 0:i.size)||0,maxSize:this._provider._maxCacheSize||0},advancedCache:{available:!!this._provider._advancedCache,initialized:!1},metrics:this._provider.getMetrics?this._provider.getMetrics():null},t=[];return e.memoryCache.size>e.memoryCache.maxSize*.9&&t.push("WARNING: Memory cache is nearly full"),e.metrics&&e.metrics.cacheHits===0&&e.metrics.cacheMisses>10&&t.push("WARNING: Cache hit rate is 0% - potential cache key issues"),{status:t.length>0?"ISSUES_FOUND":"OK",cacheInfo:e,issues:t}}async _testExtensionConflicts(){var s,r;let e=$.extensions.all,t=[],i=[];for(let n of e){if(!n.isActive)continue;let c=n.packageJSON;(r=(s=c.contributes)==null?void 0:s.commands)!=null&&r.some(u=>{var h,v,g,w;return((h=u.command)==null?void 0:h.includes("decoration"))||((v=u.title)==null?void 0:v.includes("decoration"))||((g=u.title)==null?void 0:g.includes("badge"))||((w=u.title)==null?void 0:w.includes("explorer"))})&&i.push({id:n.id,name:c.displayName||c.name,version:c.version}),["file-icons","vscode-icons","material-icon-theme","explorer-exclude","hide-files","file-watcher"].some(u=>n.id.includes(u))&&t.push({id:n.id,name:c.displayName||c.name,reason:"Known to potentially interfere with file decorations"})}let o=[];return i.length>1&&o.push(`WARNING: ${i.length} extensions might provide file decorations`),t.length>0&&o.push(`WARNING: ${t.length} potentially conflicting extensions detected`),{status:o.length>0?"ISSUES_FOUND":"OK",decorationExtensions:i,potentialConflicts:t,issues:o}}async _testURIPathIssues(){let e=$.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace available for URI testing"]};let t=[],i=[],o=["package.json","src/logger.js","README.md",".gitignore"];for(let s of o){let r=$.Uri.joinPath(e[0].uri,s);t.push({path:s,scheme:r.scheme,fsPath:r.fsPath,authority:r.authority,valid:r.scheme==="file"&&r.fsPath.length>0}),r.scheme!=="file"&&i.push(`WARNING: Non-file URI scheme for ${s}: ${r.scheme}`),(r.fsPath.includes("\\\\")||r.fsPath.includes("//"))&&i.push(`WARNING: Potential path separator issues in ${s}`)}return{status:i.length>0?"ISSUES_FOUND":"OK",tests:t,issues:i}}};d(Je,"DecorationDiagnostics");var Ke=Je;Nt.exports={DecorationDiagnostics:Ke}});var jt=S((ss,Ut)=>{var Q=require("vscode"),{getFileName:Qi}=B();async function Xi(){let a=M().getLogger();a.info("\u{1F3A8} Testing VS Code decoration rendering...");let o=class o{constructor(){this._onDidChangeFileDecorations=new Q.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event}provideFileDecoration(r){let n=Qi(r.fsPath||r.path),c=new Q.FileDecoration("TEST");return c.tooltip=`Test decoration for ${n}`,c.color=new Q.ThemeColor("charts.red"),a.info(`\u{1F9EA} Test provider returning decoration for: ${n}`),c}};d(o,"TestDecorationProvider");let e=o,t=new e,i=Q.window.registerFileDecorationProvider(t);return a.info("\u{1F9EA} Test decoration provider registered"),setTimeout(()=>{t._onDidChangeFileDecorations.fire(void 0),a.info("\u{1F504} Test decoration refresh triggered"),setTimeout(()=>{i.dispose(),a.info("\u{1F9EA} Test decoration provider disposed")},1e4)},1e3),"Test decoration provider registered for 10 seconds"}d(Xi,"testVSCodeDecorationRendering");async function Zi(){let a=M().getLogger();a.info("\u{1F527} Testing FileDecoration API...");let e=[];try{let i=new Q.FileDecoration("MIN");e.push({name:"Minimal decoration",success:!0,badge:i.badge}),a.info("\u2705 Minimal decoration created successfully")}catch(i){e.push({name:"Minimal decoration",success:!1,error:i.message}),a.error("\u274C Minimal decoration failed:",i)}try{let i=new Q.FileDecoration("FULL","Full decoration tooltip",new Q.ThemeColor("charts.blue"));i.propagate=!1,e.push({name:"Full decoration",success:!0,badge:i.badge,hasTooltip:!!i.tooltip,hasColor:!!i.color,propagate:i.propagate}),a.info("\u2705 Full decoration created successfully")}catch(i){e.push({name:"Full decoration",success:!1,error:i.message}),a.error("\u274C Full decoration failed:",i)}let t=["charts.red","charts.blue","charts.green","charts.yellow","terminal.ansiRed","terminal.ansiGreen","terminal.ansiBlue","editorError.foreground","editorWarning.foreground","editorInfo.foreground"];for(let i of t)try{e.push({name:`ThemeColor: ${i}`,success:!0,colorId:i})}catch(o){e.push({name:`ThemeColor: ${i}`,success:!1,error:o.message}),a.error(`\u274C ThemeColor ${i} failed:`,o)}return e}d(Zi,"testFileDecorationAPI");Ut.exports={testVSCodeDecorationRendering:Xi,testFileDecorationAPI:Zi}});var Ht=S((as,Gt)=>{var f=require("vscode"),{fileSystem:eo}=G(),{getFileName:to,getRelativePath:io}=B();function oo({context:a,fileDateProvider:e,logger:t,generators:i}){let{generateWorkspaceActivityHTML:o,generatePerformanceAnalyticsHTML:s,generateDiagnosticsHTML:r,generateDiagnosticsWebview:n}=i,c=[];c.push(f.commands.registerCommand("explorerDates.showWorkspaceActivity",async()=>{try{let l=f.window.createWebviewPanel("workspaceActivity","Workspace File Activity",f.ViewColumn.One,{enableScripts:!0});if(!f.workspace.workspaceFolders){f.window.showWarningMessage("No workspace folder open");return}let u=f.workspace.workspaceFolders[0],h=[],v=await f.workspace.findFiles("**/*","**/node_modules/**",100);for(let g of v)try{let w=await eo.stat(g);(typeof w.isFile=="function"?w.isFile():!0)&&h.push({path:io(u.uri.fsPath||u.uri.path,g.fsPath||g.path),modified:w.mtime instanceof Date?w.mtime:new Date(w.mtime),size:w.size})}catch{}h.sort((g,w)=>w.modified.getTime()-g.modified.getTime()),l.webview.html=o(h.slice(0,50)),t.info("Workspace activity panel opened")}catch(l){t.error("Failed to show workspace activity",l),f.window.showErrorMessage(`Failed to show workspace activity: ${l.message}`)}})),c.push(f.commands.registerCommand("explorerDates.showPerformanceAnalytics",async()=>{try{let l=f.window.createWebviewPanel("performanceAnalytics","Explorer Dates Performance Analytics",f.ViewColumn.One,{enableScripts:!0}),u=e?e.getMetrics():{};l.webview.html=s(u),t.info("Performance analytics panel opened")}catch(l){t.error("Failed to show performance analytics",l),f.window.showErrorMessage(`Failed to show performance analytics: ${l.message}`)}})),c.push(f.commands.registerCommand("explorerDates.debugCache",async()=>{try{if(e){let l=e.getMetrics(),u={"Cache Summary":{"Memory Cache Size":l.cacheSize,"Cache Hit Rate":l.cacheHitRate,"Total Hits":l.cacheHits,"Total Misses":l.cacheMisses,"Cache Timeout":`${l.cacheDebugging.cacheTimeout}ms`},"Advanced Cache":l.advancedCache||"Not available","Cache Namespace":l.cacheDebugging.cacheNamespace||"default","Sample Cache Keys":l.cacheDebugging.memoryCacheKeys||[]};f.window.showInformationMessage(`Cache Debug Info:
${JSON.stringify(u,null,2)}`,{modal:!0}),t.info("Cache debug info displayed",u)}}catch(l){t.error("Failed to show cache debug info",l),f.window.showErrorMessage(`Failed to show cache debug info: ${l.message}`)}})),c.push(f.commands.registerCommand("explorerDates.runDiagnostics",async()=>{try{let l=f.workspace.getConfiguration("explorerDates"),u=f.window.activeTextEditor,h={"Extension Status":{"Provider Active":e?"Yes":"No","Decorations Enabled":l.get("showDateDecorations",!0)?"Yes":"No","VS Code Version":f.version,"Extension Version":a.extension.packageJSON.version}};if(u){let{uri:g}=u.document;g.scheme==="file"&&(h["Current File"]={"File Path":g.fsPath,"File Extension":to(g.fsPath||g.path).split(".").pop()||"No extension","Is Excluded":e?await e._isExcludedSimple(g):"Unknown"})}if(h.Configuration={"Excluded Folders":l.get("excludedFolders",[]),"Excluded Patterns":l.get("excludedPatterns",[]),"Color Scheme":l.get("colorScheme","none"),"Cache Timeout":`${l.get("cacheTimeout",3e4)}ms`},e){let g=e.getMetrics();h.Performance={"Total Decorations":g.totalDecorations,"Cache Size":g.cacheSize,"Cache Hit Rate":g.cacheHitRate,Errors:g.errors},g.performanceTiming&&(h["Performance Timing"]={"Avg Git Blame (ms)":g.performanceTiming.avgGitBlameMs,"Avg File Stat (ms)":g.performanceTiming.avgFileStatMs,"Git Calls":g.performanceTiming.gitBlameCalls,"File Stat Calls":g.performanceTiming.fileStatCalls,"Total Git Time (ms)":g.performanceTiming.totalGitBlameTimeMs,"Total File Stat Time (ms)":g.performanceTiming.totalFileStatTimeMs})}let v=f.window.createWebviewPanel("explorerDatesDiagnostics","Explorer Dates Diagnostics",f.ViewColumn.One,{enableScripts:!0});v.webview.html=r(h),t.info("Diagnostics panel opened",h)}catch(l){t.error("Failed to run diagnostics",l),f.window.showErrorMessage(`Failed to run diagnostics: ${l.message}`)}})),c.push(f.commands.registerCommand("explorerDates.testDecorations",async()=>{try{t.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let{DecorationDiagnostics:l}=Bt(),h=await new l(e).runComprehensiveDiagnostics(),v=f.window.createWebviewPanel("decorationDiagnostics","Decoration Diagnostics - Root Cause Analysis",f.ViewColumn.One,{enableScripts:!0});v.webview.html=n(h);let g=[],w=[];Object.values(h.tests).forEach(U=>{U.issues&&U.issues.forEach(N=>{N.startsWith("CRITICAL:")?g.push(N):N.startsWith("WARNING:")&&w.push(N)})}),g.length>0?f.window.showErrorMessage(`CRITICAL ISSUES FOUND: ${g.join(", ")}`):w.length>0?f.window.showWarningMessage(`Warnings found: ${w.length} potential issues detected. Check diagnostics panel.`):f.window.showInformationMessage("No critical issues found. Decorations should be working properly."),t.info("\u{1F50D} Comprehensive diagnostics completed",h)}catch(l){t.error("Failed to run comprehensive diagnostics",l),f.window.showErrorMessage(`Diagnostics failed: ${l.message}`)}})),c.push(f.commands.registerCommand("explorerDates.monitorDecorations",async()=>{if(!e){f.window.showErrorMessage("Decoration provider not available");return}e.startProviderCallMonitoring(),e.forceRefreshAllDecorations(),setTimeout(()=>{let l=e.getProviderCallStats(),u=`VS Code Decoration Requests: ${l.totalCalls} calls for ${l.uniqueFiles} files`;f.window.showInformationMessage(u),t.info("\u{1F50D} Decoration monitoring results:",l)},5e3),f.window.showInformationMessage("Started monitoring VS Code decoration requests. Results in 5 seconds...")})),c.push(f.commands.registerCommand("explorerDates.testVSCodeRendering",async()=>{try{let{testVSCodeDecorationRendering:l,testFileDecorationAPI:u}=jt();t.info("\u{1F3A8} Testing VS Code decoration rendering system...");let h=await u();t.info("\u{1F527} FileDecoration API tests:",h);let v=await l();t.info("\u{1F3A8} Decoration rendering test:",v),f.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.')}catch(l){t.error("Failed to test VS Code rendering:",l),f.window.showErrorMessage(`VS Code rendering test failed: ${l.message}`)}})),c.push(f.commands.registerCommand("explorerDates.quickFix",async()=>{try{let l=f.workspace.getConfiguration("explorerDates"),u=[];l.get("showDateDecorations",!0)||u.push({issue:"Date decorations are disabled",description:"Enable date decorations",fix:d(async()=>l.update("showDateDecorations",!0,f.ConfigurationTarget.Global),"fix")});let h=l.get("excludedPatterns",[]);if(h.includes("**/*")&&u.push({issue:"All files are excluded by pattern",description:"Remove overly broad exclusion pattern",fix:d(async()=>{let g=h.filter(w=>w!=="**/*");await l.update("excludedPatterns",g,f.ConfigurationTarget.Global)},"fix")}),u.length===0){f.window.showInformationMessage("No common issues detected. Decorations should be working.");return}let v=await f.window.showQuickPick(u.map(g=>({label:g.description,description:g.issue,fix:g.fix})),{placeHolder:"Select an issue to fix automatically"});v&&(await v.fix(),f.window.showInformationMessage("Fixed! Try refreshing decorations now."),e&&(e.clearAllCaches(),e.refreshAll()))}catch(l){t.error("Failed to run quick fix",l),f.window.showErrorMessage(`Failed to run quick fix: ${l.message}`)}})),c.push(f.commands.registerCommand("explorerDates.showKeyboardShortcuts",async()=>{try{e!=null&&e._accessibility?await e._accessibility.showKeyboardShortcutsHelp():f.window.showInformationMessage("Keyboard shortcuts: Ctrl+Shift+D (toggle), Ctrl+Shift+C (copy date), Ctrl+Shift+I (file details), Ctrl+Shift+R (refresh), Ctrl+Shift+A (workspace activity)"),t.info("Keyboard shortcuts help shown")}catch(l){t.error("Failed to show keyboard shortcuts help",l),f.window.showErrorMessage(`Failed to show keyboard shortcuts help: ${l.message}`)}})),c.forEach(l=>a.subscriptions.push(l))}d(oo,"registerAnalysisCommands");Gt.exports={registerAnalysisCommands:oo}});var Vt=S((cs,qt)=>{var ee=require("vscode");function so({context:a,logger:e,getOnboardingManager:t}){let i=[];i.push(ee.commands.registerCommand("explorerDates.showFeatureTour",async()=>{try{await t().showFeatureTour(),e.info("Feature tour opened")}catch(o){e.error("Failed to show feature tour",o),ee.window.showErrorMessage(`Failed to show feature tour: ${o.message}`)}})),i.push(ee.commands.registerCommand("explorerDates.showQuickSetup",async()=>{try{await t().showQuickSetupWizard(),e.info("Quick setup wizard opened")}catch(o){e.error("Failed to show quick setup wizard",o),ee.window.showErrorMessage(`Failed to show quick setup wizard: ${o.message}`)}})),i.push(ee.commands.registerCommand("explorerDates.showWhatsNew",async()=>{try{let o=a.extension.packageJSON.version;await t().showWhatsNew(o),e.info("What's new panel opened")}catch(o){e.error("Failed to show what's new",o),ee.window.showErrorMessage(`Failed to show what's new: ${o.message}`)}})),i.forEach(o=>a.subscriptions.push(o))}d(so,"registerOnboardingCommands");qt.exports={registerOnboardingCommands:so}});var Jt=S((ds,Kt)=>{var y=require("vscode"),{getLogger:ro}=M(),{getLocalization:ao}=ne(),Qe=class Qe{constructor(e){this._context=e,this._logger=ro(),this._l10n=ao(),this._hasShownWelcome=e.globalState.get("explorerDates.hasShownWelcome",!1),this._hasCompletedSetup=e.globalState.get("explorerDates.hasCompletedSetup",!1),this._onboardingVersion=e.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this._hasShownWelcome,hasCompletedSetup:this._hasCompletedSetup,onboardingVersion:this._onboardingVersion})}async shouldShowOnboarding(){let e=this._context.extension.packageJSON.version;return!this._hasShownWelcome||!this._hasCompletedSetup||this._shouldShowVersionUpdate(e)}_shouldShowVersionUpdate(e){if(this._onboardingVersion==="0.0.0")return!0;let[t]=e.split(".").map(Number),[i]=this._onboardingVersion.split(".").map(Number);return t>i}_isMinorUpdate(e){if(this._onboardingVersion==="0.0.0")return!1;let[t,i]=e.split(".").map(Number),[o,s]=this._onboardingVersion.split(".").map(Number);return t===o&&i>s}async showWelcomeMessage(){try{let e=this._context.extension.packageJSON.version,t=this._hasShownWelcome,i=this._isMinorUpdate(e);if(i)return this._showGentleUpdateNotification(e);let o=t?`Explorer Dates has been updated to v${e} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!",s=t?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"],r=await y.window.showInformationMessage(o,{modal:!1},...s);switch(await this._context.globalState.update("explorerDates.hasShownWelcome",!0),await this._context.globalState.update("explorerDates.onboardingVersion",e),r){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(e);break;case"\u2699\uFE0F Settings":await y.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await y.commands.executeCommand("explorerDates.previewConfiguration",o.settings);break;case"clearPreview":await y.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action:r,isUpdate:t,isMinorUpdate:i})}catch(e){this._logger.error("Failed to show welcome message",e)}}async _showGentleUpdateNotification(e){let t=y.window.createStatusBarItem(y.StatusBarAlignment.Right,100);t.text=`$(check) Explorer Dates updated to v${e}`,t.tooltip="Click to see what's new in Explorer Dates",t.command="explorerDates.showWhatsNew",t.show(),setTimeout(()=>{t.dispose()},1e4),await this._context.globalState.update("explorerDates.onboardingVersion",e),this._logger.info("Showed gentle update notification",{version:e})}async showQuickSetupWizard(){try{let e=y.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateSetupWizardHTML(),e.webview.onDidReceiveMessage(async t=>{await this._handleSetupWizardMessage(t,e)}),this._logger.info("Quick setup wizard opened")}catch(e){this._logger.error("Failed to show setup wizard",e)}}async _handleSetupWizardMessage(e,t){try{switch(e.command){case"applyConfiguration":await this._applyQuickConfiguration(e.configuration),await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),y.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&(await y.commands.executeCommand("explorerDates.previewConfiguration",e.settings),this._logger.info("Configuration preview applied via webview",e.settings));break;case"clearPreview":await y.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await y.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(i){this._logger.error("Failed to handle setup wizard message",i)}}async _applyQuickConfiguration(e){let t=y.workspace.getConfiguration("explorerDates");if(e.preset){let o=this._getConfigurationPresets()[e.preset];if(o){this._logger.info(`Applying preset: ${e.preset}`,o.settings);for(let[s,r]of Object.entries(o.settings))await t.update(s,r,y.ConfigurationTarget.Global),this._logger.debug(`Updated setting: explorerDates.${s} = ${r}`);this._logger.info(`Applied preset: ${e.preset}`,o.settings),y.window.showInformationMessage(`Applied "${o.name}" configuration. Changes should be visible immediately!`)}}if(e.individual){for(let[i,o]of Object.entries(e.individual))await t.update(i,o,y.ConfigurationTarget.Global);this._logger.info("Applied individual settings",e.individual)}try{await y.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(i){this._logger.warn("Failed to refresh decorations after configuration change",i)}}_getConfigurationPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:30,enableContextMenu:!0,showStatusBar:!0}},powerUser:{name:"Power User",description:"Maximum information - all features enabled with vibrant colors",settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"both",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:14,enableContextMenu:!0,showStatusBar:!0,smartExclusions:!0,progressiveLoading:!0,persistentCache:!0}},gitFocused:{name:"Git-Focused",description:"Show author initials as badges with full Git information in tooltips",settings:{dateDecorationFormat:"smart",colorScheme:"file-type",highContrastMode:!1,showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}async showFeatureTour(){try{let e=y.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateFeatureTourHTML(),e.webview.onDidReceiveMessage(async t=>{t.command==="openSettings"?await y.commands.executeCommand("workbench.action.openSettings",t.setting||"explorerDates"):t.command==="runCommand"&&await y.commands.executeCommand(t.commandId)}),this._logger.info("Feature tour opened")}catch(e){this._logger.error("Failed to show feature tour",e)}}_generateSetupWizardHTML(){let e=this._getConfigurationPresets(),t={minimal:e.minimal,developer:e.developer,accessible:e.accessible};return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Quick Setup</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-foreground);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .step {
                        margin-bottom: 30px;
                        padding: 20px;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 8px;
                    }
                    .preset-option {
                        border: 2px solid var(--vscode-widget-border);
                        border-radius: 8px;
                        padding: 15px;
                        margin: 10px 0;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .preset-option:hover {
                        border-color: var(--vscode-focusBorder);
                        background: var(--vscode-list-hoverBackground);
                    }
                    .preset-option.selected {
                        border-color: var(--vscode-focusBorder);
                        background: var(--vscode-list-activeSelectionBackground);
                    }
                    .preset-actions {
                        margin-top: 10px;
                        display: flex;
                        gap: 8px;
                    }
                    .preset-actions button {
                        padding: 6px 12px;
                        border: 1px solid var(--vscode-button-border);
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .preset-actions button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .preset-settings {
                        margin-top: 10px;
                    }
                    .setting-tag {
                        display: inline-block;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 11px;
                        margin: 2px;
                    }
                    .buttons {
                        text-align: center;
                        margin-top: 30px;
                    }
                    .btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0 10px;
                        font-size: 14px;
                    }
                    .btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .btn.secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .btn.secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }
                    .more-options {
                        margin-top: 20px;
                        padding: 15px;
                        background: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textLink-foreground);
                        border-radius: 4px;
                        font-size: 14px;
                    }
                    .more-options a {
                        color: var(--vscode-textLink-foreground);
                        text-decoration: none;
                        font-weight: bold;
                    }
                    .more-options a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>\u{1F680} Welcome to Explorer Dates!</h1>
                    <p>Let's get you set up with the perfect configuration for your workflow.</p>
                </div>

                <div class="step">
                    <h2>\u{1F4CB} Choose Your Configuration</h2>
                    <p>Select a preset that matches your needs, or skip to configure manually:</p>
                    
                    ${Object.entries(t).map(([s,r])=>`
            <div class="preset-option" data-preset="${s}" 
                 onmouseenter="previewConfiguration({preset: '${s}'})" 
                 onmouseleave="clearPreview()">
                <h3>${r.name}</h3>
                <p>${r.description}</p>
                <div class="preset-actions">
                    <button onclick="previewConfiguration({preset: '${s}'})">\u{1F441}\uFE0F Preview</button>
                    <button onclick="applyConfiguration({preset: '${s}'})">\u2705 Select ${r.name}</button>
                </div>
            </div>
        `).join("")}
                    
                    
            <div class="more-options">
                <p><strong>Need more options?</strong> Try the <a href="#" onclick="showAllPresets()">Power User</a> or <a href="#" onclick="showGitFocused()">Git-Focused</a> presets, or configure manually in Settings.</p>
            </div>
        
                </div>

                <div class="buttons">
                    <button class="btn" onclick="applyConfiguration()">Apply Configuration</button>
                    <button class="btn secondary" onclick="openSettings()">Manual Setup</button>
                    <button class="btn secondary" onclick="skipSetup()">Skip for Now</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let selectedPreset = null;

                    // Handle preset selection
                    document.querySelectorAll('.preset-option').forEach(option => {
                        option.addEventListener('click', () => {
                            document.querySelectorAll('.preset-option').forEach(o => o.classList.remove('selected'));
                            option.classList.add('selected');
                            selectedPreset = option.dataset.preset;
                        });
                    });

                    function applyConfiguration(config) {
                        if (config) {
                            vscode.postMessage({
                                command: 'applyConfiguration',
                                configuration: config
                            });
                        } else if (selectedPreset) {
                            vscode.postMessage({
                                command: 'applyConfiguration',
                                configuration: { preset: selectedPreset }
                            });
                        } else {
                            alert('Please select a configuration preset first.');
                        }
                    }

                    function previewConfiguration(config) {
                        const presets = ${JSON.stringify(t)};
                        if (config.preset && presets[config.preset]) {
                            vscode.postMessage({
                                command: 'previewConfiguration',
                                settings: presets[config.preset].settings
                            });
                        }
                    }

                    function clearPreview() {
                        vscode.postMessage({
                            command: 'clearPreview'
                        });
                    }

                    function openSettings() {
                        vscode.postMessage({ command: 'openSettings' });
                    }

                    function skipSetup() {
                        vscode.postMessage({ command: 'skipSetup' });
                    }
                    
                    function showAllPresets() {
                        applyConfiguration({preset: 'powerUser'});
                    }
                    
                    function showGitFocused() {
                        applyConfiguration({preset: 'gitFocused'});
                    }
                </script>
            </body>
            </html>
        `}_generateFeatureTourHTML(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Feature Tour</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 20px;
                        max-width: 900px;
                        margin: 0 auto;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-foreground);
                    }
                    .feature-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .feature-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 8px;
                        padding: 20px;
                        transition: transform 0.2s;
                    }
                    .feature-card:hover {
                        transform: translateY(-2px);
                        border-color: var(--vscode-focusBorder);
                    }
                    .feature-icon {
                        font-size: 32px;
                        margin-bottom: 10px;
                    }
                    .feature-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: var(--vscode-textLink-foreground);
                    }
                    .feature-description {
                        margin-bottom: 15px;
                        line-height: 1.5;
                    }
                    .feature-actions {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        text-decoration: none;
                    }
                    .btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .btn.secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                </style>
            </head>
            <body>
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1>\u{1F3AF} Explorer Dates Features</h1>
                    <p>Discover all the powerful features available to enhance your file management experience.</p>
                </div>

                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">\u{1F550}</div>
                        <div class="feature-title">Smart Time Display</div>
                        <div class="feature-description">
                            See modification times with intelligent formatting - relative for recent files, absolute for older ones.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('dateDecorationFormat')">Configure</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">\u{1F3A8}</div>
                        <div class="feature-title">Color Schemes</div>
                        <div class="feature-description">
                            Color-code files by age, file type, or create custom color schemes for better visual organization.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('colorScheme')">Set Colors</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">\u{1F4CA}</div>
                        <div class="feature-title">File Sizes</div>
                        <div class="feature-description">
                            Display file sizes alongside modification times with smart formatting and visual distinction.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('showFileSize')">Enable</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">\u{1F517}</div>
                        <div class="feature-title">Git Integration</div>
                        <div class="feature-description">
                            Show Git author initials and access file history directly from the Explorer context menu.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('showGitInfo')">Configure Git</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">\u{1F4F1}</div>
                        <div class="feature-title">Status Bar</div>
                        <div class="feature-description">
                            Optional status bar showing current file info with click-to-expand detailed information.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('showStatusBar')">Enable</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">\u{1F680}</div>
                        <div class="feature-title">Performance</div>
                        <div class="feature-description">
                            Smart exclusions, batch processing, and advanced caching for optimal performance in large projects.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="runCommand('explorerDates.showPerformanceAnalytics')">View Analytics</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">\u{1F4CA}</div>
                        <div class="feature-title">Workspace Analytics</div>
                        <div class="feature-description">
                            Analyze file activity patterns across your workspace with detailed modification statistics.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="runCommand('explorerDates.showWorkspaceActivity')">View Activity</button>
                        </div>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">\u{1F39B}\uFE0F</div>
                        <div class="feature-title">Context Menus</div>
                        <div class="feature-description">
                            Right-click files for quick access to date copying, Git history, and file comparisons.
                        </div>
                        <div class="feature-actions">
                            <button class="btn" onclick="openSetting('enableContextMenu')">Enable</button>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn" onclick="openSetting('')">Open All Settings</button>
                    <button class="btn secondary" onclick="runCommand('explorerDates.showMetrics')">View Metrics</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function openSetting(setting) {
                        vscode.postMessage({
                            command: 'openSettings',
                            setting: setting ? 'explorerDates.' + setting : 'explorerDates'
                        });
                    }

                    function runCommand(commandId) {
                        vscode.postMessage({
                            command: 'runCommand',
                            commandId: commandId
                        });
                    }
                </script>
            </body>
            </html>
        `}async showTipsAndTricks(){let e=[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."},{icon:"\u{1F4CA}",title:"Performance Analytics",description:'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'},{icon:"\u{1F50D}",title:"Context Menu",description:"Right-click any file to access Git history, file details, and quick actions."}],t=e[Math.floor(Math.random()*e.length)],i=`\u{1F4A1} **Tip**: ${t.title}
${t.description}`;await y.window.showInformationMessage(i,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(e){try{let t=y.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${e} - What's New`,y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1});t.webview.html=this._generateWhatsNewHTML(e),t.webview.onDidReceiveMessage(async i=>{switch(i.command){case"openSettings":await y.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break;case"tryFeature":i.feature==="badgePriority"&&(await y.workspace.getConfiguration("explorerDates").update("badgePriority","author",y.ConfigurationTarget.Global),y.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":t.dispose();break}})}catch(t){this._logger.error("Failed to show what's new",t)}}_generateWhatsNewHTML(e){return`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Explorer Dates - What's New</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                        line-height: 1.6;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid var(--vscode-textSeparator-foreground);
                    }
                    
                    .version {
                        font-size: 24px;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 10px;
                    }
                    
                    .subtitle {
                        color: var(--vscode-descriptionForeground);
                        font-size: 16px;
                    }
                    
                    .feature {
                        margin-bottom: 25px;
                        padding: 15px;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 8px;
                        border-left: 4px solid var(--vscode-textLink-foreground);
                    }
                    
                    .feature-icon {
                        font-size: 20px;
                        margin-right: 10px;
                    }
                    
                    .feature-title {
                        font-weight: bold;
                        font-size: 18px;
                        margin-bottom: 8px;
                    }
                    
                    .feature-description {
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 10px;
                    }
                    
                    .try-button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    
                    .try-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    
                    .actions {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid var(--vscode-textSeparator-foreground);
                    }
                    
                    .action-button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 12px 24px;
                        margin: 0 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="version">Explorer Dates v${e}</div>
                    <div class="subtitle">New features and improvements</div>
                </div>

                <div class="feature">
                    <div class="feature-title">
                        <span class="feature-icon">\u{1F3F7}\uFE0F</span>
                        Badge Priority Settings
                    </div>
                    <div class="feature-description">
                        Choose what appears in your file badges: modification time, author initials, or file size. Perfect for teams who want to see who last worked on files at a glance.
                    </div>
                    <button class="try-button" onclick="tryFeature('badgePriority')">Try Author Badges</button>
                </div>

                <div class="feature">
                    <div class="feature-title">
                        <span class="feature-icon">\u{1F3AD}</span>
                        Live Preview in Setup
                    </div>
                    <div class="feature-description">
                        The Quick Setup wizard now shows live previews of your configuration choices, so you can see exactly how your files will look before applying settings.
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-title">
                        <span class="feature-icon">\u267F</span>
                        Enhanced Accessibility
                    </div>
                    <div class="feature-description">
                        Improved screen reader support, high contrast mode, and detailed tooltips make the extension more accessible to all users.
                    </div>
                </div>

                <div class="feature">
                    <div class="feature-title">
                        <span class="feature-icon">\u{1F4DD}</span>
                        Rich Tooltips
                    </div>
                    <div class="feature-description">
                        File tooltips now include comprehensive information with emojis: file details, Git history, line counts for code files, and more.
                    </div>
                </div>

                <div class="actions">
                    <button class="action-button" onclick="openSettings()">\u2699\uFE0F Open Settings</button>
                    <button class="action-button" onclick="dismiss()">\u2705 Got it!</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function tryFeature(feature) {
                        vscode.postMessage({
                            command: 'tryFeature',
                            feature: feature
                        });
                    }

                    function openSettings() {
                        vscode.postMessage({
                            command: 'openSettings'
                        });
                    }

                    function dismiss() {
                        vscode.postMessage({
                            command: 'dismiss'
                        });
                    }
                </script>
            </body>
            </html>
        `}};d(Qe,"OnboardingManager");var Ye=Qe;Kt.exports={OnboardingManager:Ye}});var Qt=S((us,Yt)=>{var C=require("vscode"),{getLogger:no}=M(),{fileSystem:co}=G(),{GLOBAL_STATE_KEYS:lo}=ce(),E=no(),Ze=class Ze{constructor(e){this._context=e,this._storage=(e==null?void 0:e.globalState)||null,this._storageKey=lo.TEMPLATE_STORE,this._fs=co,this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),E.info("Workspace Templates Manager initialized")}_getStoredTemplates(){return this._storage?this._storage.get(this._storageKey,{}):{}}async _saveStoredTemplates(e){if(!this._storage)throw new Error("Template storage unavailable");await this._storage.update(this._storageKey,e)}_getTemplate(e){return this.builtInTemplates[e]?this.builtInTemplates[e]:this._getStoredTemplates()[e]}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"file-type","explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludedPatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"],"explorerDates.enableContextMenu":!0,"explorerDates.showGitInfo":"author"}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"absolute-long","explorerDates.colorScheme":"none","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"none","explorerDates.highContrastMode":!1,"explorerDates.excludedPatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"],"explorerDates.badgePriority":"size"}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"subtle","explorerDates.showFileSize":!1,"explorerDates.excludedPatterns":["**/node_modules/**","**/.git/**"],"explorerDates.fadeOldFiles":!1,"explorerDates.enableContextMenu":!1}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"recency","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"author","explorerDates.enableContextMenu":!0,"explorerDates.showStatusBar":!0,"explorerDates.smartExclusions":!0,"explorerDates.progressiveLoading":!0,"explorerDates.persistentCache":!0,"explorerDates.enableReporting":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"none","explorerDates.showFileSize":!1,"explorerDates.badgePriority":"time","explorerDates.enableContextMenu":!1,"explorerDates.progressiveLoading":!1}}}}async saveCurrentConfiguration(e,t=""){try{let i=C.workspace.getConfiguration("explorerDates"),o={},s=i.inspect();if(s)for(let[u,h]of Object.entries(s))h&&typeof h=="object"&&"workspaceValue"in h?o[`explorerDates.${u}`]=h.workspaceValue:h&&typeof h=="object"&&"globalValue"in h&&(o[`explorerDates.${u}`]=h.globalValue);let r={name:e,description:t,createdAt:new Date().toISOString(),version:"1.0.0",settings:o},n=e.toLowerCase().replace(/[^a-z0-9-]/g,"-"),c=this._getStoredTemplates();c[n]=r,await this._saveStoredTemplates(c);let l=i.get("templateSyncPath","");if(l&&!this._fs.isWeb)try{let u=`${l.replace(/[/\\]?$/,"")}/${n}.json`;await this._fs.writeFile(u,JSON.stringify(r,null,2)),E.info(`Synced template to ${u}`)}catch(u){E.warn("Failed to sync template to disk path",u)}return C.window.showInformationMessage(`Template "${e}" saved successfully!`),E.info(`Saved workspace template: ${e}`),!0}catch(i){return E.error("Failed to save template:",i),C.window.showErrorMessage(`Failed to save template: ${i.message}`),!1}}async loadTemplate(e){try{let t=this._getTemplate(e);if(!t)throw new Error(`Template "${e}" not found`);let i=C.workspace.getConfiguration();for(let[o,s]of Object.entries(t.settings))await i.update(o,s,C.ConfigurationTarget.Workspace);return C.window.showInformationMessage(`Template "${t.name}" applied successfully!`),E.info(`Applied workspace template: ${t.name}`),!0}catch(t){return E.error("Failed to load template:",t),C.window.showErrorMessage(`Failed to load template: ${t.message}`),!1}}async getAvailableTemplates(){let e=[];for(let[t,i]of Object.entries(this.builtInTemplates))e.push({id:t,name:i.name,description:i.description,type:"built-in",createdAt:null});try{let t=this._getStoredTemplates();for(let[i,o]of Object.entries(t))e.push({id:i,name:o.name,description:o.description,type:"custom",createdAt:o.createdAt})}catch(t){E.error("Failed to load custom templates:",t)}return e}async deleteTemplate(e){try{if(this.builtInTemplates[e])return C.window.showErrorMessage("Cannot delete built-in templates"),!1;let t=this._getStoredTemplates();if(!t[e])throw new Error(`Template "${e}" not found`);return delete t[e],await this._saveStoredTemplates(t),C.window.showInformationMessage(`Template "${e}" deleted successfully!`),E.info(`Deleted workspace template: ${e}`),!0}catch(t){return E.error("Failed to delete template:",t),C.window.showErrorMessage(`Failed to delete template: ${t.message}`),!1}}async exportTemplate(e,t){try{let i=this._getTemplate(e);if(!i)throw new Error(`Template "${e}" not found`);let o=JSON.stringify(i,null,2);if(this._fs.isWeb){let r=encodeURIComponent(o);return await C.env.openExternal(C.Uri.parse(`data:application/json;charset=utf-8,${r}`)),C.window.showInformationMessage("Template download triggered in browser"),!0}let s=t instanceof C.Uri?t.fsPath:t;return await this._fs.writeFile(s,o),C.window.showInformationMessage(`Template exported to ${s}`),E.info(`Exported template ${e} to ${s}`),!0}catch(i){return E.error("Failed to export template:",i),C.window.showErrorMessage(`Failed to export template: ${i.message}`),!1}}async importTemplate(e){try{let t=e instanceof C.Uri?e:C.Uri.file(e),i=await this._fs.readFile(t,"utf8"),o=JSON.parse(i);if(!o.name||!o.settings)throw new Error("Invalid template format");let s=o.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),r=this._getStoredTemplates();return r[s]=o,await this._saveStoredTemplates(r),C.window.showInformationMessage(`Template "${o.name}" imported successfully!`),E.info(`Imported template: ${o.name}`),!0}catch(t){return E.error("Failed to import template:",t),C.window.showErrorMessage(`Failed to import template: ${t.message}`),!1}}async showTemplateManager(){try{let e=await this.getAvailableTemplates(),t=C.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",C.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});t.webview.html=this.getTemplateManagerHtml(e),t.webview.onDidReceiveMessage(async i=>{switch(i.command){case"loadTemplate":await this.loadTemplate(i.templateId);break;case"deleteTemplate":{await this.deleteTemplate(i.templateId);let o=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:o});break}case"exportTemplate":{let o=await C.window.showSaveDialog({defaultUri:C.Uri.file(`${i.templateId}.json`),filters:{JSON:["json"]}});o&&await this.exportTemplate(i.templateId,o);break}case"saveConfig":{await this.saveCurrentConfiguration(i.name,i.description);let o=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:o});break}case"importTemplate":{let o=await C.window.showOpenDialog({canSelectMany:!1,filters:{JSON:["json"]}});if(o&&o[0]){await this.importTemplate(o[0]);let s=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:s})}break}}}),E.info("Template Manager opened")}catch(e){E.error("Failed to show template manager:",e),C.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(e){return`<!DOCTYPE html>
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
                ${e.map(i=>`
            <div class="template-item ${i.type}">
                <div class="template-header">
                    <h3>${i.name}</h3>
                    <span class="template-type">${i.type}</span>
                </div>
                <p class="template-description">${i.description}</p>
                ${i.createdAt?`<small>Created: ${new Date(i.createdAt).toLocaleDateString()}</small>`:""}
                <div class="template-actions">
                    <button onclick="loadTemplate('${i.id}')">Apply</button>
                    <button onclick="exportTemplate('${i.id}')">Export</button>
                    ${i.type==="custom"?`<button onclick="deleteTemplate('${i.id}')" class="delete">Delete</button>`:""}
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
        </html>`}};d(Ze,"WorkspaceTemplatesManager");var Xe=Ze;Yt.exports={WorkspaceTemplatesManager:Xe}});var Zt=S((ps,Xt)=>{var R=require("vscode"),{getLogger:ho}=M(),it=class it{constructor(){this._listeners=new Map}on(e,t){let i=this._listeners.get(e)||[];return i.push(t),this._listeners.set(e,i),this}off(e,t){let i=this._listeners.get(e);if(!i)return this;let o=i.indexOf(t);return o!==-1&&i.splice(o,1),this}emit(e,...t){let i=this._listeners.get(e);return i&&i.slice().forEach(o=>{try{o(...t)}catch{}}),this}};d(it,"BaseEventEmitter");var et=it,F=ho(),ot=class ot extends et{constructor(){super(),this.plugins=new Map,this.api=null,this.decorationProviders=new Map,this._configurationWatcher=null,this.initialize(),this._setupConfigurationListener()}initialize(){this.api=this.createPublicApi(),F.info("Extension API Manager initialized")}createPublicApi(){return{getFileDecorations:this.getFileDecorations.bind(this),refreshDecorations:this.refreshDecorations.bind(this),registerPlugin:this.registerPlugin.bind(this),unregisterPlugin:this.unregisterPlugin.bind(this),registerDecorationProvider:this.registerDecorationProvider.bind(this),unregisterDecorationProvider:this.unregisterDecorationProvider.bind(this),onDecorationChanged:this.onDecorationChanged.bind(this),onFileScanned:this.onFileScanned.bind(this),formatDate:this.formatDate.bind(this),getFileStats:this.getFileStats.bind(this),version:"1.1.0",apiVersion:"1.0.0"}}async getFileDecorations(e){if(!this._isApiUsable("getFileDecorations"))return[];try{let t=[];for(let i of e){let o=R.Uri.file(i),s=await this.getDecorationForFile(o);s&&t.push({uri:o.toString(),decoration:s})}return t}catch(t){return F.error("Failed to get file decorations:",t),[]}}async getDecorationForFile(e){if(!this._isApiUsable("getDecorationForFile"))return null;try{let t=await R.workspace.fs.stat(e),i=new Date(t.mtime),o={badge:this.formatDate(i,"smart"),color:void 0,tooltip:`Modified: ${i.toLocaleString()}`};for(let[s,r]of this.decorationProviders)try{let n=await r.provideDecoration(e,t,o);n&&(o={...o,...n})}catch(n){F.error(`Decoration provider ${s} failed:`,n)}return o}catch(t){return F.error("Failed to get decoration for file:",t),null}}async refreshDecorations(e=null){if(!this._isApiUsable("refreshDecorations"))return!1;try{return this.emit("decorationRefreshRequested",e),F.info("Decoration refresh requested"),!0}catch(t){return F.error("Failed to refresh decorations:",t),!1}}registerPlugin(e,t){if(!this._canUsePlugins(`registerPlugin:${e}`))return!1;try{if(!this.validatePlugin(t))throw new Error("Invalid plugin structure");return this.plugins.set(e,{...t,registeredAt:new Date,active:!0}),typeof t.activate=="function"&&t.activate(this.api),this.emit("pluginRegistered",{pluginId:e,plugin:t}),F.info(`Plugin registered: ${e}`),!0}catch(i){return F.error(`Failed to register plugin ${e}:`,i),!1}}unregisterPlugin(e){if(!this._canUsePlugins(`unregisterPlugin:${e}`))return!1;try{let t=this.plugins.get(e);return t?(typeof t.deactivate=="function"&&t.deactivate(),this.plugins.delete(e),this.emit("pluginUnregistered",{pluginId:e}),F.info(`Plugin unregistered: ${e}`),!0):!1}catch(t){return F.error(`Failed to unregister plugin ${e}:`,t),!1}}registerDecorationProvider(e,t){if(!this._canUsePlugins(`registerDecorationProvider:${e}`))return!1;try{if(!this.validateDecorationProvider(t))throw new Error("Invalid decoration provider");return this.decorationProviders.set(e,t),this.emit("decorationProviderRegistered",{providerId:e,provider:t}),F.info(`Decoration provider registered: ${e}`),!0}catch(i){return F.error(`Failed to register decoration provider ${e}:`,i),!1}}unregisterDecorationProvider(e){if(!this._canUsePlugins(`unregisterDecorationProvider:${e}`))return!1;try{let t=this.decorationProviders.delete(e);return t&&(this.emit("decorationProviderUnregistered",{providerId:e}),F.info(`Decoration provider unregistered: ${e}`)),t}catch(t){return F.error(`Failed to unregister decoration provider ${e}:`,t),!1}}onDecorationChanged(e){return this.on("decorationChanged",e),()=>this.off("decorationChanged",e)}onFileScanned(e){return this.on("fileScanned",e),()=>this.off("fileScanned",e)}formatDate(e,t=null){if(!this._isApiUsable("formatDate"))return"";try{let i=R.workspace.getConfiguration("explorerDates"),o=t||i.get("displayFormat","smart"),r=new Date-e,n=Math.floor(r/(1e3*60*60*24));switch(o){case"relative-short":return this.getRelativeTimeShort(r);case"relative-long":return this.getRelativeTimeLong(r);case"absolute-short":return e.toLocaleDateString("en-US",{month:"short",day:"numeric"});case"absolute-long":return e.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});case"smart":default:return n<7?this.getRelativeTimeShort(r):e.toLocaleDateString("en-US",{month:"short",day:"numeric"})}}catch(i){return F.error("Failed to format date:",i),e.toLocaleDateString()}}async getFileStats(e){if(!this._isApiUsable("getFileStats"))return null;try{let t=R.Uri.file(e),i=await R.workspace.fs.stat(t);return{path:e,size:i.size,created:new Date(i.ctime),modified:new Date(i.mtime),type:i.type===R.FileType.Directory?"directory":"file"}}catch(t){return F.error("Failed to get file stats:",t),null}}getApi(){return this.api}getRegisteredPlugins(){let e=[];for(let[t,i]of this.plugins)e.push({id:t,name:i.name,version:i.version,author:i.author,active:i.active,registeredAt:i.registeredAt});return e}validatePlugin(e){return!(!e||typeof e!="object"||!e.name||!e.version||e.activate&&typeof e.activate!="function"||e.deactivate&&typeof e.deactivate!="function")}validateDecorationProvider(e){return!(!e||typeof e!="object"||typeof e.provideDecoration!="function")}getRelativeTimeShort(e){let t=Math.floor(e/1e3),i=Math.floor(t/60),o=Math.floor(i/60),s=Math.floor(o/24);if(t<60)return`${t}s`;if(i<60)return`${i}m`;if(o<24)return`${o}h`;if(s<30)return`${s}d`;let r=Math.floor(s/30);return r<12?`${r}mo`:`${Math.floor(r/12)}y`}getRelativeTimeLong(e){let t=Math.floor(e/1e3),i=Math.floor(t/60),o=Math.floor(i/60),s=Math.floor(o/24);if(t<60)return`${t} second${t!==1?"s":""} ago`;if(i<60)return`${i} minute${i!==1?"s":""} ago`;if(o<24)return`${o} hour${o!==1?"s":""} ago`;if(s<30)return`${s} day${s!==1?"s":""} ago`;let r=Math.floor(s/30);if(r<12)return`${r} month${r!==1?"s":""} ago`;let n=Math.floor(r/12);return`${n} year${n!==1?"s":""} ago`}getColorForAge(e){if(!R.workspace.getConfiguration("explorerDates").get("colorCoding",!1))return;let s=(new Date-e)/(1e3*60*60);return s<1?new R.ThemeColor("charts.green"):s<24?new R.ThemeColor("charts.yellow"):s<168?new R.ThemeColor("charts.orange"):new R.ThemeColor("charts.red")}createExamplePlugin(){return{name:"File Size Display",version:"1.0.0",author:"Explorer Dates",description:"Adds file size to decorations",activate:d(e=>{e.registerDecorationProvider("fileSize",{provideDecoration:d(async(t,i,o)=>{let s=this.formatFileSize(i.size);return{badge:`${o.badge} \u2022 ${s}`,tooltip:`${o.tooltip}
Size: ${s}`}},"provideDecoration")})},"activate"),deactivate:d(()=>{},"deactivate")}}_setupConfigurationListener(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=R.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableExtensionApi")||e.affectsConfiguration("explorerDates.allowExternalPlugins"))&&F.info("Explorer Dates API configuration changed",{apiEnabled:this._isApiEnabled(),externalPluginsAllowed:this._allowsExternalPlugins()})})}_isApiEnabled(){return R.workspace.getConfiguration("explorerDates").get("enableExtensionApi",!0)}_allowsExternalPlugins(){return R.workspace.getConfiguration("explorerDates").get("allowExternalPlugins",!0)}_isApiUsable(e){return this._isApiEnabled()?!0:(F.warn(`Explorer Dates API request "${e}" ignored because enableExtensionApi is disabled.`),!1)}_canUsePlugins(e){return this._isApiUsable(e)?this._allowsExternalPlugins()?!0:(F.warn(`Explorer Dates plugin request "${e}" ignored because allowExternalPlugins is disabled.`),!1):!1}formatFileSize(e){if(e===0)return"0 B";let t=1024,i=["B","KB","MB","GB"],o=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,o)).toFixed(1))+" "+i[o]}dispose(){this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this.plugins.clear(),this.decorationProviders.clear(),F.info("Extension API Manager disposed")}};d(ot,"ExtensionApiManager");var tt=ot;Xt.exports={ExtensionApiManager:tt}});var ti=S((fs,ei)=>{var x=require("vscode"),{getLogger:uo}=M(),{fileSystem:go}=G(),{getExtension:st,normalizePath:po}=B(),z=uo(),mo=!1,at=class at{constructor(){this.fileActivityCache=new Map,this.allowedFormats=["json","csv","html","markdown"],this.activityTrackingDays=30,this.activityCutoffMs=null,this.timeTrackingIntegration="none",this._configurationWatcher=null,this._fileWatcher=null,this._fileWatcherSubscriptions=[],this._loadConfiguration(),this._setupConfigurationWatcher(),this.initialize()}_loadConfiguration(){try{let e=x.workspace.getConfiguration("explorerDates"),t=e.get("reportFormats",["json","html"]),i=["json","csv","html","markdown"];this.allowedFormats=Array.from(new Set([...t,...i]));let o=e.get("activityTrackingDays",30);this.activityTrackingDays=Math.max(1,Math.min(365,o)),this.activityCutoffMs=this.activityTrackingDays*24*60*60*1e3,this.timeTrackingIntegration=e.get("timeTrackingIntegration","none")}catch(e){z.error("Failed to load reporting configuration",e)}}_setupConfigurationWatcher(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=x.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.reportFormats")||e.affectsConfiguration("explorerDates.activityTrackingDays")||e.affectsConfiguration("explorerDates.timeTrackingIntegration"))&&(this._loadConfiguration(),z.info("Reporting configuration updated",{allowedFormats:this.allowedFormats,activityTrackingDays:this.activityTrackingDays,timeTrackingIntegration:this.timeTrackingIntegration}))})}async initialize(){try{this.startFileWatcher(),z.info("Export & Reporting Manager initialized")}catch(e){z.error("Failed to initialize Export & Reporting Manager:",e)}}startFileWatcher(){if(this._fileWatcher)return;let e=x.workspace.createFileSystemWatcher("**/*");this._fileWatcher=e,this._fileWatcherSubscriptions=[e.onDidChange(t=>this.recordFileActivity(t,"modified")),e.onDidCreate(t=>this.recordFileActivity(t,"created")),e.onDidDelete(t=>this.recordFileActivity(t,"deleted"))]}recordFileActivity(e,t){try{let i=e.fsPath||e.path,o=new Date;this.fileActivityCache.has(i)||this.fileActivityCache.set(i,[]),this.fileActivityCache.get(i).push({action:t,timestamp:o,path:i}),this._enforceActivityRetention(i)}catch(i){z.error("Failed to record file activity:",i)}}_enforceActivityRetention(e){let t=this.fileActivityCache.get(e);if(!(!t||t.length===0)){if(this.activityCutoffMs){let i=new Date(Date.now()-this.activityCutoffMs);for(;t.length&&t[0].timestamp<i;)t.shift()}t.length>100&&t.splice(0,t.length-100)}}async generateFileModificationReport(e={}){try{let{format:t="json",timeRange:i="all",includeDeleted:o=!1,outputPath:s=null}=e;if(!this.allowedFormats.includes(t)){let c=`Report format "${t}" is disabled. Allowed formats: ${this.allowedFormats.join(", ")}`;return x.window.showWarningMessage(c),z.warn(c),null}let r=await this.collectFileData(i,o),n=await this.formatReport(r,t);return s&&(await this.saveReport(n,s),x.window.showInformationMessage(`Report saved to ${s}`)),n}catch(t){return z.error("Failed to generate file modification report:",t),x.window.showErrorMessage("Failed to generate report"),null}}async collectFileData(e,t){let i=[],o=x.workspace.workspaceFolders;if(!o)return{files:[],summary:this.createSummary([])};for(let r of o){let n=await this.scanWorkspaceFolder(r.uri,e,t);i.push(...n)}let s=this.createSummary(i);return s.integrationTarget=this.timeTrackingIntegration,s.activityTrackingDays=this.activityTrackingDays,{generatedAt:new Date().toISOString(),workspace:o.map(r=>r.uri.fsPath),timeRange:e,files:i,summary:s}}async scanWorkspaceFolder(e,t,i){let o=[],r=x.workspace.getConfiguration("explorerDates").get("excludedPatterns",[]);try{let n=await x.workspace.fs.readDirectory(e);for(let[c,l]of n){let u=x.Uri.joinPath(e,c),h=x.workspace.asRelativePath(u);if(!this.isExcluded(h,r)){if(l===x.FileType.File){let v=await this.getFileData(u,t);v&&o.push(v)}else if(l===x.FileType.Directory){let v=await this.scanWorkspaceFolder(u,t,i);o.push(...v)}}}if(i&&e.fsPath){let c=this.getDeletedFiles(e.fsPath,t);o.push(...c)}}catch(n){z.error(`Failed to scan folder ${e.fsPath||e.path}:`,n)}return o}async getFileData(e,t){try{let i=await x.workspace.fs.stat(e),o=x.workspace.asRelativePath(e),s=e.fsPath||e.path,r=this.fileActivityCache.get(s)||[],n=this.filterActivitiesByTimeRange(r,t);return{path:o,fullPath:s,size:i.size,created:new Date(i.ctime),modified:new Date(i.mtime),type:this.getFileType(o),extension:st(o),activities:n,activityCount:n.length,lastActivity:n.length>0?n[n.length-1].timestamp:new Date(i.mtime)}}catch(i){return z.error(`Failed to get file data for ${e.fsPath||e.path}:`,i),null}}filterActivitiesByTimeRange(e,t){let i=e;if(t!=="all"){let o=new Date,s;switch(t){case"24h":s=new Date(o-1440*60*1e3);break;case"7d":s=new Date(o-10080*60*1e3);break;case"30d":s=new Date(o-720*60*60*1e3);break;case"90d":s=new Date(o-2160*60*60*1e3);break;default:s=null}s&&(i=i.filter(r=>r.timestamp>=s))}if(this.activityCutoffMs){let o=new Date(Date.now()-this.activityCutoffMs);i=i.filter(s=>s.timestamp>=o)}return i}getDeletedFiles(e,t){if(!e)return[];let i=[];for(let[o,s]of this.fileActivityCache)if(o.startsWith(e)){let r=s.filter(c=>c.action==="deleted"),n=this.filterActivitiesByTimeRange(r,t);n.length>0&&i.push({path:x.workspace.asRelativePath(o),fullPath:o,size:0,created:null,modified:null,type:"deleted",extension:st(o),activities:n,activityCount:n.length,lastActivity:n[n.length-1].timestamp})}return i}createSummary(e){let t={totalFiles:e.length,totalSize:e.reduce((o,s)=>o+(s.size||0),0),fileTypes:{},activityByDay:{},mostActiveFiles:[],recentlyModified:[],largestFiles:[],oldestFiles:[]};e.forEach(o=>{let s=o.type||"unknown";t.fileTypes[s]=(t.fileTypes[s]||0)+1});let i=new Date(Date.now()-this.activityTrackingDays*24*60*60*1e3);return e.forEach(o=>{o.activities.forEach(s=>{if(s.timestamp>=i){let r=s.timestamp.toISOString().split("T")[0];t.activityByDay[r]=(t.activityByDay[r]||0)+1}})}),t.mostActiveFiles=e.sort((o,s)=>s.activityCount-o.activityCount).slice(0,10).map(o=>({path:o.path,activityCount:o.activityCount,lastActivity:o.lastActivity})),t.recentlyModified=e.filter(o=>o.modified).sort((o,s)=>s.modified-o.modified).slice(0,20).map(o=>({path:o.path,modified:o.modified,size:o.size})),t.largestFiles=e.sort((o,s)=>(s.size||0)-(o.size||0)).slice(0,10).map(o=>({path:o.path,size:o.size,modified:o.modified})),t.oldestFiles=e.filter(o=>o.modified).sort((o,s)=>o.modified-s.modified).slice(0,10).map(o=>({path:o.path,modified:o.modified,size:o.size})),t}async formatReport(e,t){switch(t.toLowerCase()){case"json":return JSON.stringify(e,null,2);case"csv":return this.formatAsCSV(e);case"html":return this.formatAsHTML(e);case"markdown":return this.formatAsMarkdown(e);default:throw new Error(`Unsupported format: ${t}`)}}formatAsCSV(e){let t=["Path,Size,Created,Modified,Type,Extension,ActivityCount,LastActivity"];return e.files.forEach(i=>{t.push([i.path,i.size||0,i.created?i.created.toISOString():"",i.modified?i.modified.toISOString():"",i.type,i.extension,i.activityCount,i.lastActivity?i.lastActivity.toISOString():""].join(","))}),t.join(`
`)}formatAsHTML(e){return`<!DOCTYPE html>
<html>
<head>
    <title>File Modification Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>File Modification Report</h1>
    <p>Generated: ${new Date(e.generatedAt).toLocaleString()}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Files:</strong> ${e.summary.totalFiles}</p>
        <p><strong>Total Size:</strong> ${this.formatFileSize(e.summary.totalSize)}</p>
        <p><strong>Time Range:</strong> ${e.timeRange}</p>
    </div>
    
    <h2>File Types</h2>
    <table>
        <tr><th>Type</th><th>Count</th></tr>
        ${Object.entries(e.summary.fileTypes).map(([t,i])=>`<tr><td>${t}</td><td>${i}</td></tr>`).join("")}
    </table>
    
    <h2>Most Active Files</h2>
    <table>
        <tr><th>Path</th><th>Activity Count</th><th>Last Activity</th></tr>
        ${e.summary.mostActiveFiles.map(t=>`<tr><td>${t.path}</td><td>${t.activityCount}</td><td>${new Date(t.lastActivity).toLocaleString()}</td></tr>`).join("")}
    </table>
    
    <h2>All Files</h2>
    <table>
        <tr><th>Path</th><th>Size</th><th>Modified</th><th>Type</th><th>Activity Count</th></tr>
        ${e.files.map(t=>`<tr>
                <td>${t.path}</td>
                <td>${this.formatFileSize(t.size||0)}</td>
                <td>${t.modified?new Date(t.modified).toLocaleString():"N/A"}</td>
                <td>${t.type}</td>
                <td>${t.activityCount}</td>
            </tr>`).join("")}
    </table>
</body>
</html>`}formatAsMarkdown(e){return`# File Modification Report

**Generated:** ${new Date(e.generatedAt).toLocaleString()}
**Time Range:** ${e.timeRange}

## Summary

- **Total Files:** ${e.summary.totalFiles}
- **Total Size:** ${this.formatFileSize(e.summary.totalSize)}

## File Types

| Type | Count |
|------|-------|
${Object.entries(e.summary.fileTypes).map(([t,i])=>`| ${t} | ${i} |`).join(`
`)}

## Most Active Files

| Path | Activity Count | Last Activity |
|------|----------------|---------------|
${e.summary.mostActiveFiles.map(t=>`| ${t.path} | ${t.activityCount} | ${new Date(t.lastActivity).toLocaleString()} |`).join(`
`)}

## Recently Modified Files

| Path | Modified | Size |
|------|----------|------|
${e.summary.recentlyModified.map(t=>`| ${t.path} | ${new Date(t.modified).toLocaleString()} | ${this.formatFileSize(t.size)} |`).join(`
`)}

## All Files

| Path | Size | Modified | Type | Activities |
|------|------|----------|------|------------|
${e.files.map(t=>`| ${t.path} | ${this.formatFileSize(t.size||0)} | ${t.modified?new Date(t.modified).toLocaleString():"N/A"} | ${t.type} | ${t.activityCount} |`).join(`
`)}
`}async saveReport(e,t){try{if(mo){let o=encodeURIComponent(e);await x.env.openExternal(x.Uri.parse(`data:text/plain;charset=utf-8,${o}`)),x.window.showInformationMessage("Report download triggered in browser");return}let i=t instanceof x.Uri?t:x.Uri.file(t);await go.writeFile(i,e,"utf8"),z.info(`Report saved to ${i.fsPath||i.path}`)}catch(i){throw z.error("Failed to save report:",i),i}}async exportToTimeTrackingTools(e={}){try{let{tool:t="generic",timeRange:i="7d"}=e,o=await this.collectFileData(i,!1);return this.formatForTimeTracking(o,t)}catch(t){return z.error("Failed to export to time tracking tools:",t),null}}formatForTimeTracking(e,t){let i=[];switch(e.files.forEach(o=>{o.activities.forEach(s=>{i.push({file:o.path,action:s.action,timestamp:s.timestamp,duration:this.estimateSessionDuration(s),project:this.extractProjectName(o.path)})})}),t){case"toggl":return this.formatForToggl(i);case"clockify":return this.formatForClockify(i);case"generic":default:return i}}formatForToggl(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),duration:t.duration*60,project:t.project,tags:[t.action,this.getFileType(t.file)]}))}formatForClockify(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),end:new Date(t.timestamp.getTime()+t.duration*60*1e3).toISOString(),project:t.project,tags:[t.action,this.getFileType(t.file)]}))}estimateSessionDuration(e){switch(e.action){case"created":return 15;case"modified":return 5;case"deleted":return 1;default:return 5}}extractProjectName(e){return po(e).split("/")[0]||"Unknown Project"}getFileType(e){let t=st(e);return{".js":"javascript",".ts":"typescript",".py":"python",".java":"java",".cpp":"cpp",".html":"html",".css":"css",".md":"markdown",".json":"json",".xml":"xml",".txt":"text"}[t]||"other"}isExcluded(e,t){return t.some(i=>new RegExp(i.replace(/\*/g,".*")).test(e))}formatFileSize(e){if(e===0)return"0 B";let t=1024,i=["B","KB","MB","GB"],o=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,o)).toFixed(1))+" "+i[o]}async showReportDialog(){try{let e={"\u{1F4CA} Generate Full Report":"full","\u{1F4C5} Last 24 Hours":"24h","\u{1F4C5} Last 7 Days":"7d","\u{1F4C5} Last 30 Days":"30d","\u{1F4C5} Last 90 Days":"90d"},t=await x.window.showQuickPick(Object.keys(e),{placeHolder:"Select report time range"});if(!t)return;let i=e[t],o=["JSON","CSV","HTML","Markdown"],s=await x.window.showQuickPick(o,{placeHolder:"Select report format"});if(!s)return;let r=await x.window.showSaveDialog({defaultUri:x.Uri.file(`file-report.${s.toLowerCase()}`),filters:{[s]:[s.toLowerCase()]}});if(!r)return;await this.generateFileModificationReport({format:s.toLowerCase(),timeRange:i,outputPath:r.fsPath})}catch(e){z.error("Failed to show report dialog:",e),x.window.showErrorMessage("Failed to generate report")}}dispose(){if(this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._fileWatcherSubscriptions.length>0){for(let e of this._fileWatcherSubscriptions)e.dispose();this._fileWatcherSubscriptions=[]}this._fileWatcher&&(this._fileWatcher.dispose(),this._fileWatcher=null),this.fileActivityCache.clear(),z.info("Export & Reporting Manager disposed")}};d(at,"ExportReportingManager");var rt=at;ei.exports={ExportReportingManager:rt}});var _=require("vscode"),{FileDateDecorationProvider:fo}=Ot(),{getLogger:wo}=M(),{getLocalization:vo}=ne(),{fileSystem:_o}=G(),{registerCoreCommands:bo}=Wt(),{registerAnalysisCommands:yo}=Ht(),{registerOnboardingCommands:Co}=Vt(),W,D,de;function xo(a){return`<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Explorer Dates API</title>
        <style>
            body { 
                font-family: var(--vscode-font-family); 
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            .header {
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .api-section {
                margin-bottom: 30px;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
            }
            .method {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 15px;
                margin: 10px 0;
                border-radius: 4px;
                font-family: monospace;
            }
            .method-name {
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
            }
            .example {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 15px;
                margin: 10px 0;
                border-radius: 4px;
                font-family: monospace;
                border-left: 4px solid var(--vscode-charts-blue);
            }
            code {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 2px 4px;
                border-radius: 2px;
                font-family: monospace;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>\u{1F50C} Explorer Dates Extension API</h1>
            <p>Version: ${a.version} | API Version: ${a.apiVersion}</p>
        </div>
        
        <div class="api-section">
            <h2>\u{1F4CB} Core Functions</h2>
            <div class="method">
                <div class="method-name">getFileDecorations(filePaths: string[])</div>
                <p>Get decoration information for specified files</p>
            </div>
            <div class="method">
                <div class="method-name">refreshDecorations(filePaths?: string[])</div>
                <p>Refresh decorations for all files or specific files</p>
            </div>
            <div class="method">
                <div class="method-name">formatDate(date: Date, format?: string)</div>
                <p>Format date according to current settings</p>
            </div>
            <div class="method">
                <div class="method-name">getFileStats(filePath: string)</div>
                <p>Get comprehensive file statistics</p>
            </div>
        </div>

        <div class="api-section">
            <h2>\u{1F50C} Plugin System</h2>
            <div class="method">
                <div class="method-name">registerPlugin(pluginId: string, plugin: Plugin)</div>
                <p>Register a new plugin with the extension</p>
            </div>
            <div class="method">
                <div class="method-name">registerDecorationProvider(providerId: string, provider: DecorationProvider)</div>
                <p>Register a custom decoration provider</p>
            </div>
        </div>

        <div class="api-section">
            <h2>\u{1F4E1} Events</h2>
            <div class="method">
                <div class="method-name">onDecorationChanged(callback: Function)</div>
                <p>Subscribe to decoration change events</p>
            </div>
            <div class="method">
                <div class="method-name">onFileScanned(callback: Function)</div>
                <p>Subscribe to file scan events</p>
            </div>
        </div>

        <div class="api-section">
            <h2>\u{1F4A1} Usage Example</h2>
            <div class="example">
// Get the Explorer Dates API<br>
const explorerDatesApi = vscode.extensions.getExtension('your-publisher.explorer-dates')?.exports;<br><br>
// Register a custom decoration provider<br>
explorerDatesApi.registerDecorationProvider('myProvider', {<br>
&nbsp;&nbsp;provideDecoration: async (uri, stat, currentDecoration) => {<br>
&nbsp;&nbsp;&nbsp;&nbsp;return {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;badge: currentDecoration.badge + ' \u{1F525}',<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tooltip: currentDecoration.tooltip + '\\nCustom info'<br>
&nbsp;&nbsp;&nbsp;&nbsp;};<br>
&nbsp;&nbsp;}<br>
});<br><br>
// Listen for decoration changes<br>
explorerDatesApi.onDecorationChanged((data) => {<br>
&nbsp;&nbsp;console.log('Decorations changed:', data);<br>
});
            </div>
        </div>

        <div class="api-section">
            <h2>\u{1F4DA} Plugin Structure</h2>
            <div class="example">
const myPlugin = {<br>
&nbsp;&nbsp;name: 'My Custom Plugin',<br>
&nbsp;&nbsp;version: '1.0.0',<br>
&nbsp;&nbsp;author: 'Your Name',<br>
&nbsp;&nbsp;description: 'Adds custom functionality',<br><br>
&nbsp;&nbsp;activate: (api) => {<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Plugin initialization<br>
&nbsp;&nbsp;&nbsp;&nbsp;console.log('Plugin activated!');<br>
&nbsp;&nbsp;},<br><br>
&nbsp;&nbsp;deactivate: () => {<br>
&nbsp;&nbsp;&nbsp;&nbsp;// Cleanup<br>
&nbsp;&nbsp;&nbsp;&nbsp;console.log('Plugin deactivated!');<br>
&nbsp;&nbsp;}<br>
};<br><br>
// Register the plugin<br>
explorerDatesApi.registerPlugin('myPlugin', myPlugin);
            </div>
        </div>
    </body>
    </html>`}d(xo,"getApiInformationHtml");function Do(a){let e=d(i=>{if(i<1024)return`${i} B`;let o=i/1024;return o<1024?`${o.toFixed(1)} KB`:`${(o/1024).toFixed(1)} MB`},"formatFileSize"),t=a.map(i=>`
        <tr>
            <td>${i.path}</td>
            <td>${i.modified.toLocaleString()}</td>
            <td>${e(i.size)}</td>
        </tr>
    `).join("");return`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Workspace File Activity</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
                th { background-color: var(--vscode-editor-background); font-weight: bold; }
                tr:hover { background-color: var(--vscode-list-hoverBackground); }
                .header { margin-bottom: 20px; }
                .stats { display: flex; gap: 20px; margin-bottom: 20px; }
                .stat-box { padding: 10px; background: var(--vscode-editor-background); border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>\u{1F4CA} Workspace File Activity</h1>
                <p>Recently modified files in your workspace</p>
            </div>
            <div class="stats">
                <div class="stat-box">
                    <strong>Total Files Analyzed:</strong> ${a.length}
                </div>
                <div class="stat-box">
                    <strong>Most Recent:</strong> ${a.length>0?a[0].modified.toLocaleString():"N/A"}
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>File Path</th>
                        <th>Last Modified</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    ${t}
                </tbody>
            </table>
        </body>
        </html>
    `}d(Do,"generateWorkspaceActivityHTML");function So(a){return`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Explorer Dates Diagnostics</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-foreground); }
                .diagnostic-section { margin-bottom: 30px; padding: 20px; background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 8px; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); }
                h1 { color: var(--vscode-textLink-foreground); }
                h3 { color: var(--vscode-textPreformat-foreground); margin-top: 0; }
                .header { margin-bottom: 20px; }
                .fix-suggestions { background: var(--vscode-inputValidation-warningBackground); padding: 15px; border-radius: 4px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>\u{1F527} Explorer Dates Diagnostics</h1>
                <p>This report helps identify why date decorations might not be appearing in your Explorer.</p>
            </div>
            
            ${Object.entries(a).map(([t,i])=>{let o=Object.entries(i).map(([s,r])=>{let n=Array.isArray(r)?r.join(", ")||"None":(r==null?void 0:r.toString())||"N/A";return`
                <tr>
                    <td><strong>${s}:</strong></td>
                    <td>${n}</td>
                </tr>
            `}).join("");return`
            <div class="diagnostic-section">
                <h3>\u{1F50D} ${t}</h3>
                <table>
                    ${o}
                </table>
            </div>
        `}).join("")}
            
            <div class="fix-suggestions">
                <h3>\u{1F4A1} Quick Fixes</h3>
                <p><strong>If decorations aren't showing:</strong></p>
                <ol>
                    <li>Try running <code>Explorer Dates: Quick Fix</code> command</li>
                    <li>Use <code>Explorer Dates: Refresh Date Decorations</code> to force refresh</li>
                    <li>Check if your files are excluded by patterns above</li>
                    <li>Restart VS Code if the provider isn't active</li>
                </ol>
            </div>
        </body>
        </html>
    `}d(So,"generateDiagnosticsHTML");function Fo(a){return`<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Comprehensive Decoration Diagnostics</title>
        <style>
            body { 
                font-family: var(--vscode-font-family); 
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            .header {
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 2px solid var(--vscode-panel-border);
            }
            .test-section {
                margin-bottom: 25px;
                padding: 20px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
            }
            .test-ok { 
                background-color: rgba(0, 255, 0, 0.1);
                border-left: 4px solid var(--vscode-terminal-ansiGreen);
            }
            .test-warning { 
                background-color: rgba(255, 255, 0, 0.1);
                border-left: 4px solid var(--vscode-terminal-ansiYellow);
            }
            .test-error { 
                background-color: rgba(255, 0, 0, 0.1);
                border-left: 4px solid var(--vscode-terminal-ansiRed);
            }
            .status-ok { color: var(--vscode-terminal-ansiGreen); font-weight: bold; }
            .status-warning { color: var(--vscode-terminal-ansiYellow); font-weight: bold; }
            .status-error { color: var(--vscode-terminal-ansiRed); font-weight: bold; }
            .issue-critical { 
                color: var(--vscode-terminal-ansiRed); 
                font-weight: bold;
                background-color: rgba(255, 0, 0, 0.2);
                padding: 5px;
                border-radius: 3px;
                margin: 5px 0;
            }
            .issue-warning { 
                color: var(--vscode-terminal-ansiYellow); 
                background-color: rgba(255, 255, 0, 0.2);
                padding: 5px;
                border-radius: 3px;
                margin: 5px 0;
            }
            pre { 
                background-color: var(--vscode-textCodeBlock-background);
                padding: 15px;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 0.9em;
            }
            .summary {
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                padding: 15px;
                margin: 20px 0;
            }
            .file-test {
                display: inline-block;
                margin: 5px;
                padding: 8px 12px;
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                border-radius: 4px;
                font-family: monospace;
                font-size: 0.9em;
            }
            .badge-test {
                display: inline-block;
                margin: 3px;
                padding: 4px 8px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border-radius: 3px;
                font-family: monospace;
                font-size: 0.8em;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>\u{1F50D} Comprehensive Decoration Diagnostics</h1>
            <p><strong>VS Code:</strong> ${a.vscodeVersion} | <strong>Extension:</strong> ${a.extensionVersion}</p>
            <p><strong>Generated:</strong> ${new Date(a.timestamp).toLocaleString()}</p>
        </div>

        ${Object.entries(a.tests).map(([e,t])=>{let i=t.status==="OK"?"test-ok":t.status==="ISSUES_FOUND"?"test-warning":"test-error",o=t.status==="OK"?"status-ok":t.status==="ISSUES_FOUND"?"status-warning":"status-error";return`
            <div class="test-section ${i}">
                <h2>\u{1F9EA} ${e.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</h2>
                <p class="${o}">Status: ${t.status}</p>
                
                ${t.issues&&t.issues.length>0?`
                    <h3>Issues Found:</h3>
                    ${t.issues.map(s=>`<div class="${s.startsWith("CRITICAL:")?"issue-critical":"issue-warning"}">\u26A0\uFE0F ${s}</div>`).join("")}
                `:""}
                
                ${t.settings?`
                    <h3>Settings:</h3>
                    <pre>${JSON.stringify(t.settings,null,2)}</pre>
                `:""}
                
                ${t.testFiles?`
                    <h3>File Tests:</h3>
                    ${t.testFiles.map(s=>`
                        <div class="file-test">
                            \u{1F4C4} ${s.file}: 
                            ${s.exists?"\u2705":"\u274C"} exists | 
                            ${s.excluded?"\u{1F6AB}":"\u2705"} ${s.excluded?"excluded":"included"} | 
                            ${s.hasDecoration?"\u{1F3F7}\uFE0F":"\u274C"} ${s.hasDecoration?`badge: ${s.badge}`:"no decoration"}
                        </div>
                    `).join("")}
                `:""}
                
                ${t.tests?`
                    <h3>Test Results:</h3>
                    ${t.tests.map(s=>`
                        <div class="badge-test">
                            ${s.success?"\u2705":"\u274C"} ${s.name}
                            ${s.badge?` \u2192 "${s.badge}"`:""}
                            ${s.error?` (${s.error})`:""}
                        </div>
                    `).join("")}
                `:""}
                
                ${t.cacheInfo?`
                    <h3>Cache Information:</h3>
                    <pre>${JSON.stringify(t.cacheInfo,null,2)}</pre>
                `:""}
                
                ${t.decorationExtensions&&t.decorationExtensions.length>0?`
                    <h3>Other Decoration Extensions:</h3>
                    ${t.decorationExtensions.map(s=>`
                        <div class="file-test">\u{1F50C} ${s.name} (${s.id})</div>
                    `).join("")}
                `:""}
            </div>`}).join("")}
        
        <div class="summary">
            <h2>\u{1F3AF} Summary & Next Steps</h2>
            <p>Review the test results above to identify the root cause of missing decorations.</p>
            <p><strong>Most common causes:</strong></p>
            <ul>
                <li>VS Code decoration settings disabled (explorer.decorations.badges/colors)</li>
                <li>Extension conflicts with icon themes or other decoration providers</li>
                <li>File exclusion patterns being too aggressive</li>
                <li>Badge format issues (length, characters, encoding)</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h2>\u{1F527} Raw Results</h2>
            <pre>${JSON.stringify(a,null,2)}</pre>
        </div>
    </body>
    </html>`}d(Fo,"generateDiagnosticsWebview");function To(a){let e=d(t=>{if(t===0)return"0 B";let i=1024,o=["B","KB","MB","GB"],s=Math.floor(Math.log(t)/Math.log(i));return parseFloat((t/Math.pow(i,s)).toFixed(2))+" "+o[s]},"formatBytes");return`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Performance Analytics</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
                .metric-card { background: var(--vscode-editor-background); padding: 15px; border-radius: 8px; border: 1px solid var(--vscode-widget-border); }
                .metric-title { font-weight: bold; margin-bottom: 10px; color: var(--vscode-foreground); }
                .metric-value { font-size: 24px; font-weight: bold; color: var(--vscode-textLink-foreground); }
                .metric-label { font-size: 12px; color: var(--vscode-descriptionForeground); }
                .progress-bar { width: 100%; height: 8px; background: var(--vscode-progressBar-background); border-radius: 4px; margin: 8px 0; }
                .progress-fill { height: 100%; background: var(--vscode-progressBar-foreground); border-radius: 4px; }
            </style>
        </head>
        <body>
            <h1>\u{1F680} Explorer Dates Performance Analytics</h1>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-title">\u{1F4CA} Basic Metrics</div>
                    <div class="metric-value">${a.totalDecorations||0}</div>
                    <div class="metric-label">Total Decorations</div>
                    <div class="metric-value">${a.cacheHitRate||"0%"}</div>
                    <div class="metric-label">Cache Hit Rate</div>
                </div>
                
                ${a.advancedCache?`
                <div class="metric-card">
                    <div class="metric-title">\u{1F9E0} Advanced Cache</div>
                    <div class="metric-value">${a.advancedCache.memoryItems||0}</div>
                    <div class="metric-label">Memory Items</div>
                    <div class="metric-value">${e(a.advancedCache.memoryUsage||0)}</div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${a.advancedCache.memoryUsagePercent||0}%"></div>
                    </div>
                    <div class="metric-label">${a.advancedCache.memoryUsagePercent||"0.00"}% of limit</div>
                    <div class="metric-value">${a.advancedCache.memoryHitRate||"0%"}</div>
                    <div class="metric-label">Memory Hit Rate</div>
                    <div class="metric-value">${a.advancedCache.diskHitRate||"0%"}</div>
                    <div class="metric-label">Disk Hit Rate</div>
                </div>
                `:`
                <div class="metric-card">
                    <div class="metric-title">\u{1F9E0} Advanced Cache</div>
                    <div class="metric-value">0</div>
                    <div class="metric-label">Memory Items</div>
                    <div class="metric-value">0 B</div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="metric-value">Inactive</div>
                    <div class="metric-label">Status</div>
                </div>
                `}
                
                ${a.batchProcessor?`
                <div class="metric-card">
                    <div class="metric-title">\u26A1 Batch Processor</div>
                    <div class="metric-value">${a.batchProcessor.totalBatches}</div>
                    <div class="metric-label">Total Batches Processed</div>
                    <div class="metric-value">${a.batchProcessor.averageBatchTime.toFixed(2)}ms</div>
                    <div class="metric-label">Average Batch Time</div>
                    <div class="metric-value">${a.batchProcessor.isProcessing?"Active":"Idle"}</div>
                    <div class="metric-label">Current Status</div>
                    <div class="metric-value">${a.batchProcessor.queueLength||0}</div>
                    <div class="metric-label">Queued Items</div>
                    <div class="metric-value">${a.batchProcessor.currentProgress?(a.batchProcessor.currentProgress*100).toFixed(0)+"%":"0%"}</div>
                    <div class="metric-label">Progress</div>
                </div>
                `:""}
                
                <div class="metric-card">
                    <div class="metric-title">\u{1F4C8} Performance</div>
                    <div class="metric-value">${a.cacheHits||0}</div>
                    <div class="metric-label">Cache Hits</div>
                    <div class="metric-value">${a.cacheMisses||0}</div>
                    <div class="metric-label">Cache Misses</div>
                    <div class="metric-value">${a.errors||0}</div>
                    <div class="metric-label">Errors</div>
                </div>

                ${a.performanceTiming?`
                <div class="metric-card">
                    <div class="metric-title">\u{1F552} I/O Latency</div>
                    <div class="metric-value">${a.performanceTiming.avgGitBlameMs}ms</div>
                    <div class="metric-label">Avg Git Blame (${a.performanceTiming.gitBlameCalls} calls)</div>
                    <div class="metric-value">${a.performanceTiming.avgFileStatMs}ms</div>
                    <div class="metric-label">Avg File Stat (${a.performanceTiming.fileStatCalls} calls)</div>
                    <div class="metric-value">${a.performanceTiming.totalGitBlameTimeMs}ms</div>
                    <div class="metric-label">Total Git Time</div>
                    <div class="metric-value">${a.performanceTiming.totalFileStatTimeMs}ms</div>
                    <div class="metric-label">Total File Stat Time</div>
                </div>
                `:""}
            </div>
        </body>
        </html>
    `}d(To,"generatePerformanceAnalyticsHTML");function ii(a){let e=_.window.createStatusBarItem(_.StatusBarAlignment.Right,100);e.command="explorerDates.showFileDetails",e.tooltip="Click to show detailed file information";let t=d(async()=>{try{let i=_.window.activeTextEditor;if(!i){e.hide();return}let o=i.document.uri;if(o.scheme!=="file"){e.hide();return}let s=await _o.stat(o),r=s.mtime instanceof Date?s.mtime:new Date(s.mtime),n=W._formatDateBadge(r,"smart"),c=W._formatFileSize(s.size,"auto");e.text=`$(clock) ${n} $(file) ${c}`,e.show()}catch(i){e.hide(),D.debug("Failed to update status bar",i)}},"updateStatusBar");return _.window.onDidChangeActiveTextEditor(t),_.window.onDidChangeTextEditorSelection(t),t(),a.subscriptions.push(e),e}d(ii,"initializeStatusBar");async function ko(a){try{D=wo(),de=vo(),a.subscriptions.push(de),D.info("Explorer Dates: Extension activated");let e=_.env.uiKind===_.UIKind.Web;await _.commands.executeCommand("setContext","explorerDates.gitFeaturesAvailable",!e);let t=_.workspace.getConfiguration("explorerDates"),i=t.get("enableWorkspaceTemplates",!0),o=t.get("enableReporting",!0),s=t.get("enableExtensionApi",!0);W=new fo;let r=_.window.registerFileDecorationProvider(W);a.subscriptions.push(r),a.subscriptions.push(W),a.subscriptions.push(D),await W.initializeAdvancedSystems(a);let n=null,c=null,l=null,u=null,h=d(()=>{if(!n){let{OnboardingManager:b}=Jt();n=new b(a)}return n},"getOnboardingManager"),v=d(()=>{if(!i)throw new Error("Workspace templates are disabled via explorerDates.enableWorkspaceTemplates");if(!c){let{WorkspaceTemplatesManager:b}=Qt();c=new b(a)}return c},"getWorkspaceTemplatesManager"),g=d(()=>{if(!l){let{ExtensionApiManager:b}=Zt();l=new b,a.subscriptions.push(l)}return l},"getExtensionApiManager"),w=d(()=>{if(!o)throw new Error("Reporting is disabled via explorerDates.enableReporting");if(!u){let{ExportReportingManager:b}=ti();u=new b,a.subscriptions.push(u)}return u},"getExportReportingManager"),U=d(()=>g().getApi(),"apiFactory");s?a.exports=U:(a.exports=void 0,D.info("Explorer Dates API exports disabled via explorerDates.enableExtensionApi")),_.workspace.getConfiguration("explorerDates").get("showWelcomeOnStartup",!0)&&await h().shouldShowOnboarding()&&setTimeout(()=>{h().showWelcomeMessage()},5e3),bo({context:a,fileDateProvider:W,logger:D,l10n:de}),yo({context:a,fileDateProvider:W,logger:D,generators:{generateWorkspaceActivityHTML:Do,generatePerformanceAnalyticsHTML:To,generateDiagnosticsHTML:So,generateDiagnosticsWebview:Fo}}),Co({context:a,logger:D,getOnboardingManager:h});let _e=_.commands.registerCommand("explorerDates.openTemplateManager",async()=>{try{if(!i){_.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to use this command.");return}await v().showTemplateManager(),D.info("Template manager opened")}catch(b){D.error("Failed to open template manager",b),_.window.showErrorMessage(`Failed to open template manager: ${b.message}`)}});a.subscriptions.push(_e);let he=_.commands.registerCommand("explorerDates.saveTemplate",async()=>{try{if(!i){_.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to save templates.");return}let b=await _.window.showInputBox({prompt:"Enter template name",placeHolder:"e.g., My Project Setup"});if(b){let X=await _.window.showInputBox({prompt:"Enter description (optional)",placeHolder:"Brief description of this template"})||"";await v().saveCurrentConfiguration(b,X)}D.info("Template saved")}catch(b){D.error("Failed to save template",b),_.window.showErrorMessage(`Failed to save template: ${b.message}`)}});a.subscriptions.push(he);let te=_.commands.registerCommand("explorerDates.generateReport",async()=>{try{if(!o){_.window.showInformationMessage("Reporting features are disabled. Enable explorerDates.enableReporting to generate reports.");return}await w().showReportDialog(),D.info("Report generation started")}catch(b){D.error("Failed to generate report",b),_.window.showErrorMessage(`Failed to generate report: ${b.message}`)}});a.subscriptions.push(te);let be=_.commands.registerCommand("explorerDates.showApiInfo",async()=>{try{if(!s){_.window.showInformationMessage("Explorer Dates API is disabled via settings.");return}let b=_.window.createWebviewPanel("apiInfo","Explorer Dates API Information",_.ViewColumn.One,{enableScripts:!0});b.webview.html=xo(U()),D.info("API information panel opened")}catch(b){D.error("Failed to show API information",b),_.window.showErrorMessage(`Failed to show API information: ${b.message}`)}});a.subscriptions.push(be);let P,ie=_.workspace.getConfiguration("explorerDates"),ue=ie.get("performanceMode",!1);ie.get("showStatusBar",!1)&&!ue&&(P=ii(a));let oe=_.workspace.onDidChangeConfiguration(b=>{if(b.affectsConfiguration("explorerDates.showStatusBar")||b.affectsConfiguration("explorerDates.performanceMode")){let X=_.workspace.getConfiguration("explorerDates"),se=X.get("showStatusBar",!1),q=X.get("performanceMode",!1),Ce=se&&!q;Ce&&!P?P=ii(a):!Ce&&P&&(P.dispose(),P=null)}});a.subscriptions.push(oe),D.info("Explorer Dates: Date decorations ready")}catch(e){let t=`${de?de.getString("activationError"):"Explorer Dates failed to activate"}: ${e.message}`;throw D&&D.error("Extension activation failed",e),_.window.showErrorMessage(t),e}}d(ko,"activate");async function $o(){try{D&&D.info("Explorer Dates extension is being deactivated"),W&&typeof W.dispose=="function"&&await W.dispose(),D&&D.info("Explorer Dates extension deactivated successfully")}catch(a){D&&D.error("Explorer Dates: Error during deactivation",a)}}d($o,"deactivate");module.exports={activate:ko,deactivate:$o};
