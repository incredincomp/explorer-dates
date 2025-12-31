var ro=Object.defineProperty;var d=(a,e)=>ro(a,"name",{value:e,configurable:!0});var S=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports);var A=S((Ai,at)=>{var De=require("vscode"),Se=class Se{constructor(){this._outputChannel=De.window.createOutputChannel("Explorer Dates"),this._isEnabled=!1,this._configurationWatcher=null,this._updateConfig(),this._configurationWatcher=De.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.enableLogging")&&this._updateConfig()})}_updateConfig(){let e=De.workspace.getConfiguration("explorerDates");this._isEnabled=e.get("enableLogging",!1)}debug(e,...t){if(this._isEnabled){let i=`[${new Date().toISOString()}] [DEBUG] ${e}`;this._outputChannel.appendLine(i),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}}info(e,...t){let i=`[${new Date().toISOString()}] [INFO] ${e}`;this._outputChannel.appendLine(i),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}warn(e,...t){let i=`[${new Date().toISOString()}] [WARN] ${e}`;this._outputChannel.appendLine(i),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}error(e,t,...o){let s=`[${new Date().toISOString()}] [ERROR] ${e}`;this._outputChannel.appendLine(s),t instanceof Error&&(this._outputChannel.appendLine(`Error: ${t.message}`),t.stack&&this._outputChannel.appendLine(`Stack: ${t.stack}`)),o.length>0&&this._outputChannel.appendLine(JSON.stringify(o,null,2))}show(){this._outputChannel.show()}clear(){this._outputChannel.clear()}dispose(){this._outputChannel.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),te===this&&(te=null)}};d(Se,"Logger");var ge=Se,te=null;function ao(){return te||(te=new ge),te}d(ao,"getLogger");at.exports={Logger:ge,getLogger:ao}});var ie=S((Ii,nt)=>{var Fe=require("vscode"),pe={en:{now:"now",minutes:"m",hours:"h",days:"d",weeks:"w",months:"mo",years:"y",justNow:"just now",minutesAgo:d(a=>`${a} minute${a!==1?"s":""} ago`,"minutesAgo"),hoursAgo:d(a=>`${a} hour${a!==1?"s":""} ago`,"hoursAgo"),yesterday:"yesterday",daysAgo:d(a=>`${a} day${a!==1?"s":""} ago`,"daysAgo"),lastModified:"Last modified",refreshSuccess:"Date decorations refreshed",activationError:"Explorer Dates failed to activate",errorAccessingFile:"Error accessing file for decoration"},es:{now:"ahora",minutes:"m",hours:"h",days:"d",weeks:"s",months:"m",years:"a",justNow:"ahora mismo",minutesAgo:d(a=>`hace ${a} minuto${a!==1?"s":""}`,"minutesAgo"),hoursAgo:d(a=>`hace ${a} hora${a!==1?"s":""}`,"hoursAgo"),yesterday:"ayer",daysAgo:d(a=>`hace ${a} d\xEDa${a!==1?"s":""}`,"daysAgo"),lastModified:"\xDAltima modificaci\xF3n",refreshSuccess:"Decoraciones de fecha actualizadas",activationError:"Explorer Dates no se pudo activar",errorAccessingFile:"Error al acceder al archivo para decoraci\xF3n"},fr:{now:"maintenant",minutes:"m",hours:"h",days:"j",weeks:"s",months:"m",years:"a",justNow:"\xE0 l'instant",minutesAgo:d(a=>`il y a ${a} minute${a!==1?"s":""}`,"minutesAgo"),hoursAgo:d(a=>`il y a ${a} heure${a!==1?"s":""}`,"hoursAgo"),yesterday:"hier",daysAgo:d(a=>`il y a ${a} jour${a!==1?"s":""}`,"daysAgo"),lastModified:"Derni\xE8re modification",refreshSuccess:"D\xE9corations de date actualis\xE9es",activationError:"\xC9chec de l'activation d'Explorer Dates",errorAccessingFile:"Erreur lors de l'acc\xE8s au fichier pour la d\xE9coration"},de:{now:"jetzt",minutes:"Min",hours:"Std",days:"T",weeks:"W",months:"Mon",years:"J",justNow:"gerade eben",minutesAgo:d(a=>`vor ${a} Minute${a!==1?"n":""}`,"minutesAgo"),hoursAgo:d(a=>`vor ${a} Stunde${a!==1?"n":""}`,"hoursAgo"),yesterday:"gestern",daysAgo:d(a=>`vor ${a} Tag${a!==1?"en":""}`,"daysAgo"),lastModified:"Zuletzt ge\xE4ndert",refreshSuccess:"Datumsdekorationen aktualisiert",activationError:"Explorer Dates konnte nicht aktiviert werden",errorAccessingFile:"Fehler beim Zugriff auf Datei f\xFCr Dekoration"},ja:{now:"\u4ECA",minutes:"\u5206",hours:"\u6642\u9593",days:"\u65E5",weeks:"\u9031",months:"\u30F6\u6708",years:"\u5E74",justNow:"\u305F\u3063\u305F\u4ECA",minutesAgo:d(a=>`${a}\u5206\u524D`,"minutesAgo"),hoursAgo:d(a=>`${a}\u6642\u9593\u524D`,"hoursAgo"),yesterday:"\u6628\u65E5",daysAgo:d(a=>`${a}\u65E5\u524D`,"daysAgo"),lastModified:"\u6700\u7D42\u66F4\u65B0",refreshSuccess:"\u65E5\u4ED8\u88C5\u98FE\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",activationError:"Explorer Dates\u306E\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F",errorAccessingFile:"\u30D5\u30A1\u30A4\u30EB\u30A2\u30AF\u30BB\u30B9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"},zh:{now:"\u73B0\u5728",minutes:"\u5206\u949F",hours:"\u5C0F\u65F6",days:"\u5929",weeks:"\u5468",months:"\u6708",years:"\u5E74",justNow:"\u521A\u521A",minutesAgo:d(a=>`${a}\u5206\u949F\u524D`,"minutesAgo"),hoursAgo:d(a=>`${a}\u5C0F\u65F6\u524D`,"hoursAgo"),yesterday:"\u6628\u5929",daysAgo:d(a=>`${a}\u5929\u524D`,"daysAgo"),lastModified:"\u6700\u540E\u4FEE\u6539",refreshSuccess:"\u65E5\u671F\u88C5\u9970\u5DF2\u5237\u65B0",activationError:"Explorer Dates \u6FC0\u6D3B\u5931\u8D25",errorAccessingFile:"\u8BBF\u95EE\u6587\u4EF6\u88C5\u9970\u65F6\u51FA\u9519"}},Te=class Te{constructor(){this._currentLocale="en",this._configurationWatcher=null,this._updateLocale(),this._configurationWatcher=Fe.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.locale")&&this._updateLocale()})}_updateLocale(){let t=Fe.workspace.getConfiguration("explorerDates").get("locale","auto");t==="auto"&&(t=Fe.env.language.split("-")[0]),pe[t]||(t="en"),this._currentLocale=t}getString(e,...t){let i=(pe[this._currentLocale]||pe.en)[e];return typeof i=="function"?i(...t):i||pe.en[e]||e}getCurrentLocale(){return this._currentLocale}formatDate(e,t={}){try{return e.toLocaleDateString(this._currentLocale,t)}catch{return e.toLocaleDateString("en",t)}}dispose(){this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),oe===this&&(oe=null)}};d(Te,"LocalizationManager");var fe=Te,oe=null;function no(){return oe||(oe=new fe),oe}d(no,"getLocalization");nt.exports={LocalizationManager:fe,getLocalization:no}});var ke=S((Wi,lt)=>{var ct=require("vscode");function co(){try{return ct?.env?.uiKind===ct?.UIKind?.Web}catch{return!1}}d(co,"isWebEnvironment");lt.exports={isWebEnvironment:co}});var B=S((Li,ht)=>{function K(a=""){return a?a.replace(/\\/g,"/"):""}d(K,"normalizePath");function lo(a=""){let e=K(a);return e?e.split("/").filter(Boolean):[]}d(lo,"getSegments");function dt(a=""){let e=lo(a);return e.length?e[e.length-1]:""}d(dt,"getFileName");function ho(a=""){let e=dt(a),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}d(ho,"getExtension");function uo(a=""){let e=K(a),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}d(uo,"getDirectory");function go(...a){return K(a.filter(Boolean).join("/")).replace(/\/+/g,"/")}d(go,"joinPath");function po(a=""){return K(a).toLowerCase()}d(po,"getCacheKey");function fo(a=""){if(!a)return"";if(typeof a=="string")return a;if(typeof a.fsPath=="string"&&a.fsPath.length>0)return a.fsPath;if(typeof a.path=="string"&&a.path.length>0)return a.path;if(typeof a.toString=="function")try{return a.toString(!0)}catch{return a.toString()}return String(a)}d(fo,"getUriPath");function mo(a="",e=""){let t=K(a),o=K(e);return t&&o.startsWith(t)?o.substring(t.length).replace(/^\/+/,""):o}d(mo,"getRelativePath");ht.exports={normalizePath:K,getFileName:dt,getExtension:ho,getDirectory:uo,joinPath:go,getCacheKey:po,getUriPath:fo,getRelativePath:mo}});var U=S((Bi,gt)=>{var W=require("vscode"),{isWebEnvironment:wo}=ke(),{normalizePath:vo}=B(),ut=!0,T=null;if(!ut)try{T=require("fs").promises}catch{T=null}var $e=class $e{constructor(){this.isWeb=ut||wo()}_toPath(e){return e?typeof e=="string"?e:e instanceof W.Uri?e.fsPath||e.path:String(e):""}_toUri(e){if(e instanceof W.Uri)return e;if(typeof e=="string")return W.Uri.file(e);throw new Error(`Unsupported target type: ${typeof e}`)}async stat(e){if(!this.isWeb&&T)return T.stat(this._toPath(e));let t=this._toUri(e),o=await W.workspace.fs.stat(t);return{...o,mtime:new Date(o.mtime),ctime:new Date(o.ctime),birthtime:new Date(o.ctime),isFile:d(()=>o.type===W.FileType.File,"isFile"),isDirectory:d(()=>o.type===W.FileType.Directory,"isDirectory")}}async readFile(e,t="utf8"){if(!this.isWeb&&T)return T.readFile(this._toPath(e),t);let o=this._toUri(e),i=await W.workspace.fs.readFile(o);return t===null||t==="binary"?i:new TextDecoder(t).decode(i)}async writeFile(e,t,o="utf8"){if(!this.isWeb&&T)return T.writeFile(this._toPath(e),t,o);let i=this._toUri(e),s=typeof t=="string"?new TextEncoder().encode(t):t;await W.workspace.fs.writeFile(i,s)}async mkdir(e,t={recursive:!0}){if(!this.isWeb&&T)return T.mkdir(this._toPath(e),t);let o=this._toUri(e);await W.workspace.fs.createDirectory(o)}async readdir(e,t={withFileTypes:!1}){if(!this.isWeb&&T)return T.readdir(this._toPath(e),t);let o=this._toUri(e),i=await W.workspace.fs.readDirectory(o);return t.withFileTypes?i.map(([s,r])=>({name:s,isDirectory:d(()=>r===W.FileType.Directory,"isDirectory"),isFile:d(()=>r===W.FileType.File,"isFile")})):i.map(([s])=>s)}async delete(e,t={recursive:!1}){if(!this.isWeb&&T){let i=this._toPath(e);return t.recursive?T.rm?T.rm(i,t):T.rmdir(i,t):T.unlink(i)}let o=this._toUri(e);await W.workspace.fs.delete(o,t)}async exists(e){try{return await this.stat(e),!0}catch{return!1}}async ensureDirectory(e){let t=vo(this._toPath(e));await this.mkdir(t,{recursive:!0})}};d($e,"FileSystemAdapter");var me=$e,bo=new me;gt.exports={FileSystemAdapter:me,fileSystem:bo}});var ft=S((Ui,pt)=>{var P=require("vscode"),{getLogger:yo}=A(),{fileSystem:_o}=U(),{normalizePath:Me,getRelativePath:Co,getFileName:xo}=B(),Ae=class Ae{constructor(){this._logger=yo(),this._fs=_o,this._commonExclusions=["node_modules",".npm",".yarn","coverage","nyc_output","dist","build","out","target","bin","obj",".vscode",".idea",".vs",".vscode-test",".git",".svn",".hg",".bzr",".pnpm-store","bower_components","jspm_packages","tmp","temp",".tmp",".cache",".parcel-cache",".DS_Store","Thumbs.db","__pycache__",".pytest_cache",".tox","venv",".env",".virtualenv","vendor",".docker","logs","*.log"],this._patternScores=new Map,this._workspaceAnalysis=new Map,this._logger.info("SmartExclusionManager initialized")}async cleanupAllWorkspaceProfiles(){let e=P.workspace.getConfiguration("explorerDates"),t=e.get("workspaceExclusionProfiles",{}),o=!1;for(let[i,s]of Object.entries(t)){let r=Array.isArray(s)?s:[],n=this._dedupeList(r);this._areListsEqual(r,n)||(t[i]=n,o=!0,this._logger.debug(`Deduped workspace exclusions for ${i}`,{before:r.length,after:n.length}))}o?(await e.update("workspaceExclusionProfiles",t,P.ConfigurationTarget.Global),this._logger.info("Cleaned up duplicate workspace exclusions",{workspaceCount:Object.keys(t).length})):this._logger.debug("Workspace exclusion profiles already clean")}async analyzeWorkspace(e){try{let t=Me(e?.fsPath||e?.path||""),o={detectedPatterns:[],suggestedExclusions:[],projectType:"unknown",riskFolders:[]};o.projectType=await this._detectProjectType(e);let i=await this._scanForExclusionCandidates(e,t),s=this._scorePatterns(i,o.projectType);return o.detectedPatterns=i,o.suggestedExclusions=s.filter(r=>r.score>.7).map(r=>r.pattern),o.riskFolders=s.filter(r=>r.riskLevel==="high").map(r=>r.pattern),this._workspaceAnalysis.set(t,o),this._logger.info(`Workspace analysis complete for ${t}`,o),o}catch(t){return this._logger.error("Failed to analyze workspace",t),null}}async _detectProjectType(e){let t=[{file:"package.json",type:"javascript"},{file:"pom.xml",type:"java"},{file:"Cargo.toml",type:"rust"},{file:"setup.py",type:"python"},{file:"requirements.txt",type:"python"},{file:"Gemfile",type:"ruby"},{file:"composer.json",type:"php"},{file:"go.mod",type:"go"},{file:"CMakeLists.txt",type:"cpp"},{file:"Dockerfile",type:"docker"}];if(!e)return"unknown";for(let o of t)try{let i=P.Uri.joinPath(e,o.file);if(await this._fs.exists(i))return o.type}catch{}return"unknown"}async _scanForExclusionCandidates(e,t,o=2){let i=[],s=d(async(r,n=0)=>{if(!(n>o))try{let l=await this._fs.readdir(r,{withFileTypes:!0});for(let c of l)if(c.isDirectory()){let h=P.Uri.joinPath(r,c.name),u=Me(h.fsPath||h.path),w=Co(t,u);this._commonExclusions.includes(c.name)&&i.push({name:c.name,path:w,type:"common",size:await this._getDirectorySize(h)});let p=await this._getDirectorySize(h);p>10485760&&i.push({name:c.name,path:w,type:"large",size:p}),await s(h,n+1)}}catch{}},"scanDirectory");return await s(e),i}async _getDirectorySize(e){try{let t=await this._fs.readdir(e,{withFileTypes:!0}),o=0,i=0;for(let s of t){if(i>100)break;if(s.isFile())try{let r=P.Uri.joinPath(e,s.name),n=await this._fs.stat(r);o+=n.size,i++}catch{}}return o}catch{return 0}}_scorePatterns(e,t){return e.map(o=>{let i=0,s="low";switch(o.type==="common"&&(i+=.8),o.size>100*1024*1024?(i+=.9,s="high"):o.size>10*1024*1024&&(i+=.5,s="medium"),t){case"javascript":["node_modules",".npm","coverage","dist","build"].includes(o.name)&&(i+=.9);break;case"python":["__pycache__",".pytest_cache","venv",".env"].includes(o.name)&&(i+=.9);break;case"java":["target","build",".gradle"].includes(o.name)&&(i+=.9);break}return["src","lib","app","components","pages"].includes(o.name.toLowerCase())&&(i=0,s="none"),{pattern:o.name,path:o.path,score:Math.min(i,1),riskLevel:s,size:o.size,type:o.type}})}async getWorkspaceExclusions(e){let t=P.workspace.getConfiguration("explorerDates"),o=t.get("workspaceExclusionProfiles",{}),i=this._getWorkspaceKey(e),s=o[i]||[],r=this._dedupeList(s);if(r.length!==s.length){o[i]=r;try{await t.update("workspaceExclusionProfiles",o,P.ConfigurationTarget.Global),this._logger.info(`Cleaned duplicate exclusions for ${i}`,{before:s.length,after:r.length})}catch(n){this._logger.warn(`Failed to persist cleaned exclusions for ${i}`,n)}}return r}async saveWorkspaceExclusions(e,t){let o=P.workspace.getConfiguration("explorerDates"),i=o.get("workspaceExclusionProfiles",{}),s=this._getWorkspaceKey(e),r=this._dedupeList(t);if(Array.isArray(i[s])?this._areListsEqual(i[s],r):!1){this._logger.debug(`No workspace exclusion changes for ${s}`);return}i[s]=r,await o.update("workspaceExclusionProfiles",i,P.ConfigurationTarget.Global),this._logger.info(`Saved workspace exclusions for ${s}`,r)}async getCombinedExclusions(e){let t=P.workspace.getConfiguration("explorerDates"),o=t.get("excludedFolders",[]),i=t.get("excludedPatterns",[]),s=t.get("smartExclusions",!0),r=[...o],n=[...i],l=await this.getWorkspaceExclusions(e);if(r.push(...l),s){let c=await this.analyzeWorkspace(e);c&&r.push(...c.suggestedExclusions)}return r=[...new Set(r)],n=[...new Set(n)],{folders:r,patterns:n}}_getWorkspaceKey(e){if(!e)return"unknown-workspace";let t=e.fsPath||e.path||"";return xo(t)||Me(t)}async suggestExclusions(e){let t=await this.analyzeWorkspace(e),o=this._dedupeList(t?.suggestedExclusions||[]);if(!t||o.length===0)return;let i=await this.getWorkspaceExclusions(e),s=o.filter(c=>!i.includes(c));if(s.length===0){this._logger.debug("No new smart exclusions detected",{workspace:this._getWorkspaceKey(e)});return}let r=this._mergeExclusions(i,s);await this.saveWorkspaceExclusions(e,r);let n=s.length===1?`Explorer Dates automatically excluded "${s[0]}" to keep Explorer responsive.`:`Explorer Dates automatically excluded ${s.length} folders to keep Explorer responsive.`,l=await P.window.showInformationMessage(`${n} Keep these exclusions?`,"Keep","Review","Revert");l==="Revert"?(await this.saveWorkspaceExclusions(e,i),P.window.showInformationMessage("Smart exclusions reverted. Decorations will refresh for the restored folders."),this._logger.info("User reverted smart exclusions",{reverted:s})):l==="Review"?(this._showExclusionReview(t),this._logger.info("User reviewing smart exclusions",{pending:s})):this._logger.info("User kept smart exclusions",{accepted:s})}_dedupeList(e=[]){return Array.from(new Set(e.filter(Boolean)))}_mergeExclusions(e=[],t=[]){return this._dedupeList([...e||[],...t||[]])}_areListsEqual(e=[],t=[]){return e.length!==t.length?!1:e.every((o,i)=>o===t[i])}_showExclusionReview(e){let t=P.window.createWebviewPanel("exclusionReview","Smart Exclusion Review",P.ViewColumn.One,{enableScripts:!0});t.webview.html=this._generateReviewHTML(e)}_generateReviewHTML(e){let t=d(i=>{if(i<1024)return`${i} B`;let s=i/1024;return s<1024?`${s.toFixed(1)} KB`:`${(s/1024).toFixed(1)} MB`},"formatSize"),o=e.detectedPatterns.map(i=>`
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
        `}};d(Ae,"SmartExclusionManager");var Ee=Ae;pt.exports={SmartExclusionManager:Ee}});var wt=S((Gi,mt)=>{var J=require("vscode"),{getLogger:Do}=A(),Ie=class Ie{constructor(){this._logger=Do(),this._processingQueue=[],this._isProcessing=!1,this._batchSize=50,this._processedCount=0,this._totalCount=0,this._statusBar=null,this._configurationWatcher=null,this._metrics={totalBatches:0,averageBatchTime:0,totalProcessingTime:0},this._logger.info("BatchProcessor initialized")}initialize(){let e=J.workspace.getConfiguration("explorerDates");this._batchSize=e.get("batchSize",50),this._statusBar=J.window.createStatusBarItem(J.StatusBarAlignment.Left,-1e3),this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=J.workspace.onDidChangeConfiguration(t=>{t.affectsConfiguration("explorerDates.batchSize")&&(this._batchSize=J.workspace.getConfiguration("explorerDates").get("batchSize",50),this._logger.debug(`Batch size updated to: ${this._batchSize}`))})}queueForProcessing(e,t,o={}){let i={id:Date.now()+Math.random(),uris:Array.isArray(e)?e:[e],processor:t,priority:o.priority||"normal",background:o.background||!1,onProgress:o.onProgress,onComplete:o.onComplete};return i.priority==="high"?this._processingQueue.unshift(i):this._processingQueue.push(i),this._logger.debug(`Queued batch ${i.id} with ${i.uris.length} URIs`),this._isProcessing||this._startProcessing(),i.id}async _startProcessing(){if(this._isProcessing)return;this._isProcessing=!0,this._processedCount=0,this._totalCount=this._processingQueue.reduce((t,o)=>t+o.uris.length,0),this._logger.info(`Starting batch processing: ${this._totalCount} items in ${this._processingQueue.length} batches`),this._updateStatusBar();let e=Date.now();try{for(;this._processingQueue.length>0;){let t=this._processingQueue.shift();await this._processBatch(t),t.background||await this._sleep(1)}}catch(t){this._logger.error("Batch processing failed",t)}finally{this._isProcessing=!1,this._hideStatusBar();let t=Date.now()-e;this._updateMetrics(t),this._logger.info(`Batch processing completed in ${t}ms`)}}async _processBatch(e){let t=Date.now();this._logger.debug(`Processing batch ${e.id} with ${e.uris.length} URIs`);try{let o=this._chunkArray(e.uris,this._batchSize);for(let i=0;i<o.length;i++){let s=o[i],r=[];for(let n of s){try{let l=await e.processor(n);r.push({uri:n,result:l,success:!0}),this._processedCount++}catch(l){r.push({uri:n,error:l,success:!1}),this._processedCount++,this._logger.debug(`Failed to process ${n.fsPath}`,l)}this._updateStatusBar(),e.onProgress&&e.onProgress({processed:this._processedCount,total:this._totalCount,current:n})}await this._sleep(0),!e.background&&i<o.length-1&&await this._sleep(5)}e.onComplete&&e.onComplete({processed:e.uris.length,success:!0,duration:Date.now()-t})}catch(o){this._logger.error(`Batch ${e.id} processing failed`,o),e.onComplete&&e.onComplete({processed:0,success:!1,error:o,duration:Date.now()-t})}this._metrics.totalBatches++}async processDirectoryProgressively(e,t,o={}){let i=o.maxFiles||1e3;try{let s=new J.RelativePattern(e,"**/*"),r=await J.workspace.findFiles(s,null,i);if(r.length===0){this._logger.debug(`No files found in directory: ${e.fsPath}`);return}return this._logger.info(`Processing directory progressively: ${r.length} files in ${e.fsPath}`),this.queueForProcessing(r,t,{priority:"normal",background:!0,...o})}catch(s){throw this._logger.error("Progressive directory processing failed",s),s}}async refreshInBackground(e,t,o={}){return this.queueForProcessing(e,t,{background:!0,priority:"low",...o})}async refreshVisible(e,t,o={}){return this.queueForProcessing(e,t,{background:!1,priority:"high",...o})}_chunkArray(e,t){let o=[];for(let i=0;i<e.length;i+=t)o.push(e.slice(i,i+t));return o}_sleep(e){return new Promise(t=>setTimeout(t,e))}_updateStatusBar(){if(!this._statusBar)return;let e=this._totalCount>0?Math.round(this._processedCount/this._totalCount*100):0;this._statusBar.text=`$(sync~spin) Processing files... ${e}% (${this._processedCount}/${this._totalCount})`,this._statusBar.tooltip="Explorer Dates is processing file decorations",this._statusBar.show()}_hideStatusBar(){this._statusBar&&this._statusBar.hide()}_updateMetrics(e){this._metrics.totalProcessingTime+=e,this._metrics.totalBatches>0&&(this._metrics.averageBatchTime=this._metrics.totalProcessingTime/this._metrics.totalBatches)}getMetrics(){return{...this._metrics,isProcessing:this._isProcessing,queueLength:this._processingQueue.length,currentProgress:this._totalCount>0?this._processedCount/this._totalCount:0}}cancelAll(){this._processingQueue.length=0,this._hideStatusBar(),this._logger.info("All batch processing cancelled")}cancelBatch(e){let t=this._processingQueue.findIndex(o=>o.id===e);if(t!==-1){let o=this._processingQueue.splice(t,1)[0];return this._logger.debug(`Cancelled batch ${e} with ${o.uris.length} URIs`),!0}return!1}dispose(){this.cancelAll(),this._statusBar&&this._statusBar.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("BatchProcessor disposed",this.getMetrics())}};d(Ie,"BatchProcessor");var Pe=Ie;mt.exports={BatchProcessor:Pe}});var se=S((qi,vt)=>{var So=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],Fo={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"};vt.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:So,GLOBAL_STATE_KEYS:Fo}});var Ct=S((Vi,_t)=>{var bt=require("vscode"),{getLogger:To}=A(),{fileSystem:ko}=U(),{GLOBAL_STATE_KEYS:yt,DEFAULT_PERSISTENT_CACHE_TTL:$o}=se(),We=class We{constructor(e){this._logger=To(),this._context=e,this._memoryCache=new Map,this._cacheMetadata=new Map,this._maxMemoryUsage=50*1024*1024,this._currentMemoryUsage=0,this._persistentCacheEnabled=!0,this._storage=e?.globalState||null,this._storageKey=yt.ADVANCED_CACHE,this._metadataKey=yt.ADVANCED_CACHE_METADATA,this._fs=ko,this._configurationWatcher=null,this._metrics={memoryHits:0,memoryMisses:0,diskHits:0,diskMisses:0,evictions:0,persistentLoads:0,persistentSaves:0},this._cleanupInterval=null,this._saveInterval=null,this._logger.info("AdvancedCache initialized")}async initialize(){try{await this._loadConfiguration(),this._persistentCacheEnabled&&await this._loadPersistentCache(),this._startIntervals(),this._logger.info("Advanced cache system initialized",{persistentEnabled:this._persistentCacheEnabled&&!!this._storage,maxMemoryUsage:this._maxMemoryUsage,storage:this._storage?"globalState":"memory-only"})}catch(e){this._logger.error("Failed to initialize cache system",e)}}async _loadConfiguration(){let e=bt.workspace.getConfiguration("explorerDates");this._persistentCacheEnabled=e.get("persistentCache",!0),this._maxMemoryUsage=e.get("maxMemoryUsage",50)*1024*1024,this._ensureConfigurationWatcher()}_ensureConfigurationWatcher(){this._configurationWatcher||(this._configurationWatcher=bt.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.persistentCache")||e.affectsConfiguration("explorerDates.maxMemoryUsage"))&&this._loadConfiguration()}))}async get(e){if(this._memoryCache.has(e)){let t=this._memoryCache.get(e),o=this._cacheMetadata.get(e);if(this._isValid(o))return this._metrics.memoryHits++,this._updateAccessTime(e),t;this._removeFromMemory(e)}if(this._metrics.memoryMisses++,this._persistentCacheEnabled){let t=await this._getFromPersistentCache(e);if(t)return this._addToMemory(e,t.data,t.metadata),this._metrics.diskHits++,t.data}return this._metrics.diskMisses++,null}async set(e,t,o={}){let i={timestamp:Date.now(),lastAccess:Date.now(),size:this._estimateSize(t),ttl:o.ttl||$o,tags:o.tags||[],version:o.version||1};this._addToMemory(e,t,i),this._persistentCacheEnabled&&this._schedulePersistentSave()}_addToMemory(e,t,o){this._currentMemoryUsage+o.size>this._maxMemoryUsage&&this._evictOldestItems(o.size),this._memoryCache.has(e)&&this._removeFromMemory(e),this._memoryCache.set(e,t),this._cacheMetadata.set(e,o),this._currentMemoryUsage+=o.size,this._logger.debug(`Added to cache: ${e} (${o.size} bytes)`)}_removeFromMemory(e){if(this._memoryCache.has(e)){let t=this._cacheMetadata.get(e);this._memoryCache.delete(e),this._cacheMetadata.delete(e),t&&(this._currentMemoryUsage-=t.size)}}_evictOldestItems(e){let t=Array.from(this._cacheMetadata.entries());t.sort((i,s)=>i[1].lastAccess-s[1].lastAccess);let o=0;for(let[i,s]of t)if(this._removeFromMemory(i),o+=s.size,this._metrics.evictions++,o>=e)break;this._logger.debug(`Evicted items to free ${o} bytes`)}_isValid(e){return e?Date.now()-e.timestamp<e.ttl:!1}_updateAccessTime(e){let t=this._cacheMetadata.get(e);t&&(t.lastAccess=Date.now())}_estimateSize(e){switch(typeof e){case"string":return e.length*2;case"number":return 8;case"boolean":return 4;case"object":return e===null?4:JSON.stringify(e).length*2;default:return 100}}async _loadPersistentCache(){if(!this._storage){let e=this._fs.isWeb?"web":"desktop";this._logger.debug(`Persistent storage unavailable in ${e} environment - running in memory-only mode`);return}try{let e=this._storage.get(this._storageKey,{}),t=0,o=0;for(let[i,s]of Object.entries(e))s&&this._isValid(s.metadata)?(this._addToMemory(i,s.data,s.metadata),t++):o++;this._metrics.persistentLoads++,this._logger.info(`Loaded persistent cache: ${t} items (${o} expired)`)}catch(e){this._logger.error("Failed to load persistent cache from globalState",e)}}async _savePersistentCache(){if(!(!this._persistentCacheEnabled||!this._storage))try{let e={};for(let[t,o]of this._memoryCache.entries()){let i=this._cacheMetadata.get(t);i&&this._isValid(i)&&(e[t]={data:o,metadata:i})}await this._storage.update(this._storageKey,e),this._metrics.persistentSaves++,this._logger.debug(`Saved persistent cache: ${Object.keys(e).length} items`)}catch(e){this._logger.error("Failed to save persistent cache to globalState",e)}}async _getFromPersistentCache(e){if(!this._storage)return null;let o=this._storage.get(this._storageKey,{})[e];return o&&this._isValid(o.metadata)?o:null}_schedulePersistentSave(){this._storage&&(this._saveTimeout&&clearTimeout(this._saveTimeout),this._saveTimeout=setTimeout(()=>{this._savePersistentCache()},5e3))}_startIntervals(){this._cleanupInterval=setInterval(()=>{this._cleanupExpiredItems()},300*1e3),this._storage&&this._persistentCacheEnabled&&(this._saveInterval=setInterval(()=>{this._savePersistentCache()},600*1e3))}_cleanupExpiredItems(){let e=[];for(let[t,o]of this._cacheMetadata.entries())this._isValid(o)||e.push(t);for(let t of e)this._removeFromMemory(t);e.length>0&&this._logger.debug(`Cleaned up ${e.length} expired cache items`)}invalidateByTags(e){let t=[];for(let[o,i]of this._cacheMetadata.entries())i.tags&&i.tags.some(s=>e.includes(s))&&t.push(o);for(let o of t)this._removeFromMemory(o);this._logger.debug(`Invalidated ${t.length} items by tags:`,e)}invalidateByPattern(e){let t=[],o=new RegExp(e);for(let i of this._memoryCache.keys())o.test(i)&&t.push(i);for(let i of t)this._removeFromMemory(i);this._logger.debug(`Invalidated ${t.length} items by pattern: ${e}`)}clear(){this._memoryCache.clear(),this._cacheMetadata.clear(),this._currentMemoryUsage=0,this._logger.info("Cache cleared")}getStats(){let e=this._metrics.memoryHits+this._metrics.memoryMisses>0?(this._metrics.memoryHits/(this._metrics.memoryHits+this._metrics.memoryMisses)*100).toFixed(2):"0",t=this._metrics.diskHits+this._metrics.diskMisses>0?(this._metrics.diskHits/(this._metrics.diskHits+this._metrics.diskMisses)*100).toFixed(2):"0";return{...this._metrics,memoryItems:this._memoryCache.size,memoryUsage:this._currentMemoryUsage,memoryUsagePercent:(this._currentMemoryUsage/this._maxMemoryUsage*100).toFixed(2),memoryHitRate:`${e}%`,diskHitRate:`${t}%`,persistentEnabled:this._persistentCacheEnabled}}async dispose(){this._cleanupInterval&&clearInterval(this._cleanupInterval),this._saveInterval&&clearInterval(this._saveInterval),this._saveTimeout&&clearTimeout(this._saveTimeout),this._persistentCacheEnabled&&this._storage&&await this._savePersistentCache(),this.clear(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("Advanced cache disposed",this.getStats())}};d(We,"AdvancedCache");var ze=We;_t.exports={AdvancedCache:ze}});var Dt=S((Ji,xt)=>{var g=require("vscode"),{getLogger:Mo}=A(),{getExtension:Eo}=B(),Le=class Le{constructor(){this._logger=Mo(),this._currentThemeKind=g.window.activeColorTheme.kind,this._themeChangeListeners=[],this._setupThemeChangeDetection(),this._logger.info("ThemeIntegrationManager initialized",{currentTheme:this._getThemeKindName(this._currentThemeKind)})}_setupThemeChangeDetection(){g.window.onDidChangeActiveColorTheme(e=>{let t=this._currentThemeKind;this._currentThemeKind=e.kind,this._logger.debug("Theme changed",{from:this._getThemeKindName(t),to:this._getThemeKindName(e.kind)}),this._themeChangeListeners.forEach(o=>{try{o(e,t)}catch(i){this._logger.error("Theme change listener failed",i)}})})}_getThemeKindName(e){switch(e){case g.ColorThemeKind.Light:return"Light";case g.ColorThemeKind.Dark:return"Dark";case g.ColorThemeKind.HighContrast:return"High Contrast";default:return"Unknown"}}onThemeChange(e){return this._themeChangeListeners.push(e),{dispose:d(()=>{let t=this._themeChangeListeners.indexOf(e);t!==-1&&this._themeChangeListeners.splice(t,1)},"dispose")}}getAdaptiveColors(){let e=this._currentThemeKind===g.ColorThemeKind.Light;return this._currentThemeKind===g.ColorThemeKind.HighContrast?this._getHighContrastColors():e?this._getLightThemeColors():this._getDarkThemeColors()}_getLightThemeColors(){return{veryRecent:new g.ThemeColor("list.highlightForeground"),recent:new g.ThemeColor("list.warningForeground"),old:new g.ThemeColor("list.errorForeground"),javascript:new g.ThemeColor("symbolIcon.functionForeground"),css:new g.ThemeColor("symbolIcon.colorForeground"),html:new g.ThemeColor("symbolIcon.snippetForeground"),json:new g.ThemeColor("symbolIcon.stringForeground"),markdown:new g.ThemeColor("symbolIcon.textForeground"),python:new g.ThemeColor("symbolIcon.classForeground"),subtle:new g.ThemeColor("list.inactiveSelectionForeground"),muted:new g.ThemeColor("list.deemphasizedForeground"),emphasis:new g.ThemeColor("list.highlightForeground")}}_getDarkThemeColors(){return{veryRecent:new g.ThemeColor("list.highlightForeground"),recent:new g.ThemeColor("charts.yellow"),old:new g.ThemeColor("charts.red"),javascript:new g.ThemeColor("symbolIcon.functionForeground"),css:new g.ThemeColor("charts.purple"),html:new g.ThemeColor("charts.orange"),json:new g.ThemeColor("symbolIcon.stringForeground"),markdown:new g.ThemeColor("charts.yellow"),python:new g.ThemeColor("symbolIcon.classForeground"),subtle:new g.ThemeColor("list.inactiveSelectionForeground"),muted:new g.ThemeColor("list.deemphasizedForeground"),emphasis:new g.ThemeColor("list.highlightForeground")}}_getHighContrastColors(){return{veryRecent:new g.ThemeColor("list.highlightForeground"),recent:new g.ThemeColor("list.warningForeground"),old:new g.ThemeColor("list.errorForeground"),javascript:new g.ThemeColor("list.highlightForeground"),css:new g.ThemeColor("list.warningForeground"),html:new g.ThemeColor("list.errorForeground"),json:new g.ThemeColor("list.highlightForeground"),markdown:new g.ThemeColor("list.warningForeground"),python:new g.ThemeColor("list.errorForeground"),subtle:new g.ThemeColor("list.highlightForeground"),muted:new g.ThemeColor("list.inactiveSelectionForeground"),emphasis:new g.ThemeColor("list.focusHighlightForeground")}}getColorForContext(e,t="normal"){let o=this.getAdaptiveColors();switch(e){case"success":case"recent":return t==="subtle"?o.subtle:o.veryRecent;case"warning":case"medium":return t==="subtle"?o.muted:o.recent;case"error":case"old":return t==="subtle"?o.emphasis:o.old;case"javascript":case"typescript":return o.javascript;case"css":case"scss":case"less":return o.css;case"html":case"xml":return o.html;case"json":case"yaml":return o.json;case"markdown":case"text":return o.markdown;case"python":return o.python;default:return t==="subtle"?o.muted:o.subtle}}applyThemeAwareColorScheme(e,t="",o=0){if(e==="none")return;if(e==="adaptive")return this._getAdaptiveColorForFile(t,o);let i=this.getAdaptiveColors();switch(e){case"recency":return o<36e5?i.veryRecent:o<864e5?i.recent:i.old;case"file-type":return this._getFileTypeColor(t);case"subtle":return o<36e5?i.subtle:o<6048e5?i.muted:i.emphasis;case"vibrant":return this._getVibrantSelectionAwareColor(o);default:return}}_getVibrantSelectionAwareColor(e){return e<36e5?new g.ThemeColor("list.highlightForeground"):e<864e5?new g.ThemeColor("list.warningForeground"):new g.ThemeColor("list.errorForeground")}_getAdaptiveColorForFile(e,t){let o=this._getFileTypeColor(e);if(o)return o;let i=this.getAdaptiveColors();return t<36e5?i.veryRecent:t<864e5?i.recent:i.old}_getFileTypeColor(e){let t=Eo(e),o=this.getAdaptiveColors();return[".js",".ts",".jsx",".tsx",".mjs"].includes(t)?o.javascript:[".css",".scss",".sass",".less",".stylus"].includes(t)?o.css:[".html",".htm",".xml",".svg"].includes(t)?o.html:[".json",".yaml",".yml",".toml"].includes(t)?o.json:[".md",".markdown",".txt",".rst"].includes(t)?o.markdown:[".py",".pyx",".pyi"].includes(t)?o.python:null}getSuggestedColorScheme(){switch(this._currentThemeKind){case g.ColorThemeKind.Light:return"vibrant";case g.ColorThemeKind.Dark:return"recency";case g.ColorThemeKind.HighContrast:return"none";default:return"recency"}}getIconThemeIntegration(){return{iconTheme:g.workspace.getConfiguration("workbench").get("iconTheme"),suggestions:{"vs-seti":{recommendedColorScheme:"file-type",description:"File-type colors complement Seti icons perfectly"},"material-icon-theme":{recommendedColorScheme:"subtle",description:"Subtle colors work well with Material icons"},"vscode-icons":{recommendedColorScheme:"recency",description:"Recency-based colors pair nicely with VS Code icons"}}}}async autoConfigureForTheme(){try{let e=g.workspace.getConfiguration("explorerDates"),t=e.get("colorScheme","none");if(t==="none"||t==="auto"){let o=this.getSuggestedColorScheme();await e.update("colorScheme",o,g.ConfigurationTarget.Global),this._logger.info(`Auto-configured color scheme for ${this._getThemeKindName(this._currentThemeKind)} theme: ${o}`),await g.window.showInformationMessage(`Explorer Dates adapted to your ${this._getThemeKindName(this._currentThemeKind)} theme`,"Customize","OK")==="Customize"&&await g.commands.executeCommand("workbench.action.openSettings","explorerDates.colorScheme")}}catch(e){this._logger.error("Failed to auto-configure for theme",e)}}getCurrentThemeInfo(){return{kind:this._currentThemeKind,kindName:this._getThemeKindName(this._currentThemeKind),isLight:this._currentThemeKind===g.ColorThemeKind.Light,isDark:this._currentThemeKind===g.ColorThemeKind.Dark,isHighContrast:this._currentThemeKind===g.ColorThemeKind.HighContrast,suggestedColorScheme:this.getSuggestedColorScheme(),adaptiveColors:this.getAdaptiveColors()}}dispose(){this._themeChangeListeners.length=0,this._logger.info("ThemeIntegrationManager disposed")}};d(Le,"ThemeIntegrationManager");var Re=Le;xt.exports={ThemeIntegrationManager:Re}});var Ft=S((Yi,St)=>{var L=require("vscode"),{getLogger:Ao}=A(),{getLocalization:Po}=ie(),{getFileName:Io}=B(),Be=class Be{constructor(){this._logger=Ao(),this._l10n=Po(),this._isAccessibilityMode=!1,this._keyboardNavigationEnabled=!0,this._focusIndicators=new Map,this._configurationWatcher=null,this._loadConfiguration(),this._setupConfigurationListener(),this._logger.info("AccessibilityManager initialized",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled})}_loadConfiguration(){let e=L.workspace.getConfiguration("explorerDates");this._isAccessibilityMode=e.get("accessibilityMode",!1),!e.has("accessibilityMode")&&this._detectScreenReader()&&this._logger.info("Screen reader detected - consider enabling accessibility mode in settings"),this._keyboardNavigationEnabled=e.get("keyboardNavigation",!0)}_setupConfigurationListener(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=L.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.accessibilityMode")||e.affectsConfiguration("explorerDates.keyboardNavigation"))&&(this._loadConfiguration(),this._logger.debug("Accessibility configuration updated",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled}))})}getAccessibleTooltip(e,t,o,i,s=null){if(!this._isAccessibilityMode)return null;let r=Io(e),n=this._formatAccessibleDate(t),l=this._formatAccessibleDate(o),c=`File: ${r}. `;return c+=`Last modified: ${n}. `,c+=`Created: ${l}. `,i!==void 0&&(c+=`Size: ${this._formatAccessibleFileSize(i)}. `),s&&s.authorName&&(c+=`Last modified by: ${s.authorName}. `),c+=`Full path: ${e}`,c}_formatAccessibleDate(e){let o=new Date().getTime()-e.getTime(),i=Math.floor(o/(1e3*60)),s=Math.floor(o/(1e3*60*60)),r=Math.floor(o/(1e3*60*60*24));return i<1?"just now":i<60?`${i} ${i===1?"minute":"minutes"} ago`:s<24?`${s} ${s===1?"hour":"hours"} ago`:r<7?`${r} ${r===1?"day":"days"} ago`:e.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}_formatAccessibleFileSize(e){if(e<1024)return`${e} bytes`;let t=e/1024;if(t<1024)return`${Math.round(t)} kilobytes`;let o=t/1024;return`${Math.round(o*10)/10} megabytes`}getAccessibleBadge(e){if(!this._isAccessibilityMode)return e;let t=e.split("|"),o=t[0],i=t[1],s=t.length>2?t[2]:null,r=this._expandTimeAbbreviation(o);return i&&(r+=` ${this._expandSizeAbbreviation(i)}`),s&&(r+=` by ${s.replace("\u2022","")}`),r}_expandTimeAbbreviation(e){let t={m:" minutes ago",h:" hours ago",d:" days ago",w:" weeks ago",mo:" months ago",yr:" years ago",min:" minutes ago",hrs:" hours ago",day:" days ago",wk:" weeks ago"},o=e;for(let[i,s]of Object.entries(t))if(e.endsWith(i)){o=e.slice(0,-i.length)+s;break}return o}_expandSizeAbbreviation(e){if(!e.startsWith("~"))return e;let t=e.slice(1);return t.endsWith("B")?t.slice(0,-1)+" bytes":t.endsWith("K")?t.slice(0,-1)+" kilobytes":t.endsWith("M")?t.slice(0,-1)+" megabytes":t}createFocusIndicator(e,t){if(!this._keyboardNavigationEnabled)return null;let o=Math.random().toString(36).substr(2,9);return this._focusIndicators.set(o,{element:e,description:t,timestamp:Date.now()}),{id:o,dispose:d(()=>{this._focusIndicators.delete(o)},"dispose")}}announceToScreenReader(e,t="polite"){this._isAccessibilityMode&&(t==="assertive"?L.window.showWarningMessage(e):this._logger.debug("Screen reader announcement",{message:e,priority:t}))}getKeyboardShortcutHelp(){return[{key:"Ctrl+Shift+D (Cmd+Shift+D)",command:"Toggle date decorations",description:"Show or hide file modification times in Explorer"},{key:"Ctrl+Shift+C (Cmd+Shift+C)",command:"Copy file date",description:"Copy selected file's modification date to clipboard"},{key:"Ctrl+Shift+I (Cmd+Shift+I)",command:"Show file details",description:"Display detailed information about selected file"},{key:"Ctrl+Shift+R (Cmd+Shift+R)",command:"Refresh decorations",description:"Refresh all file modification time decorations"},{key:"Ctrl+Shift+A (Cmd+Shift+A)",command:"Show workspace activity",description:"Open workspace file activity analysis"},{key:"Ctrl+Shift+F (Cmd+Shift+F)",command:"Toggle fade old files",description:"Toggle fading effect for old files"}]}async showKeyboardShortcutsHelp(){let e=this.getKeyboardShortcutHelp();await L.window.showInformationMessage("Keyboard shortcuts help available in output panel","Show Shortcuts").then(t=>{if(t==="Show Shortcuts"){let o=L.window.createOutputChannel("Explorer Dates Shortcuts");o.appendLine("Explorer Dates Keyboard Shortcuts"),o.appendLine("====================================="),o.appendLine(""),e.forEach(i=>{o.appendLine(`${i.key}`),o.appendLine(`  Command: ${i.command}`),o.appendLine(`  Description: ${i.description}`),o.appendLine("")}),o.show()}})}shouldEnhanceAccessibility(){return this._isAccessibilityMode||this._detectScreenReader()}_detectScreenReader(){return L.workspace.getConfiguration("editor").get("accessibilitySupport")==="on"}getAccessibilityRecommendations(){let e=[];return this._detectScreenReader()&&(e.push({type:"setting",setting:"explorerDates.accessibilityMode",value:!0,reason:"Enable enhanced tooltips and screen reader optimizations"}),e.push({type:"setting",setting:"explorerDates.colorScheme",value:"none",reason:"Colors may not be useful with screen readers"}),e.push({type:"setting",setting:"explorerDates.dateDecorationFormat",value:"relative-long",reason:"Longer format is more descriptive for screen readers"})),L.window.activeColorTheme.kind===L.ColorThemeKind.HighContrast&&e.push({type:"setting",setting:"explorerDates.highContrastMode",value:!0,reason:"Optimize for high contrast themes"}),e}async applyAccessibilityRecommendations(){let e=this.getAccessibilityRecommendations();if(e.length===0){L.window.showInformationMessage("No accessibility recommendations at this time.");return}let t=L.workspace.getConfiguration("explorerDates"),o=0;for(let i of e)if(i.type==="setting")try{await t.update(i.setting.replace("explorerDates.",""),i.value,L.ConfigurationTarget.Global),o++,this._logger.info(`Applied accessibility recommendation: ${i.setting} = ${i.value}`)}catch(s){this._logger.error(`Failed to apply recommendation: ${i.setting}`,s)}o>0&&L.window.showInformationMessage(`Applied ${o} accessibility recommendations. Restart may be required for all changes to take effect.`)}dispose(){this._focusIndicators.clear(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._logger.info("AccessibilityManager disposed")}};d(Be,"AccessibilityManager");var Ne=Be;St.exports={AccessibilityManager:Ne}});var $t=S((Xi,kt)=>{var{MAX_BADGE_LENGTH:Tt}=se();function zo(a=0,e="auto"){let t=typeof a=="number"&&!Number.isNaN(a)?a:0;if(e==="bytes")return`~${t}B`;let o=t/1024;if(e==="kb")return`~${o.toFixed(1)}K`;let i=o/1024;return e==="mb"?`~${i.toFixed(1)}M`:t<1024?`~${t}B`:o<1024?`~${Math.round(o)}K`:`~${i.toFixed(1)}M`}d(zo,"formatFileSize");function Wo(a){if(a)return a.length>Tt?a.substring(0,Tt):a}d(Wo,"trimBadge");kt.exports={formatFileSize:zo,trimBadge:Wo}});var It=S((ts,Pt)=>{var m=require("vscode"),{getLogger:Ro}=A(),{getLocalization:Lo}=ie(),{fileSystem:No}=U(),{SmartExclusionManager:Bo}=ft(),{BatchProcessor:Oo}=wt(),{AdvancedCache:Uo}=Ct(),{ThemeIntegrationManager:jo}=Dt(),{AccessibilityManager:Go}=Ft(),{formatFileSize:Ho,trimBadge:Mt}=$t(),{getFileName:Oe,getExtension:we,getCacheKey:qo,normalizePath:be,getRelativePath:Vo,getUriPath:Q}=B(),{DEFAULT_CACHE_TIMEOUT:Et,DEFAULT_MAX_CACHE_SIZE:Ko,MONTH_ABBREVIATIONS:Jo,GLOBAL_STATE_KEYS:Qo}=se(),{isWebEnvironment:Yo}=ke(),ve=3e4,j=d((a="")=>{let e=typeof a=="string"?a:Q(a),t=be(e);return Oe(t)||t||"unknown"},"describeFile"),At=!0,re=null;if(!At)try{let{exec:a}=require("child_process"),{promisify:e}=require("util");re=e(a)}catch{re=null}var je=class je{constructor(){this._onDidChangeFileDecorations=new m.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event,this._decorationCache=new Map,this._isWeb=At||Yo(),this._baselineDesktopCacheTimeout=Et*4,this._maxDesktopCacheTimeout=this._baselineDesktopCacheTimeout*2,this._lastCacheTimeoutBoostLookups=0,this._maxCacheSize=Ko,this._fileSystem=No,this._gitAvailable=!this._isWeb&&!!re,this._gitWarningShown=!1,this._cacheKeyStats=new Map,this._logger=Ro(),this._l10n=Lo(),this._smartExclusion=new Bo,this._batchProcessor=new Oo,this._progressiveLoadingJobs=new Set,this._progressiveLoadingEnabled=!1,this._advancedCache=null,this._configurationWatcher=null,this._gitCache=new Map,this._maxGitCacheEntries=1e3,this._themeIntegration=new jo,this._accessibility=new Go,this._metrics={totalDecorations:0,cacheHits:0,cacheMisses:0,errors:0,gitBlameTimeMs:0,gitBlameCalls:0,fileStatTimeMs:0,fileStatCalls:0},this._refreshTimer=null,this._refreshInterval=6e4;let e=m.workspace.getConfiguration("explorerDates"),t=e.get("cacheTimeout",ve);this._hasCustomCacheTimeout=this._detectCacheTimeoutOverride(e,t),this._cacheTimeout=this._resolveCacheTimeout(t),this._performanceMode=e.get("performanceMode",!1),this._performanceMode||this._setupFileWatcher(),this._setupConfigurationWatcher(),this._performanceMode||this._setupPeriodicRefresh(),this._logger.info(`FileDateDecorationProvider initialized (performanceMode: ${this._performanceMode})`),this._previewSettings=null,this._extensionContext=null}applyPreviewSettings(e){let t=!!this._previewSettings;e&&typeof e=="object"?(this._previewSettings=Object.assign({},e),this._logger.info("\u{1F504} Applied preview settings",this._previewSettings)):(this._previewSettings=null,this._logger.info("\u{1F504} Cleared preview settings"));let o=this._decorationCache.size;if(this._decorationCache.clear(),this._logger.info(`\u{1F5D1}\uFE0F Cleared memory cache (${o} items) for preview mode change`),this._advancedCache)try{typeof this._advancedCache.clear=="function"?(this._advancedCache.clear(),this._logger.info("\u{1F5D1}\uFE0F Cleared advanced cache for preview mode change")):this._logger.warn("\u26A0\uFE0F Advanced cache does not support clear operation")}catch(i){this._logger.warn("\u26A0\uFE0F Failed to clear advanced cache:",i.message)}this._previewSettings&&!t?this._logger.info("\u{1F3AD} Entered preview mode - caching disabled"):!this._previewSettings&&t&&this._logger.info("\u{1F3AD} Exited preview mode - caching re-enabled"),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Fired decoration refresh event for preview change")}async testDecorationProvider(){this._logger.info("\u{1F9EA} Testing decoration provider functionality...");let e=m.workspace.workspaceFolders;if(!e||e.length===0){this._logger.error("\u274C No workspace folders available for testing");return}let t=m.Uri.joinPath(e[0].uri,"package.json");try{let o=await this.provideFileDecoration(t);this._logger.info("\u{1F9EA} Test decoration result:",{file:"package.json",success:!!o,badge:o?.badge,hasTooltip:!!o?.tooltip,hasColor:!!o?.color}),this._onDidChangeFileDecorations.fire(t),this._logger.info("\u{1F504} Fired decoration change event for test file")}catch(o){this._logger.error("\u274C Test decoration failed:",o)}}forceRefreshAllDecorations(){this._logger.info("\u{1F504} Force refreshing ALL decorations..."),this._decorationCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Triggered global decoration refresh")}startProviderCallMonitoring(){this._providerCallCount=0,this._providerCallFiles=new Set;let e=this.provideFileDecoration.bind(this);this.provideFileDecoration=async(t,o)=>{this._providerCallCount++;let i=Q(t)||t?.toString(!0)||"unknown";return this._providerCallFiles.add(be(i)),this._logger.info(`\u{1F50D} Provider called ${this._providerCallCount} times for: ${j(t||i)}`),await e(t,o)},this._logger.info("\u{1F4CA} Started provider call monitoring")}getProviderCallStats(){return{totalCalls:this._providerCallCount||0,uniqueFiles:this._providerCallFiles?this._providerCallFiles.size:0,calledFiles:this._providerCallFiles?Array.from(this._providerCallFiles):[]}}_setupFileWatcher(){let e=m.workspace.createFileSystemWatcher("**/*");e.onDidChange(t=>this.refreshDecoration(t)),e.onDidCreate(t=>this.refreshDecoration(t)),e.onDidDelete(t=>this.clearDecoration(t)),this._fileWatcher=e}_setupPeriodicRefresh(){let e=m.workspace.getConfiguration("explorerDates");if(this._refreshInterval=e.get("badgeRefreshInterval",6e4),this._logger.info(`Setting up periodic refresh with interval: ${this._refreshInterval}ms`),this._refreshTimer&&(clearInterval(this._refreshTimer),this._refreshTimer=null),!e.get("showDateDecorations",!0)){this._logger.info("Decorations disabled, skipping periodic refresh setup");return}this._refreshTimer=setInterval(()=>{this._logger.debug("Periodic refresh triggered - clearing caches and refreshing decorations");let t=this._decorationCache.size;if(this._decorationCache.clear(),this._advancedCache)try{this._advancedCache.clear()}catch(o){this._logger.debug(`Failed to clear advanced cache during periodic refresh: ${o.message}`)}this._onDidChangeFileDecorations.fire(void 0),this._logger.debug(`Periodic refresh completed - cleared ${t} cached items from memory`)},this._refreshInterval),this._logger.info("Periodic refresh timer started")}_setupConfigurationWatcher(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=m.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration("explorerDates")){this._logger.debug("Configuration changed, updating settings");let t=m.workspace.getConfiguration("explorerDates"),o=t.get("cacheTimeout",ve);if(this._hasCustomCacheTimeout=this._detectCacheTimeoutOverride(t,o),this._cacheTimeout=this._resolveCacheTimeout(o),this._maxCacheSize=t.get("maxCacheSize",1e4),e.affectsConfiguration("explorerDates.performanceMode")){let i=t.get("performanceMode",!1);i!==this._performanceMode&&(this._performanceMode=i,this._logger.info(`Performance mode changed to: ${i}`),i&&this._fileWatcher?(this._fileWatcher.dispose(),this._fileWatcher=null,this._logger.info("File watcher disabled for performance mode")):!i&&!this._fileWatcher&&(this._setupFileWatcher(),this._logger.info("File watcher enabled (performance mode off)")),i&&this._refreshTimer?(clearInterval(this._refreshTimer),this._refreshTimer=null,this._logger.info("Periodic refresh disabled for performance mode")):!i&&!this._refreshTimer&&(this._setupPeriodicRefresh(),this._logger.info("Periodic refresh enabled (performance mode off)")),this.refreshAll())}e.affectsConfiguration("explorerDates.badgeRefreshInterval")&&(this._refreshInterval=t.get("badgeRefreshInterval",6e4),this._logger.info(`Badge refresh interval updated to: ${this._refreshInterval}ms`),this._performanceMode||this._setupPeriodicRefresh()),(e.affectsConfiguration("explorerDates.showDateDecorations")||e.affectsConfiguration("explorerDates.dateDecorationFormat")||e.affectsConfiguration("explorerDates.excludedFolders")||e.affectsConfiguration("explorerDates.excludedPatterns")||e.affectsConfiguration("explorerDates.highContrastMode")||e.affectsConfiguration("explorerDates.fadeOldFiles")||e.affectsConfiguration("explorerDates.fadeThreshold")||e.affectsConfiguration("explorerDates.colorScheme")||e.affectsConfiguration("explorerDates.showGitInfo")||e.affectsConfiguration("explorerDates.customColors")||e.affectsConfiguration("explorerDates.showFileSize")||e.affectsConfiguration("explorerDates.fileSizeFormat"))&&this.refreshAll(),e.affectsConfiguration("explorerDates.progressiveLoading")&&this._applyProgressiveLoadingSetting().catch(i=>{this._logger.error("Failed to reconfigure progressive loading",i)}),e.affectsConfiguration("explorerDates.showDateDecorations")&&!this._performanceMode&&this._setupPeriodicRefresh()}})}_detectCacheTimeoutOverride(e,t){if(typeof t=="number"&&t!==ve)return!0;if(!e||typeof e.inspect!="function")return!1;try{let o=e.inspect("cacheTimeout");if(!o)return!1;if(typeof o=="object"&&(typeof o.globalValue=="number"||typeof o.workspaceValue=="number"||typeof o.workspaceFolderValue=="number"))return!0;if(o.cacheTimeout&&typeof o.cacheTimeout=="object"){let i=o.cacheTimeout;if(typeof i.globalValue=="number"||typeof i.workspaceValue=="number"||typeof i.workspaceFolderValue=="number"){let r=i.globalValue??i.workspaceValue??i.workspaceFolderValue;return typeof r=="number"&&r!==ve}}}catch{return!1}return!1}_resolveCacheTimeout(e){return this._isWeb||this._hasCustomCacheTimeout?e:Math.max(this._baselineDesktopCacheTimeout,e||this._baselineDesktopCacheTimeout)}_getGitCacheKey(e,t,o){let i=e||"unknown-workspace",s=t||"unknown-relative",r=Number.isFinite(o)?o:"unknown-mtime";return`${i}::${s}::${r}`}_getCachedGitInfo(e){let t=this._gitCache.get(e);return t?(t.lastAccess=Date.now(),t.value):null}_setCachedGitInfo(e,t){if(this._gitCache.size>=this._maxGitCacheEntries){let o=null,i=1/0;for(let[s,r]of this._gitCache.entries())r.lastAccess<i&&(i=r.lastAccess,o=s);o&&this._gitCache.delete(o)}this._gitCache.set(e,{value:t,lastAccess:Date.now()})}async _applyProgressiveLoadingSetting(){if(!this._batchProcessor)return;if(this._performanceMode){this._logger.info("Progressive loading disabled due to performance mode"),this._cancelProgressiveWarmupJobs(),this._progressiveLoadingEnabled=!1;return}let t=m.workspace.getConfiguration("explorerDates").get("progressiveLoading",!0);if(this._progressiveLoadingEnabled=t,!t){this._logger.info("Progressive loading disabled via explorerDates.progressiveLoading"),this._cancelProgressiveWarmupJobs();return}let o=m.workspace.workspaceFolders;!o||o.length===0||(this._cancelProgressiveWarmupJobs(),o.forEach(i=>{let s=this._batchProcessor.processDirectoryProgressively(i.uri,async r=>{try{await this.provideFileDecoration(r)}catch(n){this._logger.debug("Progressive warmup processor failed",n)}},{background:!0,priority:"low",maxFiles:500});s&&this._progressiveLoadingJobs.add(s)}),this._logger.info(`Progressive loading queued for ${o.length} workspace folder(s).`))}_cancelProgressiveWarmupJobs(){if(!(!this._progressiveLoadingJobs||this._progressiveLoadingJobs.size===0)){if(this._batchProcessor)for(let e of this._progressiveLoadingJobs)this._batchProcessor.cancelBatch(e);this._progressiveLoadingJobs.clear()}}refreshDecoration(e){let t=this._getCacheKey(e);if(this._decorationCache.delete(t),this._advancedCache)try{this._advancedCache.invalidateByPattern(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}catch(o){this._logger.debug(`Could not invalidate advanced cache for ${j(e)}: ${o.message}`)}this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F504} Refreshed decoration cache for: ${j(e)}`)}clearDecoration(e){let t=this._getCacheKey(e);this._decorationCache.delete(t),this._advancedCache&&this._logger.debug(`Advanced cache entry will expire naturally: ${j(e)}`),this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F5D1}\uFE0F Cleared decoration cache for: ${j(e)}`)}clearAllCaches(){let e=this._decorationCache.size;this._decorationCache.clear(),this._logger.info(`Cleared memory cache (was ${e} items)`),this._advancedCache&&(this._advancedCache.clear(),this._logger.info("Cleared advanced cache")),this._metrics.cacheHits=0,this._metrics.cacheMisses=0,this._logger.info("All caches cleared successfully")}refreshAll(){this._decorationCache.clear(),this._gitCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("All decorations refreshed with cache clear")}async _isExcludedSimple(e){let t=m.workspace.getConfiguration("explorerDates"),o=Q(e);if(!o)return!1;let i=be(o),s=Oe(i),r=we(o),n=t.get("forceShowForFileTypes",[]);if(n.length>0&&n.includes(r))return this._logger.debug(`File type ${r} is forced to show: ${o}`),!1;let l=t.get("enableTroubleShootingMode",!1);l&&this._logger.info(`\u{1F50D} Checking exclusion for: ${s} (ext: ${r})`);let c=t.get("excludedFolders",["node_modules",".git","dist","build","out",".vscode-test"]),h=t.get("excludedPatterns",["**/*.tmp","**/*.log","**/.git/**","**/node_modules/**"]);for(let u of c){let w=u.replace(/^\/+|\/+$/g,"");if(i.includes(`/${w}/`)||i.endsWith(`/${w}`))return l?this._logger.info(`\u274C File excluded by folder: ${o} (${u})`):this._logger.debug(`File excluded by folder: ${o} (${u})`),!0}for(let u of h)if(u.includes("node_modules")&&i.includes("/node_modules/")||u.includes(".git/**")&&i.includes("/.git/")||u.includes("*.tmp")&&s.endsWith(".tmp")||u.includes("*.log")&&s.endsWith(".log"))return!0;return l&&this._logger.info(`\u2705 File NOT excluded: ${s} (ext: ${r})`),!1}async _isExcluded(e){let t=m.workspace.getConfiguration("explorerDates"),o=Q(e);if(!o)return!1;let i=be(o),s=Oe(i),r=m.workspace.getWorkspaceFolder(e);if(r){let n=await this._smartExclusion.getCombinedExclusions(r.uri);for(let l of n.folders)if(new RegExp(`(^|/)${l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(i))return this._logger.debug(`File excluded by folder rule: ${o} (folder: ${l})`),!0;for(let l of n.patterns){let c=l.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),h=new RegExp(c);if(h.test(i)||h.test(s))return this._logger.debug(`File excluded by pattern: ${o} (pattern: ${l})`),!0}}else{let n=t.get("excludedFolders",[]),l=t.get("excludedPatterns",[]);for(let c of n)if(new RegExp(`(^|/)${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(i))return!0;for(let c of l){let h=c.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),u=new RegExp(h);if(u.test(i)||u.test(s))return!0}}return!1}_manageCacheSize(){if(this._decorationCache.size>this._maxCacheSize){this._logger.debug(`Cache size (${this._decorationCache.size}) exceeds max (${this._maxCacheSize}), cleaning old entries`);let e=Math.floor(this._maxCacheSize*.2),t=Array.from(this._decorationCache.entries());t.sort((o,i)=>o[1].timestamp-i[1].timestamp);for(let o=0;o<e&&o<t.length;o++)this._decorationCache.delete(t[o][0]);this._logger.debug(`Removed ${e} old cache entries`)}}_maybeExtendCacheTimeout(){if(this._isWeb||this._hasCustomCacheTimeout)return;let e=this._metrics.cacheHits+this._metrics.cacheMisses;if(e<200||this._cacheTimeout>=this._maxDesktopCacheTimeout)return;let t=this._metrics.cacheHits/e;if(t<.85||e<=this._lastCacheTimeoutBoostLookups)return;let o=this._cacheTimeout;this._cacheTimeout=Math.min(this._cacheTimeout+Et,this._maxDesktopCacheTimeout),this._lastCacheTimeoutBoostLookups=e,this._logger.info("\u2699\uFE0F Cache timeout auto-extended",{previousTimeout:o,newTimeout:this._cacheTimeout,hitRate:Number(t.toFixed(2)),totalLookups:e})}async _getCachedDecoration(e,t){if(this._advancedCache)try{let i=await this._advancedCache.get(e);if(i)return this._metrics.cacheHits++,this._logger.debug(`\u{1F9E0} Advanced cache hit for: ${t}`),i}catch(i){this._logger.debug(`Advanced cache error: ${i.message}`)}let o=this._decorationCache.get(e);return o&&Date.now()-o.timestamp<this._cacheTimeout?(this._metrics.cacheHits++,this._logger.debug(`\u{1F4BE} Memory cache hit for: ${t}`),o.decoration):null}async _storeDecorationInCache(e,t,o){if(this._manageCacheSize(),this._decorationCache.set(e,{decoration:t,timestamp:Date.now()}),this._advancedCache)try{await this._advancedCache.set(e,t,{ttl:this._cacheTimeout}),this._logger.debug(`\u{1F9E0} Stored in advanced cache: ${o}`)}catch(i){this._logger.debug(`Failed to store in advanced cache: ${i.message}`)}this._maybeExtendCacheTimeout()}_formatDateBadge(e,t,o=null){let s=o!==null?o:new Date().getTime()-e.getTime();if(s<0)return this._logger.debug(`File has future modification time (diffMs: ${s}), treating as just modified`),"\u25CF\u25CF";let r=Math.floor(s/(1e3*60)),n=Math.floor(s/(1e3*60*60)),l=Math.floor(s/(1e3*60*60*24)),c=Math.floor(l/7),h=Math.floor(l/30);switch(t){case"relative-short":case"relative-long":return r<1?"\u25CF\u25CF":r<60?`${Math.min(r,99)}m`:n<24?`${Math.min(n,23)}h`:l<7?`${l}d`:c<4?`${c}w`:h<12?`${h}M`:"1y";case"absolute-short":case"absolute-long":{let u=e.getDate();return`${Jo[e.getMonth()]}${u<10?"0"+u:u}`}case"technical":return r<60?`${r}m`:n<24?`${n}h`:`${l}d`;case"minimal":return n<1?"\u2022\u2022":n<24?"\u25CB\u25CB":"\u2500\u2500";default:return r<60?`${r}m`:n<24?`${n}h`:`${l}d`}}_formatFileSize(e,t="auto"){return Ho(e,t)}_getColorByScheme(e,t,o=""){if(t==="none")return;let s=new Date().getTime()-e.getTime(),r=Math.floor(s/(1e3*60*60)),n=Math.floor(s/(1e3*60*60*24));switch(t){case"recency":return r<1?new m.ThemeColor("charts.green"):r<24?new m.ThemeColor("charts.yellow"):new m.ThemeColor("charts.red");case"file-type":{let l=we(o);return[".js",".ts",".jsx",".tsx"].includes(l)?new m.ThemeColor("charts.blue"):[".css",".scss",".less"].includes(l)?new m.ThemeColor("charts.purple"):[".html",".htm",".xml"].includes(l)?new m.ThemeColor("charts.orange"):[".json",".yaml",".yml"].includes(l)?new m.ThemeColor("charts.green"):[".md",".txt",".log"].includes(l)?new m.ThemeColor("charts.yellow"):[".py",".rb",".php"].includes(l)?new m.ThemeColor("charts.red"):new m.ThemeColor("editorForeground")}case"subtle":return r<1?new m.ThemeColor("editorInfo.foreground"):n<7?new m.ThemeColor("editorWarning.foreground"):new m.ThemeColor("editorError.foreground");case"vibrant":return r<1?new m.ThemeColor("terminal.ansiGreen"):r<24?new m.ThemeColor("terminal.ansiYellow"):n<7?new m.ThemeColor("terminal.ansiMagenta"):new m.ThemeColor("terminal.ansiRed");case"custom":return r<1?new m.ThemeColor("explorerDates.customColor.veryRecent"):r<24?new m.ThemeColor("explorerDates.customColor.recent"):new m.ThemeColor("explorerDates.customColor.old");default:return}}_generateBadgeDetails({filePath:e,stat:t,diffMs:o,dateFormat:i,badgePriority:s,showFileSize:r,fileSizeFormat:n,gitBlame:l,showGitInfo:c}){let h=this._formatDateBadge(t.mtime,i,o),u=this._formatDateReadable(t.mtime),w=this._formatDateReadable(t.birthtime),p=h;if(this._logger.debug(`\u{1F3F7}\uFE0F Badge generation for ${j(e)}: badgePriority=${s}, showGitInfo=${c}, hasGitBlame=${!!l}, authorName=${l?.authorName}, previewMode=${!!this._previewSettings}`),s==="author"&&l?.authorName){let v=this._getInitials(l.authorName);v&&(p=v,this._logger.debug(`\u{1F3F7}\uFE0F Using author initials badge: "${v}" (from ${l.authorName})`))}else if(s==="size"&&r){let v=this._formatCompactSize(t.size);v&&(p=v,this._logger.debug(`\u{1F3F7}\uFE0F Using size badge: "${v}"`))}else this._logger.debug(`\u{1F3F7}\uFE0F Using time badge: "${h}" (badgePriority=${s})`);return{badge:h,displayBadge:p,readableModified:u,readableCreated:w,fileSizeLabel:r?this._formatFileSize(t.size,n):null}}async _buildTooltipContent({filePath:e,resourceUri:t,stat:o,badgeDetails:i,gitBlame:s,shouldUseAccessibleTooltips:r,fileSizeFormat:n,isCodeFile:l}){let c=j(e),h=we(e);if(r){let p=this._accessibility.getAccessibleTooltip(e,o.mtime,o.birthtime,o.size,s);if(p)return this._logger.info(`\u{1F50D} Using accessible tooltip (${p.length} chars): "${p.substring(0,50)}..."`),p;this._logger.info("\u{1F50D} Accessible tooltip generation failed, using rich tooltip")}let u=`\u{1F4C4} File: ${c}
`;u+=`\u{1F4DD} Last Modified: ${i.readableModified}
`,u+=`   ${this._formatFullDate(o.mtime)}

`,u+=`\u{1F4C5} Created: ${i.readableCreated}
`,u+=`   ${this._formatFullDate(o.birthtime)}

`;let w=i.fileSizeLabel||this._formatFileSize(o.size,n||"auto");if(u+=`\u{1F4CA} Size: ${w} (${o.size.toLocaleString()} bytes)
`,h&&(u+=`\u{1F3F7}\uFE0F Type: ${h.toUpperCase()} file
`),l)try{let p=t||e,R=(await this._fileSystem.readFile(p,"utf8")).split(`
`).length;u+=`\u{1F4CF} Lines: ${R.toLocaleString()}
`}catch{}return u+=`\u{1F4C2} Path: ${e}`,s&&(u+=`

\u{1F464} Last Modified By: ${s.authorName}`,s.authorEmail&&(u+=` (${s.authorEmail})`),s.authorDate&&(u+=`
   ${s.authorDate}`)),u}_formatDateReadable(e){let t=new Date,o=t.getTime()-e.getTime(),i=Math.floor(o/(1e3*60)),s=Math.floor(o/(1e3*60*60)),r=Math.floor(o/(1e3*60*60*24));return i<1?this._l10n.getString("justNow"):i<60?this._l10n.getString("minutesAgo",i):s<24&&e.toDateString()===t.toDateString()?this._l10n.getString("hoursAgo",s):r<7?r===1?this._l10n.getString("yesterday"):this._l10n.getString("daysAgo",r):e.getFullYear()===t.getFullYear()?this._l10n.formatDate(e,{month:"short",day:"numeric"}):this._l10n.formatDate(e,{month:"short",day:"numeric",year:"numeric"})}async _getGitBlameInfo(e,t=null){if(!this._gitAvailable||!re)return null;try{let o=m.workspace.getWorkspaceFolder(m.Uri.file(e));if(!o)return null;let i=o.uri.fsPath||o.uri.path,s=Vo(i,e),r=this._getGitCacheKey(i,s,t),n=this._getCachedGitInfo(r);if(n)return n;let l=Date.now();try{let{stdout:c}=await re(`git log -1 --format="%H|%an|%ae|%ad" -- "${s}"`,{cwd:o.uri.fsPath,timeout:2e3});if(!c||!c.trim())return null;let[h,u,w,p]=c.trim().split("|"),v={hash:h||"",authorName:u||"Unknown",authorEmail:w||"",authorDate:p||""};return this._setCachedGitInfo(r,v),v}finally{let c=Date.now()-l;this._metrics.gitBlameTimeMs+=c,this._metrics.gitBlameCalls++}}catch{return null}}_getInitials(e){if(!e||typeof e!="string")return null;let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?null:t.length===1?t[0].substring(0,2).toUpperCase():(t[0][0]+(t[1][0]||"")).substring(0,2).toUpperCase()}_formatCompactSize(e){if(typeof e!="number"||isNaN(e))return null;let t=["B","K","M","G","T"],o=0,i=e;for(;i>=1024&&o<t.length-1;)i=i/1024,o++;let s=Math.round(i),r=t[o];if(s<=9)return`${s}${r}`;let n=String(s);return n.length>=2?n.slice(0,2):n}_formatFullDate(e){let t={year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"};return e.toLocaleString("en-US",t)}_getCacheKey(e){return qo(Q(e))}async provideFileDecoration(e,t){let o=Date.now();try{if(!e){this._logger.error("\u274C Invalid URI provided to provideFileDecoration:",e);return}let i=Q(e);if(!i){this._logger.error("\u274C Could not resolve path for URI in provideFileDecoration:",e);return}let s=j(i);this._performanceMode||(this._logger.info(`\u{1F50D} VSCODE REQUESTED DECORATION: ${s} (${i})`),this._logger.info(`\u{1F4CA} Call context: token=${!!t}, cancelled=${t?.isCancellationRequested}`));let r=m.workspace.getConfiguration("explorerDates"),n=d((E,st)=>{if(this._previewSettings&&Object.prototype.hasOwnProperty.call(this._previewSettings,E)){let rt=this._previewSettings[E];return this._logger.debug(`\u{1F3AD} Using preview value for ${E}: ${rt} (config has: ${r.get(E,st)})`),rt}return r.get(E,st)},"_get");if(this._previewSettings&&this._logger.info(`\u{1F3AD} Processing ${s} in PREVIEW MODE with settings:`,this._previewSettings),!n("showDateDecorations",!0)){this._performanceMode||this._logger.info(`\u274C RETURNED UNDEFINED: Decorations disabled globally for ${s}`);return}if(await this._isExcludedSimple(e)){this._performanceMode||this._logger.info(`\u274C File excluded: ${s}`);return}this._logger.debug(`\u{1F50D} Processing file: ${s}`);let l=this._getCacheKey(e);if(this._previewSettings)this._logger.debug(`\u{1F504} Skipping cache due to active preview settings for: ${s}`);else{let E=await this._getCachedDecoration(l,s);if(E)return E}if(this._metrics.cacheMisses++,this._logger.debug(`\u274C Cache miss for: ${s} (key: ${l.substring(0,50)}...)`),t?.isCancellationRequested){this._logger.debug(`Decoration cancelled for: ${i}`);return}let c=Date.now(),h=await this._fileSystem.stat(e);if(this._metrics.fileStatTimeMs+=Date.now()-c,this._metrics.fileStatCalls++,!(typeof h.isFile=="function"?h.isFile():!0))return;let w=h.mtime instanceof Date?h.mtime:new Date(h.mtime),p=h.birthtime instanceof Date?h.birthtime:new Date(h.birthtime||h.ctime||h.mtime),v={mtime:w,birthtime:p,size:h.size},R=Date.now()-w.getTime(),V=n("dateDecorationFormat","smart"),G=this._performanceMode?"none":n("colorScheme","none"),ne=n("highContrastMode",!1),ye=this._performanceMode?!1:n("showFileSize",!1),ce=n("fileSizeFormat","auto"),O=n("accessibilityMode",!1),le=this._performanceMode?!1:n("fadeOldFiles",!1),_e=n("fadeThreshold",30),Ce=this._performanceMode?"none":n("showGitInfo","none"),Z=this._performanceMode?"time":n("badgePriority","time"),H=(Ce!=="none"||Z==="author")&&this._gitAvailable&&!this._performanceMode,de=H?Ce:"none";Z==="author"&&!H&&(Z="time");let he=H?await this._getGitBlameInfo(i,w.getTime()):null,X=this._generateBadgeDetails({filePath:i,stat:v,diffMs:R,dateFormat:V,badgePriority:Z,showFileSize:ye,fileSizeFormat:ce,gitBlame:he,showGitInfo:de}),oo=we(i),io=[".js",".ts",".jsx",".tsx",".py",".rb",".php",".java",".cpp",".c",".cs",".go",".rs",".kt",".swift"].includes(oo),it=O&&this._accessibility?.shouldEnhanceAccessibility();this._logger.debug(`\u{1F50D} Tooltip generation for ${s}: accessibilityMode=${O}, shouldUseAccessible=${it}, previewMode=${!!this._previewSettings}`);let ue=await this._buildTooltipContent({filePath:i,resourceUri:e,stat:v,badgeDetails:X,gitBlame:de==="none"?null:he,shouldUseAccessibleTooltips:it,fileSizeFormat:ce,isCodeFile:io}),q;G!=="none"&&(q=this._themeIntegration?this._themeIntegration.applyThemeAwareColorScheme(G,i,R):this._getColorByScheme(w,G,i)),this._logger.debug(`\u{1F3A8} Color scheme setting: ${G}, using color: ${q?"yes":"no"}`),le&&Math.floor(R/864e5)>_e&&(q=new m.ThemeColor("editorGutter.commentRangeForeground"));let xe=Mt(X.displayBadge)||Mt(X.badge)||"??";this._accessibility?.shouldEnhanceAccessibility()&&(xe=this._accessibility.getAccessibleBadge(xe));let $;try{if($=new m.FileDecoration(xe),ue&&ue.length<500&&($.tooltip=ue,this._logger.debug(`\u{1F4DD} Added tooltip (${ue.length} chars)`)),q){let E=this._enhanceColorForSelection(q);$.color=E,this._logger.debug(`\u{1F3A8} Added enhanced color: ${E.id||E} (original: ${q.id||q})`)}$.propagate=!1}catch(E){this._logger.error("\u274C Failed to create decoration:",E),$=new m.FileDecoration("!!"),$.propagate=!1}if(this._logger.debug(`\u{1F3A8} Color/contrast check for ${s}: colorScheme=${G}, highContrastMode=${ne}, hasColor=${!!q}, previewMode=${!!this._previewSettings}`),ne&&($.color=new m.ThemeColor("editorWarning.foreground"),this._logger.info(`\u{1F506} Applied high contrast color (overriding colorScheme=${G})`)),this._previewSettings?this._logger.debug(`\u{1F504} Skipping cache storage due to preview mode for: ${s}`):await this._storeDecorationInCache(l,$,s),this._metrics.totalDecorations++,!$?.badge){this._logger.error(`\u274C Decoration badge is invalid for: ${s}`);return}let so=Date.now()-o;return this._performanceMode||(this._logger.info(`\u2705 Decoration created for: ${s} (badge: ${$.badge||"undefined"}) - Cache key: ${l.substring(0,30)}...`),this._logger.info("\u{1F3AF} RETURNING DECORATION TO VSCODE:",{file:s,badge:$.badge,hasTooltip:!!$.tooltip,hasColor:!!$.color,colorType:$.color?.constructor?.name,processingTimeMs:so,decorationType:$.constructor.name})),$}catch(i){this._metrics.errors++;let s=o?Date.now()-o:0,r=j(e),n=Q(e)||"unknown-uri";this._logger.error(`\u274C DECORATION ERROR for ${r}:`,{error:i.message,stack:i.stack?.split(`
`)[0],processingTimeMs:s,uri:n}),this._logger.error(`\u274C CRITICAL ERROR DETAILS for ${r}: ${i.message}`),this._logger.error(`\u274C Error type: ${i.constructor.name}`),this._logger.error(`\u274C Full stack: ${i.stack}`),this._logger.info(`\u274C RETURNED UNDEFINED: Error occurred for ${r}`);return}}getMetrics(){let e={...this._metrics,cacheSize:this._decorationCache.size,cacheHitRate:this._metrics.cacheHits+this._metrics.cacheMisses>0?(this._metrics.cacheHits/(this._metrics.cacheHits+this._metrics.cacheMisses)*100).toFixed(2)+"%":"0.00%"};return this._advancedCache&&(e.advancedCache=this._advancedCache.getStats()),this._batchProcessor&&(e.batchProcessor=this._batchProcessor.getMetrics()),e.cacheDebugging={memoryCacheKeys:Array.from(this._decorationCache.keys()).slice(0,5),cacheTimeout:this._cacheTimeout,maxCacheSize:this._maxCacheSize,keyStatsSize:this._cacheKeyStats?this._cacheKeyStats.size:0},e.performanceTiming={avgGitBlameMs:this._metrics.gitBlameCalls>0?(this._metrics.gitBlameTimeMs/this._metrics.gitBlameCalls).toFixed(1):"0.0",avgFileStatMs:this._metrics.fileStatCalls>0?(this._metrics.fileStatTimeMs/this._metrics.fileStatCalls).toFixed(1):"0.0",totalGitBlameTimeMs:this._metrics.gitBlameTimeMs,totalFileStatTimeMs:this._metrics.fileStatTimeMs,gitBlameCalls:this._metrics.gitBlameCalls,fileStatCalls:this._metrics.fileStatCalls},e}async initializeAdvancedSystems(e){try{if(this._extensionContext=e,this._isWeb&&await this._maybeWarnAboutGitLimitations(),this._performanceMode){this._logger.info("Performance mode enabled - skipping advanced cache, batch processor, and progressive loading");return}this._advancedCache=new Uo(e),await this._advancedCache.initialize(),this._logger.info("Advanced cache initialized"),this._batchProcessor.initialize(),this._logger.info("Batch processor initialized"),await this._applyProgressiveLoadingSetting(),m.workspace.getConfiguration("explorerDates").get("autoThemeAdaptation",!0)&&(await this._themeIntegration.autoConfigureForTheme(),this._logger.info("Theme integration configured")),this._accessibility.shouldEnhanceAccessibility()&&(await this._accessibility.applyAccessibilityRecommendations(),this._logger.info("Accessibility recommendations applied"));try{await this._smartExclusion.cleanupAllWorkspaceProfiles()}catch(o){this._logger.warn("Failed to clean workspace exclusion profiles",o)}if(m.workspace.workspaceFolders)for(let o of m.workspace.workspaceFolders)try{await this._smartExclusion.suggestExclusions(o.uri),this._logger.info(`Smart exclusions analyzed for: ${o.name}`)}catch(i){this._logger.error(`Failed to analyze smart exclusions for ${o.name}`,i)}this._logger.info("Advanced systems initialized successfully")}catch(t){this._logger.error("Failed to initialize advanced systems",t)}}async _maybeWarnAboutGitLimitations(){if(!this._gitWarningShown){this._gitWarningShown=!0;try{let e=this._extensionContext?.globalState,t=Qo.WEB_GIT_NOTICE;if(e?.get(t,!1))return;if(e?.update)try{await e.update(t,!0)}catch(i){this._logger.debug("Failed to persist Git limitation notice flag",i)}Promise.resolve().then(()=>{m.window.showInformationMessage("Explorer Dates: Git attribution badges are unavailable on VS Code for Web. Time-based decorations remain available.")})}catch(e){this._logger.debug("Failed to display Git limitation notice",e)}}}_enhanceColorForSelection(e){let t={"charts.yellow":"list.warningForeground","charts.red":"list.errorForeground","charts.green":"list.highlightForeground","charts.blue":"symbolIcon.functionForeground","charts.purple":"symbolIcon.classForeground","charts.orange":"list.warningForeground","terminal.ansiYellow":"list.warningForeground","terminal.ansiGreen":"list.highlightForeground","terminal.ansiRed":"list.errorForeground","terminal.ansiBlue":"symbolIcon.functionForeground","terminal.ansiMagenta":"symbolIcon.classForeground","terminal.ansiCyan":"symbolIcon.stringForeground","editorGutter.commentRangeForeground":"list.deemphasizedForeground","editorWarning.foreground":"list.warningForeground","editorError.foreground":"list.errorForeground","editorInfo.foreground":"list.highlightForeground"},o=e.id||e,i=t[o];return i?(this._logger.debug(`\u{1F527} Enhanced color ${o} \u2192 ${i} for better selection visibility`),new m.ThemeColor(i)):e}async dispose(){this._logger.info("Disposing FileDateDecorationProvider",this.getMetrics()),this._refreshTimer&&(clearInterval(this._refreshTimer),this._refreshTimer=null,this._logger.info("Cleared periodic refresh timer")),this._advancedCache&&await this._advancedCache.dispose(),this._cancelProgressiveWarmupJobs(),this._batchProcessor&&this._batchProcessor.dispose(),this._accessibility&&typeof this._accessibility.dispose=="function"&&this._accessibility.dispose(),this._decorationCache.clear(),this._gitCache.clear(),this._onDidChangeFileDecorations.dispose(),this._fileWatcher&&this._fileWatcher.dispose(),this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null)}};d(je,"FileDateDecorationProvider");var Ue=je;Pt.exports={FileDateDecorationProvider:Ue}});var zt=S((exports,module)=>{var vscode=require("vscode"),{fileSystem}=U(),{getFileName,getRelativePath}=B(),isWeb=!0,childProcess=null;function loadChildProcess(){return!childProcess&&!isWeb&&(childProcess=eval("require")("child_process")),childProcess}d(loadChildProcess,"loadChildProcess");function registerCoreCommands({context:a,fileDateProvider:e,logger:t,l10n:o}){let i=[];i.push(vscode.commands.registerCommand("explorerDates.refreshDateDecorations",()=>{try{if(e){e.clearAllCaches(),e.refreshAll();let s=o?.getString("refreshSuccess")||"Date decorations refreshed - all caches cleared";vscode.window.showInformationMessage(s),t.info("Date decorations refreshed manually with cache clear")}}catch(s){t.error("Failed to refresh decorations",s),vscode.window.showErrorMessage(`Failed to refresh decorations: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.previewConfiguration",s=>{try{e&&(e.applyPreviewSettings(s),t.info("Configuration preview applied",s))}catch(r){t.error("Failed to apply configuration preview",r)}})),i.push(vscode.commands.registerCommand("explorerDates.clearPreview",()=>{try{e&&(e.applyPreviewSettings(null),t.info("Configuration preview cleared"))}catch(s){t.error("Failed to clear configuration preview",s)}})),i.push(vscode.commands.registerCommand("explorerDates.showMetrics",()=>{try{if(e){let s=e.getMetrics(),r=`Explorer Dates Metrics:
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
Average Batch Time: ${s.batchProcessor.averageBatchTime.toFixed(2)}ms`),vscode.window.showInformationMessage(r,{modal:!0}),t.info("Metrics displayed",s)}}catch(s){t.error("Failed to show metrics",s),vscode.window.showErrorMessage(`Failed to show metrics: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.openLogs",()=>{try{t.show()}catch(s){t.error("Failed to open logs",s),vscode.window.showErrorMessage(`Failed to open logs: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.showCurrentConfig",()=>{try{let s=vscode.workspace.getConfiguration("explorerDates"),r={highContrastMode:s.get("highContrastMode"),badgePriority:s.get("badgePriority"),colorScheme:s.get("colorScheme"),accessibilityMode:s.get("accessibilityMode"),dateDecorationFormat:s.get("dateDecorationFormat"),showGitInfo:s.get("showGitInfo"),showFileSize:s.get("showFileSize")},n=`Current Explorer Dates Configuration:

${Object.entries(r).map(([l,c])=>`${l}: ${JSON.stringify(c)}`).join(`
`)}`;vscode.window.showInformationMessage(n,{modal:!0}),t.info("Current configuration displayed",r)}catch(s){t.error("Failed to show configuration",s)}})),i.push(vscode.commands.registerCommand("explorerDates.resetToDefaults",async()=>{try{let s=vscode.workspace.getConfiguration("explorerDates");await s.update("highContrastMode",!1,vscode.ConfigurationTarget.Global),await s.update("badgePriority","time",vscode.ConfigurationTarget.Global),await s.update("accessibilityMode",!1,vscode.ConfigurationTarget.Global),vscode.window.showInformationMessage("Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately."),t.info("Reset problematic settings to defaults"),e&&(e.clearAllCaches(),e.refreshAll())}catch(s){t.error("Failed to reset settings",s),vscode.window.showErrorMessage(`Failed to reset settings: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.toggleDecorations",()=>{try{let s=vscode.workspace.getConfiguration("explorerDates"),r=s.get("showDateDecorations",!0);s.update("showDateDecorations",!r,vscode.ConfigurationTarget.Global);let n=r?o?.getString("decorationsDisabled")||"Date decorations disabled":o?.getString("decorationsEnabled")||"Date decorations enabled";vscode.window.showInformationMessage(n),t.info(`Date decorations toggled to: ${!r}`)}catch(s){t.error("Failed to toggle decorations",s),vscode.window.showErrorMessage(`Failed to toggle decorations: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.copyFileDate",async s=>{try{let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=await fileSystem.stat(r),l=(n.mtime instanceof Date?n.mtime:new Date(n.mtime)).toLocaleString();await vscode.env.clipboard.writeText(l),vscode.window.showInformationMessage(`Copied to clipboard: ${l}`),t.info(`File date copied for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to copy file date",r),vscode.window.showErrorMessage(`Failed to copy file date: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.showFileDetails",async s=>{try{let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=await fileSystem.stat(r),l=getFileName(r.fsPath||r.path),c=e?._formatFileSize(n.size,"auto")||`${n.size} bytes`,h=(n.mtime instanceof Date?n.mtime:new Date(n.mtime)).toLocaleString(),u=(n.birthtime instanceof Date?n.birthtime:new Date(n.birthtime||n.mtime)).toLocaleString(),w=`File: ${l}
Size: ${c}
Modified: ${h}
Created: ${u}
Path: ${r.fsPath||r.path}`;vscode.window.showInformationMessage(w,{modal:!0}),t.info(`File details shown for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to show file details",r),vscode.window.showErrorMessage(`Failed to show file details: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.toggleFadeOldFiles",()=>{try{let s=vscode.workspace.getConfiguration("explorerDates"),r=s.get("fadeOldFiles",!1);s.update("fadeOldFiles",!r,vscode.ConfigurationTarget.Global);let n=r?"Fade old files disabled":"Fade old files enabled";vscode.window.showInformationMessage(n),t.info(`Fade old files toggled to: ${!r}`)}catch(s){t.error("Failed to toggle fade old files",s),vscode.window.showErrorMessage(`Failed to toggle fade old files: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.showFileHistory",async s=>{try{if(isWeb){vscode.window.showInformationMessage("Git history is unavailable on VS Code for Web.");return}let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=vscode.workspace.getWorkspaceFolder(r);if(!n){vscode.window.showWarningMessage("File is not in a workspace");return}let c=`git log --oneline -10 -- "${getRelativePath(n.uri.fsPath||n.uri.path,r.fsPath||r.path)}"`;loadChildProcess().exec(c,{cwd:n.uri.fsPath,timeout:3e3},(u,w)=>{if(u){u.message.includes("not a git repository")?vscode.window.showWarningMessage("This file is not in a Git repository"):vscode.window.showErrorMessage(`Git error: ${u.message}`);return}if(!w.trim()){vscode.window.showInformationMessage("No Git history found for this file");return}let p=w.trim(),v=getFileName(r.fsPath||r.path);vscode.window.showInformationMessage(`Recent commits for ${v}:

${p}`,{modal:!0})}),t.info(`File history requested for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to show file history",r),vscode.window.showErrorMessage(`Failed to show file history: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.compareWithPrevious",async s=>{try{if(isWeb){vscode.window.showInformationMessage("Git comparisons are unavailable on VS Code for Web.");return}let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}if(!vscode.workspace.getWorkspaceFolder(r)){vscode.window.showWarningMessage("File is not in a workspace");return}await vscode.commands.executeCommand("git.openChange",r),t.info(`Git diff opened for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to compare with previous version",r),vscode.window.showErrorMessage(`Failed to compare with previous version: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.applyCustomColors",async()=>{try{let r=vscode.workspace.getConfiguration("explorerDates").get("customColors",{veryRecent:"#00ff00",recent:"#ffff00",old:"#ff0000"}),n=`To use custom colors with Explorer Dates, add the following to your settings.json:

"workbench.colorCustomizations": {
  "explorerDates.customColor.veryRecent": "${r.veryRecent}",
  "explorerDates.customColor.recent": "${r.recent}",
  "explorerDates.customColor.old": "${r.old}"
}

Also set: "explorerDates.colorScheme": "custom"`,l=await vscode.window.showInformationMessage("Custom colors configuration",{modal:!0,detail:n},"Copy to Clipboard","Open Settings");if(l==="Copy to Clipboard"){let c=`"workbench.colorCustomizations": {
  "explorerDates.customColor.veryRecent": "${r.veryRecent}",
  "explorerDates.customColor.recent": "${r.recent}",
  "explorerDates.customColor.old": "${r.old}"
}`;await vscode.env.clipboard.writeText(c),vscode.window.showInformationMessage("Custom color configuration copied to clipboard")}else l==="Open Settings"&&await vscode.commands.executeCommand("workbench.action.openSettings","workbench.colorCustomizations");t.info("Custom colors help displayed")}catch(s){t.error("Failed to apply custom colors",s),vscode.window.showErrorMessage(`Failed to apply custom colors: ${s.message}`)}})),i.forEach(s=>a.subscriptions.push(s))}d(registerCoreCommands,"registerCoreCommands");module.exports={registerCoreCommands}});var Rt=S((ss,Wt)=>{var k=require("vscode"),{getLogger:Zo}=A(),He=class He{constructor(e){this._logger=Zo(),this._provider=e,this._testResults=[]}async runComprehensiveDiagnostics(){this._logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let e={timestamp:new Date().toISOString(),vscodeVersion:k.version,extensionVersion:k.extensions.getExtension("incredincomp.explorer-dates")?.packageJSON?.version,tests:{}};return e.tests.vscodeSettings=await this._testVSCodeSettings(),e.tests.providerRegistration=await this._testProviderRegistration(),e.tests.fileProcessing=await this._testFileProcessing(),e.tests.decorationCreation=await this._testDecorationCreation(),e.tests.cacheAnalysis=await this._testCacheAnalysis(),e.tests.extensionConflicts=await this._testExtensionConflicts(),e.tests.uriPathIssues=await this._testURIPathIssues(),this._logger.info("\u{1F50D} Comprehensive diagnostics completed",e),e}async _testVSCodeSettings(){let e=k.workspace.getConfiguration("explorer"),t=k.workspace.getConfiguration("workbench"),o=k.workspace.getConfiguration("explorerDates"),i={"explorer.decorations.badges":e.get("decorations.badges"),"explorer.decorations.colors":e.get("decorations.colors"),"workbench.colorTheme":t.get("colorTheme"),"explorerDates.showDateDecorations":o.get("showDateDecorations"),"explorerDates.colorScheme":o.get("colorScheme"),"explorerDates.showGitInfo":o.get("showGitInfo")},s=[];return i["explorer.decorations.badges"]===!1&&s.push("CRITICAL: explorer.decorations.badges is disabled"),i["explorer.decorations.colors"]===!1&&s.push("WARNING: explorer.decorations.colors is disabled"),i["explorerDates.showDateDecorations"]===!1&&s.push("CRITICAL: explorerDates.showDateDecorations is disabled"),{status:s.length>0?"ISSUES_FOUND":"OK",settings:i,issues:s}}async _testProviderRegistration(){let e=[];if(!this._provider)return e.push("CRITICAL: Decoration provider is null/undefined"),{status:"FAILED",issues:e};typeof this._provider.provideFileDecoration!="function"&&e.push("CRITICAL: provideFileDecoration method missing"),this._provider.onDidChangeFileDecorations||e.push("WARNING: onDidChangeFileDecorations event emitter missing");let t=k.Uri.file("/test/path");try{let o=await this._provider.provideFileDecoration(t);this._logger.debug("Provider test call completed",{result:!!o})}catch(o){e.push(`ERROR: Provider test call failed: ${o.message}`)}return{status:e.length>0?"ISSUES_FOUND":"OK",providerActive:!!this._provider,issues:e}}async _testFileProcessing(){let e=k.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace folders available"]};let t=[],o=[];try{let i=["package.json","README.md","extension.js","src/logger.js"];for(let s of i){let r=k.Uri.joinPath(e[0].uri,s);try{await k.workspace.fs.stat(r);let n=this._provider._isExcludedSimple?await this._provider._isExcludedSimple(r):!1,l=await this._provider.provideFileDecoration(r);t.push({file:s,exists:!0,excluded:n,hasDecoration:!!l,badge:l?.badge,uri:r.toString()})}catch(n){t.push({file:s,exists:!1,error:n.message})}}}catch(i){o.push(`File processing test failed: ${i.message}`)}return{status:o.length>0?"ISSUES_FOUND":"OK",testFiles:t,issues:o}}async _testDecorationCreation(){let e=[],t=[];try{let i=new k.FileDecoration("test");e.push({name:"Simple decoration",success:!0,badge:i.badge})}catch(i){e.push({name:"Simple decoration",success:!1,error:i.message}),t.push("CRITICAL: Cannot create simple FileDecoration")}try{let i=new k.FileDecoration("test","Test tooltip");e.push({name:"Decoration with tooltip",success:!0,hasTooltip:!!(i&&i.tooltip)})}catch(i){e.push({name:"Decoration with tooltip",success:!1,error:i.message}),t.push("WARNING: Cannot create FileDecoration with tooltip")}try{let i=new k.FileDecoration("test","Test tooltip",new k.ThemeColor("charts.red"));e.push({name:"Decoration with color",success:!0,hasColor:!!i.color})}catch(i){e.push({name:"Decoration with color",success:!1,error:i.message}),t.push("WARNING: Cannot create FileDecoration with color")}let o=["1d","10m","2h","!!","\u25CF\u25CF","JA12","123456789"];for(let i of o)try{let s=new k.FileDecoration(i);e.push({name:`Badge format: ${i}`,success:!0,badge:s.badge,length:i.length})}catch(s){e.push({name:`Badge format: ${i}`,success:!1,error:s.message}),i.length<=8&&t.push(`WARNING: Valid badge format '${i}' failed`)}return{status:t.length>0?"ISSUES_FOUND":"OK",tests:e,issues:t}}async _testCacheAnalysis(){let e={memoryCache:{size:this._provider._decorationCache?.size||0,maxSize:this._provider._maxCacheSize||0},advancedCache:{available:!!this._provider._advancedCache,initialized:!1},metrics:this._provider.getMetrics?this._provider.getMetrics():null},t=[];return e.memoryCache.size>e.memoryCache.maxSize*.9&&t.push("WARNING: Memory cache is nearly full"),e.metrics&&e.metrics.cacheHits===0&&e.metrics.cacheMisses>10&&t.push("WARNING: Cache hit rate is 0% - potential cache key issues"),{status:t.length>0?"ISSUES_FOUND":"OK",cacheInfo:e,issues:t}}async _testExtensionConflicts(){let e=k.extensions.all,t=[],o=[];for(let s of e){if(!s.isActive)continue;let r=s.packageJSON;r.contributes?.commands?.some(l=>l.command?.includes("decoration")||l.title?.includes("decoration")||l.title?.includes("badge")||l.title?.includes("explorer"))&&o.push({id:s.id,name:r.displayName||r.name,version:r.version}),["file-icons","vscode-icons","material-icon-theme","explorer-exclude","hide-files","file-watcher"].some(l=>s.id.includes(l))&&t.push({id:s.id,name:r.displayName||r.name,reason:"Known to potentially interfere with file decorations"})}let i=[];return o.length>1&&i.push(`WARNING: ${o.length} extensions might provide file decorations`),t.length>0&&i.push(`WARNING: ${t.length} potentially conflicting extensions detected`),{status:i.length>0?"ISSUES_FOUND":"OK",decorationExtensions:o,potentialConflicts:t,issues:i}}async _testURIPathIssues(){let e=k.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace available for URI testing"]};let t=[],o=[],i=["package.json","src/logger.js","README.md",".gitignore"];for(let s of i){let r=k.Uri.joinPath(e[0].uri,s);t.push({path:s,scheme:r.scheme,fsPath:r.fsPath,authority:r.authority,valid:r.scheme==="file"&&r.fsPath.length>0}),r.scheme!=="file"&&o.push(`WARNING: Non-file URI scheme for ${s}: ${r.scheme}`),(r.fsPath.includes("\\\\")||r.fsPath.includes("//"))&&o.push(`WARNING: Potential path separator issues in ${s}`)}return{status:o.length>0?"ISSUES_FOUND":"OK",tests:t,issues:o}}};d(He,"DecorationDiagnostics");var Ge=He;Wt.exports={DecorationDiagnostics:Ge}});var Nt=S((as,Lt)=>{var Y=require("vscode"),{getFileName:Xo}=B();async function ei(){let a=A().getLogger();a.info("\u{1F3A8} Testing VS Code decoration rendering...");let i=class i{constructor(){this._onDidChangeFileDecorations=new Y.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event}provideFileDecoration(r){let n=Xo(r.fsPath||r.path),l=new Y.FileDecoration("TEST");return l.tooltip=`Test decoration for ${n}`,l.color=new Y.ThemeColor("charts.red"),a.info(`\u{1F9EA} Test provider returning decoration for: ${n}`),l}};d(i,"TestDecorationProvider");let e=i,t=new e,o=Y.window.registerFileDecorationProvider(t);return a.info("\u{1F9EA} Test decoration provider registered"),setTimeout(()=>{t._onDidChangeFileDecorations.fire(void 0),a.info("\u{1F504} Test decoration refresh triggered"),setTimeout(()=>{o.dispose(),a.info("\u{1F9EA} Test decoration provider disposed")},1e4)},1e3),"Test decoration provider registered for 10 seconds"}d(ei,"testVSCodeDecorationRendering");async function ti(){let a=A().getLogger();a.info("\u{1F527} Testing FileDecoration API...");let e=[];try{let o=new Y.FileDecoration("MIN");e.push({name:"Minimal decoration",success:!0,badge:o.badge}),a.info("\u2705 Minimal decoration created successfully")}catch(o){e.push({name:"Minimal decoration",success:!1,error:o.message}),a.error("\u274C Minimal decoration failed:",o)}try{let o=new Y.FileDecoration("FULL","Full decoration tooltip",new Y.ThemeColor("charts.blue"));o.propagate=!1,e.push({name:"Full decoration",success:!0,badge:o.badge,hasTooltip:!!o.tooltip,hasColor:!!o.color,propagate:o.propagate}),a.info("\u2705 Full decoration created successfully")}catch(o){e.push({name:"Full decoration",success:!1,error:o.message}),a.error("\u274C Full decoration failed:",o)}let t=["charts.red","charts.blue","charts.green","charts.yellow","terminal.ansiRed","terminal.ansiGreen","terminal.ansiBlue","editorError.foreground","editorWarning.foreground","editorInfo.foreground"];for(let o of t)try{e.push({name:`ThemeColor: ${o}`,success:!0,colorId:o})}catch(i){e.push({name:`ThemeColor: ${o}`,success:!1,error:i.message}),a.error(`\u274C ThemeColor ${o} failed:`,i)}return e}d(ti,"testFileDecorationAPI");Lt.exports={testVSCodeDecorationRendering:ei,testFileDecorationAPI:ti}});var Ot=S((cs,Bt)=>{var f=require("vscode"),{fileSystem:oi}=U(),{getFileName:ii,getRelativePath:si}=B();function ri({context:a,fileDateProvider:e,logger:t,generators:o}){let{generateWorkspaceActivityHTML:i,generatePerformanceAnalyticsHTML:s,generateDiagnosticsHTML:r,generateDiagnosticsWebview:n}=o,l=[];l.push(f.commands.registerCommand("explorerDates.showWorkspaceActivity",async()=>{try{let c=f.window.createWebviewPanel("workspaceActivity","Workspace File Activity",f.ViewColumn.One,{enableScripts:!0});if(!f.workspace.workspaceFolders){f.window.showWarningMessage("No workspace folder open");return}let h=f.workspace.workspaceFolders[0],u=[],w=await f.workspace.findFiles("**/*","**/node_modules/**",100);for(let p of w)try{let v=await oi.stat(p);(typeof v.isFile!="function"||v.isFile())&&u.push({path:si(h.uri.fsPath||h.uri.path,p.fsPath||p.path),modified:v.mtime instanceof Date?v.mtime:new Date(v.mtime),size:v.size})}catch{}u.sort((p,v)=>v.modified.getTime()-p.modified.getTime()),c.webview.html=i(u.slice(0,50)),t.info("Workspace activity panel opened")}catch(c){t.error("Failed to show workspace activity",c),f.window.showErrorMessage(`Failed to show workspace activity: ${c.message}`)}})),l.push(f.commands.registerCommand("explorerDates.showPerformanceAnalytics",async()=>{try{let c=f.window.createWebviewPanel("performanceAnalytics","Explorer Dates Performance Analytics",f.ViewColumn.One,{enableScripts:!0}),h=e?e.getMetrics():{};c.webview.html=s(h),t.info("Performance analytics panel opened")}catch(c){t.error("Failed to show performance analytics",c),f.window.showErrorMessage(`Failed to show performance analytics: ${c.message}`)}})),l.push(f.commands.registerCommand("explorerDates.debugCache",async()=>{try{if(e){let c=e.getMetrics(),h={"Cache Summary":{"Memory Cache Size":c.cacheSize,"Cache Hit Rate":c.cacheHitRate,"Total Hits":c.cacheHits,"Total Misses":c.cacheMisses,"Cache Timeout":`${c.cacheDebugging.cacheTimeout}ms`},"Advanced Cache":c.advancedCache||"Not available","Sample Cache Keys":c.cacheDebugging.memoryCacheKeys||[]};f.window.showInformationMessage(`Cache Debug Info:
${JSON.stringify(h,null,2)}`,{modal:!0}),t.info("Cache debug info displayed",h)}}catch(c){t.error("Failed to show cache debug info",c),f.window.showErrorMessage(`Failed to show cache debug info: ${c.message}`)}})),l.push(f.commands.registerCommand("explorerDates.runDiagnostics",async()=>{try{let c=f.workspace.getConfiguration("explorerDates"),h=f.window.activeTextEditor,u={"Extension Status":{"Provider Active":e?"Yes":"No","Decorations Enabled":c.get("showDateDecorations",!0)?"Yes":"No","VS Code Version":f.version,"Extension Version":a.extension.packageJSON.version}};if(h){let{uri:p}=h.document;p.scheme==="file"&&(u["Current File"]={"File Path":p.fsPath,"File Extension":ii(p.fsPath||p.path).split(".").pop()||"No extension","Is Excluded":e?await e._isExcludedSimple(p):"Unknown"})}if(u.Configuration={"Excluded Folders":c.get("excludedFolders",[]),"Excluded Patterns":c.get("excludedPatterns",[]),"Color Scheme":c.get("colorScheme","none"),"Cache Timeout":`${c.get("cacheTimeout",3e4)}ms`},e){let p=e.getMetrics();u.Performance={"Total Decorations":p.totalDecorations,"Cache Size":p.cacheSize,"Cache Hit Rate":p.cacheHitRate,Errors:p.errors},p.performanceTiming&&(u["Performance Timing"]={"Avg Git Blame (ms)":p.performanceTiming.avgGitBlameMs,"Avg File Stat (ms)":p.performanceTiming.avgFileStatMs,"Git Calls":p.performanceTiming.gitBlameCalls,"File Stat Calls":p.performanceTiming.fileStatCalls,"Total Git Time (ms)":p.performanceTiming.totalGitBlameTimeMs,"Total File Stat Time (ms)":p.performanceTiming.totalFileStatTimeMs})}let w=f.window.createWebviewPanel("explorerDatesDiagnostics","Explorer Dates Diagnostics",f.ViewColumn.One,{enableScripts:!0});w.webview.html=r(u),t.info("Diagnostics panel opened",u)}catch(c){t.error("Failed to run diagnostics",c),f.window.showErrorMessage(`Failed to run diagnostics: ${c.message}`)}})),l.push(f.commands.registerCommand("explorerDates.testDecorations",async()=>{try{t.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let{DecorationDiagnostics:c}=Rt(),u=await new c(e).runComprehensiveDiagnostics(),w=f.window.createWebviewPanel("decorationDiagnostics","Decoration Diagnostics - Root Cause Analysis",f.ViewColumn.One,{enableScripts:!0});w.webview.html=n(u);let p=[],v=[];Object.values(u.tests).forEach(R=>{R.issues&&R.issues.forEach(V=>{V.startsWith("CRITICAL:")?p.push(V):V.startsWith("WARNING:")&&v.push(V)})}),p.length>0?f.window.showErrorMessage(`CRITICAL ISSUES FOUND: ${p.join(", ")}`):v.length>0?f.window.showWarningMessage(`Warnings found: ${v.length} potential issues detected. Check diagnostics panel.`):f.window.showInformationMessage("No critical issues found. Decorations should be working properly."),t.info("\u{1F50D} Comprehensive diagnostics completed",u)}catch(c){t.error("Failed to run comprehensive diagnostics",c),f.window.showErrorMessage(`Diagnostics failed: ${c.message}`)}})),l.push(f.commands.registerCommand("explorerDates.monitorDecorations",async()=>{if(!e){f.window.showErrorMessage("Decoration provider not available");return}e.startProviderCallMonitoring(),e.forceRefreshAllDecorations(),setTimeout(()=>{let c=e.getProviderCallStats(),h=`VS Code Decoration Requests: ${c.totalCalls} calls for ${c.uniqueFiles} files`;f.window.showInformationMessage(h),t.info("\u{1F50D} Decoration monitoring results:",c)},5e3),f.window.showInformationMessage("Started monitoring VS Code decoration requests. Results in 5 seconds...")})),l.push(f.commands.registerCommand("explorerDates.testVSCodeRendering",async()=>{try{let{testVSCodeDecorationRendering:c,testFileDecorationAPI:h}=Nt();t.info("\u{1F3A8} Testing VS Code decoration rendering system...");let u=await h();t.info("\u{1F527} FileDecoration API tests:",u);let w=await c();t.info("\u{1F3A8} Decoration rendering test:",w),f.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.')}catch(c){t.error("Failed to test VS Code rendering:",c),f.window.showErrorMessage(`VS Code rendering test failed: ${c.message}`)}})),l.push(f.commands.registerCommand("explorerDates.quickFix",async()=>{try{let c=f.workspace.getConfiguration("explorerDates"),h=[];c.get("showDateDecorations",!0)||h.push({issue:"Date decorations are disabled",description:"Enable date decorations",fix:d(async()=>c.update("showDateDecorations",!0,f.ConfigurationTarget.Global),"fix")});let u=c.get("excludedPatterns",[]);if(u.includes("**/*")&&h.push({issue:"All files are excluded by pattern",description:"Remove overly broad exclusion pattern",fix:d(async()=>{let p=u.filter(v=>v!=="**/*");await c.update("excludedPatterns",p,f.ConfigurationTarget.Global)},"fix")}),h.length===0){f.window.showInformationMessage("No common issues detected. Decorations should be working.");return}let w=await f.window.showQuickPick(h.map(p=>({label:p.description,description:p.issue,fix:p.fix})),{placeHolder:"Select an issue to fix automatically"});w&&(await w.fix(),f.window.showInformationMessage("Fixed! Try refreshing decorations now."),e&&(e.clearAllCaches(),e.refreshAll()))}catch(c){t.error("Failed to run quick fix",c),f.window.showErrorMessage(`Failed to run quick fix: ${c.message}`)}})),l.push(f.commands.registerCommand("explorerDates.showKeyboardShortcuts",async()=>{try{e?._accessibility?await e._accessibility.showKeyboardShortcutsHelp():f.window.showInformationMessage("Keyboard shortcuts: Ctrl+Shift+D (toggle), Ctrl+Shift+C (copy date), Ctrl+Shift+I (file details), Ctrl+Shift+R (refresh), Ctrl+Shift+A (workspace activity)"),t.info("Keyboard shortcuts help shown")}catch(c){t.error("Failed to show keyboard shortcuts help",c),f.window.showErrorMessage(`Failed to show keyboard shortcuts help: ${c.message}`)}})),l.forEach(c=>a.subscriptions.push(c))}d(ri,"registerAnalysisCommands");Bt.exports={registerAnalysisCommands:ri}});var jt=S((ds,Ut)=>{var ee=require("vscode");function ai({context:a,logger:e,getOnboardingManager:t}){let o=[];o.push(ee.commands.registerCommand("explorerDates.showFeatureTour",async()=>{try{await t().showFeatureTour(),e.info("Feature tour opened")}catch(i){e.error("Failed to show feature tour",i),ee.window.showErrorMessage(`Failed to show feature tour: ${i.message}`)}})),o.push(ee.commands.registerCommand("explorerDates.showQuickSetup",async()=>{try{await t().showQuickSetupWizard(),e.info("Quick setup wizard opened")}catch(i){e.error("Failed to show quick setup wizard",i),ee.window.showErrorMessage(`Failed to show quick setup wizard: ${i.message}`)}})),o.push(ee.commands.registerCommand("explorerDates.showWhatsNew",async()=>{try{let i=a.extension.packageJSON.version;await t().showWhatsNew(i),e.info("What's new panel opened")}catch(i){e.error("Failed to show what's new",i),ee.window.showErrorMessage(`Failed to show what's new: ${i.message}`)}})),o.forEach(i=>a.subscriptions.push(i))}d(ai,"registerOnboardingCommands");Ut.exports={registerOnboardingCommands:ai}});var Ht=S((us,Gt)=>{var _=require("vscode"),{getLogger:ni}=A(),{getLocalization:ci}=ie(),Ve=class Ve{constructor(e){this._context=e,this._logger=ni(),this._l10n=ci(),this._hasShownWelcome=e.globalState.get("explorerDates.hasShownWelcome",!1),this._hasCompletedSetup=e.globalState.get("explorerDates.hasCompletedSetup",!1),this._onboardingVersion=e.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this._hasShownWelcome,hasCompletedSetup:this._hasCompletedSetup,onboardingVersion:this._onboardingVersion})}async shouldShowOnboarding(){let e=this._context.extension.packageJSON.version;return!this._hasShownWelcome||!this._hasCompletedSetup||this._shouldShowVersionUpdate(e)}_shouldShowVersionUpdate(e){if(this._onboardingVersion==="0.0.0")return!0;let[t]=e.split(".").map(Number),[o]=this._onboardingVersion.split(".").map(Number);return t>o}_isMinorUpdate(e){if(this._onboardingVersion==="0.0.0")return!1;let[t,o]=e.split(".").map(Number),[i,s]=this._onboardingVersion.split(".").map(Number);return t===i&&o>s}async showWelcomeMessage(){try{let e=this._context.extension.packageJSON.version,t=this._hasShownWelcome,o=this._isMinorUpdate(e);if(o)return this._showGentleUpdateNotification(e);let i=t?`Explorer Dates has been updated to v${e} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!",s=t?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"],r=await _.window.showInformationMessage(i,{modal:!1},...s);switch(await this._context.globalState.update("explorerDates.hasShownWelcome",!0),await this._context.globalState.update("explorerDates.onboardingVersion",e),r){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(e);break;case"\u2699\uFE0F Settings":await _.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await _.commands.executeCommand("explorerDates.previewConfiguration",i.settings);break;case"clearPreview":await _.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action:r,isUpdate:t,isMinorUpdate:o})}catch(e){this._logger.error("Failed to show welcome message",e)}}async _showGentleUpdateNotification(e){let t=_.window.createStatusBarItem(_.StatusBarAlignment.Right,100);t.text=`$(check) Explorer Dates updated to v${e}`,t.tooltip="Click to see what's new in Explorer Dates",t.command="explorerDates.showWhatsNew",t.show(),setTimeout(()=>{t.dispose()},1e4),await this._context.globalState.update("explorerDates.onboardingVersion",e),this._logger.info("Showed gentle update notification",{version:e})}async showQuickSetupWizard(){try{let e=_.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",_.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateSetupWizardHTML(),e.webview.onDidReceiveMessage(async t=>{await this._handleSetupWizardMessage(t,e)}),this._logger.info("Quick setup wizard opened")}catch(e){this._logger.error("Failed to show setup wizard",e)}}async _handleSetupWizardMessage(e,t){try{switch(e.command){case"applyConfiguration":await this._applyQuickConfiguration(e.configuration),await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),_.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&(await _.commands.executeCommand("explorerDates.previewConfiguration",e.settings),this._logger.info("Configuration preview applied via webview",e.settings));break;case"clearPreview":await _.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await _.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(o){this._logger.error("Failed to handle setup wizard message",o)}}async _applyQuickConfiguration(e){let t=_.workspace.getConfiguration("explorerDates");if(e.preset){let i=this._getConfigurationPresets()[e.preset];if(i){this._logger.info(`Applying preset: ${e.preset}`,i.settings);for(let[s,r]of Object.entries(i.settings))await t.update(s,r,_.ConfigurationTarget.Global),this._logger.debug(`Updated setting: explorerDates.${s} = ${r}`);this._logger.info(`Applied preset: ${e.preset}`,i.settings),_.window.showInformationMessage(`Applied "${i.name}" configuration. Changes should be visible immediately!`)}}if(e.individual){for(let[o,i]of Object.entries(e.individual))await t.update(o,i,_.ConfigurationTarget.Global);this._logger.info("Applied individual settings",e.individual)}try{await _.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(o){this._logger.warn("Failed to refresh decorations after configuration change",o)}}_getConfigurationPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:30,enableContextMenu:!0,showStatusBar:!0}},powerUser:{name:"Power User",description:"Maximum information - all features enabled with vibrant colors",settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"both",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:14,enableContextMenu:!0,showStatusBar:!0,smartExclusions:!0,progressiveLoading:!0,persistentCache:!0}},gitFocused:{name:"Git-Focused",description:"Show author initials as badges with full Git information in tooltips",settings:{dateDecorationFormat:"smart",colorScheme:"file-type",highContrastMode:!1,showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}async showFeatureTour(){try{let e=_.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",_.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateFeatureTourHTML(),e.webview.onDidReceiveMessage(async t=>{t.command==="openSettings"?await _.commands.executeCommand("workbench.action.openSettings",t.setting||"explorerDates"):t.command==="runCommand"&&await _.commands.executeCommand(t.commandId)}),this._logger.info("Feature tour opened")}catch(e){this._logger.error("Failed to show feature tour",e)}}_generateSetupWizardHTML(){let e=this._getConfigurationPresets(),t={minimal:e.minimal,developer:e.developer,accessible:e.accessible};return`
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
${t.description}`;await _.window.showInformationMessage(o,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(e){try{let t=_.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${e} - What's New`,_.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1});t.webview.html=this._generateWhatsNewHTML(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"openSettings":await _.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break;case"tryFeature":o.feature==="badgePriority"&&(await _.workspace.getConfiguration("explorerDates").update("badgePriority","author",_.ConfigurationTarget.Global),_.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":t.dispose();break}})}catch(t){this._logger.error("Failed to show what's new",t)}}_generateWhatsNewHTML(e){return`
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
        `}};d(Ve,"OnboardingManager");var qe=Ve;Gt.exports={OnboardingManager:qe}});var Vt=S((ps,qt)=>{var C=require("vscode"),{getLogger:li}=A(),{fileSystem:di}=U(),{GLOBAL_STATE_KEYS:hi}=se(),M=li(),Je=class Je{constructor(e){this._context=e,this._storage=e?.globalState||null,this._storageKey=hi.TEMPLATE_STORE,this._fs=di,this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),M.info("Workspace Templates Manager initialized")}_getStoredTemplates(){return this._storage?this._storage.get(this._storageKey,{}):{}}async _saveStoredTemplates(e){if(!this._storage)throw new Error("Template storage unavailable");await this._storage.update(this._storageKey,e)}_getTemplate(e){return this.builtInTemplates[e]?this.builtInTemplates[e]:this._getStoredTemplates()[e]}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"file-type","explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludedPatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"],"explorerDates.enableContextMenu":!0,"explorerDates.showGitInfo":"author"}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"absolute-long","explorerDates.colorScheme":"none","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"none","explorerDates.highContrastMode":!1,"explorerDates.excludedPatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"],"explorerDates.badgePriority":"size"}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"subtle","explorerDates.showFileSize":!1,"explorerDates.excludedPatterns":["**/node_modules/**","**/.git/**"],"explorerDates.fadeOldFiles":!1,"explorerDates.enableContextMenu":!1}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"recency","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"author","explorerDates.enableContextMenu":!0,"explorerDates.showStatusBar":!0,"explorerDates.smartExclusions":!0,"explorerDates.progressiveLoading":!0,"explorerDates.persistentCache":!0,"explorerDates.enableReporting":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"none","explorerDates.showFileSize":!1,"explorerDates.badgePriority":"time","explorerDates.enableContextMenu":!1,"explorerDates.progressiveLoading":!1}}}}async saveCurrentConfiguration(e,t=""){try{let o=C.workspace.getConfiguration("explorerDates"),i={},s=o.inspect();if(s)for(let[h,u]of Object.entries(s))u&&typeof u=="object"&&"workspaceValue"in u?i[`explorerDates.${h}`]=u.workspaceValue:u&&typeof u=="object"&&"globalValue"in u&&(i[`explorerDates.${h}`]=u.globalValue);let r={name:e,description:t,createdAt:new Date().toISOString(),version:"1.0.0",settings:i},n=e.toLowerCase().replace(/[^a-z0-9-]/g,"-"),l=this._getStoredTemplates();l[n]=r,await this._saveStoredTemplates(l);let c=o.get("templateSyncPath","");if(c&&!this._fs.isWeb)try{let h=`${c.replace(/[/\\]?$/,"")}/${n}.json`;await this._fs.writeFile(h,JSON.stringify(r,null,2)),M.info(`Synced template to ${h}`)}catch(h){M.warn("Failed to sync template to disk path",h)}return C.window.showInformationMessage(`Template "${e}" saved successfully!`),M.info(`Saved workspace template: ${e}`),!0}catch(o){return M.error("Failed to save template:",o),C.window.showErrorMessage(`Failed to save template: ${o.message}`),!1}}async loadTemplate(e){try{let t=this._getTemplate(e);if(!t)throw new Error(`Template "${e}" not found`);let o=C.workspace.getConfiguration();for(let[i,s]of Object.entries(t.settings))await o.update(i,s,C.ConfigurationTarget.Workspace);return C.window.showInformationMessage(`Template "${t.name}" applied successfully!`),M.info(`Applied workspace template: ${t.name}`),!0}catch(t){return M.error("Failed to load template:",t),C.window.showErrorMessage(`Failed to load template: ${t.message}`),!1}}async getAvailableTemplates(){let e=[];for(let[t,o]of Object.entries(this.builtInTemplates))e.push({id:t,name:o.name,description:o.description,type:"built-in",createdAt:null});try{let t=this._getStoredTemplates();for(let[o,i]of Object.entries(t))e.push({id:o,name:i.name,description:i.description,type:"custom",createdAt:i.createdAt})}catch(t){M.error("Failed to load custom templates:",t)}return e}async deleteTemplate(e){try{if(this.builtInTemplates[e])return C.window.showErrorMessage("Cannot delete built-in templates"),!1;let t=this._getStoredTemplates();if(!t[e])throw new Error(`Template "${e}" not found`);return delete t[e],await this._saveStoredTemplates(t),C.window.showInformationMessage(`Template "${e}" deleted successfully!`),M.info(`Deleted workspace template: ${e}`),!0}catch(t){return M.error("Failed to delete template:",t),C.window.showErrorMessage(`Failed to delete template: ${t.message}`),!1}}async exportTemplate(e,t){try{let o=this._getTemplate(e);if(!o)throw new Error(`Template "${e}" not found`);let i=JSON.stringify(o,null,2);if(this._fs.isWeb){let r=encodeURIComponent(i);return await C.env.openExternal(C.Uri.parse(`data:application/json;charset=utf-8,${r}`)),C.window.showInformationMessage("Template download triggered in browser"),!0}let s=t instanceof C.Uri?t.fsPath:t;return await this._fs.writeFile(s,i),C.window.showInformationMessage(`Template exported to ${s}`),M.info(`Exported template ${e} to ${s}`),!0}catch(o){return M.error("Failed to export template:",o),C.window.showErrorMessage(`Failed to export template: ${o.message}`),!1}}async importTemplate(e){try{let t=e instanceof C.Uri?e:C.Uri.file(e),o=await this._fs.readFile(t,"utf8"),i=JSON.parse(o);if(!i.name||!i.settings)throw new Error("Invalid template format");let s=i.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),r=this._getStoredTemplates();return r[s]=i,await this._saveStoredTemplates(r),C.window.showInformationMessage(`Template "${i.name}" imported successfully!`),M.info(`Imported template: ${i.name}`),!0}catch(t){return M.error("Failed to import template:",t),C.window.showErrorMessage(`Failed to import template: ${t.message}`),!1}}async showTemplateManager(){try{let e=await this.getAvailableTemplates(),t=C.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",C.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});t.webview.html=this.getTemplateManagerHtml(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"loadTemplate":await this.loadTemplate(o.templateId);break;case"deleteTemplate":{await this.deleteTemplate(o.templateId);let i=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:i});break}case"exportTemplate":{let i=await C.window.showSaveDialog({defaultUri:C.Uri.file(`${o.templateId}.json`),filters:{JSON:["json"]}});i&&await this.exportTemplate(o.templateId,i);break}case"saveConfig":{await this.saveCurrentConfiguration(o.name,o.description);let i=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:i});break}case"importTemplate":{let i=await C.window.showOpenDialog({canSelectMany:!1,filters:{JSON:["json"]}});if(i&&i[0]){await this.importTemplate(i[0]);let s=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:s})}break}}}),M.info("Template Manager opened")}catch(e){M.error("Failed to show template manager:",e),C.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(e){return`<!DOCTYPE html>
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
        </html>`}};d(Je,"WorkspaceTemplatesManager");var Ke=Je;qt.exports={WorkspaceTemplatesManager:Ke}});var Jt=S((ms,Kt)=>{var I=require("vscode"),{getLogger:ui}=A(),Ze=class Ze{constructor(){this._listeners=new Map}on(e,t){let o=this._listeners.get(e)||[];return o.push(t),this._listeners.set(e,o),this}off(e,t){let o=this._listeners.get(e);if(!o)return this;let i=o.indexOf(t);return i!==-1&&o.splice(i,1),this}emit(e,...t){let o=this._listeners.get(e);return o&&o.slice().forEach(i=>{try{i(...t)}catch{}}),this}};d(Ze,"BaseEventEmitter");var Qe=Ze,F=ui(),Xe=class Xe extends Qe{constructor(){super(),this.plugins=new Map,this.api=null,this.decorationProviders=new Map,this._configurationWatcher=null,this.initialize(),this._setupConfigurationListener()}initialize(){this.api=this.createPublicApi(),F.info("Extension API Manager initialized")}createPublicApi(){return{getFileDecorations:this.getFileDecorations.bind(this),refreshDecorations:this.refreshDecorations.bind(this),registerPlugin:this.registerPlugin.bind(this),unregisterPlugin:this.unregisterPlugin.bind(this),registerDecorationProvider:this.registerDecorationProvider.bind(this),unregisterDecorationProvider:this.unregisterDecorationProvider.bind(this),onDecorationChanged:this.onDecorationChanged.bind(this),onFileScanned:this.onFileScanned.bind(this),formatDate:this.formatDate.bind(this),getFileStats:this.getFileStats.bind(this),version:"1.1.0",apiVersion:"1.0.0"}}async getFileDecorations(e){if(!this._isApiUsable("getFileDecorations"))return[];try{let t=[];for(let o of e){let i=I.Uri.file(o),s=await this.getDecorationForFile(i);s&&t.push({uri:i.toString(),decoration:s})}return t}catch(t){return F.error("Failed to get file decorations:",t),[]}}async getDecorationForFile(e){if(!this._isApiUsable("getDecorationForFile"))return null;try{let t=await I.workspace.fs.stat(e),o=new Date(t.mtime),i={badge:this.formatDate(o,"smart"),color:void 0,tooltip:`Modified: ${o.toLocaleString()}`};for(let[s,r]of this.decorationProviders)try{let n=await r.provideDecoration(e,t,i);n&&(i={...i,...n})}catch(n){F.error(`Decoration provider ${s} failed:`,n)}return i}catch(t){return F.error("Failed to get decoration for file:",t),null}}async refreshDecorations(e=null){if(!this._isApiUsable("refreshDecorations"))return!1;try{return this.emit("decorationRefreshRequested",e),F.info("Decoration refresh requested"),!0}catch(t){return F.error("Failed to refresh decorations:",t),!1}}registerPlugin(e,t){if(!this._canUsePlugins(`registerPlugin:${e}`))return!1;try{if(!this.validatePlugin(t))throw new Error("Invalid plugin structure");return this.plugins.set(e,{...t,registeredAt:new Date,active:!0}),typeof t.activate=="function"&&t.activate(this.api),this.emit("pluginRegistered",{pluginId:e,plugin:t}),F.info(`Plugin registered: ${e}`),!0}catch(o){return F.error(`Failed to register plugin ${e}:`,o),!1}}unregisterPlugin(e){if(!this._canUsePlugins(`unregisterPlugin:${e}`))return!1;try{let t=this.plugins.get(e);return t?(typeof t.deactivate=="function"&&t.deactivate(),this.plugins.delete(e),this.emit("pluginUnregistered",{pluginId:e}),F.info(`Plugin unregistered: ${e}`),!0):!1}catch(t){return F.error(`Failed to unregister plugin ${e}:`,t),!1}}registerDecorationProvider(e,t){if(!this._canUsePlugins(`registerDecorationProvider:${e}`))return!1;try{if(!this.validateDecorationProvider(t))throw new Error("Invalid decoration provider");return this.decorationProviders.set(e,t),this.emit("decorationProviderRegistered",{providerId:e,provider:t}),F.info(`Decoration provider registered: ${e}`),!0}catch(o){return F.error(`Failed to register decoration provider ${e}:`,o),!1}}unregisterDecorationProvider(e){if(!this._canUsePlugins(`unregisterDecorationProvider:${e}`))return!1;try{let t=this.decorationProviders.delete(e);return t&&(this.emit("decorationProviderUnregistered",{providerId:e}),F.info(`Decoration provider unregistered: ${e}`)),t}catch(t){return F.error(`Failed to unregister decoration provider ${e}:`,t),!1}}onDecorationChanged(e){return this.on("decorationChanged",e),()=>this.off("decorationChanged",e)}onFileScanned(e){return this.on("fileScanned",e),()=>this.off("fileScanned",e)}formatDate(e,t=null){if(!this._isApiUsable("formatDate"))return"";try{let o=I.workspace.getConfiguration("explorerDates"),i=t||o.get("displayFormat","smart"),r=new Date-e,n=Math.floor(r/(1e3*60*60*24));switch(i){case"relative-short":return this.getRelativeTimeShort(r);case"relative-long":return this.getRelativeTimeLong(r);case"absolute-short":return e.toLocaleDateString("en-US",{month:"short",day:"numeric"});case"absolute-long":return e.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});case"smart":default:return n<7?this.getRelativeTimeShort(r):e.toLocaleDateString("en-US",{month:"short",day:"numeric"})}}catch(o){return F.error("Failed to format date:",o),e.toLocaleDateString()}}async getFileStats(e){if(!this._isApiUsable("getFileStats"))return null;try{let t=I.Uri.file(e),o=await I.workspace.fs.stat(t);return{path:e,size:o.size,created:new Date(o.ctime),modified:new Date(o.mtime),type:o.type===I.FileType.Directory?"directory":"file"}}catch(t){return F.error("Failed to get file stats:",t),null}}getApi(){return this.api}getRegisteredPlugins(){let e=[];for(let[t,o]of this.plugins)e.push({id:t,name:o.name,version:o.version,author:o.author,active:o.active,registeredAt:o.registeredAt});return e}validatePlugin(e){return!(!e||typeof e!="object"||!e.name||!e.version||e.activate&&typeof e.activate!="function"||e.deactivate&&typeof e.deactivate!="function")}validateDecorationProvider(e){return!(!e||typeof e!="object"||typeof e.provideDecoration!="function")}getRelativeTimeShort(e){let t=Math.floor(e/1e3),o=Math.floor(t/60),i=Math.floor(o/60),s=Math.floor(i/24);if(t<60)return`${t}s`;if(o<60)return`${o}m`;if(i<24)return`${i}h`;if(s<30)return`${s}d`;let r=Math.floor(s/30);return r<12?`${r}mo`:`${Math.floor(r/12)}y`}getRelativeTimeLong(e){let t=Math.floor(e/1e3),o=Math.floor(t/60),i=Math.floor(o/60),s=Math.floor(i/24);if(t<60)return`${t} second${t!==1?"s":""} ago`;if(o<60)return`${o} minute${o!==1?"s":""} ago`;if(i<24)return`${i} hour${i!==1?"s":""} ago`;if(s<30)return`${s} day${s!==1?"s":""} ago`;let r=Math.floor(s/30);if(r<12)return`${r} month${r!==1?"s":""} ago`;let n=Math.floor(r/12);return`${n} year${n!==1?"s":""} ago`}getColorForAge(e){if(!I.workspace.getConfiguration("explorerDates").get("colorCoding",!1))return;let s=(new Date-e)/(1e3*60*60);return s<1?new I.ThemeColor("charts.green"):s<24?new I.ThemeColor("charts.yellow"):s<168?new I.ThemeColor("charts.orange"):new I.ThemeColor("charts.red")}createExamplePlugin(){return{name:"File Size Display",version:"1.0.0",author:"Explorer Dates",description:"Adds file size to decorations",activate:d(e=>{e.registerDecorationProvider("fileSize",{provideDecoration:d(async(t,o,i)=>{let s=this.formatFileSize(o.size);return{badge:`${i.badge} \u2022 ${s}`,tooltip:`${i.tooltip}
Size: ${s}`}},"provideDecoration")})},"activate"),deactivate:d(()=>{},"deactivate")}}_setupConfigurationListener(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=I.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableExtensionApi")||e.affectsConfiguration("explorerDates.allowExternalPlugins"))&&F.info("Explorer Dates API configuration changed",{apiEnabled:this._isApiEnabled(),externalPluginsAllowed:this._allowsExternalPlugins()})})}_isApiEnabled(){return I.workspace.getConfiguration("explorerDates").get("enableExtensionApi",!0)}_allowsExternalPlugins(){return I.workspace.getConfiguration("explorerDates").get("allowExternalPlugins",!0)}_isApiUsable(e){return this._isApiEnabled()?!0:(F.warn(`Explorer Dates API request "${e}" ignored because enableExtensionApi is disabled.`),!1)}_canUsePlugins(e){return this._isApiUsable(e)?this._allowsExternalPlugins()?!0:(F.warn(`Explorer Dates plugin request "${e}" ignored because allowExternalPlugins is disabled.`),!1):!1}formatFileSize(e){if(e===0)return"0 B";let t=1024,o=["B","KB","MB","GB"],i=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,i)).toFixed(1))+" "+o[i]}dispose(){this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this.plugins.clear(),this.decorationProviders.clear(),F.info("Extension API Manager disposed")}};d(Xe,"ExtensionApiManager");var Ye=Xe;Kt.exports={ExtensionApiManager:Ye}});var Yt=S((vs,Qt)=>{var x=require("vscode"),{getLogger:gi}=A(),{fileSystem:pi}=U(),{getExtension:et,normalizePath:fi}=B(),z=gi(),mi=!0,ot=class ot{constructor(){this.fileActivityCache=new Map,this.allowedFormats=["json","csv","html","markdown"],this.activityTrackingDays=30,this.activityCutoffMs=null,this.timeTrackingIntegration="none",this._configurationWatcher=null,this._fileWatcher=null,this._fileWatcherSubscriptions=[],this._loadConfiguration(),this._setupConfigurationWatcher(),this.initialize()}_loadConfiguration(){try{let e=x.workspace.getConfiguration("explorerDates"),t=e.get("reportFormats",["json","html"]),o=["json","csv","html","markdown"];this.allowedFormats=Array.from(new Set([...t,...o]));let i=e.get("activityTrackingDays",30);this.activityTrackingDays=Math.max(1,Math.min(365,i)),this.activityCutoffMs=this.activityTrackingDays*24*60*60*1e3,this.timeTrackingIntegration=e.get("timeTrackingIntegration","none")}catch(e){z.error("Failed to load reporting configuration",e)}}_setupConfigurationWatcher(){this._configurationWatcher&&this._configurationWatcher.dispose(),this._configurationWatcher=x.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.reportFormats")||e.affectsConfiguration("explorerDates.activityTrackingDays")||e.affectsConfiguration("explorerDates.timeTrackingIntegration"))&&(this._loadConfiguration(),z.info("Reporting configuration updated",{allowedFormats:this.allowedFormats,activityTrackingDays:this.activityTrackingDays,timeTrackingIntegration:this.timeTrackingIntegration}))})}async initialize(){try{this.startFileWatcher(),z.info("Export & Reporting Manager initialized")}catch(e){z.error("Failed to initialize Export & Reporting Manager:",e)}}startFileWatcher(){if(this._fileWatcher)return;let e=x.workspace.createFileSystemWatcher("**/*");this._fileWatcher=e,this._fileWatcherSubscriptions=[e.onDidChange(t=>this.recordFileActivity(t,"modified")),e.onDidCreate(t=>this.recordFileActivity(t,"created")),e.onDidDelete(t=>this.recordFileActivity(t,"deleted"))]}recordFileActivity(e,t){try{let o=e.fsPath||e.path,i=new Date;this.fileActivityCache.has(o)||this.fileActivityCache.set(o,[]),this.fileActivityCache.get(o).push({action:t,timestamp:i,path:o}),this._enforceActivityRetention(o)}catch(o){z.error("Failed to record file activity:",o)}}_enforceActivityRetention(e){let t=this.fileActivityCache.get(e);if(!(!t||t.length===0)){if(this.activityCutoffMs){let o=new Date(Date.now()-this.activityCutoffMs);for(;t.length&&t[0].timestamp<o;)t.shift()}t.length>100&&t.splice(0,t.length-100)}}async generateFileModificationReport(e={}){try{let{format:t="json",timeRange:o="all",includeDeleted:i=!1,outputPath:s=null}=e;if(!this.allowedFormats.includes(t)){let l=`Report format "${t}" is disabled. Allowed formats: ${this.allowedFormats.join(", ")}`;return x.window.showWarningMessage(l),z.warn(l),null}let r=await this.collectFileData(o,i),n=await this.formatReport(r,t);return s&&(await this.saveReport(n,s),x.window.showInformationMessage(`Report saved to ${s}`)),n}catch(t){return z.error("Failed to generate file modification report:",t),x.window.showErrorMessage("Failed to generate report"),null}}async collectFileData(e,t){let o=[],i=x.workspace.workspaceFolders;if(!i)return{files:[],summary:this.createSummary([])};for(let r of i){let n=await this.scanWorkspaceFolder(r.uri,e,t);o.push(...n)}let s=this.createSummary(o);return s.integrationTarget=this.timeTrackingIntegration,s.activityTrackingDays=this.activityTrackingDays,{generatedAt:new Date().toISOString(),workspace:i.map(r=>r.uri.fsPath),timeRange:e,files:o,summary:s}}async scanWorkspaceFolder(e,t,o){let i=[],r=x.workspace.getConfiguration("explorerDates").get("excludedPatterns",[]);try{let n=await x.workspace.fs.readDirectory(e);for(let[l,c]of n){let h=x.Uri.joinPath(e,l),u=x.workspace.asRelativePath(h);if(!this.isExcluded(u,r)){if(c===x.FileType.File){let w=await this.getFileData(h,t);w&&i.push(w)}else if(c===x.FileType.Directory){let w=await this.scanWorkspaceFolder(h,t,o);i.push(...w)}}}if(o&&e.fsPath){let l=this.getDeletedFiles(e.fsPath,t);i.push(...l)}}catch(n){z.error(`Failed to scan folder ${e.fsPath||e.path}:`,n)}return i}async getFileData(e,t){try{let o=await x.workspace.fs.stat(e),i=x.workspace.asRelativePath(e),s=e.fsPath||e.path,r=this.fileActivityCache.get(s)||[],n=this.filterActivitiesByTimeRange(r,t);return{path:i,fullPath:s,size:o.size,created:new Date(o.ctime),modified:new Date(o.mtime),type:this.getFileType(i),extension:et(i),activities:n,activityCount:n.length,lastActivity:n.length>0?n[n.length-1].timestamp:new Date(o.mtime)}}catch(o){return z.error(`Failed to get file data for ${e.fsPath||e.path}:`,o),null}}filterActivitiesByTimeRange(e,t){let o=e;if(t!=="all"){let i=new Date,s;switch(t){case"24h":s=new Date(i-1440*60*1e3);break;case"7d":s=new Date(i-10080*60*1e3);break;case"30d":s=new Date(i-720*60*60*1e3);break;case"90d":s=new Date(i-2160*60*60*1e3);break;default:s=null}s&&(o=o.filter(r=>r.timestamp>=s))}if(this.activityCutoffMs){let i=new Date(Date.now()-this.activityCutoffMs);o=o.filter(s=>s.timestamp>=i)}return o}getDeletedFiles(e,t){if(!e)return[];let o=[];for(let[i,s]of this.fileActivityCache)if(i.startsWith(e)){let r=s.filter(l=>l.action==="deleted"),n=this.filterActivitiesByTimeRange(r,t);n.length>0&&o.push({path:x.workspace.asRelativePath(i),fullPath:i,size:0,created:null,modified:null,type:"deleted",extension:et(i),activities:n,activityCount:n.length,lastActivity:n[n.length-1].timestamp})}return o}createSummary(e){let t={totalFiles:e.length,totalSize:e.reduce((i,s)=>i+(s.size||0),0),fileTypes:{},activityByDay:{},mostActiveFiles:[],recentlyModified:[],largestFiles:[],oldestFiles:[]};e.forEach(i=>{let s=i.type||"unknown";t.fileTypes[s]=(t.fileTypes[s]||0)+1});let o=new Date(Date.now()-this.activityTrackingDays*24*60*60*1e3);return e.forEach(i=>{i.activities.forEach(s=>{if(s.timestamp>=o){let r=s.timestamp.toISOString().split("T")[0];t.activityByDay[r]=(t.activityByDay[r]||0)+1}})}),t.mostActiveFiles=e.sort((i,s)=>s.activityCount-i.activityCount).slice(0,10).map(i=>({path:i.path,activityCount:i.activityCount,lastActivity:i.lastActivity})),t.recentlyModified=e.filter(i=>i.modified).sort((i,s)=>s.modified-i.modified).slice(0,20).map(i=>({path:i.path,modified:i.modified,size:i.size})),t.largestFiles=e.sort((i,s)=>(s.size||0)-(i.size||0)).slice(0,10).map(i=>({path:i.path,size:i.size,modified:i.modified})),t.oldestFiles=e.filter(i=>i.modified).sort((i,s)=>i.modified-s.modified).slice(0,10).map(i=>({path:i.path,modified:i.modified,size:i.size})),t}async formatReport(e,t){switch(t.toLowerCase()){case"json":return JSON.stringify(e,null,2);case"csv":return this.formatAsCSV(e);case"html":return this.formatAsHTML(e);case"markdown":return this.formatAsMarkdown(e);default:throw new Error(`Unsupported format: ${t}`)}}formatAsCSV(e){let t=["Path,Size,Created,Modified,Type,Extension,ActivityCount,LastActivity"];return e.files.forEach(o=>{t.push([o.path,o.size||0,o.created?o.created.toISOString():"",o.modified?o.modified.toISOString():"",o.type,o.extension,o.activityCount,o.lastActivity?o.lastActivity.toISOString():""].join(","))}),t.join(`
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
`}async saveReport(e,t){try{if(mi){let i=encodeURIComponent(e);await x.env.openExternal(x.Uri.parse(`data:text/plain;charset=utf-8,${i}`)),x.window.showInformationMessage("Report download triggered in browser");return}let o=t instanceof x.Uri?t:x.Uri.file(t);await pi.writeFile(o,e,"utf8"),z.info(`Report saved to ${o.fsPath||o.path}`)}catch(o){throw z.error("Failed to save report:",o),o}}async exportToTimeTrackingTools(e={}){try{let{tool:t="generic",timeRange:o="7d"}=e,i=await this.collectFileData(o,!1);return this.formatForTimeTracking(i,t)}catch(t){return z.error("Failed to export to time tracking tools:",t),null}}formatForTimeTracking(e,t){let o=[];switch(e.files.forEach(i=>{i.activities.forEach(s=>{o.push({file:i.path,action:s.action,timestamp:s.timestamp,duration:this.estimateSessionDuration(s),project:this.extractProjectName(i.path)})})}),t){case"toggl":return this.formatForToggl(o);case"clockify":return this.formatForClockify(o);case"generic":default:return o}}formatForToggl(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),duration:t.duration*60,project:t.project,tags:[t.action,this.getFileType(t.file)]}))}formatForClockify(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),end:new Date(t.timestamp.getTime()+t.duration*60*1e3).toISOString(),project:t.project,tags:[t.action,this.getFileType(t.file)]}))}estimateSessionDuration(e){switch(e.action){case"created":return 15;case"modified":return 5;case"deleted":return 1;default:return 5}}extractProjectName(e){return fi(e).split("/")[0]||"Unknown Project"}getFileType(e){let t=et(e);return{".js":"javascript",".ts":"typescript",".py":"python",".java":"java",".cpp":"cpp",".html":"html",".css":"css",".md":"markdown",".json":"json",".xml":"xml",".txt":"text"}[t]||"other"}isExcluded(e,t){return t.some(o=>new RegExp(o.replace(/\*/g,".*")).test(e))}formatFileSize(e){if(e===0)return"0 B";let t=1024,o=["B","KB","MB","GB"],i=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,i)).toFixed(1))+" "+o[i]}async showReportDialog(){try{let e={"\u{1F4CA} Generate Full Report":"full","\u{1F4C5} Last 24 Hours":"24h","\u{1F4C5} Last 7 Days":"7d","\u{1F4C5} Last 30 Days":"30d","\u{1F4C5} Last 90 Days":"90d"},t=await x.window.showQuickPick(Object.keys(e),{placeHolder:"Select report time range"});if(!t)return;let o=e[t],i=["JSON","CSV","HTML","Markdown"],s=await x.window.showQuickPick(i,{placeHolder:"Select report format"});if(!s)return;let r=await x.window.showSaveDialog({defaultUri:x.Uri.file(`file-report.${s.toLowerCase()}`),filters:{[s]:[s.toLowerCase()]}});if(!r)return;await this.generateFileModificationReport({format:s.toLowerCase(),timeRange:o,outputPath:r.fsPath})}catch(e){z.error("Failed to show report dialog:",e),x.window.showErrorMessage("Failed to generate report")}}dispose(){if(this._configurationWatcher&&(this._configurationWatcher.dispose(),this._configurationWatcher=null),this._fileWatcherSubscriptions.length>0){for(let e of this._fileWatcherSubscriptions)e.dispose();this._fileWatcherSubscriptions=[]}this._fileWatcher&&(this._fileWatcher.dispose(),this._fileWatcher=null),this.fileActivityCache.clear(),z.info("Export & Reporting Manager disposed")}};d(ot,"ExportReportingManager");var tt=ot;Qt.exports={ExportReportingManager:tt}});var eo=S((ys,Xt)=>{var b=require("vscode"),{FileDateDecorationProvider:wi}=It(),{getLogger:vi}=A(),{getLocalization:bi}=ie(),{fileSystem:yi}=U(),{registerCoreCommands:_i}=zt(),{registerAnalysisCommands:Ci}=Ot(),{registerOnboardingCommands:xi}=jt(),N,D,ae;function Di(a){return`<!DOCTYPE html>
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
    </html>`}d(Di,"getApiInformationHtml");function Si(a){let e=d(o=>{if(o<1024)return`${o} B`;let i=o/1024;return i<1024?`${i.toFixed(1)} KB`:`${(i/1024).toFixed(1)} MB`},"formatFileSize"),t=a.map(o=>`
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
    `}d(Si,"generateWorkspaceActivityHTML");function Fi(a){return`
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
            
            ${Object.entries(a).map(([t,o])=>{let i=Object.entries(o).map(([s,r])=>{let n=Array.isArray(r)?r.join(", ")||"None":r?.toString()||"N/A";return`
                <tr>
                    <td><strong>${s}:</strong></td>
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
    `}d(Fi,"generateDiagnosticsHTML");function Ti(a){return`<!DOCTYPE html>
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
                <h2>\u{1F9EA} ${e.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</h2>
                <p class="${i}">Status: ${t.status}</p>
                
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
    </html>`}d(Ti,"generateDiagnosticsWebview");function ki(a){let e=d(t=>{if(t===0)return"0 B";let o=1024,i=["B","KB","MB","GB"],s=Math.floor(Math.log(t)/Math.log(o));return parseFloat((t/Math.pow(o,s)).toFixed(2))+" "+i[s]},"formatBytes");return`
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
    `}d(ki,"generatePerformanceAnalyticsHTML");function Zt(a){let e=b.window.createStatusBarItem(b.StatusBarAlignment.Right,100);e.command="explorerDates.showFileDetails",e.tooltip="Click to show detailed file information";let t=d(async()=>{try{let o=b.window.activeTextEditor;if(!o){e.hide();return}let i=o.document.uri;if(i.scheme!=="file"){e.hide();return}let s=await yi.stat(i),r=s.mtime instanceof Date?s.mtime:new Date(s.mtime),n=N._formatDateBadge(r,"smart"),l=N._formatFileSize(s.size,"auto");e.text=`$(clock) ${n} $(file) ${l}`,e.show()}catch(o){e.hide(),D.debug("Failed to update status bar",o)}},"updateStatusBar");return b.window.onDidChangeActiveTextEditor(t),b.window.onDidChangeTextEditorSelection(t),t(),a.subscriptions.push(e),e}d(Zt,"initializeStatusBar");async function $i(a){try{D=vi(),ae=bi(),a.subscriptions.push(ae),D.info("Explorer Dates: Extension activated");let e=b.env.uiKind===b.UIKind.Web;await b.commands.executeCommand("setContext","explorerDates.gitFeaturesAvailable",!e);let t=b.workspace.getConfiguration("explorerDates"),o=t.get("enableWorkspaceTemplates",!0),i=t.get("enableReporting",!0),s=t.get("enableExtensionApi",!0);N=new wi;let r=b.window.registerFileDecorationProvider(N);a.subscriptions.push(r),a.subscriptions.push(N),a.subscriptions.push(D),await N.initializeAdvancedSystems(a);let n=null,l=null,c=null,h=null,u=d(()=>{if(!n){let{OnboardingManager:y}=Ht();n=new y(a)}return n},"getOnboardingManager"),w=d(()=>{if(!o)throw new Error("Workspace templates are disabled via explorerDates.enableWorkspaceTemplates");if(!l){let{WorkspaceTemplatesManager:y}=Vt();l=new y(a)}return l},"getWorkspaceTemplatesManager"),p=d(()=>{if(!c){let{ExtensionApiManager:y}=Jt();c=new y,a.subscriptions.push(c)}return c},"getExtensionApiManager"),v=d(()=>{if(!i)throw new Error("Reporting is disabled via explorerDates.enableReporting");if(!h){let{ExportReportingManager:y}=Yt();h=new y,a.subscriptions.push(h)}return h},"getExportReportingManager"),R=d(()=>p().getApi(),"apiFactory");s?a.exports=R:(a.exports=void 0,D.info("Explorer Dates API exports disabled via explorerDates.enableExtensionApi")),b.workspace.getConfiguration("explorerDates").get("showWelcomeOnStartup",!0)&&await u().shouldShowOnboarding()&&setTimeout(()=>{u().showWelcomeMessage()},5e3),_i({context:a,fileDateProvider:N,logger:D,l10n:ae}),Ci({context:a,fileDateProvider:N,logger:D,generators:{generateWorkspaceActivityHTML:Si,generatePerformanceAnalyticsHTML:ki,generateDiagnosticsHTML:Fi,generateDiagnosticsWebview:Ti}}),xi({context:a,logger:D,getOnboardingManager:u});let G=b.commands.registerCommand("explorerDates.openTemplateManager",async()=>{try{if(!o){b.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to use this command.");return}await w().showTemplateManager(),D.info("Template manager opened")}catch(y){D.error("Failed to open template manager",y),b.window.showErrorMessage(`Failed to open template manager: ${y.message}`)}});a.subscriptions.push(G);let ne=b.commands.registerCommand("explorerDates.saveTemplate",async()=>{try{if(!o){b.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to save templates.");return}let y=await b.window.showInputBox({prompt:"Enter template name",placeHolder:"e.g., My Project Setup"});if(y){let H=await b.window.showInputBox({prompt:"Enter description (optional)",placeHolder:"Brief description of this template"})||"";await w().saveCurrentConfiguration(y,H)}D.info("Template saved")}catch(y){D.error("Failed to save template",y),b.window.showErrorMessage(`Failed to save template: ${y.message}`)}});a.subscriptions.push(ne);let ye=b.commands.registerCommand("explorerDates.generateReport",async()=>{try{if(!i){b.window.showInformationMessage("Reporting features are disabled. Enable explorerDates.enableReporting to generate reports.");return}await v().showReportDialog(),D.info("Report generation started")}catch(y){D.error("Failed to generate report",y),b.window.showErrorMessage(`Failed to generate report: ${y.message}`)}});a.subscriptions.push(ye);let ce=b.commands.registerCommand("explorerDates.showApiInfo",async()=>{try{if(!s){b.window.showInformationMessage("Explorer Dates API is disabled via settings.");return}let y=b.window.createWebviewPanel("apiInfo","Explorer Dates API Information",b.ViewColumn.One,{enableScripts:!0});y.webview.html=Di(R()),D.info("API information panel opened")}catch(y){D.error("Failed to show API information",y),b.window.showErrorMessage(`Failed to show API information: ${y.message}`)}});a.subscriptions.push(ce);let O,le=b.workspace.getConfiguration("explorerDates"),_e=le.get("performanceMode",!1);le.get("showStatusBar",!1)&&!_e&&(O=Zt(a));let Z=b.workspace.onDidChangeConfiguration(y=>{if(y.affectsConfiguration("explorerDates.showStatusBar")||y.affectsConfiguration("explorerDates.performanceMode")){let H=b.workspace.getConfiguration("explorerDates"),de=H.get("showStatusBar",!1),he=H.get("performanceMode",!1),X=de&&!he;X&&!O?O=Zt(a):!X&&O&&(O.dispose(),O=null)}});a.subscriptions.push(Z),D.info("Explorer Dates: Date decorations ready")}catch(e){let t=`${ae?ae.getString("activationError"):"Explorer Dates failed to activate"}: ${e.message}`;throw D&&D.error("Extension activation failed",e),b.window.showErrorMessage(t),e}}d($i,"activate");async function Mi(){try{D&&D.info("Explorer Dates extension is being deactivated"),N&&typeof N.dispose=="function"&&await N.dispose(),D&&D.info("Explorer Dates extension deactivated successfully")}catch(a){D&&D.error("Explorer Dates: Error during deactivation",a)}}d(Mi,"deactivate");Xt.exports={activate:$i,deactivate:Mi}});var to=eo();module.exports={activate:to.activate,deactivate:to.deactivate};
