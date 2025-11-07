var zt=Object.defineProperty;var g=(n,e)=>zt(n,"name",{value:e,configurable:!0});var L=(n,e)=>()=>(e||n((e={exports:{}}).exports,e),e.exports);var R=L((_o,st)=>{var $e=require("vscode"),Te=class Te{constructor(){this._outputChannel=$e.window.createOutputChannel("Explorer Dates"),this._isEnabled=!1,this._updateConfig(),$e.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.enableLogging")&&this._updateConfig()})}_updateConfig(){let e=$e.workspace.getConfiguration("explorerDates");this._isEnabled=e.get("enableLogging",!1)}debug(e,...t){if(this._isEnabled){let r=`[${new Date().toISOString()}] [DEBUG] ${e}`;this._outputChannel.appendLine(r),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}}info(e,...t){let r=`[${new Date().toISOString()}] [INFO] ${e}`;this._outputChannel.appendLine(r),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}warn(e,...t){let r=`[${new Date().toISOString()}] [WARN] ${e}`;this._outputChannel.appendLine(r),t.length>0&&this._outputChannel.appendLine(JSON.stringify(t,null,2))}error(e,t,...o){let i=`[${new Date().toISOString()}] [ERROR] ${e}`;this._outputChannel.appendLine(i),t instanceof Error&&(this._outputChannel.appendLine(`Error: ${t.message}`),t.stack&&this._outputChannel.appendLine(`Stack: ${t.stack}`)),o.length>0&&this._outputChannel.appendLine(JSON.stringify(o,null,2))}show(){this._outputChannel.show()}clear(){this._outputChannel.clear()}dispose(){this._outputChannel.dispose()}};g(Te,"Logger");var pe=Te,ke=null;function Rt(){return ke||(ke=new pe),ke}g(Rt,"getLogger");st.exports={Logger:pe,getLogger:Rt}});var le=L((So,at)=>{var Me=require("vscode"),me={en:{now:"now",minutes:"m",hours:"h",days:"d",weeks:"w",months:"mo",years:"y",justNow:"just now",minutesAgo:g(n=>`${n} minute${n!==1?"s":""} ago`,"minutesAgo"),hoursAgo:g(n=>`${n} hour${n!==1?"s":""} ago`,"hoursAgo"),yesterday:"yesterday",daysAgo:g(n=>`${n} day${n!==1?"s":""} ago`,"daysAgo"),lastModified:"Last modified",refreshSuccess:"Date decorations refreshed",activationError:"Explorer Dates failed to activate",errorAccessingFile:"Error accessing file for decoration"},es:{now:"ahora",minutes:"m",hours:"h",days:"d",weeks:"s",months:"m",years:"a",justNow:"ahora mismo",minutesAgo:g(n=>`hace ${n} minuto${n!==1?"s":""}`,"minutesAgo"),hoursAgo:g(n=>`hace ${n} hora${n!==1?"s":""}`,"hoursAgo"),yesterday:"ayer",daysAgo:g(n=>`hace ${n} d\xEDa${n!==1?"s":""}`,"daysAgo"),lastModified:"\xDAltima modificaci\xF3n",refreshSuccess:"Decoraciones de fecha actualizadas",activationError:"Explorer Dates no se pudo activar",errorAccessingFile:"Error al acceder al archivo para decoraci\xF3n"},fr:{now:"maintenant",minutes:"m",hours:"h",days:"j",weeks:"s",months:"m",years:"a",justNow:"\xE0 l'instant",minutesAgo:g(n=>`il y a ${n} minute${n!==1?"s":""}`,"minutesAgo"),hoursAgo:g(n=>`il y a ${n} heure${n!==1?"s":""}`,"hoursAgo"),yesterday:"hier",daysAgo:g(n=>`il y a ${n} jour${n!==1?"s":""}`,"daysAgo"),lastModified:"Derni\xE8re modification",refreshSuccess:"D\xE9corations de date actualis\xE9es",activationError:"\xC9chec de l'activation d'Explorer Dates",errorAccessingFile:"Erreur lors de l'acc\xE8s au fichier pour la d\xE9coration"},de:{now:"jetzt",minutes:"Min",hours:"Std",days:"T",weeks:"W",months:"Mon",years:"J",justNow:"gerade eben",minutesAgo:g(n=>`vor ${n} Minute${n!==1?"n":""}`,"minutesAgo"),hoursAgo:g(n=>`vor ${n} Stunde${n!==1?"n":""}`,"hoursAgo"),yesterday:"gestern",daysAgo:g(n=>`vor ${n} Tag${n!==1?"en":""}`,"daysAgo"),lastModified:"Zuletzt ge\xE4ndert",refreshSuccess:"Datumsdekorationen aktualisiert",activationError:"Explorer Dates konnte nicht aktiviert werden",errorAccessingFile:"Fehler beim Zugriff auf Datei f\xFCr Dekoration"},ja:{now:"\u4ECA",minutes:"\u5206",hours:"\u6642\u9593",days:"\u65E5",weeks:"\u9031",months:"\u30F6\u6708",years:"\u5E74",justNow:"\u305F\u3063\u305F\u4ECA",minutesAgo:g(n=>`${n}\u5206\u524D`,"minutesAgo"),hoursAgo:g(n=>`${n}\u6642\u9593\u524D`,"hoursAgo"),yesterday:"\u6628\u65E5",daysAgo:g(n=>`${n}\u65E5\u524D`,"daysAgo"),lastModified:"\u6700\u7D42\u66F4\u65B0",refreshSuccess:"\u65E5\u4ED8\u88C5\u98FE\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",activationError:"Explorer Dates\u306E\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F",errorAccessingFile:"\u30D5\u30A1\u30A4\u30EB\u30A2\u30AF\u30BB\u30B9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"},zh:{now:"\u73B0\u5728",minutes:"\u5206\u949F",hours:"\u5C0F\u65F6",days:"\u5929",weeks:"\u5468",months:"\u6708",years:"\u5E74",justNow:"\u521A\u521A",minutesAgo:g(n=>`${n}\u5206\u949F\u524D`,"minutesAgo"),hoursAgo:g(n=>`${n}\u5C0F\u65F6\u524D`,"hoursAgo"),yesterday:"\u6628\u5929",daysAgo:g(n=>`${n}\u5929\u524D`,"daysAgo"),lastModified:"\u6700\u540E\u4FEE\u6539",refreshSuccess:"\u65E5\u671F\u88C5\u9970\u5DF2\u5237\u65B0",activationError:"Explorer Dates \u6FC0\u6D3B\u5931\u8D25",errorAccessingFile:"\u8BBF\u95EE\u6587\u4EF6\u88C5\u9970\u65F6\u51FA\u9519"}},Ee=class Ee{constructor(){this._currentLocale="en",this._updateLocale(),Me.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.locale")&&this._updateLocale()})}_updateLocale(){let t=Me.workspace.getConfiguration("explorerDates").get("locale","auto");t==="auto"&&(t=Me.env.language.split("-")[0]),me[t]||(t="en"),this._currentLocale=t}getString(e,...t){let r=(me[this._currentLocale]||me.en)[e];return typeof r=="function"?r(...t):r||me.en[e]||e}getCurrentLocale(){return this._currentLocale}formatDate(e,t={}){try{return e.toLocaleDateString(this._currentLocale,t)}catch{return e.toLocaleDateString("en",t)}}};g(Ee,"LocalizationManager");var fe=Ee,Pe=null;function Nt(){return Pe||(Pe=new fe),Pe}g(Nt,"getLocalization");at.exports={LocalizationManager:fe,getLocalization:Nt}});var ct=L(($o,nt)=>{var Q=require("vscode"),de=require("path"),we=require("fs").promises,{getLogger:Lt}=R(),Ie=class Ie{constructor(){this._logger=Lt(),this._commonExclusions=["node_modules",".npm",".yarn","coverage","nyc_output","dist","build","out","target","bin","obj",".vscode",".idea",".vs",".vscode-test",".git",".svn",".hg",".bzr",".pnpm-store","bower_components","jspm_packages","tmp","temp",".tmp",".cache",".parcel-cache",".DS_Store","Thumbs.db","__pycache__",".pytest_cache",".tox","venv",".env",".virtualenv","vendor",".docker","logs","*.log"],this._patternScores=new Map,this._workspaceAnalysis=new Map,this._logger.info("SmartExclusionManager initialized")}async analyzeWorkspace(e){try{let t=e.fsPath,o={detectedPatterns:[],suggestedExclusions:[],projectType:"unknown",riskFolders:[]};o.projectType=await this._detectProjectType(t);let r=await this._scanForExclusionCandidates(t),i=this._scorePatterns(r,o.projectType);return o.detectedPatterns=r,o.suggestedExclusions=i.filter(a=>a.score>.7).map(a=>a.pattern),o.riskFolders=i.filter(a=>a.riskLevel==="high").map(a=>a.pattern),this._workspaceAnalysis.set(t,o),this._logger.info(`Workspace analysis complete for ${t}`,o),o}catch(t){return this._logger.error("Failed to analyze workspace",t),null}}async _detectProjectType(e){let t=[{file:"package.json",type:"javascript"},{file:"pom.xml",type:"java"},{file:"Cargo.toml",type:"rust"},{file:"setup.py",type:"python"},{file:"requirements.txt",type:"python"},{file:"Gemfile",type:"ruby"},{file:"composer.json",type:"php"},{file:"go.mod",type:"go"},{file:"CMakeLists.txt",type:"cpp"},{file:"Dockerfile",type:"docker"}];for(let o of t)try{return await we.access(de.join(e,o.file)),o.type}catch{}return"unknown"}async _scanForExclusionCandidates(e,t=2){let o=[],r=g(async(i,a=0)=>{if(!(a>t))try{let l=await we.readdir(i,{withFileTypes:!0});for(let h of l)if(h.isDirectory()){let f=de.join(i,h.name),m=de.relative(e,f);this._commonExclusions.includes(h.name)&&o.push({name:h.name,path:m,type:"common",size:await this._getDirectorySize(f)});let b=await this._getDirectorySize(f);b>10485760&&o.push({name:h.name,path:m,type:"large",size:b}),await r(f,a+1)}}catch{}},"scanDirectory");return await r(e),o}async _getDirectorySize(e){try{let t=await we.readdir(e,{withFileTypes:!0}),o=0,r=0;for(let i of t){if(r>100)break;if(i.isFile())try{let a=await we.stat(de.join(e,i.name));o+=a.size,r++}catch{}}return o}catch{return 0}}_scorePatterns(e,t){return e.map(o=>{let r=0,i="low";switch(o.type==="common"&&(r+=.8),o.size>100*1024*1024?(r+=.9,i="high"):o.size>10*1024*1024&&(r+=.5,i="medium"),t){case"javascript":["node_modules",".npm","coverage","dist","build"].includes(o.name)&&(r+=.9);break;case"python":["__pycache__",".pytest_cache","venv",".env"].includes(o.name)&&(r+=.9);break;case"java":["target","build",".gradle"].includes(o.name)&&(r+=.9);break}return["src","lib","app","components","pages"].includes(o.name.toLowerCase())&&(r=0,i="none"),{pattern:o.name,path:o.path,score:Math.min(r,1),riskLevel:i,size:o.size,type:o.type}})}getWorkspaceExclusions(e){let o=Q.workspace.getConfiguration("explorerDates").get("workspaceExclusionProfiles",{}),r=this._getWorkspaceKey(e);return o[r]||[]}async saveWorkspaceExclusions(e,t){let o=Q.workspace.getConfiguration("explorerDates"),r=o.get("workspaceExclusionProfiles",{}),i=this._getWorkspaceKey(e);r[i]=t,await o.update("workspaceExclusionProfiles",r,Q.ConfigurationTarget.Global),this._logger.info(`Saved workspace exclusions for ${i}`,t)}async getCombinedExclusions(e){let t=Q.workspace.getConfiguration("explorerDates"),o=t.get("excludedFolders",[]),r=t.get("excludedPatterns",[]),i=t.get("smartExclusions",!0),a=[...o],l=[...r],h=this.getWorkspaceExclusions(e);if(a.push(...h),i){let f=await this.analyzeWorkspace(e);f&&a.push(...f.suggestedExclusions)}return a=[...new Set(a)],l=[...new Set(l)],{folders:a,patterns:l}}_getWorkspaceKey(e){return de.basename(e.fsPath)}async suggestExclusions(e){let t=await this.analyzeWorkspace(e);if(!t||t.suggestedExclusions.length===0)return;let o=`Found ${t.suggestedExclusions.length} folders that could be excluded for better performance.`,r=await Q.window.showInformationMessage(o,"Apply Suggestions","Review","Dismiss");r==="Apply Suggestions"?(await this.saveWorkspaceExclusions(e,t.suggestedExclusions),Q.window.showInformationMessage("Smart exclusions applied!")):r==="Review"&&this._showExclusionReview(t)}_showExclusionReview(e){let t=Q.window.createWebviewPanel("exclusionReview","Smart Exclusion Review",Q.ViewColumn.One,{enableScripts:!0});t.webview.html=this._generateReviewHTML(e)}_generateReviewHTML(e){let t=g(r=>{if(r<1024)return`${r} B`;let i=r/1024;return i<1024?`${i.toFixed(1)} KB`:`${(i/1024).toFixed(1)} MB`},"formatSize"),o=e.detectedPatterns.map(r=>`
            <tr>
                <td>${r.name}</td>
                <td>${r.path}</td>
                <td>${t(r.size)}</td>
                <td>${r.type}</td>
                <td>
                    <input type="checkbox" ${e.suggestedExclusions.includes(r.name)?"checked":""}>
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
        `}};g(Ie,"SmartExclusionManager");var Ae=Ie;nt.exports={SmartExclusionManager:Ae}});var dt=L((To,lt)=>{var ee=require("vscode"),{getLogger:Ot}=R(),Re=class Re{constructor(){this._logger=Ot(),this._processingQueue=[],this._isProcessing=!1,this._batchSize=50,this._processedCount=0,this._totalCount=0,this._statusBar=null,this._metrics={totalBatches:0,averageBatchTime:0,totalProcessingTime:0},this._logger.info("BatchProcessor initialized")}initialize(){let e=ee.workspace.getConfiguration("explorerDates");this._batchSize=e.get("batchSize",50),this._statusBar=ee.window.createStatusBarItem(ee.StatusBarAlignment.Left,-1e3),ee.workspace.onDidChangeConfiguration(t=>{t.affectsConfiguration("explorerDates.batchSize")&&(this._batchSize=ee.workspace.getConfiguration("explorerDates").get("batchSize",50),this._logger.debug(`Batch size updated to: ${this._batchSize}`))})}queueForProcessing(e,t,o={}){let r={id:Date.now()+Math.random(),uris:Array.isArray(e)?e:[e],processor:t,priority:o.priority||"normal",background:o.background||!1,onProgress:o.onProgress,onComplete:o.onComplete};return r.priority==="high"?this._processingQueue.unshift(r):this._processingQueue.push(r),this._logger.debug(`Queued batch ${r.id} with ${r.uris.length} URIs`),this._isProcessing||this._startProcessing(),r.id}async _startProcessing(){if(this._isProcessing)return;this._isProcessing=!0,this._processedCount=0,this._totalCount=this._processingQueue.reduce((t,o)=>t+o.uris.length,0),this._logger.info(`Starting batch processing: ${this._totalCount} items in ${this._processingQueue.length} batches`),this._updateStatusBar();let e=Date.now();try{for(;this._processingQueue.length>0;){let t=this._processingQueue.shift();await this._processBatch(t),t.background||await this._sleep(1)}}catch(t){this._logger.error("Batch processing failed",t)}finally{this._isProcessing=!1,this._hideStatusBar();let t=Date.now()-e;this._updateMetrics(t),this._logger.info(`Batch processing completed in ${t}ms`)}}async _processBatch(e){let t=Date.now();this._logger.debug(`Processing batch ${e.id} with ${e.uris.length} URIs`);try{let o=this._chunkArray(e.uris,this._batchSize);for(let r=0;r<o.length;r++){let i=o[r],a=[];for(let l of i){try{let h=await e.processor(l);a.push({uri:l,result:h,success:!0}),this._processedCount++}catch(h){a.push({uri:l,error:h,success:!1}),this._processedCount++,this._logger.debug(`Failed to process ${l.fsPath}`,h)}this._updateStatusBar(),e.onProgress&&e.onProgress({processed:this._processedCount,total:this._totalCount,current:l})}await this._sleep(0),!e.background&&r<o.length-1&&await this._sleep(5)}e.onComplete&&e.onComplete({processed:e.uris.length,success:!0,duration:Date.now()-t})}catch(o){this._logger.error(`Batch ${e.id} processing failed`,o),e.onComplete&&e.onComplete({processed:0,success:!1,error:o,duration:Date.now()-t})}this._metrics.totalBatches++}async processDirectoryProgressively(e,t,o={}){let r=o.maxFiles||1e3;try{let i=new ee.RelativePattern(e,"**/*"),a=await ee.workspace.findFiles(i,null,r);if(a.length===0){this._logger.debug(`No files found in directory: ${e.fsPath}`);return}return this._logger.info(`Processing directory progressively: ${a.length} files in ${e.fsPath}`),this.queueForProcessing(a,t,{priority:"normal",background:!0,...o})}catch(i){throw this._logger.error("Progressive directory processing failed",i),i}}async refreshInBackground(e,t,o={}){return this.queueForProcessing(e,t,{background:!0,priority:"low",...o})}async refreshVisible(e,t,o={}){return this.queueForProcessing(e,t,{background:!1,priority:"high",...o})}_chunkArray(e,t){let o=[];for(let r=0;r<e.length;r+=t)o.push(e.slice(r,r+t));return o}_sleep(e){return new Promise(t=>setTimeout(t,e))}_updateStatusBar(){if(!this._statusBar)return;let e=this._totalCount>0?Math.round(this._processedCount/this._totalCount*100):0;this._statusBar.text=`$(sync~spin) Processing files... ${e}% (${this._processedCount}/${this._totalCount})`,this._statusBar.tooltip="Explorer Dates is processing file decorations",this._statusBar.show()}_hideStatusBar(){this._statusBar&&this._statusBar.hide()}_updateMetrics(e){this._metrics.totalProcessingTime+=e,this._metrics.totalBatches>0&&(this._metrics.averageBatchTime=this._metrics.totalProcessingTime/this._metrics.totalBatches)}getMetrics(){return{...this._metrics,isProcessing:this._isProcessing,queueLength:this._processingQueue.length,currentProgress:this._totalCount>0?this._processedCount/this._totalCount:0}}cancelAll(){this._processingQueue.length=0,this._hideStatusBar(),this._logger.info("All batch processing cancelled")}cancelBatch(e){let t=this._processingQueue.findIndex(o=>o.id===e);if(t!==-1){let o=this._processingQueue.splice(t,1)[0];return this._logger.debug(`Cancelled batch ${e} with ${o.uris.length} URIs`),!0}return!1}dispose(){this.cancelAll(),this._statusBar&&this._statusBar.dispose(),this._logger.info("BatchProcessor disposed",this.getMetrics())}};g(Re,"BatchProcessor");var ze=Re;lt.exports={BatchProcessor:ze}});var ut=L((Po,gt)=>{var ht=require("vscode"),ve=require("fs").promises,Ne=require("path"),{getLogger:Bt}=R(),Oe=class Oe{constructor(e){this._logger=Bt(),this._context=e,this._memoryCache=new Map,this._cacheMetadata=new Map,this._maxMemoryUsage=50*1024*1024,this._currentMemoryUsage=0,this._persistentCacheEnabled=!0,this._cacheDir=Ne.join(e.globalStorageUri&&e.globalStorageUri.fsPath||e.globalStoragePath||"","cache"),this._persistentCacheFile=Ne.join(this._cacheDir,"file-decorations.json"),this._metadataFile=Ne.join(this._cacheDir,"cache-metadata.json"),this._metrics={memoryHits:0,memoryMisses:0,diskHits:0,diskMisses:0,evictions:0,persistentLoads:0,persistentSaves:0},this._cleanupInterval=null,this._saveInterval=null,this._logger.info("AdvancedCache initialized")}async initialize(){try{await this._loadConfiguration(),await this._ensureCacheDirectory(),this._persistentCacheEnabled&&await this._loadPersistentCache(),this._startIntervals(),this._logger.info("Advanced cache system initialized",{persistentEnabled:this._persistentCacheEnabled,maxMemoryUsage:this._maxMemoryUsage,cacheDir:this._cacheDir})}catch(e){this._logger.error("Failed to initialize cache system",e)}}async _loadConfiguration(){let e=ht.workspace.getConfiguration("explorerDates");this._persistentCacheEnabled=e.get("persistentCache",!0),this._maxMemoryUsage=e.get("maxMemoryUsage",50)*1024*1024,ht.workspace.onDidChangeConfiguration(t=>{(t.affectsConfiguration("explorerDates.persistentCache")||t.affectsConfiguration("explorerDates.maxMemoryUsage"))&&this._loadConfiguration()})}async _ensureCacheDirectory(){try{await ve.mkdir(this._cacheDir,{recursive:!0})}catch(e){this._logger.error("Failed to create cache directory",e)}}async get(e){if(this._memoryCache.has(e)){let t=this._memoryCache.get(e),o=this._cacheMetadata.get(e);if(this._isValid(o))return this._metrics.memoryHits++,this._updateAccessTime(e),t;this._removeFromMemory(e)}if(this._metrics.memoryMisses++,this._persistentCacheEnabled){let t=await this._getFromPersistentCache(e);if(t)return this._addToMemory(e,t.data,t.metadata),this._metrics.diskHits++,t.data}return this._metrics.diskMisses++,null}async set(e,t,o={}){let r={timestamp:Date.now(),lastAccess:Date.now(),size:this._estimateSize(t),ttl:o.ttl||864e5,tags:o.tags||[],version:o.version||1};this._addToMemory(e,t,r),this._persistentCacheEnabled&&this._schedulePersistentSave()}_addToMemory(e,t,o){this._currentMemoryUsage+o.size>this._maxMemoryUsage&&this._evictOldestItems(o.size),this._memoryCache.has(e)&&this._removeFromMemory(e),this._memoryCache.set(e,t),this._cacheMetadata.set(e,o),this._currentMemoryUsage+=o.size,this._logger.debug(`Added to cache: ${e} (${o.size} bytes)`)}_removeFromMemory(e){if(this._memoryCache.has(e)){let t=this._cacheMetadata.get(e);this._memoryCache.delete(e),this._cacheMetadata.delete(e),t&&(this._currentMemoryUsage-=t.size)}}_evictOldestItems(e){let t=Array.from(this._cacheMetadata.entries());t.sort((r,i)=>r[1].lastAccess-i[1].lastAccess);let o=0;for(let[r,i]of t)if(this._removeFromMemory(r),o+=i.size,this._metrics.evictions++,o>=e)break;this._logger.debug(`Evicted items to free ${o} bytes`)}_isValid(e){return e?Date.now()-e.timestamp<e.ttl:!1}_updateAccessTime(e){let t=this._cacheMetadata.get(e);t&&(t.lastAccess=Date.now())}_estimateSize(e){switch(typeof e){case"string":return e.length*2;case"number":return 8;case"boolean":return 4;case"object":return e===null?4:JSON.stringify(e).length*2;default:return 100}}async _loadPersistentCache(){try{let e=await ve.readFile(this._persistentCacheFile,"utf8"),t=JSON.parse(e),o=0,r=0;for(let[i,a]of Object.entries(t))this._isValid(a.metadata)?(this._addToMemory(i,a.data,a.metadata),o++):r++;this._metrics.persistentLoads++,this._logger.info(`Loaded persistent cache: ${o} items (${r} expired)`)}catch(e){e.code!=="ENOENT"&&this._logger.error("Failed to load persistent cache",e)}}async _savePersistentCache(){if(this._persistentCacheEnabled)try{let e={};for(let[t,o]of this._memoryCache.entries()){let r=this._cacheMetadata.get(t);r&&this._isValid(r)&&(e[t]={data:o,metadata:r})}await ve.writeFile(this._persistentCacheFile,JSON.stringify(e,null,2)),this._metrics.persistentSaves++,this._logger.debug(`Saved persistent cache: ${Object.keys(e).length} items`)}catch(e){this._logger.error("Failed to save persistent cache",e)}}async _getFromPersistentCache(e){try{let t=await ve.readFile(this._persistentCacheFile,"utf8"),r=JSON.parse(t)[e];if(r&&this._isValid(r.metadata))return r}catch{}return null}_schedulePersistentSave(){this._saveTimeout&&clearTimeout(this._saveTimeout),this._saveTimeout=setTimeout(()=>{this._savePersistentCache()},5e3)}_startIntervals(){this._cleanupInterval=setInterval(()=>{this._cleanupExpiredItems()},300*1e3),this._saveInterval=setInterval(()=>{this._savePersistentCache()},600*1e3)}_cleanupExpiredItems(){let e=[];for(let[t,o]of this._cacheMetadata.entries())this._isValid(o)||e.push(t);for(let t of e)this._removeFromMemory(t);e.length>0&&this._logger.debug(`Cleaned up ${e.length} expired cache items`)}invalidateByTags(e){let t=[];for(let[o,r]of this._cacheMetadata.entries())r.tags&&r.tags.some(i=>e.includes(i))&&t.push(o);for(let o of t)this._removeFromMemory(o);this._logger.debug(`Invalidated ${t.length} items by tags:`,e)}invalidateByPattern(e){let t=[],o=new RegExp(e);for(let r of this._memoryCache.keys())o.test(r)&&t.push(r);for(let r of t)this._removeFromMemory(r);this._logger.debug(`Invalidated ${t.length} items by pattern: ${e}`)}clear(){this._memoryCache.clear(),this._cacheMetadata.clear(),this._currentMemoryUsage=0,this._logger.info("Cache cleared")}getStats(){let e=this._metrics.memoryHits+this._metrics.memoryMisses>0?(this._metrics.memoryHits/(this._metrics.memoryHits+this._metrics.memoryMisses)*100).toFixed(2):"0",t=this._metrics.diskHits+this._metrics.diskMisses>0?(this._metrics.diskHits/(this._metrics.diskHits+this._metrics.diskMisses)*100).toFixed(2):"0";return{...this._metrics,memoryItems:this._memoryCache.size,memoryUsage:this._currentMemoryUsage,memoryUsagePercent:(this._currentMemoryUsage/this._maxMemoryUsage*100).toFixed(2),memoryHitRate:`${e}%`,diskHitRate:`${t}%`,persistentEnabled:this._persistentCacheEnabled}}async dispose(){this._cleanupInterval&&clearInterval(this._cleanupInterval),this._saveInterval&&clearInterval(this._saveInterval),this._saveTimeout&&clearTimeout(this._saveTimeout),this._persistentCacheEnabled&&await this._savePersistentCache(),this.clear(),this._logger.info("Advanced cache disposed",this.getStats())}};g(Oe,"AdvancedCache");var Le=Oe;gt.exports={AdvancedCache:Le}});var mt=L((Ao,pt)=>{var p=require("vscode"),{getLogger:jt}=R(),je=class je{constructor(){this._logger=jt(),this._currentThemeKind=p.window.activeColorTheme.kind,this._themeChangeListeners=[],this._setupThemeChangeDetection(),this._logger.info("ThemeIntegrationManager initialized",{currentTheme:this._getThemeKindName(this._currentThemeKind)})}_setupThemeChangeDetection(){p.window.onDidChangeActiveColorTheme(e=>{let t=this._currentThemeKind;this._currentThemeKind=e.kind,this._logger.debug("Theme changed",{from:this._getThemeKindName(t),to:this._getThemeKindName(e.kind)}),this._themeChangeListeners.forEach(o=>{try{o(e,t)}catch(r){this._logger.error("Theme change listener failed",r)}})})}_getThemeKindName(e){switch(e){case p.ColorThemeKind.Light:return"Light";case p.ColorThemeKind.Dark:return"Dark";case p.ColorThemeKind.HighContrast:return"High Contrast";default:return"Unknown"}}onThemeChange(e){return this._themeChangeListeners.push(e),{dispose:g(()=>{let t=this._themeChangeListeners.indexOf(e);t!==-1&&this._themeChangeListeners.splice(t,1)},"dispose")}}getAdaptiveColors(){let e=this._currentThemeKind===p.ColorThemeKind.Light;return this._currentThemeKind===p.ColorThemeKind.HighContrast?this._getHighContrastColors():e?this._getLightThemeColors():this._getDarkThemeColors()}_getLightThemeColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("list.warningForeground"),old:new p.ThemeColor("list.errorForeground"),javascript:new p.ThemeColor("symbolIcon.functionForeground"),css:new p.ThemeColor("symbolIcon.colorForeground"),html:new p.ThemeColor("symbolIcon.snippetForeground"),json:new p.ThemeColor("symbolIcon.stringForeground"),markdown:new p.ThemeColor("symbolIcon.textForeground"),python:new p.ThemeColor("symbolIcon.classForeground"),subtle:new p.ThemeColor("list.inactiveSelectionForeground"),muted:new p.ThemeColor("list.deemphasizedForeground"),emphasis:new p.ThemeColor("list.highlightForeground")}}_getDarkThemeColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("charts.yellow"),old:new p.ThemeColor("charts.red"),javascript:new p.ThemeColor("symbolIcon.functionForeground"),css:new p.ThemeColor("charts.purple"),html:new p.ThemeColor("charts.orange"),json:new p.ThemeColor("symbolIcon.stringForeground"),markdown:new p.ThemeColor("charts.yellow"),python:new p.ThemeColor("symbolIcon.classForeground"),subtle:new p.ThemeColor("list.inactiveSelectionForeground"),muted:new p.ThemeColor("list.deemphasizedForeground"),emphasis:new p.ThemeColor("list.highlightForeground")}}_getHighContrastColors(){return{veryRecent:new p.ThemeColor("list.highlightForeground"),recent:new p.ThemeColor("list.warningForeground"),old:new p.ThemeColor("list.errorForeground"),javascript:new p.ThemeColor("list.highlightForeground"),css:new p.ThemeColor("list.warningForeground"),html:new p.ThemeColor("list.errorForeground"),json:new p.ThemeColor("list.highlightForeground"),markdown:new p.ThemeColor("list.warningForeground"),python:new p.ThemeColor("list.errorForeground"),subtle:new p.ThemeColor("list.highlightForeground"),muted:new p.ThemeColor("list.inactiveSelectionForeground"),emphasis:new p.ThemeColor("list.focusHighlightForeground")}}getColorForContext(e,t="normal"){let o=this.getAdaptiveColors();switch(e){case"success":case"recent":return t==="subtle"?o.subtle:o.veryRecent;case"warning":case"medium":return t==="subtle"?o.muted:o.recent;case"error":case"old":return t==="subtle"?o.emphasis:o.old;case"javascript":case"typescript":return o.javascript;case"css":case"scss":case"less":return o.css;case"html":case"xml":return o.html;case"json":case"yaml":return o.json;case"markdown":case"text":return o.markdown;case"python":return o.python;default:return t==="subtle"?o.muted:o.subtle}}applyThemeAwareColorScheme(e,t="",o=0){if(e==="none")return;if(e==="adaptive")return this._getAdaptiveColorForFile(t,o);let r=this.getAdaptiveColors();switch(e){case"recency":return o<36e5?r.veryRecent:o<864e5?r.recent:r.old;case"file-type":return this._getFileTypeColor(t);case"subtle":return o<36e5?r.subtle:o<6048e5?r.muted:r.emphasis;case"vibrant":return this._getVibrantSelectionAwareColor(o);default:return}}_getVibrantSelectionAwareColor(e){return e<36e5?new p.ThemeColor("list.highlightForeground"):e<864e5?new p.ThemeColor("list.warningForeground"):new p.ThemeColor("list.errorForeground")}_getAdaptiveColorForFile(e,t){let o=this._getFileTypeColor(e);if(o)return o;let r=this.getAdaptiveColors();return t<36e5?r.veryRecent:t<864e5?r.recent:r.old}_getFileTypeColor(e){let t=require("path").extname(e).toLowerCase(),o=this.getAdaptiveColors();return[".js",".ts",".jsx",".tsx",".mjs"].includes(t)?o.javascript:[".css",".scss",".sass",".less",".stylus"].includes(t)?o.css:[".html",".htm",".xml",".svg"].includes(t)?o.html:[".json",".yaml",".yml",".toml"].includes(t)?o.json:[".md",".markdown",".txt",".rst"].includes(t)?o.markdown:[".py",".pyx",".pyi"].includes(t)?o.python:null}getSuggestedColorScheme(){switch(this._currentThemeKind){case p.ColorThemeKind.Light:return"vibrant";case p.ColorThemeKind.Dark:return"recency";case p.ColorThemeKind.HighContrast:return"none";default:return"recency"}}getIconThemeIntegration(){return{iconTheme:p.workspace.getConfiguration("workbench").get("iconTheme"),suggestions:{"vs-seti":{recommendedColorScheme:"file-type",description:"File-type colors complement Seti icons perfectly"},"material-icon-theme":{recommendedColorScheme:"subtle",description:"Subtle colors work well with Material icons"},"vscode-icons":{recommendedColorScheme:"recency",description:"Recency-based colors pair nicely with VS Code icons"}}}}async autoConfigureForTheme(){try{let e=p.workspace.getConfiguration("explorerDates"),t=e.get("colorScheme","none");if(t==="none"||t==="auto"){let o=this.getSuggestedColorScheme();await e.update("colorScheme",o,p.ConfigurationTarget.Global),this._logger.info(`Auto-configured color scheme for ${this._getThemeKindName(this._currentThemeKind)} theme: ${o}`),await p.window.showInformationMessage(`Explorer Dates adapted to your ${this._getThemeKindName(this._currentThemeKind)} theme`,"Customize","OK")==="Customize"&&await p.commands.executeCommand("workbench.action.openSettings","explorerDates.colorScheme")}}catch(e){this._logger.error("Failed to auto-configure for theme",e)}}getCurrentThemeInfo(){return{kind:this._currentThemeKind,kindName:this._getThemeKindName(this._currentThemeKind),isLight:this._currentThemeKind===p.ColorThemeKind.Light,isDark:this._currentThemeKind===p.ColorThemeKind.Dark,isHighContrast:this._currentThemeKind===p.ColorThemeKind.HighContrast,suggestedColorScheme:this.getSuggestedColorScheme(),adaptiveColors:this.getAdaptiveColors()}}dispose(){this._themeChangeListeners.length=0,this._logger.info("ThemeIntegrationManager disposed")}};g(je,"ThemeIntegrationManager");var Be=je;pt.exports={ThemeIntegrationManager:Be}});var wt=L((zo,ft)=>{var W=require("vscode"),{getLogger:Wt}=R(),{getLocalization:Ut}=le(),Ue=class Ue{constructor(){this._logger=Wt(),this._l10n=Ut(),this._isAccessibilityMode=!1,this._keyboardNavigationEnabled=!0,this._focusIndicators=new Map,this._loadConfiguration(),this._setupConfigurationListener(),this._logger.info("AccessibilityManager initialized",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled})}_loadConfiguration(){let e=W.workspace.getConfiguration("explorerDates");this._isAccessibilityMode=e.get("accessibilityMode",!1),!e.has("accessibilityMode")&&this._detectScreenReader()&&this._logger.info("Screen reader detected - consider enabling accessibility mode in settings"),this._keyboardNavigationEnabled=e.get("keyboardNavigation",!0)}_setupConfigurationListener(){W.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.accessibilityMode")||e.affectsConfiguration("explorerDates.keyboardNavigation"))&&(this._loadConfiguration(),this._logger.debug("Accessibility configuration updated",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled}))})}getAccessibleTooltip(e,t,o,r,i=null){if(!this._isAccessibilityMode)return null;let l=require("path").basename(e),h=this._formatAccessibleDate(t),f=this._formatAccessibleDate(o),m=`File: ${l}. `;return m+=`Last modified: ${h}. `,m+=`Created: ${f}. `,r!==void 0&&(m+=`Size: ${this._formatAccessibleFileSize(r)}. `),i&&i.authorName&&(m+=`Last modified by: ${i.authorName}. `),m+=`Full path: ${e}`,m}_formatAccessibleDate(e){let o=new Date().getTime()-e.getTime(),r=Math.floor(o/(1e3*60)),i=Math.floor(o/(1e3*60*60)),a=Math.floor(o/(1e3*60*60*24));return r<1?"just now":r<60?`${r} ${r===1?"minute":"minutes"} ago`:i<24?`${i} ${i===1?"hour":"hours"} ago`:a<7?`${a} ${a===1?"day":"days"} ago`:e.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}_formatAccessibleFileSize(e){if(e<1024)return`${e} bytes`;let t=e/1024;if(t<1024)return`${Math.round(t)} kilobytes`;let o=t/1024;return`${Math.round(o*10)/10} megabytes`}getAccessibleBadge(e){if(!this._isAccessibilityMode)return e;let t=e.split("|"),o=t[0],r=t[1],i=t.length>2?t[2]:null,a=this._expandTimeAbbreviation(o);return r&&(a+=` ${this._expandSizeAbbreviation(r)}`),i&&(a+=` by ${i.replace("\u2022","")}`),a}_expandTimeAbbreviation(e){let t={m:" minutes ago",h:" hours ago",d:" days ago",w:" weeks ago",mo:" months ago",yr:" years ago",min:" minutes ago",hrs:" hours ago",day:" days ago",wk:" weeks ago"},o=e;for(let[r,i]of Object.entries(t))if(e.endsWith(r)){o=e.slice(0,-r.length)+i;break}return o}_expandSizeAbbreviation(e){if(!e.startsWith("~"))return e;let t=e.slice(1);return t.endsWith("B")?t.slice(0,-1)+" bytes":t.endsWith("K")?t.slice(0,-1)+" kilobytes":t.endsWith("M")?t.slice(0,-1)+" megabytes":t}createFocusIndicator(e,t){if(!this._keyboardNavigationEnabled)return null;let o=Math.random().toString(36).substr(2,9);return this._focusIndicators.set(o,{element:e,description:t,timestamp:Date.now()}),{id:o,dispose:g(()=>{this._focusIndicators.delete(o)},"dispose")}}announceToScreenReader(e,t="polite"){this._isAccessibilityMode&&(t==="assertive"?W.window.showWarningMessage(e):this._logger.debug("Screen reader announcement",{message:e,priority:t}))}getKeyboardShortcutHelp(){return[{key:"Ctrl+Shift+D (Cmd+Shift+D)",command:"Toggle date decorations",description:"Show or hide file modification times in Explorer"},{key:"Ctrl+Shift+C (Cmd+Shift+C)",command:"Copy file date",description:"Copy selected file's modification date to clipboard"},{key:"Ctrl+Shift+I (Cmd+Shift+I)",command:"Show file details",description:"Display detailed information about selected file"},{key:"Ctrl+Shift+R (Cmd+Shift+R)",command:"Refresh decorations",description:"Refresh all file modification time decorations"},{key:"Ctrl+Shift+A (Cmd+Shift+A)",command:"Show workspace activity",description:"Open workspace file activity analysis"},{key:"Ctrl+Shift+F (Cmd+Shift+F)",command:"Toggle fade old files",description:"Toggle fading effect for old files"}]}async showKeyboardShortcutsHelp(){let e=this.getKeyboardShortcutHelp();await W.window.showInformationMessage("Keyboard shortcuts help available in output panel","Show Shortcuts").then(t=>{if(t==="Show Shortcuts"){let o=W.window.createOutputChannel("Explorer Dates Shortcuts");o.appendLine("Explorer Dates Keyboard Shortcuts"),o.appendLine("====================================="),o.appendLine(""),e.forEach(r=>{o.appendLine(`${r.key}`),o.appendLine(`  Command: ${r.command}`),o.appendLine(`  Description: ${r.description}`),o.appendLine("")}),o.show()}})}shouldEnhanceAccessibility(){return this._isAccessibilityMode||this._detectScreenReader()}_detectScreenReader(){return W.workspace.getConfiguration("editor").get("accessibilitySupport")==="on"}getAccessibilityRecommendations(){let e=[];return this._detectScreenReader()&&(e.push({type:"setting",setting:"explorerDates.accessibilityMode",value:!0,reason:"Enable enhanced tooltips and screen reader optimizations"}),e.push({type:"setting",setting:"explorerDates.colorScheme",value:"none",reason:"Colors may not be useful with screen readers"}),e.push({type:"setting",setting:"explorerDates.dateDecorationFormat",value:"relative-long",reason:"Longer format is more descriptive for screen readers"})),W.window.activeColorTheme.kind===W.ColorThemeKind.HighContrast&&e.push({type:"setting",setting:"explorerDates.highContrastMode",value:!0,reason:"Optimize for high contrast themes"}),e}async applyAccessibilityRecommendations(){let e=this.getAccessibilityRecommendations();if(e.length===0){W.window.showInformationMessage("No accessibility recommendations at this time.");return}let t=W.workspace.getConfiguration("explorerDates"),o=0;for(let r of e)if(r.type==="setting")try{await t.update(r.setting.replace("explorerDates.",""),r.value,W.ConfigurationTarget.Global),o++,this._logger.info(`Applied accessibility recommendation: ${r.setting} = ${r.value}`)}catch(i){this._logger.error(`Failed to apply recommendation: ${r.setting}`,i)}o>0&&W.window.showInformationMessage(`Applied ${o} accessibility recommendations. Restart may be required for all changes to take effect.`)}dispose(){this._focusIndicators.clear(),this._logger.info("AccessibilityManager disposed")}};g(Ue,"AccessibilityManager");var We=Ue;ft.exports={AccessibilityManager:We}});var yt=L((No,bt)=>{var w=require("vscode"),vt=require("fs").promises,y=require("path"),{getLogger:qt}=R(),{getLocalization:Ht}=le(),{exec:Gt}=require("child_process"),{promisify:Vt}=require("util"),{SmartExclusionManager:Kt}=ct(),{BatchProcessor:Jt}=dt(),{AdvancedCache:Qt}=ut(),{ThemeIntegrationManager:Yt}=mt(),{AccessibilityManager:Zt}=wt(),Xt=Vt(Gt),He=class He{constructor(){this._onDidChangeFileDecorations=new w.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event,this._decorationCache=new Map,this._cacheTimeout=12e4,this._maxCacheSize=1e4,this._cacheKeyStats=new Map,this._logger=qt(),this._l10n=Ht(),this._smartExclusion=new Kt,this._batchProcessor=new Jt,this._advancedCache=null,this._themeIntegration=new Yt,this._accessibility=new Zt,this._metrics={totalDecorations:0,cacheHits:0,cacheMisses:0,errors:0},this._previewSettings=null,this._setupFileWatcher(),this._setupConfigurationWatcher(),this._logger.info("FileDateDecorationProvider initialized"),this._previewSettings=null}applyPreviewSettings(e){let t=!!this._previewSettings;e&&typeof e=="object"?(this._previewSettings=Object.assign({},e),this._logger.info("\u{1F504} Applied preview settings",this._previewSettings)):(this._previewSettings=null,this._logger.info("\u{1F504} Cleared preview settings"));let o=this._decorationCache.size;if(this._decorationCache.clear(),this._logger.info(`\u{1F5D1}\uFE0F Cleared memory cache (${o} items) for preview mode change`),this._advancedCache)try{typeof this._advancedCache.clear=="function"?(this._advancedCache.clear(),this._logger.info("\u{1F5D1}\uFE0F Cleared advanced cache for preview mode change")):this._logger.warn("\u26A0\uFE0F Advanced cache does not support clear operation")}catch(r){this._logger.warn("\u26A0\uFE0F Failed to clear advanced cache:",r.message)}this._previewSettings&&!t?this._logger.info("\u{1F3AD} Entered preview mode - caching disabled"):!this._previewSettings&&t&&this._logger.info("\u{1F3AD} Exited preview mode - caching re-enabled"),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Fired decoration refresh event for preview change")}async testDecorationProvider(){this._logger.info("\u{1F9EA} Testing decoration provider functionality...");let e=w.workspace.workspaceFolders;if(!e||e.length===0){this._logger.error("\u274C No workspace folders available for testing");return}let t=w.Uri.joinPath(e[0].uri,"package.json");try{let o=await this.provideFileDecoration(t);this._logger.info("\u{1F9EA} Test decoration result:",{file:"package.json",success:!!o,badge:o==null?void 0:o.badge,hasTooltip:!!(o!=null&&o.tooltip),hasColor:!!(o!=null&&o.color)}),this._onDidChangeFileDecorations.fire(t),this._logger.info("\u{1F504} Fired decoration change event for test file")}catch(o){this._logger.error("\u274C Test decoration failed:",o)}}forceRefreshAllDecorations(){this._logger.info("\u{1F504} Force refreshing ALL decorations..."),this._decorationCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Triggered global decoration refresh")}startProviderCallMonitoring(){this._providerCallCount=0,this._providerCallFiles=new Set;let e=this.provideFileDecoration.bind(this);this.provideFileDecoration=async(t,o)=>(this._providerCallCount++,this._providerCallFiles.add(t.fsPath),this._logger.info(`\u{1F50D} Provider called ${this._providerCallCount} times for: ${t.fsPath}`),await e(t,o)),this._logger.info("\u{1F4CA} Started provider call monitoring")}getProviderCallStats(){return{totalCalls:this._providerCallCount||0,uniqueFiles:this._providerCallFiles?this._providerCallFiles.size:0,calledFiles:this._providerCallFiles?Array.from(this._providerCallFiles):[]}}_setupFileWatcher(){let e=w.workspace.createFileSystemWatcher("**/*");e.onDidChange(t=>this.refreshDecoration(t)),e.onDidCreate(t=>this.refreshDecoration(t)),e.onDidDelete(t=>this.clearDecoration(t)),this._fileWatcher=e}_setupConfigurationWatcher(){w.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration("explorerDates")){this._logger.debug("Configuration changed, updating settings");let t=w.workspace.getConfiguration("explorerDates");this._cacheTimeout=t.get("cacheTimeout",3e4),this._maxCacheSize=t.get("maxCacheSize",1e4),(e.affectsConfiguration("explorerDates.showDateDecorations")||e.affectsConfiguration("explorerDates.dateDecorationFormat")||e.affectsConfiguration("explorerDates.excludedFolders")||e.affectsConfiguration("explorerDates.excludedPatterns")||e.affectsConfiguration("explorerDates.highContrastMode")||e.affectsConfiguration("explorerDates.fadeOldFiles")||e.affectsConfiguration("explorerDates.fadeThreshold")||e.affectsConfiguration("explorerDates.colorScheme")||e.affectsConfiguration("explorerDates.showGitInfo")||e.affectsConfiguration("explorerDates.customColors")||e.affectsConfiguration("explorerDates.showFileSize")||e.affectsConfiguration("explorerDates.fileSizeFormat"))&&this.refreshAll()}})}refreshDecoration(e){let t=this._getCacheKey(e);if(this._decorationCache.delete(t),this._advancedCache)try{this._advancedCache.invalidateByPattern(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}catch(o){this._logger.debug(`Could not invalidate advanced cache for ${y.basename(e.fsPath)}: ${o.message}`)}this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F504} Refreshed decoration cache for: ${y.basename(e.fsPath)}`)}clearDecoration(e){let t=this._getCacheKey(e);this._decorationCache.delete(t),this._advancedCache&&this._logger.debug(`Advanced cache entry will expire naturally: ${y.basename(e.fsPath)}`),this._onDidChangeFileDecorations.fire(e),this._logger.debug(`\u{1F5D1}\uFE0F Cleared decoration cache for: ${y.basename(e.fsPath)}`)}clearAllCaches(){let e=this._decorationCache.size;this._decorationCache.clear(),this._logger.info(`Cleared memory cache (was ${e} items)`),this._advancedCache&&(this._advancedCache.clear(),this._logger.info("Cleared advanced cache")),this._metrics.cacheHits=0,this._metrics.cacheMisses=0,this._logger.info("All caches cleared successfully")}refreshAll(){this._decorationCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("All decorations refreshed with cache clear")}async _isExcludedSimple(e){let t=w.workspace.getConfiguration("explorerDates"),o=e.fsPath,r=y.basename(o),i=y.extname(o).toLowerCase(),a=t.get("forceShowForFileTypes",[]);if(a.length>0&&a.includes(i))return this._logger.debug(`File type ${i} is forced to show: ${o}`),!1;let l=t.get("enableTroubleShootingMode",!1);l&&this._logger.info(`\u{1F50D} Checking exclusion for: ${r} (ext: ${i})`);let h=t.get("excludedFolders",["node_modules",".git","dist","build","out",".vscode-test"]),f=t.get("excludedPatterns",["**/*.tmp","**/*.log","**/.git/**","**/node_modules/**"]);for(let m of h)if(o.includes(`${y.sep}${m}${y.sep}`)||o.endsWith(`${y.sep}${m}`))return l?this._logger.info(`\u274C File excluded by folder: ${o} (${m})`):this._logger.debug(`File excluded by folder: ${o} (${m})`),!0;for(let m of f)if(m.includes("node_modules")&&o.includes("node_modules")||m.includes(".git/**")&&o.includes(".git"+y.sep)||m.includes("*.tmp")&&r.endsWith(".tmp")||m.includes("*.log")&&r.endsWith(".log"))return!0;return l&&this._logger.info(`\u2705 File NOT excluded: ${r} (ext: ${i})`),!1}async _isExcluded(e){let t=w.workspace.getConfiguration("explorerDates"),o=e.fsPath,r=y.basename(o),i=w.workspace.getWorkspaceFolder(e);if(i){let a=await this._smartExclusion.getCombinedExclusions(i.uri);for(let l of a.folders)if(new RegExp(`(^|${y.sep.replace(/[\\]/g,"\\\\")})${l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(${y.sep.replace(/[\\]/g,"\\\\")}|$)`).test(o))return this._logger.debug(`File excluded by folder rule: ${o} (folder: ${l})`),!0;for(let l of a.patterns){let h=l.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),f=new RegExp(h);if(f.test(o)||f.test(r))return this._logger.debug(`File excluded by pattern: ${o} (pattern: ${l})`),!0}}else{let a=t.get("excludedFolders",[]),l=t.get("excludedPatterns",[]);for(let h of a)if(new RegExp(`(^|${y.sep.replace(/[\\]/g,"\\\\")})${h.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(${y.sep.replace(/[\\]/g,"\\\\")}|$)`).test(o))return!0;for(let h of l){let f=h.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),m=new RegExp(f);if(m.test(o)||m.test(r))return!0}}return!1}_manageCacheSize(){if(this._decorationCache.size>this._maxCacheSize){this._logger.debug(`Cache size (${this._decorationCache.size}) exceeds max (${this._maxCacheSize}), cleaning old entries`);let e=Math.floor(this._maxCacheSize*.2),t=Array.from(this._decorationCache.entries());t.sort((o,r)=>o[1].timestamp-r[1].timestamp);for(let o=0;o<e&&o<t.length;o++)this._decorationCache.delete(t[o][0]);this._logger.debug(`Removed ${e} old cache entries`)}}_formatDateBadge(e,t,o=null){let i=o!==null?o:new Date().getTime()-e.getTime(),a=Math.floor(i/(1e3*60)),l=Math.floor(i/(1e3*60*60)),h=Math.floor(i/(1e3*60*60*24)),f=Math.floor(h/7),m=Math.floor(h/30);switch(t){case"relative-short":case"relative-long":return a<1?"\u25CF\u25CF":a<60?`${Math.min(a,99)}m`:l<24?`${Math.min(l,23)}h`:h<7?`${h}d`:f<4?`${f}w`:m<12?`${m}M`:"1y";case"absolute-short":case"absolute-long":{let b=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],F=e.getDate();return`${b[e.getMonth()]}${F<10?"0"+F:F}`}case"technical":return a<60?`${a}m`:l<24?`${l}h`:`${h}d`;case"minimal":return l<1?"\u2022\u2022":l<24?"\u25CB\u25CB":"\u2500\u2500";default:return a<60?`${a}m`:l<24?`${l}h`:`${h}d`}}_formatFileSize(e,t="auto"){if(t==="bytes")return`~${e}B`;let o=e/1024;if(t==="kb")return`~${o.toFixed(1)}K`;let r=o/1024;return t==="mb"?`~${r.toFixed(1)}M`:e<1024?`~${e}B`:o<1024?`~${Math.round(o)}K`:`~${r.toFixed(1)}M`}_getColorByScheme(e,t,o=""){if(t==="none")return;let i=new Date().getTime()-e.getTime(),a=Math.floor(i/(1e3*60*60)),l=Math.floor(i/(1e3*60*60*24));switch(t){case"recency":return a<1?new w.ThemeColor("charts.green"):a<24?new w.ThemeColor("charts.yellow"):new w.ThemeColor("charts.red");case"file-type":{let h=y.extname(o).toLowerCase();return[".js",".ts",".jsx",".tsx"].includes(h)?new w.ThemeColor("charts.blue"):[".css",".scss",".less"].includes(h)?new w.ThemeColor("charts.purple"):[".html",".htm",".xml"].includes(h)?new w.ThemeColor("charts.orange"):[".json",".yaml",".yml"].includes(h)?new w.ThemeColor("charts.green"):[".md",".txt",".log"].includes(h)?new w.ThemeColor("charts.yellow"):[".py",".rb",".php"].includes(h)?new w.ThemeColor("charts.red"):new w.ThemeColor("editorForeground")}case"subtle":return a<1?new w.ThemeColor("editorInfo.foreground"):l<7?new w.ThemeColor("editorWarning.foreground"):new w.ThemeColor("editorError.foreground");case"vibrant":return a<1?new w.ThemeColor("terminal.ansiGreen"):a<24?new w.ThemeColor("terminal.ansiYellow"):l<7?new w.ThemeColor("terminal.ansiMagenta"):new w.ThemeColor("terminal.ansiRed");case"custom":{let f=w.workspace.getConfiguration("explorerDates").get("customColors",{veryRecent:"#00ff00",recent:"#ffff00",old:"#ff0000"});return a<1?f.veryRecent.toLowerCase().includes("green")||f.veryRecent==="#00ff00"?new w.ThemeColor("terminal.ansiGreen"):new w.ThemeColor("editorInfo.foreground"):a<24?f.recent.toLowerCase().includes("yellow")||f.recent==="#ffff00"?new w.ThemeColor("terminal.ansiYellow"):new w.ThemeColor("editorWarning.foreground"):f.old.toLowerCase().includes("red")||f.old==="#ff0000"?new w.ThemeColor("terminal.ansiRed"):new w.ThemeColor("editorError.foreground")}default:return}}_formatDateReadable(e){let t=new Date,o=t.getTime()-e.getTime(),r=Math.floor(o/(1e3*60)),i=Math.floor(o/(1e3*60*60)),a=Math.floor(o/(1e3*60*60*24));return r<1?this._l10n.getString("justNow"):r<60?this._l10n.getString("minutesAgo",r):i<24&&e.toDateString()===t.toDateString()?this._l10n.getString("hoursAgo",i):a<7?a===1?this._l10n.getString("yesterday"):this._l10n.getString("daysAgo",a):e.getFullYear()===t.getFullYear()?this._l10n.formatDate(e,{month:"short",day:"numeric"}):this._l10n.formatDate(e,{month:"short",day:"numeric",year:"numeric"})}async _getGitBlameInfo(e){try{let t=w.workspace.getWorkspaceFolder(w.Uri.file(e));if(!t)return null;let o=y.relative(t.uri.fsPath,e),{stdout:r}=await Xt(`git log -1 --format="%an|%ae|%ad" -- "${o}"`,{cwd:t.uri.fsPath,timeout:2e3});if(!r||!r.trim())return null;let[i,a,l]=r.trim().split("|");return{authorName:i||"Unknown",authorEmail:a||"",authorDate:l||""}}catch{return null}}_getInitials(e){if(!e||typeof e!="string")return null;let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?null:t.length===1?t[0].substring(0,2).toUpperCase():(t[0][0]+(t[1][0]||"")).substring(0,2).toUpperCase()}_formatCompactSize(e){if(typeof e!="number"||isNaN(e))return null;let t=["B","K","M","G","T"],o=0,r=e;for(;r>=1024&&o<t.length-1;)r=r/1024,o++;let i=Math.round(r),a=t[o];if(i<=9)return`${i}${a}`;let l=String(i);return l.length>=2?l.slice(0,2):l}_formatFullDate(e){let t={year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"};return e.toLocaleString("en-US",t)}_getCacheKey(e){return y.resolve(e.fsPath).toLowerCase()}async provideFileDecoration(e,t){var r,i,a,l;let o;try{if(o=Date.now(),!e||!e.fsPath)return;let h=require("path").basename(e.fsPath);this._logger.info(`\u{1F50D} VSCODE REQUESTED DECORATION: ${h} (${e.fsPath})`),this._logger.info(`\u{1F4CA} Call context: token=${!!t}, cancelled=${t==null?void 0:t.isCancellationRequested}`);let f=w.workspace.getConfiguration("explorerDates"),m=g((d,C)=>{if(this._previewSettings&&Object.prototype.hasOwnProperty.call(this._previewSettings,d)){let x=this._previewSettings[d];return this._logger.debug(`\u{1F3AD} Using preview value for ${d}: ${x} (config has: ${f.get(d,C)})`),x}return f.get(d,C)},"_get");if(this._previewSettings&&this._logger.info(`\u{1F3AD} Processing ${h} in PREVIEW MODE with settings:`,this._previewSettings),!m("showDateDecorations",!0)){this._logger.info(`\u274C RETURNED UNDEFINED: Decorations disabled globally for ${h}`);return}if(e.scheme!=="file"){this._logger.debug(`Non-file URI scheme: ${e.scheme}`);return}let b=e.fsPath,F=this._getCacheKey(e);if(await this._isExcludedSimple(e)){this._logger.info(`\u274C File excluded: ${y.basename(b)}`);return}this._logger.debug(`\u{1F50D} Processing file: ${y.basename(b)}`);let O=null;if(this._previewSettings)this._logger.debug(`\u{1F504} Skipping cache due to active preview settings for: ${y.basename(b)}`);else{if(this._advancedCache)try{if(O=await this._advancedCache.get(F),O)return this._metrics.cacheHits++,this._logger.debug(`\u{1F9E0} Advanced cache hit for: ${y.basename(b)}`),O}catch(d){this._logger.debug(`Advanced cache error: ${d.message}`)}if(O=this._decorationCache.get(F),O&&Date.now()-O.timestamp<this._cacheTimeout)return this._metrics.cacheHits++,this._logger.debug(`\u{1F4BE} Memory cache hit for: ${y.basename(b)}`),O.decoration}if(this._metrics.cacheMisses++,this._logger.debug(`\u274C Cache miss for: ${y.basename(b)} (key: ${F.substring(0,50)}...)`),t&&t.isCancellationRequested){this._logger.debug(`Decoration cancelled for: ${b}`);return}let B=await vt.stat(b);if(!B.isFile())return;let J=B.mtime,re=B.birthtime,ie=new Date().getTime()-J.getTime(),ye=m("dateDecorationFormat","smart"),K=m("colorScheme","none"),he=m("highContrastMode",!1),Ce=m("showFileSize",!1),rt=m("fileSizeFormat","auto"),se=this._formatDateBadge(J,ye,ie),xe=this._formatDateReadable(J),_e=this._formatDateReadable(re),ge=m("showGitInfo","none"),Z=m("badgePriority","time"),M=ge!=="none"||Z==="author"?await this._getGitBlameInfo(b):null,X=se;if(this._logger.debug(`\u{1F3F7}\uFE0F Badge generation for ${y.basename(b)}: badgePriority=${Z}, showGitInfo=${ge}, hasGitBlame=${!!M}, authorName=${M==null?void 0:M.authorName}, previewMode=${!!this._previewSettings}`),Z==="author"&&M&&M.authorName){let d=this._getInitials(M.authorName);d&&(X=d,this._logger.debug(`\u{1F3F7}\uFE0F Using author initials badge: "${d}" (from ${M.authorName})`))}else if(Z==="size"&&Ce){let d=this._formatCompactSize(B.size);d&&(X=d,this._logger.debug(`\u{1F3F7}\uFE0F Using size badge: "${d}"`))}else X=se,this._logger.debug(`\u{1F3F7}\uFE0F Using time badge: "${se}" (badgePriority=${Z})`);let ue=y.basename(b),ae=y.extname(b),De=[".js",".ts",".jsx",".tsx",".py",".rb",".php",".java",".cpp",".c",".cs",".go",".rs",".kt",".swift"].includes(ae.toLowerCase()),ne=m("accessibilityMode",!1),ce=ne&&((r=this._accessibility)==null?void 0:r.shouldEnhanceAccessibility());this._logger.debug(`\u{1F50D} Tooltip generation for ${y.basename(b)}: accessibilityMode=${ne}, shouldUseAccessible=${ce}, previewMode=${!!this._previewSettings}`);let $;if(this._logger.info(`\u{1F50D} TOOLTIP GENERATION START: accessibilityMode=${ne}, shouldUseAccessible=${ce}, file=${y.basename(b)}`),ce){let d=this._accessibility.getAccessibleTooltip(b,J,re,B.size,M);d?($=d,this._logger.info(`\u{1F50D} Using accessible tooltip (${d.length} chars): "${d.substring(0,50)}..."`)):this._logger.info("\u{1F50D} Accessible tooltip generation failed, using rich tooltip")}if(!$){if(this._logger.info(`\u{1F50D} Creating RICH tooltip for ${y.basename(b)}`),$=`\u{1F4C4} File: ${ue}
`,$+=`\u{1F4DD} Last Modified: ${xe}
`,$+=`   ${this._formatFullDate(J)}

`,$+=`\u{1F4C5} Created: ${_e}
`,$+=`   ${this._formatFullDate(re)}

`,$+=`\u{1F4CA} Size: ${this._formatFileSize(B.size,"auto")} (${B.size.toLocaleString()} bytes)
`,ae&&($+=`\u{1F3F7}\uFE0F Type: ${ae.toUpperCase()} file
`),De)try{let C=(await vt.readFile(b,"utf8")).split(`
`).length;$+=`\u{1F4CF} Lines: ${C.toLocaleString()}
`}catch{}$+=`\u{1F4C2} Path: ${b}`,M&&($+=`

\u{1F464} Last Modified By: ${M.authorName}`,M.authorEmail&&($+=` (${M.authorEmail})`),M.authorDate&&($+=`
   ${M.authorDate}`))}let U;K!=="none"&&(this._themeIntegration?U=this._themeIntegration.applyThemeAwareColorScheme(K,b,ie):U=this._getColorByScheme(J,K,b)),this._logger.debug(`\u{1F3A8} Color scheme setting: ${K}, using color: ${U?"yes":"no"}`);let Se=m("fadeOldFiles",!1),Fe=m("fadeThreshold",30);Se&&Math.floor(ie/864e5)>Fe&&(U=new w.ThemeColor("editorGutter.commentRangeForeground"));let P=X;this._accessibility&&this._accessibility.shouldEnhanceAccessibility()&&(P=this._accessibility.getAccessibleBadge(X)),P&&P.length>2&&(P=P.substring(0,2)),this._logger.info(`\u{1F3F7}\uFE0F Final badge for ${y.basename(b)}: "${P}" (type: ${typeof P})`);let _;try{if(_=new w.FileDecoration(P),this._logger.info(`\u{1F9EA} Simple decoration test: badge="${P}"`),$&&$.length<500&&(_.tooltip=$,this._logger.debug(`\u{1F4DD} Added tooltip (${$.length} chars)`)),U){let d=this._enhanceColorForSelection(U,K);_.color=d,this._logger.debug(`\u{1F3A8} Added enhanced color: ${d.id||d} (original: ${U.id||U})`)}_.propagate=!1,this._logger.info("\u{1F4DD} Final decoration:",{badge:_.badge,tooltip:_.tooltip?`${_.tooltip.length} chars`:"none",color:_.color?_.color.id||"custom":"none",propagate:_.propagate}),_.tooltip&&this._logger.info(`\u{1F4DD} Tooltip content preview: "${_.tooltip.substring(0,100)}..."`)}catch(d){this._logger.error("\u274C Failed to create decoration:",d),_=new w.FileDecoration("!!"),_.propagate=!1}if(this._logger.debug(`\u{1F3A8} Color/contrast check for ${y.basename(b)}: colorScheme=${K}, highContrastMode=${he}, hasColor=${!!U}, previewMode=${!!this._previewSettings}`),he&&(_.color=new w.ThemeColor("editorWarning.foreground"),this._logger.info(`\u{1F506} Applied high contrast color (overriding colorScheme=${K})`)),this._previewSettings)this._logger.debug(`\u{1F504} Skipping cache storage due to preview mode for: ${y.basename(b)}`);else{this._manageCacheSize();let d={decoration:_,timestamp:Date.now()};if(this._decorationCache.set(F,d),this._advancedCache)try{await this._advancedCache.set(F,_,{ttl:this._cacheTimeout}),this._logger.debug(`\u{1F9E0} Stored in advanced cache: ${y.basename(b)}`)}catch(C){this._logger.debug(`Failed to store in advanced cache: ${C.message}`)}}if(this._metrics.totalDecorations++,!_){this._logger.error(`\u274C Decoration is null for: ${y.basename(b)}`);return}if(!_.badge){this._logger.error(`\u274C Decoration badge is empty for: ${y.basename(b)}`);return}if(typeof _.badge!="string"||_.badge.length===0){this._logger.error(`\u274C Invalid badge type/length for: ${y.basename(b)} - Badge: ${_.badge}`);return}this._logger.info(`\u2705 Decoration created for: ${y.basename(b)} (badge: ${P||"undefined"}) - Cache key: ${F.substring(0,30)}...`);let s=Date.now()-o;return this._logger.info("\u{1F3AF} RETURNING DECORATION TO VSCODE:",{file:ue,badge:_.badge,hasTooltip:!!_.tooltip,hasColor:!!_.color,colorType:(a=(i=_.color)==null?void 0:i.constructor)==null?void 0:a.name,processingTimeMs:s,decorationType:_.constructor.name}),_}catch(h){this._metrics.errors++;let f=o?Date.now()-o:0,m=e!=null&&e.fsPath?require("path").basename(e.fsPath):"unknown-file",b=(e==null?void 0:e.fsPath)||"unknown-uri";this._logger.error(`\u274C DECORATION ERROR for ${m}:`,{error:h.message,stack:(l=h.stack)==null?void 0:l.split(`
`)[0],processingTimeMs:f,uri:b}),this._logger.error(`\u274C CRITICAL ERROR DETAILS for ${m}: ${h.message}`),this._logger.error(`\u274C Error type: ${h.constructor.name}`),this._logger.error(`\u274C Full stack: ${h.stack}`),this._logger.info(`\u274C RETURNED UNDEFINED: Error occurred for ${m}`);return}}getMetrics(){let e={...this._metrics,cacheSize:this._decorationCache.size,cacheHitRate:this._metrics.cacheHits+this._metrics.cacheMisses>0?(this._metrics.cacheHits/(this._metrics.cacheHits+this._metrics.cacheMisses)*100).toFixed(2)+"%":"0.00%"};return this._advancedCache&&(e.advancedCache=this._advancedCache.getStats()),this._batchProcessor&&(e.batchProcessor=this._batchProcessor.getMetrics()),e.cacheDebugging={memoryCacheKeys:Array.from(this._decorationCache.keys()).slice(0,5),cacheTimeout:this._cacheTimeout,maxCacheSize:this._maxCacheSize,keyStatsSize:this._cacheKeyStats?this._cacheKeyStats.size:0},e}async initializeAdvancedSystems(e){try{if(this._advancedCache=new Qt(e),await this._advancedCache.initialize(),this._logger.info("Advanced cache initialized"),this._batchProcessor.initialize(),this._logger.info("Batch processor initialized"),w.workspace.getConfiguration("explorerDates").get("autoThemeAdaptation",!0)&&(await this._themeIntegration.autoConfigureForTheme(),this._logger.info("Theme integration configured")),this._accessibility.shouldEnhanceAccessibility()&&(await this._accessibility.applyAccessibilityRecommendations(),this._logger.info("Accessibility recommendations applied")),w.workspace.workspaceFolders)for(let o of w.workspace.workspaceFolders)try{await this._smartExclusion.suggestExclusions(o.uri),this._logger.info(`Smart exclusions analyzed for: ${o.name}`)}catch(r){this._logger.error(`Failed to analyze smart exclusions for ${o.name}`,r)}this._logger.info("Advanced systems initialized successfully")}catch(t){this._logger.error("Failed to initialize advanced systems",t)}}_enhanceColorForSelection(e,t){let o={"charts.yellow":"list.warningForeground","charts.red":"list.errorForeground","charts.green":"list.highlightForeground","charts.blue":"symbolIcon.functionForeground","charts.purple":"symbolIcon.classForeground","charts.orange":"list.warningForeground","terminal.ansiYellow":"list.warningForeground","terminal.ansiGreen":"list.highlightForeground","terminal.ansiRed":"list.errorForeground","terminal.ansiBlue":"symbolIcon.functionForeground","terminal.ansiMagenta":"symbolIcon.classForeground","terminal.ansiCyan":"symbolIcon.stringForeground","editorGutter.commentRangeForeground":"list.deemphasizedForeground","editorWarning.foreground":"list.warningForeground","editorError.foreground":"list.errorForeground","editorInfo.foreground":"list.highlightForeground"},r=e.id||e,i=o[r];return i?(this._logger.debug(`\u{1F527} Enhanced color ${r} \u2192 ${i} for better selection visibility`),new w.ThemeColor(i)):e}async dispose(){this._logger.info("Disposing FileDateDecorationProvider",this.getMetrics()),this._advancedCache&&await this._advancedCache.dispose(),this._batchProcessor&&this._batchProcessor.dispose(),this._decorationCache.clear(),this._onDidChangeFileDecorations.dispose(),this._fileWatcher&&this._fileWatcher.dispose()}};g(He,"FileDateDecorationProvider");var qe=He;bt.exports={FileDateDecorationProvider:qe}});var xt=L((Oo,Ct)=>{var D=require("vscode"),{getLogger:eo}=R(),{getLocalization:to}=le(),Ve=class Ve{constructor(e){this._context=e,this._logger=eo(),this._l10n=to(),this._hasShownWelcome=e.globalState.get("explorerDates.hasShownWelcome",!1),this._hasCompletedSetup=e.globalState.get("explorerDates.hasCompletedSetup",!1),this._onboardingVersion=e.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this._hasShownWelcome,hasCompletedSetup:this._hasCompletedSetup,onboardingVersion:this._onboardingVersion})}async shouldShowOnboarding(){let e=this._context.extension.packageJSON.version;return!this._hasShownWelcome||!this._hasCompletedSetup||this._shouldShowVersionUpdate(e)}_shouldShowVersionUpdate(e){if(this._onboardingVersion==="0.0.0")return!0;let[t,o]=e.split(".").map(Number),[r,i]=this._onboardingVersion.split(".").map(Number);return t>r}_isMinorUpdate(e){if(this._onboardingVersion==="0.0.0")return!1;let[t,o]=e.split(".").map(Number),[r,i]=this._onboardingVersion.split(".").map(Number);return t===r&&o>i}async showWelcomeMessage(){try{let e=this._context.extension.packageJSON.version,t=this._hasShownWelcome,o=this._isMinorUpdate(e);if(o)return this._showGentleUpdateNotification(e);let r=t?`Explorer Dates has been updated to v${e} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!",i=t?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"],a=await D.window.showInformationMessage(r,{modal:!1},...i);switch(await this._context.globalState.update("explorerDates.hasShownWelcome",!0),await this._context.globalState.update("explorerDates.onboardingVersion",e),a){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(e);break;case"\u2699\uFE0F Settings":await D.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await D.commands.executeCommand("explorerDates.previewConfiguration",r.settings);break;case"clearPreview":await D.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action:a,isUpdate:t,isMinorUpdate:o})}catch(e){this._logger.error("Failed to show welcome message",e)}}async _showGentleUpdateNotification(e){let t=D.window.createStatusBarItem(D.StatusBarAlignment.Right,100);t.text=`$(check) Explorer Dates updated to v${e}`,t.tooltip="Click to see what's new in Explorer Dates",t.command="explorerDates.showWhatsNew",t.show(),setTimeout(()=>{t.dispose()},1e4),await this._context.globalState.update("explorerDates.onboardingVersion",e),this._logger.info("Showed gentle update notification",{version:e})}async showQuickSetupWizard(){try{let e=D.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",D.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateSetupWizardHTML(),e.webview.onDidReceiveMessage(async t=>{await this._handleSetupWizardMessage(t,e)}),this._logger.info("Quick setup wizard opened")}catch(e){this._logger.error("Failed to show setup wizard",e)}}async _handleSetupWizardMessage(e,t){try{switch(e.command){case"applyConfiguration":await this._applyQuickConfiguration(e.configuration),await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),D.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&(await D.commands.executeCommand("explorerDates.previewConfiguration",e.settings),this._logger.info("Configuration preview applied via webview",e.settings));break;case"clearPreview":await D.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await D.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(o){this._logger.error("Failed to handle setup wizard message",o)}}async _applyQuickConfiguration(e){let t=D.workspace.getConfiguration("explorerDates");if(e.preset){let r=this._getConfigurationPresets()[e.preset];if(r){this._logger.info(`Applying preset: ${e.preset}`,r.settings);for(let[i,a]of Object.entries(r.settings))await t.update(i,a,D.ConfigurationTarget.Global),this._logger.debug(`Updated setting: explorerDates.${i} = ${a}`);this._logger.info(`Applied preset: ${e.preset}`,r.settings),D.window.showInformationMessage(`Applied "${r.name}" configuration. Changes should be visible immediately!`)}}if(e.individual){for(let[o,r]of Object.entries(e.individual))await t.update(o,r,D.ConfigurationTarget.Global);this._logger.info("Applied individual settings",e.individual)}try{await D.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(o){this._logger.warn("Failed to refresh decorations after configuration change",o)}}_getConfigurationPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:30,enableContextMenu:!0,showStatusBar:!0}},powerUser:{name:"Power User",description:"Maximum information - all features enabled with vibrant colors",settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"both",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:14,enableContextMenu:!0,showStatusBar:!0,smartExclusions:!0,progressiveLoading:!0,persistentCache:!0}},gitFocused:{name:"Git-Focused",description:"Show author initials as badges with full Git information in tooltips",settings:{dateDecorationFormat:"smart",colorScheme:"file-type",highContrastMode:!1,showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}async showFeatureTour(){try{let e=D.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",D.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});e.webview.html=this._generateFeatureTourHTML(),e.webview.onDidReceiveMessage(async t=>{t.command==="openSettings"?await D.commands.executeCommand("workbench.action.openSettings",t.setting||"explorerDates"):t.command==="runCommand"&&await D.commands.executeCommand(t.commandId)}),this._logger.info("Feature tour opened")}catch(e){this._logger.error("Failed to show feature tour",e)}}_generateSetupWizardHTML(){let e=this._getConfigurationPresets(),t={minimal:e.minimal,developer:e.developer,accessible:e.accessible};return`
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
                    
                    ${Object.entries(t).map(([i,a])=>`
            <div class="preset-option" data-preset="${i}" 
                 onmouseenter="previewConfiguration({preset: '${i}'})" 
                 onmouseleave="clearPreview()">
                <h3>${a.name}</h3>
                <p>${a.description}</p>
                <div class="preset-actions">
                    <button onclick="previewConfiguration({preset: '${i}'})">\u{1F441}\uFE0F Preview</button>
                    <button onclick="applyConfiguration({preset: '${i}'})">\u2705 Select ${a.name}</button>
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
${t.description}`;await D.window.showInformationMessage(o,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(e){try{let t=D.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${e} - What's New`,D.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1});t.webview.html=this._generateWhatsNewHTML(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"openSettings":await D.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break;case"tryFeature":o.feature==="badgePriority"&&(await D.workspace.getConfiguration("explorerDates").update("badgePriority","author",D.ConfigurationTarget.Global),D.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":t.dispose();break}})}catch(t){this._logger.error("Failed to show what's new",t)}}_generateWhatsNewHTML(e){return`
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
        `}};g(Ve,"OnboardingManager");var Ge=Ve;Ct.exports={OnboardingManager:Ge}});var Dt=L((jo,_t)=>{var k=require("vscode"),Y=require("path"),G=require("fs").promises,{getLogger:oo}=R(),E=oo(),Je=class Je{constructor(){this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),this.initialize()}async initialize(){try{let e=k.workspace.workspaceFolders,t=e&&e[0]&&e[0].uri;t&&(this.templatesPath=Y.join(t.fsPath,".vscode","explorer-dates-templates"),await this.ensureTemplatesDirectory()),E.info("Workspace Templates Manager initialized")}catch(e){E.error("Failed to initialize Workspace Templates Manager:",e)}}async ensureTemplatesDirectory(){try{this.templatesPath&&await G.mkdir(this.templatesPath,{recursive:!0})}catch(e){E.error("Failed to create templates directory:",e)}}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.enabled":!0,"explorerDates.displayFormat":"relative-short","explorerDates.colorCoding":!0,"explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludePatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"]}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.enabled":!0,"explorerDates.displayFormat":"absolute-long","explorerDates.colorCoding":!1,"explorerDates.showFileSize":!0,"explorerDates.showOnlyModified":!1,"explorerDates.enableTooltips":!0,"explorerDates.excludePatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"]}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.enabled":!0,"explorerDates.displayFormat":"smart","explorerDates.colorCoding":!1,"explorerDates.showFileSize":!1,"explorerDates.minimalistMode":!0,"explorerDates.excludePatterns":["**/node_modules/**","**/.git/**"]}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.enabled":!0,"explorerDates.displayFormat":"smart","explorerDates.colorCoding":!0,"explorerDates.showFileSize":!0,"explorerDates.enableGitIntegration":!0,"explorerDates.showGitInfo":"author","explorerDates.enableWorkspaceAnalytics":!0,"explorerDates.enableContextMenu":!0,"explorerDates.enableStatusBar":!0,"explorerDates.accessibilityMode":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.enabled":!0,"explorerDates.displayFormat":"relative-short","explorerDates.colorCoding":!1,"explorerDates.showFileSize":!1,"explorerDates.minimalistMode":!0,"explorerDates.enableTooltips":!1}}}}async saveCurrentConfiguration(e,t=""){try{if(!this.templatesPath)throw new Error("Templates path not initialized");let o=k.workspace.getConfiguration("explorerDates"),r={},i=o.inspect();if(i)for(let[h,f]of Object.entries(i))f&&typeof f=="object"&&"workspaceValue"in f?r[`explorerDates.${h}`]=f.workspaceValue:f&&typeof f=="object"&&"globalValue"in f&&(r[`explorerDates.${h}`]=f.globalValue);let a={name:e,description:t,createdAt:new Date().toISOString(),version:"1.0.0",settings:r},l=Y.join(this.templatesPath,`${e}.json`);return await G.writeFile(l,JSON.stringify(a,null,2)),k.window.showInformationMessage(`Template "${e}" saved successfully!`),E.info(`Saved workspace template: ${e}`),!0}catch(o){return E.error("Failed to save template:",o),k.window.showErrorMessage(`Failed to save template: ${o.message}`),!1}}async loadTemplate(e){try{let t;if(this.builtInTemplates[e])t=this.builtInTemplates[e];else{if(!this.templatesPath)throw new Error("Templates path not initialized");let r=Y.join(this.templatesPath,`${e}.json`),i=await G.readFile(r,"utf8");t=JSON.parse(i)}let o=k.workspace.getConfiguration();for(let[r,i]of Object.entries(t.settings))await o.update(r,i,k.ConfigurationTarget.Workspace);return k.window.showInformationMessage(`Template "${t.name}" applied successfully!`),E.info(`Applied workspace template: ${t.name}`),!0}catch(t){return E.error("Failed to load template:",t),k.window.showErrorMessage(`Failed to load template: ${t.message}`),!1}}async getAvailableTemplates(){let e=[];for(let[t,o]of Object.entries(this.builtInTemplates))e.push({id:t,name:o.name,description:o.description,type:"built-in",createdAt:null});try{if(this.templatesPath){let t=await G.readdir(this.templatesPath);for(let o of t)if(o.endsWith(".json")){let r=Y.join(this.templatesPath,o),i=await G.readFile(r,"utf8"),a=JSON.parse(i);e.push({id:Y.basename(o,".json"),name:a.name,description:a.description,type:"custom",createdAt:a.createdAt})}}}catch(t){E.error("Failed to load custom templates:",t)}return e}async deleteTemplate(e){try{if(this.builtInTemplates[e])return k.window.showErrorMessage("Cannot delete built-in templates"),!1;if(!this.templatesPath)throw new Error("Templates path not initialized");let t=Y.join(this.templatesPath,`${e}.json`);return await G.unlink(t),k.window.showInformationMessage(`Template "${e}" deleted successfully!`),E.info(`Deleted workspace template: ${e}`),!0}catch(t){return E.error("Failed to delete template:",t),k.window.showErrorMessage(`Failed to delete template: ${t.message}`),!1}}async exportTemplate(e,t){try{let o;if(this.builtInTemplates[e])o=this.builtInTemplates[e];else{let r=Y.join(this.templatesPath,`${e}.json`),i=await G.readFile(r,"utf8");o=JSON.parse(i)}return await G.writeFile(t,JSON.stringify(o,null,2)),k.window.showInformationMessage(`Template exported to ${t}`),E.info(`Exported template ${e} to ${t}`),!0}catch(o){return E.error("Failed to export template:",o),k.window.showErrorMessage(`Failed to export template: ${o.message}`),!1}}async importTemplate(e){try{let t=await G.readFile(e,"utf8"),o=JSON.parse(t);if(!o.name||!o.settings)throw new Error("Invalid template format");let r=o.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),i=Y.join(this.templatesPath,`${r}.json`);return await G.writeFile(i,JSON.stringify(o,null,2)),k.window.showInformationMessage(`Template "${o.name}" imported successfully!`),E.info(`Imported template: ${o.name}`),!0}catch(t){return E.error("Failed to import template:",t),k.window.showErrorMessage(`Failed to import template: ${t.message}`),!1}}async showTemplateManager(){try{let e=await this.getAvailableTemplates(),t=k.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",k.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});t.webview.html=this.getTemplateManagerHtml(e),t.webview.onDidReceiveMessage(async o=>{switch(o.command){case"loadTemplate":await this.loadTemplate(o.templateId);break;case"deleteTemplate":{await this.deleteTemplate(o.templateId);let r=await this.getAvailableTemplates();t.webview.postMessage({command:"refreshTemplates",templates:r});break}case"exportTemplate":{let r=await k.window.showSaveDialog({defaultUri:k.Uri.file(`${o.templateId}.json`),filters:{JSON:["json"]}});r&&await this.exportTemplate(o.templateId,r.fsPath);break}}}),E.info("Template Manager opened")}catch(e){E.error("Failed to show template manager:",e),k.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(e){return`<!DOCTYPE html>
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
        </html>`}};g(Je,"WorkspaceTemplatesManager");var Ke=Je;_t.exports={WorkspaceTemplatesManager:Ke}});var Ft=L((Uo,St)=>{var q=require("vscode"),ro=require("events"),{getLogger:io}=R(),A=io(),Ye=class Ye extends ro{constructor(){super(),this.plugins=new Map,this.api=null,this.decorationProviders=new Map,this.initialize()}initialize(){this.api=this.createPublicApi(),A.info("Extension API Manager initialized")}createPublicApi(){return{getFileDecorations:this.getFileDecorations.bind(this),refreshDecorations:this.refreshDecorations.bind(this),registerPlugin:this.registerPlugin.bind(this),unregisterPlugin:this.unregisterPlugin.bind(this),registerDecorationProvider:this.registerDecorationProvider.bind(this),unregisterDecorationProvider:this.unregisterDecorationProvider.bind(this),onDecorationChanged:this.onDecorationChanged.bind(this),onFileScanned:this.onFileScanned.bind(this),formatDate:this.formatDate.bind(this),getFileStats:this.getFileStats.bind(this),version:"1.1.0",apiVersion:"1.0.0"}}async getFileDecorations(e){try{let t=[];for(let o of e){let r=q.Uri.file(o),i=await this.getDecorationForFile(r);i&&t.push({uri:r.toString(),decoration:i})}return t}catch(t){return A.error("Failed to get file decorations:",t),[]}}async getDecorationForFile(e){try{let t=await q.workspace.fs.stat(e),o=new Date(t.mtime),r={badge:this.formatDate(o,"smart"),color:void 0,tooltip:`Modified: ${o.toLocaleString()}`};for(let[i,a]of this.decorationProviders)try{let l=await a.provideDecoration(e,t,r);l&&(r={...r,...l})}catch(l){A.error(`Decoration provider ${i} failed:`,l)}return r}catch(t){return A.error("Failed to get decoration for file:",t),null}}async refreshDecorations(e=null){try{return this.emit("decorationRefreshRequested",e),A.info("Decoration refresh requested"),!0}catch(t){return A.error("Failed to refresh decorations:",t),!1}}registerPlugin(e,t){try{if(!this.validatePlugin(t))throw new Error("Invalid plugin structure");return this.plugins.set(e,{...t,registeredAt:new Date,active:!0}),typeof t.activate=="function"&&t.activate(this.api),this.emit("pluginRegistered",{pluginId:e,plugin:t}),A.info(`Plugin registered: ${e}`),!0}catch(o){return A.error(`Failed to register plugin ${e}:`,o),!1}}unregisterPlugin(e){try{let t=this.plugins.get(e);return t?(typeof t.deactivate=="function"&&t.deactivate(),this.plugins.delete(e),this.emit("pluginUnregistered",{pluginId:e}),A.info(`Plugin unregistered: ${e}`),!0):!1}catch(t){return A.error(`Failed to unregister plugin ${e}:`,t),!1}}registerDecorationProvider(e,t){try{if(!this.validateDecorationProvider(t))throw new Error("Invalid decoration provider");return this.decorationProviders.set(e,t),this.emit("decorationProviderRegistered",{providerId:e,provider:t}),A.info(`Decoration provider registered: ${e}`),!0}catch(o){return A.error(`Failed to register decoration provider ${e}:`,o),!1}}unregisterDecorationProvider(e){try{let t=this.decorationProviders.delete(e);return t&&(this.emit("decorationProviderUnregistered",{providerId:e}),A.info(`Decoration provider unregistered: ${e}`)),t}catch(t){return A.error(`Failed to unregister decoration provider ${e}:`,t),!1}}onDecorationChanged(e){return this.on("decorationChanged",e),()=>this.off("decorationChanged",e)}onFileScanned(e){return this.on("fileScanned",e),()=>this.off("fileScanned",e)}formatDate(e,t=null){try{let o=q.workspace.getConfiguration("explorerDates"),r=t||o.get("displayFormat","smart"),a=new Date-e,l=Math.floor(a/(1e3*60*60*24));switch(r){case"relative-short":return this.getRelativeTimeShort(a);case"relative-long":return this.getRelativeTimeLong(a);case"absolute-short":return e.toLocaleDateString("en-US",{month:"short",day:"numeric"});case"absolute-long":return e.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});case"smart":default:return l<7?this.getRelativeTimeShort(a):e.toLocaleDateString("en-US",{month:"short",day:"numeric"})}}catch(o){return A.error("Failed to format date:",o),e.toLocaleDateString()}}async getFileStats(e){try{let t=q.Uri.file(e),o=await q.workspace.fs.stat(t);return{path:e,size:o.size,created:new Date(o.ctime),modified:new Date(o.mtime),type:o.type===q.FileType.Directory?"directory":"file"}}catch(t){return A.error("Failed to get file stats:",t),null}}getApi(){return this.api}getRegisteredPlugins(){let e=[];for(let[t,o]of this.plugins)e.push({id:t,name:o.name,version:o.version,author:o.author,active:o.active,registeredAt:o.registeredAt});return e}validatePlugin(e){return!(!e||typeof e!="object"||!e.name||!e.version||e.activate&&typeof e.activate!="function"||e.deactivate&&typeof e.deactivate!="function")}validateDecorationProvider(e){return!(!e||typeof e!="object"||typeof e.provideDecoration!="function")}getRelativeTimeShort(e){let t=Math.floor(e/1e3),o=Math.floor(t/60),r=Math.floor(o/60),i=Math.floor(r/24);if(t<60)return`${t}s`;if(o<60)return`${o}m`;if(r<24)return`${r}h`;if(i<30)return`${i}d`;let a=Math.floor(i/30);return a<12?`${a}mo`:`${Math.floor(a/12)}y`}getRelativeTimeLong(e){let t=Math.floor(e/1e3),o=Math.floor(t/60),r=Math.floor(o/60),i=Math.floor(r/24);if(t<60)return`${t} second${t!==1?"s":""} ago`;if(o<60)return`${o} minute${o!==1?"s":""} ago`;if(r<24)return`${r} hour${r!==1?"s":""} ago`;if(i<30)return`${i} day${i!==1?"s":""} ago`;let a=Math.floor(i/30);if(a<12)return`${a} month${a!==1?"s":""} ago`;let l=Math.floor(a/12);return`${l} year${l!==1?"s":""} ago`}getColorForAge(e){if(!q.workspace.getConfiguration("explorerDates").get("colorCoding",!1))return;let i=(new Date-e)/(1e3*60*60);return i<1?new q.ThemeColor("charts.green"):i<24?new q.ThemeColor("charts.yellow"):i<168?new q.ThemeColor("charts.orange"):new q.ThemeColor("charts.red")}createExamplePlugin(){return{name:"File Size Display",version:"1.0.0",author:"Explorer Dates",description:"Adds file size to decorations",activate:g(e=>{e.registerDecorationProvider("fileSize",{provideDecoration:g(async(t,o,r)=>{let i=this.formatFileSize(o.size);return{badge:`${r.badge} \u2022 ${i}`,tooltip:`${r.tooltip}
Size: ${i}`}},"provideDecoration")})},"activate"),deactivate:g(()=>{},"deactivate")}}formatFileSize(e){if(e===0)return"0 B";let t=1024,o=["B","KB","MB","GB"],r=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,r)).toFixed(1))+" "+o[r]}};g(Ye,"ExtensionApiManager");var Qe=Ye;St.exports={ExtensionApiManager:Qe}});var kt=L((Ho,$t)=>{var T=require("vscode"),be=require("path"),so=require("fs").promises,{getLogger:ao}=R(),V=ao(),Xe=class Xe{constructor(){this.fileActivityCache=new Map,this.reportFormats=["json","csv","html","markdown"],this.initialize()}async initialize(){try{this.startFileWatcher(),V.info("Export & Reporting Manager initialized")}catch(e){V.error("Failed to initialize Export & Reporting Manager:",e)}}startFileWatcher(){let e=T.workspace.createFileSystemWatcher("**/*");e.onDidChange(t=>{this.recordFileActivity(t,"modified")}),e.onDidCreate(t=>{this.recordFileActivity(t,"created")}),e.onDidDelete(t=>{this.recordFileActivity(t,"deleted")})}recordFileActivity(e,t){try{let o=e.fsPath,r=new Date;this.fileActivityCache.has(o)||this.fileActivityCache.set(o,[]),this.fileActivityCache.get(o).push({action:t,timestamp:r,path:o});let i=this.fileActivityCache.get(o);i.length>100&&i.splice(0,i.length-100)}catch(o){V.error("Failed to record file activity:",o)}}async generateFileModificationReport(e={}){try{let{format:t="json",timeRange:o="all",includeDeleted:r=!1,outputPath:i=null}=e,a=await this.collectFileData(o,r),l=await this.formatReport(a,t);return i&&(await this.saveReport(l,i),T.window.showInformationMessage(`Report saved to ${i}`)),l}catch(t){return V.error("Failed to generate file modification report:",t),T.window.showErrorMessage("Failed to generate report"),null}}async collectFileData(e,t){let o=[],r=T.workspace.workspaceFolders;if(!r)return{files:[],summary:this.createSummary([])};for(let a of r){let l=await this.scanWorkspaceFolder(a.uri,e,t);o.push(...l)}let i=this.createSummary(o);return{generatedAt:new Date().toISOString(),workspace:r.map(a=>a.uri.fsPath),timeRange:e,files:o,summary:i}}async scanWorkspaceFolder(e,t,o){let r=[],a=T.workspace.getConfiguration("explorerDates").get("excludePatterns",[]);try{let l=await T.workspace.fs.readDirectory(e);for(let[h,f]of l){let m=T.Uri.joinPath(e,h),b=T.workspace.asRelativePath(m);if(!this.isExcluded(b,a)){if(f===T.FileType.File){let F=await this.getFileData(m,t);F&&r.push(F)}else if(f===T.FileType.Directory){let F=await this.scanWorkspaceFolder(m,t,o);r.push(...F)}}}if(o){let h=this.getDeletedFiles(e.fsPath,t);r.push(...h)}}catch(l){V.error(`Failed to scan folder ${e.fsPath}:`,l)}return r}async getFileData(e,t){try{let o=await T.workspace.fs.stat(e),r=T.workspace.asRelativePath(e),i=this.fileActivityCache.get(e.fsPath)||[],a=this.filterActivitiesByTimeRange(i,t);return{path:r,fullPath:e.fsPath,size:o.size,created:new Date(o.ctime),modified:new Date(o.mtime),type:this.getFileType(r),extension:be.extname(r),activities:a,activityCount:a.length,lastActivity:a.length>0?a[a.length-1].timestamp:new Date(o.mtime)}}catch(o){return V.error(`Failed to get file data for ${e.fsPath}:`,o),null}}filterActivitiesByTimeRange(e,t){if(t==="all")return e;let o=new Date,r;switch(t){case"24h":r=new Date(o-1440*60*1e3);break;case"7d":r=new Date(o-10080*60*1e3);break;case"30d":r=new Date(o-720*60*60*1e3);break;case"90d":r=new Date(o-2160*60*60*1e3);break;default:return e}return e.filter(i=>i.timestamp>=r)}getDeletedFiles(e,t){let o=[];for(let[r,i]of this.fileActivityCache)if(r.startsWith(e)){let a=i.filter(h=>h.action==="deleted"),l=this.filterActivitiesByTimeRange(a,t);l.length>0&&o.push({path:T.workspace.asRelativePath(r),fullPath:r,size:0,created:null,modified:null,type:"deleted",extension:be.extname(r),activities:l,activityCount:l.length,lastActivity:l[l.length-1].timestamp})}return o}createSummary(e){let t={totalFiles:e.length,totalSize:e.reduce((r,i)=>r+(i.size||0),0),fileTypes:{},activityByDay:{},mostActiveFiles:[],recentlyModified:[],largestFiles:[],oldestFiles:[]};e.forEach(r=>{let i=r.type||"unknown";t.fileTypes[i]=(t.fileTypes[i]||0)+1});let o=new Date(Date.now()-720*60*60*1e3);return e.forEach(r=>{r.activities.forEach(i=>{if(i.timestamp>=o){let a=i.timestamp.toISOString().split("T")[0];t.activityByDay[a]=(t.activityByDay[a]||0)+1}})}),t.mostActiveFiles=e.sort((r,i)=>i.activityCount-r.activityCount).slice(0,10).map(r=>({path:r.path,activityCount:r.activityCount,lastActivity:r.lastActivity})),t.recentlyModified=e.filter(r=>r.modified).sort((r,i)=>i.modified-r.modified).slice(0,20).map(r=>({path:r.path,modified:r.modified,size:r.size})),t.largestFiles=e.sort((r,i)=>(i.size||0)-(r.size||0)).slice(0,10).map(r=>({path:r.path,size:r.size,modified:r.modified})),t.oldestFiles=e.filter(r=>r.modified).sort((r,i)=>r.modified-i.modified).slice(0,10).map(r=>({path:r.path,modified:r.modified,size:r.size})),t}async formatReport(e,t){switch(t.toLowerCase()){case"json":return JSON.stringify(e,null,2);case"csv":return this.formatAsCSV(e);case"html":return this.formatAsHTML(e);case"markdown":return this.formatAsMarkdown(e);default:throw new Error(`Unsupported format: ${t}`)}}formatAsCSV(e){let t=["Path,Size,Created,Modified,Type,Extension,ActivityCount,LastActivity"];return e.files.forEach(o=>{t.push([o.path,o.size||0,o.created?o.created.toISOString():"",o.modified?o.modified.toISOString():"",o.type,o.extension,o.activityCount,o.lastActivity?o.lastActivity.toISOString():""].join(","))}),t.join(`
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
`}async saveReport(e,t){try{await so.writeFile(t,e,"utf8"),V.info(`Report saved to ${t}`)}catch(o){throw V.error("Failed to save report:",o),o}}async exportToTimeTrackingTools(e={}){try{let{tool:t="generic",timeRange:o="7d"}=e,r=await this.collectFileData(o,!1);return this.formatForTimeTracking(r,t)}catch(t){return V.error("Failed to export to time tracking tools:",t),null}}formatForTimeTracking(e,t){let o=[];switch(e.files.forEach(r=>{r.activities.forEach(i=>{o.push({file:r.path,action:i.action,timestamp:i.timestamp,duration:this.estimateSessionDuration(i),project:this.extractProjectName(r.path)})})}),t){case"toggl":return this.formatForToggl(o);case"clockify":return this.formatForClockify(o);case"generic":default:return o}}formatForToggl(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),duration:t.duration*60,project:t.project,tags:[t.action,this.getFileType(t.file)]}))}formatForClockify(e){return e.map(t=>({description:`${t.action}: ${t.file}`,start:t.timestamp.toISOString(),end:new Date(t.timestamp.getTime()+t.duration*60*1e3).toISOString(),project:t.project,tags:[t.action,this.getFileType(t.file)]}))}estimateSessionDuration(e){switch(e.action){case"created":return 15;case"modified":return 5;case"deleted":return 1;default:return 5}}extractProjectName(e){return e.split(be.sep)[0]||"Unknown Project"}getFileType(e){let t=be.extname(e).toLowerCase();return{".js":"javascript",".ts":"typescript",".py":"python",".java":"java",".cpp":"cpp",".html":"html",".css":"css",".md":"markdown",".json":"json",".xml":"xml",".txt":"text"}[t]||"other"}isExcluded(e,t){return t.some(o=>new RegExp(o.replace(/\*/g,".*")).test(e))}formatFileSize(e){if(e===0)return"0 B";let t=1024,o=["B","KB","MB","GB"],r=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,r)).toFixed(1))+" "+o[r]}async showReportDialog(){try{let e={"\u{1F4CA} Generate Full Report":"full","\u{1F4C5} Last 24 Hours":"24h","\u{1F4C5} Last 7 Days":"7d","\u{1F4C5} Last 30 Days":"30d","\u{1F4C5} Last 90 Days":"90d"},t=await T.window.showQuickPick(Object.keys(e),{placeHolder:"Select report time range"});if(!t)return;let o=e[t],r=["JSON","CSV","HTML","Markdown"],i=await T.window.showQuickPick(r,{placeHolder:"Select report format"});if(!i)return;let a=await T.window.showSaveDialog({defaultUri:T.Uri.file(`file-report.${i.toLowerCase()}`),filters:{[i]:[i.toLowerCase()]}});if(!a)return;await this.generateFileModificationReport({format:i.toLowerCase(),timeRange:o,outputPath:a.fsPath})}catch(e){V.error("Failed to show report dialog:",e),T.window.showErrorMessage("Failed to generate report")}}};g(Xe,"ExportReportingManager");var Ze=Xe;$t.exports={ExportReportingManager:Ze}});var Mt=L((Ko,Tt)=>{var I=require("vscode"),Vo=require("path"),no=require("fs").promises,{getLogger:co}=R(),tt=class tt{constructor(e){this._logger=co(),this._provider=e,this._testResults=[]}async runComprehensiveDiagnostics(){var t,o;this._logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let e={timestamp:new Date().toISOString(),vscodeVersion:I.version,extensionVersion:(o=(t=I.extensions.getExtension("incredincomp.explorer-dates"))==null?void 0:t.packageJSON)==null?void 0:o.version,tests:{}};return e.tests.vscodeSettings=await this._testVSCodeSettings(),e.tests.providerRegistration=await this._testProviderRegistration(),e.tests.fileProcessing=await this._testFileProcessing(),e.tests.decorationCreation=await this._testDecorationCreation(),e.tests.cacheAnalysis=await this._testCacheAnalysis(),e.tests.extensionConflicts=await this._testExtensionConflicts(),e.tests.uriPathIssues=await this._testURIPathIssues(),this._logger.info("\u{1F50D} Comprehensive diagnostics completed",e),e}async _testVSCodeSettings(){let e=I.workspace.getConfiguration("explorer"),t=I.workspace.getConfiguration("workbench"),o=I.workspace.getConfiguration("explorerDates"),r={"explorer.decorations.badges":e.get("decorations.badges"),"explorer.decorations.colors":e.get("decorations.colors"),"workbench.colorTheme":t.get("colorTheme"),"explorerDates.showDateDecorations":o.get("showDateDecorations"),"explorerDates.colorScheme":o.get("colorScheme"),"explorerDates.showGitInfo":o.get("showGitInfo")},i=[];return r["explorer.decorations.badges"]===!1&&i.push("CRITICAL: explorer.decorations.badges is disabled"),r["explorer.decorations.colors"]===!1&&i.push("WARNING: explorer.decorations.colors is disabled"),r["explorerDates.showDateDecorations"]===!1&&i.push("CRITICAL: explorerDates.showDateDecorations is disabled"),{status:i.length>0?"ISSUES_FOUND":"OK",settings:r,issues:i}}async _testProviderRegistration(){let e=[];if(!this._provider)return e.push("CRITICAL: Decoration provider is null/undefined"),{status:"FAILED",issues:e};typeof this._provider.provideFileDecoration!="function"&&e.push("CRITICAL: provideFileDecoration method missing"),this._provider.onDidChangeFileDecorations||e.push("WARNING: onDidChangeFileDecorations event emitter missing");let t=I.Uri.file("/test/path");try{let o=await this._provider.provideFileDecoration(t);this._logger.debug("Provider test call completed",{result:!!o})}catch(o){e.push(`ERROR: Provider test call failed: ${o.message}`)}return{status:e.length>0?"ISSUES_FOUND":"OK",providerActive:!!this._provider,issues:e}}async _testFileProcessing(){let e=I.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace folders available"]};let t=[],o=[];try{let r=["package.json","README.md","extension.js","src/logger.js"];for(let i of r){let a=I.Uri.joinPath(e[0].uri,i);try{await no.access(a.fsPath);let l=this._provider._isExcludedSimple?await this._provider._isExcludedSimple(a):!1,h=await this._provider.provideFileDecoration(a);t.push({file:i,exists:!0,excluded:l,hasDecoration:!!h,badge:h==null?void 0:h.badge,uri:a.toString()})}catch(l){t.push({file:i,exists:!1,error:l.message})}}}catch(r){o.push(`File processing test failed: ${r.message}`)}return{status:o.length>0?"ISSUES_FOUND":"OK",testFiles:t,issues:o}}async _testDecorationCreation(){let e=[],t=[];try{let r=new I.FileDecoration("test");e.push({name:"Simple decoration",success:!0,badge:r.badge})}catch(r){e.push({name:"Simple decoration",success:!1,error:r.message}),t.push("CRITICAL: Cannot create simple FileDecoration")}try{let r=new I.FileDecoration("test","Test tooltip");e.push({name:"Decoration with tooltip",success:!0,hasTooltip:!!(r&&r.tooltip)})}catch(r){e.push({name:"Decoration with tooltip",success:!1,error:r.message}),t.push("WARNING: Cannot create FileDecoration with tooltip")}try{let r=new I.FileDecoration("test","Test tooltip",new I.ThemeColor("charts.red"));e.push({name:"Decoration with color",success:!0,hasColor:!!r.color})}catch(r){e.push({name:"Decoration with color",success:!1,error:r.message}),t.push("WARNING: Cannot create FileDecoration with color")}let o=["1d","10m","2h","!!","\u25CF\u25CF","JA12","123456789"];for(let r of o)try{let i=new I.FileDecoration(r);e.push({name:`Badge format: ${r}`,success:!0,badge:i.badge,length:r.length})}catch(i){e.push({name:`Badge format: ${r}`,success:!1,error:i.message}),r.length<=8&&t.push(`WARNING: Valid badge format '${r}' failed`)}return{status:t.length>0?"ISSUES_FOUND":"OK",tests:e,issues:t}}async _testCacheAnalysis(){var o;let e={memoryCache:{size:((o=this._provider._decorationCache)==null?void 0:o.size)||0,maxSize:this._provider._maxCacheSize||0},advancedCache:{available:!!this._provider._advancedCache,initialized:!1},metrics:this._provider.getMetrics?this._provider.getMetrics():null},t=[];return e.memoryCache.size>e.memoryCache.maxSize*.9&&t.push("WARNING: Memory cache is nearly full"),e.metrics&&e.metrics.cacheHits===0&&e.metrics.cacheMisses>10&&t.push("WARNING: Cache hit rate is 0% - potential cache key issues"),{status:t.length>0?"ISSUES_FOUND":"OK",cacheInfo:e,issues:t}}async _testExtensionConflicts(){var i,a;let e=I.extensions.all,t=[],o=[];for(let l of e){if(!l.isActive)continue;let h=l.packageJSON;(a=(i=h.contributes)==null?void 0:i.commands)!=null&&a.some(m=>{var b,F,O,B;return((b=m.command)==null?void 0:b.includes("decoration"))||((F=m.title)==null?void 0:F.includes("decoration"))||((O=m.title)==null?void 0:O.includes("badge"))||((B=m.title)==null?void 0:B.includes("explorer"))})&&o.push({id:l.id,name:h.displayName||h.name,version:h.version}),["file-icons","vscode-icons","material-icon-theme","explorer-exclude","hide-files","file-watcher"].some(m=>l.id.includes(m))&&t.push({id:l.id,name:h.displayName||h.name,reason:"Known to potentially interfere with file decorations"})}let r=[];return o.length>1&&r.push(`WARNING: ${o.length} extensions might provide file decorations`),t.length>0&&r.push(`WARNING: ${t.length} potentially conflicting extensions detected`),{status:r.length>0?"ISSUES_FOUND":"OK",decorationExtensions:o,potentialConflicts:t,issues:r}}async _testURIPathIssues(){let e=I.workspace.workspaceFolders;if(!e||e.length===0)return{status:"NO_WORKSPACE",issues:["No workspace available for URI testing"]};let t=[],o=[],r=["package.json","src/logger.js","README.md",".gitignore"];for(let i of r){let a=I.Uri.joinPath(e[0].uri,i);t.push({path:i,scheme:a.scheme,fsPath:a.fsPath,authority:a.authority,valid:a.scheme==="file"&&a.fsPath.length>0}),a.scheme!=="file"&&o.push(`WARNING: Non-file URI scheme for ${i}: ${a.scheme}`),(a.fsPath.includes("\\\\")||a.fsPath.includes("//"))&&o.push(`WARNING: Potential path separator issues in ${i}`)}return{status:o.length>0?"ISSUES_FOUND":"OK",tests:t,issues:o}}};g(tt,"DecorationDiagnostics");var et=tt;Tt.exports={DecorationDiagnostics:et}});var Et=L((Qo,Pt)=>{var te=require("vscode");async function lo(){let n=R().getLogger();n.info("\u{1F3A8} Testing VS Code decoration rendering...");let r=class r{constructor(){this._onDidChangeFileDecorations=new te.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event}provideFileDecoration(a){let l=require("path").basename(a.fsPath),h=new te.FileDecoration("TEST");return h.tooltip=`Test decoration for ${l}`,h.color=new te.ThemeColor("charts.red"),n.info(`\u{1F9EA} Test provider returning decoration for: ${l}`),h}};g(r,"TestDecorationProvider");let e=r,t=new e,o=te.window.registerFileDecorationProvider(t);return n.info("\u{1F9EA} Test decoration provider registered"),setTimeout(()=>{t._onDidChangeFileDecorations.fire(void 0),n.info("\u{1F504} Test decoration refresh triggered"),setTimeout(()=>{o.dispose(),n.info("\u{1F9EA} Test decoration provider disposed")},1e4)},1e3),"Test decoration provider registered for 10 seconds"}g(lo,"testVSCodeDecorationRendering");async function ho(){let n=R().getLogger();n.info("\u{1F527} Testing FileDecoration API...");let e=[];try{let o=new te.FileDecoration("MIN");e.push({name:"Minimal decoration",success:!0,badge:o.badge}),n.info("\u2705 Minimal decoration created successfully")}catch(o){e.push({name:"Minimal decoration",success:!1,error:o.message}),n.error("\u274C Minimal decoration failed:",o)}try{let o=new te.FileDecoration("FULL","Full decoration tooltip",new te.ThemeColor("charts.blue"));o.propagate=!1,e.push({name:"Full decoration",success:!0,badge:o.badge,hasTooltip:!!o.tooltip,hasColor:!!o.color,propagate:o.propagate}),n.info("\u2705 Full decoration created successfully")}catch(o){e.push({name:"Full decoration",success:!1,error:o.message}),n.error("\u274C Full decoration failed:",o)}let t=["charts.red","charts.blue","charts.green","charts.yellow","terminal.ansiRed","terminal.ansiGreen","terminal.ansiBlue","editorError.foreground","editorWarning.foreground","editorInfo.foreground"];for(let o of t)try{e.push({name:`ThemeColor: ${o}`,success:!0,colorId:o})}catch(r){e.push({name:`ThemeColor: ${o}`,success:!1,error:r.message}),n.error(`\u274C ThemeColor ${o} failed:`,r)}return e}g(ho,"testFileDecorationAPI");Pt.exports={testVSCodeDecorationRendering:lo,testFileDecorationAPI:ho}});var c=require("vscode"),{FileDateDecorationProvider:go}=yt(),{getLogger:uo}=R(),{getLocalization:po}=le(),v,u,oe;function mo(n){return`<!DOCTYPE html>
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
            <p>Version: ${n.version} | API Version: ${n.apiVersion}</p>
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
    </html>`}g(mo,"getApiInformationHtml");function fo(n){let e=g(o=>{if(o<1024)return`${o} B`;let r=o/1024;return r<1024?`${r.toFixed(1)} KB`:`${(r/1024).toFixed(1)} MB`},"formatFileSize"),t=n.map(o=>`
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
                    <strong>Total Files Analyzed:</strong> ${n.length}
                </div>
                <div class="stat-box">
                    <strong>Most Recent:</strong> ${n.length>0?n[0].modified.toLocaleString():"N/A"}
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
    `}g(fo,"generateWorkspaceActivityHTML");function wo(n){return`
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
            
            ${Object.entries(n).map(([t,o])=>{let r=Object.entries(o).map(([i,a])=>{let l=Array.isArray(a)?a.join(", ")||"None":(a==null?void 0:a.toString())||"N/A";return`
                <tr>
                    <td><strong>${i}:</strong></td>
                    <td>${l}</td>
                </tr>
            `}).join("");return`
            <div class="diagnostic-section">
                <h3>\u{1F50D} ${t}</h3>
                <table>
                    ${r}
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
    `}g(wo,"generateDiagnosticsHTML");function vo(n){return`<!DOCTYPE html>
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
            <p><strong>VS Code:</strong> ${n.vscodeVersion} | <strong>Extension:</strong> ${n.extensionVersion}</p>
            <p><strong>Generated:</strong> ${new Date(n.timestamp).toLocaleString()}</p>
        </div>

        ${Object.entries(n.tests).map(([e,t])=>{let o=t.status==="OK"?"test-ok":t.status==="ISSUES_FOUND"?"test-warning":"test-error",r=t.status==="OK"?"status-ok":t.status==="ISSUES_FOUND"?"status-warning":"status-error";return`
            <div class="test-section ${o}">
                <h2>\u{1F9EA} ${e.replace(/([A-Z])/g," $1").replace(/^./,i=>i.toUpperCase())}</h2>
                <p class="${r}">Status: ${t.status}</p>
                
                ${t.issues&&t.issues.length>0?`
                    <h3>Issues Found:</h3>
                    ${t.issues.map(i=>`<div class="${i.startsWith("CRITICAL:")?"issue-critical":"issue-warning"}">\u26A0\uFE0F ${i}</div>`).join("")}
                `:""}
                
                ${t.settings?`
                    <h3>Settings:</h3>
                    <pre>${JSON.stringify(t.settings,null,2)}</pre>
                `:""}
                
                ${t.testFiles?`
                    <h3>File Tests:</h3>
                    ${t.testFiles.map(i=>`
                        <div class="file-test">
                            \u{1F4C4} ${i.file}: 
                            ${i.exists?"\u2705":"\u274C"} exists | 
                            ${i.excluded?"\u{1F6AB}":"\u2705"} ${i.excluded?"excluded":"included"} | 
                            ${i.hasDecoration?"\u{1F3F7}\uFE0F":"\u274C"} ${i.hasDecoration?`badge: ${i.badge}`:"no decoration"}
                        </div>
                    `).join("")}
                `:""}
                
                ${t.tests?`
                    <h3>Test Results:</h3>
                    ${t.tests.map(i=>`
                        <div class="badge-test">
                            ${i.success?"\u2705":"\u274C"} ${i.name}
                            ${i.badge?` \u2192 "${i.badge}"`:""}
                            ${i.error?` (${i.error})`:""}
                        </div>
                    `).join("")}
                `:""}
                
                ${t.cacheInfo?`
                    <h3>Cache Information:</h3>
                    <pre>${JSON.stringify(t.cacheInfo,null,2)}</pre>
                `:""}
                
                ${t.decorationExtensions&&t.decorationExtensions.length>0?`
                    <h3>Other Decoration Extensions:</h3>
                    ${t.decorationExtensions.map(i=>`
                        <div class="file-test">\u{1F50C} ${i.name} (${i.id})</div>
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
            <pre>${JSON.stringify(n,null,2)}</pre>
        </div>
    </body>
    </html>`}g(vo,"generateDiagnosticsWebview");function bo(n){let e=g(t=>{if(t===0)return"0 B";let o=1024,r=["B","KB","MB","GB"],i=Math.floor(Math.log(t)/Math.log(o));return parseFloat((t/Math.pow(o,i)).toFixed(2))+" "+r[i]},"formatBytes");return`
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
                    <div class="metric-value">${n.totalDecorations||0}</div>
                    <div class="metric-label">Total Decorations</div>
                    <div class="metric-value">${n.cacheHitRate||"0%"}</div>
                    <div class="metric-label">Cache Hit Rate</div>
                </div>
                
                ${n.advancedCache?`
                <div class="metric-card">
                    <div class="metric-title">\u{1F9E0} Advanced Cache</div>
                    <div class="metric-value">${n.advancedCache.memoryItems||0}</div>
                    <div class="metric-label">Memory Items</div>
                    <div class="metric-value">${e(n.advancedCache.memoryUsage||0)}</div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${n.advancedCache.memoryUsagePercent||0}%"></div>
                    </div>
                    <div class="metric-label">${n.advancedCache.memoryUsagePercent||"0.00"}% of limit</div>
                    <div class="metric-value">${n.advancedCache.memoryHitRate||"0%"}</div>
                    <div class="metric-label">Memory Hit Rate</div>
                    <div class="metric-value">${n.advancedCache.diskHitRate||"0%"}</div>
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
                
                ${n.batchProcessor?`
                <div class="metric-card">
                    <div class="metric-title">\u26A1 Batch Processor</div>
                    <div class="metric-value">${n.batchProcessor.totalBatches}</div>
                    <div class="metric-label">Total Batches Processed</div>
                    <div class="metric-value">${n.batchProcessor.averageBatchTime.toFixed(2)}ms</div>
                    <div class="metric-label">Average Batch Time</div>
                    <div class="metric-value">${n.batchProcessor.isProcessing?"Active":"Idle"}</div>
                    <div class="metric-label">Current Status</div>
                </div>
                `:""}
                
                <div class="metric-card">
                    <div class="metric-title">\u{1F4C8} Performance</div>
                    <div class="metric-value">${n.cacheHits||0}</div>
                    <div class="metric-label">Cache Hits</div>
                    <div class="metric-value">${n.cacheMisses||0}</div>
                    <div class="metric-label">Cache Misses</div>
                    <div class="metric-value">${n.errors||0}</div>
                    <div class="metric-label">Errors</div>
                </div>
            </div>
        </body>
        </html>
    `}g(bo,"generatePerformanceAnalyticsHTML");function At(n){let e=c.window.createStatusBarItem(c.StatusBarAlignment.Right,100);e.command="explorerDates.showFileDetails",e.tooltip="Click to show detailed file information";let t=g(async()=>{try{let o=c.window.activeTextEditor;if(!o){e.hide();return}let r=o.document.uri;if(r.scheme!=="file"){e.hide();return}let a=await require("fs").promises.stat(r.fsPath),l=v._formatDateBadge(a.mtime,"smart"),h=v._formatFileSize(a.size,"auto");e.text=`$(clock) ${l} $(file) ${h}`,e.show()}catch(o){e.hide(),u.debug("Failed to update status bar",o)}},"updateStatusBar");return c.window.onDidChangeActiveTextEditor(t),c.window.onDidChangeTextEditorSelection(t),t(),n.subscriptions.push(e),e}g(At,"initializeStatusBar");async function yo(n){try{u=uo(),oe=po(),u.info("Explorer Dates: Extension activated"),v=new go;let e=c.window.registerFileDecorationProvider(v);n.subscriptions.push(e),n.subscriptions.push(v),n.subscriptions.push(u),await v.initializeAdvancedSystems(n);let t=null,o=null,r=null,i=null,a=g(()=>{if(!t){let{OnboardingManager:s}=xt();t=new s(n)}return t},"getOnboardingManager"),l=g(()=>{if(!o){let{WorkspaceTemplatesManager:s}=Dt();o=new s}return o},"getWorkspaceTemplatesManager"),h=g(()=>{if(!r){let{ExtensionApiManager:s}=Ft();r=new s}return r},"getExtensionApiManager"),f=g(()=>{if(!i){let{ExportReportingManager:s}=kt();i=new s}return i},"getExportReportingManager"),m=g(()=>h().getApi(),"api");n.exports=m,c.workspace.getConfiguration("explorerDates").get("showWelcomeOnStartup",!0)&&await a().shouldShowOnboarding()&&setTimeout(()=>{a().showWelcomeMessage()},5e3);let F=c.commands.registerCommand("explorerDates.refreshDateDecorations",()=>{try{if(v){v.clearAllCaches(),v.refreshAll();let s=oe.getString("refreshSuccess")||"Date decorations refreshed - all caches cleared";c.window.showInformationMessage(s),u.info("Date decorations refreshed manually with cache clear")}}catch(s){u.error("Failed to refresh decorations",s),c.window.showErrorMessage(`Failed to refresh decorations: ${s.message}`)}});n.subscriptions.push(F);let O=c.commands.registerCommand("explorerDates.previewConfiguration",s=>{try{v&&(v.applyPreviewSettings(s),u.info("Configuration preview applied",s))}catch(d){u.error("Failed to apply configuration preview",d)}});n.subscriptions.push(O);let B=c.commands.registerCommand("explorerDates.clearPreview",()=>{try{v&&(v.applyPreviewSettings(null),u.info("Configuration preview cleared"))}catch(s){u.error("Failed to clear configuration preview",s)}});n.subscriptions.push(B);let J=c.commands.registerCommand("explorerDates.showMetrics",()=>{try{if(v){let s=v.getMetrics(),d=`Explorer Dates Metrics:
Total Decorations: ${s.totalDecorations}
Cache Size: ${s.cacheSize}
Cache Hits: ${s.cacheHits}
Cache Misses: ${s.cacheMisses}
Cache Hit Rate: ${s.cacheHitRate}
Errors: ${s.errors}`;s.advancedCache&&(d+=`

Advanced Cache:
Memory Items: ${s.advancedCache.memoryItems}
Memory Usage: ${(s.advancedCache.memoryUsage/1024/1024).toFixed(2)} MB
Memory Hit Rate: ${s.advancedCache.memoryHitRate}
Disk Hit Rate: ${s.advancedCache.diskHitRate}
Evictions: ${s.advancedCache.evictions}`),s.batchProcessor&&(d+=`

Batch Processor:
Queue Length: ${s.batchProcessor.queueLength}
Is Processing: ${s.batchProcessor.isProcessing}
Average Batch Time: ${s.batchProcessor.averageBatchTime.toFixed(2)}ms`),c.window.showInformationMessage(d,{modal:!0}),u.info("Metrics displayed",s)}}catch(s){u.error("Failed to show metrics",s),c.window.showErrorMessage(`Failed to show metrics: ${s.message}`)}});n.subscriptions.push(J);let re=c.commands.registerCommand("explorerDates.openLogs",()=>{try{u.show()}catch(s){u.error("Failed to open logs",s),c.window.showErrorMessage(`Failed to open logs: ${s.message}`)}});n.subscriptions.push(re);let ot=c.commands.registerCommand("explorerDates.showCurrentConfig",()=>{try{let s=c.workspace.getConfiguration("explorerDates"),d={highContrastMode:s.get("highContrastMode"),badgePriority:s.get("badgePriority"),colorScheme:s.get("colorScheme"),accessibilityMode:s.get("accessibilityMode"),dateDecorationFormat:s.get("dateDecorationFormat"),showGitInfo:s.get("showGitInfo"),showFileSize:s.get("showFileSize")},C=`Current Explorer Dates Configuration:

${Object.entries(d).map(([x,z])=>`${x}: ${JSON.stringify(z)}`).join(`
`)}`;c.window.showInformationMessage(C,{modal:!0}),u.info("Current configuration displayed",d)}catch(s){u.error("Failed to show configuration",s)}});n.subscriptions.push(ot);let ie=c.commands.registerCommand("explorerDates.resetToDefaults",async()=>{try{let s=c.workspace.getConfiguration("explorerDates");await s.update("highContrastMode",!1,c.ConfigurationTarget.Global),await s.update("badgePriority","time",c.ConfigurationTarget.Global),await s.update("accessibilityMode",!1,c.ConfigurationTarget.Global),c.window.showInformationMessage("Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately."),u.info("Reset problematic settings to defaults"),v&&(v.clearAllCaches(),v.refreshAll())}catch(s){u.error("Failed to reset settings",s),c.window.showErrorMessage(`Failed to reset settings: ${s.message}`)}});n.subscriptions.push(ie);let ye=c.commands.registerCommand("explorerDates.toggleDecorations",()=>{try{let s=c.workspace.getConfiguration("explorerDates"),d=s.get("showDateDecorations",!0);s.update("showDateDecorations",!d,c.ConfigurationTarget.Global);let C=d?oe.getString("decorationsDisabled")||"Date decorations disabled":oe.getString("decorationsEnabled")||"Date decorations enabled";c.window.showInformationMessage(C),u.info(`Date decorations toggled to: ${!d}`)}catch(s){u.error("Failed to toggle decorations",s),c.window.showErrorMessage(`Failed to toggle decorations: ${s.message}`)}});n.subscriptions.push(ye);let K=c.commands.registerCommand("explorerDates.copyFileDate",async s=>{try{if(!s&&c.window.activeTextEditor&&(s=c.window.activeTextEditor.document.uri),!s){c.window.showWarningMessage("No file selected");return}let x=(await require("fs").promises.stat(s.fsPath)).mtime.toLocaleString();await c.env.clipboard.writeText(x),c.window.showInformationMessage(`Copied to clipboard: ${x}`),u.info(`File date copied for: ${s.fsPath}`)}catch(d){u.error("Failed to copy file date",d),c.window.showErrorMessage(`Failed to copy file date: ${d.message}`)}});n.subscriptions.push(K);let he=c.commands.registerCommand("explorerDates.showFileDetails",async s=>{try{if(!s&&c.window.activeTextEditor&&(s=c.window.activeTextEditor.document.uri),!s){c.window.showWarningMessage("No file selected");return}let d=require("fs").promises,C=require("path"),x=await d.stat(s.fsPath),z=C.basename(s.fsPath),S=v._formatFileSize(x.size,"auto"),j=x.mtime.toLocaleString(),N=x.birthtime.toLocaleString(),H=`File: ${z}
Size: ${S}
Modified: ${j}
Created: ${N}
Path: ${s.fsPath}`;c.window.showInformationMessage(H,{modal:!0}),u.info(`File details shown for: ${s.fsPath}`)}catch(d){u.error("Failed to show file details",d),c.window.showErrorMessage(`Failed to show file details: ${d.message}`)}});n.subscriptions.push(he);let Ce=c.commands.registerCommand("explorerDates.toggleFadeOldFiles",()=>{try{let s=c.workspace.getConfiguration("explorerDates"),d=s.get("fadeOldFiles",!1);s.update("fadeOldFiles",!d,c.ConfigurationTarget.Global);let C=d?"Fade old files disabled":"Fade old files enabled";c.window.showInformationMessage(C),u.info(`Fade old files toggled to: ${!d}`)}catch(s){u.error("Failed to toggle fade old files",s),c.window.showErrorMessage(`Failed to toggle fade old files: ${s.message}`)}});n.subscriptions.push(Ce);let rt=c.commands.registerCommand("explorerDates.showFileHistory",async s=>{try{if(!s&&c.window.activeTextEditor&&(s=c.window.activeTextEditor.document.uri),!s){c.window.showWarningMessage("No file selected");return}let{exec:d}=require("child_process"),C=require("path"),x=c.workspace.getWorkspaceFolder(s);if(!x){c.window.showWarningMessage("File is not in a workspace");return}let S=`git log --oneline -10 -- "${C.relative(x.uri.fsPath,s.fsPath)}"`;d(S,{cwd:x.uri.fsPath},(j,N)=>{if(j){j.message.includes("not a git repository")?c.window.showWarningMessage("This file is not in a Git repository"):c.window.showErrorMessage(`Git error: ${j.message}`);return}if(!N.trim()){c.window.showInformationMessage("No Git history found for this file");return}let H=N.trim(),It=C.basename(s.fsPath);c.window.showInformationMessage(`Recent commits for ${It}:

${H}`,{modal:!0})}),u.info(`File history requested for: ${s.fsPath}`)}catch(d){u.error("Failed to show file history",d),c.window.showErrorMessage(`Failed to show file history: ${d.message}`)}});n.subscriptions.push(rt);let se=c.commands.registerCommand("explorerDates.compareWithPrevious",async s=>{try{if(!s&&c.window.activeTextEditor&&(s=c.window.activeTextEditor.document.uri),!s){c.window.showWarningMessage("No file selected");return}if(!c.workspace.getWorkspaceFolder(s)){c.window.showWarningMessage("File is not in a workspace");return}await c.commands.executeCommand("git.openChange",s),u.info(`Git diff opened for: ${s.fsPath}`)}catch(d){u.error("Failed to compare with previous version",d),c.window.showErrorMessage(`Failed to compare with previous version: ${d.message}`)}});n.subscriptions.push(se);let xe=c.commands.registerCommand("explorerDates.showWorkspaceActivity",async()=>{try{let s=c.window.createWebviewPanel("workspaceActivity","Workspace File Activity",c.ViewColumn.One,{enableScripts:!0}),d=require("fs").promises,C=require("path"),x=[];if(!c.workspace.workspaceFolders){c.window.showWarningMessage("No workspace folder open");return}let z=c.workspace.workspaceFolders[0],S=await c.workspace.findFiles("**/*","**/node_modules/**",100);for(let N of S)try{let H=await d.stat(N.fsPath);H.isFile()&&x.push({path:C.relative(z.uri.fsPath,N.fsPath),modified:H.mtime,size:H.size})}catch{}x.sort((N,H)=>H.modified.getTime()-N.modified.getTime());let j=fo(x.slice(0,50));s.webview.html=j,u.info("Workspace activity panel opened")}catch(s){u.error("Failed to show workspace activity",s),c.window.showErrorMessage(`Failed to show workspace activity: ${s.message}`)}});n.subscriptions.push(xe);let _e=c.commands.registerCommand("explorerDates.showPerformanceAnalytics",async()=>{try{let s=c.window.createWebviewPanel("performanceAnalytics","Explorer Dates Performance Analytics",c.ViewColumn.One,{enableScripts:!0}),d=v?v.getMetrics():{};s.webview.html=bo(d),u.info("Performance analytics panel opened")}catch(s){u.error("Failed to show performance analytics",s),c.window.showErrorMessage(`Failed to show performance analytics: ${s.message}`)}});n.subscriptions.push(_e);let ge=c.commands.registerCommand("explorerDates.debugCache",async()=>{try{if(v){let s=v.getMetrics(),d={"Cache Summary":{"Memory Cache Size":s.cacheSize,"Cache Hit Rate":s.cacheHitRate,"Total Hits":s.cacheHits,"Total Misses":s.cacheMisses,"Cache Timeout":`${s.cacheDebugging.cacheTimeout}ms`},"Advanced Cache":s.advancedCache||"Not available","Sample Cache Keys":s.cacheDebugging.memoryCacheKeys||[]},C=JSON.stringify(d,null,2);c.window.showInformationMessage(`Cache Debug Info:
${C}`,{modal:!0}),u.info("Cache debug info displayed",d)}}catch(s){u.error("Failed to show cache debug info",s),c.window.showErrorMessage(`Failed to show cache debug info: ${s.message}`)}});n.subscriptions.push(ge);let Z=c.commands.registerCommand("explorerDates.runDiagnostics",async()=>{try{let s=require("path"),d=c.workspace.getConfiguration("explorerDates"),C=c.window.activeTextEditor,x={"Extension Status":{"Provider Active":v?"Yes":"No","Decorations Enabled":d.get("showDateDecorations",!0)?"Yes":"No","VS Code Version":c.version,"Extension Version":n.extension.packageJSON.version}};if(C){let S=C.document.uri;S.scheme==="file"&&(x["Current File"]={"File Path":S.fsPath,"File Extension":s.extname(S.fsPath)||"No extension","Is Excluded":v?await v._isExcludedSimple(S):"Unknown"})}if(x.Configuration={"Excluded Folders":d.get("excludedFolders",[]),"Excluded Patterns":d.get("excludedPatterns",[]),"Color Scheme":d.get("colorScheme","none"),"Cache Timeout":d.get("cacheTimeout",3e4)+"ms"},v){let S=v.getMetrics();x.Performance={"Total Decorations":S.totalDecorations,"Cache Size":S.cacheSize,Errors:S.errors}}let z=c.window.createWebviewPanel("explorerDatesDiagnostics","Explorer Dates Diagnostics",c.ViewColumn.One,{enableScripts:!0});z.webview.html=wo(x),u.info("Diagnostics panel opened",x)}catch(s){u.error("Failed to run diagnostics",s),c.window.showErrorMessage(`Failed to run diagnostics: ${s.message}`)}});n.subscriptions.push(Z);let it=c.commands.registerCommand("explorerDates.testDecorations",async()=>{try{u.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let{DecorationDiagnostics:s}=Mt(),C=await new s(v).runComprehensiveDiagnostics(),x=c.window.createWebviewPanel("decorationDiagnostics","Decoration Diagnostics - Root Cause Analysis",c.ViewColumn.One,{enableScripts:!0});x.webview.html=vo(C);let z=[],S=[];Object.values(C.tests).forEach(j=>{j.issues&&j.issues.forEach(N=>{N.startsWith("CRITICAL:")?z.push(N):N.startsWith("WARNING:")&&S.push(N)})}),z.length>0?c.window.showErrorMessage(`CRITICAL ISSUES FOUND: ${z.join(", ")}`):S.length>0?c.window.showWarningMessage(`Warnings found: ${S.length} potential issues detected. Check diagnostics panel.`):c.window.showInformationMessage("No critical issues found. Decorations should be working properly."),u.info("\u{1F50D} Comprehensive diagnostics completed",C)}catch(s){u.error("Failed to run comprehensive diagnostics",s),c.window.showErrorMessage(`Diagnostics failed: ${s.message}`)}});n.subscriptions.push(it);let M=c.commands.registerCommand("explorerDates.monitorDecorations",async()=>{v?(v.startProviderCallMonitoring(),v.forceRefreshAllDecorations(),setTimeout(()=>{let s=v.getProviderCallStats(),d=`VS Code Decoration Requests: ${s.totalCalls} calls for ${s.uniqueFiles} files`;c.window.showInformationMessage(d),u.info("\u{1F50D} Decoration monitoring results:",s)},5e3),c.window.showInformationMessage("Started monitoring VS Code decoration requests. Results in 5 seconds...")):c.window.showErrorMessage("Decoration provider not available")});n.subscriptions.push(M);let X=c.commands.registerCommand("explorerDates.testVSCodeRendering",async()=>{try{let{testVSCodeDecorationRendering:s,testFileDecorationAPI:d}=Et();u.info("\u{1F3A8} Testing VS Code decoration rendering system...");let C=await d();u.info("\u{1F527} FileDecoration API tests:",C);let x=await s();u.info("\u{1F3A8} Decoration rendering test:",x),c.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.')}catch(s){u.error("Failed to test VS Code rendering:",s),c.window.showErrorMessage(`VS Code rendering test failed: ${s.message}`)}});n.subscriptions.push(X);let ue=c.commands.registerCommand("explorerDates.quickFix",async()=>{try{let s=c.workspace.getConfiguration("explorerDates"),d=[];s.get("showDateDecorations",!0)||d.push({issue:"Date decorations are disabled",fix:g(async()=>{await s.update("showDateDecorations",!0,c.ConfigurationTarget.Global)},"fix"),description:"Enable date decorations"});let C=s.get("excludedPatterns",[]);if(C.includes("**/*")&&d.push({issue:"All files are excluded by pattern",fix:g(async()=>{let S=C.filter(j=>j!=="**/*");await s.update("excludedPatterns",S,c.ConfigurationTarget.Global)},"fix"),description:"Remove overly broad exclusion pattern"}),d.length===0){c.window.showInformationMessage("No common issues detected. Decorations should be working.");return}let x=d.map(S=>({label:S.description,description:S.issue,fix:S.fix})),z=await c.window.showQuickPick(x,{placeHolder:"Select an issue to fix automatically"});z&&(await z.fix(),c.window.showInformationMessage("Fixed! Try refreshing decorations now."),v&&(v.clearAllCaches(),v.refreshAll()))}catch(s){u.error("Failed to run quick fix",s),c.window.showErrorMessage(`Failed to run quick fix: ${s.message}`)}});n.subscriptions.push(ue);let ae=c.commands.registerCommand("explorerDates.showKeyboardShortcuts",async()=>{try{v&&v._accessibility?await v._accessibility.showKeyboardShortcutsHelp():c.window.showInformationMessage("Keyboard shortcuts: Ctrl+Shift+D (toggle), Ctrl+Shift+C (copy date), Ctrl+Shift+I (file details), Ctrl+Shift+R (refresh), Ctrl+Shift+A (workspace activity)"),u.info("Keyboard shortcuts help shown")}catch(s){u.error("Failed to show keyboard shortcuts help",s),c.window.showErrorMessage(`Failed to show keyboard shortcuts help: ${s.message}`)}});n.subscriptions.push(ae);let De=c.commands.registerCommand("explorerDates.showFeatureTour",async()=>{try{await a().showFeatureTour(),u.info("Feature tour opened")}catch(s){u.error("Failed to show feature tour",s),c.window.showErrorMessage(`Failed to show feature tour: ${s.message}`)}});n.subscriptions.push(De);let ne=c.commands.registerCommand("explorerDates.showQuickSetup",async()=>{try{await a().showQuickSetupWizard(),u.info("Quick setup wizard opened")}catch(s){u.error("Failed to show quick setup wizard",s),c.window.showErrorMessage(`Failed to show quick setup wizard: ${s.message}`)}});n.subscriptions.push(ne);let ce=c.commands.registerCommand("explorerDates.showWhatsNew",async()=>{try{let s=n.extension.packageJSON.version;await a().showWhatsNew(s),u.info("What's new panel opened")}catch(s){u.error("Failed to show what's new",s),c.window.showErrorMessage(`Failed to show what's new: ${s.message}`)}});n.subscriptions.push(ce);let $=c.commands.registerCommand("explorerDates.openTemplateManager",async()=>{try{await l().showTemplateManager(),u.info("Template manager opened")}catch(s){u.error("Failed to open template manager",s),c.window.showErrorMessage(`Failed to open template manager: ${s.message}`)}});n.subscriptions.push($);let U=c.commands.registerCommand("explorerDates.saveTemplate",async()=>{try{let s=await c.window.showInputBox({prompt:"Enter template name",placeHolder:"e.g., My Project Setup"});if(s){let d=await c.window.showInputBox({prompt:"Enter description (optional)",placeHolder:"Brief description of this template"})||"";await l().saveCurrentConfiguration(s,d)}u.info("Template saved")}catch(s){u.error("Failed to save template",s),c.window.showErrorMessage(`Failed to save template: ${s.message}`)}});n.subscriptions.push(U);let Se=c.commands.registerCommand("explorerDates.generateReport",async()=>{try{await f().showReportDialog(),u.info("Report generation started")}catch(s){u.error("Failed to generate report",s),c.window.showErrorMessage(`Failed to generate report: ${s.message}`)}});n.subscriptions.push(Se);let Fe=c.commands.registerCommand("explorerDates.showApiInfo",async()=>{try{let s=c.window.createWebviewPanel("apiInfo","Explorer Dates API Information",c.ViewColumn.One,{enableScripts:!0});s.webview.html=mo(m),u.info("API information panel opened")}catch(s){u.error("Failed to show API information",s),c.window.showErrorMessage(`Failed to show API information: ${s.message}`)}});n.subscriptions.push(Fe);let P;c.workspace.getConfiguration("explorerDates").get("showStatusBar",!1)&&(P=At(n)),c.workspace.onDidChangeConfiguration(s=>{if(s.affectsConfiguration("explorerDates.showStatusBar")){let d=c.workspace.getConfiguration("explorerDates").get("showStatusBar",!1);d&&!P?P=At(n):!d&&P&&(P.dispose(),P=null)}}),u.info("Explorer Dates: Date decorations ready")}catch(e){let t=`${oe?oe.getString("activationError"):"Explorer Dates failed to activate"}: ${e.message}`;throw u&&u.error("Extension activation failed",e),c.window.showErrorMessage(t),e}}g(yo,"activate");async function Co(){try{u&&u.info("Explorer Dates extension is being deactivated"),v&&typeof v.dispose=="function"&&await v.dispose(),u&&u.info("Explorer Dates extension deactivated successfully")}catch(n){u&&u.error("Explorer Dates: Error during deactivation",n)}}g(Co,"deactivate");module.exports={activate:yo,deactivate:Co};
