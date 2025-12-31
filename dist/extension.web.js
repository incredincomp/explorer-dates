var so=Object.defineProperty;var d=(a,e)=>so(a,"name",{value:e,configurable:!0});var S=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports);var M=S((exports,module)=>{var vscode=require("vscode"),isWebRuntime=!0,inspectValue=isWebRuntime?a=>{if(typeof a=="string")return a;try{return JSON.stringify(a,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),De=class De{constructor(){this._outputChannel=vscode.window.createOutputChannel("Explorer Dates"),this._isEnabled=!1,this._configurationWatcher=null,this._logProfile=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this._logProfile)||(this._logProfile=DEFAULT_LOG_PROFILE),this._throttleState=new Map,this._updateConfig(),this._configurationWatcher=vscode.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.enableLogging")&&this._updateConfig()})}_updateConfig(){let e=vscode.workspace.getConfiguration("explorerDates");this._isEnabled=e.get("enableLogging",!1)}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this._logProfile=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this._throttleState.delete(e);return}this._throttleState.clear()}debug(e,...t){this._isEnabled&&this._logInternal("debug",null,e,t)}info(e,...t){this._logInternal("info",null,e,t)}infoWithOptions(e,t,...o){this._logInternal("info",e||null,t,o)}warn(e,...t){this._logInternal("warn",null,e,t)}error(e,t,...o){let r=`[${new Date().toISOString()}] [ERROR] ${e}`;this._outputChannel.appendLine(r),t instanceof Error?(this._outputChannel.appendLine(`Error: ${t.message}`),t.stack&&this._outputChannel.appendLine(`Stack: ${t.stack}`)):t&&this._outputChannel.appendLine(this._serializeArg(t));let s=this._evaluateArgs(o);s.length>0&&s.forEach(n=>this._outputChannel.appendLine(this._serializeArg(n)))}show(){this._outputChannel.show()}clear(){this._outputChannel.clear()}dispose(){this._outputChannel.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),loggerInstance===this&&(loggerInstance=null)}_logInternal(e,t,o,i){if(e==="debug"&&!this._isEnabled||this._shouldThrottle(e,t))return;let s=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${o}`;this._outputChannel.appendLine(s);let n=this._evaluateArgs(i);n.length>0&&n.forEach(l=>this._outputChannel.appendLine(this._serializeArg(l))),(e==="warn"?console.warn:e==="error"?console.error:console.log)(s,...n)}_evaluateArgs(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(o){return`<<log arg threw: ${o.message}>>`}})}_serializeArg(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}_shouldThrottle(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let o=(t.profile||"stress").toLowerCase();if(!this._isProfileActive(o))return!1;let i=Number(t.throttleLimit)||50,r=t.throttleKey,s=this._throttleState.get(r)||{count:0,suppressed:0,noticeLogged:!1};if(s.count<i)return s.count+=1,this._throttleState.set(r,s),!1;if(s.suppressed+=1,!s.noticeLogged){s.noticeLogged=!0;let n=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${r}" after ${i} entries (profile=${this._logProfile})`;this._outputChannel.appendLine(n)}return this._throttleState.set(r,s),!0}_isProfileActive(e){let t=this._logProfile||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}};d(De,"Logger");var Logger=De,loggerInstance=null;function getLogger(){return loggerInstance||(loggerInstance=new Logger),loggerInstance}d(getLogger,"getLogger");module.exports={Logger,getLogger}});var se=S((Mi,at)=>{var Se=require("vscode"),ue={en:{now:"now",minutes:"m",hours:"h",days:"d",weeks:"w",months:"mo",years:"y",justNow:"just now",minutesAgo:d(a=>`${a} minute${a!==1?"s":""} ago`,"minutesAgo"),hoursAgo:d(a=>`${a} hour${a!==1?"s":""} ago`,"hoursAgo"),yesterday:"yesterday",daysAgo:d(a=>`${a} day${a!==1?"s":""} ago`,"daysAgo"),lastModified:"Last modified",refreshSuccess:"Date decorations refreshed",activationError:"Explorer Dates failed to activate",errorAccessingFile:"Error accessing file for decoration"},es:{now:"ahora",minutes:"m",hours:"h",days:"d",weeks:"s",months:"m",years:"a",justNow:"ahora mismo",minutesAgo:d(a=>`hace ${a} minuto${a!==1?"s":""}`,"minutesAgo"),hoursAgo:d(a=>`hace ${a} hora${a!==1?"s":""}`,"hoursAgo"),yesterday:"ayer",daysAgo:d(a=>`hace ${a} d\xEDa${a!==1?"s":""}`,"daysAgo"),lastModified:"\xDAltima modificaci\xF3n",refreshSuccess:"Decoraciones de fecha actualizadas",activationError:"Explorer Dates no se pudo activar",errorAccessingFile:"Error al acceder al archivo para decoraci\xF3n"},fr:{now:"maintenant",minutes:"m",hours:"h",days:"j",weeks:"s",months:"m",years:"a",justNow:"\xE0 l'instant",minutesAgo:d(a=>`il y a ${a} minute${a!==1?"s":""}`,"minutesAgo"),hoursAgo:d(a=>`il y a ${a} heure${a!==1?"s":""}`,"hoursAgo"),yesterday:"hier",daysAgo:d(a=>`il y a ${a} jour${a!==1?"s":""}`,"daysAgo"),lastModified:"Derni\xE8re modification",refreshSuccess:"D\xE9corations de date actualis\xE9es",activationError:"\xC9chec de l'activation d'Explorer Dates",errorAccessingFile:"Erreur lors de l'acc\xE8s au fichier pour la d\xE9coration"},de:{now:"jetzt",minutes:"Min",hours:"Std",days:"T",weeks:"W",months:"Mon",years:"J",justNow:"gerade eben",minutesAgo:d(a=>`vor ${a} Minute${a!==1?"n":""}`,"minutesAgo"),hoursAgo:d(a=>`vor ${a} Stunde${a!==1?"n":""}`,"hoursAgo"),yesterday:"gestern",daysAgo:d(a=>`vor ${a} Tag${a!==1?"en":""}`,"daysAgo"),lastModified:"Zuletzt ge\xE4ndert",refreshSuccess:"Datumsdekorationen aktualisiert",activationError:"Explorer Dates konnte nicht aktiviert werden",errorAccessingFile:"Fehler beim Zugriff auf Datei f\xFCr Dekoration"},ja:{now:"\u4ECA",minutes:"\u5206",hours:"\u6642\u9593",days:"\u65E5",weeks:"\u9031",months:"\u30F6\u6708",years:"\u5E74",justNow:"\u305F\u3063\u305F\u4ECA",minutesAgo:d(a=>`${a}\u5206\u524D`,"minutesAgo"),hoursAgo:d(a=>`${a}\u6642\u9593\u524D`,"hoursAgo"),yesterday:"\u6628\u65E5",daysAgo:d(a=>`${a}\u65E5\u524D`,"daysAgo"),lastModified:"\u6700\u7D42\u66F4\u65B0",refreshSuccess:"\u65E5\u4ED8\u88C5\u98FE\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",activationError:"Explorer Dates\u306E\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F",errorAccessingFile:"\u30D5\u30A1\u30A4\u30EB\u30A2\u30AF\u30BB\u30B9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"},zh:{now:"\u73B0\u5728",minutes:"\u5206\u949F",hours:"\u5C0F\u65F6",days:"\u5929",weeks:"\u5468",months:"\u6708",years:"\u5E74",justNow:"\u521A\u521A",minutesAgo:d(a=>`${a}\u5206\u949F\u524D`,"minutesAgo"),hoursAgo:d(a=>`${a}\u5C0F\u65F6\u524D`,"hoursAgo"),yesterday:"\u6628\u5929",daysAgo:d(a=>`${a}\u5929\u524D`,"daysAgo"),lastModified:"\u6700\u540E\u4FEE\u6539",refreshSuccess:"\u65E5\u671F\u88C5\u9970\u5DF2\u5237\u65B0",activationError:"Explorer Dates \u6FC0\u6D3B\u5931\u8D25",errorAccessingFile:"\u8BBF\u95EE\u6587\u4EF6\u88C5\u9970\u65F6\u51FA\u9519"}},Fe=class Fe{constructor(){this._currentLocale="en",this._configurationWatcher=null,this._updateLocale(),this._configurationWatcher=Se.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.locale")&&this._updateLocale()})}_updateLocale(){let t=Se.workspace.getConfiguration("explorerDates").get("locale","auto");t==="auto"&&(t=Se.env.language.split("-")[0]),ue[t]||(t="en"),this._currentLocale=t}getString(e,...t){let i=(ue[this._currentLocale]||ue.en)[e];return typeof i=="function"?i(...t):i||ue.en[e]||e}getCurrentLocale(){return this._currentLocale}formatDate(e,t={}){try{return e.toLocaleDateString(this._currentLocale,t)}catch{return e.toLocaleDateString("en",t)}}dispose(){this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),re===this&&(re=null)}};d(Fe,"LocalizationManager");var ge=Fe,re=null;function ao(){return re||(re=new ge),re}d(ao,"getLocalization");at.exports={LocalizationManager:ge,getLocalization:ao}});var Te=S((Ai,ct)=>{var nt=require("vscode");function no(){try{return nt?.env?.uiKind===nt?.UIKind?.Web}catch{return!1}}d(no,"isWebEnvironment");ct.exports={isWebEnvironment:no}});var B=S((Ri,dt)=>{function V(a=""){return a?a.replace(/\\/g,"/"):""}d(V,"normalizePath");function co(a=""){let e=V(a);return e?e.split("/").filter(Boolean):[]}d(co,"getSegments");function lt(a=""){let e=co(a);return e.length?e[e.length-1]:""}d(lt,"getFileName");function lo(a=""){let e=lt(a),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}d(lo,"getExtension");function ho(a=""){let e=V(a),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}d(ho,"getDirectory");function uo(...a){return V(a.filter(Boolean).join("/")).replace(/\/+/g,"/")}d(uo,"joinPath");function go(a=""){return V(a).toLowerCase()}d(go,"getCacheKey");function po(a=""){if(!a)return"";if(typeof a=="string")return a;if(typeof a.fsPath=="string"&&a.fsPath.length>0)return a.fsPath;if(typeof a.path=="string"&&a.path.length>0)return a.path;if(typeof a.toString=="function")try{return a.toString(!0)}catch{return a.toString()}return String(a)}d(po,"getUriPath");function fo(a="",e=""){let t=V(a),o=V(e);return t&&o.startsWith(t)?o.substring(t.length).replace(/^\/+/,""):o}d(fo,"getRelativePath");dt.exports={normalizePath:V,getFileName:lt,getExtension:lo,getDirectory:ho,joinPath:uo,getCacheKey:go,getUriPath:po,getRelativePath:fo}});var H=S((Li,ut)=>{var R=require("vscode"),{isWebEnvironment:mo}=Te(),{normalizePath:wo}=B(),ht=!0,T=null;if(!ht)try{T=require("fs").promises}catch{T=null}var ke=class ke{constructor(){this.isWeb=ht||mo()}_toPath(e){return e?typeof e=="string"?e:e instanceof R.Uri?e.fsPath||e.path:String(e):""}_toUri(e){if(e instanceof R.Uri)return e;if(typeof e=="string")return R.Uri.file(e);throw new Error(`Unsupported target type: ${typeof e}`)}async stat(e){if(!this.isWeb&&T)return T.stat(this._toPath(e));let t=this._toUri(e),o=await R.workspace.fs.stat(t);return{...o,mtime:new Date(o.mtime),ctime:new Date(o.ctime),birthtime:new Date(o.ctime),isFile:d(()=>o.type===R.FileType.File,"isFile"),isDirectory:d(()=>o.type===R.FileType.Directory,"isDirectory")}}async readFile(e,t="utf8"){if(!this.isWeb&&T)return T.readFile(this._toPath(e),t);let o=this._toUri(e),i=await R.workspace.fs.readFile(o);return t===null||t==="binary"?i:new TextDecoder(t).decode(i)}async writeFile(e,t,o="utf8"){if(!this.isWeb&&T)return T.writeFile(this._toPath(e),t,o);let i=this._toUri(e),r=typeof t=="string"?new TextEncoder().encode(t):t;await R.workspace.fs.writeFile(i,r)}async mkdir(e,t={recursive:!0}){if(!this.isWeb&&T)return T.mkdir(this._toPath(e),t);let o=this._toUri(e);await R.workspace.fs.createDirectory(o)}async readdir(e,t={withFileTypes:!1}){if(!this.isWeb&&T)return T.readdir(this._toPath(e),t);let o=this._toUri(e),i=await R.workspace.fs.readDirectory(o);return t.withFileTypes?i.map(([r,s])=>({name:r,isDirectory:d(()=>s===R.FileType.Directory,"isDirectory"),isFile:d(()=>s===R.FileType.File,"isFile")})):i.map(([r])=>r)}async delete(e,t={recursive:!1}){if(!this.isWeb&&T){let i=this._toPath(e);return t.recursive?T.rm?T.rm(i,t):T.rmdir(i,t):T.unlink(i)}let o=this._toUri(e);await R.workspace.fs.delete(o,t)}async exists(e){try{return await this.stat(e),!0}catch{return!1}}async ensureDirectory(e){let t=wo(this._toPath(e));await this.mkdir(t,{recursive:!0})}};d(ke,"FileSystemAdapter");var pe=ke,vo=new pe;ut.exports={FileSystemAdapter:pe,fileSystem:vo}});var pt=S((Oi,gt)=>{var P=require("vscode"),{getLogger:bo}=M(),{fileSystem:_o}=H(),{normalizePath:$e,getRelativePath:yo,getFileName:Co}=B(),Me=class Me{constructor(){this._logger=bo(),this._fs=_o,this._commonExclusions=["node_modules",".npm",".yarn","coverage","nyc_output","dist","build","out","target","bin","obj",".vscode",".idea",".vs",".vscode-test",".git",".svn",".hg",".bzr",".pnpm-store","bower_components","jspm_packages","tmp","temp",".tmp",".cache",".parcel-cache",".DS_Store","Thumbs.db","__pycache__",".pytest_cache",".tox","venv",".env",".virtualenv","vendor",".docker","logs","*.log"],this._patternScores=new Map,this._workspaceAnalysis=new Map,this._logger.info("SmartExclusionManager initialized")}async cleanupAllWorkspaceProfiles(){let e=P.workspace.getConfiguration("explorerDates"),t=e.get("workspaceExclusionProfiles",{}),o=!1;for(let[i,r]of Object.entries(t)){let s=Array.isArray(r)?r:[],n=this._dedupeList(s);this._areListsEqual(s,n)||(t[i]=n,o=!0,this._logger.debug(`Deduped workspace exclusions for ${i}`,{before:s.length,after:n.length}))}o?(await e.update("workspaceExclusionProfiles",t,P.ConfigurationTarget.Global),this._logger.info("Cleaned up duplicate workspace exclusions",{workspaceCount:Object.keys(t).length})):this._logger.debug("Workspace exclusion profiles already clean")}async analyzeWorkspace(e){try{let t=$e(e?.fsPath||e?.path||""),o={detectedPatterns:[],suggestedExclusions:[],projectType:"unknown",riskFolders:[]};o.projectType=await this._detectProjectType(e);let i=await this._scanForExclusionCandidates(e,t),r=this._scorePatterns(i,o.projectType);return o.detectedPatterns=i,o.suggestedExclusions=r.filter(s=>s.score>.7).map(s=>s.pattern),o.riskFolders=r.filter(s=>s.riskLevel==="high").map(s=>s.pattern),this._workspaceAnalysis.set(t,o),this._logger.info(`Workspace analysis complete for ${t}`,o),o}catch(t){return this._logger.error("Failed to analyze workspace",t),null}}async _detectProjectType(e){let t=[{file:"package.json",type:"javascript"},{file:"pom.xml",type:"java"},{file:"Cargo.toml",type:"rust"},{file:"setup.py",type:"python"},{file:"requirements.txt",type:"python"},{file:"Gemfile",type:"ruby"},{file:"composer.json",type:"php"},{file:"go.mod",type:"go"},{file:"CMakeLists.txt",type:"cpp"},{file:"Dockerfile",type:"docker"}];if(!e)return"unknown";for(let o of t)try{let i=P.Uri.joinPath(e,o.file);if(await this._fs.exists(i))return o.type}catch{}return"unknown"}async _scanForExclusionCandidates(e,t,o=2){let i=[],r=d(async(s,n=0)=>{if(!(n>o))try{let c=await this._fs.readdir(s,{withFileTypes:!0});for(let l of c)if(l.isDirectory()){let u=P.Uri.joinPath(s,l.name),h=$e(u.fsPath||u.path),w=yo(t,h);this._commonExclusions.includes(l.name)&&i.push({name:l.name,path:w,type:"common",size:await this._getDirectorySize(u)});let g=await this._getDirectorySize(u);g>10485760&&i.push({name:l.name,path:w,type:"large",size:g}),await r(u,n+1)}}catch{}},"scanDirectory");return await r(e),i}async _getDirectorySize(e){try{let t=await this._fs.readdir(e,{withFileTypes:!0}),o=0,i=0;for(let r of t){if(i>100)break;if(r.isFile())try{let s=P.Uri.joinPath(e,r.name),n=await this._fs.stat(s);o+=n.size,i++}catch{}}return o}catch{return 0}}_scorePatterns(e,t){return e.map(o=>{let i=0,r="low";switch(o.type==="common"&&(i+=.8),o.size>100*1024*1024?(i+=.9,r="high"):o.size>10*1024*1024&&(i+=.5,r="medium"),t){case"javascript":["node_modules",".npm","coverage","dist","build"].includes(o.name)&&(i+=.9);break;case"python":["__pycache__",".pytest_cache","venv",".env"].includes(o.name)&&(i+=.9);break;case"java":["target","build",".gradle"].includes(o.name)&&(i+=.9);break}return["src","lib","app","components","pages"].includes(o.name.toLowerCase())&&(i=0,r="none"),{pattern:o.name,path:o.path,score:Math.min(i,1),riskLevel:r,size:o.size,type:o.type}})}async getWorkspaceExclusions(e){let t=P.workspace.getConfiguration("explorerDates"),o=t.get("workspaceExclusionProfiles",{}),i=this._getWorkspaceKey(e),r=o[i]||[],s=this._dedupeList(r);if(s.length!==r.length){o[i]=s;try{await t.update("workspaceExclusionProfiles",o,P.ConfigurationTarget.Global),this._logger.info(`Cleaned duplicate exclusions for ${i}`,{before:r.length,after:s.length})}catch(n){this._logger.warn(`Failed to persist cleaned exclusions for ${i}`,n)}}return s}async saveWorkspaceExclusions(e,t){let o=P.workspace.getConfiguration("explorerDates"),i=o.get("workspaceExclusionProfiles",{}),r=this._getWorkspaceKey(e),s=this._dedupeList(t);if(Array.isArray(i[r])?this._areListsEqual(i[r],s):!1){this._logger.debug(`No workspace exclusion changes for ${r}`);return}i[r]=s,await o.update("workspaceExclusionProfiles",i,P.ConfigurationTarget.Global),this._logger.info(`Saved workspace exclusions for ${r}`,s)}async getCombinedExclusions(e){let t=P.workspace.getConfiguration("explorerDates"),o=t.get("excludedFolders",[]),i=t.get("excludedPatterns",[]),r=t.get("smartExclusions",!0),s=[...o],n=[...i],c=await this.getWorkspaceExclusions(e);if(s.push(...c),r){let l=await this.analyzeWorkspace(e);l&&s.push(...l.suggestedExclusions)}return s=[...new Set(s)],n=[...new Set(n)],{folders:s,patterns:n}}_getWorkspaceKey(e){if(!e)return"unknown-workspace";let t=e.fsPath||e.path||"";return Co(t)||$e(t)}async suggestExclusions(e){let t=await this.analyzeWorkspace(e),o=this._dedupeList(t?.suggestedExclusions||[]);if(!t||o.length===0)return;let i=await this.getWorkspaceExclusions(e),r=o.filter(l=>!i.includes(l));if(r.length===0){this._logger.debug("No new smart exclusions detected",{workspace:this._getWorkspaceKey(e)});return}let s=this._mergeExclusions(i,r);await this.saveWorkspaceExclusions(e,s);let n=r.length===1?`Explorer Dates automatically excluded "${r[0]}" to keep Explorer responsive.`:`Explorer Dates automatically excluded ${r.length} folders to keep Explorer responsive.`,c=await P.window.showInformationMessage(`${n} Keep these exclusions?`,"Keep","Review","Revert");c==="Revert"?(await this.saveWorkspaceExclusions(e,i),P.window.showInformationMessage("Smart exclusions reverted. Decorations will refresh for the restored folders."),this._logger.info("User reverted smart exclusions",{reverted:r})):c==="Review"?(this._showExclusionReview(t),this._logger.info("User reviewing smart exclusions",{pending:r})):this._logger.info("User kept smart exclusions",{accepted:r})}_dedupeList(e=[]){return Array.from(new Set(e.filter(Boolean)))}_mergeExclusions(e=[],t=[]){return this._dedupeList([...e||[],...t||[]])}_areListsEqual(e=[],t=[]){return e.length!==t.length?!1:e.every((o,i)=>o===t[i])}_showExclusionReview(e){let t=P.window.createWebviewPanel("exclusionReview","Smart Exclusion Review",P.ViewColumn.One,{enableScripts:!0});t.webview.html=this._generateReviewHTML(e)}_generateReviewHTML(e){let t=d(i=>{if(i<1024)return`${i} B`;let r=i/1024;return r<1024?`${r.toFixed(1)} KB`:`${(r/1024).toFixed(1)} MB`},"formatSize"),o=e.detectedPatterns.map(i=>`
            <tr>
                <td>${i.name}</td>
                <td>${i.path}</td>
                <td>${t(i.size)}</td>
                <td>${i.type}</td>
                <td>
                    <input type="checkbox" ${e.suggestedExclusions.includes(i.name)?"checked":""}>
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
                        ${o}
                    </tbody>
                </table>
            </body>
            </html>
        `}};d(Me,"SmartExclusionManager");var Ee=Me;gt.exports={SmartExclusionManager:Ee}});var mt=S((Ni,ft)=>{var K=require("vscode"),{getLogger:xo}=M(),Ae=class Ae{constructor(){this._logger=xo(),this._processingQueue=[],this._isProcessing=!1,this._batchSize=50,this._processedCount=0,this._totalCount=0,this._statusBar=null,this._configurationWatcher=null,this._metrics={totalBatches:0,averageBatchTime:0,totalProcessingTime:0},this._logger.info("BatchProcessor initialized")}initialize(){let e=K.workspace.getConfiguration("explorerDates");this._batchSize=e.get("batchSize",50),this._statusBar=K.window.createStatusBarItem(K.StatusBarAlignment.Left,-1e3),this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=K.workspace.onDidChangeConfiguration(t=>{t.affectsConfiguration("explorerDates.batchSize")&&(this._batchSize=K.workspace.getConfiguration("explorerDates").get("batchSize",50),this._logger.debug(`Batch size updated to: ${this._batchSize}`))})}queueForProcessing(e,t,o={}){let i={id:Date.now()+Math.random(),uris:Array.isArray(e)?e:[e],processor:t,priority:o.priority||"normal",background:o.background||!1,onProgress:o.onProgress,onComplete:o.onComplete};return i.priority==="high"?this._processingQueue.unshift(i):this._processingQueue.push(i),this._logger.debug(`Queued batch ${i.id} with ${i.uris.length} URIs`),this._isProcessing||this._startProcessing(),i.id}async _startProcessing(){if(this._isProcessing)return;this._isProcessing=!0,this._processedCount=0,this._totalCount=this._processingQueue.reduce((t,o)=>t+o.uris.length,0),this._logger.info(`Starting batch processing: ${this._totalCount} items in ${this._processingQueue.length} batches`),this._updateStatusBar();let e=Date.now();try{for(;this._processingQueue.length>0;){let t=this._processingQueue.shift();await this._processBatch(t),t.background||await this._sleep(1)}}catch(t){this._logger.error("Batch processing failed",t)}finally{this._isProcessing=!1,this._hideStatusBar();let t=Date.now()-e;this._updateMetrics(t),this._logger.info(`Batch processing completed in ${t}ms`)}}async _processBatch(e){let t=Date.now();this._logger.debug(`Processing batch ${e.id} with ${e.uris.length} URIs`);try{let o=this._chunkArray(e.uris,this._batchSize);for(let i=0;i<o.length;i++){let r=o[i],s=[];for(let n of r){try{let c=await e.processor(n);s.push({uri:n,result:c,success:!0}),this._processedCount++}catch(c){s.push({uri:n,error:c,success:!1}),this._processedCount++,this._logger.debug(`Failed to process ${n.fsPath}`,c)}this._updateStatusBar(),e.onProgress&&e.onProgress({processed:this._processedCount,total:this._totalCount,current:n})}await this._sleep(0),!e.background&&i<o.length-1&&await this._sleep(5)}e.onComplete&&e.onComplete({processed:e.uris.length,success:!0,duration:Date.now()-t})}catch(o){this._logger.error(`Batch ${e.id} processing failed`,o),e.onComplete&&e.onComplete({processed:0,success:!1,error:o,duration:Date.now()-t})}this._metrics.totalBatches++}async processDirectoryProgressively(e,t,o={}){let i=o.maxFiles||1e3;try{let r=new K.RelativePattern(e,"**/*"),s=await K.workspace.findFiles(r,null,i);if(s.length===0){this._logger.debug(`No files found in directory: ${e.fsPath}`);return}return this._logger.info(`Processing directory progressively: ${s.length} files in ${e.fsPath}`),this.queueForProcessing(s,t,{priority:"normal",background:!0,...o})}catch(r){throw this._logger.error("Progressive directory processing failed",r),r}}async refreshInBackground(e,t,o={}){return this.queueForProcessing(e,t,{background:!0,priority:"low",...o})}async refreshVisible(e,t,o={}){return this.queueForProcessing(e,t,{background:!1,priority:"high",...o})}_chunkArray(e,t){let o=[];for(let i=0;i<e.length;i+=t)o.push(e.slice(i,i+t));return o}_sleep(e){return new Promise(t=>setTimeout(t,e))}_updateStatusBar(){if(!this._statusBar)return;let e=this._totalCount>0?Math.round(this._processedCount/this._totalCount*100):0;this._statusBar.text=`$(sync~spin) Processing files... ${e}% (${this._processedCount}/${this._totalCount})`,this._statusBar.tooltip="Explorer Dates is processing file decorations",this._statusBar.show()}_hideStatusBar(){this._statusBar&&this._statusBar.hide()}_updateMetrics(e){this._metrics.totalProcessingTime+=e,this._metrics.totalBatches>0&&(this._metrics.averageBatchTime=this._metrics.totalProcessingTime/this._metrics.totalBatches)}getMetrics(){return{...this._metrics,isProcessing:this._isProcessing,queueLength:this._processingQueue.length,currentProgress:this._totalCount>0?this._processedCount/this._totalCount:0}}cancelAll(){this._processingQueue.length=0,this._hideStatusBar(),this._logger.info("All batch processing cancelled")}cancelBatch(e){let t=this._processingQueue.findIndex(o=>o.id===e);if(t!==-1){let o=this._processingQueue.splice(t,1)[0];return this._logger.debug(`Cancelled batch ${e} with ${o.uris.length} URIs`),!0}return!1}dispose(){this.cancelAll(),this._statusBar&&this._statusBar.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("BatchProcessor disposed",this.getMetrics())}};d(Ae,"BatchProcessor");var Pe=Ae;ft.exports={BatchProcessor:Pe}});var ae=S((ji,wt)=>{var Do=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],So={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"};wt.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:Do,GLOBAL_STATE_KEYS:So}});var Ct=S((Gi,yt)=>{var vt=require("vscode"),{getLogger:Fo}=M(),{fileSystem:To}=H(),{GLOBAL_STATE_KEYS:bt,DEFAULT_PERSISTENT_CACHE_TTL:_t}=ae(),Re=class Re{constructor(e){this._logger=Fo(),this._context=e,this._memoryCache=new Map,this._maxMemoryUsage=50*1024*1024,this._currentMemoryUsage=0,this._persistentCacheEnabled=!0,this._storage=e?.globalState||null,this._storageKey=bt.ADVANCED_CACHE,this._metadataKey=bt.ADVANCED_CACHE_METADATA,this._fs=To,this._configurationWatcher=null,this._metrics={memoryHits:0,memoryMisses:0,diskHits:0,diskMisses:0,evictions:0,persistentLoads:0,persistentSaves:0},this._cleanupInterval=null,this._saveInterval=null,this._logger.info("AdvancedCache initialized")}async initialize(){try{await this._loadConfiguration(),this._persistentCacheEnabled&&await this._loadPersistentCache(),this._startIntervals(),this._logger.info("Advanced cache system initialized",{persistentEnabled:this._persistentCacheEnabled&&!!this._storage,maxMemoryUsage:this._maxMemoryUsage,storage:this._storage?"globalState":"memory-only"})}catch(e){this._logger.error("Failed to initialize cache system",e)}}async _loadConfiguration(){let e=vt.workspace.getConfiguration("explorerDates");this._persistentCacheEnabled=e.get("persistentCache",!0),this._maxMemoryUsage=e.get("maxMemoryUsage",50)*1024*1024,this._ensureConfigurationWatcher()}_ensureConfigurationWatcher(){this._configurationWatcher||(this._configurationWatcher=vt.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.persistentCache")||e.affectsConfiguration("explorerDates.maxMemoryUsage"))&&this._loadConfiguration()}))}_createCacheEntry(e,t={}){let o=Date.now();return{value:e,size:t.size??this._estimateSize(e),ttl:t.ttl??_t,tags:t.tags&&t.tags.length>0?[...t.tags]:void 0,version:t.version??1,timestamp:t.timestamp??o,lastAccess:t.lastAccess??o}}_touchEntry(e){e.lastAccess=Date.now()}_serializeMetadata(e){return{ts:e.timestamp,la:e.lastAccess,ttl:e.ttl,sz:e.size,tg:e.tags,v:e.version}}_normalizePersistedMetadata(e){return e?{timestamp:e.timestamp??e.ts??Date.now(),lastAccess:e.lastAccess??e.la??Date.now(),ttl:e.ttl??e.tt??_t,size:e.size??e.sz,tags:e.tags??e.tg,version:e.version??e.v??1}:null}_hydratePersistedEntry(e){if(!e)return null;let t=this._normalizePersistedMetadata(e.metadata||e.meta);return t?this._createCacheEntry(e.data??e.value,t):null}_serializeEntry(e){return{data:e.value,metadata:this._serializeMetadata(e)}}async get(e){let t=this._memoryCache.get(e);if(t){if(this._isValid(t))return this._metrics.memoryHits++,this._touchEntry(t),t.value;this._removeFromMemory(e)}if(this._metrics.memoryMisses++,this._persistentCacheEnabled){let o=await this._getFromPersistentCache(e);if(o)return this._addToMemory(e,o),this._metrics.diskHits++,o.value}return this._metrics.diskMisses++,null}async set(e,t,o={}){let i=this._createCacheEntry(t,{ttl:o.ttl,tags:o.tags,version:o.version});this._addToMemory(e,i),this._persistentCacheEnabled&&this._schedulePersistentSave()}_addToMemory(e,t){this._currentMemoryUsage+t.size>this._maxMemoryUsage&&this._evictOldestItems(t.size),this._memoryCache.has(e)&&this._removeFromMemory(e),this._memoryCache.set(e,t),this._currentMemoryUsage+=t.size,this._logger.debug(`Added to cache: ${e} (${t.size} bytes)`)}_removeFromMemory(e){let t=this._memoryCache.get(e);t&&(this._memoryCache.delete(e),this._currentMemoryUsage-=t.size)}_evictOldestItems(e){let t=Array.from(this._memoryCache.entries());t.sort((i,r)=>i[1].lastAccess-r[1].lastAccess);let o=0;for(let[i,r]of t)if(this._removeFromMemory(i),o+=r.size,this._metrics.evictions++,o>=e)break;this._logger.debug(`Evicted items to free ${o} bytes`)}_isValid(e){return e?Date.now()-e.timestamp<e.ttl:!1}_estimateSize(e){switch(typeof e){case"string":return e.length*2;case"number":return 8;case"boolean":return 4;case"object":return e===null?4:JSON.stringify(e).length*2;default:return 100}}async _loadPersistentCache(){if(!this._storage){let e=this._fs.isWeb?"web":"desktop";this._logger.debug(`Persistent storage unavailable in ${e} environment - running in memory-only mode`);return}try{let e=this._storage.get(this._storageKey,{}),t=0,o=0;for(let[i,r]of Object.entries(e)){let s=this._hydratePersistedEntry(r);if(s&&this._isValid(s)){this._addToMemory(i,s),t++;continue}o++}this._metrics.persistentLoads++,this._logger.info(`Loaded persistent cache: ${t} items (${o} expired)`)}catch(e){this._logger.error("Failed to load persistent cache from globalState",e)}}async _savePersistentCache(){if(!(!this._persistentCacheEnabled||!this._storage))try{let e={};for(let[t,o]of this._memoryCache.entries())this._isValid(o)&&(e[t]=this._serializeEntry(o));await this._storage.update(this._storageKey,e),this._metrics.persistentSaves++,this._logger.debug(`Saved persistent cache: ${Object.keys(e).length} items`)}catch(e){this._logger.error("Failed to save persistent cache to globalState",e)}}async _getFromPersistentCache(e){if(!this._storage)return null;let o=this._storage.get(this._storageKey,{})[e],i=this._hydratePersistedEntry(o);return i&&this._isValid(i)?i:null}_schedulePersistentSave(){this._storage&&(this._saveTimeout&&clearTimeout(this._saveTimeout),this._saveTimeout=setTimeout(()=>{this._savePersistentCache()},5e3))}_startIntervals(){this._cleanupInterval=setInterval(()=>{this._cleanupExpiredItems()},300*1e3),this._storage&&this._persistentCacheEnabled&&(this._saveInterval=setInterval(()=>{this._savePersistentCache()},600*1e3))}_cleanupExpiredItems(){let e=[];for(let[t,o]of this._memoryCache.entries())this._isValid(o)||e.push(t);for(let t of e)this._removeFromMemory(t);e.length>0&&this._logger.debug(`Cleaned up ${e.length} expired cache items`)}invalidateByTags(e){let t=[];for(let[o,i]of this._memoryCache.entries())i.tags&&i.tags.some(r=>e.includes(r))&&t.push(o);for(let o of t)this._removeFromMemory(o);this._logger.debug(`Invalidated ${t.length} items by tags:`,e)}invalidateByPattern(e){let t=[],o=new RegExp(e);for(let i of this._memoryCache.keys())o.test(i)&&t.push(i);for(let i of t)this._removeFromMemory(i);this._logger.debug(`Invalidated ${t.length} items by pattern: ${e}`)}clear(){this._memoryCache.clear(),this._currentMemoryUsage=0,this._logger.info("Cache cleared")}getStats(){let e=this._metrics.memoryHits+this._metrics.memoryMisses>0?(this._metrics.memoryHits/(this._metrics.memoryHits+this._metrics.memoryMisses)*100).toFixed(2):"0",t=this._metrics.diskHits+this._metrics.diskMisses>0?(this._metrics.diskHits/(this._metrics.diskHits+this._metrics.diskMisses)*100).toFixed(2):"0";return{...this._metrics,memoryItems:this._memoryCache.size,memoryUsage:this._currentMemoryUsage,memoryUsagePercent:(this._currentMemoryUsage/this._maxMemoryUsage*100).toFixed(2),memoryHitRate:`${e}%`,diskHitRate:`${t}%`,persistentEnabled:this._persistentCacheEnabled}}async dispose(){this._cleanupInterval&&clearInterval(this._cleanupInterval),this._saveInterval&&clearInterval(this._saveInterval),this._saveTimeout&&clearTimeout(this._saveTimeout),this._persistentCacheEnabled&&this._storage&&await this._savePersistentCache(),this.clear(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("Advanced cache disposed",this.getStats())}};d(Re,"AdvancedCache");var Ie=Re;yt.exports={AdvancedCache:Ie}});var Dt=S((qi,xt)=>{var p=require("vscode"),{getLogger:ko}=M(),{getExtension:$o}=B(),Le=class Le{constructor(){this._logger=ko(),this._currentThemeKind=p.window.activeColorTheme.kind,this._themeChangeListeners=[],this._setupThemeChangeDetection(),this._logger.info("ThemeIntegrationManager initialized",{currentTheme:this._getThemeKindName(this._currentThemeKind)})}_setupThemeChangeDetection(){p.window.onDidChangeActiveColorTheme(e=>{let t=this._currentThemeKind;this._currentThemeKind=e.kind,this._logger.debug("Theme changed",{from:this._getThemeKindName(t),to:this._getThemeKindName(e.kind)}),this._themeChangeListeners.forEach(o=>{try{o(e,t)}catch(i){this._logger.error("Theme change listener failed",i)}})})}_getThemeKindName(e){switch(e){case p.ColorThemeKind.Light:return"Light";case p.ColorThemeKind.Dark:return"Dark";case p.ColorThemeKind.HighContrast:return"High Contrast";default:return"Unknown"}}onThemeChange(e){return this._themeChangeListeners.push(e),{dispose:d(()=>{let t=this._themeChangeListeners.indexOf(e);t!==-1&&this._themeChangeListeners.splice(t,1)},"dispose")}}getAdaptiveColors(){let e=this._currentThemeKind===p.ColorThemeKind.Light;return this._currentThemeKind===p.ColorThemeKind.HighContrast?this._getHighContrastColors():e?this._getLightThemeColors():this._getDarkThemeColors()}_getLightThemeColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("list.warningForeground"),old:new p.ThemeColor("list.errorForeground"),javascript:new p.ThemeColor("symbolIcon.functionForeground"),css:new p.ThemeColor("symbolIcon.colorForeground"),html:new p.ThemeColor("symbolIcon.snippetForeground"),json:new p.ThemeColor("symbolIcon.stringForeground"),markdown:new p.ThemeColor("symbolIcon.textForeground"),python:new p.ThemeColor("symbolIcon.classForeground"),subtle:new p.ThemeColor("list.inactiveSelectionForeground"),muted:new p.ThemeColor("list.deemphasizedForeground"),emphasis:new p.ThemeColor("list.highlightForeground")}}_getDarkThemeColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("charts.yellow"),old:new p.ThemeColor("charts.red"),javascript:new p.ThemeColor("symbolIcon.functionForeground"),css:new p.ThemeColor("charts.purple"),html:new p.ThemeColor("charts.orange"),json:new p.ThemeColor("symbolIcon.stringForeground"),markdown:new p.ThemeColor("charts.yellow"),python:new p.ThemeColor("symbolIcon.classForeground"),subtle:new p.ThemeColor("list.inactiveSelectionForeground"),muted:new p.ThemeColor("list.deemphasizedForeground"),emphasis:new p.ThemeColor("list.highlightForeground")}}_getHighContrastColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("list.warningForeground"),old:new p.ThemeColor("list.errorForeground"),javascript:new p.ThemeColor("list.highlightForeground"),css:new p.ThemeColor("list.warningForeground"),html:new p.ThemeColor("list.errorForeground"),json:new p.ThemeColor("list.highlightForeground"),markdown:new p.ThemeColor("list.warningForeground"),python:new p.ThemeColor("list.errorForeground"),subtle:new p.ThemeColor("list.highlightForeground"),muted:new p.ThemeColor("list.inactiveSelectionForeground"),emphasis:new p.ThemeColor("list.focusHighlightForeground")}}getColorForContext(e,t="normal"){let o=this.getAdaptiveColors();switch(e){case"success":case"recent":return t==="subtle"?o.subtle:o.veryRecent;case"warning":case"medium":return t==="subtle"?o.muted:o.recent;case"error":case"old":return t==="subtle"?o.emphasis:o.old;case"javascript":case"typescript":return o.javascript;case"css":case"scss":case"less":return o.css;case"html":case"xml":return o.html;case"json":case"yaml":return o.json;case"markdown":case"text":return o.markdown;case"python":return o.python;default:return t==="subtle"?o.muted:o.subtle}}applyThemeAwareColorScheme(e,t="",o=0){if(e==="none")return;if(e==="adaptive")return this._getAdaptiveColorForFile(t,o);let i=this.getAdaptiveColors();switch(e){case"recency":return o<36e5?i.veryRecent:o<864e5?i.recent:i.old;case"file-type":return this._getFileTypeColor(t);case"subtle":return o<36e5?i.subtle:o<6048e5?i.muted:i.emphasis;case"vibrant":return this._getVibrantSelectionAwareColor(o);case"custom":return o<36e5?new p.ThemeColor("explorerDates.customColor.veryRecent"):o<864e5?new p.ThemeColor("explorerDates.customColor.recent"):new p.ThemeColor("explorerDates.customColor.old");default:return}}_getVibrantSelectionAwareColor(e){return e<36e5?new p.ThemeColor("list.highlightForeground"):e<864e5?new p.ThemeColor("list.warningForeground"):new p.ThemeColor("list.errorForeground")}_getAdaptiveColorForFile(e,t){let o=this._getFileTypeColor(e);if(o)return o;let i=this.getAdaptiveColors();return t<36e5?i.veryRecent:t<864e5?i.recent:i.old}_getFileTypeColor(e){let t=$o(e),o=this.getAdaptiveColors();return[".js",".ts",".jsx",".tsx",".mjs"].includes(t)?o.javascript:[".css",".scss",".sass",".less",".stylus"].includes(t)?o.css:[".html",".htm",".xml",".svg"].includes(t)?o.html:[".json",".yaml",".yml",".toml"].includes(t)?o.json:[".md",".markdown",".txt",".rst"].includes(t)?o.markdown:[".py",".pyx",".pyi"].includes(t)?o.python:null}getSuggestedColorScheme(){switch(this._currentThemeKind){case p.ColorThemeKind.Light:return"vibrant";case p.ColorThemeKind.Dark:return"recency";case p.ColorThemeKind.HighContrast:return"none";default:return"recency"}}getIconThemeIntegration(){return{iconTheme:p.workspace.getConfiguration("workbench").get("iconTheme"),suggestions:{"vs-seti":{recommendedColorScheme:"file-type",description:"File-type colors complement Seti icons perfectly"},"material-icon-theme":{recommendedColorScheme:"subtle",description:"Subtle colors work well with Material icons"},"vscode-icons":{recommendedColorScheme:"recency",description:"Recency-based colors pair nicely with VS Code icons"}}}}async autoConfigureForTheme(){try{let e=p.workspace.getConfiguration("explorerDates"),t=e.get("colorScheme","none");if(t==="none"||t==="auto"){let o=this.getSuggestedColorScheme();await e.update("colorScheme",o,p.ConfigurationTarget.Global),this._logger.info(`Auto-configured color scheme for ${this._getThemeKindName(this._currentThemeKind)} theme: ${o}`),await p.window.showInformationMessage(`Explorer Dates adapted to your ${this._getThemeKindName(this._currentThemeKind)} theme`,"Customize","OK")==="Customize"&&await p.commands.executeCommand("workbench.action.openSettings","explorerDates.colorScheme")}}catch(e){this._logger.error("Failed to auto-configure for theme",e)}}getCurrentThemeInfo(){return{kind:this._currentThemeKind,kindName:this._getThemeKindName(this._currentThemeKind),isLight:this._currentThemeKind===p.ColorThemeKind.Light,isDark:this._currentThemeKind===p.ColorThemeKind.Dark,isHighContrast:this._currentThemeKind===p.ColorThemeKind.HighContrast,suggestedColorScheme:this.getSuggestedColorScheme(),adaptiveColors:this.getAdaptiveColors()}}dispose(){this._themeChangeListeners.length=0,this._logger.info("ThemeIntegrationManager disposed")}};d(Le,"ThemeIntegrationManager");var ze=Le;xt.exports={ThemeIntegrationManager:ze}});var Ft=S((Ki,St)=>{var L=require("vscode"),{getLogger:Eo}=M(),{getLocalization:Mo}=se(),{getFileName:Po}=B(),Oe=class Oe{constructor(){this._logger=Eo(),this._l10n=Mo(),this._isAccessibilityMode=!1,this._keyboardNavigationEnabled=!0,this._focusIndicators=new Map,this._configurationWatcher=null,this._loadConfiguration(),this._setupConfigurationListener(),this._logger.info("AccessibilityManager initialized",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled})}_loadConfiguration(){let e=L.workspace.getConfiguration("explorerDates");this._isAccessibilityMode=e.get("accessibilityMode",!1),!e.has("accessibilityMode")&&this._detectScreenReader()&&this._logger.info("Screen reader detected - consider enabling accessibility mode in settings"),this._keyboardNavigationEnabled=e.get("keyboardNavigation",!0)}_setupConfigurationListener(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=L.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.accessibilityMode")||e.affectsConfiguration("explorerDates.keyboardNavigation"))&&(this._loadConfiguration(),this._logger.debug("Accessibility configuration updated",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled}))})}getAccessibleTooltip(e,t,o,i,r=null){if(!this._isAccessibilityMode)return null;let s=Po(e),n=this._formatAccessibleDate(t),c=this._formatAccessibleDate(o),l=`File: ${s}. `;return l+=`Last modified: ${n}. `,l+=`Created: ${c}. `,i!==void 0&&(l+=`Size: ${this._formatAccessibleFileSize(i)}. `),r&&r.authorName&&(l+=`Last modified by: ${r.authorName}. `),l+=`Full path: ${e}`,l}_formatAccessibleDate(e){let o=new Date().getTime()-e.getTime(),i=Math.floor(o/(1e3*60)),r=Math.floor(o/(1e3*60*60)),s=Math.floor(o/(1e3*60*60*24));return i<1?"just now":i<60?`${i} ${i===1?"minute":"minutes"} ago`:r<24?`${r} ${r===1?"hour":"hours"} ago`:s<7?`${s} ${s===1?"day":"days"} ago`:e.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}_formatAccessibleFileSize(e){if(e<1024)return`${e} bytes`;let t=e/1024;if(t<1024)return`${Math.round(t)} kilobytes`;let o=t/1024;return`${Math.round(o*10)/10} megabytes`}getAccessibleBadge(e){if(!this._isAccessibilityMode)return e;let t=e.split("|"),o=t[0],i=t[1],r=t.length>2?t[2]:null,s=this._expandTimeAbbreviation(o);return i&&(s+=` ${this._expandSizeAbbreviation(i)}`),r&&(s+=` by ${r.replace("\u2022","")}`),s}_expandTimeAbbreviation(e){let t={m:" minutes ago",h:" hours ago",d:" days ago",w:" weeks ago",mo:" months ago",yr:" years ago",min:" minutes ago",hrs:" hours ago",day:" days ago",wk:" weeks ago"},o=e;for(let[i,r]of Object.entries(t))if(e.endsWith(i)){o=e.slice(0,-i.length)+r;break}return o}_expandSizeAbbreviation(e){if(!e.startsWith("~"))return e;let t=e.slice(1);return t.endsWith("B")?t.slice(0,-1)+" bytes":t.endsWith("K")?t.slice(0,-1)+" kilobytes":t.endsWith("M")?t.slice(0,-1)+" megabytes":t}createFocusIndicator(e,t){if(!this._keyboardNavigationEnabled)return null;let o=Math.random().toString(36).substr(2,9);return this._focusIndicators.set(o,{element:e,description:t,timestamp:Date.now()}),{id:o,dispose:d(()=>{this._focusIndicators.delete(o)},"dispose")}}announceToScreenReader(e,t="polite"){this._isAccessibilityMode&&(t==="assertive"?L.window.showWarningMessage(e):this._logger.debug("Screen reader announcement",{message:e,priority:t}))}getKeyboardShortcutHelp(){return[{key:"Ctrl+Shift+D (Cmd+Shift+D)",command:"Toggle date decorations",description:"Show or hide file modification times in Explorer"},{key:"Ctrl+Shift+C (Cmd+Shift+C)",command:"Copy file date",description:"Copy selected file's modification date to clipboard"},{key:"Ctrl+Shift+I (Cmd+Shift+I)",command:"Show file details",description:"Display detailed information about selected file"},{key:"Ctrl+Shift+R (Cmd+Shift+R)",command:"Refresh decorations",description:"Refresh all file modification time decorations"},{key:"Ctrl+Shift+A (Cmd+Shift+A)",command:"Show workspace activity",description:"Open workspace file activity analysis"},{key:"Ctrl+Shift+F (Cmd+Shift+F)",command:"Toggle fade old files",description:"Toggle fading effect for old files"}]}async showKeyboardShortcutsHelp(){let e=this.getKeyboardShortcutHelp();await L.window.showInformationMessage("Keyboard shortcuts help available in output panel","Show Shortcuts").then(t=>{if(t==="Show Shortcuts"){let o=L.window.createOutputChannel("Explorer Dates Shortcuts");o.appendLine("Explorer Dates Keyboard Shortcuts"),o.appendLine("====================================="),o.appendLine(""),e.forEach(i=>{o.appendLine(`${i.key}`),o.appendLine(`  Command: ${i.command}`),o.appendLine(`  Description: ${i.description}`),o.appendLine("")}),o.show()}})}shouldEnhanceAccessibility(){return this._isAccessibilityMode||this._detectScreenReader()}_detectScreenReader(){return L.workspace.getConfiguration("editor").get("accessibilitySupport")==="on"}getAccessibilityRecommendations(){let e=[];return this._detectScreenReader()&&(e.push({type:"setting",setting:"explorerDates.accessibilityMode",value:!0,reason:"Enable enhanced tooltips and screen reader optimizations"}),e.push({type:"setting",setting:"explorerDates.colorScheme",value:"none",reason:"Colors may not be useful with screen readers"}),e.push({type:"setting",setting:"explorerDates.dateDecorationFormat",value:"relative-long",reason:"Longer format is more descriptive for screen readers"})),L.window.activeColorTheme.kind===L.ColorThemeKind.HighContrast&&e.push({type:"setting",setting:"explorerDates.highContrastMode",value:!0,reason:"Optimize for high contrast themes"}),e}async applyAccessibilityRecommendations(){let e=this.getAccessibilityRecommendations();if(e.length===0){L.window.showInformationMessage("No accessibility recommendations at this time.");return}let t=L.workspace.getConfiguration("explorerDates"),o=0;for(let i of e)if(i.type==="setting")try{await t.update(i.setting.replace("explorerDates.",""),i.value,L.ConfigurationTarget.Global),o++,this._logger.info(`Applied accessibility recommendation: ${i.setting} = ${i.value}`)}catch(r){this._logger.error(`Failed to apply recommendation: ${i.setting}`,r)}o>0&&L.window.showInformationMessage(`Applied ${o} accessibility recommendations. Restart may be required for all changes to take effect.`)}dispose(){this._focusIndicators.clear(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("AccessibilityManager disposed")}};d(Oe,"AccessibilityManager");var We=Oe;St.exports={AccessibilityManager:We}});var $t=S((Yi,kt)=>{var{MAX_BADGE_LENGTH:Tt}=ae();function Ao(a=0,e="auto"){let t=typeof a=="number"&&!Number.isNaN(a)?a:0;if(e==="bytes")return`~${t}B`;let o=t/1024;if(e==="kb")return`~${o.toFixed(1)}K`;let i=o/1024;return e==="mb"?`~${i.toFixed(1)}M`:t<1024?`~${t}B`:o<1024?`~${Math.round(o)}K`:`~${i.toFixed(1)}M`}d(Ao,"formatFileSize");function Io(a){if(a)return a.length>Tt?a.substring(0,Tt):a}d(Io,"trimBadge");kt.exports={formatFileSize:Ao,trimBadge:Io}});var It=S((Xi,At)=>{var f=require("vscode"),{getLogger:Ro}=M(),{getLocalization:zo}=se(),{fileSystem:Lo}=H(),{SmartExclusionManager:Wo}=pt(),{BatchProcessor:Oo}=mt(),{AdvancedCache:Bo}=Ct(),{ThemeIntegrationManager:No}=Dt(),{AccessibilityManager:Uo}=Ft(),{formatFileSize:jo,trimBadge:Et}=$t(),{getFileName:Be,getExtension:fe,getCacheKey:Go,normalizePath:we,getRelativePath:Ho,getUriPath:J}=B(),{DEFAULT_CACHE_TIMEOUT:Mt,DEFAULT_MAX_CACHE_SIZE:qo,MONTH_ABBREVIATIONS:Vo,GLOBAL_STATE_KEYS:Ko}=ae(),{isWebEnvironment:Jo}=Te(),me=3e4,q=d((a="")=>{let e=typeof a=="string"?a:J(a),t=we(e);return Be(t)||t||"unknown"},"describeFile"),Pt=!0,ne=null;if(!Pt)try{let{exec:a}=require("child_process"),{promisify:e}=require("util");ne=e(a)}catch{ne=null}var Ue=class Ue{constructor(){this._onDidChangeFileDecorations=new f.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event,this._decorationCache=new Map,this._decorationPool=new Map,this._decorationPoolOrder=[],this._decorationPoolStats={hits:0,misses:0},this._maxDecorationPoolSize=512,this._badgeFlyweightCache=new Map,this._badgeFlyweightOrder=[],this._badgeFlyweightLimit=2048,this._badgeFlyweightStats={hits:0,misses:0},this._readableDateFlyweightCache=new Map,this._readableDateFlyweightOrder=[],this._readableDateFlyweightLimit=2048,this._readableFlyweightStats={hits:0,misses:0},this._enableDecorationPool=process.env.EXPLORER_DATES_ENABLE_DECORATION_POOL!=="0",this._enableFlyweights=process.env.EXPLORER_DATES_ENABLE_FLYWEIGHTS!=="0",this._lightweightMode=process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE==="1",this._memorySheddingEnabled=process.env.EXPLORER_DATES_MEMORY_SHEDDING==="1",this._memorySheddingThresholdMB=Number(process.env.EXPLORER_DATES_MEMORY_SHED_THRESHOLD_MB||3),this._memorySheddingActive=!1,this._memoryBaselineMB=this._memorySheddingEnabled?this._safeHeapUsedMB():0,this._memoryShedCacheLimit=Number(process.env.EXPLORER_DATES_MEMORY_SHED_CACHE_LIMIT||1e3),this._memoryShedRefreshIntervalMs=Number(process.env.EXPLORER_DATES_MEMORY_SHED_REFRESH_MS||6e4),this._refreshIntervalOverride=null,this._forceCacheBypass=process.env.EXPLORER_DATES_FORCE_CACHE_BYPASS==="1",this._isWeb=Pt||Jo(),this._baselineDesktopCacheTimeout=Mt*4,this._maxDesktopCacheTimeout=this._baselineDesktopCacheTimeout,this._lastCacheTimeoutBoostLookups=0,this._maxCacheSize=qo,this._fileSystem=Lo,this._gitAvailable=!this._isWeb&&!!ne,this._gitWarningShown=!1,this._cacheKeyStats=new Map,this._logger=Ro(),this._l10n=zo(),this._smartExclusion=new Wo,this._batchProcessor=new Oo,this._progressiveLoadingJobs=new Set,this._progressiveLoadingEnabled=!1,this._advancedCache=null,this._configurationWatcher=null,this._gitCache=new Map,this._maxGitCacheEntries=1e3,this._themeIntegration=new No,this._accessibility=new Uo,this._stressLogOptions={profile:"stress",throttleKey:"decorations:request",throttleLimit:Number(process.env.EXPLORER_DATES_LOG_INFO_LIMIT||50)},this._metrics={totalDecorations:0,cacheHits:0,cacheMisses:0,errors:0,gitBlameTimeMs:0,gitBlameCalls:0,fileStatTimeMs:0,fileStatCalls:0},this._refreshTimer=null,this._refreshInterval=6e4,this._incrementalRefreshTimers=new Set,this._incrementalRefreshInProgress=!1,this._scheduledRefreshPending=!1;let e=f.workspace.getConfiguration("explorerDates"),t=e.get("cacheTimeout",me);this._hasCustomCacheTimeout=this._detectCacheTimeoutOverride(e,t),this._cacheTimeout=this._resolveCacheTimeout(t),this._performanceMode=e.get("performanceMode",!1),this._lightweightMode&&(this._performanceMode=!0),this._performanceMode||this._setupFileWatcher(),this._setupConfigurationWatcher(),this._performanceMode||this._setupPeriodicRefresh(),this._logger.info(`FileDateDecorationProvider initialized (performanceMode: ${this._performanceMode})`),this._forceCacheBypass&&this._logger.warn("Force cache bypass mode enabled - decoration caches will be skipped"),this._enableDecorationPool||this._logger.warn("Decoration pool disabled via EXPLORER_DATES_ENABLE_DECORATION_POOL=0"),this._enableFlyweights||this._logger.warn("Flyweight caches disabled via EXPLORER_DATES_ENABLE_FLYWEIGHTS=0"),this._lightweightMode&&this._logger.warn("Lightweight mode enabled via EXPLORER_DATES_LIGHTWEIGHT_MODE=1 (performanceMode forced on)"),this._memorySheddingEnabled&&this._logger.warn(`Memory shedding enabled (threshold ${this._memorySheddingThresholdMB} MB); will stretch refresh interval and shrink cache if exceeded.`),this._previewSettings=null,this._extensionContext=null}applyPreviewSettings(e){let t=!!this._previewSettings;e&&typeof e=="object"?(this._previewSettings=Object.assign({},e),this._logger.info("\u{1F504} Applied preview settings",this._previewSettings)):(this._previewSettings=null,this._logger.info("\u{1F504} Cleared preview settings"));let o=this._decorationCache.size;if(this._decorationCache.clear(),this._clearDecorationPool("preview-mode-change"),this._logger.info(`\u{1F5D1}\uFE0F Cleared memory cache (${o} items) for preview mode change`),this._advancedCache)try{typeof this._advancedCache.clear=="function"?(this._advancedCache.clear(),this._logger.info("\u{1F5D1}\uFE0F Cleared advanced cache for preview mode change")):this._logger.warn("\u26A0\uFE0F Advanced cache does not support clear operation")}catch(i){this._logger.warn("\u26A0\uFE0F Failed to clear advanced cache:",i.message)}this._previewSettings&&!t?this._logger.info("\u{1F3AD} Entered preview mode - caching disabled"):!this._previewSettings&&t&&this._logger.info("\u{1F3AD} Exited preview mode - caching re-enabled"),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Fired decoration refresh event for preview change")}async testDecorationProvider(){this._logger.info("\u{1F9EA} Testing decoration provider functionality...");let e=f.workspace.workspaceFolders;if(!e||e.length===0){this._logger.error("\u274C No workspace folders available for testing");return}let t=f.Uri.joinPath(e[0].uri,"package.json");try{let o=await this.provideFileDecoration(t);this._logger.info("\u{1F9EA} Test decoration result:",{file:"package.json",success:!!o,badge:o?.badge,hasTooltip:!!o?.tooltip,hasColor:!!o?.color}),this._onDidChangeFileDecorations.fire(t),this._logger.info("\u{1F504} Fired decoration change event for test file")}catch(o){this._logger.error("\u274C Test decoration failed:",o)}}forceRefreshAllDecorations(){this._logger.info("\u{1F504} Force refreshing ALL decorations..."),this._cancelIncrementalRefreshTimers(),this._decorationCache.clear(),this._clearDecorationPool("force-refresh"),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Triggered global decoration refresh")}startProviderCallMonitoring(){this._providerCallCount=0,this._providerCallFiles=new Set;let e=this.provideFileDecoration.bind(this);this.provideFileDecoration=async(t,o)=>{this._providerCallCount++;let i=J(t)||t?.toString(!0)||"unknown";return this._providerCallFiles.add(we(i)),this._logger.info(`\u{1F50D} Provider called ${this._providerCallCount} times for: ${q(t||i)}`),await e(t,o)},this._logger.info("\u{1F4CA} Started provider call monitoring")}getProviderCallStats(){return{totalCalls:this._providerCallCount||0,uniqueFiles:this._providerCallFiles?this._providerCallFiles.size:0,calledFiles:this._providerCallFiles?Array.from(this._providerCallFiles):[]}}_setupFileWatcher(){let e=f.workspace.createFileSystemWatcher("**/*");e.onDidChange(t=>this.refreshDecoration(t)),e.onDidCreate(t=>this.refreshDecoration(t)),e.onDidDelete(t=>this.clearDecoration(t)),this._fileWatcher=e}_setupPeriodicRefresh(){let e=f.workspace.getConfiguration("explorerDates"),t=e.get("badgeRefreshInterval",6e4),o=this._refreshIntervalOverride||t;if(this._refreshInterval=o,this._logger.info(`Setting up periodic refresh with interval: ${this._refreshInterval}ms`),this._refreshTimer&&(clearInterval(this._refreshTimer),this._refreshTimer=null),this._cancelIncrementalRefreshTimers(),!e.get("showDateDecorations",!0)){this._logger.info("Decorations disabled, skipping periodic refresh setup");return}this._refreshTimer=setInterval(()=>{if(this._incrementalRefreshInProgress){this._logger.debug("Periodic refresh skipped - incremental refresh already running");return}this._logger.debug("Periodic refresh triggered - scheduling incremental refresh"),this._scheduleIncrementalRefresh("periodic")},this._refreshInterval),this._logger.info("Periodic refresh timer started")}_resolveUriFromCacheEntry(e,t){if(t?.uri)return t.uri;if(!e)return null;try{return f.Uri.file(e)}catch(o){return this._logger.debug(`Failed to rebuild URI from cache key: ${e}`,o),null}}_cancelIncrementalRefreshTimers(){if(this._incrementalRefreshTimers?.size){for(let e of this._incrementalRefreshTimers)clearTimeout(e);this._incrementalRefreshTimers.clear()}this._incrementalRefreshInProgress=!1}_scheduleIncrementalRefresh(e="manual"){if(this._scheduledRefreshPending){this._logger.debug(`Incremental refresh (${e}) skipped - refresh already pending`);return}this._incrementalRefreshInProgress&&(this._logger.debug(`Incremental refresh (${e}) already in progress, cancelling pending timers and rescheduling`),this._cancelIncrementalRefreshTimers());let t=Array.from(this._decorationCache.entries());if(t.length===0){this._logger.debug(`No cached decorations to refresh for ${e}, falling back to global refresh`),this._onDidChangeFileDecorations.fire(void 0);return}let o=t.map(([c,l])=>{let u=this._resolveUriFromCacheEntry(c,l);return u?{cacheKey:c,uri:u}:null}).filter(Boolean);if(o.length===0){this._logger.debug(`Failed to resolve URIs for ${e} incremental refresh, firing global refresh`),this._onDidChangeFileDecorations.fire(void 0);return}let i=40,r=Math.ceil(o.length/i),s=Math.min(4e3,Math.max(750,Math.floor(this._refreshInterval*.25))),n=r>1?Math.max(25,Math.floor(s/r)):0;this._incrementalRefreshInProgress=!0,this._scheduledRefreshPending=!0,this._logger.debug(`Incremental refresh (${e}) scheduled for ${o.length} items in ${r} batches (spacing: ${n}ms)`);for(let c=0;c<r;c++){let l=o.slice(c*i,(c+1)*i),u=c===0?0:n*c,h=setTimeout(()=>{try{l.forEach(({cacheKey:w,uri:g})=>{this._markCacheEntryForRefresh(w),this._onDidChangeFileDecorations.fire(g)})}finally{this._incrementalRefreshTimers.delete(h),this._incrementalRefreshTimers.size===0&&(this._incrementalRefreshInProgress=!1,this._scheduledRefreshPending=!1,this._logger.debug(`Incremental refresh (${e}) completed`))}},u);this._incrementalRefreshTimers.add(h)}}_markCacheEntryForRefresh(e){if(!e)return;let t=this._decorationCache.get(e);if(t){let o=Date.now()-t.timestamp;o>this._cacheTimeout*.75?(t.forceRefresh=!0,this._logger.debug(`Marked stale entry for refresh: ${e} (age: ${Math.round(o/1e3)}s)`)):this._logger.debug(`Skipped refresh for fresh entry: ${e} (age: ${Math.round(o/1e3)}s, threshold: ${Math.round(this._cacheTimeout*.75/1e3)}s)`)}if(this._advancedCache)try{let o=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this._advancedCache.invalidateByPattern(o)}catch(o){this._logger.debug(`Could not invalidate advanced cache for ${e}: ${o.message}`)}}_setupConfigurationWatcher(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=f.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration("explorerDates")){this._logger.debug("Configuration changed, updating settings");let t=f.workspace.getConfiguration("explorerDates"),o=t.get("cacheTimeout",me);if(this._hasCustomCacheTimeout=this._detectCacheTimeoutOverride(t,o),this._cacheTimeout=this._resolveCacheTimeout(o),this._maxCacheSize=t.get("maxCacheSize",1e4),e.affectsConfiguration("explorerDates.performanceMode")){let i=t.get("performanceMode",!1);i!==this._performanceMode&&(this._performanceMode=i,this._logger.info(`Performance mode changed to: ${i}`),i&&this._fileWatcher?(this._fileWatcher.dispose(),this._fileWatcher=null,this._logger.info("File watcher disabled for performance mode")):!i&&!this._fileWatcher&&(this._setupFileWatcher(),this._logger.info("File watcher enabled (performance mode off)")),i&&this._refreshTimer?(clearInterval(this._refreshTimer),this._refreshTimer=null,this._logger.info("Periodic refresh disabled for performance mode")):!i&&!this._refreshTimer&&(this._setupPeriodicRefresh(),this._logger.info("Periodic refresh enabled (performance mode off)")),this.refreshAll())}e.affectsConfiguration("explorerDates.badgeRefreshInterval")&&(this._refreshInterval=t.get("badgeRefreshInterval",6e4),this._logger.info(`Badge refresh interval updated to: ${this._refreshInterval}ms`),this._performanceMode||this._setupPeriodicRefresh()),(e.affectsConfiguration("explorerDates.showDateDecorations")||e.affectsConfiguration("explorerDates.dateDecorationFormat")||e.affectsConfiguration("explorerDates.excludedFolders")||e.affectsConfiguration("explorerDates.excludedPatterns")||e.affectsConfiguration("explorerDates.highContrastMode")||e.affectsConfiguration("explorerDates.fadeOldFiles")||e.affectsConfiguration("explorerDates.fadeThreshold")||e.affectsConfiguration("explorerDates.colorScheme")||e.affectsConfiguration("explorerDates.showGitInfo")||e.affectsConfiguration("explorerDates.customColors")||e.affectsConfiguration("explorerDates.showFileSize")||e.affectsConfiguration("explorerDates.fileSizeFormat"))&&this.refreshAll(),e.affectsConfiguration("explorerDates.progressiveLoading")&&this._applyProgressiveLoadingSetting().catch(i=>{this._logger.error("Failed to reconfigure progressive loading",i)}),e.affectsConfiguration("explorerDates.showDateDecorations")&&!this._performanceMode&&this._setupPeriodicRefresh()}})}_detectCacheTimeoutOverride(e,t){if(typeof t=="number"&&t!==me)return!0;if(!e||typeof e.inspect!="function")return!1;try{let o=e.inspect("cacheTimeout");if(!o)return!1;if(typeof o=="object"&&(typeof o.globalValue=="number"||typeof o.workspaceValue=="number"||typeof o.workspaceFolderValue=="number"))return!0;if(o.cacheTimeout&&typeof o.cacheTimeout=="object"){let i=o.cacheTimeout;if(typeof i.globalValue=="number"||typeof i.workspaceValue=="number"||typeof i.workspaceFolderValue=="number"){let s=i.globalValue??i.workspaceValue??i.workspaceFolderValue;return typeof s=="number"&&s!==me}}}catch{return!1}return!1}_resolveCacheTimeout(e){return this._isWeb||this._hasCustomCacheTimeout?e:Math.max(this._baselineDesktopCacheTimeout,e||this._baselineDesktopCacheTimeout)}_getGitCacheKey(e,t,o){let i=e||"unknown-workspace",r=t||"unknown-relative",s=Number.isFinite(o)?o:"unknown-mtime";return`${i}::${r}::${s}`}_getCachedGitInfo(e){let t=this._gitCache.get(e);return t?(t.lastAccess=Date.now(),t.value):null}_setCachedGitInfo(e,t){if(this._gitCache.size>=this._maxGitCacheEntries){let o=null,i=1/0;for(let[r,s]of this._gitCache.entries())s.lastAccess<i&&(i=s.lastAccess,o=r);o&&this._gitCache.delete(o)}this._gitCache.set(e,{value:t,lastAccess:Date.now()})}async _applyProgressiveLoadingSetting(){if(!this._batchProcessor)return;if(this._performanceMode){this._logger.info("Progressive loading disabled due to performance mode"),this._cancelProgressiveWarmupJobs(),this._progressiveLoadingEnabled=!1;return}let t=f.workspace.getConfiguration("explorerDates").get("progressiveLoading",!0);if(this._progressiveLoadingEnabled=t,!t){this._logger.info("Progressive loading disabled via explorerDates.progressiveLoading"),this._cancelProgressiveWarmupJobs();return}let o=f.workspace.workspaceFolders;!o||o.length===0||(this._cancelProgressiveWarmupJobs(),o.forEach(i=>{let r=this._batchProcessor.processDirectoryProgressively(i.uri,async s=>{try{await this.provideFileDecoration(s)}catch(n){this._logger.debug("Progressive warmup processor failed",n)}},{background:!0,priority:"low",maxFiles:500});r&&this._progressiveLoadingJobs.add(r)}),this._logger.info(`Progressive loading queued for ${o.length} workspace folder(s).`))}_cancelProgressiveWarmupJobs(){if(!(!this._progressiveLoadingJobs||this._progressiveLoadingJobs.size===0)){if(this._batchProcessor)for(let e of this._progressiveLoadingJobs)this._batchProcessor.cancelBatch(e);this._progressiveLoadingJobs.clear()}}refreshDecoration(e){let t=this._getCacheKey(e);if(this._decorationCache.delete(t),this._advancedCache)try{this._advancedCache.invalidateByPattern(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}catch(o){this._logger.debug(`Could not invalidate advanced cache for ${q(e)}: ${o.message}`)}this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F504} Refreshed decoration cache for: ${q(e)}`)}clearDecoration(e){let t=this._getCacheKey(e);this._decorationCache.delete(t),this._advancedCache&&this._logger.debug(`Advanced cache entry will expire naturally: ${q(e)}`),this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F5D1}\uFE0F Cleared decoration cache for: ${q(e)}`)}clearAllCaches(){this._cancelIncrementalRefreshTimers();let e=this._decorationCache.size;this._decorationCache.clear(),this._clearDecorationPool("clearAllCaches"),this._logger.info(`Cleared memory cache (was ${e} items)`),this._advancedCache&&(this._advancedCache.clear(),this._logger.info("Cleared advanced cache")),this._metrics.cacheHits=0,this._metrics.cacheMisses=0,this._logger.info("All caches cleared successfully")}refreshAll(){this._cancelIncrementalRefreshTimers(),this._decorationCache.clear(),this._clearDecorationPool("refreshAll"),this._gitCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("All decorations refreshed with cache clear")}async _isExcludedSimple(e){let t=f.workspace.getConfiguration("explorerDates"),o=J(e);if(!o)return!1;let i=we(o),r=Be(i),s=fe(o),n=t.get("forceShowForFileTypes",[]);if(n.length>0&&n.includes(s))return this._logger.debug(`File type ${s} is forced to show: ${o}`),!1;let c=t.get("enableTroubleShootingMode",!1);c&&this._logger.info(`\u{1F50D} Checking exclusion for: ${r} (ext: ${s})`);let l=t.get("excludedFolders",["node_modules",".git","dist","build","out",".vscode-test"]),u=t.get("excludedPatterns",["**/*.tmp","**/*.log","**/.git/**","**/node_modules/**"]);for(let h of l){let w=h.replace(/^\/+|\/+$/g,"");if(i.includes(`/${w}/`)||i.endsWith(`/${w}`))return c?this._logger.info(`\u274C File excluded by folder: ${o} (${h})`):this._logger.debug(`File excluded by folder: ${o} (${h})`),!0}for(let h of u)if(h.includes("node_modules")&&i.includes("/node_modules/")||h.includes(".git/**")&&i.includes("/.git/")||h.includes("*.tmp")&&r.endsWith(".tmp")||h.includes("*.log")&&r.endsWith(".log"))return!0;return c&&this._logger.info(`\u2705 File NOT excluded: ${r} (ext: ${s})`),!1}async _isExcluded(e){let t=f.workspace.getConfiguration("explorerDates"),o=J(e);if(!o)return!1;let i=we(o),r=Be(i),s=f.workspace.getWorkspaceFolder(e);if(s){let n=await this._smartExclusion.getCombinedExclusions(s.uri);for(let c of n.folders)if(new RegExp(`(^|/)${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(i))return this._logger.debug(`File excluded by folder rule: ${o} (folder: ${c})`),!0;for(let c of n.patterns){let l=c.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),u=new RegExp(l);if(u.test(i)||u.test(r))return this._logger.debug(`File excluded by pattern: ${o} (pattern: ${c})`),!0}}else{let n=t.get("excludedFolders",[]),c=t.get("excludedPatterns",[]);for(let l of n)if(new RegExp(`(^|/)${l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(i))return!0;for(let l of c){let u=l.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),h=new RegExp(u);if(h.test(i)||h.test(r))return!0}}return!1}_manageCacheSize(){if(this._decorationCache.size>this._maxCacheSize){this._logger.debug(`Cache size (${this._decorationCache.size}) exceeds max (${this._maxCacheSize}), cleaning old entries`);let e=Math.floor(this._maxCacheSize*.2),t=Array.from(this._decorationCache.entries());t.sort((o,i)=>o[1].timestamp-i[1].timestamp);for(let o=0;o<e&&o<t.length;o++)this._decorationCache.delete(t[o][0]);this._logger.debug(`Removed ${e} old cache entries`)}}_maybeExtendCacheTimeout(){if(this._isWeb||this._hasCustomCacheTimeout)return;let e=this._metrics.cacheHits+this._metrics.cacheMisses;if(e<200)return;let t=this._metrics.cacheHits/e;if(t<.9||this._cacheTimeout>=this._maxDesktopCacheTimeout||e<=this._lastCacheTimeoutBoostLookups||e-this._lastCacheTimeoutBoostLookups<100)return;let i=this._cacheTimeout;this._cacheTimeout=Math.min(this._cacheTimeout+Mt,this._maxDesktopCacheTimeout),this._lastCacheTimeoutBoostLookups=e,this._logger.info("\u2699\uFE0F Cache timeout extended (max 8min)",{previousTimeout:i,newTimeout:this._cacheTimeout,hitRate:Number(t.toFixed(2)),totalLookups:e})}async _getCachedDecoration(e,t){if(this._forceCacheBypass)return this._logger.debug(`\u26A0\uFE0F Cache bypass enabled - recalculating decoration for: ${t}`),null;if(this._advancedCache)try{let i=await this._advancedCache.get(e);if(i)return this._metrics.cacheHits++,this._logger.debug(`\u{1F9E0} Advanced cache hit for: ${t}`),i}catch(i){this._logger.debug(`Advanced cache error: ${i.message}`)}let o=this._decorationCache.get(e);if(o){if(o.forceRefresh)this._decorationCache.delete(e),this._logger.debug(`\u{1F6AB} Memory cache bypassed (forced refresh) for: ${t}`);else if(Date.now()-o.timestamp<this._cacheTimeout)return this._metrics.cacheHits++,this._logger.debug(`\u{1F4BE} Memory cache hit for: ${t}`),o.decoration}return null}async _storeDecorationInCache(e,t,o,i){if(this._forceCacheBypass)return;this._manageCacheSize();let r={decoration:t,timestamp:Date.now()};if(i&&(r.uri=i),this._decorationCache.set(e,r),this._advancedCache)try{await this._advancedCache.set(e,t,{ttl:this._cacheTimeout}),this._logger.debug(`\u{1F9E0} Stored in advanced cache: ${o}`)}catch(s){this._logger.debug(`Failed to store in advanced cache: ${s.message}`)}this._maybeExtendCacheTimeout()}_getFlyweightValue(e,t,o,i,r,s){if(!this._enableFlyweights||!i)return s&&s.misses++,r();if(e.has(i))return s&&s.hits++,e.get(i);s&&s.misses++;let n=r();if(e.set(i,n),t.push(i),t.length>o){let c=t.shift();c&&e.delete(c)}return n}_safeHeapUsedMB(){try{let e=process?.memoryUsage?process.memoryUsage().heapUsed:0;return Number((e/1024/1024).toFixed(2))}catch{return 0}}_maybeShedWorkload(){if(!this._memorySheddingEnabled||this._memorySheddingActive)return;let e=this._safeHeapUsedMB();if(!e)return;if(!this._memoryBaselineMB){this._memoryBaselineMB=e;return}let t=e-this._memoryBaselineMB;t>=this._memorySheddingThresholdMB&&(this._memorySheddingActive=!0,this._maxCacheSize=Math.min(this._maxCacheSize,this._memoryShedCacheLimit),this._refreshIntervalOverride=Math.max(this._refreshIntervalOverride||this._refreshInterval||this._memoryShedRefreshIntervalMs,this._memoryShedRefreshIntervalMs),this._logger.warn(`Memory shedding activated (delta ${t.toFixed(2)} MB >= ${this._memorySheddingThresholdMB} MB); cache size capped at ${this._maxCacheSize} and refresh interval stretched to ${this._refreshIntervalOverride}ms`),this._setupPeriodicRefresh())}_acquireDecorationFromPool({badge:e,tooltip:t,color:o}){if(!this._enableDecorationPool){this._decorationPoolStats.misses++;let s=new f.FileDecoration(e||"??");return t&&(s.tooltip=t),o&&(s.color=o),s.propagate=!1,s}if(!e)return new f.FileDecoration("??");let i=this._buildDecorationPoolKey(e,t,o);if(i&&this._decorationPool.has(i))return this._decorationPoolStats.hits++,this._decorationPool.get(i);let r=new f.FileDecoration(e);if(t&&(r.tooltip=t),o&&(r.color=o),r.propagate=!1,i&&(this._decorationPool.set(i,r),this._decorationPoolOrder.push(i),this._decorationPoolOrder.length>this._maxDecorationPoolSize)){let s=this._decorationPoolOrder.shift();s&&s!==i&&this._decorationPool.delete(s)}return this._decorationPoolStats.misses++,r}_buildDecorationPoolKey(e,t,o){let i=e||"",r=t||"",s=this._getColorIdentifier(o);return`${i}::${s}::${r}`}_getColorIdentifier(e){if(!e)return"none";if(typeof e=="string")return e;if(e.id)return e.id;try{return JSON.stringify(e)}catch{return String(e)}}_clearDecorationPool(e="unspecified"){this._decorationPool.size!==0&&(this._decorationPool.clear(),this._decorationPoolOrder.length=0,this._logger.debug(`\u{1F9FC} Cleared decoration pool (${e})`))}_buildBadgeDescriptor({formatType:e,diffMinutes:t,diffHours:o,diffDays:i,diffWeeks:r,diffMonths:s,date:n}){let c=d((l,u=null)=>({value:l,key:u?`badge:${e||"default"}:${u}`:null}),"build");switch(e){case"relative-short":case"relative-long":return t<1?c("\u25CF\u25CF","just"):t<60?c(`${Math.min(t,99)}m`,`m:${Math.min(t,99)}`):o<24?c(`${Math.min(o,23)}h`,`h:${Math.min(o,23)}`):i<7?c(`${i}d`,`d:${i}`):r<4?c(`${r}w`,`w:${r}`):s<12?c(`${s}M`,`M:${s}`):c("1y","y:1");case"absolute-short":case"absolute-long":{let l=n.getDate(),u=`${Vo[n.getMonth()]}${l<10?"0"+l:l}`,h=[n.getMonth(),l];return e==="absolute-long"&&h.push(n.getFullYear()),c(u,`abs:${h.join("-")}`)}case"technical":return t<60?c(`${t}m`,`tech:m:${t}`):o<24?c(`${o}h`,`tech:h:${o}`):c(`${i}d`,`tech:d:${i}`);case"minimal":return o<1?c("\u2022\u2022","min:now"):o<24?c("\u25CB\u25CB","min:hours"):c("\u2500\u2500","min:days");default:return t<60?c(`${t}m`,`smart:m:${t}`):o<24?c(`${o}h`,`smart:h:${o}`):c(`${i}d`,`smart:d:${i}`)}}_formatDateBadge(e,t,o=null){let r=o!==null?o:new Date().getTime()-e.getTime();if(r<0)return this._logger.debug(`File has future modification time (diffMs: ${r}), treating as just modified`),"\u25CF\u25CF";let s=Math.floor(r/(1e3*60)),n=Math.floor(r/(1e3*60*60)),c=Math.floor(r/(1e3*60*60*24)),l=Math.floor(c/7),u=Math.floor(c/30),h=this._buildBadgeDescriptor({formatType:t,diffMinutes:s,diffHours:n,diffDays:c,diffWeeks:l,diffMonths:u,date:e});return this._getFlyweightValue(this._badgeFlyweightCache,this._badgeFlyweightOrder,this._badgeFlyweightLimit,h.key,()=>h.value,this._badgeFlyweightStats)}_formatFileSize(e,t="auto"){return jo(e,t)}_buildReadableDescriptor(e,t,o,i,r){let s=e.toDateString()===t.toDateString();return o<1?{key:"readable:just",factory:d(()=>this._l10n.getString("justNow"),"factory")}:o<60?{key:`readable:minutes:${o}`,factory:d(()=>this._l10n.getString("minutesAgo",o),"factory")}:i<24&&s?{key:`readable:hours:${i}`,factory:d(()=>this._l10n.getString("hoursAgo",i),"factory")}:r<7?r===1?{key:"readable:yesterday",factory:d(()=>this._l10n.getString("yesterday"),"factory")}:{key:`readable:days:${r}`,factory:d(()=>this._l10n.getString("daysAgo",r),"factory")}:null}_getColorByScheme(e,t,o=""){if(t==="none")return;let r=new Date().getTime()-e.getTime(),s=Math.floor(r/(1e3*60*60)),n=Math.floor(r/(1e3*60*60*24));switch(t){case"recency":return s<1?new f.ThemeColor("charts.green"):s<24?new f.ThemeColor("charts.yellow"):new f.ThemeColor("charts.red");case"file-type":{let c=fe(o);return[".js",".ts",".jsx",".tsx"].includes(c)?new f.ThemeColor("charts.blue"):[".css",".scss",".less"].includes(c)?new f.ThemeColor("charts.purple"):[".html",".htm",".xml"].includes(c)?new f.ThemeColor("charts.orange"):[".json",".yaml",".yml"].includes(c)?new f.ThemeColor("charts.green"):[".md",".txt",".log"].includes(c)?new f.ThemeColor("charts.yellow"):[".py",".rb",".php"].includes(c)?new f.ThemeColor("charts.red"):new f.ThemeColor("editorForeground")}case"subtle":return s<1?new f.ThemeColor("editorInfo.foreground"):n<7?new f.ThemeColor("editorWarning.foreground"):new f.ThemeColor("editorError.foreground");case"vibrant":return s<1?new f.ThemeColor("terminal.ansiGreen"):s<24?new f.ThemeColor("terminal.ansiYellow"):n<7?new f.ThemeColor("terminal.ansiMagenta"):new f.ThemeColor("terminal.ansiRed");case"custom":return s<1?new f.ThemeColor("explorerDates.customColor.veryRecent"):s<24?new f.ThemeColor("explorerDates.customColor.recent"):new f.ThemeColor("explorerDates.customColor.old");default:return}}_generateBadgeDetails({filePath:e,stat:t,diffMs:o,dateFormat:i,badgePriority:r,showFileSize:s,fileSizeFormat:n,gitBlame:c,showGitInfo:l}){let u=this._formatDateBadge(t.mtime,i,o),h=this._formatDateReadable(t.mtime),w=this._formatDateReadable(t.birthtime),g=u;if(this._logger.debug(`\u{1F3F7}\uFE0F Badge generation for ${q(e)}: badgePriority=${r}, showGitInfo=${l}, hasGitBlame=${!!c}, authorName=${c?.authorName}, previewMode=${!!this._previewSettings}`),r==="author"&&c?.authorName){let b=this._getInitials(c.authorName);b&&(g=b,this._logger.debug(`\u{1F3F7}\uFE0F Using author initials badge: "${b}" (from ${c.authorName})`))}else if(r==="size"&&s){let b=this._formatCompactSize(t.size);b&&(g=b,this._logger.debug(`\u{1F3F7}\uFE0F Using size badge: "${b}"`))}else this._logger.debug(`\u{1F3F7}\uFE0F Using time badge: "${u}" (badgePriority=${r})`);return{badge:u,displayBadge:g,readableModified:h,readableCreated:w,fileSizeLabel:s?this._formatFileSize(t.size,n):null}}async _buildTooltipContent({filePath:e,resourceUri:t,stat:o,badgeDetails:i,gitBlame:r,shouldUseAccessibleTooltips:s,fileSizeFormat:n,isCodeFile:c}){let l=q(e),u=fe(e);if(s){let g=this._accessibility.getAccessibleTooltip(e,o.mtime,o.birthtime,o.size,r);if(g)return this._logger.info(`\u{1F50D} Using accessible tooltip (${g.length} chars): "${g.substring(0,50)}..."`),g;this._logger.info("\u{1F50D} Accessible tooltip generation failed, using rich tooltip")}let h=`\u{1F4C4} File: ${l}
`;h+=`\u{1F4DD} Last Modified: ${i.readableModified}
`,h+=`   ${this._formatFullDate(o.mtime)}

`,h+=`\u{1F4C5} Created: ${i.readableCreated}
`,h+=`   ${this._formatFullDate(o.birthtime)}

`;let w=i.fileSizeLabel||this._formatFileSize(o.size,n||"auto");if(h+=`\u{1F4CA} Size: ${w} (${o.size.toLocaleString()} bytes)
`,u&&(h+=`\u{1F3F7}\uFE0F Type: ${u.toUpperCase()} file
`),c)try{let g=t||e,W=(await this._fileSystem.readFile(g,"utf8")).split(`
`).length;h+=`\u{1F4CF} Lines: ${W.toLocaleString()}
`}catch{}return h+=`\u{1F4C2} Path: ${e}`,r&&(h+=`

\u{1F464} Last Modified By: ${r.authorName}`,r.authorEmail&&(h+=` (${r.authorEmail})`),r.authorDate&&(h+=`
   ${r.authorDate}`)),h}_formatDateReadable(e){let t=new Date,o=t.getTime()-e.getTime(),i=Math.floor(o/(1e3*60)),r=Math.floor(o/(1e3*60*60)),s=Math.floor(o/(1e3*60*60*24)),n=this._buildReadableDescriptor(e,t,i,r,s);return n?this._getFlyweightValue(this._readableDateFlyweightCache,this._readableDateFlyweightOrder,this._readableDateFlyweightLimit,n.key,n.factory,this._readableFlyweightStats):e.getFullYear()===t.getFullYear()?this._l10n.formatDate(e,{month:"short",day:"numeric"}):this._l10n.formatDate(e,{month:"short",day:"numeric",year:"numeric"})}async _getGitBlameInfo(e,t=null){if(!this._gitAvailable||!ne)return null;try{let o=f.workspace.getWorkspaceFolder(f.Uri.file(e));if(!o)return null;let i=o.uri.fsPath||o.uri.path,r=Ho(i,e),s=this._getGitCacheKey(i,r,t),n=this._getCachedGitInfo(s);if(n)return n;let c=Date.now();try{let{stdout:l}=await ne(`git log -1 --format="%H|%an|%ae|%ad" -- "${r}"`,{cwd:o.uri.fsPath,timeout:2e3});if(!l||!l.trim())return null;let[u,h,w,g]=l.trim().split("|"),b={hash:u||"",authorName:h||"Unknown",authorEmail:w||"",authorDate:g||""};return this._setCachedGitInfo(s,b),b}finally{let l=Date.now()-c;this._metrics.gitBlameTimeMs+=l,this._metrics.gitBlameCalls++}}catch{return null}}_getInitials(e){if(!e||typeof e!="string")return null;let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?null:t.length===1?t[0].substring(0,2).toUpperCase():(t[0][0]+(t[1][0]||"")).substring(0,2).toUpperCase()}_formatCompactSize(e){if(typeof e!="number"||isNaN(e))return null;let t=["B","K","M","G","T"],o=0,i=e;for(;i>=1024&&o<t.length-1;)i=i/1024,o++;let r=Math.round(i),s=t[o];if(r<=9)return`${r}${s}`;let n=String(r);return n.length>=2?n.slice(0,2):n}_formatFullDate(e){let t={year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"};return e.toLocaleString("en-US",t)}_getCacheKey(e){return Go(J(e))}_isFileNotFoundError(e){return e?e.code==="ENOENT"?!0:typeof e.message=="string"&&e.message.includes("ENOENT"):!1}async provideFileDecoration(e,t){let o=Date.now();try{if(!e){this._logger.error("\u274C Invalid URI provided to provideFileDecoration:",e);return}let i=J(e);if(!i){this._logger.error("\u274C Could not resolve path for URI in provideFileDecoration:",e);return}let r=q(i),s=e.scheme||"file";if(s!=="file"){this._logger.debug(`\u23ED\uFE0F Skipping decoration for ${r} (unsupported scheme: ${s})`);return}this._performanceMode||(this._logger.infoWithOptions(this._stressLogOptions,`\u{1F50D} VSCODE REQUESTED DECORATION: ${r} (${i})`),this._logger.infoWithOptions(this._stressLogOptions,`\u{1F4CA} Call context: token=${!!t}, cancelled=${t?.isCancellationRequested}`));let n=f.workspace.getConfiguration("explorerDates"),c=d(($,rt)=>{if(this._previewSettings&&Object.prototype.hasOwnProperty.call(this._previewSettings,$)){let st=this._previewSettings[$];return this._logger.debug(`\u{1F3AD} Using preview value for ${$}: ${st} (config has: ${n.get($,rt)})`),st}return n.get($,rt)},"_get");if(this._previewSettings&&this._logger.infoWithOptions(this._stressLogOptions,`\u{1F3AD} Processing ${r} in PREVIEW MODE with settings:`,()=>this._previewSettings),!c("showDateDecorations",!0)){this._performanceMode||this._logger.infoWithOptions(this._stressLogOptions,`\u274C RETURNED UNDEFINED: Decorations disabled globally for ${r}`);return}if(await this._isExcludedSimple(e)){this._performanceMode||this._logger.infoWithOptions(this._stressLogOptions,`\u274C File excluded: ${r}`);return}this._logger.debug(`\u{1F50D} Processing file: ${r}`);let l=this._getCacheKey(e);if(this._previewSettings)this._logger.debug(`\u{1F504} Skipping cache due to active preview settings for: ${r}`);else{let $=await this._getCachedDecoration(l,r);if($)return $}if(this._metrics.cacheMisses++,this._logger.debug(`\u274C Cache miss for: ${r} (key: ${l.substring(0,50)}...)`),t?.isCancellationRequested){this._logger.debug(`Decoration cancelled for: ${i}`);return}let u=Date.now(),h;try{h=await this._fileSystem.stat(e)}catch($){if(this._metrics.fileStatTimeMs+=Date.now()-u,this._metrics.fileStatCalls++,this._isFileNotFoundError($)){this._logger.debug(`\u23ED\uFE0F Skipping decoration for ${r}: file not found (${$.message||$})`);return}throw $}if(this._metrics.fileStatTimeMs+=Date.now()-u,this._metrics.fileStatCalls++,!(typeof h.isFile=="function"?h.isFile():!0))return;let g=h.mtime instanceof Date?h.mtime:new Date(h.mtime),b=h.birthtime instanceof Date?h.birthtime:new Date(h.birthtime||h.ctime||h.mtime),W={mtime:g,birthtime:b,size:h.size},N=Date.now()-g.getTime(),ve=c("dateDecorationFormat","smart"),U=this._performanceMode?"none":c("colorScheme","none"),le=c("highContrastMode",!1),de=this._performanceMode?!1:c("showFileSize",!1),j=c("fileSizeFormat","auto"),Q=c("accessibilityMode",!1),be=this._performanceMode?!1:c("fadeOldFiles",!1),ot=c("fadeThreshold",30),Z=this._performanceMode?"none":c("showGitInfo","none"),v=this._performanceMode?"time":c("badgePriority","time");this._lightweightMode&&(U="none",de=!1,Q=!1,Z="none",v="time");let te=(Z!=="none"||v==="author")&&this._gitAvailable&&!this._performanceMode,he=te?Z:"none";v==="author"&&!te&&(v="time");let oe=te?await this._getGitBlameInfo(i,g.getTime()):null,_e=this._generateBadgeDetails({filePath:i,stat:W,diffMs:N,dateFormat:ve,badgePriority:v,showFileSize:de,fileSizeFormat:j,gitBlame:oe,showGitInfo:he}),oo=fe(i),io=[".js",".ts",".jsx",".tsx",".py",".rb",".php",".java",".cpp",".c",".cs",".go",".rs",".kt",".swift"].includes(oo),it=Q&&this._accessibility?.shouldEnhanceAccessibility();this._logger.debug(`\u{1F50D} Tooltip generation for ${r}: accessibilityMode=${Q}, shouldUseAccessible=${it}, previewMode=${!!this._previewSettings}`);let ye=await this._buildTooltipContent({filePath:i,resourceUri:e,stat:W,badgeDetails:_e,gitBlame:he==="none"?null:oe,shouldUseAccessibleTooltips:it,fileSizeFormat:j,isCodeFile:io}),ie;U!=="none"&&(ie=this._themeIntegration?this._themeIntegration.applyThemeAwareColorScheme(U,i,N):this._getColorByScheme(g,U,i)),this._logger.debug(`\u{1F3A8} Color scheme setting: ${U}, using color: ${ie?"yes":"no"}`);let Ce=Et(_e.displayBadge)||Et(_e.badge)||"??";this._accessibility?.shouldEnhanceAccessibility()&&(Ce=this._accessibility.getAccessibleBadge(Ce));let z,G=ie;G&&(G=this._enhanceColorForSelection(G),this._logger.debug(`\u{1F3A8} Added enhanced color: ${G.id||G} (original: ${ie?.id||ie})`)),be&&Math.floor(N/864e5)>ot&&(G=new f.ThemeColor("editorGutter.commentRangeForeground")),le&&(G=new f.ThemeColor("editorWarning.foreground"),this._logger.info(`\u{1F506} Applied high contrast color (overriding colorScheme=${U})`));let xe=ye&&ye.length<500?ye:void 0;try{z=this._acquireDecorationFromPool({badge:Ce,tooltip:xe,color:G}),xe&&this._logger.debug(`\u{1F4DD} Added tooltip (${xe.length} chars)`)}catch($){this._logger.error("\u274C Failed to create decoration:",$),z=new f.FileDecoration("!!"),z.propagate=!1}if(this._logger.debug(`\u{1F3A8} Color/contrast check for ${r}: colorScheme=${U}, highContrastMode=${le}, hasColor=${!!G}, previewMode=${!!this._previewSettings}`),this._previewSettings?this._logger.debug(`\u{1F504} Skipping cache storage due to preview mode for: ${r}`):await this._storeDecorationInCache(l,z,r,e),this._metrics.totalDecorations++,this._maybeShedWorkload(),!z?.badge){this._logger.error(`\u274C Decoration badge is invalid for: ${r}`);return}let ro=Date.now()-o;return this._performanceMode||(this._logger.infoWithOptions(this._stressLogOptions,`\u2705 Decoration created for: ${r} (badge: ${z.badge||"undefined"}) - Cache key: ${l.substring(0,30)}...`),this._logger.infoWithOptions(this._stressLogOptions,"\u{1F3AF} RETURNING DECORATION TO VSCODE:",()=>({file:r,badge:z.badge,hasTooltip:!!z.tooltip,hasColor:!!z.color,colorType:z.color?.constructor?.name,processingTimeMs:ro,decorationType:z.constructor.name}))),z}catch(i){this._metrics.errors++;let r=o?Date.now()-o:0,s=q(e),n=J(e)||"unknown-uri";this._logger.error(`\u274C DECORATION ERROR for ${s}:`,{error:i.message,stack:i.stack?.split(`
`)[0],processingTimeMs:r,uri:n}),this._logger.error(`\u274C CRITICAL ERROR DETAILS for ${s}: ${i.message}`),this._logger.error(`\u274C Error type: ${i.constructor.name}`),this._logger.error(`\u274C Full stack: ${i.stack}`),this._logger.info(`\u274C RETURNED UNDEFINED: Error occurred for ${s}`);return}}getMetrics(){let e={...this._metrics,cacheSize:this._decorationCache.size,cacheHitRate:this._metrics.cacheHits+this._metrics.cacheMisses>0?(this._metrics.cacheHits/(this._metrics.cacheHits+this._metrics.cacheMisses)*100).toFixed(2)+"%":"0.00%",forceCacheBypass:this._forceCacheBypass,decorationPoolEnabled:this._enableDecorationPool,flyweightsEnabled:this._enableFlyweights,lightweightMode:this._lightweightMode,memorySheddingEnabled:this._memorySheddingEnabled,memorySheddingActive:this._memorySheddingActive};return e.decorationPool={size:this._decorationPool.size,hits:this._decorationPoolStats.hits,misses:this._decorationPoolStats.misses},e.badgeFlyweight={...this._badgeFlyweightStats,cacheSize:this._badgeFlyweightCache.size},e.readableFlyweight={...this._readableFlyweightStats,cacheSize:this._readableDateFlyweightCache.size},this._advancedCache&&(e.advancedCache=this._advancedCache.getStats()),this._batchProcessor&&(e.batchProcessor=this._batchProcessor.getMetrics()),e.cacheDebugging={memoryCacheKeys:Array.from(this._decorationCache.keys()).slice(0,5),cacheTimeout:this._cacheTimeout,maxCacheSize:this._maxCacheSize,keyStatsSize:this._cacheKeyStats?this._cacheKeyStats.size:0},e.performanceTiming={avgGitBlameMs:this._metrics.gitBlameCalls>0?(this._metrics.gitBlameTimeMs/this._metrics.gitBlameCalls).toFixed(1):"0.0",avgFileStatMs:this._metrics.fileStatCalls>0?(this._metrics.fileStatTimeMs/this._metrics.fileStatCalls).toFixed(1):"0.0",totalGitBlameTimeMs:this._metrics.gitBlameTimeMs,totalFileStatTimeMs:this._metrics.fileStatTimeMs,gitBlameCalls:this._metrics.gitBlameCalls,fileStatCalls:this._metrics.fileStatCalls},e}async initializeAdvancedSystems(e){try{if(this._extensionContext=e,this._isWeb&&await this._maybeWarnAboutGitLimitations(),this._performanceMode){this._logger.info("Performance mode enabled - skipping advanced cache, batch processor, and progressive loading");return}this._advancedCache=new Bo(e),await this._advancedCache.initialize(),this._logger.info("Advanced cache initialized"),this._batchProcessor.initialize(),this._logger.info("Batch processor initialized"),await this._applyProgressiveLoadingSetting(),f.workspace.getConfiguration("explorerDates").get("autoThemeAdaptation",!0)&&(await this._themeIntegration.autoConfigureForTheme(),this._logger.info("Theme integration configured")),this._accessibility.shouldEnhanceAccessibility()&&(await this._accessibility.applyAccessibilityRecommendations(),this._logger.info("Accessibility recommendations applied"));try{await this._smartExclusion.cleanupAllWorkspaceProfiles()}catch(o){this._logger.warn("Failed to clean workspace exclusion profiles",o)}if(f.workspace.workspaceFolders)for(let o of f.workspace.workspaceFolders)try{await this._smartExclusion.suggestExclusions(o.uri),this._logger.info(`Smart exclusions analyzed for: ${o.name}`)}catch(i){this._logger.error(`Failed to analyze smart exclusions for ${o.name}`,i)}this._logger.info("Advanced systems initialized successfully")}catch(t){this._logger.error("Failed to initialize advanced systems",t)}}async _maybeWarnAboutGitLimitations(){if(!this._gitWarningShown){this._gitWarningShown=!0;try{let e=this._extensionContext?.globalState,t=Ko.WEB_GIT_NOTICE;if(e?.get(t,!1))return;if(e?.update)try{await e.update(t,!0)}catch(i){this._logger.debug("Failed to persist Git limitation notice flag",i)}Promise.resolve().then(()=>{f.window.showInformationMessage("Explorer Dates: Git attribution badges are unavailable on VS Code for Web. Time-based decorations remain available.")})}catch(e){this._logger.debug("Failed to display Git limitation notice",e)}}}_enhanceColorForSelection(e){let t={"charts.yellow":"list.warningForeground","charts.red":"list.errorForeground","charts.green":"list.highlightForeground","charts.blue":"symbolIcon.functionForeground","charts.purple":"symbolIcon.classForeground","charts.orange":"list.warningForeground","terminal.ansiYellow":"list.warningForeground","terminal.ansiGreen":"list.highlightForeground","terminal.ansiRed":"list.errorForeground","terminal.ansiBlue":"symbolIcon.functionForeground","terminal.ansiMagenta":"symbolIcon.classForeground","terminal.ansiCyan":"symbolIcon.stringForeground","editorGutter.commentRangeForeground":"list.deemphasizedForeground","editorWarning.foreground":"list.warningForeground","editorError.foreground":"list.errorForeground","editorInfo.foreground":"list.highlightForeground"},o=e.id||e,i=t[o];return i?(this._logger.debug(`\u{1F527} Enhanced color ${o} \u2192 ${i} for better selection visibility`),new f.ThemeColor(i)):e}async dispose(){this._logger.info("Disposing FileDateDecorationProvider",this.getMetrics()),this._refreshTimer&&(clearInterval(this._refreshTimer),this._refreshTimer=null,this._logger.info("Cleared periodic refresh timer")),this._cancelIncrementalRefreshTimers(),this._advancedCache&&await this._advancedCache.dispose(),this._cancelProgressiveWarmupJobs(),this._batchProcessor&&this._batchProcessor.dispose(),this._accessibility&&typeof this._accessibility.dispose=="function"&&this._accessibility.dispose(),this._decorationCache.clear(),this._clearDecorationPool("dispose"),this._gitCache.clear(),this._onDidChangeFileDecorations.dispose(),this._fileWatcher&&this._fileWatcher.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null)}};d(Ue,"FileDateDecorationProvider");var Ne=Ue;At.exports={FileDateDecorationProvider:Ne}});var Rt=S((exports,module)=>{var vscode=require("vscode"),{fileSystem}=H(),{getFileName,getRelativePath}=B(),isWeb=!0,childProcess=null;function loadChildProcess(){return!childProcess&&!isWeb&&(childProcess=eval("require")("child_process")),childProcess}d(loadChildProcess,"loadChildProcess");function registerCoreCommands({context:a,fileDateProvider:e,logger:t,l10n:o}){let i=[];i.push(vscode.commands.registerCommand("explorerDates.refreshDateDecorations",()=>{try{if(e){e.clearAllCaches(),e.refreshAll();let r=o?.getString("refreshSuccess")||"Date decorations refreshed - all caches cleared";vscode.window.showInformationMessage(r),t.info("Date decorations refreshed manually with cache clear")}}catch(r){t.error("Failed to refresh decorations",r),vscode.window.showErrorMessage(`Failed to refresh decorations: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.previewConfiguration",r=>{try{e&&(e.applyPreviewSettings(r),t.info("Configuration preview applied",r))}catch(s){t.error("Failed to apply configuration preview",s)}})),i.push(vscode.commands.registerCommand("explorerDates.clearPreview",()=>{try{e&&(e.applyPreviewSettings(null),t.info("Configuration preview cleared"))}catch(r){t.error("Failed to clear configuration preview",r)}})),i.push(vscode.commands.registerCommand("explorerDates.showMetrics",()=>{try{if(e){let r=e.getMetrics(),s=`Explorer Dates Metrics:
Total Decorations: ${r.totalDecorations}
Cache Size: ${r.cacheSize}
Cache Hits: ${r.cacheHits}
Cache Misses: ${r.cacheMisses}
Cache Hit Rate: ${r.cacheHitRate}
Errors: ${r.errors}`;r.advancedCache&&(s+=`

Advanced Cache:
Memory Items: ${r.advancedCache.memoryItems}
Memory Usage: ${(r.advancedCache.memoryUsage/1024/1024).toFixed(2)} MB
Memory Hit Rate: ${r.advancedCache.memoryHitRate}
Disk Hit Rate: ${r.advancedCache.diskHitRate}
Evictions: ${r.advancedCache.evictions}`),r.batchProcessor&&(s+=`

Batch Processor:
Queue Length: ${r.batchProcessor.queueLength}
Is Processing: ${r.batchProcessor.isProcessing}
Average Batch Time: ${r.batchProcessor.averageBatchTime.toFixed(2)}ms`),vscode.window.showInformationMessage(s,{modal:!0}),t.info("Metrics displayed",r)}}catch(r){t.error("Failed to show metrics",r),vscode.window.showErrorMessage(`Failed to show metrics: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.openLogs",()=>{try{t.show()}catch(r){t.error("Failed to open logs",r),vscode.window.showErrorMessage(`Failed to open logs: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.showCurrentConfig",()=>{try{let r=vscode.workspace.getConfiguration("explorerDates"),s={highContrastMode:r.get("highContrastMode"),badgePriority:r.get("badgePriority"),colorScheme:r.get("colorScheme"),accessibilityMode:r.get("accessibilityMode"),dateDecorationFormat:r.get("dateDecorationFormat"),showGitInfo:r.get("showGitInfo"),showFileSize:r.get("showFileSize")},n=`Current Explorer Dates Configuration:

${Object.entries(s).map(([c,l])=>`${c}: ${JSON.stringify(l)}`).join(`
`)}`;vscode.window.showInformationMessage(n,{modal:!0}),t.info("Current configuration displayed",s)}catch(r){t.error("Failed to show configuration",r)}})),i.push(vscode.commands.registerCommand("explorerDates.resetToDefaults",async()=>{try{let r=vscode.workspace.getConfiguration("explorerDates");await r.update("highContrastMode",!1,vscode.ConfigurationTarget.Global),await r.update("badgePriority","time",vscode.ConfigurationTarget.Global),await r.update("accessibilityMode",!1,vscode.ConfigurationTarget.Global),vscode.window.showInformationMessage("Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately."),t.info("Reset problematic settings to defaults"),e&&(e.clearAllCaches(),e.refreshAll())}catch(r){t.error("Failed to reset settings",r),vscode.window.showErrorMessage(`Failed to reset settings: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.toggleDecorations",()=>{try{let r=vscode.workspace.getConfiguration("explorerDates"),s=r.get("showDateDecorations",!0);r.update("showDateDecorations",!s,vscode.ConfigurationTarget.Global);let n=s?o?.getString("decorationsDisabled")||"Date decorations disabled":o?.getString("decorationsEnabled")||"Date decorations enabled";vscode.window.showInformationMessage(n),t.info(`Date decorations toggled to: ${!s}`)}catch(r){t.error("Failed to toggle decorations",r),vscode.window.showErrorMessage(`Failed to toggle decorations: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.copyFileDate",async r=>{try{let s=r;if(!s&&vscode.window.activeTextEditor&&(s=vscode.window.activeTextEditor.document.uri),!s){vscode.window.showWarningMessage("No file selected");return}let n=await fileSystem.stat(s),c=(n.mtime instanceof Date?n.mtime:new Date(n.mtime)).toLocaleString();await vscode.env.clipboard.writeText(c),vscode.window.showInformationMessage(`Copied to clipboard: ${c}`),t.info(`File date copied for: ${s.fsPath||s.path}`)}catch(s){t.error("Failed to copy file date",s),vscode.window.showErrorMessage(`Failed to copy file date: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.showFileDetails",async r=>{try{let s=r;if(!s&&vscode.window.activeTextEditor&&(s=vscode.window.activeTextEditor.document.uri),!s){vscode.window.showWarningMessage("No file selected");return}let n=await fileSystem.stat(s),c=getFileName(s.fsPath||s.path),l=e?._formatFileSize(n.size,"auto")||`${n.size} bytes`,u=(n.mtime instanceof Date?n.mtime:new Date(n.mtime)).toLocaleString(),h=(n.birthtime instanceof Date?n.birthtime:new Date(n.birthtime||n.mtime)).toLocaleString(),w=`File: ${c}
Size: ${l}
Modified: ${u}
Created: ${h}
Path: ${s.fsPath||s.path}`;vscode.window.showInformationMessage(w,{modal:!0}),t.info(`File details shown for: ${s.fsPath||s.path}`)}catch(s){t.error("Failed to show file details",s),vscode.window.showErrorMessage(`Failed to show file details: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.toggleFadeOldFiles",()=>{try{let r=vscode.workspace.getConfiguration("explorerDates"),s=r.get("fadeOldFiles",!1);r.update("fadeOldFiles",!s,vscode.ConfigurationTarget.Global);let n=s?"Fade old files disabled":"Fade old files enabled";vscode.window.showInformationMessage(n),t.info(`Fade old files toggled to: ${!s}`)}catch(r){t.error("Failed to toggle fade old files",r),vscode.window.showErrorMessage(`Failed to toggle fade old files: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.showFileHistory",async r=>{try{if(isWeb){vscode.window.showInformationMessage("Git history is unavailable on VS Code for Web.");return}let s=r;if(!s&&vscode.window.activeTextEditor&&(s=vscode.window.activeTextEditor.document.uri),!s){vscode.window.showWarningMessage("No file selected");return}let n=vscode.workspace.getWorkspaceFolder(s);if(!n){vscode.window.showWarningMessage("File is not in a workspace");return}let l=`git log --oneline -10 -- "${getRelativePath(n.uri.fsPath||n.uri.path,s.fsPath||s.path)}"`;loadChildProcess().exec(l,{cwd:n.uri.fsPath,timeout:3e3},(h,w)=>{if(h){h.message.includes("not a git repository")?vscode.window.showWarningMessage("This file is not in a Git repository"):vscode.window.showErrorMessage(`Git error: ${h.message}`);return}if(!w.trim()){vscode.window.showInformationMessage("No Git history found for this file");return}let g=w.trim(),b=getFileName(s.fsPath||s.path);vscode.window.showInformationMessage(`Recent commits for ${b}:

${g}`,{modal:!0})}),t.info(`File history requested for: ${s.fsPath||s.path}`)}catch(s){t.error("Failed to show file history",s),vscode.window.showErrorMessage(`Failed to show file history: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.compareWithPrevious",async r=>{try{if(isWeb){vscode.window.showInformationMessage("Git comparisons are unavailable on VS Code for Web.");return}let s=r;if(!s&&vscode.window.activeTextEditor&&(s=vscode.window.activeTextEditor.document.uri),!s){vscode.window.showWarningMessage("No file selected");return}if(!vscode.workspace.getWorkspaceFolder(s)){vscode.window.showWarningMessage("File is not in a workspace");return}await vscode.commands.executeCommand("git.openChange",s),t.info(`Git diff opened for: ${s.fsPath||s.path}`)}catch(s){t.error("Failed to compare with previous version",s),vscode.window.showErrorMessage(`Failed to compare with previous version: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.applyCustomColors",async()=>{try{let s=vscode.workspace.getConfiguration("explorerDates").get("customColors",{veryRecent:"#00ff00",recent:"#ffff00",old:"#ff0000"}),n=`To use custom colors with Explorer Dates, add the following to your settings.json:

"workbench.colorCustomizations": {
  "explorerDates.customColor.veryRecent": "${s.veryRecent}",
  "explorerDates.customColor.recent": "${s.recent}",
  "explorerDates.customColor.old": "${s.old}"
}

Also set: "explorerDates.colorScheme": "custom"`,c=await vscode.window.showInformationMessage("Custom colors configuration",{modal:!0,detail:n},"Copy to Clipboard","Open Settings");if(c==="Copy to Clipboard"){let l=`"workbench.colorCustomizations": {
  "explorerDates.customColor.veryRecent": "${s.veryRecent}",
  "explorerDates.customColor.recent": "${s.recent}",
  "explorerDates.customColor.old": "${s.old}"
}`;await vscode.env.clipboard.writeText(l),vscode.window.showInformationMessage("Custom color configuration copied to clipboard")}else c==="Open Settings"&&await vscode.commands.executeCommand("workbench.action.openSettings","workbench.colorCustomizations");t.info("Custom colors help displayed")}catch(r){t.error("Failed to apply custom colors",r),vscode.window.showErrorMessage(`Failed to apply custom colors: ${r.message}`)}})),i.forEach(r=>a.subscriptions.push(r))}d(registerCoreCommands,"registerCoreCommands");module.exports={registerCoreCommands}});var Lt=S((tr,zt)=>{var k=require("vscode"),{getLogger:Yo}=M(),Ge=class Ge{constructor(e){this._logger=Yo(),this._provider=e,this._testResults=[]}async runComprehensiveDiagnostics(){this._logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let e={timestamp:new Date().toISOString(),vscodeVersion:k.version,extensionVersion:k.extensions.getExtension("incredincomp.explorer-dates")?.packageJSON?.version,tests:{}};return e.tests.vscodeSettings=await this._testVSCodeSettings(),e.tests.providerRegistration=await this._testProviderRegistration(),e.tests.fileProcessing=await this._testFileProcessing(),e.tests.decorationCreation=await this._testDecorationCreation(),e.tests.cacheAnalysis=await this._testCacheAnalysis(),e.tests.extensionConflicts=await this._testExtensionConflicts(),e.tests.uriPathIssues=await this._testURIPathIssues(),this._logger.info("\u{1F50D} Comprehensive diagnostics completed",e),e}async _testVSCodeSettings(){let e=k.workspace.getConfiguration("explorer"),t=k.workspace.getConfiguration("workbench"),o=k.workspace.getConfiguration("explorerDates"),i={"explorer.decorations.badges":e.get("decorations.badges"),"explorer.decorations.colors":e.get("decorations.colors"),"workbench.colorTheme":t.get("colorTheme"),"explorerDates.showDateDecorations":o.get("showDateDecorations"),"explorerDates.colorScheme":o.get("colorScheme"),"explorerDates.showGitInfo":o.get("showGitInfo")},r=[];return i["explorer.decorations.badges"]===!1&&r.push("CRITICAL: explorer.decorations.badges is disabled"),i["explorer.decorations.colors"]===!1&&r.push("WARNING: explorer.decorations.colors is disabled"),i["explorerDates.showDateDecorations"]===!1&&r.push("CRITICAL: explorerDates.showDateDecorations is disabled"),{status:r.length>0?"ISSUES_FOUND":"OK",settings:i,issues:r}}async _testProviderRegistration(){let e=[];if(!this._provider)return e.push("CRITICAL: Decoration provider is null/undefined"),{status:"FAILED",issues:e};typeof this._provider.provideFileDecoration!="function"&&e.push("CRITICAL: provideFileDecoration method missing"),this._provider.onDidChangeFileDecorations||e.push("WARNING: onDidChangeFileDecorations event emitter missing");let t=k.Uri.file("/test/path");try{let o=await this._provider.provideFileDecoration(t);this._logger.debug("Provider test call completed",{result:!!o})}catch(o){e.push(`ERROR: Provider test call failed: ${o.message}`)}return{status:e.length>0?"ISSUES_FOUND":"OK",providerActive:!!this._provider,issues:e}}async _testFileProcessing(){let e=k.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace folders available"]};let t=[],o=[];try{let i=["package.json","README.md","extension.js","src/logger.js"];for(let r of i){let s=k.Uri.joinPath(e[0].uri,r);try{await k.workspace.fs.stat(s);let n=this._provider._isExcludedSimple?await this._provider._isExcludedSimple(s):!1,c=await this._provider.provideFileDecoration(s);t.push({file:r,exists:!0,excluded:n,hasDecoration:!!c,badge:c?.badge,uri:s.toString()})}catch(n){t.push({file:r,exists:!1,error:n.message})}}}catch(i){o.push(`File processing test failed: ${i.message}`)}return{status:o.length>0?"ISSUES_FOUND":"OK",testFiles:t,issues:o}}async _testDecorationCreation(){let e=[],t=[];try{let i=new k.FileDecoration("test");e.push({name:"Simple decoration",success:!0,badge:i.badge})}catch(i){e.push({name:"Simple decoration",success:!1,error:i.message}),t.push("CRITICAL: Cannot create simple FileDecoration")}try{let i=new k.FileDecoration("test","Test tooltip");e.push({name:"Decoration with tooltip",success:!0,hasTooltip:!!(i&&i.tooltip)})}catch(i){e.push({name:"Decoration with tooltip",success:!1,error:i.message}),t.push("WARNING: Cannot create FileDecoration with tooltip")}try{let i=new k.FileDecoration("test","Test tooltip",new k.ThemeColor("charts.red"));e.push({name:"Decoration with color",success:!0,hasColor:!!i.color})}catch(i){e.push({name:"Decoration with color",success:!1,error:i.message}),t.push("WARNING: Cannot create FileDecoration with color")}let o=["1d","10m","2h","!!","\u25CF\u25CF","JA12","123456789"];for(let i of o)try{let r=new k.FileDecoration(i);e.push({name:`Badge format: ${i}`,success:!0,badge:r.badge,length:i.length})}catch(r){e.push({name:`Badge format: ${i}`,success:!1,error:r.message}),i.length<=8&&t.push(`WARNING: Valid badge format '${i}' failed`)}return{status:t.length>0?"ISSUES_FOUND":"OK",tests:e,issues:t}}async _testCacheAnalysis(){let e={memoryCache:{size:this._provider._decorationCache?.size||0,maxSize:this._provider._maxCacheSize||0},advancedCache:{available:!!this._provider._advancedCache,initialized:!1},metrics:this._provider.getMetrics?this._provider.getMetrics():null},t=[];return e.memoryCache.size>e.memoryCache.maxSize*.9&&t.push("WARNING: Memory cache is nearly full"),e.metrics&&e.metrics.cacheHits===0&&e.metrics.cacheMisses>10&&t.push("WARNING: Cache hit rate is 0% - potential cache key issues"),{status:t.length>0?"ISSUES_FOUND":"OK",cacheInfo:e,issues:t}}async _testExtensionConflicts(){let e=k.extensions.all,t=[],o=[];for(let r of e){if(!r.isActive)continue;let s=r.packageJSON;s.contributes?.commands?.some(c=>c.command?.includes("decoration")||c.title?.includes("decoration")||c.title?.includes("badge")||c.title?.includes("explorer"))&&o.push({id:r.id,name:s.displayName||s.name,version:s.version}),["file-icons","vscode-icons","material-icon-theme","explorer-exclude","hide-files","file-watcher"].some(c=>r.id.includes(c))&&t.push({id:r.id,name:s.displayName||s.name,reason:"Known to potentially interfere with file decorations"})}let i=[];return o.length>1&&i.push(`WARNING: ${o.length} extensions might provide file decorations`),t.length>0&&i.push(`WARNING: ${t.length} potentially conflicting extensions detected`),{status:i.length>0?"ISSUES_FOUND":"OK",decorationExtensions:o,potentialConflicts:t,issues:i}}async _testURIPathIssues(){let e=k.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace available for URI testing"]};let t=[],o=[],i=["package.json","src/logger.js","README.md",".gitignore"];for(let r of i){let s=k.Uri.joinPath(e[0].uri,r);t.push({path:r,scheme:s.scheme,fsPath:s.fsPath,authority:s.authority,valid:s.scheme==="file"&&s.fsPath.length>0}),s.scheme!=="file"&&o.push(`WARNING: Non-file URI scheme for ${r}: ${s.scheme}`),(s.fsPath.includes("\\\\")||s.fsPath.includes("//"))&&o.push(`WARNING: Potential path separator issues in ${r}`)}return{status:o.length>0?"ISSUES_FOUND":"OK",tests:t,issues:o}}};d(Ge,"DecorationDiagnostics");var je=Ge;zt.exports={DecorationDiagnostics:je}});var Ot=S((ir,Wt)=>{var Y=require("vscode"),{getFileName:Qo}=B();async function Xo(){let a=M().getLogger();a.info("\u{1F3A8} Testing VS Code decoration rendering...");let i=class i{constructor(){this._onDidChangeFileDecorations=new Y.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event}provideFileDecoration(s){let n=Qo(s.fsPath||s.path),c=new Y.FileDecoration("TEST");return c.tooltip=`Test decoration for ${n}`,c.color=new Y.ThemeColor("charts.red"),a.info(`\u{1F9EA} Test provider returning decoration for: ${n}`),c}};d(i,"TestDecorationProvider");let e=i,t=new e,o=Y.window.registerFileDecorationProvider(t);return a.info("\u{1F9EA} Test decoration provider registered"),setTimeout(()=>{t._onDidChangeFileDecorations.fire(void 0),a.info("\u{1F504} Test decoration refresh triggered"),setTimeout(()=>{o.dispose(),a.info("\u{1F9EA} Test decoration provider disposed")},1e4)},1e3),"Test decoration provider registered for 10 seconds"}d(Xo,"testVSCodeDecorationRendering");async function Zo(){let a=M().getLogger();a.info("\u{1F527} Testing FileDecoration API...");let e=[];try{let o=new Y.FileDecoration("MIN");e.push({name:"Minimal decoration",success:!0,badge:o.badge}),a.info("\u2705 Minimal decoration created successfully")}catch(o){e.push({name:"Minimal decoration",success:!1,error:o.message}),a.error("\u274C Minimal decoration failed:",o)}try{let o=new Y.FileDecoration("FULL","Full decoration tooltip",new Y.ThemeColor("charts.blue"));o.propagate=!1,e.push({name:"Full decoration",success:!0,badge:o.badge,hasTooltip:!!o.tooltip,hasColor:!!o.color,propagate:o.propagate}),a.info("\u2705 Full decoration created successfully")}catch(o){e.push({name:"Full decoration",success:!1,error:o.message}),a.error("\u274C Full decoration failed:",o)}let t=["charts.red","charts.blue","charts.green","charts.yellow","terminal.ansiRed","terminal.ansiGreen","terminal.ansiBlue","editorError.foreground","editorWarning.foreground","editorInfo.foreground"];for(let o of t)try{e.push({name:`ThemeColor: ${o}`,success:!0,colorId:o})}catch(i){e.push({name:`ThemeColor: ${o}`,success:!1,error:i.message}),a.error(`\u274C ThemeColor ${o} failed:`,i)}return e}d(Zo,"testFileDecorationAPI");Wt.exports={testVSCodeDecorationRendering:Xo,testFileDecorationAPI:Zo}});var Nt=S((sr,Bt)=>{var m=require("vscode"),{fileSystem:ei}=H(),{getFileName:ti,getRelativePath:oi}=B();function ii({context:a,fileDateProvider:e,logger:t,generators:o}){let{generateWorkspaceActivityHTML:i,generatePerformanceAnalyticsHTML:r,generateDiagnosticsHTML:s,generateDiagnosticsWebview:n}=o,c=[];c.push(m.commands.registerCommand("explorerDates.showWorkspaceActivity",async()=>{try{let l=m.window.createWebviewPanel("workspaceActivity","Workspace File Activity",m.ViewColumn.One,{enableScripts:!0});if(!m.workspace.workspaceFolders){m.window.showWarningMessage("No workspace folder open");return}let u=m.workspace.workspaceFolders[0],h=[],w=await m.workspace.findFiles("**/*","**/node_modules/**",100);for(let g of w)try{let b=await ei.stat(g);(typeof b.isFile=="function"?b.isFile():!0)&&h.push({path:oi(u.uri.fsPath||u.uri.path,g.fsPath||g.path),modified:b.mtime instanceof Date?b.mtime:new Date(b.mtime),size:b.size})}catch{}h.sort((g,b)=>b.modified.getTime()-g.modified.getTime()),l.webview.html=i(h.slice(0,50)),t.info("Workspace activity panel opened")}catch(l){t.error("Failed to show workspace activity",l),m.window.showErrorMessage(`Failed to show workspace activity: ${l.message}`)}})),c.push(m.commands.registerCommand("explorerDates.showPerformanceAnalytics",async()=>{try{let l=m.window.createWebviewPanel("performanceAnalytics","Explorer Dates Performance Analytics",m.ViewColumn.One,{enableScripts:!0}),u=e?e.getMetrics():{};l.webview.html=r(u),t.info("Performance analytics panel opened")}catch(l){t.error("Failed to show performance analytics",l),m.window.showErrorMessage(`Failed to show performance analytics: ${l.message}`)}})),c.push(m.commands.registerCommand("explorerDates.debugCache",async()=>{try{if(e){let l=e.getMetrics(),u={"Cache Summary":{"Memory Cache Size":l.cacheSize,"Cache Hit Rate":l.cacheHitRate,"Total Hits":l.cacheHits,"Total Misses":l.cacheMisses,"Cache Timeout":`${l.cacheDebugging.cacheTimeout}ms`},"Advanced Cache":l.advancedCache||"Not available","Sample Cache Keys":l.cacheDebugging.memoryCacheKeys||[]};m.window.showInformationMessage(`Cache Debug Info:
${JSON.stringify(u,null,2)}`,{modal:!0}),t.info("Cache debug info displayed",u)}}catch(l){t.error("Failed to show cache debug info",l),m.window.showErrorMessage(`Failed to show cache debug info: ${l.message}`)}})),c.push(m.commands.registerCommand("explorerDates.runDiagnostics",async()=>{try{let l=m.workspace.getConfiguration("explorerDates"),u=m.window.activeTextEditor,h={"Extension Status":{"Provider Active":e?"Yes":"No","Decorations Enabled":l.get("showDateDecorations",!0)?"Yes":"No","VS Code Version":m.version,"Extension Version":a.extension.packageJSON.version}};if(u){let{uri:g}=u.document;g.scheme==="file"&&(h["Current File"]={"File Path":g.fsPath,"File Extension":ti(g.fsPath||g.path).split(".").pop()||"No extension","Is Excluded":e?await e._isExcludedSimple(g):"Unknown"})}if(h.Configuration={"Excluded Folders":l.get("excludedFolders",[]),"Excluded Patterns":l.get("excludedPatterns",[]),"Color Scheme":l.get("colorScheme","none"),"Cache Timeout":`${l.get("cacheTimeout",3e4)}ms`},e){let g=e.getMetrics();h.Performance={"Total Decorations":g.totalDecorations,"Cache Size":g.cacheSize,"Cache Hit Rate":g.cacheHitRate,Errors:g.errors},g.performanceTiming&&(h["Performance Timing"]={"Avg Git Blame (ms)":g.performanceTiming.avgGitBlameMs,"Avg File Stat (ms)":g.performanceTiming.avgFileStatMs,"Git Calls":g.performanceTiming.gitBlameCalls,"File Stat Calls":g.performanceTiming.fileStatCalls,"Total Git Time (ms)":g.performanceTiming.totalGitBlameTimeMs,"Total File Stat Time (ms)":g.performanceTiming.totalFileStatTimeMs})}let w=m.window.createWebviewPanel("explorerDatesDiagnostics","Explorer Dates Diagnostics",m.ViewColumn.One,{enableScripts:!0});w.webview.html=s(h),t.info("Diagnostics panel opened",h)}catch(l){t.error("Failed to run diagnostics",l),m.window.showErrorMessage(`Failed to run diagnostics: ${l.message}`)}})),c.push(m.commands.registerCommand("explorerDates.testDecorations",async()=>{try{t.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let{DecorationDiagnostics:l}=Lt(),h=await new l(e).runComprehensiveDiagnostics(),w=m.window.createWebviewPanel("decorationDiagnostics","Decoration Diagnostics - Root Cause Analysis",m.ViewColumn.One,{enableScripts:!0});w.webview.html=n(h);let g=[],b=[];Object.values(h.tests).forEach(W=>{W.issues&&W.issues.forEach(N=>{N.startsWith("CRITICAL:")?g.push(N):N.startsWith("WARNING:")&&b.push(N)})}),g.length>0?m.window.showErrorMessage(`CRITICAL ISSUES FOUND: ${g.join(", ")}`):b.length>0?m.window.showWarningMessage(`Warnings found: ${b.length} potential issues detected. Check diagnostics panel.`):m.window.showInformationMessage("No critical issues found. Decorations should be working properly."),t.info("\u{1F50D} Comprehensive diagnostics completed",h)}catch(l){t.error("Failed to run comprehensive diagnostics",l),m.window.showErrorMessage(`Diagnostics failed: ${l.message}`)}})),c.push(m.commands.registerCommand("explorerDates.monitorDecorations",async()=>{if(!e){m.window.showErrorMessage("Decoration provider not available");return}e.startProviderCallMonitoring(),e.forceRefreshAllDecorations(),setTimeout(()=>{let l=e.getProviderCallStats(),u=`VS Code Decoration Requests: ${l.totalCalls} calls for ${l.uniqueFiles} files`;m.window.showInformationMessage(u),t.info("\u{1F50D} Decoration monitoring results:",l)},5e3),m.window.showInformationMessage("Started monitoring VS Code decoration requests. Results in 5 seconds...")})),c.push(m.commands.registerCommand("explorerDates.testVSCodeRendering",async()=>{try{let{testVSCodeDecorationRendering:l,testFileDecorationAPI:u}=Ot();t.info("\u{1F3A8} Testing VS Code decoration rendering system...");let h=await u();t.info("\u{1F527} FileDecoration API tests:",h);let w=await l();t.info("\u{1F3A8} Decoration rendering test:",w),m.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.')}catch(l){t.error("Failed to test VS Code rendering:",l),m.window.showErrorMessage(`VS Code rendering test failed: ${l.message}`)}})),c.push(m.commands.registerCommand("explorerDates.quickFix",async()=>{try{let l=m.workspace.getConfiguration("explorerDates"),u=[];l.get("showDateDecorations",!0)||u.push({issue:"Date decorations are disabled",description:"Enable date decorations",fix:d(async()=>l.update("showDateDecorations",!0,m.ConfigurationTarget.Global),"fix")});let h=l.get("excludedPatterns",[]);if(h.includes("**/*")&&u.push({issue:"All files are excluded by pattern",description:"Remove overly broad exclusion pattern",fix:d(async()=>{let g=h.filter(b=>b!=="**/*");await l.update("excludedPatterns",g,m.ConfigurationTarget.Global)},"fix")}),u.length===0){m.window.showInformationMessage("No common issues detected. Decorations should be working.");return}let w=await m.window.showQuickPick(u.map(g=>({label:g.description,description:g.issue,fix:g.fix})),{placeHolder:"Select an issue to fix automatically"});w&&(await w.fix(),m.window.showInformationMessage("Fixed! Try refreshing decorations now."),e&&(e.clearAllCaches(),e.refreshAll()))}catch(l){t.error("Failed to run quick fix",l),m.window.showErrorMessage(`Failed to run quick fix: ${l.message}`)}})),c.push(m.commands.registerCommand("explorerDates.showKeyboardShortcuts",async()=>{try{e?._accessibility?await e._accessibility.showKeyboardShortcutsHelp():m.window.showInformationMessage("Keyboard shortcuts: Ctrl+Shift+D (toggle), Ctrl+Shift+C (copy date), Ctrl+Shift+I (file details), Ctrl+Shift+R (refresh), Ctrl+Shift+A (workspace activity)"),t.info("Keyboard shortcuts help shown")}catch(l){t.error("Failed to show keyboard shortcuts help",l),m.window.showErrorMessage(`Failed to show keyboard shortcuts help: ${l.message}`)}})),c.forEach(l=>a.subscriptions.push(l))}d(ii,"registerAnalysisCommands");Bt.exports={registerAnalysisCommands:ii}});var jt=S((nr,Ut)=>{var X=require("vscode");function ri({context:a,logger:e,getOnboardingManager:t}){let o=[];o.push(X.commands.registerCommand("explorerDates.showFeatureTour",async()=>{try{await t().showFeatureTour(),e.info("Feature tour opened")}catch(i){e.error("Failed to show feature tour",i),X.window.showErrorMessage(`Failed to show feature tour: ${i.message}`)}})),o.push(X.commands.registerCommand("explorerDates.showQuickSetup",async()=>{try{await t().showQuickSetupWizard(),e.info("Quick setup wizard opened")}catch(i){e.error("Failed to show quick setup wizard",i),X.window.showErrorMessage(`Failed to show quick setup wizard: ${i.message}`)}})),o.push(X.commands.registerCommand("explorerDates.showWhatsNew",async()=>{try{let i=a.extension.packageJSON.version;await t().showWhatsNew(i),e.info("What's new panel opened")}catch(i){e.error("Failed to show what's new",i),X.window.showErrorMessage(`Failed to show what's new: ${i.message}`)}})),o.forEach(i=>a.subscriptions.push(i))}d(ri,"registerOnboardingCommands");Ut.exports={registerOnboardingCommands:ri}});var Ht=S((lr,Gt)=>{var y=require("vscode"),{getLogger:si}=M(),{getLocalization:ai}=se(),qe=class qe{constructor(e){this._context=e,this._logger=si(),this._l10n=ai(),this._hasShownWelcome=e.globalState.get("explorerDates.hasShownWelcome",!1),this._hasCompletedSetup=e.globalState.get("explorerDates.hasCompletedSetup",!1),this._onboardingVersion=e.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this._hasShownWelcome,hasCompletedSetup:this._hasCompletedSetup,onboardingVersion:this._onboardingVersion})}async shouldShowOnboarding(){let e=this._context.extension.packageJSON.version;return!this._hasShownWelcome||!this._hasCompletedSetup||this._shouldShowVersionUpdate(e)}_shouldShowVersionUpdate(e){if(this._onboardingVersion==="0.0.0")return!0;let[t]=e.split(".").map(Number),[o]=this._onboardingVersion.split(".").map(Number);return t>o}_isMinorUpdate(e){if(this._onboardingVersion==="0.0.0")return!1;let[t,o]=e.split(".").map(Number),[i,r]=this._onboardingVersion.split(".").map(Number);return t===i&&o>r}async showWelcomeMessage(){try{let e=this._context.extension.packageJSON.version,t=this._hasShownWelcome,o=this._isMinorUpdate(e);if(o)return this._showGentleUpdateNotification(e);let i=t?`Explorer Dates has been updated to v${e} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!",r=t?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"],s=await y.window.showInformationMessage(i,{modal:!1},...r);switch(await this._context.globalState.update("explorerDates.hasShownWelcome",!0),await this._context.globalState.update("explorerDates.onboardingVersion",e),s){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(e);break;case"\u2699\uFE0F Settings":await y.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await y.commands.executeCommand("explorerDates.previewConfiguration",i.settings);break;case"clearPreview":await y.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action:s,isUpdate:t,isMinorUpdate:o})}catch(e){this._logger.error("Failed to show welcome message",e)}}async _showGentleUpdateNotification(e){let t=y.window.createStatusBarItem(y.StatusBarAlignment.Right,100);t.text=`$(check) Explorer Dates updated to v${e}`,t.tooltip="Click to see what's new in Explorer Dates",t.command="explorerDates.showWhatsNew",t.show(),setTimeout(()=>{t.dispose()},1e4),await this._context.globalState.update("explorerDates.onboardingVersion",e),this._logger.info("Showed gentle update notification",{version:e})}async showQuickSetupWizard(){try{let e=y.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateSetupWizardHTML(),e.webview.onDidReceiveMessage(async t=>{await this._handleSetupWizardMessage(t,e)}),this._logger.info("Quick setup wizard opened")}catch(e){this._logger.error("Failed to show setup wizard",e)}}async _handleSetupWizardMessage(e,t){try{switch(e.command){case"applyConfiguration":await this._applyQuickConfiguration(e.configuration),await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),y.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&(await y.commands.executeCommand("explorerDates.previewConfiguration",e.settings),this._logger.info("Configuration preview applied via webview",e.settings));break;case"clearPreview":await y.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await y.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(o){this._logger.error("Failed to handle setup wizard message",o)}}async _applyQuickConfiguration(e){let t=y.workspace.getConfiguration("explorerDates");if(e.preset){let i=this._getConfigurationPresets()[e.preset];if(i){this._logger.info(`Applying preset: ${e.preset}`,i.settings);for(let[r,s]of Object.entries(i.settings))await t.update(r,s,y.ConfigurationTarget.Global),this._logger.debug(`Updated setting: explorerDates.${r} = ${s}`);this._logger.info(`Applied preset: ${e.preset}`,i.settings),y.window.showInformationMessage(`Applied "${i.name}" configuration. Changes should be visible immediately!`)}}if(e.individual){for(let[o,i]of Object.entries(e.individual))await t.update(o,i,y.ConfigurationTarget.Global);this._logger.info("Applied individual settings",e.individual)}try{await y.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(o){this._logger.warn("Failed to refresh decorations after configuration change",o)}}_getConfigurationPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:30,enableContextMenu:!0,showStatusBar:!0}},powerUser:{name:"Power User",description:"Maximum information - all features enabled with vibrant colors",settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"both",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:14,enableContextMenu:!0,showStatusBar:!0,smartExclusions:!0,progressiveLoading:!0,persistentCache:!0}},gitFocused:{name:"Git-Focused",description:"Show author initials as badges with full Git information in tooltips",settings:{dateDecorationFormat:"smart",colorScheme:"file-type",highContrastMode:!1,showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}async showFeatureTour(){try{let e=y.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateFeatureTourHTML(),e.webview.onDidReceiveMessage(async t=>{t.command==="openSettings"?await y.commands.executeCommand("workbench.action.openSettings",t.setting||"explorerDates"):t.command==="runCommand"&&await y.commands.executeCommand(t.commandId)}),this._logger.info("Feature tour opened")}catch(e){this._logger.error("Failed to show feature tour",e)}}_generateSetupWizardHTML(){let e=this._getConfigurationPresets(),t={minimal:e.minimal,developer:e.developer,accessible:e.accessible};return`
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
                    
                    ${Object.entries(t).map(([r,s])=>`
            <div class="preset-option" data-preset="${r}" 
                 onmouseenter="previewConfiguration({preset: '${r}'})" 
                 onmouseleave="clearPreview()">
                <h3>${s.name}</h3>
                <p>${s.description}</p>
                <div class="preset-actions">
                    <button onclick="previewConfiguration({preset: '${r}'})">\u{1F441}\uFE0F Preview</button>
                    <button onclick="applyConfiguration({preset: '${r}'})">\u2705 Select ${s.name}</button>
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
                <\/script>
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
                <\/script>
            </body>
            </html>
        `}async showTipsAndTricks(){let e=[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."},{icon:"\u{1F4CA}",title:"Performance Analytics",description:'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'},{icon:"\u{1F50D}",title:"Context Menu",description:"Right-click any file to access Git history, file details, and quick actions."}],t=e[Math.floor(Math.random()*e.length)],o=`\u{1F4A1} **Tip**: ${t.title}
${t.description}`;await y.window.showInformationMessage(o,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(e){try{let t=y.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${e} - What's New`,y.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1});t.webview.html=this._generateWhatsNewHTML(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"openSettings":await y.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break;case"tryFeature":o.feature==="badgePriority"&&(await y.workspace.getConfiguration("explorerDates").update("badgePriority","author",y.ConfigurationTarget.Global),y.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":t.dispose();break}})}catch(t){this._logger.error("Failed to show what's new",t)}}_generateWhatsNewHTML(e){return`
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
                <\/script>
            </body>
            </html>
        `}};d(qe,"OnboardingManager");var He=qe;Gt.exports={OnboardingManager:He}});var Vt=S((hr,qt)=>{var C=require("vscode"),{getLogger:ni}=M(),{fileSystem:ci}=H(),{GLOBAL_STATE_KEYS:li}=ae(),E=ni(),Ke=class Ke{constructor(e){this._context=e,this._storage=e?.globalState||null,this._storageKey=li.TEMPLATE_STORE,this._fs=ci,this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),E.info("Workspace Templates Manager initialized")}_getStoredTemplates(){return this._storage?this._storage.get(this._storageKey,{}):{}}async _saveStoredTemplates(e){if(!this._storage)throw new Error("Template storage unavailable");await this._storage.update(this._storageKey,e)}_getTemplate(e){return this.builtInTemplates[e]?this.builtInTemplates[e]:this._getStoredTemplates()[e]}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"file-type","explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludedPatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"],"explorerDates.enableContextMenu":!0,"explorerDates.showGitInfo":"author"}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"absolute-long","explorerDates.colorScheme":"none","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"none","explorerDates.highContrastMode":!1,"explorerDates.excludedPatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"],"explorerDates.badgePriority":"size"}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"subtle","explorerDates.showFileSize":!1,"explorerDates.excludedPatterns":["**/node_modules/**","**/.git/**"],"explorerDates.fadeOldFiles":!1,"explorerDates.enableContextMenu":!1}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"recency","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"author","explorerDates.enableContextMenu":!0,"explorerDates.showStatusBar":!0,"explorerDates.smartExclusions":!0,"explorerDates.progressiveLoading":!0,"explorerDates.persistentCache":!0,"explorerDates.enableReporting":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"none","explorerDates.showFileSize":!1,"explorerDates.badgePriority":"time","explorerDates.enableContextMenu":!1,"explorerDates.progressiveLoading":!1}}}}async saveCurrentConfiguration(e,t=""){try{let o=C.workspace.getConfiguration("explorerDates"),i={},r=o.inspect();if(r)for(let[u,h]of Object.entries(r))h&&typeof h=="object"&&"workspaceValue"in h?i[`explorerDates.${u}`]=h.workspaceValue:h&&typeof h=="object"&&"globalValue"in h&&(i[`explorerDates.${u}`]=h.globalValue);let s={name:e,description:t,createdAt:new Date().toISOString(),version:"1.0.0",settings:i},n=e.toLowerCase().replace(/[^a-z0-9-]/g,"-"),c=this._getStoredTemplates();c[n]=s,await this._saveStoredTemplates(c);let l=o.get("templateSyncPath","");if(l&&!this._fs.isWeb)try{let u=`${l.replace(/[/\\]?$/,"")}/${n}.json`;await this._fs.writeFile(u,JSON.stringify(s,null,2)),E.info(`Synced template to ${u}`)}catch(u){E.warn("Failed to sync template to disk path",u)}return C.window.showInformationMessage(`Template "${e}" saved successfully!`),E.info(`Saved workspace template: ${e}`),!0}catch(o){return E.error("Failed to save template:",o),C.window.showErrorMessage(`Failed to save template: ${o.message}`),!1}}async loadTemplate(e){try{let t=this._getTemplate(e);if(!t)throw new Error(`Template "${e}" not found`);let o=C.workspace.getConfiguration();for(let[i,r]of Object.entries(t.settings))await o.update(i,r,C.ConfigurationTarget.Workspace);return C.window.showInformationMessage(`Template "${t.name}" applied successfully!`),E.info(`Applied workspace template: ${t.name}`),!0}catch(t){return E.error("Failed to load template:",t),C.window.showErrorMessage(`Failed to load template: ${t.message}`),!1}}async getAvailableTemplates(){let e=[];for(let[t,o]of Object.entries(this.builtInTemplates))e.push({id:t,name:o.name,description:o.description,type:"built-in",createdAt:null});try{let t=this._getStoredTemplates();for(let[o,i]of Object.entries(t))e.push({id:o,name:i.name,description:i.description,type:"custom",createdAt:i.createdAt})}catch(t){E.error("Failed to load custom templates:",t)}return e}async deleteTemplate(e){try{if(this.builtInTemplates[e])return C.window.showErrorMessage("Cannot delete built-in templates"),!1;let t=this._getStoredTemplates();if(!t[e])throw new Error(`Template "${e}" not found`);return delete t[e],await this._saveStoredTemplates(t),C.window.showInformationMessage(`Template "${e}" deleted successfully!`),E.info(`Deleted workspace template: ${e}`),!0}catch(t){return E.error("Failed to delete template:",t),C.window.showErrorMessage(`Failed to delete template: ${t.message}`),!1}}async exportTemplate(e,t){try{let o=this._getTemplate(e);if(!o)throw new Error(`Template "${e}" not found`);let i=JSON.stringify(o,null,2);if(this._fs.isWeb){let s=encodeURIComponent(i);return await C.env.openExternal(C.Uri.parse(`data:application/json;charset=utf-8,${s}`)),C.window.showInformationMessage("Template download triggered in browser"),!0}let r=t instanceof C.Uri?t.fsPath:t;return await this._fs.writeFile(r,i),C.window.showInformationMessage(`Template exported to ${r}`),E.info(`Exported template ${e} to ${r}`),!0}catch(o){return E.error("Failed to export template:",o),C.window.showErrorMessage(`Failed to export template: ${o.message}`),!1}}async importTemplate(e){try{let t=e instanceof C.Uri?e:C.Uri.file(e),o=await this._fs.readFile(t,"utf8"),i=JSON.parse(o);if(!i.name||!i.settings)throw new Error("Invalid template format");let r=i.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),s=this._getStoredTemplates();return s[r]=i,await this._saveStoredTemplates(s),C.window.showInformationMessage(`Template "${i.name}" imported successfully!`),E.info(`Imported template: ${i.name}`),!0}catch(t){return E.error("Failed to import template:",t),C.window.showErrorMessage(`Failed to import template: ${t.message}`),!1}}async showTemplateManager(){try{let e=await this.getAvailableTemplates(),t=C.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",C.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});t.webview.html=this.getTemplateManagerHtml(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"loadTemplate":await this.loadTemplate(o.templateId);break;case"deleteTemplate":{await this.deleteTemplate(o.templateId);let i=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:i});break}case"exportTemplate":{let i=await C.window.showSaveDialog({defaultUri:C.Uri.file(`${o.templateId}.json`),filters:{JSON:["json"]}});i&&await this.exportTemplate(o.templateId,i);break}case"saveConfig":{await this.saveCurrentConfiguration(o.name,o.description);let i=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:i});break}case"importTemplate":{let i=await C.window.showOpenDialog({canSelectMany:!1,filters:{JSON:["json"]}});if(i&&i[0]){await this.importTemplate(i[0]);let r=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:r})}break}}}),E.info("Template Manager opened")}catch(e){E.error("Failed to show template manager:",e),C.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(e){return`<!DOCTYPE html>
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
        </html>`}};d(Ke,"WorkspaceTemplatesManager");var Ve=Ke;qt.exports={WorkspaceTemplatesManager:Ve}});var Jt=S((gr,Kt)=>{var A=require("vscode"),{getLogger:di}=M(),Qe=class Qe{constructor(){this._listeners=new Map}on(e,t){let o=this._listeners.get(e)||[];return o.push(t),this._listeners.set(e,o),this}off(e,t){let o=this._listeners.get(e);if(!o)return this;let i=o.indexOf(t);return i!==-1&&o.splice(i,1),this}emit(e,...t){let o=this._listeners.get(e);return o&&o.slice().forEach(i=>{try{i(...t)}catch{}}),this}};d(Qe,"BaseEventEmitter");var Je=Qe,F=di(),Xe=class Xe extends Je{constructor(){super(),this.plugins=new Map,this.api=null,this.decorationProviders=new Map,this._configurationWatcher=null,this.initialize(),this._setupConfigurationListener()}initialize(){this.api=this.createPublicApi(),F.info("Extension API Manager initialized")}createPublicApi(){return{getFileDecorations:this.getFileDecorations.bind(this),refreshDecorations:this.refreshDecorations.bind(this),registerPlugin:this.registerPlugin.bind(this),unregisterPlugin:this.unregisterPlugin.bind(this),registerDecorationProvider:this.registerDecorationProvider.bind(this),unregisterDecorationProvider:this.unregisterDecorationProvider.bind(this),onDecorationChanged:this.onDecorationChanged.bind(this),onFileScanned:this.onFileScanned.bind(this),formatDate:this.formatDate.bind(this),getFileStats:this.getFileStats.bind(this),version:"1.1.0",apiVersion:"1.0.0"}}async getFileDecorations(e){if(!this._isApiUsable("getFileDecorations"))return[];try{let t=[];for(let o of e){let i=A.Uri.file(o),r=await this.getDecorationForFile(i);r&&t.push({uri:i.toString(),decoration:r})}return t}catch(t){return F.error("Failed to get file decorations:",t),[]}}async getDecorationForFile(e){if(!this._isApiUsable("getDecorationForFile"))return null;try{let t=await A.workspace.fs.stat(e),o=new Date(t.mtime),i={badge:this.formatDate(o,"smart"),color:void 0,tooltip:`Modified: ${o.toLocaleString()}`};for(let[r,s]of this.decorationProviders)try{let n=await s.provideDecoration(e,t,i);n&&(i={...i,...n})}catch(n){F.error(`Decoration provider ${r} failed:`,n)}return i}catch(t){return F.error("Failed to get decoration for file:",t),null}}async refreshDecorations(e=null){if(!this._isApiUsable("refreshDecorations"))return!1;try{return this.emit("decorationRefreshRequested",e),F.info("Decoration refresh requested"),!0}catch(t){return F.error("Failed to refresh decorations:",t),!1}}registerPlugin(e,t){if(!this._canUsePlugins(`registerPlugin:${e}`))return!1;try{if(!this.validatePlugin(t))throw new Error("Invalid plugin structure");return this.plugins.set(e,{...t,registeredAt:new Date,active:!0}),typeof t.activate=="function"&&t.activate(this.api),this.emit("pluginRegistered",{pluginId:e,plugin:t}),F.info(`Plugin registered: ${e}`),!0}catch(o){return F.error(`Failed to register plugin ${e}:`,o),!1}}unregisterPlugin(e){if(!this._canUsePlugins(`unregisterPlugin:${e}`))return!1;try{let t=this.plugins.get(e);return t?(typeof t.deactivate=="function"&&t.deactivate(),this.plugins.delete(e),this.emit("pluginUnregistered",{pluginId:e}),F.info(`Plugin unregistered: ${e}`),!0):!1}catch(t){return F.error(`Failed to unregister plugin ${e}:`,t),!1}}registerDecorationProvider(e,t){if(!this._canUsePlugins(`registerDecorationProvider:${e}`))return!1;try{if(!this.validateDecorationProvider(t))throw new Error("Invalid decoration provider");return this.decorationProviders.set(e,t),this.emit("decorationProviderRegistered",{providerId:e,provider:t}),F.info(`Decoration provider registered: ${e}`),!0}catch(o){return F.error(`Failed to register decoration provider ${e}:`,o),!1}}unregisterDecorationProvider(e){if(!this._canUsePlugins(`unregisterDecorationProvider:${e}`))return!1;try{let t=this.decorationProviders.delete(e);return t&&(this.emit("decorationProviderUnregistered",{providerId:e}),F.info(`Decoration provider unregistered: ${e}`)),t}catch(t){return F.error(`Failed to unregister decoration provider ${e}:`,t),!1}}onDecorationChanged(e){return this.on("decorationChanged",e),()=>this.off("decorationChanged",e)}onFileScanned(e){return this.on("fileScanned",e),()=>this.off("fileScanned",e)}formatDate(e,t=null){if(!this._isApiUsable("formatDate"))return"";try{let o=A.workspace.getConfiguration("explorerDates"),i=t||o.get("displayFormat","smart"),s=new Date-e,n=Math.floor(s/(1e3*60*60*24));switch(i){case"relative-short":return this.getRelativeTimeShort(s);case"relative-long":return this.getRelativeTimeLong(s);case"absolute-short":return e.toLocaleDateString("en-US",{month:"short",day:"numeric"});case"absolute-long":return e.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});case"smart":default:return n<7?this.getRelativeTimeShort(s):e.toLocaleDateString("en-US",{month:"short",day:"numeric"})}}catch(o){return F.error("Failed to format date:",o),e.toLocaleDateString()}}async getFileStats(e){if(!this._isApiUsable("getFileStats"))return null;try{let t=A.Uri.file(e),o=await A.workspace.fs.stat(t);return{path:e,size:o.size,created:new Date(o.ctime),modified:new Date(o.mtime),type:o.type===A.FileType.Directory?"directory":"file"}}catch(t){return F.error("Failed to get file stats:",t),null}}getApi(){return this.api}getRegisteredPlugins(){let e=[];for(let[t,o]of this.plugins)e.push({id:t,name:o.name,version:o.version,author:o.author,active:o.active,registeredAt:o.registeredAt});return e}validatePlugin(e){return!(!e||typeof e!="object"||!e.name||!e.version||e.activate&&typeof e.activate!="function"||e.deactivate&&typeof e.deactivate!="function")}validateDecorationProvider(e){return!(!e||typeof e!="object"||typeof e.provideDecoration!="function")}getRelativeTimeShort(e){let t=Math.floor(e/1e3),o=Math.floor(t/60),i=Math.floor(o/60),r=Math.floor(i/24);if(t<60)return`${t}s`;if(o<60)return`${o}m`;if(i<24)return`${i}h`;if(r<30)return`${r}d`;let s=Math.floor(r/30);return s<12?`${s}mo`:`${Math.floor(s/12)}y`}getRelativeTimeLong(e){let t=Math.floor(e/1e3),o=Math.floor(t/60),i=Math.floor(o/60),r=Math.floor(i/24);if(t<60)return`${t} second${t!==1?"s":""} ago`;if(o<60)return`${o} minute${o!==1?"s":""} ago`;if(i<24)return`${i} hour${i!==1?"s":""} ago`;if(r<30)return`${r} day${r!==1?"s":""} ago`;let s=Math.floor(r/30);if(s<12)return`${s} month${s!==1?"s":""} ago`;let n=Math.floor(s/12);return`${n} year${n!==1?"s":""} ago`}getColorForAge(e){if(!A.workspace.getConfiguration("explorerDates").get("colorCoding",!1))return;let r=(new Date-e)/(1e3*60*60);return r<1?new A.ThemeColor("charts.green"):r<24?new A.ThemeColor("charts.yellow"):r<168?new A.ThemeColor("charts.orange"):new A.ThemeColor("charts.red")}createExamplePlugin(){return{name:"File Size Display",version:"1.0.0",author:"Explorer Dates",description:"Adds file size to decorations",activate:d(e=>{e.registerDecorationProvider("fileSize",{provideDecoration:d(async(t,o,i)=>{let r=this.formatFileSize(o.size);return{badge:`${i.badge} \u2022 ${r}`,tooltip:`${i.tooltip}
Size: ${r}`}},"provideDecoration")})},"activate"),deactivate:d(()=>{},"deactivate")}}_setupConfigurationListener(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=A.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableExtensionApi")||e.affectsConfiguration("explorerDates.allowExternalPlugins"))&&F.info("Explorer Dates API configuration changed",{apiEnabled:this._isApiEnabled(),externalPluginsAllowed:this._allowsExternalPlugins()})})}_isApiEnabled(){return A.workspace.getConfiguration("explorerDates").get("enableExtensionApi",!0)}_allowsExternalPlugins(){return A.workspace.getConfiguration("explorerDates").get("allowExternalPlugins",!0)}_isApiUsable(e){return this._isApiEnabled()?!0:(F.warn(`Explorer Dates API request "${e}" ignored because enableExtensionApi is disabled.`),!1)}_canUsePlugins(e){return this._isApiUsable(e)?this._allowsExternalPlugins()?!0:(F.warn(`Explorer Dates plugin request "${e}" ignored because allowExternalPlugins is disabled.`),!1):!1}formatFileSize(e){if(e===0)return"0 B";let t=1024,o=["B","KB","MB","GB"],i=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,i)).toFixed(1))+" "+o[i]}dispose(){this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this.plugins.clear(),this.decorationProviders.clear(),F.info("Extension API Manager disposed")}};d(Xe,"ExtensionApiManager");var Ye=Xe;Kt.exports={ExtensionApiManager:Ye}});var Qt=S((fr,Yt)=>{var x=require("vscode"),{getLogger:hi}=M(),{fileSystem:ui}=H(),{getExtension:Ze,normalizePath:gi}=B(),I=hi(),pi=!0,tt=class tt{constructor(){this.fileActivityCache=new Map,this.allowedFormats=["json","csv","html","markdown"],this.activityTrackingDays=30,this.activityCutoffMs=null,this.timeTrackingIntegration="none",this._configurationWatcher=null,this._fileWatcher=null,this._fileWatcherSubscriptions=[],this._loadConfiguration(),this._setupConfigurationWatcher(),this.initialize()}_loadConfiguration(){try{let e=x.workspace.getConfiguration("explorerDates"),t=e.get("reportFormats",["json","html"]),o=["json","csv","html","markdown"];this.allowedFormats=Array.from(new Set([...t,...o]));let i=e.get("activityTrackingDays",30);this.activityTrackingDays=Math.max(1,Math.min(365,i)),this.activityCutoffMs=this.activityTrackingDays*24*60*60*1e3,this.timeTrackingIntegration=e.get("timeTrackingIntegration","none")}catch(e){I.error("Failed to load reporting configuration",e)}}_setupConfigurationWatcher(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=x.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.reportFormats")||e.affectsConfiguration("explorerDates.activityTrackingDays")||e.affectsConfiguration("explorerDates.timeTrackingIntegration"))&&(this._loadConfiguration(),I.info("Reporting configuration updated",{allowedFormats:this.allowedFormats,activityTrackingDays:this.activityTrackingDays,timeTrackingIntegration:this.timeTrackingIntegration}))})}async initialize(){try{this.startFileWatcher(),I.info("Export & Reporting Manager initialized")}catch(e){I.error("Failed to initialize Export & Reporting Manager:",e)}}startFileWatcher(){if(this._fileWatcher)return;let e=x.workspace.createFileSystemWatcher("**/*");this._fileWatcher=e,this._fileWatcherSubscriptions=[e.onDidChange(t=>this.recordFileActivity(t,"modified")),e.onDidCreate(t=>this.recordFileActivity(t,"created")),e.onDidDelete(t=>this.recordFileActivity(t,"deleted"))]}recordFileActivity(e,t){try{let o=e.fsPath||e.path,i=new Date;this.fileActivityCache.has(o)||this.fileActivityCache.set(o,[]),this.fileActivityCache.get(o).push({action:t,timestamp:i,path:o}),this._enforceActivityRetention(o)}catch(o){I.error("Failed to record file activity:",o)}}_enforceActivityRetention(e){let t=this.fileActivityCache.get(e);if(!(!t||t.length===0)){if(this.activityCutoffMs){let o=new Date(Date.now()-this.activityCutoffMs);for(;t.length&&t[0].timestamp<o;)t.shift()}t.length>100&&t.splice(0,t.length-100)}}async generateFileModificationReport(e={}){try{let{format:t="json",timeRange:o="all",includeDeleted:i=!1,outputPath:r=null}=e;if(!this.allowedFormats.includes(t)){let c=`Report format "${t}" is disabled. Allowed formats: ${this.allowedFormats.join(", ")}`;return x.window.showWarningMessage(c),I.warn(c),null}let s=await this.collectFileData(o,i),n=await this.formatReport(s,t);return r&&(await this.saveReport(n,r),x.window.showInformationMessage(`Report saved to ${r}`)),n}catch(t){return I.error("Failed to generate file modification report:",t),x.window.showErrorMessage("Failed to generate report"),null}}async collectFileData(e,t){let o=[],i=x.workspace.workspaceFolders;if(!i)return{files:[],summary:this.createSummary([])};for(let s of i){let n=await this.scanWorkspaceFolder(s.uri,e,t);o.push(...n)}let r=this.createSummary(o);return r.integrationTarget=this.timeTrackingIntegration,r.activityTrackingDays=this.activityTrackingDays,{generatedAt:new Date().toISOString(),workspace:i.map(s=>s.uri.fsPath),timeRange:e,files:o,summary:r}}async scanWorkspaceFolder(e,t,o){let i=[],s=x.workspace.getConfiguration("explorerDates").get("excludedPatterns",[]);try{let n=await x.workspace.fs.readDirectory(e);for(let[c,l]of n){let u=x.Uri.joinPath(e,c),h=x.workspace.asRelativePath(u);if(!this.isExcluded(h,s)){if(l===x.FileType.File){let w=await this.getFileData(u,t);w&&i.push(w)}else if(l===x.FileType.Directory){let w=await this.scanWorkspaceFolder(u,t,o);i.push(...w)}}}if(o&&e.fsPath){let c=this.getDeletedFiles(e.fsPath,t);i.push(...c)}}catch(n){I.error(`Failed to scan folder ${e.fsPath||e.path}:`,n)}return i}async getFileData(e,t){try{let o=await x.workspace.fs.stat(e),i=x.workspace.asRelativePath(e),r=e.fsPath||e.path,s=this.fileActivityCache.get(r)||[],n=this.filterActivitiesByTimeRange(s,t);return{path:i,fullPath:r,size:o.size,created:new Date(o.ctime),modified:new Date(o.mtime),type:this.getFileType(i),extension:Ze(i),activities:n,activityCount:n.length,lastActivity:n.length>0?n[n.length-1].timestamp:new Date(o.mtime)}}catch(o){return I.error(`Failed to get file data for ${e.fsPath||e.path}:`,o),null}}filterActivitiesByTimeRange(e,t){let o=e;if(t!=="all"){let i=new Date,r;switch(t){case"24h":r=new Date(i-1440*60*1e3);break;case"7d":r=new Date(i-10080*60*1e3);break;case"30d":r=new Date(i-720*60*60*1e3);break;case"90d":r=new Date(i-2160*60*60*1e3);break;default:r=null}r&&(o=o.filter(s=>s.timestamp>=r))}if(this.activityCutoffMs){let i=new Date(Date.now()-this.activityCutoffMs);o=o.filter(r=>r.timestamp>=i)}return o}getDeletedFiles(e,t){if(!e)return[];let o=[];for(let[i,r]of this.fileActivityCache)if(i.startsWith(e)){let s=r.filter(c=>c.action==="deleted"),n=this.filterActivitiesByTimeRange(s,t);n.length>0&&o.push({path:x.workspace.asRelativePath(i),fullPath:i,size:0,created:null,modified:null,type:"deleted",extension:Ze(i),activities:n,activityCount:n.length,lastActivity:n[n.length-1].timestamp})}return o}createSummary(e){let t={totalFiles:e.length,totalSize:e.reduce((i,r)=>i+(r.size||0),0),fileTypes:{},activityByDay:{},mostActiveFiles:[],recentlyModified:[],largestFiles:[],oldestFiles:[]};e.forEach(i=>{let r=i.type||"unknown";t.fileTypes[r]=(t.fileTypes[r]||0)+1});let o=new Date(Date.now()-this.activityTrackingDays*24*60*60*1e3);return e.forEach(i=>{i.activities.forEach(r=>{if(r.timestamp>=o){let s=r.timestamp.toISOString().split("T")[0];t.activityByDay[s]=(t.activityByDay[s]||0)+1}})}),t.mostActiveFiles=e.sort((i,r)=>r.activityCount-i.activityCount).slice(0,10).map(i=>({path:i.path,activityCount:i.activityCount,lastActivity:i.lastActivity})),t.recentlyModified=e.filter(i=>i.modified).sort((i,r)=>r.modified-i.modified).slice(0,20).map(i=>({path:i.path,modified:i.modified,size:i.size})),t.largestFiles=e.sort((i,r)=>(r.size||0)-(i.size||0)).slice(0,10).map(i=>({path:i.path,size:i.size,modified:i.modified})),t.oldestFiles=e.filter(i=>i.modified).sort((i,r)=>i.modified-r.modified).slice(0,10).map(i=>({path:i.path,modified:i.modified,size:i.size})),t}async formatReport(e,t){switch(t.toLowerCase()){case"json":return JSON.stringify(e,null,2);case"csv":return this.formatAsCSV(e);case"html":return this.formatAsHTML(e);case"markdown":return this.formatAsMarkdown(e);default:throw new Error(`Unsupported format: ${t}`)}}formatAsCSV(e){let t=["Path,Size,Created,Modified,Type,Extension,ActivityCount,LastActivity"];return e.files.forEach(o=>{t.push([o.path,o.size||0,o.created?o.created.toISOString():"",o.modified?o.modified.toISOString():"",o.type,o.extension,o.activityCount,o.lastActivity?o.lastActivity.toISOString():""].join(","))}),t.join(`
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
        ${Object.entries(e.summary.fileTypes).map(([t,o])=>`<tr><td>${t}</td><td>${o}</td></tr>`).join("")}
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
${Object.entries(e.summary.fileTypes).map(([t,o])=>`| ${t} | ${o} |`).join(`
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
`}async saveReport(e,t){try{if(pi){let i=encodeURIComponent(e);await x.env.openExternal(x.Uri.parse(`data:text/plain;charset=utf-8,${i}`)),x.window.showInformationMessage("Report download triggered in browser");return}let o=t instanceof x.Uri?t:x.Uri.file(t);await ui.writeFile(o,e,"utf8"),I.info(`Report saved to ${o.fsPath||o.path}`)}catch(o){throw I.error("Failed to save report:",o),o}}async exportToTimeTrackingTools(e={}){try{let{tool:t="generic",timeRange:o="7d"}=e,i=await this.collectFileData(o,!1);return this.formatForTimeTracking(i,t)}catch(t){return I.error("Failed to export to time tracking tools:",t),null}}formatForTimeTracking(e,t){let o=[];switch(e.files.forEach(i=>{i.activities.forEach(r=>{o.push({file:i.path,action:r.action,timestamp:r.timestamp,duration:this.estimateSessionDuration(r),project:this.extractProjectName(i.path)})})}),t){case"toggl":return this.formatForToggl(o);case"clockify":return this.formatForClockify(o);case"generic":default:return o}}formatForToggl(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),duration:t.duration*60,project:t.project,tags:[t.action,this.getFileType(t.file)]}))}formatForClockify(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),end:new Date(t.timestamp.getTime()+t.duration*60*1e3).toISOString(),project:t.project,tags:[t.action,this.getFileType(t.file)]}))}estimateSessionDuration(e){switch(e.action){case"created":return 15;case"modified":return 5;case"deleted":return 1;default:return 5}}extractProjectName(e){return gi(e).split("/")[0]||"Unknown Project"}getFileType(e){let t=Ze(e);return{".js":"javascript",".ts":"typescript",".py":"python",".java":"java",".cpp":"cpp",".html":"html",".css":"css",".md":"markdown",".json":"json",".xml":"xml",".txt":"text"}[t]||"other"}isExcluded(e,t){return t.some(o=>new RegExp(o.replace(/\*/g,".*")).test(e))}formatFileSize(e){if(e===0)return"0 B";let t=1024,o=["B","KB","MB","GB"],i=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,i)).toFixed(1))+" "+o[i]}async showReportDialog(){try{let e={"\u{1F4CA} Generate Full Report":"full","\u{1F4C5} Last 24 Hours":"24h","\u{1F4C5} Last 7 Days":"7d","\u{1F4C5} Last 30 Days":"30d","\u{1F4C5} Last 90 Days":"90d"},t=await x.window.showQuickPick(Object.keys(e),{placeHolder:"Select report time range"});if(!t)return;let o=e[t],i=["JSON","CSV","HTML","Markdown"],r=await x.window.showQuickPick(i,{placeHolder:"Select report format"});if(!r)return;let s=await x.window.showSaveDialog({defaultUri:x.Uri.file(`file-report.${r.toLowerCase()}`),filters:{[r]:[r.toLowerCase()]}});if(!s)return;await this.generateFileModificationReport({format:r.toLowerCase(),timeRange:o,outputPath:s.fsPath})}catch(e){I.error("Failed to show report dialog:",e),x.window.showErrorMessage("Failed to generate report")}}dispose(){if(this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._fileWatcherSubscriptions.length>0){for(let e of this._fileWatcherSubscriptions)e.dispose();this._fileWatcherSubscriptions=[]}this._fileWatcher&&(this._fileWatcher.dispose(),this._fileWatcher=null),this.fileActivityCache.clear(),I.info("Export & Reporting Manager disposed")}};d(tt,"ExportReportingManager");var et=tt;Yt.exports={ExportReportingManager:et}});var eo=S((wr,Zt)=>{var _=require("vscode"),{FileDateDecorationProvider:fi}=It(),{getLogger:mi}=M(),{getLocalization:wi}=se(),{fileSystem:vi}=H(),{registerCoreCommands:bi}=Rt(),{registerAnalysisCommands:_i}=Nt(),{registerOnboardingCommands:yi}=jt(),O,D,ce;function Ci(a){return`<!DOCTYPE html>
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
    </html>`}d(Ci,"getApiInformationHtml");function xi(a){let e=d(o=>{if(o<1024)return`${o} B`;let i=o/1024;return i<1024?`${i.toFixed(1)} KB`:`${(i/1024).toFixed(1)} MB`},"formatFileSize"),t=a.map(o=>`
        <tr>
            <td>${o.path}</td>
            <td>${o.modified.toLocaleString()}</td>
            <td>${e(o.size)}</td>
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
    `}d(xi,"generateWorkspaceActivityHTML");function Di(a){return`
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
            
            ${Object.entries(a).map(([t,o])=>{let i=Object.entries(o).map(([r,s])=>{let n=Array.isArray(s)?s.join(", ")||"None":s?.toString()||"N/A";return`
                <tr>
                    <td><strong>${r}:</strong></td>
                    <td>${n}</td>
                </tr>
            `}).join("");return`
            <div class="diagnostic-section">
                <h3>\u{1F50D} ${t}</h3>
                <table>
                    ${i}
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
    `}d(Di,"generateDiagnosticsHTML");function Si(a){return`<!DOCTYPE html>
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

        ${Object.entries(a.tests).map(([e,t])=>{let o=t.status==="OK"?"test-ok":t.status==="ISSUES_FOUND"?"test-warning":"test-error",i=t.status==="OK"?"status-ok":t.status==="ISSUES_FOUND"?"status-warning":"status-error";return`
            <div class="test-section ${o}">
                <h2>\u{1F9EA} ${e.replace(/([A-Z])/g," $1").replace(/^./,r=>r.toUpperCase())}</h2>
                <p class="${i}">Status: ${t.status}</p>
                
                ${t.issues&&t.issues.length>0?`
                    <h3>Issues Found:</h3>
                    ${t.issues.map(r=>`<div class="${r.startsWith("CRITICAL:")?"issue-critical":"issue-warning"}">\u26A0\uFE0F ${r}</div>`).join("")}
                `:""}
                
                ${t.settings?`
                    <h3>Settings:</h3>
                    <pre>${JSON.stringify(t.settings,null,2)}</pre>
                `:""}
                
                ${t.testFiles?`
                    <h3>File Tests:</h3>
                    ${t.testFiles.map(r=>`
                        <div class="file-test">
                            \u{1F4C4} ${r.file}: 
                            ${r.exists?"\u2705":"\u274C"} exists | 
                            ${r.excluded?"\u{1F6AB}":"\u2705"} ${r.excluded?"excluded":"included"} | 
                            ${r.hasDecoration?"\u{1F3F7}\uFE0F":"\u274C"} ${r.hasDecoration?`badge: ${r.badge}`:"no decoration"}
                        </div>
                    `).join("")}
                `:""}
                
                ${t.tests?`
                    <h3>Test Results:</h3>
                    ${t.tests.map(r=>`
                        <div class="badge-test">
                            ${r.success?"\u2705":"\u274C"} ${r.name}
                            ${r.badge?` \u2192 "${r.badge}"`:""}
                            ${r.error?` (${r.error})`:""}
                        </div>
                    `).join("")}
                `:""}
                
                ${t.cacheInfo?`
                    <h3>Cache Information:</h3>
                    <pre>${JSON.stringify(t.cacheInfo,null,2)}</pre>
                `:""}
                
                ${t.decorationExtensions&&t.decorationExtensions.length>0?`
                    <h3>Other Decoration Extensions:</h3>
                    ${t.decorationExtensions.map(r=>`
                        <div class="file-test">\u{1F50C} ${r.name} (${r.id})</div>
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
    </html>`}d(Si,"generateDiagnosticsWebview");function Fi(a){let e=d(t=>{if(t===0)return"0 B";let o=1024,i=["B","KB","MB","GB"],r=Math.floor(Math.log(t)/Math.log(o));return parseFloat((t/Math.pow(o,r)).toFixed(2))+" "+i[r]},"formatBytes");return`
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
            </div>
        </body>
        </html>
    `}d(Fi,"generatePerformanceAnalyticsHTML");function Xt(a){let e=_.window.createStatusBarItem(_.StatusBarAlignment.Right,100);e.command="explorerDates.showFileDetails",e.tooltip="Click to show detailed file information";let t=d(async()=>{try{let o=_.window.activeTextEditor;if(!o){e.hide();return}let i=o.document.uri;if(i.scheme!=="file"){e.hide();return}let r=await vi.stat(i),s=r.mtime instanceof Date?r.mtime:new Date(r.mtime),n=O._formatDateBadge(s,"smart"),c=O._formatFileSize(r.size,"auto");e.text=`$(clock) ${n} $(file) ${c}`,e.show()}catch(o){e.hide(),D.debug("Failed to update status bar",o)}},"updateStatusBar");return _.window.onDidChangeActiveTextEditor(t),_.window.onDidChangeTextEditorSelection(t),t(),a.subscriptions.push(e),e}d(Xt,"initializeStatusBar");async function Ti(a){try{D=mi(),ce=wi(),a.subscriptions.push(ce),D.info("Explorer Dates: Extension activated");let e=_.env.uiKind===_.UIKind.Web;await _.commands.executeCommand("setContext","explorerDates.gitFeaturesAvailable",!e);let t=_.workspace.getConfiguration("explorerDates"),o=t.get("enableWorkspaceTemplates",!0),i=t.get("enableReporting",!0),r=t.get("enableExtensionApi",!0);O=new fi;let s=_.window.registerFileDecorationProvider(O);a.subscriptions.push(s),a.subscriptions.push(O),a.subscriptions.push(D),await O.initializeAdvancedSystems(a);let n=null,c=null,l=null,u=null,h=d(()=>{if(!n){let{OnboardingManager:v}=Ht();n=new v(a)}return n},"getOnboardingManager"),w=d(()=>{if(!o)throw new Error("Workspace templates are disabled via explorerDates.enableWorkspaceTemplates");if(!c){let{WorkspaceTemplatesManager:v}=Vt();c=new v(a)}return c},"getWorkspaceTemplatesManager"),g=d(()=>{if(!l){let{ExtensionApiManager:v}=Jt();l=new v,a.subscriptions.push(l)}return l},"getExtensionApiManager"),b=d(()=>{if(!i)throw new Error("Reporting is disabled via explorerDates.enableReporting");if(!u){let{ExportReportingManager:v}=Qt();u=new v,a.subscriptions.push(u)}return u},"getExportReportingManager"),W=d(()=>g().getApi(),"apiFactory");r?a.exports=W:(a.exports=void 0,D.info("Explorer Dates API exports disabled via explorerDates.enableExtensionApi")),_.workspace.getConfiguration("explorerDates").get("showWelcomeOnStartup",!0)&&await h().shouldShowOnboarding()&&setTimeout(()=>{h().showWelcomeMessage()},5e3),bi({context:a,fileDateProvider:O,logger:D,l10n:ce}),_i({context:a,fileDateProvider:O,logger:D,generators:{generateWorkspaceActivityHTML:xi,generatePerformanceAnalyticsHTML:Fi,generateDiagnosticsHTML:Di,generateDiagnosticsWebview:Si}}),yi({context:a,logger:D,getOnboardingManager:h});let ve=_.commands.registerCommand("explorerDates.openTemplateManager",async()=>{try{if(!o){_.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to use this command.");return}await w().showTemplateManager(),D.info("Template manager opened")}catch(v){D.error("Failed to open template manager",v),_.window.showErrorMessage(`Failed to open template manager: ${v.message}`)}});a.subscriptions.push(ve);let U=_.commands.registerCommand("explorerDates.saveTemplate",async()=>{try{if(!o){_.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to save templates.");return}let v=await _.window.showInputBox({prompt:"Enter template name",placeHolder:"e.g., My Project Setup"});if(v){let ee=await _.window.showInputBox({prompt:"Enter description (optional)",placeHolder:"Brief description of this template"})||"";await w().saveCurrentConfiguration(v,ee)}D.info("Template saved")}catch(v){D.error("Failed to save template",v),_.window.showErrorMessage(`Failed to save template: ${v.message}`)}});a.subscriptions.push(U);let le=_.commands.registerCommand("explorerDates.generateReport",async()=>{try{if(!i){_.window.showInformationMessage("Reporting features are disabled. Enable explorerDates.enableReporting to generate reports.");return}await b().showReportDialog(),D.info("Report generation started")}catch(v){D.error("Failed to generate report",v),_.window.showErrorMessage(`Failed to generate report: ${v.message}`)}});a.subscriptions.push(le);let de=_.commands.registerCommand("explorerDates.showApiInfo",async()=>{try{if(!r){_.window.showInformationMessage("Explorer Dates API is disabled via settings.");return}let v=_.window.createWebviewPanel("apiInfo","Explorer Dates API Information",_.ViewColumn.One,{enableScripts:!0});v.webview.html=Ci(W()),D.info("API information panel opened")}catch(v){D.error("Failed to show API information",v),_.window.showErrorMessage(`Failed to show API information: ${v.message}`)}});a.subscriptions.push(de);let j,Q=_.workspace.getConfiguration("explorerDates"),be=Q.get("performanceMode",!1);Q.get("showStatusBar",!1)&&!be&&(j=Xt(a));let Z=_.workspace.onDidChangeConfiguration(v=>{if(v.affectsConfiguration("explorerDates.showStatusBar")||v.affectsConfiguration("explorerDates.performanceMode")){let ee=_.workspace.getConfiguration("explorerDates"),te=ee.get("showStatusBar",!1),he=ee.get("performanceMode",!1),oe=te&&!he;oe&&!j?j=Xt(a):!oe&&j&&(j.dispose(),j=null)}});a.subscriptions.push(Z),D.info("Explorer Dates: Date decorations ready")}catch(e){let t=`${ce?ce.getString("activationError"):"Explorer Dates failed to activate"}: ${e.message}`;throw D&&D.error("Extension activation failed",e),_.window.showErrorMessage(t),e}}d(Ti,"activate");async function ki(){try{D&&D.info("Explorer Dates extension is being deactivated"),O&&typeof O.dispose=="function"&&await O.dispose(),D&&D.info("Explorer Dates extension deactivated successfully")}catch(a){D&&D.error("Explorer Dates: Error during deactivation",a)}}d(ki,"deactivate");Zt.exports={activate:Ti,deactivate:ki}});var to=eo();module.exports={activate:to.activate,deactivate:to.deactivate};
