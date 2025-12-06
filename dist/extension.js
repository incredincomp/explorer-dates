var io=Object.defineProperty;var d=(a,e)=>io(a,"name",{value:e,configurable:!0});var S=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports);var A=S((Ai,nt)=>{var be=require("vscode"),Ce=class Ce{constructor(){this._outputChannel=be.window.createOutputChannel("Explorer Dates"),this._isEnabled=!1,this._updateConfig(),be.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.enableLogging")&&this._updateConfig()})}_updateConfig(){let e=be.workspace.getConfiguration("explorerDates");this._isEnabled=e.get("enableLogging",!1)}debug(e,...t){if(this._isEnabled){let i=`[${new Date().toISOString()}] [DEBUG] ${e}`;this._outputChannel.appendLine(i),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}}info(e,...t){let i=`[${new Date().toISOString()}] [INFO] ${e}`;this._outputChannel.appendLine(i),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}warn(e,...t){let i=`[${new Date().toISOString()}] [WARN] ${e}`;this._outputChannel.appendLine(i),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}error(e,t,...o){let s=`[${new Date().toISOString()}] [ERROR] ${e}`;this._outputChannel.appendLine(s),t instanceof Error&&(this._outputChannel.appendLine(`Error: ${t.message}`),t.stack&&this._outputChannel.appendLine(`Stack: ${t.stack}`)),o.length>0&&this._outputChannel.appendLine(JSON.stringify(o,null,2))}show(){this._outputChannel.show()}clear(){this._outputChannel.clear()}dispose(){this._outputChannel.dispose()}};d(Ce,"Logger");var ae=Ce,ye=null;function so(){return ye||(ye=new ae),ye}d(so,"getLogger");nt.exports={Logger:ae,getLogger:so}});var ee=S((Ii,ct)=>{var _e=require("vscode"),ne={en:{now:"now",minutes:"m",hours:"h",days:"d",weeks:"w",months:"mo",years:"y",justNow:"just now",minutesAgo:d(a=>`${a} minute${a!==1?"s":""} ago`,"minutesAgo"),hoursAgo:d(a=>`${a} hour${a!==1?"s":""} ago`,"hoursAgo"),yesterday:"yesterday",daysAgo:d(a=>`${a} day${a!==1?"s":""} ago`,"daysAgo"),lastModified:"Last modified",refreshSuccess:"Date decorations refreshed",activationError:"Explorer Dates failed to activate",errorAccessingFile:"Error accessing file for decoration"},es:{now:"ahora",minutes:"m",hours:"h",days:"d",weeks:"s",months:"m",years:"a",justNow:"ahora mismo",minutesAgo:d(a=>`hace ${a} minuto${a!==1?"s":""}`,"minutesAgo"),hoursAgo:d(a=>`hace ${a} hora${a!==1?"s":""}`,"hoursAgo"),yesterday:"ayer",daysAgo:d(a=>`hace ${a} d\xEDa${a!==1?"s":""}`,"daysAgo"),lastModified:"\xDAltima modificaci\xF3n",refreshSuccess:"Decoraciones de fecha actualizadas",activationError:"Explorer Dates no se pudo activar",errorAccessingFile:"Error al acceder al archivo para decoraci\xF3n"},fr:{now:"maintenant",minutes:"m",hours:"h",days:"j",weeks:"s",months:"m",years:"a",justNow:"\xE0 l'instant",minutesAgo:d(a=>`il y a ${a} minute${a!==1?"s":""}`,"minutesAgo"),hoursAgo:d(a=>`il y a ${a} heure${a!==1?"s":""}`,"hoursAgo"),yesterday:"hier",daysAgo:d(a=>`il y a ${a} jour${a!==1?"s":""}`,"daysAgo"),lastModified:"Derni\xE8re modification",refreshSuccess:"D\xE9corations de date actualis\xE9es",activationError:"\xC9chec de l'activation d'Explorer Dates",errorAccessingFile:"Erreur lors de l'acc\xE8s au fichier pour la d\xE9coration"},de:{now:"jetzt",minutes:"Min",hours:"Std",days:"T",weeks:"W",months:"Mon",years:"J",justNow:"gerade eben",minutesAgo:d(a=>`vor ${a} Minute${a!==1?"n":""}`,"minutesAgo"),hoursAgo:d(a=>`vor ${a} Stunde${a!==1?"n":""}`,"hoursAgo"),yesterday:"gestern",daysAgo:d(a=>`vor ${a} Tag${a!==1?"en":""}`,"daysAgo"),lastModified:"Zuletzt ge\xE4ndert",refreshSuccess:"Datumsdekorationen aktualisiert",activationError:"Explorer Dates konnte nicht aktiviert werden",errorAccessingFile:"Fehler beim Zugriff auf Datei f\xFCr Dekoration"},ja:{now:"\u4ECA",minutes:"\u5206",hours:"\u6642\u9593",days:"\u65E5",weeks:"\u9031",months:"\u30F6\u6708",years:"\u5E74",justNow:"\u305F\u3063\u305F\u4ECA",minutesAgo:d(a=>`${a}\u5206\u524D`,"minutesAgo"),hoursAgo:d(a=>`${a}\u6642\u9593\u524D`,"hoursAgo"),yesterday:"\u6628\u65E5",daysAgo:d(a=>`${a}\u65E5\u524D`,"daysAgo"),lastModified:"\u6700\u7D42\u66F4\u65B0",refreshSuccess:"\u65E5\u4ED8\u88C5\u98FE\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",activationError:"Explorer Dates\u306E\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F",errorAccessingFile:"\u30D5\u30A1\u30A4\u30EB\u30A2\u30AF\u30BB\u30B9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"},zh:{now:"\u73B0\u5728",minutes:"\u5206\u949F",hours:"\u5C0F\u65F6",days:"\u5929",weeks:"\u5468",months:"\u6708",years:"\u5E74",justNow:"\u521A\u521A",minutesAgo:d(a=>`${a}\u5206\u949F\u524D`,"minutesAgo"),hoursAgo:d(a=>`${a}\u5C0F\u65F6\u524D`,"hoursAgo"),yesterday:"\u6628\u5929",daysAgo:d(a=>`${a}\u5929\u524D`,"daysAgo"),lastModified:"\u6700\u540E\u4FEE\u6539",refreshSuccess:"\u65E5\u671F\u88C5\u9970\u5DF2\u5237\u65B0",activationError:"Explorer Dates \u6FC0\u6D3B\u5931\u8D25",errorAccessingFile:"\u8BBF\u95EE\u6587\u4EF6\u88C5\u9970\u65F6\u51FA\u9519"}},De=class De{constructor(){this._currentLocale="en",this._updateLocale(),_e.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.locale")&&this._updateLocale()})}_updateLocale(){let t=_e.workspace.getConfiguration("explorerDates").get("locale","auto");t==="auto"&&(t=_e.env.language.split("-")[0]),ne[t]||(t="en"),this._currentLocale=t}getString(e,...t){let i=(ne[this._currentLocale]||ne.en)[e];return typeof i=="function"?i(...t):i||ne.en[e]||e}getCurrentLocale(){return this._currentLocale}formatDate(e,t={}){try{return e.toLocaleDateString(this._currentLocale,t)}catch{return e.toLocaleDateString("en",t)}}};d(De,"LocalizationManager");var ce=De,xe=null;function ro(){return xe||(xe=new ce),xe}d(ro,"getLocalization");ct.exports={LocalizationManager:ce,getLocalization:ro}});var Se=S((Ri,lt)=>{var Y=require("vscode");function ao(){var a,e;try{return((a=Y==null?void 0:Y.env)==null?void 0:a.uiKind)===((e=Y==null?void 0:Y.UIKind)==null?void 0:e.Web)}catch{return!1}}d(ao,"isWebEnvironment");lt.exports={isWebEnvironment:ao}});var O=S((Ni,ht)=>{function K(a=""){return a?a.replace(/\\/g,"/"):""}d(K,"normalizePath");function no(a=""){let e=K(a);return e?e.split("/").filter(Boolean):[]}d(no,"getSegments");function dt(a=""){let e=no(a);return e.length?e[e.length-1]:""}d(dt,"getFileName");function co(a=""){let e=dt(a),t=e.lastIndexOf(".");return t<=0?"":e.substring(t).toLowerCase()}d(co,"getExtension");function lo(a=""){let e=K(a),t=e.lastIndexOf("/");return t===-1?"":e.substring(0,t)}d(lo,"getDirectory");function ho(...a){return K(a.filter(Boolean).join("/")).replace(/\/+/g,"/")}d(ho,"joinPath");function uo(a=""){return K(a).toLowerCase()}d(uo,"getCacheKey");function go(a=""){if(!a)return"";if(typeof a=="string")return a;if(typeof a.fsPath=="string"&&a.fsPath.length>0)return a.fsPath;if(typeof a.path=="string"&&a.path.length>0)return a.path;if(typeof a.toString=="function")try{return a.toString(!0)}catch{return a.toString()}return String(a)}d(go,"getUriPath");function po(a="",e=""){let t=K(a),o=K(e);return t&&o.startsWith(t)?o.substring(t.length).replace(/^\/+/,""):o}d(po,"getRelativePath");ht.exports={normalizePath:K,getFileName:dt,getExtension:co,getDirectory:lo,joinPath:ho,getCacheKey:uo,getUriPath:go,getRelativePath:po}});var j=S((Oi,gt)=>{var z=require("vscode"),{isWebEnvironment:mo}=Se(),{normalizePath:fo}=O(),ut=!1,k=null;if(!ut)try{k=require("fs").promises}catch{k=null}var Fe=class Fe{constructor(){this.isWeb=ut||mo()}_toPath(e){return e?typeof e=="string"?e:e instanceof z.Uri?e.fsPath||e.path:String(e):""}_toUri(e){if(e instanceof z.Uri)return e;if(typeof e=="string")return z.Uri.file(e);throw new Error(`Unsupported target type: ${typeof e}`)}async stat(e){if(!this.isWeb&&k)return k.stat(this._toPath(e));let t=this._toUri(e),o=await z.workspace.fs.stat(t);return{...o,mtime:new Date(o.mtime),ctime:new Date(o.ctime),birthtime:new Date(o.ctime),isFile:d(()=>o.type===z.FileType.File,"isFile"),isDirectory:d(()=>o.type===z.FileType.Directory,"isDirectory")}}async readFile(e,t="utf8"){if(!this.isWeb&&k)return k.readFile(this._toPath(e),t);let o=this._toUri(e),i=await z.workspace.fs.readFile(o);return t===null||t==="binary"?i:new TextDecoder(t).decode(i)}async writeFile(e,t,o="utf8"){if(!this.isWeb&&k)return k.writeFile(this._toPath(e),t,o);let i=this._toUri(e),s=typeof t=="string"?new TextEncoder().encode(t):t;await z.workspace.fs.writeFile(i,s)}async mkdir(e,t={recursive:!0}){if(!this.isWeb&&k)return k.mkdir(this._toPath(e),t);let o=this._toUri(e);await z.workspace.fs.createDirectory(o)}async readdir(e,t={withFileTypes:!1}){if(!this.isWeb&&k)return k.readdir(this._toPath(e),t);let o=this._toUri(e),i=await z.workspace.fs.readDirectory(o);return t.withFileTypes?i.map(([s,r])=>({name:s,isDirectory:d(()=>r===z.FileType.Directory,"isDirectory"),isFile:d(()=>r===z.FileType.File,"isFile")})):i.map(([s])=>s)}async delete(e,t={recursive:!1}){if(!this.isWeb&&k){let i=this._toPath(e);return t.recursive?k.rm?k.rm(i,t):k.rmdir(i,t):k.unlink(i)}let o=this._toUri(e);await z.workspace.fs.delete(o,t)}async exists(e){try{return await this.stat(e),!0}catch{return!1}}async ensureDirectory(e){let t=fo(this._toPath(e));await this.mkdir(t,{recursive:!0})}};d(Fe,"FileSystemAdapter");var le=Fe,wo=new le;gt.exports={FileSystemAdapter:le,fileSystem:wo}});var mt=S((Ui,pt)=>{var N=require("vscode"),{getLogger:vo}=A(),{fileSystem:bo}=j(),{normalizePath:Te,getRelativePath:yo,getFileName:Co}=O(),$e=class $e{constructor(){this._logger=vo(),this._fs=bo,this._commonExclusions=["node_modules",".npm",".yarn","coverage","nyc_output","dist","build","out","target","bin","obj",".vscode",".idea",".vs",".vscode-test",".git",".svn",".hg",".bzr",".pnpm-store","bower_components","jspm_packages","tmp","temp",".tmp",".cache",".parcel-cache",".DS_Store","Thumbs.db","__pycache__",".pytest_cache",".tox","venv",".env",".virtualenv","vendor",".docker","logs","*.log"],this._patternScores=new Map,this._workspaceAnalysis=new Map,this._logger.info("SmartExclusionManager initialized")}async analyzeWorkspace(e){try{let t=Te((e==null?void 0:e.fsPath)||(e==null?void 0:e.path)||""),o={detectedPatterns:[],suggestedExclusions:[],projectType:"unknown",riskFolders:[]};o.projectType=await this._detectProjectType(e);let i=await this._scanForExclusionCandidates(e,t),s=this._scorePatterns(i,o.projectType);return o.detectedPatterns=i,o.suggestedExclusions=s.filter(r=>r.score>.7).map(r=>r.pattern),o.riskFolders=s.filter(r=>r.riskLevel==="high").map(r=>r.pattern),this._workspaceAnalysis.set(t,o),this._logger.info(`Workspace analysis complete for ${t}`,o),o}catch(t){return this._logger.error("Failed to analyze workspace",t),null}}async _detectProjectType(e){let t=[{file:"package.json",type:"javascript"},{file:"pom.xml",type:"java"},{file:"Cargo.toml",type:"rust"},{file:"setup.py",type:"python"},{file:"requirements.txt",type:"python"},{file:"Gemfile",type:"ruby"},{file:"composer.json",type:"php"},{file:"go.mod",type:"go"},{file:"CMakeLists.txt",type:"cpp"},{file:"Dockerfile",type:"docker"}];if(!e)return"unknown";for(let o of t)try{let i=N.Uri.joinPath(e,o.file);if(await this._fs.exists(i))return o.type}catch{}return"unknown"}async _scanForExclusionCandidates(e,t,o=2){let i=[],s=d(async(r,n=0)=>{if(!(n>o))try{let l=await this._fs.readdir(r,{withFileTypes:!0});for(let c of l)if(c.isDirectory()){let h=N.Uri.joinPath(r,c.name),u=Te(h.fsPath||h.path),m=yo(t,u);this._commonExclusions.includes(c.name)&&i.push({name:c.name,path:m,type:"common",size:await this._getDirectorySize(h)});let p=await this._getDirectorySize(h);p>10485760&&i.push({name:c.name,path:m,type:"large",size:p}),await s(h,n+1)}}catch{}},"scanDirectory");return await s(e),i}async _getDirectorySize(e){try{let t=await this._fs.readdir(e,{withFileTypes:!0}),o=0,i=0;for(let s of t){if(i>100)break;if(s.isFile())try{let r=N.Uri.joinPath(e,s.name),n=await this._fs.stat(r);o+=n.size,i++}catch{}}return o}catch{return 0}}_scorePatterns(e,t){return e.map(o=>{let i=0,s="low";switch(o.type==="common"&&(i+=.8),o.size>100*1024*1024?(i+=.9,s="high"):o.size>10*1024*1024&&(i+=.5,s="medium"),t){case"javascript":["node_modules",".npm","coverage","dist","build"].includes(o.name)&&(i+=.9);break;case"python":["__pycache__",".pytest_cache","venv",".env"].includes(o.name)&&(i+=.9);break;case"java":["target","build",".gradle"].includes(o.name)&&(i+=.9);break}return["src","lib","app","components","pages"].includes(o.name.toLowerCase())&&(i=0,s="none"),{pattern:o.name,path:o.path,score:Math.min(i,1),riskLevel:s,size:o.size,type:o.type}})}getWorkspaceExclusions(e){let o=N.workspace.getConfiguration("explorerDates").get("workspaceExclusionProfiles",{}),i=this._getWorkspaceKey(e);return o[i]||[]}async saveWorkspaceExclusions(e,t){let o=N.workspace.getConfiguration("explorerDates"),i=o.get("workspaceExclusionProfiles",{}),s=this._getWorkspaceKey(e);i[s]=t,await o.update("workspaceExclusionProfiles",i,N.ConfigurationTarget.Global),this._logger.info(`Saved workspace exclusions for ${s}`,t)}async getCombinedExclusions(e){let t=N.workspace.getConfiguration("explorerDates"),o=t.get("excludedFolders",[]),i=t.get("excludedPatterns",[]),s=t.get("smartExclusions",!0),r=[...o],n=[...i],l=this.getWorkspaceExclusions(e);if(r.push(...l),s){let c=await this.analyzeWorkspace(e);c&&r.push(...c.suggestedExclusions)}return r=[...new Set(r)],n=[...new Set(n)],{folders:r,patterns:n}}_getWorkspaceKey(e){if(!e)return"unknown-workspace";let t=e.fsPath||e.path||"";return Co(t)||Te(t)}async suggestExclusions(e){let t=await this.analyzeWorkspace(e);if(!t||t.suggestedExclusions.length===0)return;let o=`Found ${t.suggestedExclusions.length} folders that could be excluded for better performance.`,i=await N.window.showInformationMessage(o,"Apply Suggestions","Review","Dismiss");i==="Apply Suggestions"?(await this.saveWorkspaceExclusions(e,t.suggestedExclusions),N.window.showInformationMessage("Smart exclusions applied!")):i==="Review"&&this._showExclusionReview(t)}_showExclusionReview(e){let t=N.window.createWebviewPanel("exclusionReview","Smart Exclusion Review",N.ViewColumn.One,{enableScripts:!0});t.webview.html=this._generateReviewHTML(e)}_generateReviewHTML(e){let t=d(i=>{if(i<1024)return`${i} B`;let s=i/1024;return s<1024?`${s.toFixed(1)} KB`:`${(s/1024).toFixed(1)} MB`},"formatSize"),o=e.detectedPatterns.map(i=>`
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
        `}};d($e,"SmartExclusionManager");var ke=$e;pt.exports={SmartExclusionManager:ke}});var wt=S((Hi,ft)=>{var V=require("vscode"),{getLogger:_o}=A(),Ee=class Ee{constructor(){this._logger=_o(),this._processingQueue=[],this._isProcessing=!1,this._batchSize=50,this._processedCount=0,this._totalCount=0,this._statusBar=null,this._metrics={totalBatches:0,averageBatchTime:0,totalProcessingTime:0},this._logger.info("BatchProcessor initialized")}initialize(){let e=V.workspace.getConfiguration("explorerDates");this._batchSize=e.get("batchSize",50),this._statusBar=V.window.createStatusBarItem(V.StatusBarAlignment.Left,-1e3),V.workspace.onDidChangeConfiguration(t=>{t.affectsConfiguration("explorerDates.batchSize")&&(this._batchSize=V.workspace.getConfiguration("explorerDates").get("batchSize",50),this._logger.debug(`Batch size updated to: ${this._batchSize}`))})}queueForProcessing(e,t,o={}){let i={id:Date.now()+Math.random(),uris:Array.isArray(e)?e:[e],processor:t,priority:o.priority||"normal",background:o.background||!1,onProgress:o.onProgress,onComplete:o.onComplete};return i.priority==="high"?this._processingQueue.unshift(i):this._processingQueue.push(i),this._logger.debug(`Queued batch ${i.id} with ${i.uris.length} URIs`),this._isProcessing||this._startProcessing(),i.id}async _startProcessing(){if(this._isProcessing)return;this._isProcessing=!0,this._processedCount=0,this._totalCount=this._processingQueue.reduce((t,o)=>t+o.uris.length,0),this._logger.info(`Starting batch processing: ${this._totalCount} items in ${this._processingQueue.length} batches`),this._updateStatusBar();let e=Date.now();try{for(;this._processingQueue.length>0;){let t=this._processingQueue.shift();await this._processBatch(t),t.background||await this._sleep(1)}}catch(t){this._logger.error("Batch processing failed",t)}finally{this._isProcessing=!1,this._hideStatusBar();let t=Date.now()-e;this._updateMetrics(t),this._logger.info(`Batch processing completed in ${t}ms`)}}async _processBatch(e){let t=Date.now();this._logger.debug(`Processing batch ${e.id} with ${e.uris.length} URIs`);try{let o=this._chunkArray(e.uris,this._batchSize);for(let i=0;i<o.length;i++){let s=o[i],r=[];for(let n of s){try{let l=await e.processor(n);r.push({uri:n,result:l,success:!0}),this._processedCount++}catch(l){r.push({uri:n,error:l,success:!1}),this._processedCount++,this._logger.debug(`Failed to process ${n.fsPath}`,l)}this._updateStatusBar(),e.onProgress&&e.onProgress({processed:this._processedCount,total:this._totalCount,current:n})}await this._sleep(0),!e.background&&i<o.length-1&&await this._sleep(5)}e.onComplete&&e.onComplete({processed:e.uris.length,success:!0,duration:Date.now()-t})}catch(o){this._logger.error(`Batch ${e.id} processing failed`,o),e.onComplete&&e.onComplete({processed:0,success:!1,error:o,duration:Date.now()-t})}this._metrics.totalBatches++}async processDirectoryProgressively(e,t,o={}){let i=o.maxFiles||1e3;try{let s=new V.RelativePattern(e,"**/*"),r=await V.workspace.findFiles(s,null,i);if(r.length===0){this._logger.debug(`No files found in directory: ${e.fsPath}`);return}return this._logger.info(`Processing directory progressively: ${r.length} files in ${e.fsPath}`),this.queueForProcessing(r,t,{priority:"normal",background:!0,...o})}catch(s){throw this._logger.error("Progressive directory processing failed",s),s}}async refreshInBackground(e,t,o={}){return this.queueForProcessing(e,t,{background:!0,priority:"low",...o})}async refreshVisible(e,t,o={}){return this.queueForProcessing(e,t,{background:!1,priority:"high",...o})}_chunkArray(e,t){let o=[];for(let i=0;i<e.length;i+=t)o.push(e.slice(i,i+t));return o}_sleep(e){return new Promise(t=>setTimeout(t,e))}_updateStatusBar(){if(!this._statusBar)return;let e=this._totalCount>0?Math.round(this._processedCount/this._totalCount*100):0;this._statusBar.text=`$(sync~spin) Processing files... ${e}% (${this._processedCount}/${this._totalCount})`,this._statusBar.tooltip="Explorer Dates is processing file decorations",this._statusBar.show()}_hideStatusBar(){this._statusBar&&this._statusBar.hide()}_updateMetrics(e){this._metrics.totalProcessingTime+=e,this._metrics.totalBatches>0&&(this._metrics.averageBatchTime=this._metrics.totalProcessingTime/this._metrics.totalBatches)}getMetrics(){return{...this._metrics,isProcessing:this._isProcessing,queueLength:this._processingQueue.length,currentProgress:this._totalCount>0?this._processedCount/this._totalCount:0}}cancelAll(){this._processingQueue.length=0,this._hideStatusBar(),this._logger.info("All batch processing cancelled")}cancelBatch(e){let t=this._processingQueue.findIndex(o=>o.id===e);if(t!==-1){let o=this._processingQueue.splice(t,1)[0];return this._logger.debug(`Cancelled batch ${e} with ${o.uris.length} URIs`),!0}return!1}dispose(){this.cancelAll(),this._statusBar&&this._statusBar.dispose(),this._logger.info("BatchProcessor disposed",this.getMetrics())}};d(Ee,"BatchProcessor");var Me=Ee;ft.exports={BatchProcessor:Me}});var te=S((Gi,vt)=>{var xo=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],Do={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"};vt.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:xo,GLOBAL_STATE_KEYS:Do}});var _t=S((Ki,Ct)=>{var bt=require("vscode"),{getLogger:So}=A(),{fileSystem:Fo}=j(),{GLOBAL_STATE_KEYS:yt,DEFAULT_PERSISTENT_CACHE_TTL:To}=te(),Pe=class Pe{constructor(e){this._logger=So(),this._context=e,this._memoryCache=new Map,this._cacheMetadata=new Map,this._maxMemoryUsage=50*1024*1024,this._currentMemoryUsage=0,this._persistentCacheEnabled=!0,this._storage=(e==null?void 0:e.globalState)||null,this._storageKey=yt.ADVANCED_CACHE,this._metadataKey=yt.ADVANCED_CACHE_METADATA,this._fs=Fo,this._metrics={memoryHits:0,memoryMisses:0,diskHits:0,diskMisses:0,evictions:0,persistentLoads:0,persistentSaves:0},this._cleanupInterval=null,this._saveInterval=null,this._logger.info("AdvancedCache initialized")}async initialize(){try{await this._loadConfiguration(),this._persistentCacheEnabled&&await this._loadPersistentCache(),this._startIntervals(),this._logger.info("Advanced cache system initialized",{persistentEnabled:this._persistentCacheEnabled&&!!this._storage,maxMemoryUsage:this._maxMemoryUsage,storage:this._storage?"globalState":"memory-only"})}catch(e){this._logger.error("Failed to initialize cache system",e)}}async _loadConfiguration(){let e=bt.workspace.getConfiguration("explorerDates");this._persistentCacheEnabled=e.get("persistentCache",!0),this._maxMemoryUsage=e.get("maxMemoryUsage",50)*1024*1024,bt.workspace.onDidChangeConfiguration(t=>{(t.affectsConfiguration("explorerDates.persistentCache")||t.affectsConfiguration("explorerDates.maxMemoryUsage"))&&this._loadConfiguration()})}async get(e){if(this._memoryCache.has(e)){let t=this._memoryCache.get(e),o=this._cacheMetadata.get(e);if(this._isValid(o))return this._metrics.memoryHits++,this._updateAccessTime(e),t;this._removeFromMemory(e)}if(this._metrics.memoryMisses++,this._persistentCacheEnabled){let t=await this._getFromPersistentCache(e);if(t)return this._addToMemory(e,t.data,t.metadata),this._metrics.diskHits++,t.data}return this._metrics.diskMisses++,null}async set(e,t,o={}){let i={timestamp:Date.now(),lastAccess:Date.now(),size:this._estimateSize(t),ttl:o.ttl||To,tags:o.tags||[],version:o.version||1};this._addToMemory(e,t,i),this._persistentCacheEnabled&&this._schedulePersistentSave()}_addToMemory(e,t,o){this._currentMemoryUsage+o.size>this._maxMemoryUsage&&this._evictOldestItems(o.size),this._memoryCache.has(e)&&this._removeFromMemory(e),this._memoryCache.set(e,t),this._cacheMetadata.set(e,o),this._currentMemoryUsage+=o.size,this._logger.debug(`Added to cache: ${e} (${o.size} bytes)`)}_removeFromMemory(e){if(this._memoryCache.has(e)){let t=this._cacheMetadata.get(e);this._memoryCache.delete(e),this._cacheMetadata.delete(e),t&&(this._currentMemoryUsage-=t.size)}}_evictOldestItems(e){let t=Array.from(this._cacheMetadata.entries());t.sort((i,s)=>i[1].lastAccess-s[1].lastAccess);let o=0;for(let[i,s]of t)if(this._removeFromMemory(i),o+=s.size,this._metrics.evictions++,o>=e)break;this._logger.debug(`Evicted items to free ${o} bytes`)}_isValid(e){return e?Date.now()-e.timestamp<e.ttl:!1}_updateAccessTime(e){let t=this._cacheMetadata.get(e);t&&(t.lastAccess=Date.now())}_estimateSize(e){switch(typeof e){case"string":return e.length*2;case"number":return 8;case"boolean":return 4;case"object":return e===null?4:JSON.stringify(e).length*2;default:return 100}}async _loadPersistentCache(){if(!this._storage){let e=this._fs.isWeb?"web":"desktop";this._logger.debug(`Persistent storage unavailable in ${e} environment - running in memory-only mode`);return}try{let e=this._storage.get(this._storageKey,{}),t=0,o=0;for(let[i,s]of Object.entries(e))s&&this._isValid(s.metadata)?(this._addToMemory(i,s.data,s.metadata),t++):o++;this._metrics.persistentLoads++,this._logger.info(`Loaded persistent cache: ${t} items (${o} expired)`)}catch(e){this._logger.error("Failed to load persistent cache from globalState",e)}}async _savePersistentCache(){if(!(!this._persistentCacheEnabled||!this._storage))try{let e={};for(let[t,o]of this._memoryCache.entries()){let i=this._cacheMetadata.get(t);i&&this._isValid(i)&&(e[t]={data:o,metadata:i})}await this._storage.update(this._storageKey,e),this._metrics.persistentSaves++,this._logger.debug(`Saved persistent cache: ${Object.keys(e).length} items`)}catch(e){this._logger.error("Failed to save persistent cache to globalState",e)}}async _getFromPersistentCache(e){if(!this._storage)return null;let o=this._storage.get(this._storageKey,{})[e];return o&&this._isValid(o.metadata)?o:null}_schedulePersistentSave(){this._storage&&(this._saveTimeout&&clearTimeout(this._saveTimeout),this._saveTimeout=setTimeout(()=>{this._savePersistentCache()},5e3))}_startIntervals(){this._cleanupInterval=setInterval(()=>{this._cleanupExpiredItems()},300*1e3),this._storage&&this._persistentCacheEnabled&&(this._saveInterval=setInterval(()=>{this._savePersistentCache()},600*1e3))}_cleanupExpiredItems(){let e=[];for(let[t,o]of this._cacheMetadata.entries())this._isValid(o)||e.push(t);for(let t of e)this._removeFromMemory(t);e.length>0&&this._logger.debug(`Cleaned up ${e.length} expired cache items`)}invalidateByTags(e){let t=[];for(let[o,i]of this._cacheMetadata.entries())i.tags&&i.tags.some(s=>e.includes(s))&&t.push(o);for(let o of t)this._removeFromMemory(o);this._logger.debug(`Invalidated ${t.length} items by tags:`,e)}invalidateByPattern(e){let t=[],o=new RegExp(e);for(let i of this._memoryCache.keys())o.test(i)&&t.push(i);for(let i of t)this._removeFromMemory(i);this._logger.debug(`Invalidated ${t.length} items by pattern: ${e}`)}clear(){this._memoryCache.clear(),this._cacheMetadata.clear(),this._currentMemoryUsage=0,this._logger.info("Cache cleared")}getStats(){let e=this._metrics.memoryHits+this._metrics.memoryMisses>0?(this._metrics.memoryHits/(this._metrics.memoryHits+this._metrics.memoryMisses)*100).toFixed(2):"0",t=this._metrics.diskHits+this._metrics.diskMisses>0?(this._metrics.diskHits/(this._metrics.diskHits+this._metrics.diskMisses)*100).toFixed(2):"0";return{...this._metrics,memoryItems:this._memoryCache.size,memoryUsage:this._currentMemoryUsage,memoryUsagePercent:(this._currentMemoryUsage/this._maxMemoryUsage*100).toFixed(2),memoryHitRate:`${e}%`,diskHitRate:`${t}%`,persistentEnabled:this._persistentCacheEnabled}}async dispose(){this._cleanupInterval&&clearInterval(this._cleanupInterval),this._saveInterval&&clearInterval(this._saveInterval),this._saveTimeout&&clearTimeout(this._saveTimeout),this._persistentCacheEnabled&&this._storage&&await this._savePersistentCache(),this.clear(),this._logger.info("Advanced cache disposed",this.getStats())}};d(Pe,"AdvancedCache");var Ae=Pe;Ct.exports={AdvancedCache:Ae}});var Dt=S((Ji,xt)=>{var g=require("vscode"),{getLogger:ko}=A(),{getExtension:$o}=O(),ze=class ze{constructor(){this._logger=ko(),this._currentThemeKind=g.window.activeColorTheme.kind,this._themeChangeListeners=[],this._setupThemeChangeDetection(),this._logger.info("ThemeIntegrationManager initialized",{currentTheme:this._getThemeKindName(this._currentThemeKind)})}_setupThemeChangeDetection(){g.window.onDidChangeActiveColorTheme(e=>{let t=this._currentThemeKind;this._currentThemeKind=e.kind,this._logger.debug("Theme changed",{from:this._getThemeKindName(t),to:this._getThemeKindName(e.kind)}),this._themeChangeListeners.forEach(o=>{try{o(e,t)}catch(i){this._logger.error("Theme change listener failed",i)}})})}_getThemeKindName(e){switch(e){case g.ColorThemeKind.Light:return"Light";case g.ColorThemeKind.Dark:return"Dark";case g.ColorThemeKind.HighContrast:return"High Contrast";default:return"Unknown"}}onThemeChange(e){return this._themeChangeListeners.push(e),{dispose:d(()=>{let t=this._themeChangeListeners.indexOf(e);t!==-1&&this._themeChangeListeners.splice(t,1)},"dispose")}}getAdaptiveColors(){let e=this._currentThemeKind===g.ColorThemeKind.Light;return this._currentThemeKind===g.ColorThemeKind.HighContrast?this._getHighContrastColors():e?this._getLightThemeColors():this._getDarkThemeColors()}_getLightThemeColors(){return{veryRecent:new g.ThemeColor("list.highlightForeground"),recent:new g.ThemeColor("list.warningForeground"),old:new g.ThemeColor("list.errorForeground"),javascript:new g.ThemeColor("symbolIcon.functionForeground"),css:new g.ThemeColor("symbolIcon.colorForeground"),html:new g.ThemeColor("symbolIcon.snippetForeground"),json:new g.ThemeColor("symbolIcon.stringForeground"),markdown:new g.ThemeColor("symbolIcon.textForeground"),python:new g.ThemeColor("symbolIcon.classForeground"),subtle:new g.ThemeColor("list.inactiveSelectionForeground"),muted:new g.ThemeColor("list.deemphasizedForeground"),emphasis:new g.ThemeColor("list.highlightForeground")}}_getDarkThemeColors(){return{veryRecent:new g.ThemeColor("list.highlightForeground"),recent:new g.ThemeColor("charts.yellow"),old:new g.ThemeColor("charts.red"),javascript:new g.ThemeColor("symbolIcon.functionForeground"),css:new g.ThemeColor("charts.purple"),html:new g.ThemeColor("charts.orange"),json:new g.ThemeColor("symbolIcon.stringForeground"),markdown:new g.ThemeColor("charts.yellow"),python:new g.ThemeColor("symbolIcon.classForeground"),subtle:new g.ThemeColor("list.inactiveSelectionForeground"),muted:new g.ThemeColor("list.deemphasizedForeground"),emphasis:new g.ThemeColor("list.highlightForeground")}}_getHighContrastColors(){return{veryRecent:new g.ThemeColor("list.highlightForeground"),recent:new g.ThemeColor("list.warningForeground"),old:new g.ThemeColor("list.errorForeground"),javascript:new g.ThemeColor("list.highlightForeground"),css:new g.ThemeColor("list.warningForeground"),html:new g.ThemeColor("list.errorForeground"),json:new g.ThemeColor("list.highlightForeground"),markdown:new g.ThemeColor("list.warningForeground"),python:new g.ThemeColor("list.errorForeground"),subtle:new g.ThemeColor("list.highlightForeground"),muted:new g.ThemeColor("list.inactiveSelectionForeground"),emphasis:new g.ThemeColor("list.focusHighlightForeground")}}getColorForContext(e,t="normal"){let o=this.getAdaptiveColors();switch(e){case"success":case"recent":return t==="subtle"?o.subtle:o.veryRecent;case"warning":case"medium":return t==="subtle"?o.muted:o.recent;case"error":case"old":return t==="subtle"?o.emphasis:o.old;case"javascript":case"typescript":return o.javascript;case"css":case"scss":case"less":return o.css;case"html":case"xml":return o.html;case"json":case"yaml":return o.json;case"markdown":case"text":return o.markdown;case"python":return o.python;default:return t==="subtle"?o.muted:o.subtle}}applyThemeAwareColorScheme(e,t="",o=0){if(e==="none")return;if(e==="adaptive")return this._getAdaptiveColorForFile(t,o);let i=this.getAdaptiveColors();switch(e){case"recency":return o<36e5?i.veryRecent:o<864e5?i.recent:i.old;case"file-type":return this._getFileTypeColor(t);case"subtle":return o<36e5?i.subtle:o<6048e5?i.muted:i.emphasis;case"vibrant":return this._getVibrantSelectionAwareColor(o);default:return}}_getVibrantSelectionAwareColor(e){return e<36e5?new g.ThemeColor("list.highlightForeground"):e<864e5?new g.ThemeColor("list.warningForeground"):new g.ThemeColor("list.errorForeground")}_getAdaptiveColorForFile(e,t){let o=this._getFileTypeColor(e);if(o)return o;let i=this.getAdaptiveColors();return t<36e5?i.veryRecent:t<864e5?i.recent:i.old}_getFileTypeColor(e){let t=$o(e),o=this.getAdaptiveColors();return[".js",".ts",".jsx",".tsx",".mjs"].includes(t)?o.javascript:[".css",".scss",".sass",".less",".stylus"].includes(t)?o.css:[".html",".htm",".xml",".svg"].includes(t)?o.html:[".json",".yaml",".yml",".toml"].includes(t)?o.json:[".md",".markdown",".txt",".rst"].includes(t)?o.markdown:[".py",".pyx",".pyi"].includes(t)?o.python:null}getSuggestedColorScheme(){switch(this._currentThemeKind){case g.ColorThemeKind.Light:return"vibrant";case g.ColorThemeKind.Dark:return"recency";case g.ColorThemeKind.HighContrast:return"none";default:return"recency"}}getIconThemeIntegration(){return{iconTheme:g.workspace.getConfiguration("workbench").get("iconTheme"),suggestions:{"vs-seti":{recommendedColorScheme:"file-type",description:"File-type colors complement Seti icons perfectly"},"material-icon-theme":{recommendedColorScheme:"subtle",description:"Subtle colors work well with Material icons"},"vscode-icons":{recommendedColorScheme:"recency",description:"Recency-based colors pair nicely with VS Code icons"}}}}async autoConfigureForTheme(){try{let e=g.workspace.getConfiguration("explorerDates"),t=e.get("colorScheme","none");if(t==="none"||t==="auto"){let o=this.getSuggestedColorScheme();await e.update("colorScheme",o,g.ConfigurationTarget.Global),this._logger.info(`Auto-configured color scheme for ${this._getThemeKindName(this._currentThemeKind)} theme: ${o}`),await g.window.showInformationMessage(`Explorer Dates adapted to your ${this._getThemeKindName(this._currentThemeKind)} theme`,"Customize","OK")==="Customize"&&await g.commands.executeCommand("workbench.action.openSettings","explorerDates.colorScheme")}}catch(e){this._logger.error("Failed to auto-configure for theme",e)}}getCurrentThemeInfo(){return{kind:this._currentThemeKind,kindName:this._getThemeKindName(this._currentThemeKind),isLight:this._currentThemeKind===g.ColorThemeKind.Light,isDark:this._currentThemeKind===g.ColorThemeKind.Dark,isHighContrast:this._currentThemeKind===g.ColorThemeKind.HighContrast,suggestedColorScheme:this.getSuggestedColorScheme(),adaptiveColors:this.getAdaptiveColors()}}dispose(){this._themeChangeListeners.length=0,this._logger.info("ThemeIntegrationManager disposed")}};d(ze,"ThemeIntegrationManager");var Ie=ze;xt.exports={ThemeIntegrationManager:Ie}});var Ft=S((Yi,St)=>{var L=require("vscode"),{getLogger:Mo}=A(),{getLocalization:Eo}=ee(),{getFileName:Ao}=O(),Le=class Le{constructor(){this._logger=Mo(),this._l10n=Eo(),this._isAccessibilityMode=!1,this._keyboardNavigationEnabled=!0,this._focusIndicators=new Map,this._loadConfiguration(),this._setupConfigurationListener(),this._logger.info("AccessibilityManager initialized",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled})}_loadConfiguration(){let e=L.workspace.getConfiguration("explorerDates");this._isAccessibilityMode=e.get("accessibilityMode",!1),!e.has("accessibilityMode")&&this._detectScreenReader()&&this._logger.info("Screen reader detected - consider enabling accessibility mode in settings"),this._keyboardNavigationEnabled=e.get("keyboardNavigation",!0)}_setupConfigurationListener(){L.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.accessibilityMode")||e.affectsConfiguration("explorerDates.keyboardNavigation"))&&(this._loadConfiguration(),this._logger.debug("Accessibility configuration updated",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled}))})}getAccessibleTooltip(e,t,o,i,s=null){if(!this._isAccessibilityMode)return null;let r=Ao(e),n=this._formatAccessibleDate(t),l=this._formatAccessibleDate(o),c=`File: ${r}. `;return c+=`Last modified: ${n}. `,c+=`Created: ${l}. `,i!==void 0&&(c+=`Size: ${this._formatAccessibleFileSize(i)}. `),s&&s.authorName&&(c+=`Last modified by: ${s.authorName}. `),c+=`Full path: ${e}`,c}_formatAccessibleDate(e){let o=new Date().getTime()-e.getTime(),i=Math.floor(o/(1e3*60)),s=Math.floor(o/(1e3*60*60)),r=Math.floor(o/(1e3*60*60*24));return i<1?"just now":i<60?`${i} ${i===1?"minute":"minutes"} ago`:s<24?`${s} ${s===1?"hour":"hours"} ago`:r<7?`${r} ${r===1?"day":"days"} ago`:e.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}_formatAccessibleFileSize(e){if(e<1024)return`${e} bytes`;let t=e/1024;if(t<1024)return`${Math.round(t)} kilobytes`;let o=t/1024;return`${Math.round(o*10)/10} megabytes`}getAccessibleBadge(e){if(!this._isAccessibilityMode)return e;let t=e.split("|"),o=t[0],i=t[1],s=t.length>2?t[2]:null,r=this._expandTimeAbbreviation(o);return i&&(r+=` ${this._expandSizeAbbreviation(i)}`),s&&(r+=` by ${s.replace("\u2022","")}`),r}_expandTimeAbbreviation(e){let t={m:" minutes ago",h:" hours ago",d:" days ago",w:" weeks ago",mo:" months ago",yr:" years ago",min:" minutes ago",hrs:" hours ago",day:" days ago",wk:" weeks ago"},o=e;for(let[i,s]of Object.entries(t))if(e.endsWith(i)){o=e.slice(0,-i.length)+s;break}return o}_expandSizeAbbreviation(e){if(!e.startsWith("~"))return e;let t=e.slice(1);return t.endsWith("B")?t.slice(0,-1)+" bytes":t.endsWith("K")?t.slice(0,-1)+" kilobytes":t.endsWith("M")?t.slice(0,-1)+" megabytes":t}createFocusIndicator(e,t){if(!this._keyboardNavigationEnabled)return null;let o=Math.random().toString(36).substr(2,9);return this._focusIndicators.set(o,{element:e,description:t,timestamp:Date.now()}),{id:o,dispose:d(()=>{this._focusIndicators.delete(o)},"dispose")}}announceToScreenReader(e,t="polite"){this._isAccessibilityMode&&(t==="assertive"?L.window.showWarningMessage(e):this._logger.debug("Screen reader announcement",{message:e,priority:t}))}getKeyboardShortcutHelp(){return[{key:"Ctrl+Shift+D (Cmd+Shift+D)",command:"Toggle date decorations",description:"Show or hide file modification times in Explorer"},{key:"Ctrl+Shift+C (Cmd+Shift+C)",command:"Copy file date",description:"Copy selected file's modification date to clipboard"},{key:"Ctrl+Shift+I (Cmd+Shift+I)",command:"Show file details",description:"Display detailed information about selected file"},{key:"Ctrl+Shift+R (Cmd+Shift+R)",command:"Refresh decorations",description:"Refresh all file modification time decorations"},{key:"Ctrl+Shift+A (Cmd+Shift+A)",command:"Show workspace activity",description:"Open workspace file activity analysis"},{key:"Ctrl+Shift+F (Cmd+Shift+F)",command:"Toggle fade old files",description:"Toggle fading effect for old files"}]}async showKeyboardShortcutsHelp(){let e=this.getKeyboardShortcutHelp();await L.window.showInformationMessage("Keyboard shortcuts help available in output panel","Show Shortcuts").then(t=>{if(t==="Show Shortcuts"){let o=L.window.createOutputChannel("Explorer Dates Shortcuts");o.appendLine("Explorer Dates Keyboard Shortcuts"),o.appendLine("====================================="),o.appendLine(""),e.forEach(i=>{o.appendLine(`${i.key}`),o.appendLine(`  Command: ${i.command}`),o.appendLine(`  Description: ${i.description}`),o.appendLine("")}),o.show()}})}shouldEnhanceAccessibility(){return this._isAccessibilityMode||this._detectScreenReader()}_detectScreenReader(){return L.workspace.getConfiguration("editor").get("accessibilitySupport")==="on"}getAccessibilityRecommendations(){let e=[];return this._detectScreenReader()&&(e.push({type:"setting",setting:"explorerDates.accessibilityMode",value:!0,reason:"Enable enhanced tooltips and screen reader optimizations"}),e.push({type:"setting",setting:"explorerDates.colorScheme",value:"none",reason:"Colors may not be useful with screen readers"}),e.push({type:"setting",setting:"explorerDates.dateDecorationFormat",value:"relative-long",reason:"Longer format is more descriptive for screen readers"})),L.window.activeColorTheme.kind===L.ColorThemeKind.HighContrast&&e.push({type:"setting",setting:"explorerDates.highContrastMode",value:!0,reason:"Optimize for high contrast themes"}),e}async applyAccessibilityRecommendations(){let e=this.getAccessibilityRecommendations();if(e.length===0){L.window.showInformationMessage("No accessibility recommendations at this time.");return}let t=L.workspace.getConfiguration("explorerDates"),o=0;for(let i of e)if(i.type==="setting")try{await t.update(i.setting.replace("explorerDates.",""),i.value,L.ConfigurationTarget.Global),o++,this._logger.info(`Applied accessibility recommendation: ${i.setting} = ${i.value}`)}catch(s){this._logger.error(`Failed to apply recommendation: ${i.setting}`,s)}o>0&&L.window.showInformationMessage(`Applied ${o} accessibility recommendations. Restart may be required for all changes to take effect.`)}dispose(){this._focusIndicators.clear(),this._logger.info("AccessibilityManager disposed")}};d(Le,"AccessibilityManager");var Re=Le;St.exports={AccessibilityManager:Re}});var $t=S((Xi,kt)=>{var{MAX_BADGE_LENGTH:Tt}=te();function Po(a=0,e="auto"){let t=typeof a=="number"&&!Number.isNaN(a)?a:0;if(e==="bytes")return`~${t}B`;let o=t/1024;if(e==="kb")return`~${o.toFixed(1)}K`;let i=o/1024;return e==="mb"?`~${i.toFixed(1)}M`:t<1024?`~${t}B`:o<1024?`~${Math.round(o)}K`:`~${i.toFixed(1)}M`}d(Po,"formatFileSize");function Io(a){if(a)return a.length>Tt?a.substring(0,Tt):a}d(Io,"trimBadge");kt.exports={formatFileSize:Po,trimBadge:Io}});var Pt=S((ts,At)=>{var f=require("vscode"),{getLogger:zo}=A(),{getLocalization:Ro}=ee(),{fileSystem:Lo}=j(),{SmartExclusionManager:No}=mt(),{BatchProcessor:Wo}=wt(),{AdvancedCache:Oo}=_t(),{ThemeIntegrationManager:Bo}=Dt(),{AccessibilityManager:Uo}=Ft(),{formatFileSize:jo,trimBadge:Mt}=$t(),{getFileName:Ne,getExtension:de,getCacheKey:Ho,normalizePath:he,getRelativePath:qo,getUriPath:J}=O(),{DEFAULT_CACHE_TIMEOUT:Go,DEFAULT_MAX_CACHE_SIZE:Ko,MONTH_ABBREVIATIONS:Vo,GLOBAL_STATE_KEYS:Jo}=te(),{isWebEnvironment:Qo}=Se(),H=d((a="")=>{let e=typeof a=="string"?a:J(a),t=he(e);return Ne(t)||t||"unknown"},"describeFile"),Et=!1,oe=null;if(!Et)try{let{exec:a}=require("child_process"),{promisify:e}=require("util");oe=e(a)}catch{oe=null}var Oe=class Oe{constructor(){this._onDidChangeFileDecorations=new f.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event,this._decorationCache=new Map,this._cacheTimeout=Go,this._maxCacheSize=Ko,this._fileSystem=Lo,this._isWeb=Et||Qo(),this._gitAvailable=!this._isWeb&&!!oe,this._gitWarningShown=!1,this._cacheKeyStats=new Map,this._logger=zo(),this._l10n=Ro(),this._smartExclusion=new No,this._batchProcessor=new Wo,this._progressiveLoadingJobs=new Set,this._progressiveLoadingEnabled=!1,this._advancedCache=null,this._themeIntegration=new Bo,this._accessibility=new Uo,this._metrics={totalDecorations:0,cacheHits:0,cacheMisses:0,errors:0},this._previewSettings=null,this._extensionContext=null,this._setupFileWatcher(),this._setupConfigurationWatcher(),this._logger.info("FileDateDecorationProvider initialized"),this._previewSettings=null}applyPreviewSettings(e){let t=!!this._previewSettings;e&&typeof e=="object"?(this._previewSettings=Object.assign({},e),this._logger.info("\u{1F504} Applied preview settings",this._previewSettings)):(this._previewSettings=null,this._logger.info("\u{1F504} Cleared preview settings"));let o=this._decorationCache.size;if(this._decorationCache.clear(),this._logger.info(`\u{1F5D1}\uFE0F Cleared memory cache (${o} items) for preview mode change`),this._advancedCache)try{typeof this._advancedCache.clear=="function"?(this._advancedCache.clear(),this._logger.info("\u{1F5D1}\uFE0F Cleared advanced cache for preview mode change")):this._logger.warn("\u26A0\uFE0F Advanced cache does not support clear operation")}catch(i){this._logger.warn("\u26A0\uFE0F Failed to clear advanced cache:",i.message)}this._previewSettings&&!t?this._logger.info("\u{1F3AD} Entered preview mode - caching disabled"):!this._previewSettings&&t&&this._logger.info("\u{1F3AD} Exited preview mode - caching re-enabled"),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Fired decoration refresh event for preview change")}async testDecorationProvider(){this._logger.info("\u{1F9EA} Testing decoration provider functionality...");let e=f.workspace.workspaceFolders;if(!e||e.length===0){this._logger.error("\u274C No workspace folders available for testing");return}let t=f.Uri.joinPath(e[0].uri,"package.json");try{let o=await this.provideFileDecoration(t);this._logger.info("\u{1F9EA} Test decoration result:",{file:"package.json",success:!!o,badge:o==null?void 0:o.badge,hasTooltip:!!(o!=null&&o.tooltip),hasColor:!!(o!=null&&o.color)}),this._onDidChangeFileDecorations.fire(t),this._logger.info("\u{1F504} Fired decoration change event for test file")}catch(o){this._logger.error("\u274C Test decoration failed:",o)}}forceRefreshAllDecorations(){this._logger.info("\u{1F504} Force refreshing ALL decorations..."),this._decorationCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Triggered global decoration refresh")}startProviderCallMonitoring(){this._providerCallCount=0,this._providerCallFiles=new Set;let e=this.provideFileDecoration.bind(this);this.provideFileDecoration=async(t,o)=>{this._providerCallCount++;let i=J(t)||(t==null?void 0:t.toString(!0))||"unknown";return this._providerCallFiles.add(he(i)),this._logger.info(`\u{1F50D} Provider called ${this._providerCallCount} times for: ${H(t||i)}`),await e(t,o)},this._logger.info("\u{1F4CA} Started provider call monitoring")}getProviderCallStats(){return{totalCalls:this._providerCallCount||0,uniqueFiles:this._providerCallFiles?this._providerCallFiles.size:0,calledFiles:this._providerCallFiles?Array.from(this._providerCallFiles):[]}}_setupFileWatcher(){let e=f.workspace.createFileSystemWatcher("**/*");e.onDidChange(t=>this.refreshDecoration(t)),e.onDidCreate(t=>this.refreshDecoration(t)),e.onDidDelete(t=>this.clearDecoration(t)),this._fileWatcher=e}_setupConfigurationWatcher(){f.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration("explorerDates")){this._logger.debug("Configuration changed, updating settings");let t=f.workspace.getConfiguration("explorerDates");this._cacheTimeout=t.get("cacheTimeout",3e4),this._maxCacheSize=t.get("maxCacheSize",1e4),(e.affectsConfiguration("explorerDates.showDateDecorations")||e.affectsConfiguration("explorerDates.dateDecorationFormat")||e.affectsConfiguration("explorerDates.excludedFolders")||e.affectsConfiguration("explorerDates.excludedPatterns")||e.affectsConfiguration("explorerDates.highContrastMode")||e.affectsConfiguration("explorerDates.fadeOldFiles")||e.affectsConfiguration("explorerDates.fadeThreshold")||e.affectsConfiguration("explorerDates.colorScheme")||e.affectsConfiguration("explorerDates.showGitInfo")||e.affectsConfiguration("explorerDates.customColors")||e.affectsConfiguration("explorerDates.showFileSize")||e.affectsConfiguration("explorerDates.fileSizeFormat"))&&this.refreshAll(),e.affectsConfiguration("explorerDates.progressiveLoading")&&this._applyProgressiveLoadingSetting().catch(o=>{this._logger.error("Failed to reconfigure progressive loading",o)})}})}async _applyProgressiveLoadingSetting(){if(!this._batchProcessor)return;let t=f.workspace.getConfiguration("explorerDates").get("progressiveLoading",!0);if(this._progressiveLoadingEnabled=t,!t){this._logger.info("Progressive loading disabled via explorerDates.progressiveLoading"),this._cancelProgressiveWarmupJobs();return}let o=f.workspace.workspaceFolders;!o||o.length===0||(this._cancelProgressiveWarmupJobs(),o.forEach(i=>{let s=this._batchProcessor.processDirectoryProgressively(i.uri,async r=>{try{await this.provideFileDecoration(r)}catch(n){this._logger.debug("Progressive warmup processor failed",n)}},{background:!0,priority:"low",maxFiles:500});s&&this._progressiveLoadingJobs.add(s)}),this._logger.info(`Progressive loading queued for ${o.length} workspace folder(s).`))}_cancelProgressiveWarmupJobs(){if(!(!this._progressiveLoadingJobs||this._progressiveLoadingJobs.size===0)){if(this._batchProcessor)for(let e of this._progressiveLoadingJobs)this._batchProcessor.cancelBatch(e);this._progressiveLoadingJobs.clear()}}refreshDecoration(e){let t=this._getCacheKey(e);if(this._decorationCache.delete(t),this._advancedCache)try{this._advancedCache.invalidateByPattern(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}catch(o){this._logger.debug(`Could not invalidate advanced cache for ${H(e)}: ${o.message}`)}this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F504} Refreshed decoration cache for: ${H(e)}`)}clearDecoration(e){let t=this._getCacheKey(e);this._decorationCache.delete(t),this._advancedCache&&this._logger.debug(`Advanced cache entry will expire naturally: ${H(e)}`),this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F5D1}\uFE0F Cleared decoration cache for: ${H(e)}`)}clearAllCaches(){let e=this._decorationCache.size;this._decorationCache.clear(),this._logger.info(`Cleared memory cache (was ${e} items)`),this._advancedCache&&(this._advancedCache.clear(),this._logger.info("Cleared advanced cache")),this._metrics.cacheHits=0,this._metrics.cacheMisses=0,this._logger.info("All caches cleared successfully")}refreshAll(){this._decorationCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("All decorations refreshed with cache clear")}async _isExcludedSimple(e){let t=f.workspace.getConfiguration("explorerDates"),o=J(e);if(!o)return!1;let i=he(o),s=Ne(i),r=de(o),n=t.get("forceShowForFileTypes",[]);if(n.length>0&&n.includes(r))return this._logger.debug(`File type ${r} is forced to show: ${o}`),!1;let l=t.get("enableTroubleShootingMode",!1);l&&this._logger.info(`\u{1F50D} Checking exclusion for: ${s} (ext: ${r})`);let c=t.get("excludedFolders",["node_modules",".git","dist","build","out",".vscode-test"]),h=t.get("excludedPatterns",["**/*.tmp","**/*.log","**/.git/**","**/node_modules/**"]);for(let u of c){let m=u.replace(/^\/+|\/+$/g,"");if(i.includes(`/${m}/`)||i.endsWith(`/${m}`))return l?this._logger.info(`\u274C File excluded by folder: ${o} (${u})`):this._logger.debug(`File excluded by folder: ${o} (${u})`),!0}for(let u of h)if(u.includes("node_modules")&&i.includes("/node_modules/")||u.includes(".git/**")&&i.includes("/.git/")||u.includes("*.tmp")&&s.endsWith(".tmp")||u.includes("*.log")&&s.endsWith(".log"))return!0;return l&&this._logger.info(`\u2705 File NOT excluded: ${s} (ext: ${r})`),!1}async _isExcluded(e){let t=f.workspace.getConfiguration("explorerDates"),o=J(e);if(!o)return!1;let i=he(o),s=Ne(i),r=f.workspace.getWorkspaceFolder(e);if(r){let n=await this._smartExclusion.getCombinedExclusions(r.uri);for(let l of n.folders)if(new RegExp(`(^|/)${l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(i))return this._logger.debug(`File excluded by folder rule: ${o} (folder: ${l})`),!0;for(let l of n.patterns){let c=l.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),h=new RegExp(c);if(h.test(i)||h.test(s))return this._logger.debug(`File excluded by pattern: ${o} (pattern: ${l})`),!0}}else{let n=t.get("excludedFolders",[]),l=t.get("excludedPatterns",[]);for(let c of n)if(new RegExp(`(^|/)${c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(i))return!0;for(let c of l){let h=c.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),u=new RegExp(h);if(u.test(i)||u.test(s))return!0}}return!1}_manageCacheSize(){if(this._decorationCache.size>this._maxCacheSize){this._logger.debug(`Cache size (${this._decorationCache.size}) exceeds max (${this._maxCacheSize}), cleaning old entries`);let e=Math.floor(this._maxCacheSize*.2),t=Array.from(this._decorationCache.entries());t.sort((o,i)=>o[1].timestamp-i[1].timestamp);for(let o=0;o<e&&o<t.length;o++)this._decorationCache.delete(t[o][0]);this._logger.debug(`Removed ${e} old cache entries`)}}async _getCachedDecoration(e,t){if(this._advancedCache)try{let i=await this._advancedCache.get(e);if(i)return this._metrics.cacheHits++,this._logger.debug(`\u{1F9E0} Advanced cache hit for: ${t}`),i}catch(i){this._logger.debug(`Advanced cache error: ${i.message}`)}let o=this._decorationCache.get(e);return o&&Date.now()-o.timestamp<this._cacheTimeout?(this._metrics.cacheHits++,this._logger.debug(`\u{1F4BE} Memory cache hit for: ${t}`),o.decoration):null}async _storeDecorationInCache(e,t,o){if(this._manageCacheSize(),this._decorationCache.set(e,{decoration:t,timestamp:Date.now()}),this._advancedCache)try{await this._advancedCache.set(e,t,{ttl:this._cacheTimeout}),this._logger.debug(`\u{1F9E0} Stored in advanced cache: ${o}`)}catch(i){this._logger.debug(`Failed to store in advanced cache: ${i.message}`)}}_formatDateBadge(e,t,o=null){let s=o!==null?o:new Date().getTime()-e.getTime(),r=Math.floor(s/(1e3*60)),n=Math.floor(s/(1e3*60*60)),l=Math.floor(s/(1e3*60*60*24)),c=Math.floor(l/7),h=Math.floor(l/30);switch(t){case"relative-short":case"relative-long":return r<1?"\u25CF\u25CF":r<60?`${Math.min(r,99)}m`:n<24?`${Math.min(n,23)}h`:l<7?`${l}d`:c<4?`${c}w`:h<12?`${h}M`:"1y";case"absolute-short":case"absolute-long":{let u=e.getDate();return`${Vo[e.getMonth()]}${u<10?"0"+u:u}`}case"technical":return r<60?`${r}m`:n<24?`${n}h`:`${l}d`;case"minimal":return n<1?"\u2022\u2022":n<24?"\u25CB\u25CB":"\u2500\u2500";default:return r<60?`${r}m`:n<24?`${n}h`:`${l}d`}}_formatFileSize(e,t="auto"){return jo(e,t)}_getColorByScheme(e,t,o=""){if(t==="none")return;let s=new Date().getTime()-e.getTime(),r=Math.floor(s/(1e3*60*60)),n=Math.floor(s/(1e3*60*60*24));switch(t){case"recency":return r<1?new f.ThemeColor("charts.green"):r<24?new f.ThemeColor("charts.yellow"):new f.ThemeColor("charts.red");case"file-type":{let l=de(o);return[".js",".ts",".jsx",".tsx"].includes(l)?new f.ThemeColor("charts.blue"):[".css",".scss",".less"].includes(l)?new f.ThemeColor("charts.purple"):[".html",".htm",".xml"].includes(l)?new f.ThemeColor("charts.orange"):[".json",".yaml",".yml"].includes(l)?new f.ThemeColor("charts.green"):[".md",".txt",".log"].includes(l)?new f.ThemeColor("charts.yellow"):[".py",".rb",".php"].includes(l)?new f.ThemeColor("charts.red"):new f.ThemeColor("editorForeground")}case"subtle":return r<1?new f.ThemeColor("editorInfo.foreground"):n<7?new f.ThemeColor("editorWarning.foreground"):new f.ThemeColor("editorError.foreground");case"vibrant":return r<1?new f.ThemeColor("terminal.ansiGreen"):r<24?new f.ThemeColor("terminal.ansiYellow"):n<7?new f.ThemeColor("terminal.ansiMagenta"):new f.ThemeColor("terminal.ansiRed");case"custom":{let c=f.workspace.getConfiguration("explorerDates").get("customColors",{veryRecent:"#00ff00",recent:"#ffff00",old:"#ff0000"});return r<1?c.veryRecent.toLowerCase().includes("green")||c.veryRecent==="#00ff00"?new f.ThemeColor("terminal.ansiGreen"):new f.ThemeColor("editorInfo.foreground"):r<24?c.recent.toLowerCase().includes("yellow")||c.recent==="#ffff00"?new f.ThemeColor("terminal.ansiYellow"):new f.ThemeColor("editorWarning.foreground"):c.old.toLowerCase().includes("red")||c.old==="#ff0000"?new f.ThemeColor("terminal.ansiRed"):new f.ThemeColor("editorError.foreground")}default:return}}_generateBadgeDetails({filePath:e,stat:t,diffMs:o,dateFormat:i,badgePriority:s,showFileSize:r,fileSizeFormat:n,gitBlame:l,showGitInfo:c}){let h=this._formatDateBadge(t.mtime,i,o),u=this._formatDateReadable(t.mtime),m=this._formatDateReadable(t.birthtime),p=h;if(this._logger.debug(`\u{1F3F7}\uFE0F Badge generation for ${H(e)}: badgePriority=${s}, showGitInfo=${c}, hasGitBlame=${!!l}, authorName=${l==null?void 0:l.authorName}, previewMode=${!!this._previewSettings}`),s==="author"&&(l!=null&&l.authorName)){let v=this._getInitials(l.authorName);v&&(p=v,this._logger.debug(`\u{1F3F7}\uFE0F Using author initials badge: "${v}" (from ${l.authorName})`))}else if(s==="size"&&r){let v=this._formatCompactSize(t.size);v&&(p=v,this._logger.debug(`\u{1F3F7}\uFE0F Using size badge: "${v}"`))}else this._logger.debug(`\u{1F3F7}\uFE0F Using time badge: "${h}" (badgePriority=${s})`);return{badge:h,displayBadge:p,readableModified:u,readableCreated:m,fileSizeLabel:r?this._formatFileSize(t.size,n):null}}async _buildTooltipContent({filePath:e,resourceUri:t,stat:o,badgeDetails:i,gitBlame:s,shouldUseAccessibleTooltips:r,fileSizeFormat:n,isCodeFile:l}){let c=H(e),h=de(e);if(r){let p=this._accessibility.getAccessibleTooltip(e,o.mtime,o.birthtime,o.size,s);if(p)return this._logger.info(`\u{1F50D} Using accessible tooltip (${p.length} chars): "${p.substring(0,50)}..."`),p;this._logger.info("\u{1F50D} Accessible tooltip generation failed, using rich tooltip")}let u=`\u{1F4C4} File: ${c}
`;u+=`\u{1F4DD} Last Modified: ${i.readableModified}
`,u+=`   ${this._formatFullDate(o.mtime)}

`,u+=`\u{1F4C5} Created: ${i.readableCreated}
`,u+=`   ${this._formatFullDate(o.birthtime)}

`;let m=i.fileSizeLabel||this._formatFileSize(o.size,n||"auto");if(u+=`\u{1F4CA} Size: ${m} (${o.size.toLocaleString()} bytes)
`,h&&(u+=`\u{1F3F7}\uFE0F Type: ${h.toUpperCase()} file
`),l)try{let p=t||e,B=(await this._fileSystem.readFile(p,"utf8")).split(`
`).length;u+=`\u{1F4CF} Lines: ${B.toLocaleString()}
`}catch{}return u+=`\u{1F4C2} Path: ${e}`,s&&(u+=`

\u{1F464} Last Modified By: ${s.authorName}`,s.authorEmail&&(u+=` (${s.authorEmail})`),s.authorDate&&(u+=`
   ${s.authorDate}`)),u}_formatDateReadable(e){let t=new Date,o=t.getTime()-e.getTime(),i=Math.floor(o/(1e3*60)),s=Math.floor(o/(1e3*60*60)),r=Math.floor(o/(1e3*60*60*24));return i<1?this._l10n.getString("justNow"):i<60?this._l10n.getString("minutesAgo",i):s<24&&e.toDateString()===t.toDateString()?this._l10n.getString("hoursAgo",s):r<7?r===1?this._l10n.getString("yesterday"):this._l10n.getString("daysAgo",r):e.getFullYear()===t.getFullYear()?this._l10n.formatDate(e,{month:"short",day:"numeric"}):this._l10n.formatDate(e,{month:"short",day:"numeric",year:"numeric"})}async _getGitBlameInfo(e){if(!this._gitAvailable||!oe)return null;try{let t=f.workspace.getWorkspaceFolder(f.Uri.file(e));if(!t)return null;let o=t.uri.fsPath||t.uri.path,i=qo(o,e),{stdout:s}=await oe(`git log -1 --format="%an|%ae|%ad" -- "${i}"`,{cwd:t.uri.fsPath,timeout:2e3});if(!s||!s.trim())return null;let[r,n,l]=s.trim().split("|");return{authorName:r||"Unknown",authorEmail:n||"",authorDate:l||""}}catch{return null}}_getInitials(e){if(!e||typeof e!="string")return null;let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?null:t.length===1?t[0].substring(0,2).toUpperCase():(t[0][0]+(t[1][0]||"")).substring(0,2).toUpperCase()}_formatCompactSize(e){if(typeof e!="number"||isNaN(e))return null;let t=["B","K","M","G","T"],o=0,i=e;for(;i>=1024&&o<t.length-1;)i=i/1024,o++;let s=Math.round(i),r=t[o];if(s<=9)return`${s}${r}`;let n=String(s);return n.length>=2?n.slice(0,2):n}_formatFullDate(e){let t={year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"};return e.toLocaleString("en-US",t)}_getCacheKey(e){return Ho(J(e))}async provideFileDecoration(e,t){var i,s,r,n,l;let o=Date.now();try{if(!e){this._logger.error("\u274C Invalid URI provided to provideFileDecoration:",e);return}let c=J(e);if(!c){this._logger.error("\u274C Could not resolve path for URI in provideFileDecoration:",e);return}let h=H(c);this._logger.info(`\u{1F50D} VSCODE REQUESTED DECORATION: ${h} (${c})`),this._logger.info(`\u{1F4CA} Call context: token=${!!t}, cancelled=${t==null?void 0:t.isCancellationRequested}`);let u=f.workspace.getConfiguration("explorerDates"),m=d((E,rt)=>{if(this._previewSettings&&Object.prototype.hasOwnProperty.call(this._previewSettings,E)){let at=this._previewSettings[E];return this._logger.debug(`\u{1F3AD} Using preview value for ${E}: ${at} (config has: ${u.get(E,rt)})`),at}return u.get(E,rt)},"_get");if(this._previewSettings&&this._logger.info(`\u{1F3AD} Processing ${h} in PREVIEW MODE with settings:`,this._previewSettings),!m("showDateDecorations",!0)){this._logger.info(`\u274C RETURNED UNDEFINED: Decorations disabled globally for ${h}`);return}if(await this._isExcludedSimple(e)){this._logger.info(`\u274C File excluded: ${h}`);return}this._logger.debug(`\u{1F50D} Processing file: ${h}`);let p=this._getCacheKey(e);if(this._previewSettings)this._logger.debug(`\u{1F504} Skipping cache due to active preview settings for: ${h}`);else{let E=await this._getCachedDecoration(p,h);if(E)return E}if(this._metrics.cacheMisses++,this._logger.debug(`\u274C Cache miss for: ${h} (key: ${p.substring(0,50)}...)`),t!=null&&t.isCancellationRequested){this._logger.debug(`Decoration cancelled for: ${c}`);return}let v=await this._fileSystem.stat(e);if(!(typeof v.isFile=="function"?v.isFile():!0))return;let U=v.mtime instanceof Date?v.mtime:new Date(v.mtime),ge=v.birthtime instanceof Date?v.birthtime:new Date(v.birthtime||v.ctime||v.mtime),ie={mtime:U,birthtime:ge,size:v.size},X=Date.now()-U.getTime(),pe=m("dateDecorationFormat","smart"),I=m("colorScheme","none"),me=m("highContrastMode",!1),y=m("showFileSize",!1),G=m("fileSizeFormat","auto"),et=m("accessibilityMode",!1),Zt=m("fadeOldFiles",!1),Xt=m("fadeThreshold",30),tt=m("showGitInfo","none"),se=m("badgePriority","time"),fe=(tt!=="none"||se==="author")&&this._gitAvailable,ot=fe?tt:"none";se==="author"&&!fe&&(se="time");let it=fe?await this._getGitBlameInfo(c):null,we=this._generateBadgeDetails({filePath:c,stat:ie,diffMs:X,dateFormat:pe,badgePriority:se,showFileSize:y,fileSizeFormat:G,gitBlame:it,showGitInfo:ot}),eo=de(c),to=[".js",".ts",".jsx",".tsx",".py",".rb",".php",".java",".cpp",".c",".cs",".go",".rs",".kt",".swift"].includes(eo),st=et&&((i=this._accessibility)==null?void 0:i.shouldEnhanceAccessibility());this._logger.debug(`\u{1F50D} Tooltip generation for ${h}: accessibilityMode=${et}, shouldUseAccessible=${st}, previewMode=${!!this._previewSettings}`);let re=await this._buildTooltipContent({filePath:c,resourceUri:e,stat:ie,badgeDetails:we,gitBlame:ot==="none"?null:it,shouldUseAccessibleTooltips:st,fileSizeFormat:G,isCodeFile:to}),q;I!=="none"&&(q=this._themeIntegration?this._themeIntegration.applyThemeAwareColorScheme(I,c,X):this._getColorByScheme(U,I,c)),this._logger.debug(`\u{1F3A8} Color scheme setting: ${I}, using color: ${q?"yes":"no"}`),Zt&&Math.floor(X/864e5)>Xt&&(q=new f.ThemeColor("editorGutter.commentRangeForeground"));let ve=Mt(we.displayBadge)||Mt(we.badge)||"??";(s=this._accessibility)!=null&&s.shouldEnhanceAccessibility()&&(ve=this._accessibility.getAccessibleBadge(ve));let T;try{if(T=new f.FileDecoration(ve),re&&re.length<500&&(T.tooltip=re,this._logger.debug(`\u{1F4DD} Added tooltip (${re.length} chars)`)),q){let E=this._enhanceColorForSelection(q);T.color=E,this._logger.debug(`\u{1F3A8} Added enhanced color: ${E.id||E} (original: ${q.id||q})`)}T.propagate=!1}catch(E){this._logger.error("\u274C Failed to create decoration:",E),T=new f.FileDecoration("!!"),T.propagate=!1}if(this._logger.debug(`\u{1F3A8} Color/contrast check for ${h}: colorScheme=${I}, highContrastMode=${me}, hasColor=${!!q}, previewMode=${!!this._previewSettings}`),me&&(T.color=new f.ThemeColor("editorWarning.foreground"),this._logger.info(`\u{1F506} Applied high contrast color (overriding colorScheme=${I})`)),this._previewSettings?this._logger.debug(`\u{1F504} Skipping cache storage due to preview mode for: ${h}`):await this._storeDecorationInCache(p,T,h),this._metrics.totalDecorations++,!(T!=null&&T.badge)){this._logger.error(`\u274C Decoration badge is invalid for: ${h}`);return}let oo=Date.now()-o;return this._logger.info(`\u2705 Decoration created for: ${h} (badge: ${T.badge||"undefined"}) - Cache key: ${p.substring(0,30)}...`),this._logger.info("\u{1F3AF} RETURNING DECORATION TO VSCODE:",{file:h,badge:T.badge,hasTooltip:!!T.tooltip,hasColor:!!T.color,colorType:(n=(r=T.color)==null?void 0:r.constructor)==null?void 0:n.name,processingTimeMs:oo,decorationType:T.constructor.name}),T}catch(c){this._metrics.errors++;let h=o?Date.now()-o:0,u=H(e),m=J(e)||"unknown-uri";this._logger.error(`\u274C DECORATION ERROR for ${u}:`,{error:c.message,stack:(l=c.stack)==null?void 0:l.split(`
`)[0],processingTimeMs:h,uri:m}),this._logger.error(`\u274C CRITICAL ERROR DETAILS for ${u}: ${c.message}`),this._logger.error(`\u274C Error type: ${c.constructor.name}`),this._logger.error(`\u274C Full stack: ${c.stack}`),this._logger.info(`\u274C RETURNED UNDEFINED: Error occurred for ${u}`);return}}getMetrics(){let e={...this._metrics,cacheSize:this._decorationCache.size,cacheHitRate:this._metrics.cacheHits+this._metrics.cacheMisses>0?(this._metrics.cacheHits/(this._metrics.cacheHits+this._metrics.cacheMisses)*100).toFixed(2)+"%":"0.00%"};return this._advancedCache&&(e.advancedCache=this._advancedCache.getStats()),this._batchProcessor&&(e.batchProcessor=this._batchProcessor.getMetrics()),e.cacheDebugging={memoryCacheKeys:Array.from(this._decorationCache.keys()).slice(0,5),cacheTimeout:this._cacheTimeout,maxCacheSize:this._maxCacheSize,keyStatsSize:this._cacheKeyStats?this._cacheKeyStats.size:0},e}async initializeAdvancedSystems(e){try{if(this._extensionContext=e,this._isWeb&&await this._maybeWarnAboutGitLimitations(),this._advancedCache=new Oo(e),await this._advancedCache.initialize(),this._logger.info("Advanced cache initialized"),this._batchProcessor.initialize(),this._logger.info("Batch processor initialized"),await this._applyProgressiveLoadingSetting(),f.workspace.getConfiguration("explorerDates").get("autoThemeAdaptation",!0)&&(await this._themeIntegration.autoConfigureForTheme(),this._logger.info("Theme integration configured")),this._accessibility.shouldEnhanceAccessibility()&&(await this._accessibility.applyAccessibilityRecommendations(),this._logger.info("Accessibility recommendations applied")),f.workspace.workspaceFolders)for(let o of f.workspace.workspaceFolders)try{await this._smartExclusion.suggestExclusions(o.uri),this._logger.info(`Smart exclusions analyzed for: ${o.name}`)}catch(i){this._logger.error(`Failed to analyze smart exclusions for ${o.name}`,i)}this._logger.info("Advanced systems initialized successfully")}catch(t){this._logger.error("Failed to initialize advanced systems",t)}}async _maybeWarnAboutGitLimitations(){var e;if(!this._gitWarningShown){this._gitWarningShown=!0;try{let t=(e=this._extensionContext)==null?void 0:e.globalState,o=Jo.WEB_GIT_NOTICE;if(t==null?void 0:t.get(o,!1))return;if(t!=null&&t.update)try{await t.update(o,!0)}catch(s){this._logger.debug("Failed to persist Git limitation notice flag",s)}Promise.resolve().then(()=>{f.window.showInformationMessage("Explorer Dates: Git attribution badges are unavailable on VS Code for Web. Time-based decorations remain available.")})}catch(t){this._logger.debug("Failed to display Git limitation notice",t)}}}_enhanceColorForSelection(e){let t={"charts.yellow":"list.warningForeground","charts.red":"list.errorForeground","charts.green":"list.highlightForeground","charts.blue":"symbolIcon.functionForeground","charts.purple":"symbolIcon.classForeground","charts.orange":"list.warningForeground","terminal.ansiYellow":"list.warningForeground","terminal.ansiGreen":"list.highlightForeground","terminal.ansiRed":"list.errorForeground","terminal.ansiBlue":"symbolIcon.functionForeground","terminal.ansiMagenta":"symbolIcon.classForeground","terminal.ansiCyan":"symbolIcon.stringForeground","editorGutter.commentRangeForeground":"list.deemphasizedForeground","editorWarning.foreground":"list.warningForeground","editorError.foreground":"list.errorForeground","editorInfo.foreground":"list.highlightForeground"},o=e.id||e,i=t[o];return i?(this._logger.debug(`\u{1F527} Enhanced color ${o} \u2192 ${i} for better selection visibility`),new f.ThemeColor(i)):e}async dispose(){this._logger.info("Disposing FileDateDecorationProvider",this.getMetrics()),this._advancedCache&&await this._advancedCache.dispose(),this._cancelProgressiveWarmupJobs(),this._batchProcessor&&this._batchProcessor.dispose(),this._decorationCache.clear(),this._onDidChangeFileDecorations.dispose(),this._fileWatcher&&this._fileWatcher.dispose()}};d(Oe,"FileDateDecorationProvider");var We=Oe;At.exports={FileDateDecorationProvider:We}});var It=S((exports,module)=>{var vscode=require("vscode"),{fileSystem}=j(),{getFileName,getRelativePath}=O(),isWeb=!1,childProcess=null;function loadChildProcess(){return!childProcess&&!isWeb&&(childProcess=eval("require")("child_process")),childProcess}d(loadChildProcess,"loadChildProcess");function registerCoreCommands({context:a,fileDateProvider:e,logger:t,l10n:o}){let i=[];i.push(vscode.commands.registerCommand("explorerDates.refreshDateDecorations",()=>{try{if(e){e.clearAllCaches(),e.refreshAll();let s=(o==null?void 0:o.getString("refreshSuccess"))||"Date decorations refreshed - all caches cleared";vscode.window.showInformationMessage(s),t.info("Date decorations refreshed manually with cache clear")}}catch(s){t.error("Failed to refresh decorations",s),vscode.window.showErrorMessage(`Failed to refresh decorations: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.previewConfiguration",s=>{try{e&&(e.applyPreviewSettings(s),t.info("Configuration preview applied",s))}catch(r){t.error("Failed to apply configuration preview",r)}})),i.push(vscode.commands.registerCommand("explorerDates.clearPreview",()=>{try{e&&(e.applyPreviewSettings(null),t.info("Configuration preview cleared"))}catch(s){t.error("Failed to clear configuration preview",s)}})),i.push(vscode.commands.registerCommand("explorerDates.showMetrics",()=>{try{if(e){let s=e.getMetrics(),r=`Explorer Dates Metrics:
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
`)}`;vscode.window.showInformationMessage(n,{modal:!0}),t.info("Current configuration displayed",r)}catch(s){t.error("Failed to show configuration",s)}})),i.push(vscode.commands.registerCommand("explorerDates.resetToDefaults",async()=>{try{let s=vscode.workspace.getConfiguration("explorerDates");await s.update("highContrastMode",!1,vscode.ConfigurationTarget.Global),await s.update("badgePriority","time",vscode.ConfigurationTarget.Global),await s.update("accessibilityMode",!1,vscode.ConfigurationTarget.Global),vscode.window.showInformationMessage("Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately."),t.info("Reset problematic settings to defaults"),e&&(e.clearAllCaches(),e.refreshAll())}catch(s){t.error("Failed to reset settings",s),vscode.window.showErrorMessage(`Failed to reset settings: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.toggleDecorations",()=>{try{let s=vscode.workspace.getConfiguration("explorerDates"),r=s.get("showDateDecorations",!0);s.update("showDateDecorations",!r,vscode.ConfigurationTarget.Global);let n=r?(o==null?void 0:o.getString("decorationsDisabled"))||"Date decorations disabled":(o==null?void 0:o.getString("decorationsEnabled"))||"Date decorations enabled";vscode.window.showInformationMessage(n),t.info(`Date decorations toggled to: ${!r}`)}catch(s){t.error("Failed to toggle decorations",s),vscode.window.showErrorMessage(`Failed to toggle decorations: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.copyFileDate",async s=>{try{let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=await fileSystem.stat(r),l=(n.mtime instanceof Date?n.mtime:new Date(n.mtime)).toLocaleString();await vscode.env.clipboard.writeText(l),vscode.window.showInformationMessage(`Copied to clipboard: ${l}`),t.info(`File date copied for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to copy file date",r),vscode.window.showErrorMessage(`Failed to copy file date: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.showFileDetails",async s=>{try{let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=await fileSystem.stat(r),l=getFileName(r.fsPath||r.path),c=(e==null?void 0:e._formatFileSize(n.size,"auto"))||`${n.size} bytes`,h=(n.mtime instanceof Date?n.mtime:new Date(n.mtime)).toLocaleString(),u=(n.birthtime instanceof Date?n.birthtime:new Date(n.birthtime||n.mtime)).toLocaleString(),m=`File: ${l}
Size: ${c}
Modified: ${h}
Created: ${u}
Path: ${r.fsPath||r.path}`;vscode.window.showInformationMessage(m,{modal:!0}),t.info(`File details shown for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to show file details",r),vscode.window.showErrorMessage(`Failed to show file details: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.toggleFadeOldFiles",()=>{try{let s=vscode.workspace.getConfiguration("explorerDates"),r=s.get("fadeOldFiles",!1);s.update("fadeOldFiles",!r,vscode.ConfigurationTarget.Global);let n=r?"Fade old files disabled":"Fade old files enabled";vscode.window.showInformationMessage(n),t.info(`Fade old files toggled to: ${!r}`)}catch(s){t.error("Failed to toggle fade old files",s),vscode.window.showErrorMessage(`Failed to toggle fade old files: ${s.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.showFileHistory",async s=>{try{if(isWeb){vscode.window.showInformationMessage("Git history is unavailable on VS Code for Web.");return}let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}let n=vscode.workspace.getWorkspaceFolder(r);if(!n){vscode.window.showWarningMessage("File is not in a workspace");return}let c=`git log --oneline -10 -- "${getRelativePath(n.uri.fsPath||n.uri.path,r.fsPath||r.path)}"`;loadChildProcess().exec(c,{cwd:n.uri.fsPath,timeout:3e3},(u,m)=>{if(u){u.message.includes("not a git repository")?vscode.window.showWarningMessage("This file is not in a Git repository"):vscode.window.showErrorMessage(`Git error: ${u.message}`);return}if(!m.trim()){vscode.window.showInformationMessage("No Git history found for this file");return}let p=m.trim(),v=getFileName(r.fsPath||r.path);vscode.window.showInformationMessage(`Recent commits for ${v}:

${p}`,{modal:!0})}),t.info(`File history requested for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to show file history",r),vscode.window.showErrorMessage(`Failed to show file history: ${r.message}`)}})),i.push(vscode.commands.registerCommand("explorerDates.compareWithPrevious",async s=>{try{if(isWeb){vscode.window.showInformationMessage("Git comparisons are unavailable on VS Code for Web.");return}let r=s;if(!r&&vscode.window.activeTextEditor&&(r=vscode.window.activeTextEditor.document.uri),!r){vscode.window.showWarningMessage("No file selected");return}if(!vscode.workspace.getWorkspaceFolder(r)){vscode.window.showWarningMessage("File is not in a workspace");return}await vscode.commands.executeCommand("git.openChange",r),t.info(`Git diff opened for: ${r.fsPath||r.path}`)}catch(r){t.error("Failed to compare with previous version",r),vscode.window.showErrorMessage(`Failed to compare with previous version: ${r.message}`)}})),i.forEach(s=>a.subscriptions.push(s))}d(registerCoreCommands,"registerCoreCommands");module.exports={registerCoreCommands}});var Rt=S((ss,zt)=>{var $=require("vscode"),{getLogger:Yo}=A(),Ue=class Ue{constructor(e){this._logger=Yo(),this._provider=e,this._testResults=[]}async runComprehensiveDiagnostics(){var t,o;this._logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let e={timestamp:new Date().toISOString(),vscodeVersion:$.version,extensionVersion:(o=(t=$.extensions.getExtension("incredincomp.explorer-dates"))==null?void 0:t.packageJSON)==null?void 0:o.version,tests:{}};return e.tests.vscodeSettings=await this._testVSCodeSettings(),e.tests.providerRegistration=await this._testProviderRegistration(),e.tests.fileProcessing=await this._testFileProcessing(),e.tests.decorationCreation=await this._testDecorationCreation(),e.tests.cacheAnalysis=await this._testCacheAnalysis(),e.tests.extensionConflicts=await this._testExtensionConflicts(),e.tests.uriPathIssues=await this._testURIPathIssues(),this._logger.info("\u{1F50D} Comprehensive diagnostics completed",e),e}async _testVSCodeSettings(){let e=$.workspace.getConfiguration("explorer"),t=$.workspace.getConfiguration("workbench"),o=$.workspace.getConfiguration("explorerDates"),i={"explorer.decorations.badges":e.get("decorations.badges"),"explorer.decorations.colors":e.get("decorations.colors"),"workbench.colorTheme":t.get("colorTheme"),"explorerDates.showDateDecorations":o.get("showDateDecorations"),"explorerDates.colorScheme":o.get("colorScheme"),"explorerDates.showGitInfo":o.get("showGitInfo")},s=[];return i["explorer.decorations.badges"]===!1&&s.push("CRITICAL: explorer.decorations.badges is disabled"),i["explorer.decorations.colors"]===!1&&s.push("WARNING: explorer.decorations.colors is disabled"),i["explorerDates.showDateDecorations"]===!1&&s.push("CRITICAL: explorerDates.showDateDecorations is disabled"),{status:s.length>0?"ISSUES_FOUND":"OK",settings:i,issues:s}}async _testProviderRegistration(){let e=[];if(!this._provider)return e.push("CRITICAL: Decoration provider is null/undefined"),{status:"FAILED",issues:e};typeof this._provider.provideFileDecoration!="function"&&e.push("CRITICAL: provideFileDecoration method missing"),this._provider.onDidChangeFileDecorations||e.push("WARNING: onDidChangeFileDecorations event emitter missing");let t=$.Uri.file("/test/path");try{let o=await this._provider.provideFileDecoration(t);this._logger.debug("Provider test call completed",{result:!!o})}catch(o){e.push(`ERROR: Provider test call failed: ${o.message}`)}return{status:e.length>0?"ISSUES_FOUND":"OK",providerActive:!!this._provider,issues:e}}async _testFileProcessing(){let e=$.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace folders available"]};let t=[],o=[];try{let i=["package.json","README.md","extension.js","src/logger.js"];for(let s of i){let r=$.Uri.joinPath(e[0].uri,s);try{await $.workspace.fs.stat(r);let n=this._provider._isExcludedSimple?await this._provider._isExcludedSimple(r):!1,l=await this._provider.provideFileDecoration(r);t.push({file:s,exists:!0,excluded:n,hasDecoration:!!l,badge:l==null?void 0:l.badge,uri:r.toString()})}catch(n){t.push({file:s,exists:!1,error:n.message})}}}catch(i){o.push(`File processing test failed: ${i.message}`)}return{status:o.length>0?"ISSUES_FOUND":"OK",testFiles:t,issues:o}}async _testDecorationCreation(){let e=[],t=[];try{let i=new $.FileDecoration("test");e.push({name:"Simple decoration",success:!0,badge:i.badge})}catch(i){e.push({name:"Simple decoration",success:!1,error:i.message}),t.push("CRITICAL: Cannot create simple FileDecoration")}try{let i=new $.FileDecoration("test","Test tooltip");e.push({name:"Decoration with tooltip",success:!0,hasTooltip:!!(i&&i.tooltip)})}catch(i){e.push({name:"Decoration with tooltip",success:!1,error:i.message}),t.push("WARNING: Cannot create FileDecoration with tooltip")}try{let i=new $.FileDecoration("test","Test tooltip",new $.ThemeColor("charts.red"));e.push({name:"Decoration with color",success:!0,hasColor:!!i.color})}catch(i){e.push({name:"Decoration with color",success:!1,error:i.message}),t.push("WARNING: Cannot create FileDecoration with color")}let o=["1d","10m","2h","!!","\u25CF\u25CF","JA12","123456789"];for(let i of o)try{let s=new $.FileDecoration(i);e.push({name:`Badge format: ${i}`,success:!0,badge:s.badge,length:i.length})}catch(s){e.push({name:`Badge format: ${i}`,success:!1,error:s.message}),i.length<=8&&t.push(`WARNING: Valid badge format '${i}' failed`)}return{status:t.length>0?"ISSUES_FOUND":"OK",tests:e,issues:t}}async _testCacheAnalysis(){var o;let e={memoryCache:{size:((o=this._provider._decorationCache)==null?void 0:o.size)||0,maxSize:this._provider._maxCacheSize||0},advancedCache:{available:!!this._provider._advancedCache,initialized:!1},metrics:this._provider.getMetrics?this._provider.getMetrics():null},t=[];return e.memoryCache.size>e.memoryCache.maxSize*.9&&t.push("WARNING: Memory cache is nearly full"),e.metrics&&e.metrics.cacheHits===0&&e.metrics.cacheMisses>10&&t.push("WARNING: Cache hit rate is 0% - potential cache key issues"),{status:t.length>0?"ISSUES_FOUND":"OK",cacheInfo:e,issues:t}}async _testExtensionConflicts(){var s,r;let e=$.extensions.all,t=[],o=[];for(let n of e){if(!n.isActive)continue;let l=n.packageJSON;(r=(s=l.contributes)==null?void 0:s.commands)!=null&&r.some(h=>{var u,m,p,v;return((u=h.command)==null?void 0:u.includes("decoration"))||((m=h.title)==null?void 0:m.includes("decoration"))||((p=h.title)==null?void 0:p.includes("badge"))||((v=h.title)==null?void 0:v.includes("explorer"))})&&o.push({id:n.id,name:l.displayName||l.name,version:l.version}),["file-icons","vscode-icons","material-icon-theme","explorer-exclude","hide-files","file-watcher"].some(h=>n.id.includes(h))&&t.push({id:n.id,name:l.displayName||l.name,reason:"Known to potentially interfere with file decorations"})}let i=[];return o.length>1&&i.push(`WARNING: ${o.length} extensions might provide file decorations`),t.length>0&&i.push(`WARNING: ${t.length} potentially conflicting extensions detected`),{status:i.length>0?"ISSUES_FOUND":"OK",decorationExtensions:o,potentialConflicts:t,issues:i}}async _testURIPathIssues(){let e=$.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace available for URI testing"]};let t=[],o=[],i=["package.json","src/logger.js","README.md",".gitignore"];for(let s of i){let r=$.Uri.joinPath(e[0].uri,s);t.push({path:s,scheme:r.scheme,fsPath:r.fsPath,authority:r.authority,valid:r.scheme==="file"&&r.fsPath.length>0}),r.scheme!=="file"&&o.push(`WARNING: Non-file URI scheme for ${s}: ${r.scheme}`),(r.fsPath.includes("\\\\")||r.fsPath.includes("//"))&&o.push(`WARNING: Potential path separator issues in ${s}`)}return{status:o.length>0?"ISSUES_FOUND":"OK",tests:t,issues:o}}};d(Ue,"DecorationDiagnostics");var Be=Ue;zt.exports={DecorationDiagnostics:Be}});var Nt=S((as,Lt)=>{var Q=require("vscode"),{getFileName:Zo}=O();async function Xo(){let a=A().getLogger();a.info("\u{1F3A8} Testing VS Code decoration rendering...");let i=class i{constructor(){this._onDidChangeFileDecorations=new Q.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event}provideFileDecoration(r){let n=Zo(r.fsPath||r.path),l=new Q.FileDecoration("TEST");return l.tooltip=`Test decoration for ${n}`,l.color=new Q.ThemeColor("charts.red"),a.info(`\u{1F9EA} Test provider returning decoration for: ${n}`),l}};d(i,"TestDecorationProvider");let e=i,t=new e,o=Q.window.registerFileDecorationProvider(t);return a.info("\u{1F9EA} Test decoration provider registered"),setTimeout(()=>{t._onDidChangeFileDecorations.fire(void 0),a.info("\u{1F504} Test decoration refresh triggered"),setTimeout(()=>{o.dispose(),a.info("\u{1F9EA} Test decoration provider disposed")},1e4)},1e3),"Test decoration provider registered for 10 seconds"}d(Xo,"testVSCodeDecorationRendering");async function ei(){let a=A().getLogger();a.info("\u{1F527} Testing FileDecoration API...");let e=[];try{let o=new Q.FileDecoration("MIN");e.push({name:"Minimal decoration",success:!0,badge:o.badge}),a.info("\u2705 Minimal decoration created successfully")}catch(o){e.push({name:"Minimal decoration",success:!1,error:o.message}),a.error("\u274C Minimal decoration failed:",o)}try{let o=new Q.FileDecoration("FULL","Full decoration tooltip",new Q.ThemeColor("charts.blue"));o.propagate=!1,e.push({name:"Full decoration",success:!0,badge:o.badge,hasTooltip:!!o.tooltip,hasColor:!!o.color,propagate:o.propagate}),a.info("\u2705 Full decoration created successfully")}catch(o){e.push({name:"Full decoration",success:!1,error:o.message}),a.error("\u274C Full decoration failed:",o)}let t=["charts.red","charts.blue","charts.green","charts.yellow","terminal.ansiRed","terminal.ansiGreen","terminal.ansiBlue","editorError.foreground","editorWarning.foreground","editorInfo.foreground"];for(let o of t)try{e.push({name:`ThemeColor: ${o}`,success:!0,colorId:o})}catch(i){e.push({name:`ThemeColor: ${o}`,success:!1,error:i.message}),a.error(`\u274C ThemeColor ${o} failed:`,i)}return e}d(ei,"testFileDecorationAPI");Lt.exports={testVSCodeDecorationRendering:Xo,testFileDecorationAPI:ei}});var Ot=S((cs,Wt)=>{var w=require("vscode"),{fileSystem:ti}=j(),{getFileName:oi,getRelativePath:ii}=O();function si({context:a,fileDateProvider:e,logger:t,generators:o}){let{generateWorkspaceActivityHTML:i,generatePerformanceAnalyticsHTML:s,generateDiagnosticsHTML:r,generateDiagnosticsWebview:n}=o,l=[];l.push(w.commands.registerCommand("explorerDates.showWorkspaceActivity",async()=>{try{let c=w.window.createWebviewPanel("workspaceActivity","Workspace File Activity",w.ViewColumn.One,{enableScripts:!0});if(!w.workspace.workspaceFolders){w.window.showWarningMessage("No workspace folder open");return}let h=w.workspace.workspaceFolders[0],u=[],m=await w.workspace.findFiles("**/*","**/node_modules/**",100);for(let p of m)try{let v=await ti.stat(p);(typeof v.isFile=="function"?v.isFile():!0)&&u.push({path:ii(h.uri.fsPath||h.uri.path,p.fsPath||p.path),modified:v.mtime instanceof Date?v.mtime:new Date(v.mtime),size:v.size})}catch{}u.sort((p,v)=>v.modified.getTime()-p.modified.getTime()),c.webview.html=i(u.slice(0,50)),t.info("Workspace activity panel opened")}catch(c){t.error("Failed to show workspace activity",c),w.window.showErrorMessage(`Failed to show workspace activity: ${c.message}`)}})),l.push(w.commands.registerCommand("explorerDates.showPerformanceAnalytics",async()=>{try{let c=w.window.createWebviewPanel("performanceAnalytics","Explorer Dates Performance Analytics",w.ViewColumn.One,{enableScripts:!0}),h=e?e.getMetrics():{};c.webview.html=s(h),t.info("Performance analytics panel opened")}catch(c){t.error("Failed to show performance analytics",c),w.window.showErrorMessage(`Failed to show performance analytics: ${c.message}`)}})),l.push(w.commands.registerCommand("explorerDates.debugCache",async()=>{try{if(e){let c=e.getMetrics(),h={"Cache Summary":{"Memory Cache Size":c.cacheSize,"Cache Hit Rate":c.cacheHitRate,"Total Hits":c.cacheHits,"Total Misses":c.cacheMisses,"Cache Timeout":`${c.cacheDebugging.cacheTimeout}ms`},"Advanced Cache":c.advancedCache||"Not available","Sample Cache Keys":c.cacheDebugging.memoryCacheKeys||[]};w.window.showInformationMessage(`Cache Debug Info:
${JSON.stringify(h,null,2)}`,{modal:!0}),t.info("Cache debug info displayed",h)}}catch(c){t.error("Failed to show cache debug info",c),w.window.showErrorMessage(`Failed to show cache debug info: ${c.message}`)}})),l.push(w.commands.registerCommand("explorerDates.runDiagnostics",async()=>{try{let c=w.workspace.getConfiguration("explorerDates"),h=w.window.activeTextEditor,u={"Extension Status":{"Provider Active":e?"Yes":"No","Decorations Enabled":c.get("showDateDecorations",!0)?"Yes":"No","VS Code Version":w.version,"Extension Version":a.extension.packageJSON.version}};if(h){let{uri:p}=h.document;p.scheme==="file"&&(u["Current File"]={"File Path":p.fsPath,"File Extension":oi(p.fsPath||p.path).split(".").pop()||"No extension","Is Excluded":e?await e._isExcludedSimple(p):"Unknown"})}if(u.Configuration={"Excluded Folders":c.get("excludedFolders",[]),"Excluded Patterns":c.get("excludedPatterns",[]),"Color Scheme":c.get("colorScheme","none"),"Cache Timeout":`${c.get("cacheTimeout",3e4)}ms`},e){let p=e.getMetrics();u.Performance={"Total Decorations":p.totalDecorations,"Cache Size":p.cacheSize,Errors:p.errors}}let m=w.window.createWebviewPanel("explorerDatesDiagnostics","Explorer Dates Diagnostics",w.ViewColumn.One,{enableScripts:!0});m.webview.html=r(u),t.info("Diagnostics panel opened",u)}catch(c){t.error("Failed to run diagnostics",c),w.window.showErrorMessage(`Failed to run diagnostics: ${c.message}`)}})),l.push(w.commands.registerCommand("explorerDates.testDecorations",async()=>{try{t.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let{DecorationDiagnostics:c}=Rt(),u=await new c(e).runComprehensiveDiagnostics(),m=w.window.createWebviewPanel("decorationDiagnostics","Decoration Diagnostics - Root Cause Analysis",w.ViewColumn.One,{enableScripts:!0});m.webview.html=n(u);let p=[],v=[];Object.values(u.tests).forEach(B=>{B.issues&&B.issues.forEach(U=>{U.startsWith("CRITICAL:")?p.push(U):U.startsWith("WARNING:")&&v.push(U)})}),p.length>0?w.window.showErrorMessage(`CRITICAL ISSUES FOUND: ${p.join(", ")}`):v.length>0?w.window.showWarningMessage(`Warnings found: ${v.length} potential issues detected. Check diagnostics panel.`):w.window.showInformationMessage("No critical issues found. Decorations should be working properly."),t.info("\u{1F50D} Comprehensive diagnostics completed",u)}catch(c){t.error("Failed to run comprehensive diagnostics",c),w.window.showErrorMessage(`Diagnostics failed: ${c.message}`)}})),l.push(w.commands.registerCommand("explorerDates.monitorDecorations",async()=>{if(!e){w.window.showErrorMessage("Decoration provider not available");return}e.startProviderCallMonitoring(),e.forceRefreshAllDecorations(),setTimeout(()=>{let c=e.getProviderCallStats(),h=`VS Code Decoration Requests: ${c.totalCalls} calls for ${c.uniqueFiles} files`;w.window.showInformationMessage(h),t.info("\u{1F50D} Decoration monitoring results:",c)},5e3),w.window.showInformationMessage("Started monitoring VS Code decoration requests. Results in 5 seconds...")})),l.push(w.commands.registerCommand("explorerDates.testVSCodeRendering",async()=>{try{let{testVSCodeDecorationRendering:c,testFileDecorationAPI:h}=Nt();t.info("\u{1F3A8} Testing VS Code decoration rendering system...");let u=await h();t.info("\u{1F527} FileDecoration API tests:",u);let m=await c();t.info("\u{1F3A8} Decoration rendering test:",m),w.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.')}catch(c){t.error("Failed to test VS Code rendering:",c),w.window.showErrorMessage(`VS Code rendering test failed: ${c.message}`)}})),l.push(w.commands.registerCommand("explorerDates.quickFix",async()=>{try{let c=w.workspace.getConfiguration("explorerDates"),h=[];c.get("showDateDecorations",!0)||h.push({issue:"Date decorations are disabled",description:"Enable date decorations",fix:d(async()=>c.update("showDateDecorations",!0,w.ConfigurationTarget.Global),"fix")});let u=c.get("excludedPatterns",[]);if(u.includes("**/*")&&h.push({issue:"All files are excluded by pattern",description:"Remove overly broad exclusion pattern",fix:d(async()=>{let p=u.filter(v=>v!=="**/*");await c.update("excludedPatterns",p,w.ConfigurationTarget.Global)},"fix")}),h.length===0){w.window.showInformationMessage("No common issues detected. Decorations should be working.");return}let m=await w.window.showQuickPick(h.map(p=>({label:p.description,description:p.issue,fix:p.fix})),{placeHolder:"Select an issue to fix automatically"});m&&(await m.fix(),w.window.showInformationMessage("Fixed! Try refreshing decorations now."),e&&(e.clearAllCaches(),e.refreshAll()))}catch(c){t.error("Failed to run quick fix",c),w.window.showErrorMessage(`Failed to run quick fix: ${c.message}`)}})),l.push(w.commands.registerCommand("explorerDates.showKeyboardShortcuts",async()=>{try{e!=null&&e._accessibility?await e._accessibility.showKeyboardShortcutsHelp():w.window.showInformationMessage("Keyboard shortcuts: Ctrl+Shift+D (toggle), Ctrl+Shift+C (copy date), Ctrl+Shift+I (file details), Ctrl+Shift+R (refresh), Ctrl+Shift+A (workspace activity)"),t.info("Keyboard shortcuts help shown")}catch(c){t.error("Failed to show keyboard shortcuts help",c),w.window.showErrorMessage(`Failed to show keyboard shortcuts help: ${c.message}`)}})),l.forEach(c=>a.subscriptions.push(c))}d(si,"registerAnalysisCommands");Wt.exports={registerAnalysisCommands:si}});var Ut=S((ds,Bt)=>{var Z=require("vscode");function ri({context:a,logger:e,getOnboardingManager:t}){let o=[];o.push(Z.commands.registerCommand("explorerDates.showFeatureTour",async()=>{try{await t().showFeatureTour(),e.info("Feature tour opened")}catch(i){e.error("Failed to show feature tour",i),Z.window.showErrorMessage(`Failed to show feature tour: ${i.message}`)}})),o.push(Z.commands.registerCommand("explorerDates.showQuickSetup",async()=>{try{await t().showQuickSetupWizard(),e.info("Quick setup wizard opened")}catch(i){e.error("Failed to show quick setup wizard",i),Z.window.showErrorMessage(`Failed to show quick setup wizard: ${i.message}`)}})),o.push(Z.commands.registerCommand("explorerDates.showWhatsNew",async()=>{try{let i=a.extension.packageJSON.version;await t().showWhatsNew(i),e.info("What's new panel opened")}catch(i){e.error("Failed to show what's new",i),Z.window.showErrorMessage(`Failed to show what's new: ${i.message}`)}})),o.forEach(i=>a.subscriptions.push(i))}d(ri,"registerOnboardingCommands");Bt.exports={registerOnboardingCommands:ri}});var Ht=S((us,jt)=>{var C=require("vscode"),{getLogger:ai}=A(),{getLocalization:ni}=ee(),He=class He{constructor(e){this._context=e,this._logger=ai(),this._l10n=ni(),this._hasShownWelcome=e.globalState.get("explorerDates.hasShownWelcome",!1),this._hasCompletedSetup=e.globalState.get("explorerDates.hasCompletedSetup",!1),this._onboardingVersion=e.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this._hasShownWelcome,hasCompletedSetup:this._hasCompletedSetup,onboardingVersion:this._onboardingVersion})}async shouldShowOnboarding(){let e=this._context.extension.packageJSON.version;return!this._hasShownWelcome||!this._hasCompletedSetup||this._shouldShowVersionUpdate(e)}_shouldShowVersionUpdate(e){if(this._onboardingVersion==="0.0.0")return!0;let[t]=e.split(".").map(Number),[o]=this._onboardingVersion.split(".").map(Number);return t>o}_isMinorUpdate(e){if(this._onboardingVersion==="0.0.0")return!1;let[t,o]=e.split(".").map(Number),[i,s]=this._onboardingVersion.split(".").map(Number);return t===i&&o>s}async showWelcomeMessage(){try{let e=this._context.extension.packageJSON.version,t=this._hasShownWelcome,o=this._isMinorUpdate(e);if(o)return this._showGentleUpdateNotification(e);let i=t?`Explorer Dates has been updated to v${e} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!",s=t?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"],r=await C.window.showInformationMessage(i,{modal:!1},...s);switch(await this._context.globalState.update("explorerDates.hasShownWelcome",!0),await this._context.globalState.update("explorerDates.onboardingVersion",e),r){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(e);break;case"\u2699\uFE0F Settings":await C.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await C.commands.executeCommand("explorerDates.previewConfiguration",i.settings);break;case"clearPreview":await C.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action:r,isUpdate:t,isMinorUpdate:o})}catch(e){this._logger.error("Failed to show welcome message",e)}}async _showGentleUpdateNotification(e){let t=C.window.createStatusBarItem(C.StatusBarAlignment.Right,100);t.text=`$(check) Explorer Dates updated to v${e}`,t.tooltip="Click to see what's new in Explorer Dates",t.command="explorerDates.showWhatsNew",t.show(),setTimeout(()=>{t.dispose()},1e4),await this._context.globalState.update("explorerDates.onboardingVersion",e),this._logger.info("Showed gentle update notification",{version:e})}async showQuickSetupWizard(){try{let e=C.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",C.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateSetupWizardHTML(),e.webview.onDidReceiveMessage(async t=>{await this._handleSetupWizardMessage(t,e)}),this._logger.info("Quick setup wizard opened")}catch(e){this._logger.error("Failed to show setup wizard",e)}}async _handleSetupWizardMessage(e,t){try{switch(e.command){case"applyConfiguration":await this._applyQuickConfiguration(e.configuration),await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),C.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&(await C.commands.executeCommand("explorerDates.previewConfiguration",e.settings),this._logger.info("Configuration preview applied via webview",e.settings));break;case"clearPreview":await C.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await C.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(o){this._logger.error("Failed to handle setup wizard message",o)}}async _applyQuickConfiguration(e){let t=C.workspace.getConfiguration("explorerDates");if(e.preset){let i=this._getConfigurationPresets()[e.preset];if(i){this._logger.info(`Applying preset: ${e.preset}`,i.settings);for(let[s,r]of Object.entries(i.settings))await t.update(s,r,C.ConfigurationTarget.Global),this._logger.debug(`Updated setting: explorerDates.${s} = ${r}`);this._logger.info(`Applied preset: ${e.preset}`,i.settings),C.window.showInformationMessage(`Applied "${i.name}" configuration. Changes should be visible immediately!`)}}if(e.individual){for(let[o,i]of Object.entries(e.individual))await t.update(o,i,C.ConfigurationTarget.Global);this._logger.info("Applied individual settings",e.individual)}try{await C.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(o){this._logger.warn("Failed to refresh decorations after configuration change",o)}}_getConfigurationPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:30,enableContextMenu:!0,showStatusBar:!0}},powerUser:{name:"Power User",description:"Maximum information - all features enabled with vibrant colors",settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"both",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:14,enableContextMenu:!0,showStatusBar:!0,smartExclusions:!0,progressiveLoading:!0,persistentCache:!0}},gitFocused:{name:"Git-Focused",description:"Show author initials as badges with full Git information in tooltips",settings:{dateDecorationFormat:"smart",colorScheme:"file-type",highContrastMode:!1,showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}async showFeatureTour(){try{let e=C.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",C.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateFeatureTourHTML(),e.webview.onDidReceiveMessage(async t=>{t.command==="openSettings"?await C.commands.executeCommand("workbench.action.openSettings",t.setting||"explorerDates"):t.command==="runCommand"&&await C.commands.executeCommand(t.commandId)}),this._logger.info("Feature tour opened")}catch(e){this._logger.error("Failed to show feature tour",e)}}_generateSetupWizardHTML(){let e=this._getConfigurationPresets(),t={minimal:e.minimal,developer:e.developer,accessible:e.accessible};return`
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
        `}async showTipsAndTricks(){let e=[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."},{icon:"\u{1F4CA}",title:"Performance Analytics",description:'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'},{icon:"\u{1F50D}",title:"Context Menu",description:"Right-click any file to access Git history, file details, and quick actions."}],t=e[Math.floor(Math.random()*e.length)],o=`\u{1F4A1} **Tip**: ${t.title}
${t.description}`;await C.window.showInformationMessage(o,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(e){try{let t=C.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${e} - What's New`,C.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1});t.webview.html=this._generateWhatsNewHTML(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"openSettings":await C.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break;case"tryFeature":o.feature==="badgePriority"&&(await C.workspace.getConfiguration("explorerDates").update("badgePriority","author",C.ConfigurationTarget.Global),C.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":t.dispose();break}})}catch(t){this._logger.error("Failed to show what's new",t)}}_generateWhatsNewHTML(e){return`
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
        `}};d(He,"OnboardingManager");var je=He;jt.exports={OnboardingManager:je}});var Gt=S((ps,qt)=>{var _=require("vscode"),{getLogger:ci}=A(),{fileSystem:li}=j(),{GLOBAL_STATE_KEYS:di}=te(),M=ci(),Ge=class Ge{constructor(e){this._context=e,this._storage=(e==null?void 0:e.globalState)||null,this._storageKey=di.TEMPLATE_STORE,this._fs=li,this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),M.info("Workspace Templates Manager initialized")}_getStoredTemplates(){return this._storage?this._storage.get(this._storageKey,{}):{}}async _saveStoredTemplates(e){if(!this._storage)throw new Error("Template storage unavailable");await this._storage.update(this._storageKey,e)}_getTemplate(e){return this.builtInTemplates[e]?this.builtInTemplates[e]:this._getStoredTemplates()[e]}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"file-type","explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludedPatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"],"explorerDates.enableContextMenu":!0,"explorerDates.showGitInfo":"author"}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"absolute-long","explorerDates.colorScheme":"none","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"none","explorerDates.highContrastMode":!1,"explorerDates.excludedPatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"],"explorerDates.badgePriority":"size"}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"subtle","explorerDates.showFileSize":!1,"explorerDates.excludedPatterns":["**/node_modules/**","**/.git/**"],"explorerDates.fadeOldFiles":!1,"explorerDates.enableContextMenu":!1}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"recency","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"author","explorerDates.enableContextMenu":!0,"explorerDates.showStatusBar":!0,"explorerDates.smartExclusions":!0,"explorerDates.progressiveLoading":!0,"explorerDates.persistentCache":!0,"explorerDates.enableReporting":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"none","explorerDates.showFileSize":!1,"explorerDates.badgePriority":"time","explorerDates.enableContextMenu":!1,"explorerDates.progressiveLoading":!1}}}}async saveCurrentConfiguration(e,t=""){try{let o=_.workspace.getConfiguration("explorerDates"),i={},s=o.inspect();if(s)for(let[h,u]of Object.entries(s))u&&typeof u=="object"&&"workspaceValue"in u?i[`explorerDates.${h}`]=u.workspaceValue:u&&typeof u=="object"&&"globalValue"in u&&(i[`explorerDates.${h}`]=u.globalValue);let r={name:e,description:t,createdAt:new Date().toISOString(),version:"1.0.0",settings:i},n=e.toLowerCase().replace(/[^a-z0-9-]/g,"-"),l=this._getStoredTemplates();l[n]=r,await this._saveStoredTemplates(l);let c=o.get("templateSyncPath","");if(c&&!this._fs.isWeb)try{let h=`${c.replace(/[/\\]?$/,"")}/${n}.json`;await this._fs.writeFile(h,JSON.stringify(r,null,2)),M.info(`Synced template to ${h}`)}catch(h){M.warn("Failed to sync template to disk path",h)}return _.window.showInformationMessage(`Template "${e}" saved successfully!`),M.info(`Saved workspace template: ${e}`),!0}catch(o){return M.error("Failed to save template:",o),_.window.showErrorMessage(`Failed to save template: ${o.message}`),!1}}async loadTemplate(e){try{let t=this._getTemplate(e);if(!t)throw new Error(`Template "${e}" not found`);let o=_.workspace.getConfiguration();for(let[i,s]of Object.entries(t.settings))await o.update(i,s,_.ConfigurationTarget.Workspace);return _.window.showInformationMessage(`Template "${t.name}" applied successfully!`),M.info(`Applied workspace template: ${t.name}`),!0}catch(t){return M.error("Failed to load template:",t),_.window.showErrorMessage(`Failed to load template: ${t.message}`),!1}}async getAvailableTemplates(){let e=[];for(let[t,o]of Object.entries(this.builtInTemplates))e.push({id:t,name:o.name,description:o.description,type:"built-in",createdAt:null});try{let t=this._getStoredTemplates();for(let[o,i]of Object.entries(t))e.push({id:o,name:i.name,description:i.description,type:"custom",createdAt:i.createdAt})}catch(t){M.error("Failed to load custom templates:",t)}return e}async deleteTemplate(e){try{if(this.builtInTemplates[e])return _.window.showErrorMessage("Cannot delete built-in templates"),!1;let t=this._getStoredTemplates();if(!t[e])throw new Error(`Template "${e}" not found`);return delete t[e],await this._saveStoredTemplates(t),_.window.showInformationMessage(`Template "${e}" deleted successfully!`),M.info(`Deleted workspace template: ${e}`),!0}catch(t){return M.error("Failed to delete template:",t),_.window.showErrorMessage(`Failed to delete template: ${t.message}`),!1}}async exportTemplate(e,t){try{let o=this._getTemplate(e);if(!o)throw new Error(`Template "${e}" not found`);let i=JSON.stringify(o,null,2);if(this._fs.isWeb){let r=encodeURIComponent(i);return await _.env.openExternal(_.Uri.parse(`data:application/json;charset=utf-8,${r}`)),_.window.showInformationMessage("Template download triggered in browser"),!0}let s=t instanceof _.Uri?t.fsPath:t;return await this._fs.writeFile(s,i),_.window.showInformationMessage(`Template exported to ${s}`),M.info(`Exported template ${e} to ${s}`),!0}catch(o){return M.error("Failed to export template:",o),_.window.showErrorMessage(`Failed to export template: ${o.message}`),!1}}async importTemplate(e){try{let t=e instanceof _.Uri?e:_.Uri.file(e),o=await this._fs.readFile(t,"utf8"),i=JSON.parse(o);if(!i.name||!i.settings)throw new Error("Invalid template format");let s=i.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),r=this._getStoredTemplates();return r[s]=i,await this._saveStoredTemplates(r),_.window.showInformationMessage(`Template "${i.name}" imported successfully!`),M.info(`Imported template: ${i.name}`),!0}catch(t){return M.error("Failed to import template:",t),_.window.showErrorMessage(`Failed to import template: ${t.message}`),!1}}async showTemplateManager(){try{let e=await this.getAvailableTemplates(),t=_.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",_.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});t.webview.html=this.getTemplateManagerHtml(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"loadTemplate":await this.loadTemplate(o.templateId);break;case"deleteTemplate":{await this.deleteTemplate(o.templateId);let i=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:i});break}case"exportTemplate":{let i=await _.window.showSaveDialog({defaultUri:_.Uri.file(`${o.templateId}.json`),filters:{JSON:["json"]}});i&&await this.exportTemplate(o.templateId,i);break}case"saveConfig":{await this.saveCurrentConfiguration(o.name,o.description);let i=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:i});break}case"importTemplate":{let i=await _.window.showOpenDialog({canSelectMany:!1,filters:{JSON:["json"]}});if(i&&i[0]){await this.importTemplate(i[0]);let s=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:s})}break}}}),M.info("Template Manager opened")}catch(e){M.error("Failed to show template manager:",e),_.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(e){return`<!DOCTYPE html>
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
            </script>
        </body>
        </html>`}};d(Ge,"WorkspaceTemplatesManager");var qe=Ge;qt.exports={WorkspaceTemplatesManager:qe}});var Vt=S((fs,Kt)=>{var P=require("vscode"),{getLogger:hi}=A(),Je=class Je{constructor(){this._listeners=new Map}on(e,t){let o=this._listeners.get(e)||[];return o.push(t),this._listeners.set(e,o),this}off(e,t){let o=this._listeners.get(e);if(!o)return this;let i=o.indexOf(t);return i!==-1&&o.splice(i,1),this}emit(e,...t){let o=this._listeners.get(e);return o&&o.slice().forEach(i=>{try{i(...t)}catch{}}),this}};d(Je,"BaseEventEmitter");var Ke=Je,F=hi(),Qe=class Qe extends Ke{constructor(){super(),this.plugins=new Map,this.api=null,this.decorationProviders=new Map,this.initialize(),this._setupConfigurationListener()}initialize(){this.api=this.createPublicApi(),F.info("Extension API Manager initialized")}createPublicApi(){return{getFileDecorations:this.getFileDecorations.bind(this),refreshDecorations:this.refreshDecorations.bind(this),registerPlugin:this.registerPlugin.bind(this),unregisterPlugin:this.unregisterPlugin.bind(this),registerDecorationProvider:this.registerDecorationProvider.bind(this),unregisterDecorationProvider:this.unregisterDecorationProvider.bind(this),onDecorationChanged:this.onDecorationChanged.bind(this),onFileScanned:this.onFileScanned.bind(this),formatDate:this.formatDate.bind(this),getFileStats:this.getFileStats.bind(this),version:"1.1.0",apiVersion:"1.0.0"}}async getFileDecorations(e){if(!this._isApiUsable("getFileDecorations"))return[];try{let t=[];for(let o of e){let i=P.Uri.file(o),s=await this.getDecorationForFile(i);s&&t.push({uri:i.toString(),decoration:s})}return t}catch(t){return F.error("Failed to get file decorations:",t),[]}}async getDecorationForFile(e){if(!this._isApiUsable("getDecorationForFile"))return null;try{let t=await P.workspace.fs.stat(e),o=new Date(t.mtime),i={badge:this.formatDate(o,"smart"),color:void 0,tooltip:`Modified: ${o.toLocaleString()}`};for(let[s,r]of this.decorationProviders)try{let n=await r.provideDecoration(e,t,i);n&&(i={...i,...n})}catch(n){F.error(`Decoration provider ${s} failed:`,n)}return i}catch(t){return F.error("Failed to get decoration for file:",t),null}}async refreshDecorations(e=null){if(!this._isApiUsable("refreshDecorations"))return!1;try{return this.emit("decorationRefreshRequested",e),F.info("Decoration refresh requested"),!0}catch(t){return F.error("Failed to refresh decorations:",t),!1}}registerPlugin(e,t){if(!this._canUsePlugins(`registerPlugin:${e}`))return!1;try{if(!this.validatePlugin(t))throw new Error("Invalid plugin structure");return this.plugins.set(e,{...t,registeredAt:new Date,active:!0}),typeof t.activate=="function"&&t.activate(this.api),this.emit("pluginRegistered",{pluginId:e,plugin:t}),F.info(`Plugin registered: ${e}`),!0}catch(o){return F.error(`Failed to register plugin ${e}:`,o),!1}}unregisterPlugin(e){if(!this._canUsePlugins(`unregisterPlugin:${e}`))return!1;try{let t=this.plugins.get(e);return t?(typeof t.deactivate=="function"&&t.deactivate(),this.plugins.delete(e),this.emit("pluginUnregistered",{pluginId:e}),F.info(`Plugin unregistered: ${e}`),!0):!1}catch(t){return F.error(`Failed to unregister plugin ${e}:`,t),!1}}registerDecorationProvider(e,t){if(!this._canUsePlugins(`registerDecorationProvider:${e}`))return!1;try{if(!this.validateDecorationProvider(t))throw new Error("Invalid decoration provider");return this.decorationProviders.set(e,t),this.emit("decorationProviderRegistered",{providerId:e,provider:t}),F.info(`Decoration provider registered: ${e}`),!0}catch(o){return F.error(`Failed to register decoration provider ${e}:`,o),!1}}unregisterDecorationProvider(e){if(!this._canUsePlugins(`unregisterDecorationProvider:${e}`))return!1;try{let t=this.decorationProviders.delete(e);return t&&(this.emit("decorationProviderUnregistered",{providerId:e}),F.info(`Decoration provider unregistered: ${e}`)),t}catch(t){return F.error(`Failed to unregister decoration provider ${e}:`,t),!1}}onDecorationChanged(e){return this.on("decorationChanged",e),()=>this.off("decorationChanged",e)}onFileScanned(e){return this.on("fileScanned",e),()=>this.off("fileScanned",e)}formatDate(e,t=null){if(!this._isApiUsable("formatDate"))return"";try{let o=P.workspace.getConfiguration("explorerDates"),i=t||o.get("displayFormat","smart"),r=new Date-e,n=Math.floor(r/(1e3*60*60*24));switch(i){case"relative-short":return this.getRelativeTimeShort(r);case"relative-long":return this.getRelativeTimeLong(r);case"absolute-short":return e.toLocaleDateString("en-US",{month:"short",day:"numeric"});case"absolute-long":return e.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});case"smart":default:return n<7?this.getRelativeTimeShort(r):e.toLocaleDateString("en-US",{month:"short",day:"numeric"})}}catch(o){return F.error("Failed to format date:",o),e.toLocaleDateString()}}async getFileStats(e){if(!this._isApiUsable("getFileStats"))return null;try{let t=P.Uri.file(e),o=await P.workspace.fs.stat(t);return{path:e,size:o.size,created:new Date(o.ctime),modified:new Date(o.mtime),type:o.type===P.FileType.Directory?"directory":"file"}}catch(t){return F.error("Failed to get file stats:",t),null}}getApi(){return this.api}getRegisteredPlugins(){let e=[];for(let[t,o]of this.plugins)e.push({id:t,name:o.name,version:o.version,author:o.author,active:o.active,registeredAt:o.registeredAt});return e}validatePlugin(e){return!(!e||typeof e!="object"||!e.name||!e.version||e.activate&&typeof e.activate!="function"||e.deactivate&&typeof e.deactivate!="function")}validateDecorationProvider(e){return!(!e||typeof e!="object"||typeof e.provideDecoration!="function")}getRelativeTimeShort(e){let t=Math.floor(e/1e3),o=Math.floor(t/60),i=Math.floor(o/60),s=Math.floor(i/24);if(t<60)return`${t}s`;if(o<60)return`${o}m`;if(i<24)return`${i}h`;if(s<30)return`${s}d`;let r=Math.floor(s/30);return r<12?`${r}mo`:`${Math.floor(r/12)}y`}getRelativeTimeLong(e){let t=Math.floor(e/1e3),o=Math.floor(t/60),i=Math.floor(o/60),s=Math.floor(i/24);if(t<60)return`${t} second${t!==1?"s":""} ago`;if(o<60)return`${o} minute${o!==1?"s":""} ago`;if(i<24)return`${i} hour${i!==1?"s":""} ago`;if(s<30)return`${s} day${s!==1?"s":""} ago`;let r=Math.floor(s/30);if(r<12)return`${r} month${r!==1?"s":""} ago`;let n=Math.floor(r/12);return`${n} year${n!==1?"s":""} ago`}getColorForAge(e){if(!P.workspace.getConfiguration("explorerDates").get("colorCoding",!1))return;let s=(new Date-e)/(1e3*60*60);return s<1?new P.ThemeColor("charts.green"):s<24?new P.ThemeColor("charts.yellow"):s<168?new P.ThemeColor("charts.orange"):new P.ThemeColor("charts.red")}createExamplePlugin(){return{name:"File Size Display",version:"1.0.0",author:"Explorer Dates",description:"Adds file size to decorations",activate:d(e=>{e.registerDecorationProvider("fileSize",{provideDecoration:d(async(t,o,i)=>{let s=this.formatFileSize(o.size);return{badge:`${i.badge} \u2022 ${s}`,tooltip:`${i.tooltip}
Size: ${s}`}},"provideDecoration")})},"activate"),deactivate:d(()=>{},"deactivate")}}_setupConfigurationListener(){P.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableExtensionApi")||e.affectsConfiguration("explorerDates.allowExternalPlugins"))&&F.info("Explorer Dates API configuration changed",{apiEnabled:this._isApiEnabled(),externalPluginsAllowed:this._allowsExternalPlugins()})})}_isApiEnabled(){return P.workspace.getConfiguration("explorerDates").get("enableExtensionApi",!0)}_allowsExternalPlugins(){return P.workspace.getConfiguration("explorerDates").get("allowExternalPlugins",!0)}_isApiUsable(e){return this._isApiEnabled()?!0:(F.warn(`Explorer Dates API request "${e}" ignored because enableExtensionApi is disabled.`),!1)}_canUsePlugins(e){return this._isApiUsable(e)?this._allowsExternalPlugins()?!0:(F.warn(`Explorer Dates plugin request "${e}" ignored because allowExternalPlugins is disabled.`),!1):!1}formatFileSize(e){if(e===0)return"0 B";let t=1024,o=["B","KB","MB","GB"],i=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,i)).toFixed(1))+" "+o[i]}};d(Qe,"ExtensionApiManager");var Ve=Qe;Kt.exports={ExtensionApiManager:Ve}});var Qt=S((vs,Jt)=>{var x=require("vscode"),{getLogger:ui}=A(),{fileSystem:gi}=j(),{getExtension:Ye,normalizePath:pi}=O(),R=ui(),mi=!1,Xe=class Xe{constructor(){this.fileActivityCache=new Map,this.allowedFormats=["json","csv","html","markdown"],this.activityTrackingDays=30,this.activityCutoffMs=null,this.timeTrackingIntegration="none",this._loadConfiguration(),this._setupConfigurationWatcher(),this.initialize()}_loadConfiguration(){try{let e=x.workspace.getConfiguration("explorerDates"),t=e.get("reportFormats",["json","html"]),o=["json","csv","html","markdown"];this.allowedFormats=Array.from(new Set([...t,...o]));let i=e.get("activityTrackingDays",30);this.activityTrackingDays=Math.max(1,Math.min(365,i)),this.activityCutoffMs=this.activityTrackingDays*24*60*60*1e3,this.timeTrackingIntegration=e.get("timeTrackingIntegration","none")}catch(e){R.error("Failed to load reporting configuration",e)}}_setupConfigurationWatcher(){x.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.reportFormats")||e.affectsConfiguration("explorerDates.activityTrackingDays")||e.affectsConfiguration("explorerDates.timeTrackingIntegration"))&&(this._loadConfiguration(),R.info("Reporting configuration updated",{allowedFormats:this.allowedFormats,activityTrackingDays:this.activityTrackingDays,timeTrackingIntegration:this.timeTrackingIntegration}))})}async initialize(){try{this.startFileWatcher(),R.info("Export & Reporting Manager initialized")}catch(e){R.error("Failed to initialize Export & Reporting Manager:",e)}}startFileWatcher(){let e=x.workspace.createFileSystemWatcher("**/*");e.onDidChange(t=>{this.recordFileActivity(t,"modified")}),e.onDidCreate(t=>{this.recordFileActivity(t,"created")}),e.onDidDelete(t=>{this.recordFileActivity(t,"deleted")})}recordFileActivity(e,t){try{let o=e.fsPath||e.path,i=new Date;this.fileActivityCache.has(o)||this.fileActivityCache.set(o,[]),this.fileActivityCache.get(o).push({action:t,timestamp:i,path:o}),this._enforceActivityRetention(o)}catch(o){R.error("Failed to record file activity:",o)}}_enforceActivityRetention(e){let t=this.fileActivityCache.get(e);if(!(!t||t.length===0)){if(this.activityCutoffMs){let o=new Date(Date.now()-this.activityCutoffMs);for(;t.length&&t[0].timestamp<o;)t.shift()}t.length>100&&t.splice(0,t.length-100)}}async generateFileModificationReport(e={}){try{let{format:t="json",timeRange:o="all",includeDeleted:i=!1,outputPath:s=null}=e;if(!this.allowedFormats.includes(t)){let l=`Report format "${t}" is disabled. Allowed formats: ${this.allowedFormats.join(", ")}`;return x.window.showWarningMessage(l),R.warn(l),null}let r=await this.collectFileData(o,i),n=await this.formatReport(r,t);return s&&(await this.saveReport(n,s),x.window.showInformationMessage(`Report saved to ${s}`)),n}catch(t){return R.error("Failed to generate file modification report:",t),x.window.showErrorMessage("Failed to generate report"),null}}async collectFileData(e,t){let o=[],i=x.workspace.workspaceFolders;if(!i)return{files:[],summary:this.createSummary([])};for(let r of i){let n=await this.scanWorkspaceFolder(r.uri,e,t);o.push(...n)}let s=this.createSummary(o);return s.integrationTarget=this.timeTrackingIntegration,s.activityTrackingDays=this.activityTrackingDays,{generatedAt:new Date().toISOString(),workspace:i.map(r=>r.uri.fsPath),timeRange:e,files:o,summary:s}}async scanWorkspaceFolder(e,t,o){let i=[],r=x.workspace.getConfiguration("explorerDates").get("excludedPatterns",[]);try{let n=await x.workspace.fs.readDirectory(e);for(let[l,c]of n){let h=x.Uri.joinPath(e,l),u=x.workspace.asRelativePath(h);if(!this.isExcluded(u,r)){if(c===x.FileType.File){let m=await this.getFileData(h,t);m&&i.push(m)}else if(c===x.FileType.Directory){let m=await this.scanWorkspaceFolder(h,t,o);i.push(...m)}}}if(o&&e.fsPath){let l=this.getDeletedFiles(e.fsPath,t);i.push(...l)}}catch(n){R.error(`Failed to scan folder ${e.fsPath||e.path}:`,n)}return i}async getFileData(e,t){try{let o=await x.workspace.fs.stat(e),i=x.workspace.asRelativePath(e),s=e.fsPath||e.path,r=this.fileActivityCache.get(s)||[],n=this.filterActivitiesByTimeRange(r,t);return{path:i,fullPath:s,size:o.size,created:new Date(o.ctime),modified:new Date(o.mtime),type:this.getFileType(i),extension:Ye(i),activities:n,activityCount:n.length,lastActivity:n.length>0?n[n.length-1].timestamp:new Date(o.mtime)}}catch(o){return R.error(`Failed to get file data for ${e.fsPath||e.path}:`,o),null}}filterActivitiesByTimeRange(e,t){let o=e;if(t!=="all"){let i=new Date,s;switch(t){case"24h":s=new Date(i-1440*60*1e3);break;case"7d":s=new Date(i-10080*60*1e3);break;case"30d":s=new Date(i-720*60*60*1e3);break;case"90d":s=new Date(i-2160*60*60*1e3);break;default:s=null}s&&(o=o.filter(r=>r.timestamp>=s))}if(this.activityCutoffMs){let i=new Date(Date.now()-this.activityCutoffMs);o=o.filter(s=>s.timestamp>=i)}return o}getDeletedFiles(e,t){if(!e)return[];let o=[];for(let[i,s]of this.fileActivityCache)if(i.startsWith(e)){let r=s.filter(l=>l.action==="deleted"),n=this.filterActivitiesByTimeRange(r,t);n.length>0&&o.push({path:x.workspace.asRelativePath(i),fullPath:i,size:0,created:null,modified:null,type:"deleted",extension:Ye(i),activities:n,activityCount:n.length,lastActivity:n[n.length-1].timestamp})}return o}createSummary(e){let t={totalFiles:e.length,totalSize:e.reduce((i,s)=>i+(s.size||0),0),fileTypes:{},activityByDay:{},mostActiveFiles:[],recentlyModified:[],largestFiles:[],oldestFiles:[]};e.forEach(i=>{let s=i.type||"unknown";t.fileTypes[s]=(t.fileTypes[s]||0)+1});let o=new Date(Date.now()-this.activityTrackingDays*24*60*60*1e3);return e.forEach(i=>{i.activities.forEach(s=>{if(s.timestamp>=o){let r=s.timestamp.toISOString().split("T")[0];t.activityByDay[r]=(t.activityByDay[r]||0)+1}})}),t.mostActiveFiles=e.sort((i,s)=>s.activityCount-i.activityCount).slice(0,10).map(i=>({path:i.path,activityCount:i.activityCount,lastActivity:i.lastActivity})),t.recentlyModified=e.filter(i=>i.modified).sort((i,s)=>s.modified-i.modified).slice(0,20).map(i=>({path:i.path,modified:i.modified,size:i.size})),t.largestFiles=e.sort((i,s)=>(s.size||0)-(i.size||0)).slice(0,10).map(i=>({path:i.path,size:i.size,modified:i.modified})),t.oldestFiles=e.filter(i=>i.modified).sort((i,s)=>i.modified-s.modified).slice(0,10).map(i=>({path:i.path,modified:i.modified,size:i.size})),t}async formatReport(e,t){switch(t.toLowerCase()){case"json":return JSON.stringify(e,null,2);case"csv":return this.formatAsCSV(e);case"html":return this.formatAsHTML(e);case"markdown":return this.formatAsMarkdown(e);default:throw new Error(`Unsupported format: ${t}`)}}formatAsCSV(e){let t=["Path,Size,Created,Modified,Type,Extension,ActivityCount,LastActivity"];return e.files.forEach(o=>{t.push([o.path,o.size||0,o.created?o.created.toISOString():"",o.modified?o.modified.toISOString():"",o.type,o.extension,o.activityCount,o.lastActivity?o.lastActivity.toISOString():""].join(","))}),t.join(`
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
`}async saveReport(e,t){try{if(mi){let i=encodeURIComponent(e);await x.env.openExternal(x.Uri.parse(`data:text/plain;charset=utf-8,${i}`)),x.window.showInformationMessage("Report download triggered in browser");return}let o=t instanceof x.Uri?t:x.Uri.file(t);await gi.writeFile(o,e,"utf8"),R.info(`Report saved to ${o.fsPath||o.path}`)}catch(o){throw R.error("Failed to save report:",o),o}}async exportToTimeTrackingTools(e={}){try{let{tool:t="generic",timeRange:o="7d"}=e,i=await this.collectFileData(o,!1);return this.formatForTimeTracking(i,t)}catch(t){return R.error("Failed to export to time tracking tools:",t),null}}formatForTimeTracking(e,t){let o=[];switch(e.files.forEach(i=>{i.activities.forEach(s=>{o.push({file:i.path,action:s.action,timestamp:s.timestamp,duration:this.estimateSessionDuration(s),project:this.extractProjectName(i.path)})})}),t){case"toggl":return this.formatForToggl(o);case"clockify":return this.formatForClockify(o);case"generic":default:return o}}formatForToggl(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),duration:t.duration*60,project:t.project,tags:[t.action,this.getFileType(t.file)]}))}formatForClockify(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),end:new Date(t.timestamp.getTime()+t.duration*60*1e3).toISOString(),project:t.project,tags:[t.action,this.getFileType(t.file)]}))}estimateSessionDuration(e){switch(e.action){case"created":return 15;case"modified":return 5;case"deleted":return 1;default:return 5}}extractProjectName(e){return pi(e).split("/")[0]||"Unknown Project"}getFileType(e){let t=Ye(e);return{".js":"javascript",".ts":"typescript",".py":"python",".java":"java",".cpp":"cpp",".html":"html",".css":"css",".md":"markdown",".json":"json",".xml":"xml",".txt":"text"}[t]||"other"}isExcluded(e,t){return t.some(o=>new RegExp(o.replace(/\*/g,".*")).test(e))}formatFileSize(e){if(e===0)return"0 B";let t=1024,o=["B","KB","MB","GB"],i=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,i)).toFixed(1))+" "+o[i]}async showReportDialog(){try{let e={"\u{1F4CA} Generate Full Report":"full","\u{1F4C5} Last 24 Hours":"24h","\u{1F4C5} Last 7 Days":"7d","\u{1F4C5} Last 30 Days":"30d","\u{1F4C5} Last 90 Days":"90d"},t=await x.window.showQuickPick(Object.keys(e),{placeHolder:"Select report time range"});if(!t)return;let o=e[t],i=["JSON","CSV","HTML","Markdown"],s=await x.window.showQuickPick(i,{placeHolder:"Select report format"});if(!s)return;let r=await x.window.showSaveDialog({defaultUri:x.Uri.file(`file-report.${s.toLowerCase()}`),filters:{[s]:[s.toLowerCase()]}});if(!r)return;await this.generateFileModificationReport({format:s.toLowerCase(),timeRange:o,outputPath:r.fsPath})}catch(e){R.error("Failed to show report dialog:",e),x.window.showErrorMessage("Failed to generate report")}}};d(Xe,"ExportReportingManager");var Ze=Xe;Jt.exports={ExportReportingManager:Ze}});var b=require("vscode"),{FileDateDecorationProvider:fi}=Pt(),{getLogger:wi}=A(),{getLocalization:vi}=ee(),{fileSystem:bi}=j(),{registerCoreCommands:yi}=It(),{registerAnalysisCommands:Ci}=Ot(),{registerOnboardingCommands:_i}=Ut(),W,D,ue;function xi(a){return`<!DOCTYPE html>
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
    </html>`}d(xi,"getApiInformationHtml");function Di(a){let e=d(o=>{if(o<1024)return`${o} B`;let i=o/1024;return i<1024?`${i.toFixed(1)} KB`:`${(i/1024).toFixed(1)} MB`},"formatFileSize"),t=a.map(o=>`
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
    `}d(Di,"generateWorkspaceActivityHTML");function Si(a){return`
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
            
            ${Object.entries(a).map(([t,o])=>{let i=Object.entries(o).map(([s,r])=>{let n=Array.isArray(r)?r.join(", ")||"None":(r==null?void 0:r.toString())||"N/A";return`
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
    `}d(Si,"generateDiagnosticsHTML");function Fi(a){return`<!DOCTYPE html>
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
    </html>`}d(Fi,"generateDiagnosticsWebview");function Ti(a){let e=d(t=>{if(t===0)return"0 B";let o=1024,i=["B","KB","MB","GB"],s=Math.floor(Math.log(t)/Math.log(o));return parseFloat((t/Math.pow(o,s)).toFixed(2))+" "+i[s]},"formatBytes");return`
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
    `}d(Ti,"generatePerformanceAnalyticsHTML");function Yt(a){let e=b.window.createStatusBarItem(b.StatusBarAlignment.Right,100);e.command="explorerDates.showFileDetails",e.tooltip="Click to show detailed file information";let t=d(async()=>{try{let o=b.window.activeTextEditor;if(!o){e.hide();return}let i=o.document.uri;if(i.scheme!=="file"){e.hide();return}let s=await bi.stat(i),r=s.mtime instanceof Date?s.mtime:new Date(s.mtime),n=W._formatDateBadge(r,"smart"),l=W._formatFileSize(s.size,"auto");e.text=`$(clock) ${n} $(file) ${l}`,e.show()}catch(o){e.hide(),D.debug("Failed to update status bar",o)}},"updateStatusBar");return b.window.onDidChangeActiveTextEditor(t),b.window.onDidChangeTextEditorSelection(t),t(),a.subscriptions.push(e),e}d(Yt,"initializeStatusBar");async function ki(a){try{D=wi(),ue=vi(),D.info("Explorer Dates: Extension activated");let e=b.env.uiKind===b.UIKind.Web;await b.commands.executeCommand("setContext","explorerDates.gitFeaturesAvailable",!e);let t=b.workspace.getConfiguration("explorerDates"),o=t.get("enableWorkspaceTemplates",!0),i=t.get("enableReporting",!0),s=t.get("enableExtensionApi",!0);W=new fi;let r=b.window.registerFileDecorationProvider(W);a.subscriptions.push(r),a.subscriptions.push(W),a.subscriptions.push(D),await W.initializeAdvancedSystems(a);let n=null,l=null,c=null,h=null,u=d(()=>{if(!n){let{OnboardingManager:y}=Ht();n=new y(a)}return n},"getOnboardingManager"),m=d(()=>{if(!o)throw new Error("Workspace templates are disabled via explorerDates.enableWorkspaceTemplates");if(!l){let{WorkspaceTemplatesManager:y}=Gt();l=new y(a)}return l},"getWorkspaceTemplatesManager"),p=d(()=>{if(!c){let{ExtensionApiManager:y}=Vt();c=new y}return c},"getExtensionApiManager"),v=d(()=>{if(!i)throw new Error("Reporting is disabled via explorerDates.enableReporting");if(!h){let{ExportReportingManager:y}=Qt();h=new y}return h},"getExportReportingManager"),B=d(()=>p().getApi(),"apiFactory");s?a.exports=B:(a.exports=void 0,D.info("Explorer Dates API exports disabled via explorerDates.enableExtensionApi")),b.workspace.getConfiguration("explorerDates").get("showWelcomeOnStartup",!0)&&await u().shouldShowOnboarding()&&setTimeout(()=>{u().showWelcomeMessage()},5e3),yi({context:a,fileDateProvider:W,logger:D,l10n:ue}),Ci({context:a,fileDateProvider:W,logger:D,generators:{generateWorkspaceActivityHTML:Di,generatePerformanceAnalyticsHTML:Ti,generateDiagnosticsHTML:Si,generateDiagnosticsWebview:Fi}}),_i({context:a,logger:D,getOnboardingManager:u});let ge=b.commands.registerCommand("explorerDates.openTemplateManager",async()=>{try{if(!o){b.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to use this command.");return}await m().showTemplateManager(),D.info("Template manager opened")}catch(y){D.error("Failed to open template manager",y),b.window.showErrorMessage(`Failed to open template manager: ${y.message}`)}});a.subscriptions.push(ge);let ie=b.commands.registerCommand("explorerDates.saveTemplate",async()=>{try{if(!o){b.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to save templates.");return}let y=await b.window.showInputBox({prompt:"Enter template name",placeHolder:"e.g., My Project Setup"});if(y){let G=await b.window.showInputBox({prompt:"Enter description (optional)",placeHolder:"Brief description of this template"})||"";await m().saveCurrentConfiguration(y,G)}D.info("Template saved")}catch(y){D.error("Failed to save template",y),b.window.showErrorMessage(`Failed to save template: ${y.message}`)}});a.subscriptions.push(ie);let X=b.commands.registerCommand("explorerDates.generateReport",async()=>{try{if(!i){b.window.showInformationMessage("Reporting features are disabled. Enable explorerDates.enableReporting to generate reports.");return}await v().showReportDialog(),D.info("Report generation started")}catch(y){D.error("Failed to generate report",y),b.window.showErrorMessage(`Failed to generate report: ${y.message}`)}});a.subscriptions.push(X);let pe=b.commands.registerCommand("explorerDates.showApiInfo",async()=>{try{if(!s){b.window.showInformationMessage("Explorer Dates API is disabled via settings.");return}let y=b.window.createWebviewPanel("apiInfo","Explorer Dates API Information",b.ViewColumn.One,{enableScripts:!0});y.webview.html=xi(B()),D.info("API information panel opened")}catch(y){D.error("Failed to show API information",y),b.window.showErrorMessage(`Failed to show API information: ${y.message}`)}});a.subscriptions.push(pe);let I;b.workspace.getConfiguration("explorerDates").get("showStatusBar",!1)&&(I=Yt(a)),b.workspace.onDidChangeConfiguration(y=>{if(y.affectsConfiguration("explorerDates.showStatusBar")){let G=b.workspace.getConfiguration("explorerDates").get("showStatusBar",!1);G&&!I?I=Yt(a):!G&&I&&(I.dispose(),I=null)}}),D.info("Explorer Dates: Date decorations ready")}catch(e){let t=`${ue?ue.getString("activationError"):"Explorer Dates failed to activate"}: ${e.message}`;throw D&&D.error("Extension activation failed",e),b.window.showErrorMessage(t),e}}d(ki,"activate");async function $i(){try{D&&D.info("Explorer Dates extension is being deactivated"),W&&typeof W.dispose=="function"&&await W.dispose(),D&&D.info("Explorer Dates extension deactivated successfully")}catch(a){D&&D.error("Explorer Dates: Error during deactivation",a)}}d($i,"deactivate");module.exports={activate:ki,deactivate:$i};
