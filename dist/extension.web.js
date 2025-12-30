var __defProp=Object.defineProperty;var __getOwnPropNames=Object.getOwnPropertyNames;var __name=(target,value)=>__defProp(target,"name",{value,configurable:!0});var __commonJS=(cb,mod)=>function(){return mod||(0,cb[__getOwnPropNames(cb)[0]])((mod={exports:{}}).exports,mod),mod.exports};var require_logger=__commonJS({"src/logger.js"(exports2,module2){var vscode2=require("vscode"),_Logger=class _Logger{constructor(){this._outputChannel=vscode2.window.createOutputChannel("Explorer Dates"),this._isEnabled=!1,this._updateConfig(),vscode2.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.enableLogging")&&this._updateConfig()})}_updateConfig(){let config=vscode2.workspace.getConfiguration("explorerDates");this._isEnabled=config.get("enableLogging",!1)}debug(message,...args){if(this._isEnabled){let formattedMessage=`[${new Date().toISOString()}] [DEBUG] ${message}`;this._outputChannel.appendLine(formattedMessage),args.length>0&&this._outputChannel.appendLine(JSON.stringify(args,null,2)),console.log(formattedMessage,...args)}}info(message,...args){let formattedMessage=`[${new Date().toISOString()}] [INFO] ${message}`;this._outputChannel.appendLine(formattedMessage),args.length>0&&this._outputChannel.appendLine(JSON.stringify(args,null,2)),console.log(formattedMessage,...args)}warn(message,...args){let formattedMessage=`[${new Date().toISOString()}] [WARN] ${message}`;this._outputChannel.appendLine(formattedMessage),args.length>0&&this._outputChannel.appendLine(JSON.stringify(args,null,2)),console.warn(formattedMessage,...args)}error(message,error,...args){let formattedMessage=`[${new Date().toISOString()}] [ERROR] ${message}`;this._outputChannel.appendLine(formattedMessage),error instanceof Error&&(this._outputChannel.appendLine(`Error: ${error.message}`),error.stack&&this._outputChannel.appendLine(`Stack: ${error.stack}`)),args.length>0&&this._outputChannel.appendLine(JSON.stringify(args,null,2)),console.error(formattedMessage,error,...args)}show(){this._outputChannel.show()}clear(){this._outputChannel.clear()}dispose(){this._outputChannel.dispose()}};__name(_Logger,"Logger");var Logger=_Logger,loggerInstance=null;function getLogger(){return loggerInstance||(loggerInstance=new Logger),loggerInstance}__name(getLogger,"getLogger");module2.exports={Logger,getLogger}}});var require_localization=__commonJS({"src/localization.js"(exports2,module2){var vscode2=require("vscode"),translations={en:{now:"now",minutes:"m",hours:"h",days:"d",weeks:"w",months:"mo",years:"y",justNow:"just now",minutesAgo:__name(n=>`${n} minute${n!==1?"s":""} ago`,"minutesAgo"),hoursAgo:__name(n=>`${n} hour${n!==1?"s":""} ago`,"hoursAgo"),yesterday:"yesterday",daysAgo:__name(n=>`${n} day${n!==1?"s":""} ago`,"daysAgo"),lastModified:"Last modified",refreshSuccess:"Date decorations refreshed",activationError:"Explorer Dates failed to activate",errorAccessingFile:"Error accessing file for decoration"},es:{now:"ahora",minutes:"m",hours:"h",days:"d",weeks:"s",months:"m",years:"a",justNow:"ahora mismo",minutesAgo:__name(n=>`hace ${n} minuto${n!==1?"s":""}`,"minutesAgo"),hoursAgo:__name(n=>`hace ${n} hora${n!==1?"s":""}`,"hoursAgo"),yesterday:"ayer",daysAgo:__name(n=>`hace ${n} d\xEDa${n!==1?"s":""}`,"daysAgo"),lastModified:"\xDAltima modificaci\xF3n",refreshSuccess:"Decoraciones de fecha actualizadas",activationError:"Explorer Dates no se pudo activar",errorAccessingFile:"Error al acceder al archivo para decoraci\xF3n"},fr:{now:"maintenant",minutes:"m",hours:"h",days:"j",weeks:"s",months:"m",years:"a",justNow:"\xE0 l'instant",minutesAgo:__name(n=>`il y a ${n} minute${n!==1?"s":""}`,"minutesAgo"),hoursAgo:__name(n=>`il y a ${n} heure${n!==1?"s":""}`,"hoursAgo"),yesterday:"hier",daysAgo:__name(n=>`il y a ${n} jour${n!==1?"s":""}`,"daysAgo"),lastModified:"Derni\xE8re modification",refreshSuccess:"D\xE9corations de date actualis\xE9es",activationError:"\xC9chec de l'activation d'Explorer Dates",errorAccessingFile:"Erreur lors de l'acc\xE8s au fichier pour la d\xE9coration"},de:{now:"jetzt",minutes:"Min",hours:"Std",days:"T",weeks:"W",months:"Mon",years:"J",justNow:"gerade eben",minutesAgo:__name(n=>`vor ${n} Minute${n!==1?"n":""}`,"minutesAgo"),hoursAgo:__name(n=>`vor ${n} Stunde${n!==1?"n":""}`,"hoursAgo"),yesterday:"gestern",daysAgo:__name(n=>`vor ${n} Tag${n!==1?"en":""}`,"daysAgo"),lastModified:"Zuletzt ge\xE4ndert",refreshSuccess:"Datumsdekorationen aktualisiert",activationError:"Explorer Dates konnte nicht aktiviert werden",errorAccessingFile:"Fehler beim Zugriff auf Datei f\xFCr Dekoration"},ja:{now:"\u4ECA",minutes:"\u5206",hours:"\u6642\u9593",days:"\u65E5",weeks:"\u9031",months:"\u30F6\u6708",years:"\u5E74",justNow:"\u305F\u3063\u305F\u4ECA",minutesAgo:__name(n=>`${n}\u5206\u524D`,"minutesAgo"),hoursAgo:__name(n=>`${n}\u6642\u9593\u524D`,"hoursAgo"),yesterday:"\u6628\u65E5",daysAgo:__name(n=>`${n}\u65E5\u524D`,"daysAgo"),lastModified:"\u6700\u7D42\u66F4\u65B0",refreshSuccess:"\u65E5\u4ED8\u88C5\u98FE\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",activationError:"Explorer Dates\u306E\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F",errorAccessingFile:"\u30D5\u30A1\u30A4\u30EB\u30A2\u30AF\u30BB\u30B9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"},zh:{now:"\u73B0\u5728",minutes:"\u5206\u949F",hours:"\u5C0F\u65F6",days:"\u5929",weeks:"\u5468",months:"\u6708",years:"\u5E74",justNow:"\u521A\u521A",minutesAgo:__name(n=>`${n}\u5206\u949F\u524D`,"minutesAgo"),hoursAgo:__name(n=>`${n}\u5C0F\u65F6\u524D`,"hoursAgo"),yesterday:"\u6628\u5929",daysAgo:__name(n=>`${n}\u5929\u524D`,"daysAgo"),lastModified:"\u6700\u540E\u4FEE\u6539",refreshSuccess:"\u65E5\u671F\u88C5\u9970\u5DF2\u5237\u65B0",activationError:"Explorer Dates \u6FC0\u6D3B\u5931\u8D25",errorAccessingFile:"\u8BBF\u95EE\u6587\u4EF6\u88C5\u9970\u65F6\u51FA\u9519"}},_LocalizationManager=class _LocalizationManager{constructor(){this._currentLocale="en",this._updateLocale(),vscode2.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.locale")&&this._updateLocale()})}_updateLocale(){let locale=vscode2.workspace.getConfiguration("explorerDates").get("locale","auto");locale==="auto"&&(locale=vscode2.env.language.split("-")[0]),translations[locale]||(locale="en"),this._currentLocale=locale}getString(key,...args){let value=(translations[this._currentLocale]||translations.en)[key];return typeof value=="function"?value(...args):value||translations.en[key]||key}getCurrentLocale(){return this._currentLocale}formatDate(date,options={}){try{return date.toLocaleDateString(this._currentLocale,options)}catch{return date.toLocaleDateString("en",options)}}};__name(_LocalizationManager,"LocalizationManager");var LocalizationManager=_LocalizationManager,localizationInstance=null;function getLocalization(){return localizationInstance||(localizationInstance=new LocalizationManager),localizationInstance}__name(getLocalization,"getLocalization");module2.exports={LocalizationManager,getLocalization}}});var require_env=__commonJS({"src/utils/env.js"(exports2,module2){var vscode2=require("vscode");function isWebEnvironment(){try{return vscode2?.env?.uiKind===vscode2?.UIKind?.Web}catch{return!1}}__name(isWebEnvironment,"isWebEnvironment");module2.exports={isWebEnvironment}}});var require_pathUtils=__commonJS({"src/utils/pathUtils.js"(exports2,module2){function normalizePath(input=""){return input?input.replace(/\\/g,"/"):""}__name(normalizePath,"normalizePath");function getSegments(input=""){let normalized=normalizePath(input);return normalized?normalized.split("/").filter(Boolean):[]}__name(getSegments,"getSegments");function getFileName2(input=""){let segments=getSegments(input);return segments.length?segments[segments.length-1]:""}__name(getFileName2,"getFileName");function getExtension(input=""){let fileName=getFileName2(input),dotIndex=fileName.lastIndexOf(".");return dotIndex<=0?"":fileName.substring(dotIndex).toLowerCase()}__name(getExtension,"getExtension");function getDirectory(input=""){let normalized=normalizePath(input),lastSlash=normalized.lastIndexOf("/");return lastSlash===-1?"":normalized.substring(0,lastSlash)}__name(getDirectory,"getDirectory");function joinPath(...segments){return normalizePath(segments.filter(Boolean).join("/")).replace(/\/+/g,"/")}__name(joinPath,"joinPath");function getCacheKey(input=""){return normalizePath(input).toLowerCase()}__name(getCacheKey,"getCacheKey");function getUriPath(target=""){if(!target)return"";if(typeof target=="string")return target;if(typeof target.fsPath=="string"&&target.fsPath.length>0)return target.fsPath;if(typeof target.path=="string"&&target.path.length>0)return target.path;if(typeof target.toString=="function")try{return target.toString(!0)}catch{return target.toString()}return String(target)}__name(getUriPath,"getUriPath");function getRelativePath2(base="",target=""){let normalizedBase=normalizePath(base),normalizedTarget=normalizePath(target);return normalizedBase&&normalizedTarget.startsWith(normalizedBase)?normalizedTarget.substring(normalizedBase.length).replace(/^\/+/,""):normalizedTarget}__name(getRelativePath2,"getRelativePath");module2.exports={normalizePath,getFileName:getFileName2,getExtension,getDirectory,joinPath,getCacheKey,getUriPath,getRelativePath:getRelativePath2}}});var require_FileSystemAdapter=__commonJS({"src/filesystem/FileSystemAdapter.js"(exports2,module2){var vscode2=require("vscode"),{isWebEnvironment}=require_env(),{normalizePath}=require_pathUtils(),isWebBuild=!0,nodeFs=null;if(!isWebBuild)try{nodeFs=require("fs").promises}catch{nodeFs=null}var _FileSystemAdapter=class _FileSystemAdapter{constructor(){this.isWeb=isWebBuild||isWebEnvironment()}_toPath(target){return target?typeof target=="string"?target:target instanceof vscode2.Uri?target.fsPath||target.path:String(target):""}_toUri(target){if(target instanceof vscode2.Uri)return target;if(typeof target=="string")return vscode2.Uri.file(target);throw new Error(`Unsupported target type: ${typeof target}`)}async stat(target){if(!this.isWeb&&nodeFs)return nodeFs.stat(this._toPath(target));let uri=this._toUri(target),stat=await vscode2.workspace.fs.stat(uri);return{...stat,mtime:new Date(stat.mtime),ctime:new Date(stat.ctime),birthtime:new Date(stat.ctime),isFile:__name(()=>stat.type===vscode2.FileType.File,"isFile"),isDirectory:__name(()=>stat.type===vscode2.FileType.Directory,"isDirectory")}}async readFile(target,encoding="utf8"){if(!this.isWeb&&nodeFs)return nodeFs.readFile(this._toPath(target),encoding);let uri=this._toUri(target),data=await vscode2.workspace.fs.readFile(uri);return encoding===null||encoding==="binary"?data:new TextDecoder(encoding).decode(data)}async writeFile(target,data,encoding="utf8"){if(!this.isWeb&&nodeFs)return nodeFs.writeFile(this._toPath(target),data,encoding);let uri=this._toUri(target),buffer=typeof data=="string"?new TextEncoder().encode(data):data;await vscode2.workspace.fs.writeFile(uri,buffer)}async mkdir(target,options={recursive:!0}){if(!this.isWeb&&nodeFs)return nodeFs.mkdir(this._toPath(target),options);let uri=this._toUri(target);await vscode2.workspace.fs.createDirectory(uri)}async readdir(target,options={withFileTypes:!1}){if(!this.isWeb&&nodeFs)return nodeFs.readdir(this._toPath(target),options);let uri=this._toUri(target),entries=await vscode2.workspace.fs.readDirectory(uri);return options.withFileTypes?entries.map(([name,type])=>({name,isDirectory:__name(()=>type===vscode2.FileType.Directory,"isDirectory"),isFile:__name(()=>type===vscode2.FileType.File,"isFile")})):entries.map(([name])=>name)}async delete(target,options={recursive:!1}){if(!this.isWeb&&nodeFs){let fsPath=this._toPath(target);return options.recursive?nodeFs.rm?nodeFs.rm(fsPath,options):nodeFs.rmdir(fsPath,options):nodeFs.unlink(fsPath)}let uri=this._toUri(target);await vscode2.workspace.fs.delete(uri,options)}async exists(target){try{return await this.stat(target),!0}catch{return!1}}async ensureDirectory(target){let normalized=normalizePath(this._toPath(target));await this.mkdir(normalized,{recursive:!0})}};__name(_FileSystemAdapter,"FileSystemAdapter");var FileSystemAdapter=_FileSystemAdapter,fileSystem2=new FileSystemAdapter;module2.exports={FileSystemAdapter,fileSystem:fileSystem2}}});var require_smartExclusion=__commonJS({"src/smartExclusion.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),{fileSystem:fileSystem2}=require_FileSystemAdapter(),{normalizePath,getRelativePath:getRelativePath2,getFileName:getFileName2}=require_pathUtils(),_SmartExclusionManager=class _SmartExclusionManager{constructor(){this._logger=getLogger(),this._fs=fileSystem2,this._commonExclusions=["node_modules",".npm",".yarn","coverage","nyc_output","dist","build","out","target","bin","obj",".vscode",".idea",".vs",".vscode-test",".git",".svn",".hg",".bzr",".pnpm-store","bower_components","jspm_packages","tmp","temp",".tmp",".cache",".parcel-cache",".DS_Store","Thumbs.db","__pycache__",".pytest_cache",".tox","venv",".env",".virtualenv","vendor",".docker","logs","*.log"],this._patternScores=new Map,this._workspaceAnalysis=new Map,this._logger.info("SmartExclusionManager initialized")}async cleanupAllWorkspaceProfiles(){let config=vscode2.workspace.getConfiguration("explorerDates"),profiles=config.get("workspaceExclusionProfiles",{}),updated=!1;for(let[workspaceKey,exclusions]of Object.entries(profiles)){let list=Array.isArray(exclusions)?exclusions:[],deduped=this._dedupeList(list);this._areListsEqual(list,deduped)||(profiles[workspaceKey]=deduped,updated=!0,this._logger.debug(`Deduped workspace exclusions for ${workspaceKey}`,{before:list.length,after:deduped.length}))}updated?(await config.update("workspaceExclusionProfiles",profiles,vscode2.ConfigurationTarget.Global),this._logger.info("Cleaned up duplicate workspace exclusions",{workspaceCount:Object.keys(profiles).length})):this._logger.debug("Workspace exclusion profiles already clean")}async analyzeWorkspace(workspaceUri){try{let workspacePath=normalizePath(workspaceUri?.fsPath||workspaceUri?.path||""),analysis={detectedPatterns:[],suggestedExclusions:[],projectType:"unknown",riskFolders:[]};analysis.projectType=await this._detectProjectType(workspaceUri);let foundFolders=await this._scanForExclusionCandidates(workspaceUri,workspacePath),scoredPatterns=this._scorePatterns(foundFolders,analysis.projectType);return analysis.detectedPatterns=foundFolders,analysis.suggestedExclusions=scoredPatterns.filter(p=>p.score>.7).map(p=>p.pattern),analysis.riskFolders=scoredPatterns.filter(p=>p.riskLevel==="high").map(p=>p.pattern),this._workspaceAnalysis.set(workspacePath,analysis),this._logger.info(`Workspace analysis complete for ${workspacePath}`,analysis),analysis}catch(error){return this._logger.error("Failed to analyze workspace",error),null}}async _detectProjectType(workspaceUri){let indicators=[{file:"package.json",type:"javascript"},{file:"pom.xml",type:"java"},{file:"Cargo.toml",type:"rust"},{file:"setup.py",type:"python"},{file:"requirements.txt",type:"python"},{file:"Gemfile",type:"ruby"},{file:"composer.json",type:"php"},{file:"go.mod",type:"go"},{file:"CMakeLists.txt",type:"cpp"},{file:"Dockerfile",type:"docker"}];if(!workspaceUri)return"unknown";for(let indicator of indicators)try{let target=vscode2.Uri.joinPath(workspaceUri,indicator.file);if(await this._fs.exists(target))return indicator.type}catch{}return"unknown"}async _scanForExclusionCandidates(workspaceUri,workspacePath,maxDepth=2){let candidates=[],scanDirectory=__name(async(dirUri,currentDepth=0)=>{if(!(currentDepth>maxDepth))try{let entries=await this._fs.readdir(dirUri,{withFileTypes:!0});for(let entry of entries)if(entry.isDirectory()){let fullUri=vscode2.Uri.joinPath(dirUri,entry.name),fullPath=normalizePath(fullUri.fsPath||fullUri.path),relativePath=getRelativePath2(workspacePath,fullPath);this._commonExclusions.includes(entry.name)&&candidates.push({name:entry.name,path:relativePath,type:"common",size:await this._getDirectorySize(fullUri)});let size=await this._getDirectorySize(fullUri);size>10485760&&candidates.push({name:entry.name,path:relativePath,type:"large",size}),await scanDirectory(fullUri,currentDepth+1)}}catch{}},"scanDirectory");return await scanDirectory(workspaceUri),candidates}async _getDirectorySize(dirUri){try{let entries=await this._fs.readdir(dirUri,{withFileTypes:!0}),size=0,fileCount=0;for(let entry of entries){if(fileCount>100)break;if(entry.isFile())try{let fileUri=vscode2.Uri.joinPath(dirUri,entry.name),stat=await this._fs.stat(fileUri);size+=stat.size,fileCount++}catch{}}return size}catch{return 0}}_scorePatterns(candidates,projectType){return candidates.map(candidate=>{let score=0,riskLevel="low";switch(candidate.type==="common"&&(score+=.8),candidate.size>100*1024*1024?(score+=.9,riskLevel="high"):candidate.size>10*1024*1024&&(score+=.5,riskLevel="medium"),projectType){case"javascript":["node_modules",".npm","coverage","dist","build"].includes(candidate.name)&&(score+=.9);break;case"python":["__pycache__",".pytest_cache","venv",".env"].includes(candidate.name)&&(score+=.9);break;case"java":["target","build",".gradle"].includes(candidate.name)&&(score+=.9);break}return["src","lib","app","components","pages"].includes(candidate.name.toLowerCase())&&(score=0,riskLevel="none"),{pattern:candidate.name,path:candidate.path,score:Math.min(score,1),riskLevel,size:candidate.size,type:candidate.type}})}async getWorkspaceExclusions(workspaceUri){let config=vscode2.workspace.getConfiguration("explorerDates"),profiles=config.get("workspaceExclusionProfiles",{}),workspaceKey=this._getWorkspaceKey(workspaceUri),stored=profiles[workspaceKey]||[],deduped=this._dedupeList(stored);if(deduped.length!==stored.length){profiles[workspaceKey]=deduped;try{await config.update("workspaceExclusionProfiles",profiles,vscode2.ConfigurationTarget.Global),this._logger.info(`Cleaned duplicate exclusions for ${workspaceKey}`,{before:stored.length,after:deduped.length})}catch(error){this._logger.warn(`Failed to persist cleaned exclusions for ${workspaceKey}`,error)}}return deduped}async saveWorkspaceExclusions(workspaceUri,exclusions){let config=vscode2.workspace.getConfiguration("explorerDates"),profiles=config.get("workspaceExclusionProfiles",{}),workspaceKey=this._getWorkspaceKey(workspaceUri),normalized=this._dedupeList(exclusions);if(Array.isArray(profiles[workspaceKey])?this._areListsEqual(profiles[workspaceKey],normalized):!1){this._logger.debug(`No workspace exclusion changes for ${workspaceKey}`);return}profiles[workspaceKey]=normalized,await config.update("workspaceExclusionProfiles",profiles,vscode2.ConfigurationTarget.Global),this._logger.info(`Saved workspace exclusions for ${workspaceKey}`,normalized)}async getCombinedExclusions(workspaceUri){let config=vscode2.workspace.getConfiguration("explorerDates"),globalFolders=config.get("excludedFolders",[]),globalPatterns=config.get("excludedPatterns",[]),smartEnabled=config.get("smartExclusions",!0),combinedFolders=[...globalFolders],combinedPatterns=[...globalPatterns],workspaceExclusions=await this.getWorkspaceExclusions(workspaceUri);if(combinedFolders.push(...workspaceExclusions),smartEnabled){let analysis=await this.analyzeWorkspace(workspaceUri);analysis&&combinedFolders.push(...analysis.suggestedExclusions)}return combinedFolders=[...new Set(combinedFolders)],combinedPatterns=[...new Set(combinedPatterns)],{folders:combinedFolders,patterns:combinedPatterns}}_getWorkspaceKey(workspaceUri){if(!workspaceUri)return"unknown-workspace";let fsPath=workspaceUri.fsPath||workspaceUri.path||"";return getFileName2(fsPath)||normalizePath(fsPath)}async suggestExclusions(workspaceUri){let analysis=await this.analyzeWorkspace(workspaceUri),suggestions=this._dedupeList(analysis?.suggestedExclusions||[]);if(!analysis||suggestions.length===0)return;let existing=await this.getWorkspaceExclusions(workspaceUri),newExclusions=suggestions.filter(pattern=>!existing.includes(pattern));if(newExclusions.length===0){this._logger.debug("No new smart exclusions detected",{workspace:this._getWorkspaceKey(workspaceUri)});return}let updated=this._mergeExclusions(existing,newExclusions);await this.saveWorkspaceExclusions(workspaceUri,updated);let summary=newExclusions.length===1?`Explorer Dates automatically excluded "${newExclusions[0]}" to keep Explorer responsive.`:`Explorer Dates automatically excluded ${newExclusions.length} folders to keep Explorer responsive.`,action=await vscode2.window.showInformationMessage(`${summary} Keep these exclusions?`,"Keep","Review","Revert");action==="Revert"?(await this.saveWorkspaceExclusions(workspaceUri,existing),vscode2.window.showInformationMessage("Smart exclusions reverted. Decorations will refresh for the restored folders."),this._logger.info("User reverted smart exclusions",{reverted:newExclusions})):action==="Review"?(this._showExclusionReview(analysis),this._logger.info("User reviewing smart exclusions",{pending:newExclusions})):this._logger.info("User kept smart exclusions",{accepted:newExclusions})}_dedupeList(values=[]){return Array.from(new Set(values.filter(Boolean)))}_mergeExclusions(current=[],additions=[]){return this._dedupeList([...current||[],...additions||[]])}_areListsEqual(a=[],b=[]){return a.length!==b.length?!1:a.every((value,index)=>value===b[index])}_showExclusionReview(analysis){let panel=vscode2.window.createWebviewPanel("exclusionReview","Smart Exclusion Review",vscode2.ViewColumn.One,{enableScripts:!0});panel.webview.html=this._generateReviewHTML(analysis)}_generateReviewHTML(analysis){let formatSize=__name(bytes=>{if(bytes<1024)return`${bytes} B`;let kb=bytes/1024;return kb<1024?`${kb.toFixed(1)} KB`:`${(kb/1024).toFixed(1)} MB`},"formatSize"),suggestionRows=analysis.detectedPatterns.map(pattern=>`
            <tr>
                <td>${pattern.name}</td>
                <td>${pattern.path}</td>
                <td>${formatSize(pattern.size)}</td>
                <td>${pattern.type}</td>
                <td>
                    <input type="checkbox" ${analysis.suggestedExclusions.includes(pattern.name)?"checked":""}>
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
                    <strong>Project Type:</strong> ${analysis.projectType}<br>
                    <strong>Detected Patterns:</strong> ${analysis.detectedPatterns.length}<br>
                    <strong>Suggested Exclusions:</strong> ${analysis.suggestedExclusions.length}
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
                        ${suggestionRows}
                    </tbody>
                </table>
            </body>
            </html>
        `}};__name(_SmartExclusionManager,"SmartExclusionManager");var SmartExclusionManager=_SmartExclusionManager;module2.exports={SmartExclusionManager}}});var require_batchProcessor=__commonJS({"src/batchProcessor.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),_BatchProcessor=class _BatchProcessor{constructor(){this._logger=getLogger(),this._processingQueue=[],this._isProcessing=!1,this._batchSize=50,this._processedCount=0,this._totalCount=0,this._statusBar=null,this._metrics={totalBatches:0,averageBatchTime:0,totalProcessingTime:0},this._logger.info("BatchProcessor initialized")}initialize(){let config=vscode2.workspace.getConfiguration("explorerDates");this._batchSize=config.get("batchSize",50),this._statusBar=vscode2.window.createStatusBarItem(vscode2.StatusBarAlignment.Left,-1e3),vscode2.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.batchSize")&&(this._batchSize=vscode2.workspace.getConfiguration("explorerDates").get("batchSize",50),this._logger.debug(`Batch size updated to: ${this._batchSize}`))})}queueForProcessing(uris,processor,options={}){let batch={id:Date.now()+Math.random(),uris:Array.isArray(uris)?uris:[uris],processor,priority:options.priority||"normal",background:options.background||!1,onProgress:options.onProgress,onComplete:options.onComplete};return batch.priority==="high"?this._processingQueue.unshift(batch):this._processingQueue.push(batch),this._logger.debug(`Queued batch ${batch.id} with ${batch.uris.length} URIs`),this._isProcessing||this._startProcessing(),batch.id}async _startProcessing(){if(this._isProcessing)return;this._isProcessing=!0,this._processedCount=0,this._totalCount=this._processingQueue.reduce((sum,batch)=>sum+batch.uris.length,0),this._logger.info(`Starting batch processing: ${this._totalCount} items in ${this._processingQueue.length} batches`),this._updateStatusBar();let startTime=Date.now();try{for(;this._processingQueue.length>0;){let batch=this._processingQueue.shift();await this._processBatch(batch),batch.background||await this._sleep(1)}}catch(error){this._logger.error("Batch processing failed",error)}finally{this._isProcessing=!1,this._hideStatusBar();let totalTime=Date.now()-startTime;this._updateMetrics(totalTime),this._logger.info(`Batch processing completed in ${totalTime}ms`)}}async _processBatch(batch){let batchStartTime=Date.now();this._logger.debug(`Processing batch ${batch.id} with ${batch.uris.length} URIs`);try{let chunks=this._chunkArray(batch.uris,this._batchSize);for(let i=0;i<chunks.length;i++){let chunk=chunks[i],chunkResults=[];for(let uri of chunk){try{let result=await batch.processor(uri);chunkResults.push({uri,result,success:!0}),this._processedCount++}catch(error){chunkResults.push({uri,error,success:!1}),this._processedCount++,this._logger.debug(`Failed to process ${uri.fsPath}`,error)}this._updateStatusBar(),batch.onProgress&&batch.onProgress({processed:this._processedCount,total:this._totalCount,current:uri})}await this._sleep(0),!batch.background&&i<chunks.length-1&&await this._sleep(5)}batch.onComplete&&batch.onComplete({processed:batch.uris.length,success:!0,duration:Date.now()-batchStartTime})}catch(error){this._logger.error(`Batch ${batch.id} processing failed`,error),batch.onComplete&&batch.onComplete({processed:0,success:!1,error,duration:Date.now()-batchStartTime})}this._metrics.totalBatches++}async processDirectoryProgressively(directoryUri,processor,options={}){let maxFiles=options.maxFiles||1e3;try{let pattern=new vscode2.RelativePattern(directoryUri,"**/*"),files=await vscode2.workspace.findFiles(pattern,null,maxFiles);if(files.length===0){this._logger.debug(`No files found in directory: ${directoryUri.fsPath}`);return}return this._logger.info(`Processing directory progressively: ${files.length} files in ${directoryUri.fsPath}`),this.queueForProcessing(files,processor,{priority:"normal",background:!0,...options})}catch(error){throw this._logger.error("Progressive directory processing failed",error),error}}async refreshInBackground(uris,processor,options={}){return this.queueForProcessing(uris,processor,{background:!0,priority:"low",...options})}async refreshVisible(uris,processor,options={}){return this.queueForProcessing(uris,processor,{background:!1,priority:"high",...options})}_chunkArray(array,chunkSize){let chunks=[];for(let i=0;i<array.length;i+=chunkSize)chunks.push(array.slice(i,i+chunkSize));return chunks}_sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}_updateStatusBar(){if(!this._statusBar)return;let percentage=this._totalCount>0?Math.round(this._processedCount/this._totalCount*100):0;this._statusBar.text=`$(sync~spin) Processing files... ${percentage}% (${this._processedCount}/${this._totalCount})`,this._statusBar.tooltip="Explorer Dates is processing file decorations",this._statusBar.show()}_hideStatusBar(){this._statusBar&&this._statusBar.hide()}_updateMetrics(totalTime){this._metrics.totalProcessingTime+=totalTime,this._metrics.totalBatches>0&&(this._metrics.averageBatchTime=this._metrics.totalProcessingTime/this._metrics.totalBatches)}getMetrics(){return{...this._metrics,isProcessing:this._isProcessing,queueLength:this._processingQueue.length,currentProgress:this._totalCount>0?this._processedCount/this._totalCount:0}}cancelAll(){this._processingQueue.length=0,this._hideStatusBar(),this._logger.info("All batch processing cancelled")}cancelBatch(batchId){let index=this._processingQueue.findIndex(batch=>batch.id===batchId);if(index!==-1){let cancelled=this._processingQueue.splice(index,1)[0];return this._logger.debug(`Cancelled batch ${batchId} with ${cancelled.uris.length} URIs`),!0}return!1}dispose(){this.cancelAll(),this._statusBar&&this._statusBar.dispose(),this._logger.info("BatchProcessor disposed",this.getMetrics())}};__name(_BatchProcessor,"BatchProcessor");var BatchProcessor=_BatchProcessor;module2.exports={BatchProcessor}}});var require_constants=__commonJS({"src/constants.js"(exports2,module2){var MONTH_ABBREVIATIONS=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],GLOBAL_STATE_KEYS={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"};module2.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS,GLOBAL_STATE_KEYS}}});var require_advancedCache=__commonJS({"src/advancedCache.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),{fileSystem:fileSystem2}=require_FileSystemAdapter(),{GLOBAL_STATE_KEYS,DEFAULT_PERSISTENT_CACHE_TTL}=require_constants(),_AdvancedCache=class _AdvancedCache{constructor(context){this._logger=getLogger(),this._context=context,this._memoryCache=new Map,this._cacheMetadata=new Map,this._maxMemoryUsage=50*1024*1024,this._currentMemoryUsage=0,this._persistentCacheEnabled=!0,this._storage=context?.globalState||null,this._storageKey=GLOBAL_STATE_KEYS.ADVANCED_CACHE,this._metadataKey=GLOBAL_STATE_KEYS.ADVANCED_CACHE_METADATA,this._fs=fileSystem2,this._metrics={memoryHits:0,memoryMisses:0,diskHits:0,diskMisses:0,evictions:0,persistentLoads:0,persistentSaves:0},this._cleanupInterval=null,this._saveInterval=null,this._logger.info("AdvancedCache initialized")}async initialize(){try{await this._loadConfiguration(),this._persistentCacheEnabled&&await this._loadPersistentCache(),this._startIntervals(),this._logger.info("Advanced cache system initialized",{persistentEnabled:this._persistentCacheEnabled&&!!this._storage,maxMemoryUsage:this._maxMemoryUsage,storage:this._storage?"globalState":"memory-only"})}catch(error){this._logger.error("Failed to initialize cache system",error)}}async _loadConfiguration(){let config=vscode2.workspace.getConfiguration("explorerDates");this._persistentCacheEnabled=config.get("persistentCache",!0),this._maxMemoryUsage=config.get("maxMemoryUsage",50)*1024*1024,vscode2.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.persistentCache")||e.affectsConfiguration("explorerDates.maxMemoryUsage"))&&this._loadConfiguration()})}async get(key){if(this._memoryCache.has(key)){let item=this._memoryCache.get(key),metadata=this._cacheMetadata.get(key);if(this._isValid(metadata))return this._metrics.memoryHits++,this._updateAccessTime(key),item;this._removeFromMemory(key)}if(this._metrics.memoryMisses++,this._persistentCacheEnabled){let persistentItem=await this._getFromPersistentCache(key);if(persistentItem)return this._addToMemory(key,persistentItem.data,persistentItem.metadata),this._metrics.diskHits++,persistentItem.data}return this._metrics.diskMisses++,null}async set(key,value,options={}){let metadata={timestamp:Date.now(),lastAccess:Date.now(),size:this._estimateSize(value),ttl:options.ttl||DEFAULT_PERSISTENT_CACHE_TTL,tags:options.tags||[],version:options.version||1};this._addToMemory(key,value,metadata),this._persistentCacheEnabled&&this._schedulePersistentSave()}_addToMemory(key,value,metadata){this._currentMemoryUsage+metadata.size>this._maxMemoryUsage&&this._evictOldestItems(metadata.size),this._memoryCache.has(key)&&this._removeFromMemory(key),this._memoryCache.set(key,value),this._cacheMetadata.set(key,metadata),this._currentMemoryUsage+=metadata.size,this._logger.debug(`Added to cache: ${key} (${metadata.size} bytes)`)}_removeFromMemory(key){if(this._memoryCache.has(key)){let metadata=this._cacheMetadata.get(key);this._memoryCache.delete(key),this._cacheMetadata.delete(key),metadata&&(this._currentMemoryUsage-=metadata.size)}}_evictOldestItems(requiredSpace){let entries=Array.from(this._cacheMetadata.entries());entries.sort((a,b)=>a[1].lastAccess-b[1].lastAccess);let freedSpace=0;for(let[key,metadata]of entries)if(this._removeFromMemory(key),freedSpace+=metadata.size,this._metrics.evictions++,freedSpace>=requiredSpace)break;this._logger.debug(`Evicted items to free ${freedSpace} bytes`)}_isValid(metadata){return metadata?Date.now()-metadata.timestamp<metadata.ttl:!1}_updateAccessTime(key){let metadata=this._cacheMetadata.get(key);metadata&&(metadata.lastAccess=Date.now())}_estimateSize(obj){switch(typeof obj){case"string":return obj.length*2;case"number":return 8;case"boolean":return 4;case"object":return obj===null?4:JSON.stringify(obj).length*2;default:return 100}}async _loadPersistentCache(){if(!this._storage){let env=this._fs.isWeb?"web":"desktop";this._logger.debug(`Persistent storage unavailable in ${env} environment - running in memory-only mode`);return}try{let cache=this._storage.get(this._storageKey,{}),loadedCount=0,skippedCount=0;for(let[key,item]of Object.entries(cache))item&&this._isValid(item.metadata)?(this._addToMemory(key,item.data,item.metadata),loadedCount++):skippedCount++;this._metrics.persistentLoads++,this._logger.info(`Loaded persistent cache: ${loadedCount} items (${skippedCount} expired)`)}catch(error){this._logger.error("Failed to load persistent cache from globalState",error)}}async _savePersistentCache(){if(!(!this._persistentCacheEnabled||!this._storage))try{let cache={};for(let[key,value]of this._memoryCache.entries()){let metadata=this._cacheMetadata.get(key);metadata&&this._isValid(metadata)&&(cache[key]={data:value,metadata})}await this._storage.update(this._storageKey,cache),this._metrics.persistentSaves++,this._logger.debug(`Saved persistent cache: ${Object.keys(cache).length} items`)}catch(error){this._logger.error("Failed to save persistent cache to globalState",error)}}async _getFromPersistentCache(key){if(!this._storage)return null;let item=this._storage.get(this._storageKey,{})[key];return item&&this._isValid(item.metadata)?item:null}_schedulePersistentSave(){this._storage&&(this._saveTimeout&&clearTimeout(this._saveTimeout),this._saveTimeout=setTimeout(()=>{this._savePersistentCache()},5e3))}_startIntervals(){this._cleanupInterval=setInterval(()=>{this._cleanupExpiredItems()},300*1e3),this._storage&&this._persistentCacheEnabled&&(this._saveInterval=setInterval(()=>{this._savePersistentCache()},600*1e3))}_cleanupExpiredItems(){let keysToRemove=[];for(let[key,metadata]of this._cacheMetadata.entries())this._isValid(metadata)||keysToRemove.push(key);for(let key of keysToRemove)this._removeFromMemory(key);keysToRemove.length>0&&this._logger.debug(`Cleaned up ${keysToRemove.length} expired cache items`)}invalidateByTags(tags){let keysToRemove=[];for(let[key,metadata]of this._cacheMetadata.entries())metadata.tags&&metadata.tags.some(tag=>tags.includes(tag))&&keysToRemove.push(key);for(let key of keysToRemove)this._removeFromMemory(key);this._logger.debug(`Invalidated ${keysToRemove.length} items by tags:`,tags)}invalidateByPattern(pattern){let keysToRemove=[],regex=new RegExp(pattern);for(let key of this._memoryCache.keys())regex.test(key)&&keysToRemove.push(key);for(let key of keysToRemove)this._removeFromMemory(key);this._logger.debug(`Invalidated ${keysToRemove.length} items by pattern: ${pattern}`)}clear(){this._memoryCache.clear(),this._cacheMetadata.clear(),this._currentMemoryUsage=0,this._logger.info("Cache cleared")}getStats(){let memoryHitRate=this._metrics.memoryHits+this._metrics.memoryMisses>0?(this._metrics.memoryHits/(this._metrics.memoryHits+this._metrics.memoryMisses)*100).toFixed(2):"0",diskHitRate=this._metrics.diskHits+this._metrics.diskMisses>0?(this._metrics.diskHits/(this._metrics.diskHits+this._metrics.diskMisses)*100).toFixed(2):"0";return{...this._metrics,memoryItems:this._memoryCache.size,memoryUsage:this._currentMemoryUsage,memoryUsagePercent:(this._currentMemoryUsage/this._maxMemoryUsage*100).toFixed(2),memoryHitRate:`${memoryHitRate}%`,diskHitRate:`${diskHitRate}%`,persistentEnabled:this._persistentCacheEnabled}}async dispose(){this._cleanupInterval&&clearInterval(this._cleanupInterval),this._saveInterval&&clearInterval(this._saveInterval),this._saveTimeout&&clearTimeout(this._saveTimeout),this._persistentCacheEnabled&&this._storage&&await this._savePersistentCache(),this.clear(),this._logger.info("Advanced cache disposed",this.getStats())}};__name(_AdvancedCache,"AdvancedCache");var AdvancedCache=_AdvancedCache;module2.exports={AdvancedCache}}});var require_themeIntegration=__commonJS({"src/themeIntegration.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),{getExtension}=require_pathUtils(),_ThemeIntegrationManager=class _ThemeIntegrationManager{constructor(){this._logger=getLogger(),this._currentThemeKind=vscode2.window.activeColorTheme.kind,this._themeChangeListeners=[],this._setupThemeChangeDetection(),this._logger.info("ThemeIntegrationManager initialized",{currentTheme:this._getThemeKindName(this._currentThemeKind)})}_setupThemeChangeDetection(){vscode2.window.onDidChangeActiveColorTheme(theme=>{let oldTheme=this._currentThemeKind;this._currentThemeKind=theme.kind,this._logger.debug("Theme changed",{from:this._getThemeKindName(oldTheme),to:this._getThemeKindName(theme.kind)}),this._themeChangeListeners.forEach(listener=>{try{listener(theme,oldTheme)}catch(error){this._logger.error("Theme change listener failed",error)}})})}_getThemeKindName(kind){switch(kind){case vscode2.ColorThemeKind.Light:return"Light";case vscode2.ColorThemeKind.Dark:return"Dark";case vscode2.ColorThemeKind.HighContrast:return"High Contrast";default:return"Unknown"}}onThemeChange(callback){return this._themeChangeListeners.push(callback),{dispose:__name(()=>{let index=this._themeChangeListeners.indexOf(callback);index!==-1&&this._themeChangeListeners.splice(index,1)},"dispose")}}getAdaptiveColors(){let isLight=this._currentThemeKind===vscode2.ColorThemeKind.Light;return this._currentThemeKind===vscode2.ColorThemeKind.HighContrast?this._getHighContrastColors():isLight?this._getLightThemeColors():this._getDarkThemeColors()}_getLightThemeColors(){return{veryRecent:new vscode2.ThemeColor("list.highlightForeground"),recent:new vscode2.ThemeColor("list.warningForeground"),old:new vscode2.ThemeColor("list.errorForeground"),javascript:new vscode2.ThemeColor("symbolIcon.functionForeground"),css:new vscode2.ThemeColor("symbolIcon.colorForeground"),html:new vscode2.ThemeColor("symbolIcon.snippetForeground"),json:new vscode2.ThemeColor("symbolIcon.stringForeground"),markdown:new vscode2.ThemeColor("symbolIcon.textForeground"),python:new vscode2.ThemeColor("symbolIcon.classForeground"),subtle:new vscode2.ThemeColor("list.inactiveSelectionForeground"),muted:new vscode2.ThemeColor("list.deemphasizedForeground"),emphasis:new vscode2.ThemeColor("list.highlightForeground")}}_getDarkThemeColors(){return{veryRecent:new vscode2.ThemeColor("list.highlightForeground"),recent:new vscode2.ThemeColor("charts.yellow"),old:new vscode2.ThemeColor("charts.red"),javascript:new vscode2.ThemeColor("symbolIcon.functionForeground"),css:new vscode2.ThemeColor("charts.purple"),html:new vscode2.ThemeColor("charts.orange"),json:new vscode2.ThemeColor("symbolIcon.stringForeground"),markdown:new vscode2.ThemeColor("charts.yellow"),python:new vscode2.ThemeColor("symbolIcon.classForeground"),subtle:new vscode2.ThemeColor("list.inactiveSelectionForeground"),muted:new vscode2.ThemeColor("list.deemphasizedForeground"),emphasis:new vscode2.ThemeColor("list.highlightForeground")}}_getHighContrastColors(){return{veryRecent:new vscode2.ThemeColor("list.highlightForeground"),recent:new vscode2.ThemeColor("list.warningForeground"),old:new vscode2.ThemeColor("list.errorForeground"),javascript:new vscode2.ThemeColor("list.highlightForeground"),css:new vscode2.ThemeColor("list.warningForeground"),html:new vscode2.ThemeColor("list.errorForeground"),json:new vscode2.ThemeColor("list.highlightForeground"),markdown:new vscode2.ThemeColor("list.warningForeground"),python:new vscode2.ThemeColor("list.errorForeground"),subtle:new vscode2.ThemeColor("list.highlightForeground"),muted:new vscode2.ThemeColor("list.inactiveSelectionForeground"),emphasis:new vscode2.ThemeColor("list.focusHighlightForeground")}}getColorForContext(context,intensity="normal"){let colors=this.getAdaptiveColors();switch(context){case"success":case"recent":return intensity==="subtle"?colors.subtle:colors.veryRecent;case"warning":case"medium":return intensity==="subtle"?colors.muted:colors.recent;case"error":case"old":return intensity==="subtle"?colors.emphasis:colors.old;case"javascript":case"typescript":return colors.javascript;case"css":case"scss":case"less":return colors.css;case"html":case"xml":return colors.html;case"json":case"yaml":return colors.json;case"markdown":case"text":return colors.markdown;case"python":return colors.python;default:return intensity==="subtle"?colors.muted:colors.subtle}}applyThemeAwareColorScheme(colorScheme,filePath="",fileAge=0){if(colorScheme==="none")return;if(colorScheme==="adaptive")return this._getAdaptiveColorForFile(filePath,fileAge);let colors=this.getAdaptiveColors();switch(colorScheme){case"recency":return fileAge<36e5?colors.veryRecent:fileAge<864e5?colors.recent:colors.old;case"file-type":return this._getFileTypeColor(filePath);case"subtle":return fileAge<36e5?colors.subtle:fileAge<6048e5?colors.muted:colors.emphasis;case"vibrant":return this._getVibrantSelectionAwareColor(fileAge);default:return}}_getVibrantSelectionAwareColor(fileAge){return fileAge<36e5?new vscode2.ThemeColor("list.highlightForeground"):fileAge<864e5?new vscode2.ThemeColor("list.warningForeground"):new vscode2.ThemeColor("list.errorForeground")}_getAdaptiveColorForFile(filePath,fileAge){let typeColor=this._getFileTypeColor(filePath);if(typeColor)return typeColor;let colors=this.getAdaptiveColors();return fileAge<36e5?colors.veryRecent:fileAge<864e5?colors.recent:colors.old}_getFileTypeColor(filePath){let ext=getExtension(filePath),colors=this.getAdaptiveColors();return[".js",".ts",".jsx",".tsx",".mjs"].includes(ext)?colors.javascript:[".css",".scss",".sass",".less",".stylus"].includes(ext)?colors.css:[".html",".htm",".xml",".svg"].includes(ext)?colors.html:[".json",".yaml",".yml",".toml"].includes(ext)?colors.json:[".md",".markdown",".txt",".rst"].includes(ext)?colors.markdown:[".py",".pyx",".pyi"].includes(ext)?colors.python:null}getSuggestedColorScheme(){switch(this._currentThemeKind){case vscode2.ColorThemeKind.Light:return"vibrant";case vscode2.ColorThemeKind.Dark:return"recency";case vscode2.ColorThemeKind.HighContrast:return"none";default:return"recency"}}getIconThemeIntegration(){return{iconTheme:vscode2.workspace.getConfiguration("workbench").get("iconTheme"),suggestions:{"vs-seti":{recommendedColorScheme:"file-type",description:"File-type colors complement Seti icons perfectly"},"material-icon-theme":{recommendedColorScheme:"subtle",description:"Subtle colors work well with Material icons"},"vscode-icons":{recommendedColorScheme:"recency",description:"Recency-based colors pair nicely with VS Code icons"}}}}async autoConfigureForTheme(){try{let config=vscode2.workspace.getConfiguration("explorerDates"),currentColorScheme=config.get("colorScheme","none");if(currentColorScheme==="none"||currentColorScheme==="auto"){let suggestedScheme=this.getSuggestedColorScheme();await config.update("colorScheme",suggestedScheme,vscode2.ConfigurationTarget.Global),this._logger.info(`Auto-configured color scheme for ${this._getThemeKindName(this._currentThemeKind)} theme: ${suggestedScheme}`),await vscode2.window.showInformationMessage(`Explorer Dates adapted to your ${this._getThemeKindName(this._currentThemeKind)} theme`,"Customize","OK")==="Customize"&&await vscode2.commands.executeCommand("workbench.action.openSettings","explorerDates.colorScheme")}}catch(error){this._logger.error("Failed to auto-configure for theme",error)}}getCurrentThemeInfo(){return{kind:this._currentThemeKind,kindName:this._getThemeKindName(this._currentThemeKind),isLight:this._currentThemeKind===vscode2.ColorThemeKind.Light,isDark:this._currentThemeKind===vscode2.ColorThemeKind.Dark,isHighContrast:this._currentThemeKind===vscode2.ColorThemeKind.HighContrast,suggestedColorScheme:this.getSuggestedColorScheme(),adaptiveColors:this.getAdaptiveColors()}}dispose(){this._themeChangeListeners.length=0,this._logger.info("ThemeIntegrationManager disposed")}};__name(_ThemeIntegrationManager,"ThemeIntegrationManager");var ThemeIntegrationManager=_ThemeIntegrationManager;module2.exports={ThemeIntegrationManager}}});var require_accessibility=__commonJS({"src/accessibility.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),{getLocalization}=require_localization(),{getFileName:getFileName2}=require_pathUtils(),_AccessibilityManager=class _AccessibilityManager{constructor(){this._logger=getLogger(),this._l10n=getLocalization(),this._isAccessibilityMode=!1,this._keyboardNavigationEnabled=!0,this._focusIndicators=new Map,this._loadConfiguration(),this._setupConfigurationListener(),this._logger.info("AccessibilityManager initialized",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled})}_loadConfiguration(){let config=vscode2.workspace.getConfiguration("explorerDates");this._isAccessibilityMode=config.get("accessibilityMode",!1),!config.has("accessibilityMode")&&this._detectScreenReader()&&this._logger.info("Screen reader detected - consider enabling accessibility mode in settings"),this._keyboardNavigationEnabled=config.get("keyboardNavigation",!0)}_setupConfigurationListener(){vscode2.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.accessibilityMode")||e.affectsConfiguration("explorerDates.keyboardNavigation"))&&(this._loadConfiguration(),this._logger.debug("Accessibility configuration updated",{accessibilityMode:this._isAccessibilityMode,keyboardNavigation:this._keyboardNavigationEnabled}))})}getAccessibleTooltip(filePath,mtime,ctime,fileSize,gitInfo=null){if(!this._isAccessibilityMode)return null;let fileName=getFileName2(filePath),readableModified=this._formatAccessibleDate(mtime),readableCreated=this._formatAccessibleDate(ctime),tooltip=`File: ${fileName}. `;return tooltip+=`Last modified: ${readableModified}. `,tooltip+=`Created: ${readableCreated}. `,fileSize!==void 0&&(tooltip+=`Size: ${this._formatAccessibleFileSize(fileSize)}. `),gitInfo&&gitInfo.authorName&&(tooltip+=`Last modified by: ${gitInfo.authorName}. `),tooltip+=`Full path: ${filePath}`,tooltip}_formatAccessibleDate(date){let diffMs=new Date().getTime()-date.getTime(),diffMins=Math.floor(diffMs/(1e3*60)),diffHours=Math.floor(diffMs/(1e3*60*60)),diffDays=Math.floor(diffMs/(1e3*60*60*24));return diffMins<1?"just now":diffMins<60?`${diffMins} ${diffMins===1?"minute":"minutes"} ago`:diffHours<24?`${diffHours} ${diffHours===1?"hour":"hours"} ago`:diffDays<7?`${diffDays} ${diffDays===1?"day":"days"} ago`:date.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}_formatAccessibleFileSize(bytes){if(bytes<1024)return`${bytes} bytes`;let kb=bytes/1024;if(kb<1024)return`${Math.round(kb)} kilobytes`;let mb=kb/1024;return`${Math.round(mb*10)/10} megabytes`}getAccessibleBadge(originalBadge){if(!this._isAccessibilityMode)return originalBadge;let parts=originalBadge.split("|"),timePart=parts[0],sizePart=parts[1],gitPart=parts.length>2?parts[2]:null,accessibleBadge=this._expandTimeAbbreviation(timePart);return sizePart&&(accessibleBadge+=` ${this._expandSizeAbbreviation(sizePart)}`),gitPart&&(accessibleBadge+=` by ${gitPart.replace("\u2022","")}`),accessibleBadge}_expandTimeAbbreviation(timePart){let expansions={m:" minutes ago",h:" hours ago",d:" days ago",w:" weeks ago",mo:" months ago",yr:" years ago",min:" minutes ago",hrs:" hours ago",day:" days ago",wk:" weeks ago"},expanded=timePart;for(let[abbrev,full]of Object.entries(expansions))if(timePart.endsWith(abbrev)){expanded=timePart.slice(0,-abbrev.length)+full;break}return expanded}_expandSizeAbbreviation(sizePart){if(!sizePart.startsWith("~"))return sizePart;let sizeValue=sizePart.slice(1);return sizeValue.endsWith("B")?sizeValue.slice(0,-1)+" bytes":sizeValue.endsWith("K")?sizeValue.slice(0,-1)+" kilobytes":sizeValue.endsWith("M")?sizeValue.slice(0,-1)+" megabytes":sizeValue}createFocusIndicator(element,description){if(!this._keyboardNavigationEnabled)return null;let focusId=Math.random().toString(36).substr(2,9);return this._focusIndicators.set(focusId,{element,description,timestamp:Date.now()}),{id:focusId,dispose:__name(()=>{this._focusIndicators.delete(focusId)},"dispose")}}announceToScreenReader(message,priority="polite"){this._isAccessibilityMode&&(priority==="assertive"?vscode2.window.showWarningMessage(message):this._logger.debug("Screen reader announcement",{message,priority}))}getKeyboardShortcutHelp(){return[{key:"Ctrl+Shift+D (Cmd+Shift+D)",command:"Toggle date decorations",description:"Show or hide file modification times in Explorer"},{key:"Ctrl+Shift+C (Cmd+Shift+C)",command:"Copy file date",description:"Copy selected file's modification date to clipboard"},{key:"Ctrl+Shift+I (Cmd+Shift+I)",command:"Show file details",description:"Display detailed information about selected file"},{key:"Ctrl+Shift+R (Cmd+Shift+R)",command:"Refresh decorations",description:"Refresh all file modification time decorations"},{key:"Ctrl+Shift+A (Cmd+Shift+A)",command:"Show workspace activity",description:"Open workspace file activity analysis"},{key:"Ctrl+Shift+F (Cmd+Shift+F)",command:"Toggle fade old files",description:"Toggle fading effect for old files"}]}async showKeyboardShortcutsHelp(){let shortcuts=this.getKeyboardShortcutHelp();await vscode2.window.showInformationMessage("Keyboard shortcuts help available in output panel","Show Shortcuts").then(action=>{if(action==="Show Shortcuts"){let outputChannel=vscode2.window.createOutputChannel("Explorer Dates Shortcuts");outputChannel.appendLine("Explorer Dates Keyboard Shortcuts"),outputChannel.appendLine("====================================="),outputChannel.appendLine(""),shortcuts.forEach(shortcut=>{outputChannel.appendLine(`${shortcut.key}`),outputChannel.appendLine(`  Command: ${shortcut.command}`),outputChannel.appendLine(`  Description: ${shortcut.description}`),outputChannel.appendLine("")}),outputChannel.show()}})}shouldEnhanceAccessibility(){return this._isAccessibilityMode||this._detectScreenReader()}_detectScreenReader(){return vscode2.workspace.getConfiguration("editor").get("accessibilitySupport")==="on"}getAccessibilityRecommendations(){let recommendations=[];return this._detectScreenReader()&&(recommendations.push({type:"setting",setting:"explorerDates.accessibilityMode",value:!0,reason:"Enable enhanced tooltips and screen reader optimizations"}),recommendations.push({type:"setting",setting:"explorerDates.colorScheme",value:"none",reason:"Colors may not be useful with screen readers"}),recommendations.push({type:"setting",setting:"explorerDates.dateDecorationFormat",value:"relative-long",reason:"Longer format is more descriptive for screen readers"})),vscode2.window.activeColorTheme.kind===vscode2.ColorThemeKind.HighContrast&&recommendations.push({type:"setting",setting:"explorerDates.highContrastMode",value:!0,reason:"Optimize for high contrast themes"}),recommendations}async applyAccessibilityRecommendations(){let recommendations=this.getAccessibilityRecommendations();if(recommendations.length===0){vscode2.window.showInformationMessage("No accessibility recommendations at this time.");return}let config=vscode2.workspace.getConfiguration("explorerDates"),appliedCount=0;for(let rec of recommendations)if(rec.type==="setting")try{await config.update(rec.setting.replace("explorerDates.",""),rec.value,vscode2.ConfigurationTarget.Global),appliedCount++,this._logger.info(`Applied accessibility recommendation: ${rec.setting} = ${rec.value}`)}catch(error){this._logger.error(`Failed to apply recommendation: ${rec.setting}`,error)}appliedCount>0&&vscode2.window.showInformationMessage(`Applied ${appliedCount} accessibility recommendations. Restart may be required for all changes to take effect.`)}dispose(){this._focusIndicators.clear(),this._logger.info("AccessibilityManager disposed")}};__name(_AccessibilityManager,"AccessibilityManager");var AccessibilityManager=_AccessibilityManager;module2.exports={AccessibilityManager}}});var require_formatters=__commonJS({"src/utils/formatters.js"(exports2,module2){var{MAX_BADGE_LENGTH}=require_constants();function formatFileSize(bytes=0,format="auto"){let safeBytes=typeof bytes=="number"&&!Number.isNaN(bytes)?bytes:0;if(format==="bytes")return`~${safeBytes}B`;let kb=safeBytes/1024;if(format==="kb")return`~${kb.toFixed(1)}K`;let mb=kb/1024;return format==="mb"?`~${mb.toFixed(1)}M`:safeBytes<1024?`~${safeBytes}B`:kb<1024?`~${Math.round(kb)}K`:`~${mb.toFixed(1)}M`}__name(formatFileSize,"formatFileSize");function trimBadge(badge){if(badge)return badge.length>MAX_BADGE_LENGTH?badge.substring(0,MAX_BADGE_LENGTH):badge}__name(trimBadge,"trimBadge");module2.exports={formatFileSize,trimBadge}}});var require_fileDateDecorationProvider=__commonJS({"src/fileDateDecorationProvider.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),{getLocalization}=require_localization(),{fileSystem:fileSystem2}=require_FileSystemAdapter(),{SmartExclusionManager}=require_smartExclusion(),{BatchProcessor}=require_batchProcessor(),{AdvancedCache}=require_advancedCache(),{ThemeIntegrationManager}=require_themeIntegration(),{AccessibilityManager}=require_accessibility(),{formatFileSize,trimBadge}=require_formatters(),{getFileName:getFileName2,getExtension,getCacheKey:buildCacheKey,normalizePath,getRelativePath:getRelativePath2,getUriPath}=require_pathUtils(),{DEFAULT_CACHE_TIMEOUT,DEFAULT_MAX_CACHE_SIZE,MONTH_ABBREVIATIONS,GLOBAL_STATE_KEYS}=require_constants(),{isWebEnvironment}=require_env(),describeFile=__name((input="")=>{let pathValue=typeof input=="string"?input:getUriPath(input),normalized=normalizePath(pathValue);return getFileName2(normalized)||normalized||"unknown"},"describeFile"),isWebBuild=!0,execAsync=null;if(!isWebBuild)try{let{exec}=require("child_process"),{promisify}=require("util");execAsync=promisify(exec)}catch{execAsync=null}var _FileDateDecorationProvider=class _FileDateDecorationProvider{constructor(){this._onDidChangeFileDecorations=new vscode2.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event,this._decorationCache=new Map,this._cacheTimeout=DEFAULT_CACHE_TIMEOUT,this._maxCacheSize=DEFAULT_MAX_CACHE_SIZE,this._fileSystem=fileSystem2,this._isWeb=isWebBuild||isWebEnvironment(),this._gitAvailable=!this._isWeb&&!!execAsync,this._gitWarningShown=!1,this._cacheKeyStats=new Map,this._logger=getLogger(),this._l10n=getLocalization(),this._smartExclusion=new SmartExclusionManager,this._batchProcessor=new BatchProcessor,this._progressiveLoadingJobs=new Set,this._progressiveLoadingEnabled=!1,this._advancedCache=null,this._themeIntegration=new ThemeIntegrationManager,this._accessibility=new AccessibilityManager,this._metrics={totalDecorations:0,cacheHits:0,cacheMisses:0,errors:0},this._previewSettings=null,this._extensionContext=null,this._refreshTimer=null,this._refreshInterval=6e4,this._setupFileWatcher(),this._setupConfigurationWatcher(),this._setupPeriodicRefresh(),this._logger.info("FileDateDecorationProvider initialized"),this._previewSettings=null}applyPreviewSettings(settings){let wasInPreviewMode=!!this._previewSettings;settings&&typeof settings=="object"?(this._previewSettings=Object.assign({},settings),this._logger.info("\u{1F504} Applied preview settings",this._previewSettings)):(this._previewSettings=null,this._logger.info("\u{1F504} Cleared preview settings"));let memorySize=this._decorationCache.size;if(this._decorationCache.clear(),this._logger.info(`\u{1F5D1}\uFE0F Cleared memory cache (${memorySize} items) for preview mode change`),this._advancedCache)try{typeof this._advancedCache.clear=="function"?(this._advancedCache.clear(),this._logger.info("\u{1F5D1}\uFE0F Cleared advanced cache for preview mode change")):this._logger.warn("\u26A0\uFE0F Advanced cache does not support clear operation")}catch(error){this._logger.warn("\u26A0\uFE0F Failed to clear advanced cache:",error.message)}this._previewSettings&&!wasInPreviewMode?this._logger.info("\u{1F3AD} Entered preview mode - caching disabled"):!this._previewSettings&&wasInPreviewMode&&this._logger.info("\u{1F3AD} Exited preview mode - caching re-enabled"),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Fired decoration refresh event for preview change")}async testDecorationProvider(){this._logger.info("\u{1F9EA} Testing decoration provider functionality...");let workspaceFolders=vscode2.workspace.workspaceFolders;if(!workspaceFolders||workspaceFolders.length===0){this._logger.error("\u274C No workspace folders available for testing");return}let testFile=vscode2.Uri.joinPath(workspaceFolders[0].uri,"package.json");try{let decoration=await this.provideFileDecoration(testFile);this._logger.info("\u{1F9EA} Test decoration result:",{file:"package.json",success:!!decoration,badge:decoration?.badge,hasTooltip:!!decoration?.tooltip,hasColor:!!decoration?.color}),this._onDidChangeFileDecorations.fire(testFile),this._logger.info("\u{1F504} Fired decoration change event for test file")}catch(error){this._logger.error("\u274C Test decoration failed:",error)}}forceRefreshAllDecorations(){this._logger.info("\u{1F504} Force refreshing ALL decorations..."),this._decorationCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("\u{1F504} Triggered global decoration refresh")}startProviderCallMonitoring(){this._providerCallCount=0,this._providerCallFiles=new Set;let originalProvide=this.provideFileDecoration.bind(this);this.provideFileDecoration=async(uri,token)=>{this._providerCallCount++;let trackedPath=getUriPath(uri)||uri?.toString(!0)||"unknown";return this._providerCallFiles.add(normalizePath(trackedPath)),this._logger.info(`\u{1F50D} Provider called ${this._providerCallCount} times for: ${describeFile(uri||trackedPath)}`),await originalProvide(uri,token)},this._logger.info("\u{1F4CA} Started provider call monitoring")}getProviderCallStats(){return{totalCalls:this._providerCallCount||0,uniqueFiles:this._providerCallFiles?this._providerCallFiles.size:0,calledFiles:this._providerCallFiles?Array.from(this._providerCallFiles):[]}}_setupFileWatcher(){let watcher=vscode2.workspace.createFileSystemWatcher("**/*");watcher.onDidChange(uri=>this.refreshDecoration(uri)),watcher.onDidCreate(uri=>this.refreshDecoration(uri)),watcher.onDidDelete(uri=>this.clearDecoration(uri)),this._fileWatcher=watcher}_setupPeriodicRefresh(){let config=vscode2.workspace.getConfiguration("explorerDates");if(this._refreshInterval=config.get("badgeRefreshInterval",6e4),this._logger.info(`Setting up periodic refresh with interval: ${this._refreshInterval}ms`),this._refreshTimer&&(clearInterval(this._refreshTimer),this._refreshTimer=null),!config.get("showDateDecorations",!0)){this._logger.info("Decorations disabled, skipping periodic refresh setup");return}this._refreshTimer=setInterval(()=>{this._logger.debug("Periodic refresh triggered - clearing caches and refreshing decorations");let memoryCacheSize=this._decorationCache.size;if(this._decorationCache.clear(),this._advancedCache)try{this._advancedCache.clear()}catch(error){this._logger.debug(`Failed to clear advanced cache during periodic refresh: ${error.message}`)}this._onDidChangeFileDecorations.fire(void 0),this._logger.debug(`Periodic refresh completed - cleared ${memoryCacheSize} cached items from memory`)},this._refreshInterval),this._logger.info("Periodic refresh timer started")}_setupConfigurationWatcher(){vscode2.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration("explorerDates")){this._logger.debug("Configuration changed, updating settings");let config=vscode2.workspace.getConfiguration("explorerDates");this._cacheTimeout=config.get("cacheTimeout",3e4),this._maxCacheSize=config.get("maxCacheSize",1e4),e.affectsConfiguration("explorerDates.badgeRefreshInterval")&&(this._refreshInterval=config.get("badgeRefreshInterval",6e4),this._logger.info(`Badge refresh interval updated to: ${this._refreshInterval}ms`),this._setupPeriodicRefresh()),(e.affectsConfiguration("explorerDates.showDateDecorations")||e.affectsConfiguration("explorerDates.dateDecorationFormat")||e.affectsConfiguration("explorerDates.excludedFolders")||e.affectsConfiguration("explorerDates.excludedPatterns")||e.affectsConfiguration("explorerDates.highContrastMode")||e.affectsConfiguration("explorerDates.fadeOldFiles")||e.affectsConfiguration("explorerDates.fadeThreshold")||e.affectsConfiguration("explorerDates.colorScheme")||e.affectsConfiguration("explorerDates.showGitInfo")||e.affectsConfiguration("explorerDates.customColors")||e.affectsConfiguration("explorerDates.showFileSize")||e.affectsConfiguration("explorerDates.fileSizeFormat"))&&this.refreshAll(),e.affectsConfiguration("explorerDates.progressiveLoading")&&this._applyProgressiveLoadingSetting().catch(error=>{this._logger.error("Failed to reconfigure progressive loading",error)}),e.affectsConfiguration("explorerDates.showDateDecorations")&&this._setupPeriodicRefresh()}})}async _applyProgressiveLoadingSetting(){if(!this._batchProcessor)return;let enabled=vscode2.workspace.getConfiguration("explorerDates").get("progressiveLoading",!0);if(this._progressiveLoadingEnabled=enabled,!enabled){this._logger.info("Progressive loading disabled via explorerDates.progressiveLoading"),this._cancelProgressiveWarmupJobs();return}let workspaceFolders=vscode2.workspace.workspaceFolders;!workspaceFolders||workspaceFolders.length===0||(this._cancelProgressiveWarmupJobs(),workspaceFolders.forEach(folder=>{let jobId=this._batchProcessor.processDirectoryProgressively(folder.uri,async uri=>{try{await this.provideFileDecoration(uri)}catch(error){this._logger.debug("Progressive warmup processor failed",error)}},{background:!0,priority:"low",maxFiles:500});jobId&&this._progressiveLoadingJobs.add(jobId)}),this._logger.info(`Progressive loading queued for ${workspaceFolders.length} workspace folder(s).`))}_cancelProgressiveWarmupJobs(){if(!(!this._progressiveLoadingJobs||this._progressiveLoadingJobs.size===0)){if(this._batchProcessor)for(let jobId of this._progressiveLoadingJobs)this._batchProcessor.cancelBatch(jobId);this._progressiveLoadingJobs.clear()}}refreshDecoration(uri){let cacheKey=this._getCacheKey(uri);if(this._decorationCache.delete(cacheKey),this._advancedCache)try{this._advancedCache.invalidateByPattern(cacheKey.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))}catch(error){this._logger.debug(`Could not invalidate advanced cache for ${describeFile(uri)}: ${error.message}`)}this._onDidChangeFileDecorations.fire(uri),this._logger.debug(`\u{1F504} Refreshed decoration cache for: ${describeFile(uri)}`)}clearDecoration(uri){let cacheKey=this._getCacheKey(uri);this._decorationCache.delete(cacheKey),this._advancedCache&&this._logger.debug(`Advanced cache entry will expire naturally: ${describeFile(uri)}`),this._onDidChangeFileDecorations.fire(uri),this._logger.debug(`\u{1F5D1}\uFE0F Cleared decoration cache for: ${describeFile(uri)}`)}clearAllCaches(){let memorySize=this._decorationCache.size;this._decorationCache.clear(),this._logger.info(`Cleared memory cache (was ${memorySize} items)`),this._advancedCache&&(this._advancedCache.clear(),this._logger.info("Cleared advanced cache")),this._metrics.cacheHits=0,this._metrics.cacheMisses=0,this._logger.info("All caches cleared successfully")}refreshAll(){this._decorationCache.clear(),this._advancedCache&&this._advancedCache.clear(),this._onDidChangeFileDecorations.fire(void 0),this._logger.info("All decorations refreshed with cache clear")}async _isExcludedSimple(uri){let config=vscode2.workspace.getConfiguration("explorerDates"),filePath=getUriPath(uri);if(!filePath)return!1;let normalizedPath=normalizePath(filePath),fileName=getFileName2(normalizedPath),fileExt=getExtension(filePath),forceShowTypes=config.get("forceShowForFileTypes",[]);if(forceShowTypes.length>0&&forceShowTypes.includes(fileExt))return this._logger.debug(`File type ${fileExt} is forced to show: ${filePath}`),!1;let troubleshootingMode=config.get("enableTroubleShootingMode",!1);troubleshootingMode&&this._logger.info(`\u{1F50D} Checking exclusion for: ${fileName} (ext: ${fileExt})`);let excludedFolders=config.get("excludedFolders",["node_modules",".git","dist","build","out",".vscode-test"]),excludedPatterns=config.get("excludedPatterns",["**/*.tmp","**/*.log","**/.git/**","**/node_modules/**"]);for(let folder of excludedFolders){let normalizedFolder=folder.replace(/^\/+|\/+$/g,"");if(normalizedPath.includes(`/${normalizedFolder}/`)||normalizedPath.endsWith(`/${normalizedFolder}`))return troubleshootingMode?this._logger.info(`\u274C File excluded by folder: ${filePath} (${folder})`):this._logger.debug(`File excluded by folder: ${filePath} (${folder})`),!0}for(let pattern of excludedPatterns)if(pattern.includes("node_modules")&&normalizedPath.includes("/node_modules/")||pattern.includes(".git/**")&&normalizedPath.includes("/.git/")||pattern.includes("*.tmp")&&fileName.endsWith(".tmp")||pattern.includes("*.log")&&fileName.endsWith(".log"))return!0;return troubleshootingMode&&this._logger.info(`\u2705 File NOT excluded: ${fileName} (ext: ${fileExt})`),!1}async _isExcluded(uri){let config=vscode2.workspace.getConfiguration("explorerDates"),filePath=getUriPath(uri);if(!filePath)return!1;let normalizedPath=normalizePath(filePath),fileName=getFileName2(normalizedPath),workspaceFolder=vscode2.workspace.getWorkspaceFolder(uri);if(workspaceFolder){let combined=await this._smartExclusion.getCombinedExclusions(workspaceFolder.uri);for(let folder of combined.folders)if(new RegExp(`(^|/)${folder.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(normalizedPath))return this._logger.debug(`File excluded by folder rule: ${filePath} (folder: ${folder})`),!0;for(let pattern of combined.patterns){let regexPattern=pattern.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),regex=new RegExp(regexPattern);if(regex.test(normalizedPath)||regex.test(fileName))return this._logger.debug(`File excluded by pattern: ${filePath} (pattern: ${pattern})`),!0}}else{let excludedFolders=config.get("excludedFolders",[]),excludedPatterns=config.get("excludedPatterns",[]);for(let folder of excludedFolders)if(new RegExp(`(^|/)${folder.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(/|$)`).test(normalizedPath))return!0;for(let pattern of excludedPatterns){let regexPattern=pattern.replace(/\*\*/g,".*").replace(/\*/g,"[^/\\\\]*").replace(/\?/g,"."),regex=new RegExp(regexPattern);if(regex.test(normalizedPath)||regex.test(fileName))return!0}}return!1}_manageCacheSize(){if(this._decorationCache.size>this._maxCacheSize){this._logger.debug(`Cache size (${this._decorationCache.size}) exceeds max (${this._maxCacheSize}), cleaning old entries`);let entriesToRemove=Math.floor(this._maxCacheSize*.2),entries=Array.from(this._decorationCache.entries());entries.sort((a,b)=>a[1].timestamp-b[1].timestamp);for(let i=0;i<entriesToRemove&&i<entries.length;i++)this._decorationCache.delete(entries[i][0]);this._logger.debug(`Removed ${entriesToRemove} old cache entries`)}}async _getCachedDecoration(cacheKey,fileLabel){if(this._advancedCache)try{let cached=await this._advancedCache.get(cacheKey);if(cached)return this._metrics.cacheHits++,this._logger.debug(`\u{1F9E0} Advanced cache hit for: ${fileLabel}`),cached}catch(error){this._logger.debug(`Advanced cache error: ${error.message}`)}let memoryEntry=this._decorationCache.get(cacheKey);return memoryEntry&&Date.now()-memoryEntry.timestamp<this._cacheTimeout?(this._metrics.cacheHits++,this._logger.debug(`\u{1F4BE} Memory cache hit for: ${fileLabel}`),memoryEntry.decoration):null}async _storeDecorationInCache(cacheKey,decoration,fileLabel){if(this._manageCacheSize(),this._decorationCache.set(cacheKey,{decoration,timestamp:Date.now()}),this._advancedCache)try{await this._advancedCache.set(cacheKey,decoration,{ttl:this._cacheTimeout}),this._logger.debug(`\u{1F9E0} Stored in advanced cache: ${fileLabel}`)}catch(error){this._logger.debug(`Failed to store in advanced cache: ${error.message}`)}}_formatDateBadge(date,formatType,precalcDiffMs=null){let diffMs=precalcDiffMs!==null?precalcDiffMs:new Date().getTime()-date.getTime(),diffMinutes=Math.floor(diffMs/(1e3*60)),diffHours=Math.floor(diffMs/(1e3*60*60)),diffDays=Math.floor(diffMs/(1e3*60*60*24)),diffWeeks=Math.floor(diffDays/7),diffMonths=Math.floor(diffDays/30);switch(formatType){case"relative-short":case"relative-long":return diffMinutes<1?"\u25CF\u25CF":diffMinutes<60?`${Math.min(diffMinutes,99)}m`:diffHours<24?`${Math.min(diffHours,23)}h`:diffDays<7?`${diffDays}d`:diffWeeks<4?`${diffWeeks}w`:diffMonths<12?`${diffMonths}M`:"1y";case"absolute-short":case"absolute-long":{let day=date.getDate();return`${MONTH_ABBREVIATIONS[date.getMonth()]}${day<10?"0"+day:day}`}case"technical":return diffMinutes<60?`${diffMinutes}m`:diffHours<24?`${diffHours}h`:`${diffDays}d`;case"minimal":return diffHours<1?"\u2022\u2022":diffHours<24?"\u25CB\u25CB":"\u2500\u2500";default:return diffMinutes<60?`${diffMinutes}m`:diffHours<24?`${diffHours}h`:`${diffDays}d`}}_formatFileSize(bytes,format="auto"){return formatFileSize(bytes,format)}_getColorByScheme(date,colorScheme,filePath=""){if(colorScheme==="none")return;let diffMs=new Date().getTime()-date.getTime(),diffHours=Math.floor(diffMs/(1e3*60*60)),diffDays=Math.floor(diffMs/(1e3*60*60*24));switch(colorScheme){case"recency":return diffHours<1?new vscode2.ThemeColor("charts.green"):diffHours<24?new vscode2.ThemeColor("charts.yellow"):new vscode2.ThemeColor("charts.red");case"file-type":{let ext=getExtension(filePath);return[".js",".ts",".jsx",".tsx"].includes(ext)?new vscode2.ThemeColor("charts.blue"):[".css",".scss",".less"].includes(ext)?new vscode2.ThemeColor("charts.purple"):[".html",".htm",".xml"].includes(ext)?new vscode2.ThemeColor("charts.orange"):[".json",".yaml",".yml"].includes(ext)?new vscode2.ThemeColor("charts.green"):[".md",".txt",".log"].includes(ext)?new vscode2.ThemeColor("charts.yellow"):[".py",".rb",".php"].includes(ext)?new vscode2.ThemeColor("charts.red"):new vscode2.ThemeColor("editorForeground")}case"subtle":return diffHours<1?new vscode2.ThemeColor("editorInfo.foreground"):diffDays<7?new vscode2.ThemeColor("editorWarning.foreground"):new vscode2.ThemeColor("editorError.foreground");case"vibrant":return diffHours<1?new vscode2.ThemeColor("terminal.ansiGreen"):diffHours<24?new vscode2.ThemeColor("terminal.ansiYellow"):diffDays<7?new vscode2.ThemeColor("terminal.ansiMagenta"):new vscode2.ThemeColor("terminal.ansiRed");case"custom":{let customColors=vscode2.workspace.getConfiguration("explorerDates").get("customColors",{veryRecent:"#00ff00",recent:"#ffff00",old:"#ff0000"});return diffHours<1?customColors.veryRecent.toLowerCase().includes("green")||customColors.veryRecent==="#00ff00"?new vscode2.ThemeColor("terminal.ansiGreen"):new vscode2.ThemeColor("editorInfo.foreground"):diffHours<24?customColors.recent.toLowerCase().includes("yellow")||customColors.recent==="#ffff00"?new vscode2.ThemeColor("terminal.ansiYellow"):new vscode2.ThemeColor("editorWarning.foreground"):customColors.old.toLowerCase().includes("red")||customColors.old==="#ff0000"?new vscode2.ThemeColor("terminal.ansiRed"):new vscode2.ThemeColor("editorError.foreground")}default:return}}_generateBadgeDetails({filePath,stat,diffMs,dateFormat,badgePriority,showFileSize,fileSizeFormat,gitBlame,showGitInfo}){let badge=this._formatDateBadge(stat.mtime,dateFormat,diffMs),readableModified=this._formatDateReadable(stat.mtime),readableCreated=this._formatDateReadable(stat.birthtime),displayBadge=badge;if(this._logger.debug(`\u{1F3F7}\uFE0F Badge generation for ${describeFile(filePath)}: badgePriority=${badgePriority}, showGitInfo=${showGitInfo}, hasGitBlame=${!!gitBlame}, authorName=${gitBlame?.authorName}, previewMode=${!!this._previewSettings}`),badgePriority==="author"&&gitBlame?.authorName){let initials=this._getInitials(gitBlame.authorName);initials&&(displayBadge=initials,this._logger.debug(`\u{1F3F7}\uFE0F Using author initials badge: "${initials}" (from ${gitBlame.authorName})`))}else if(badgePriority==="size"&&showFileSize){let compact=this._formatCompactSize(stat.size);compact&&(displayBadge=compact,this._logger.debug(`\u{1F3F7}\uFE0F Using size badge: "${compact}"`))}else this._logger.debug(`\u{1F3F7}\uFE0F Using time badge: "${badge}" (badgePriority=${badgePriority})`);return{badge,displayBadge,readableModified,readableCreated,fileSizeLabel:showFileSize?this._formatFileSize(stat.size,fileSizeFormat):null}}async _buildTooltipContent({filePath,resourceUri,stat,badgeDetails,gitBlame,shouldUseAccessibleTooltips,fileSizeFormat,isCodeFile}){let fileDisplayName=describeFile(filePath),fileExt=getExtension(filePath);if(shouldUseAccessibleTooltips){let accessibleTooltip=this._accessibility.getAccessibleTooltip(filePath,stat.mtime,stat.birthtime,stat.size,gitBlame);if(accessibleTooltip)return this._logger.info(`\u{1F50D} Using accessible tooltip (${accessibleTooltip.length} chars): "${accessibleTooltip.substring(0,50)}..."`),accessibleTooltip;this._logger.info("\u{1F50D} Accessible tooltip generation failed, using rich tooltip")}let tooltip=`\u{1F4C4} File: ${fileDisplayName}
`;tooltip+=`\u{1F4DD} Last Modified: ${badgeDetails.readableModified}
`,tooltip+=`   ${this._formatFullDate(stat.mtime)}

`,tooltip+=`\u{1F4C5} Created: ${badgeDetails.readableCreated}
`,tooltip+=`   ${this._formatFullDate(stat.birthtime)}

`;let sizeLabel=badgeDetails.fileSizeLabel||this._formatFileSize(stat.size,fileSizeFormat||"auto");if(tooltip+=`\u{1F4CA} Size: ${sizeLabel} (${stat.size.toLocaleString()} bytes)
`,fileExt&&(tooltip+=`\u{1F3F7}\uFE0F Type: ${fileExt.toUpperCase()} file
`),isCodeFile)try{let contentSource=resourceUri||filePath,lineCount=(await this._fileSystem.readFile(contentSource,"utf8")).split(`
`).length;tooltip+=`\u{1F4CF} Lines: ${lineCount.toLocaleString()}
`}catch{}return tooltip+=`\u{1F4C2} Path: ${filePath}`,gitBlame&&(tooltip+=`

\u{1F464} Last Modified By: ${gitBlame.authorName}`,gitBlame.authorEmail&&(tooltip+=` (${gitBlame.authorEmail})`),gitBlame.authorDate&&(tooltip+=`
   ${gitBlame.authorDate}`)),tooltip}_formatDateReadable(date){let now=new Date,diffMs=now.getTime()-date.getTime(),diffMins=Math.floor(diffMs/(1e3*60)),diffHours=Math.floor(diffMs/(1e3*60*60)),diffDays=Math.floor(diffMs/(1e3*60*60*24));return diffMins<1?this._l10n.getString("justNow"):diffMins<60?this._l10n.getString("minutesAgo",diffMins):diffHours<24&&date.toDateString()===now.toDateString()?this._l10n.getString("hoursAgo",diffHours):diffDays<7?diffDays===1?this._l10n.getString("yesterday"):this._l10n.getString("daysAgo",diffDays):date.getFullYear()===now.getFullYear()?this._l10n.formatDate(date,{month:"short",day:"numeric"}):this._l10n.formatDate(date,{month:"short",day:"numeric",year:"numeric"})}async _getGitBlameInfo(filePath){if(!this._gitAvailable||!execAsync)return null;try{let workspaceFolder=vscode2.workspace.getWorkspaceFolder(vscode2.Uri.file(filePath));if(!workspaceFolder)return null;let workspacePath=workspaceFolder.uri.fsPath||workspaceFolder.uri.path,relativePath=getRelativePath2(workspacePath,filePath),{stdout}=await execAsync(`git log -1 --format="%an|%ae|%ad" -- "${relativePath}"`,{cwd:workspaceFolder.uri.fsPath,timeout:2e3});if(!stdout||!stdout.trim())return null;let[authorName,authorEmail,authorDate]=stdout.trim().split("|");return{authorName:authorName||"Unknown",authorEmail:authorEmail||"",authorDate:authorDate||""}}catch{return null}}_getInitials(fullName){if(!fullName||typeof fullName!="string")return null;let parts=fullName.trim().split(/\s+/).filter(Boolean);return parts.length===0?null:parts.length===1?parts[0].substring(0,2).toUpperCase():(parts[0][0]+(parts[1][0]||"")).substring(0,2).toUpperCase()}_formatCompactSize(bytes){if(typeof bytes!="number"||isNaN(bytes))return null;let units=["B","K","M","G","T"],i=0,val=bytes;for(;val>=1024&&i<units.length-1;)val=val/1024,i++;let rounded=Math.round(val),unit=units[i];if(rounded<=9)return`${rounded}${unit}`;let s=String(rounded);return s.length>=2?s.slice(0,2):s}_formatFullDate(date){let options={year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZoneName:"short"};return date.toLocaleString("en-US",options)}_getCacheKey(uri){return buildCacheKey(getUriPath(uri))}async provideFileDecoration(uri,token){let startTime=Date.now();try{if(!uri){this._logger.error("\u274C Invalid URI provided to provideFileDecoration:",uri);return}let filePath=getUriPath(uri);if(!filePath){this._logger.error("\u274C Could not resolve path for URI in provideFileDecoration:",uri);return}let fileLabel=describeFile(filePath);this._logger.info(`\u{1F50D} VSCODE REQUESTED DECORATION: ${fileLabel} (${filePath})`),this._logger.info(`\u{1F4CA} Call context: token=${!!token}, cancelled=${token?.isCancellationRequested}`);let config=vscode2.workspace.getConfiguration("explorerDates"),_get=__name((key,def)=>{if(this._previewSettings&&Object.prototype.hasOwnProperty.call(this._previewSettings,key)){let previewValue=this._previewSettings[key];return this._logger.debug(`\u{1F3AD} Using preview value for ${key}: ${previewValue} (config has: ${config.get(key,def)})`),previewValue}return config.get(key,def)},"_get");if(this._previewSettings&&this._logger.info(`\u{1F3AD} Processing ${fileLabel} in PREVIEW MODE with settings:`,this._previewSettings),!_get("showDateDecorations",!0)){this._logger.info(`\u274C RETURNED UNDEFINED: Decorations disabled globally for ${fileLabel}`);return}if(await this._isExcludedSimple(uri)){this._logger.info(`\u274C File excluded: ${fileLabel}`);return}this._logger.debug(`\u{1F50D} Processing file: ${fileLabel}`);let cacheKey=this._getCacheKey(uri);if(this._previewSettings)this._logger.debug(`\u{1F504} Skipping cache due to active preview settings for: ${fileLabel}`);else{let cachedDecoration=await this._getCachedDecoration(cacheKey,fileLabel);if(cachedDecoration)return cachedDecoration}if(this._metrics.cacheMisses++,this._logger.debug(`\u274C Cache miss for: ${fileLabel} (key: ${cacheKey.substring(0,50)}...)`),token?.isCancellationRequested){this._logger.debug(`Decoration cancelled for: ${filePath}`);return}let stat=await this._fileSystem.stat(uri);if(!(typeof stat.isFile=="function"?stat.isFile():!0))return;let modifiedAt=stat.mtime instanceof Date?stat.mtime:new Date(stat.mtime),createdAt=stat.birthtime instanceof Date?stat.birthtime:new Date(stat.birthtime||stat.ctime||stat.mtime),normalizedStat={mtime:modifiedAt,birthtime:createdAt,size:stat.size},diffMs=Date.now()-modifiedAt.getTime(),dateFormat=_get("dateDecorationFormat","smart"),colorScheme=_get("colorScheme","none"),highContrastMode=_get("highContrastMode",!1),showFileSize=_get("showFileSize",!1),fileSizeFormat=_get("fileSizeFormat","auto"),accessibilityMode=_get("accessibilityMode",!1),fadeOldFiles=_get("fadeOldFiles",!1),fadeThreshold=_get("fadeThreshold",30),rawShowGitInfo=_get("showGitInfo","none"),badgePriority=_get("badgePriority","time"),gitFeaturesEnabled=(rawShowGitInfo!=="none"||badgePriority==="author")&&this._gitAvailable,showGitInfo=gitFeaturesEnabled?rawShowGitInfo:"none";badgePriority==="author"&&!gitFeaturesEnabled&&(badgePriority="time");let gitBlame=gitFeaturesEnabled?await this._getGitBlameInfo(filePath):null,badgeDetails=this._generateBadgeDetails({filePath,stat:normalizedStat,diffMs,dateFormat,badgePriority,showFileSize,fileSizeFormat,gitBlame,showGitInfo}),fileExt=getExtension(filePath),isCodeFile=[".js",".ts",".jsx",".tsx",".py",".rb",".php",".java",".cpp",".c",".cs",".go",".rs",".kt",".swift"].includes(fileExt),shouldUseAccessibleTooltips=accessibilityMode&&this._accessibility?.shouldEnhanceAccessibility();this._logger.debug(`\u{1F50D} Tooltip generation for ${fileLabel}: accessibilityMode=${accessibilityMode}, shouldUseAccessible=${shouldUseAccessibleTooltips}, previewMode=${!!this._previewSettings}`);let tooltip=await this._buildTooltipContent({filePath,resourceUri:uri,stat:normalizedStat,badgeDetails,gitBlame:showGitInfo==="none"?null:gitBlame,shouldUseAccessibleTooltips,fileSizeFormat,isCodeFile}),color;colorScheme!=="none"&&(color=this._themeIntegration?this._themeIntegration.applyThemeAwareColorScheme(colorScheme,filePath,diffMs):this._getColorByScheme(modifiedAt,colorScheme,filePath)),this._logger.debug(`\u{1F3A8} Color scheme setting: ${colorScheme}, using color: ${color?"yes":"no"}`),fadeOldFiles&&Math.floor(diffMs/864e5)>fadeThreshold&&(color=new vscode2.ThemeColor("editorGutter.commentRangeForeground"));let finalBadge=trimBadge(badgeDetails.displayBadge)||trimBadge(badgeDetails.badge)||"??";this._accessibility?.shouldEnhanceAccessibility()&&(finalBadge=this._accessibility.getAccessibleBadge(finalBadge));let decoration;try{if(decoration=new vscode2.FileDecoration(finalBadge),tooltip&&tooltip.length<500&&(decoration.tooltip=tooltip,this._logger.debug(`\u{1F4DD} Added tooltip (${tooltip.length} chars)`)),color){let enhancedColor=this._enhanceColorForSelection(color);decoration.color=enhancedColor,this._logger.debug(`\u{1F3A8} Added enhanced color: ${enhancedColor.id||enhancedColor} (original: ${color.id||color})`)}decoration.propagate=!1}catch(decorationError){this._logger.error("\u274C Failed to create decoration:",decorationError),decoration=new vscode2.FileDecoration("!!"),decoration.propagate=!1}if(this._logger.debug(`\u{1F3A8} Color/contrast check for ${fileLabel}: colorScheme=${colorScheme}, highContrastMode=${highContrastMode}, hasColor=${!!color}, previewMode=${!!this._previewSettings}`),highContrastMode&&(decoration.color=new vscode2.ThemeColor("editorWarning.foreground"),this._logger.info(`\u{1F506} Applied high contrast color (overriding colorScheme=${colorScheme})`)),this._previewSettings?this._logger.debug(`\u{1F504} Skipping cache storage due to preview mode for: ${fileLabel}`):await this._storeDecorationInCache(cacheKey,decoration,fileLabel),this._metrics.totalDecorations++,!decoration?.badge){this._logger.error(`\u274C Decoration badge is invalid for: ${fileLabel}`);return}let processingTime=Date.now()-startTime;return this._logger.info(`\u2705 Decoration created for: ${fileLabel} (badge: ${decoration.badge||"undefined"}) - Cache key: ${cacheKey.substring(0,30)}...`),this._logger.info("\u{1F3AF} RETURNING DECORATION TO VSCODE:",{file:fileLabel,badge:decoration.badge,hasTooltip:!!decoration.tooltip,hasColor:!!decoration.color,colorType:decoration.color?.constructor?.name,processingTimeMs:processingTime,decorationType:decoration.constructor.name}),console.log(`\u{1F3AF} DECORATION RETURNED: ${fileLabel} \u2192 "${decoration.badge}"`),decoration}catch(error){this._metrics.errors++;let processingTime=startTime?Date.now()-startTime:0,safeFileName=describeFile(uri),safeUri=getUriPath(uri)||"unknown-uri";this._logger.error(`\u274C DECORATION ERROR for ${safeFileName}:`,{error:error.message,stack:error.stack?.split(`
`)[0],processingTimeMs:processingTime,uri:safeUri}),console.error(`\u274C DECORATION ERROR: ${safeFileName} \u2192 ${error.message}`),console.error("\u274C Full error:",error),console.error("\u274C Stack trace:",error.stack),this._logger.error(`\u274C CRITICAL ERROR DETAILS for ${safeFileName}: ${error.message}`),this._logger.error(`\u274C Error type: ${error.constructor.name}`),this._logger.error(`\u274C Full stack: ${error.stack}`),this._logger.info(`\u274C RETURNED UNDEFINED: Error occurred for ${safeFileName}`);return}}getMetrics(){let baseMetrics={...this._metrics,cacheSize:this._decorationCache.size,cacheHitRate:this._metrics.cacheHits+this._metrics.cacheMisses>0?(this._metrics.cacheHits/(this._metrics.cacheHits+this._metrics.cacheMisses)*100).toFixed(2)+"%":"0.00%"};return this._advancedCache&&(baseMetrics.advancedCache=this._advancedCache.getStats()),this._batchProcessor&&(baseMetrics.batchProcessor=this._batchProcessor.getMetrics()),baseMetrics.cacheDebugging={memoryCacheKeys:Array.from(this._decorationCache.keys()).slice(0,5),cacheTimeout:this._cacheTimeout,maxCacheSize:this._maxCacheSize,keyStatsSize:this._cacheKeyStats?this._cacheKeyStats.size:0},baseMetrics}async initializeAdvancedSystems(context){try{this._extensionContext=context,this._isWeb&&await this._maybeWarnAboutGitLimitations(),this._advancedCache=new AdvancedCache(context),await this._advancedCache.initialize(),this._logger.info("Advanced cache initialized"),this._batchProcessor.initialize(),this._logger.info("Batch processor initialized"),await this._applyProgressiveLoadingSetting(),vscode2.workspace.getConfiguration("explorerDates").get("autoThemeAdaptation",!0)&&(await this._themeIntegration.autoConfigureForTheme(),this._logger.info("Theme integration configured")),this._accessibility.shouldEnhanceAccessibility()&&(await this._accessibility.applyAccessibilityRecommendations(),this._logger.info("Accessibility recommendations applied"));try{await this._smartExclusion.cleanupAllWorkspaceProfiles()}catch(error){this._logger.warn("Failed to clean workspace exclusion profiles",error)}if(vscode2.workspace.workspaceFolders)for(let folder of vscode2.workspace.workspaceFolders)try{await this._smartExclusion.suggestExclusions(folder.uri),this._logger.info(`Smart exclusions analyzed for: ${folder.name}`)}catch(error){this._logger.error(`Failed to analyze smart exclusions for ${folder.name}`,error)}this._logger.info("Advanced systems initialized successfully")}catch(error){this._logger.error("Failed to initialize advanced systems",error)}}async _maybeWarnAboutGitLimitations(){if(!this._gitWarningShown){this._gitWarningShown=!0;try{let storage=this._extensionContext?.globalState,storageKey=GLOBAL_STATE_KEYS.WEB_GIT_NOTICE;if(storage?.get(storageKey,!1))return;if(storage?.update)try{await storage.update(storageKey,!0)}catch(storageError){this._logger.debug("Failed to persist Git limitation notice flag",storageError)}Promise.resolve().then(()=>{vscode2.window.showInformationMessage("Explorer Dates: Git attribution badges are unavailable on VS Code for Web. Time-based decorations remain available.")})}catch(error){this._logger.debug("Failed to display Git limitation notice",error)}}}_enhanceColorForSelection(color){let colorEnhancementMap={"charts.yellow":"list.warningForeground","charts.red":"list.errorForeground","charts.green":"list.highlightForeground","charts.blue":"symbolIcon.functionForeground","charts.purple":"symbolIcon.classForeground","charts.orange":"list.warningForeground","terminal.ansiYellow":"list.warningForeground","terminal.ansiGreen":"list.highlightForeground","terminal.ansiRed":"list.errorForeground","terminal.ansiBlue":"symbolIcon.functionForeground","terminal.ansiMagenta":"symbolIcon.classForeground","terminal.ansiCyan":"symbolIcon.stringForeground","editorGutter.commentRangeForeground":"list.deemphasizedForeground","editorWarning.foreground":"list.warningForeground","editorError.foreground":"list.errorForeground","editorInfo.foreground":"list.highlightForeground"},colorId=color.id||color,enhancedColorId=colorEnhancementMap[colorId];return enhancedColorId?(this._logger.debug(`\u{1F527} Enhanced color ${colorId} \u2192 ${enhancedColorId} for better selection visibility`),new vscode2.ThemeColor(enhancedColorId)):color}async dispose(){this._logger.info("Disposing FileDateDecorationProvider",this.getMetrics()),this._refreshTimer&&(clearInterval(this._refreshTimer),this._refreshTimer=null,this._logger.info("Cleared periodic refresh timer")),this._advancedCache&&await this._advancedCache.dispose(),this._cancelProgressiveWarmupJobs(),this._batchProcessor&&this._batchProcessor.dispose(),this._decorationCache.clear(),this._onDidChangeFileDecorations.dispose(),this._fileWatcher&&this._fileWatcher.dispose()}};__name(_FileDateDecorationProvider,"FileDateDecorationProvider");var FileDateDecorationProvider=_FileDateDecorationProvider;module2.exports={FileDateDecorationProvider}}});var require_coreCommands=__commonJS({"src/commands/coreCommands.js"(exports,module){var vscode=require("vscode"),{fileSystem}=require_FileSystemAdapter(),{getFileName,getRelativePath}=require_pathUtils(),isWeb=!0,childProcess=null;function loadChildProcess(){return!childProcess&&!isWeb&&(childProcess=eval("require")("child_process")),childProcess}__name(loadChildProcess,"loadChildProcess");function registerCoreCommands({context,fileDateProvider,logger,l10n}){let subscriptions=[];subscriptions.push(vscode.commands.registerCommand("explorerDates.refreshDateDecorations",()=>{try{if(fileDateProvider){fileDateProvider.clearAllCaches(),fileDateProvider.refreshAll();let message=l10n?.getString("refreshSuccess")||"Date decorations refreshed - all caches cleared";vscode.window.showInformationMessage(message),logger.info("Date decorations refreshed manually with cache clear")}}catch(error){logger.error("Failed to refresh decorations",error),vscode.window.showErrorMessage(`Failed to refresh decorations: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.previewConfiguration",settings=>{try{fileDateProvider&&(fileDateProvider.applyPreviewSettings(settings),logger.info("Configuration preview applied",settings))}catch(error){logger.error("Failed to apply configuration preview",error)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.clearPreview",()=>{try{fileDateProvider&&(fileDateProvider.applyPreviewSettings(null),logger.info("Configuration preview cleared"))}catch(error){logger.error("Failed to clear configuration preview",error)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.showMetrics",()=>{try{if(fileDateProvider){let metrics=fileDateProvider.getMetrics(),message=`Explorer Dates Metrics:
Total Decorations: ${metrics.totalDecorations}
Cache Size: ${metrics.cacheSize}
Cache Hits: ${metrics.cacheHits}
Cache Misses: ${metrics.cacheMisses}
Cache Hit Rate: ${metrics.cacheHitRate}
Errors: ${metrics.errors}`;metrics.advancedCache&&(message+=`

Advanced Cache:
Memory Items: ${metrics.advancedCache.memoryItems}
Memory Usage: ${(metrics.advancedCache.memoryUsage/1024/1024).toFixed(2)} MB
Memory Hit Rate: ${metrics.advancedCache.memoryHitRate}
Disk Hit Rate: ${metrics.advancedCache.diskHitRate}
Evictions: ${metrics.advancedCache.evictions}`),metrics.batchProcessor&&(message+=`

Batch Processor:
Queue Length: ${metrics.batchProcessor.queueLength}
Is Processing: ${metrics.batchProcessor.isProcessing}
Average Batch Time: ${metrics.batchProcessor.averageBatchTime.toFixed(2)}ms`),vscode.window.showInformationMessage(message,{modal:!0}),logger.info("Metrics displayed",metrics)}}catch(error){logger.error("Failed to show metrics",error),vscode.window.showErrorMessage(`Failed to show metrics: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.openLogs",()=>{try{logger.show()}catch(error){logger.error("Failed to open logs",error),vscode.window.showErrorMessage(`Failed to open logs: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.showCurrentConfig",()=>{try{let config=vscode.workspace.getConfiguration("explorerDates"),settings={highContrastMode:config.get("highContrastMode"),badgePriority:config.get("badgePriority"),colorScheme:config.get("colorScheme"),accessibilityMode:config.get("accessibilityMode"),dateDecorationFormat:config.get("dateDecorationFormat"),showGitInfo:config.get("showGitInfo"),showFileSize:config.get("showFileSize")},message=`Current Explorer Dates Configuration:

${Object.entries(settings).map(([key,value])=>`${key}: ${JSON.stringify(value)}`).join(`
`)}`;vscode.window.showInformationMessage(message,{modal:!0}),logger.info("Current configuration displayed",settings)}catch(error){logger.error("Failed to show configuration",error)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.resetToDefaults",async()=>{try{let config=vscode.workspace.getConfiguration("explorerDates");await config.update("highContrastMode",!1,vscode.ConfigurationTarget.Global),await config.update("badgePriority","time",vscode.ConfigurationTarget.Global),await config.update("accessibilityMode",!1,vscode.ConfigurationTarget.Global),vscode.window.showInformationMessage("Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately."),logger.info("Reset problematic settings to defaults"),fileDateProvider&&(fileDateProvider.clearAllCaches(),fileDateProvider.refreshAll())}catch(error){logger.error("Failed to reset settings",error),vscode.window.showErrorMessage(`Failed to reset settings: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.toggleDecorations",()=>{try{let config=vscode.workspace.getConfiguration("explorerDates"),currentValue=config.get("showDateDecorations",!0);config.update("showDateDecorations",!currentValue,vscode.ConfigurationTarget.Global);let message=currentValue?l10n?.getString("decorationsDisabled")||"Date decorations disabled":l10n?.getString("decorationsEnabled")||"Date decorations enabled";vscode.window.showInformationMessage(message),logger.info(`Date decorations toggled to: ${!currentValue}`)}catch(error){logger.error("Failed to toggle decorations",error),vscode.window.showErrorMessage(`Failed to toggle decorations: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.copyFileDate",async uri=>{try{let targetUri=uri;if(!targetUri&&vscode.window.activeTextEditor&&(targetUri=vscode.window.activeTextEditor.document.uri),!targetUri){vscode.window.showWarningMessage("No file selected");return}let stat=await fileSystem.stat(targetUri),dateString=(stat.mtime instanceof Date?stat.mtime:new Date(stat.mtime)).toLocaleString();await vscode.env.clipboard.writeText(dateString),vscode.window.showInformationMessage(`Copied to clipboard: ${dateString}`),logger.info(`File date copied for: ${targetUri.fsPath||targetUri.path}`)}catch(error){logger.error("Failed to copy file date",error),vscode.window.showErrorMessage(`Failed to copy file date: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.showFileDetails",async uri=>{try{let targetUri=uri;if(!targetUri&&vscode.window.activeTextEditor&&(targetUri=vscode.window.activeTextEditor.document.uri),!targetUri){vscode.window.showWarningMessage("No file selected");return}let stat=await fileSystem.stat(targetUri),fileName=getFileName(targetUri.fsPath||targetUri.path),fileSize=fileDateProvider?._formatFileSize(stat.size,"auto")||`${stat.size} bytes`,modified=(stat.mtime instanceof Date?stat.mtime:new Date(stat.mtime)).toLocaleString(),created=(stat.birthtime instanceof Date?stat.birthtime:new Date(stat.birthtime||stat.mtime)).toLocaleString(),details=`File: ${fileName}
Size: ${fileSize}
Modified: ${modified}
Created: ${created}
Path: ${targetUri.fsPath||targetUri.path}`;vscode.window.showInformationMessage(details,{modal:!0}),logger.info(`File details shown for: ${targetUri.fsPath||targetUri.path}`)}catch(error){logger.error("Failed to show file details",error),vscode.window.showErrorMessage(`Failed to show file details: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.toggleFadeOldFiles",()=>{try{let config=vscode.workspace.getConfiguration("explorerDates"),currentValue=config.get("fadeOldFiles",!1);config.update("fadeOldFiles",!currentValue,vscode.ConfigurationTarget.Global);let message=currentValue?"Fade old files disabled":"Fade old files enabled";vscode.window.showInformationMessage(message),logger.info(`Fade old files toggled to: ${!currentValue}`)}catch(error){logger.error("Failed to toggle fade old files",error),vscode.window.showErrorMessage(`Failed to toggle fade old files: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.showFileHistory",async uri=>{try{if(isWeb){vscode.window.showInformationMessage("Git history is unavailable on VS Code for Web.");return}let targetUri=uri;if(!targetUri&&vscode.window.activeTextEditor&&(targetUri=vscode.window.activeTextEditor.document.uri),!targetUri){vscode.window.showWarningMessage("No file selected");return}let workspaceFolder=vscode.workspace.getWorkspaceFolder(targetUri);if(!workspaceFolder){vscode.window.showWarningMessage("File is not in a workspace");return}let command=`git log --oneline -10 -- "${getRelativePath(workspaceFolder.uri.fsPath||workspaceFolder.uri.path,targetUri.fsPath||targetUri.path)}"`;loadChildProcess().exec(command,{cwd:workspaceFolder.uri.fsPath,timeout:3e3},(error,stdout)=>{if(error){error.message.includes("not a git repository")?vscode.window.showWarningMessage("This file is not in a Git repository"):vscode.window.showErrorMessage(`Git error: ${error.message}`);return}if(!stdout.trim()){vscode.window.showInformationMessage("No Git history found for this file");return}let history=stdout.trim(),fileName=getFileName(targetUri.fsPath||targetUri.path);vscode.window.showInformationMessage(`Recent commits for ${fileName}:

${history}`,{modal:!0})}),logger.info(`File history requested for: ${targetUri.fsPath||targetUri.path}`)}catch(error){logger.error("Failed to show file history",error),vscode.window.showErrorMessage(`Failed to show file history: ${error.message}`)}})),subscriptions.push(vscode.commands.registerCommand("explorerDates.compareWithPrevious",async uri=>{try{if(isWeb){vscode.window.showInformationMessage("Git comparisons are unavailable on VS Code for Web.");return}let targetUri=uri;if(!targetUri&&vscode.window.activeTextEditor&&(targetUri=vscode.window.activeTextEditor.document.uri),!targetUri){vscode.window.showWarningMessage("No file selected");return}if(!vscode.workspace.getWorkspaceFolder(targetUri)){vscode.window.showWarningMessage("File is not in a workspace");return}await vscode.commands.executeCommand("git.openChange",targetUri),logger.info(`Git diff opened for: ${targetUri.fsPath||targetUri.path}`)}catch(error){logger.error("Failed to compare with previous version",error),vscode.window.showErrorMessage(`Failed to compare with previous version: ${error.message}`)}})),subscriptions.forEach(disposable=>context.subscriptions.push(disposable))}__name(registerCoreCommands,"registerCoreCommands");module.exports={registerCoreCommands}}});var require_decorationDiagnostics=__commonJS({"src/decorationDiagnostics.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),_DecorationDiagnostics=class _DecorationDiagnostics{constructor(decorationProvider){this._logger=getLogger(),this._provider=decorationProvider,this._testResults=[]}async runComprehensiveDiagnostics(){this._logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let results={timestamp:new Date().toISOString(),vscodeVersion:vscode2.version,extensionVersion:vscode2.extensions.getExtension("incredincomp.explorer-dates")?.packageJSON?.version,tests:{}};return results.tests.vscodeSettings=await this._testVSCodeSettings(),results.tests.providerRegistration=await this._testProviderRegistration(),results.tests.fileProcessing=await this._testFileProcessing(),results.tests.decorationCreation=await this._testDecorationCreation(),results.tests.cacheAnalysis=await this._testCacheAnalysis(),results.tests.extensionConflicts=await this._testExtensionConflicts(),results.tests.uriPathIssues=await this._testURIPathIssues(),this._logger.info("\u{1F50D} Comprehensive diagnostics completed",results),results}async _testVSCodeSettings(){let explorerConfig=vscode2.workspace.getConfiguration("explorer"),workbenchConfig=vscode2.workspace.getConfiguration("workbench"),explorerDatesConfig=vscode2.workspace.getConfiguration("explorerDates"),settings={"explorer.decorations.badges":explorerConfig.get("decorations.badges"),"explorer.decorations.colors":explorerConfig.get("decorations.colors"),"workbench.colorTheme":workbenchConfig.get("colorTheme"),"explorerDates.showDateDecorations":explorerDatesConfig.get("showDateDecorations"),"explorerDates.colorScheme":explorerDatesConfig.get("colorScheme"),"explorerDates.showGitInfo":explorerDatesConfig.get("showGitInfo")},issues=[];return settings["explorer.decorations.badges"]===!1&&issues.push("CRITICAL: explorer.decorations.badges is disabled"),settings["explorer.decorations.colors"]===!1&&issues.push("WARNING: explorer.decorations.colors is disabled"),settings["explorerDates.showDateDecorations"]===!1&&issues.push("CRITICAL: explorerDates.showDateDecorations is disabled"),{status:issues.length>0?"ISSUES_FOUND":"OK",settings,issues}}async _testProviderRegistration(){let issues=[];if(!this._provider)return issues.push("CRITICAL: Decoration provider is null/undefined"),{status:"FAILED",issues};typeof this._provider.provideFileDecoration!="function"&&issues.push("CRITICAL: provideFileDecoration method missing"),this._provider.onDidChangeFileDecorations||issues.push("WARNING: onDidChangeFileDecorations event emitter missing");let testUri=vscode2.Uri.file("/test/path");try{let testResult=await this._provider.provideFileDecoration(testUri);this._logger.debug("Provider test call completed",{result:!!testResult})}catch(error){issues.push(`ERROR: Provider test call failed: ${error.message}`)}return{status:issues.length>0?"ISSUES_FOUND":"OK",providerActive:!!this._provider,issues}}async _testFileProcessing(){let workspaceFolders=vscode2.workspace.workspaceFolders;if(!workspaceFolders||workspaceFolders.length===0)return{status:"NO_WORKSPACE",issues:["No workspace folders available"]};let testFiles=[],issues=[];try{let commonFiles=["package.json","README.md","extension.js","src/logger.js"];for(let fileName of commonFiles){let fileUri=vscode2.Uri.joinPath(workspaceFolders[0].uri,fileName);try{await vscode2.workspace.fs.stat(fileUri);let isExcluded=this._provider._isExcludedSimple?await this._provider._isExcludedSimple(fileUri):!1,decoration=await this._provider.provideFileDecoration(fileUri);testFiles.push({file:fileName,exists:!0,excluded:isExcluded,hasDecoration:!!decoration,badge:decoration?.badge,uri:fileUri.toString()})}catch(fileError){testFiles.push({file:fileName,exists:!1,error:fileError.message})}}}catch(error){issues.push(`File processing test failed: ${error.message}`)}return{status:issues.length>0?"ISSUES_FOUND":"OK",testFiles,issues}}async _testDecorationCreation(){let tests=[],issues=[];try{let simpleDecoration=new vscode2.FileDecoration("test");tests.push({name:"Simple decoration",success:!0,badge:simpleDecoration.badge})}catch(error){tests.push({name:"Simple decoration",success:!1,error:error.message}),issues.push("CRITICAL: Cannot create simple FileDecoration")}try{let tooltipDecoration=new vscode2.FileDecoration("test","Test tooltip");tests.push({name:"Decoration with tooltip",success:!0,hasTooltip:!!(tooltipDecoration&&tooltipDecoration.tooltip)})}catch(error){tests.push({name:"Decoration with tooltip",success:!1,error:error.message}),issues.push("WARNING: Cannot create FileDecoration with tooltip")}try{let colorDecoration=new vscode2.FileDecoration("test","Test tooltip",new vscode2.ThemeColor("charts.red"));tests.push({name:"Decoration with color",success:!0,hasColor:!!colorDecoration.color})}catch(error){tests.push({name:"Decoration with color",success:!1,error:error.message}),issues.push("WARNING: Cannot create FileDecoration with color")}let badgeTests=["1d","10m","2h","!!","\u25CF\u25CF","JA12","123456789"];for(let badge of badgeTests)try{let badgeDecoration=new vscode2.FileDecoration(badge);tests.push({name:`Badge format: ${badge}`,success:!0,badge:badgeDecoration.badge,length:badge.length})}catch(error){tests.push({name:`Badge format: ${badge}`,success:!1,error:error.message}),badge.length<=8&&issues.push(`WARNING: Valid badge format '${badge}' failed`)}return{status:issues.length>0?"ISSUES_FOUND":"OK",tests,issues}}async _testCacheAnalysis(){let cacheInfo={memoryCache:{size:this._provider._decorationCache?.size||0,maxSize:this._provider._maxCacheSize||0},advancedCache:{available:!!this._provider._advancedCache,initialized:!1},metrics:this._provider.getMetrics?this._provider.getMetrics():null},issues=[];return cacheInfo.memoryCache.size>cacheInfo.memoryCache.maxSize*.9&&issues.push("WARNING: Memory cache is nearly full"),cacheInfo.metrics&&cacheInfo.metrics.cacheHits===0&&cacheInfo.metrics.cacheMisses>10&&issues.push("WARNING: Cache hit rate is 0% - potential cache key issues"),{status:issues.length>0?"ISSUES_FOUND":"OK",cacheInfo,issues}}async _testExtensionConflicts(){let allExtensions=vscode2.extensions.all,potentialConflicts=[],decorationExtensions=[];for(let ext of allExtensions){if(!ext.isActive)continue;let packageJson=ext.packageJSON;packageJson.contributes?.commands?.some(cmd=>cmd.command?.includes("decoration")||cmd.title?.includes("decoration")||cmd.title?.includes("badge")||cmd.title?.includes("explorer"))&&decorationExtensions.push({id:ext.id,name:packageJson.displayName||packageJson.name,version:packageJson.version}),["file-icons","vscode-icons","material-icon-theme","explorer-exclude","hide-files","file-watcher"].some(conflict=>ext.id.includes(conflict))&&potentialConflicts.push({id:ext.id,name:packageJson.displayName||packageJson.name,reason:"Known to potentially interfere with file decorations"})}let issues=[];return decorationExtensions.length>1&&issues.push(`WARNING: ${decorationExtensions.length} extensions might provide file decorations`),potentialConflicts.length>0&&issues.push(`WARNING: ${potentialConflicts.length} potentially conflicting extensions detected`),{status:issues.length>0?"ISSUES_FOUND":"OK",decorationExtensions,potentialConflicts,issues}}async _testURIPathIssues(){let workspaceFolders=vscode2.workspace.workspaceFolders;if(!workspaceFolders||workspaceFolders.length===0)return{status:"NO_WORKSPACE",issues:["No workspace available for URI testing"]};let tests=[],issues=[],testPaths=["package.json","src/logger.js","README.md",".gitignore"];for(let testPath of testPaths){let fileUri=vscode2.Uri.joinPath(workspaceFolders[0].uri,testPath);tests.push({path:testPath,scheme:fileUri.scheme,fsPath:fileUri.fsPath,authority:fileUri.authority,valid:fileUri.scheme==="file"&&fileUri.fsPath.length>0}),fileUri.scheme!=="file"&&issues.push(`WARNING: Non-file URI scheme for ${testPath}: ${fileUri.scheme}`),(fileUri.fsPath.includes("\\\\")||fileUri.fsPath.includes("//"))&&issues.push(`WARNING: Potential path separator issues in ${testPath}`)}return{status:issues.length>0?"ISSUES_FOUND":"OK",tests,issues}}};__name(_DecorationDiagnostics,"DecorationDiagnostics");var DecorationDiagnostics=_DecorationDiagnostics;module2.exports={DecorationDiagnostics}}});var require_decorationTester=__commonJS({"src/decorationTester.js"(exports2,module2){var vscode2=require("vscode"),{getFileName:getFileName2}=require_pathUtils();async function testVSCodeDecorationRendering(){let logger=require_logger().getLogger();logger.info("\u{1F3A8} Testing VS Code decoration rendering...");let _TestDecorationProvider=class _TestDecorationProvider{constructor(){this._onDidChangeFileDecorations=new vscode2.EventEmitter,this.onDidChangeFileDecorations=this._onDidChangeFileDecorations.event}provideFileDecoration(uri){let fileName=getFileName2(uri.fsPath||uri.path),decoration=new vscode2.FileDecoration("TEST");return decoration.tooltip=`Test decoration for ${fileName}`,decoration.color=new vscode2.ThemeColor("charts.red"),logger.info(`\u{1F9EA} Test provider returning decoration for: ${fileName}`),console.log(`\u{1F9EA} TEST DECORATION: ${fileName} \u2192 "TEST"`),decoration}};__name(_TestDecorationProvider,"TestDecorationProvider");let TestDecorationProvider=_TestDecorationProvider,testProvider=new TestDecorationProvider,disposable=vscode2.window.registerFileDecorationProvider(testProvider);return logger.info("\u{1F9EA} Test decoration provider registered"),setTimeout(()=>{testProvider._onDidChangeFileDecorations.fire(void 0),logger.info("\u{1F504} Test decoration refresh triggered"),setTimeout(()=>{disposable.dispose(),logger.info("\u{1F9EA} Test decoration provider disposed")},1e4)},1e3),"Test decoration provider registered for 10 seconds"}__name(testVSCodeDecorationRendering,"testVSCodeDecorationRendering");async function testFileDecorationAPI(){let logger=require_logger().getLogger();logger.info("\u{1F527} Testing FileDecoration API...");let tests=[];try{let minimal=new vscode2.FileDecoration("MIN");tests.push({name:"Minimal decoration",success:!0,badge:minimal.badge}),logger.info("\u2705 Minimal decoration created successfully")}catch(error){tests.push({name:"Minimal decoration",success:!1,error:error.message}),logger.error("\u274C Minimal decoration failed:",error)}try{let full=new vscode2.FileDecoration("FULL","Full decoration tooltip",new vscode2.ThemeColor("charts.blue"));full.propagate=!1,tests.push({name:"Full decoration",success:!0,badge:full.badge,hasTooltip:!!full.tooltip,hasColor:!!full.color,propagate:full.propagate}),logger.info("\u2705 Full decoration created successfully")}catch(error){tests.push({name:"Full decoration",success:!1,error:error.message}),logger.error("\u274C Full decoration failed:",error)}let themeColors=["charts.red","charts.blue","charts.green","charts.yellow","terminal.ansiRed","terminal.ansiGreen","terminal.ansiBlue","editorError.foreground","editorWarning.foreground","editorInfo.foreground"];for(let colorName of themeColors)try{tests.push({name:`ThemeColor: ${colorName}`,success:!0,colorId:colorName})}catch(error){tests.push({name:`ThemeColor: ${colorName}`,success:!1,error:error.message}),logger.error(`\u274C ThemeColor ${colorName} failed:`,error)}return tests}__name(testFileDecorationAPI,"testFileDecorationAPI");module2.exports={testVSCodeDecorationRendering,testFileDecorationAPI}}});var require_analysisCommands=__commonJS({"src/commands/analysisCommands.js"(exports2,module2){var vscode2=require("vscode"),{fileSystem:fileSystem2}=require_FileSystemAdapter(),{getFileName:getFileName2,getRelativePath:getRelativePath2}=require_pathUtils();function registerAnalysisCommands({context,fileDateProvider,logger,generators}){let{generateWorkspaceActivityHTML,generatePerformanceAnalyticsHTML,generateDiagnosticsHTML,generateDiagnosticsWebview}=generators,subscriptions=[];subscriptions.push(vscode2.commands.registerCommand("explorerDates.showWorkspaceActivity",async()=>{try{let panel=vscode2.window.createWebviewPanel("workspaceActivity","Workspace File Activity",vscode2.ViewColumn.One,{enableScripts:!0});if(!vscode2.workspace.workspaceFolders){vscode2.window.showWarningMessage("No workspace folder open");return}let workspaceFolder=vscode2.workspace.workspaceFolders[0],files=[],allFiles=await vscode2.workspace.findFiles("**/*","**/node_modules/**",100);for(let fileUri of allFiles)try{let stat=await fileSystem2.stat(fileUri);(typeof stat.isFile=="function"?stat.isFile():!0)&&files.push({path:getRelativePath2(workspaceFolder.uri.fsPath||workspaceFolder.uri.path,fileUri.fsPath||fileUri.path),modified:stat.mtime instanceof Date?stat.mtime:new Date(stat.mtime),size:stat.size})}catch{}files.sort((a,b)=>b.modified.getTime()-a.modified.getTime()),panel.webview.html=generateWorkspaceActivityHTML(files.slice(0,50)),logger.info("Workspace activity panel opened")}catch(error){logger.error("Failed to show workspace activity",error),vscode2.window.showErrorMessage(`Failed to show workspace activity: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.showPerformanceAnalytics",async()=>{try{let panel=vscode2.window.createWebviewPanel("performanceAnalytics","Explorer Dates Performance Analytics",vscode2.ViewColumn.One,{enableScripts:!0}),metrics=fileDateProvider?fileDateProvider.getMetrics():{};panel.webview.html=generatePerformanceAnalyticsHTML(metrics),logger.info("Performance analytics panel opened")}catch(error){logger.error("Failed to show performance analytics",error),vscode2.window.showErrorMessage(`Failed to show performance analytics: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.debugCache",async()=>{try{if(fileDateProvider){let metrics=fileDateProvider.getMetrics(),debugInfo={"Cache Summary":{"Memory Cache Size":metrics.cacheSize,"Cache Hit Rate":metrics.cacheHitRate,"Total Hits":metrics.cacheHits,"Total Misses":metrics.cacheMisses,"Cache Timeout":`${metrics.cacheDebugging.cacheTimeout}ms`},"Advanced Cache":metrics.advancedCache||"Not available","Sample Cache Keys":metrics.cacheDebugging.memoryCacheKeys||[]};vscode2.window.showInformationMessage(`Cache Debug Info:
${JSON.stringify(debugInfo,null,2)}`,{modal:!0}),logger.info("Cache debug info displayed",debugInfo)}}catch(error){logger.error("Failed to show cache debug info",error),vscode2.window.showErrorMessage(`Failed to show cache debug info: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.runDiagnostics",async()=>{try{let config=vscode2.workspace.getConfiguration("explorerDates"),activeEditor=vscode2.window.activeTextEditor,diagnosticResults={"Extension Status":{"Provider Active":fileDateProvider?"Yes":"No","Decorations Enabled":config.get("showDateDecorations",!0)?"Yes":"No","VS Code Version":vscode2.version,"Extension Version":context.extension.packageJSON.version}};if(activeEditor){let{uri}=activeEditor.document;uri.scheme==="file"&&(diagnosticResults["Current File"]={"File Path":uri.fsPath,"File Extension":getFileName2(uri.fsPath||uri.path).split(".").pop()||"No extension","Is Excluded":fileDateProvider?await fileDateProvider._isExcludedSimple(uri):"Unknown"})}if(diagnosticResults.Configuration={"Excluded Folders":config.get("excludedFolders",[]),"Excluded Patterns":config.get("excludedPatterns",[]),"Color Scheme":config.get("colorScheme","none"),"Cache Timeout":`${config.get("cacheTimeout",3e4)}ms`},fileDateProvider){let metrics=fileDateProvider.getMetrics();diagnosticResults.Performance={"Total Decorations":metrics.totalDecorations,"Cache Size":metrics.cacheSize,Errors:metrics.errors}}let panel=vscode2.window.createWebviewPanel("explorerDatesDiagnostics","Explorer Dates Diagnostics",vscode2.ViewColumn.One,{enableScripts:!0});panel.webview.html=generateDiagnosticsHTML(diagnosticResults),logger.info("Diagnostics panel opened",diagnosticResults)}catch(error){logger.error("Failed to run diagnostics",error),vscode2.window.showErrorMessage(`Failed to run diagnostics: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.testDecorations",async()=>{try{logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");let{DecorationDiagnostics}=require_decorationDiagnostics(),results=await new DecorationDiagnostics(fileDateProvider).runComprehensiveDiagnostics(),panel=vscode2.window.createWebviewPanel("decorationDiagnostics","Decoration Diagnostics - Root Cause Analysis",vscode2.ViewColumn.One,{enableScripts:!0});panel.webview.html=generateDiagnosticsWebview(results);let criticalIssues=[],warnings=[];Object.values(results.tests).forEach(test=>{test.issues&&test.issues.forEach(issue=>{issue.startsWith("CRITICAL:")?criticalIssues.push(issue):issue.startsWith("WARNING:")&&warnings.push(issue)})}),criticalIssues.length>0?vscode2.window.showErrorMessage(`CRITICAL ISSUES FOUND: ${criticalIssues.join(", ")}`):warnings.length>0?vscode2.window.showWarningMessage(`Warnings found: ${warnings.length} potential issues detected. Check diagnostics panel.`):vscode2.window.showInformationMessage("No critical issues found. Decorations should be working properly."),logger.info("\u{1F50D} Comprehensive diagnostics completed",results)}catch(error){logger.error("Failed to run comprehensive diagnostics",error),vscode2.window.showErrorMessage(`Diagnostics failed: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.monitorDecorations",async()=>{if(!fileDateProvider){vscode2.window.showErrorMessage("Decoration provider not available");return}fileDateProvider.startProviderCallMonitoring(),fileDateProvider.forceRefreshAllDecorations(),setTimeout(()=>{let stats=fileDateProvider.getProviderCallStats(),message=`VS Code Decoration Requests: ${stats.totalCalls} calls for ${stats.uniqueFiles} files`;vscode2.window.showInformationMessage(message),logger.info("\u{1F50D} Decoration monitoring results:",stats)},5e3),vscode2.window.showInformationMessage("Started monitoring VS Code decoration requests. Results in 5 seconds...")})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.testVSCodeRendering",async()=>{try{let{testVSCodeDecorationRendering,testFileDecorationAPI}=require_decorationTester();logger.info("\u{1F3A8} Testing VS Code decoration rendering system...");let apiTests=await testFileDecorationAPI();logger.info("\u{1F527} FileDecoration API tests:",apiTests);let renderResult=await testVSCodeDecorationRendering();logger.info("\u{1F3A8} Decoration rendering test:",renderResult),vscode2.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.')}catch(error){logger.error("Failed to test VS Code rendering:",error),vscode2.window.showErrorMessage(`VS Code rendering test failed: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.quickFix",async()=>{try{let config=vscode2.workspace.getConfiguration("explorerDates"),fixes=[];config.get("showDateDecorations",!0)||fixes.push({issue:"Date decorations are disabled",description:"Enable date decorations",fix:__name(async()=>config.update("showDateDecorations",!0,vscode2.ConfigurationTarget.Global),"fix")});let excludedPatterns=config.get("excludedPatterns",[]);if(excludedPatterns.includes("**/*")&&fixes.push({issue:"All files are excluded by pattern",description:"Remove overly broad exclusion pattern",fix:__name(async()=>{let newPatterns=excludedPatterns.filter(p=>p!=="**/*");await config.update("excludedPatterns",newPatterns,vscode2.ConfigurationTarget.Global)},"fix")}),fixes.length===0){vscode2.window.showInformationMessage("No common issues detected. Decorations should be working.");return}let selected=await vscode2.window.showQuickPick(fixes.map(fix=>({label:fix.description,description:fix.issue,fix:fix.fix})),{placeHolder:"Select an issue to fix automatically"});selected&&(await selected.fix(),vscode2.window.showInformationMessage("Fixed! Try refreshing decorations now."),fileDateProvider&&(fileDateProvider.clearAllCaches(),fileDateProvider.refreshAll()))}catch(error){logger.error("Failed to run quick fix",error),vscode2.window.showErrorMessage(`Failed to run quick fix: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.showKeyboardShortcuts",async()=>{try{fileDateProvider?._accessibility?await fileDateProvider._accessibility.showKeyboardShortcutsHelp():vscode2.window.showInformationMessage("Keyboard shortcuts: Ctrl+Shift+D (toggle), Ctrl+Shift+C (copy date), Ctrl+Shift+I (file details), Ctrl+Shift+R (refresh), Ctrl+Shift+A (workspace activity)"),logger.info("Keyboard shortcuts help shown")}catch(error){logger.error("Failed to show keyboard shortcuts help",error),vscode2.window.showErrorMessage(`Failed to show keyboard shortcuts help: ${error.message}`)}})),subscriptions.forEach(disposable=>context.subscriptions.push(disposable))}__name(registerAnalysisCommands,"registerAnalysisCommands");module2.exports={registerAnalysisCommands}}});var require_onboardingCommands=__commonJS({"src/commands/onboardingCommands.js"(exports2,module2){var vscode2=require("vscode");function registerOnboardingCommands({context,logger,getOnboardingManager}){let subscriptions=[];subscriptions.push(vscode2.commands.registerCommand("explorerDates.showFeatureTour",async()=>{try{await getOnboardingManager().showFeatureTour(),logger.info("Feature tour opened")}catch(error){logger.error("Failed to show feature tour",error),vscode2.window.showErrorMessage(`Failed to show feature tour: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.showQuickSetup",async()=>{try{await getOnboardingManager().showQuickSetupWizard(),logger.info("Quick setup wizard opened")}catch(error){logger.error("Failed to show quick setup wizard",error),vscode2.window.showErrorMessage(`Failed to show quick setup wizard: ${error.message}`)}})),subscriptions.push(vscode2.commands.registerCommand("explorerDates.showWhatsNew",async()=>{try{let extensionVersion=context.extension.packageJSON.version;await getOnboardingManager().showWhatsNew(extensionVersion),logger.info("What's new panel opened")}catch(error){logger.error("Failed to show what's new",error),vscode2.window.showErrorMessage(`Failed to show what's new: ${error.message}`)}})),subscriptions.forEach(disposable=>context.subscriptions.push(disposable))}__name(registerOnboardingCommands,"registerOnboardingCommands");module2.exports={registerOnboardingCommands}}});var require_onboarding=__commonJS({"src/onboarding.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),{getLocalization}=require_localization(),_OnboardingManager=class _OnboardingManager{constructor(context){this._context=context,this._logger=getLogger(),this._l10n=getLocalization(),this._hasShownWelcome=context.globalState.get("explorerDates.hasShownWelcome",!1),this._hasCompletedSetup=context.globalState.get("explorerDates.hasCompletedSetup",!1),this._onboardingVersion=context.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this._hasShownWelcome,hasCompletedSetup:this._hasCompletedSetup,onboardingVersion:this._onboardingVersion})}async shouldShowOnboarding(){let extensionVersion=this._context.extension.packageJSON.version;return!this._hasShownWelcome||!this._hasCompletedSetup||this._shouldShowVersionUpdate(extensionVersion)}_shouldShowVersionUpdate(currentVersion){if(this._onboardingVersion==="0.0.0")return!0;let[currentMajor]=currentVersion.split(".").map(Number),[savedMajor]=this._onboardingVersion.split(".").map(Number);return currentMajor>savedMajor}_isMinorUpdate(currentVersion){if(this._onboardingVersion==="0.0.0")return!1;let[currentMajor,currentMinor]=currentVersion.split(".").map(Number),[savedMajor,savedMinor]=this._onboardingVersion.split(".").map(Number);return currentMajor===savedMajor&&currentMinor>savedMinor}async showWelcomeMessage(){try{let extensionVersion=this._context.extension.packageJSON.version,isUpdate=this._hasShownWelcome,isMinorUpdate=this._isMinorUpdate(extensionVersion);if(isMinorUpdate)return this._showGentleUpdateNotification(extensionVersion);let message=isUpdate?`Explorer Dates has been updated to v${extensionVersion} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!",actions=isUpdate?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"],action=await vscode2.window.showInformationMessage(message,{modal:!1},...actions);switch(await this._context.globalState.update("explorerDates.hasShownWelcome",!0),await this._context.globalState.update("explorerDates.onboardingVersion",extensionVersion),action){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(extensionVersion);break;case"\u2699\uFE0F Settings":await vscode2.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await vscode2.commands.executeCommand("explorerDates.previewConfiguration",message.settings);break;case"clearPreview":await vscode2.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action,isUpdate,isMinorUpdate})}catch(error){this._logger.error("Failed to show welcome message",error)}}async _showGentleUpdateNotification(version){let statusBarItem=vscode2.window.createStatusBarItem(vscode2.StatusBarAlignment.Right,100);statusBarItem.text=`$(check) Explorer Dates updated to v${version}`,statusBarItem.tooltip="Click to see what's new in Explorer Dates",statusBarItem.command="explorerDates.showWhatsNew",statusBarItem.show(),setTimeout(()=>{statusBarItem.dispose()},1e4),await this._context.globalState.update("explorerDates.onboardingVersion",version),this._logger.info("Showed gentle update notification",{version})}async showQuickSetupWizard(){try{let panel=vscode2.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",vscode2.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});panel.webview.html=this._generateSetupWizardHTML(),panel.webview.onDidReceiveMessage(async message=>{await this._handleSetupWizardMessage(message,panel)}),this._logger.info("Quick setup wizard opened")}catch(error){this._logger.error("Failed to show setup wizard",error)}}async _handleSetupWizardMessage(message,panel){try{switch(message.command){case"applyConfiguration":await this._applyQuickConfiguration(message.configuration),await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),vscode2.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),panel.dispose();break;case"previewConfiguration":message.settings&&(await vscode2.commands.executeCommand("explorerDates.previewConfiguration",message.settings),this._logger.info("Configuration preview applied via webview",message.settings));break;case"clearPreview":await vscode2.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),panel.dispose();break;case"openSettings":await vscode2.commands.executeCommand("workbench.action.openSettings","explorerDates"),panel.dispose();break}}catch(error){this._logger.error("Failed to handle setup wizard message",error)}}async _applyQuickConfiguration(configuration){let config=vscode2.workspace.getConfiguration("explorerDates");if(configuration.preset){let preset=this._getConfigurationPresets()[configuration.preset];if(preset){this._logger.info(`Applying preset: ${configuration.preset}`,preset.settings);for(let[key,value]of Object.entries(preset.settings))await config.update(key,value,vscode2.ConfigurationTarget.Global),this._logger.debug(`Updated setting: explorerDates.${key} = ${value}`);this._logger.info(`Applied preset: ${configuration.preset}`,preset.settings),vscode2.window.showInformationMessage(`Applied "${preset.name}" configuration. Changes should be visible immediately!`)}}if(configuration.individual){for(let[key,value]of Object.entries(configuration.individual))await config.update(key,value,vscode2.ConfigurationTarget.Global);this._logger.info("Applied individual settings",configuration.individual)}try{await vscode2.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(error){this._logger.warn("Failed to refresh decorations after configuration change",error)}}_getConfigurationPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:30,enableContextMenu:!0,showStatusBar:!0}},powerUser:{name:"Power User",description:"Maximum information - all features enabled with vibrant colors",settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"both",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:14,enableContextMenu:!0,showStatusBar:!0,smartExclusions:!0,progressiveLoading:!0,persistentCache:!0}},gitFocused:{name:"Git-Focused",description:"Show author initials as badges with full Git information in tooltips",settings:{dateDecorationFormat:"smart",colorScheme:"file-type",highContrastMode:!1,showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}async showFeatureTour(){try{let panel=vscode2.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",vscode2.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});panel.webview.html=this._generateFeatureTourHTML(),panel.webview.onDidReceiveMessage(async message=>{message.command==="openSettings"?await vscode2.commands.executeCommand("workbench.action.openSettings",message.setting||"explorerDates"):message.command==="runCommand"&&await vscode2.commands.executeCommand(message.commandId)}),this._logger.info("Feature tour opened")}catch(error){this._logger.error("Failed to show feature tour",error)}}_generateSetupWizardHTML(){let allPresets=this._getConfigurationPresets(),simplifiedPresets={minimal:allPresets.minimal,developer:allPresets.developer,accessible:allPresets.accessible};return`
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
                    
                    ${Object.entries(simplifiedPresets).map(([key,preset])=>`
            <div class="preset-option" data-preset="${key}" 
                 onmouseenter="previewConfiguration({preset: '${key}'})" 
                 onmouseleave="clearPreview()">
                <h3>${preset.name}</h3>
                <p>${preset.description}</p>
                <div class="preset-actions">
                    <button onclick="previewConfiguration({preset: '${key}'})">\u{1F441}\uFE0F Preview</button>
                    <button onclick="applyConfiguration({preset: '${key}'})">\u2705 Select ${preset.name}</button>
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
                        const presets = ${JSON.stringify(simplifiedPresets)};
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
        `}async showTipsAndTricks(){let tips=[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."},{icon:"\u{1F4CA}",title:"Performance Analytics",description:'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'},{icon:"\u{1F50D}",title:"Context Menu",description:"Right-click any file to access Git history, file details, and quick actions."}],selectedTip=tips[Math.floor(Math.random()*tips.length)],message=`\u{1F4A1} **Tip**: ${selectedTip.title}
${selectedTip.description}`;await vscode2.window.showInformationMessage(message,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(version){try{let panel=vscode2.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${version} - What's New`,vscode2.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1});panel.webview.html=this._generateWhatsNewHTML(version),panel.webview.onDidReceiveMessage(async message=>{switch(message.command){case"openSettings":await vscode2.commands.executeCommand("workbench.action.openSettings","explorerDates"),panel.dispose();break;case"tryFeature":message.feature==="badgePriority"&&(await vscode2.workspace.getConfiguration("explorerDates").update("badgePriority","author",vscode2.ConfigurationTarget.Global),vscode2.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":panel.dispose();break}})}catch(error){this._logger.error("Failed to show what's new",error)}}_generateWhatsNewHTML(version){return`
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
                    <div class="version">Explorer Dates v${version}</div>
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
        `}};__name(_OnboardingManager,"OnboardingManager");var OnboardingManager=_OnboardingManager;module2.exports={OnboardingManager}}});var require_workspaceTemplates=__commonJS({"src/workspaceTemplates.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),{fileSystem:fileSystem2}=require_FileSystemAdapter(),{GLOBAL_STATE_KEYS}=require_constants(),logger=getLogger(),_WorkspaceTemplatesManager=class _WorkspaceTemplatesManager{constructor(context){this._context=context,this._storage=context?.globalState||null,this._storageKey=GLOBAL_STATE_KEYS.TEMPLATE_STORE,this._fs=fileSystem2,this.templatesPath=null,this.builtInTemplates=this.getBuiltInTemplates(),logger.info("Workspace Templates Manager initialized")}_getStoredTemplates(){return this._storage?this._storage.get(this._storageKey,{}):{}}async _saveStoredTemplates(templates){if(!this._storage)throw new Error("Template storage unavailable");await this._storage.update(this._storageKey,templates)}_getTemplate(templateId){return this.builtInTemplates[templateId]?this.builtInTemplates[templateId]:this._getStoredTemplates()[templateId]}getBuiltInTemplates(){return{"web-development":{name:"Web Development",description:"Optimized for web projects with focus on source files",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"file-type","explorerDates.showFileSize":!0,"explorerDates.fadeOldFiles":!0,"explorerDates.fadeThreshold":14,"explorerDates.excludedPatterns":["**/node_modules/**","**/dist/**","**/build/**","**/.next/**","**/coverage/**"],"explorerDates.enableContextMenu":!0,"explorerDates.showGitInfo":"author"}},"data-science":{name:"Data Science",description:"Focused on notebooks and data files with detailed timestamps",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"absolute-long","explorerDates.colorScheme":"none","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"none","explorerDates.highContrastMode":!1,"explorerDates.excludedPatterns":["**/__pycache__/**","**/.ipynb_checkpoints/**","**/data/raw/**"],"explorerDates.badgePriority":"size"}},documentation:{name:"Documentation",description:"Clean display for documentation projects",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"subtle","explorerDates.showFileSize":!1,"explorerDates.excludedPatterns":["**/node_modules/**","**/.git/**"],"explorerDates.fadeOldFiles":!1,"explorerDates.enableContextMenu":!1}},enterprise:{name:"Enterprise",description:"Full feature set with Git integration and analytics",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"smart","explorerDates.colorScheme":"recency","explorerDates.showFileSize":!0,"explorerDates.showGitInfo":"author","explorerDates.enableContextMenu":!0,"explorerDates.showStatusBar":!0,"explorerDates.smartExclusions":!0,"explorerDates.progressiveLoading":!0,"explorerDates.persistentCache":!0,"explorerDates.enableReporting":!0}},minimal:{name:"Minimal",description:"Clean, distraction-free setup",settings:{"explorerDates.showDateDecorations":!0,"explorerDates.dateDecorationFormat":"relative-short","explorerDates.colorScheme":"none","explorerDates.showFileSize":!1,"explorerDates.badgePriority":"time","explorerDates.enableContextMenu":!1,"explorerDates.progressiveLoading":!1}}}}async saveCurrentConfiguration(templateName,description=""){try{let config=vscode2.workspace.getConfiguration("explorerDates"),settings={},inspect=config.inspect();if(inspect)for(let[key,value]of Object.entries(inspect))value&&typeof value=="object"&&"workspaceValue"in value?settings[`explorerDates.${key}`]=value.workspaceValue:value&&typeof value=="object"&&"globalValue"in value&&(settings[`explorerDates.${key}`]=value.globalValue);let template={name:templateName,description,createdAt:new Date().toISOString(),version:"1.0.0",settings},templateId=templateName.toLowerCase().replace(/[^a-z0-9-]/g,"-"),storedTemplates=this._getStoredTemplates();storedTemplates[templateId]=template,await this._saveStoredTemplates(storedTemplates);let syncPath=config.get("templateSyncPath","");if(syncPath&&!this._fs.isWeb)try{let targetPath=`${syncPath.replace(/[/\\]?$/,"")}/${templateId}.json`;await this._fs.writeFile(targetPath,JSON.stringify(template,null,2)),logger.info(`Synced template to ${targetPath}`)}catch(syncError){logger.warn("Failed to sync template to disk path",syncError)}return vscode2.window.showInformationMessage(`Template "${templateName}" saved successfully!`),logger.info(`Saved workspace template: ${templateName}`),!0}catch(error){return logger.error("Failed to save template:",error),vscode2.window.showErrorMessage(`Failed to save template: ${error.message}`),!1}}async loadTemplate(templateId){try{let template=this._getTemplate(templateId);if(!template)throw new Error(`Template "${templateId}" not found`);let config=vscode2.workspace.getConfiguration();for(let[key,value]of Object.entries(template.settings))await config.update(key,value,vscode2.ConfigurationTarget.Workspace);return vscode2.window.showInformationMessage(`Template "${template.name}" applied successfully!`),logger.info(`Applied workspace template: ${template.name}`),!0}catch(error){return logger.error("Failed to load template:",error),vscode2.window.showErrorMessage(`Failed to load template: ${error.message}`),!1}}async getAvailableTemplates(){let templates=[];for(let[id,template]of Object.entries(this.builtInTemplates))templates.push({id,name:template.name,description:template.description,type:"built-in",createdAt:null});try{let storedTemplates=this._getStoredTemplates();for(let[id,template]of Object.entries(storedTemplates))templates.push({id,name:template.name,description:template.description,type:"custom",createdAt:template.createdAt})}catch(error){logger.error("Failed to load custom templates:",error)}return templates}async deleteTemplate(templateId){try{if(this.builtInTemplates[templateId])return vscode2.window.showErrorMessage("Cannot delete built-in templates"),!1;let storedTemplates=this._getStoredTemplates();if(!storedTemplates[templateId])throw new Error(`Template "${templateId}" not found`);return delete storedTemplates[templateId],await this._saveStoredTemplates(storedTemplates),vscode2.window.showInformationMessage(`Template "${templateId}" deleted successfully!`),logger.info(`Deleted workspace template: ${templateId}`),!0}catch(error){return logger.error("Failed to delete template:",error),vscode2.window.showErrorMessage(`Failed to delete template: ${error.message}`),!1}}async exportTemplate(templateId,exportTarget){try{let template=this._getTemplate(templateId);if(!template)throw new Error(`Template "${templateId}" not found`);let payload=JSON.stringify(template,null,2);if(this._fs.isWeb){let encoded=encodeURIComponent(payload);return await vscode2.env.openExternal(vscode2.Uri.parse(`data:application/json;charset=utf-8,${encoded}`)),vscode2.window.showInformationMessage("Template download triggered in browser"),!0}let targetPath=exportTarget instanceof vscode2.Uri?exportTarget.fsPath:exportTarget;return await this._fs.writeFile(targetPath,payload),vscode2.window.showInformationMessage(`Template exported to ${targetPath}`),logger.info(`Exported template ${templateId} to ${targetPath}`),!0}catch(error){return logger.error("Failed to export template:",error),vscode2.window.showErrorMessage(`Failed to export template: ${error.message}`),!1}}async importTemplate(importTarget){try{let target=importTarget instanceof vscode2.Uri?importTarget:vscode2.Uri.file(importTarget),templateData=await this._fs.readFile(target,"utf8"),template=JSON.parse(templateData);if(!template.name||!template.settings)throw new Error("Invalid template format");let templateName=template.name.toLowerCase().replace(/[^a-z0-9-]/g,"-"),storedTemplates=this._getStoredTemplates();return storedTemplates[templateName]=template,await this._saveStoredTemplates(storedTemplates),vscode2.window.showInformationMessage(`Template "${template.name}" imported successfully!`),logger.info(`Imported template: ${template.name}`),!0}catch(error){return logger.error("Failed to import template:",error),vscode2.window.showErrorMessage(`Failed to import template: ${error.message}`),!1}}async showTemplateManager(){try{let templates=await this.getAvailableTemplates(),panel=vscode2.window.createWebviewPanel("templateManager","Explorer Dates - Template Manager",vscode2.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});panel.webview.html=this.getTemplateManagerHtml(templates),panel.webview.onDidReceiveMessage(async message=>{switch(message.command){case"loadTemplate":await this.loadTemplate(message.templateId);break;case"deleteTemplate":{await this.deleteTemplate(message.templateId);let updatedTemplates=await this.getAvailableTemplates();panel.webview.postMessage({command:"refreshTemplates",templates:updatedTemplates});break}case"exportTemplate":{let result=await vscode2.window.showSaveDialog({defaultUri:vscode2.Uri.file(`${message.templateId}.json`),filters:{JSON:["json"]}});result&&await this.exportTemplate(message.templateId,result);break}case"saveConfig":{await this.saveCurrentConfiguration(message.name,message.description);let updatedTemplates=await this.getAvailableTemplates();panel.webview.postMessage({command:"refreshTemplates",templates:updatedTemplates});break}case"importTemplate":{let result=await vscode2.window.showOpenDialog({canSelectMany:!1,filters:{JSON:["json"]}});if(result&&result[0]){await this.importTemplate(result[0]);let updatedTemplates=await this.getAvailableTemplates();panel.webview.postMessage({command:"refreshTemplates",templates:updatedTemplates})}break}}}),logger.info("Template Manager opened")}catch(error){logger.error("Failed to show template manager:",error),vscode2.window.showErrorMessage("Failed to open Template Manager")}}getTemplateManagerHtml(templates){return`<!DOCTYPE html>
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
                ${templates.map(template=>`
            <div class="template-item ${template.type}">
                <div class="template-header">
                    <h3>${template.name}</h3>
                    <span class="template-type">${template.type}</span>
                </div>
                <p class="template-description">${template.description}</p>
                ${template.createdAt?`<small>Created: ${new Date(template.createdAt).toLocaleDateString()}</small>`:""}
                <div class="template-actions">
                    <button onclick="loadTemplate('${template.id}')">Apply</button>
                    <button onclick="exportTemplate('${template.id}')">Export</button>
                    ${template.type==="custom"?`<button onclick="deleteTemplate('${template.id}')" class="delete">Delete</button>`:""}
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
        </html>`}};__name(_WorkspaceTemplatesManager,"WorkspaceTemplatesManager");var WorkspaceTemplatesManager=_WorkspaceTemplatesManager;module2.exports={WorkspaceTemplatesManager}}});var require_extensionApi=__commonJS({"src/extensionApi.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),_BaseEventEmitter=class _BaseEventEmitter{constructor(){this._listeners=new Map}on(event,listener){let handlers=this._listeners.get(event)||[];return handlers.push(listener),this._listeners.set(event,handlers),this}off(event,listener){let handlers=this._listeners.get(event);if(!handlers)return this;let index=handlers.indexOf(listener);return index!==-1&&handlers.splice(index,1),this}emit(event,...args){let handlers=this._listeners.get(event);return handlers&&handlers.slice().forEach(handler=>{try{handler(...args)}catch(error){console.error(`Explorer Dates API handler failed for "${event}":`,error)}}),this}};__name(_BaseEventEmitter,"BaseEventEmitter");var BaseEventEmitter=_BaseEventEmitter,logger=getLogger(),_ExtensionApiManager=class _ExtensionApiManager extends BaseEventEmitter{constructor(){super(),this.plugins=new Map,this.api=null,this.decorationProviders=new Map,this.initialize(),this._setupConfigurationListener()}initialize(){this.api=this.createPublicApi(),logger.info("Extension API Manager initialized")}createPublicApi(){return{getFileDecorations:this.getFileDecorations.bind(this),refreshDecorations:this.refreshDecorations.bind(this),registerPlugin:this.registerPlugin.bind(this),unregisterPlugin:this.unregisterPlugin.bind(this),registerDecorationProvider:this.registerDecorationProvider.bind(this),unregisterDecorationProvider:this.unregisterDecorationProvider.bind(this),onDecorationChanged:this.onDecorationChanged.bind(this),onFileScanned:this.onFileScanned.bind(this),formatDate:this.formatDate.bind(this),getFileStats:this.getFileStats.bind(this),version:"1.1.0",apiVersion:"1.0.0"}}async getFileDecorations(filePaths){if(!this._isApiUsable("getFileDecorations"))return[];try{let decorations=[];for(let filePath of filePaths){let uri=vscode2.Uri.file(filePath),decoration=await this.getDecorationForFile(uri);decoration&&decorations.push({uri:uri.toString(),decoration})}return decorations}catch(error){return logger.error("Failed to get file decorations:",error),[]}}async getDecorationForFile(uri){if(!this._isApiUsable("getDecorationForFile"))return null;try{let stat=await vscode2.workspace.fs.stat(uri),lastModified=new Date(stat.mtime),decoration={badge:this.formatDate(lastModified,"smart"),color:void 0,tooltip:`Modified: ${lastModified.toLocaleString()}`};for(let[providerId,provider]of this.decorationProviders)try{let customDecoration=await provider.provideDecoration(uri,stat,decoration);customDecoration&&(decoration={...decoration,...customDecoration})}catch(error){logger.error(`Decoration provider ${providerId} failed:`,error)}return decoration}catch(error){return logger.error("Failed to get decoration for file:",error),null}}async refreshDecorations(filePaths=null){if(!this._isApiUsable("refreshDecorations"))return!1;try{return this.emit("decorationRefreshRequested",filePaths),logger.info("Decoration refresh requested"),!0}catch(error){return logger.error("Failed to refresh decorations:",error),!1}}registerPlugin(pluginId,plugin){if(!this._canUsePlugins(`registerPlugin:${pluginId}`))return!1;try{if(!this.validatePlugin(plugin))throw new Error("Invalid plugin structure");return this.plugins.set(pluginId,{...plugin,registeredAt:new Date,active:!0}),typeof plugin.activate=="function"&&plugin.activate(this.api),this.emit("pluginRegistered",{pluginId,plugin}),logger.info(`Plugin registered: ${pluginId}`),!0}catch(error){return logger.error(`Failed to register plugin ${pluginId}:`,error),!1}}unregisterPlugin(pluginId){if(!this._canUsePlugins(`unregisterPlugin:${pluginId}`))return!1;try{let plugin=this.plugins.get(pluginId);return plugin?(typeof plugin.deactivate=="function"&&plugin.deactivate(),this.plugins.delete(pluginId),this.emit("pluginUnregistered",{pluginId}),logger.info(`Plugin unregistered: ${pluginId}`),!0):!1}catch(error){return logger.error(`Failed to unregister plugin ${pluginId}:`,error),!1}}registerDecorationProvider(providerId,provider){if(!this._canUsePlugins(`registerDecorationProvider:${providerId}`))return!1;try{if(!this.validateDecorationProvider(provider))throw new Error("Invalid decoration provider");return this.decorationProviders.set(providerId,provider),this.emit("decorationProviderRegistered",{providerId,provider}),logger.info(`Decoration provider registered: ${providerId}`),!0}catch(error){return logger.error(`Failed to register decoration provider ${providerId}:`,error),!1}}unregisterDecorationProvider(providerId){if(!this._canUsePlugins(`unregisterDecorationProvider:${providerId}`))return!1;try{let removed=this.decorationProviders.delete(providerId);return removed&&(this.emit("decorationProviderUnregistered",{providerId}),logger.info(`Decoration provider unregistered: ${providerId}`)),removed}catch(error){return logger.error(`Failed to unregister decoration provider ${providerId}:`,error),!1}}onDecorationChanged(callback){return this.on("decorationChanged",callback),()=>this.off("decorationChanged",callback)}onFileScanned(callback){return this.on("fileScanned",callback),()=>this.off("fileScanned",callback)}formatDate(date,format=null){if(!this._isApiUsable("formatDate"))return"";try{let config=vscode2.workspace.getConfiguration("explorerDates"),displayFormat=format||config.get("displayFormat","smart"),diffMs=new Date-date,diffDays=Math.floor(diffMs/(1e3*60*60*24));switch(displayFormat){case"relative-short":return this.getRelativeTimeShort(diffMs);case"relative-long":return this.getRelativeTimeLong(diffMs);case"absolute-short":return date.toLocaleDateString("en-US",{month:"short",day:"numeric"});case"absolute-long":return date.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});case"smart":default:return diffDays<7?this.getRelativeTimeShort(diffMs):date.toLocaleDateString("en-US",{month:"short",day:"numeric"})}}catch(error){return logger.error("Failed to format date:",error),date.toLocaleDateString()}}async getFileStats(filePath){if(!this._isApiUsable("getFileStats"))return null;try{let uri=vscode2.Uri.file(filePath),stat=await vscode2.workspace.fs.stat(uri);return{path:filePath,size:stat.size,created:new Date(stat.ctime),modified:new Date(stat.mtime),type:stat.type===vscode2.FileType.Directory?"directory":"file"}}catch(error){return logger.error("Failed to get file stats:",error),null}}getApi(){return this.api}getRegisteredPlugins(){let plugins=[];for(let[id,plugin]of this.plugins)plugins.push({id,name:plugin.name,version:plugin.version,author:plugin.author,active:plugin.active,registeredAt:plugin.registeredAt});return plugins}validatePlugin(plugin){return!(!plugin||typeof plugin!="object"||!plugin.name||!plugin.version||plugin.activate&&typeof plugin.activate!="function"||plugin.deactivate&&typeof plugin.deactivate!="function")}validateDecorationProvider(provider){return!(!provider||typeof provider!="object"||typeof provider.provideDecoration!="function")}getRelativeTimeShort(diffMs){let diffSeconds=Math.floor(diffMs/1e3),diffMinutes=Math.floor(diffSeconds/60),diffHours=Math.floor(diffMinutes/60),diffDays=Math.floor(diffHours/24);if(diffSeconds<60)return`${diffSeconds}s`;if(diffMinutes<60)return`${diffMinutes}m`;if(diffHours<24)return`${diffHours}h`;if(diffDays<30)return`${diffDays}d`;let diffMonths=Math.floor(diffDays/30);return diffMonths<12?`${diffMonths}mo`:`${Math.floor(diffMonths/12)}y`}getRelativeTimeLong(diffMs){let diffSeconds=Math.floor(diffMs/1e3),diffMinutes=Math.floor(diffSeconds/60),diffHours=Math.floor(diffMinutes/60),diffDays=Math.floor(diffHours/24);if(diffSeconds<60)return`${diffSeconds} second${diffSeconds!==1?"s":""} ago`;if(diffMinutes<60)return`${diffMinutes} minute${diffMinutes!==1?"s":""} ago`;if(diffHours<24)return`${diffHours} hour${diffHours!==1?"s":""} ago`;if(diffDays<30)return`${diffDays} day${diffDays!==1?"s":""} ago`;let diffMonths=Math.floor(diffDays/30);if(diffMonths<12)return`${diffMonths} month${diffMonths!==1?"s":""} ago`;let diffYears=Math.floor(diffMonths/12);return`${diffYears} year${diffYears!==1?"s":""} ago`}getColorForAge(date){if(!vscode2.workspace.getConfiguration("explorerDates").get("colorCoding",!1))return;let diffHours=(new Date-date)/(1e3*60*60);return diffHours<1?new vscode2.ThemeColor("charts.green"):diffHours<24?new vscode2.ThemeColor("charts.yellow"):diffHours<168?new vscode2.ThemeColor("charts.orange"):new vscode2.ThemeColor("charts.red")}createExamplePlugin(){return{name:"File Size Display",version:"1.0.0",author:"Explorer Dates",description:"Adds file size to decorations",activate:__name(api=>{api.registerDecorationProvider("fileSize",{provideDecoration:__name(async(uri,stat,currentDecoration)=>{let size=this.formatFileSize(stat.size);return{badge:`${currentDecoration.badge} \u2022 ${size}`,tooltip:`${currentDecoration.tooltip}
Size: ${size}`}},"provideDecoration")}),console.log("File Size Display plugin activated")},"activate"),deactivate:__name(()=>{console.log("File Size Display plugin deactivated")},"deactivate")}}_setupConfigurationListener(){vscode2.workspace.onDidChangeConfiguration(event=>{(event.affectsConfiguration("explorerDates.enableExtensionApi")||event.affectsConfiguration("explorerDates.allowExternalPlugins"))&&logger.info("Explorer Dates API configuration changed",{apiEnabled:this._isApiEnabled(),externalPluginsAllowed:this._allowsExternalPlugins()})})}_isApiEnabled(){return vscode2.workspace.getConfiguration("explorerDates").get("enableExtensionApi",!0)}_allowsExternalPlugins(){return vscode2.workspace.getConfiguration("explorerDates").get("allowExternalPlugins",!0)}_isApiUsable(featureName){return this._isApiEnabled()?!0:(logger.warn(`Explorer Dates API request "${featureName}" ignored because enableExtensionApi is disabled.`),!1)}_canUsePlugins(featureName){return this._isApiUsable(featureName)?this._allowsExternalPlugins()?!0:(logger.warn(`Explorer Dates plugin request "${featureName}" ignored because allowExternalPlugins is disabled.`),!1):!1}formatFileSize(bytes){if(bytes===0)return"0 B";let k=1024,sizes=["B","KB","MB","GB"],i=Math.floor(Math.log(bytes)/Math.log(k));return parseFloat((bytes/Math.pow(k,i)).toFixed(1))+" "+sizes[i]}};__name(_ExtensionApiManager,"ExtensionApiManager");var ExtensionApiManager=_ExtensionApiManager;module2.exports={ExtensionApiManager}}});var require_exportReporting=__commonJS({"src/exportReporting.js"(exports2,module2){var vscode2=require("vscode"),{getLogger}=require_logger(),{fileSystem:fileSystem2}=require_FileSystemAdapter(),{getExtension,normalizePath}=require_pathUtils(),logger=getLogger(),isWeb2=!0,_ExportReportingManager=class _ExportReportingManager{constructor(){this.fileActivityCache=new Map,this.allowedFormats=["json","csv","html","markdown"],this.activityTrackingDays=30,this.activityCutoffMs=null,this.timeTrackingIntegration="none",this._loadConfiguration(),this._setupConfigurationWatcher(),this.initialize()}_loadConfiguration(){try{let config=vscode2.workspace.getConfiguration("explorerDates"),configuredFormats=config.get("reportFormats",["json","html"]),defaults=["json","csv","html","markdown"];this.allowedFormats=Array.from(new Set([...configuredFormats,...defaults]));let days=config.get("activityTrackingDays",30);this.activityTrackingDays=Math.max(1,Math.min(365,days)),this.activityCutoffMs=this.activityTrackingDays*24*60*60*1e3,this.timeTrackingIntegration=config.get("timeTrackingIntegration","none")}catch(error){logger.error("Failed to load reporting configuration",error)}}_setupConfigurationWatcher(){vscode2.workspace.onDidChangeConfiguration(event=>{(event.affectsConfiguration("explorerDates.reportFormats")||event.affectsConfiguration("explorerDates.activityTrackingDays")||event.affectsConfiguration("explorerDates.timeTrackingIntegration"))&&(this._loadConfiguration(),logger.info("Reporting configuration updated",{allowedFormats:this.allowedFormats,activityTrackingDays:this.activityTrackingDays,timeTrackingIntegration:this.timeTrackingIntegration}))})}async initialize(){try{this.startFileWatcher(),logger.info("Export & Reporting Manager initialized")}catch(error){logger.error("Failed to initialize Export & Reporting Manager:",error)}}startFileWatcher(){let watcher=vscode2.workspace.createFileSystemWatcher("**/*");watcher.onDidChange(uri=>{this.recordFileActivity(uri,"modified")}),watcher.onDidCreate(uri=>{this.recordFileActivity(uri,"created")}),watcher.onDidDelete(uri=>{this.recordFileActivity(uri,"deleted")})}recordFileActivity(uri,action){try{let filePath=uri.fsPath||uri.path,timestamp=new Date;this.fileActivityCache.has(filePath)||this.fileActivityCache.set(filePath,[]),this.fileActivityCache.get(filePath).push({action,timestamp,path:filePath}),this._enforceActivityRetention(filePath)}catch(error){logger.error("Failed to record file activity:",error)}}_enforceActivityRetention(filePath){let activities=this.fileActivityCache.get(filePath);if(!(!activities||activities.length===0)){if(this.activityCutoffMs){let cutoff=new Date(Date.now()-this.activityCutoffMs);for(;activities.length&&activities[0].timestamp<cutoff;)activities.shift()}activities.length>100&&activities.splice(0,activities.length-100)}}async generateFileModificationReport(options={}){try{let{format="json",timeRange="all",includeDeleted=!1,outputPath=null}=options;if(!this.allowedFormats.includes(format)){let warning=`Report format "${format}" is disabled. Allowed formats: ${this.allowedFormats.join(", ")}`;return vscode2.window.showWarningMessage(warning),logger.warn(warning),null}let report=await this.collectFileData(timeRange,includeDeleted),formattedReport=await this.formatReport(report,format);return outputPath&&(await this.saveReport(formattedReport,outputPath),vscode2.window.showInformationMessage(`Report saved to ${outputPath}`)),formattedReport}catch(error){return logger.error("Failed to generate file modification report:",error),vscode2.window.showErrorMessage("Failed to generate report"),null}}async collectFileData(timeRange,includeDeleted){let files=[],workspaceFolders=vscode2.workspace.workspaceFolders;if(!workspaceFolders)return{files:[],summary:this.createSummary([])};for(let folder of workspaceFolders){let folderFiles=await this.scanWorkspaceFolder(folder.uri,timeRange,includeDeleted);files.push(...folderFiles)}let summary=this.createSummary(files);return summary.integrationTarget=this.timeTrackingIntegration,summary.activityTrackingDays=this.activityTrackingDays,{generatedAt:new Date().toISOString(),workspace:workspaceFolders.map(f=>f.uri.fsPath),timeRange,files,summary}}async scanWorkspaceFolder(folderUri,timeRange,includeDeleted){let files=[],excludePatterns=vscode2.workspace.getConfiguration("explorerDates").get("excludedPatterns",[]);try{let entries=await vscode2.workspace.fs.readDirectory(folderUri);for(let[name,type]of entries){let fileUri=vscode2.Uri.joinPath(folderUri,name),relativePath=vscode2.workspace.asRelativePath(fileUri);if(!this.isExcluded(relativePath,excludePatterns)){if(type===vscode2.FileType.File){let fileData=await this.getFileData(fileUri,timeRange);fileData&&files.push(fileData)}else if(type===vscode2.FileType.Directory){let subFiles=await this.scanWorkspaceFolder(fileUri,timeRange,includeDeleted);files.push(...subFiles)}}}if(includeDeleted&&folderUri.fsPath){let deletedFiles=this.getDeletedFiles(folderUri.fsPath,timeRange);files.push(...deletedFiles)}}catch(error){logger.error(`Failed to scan folder ${folderUri.fsPath||folderUri.path}:`,error)}return files}async getFileData(uri,timeRange){try{let stat=await vscode2.workspace.fs.stat(uri),relativePath=vscode2.workspace.asRelativePath(uri),cacheKey=uri.fsPath||uri.path,activities=this.fileActivityCache.get(cacheKey)||[],filteredActivities=this.filterActivitiesByTimeRange(activities,timeRange);return{path:relativePath,fullPath:cacheKey,size:stat.size,created:new Date(stat.ctime),modified:new Date(stat.mtime),type:this.getFileType(relativePath),extension:getExtension(relativePath),activities:filteredActivities,activityCount:filteredActivities.length,lastActivity:filteredActivities.length>0?filteredActivities[filteredActivities.length-1].timestamp:new Date(stat.mtime)}}catch(error){return logger.error(`Failed to get file data for ${uri.fsPath||uri.path}:`,error),null}}filterActivitiesByTimeRange(activities,timeRange){let filtered=activities;if(timeRange!=="all"){let now=new Date,cutoff;switch(timeRange){case"24h":cutoff=new Date(now-1440*60*1e3);break;case"7d":cutoff=new Date(now-10080*60*1e3);break;case"30d":cutoff=new Date(now-720*60*60*1e3);break;case"90d":cutoff=new Date(now-2160*60*60*1e3);break;default:cutoff=null}cutoff&&(filtered=filtered.filter(activity=>activity.timestamp>=cutoff))}if(this.activityCutoffMs){let retentionCutoff=new Date(Date.now()-this.activityCutoffMs);filtered=filtered.filter(activity=>activity.timestamp>=retentionCutoff)}return filtered}getDeletedFiles(folderPath,timeRange){if(!folderPath)return[];let deletedFiles=[];for(let[filePath,activities]of this.fileActivityCache)if(filePath.startsWith(folderPath)){let deleteActivities=activities.filter(a=>a.action==="deleted"),filteredDeletes=this.filterActivitiesByTimeRange(deleteActivities,timeRange);filteredDeletes.length>0&&deletedFiles.push({path:vscode2.workspace.asRelativePath(filePath),fullPath:filePath,size:0,created:null,modified:null,type:"deleted",extension:getExtension(filePath),activities:filteredDeletes,activityCount:filteredDeletes.length,lastActivity:filteredDeletes[filteredDeletes.length-1].timestamp})}return deletedFiles}createSummary(files){let summary={totalFiles:files.length,totalSize:files.reduce((sum,file)=>sum+(file.size||0),0),fileTypes:{},activityByDay:{},mostActiveFiles:[],recentlyModified:[],largestFiles:[],oldestFiles:[]};files.forEach(file=>{let type=file.type||"unknown";summary.fileTypes[type]=(summary.fileTypes[type]||0)+1});let retentionWindow=new Date(Date.now()-this.activityTrackingDays*24*60*60*1e3);return files.forEach(file=>{file.activities.forEach(activity=>{if(activity.timestamp>=retentionWindow){let day=activity.timestamp.toISOString().split("T")[0];summary.activityByDay[day]=(summary.activityByDay[day]||0)+1}})}),summary.mostActiveFiles=files.sort((a,b)=>b.activityCount-a.activityCount).slice(0,10).map(file=>({path:file.path,activityCount:file.activityCount,lastActivity:file.lastActivity})),summary.recentlyModified=files.filter(file=>file.modified).sort((a,b)=>b.modified-a.modified).slice(0,20).map(file=>({path:file.path,modified:file.modified,size:file.size})),summary.largestFiles=files.sort((a,b)=>(b.size||0)-(a.size||0)).slice(0,10).map(file=>({path:file.path,size:file.size,modified:file.modified})),summary.oldestFiles=files.filter(file=>file.modified).sort((a,b)=>a.modified-b.modified).slice(0,10).map(file=>({path:file.path,modified:file.modified,size:file.size})),summary}async formatReport(report,format){switch(format.toLowerCase()){case"json":return JSON.stringify(report,null,2);case"csv":return this.formatAsCSV(report);case"html":return this.formatAsHTML(report);case"markdown":return this.formatAsMarkdown(report);default:throw new Error(`Unsupported format: ${format}`)}}formatAsCSV(report){let lines=["Path,Size,Created,Modified,Type,Extension,ActivityCount,LastActivity"];return report.files.forEach(file=>{lines.push([file.path,file.size||0,file.created?file.created.toISOString():"",file.modified?file.modified.toISOString():"",file.type,file.extension,file.activityCount,file.lastActivity?file.lastActivity.toISOString():""].join(","))}),lines.join(`
`)}formatAsHTML(report){return`<!DOCTYPE html>
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
    <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Files:</strong> ${report.summary.totalFiles}</p>
        <p><strong>Total Size:</strong> ${this.formatFileSize(report.summary.totalSize)}</p>
        <p><strong>Time Range:</strong> ${report.timeRange}</p>
    </div>
    
    <h2>File Types</h2>
    <table>
        <tr><th>Type</th><th>Count</th></tr>
        ${Object.entries(report.summary.fileTypes).map(([type,count])=>`<tr><td>${type}</td><td>${count}</td></tr>`).join("")}
    </table>
    
    <h2>Most Active Files</h2>
    <table>
        <tr><th>Path</th><th>Activity Count</th><th>Last Activity</th></tr>
        ${report.summary.mostActiveFiles.map(file=>`<tr><td>${file.path}</td><td>${file.activityCount}</td><td>${new Date(file.lastActivity).toLocaleString()}</td></tr>`).join("")}
    </table>
    
    <h2>All Files</h2>
    <table>
        <tr><th>Path</th><th>Size</th><th>Modified</th><th>Type</th><th>Activity Count</th></tr>
        ${report.files.map(file=>`<tr>
                <td>${file.path}</td>
                <td>${this.formatFileSize(file.size||0)}</td>
                <td>${file.modified?new Date(file.modified).toLocaleString():"N/A"}</td>
                <td>${file.type}</td>
                <td>${file.activityCount}</td>
            </tr>`).join("")}
    </table>
</body>
</html>`}formatAsMarkdown(report){return`# File Modification Report

**Generated:** ${new Date(report.generatedAt).toLocaleString()}
**Time Range:** ${report.timeRange}

## Summary

- **Total Files:** ${report.summary.totalFiles}
- **Total Size:** ${this.formatFileSize(report.summary.totalSize)}

## File Types

| Type | Count |
|------|-------|
${Object.entries(report.summary.fileTypes).map(([type,count])=>`| ${type} | ${count} |`).join(`
`)}

## Most Active Files

| Path | Activity Count | Last Activity |
|------|----------------|---------------|
${report.summary.mostActiveFiles.map(file=>`| ${file.path} | ${file.activityCount} | ${new Date(file.lastActivity).toLocaleString()} |`).join(`
`)}

## Recently Modified Files

| Path | Modified | Size |
|------|----------|------|
${report.summary.recentlyModified.map(file=>`| ${file.path} | ${new Date(file.modified).toLocaleString()} | ${this.formatFileSize(file.size)} |`).join(`
`)}

## All Files

| Path | Size | Modified | Type | Activities |
|------|------|----------|------|------------|
${report.files.map(file=>`| ${file.path} | ${this.formatFileSize(file.size||0)} | ${file.modified?new Date(file.modified).toLocaleString():"N/A"} | ${file.type} | ${file.activityCount} |`).join(`
`)}
`}async saveReport(content,outputPath){try{if(isWeb2){let encoded=encodeURIComponent(content);await vscode2.env.openExternal(vscode2.Uri.parse(`data:text/plain;charset=utf-8,${encoded}`)),vscode2.window.showInformationMessage("Report download triggered in browser");return}let target=outputPath instanceof vscode2.Uri?outputPath:vscode2.Uri.file(outputPath);await fileSystem2.writeFile(target,content,"utf8"),logger.info(`Report saved to ${target.fsPath||target.path}`)}catch(error){throw logger.error("Failed to save report:",error),error}}async exportToTimeTrackingTools(options={}){try{let{tool="generic",timeRange="7d"}=options,report=await this.collectFileData(timeRange,!1);return this.formatForTimeTracking(report,tool)}catch(error){return logger.error("Failed to export to time tracking tools:",error),null}}formatForTimeTracking(report,tool){let sessions=[];switch(report.files.forEach(file=>{file.activities.forEach(activity=>{sessions.push({file:file.path,action:activity.action,timestamp:activity.timestamp,duration:this.estimateSessionDuration(activity),project:this.extractProjectName(file.path)})})}),tool){case"toggl":return this.formatForToggl(sessions);case"clockify":return this.formatForClockify(sessions);case"generic":default:return sessions}}formatForToggl(sessions){return sessions.map(session=>({description:`${session.action}: ${session.file}`,start:session.timestamp.toISOString(),duration:session.duration*60,project:session.project,tags:[session.action,this.getFileType(session.file)]}))}formatForClockify(sessions){return sessions.map(session=>({description:`${session.action}: ${session.file}`,start:session.timestamp.toISOString(),end:new Date(session.timestamp.getTime()+session.duration*60*1e3).toISOString(),project:session.project,tags:[session.action,this.getFileType(session.file)]}))}estimateSessionDuration(activity){switch(activity.action){case"created":return 15;case"modified":return 5;case"deleted":return 1;default:return 5}}extractProjectName(filePath){return normalizePath(filePath).split("/")[0]||"Unknown Project"}getFileType(filePath){let ext=getExtension(filePath);return{".js":"javascript",".ts":"typescript",".py":"python",".java":"java",".cpp":"cpp",".html":"html",".css":"css",".md":"markdown",".json":"json",".xml":"xml",".txt":"text"}[ext]||"other"}isExcluded(filePath,excludePatterns){return excludePatterns.some(pattern=>new RegExp(pattern.replace(/\*/g,".*")).test(filePath))}formatFileSize(bytes){if(bytes===0)return"0 B";let k=1024,sizes=["B","KB","MB","GB"],i=Math.floor(Math.log(bytes)/Math.log(k));return parseFloat((bytes/Math.pow(k,i)).toFixed(1))+" "+sizes[i]}async showReportDialog(){try{let options={"\u{1F4CA} Generate Full Report":"full","\u{1F4C5} Last 24 Hours":"24h","\u{1F4C5} Last 7 Days":"7d","\u{1F4C5} Last 30 Days":"30d","\u{1F4C5} Last 90 Days":"90d"},selected=await vscode2.window.showQuickPick(Object.keys(options),{placeHolder:"Select report time range"});if(!selected)return;let timeRange=options[selected],formatOptions=["JSON","CSV","HTML","Markdown"],format=await vscode2.window.showQuickPick(formatOptions,{placeHolder:"Select report format"});if(!format)return;let result=await vscode2.window.showSaveDialog({defaultUri:vscode2.Uri.file(`file-report.${format.toLowerCase()}`),filters:{[format]:[format.toLowerCase()]}});if(!result)return;await this.generateFileModificationReport({format:format.toLowerCase(),timeRange,outputPath:result.fsPath})}catch(error){logger.error("Failed to show report dialog:",error),vscode2.window.showErrorMessage("Failed to generate report")}}};__name(_ExportReportingManager,"ExportReportingManager");var ExportReportingManager=_ExportReportingManager;module2.exports={ExportReportingManager}}});var require_extension=__commonJS({"extension.js"(exports2,module2){var vscode2=require("vscode"),{FileDateDecorationProvider}=require_fileDateDecorationProvider(),{getLogger}=require_logger(),{getLocalization}=require_localization(),{fileSystem:fileSystem2}=require_FileSystemAdapter(),{registerCoreCommands:registerCoreCommands2}=require_coreCommands(),{registerAnalysisCommands}=require_analysisCommands(),{registerOnboardingCommands}=require_onboardingCommands(),fileDateProvider,logger,l10n;function getApiInformationHtml(api){return`<!DOCTYPE html>
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
            <p>Version: ${api.version} | API Version: ${api.apiVersion}</p>
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
    </html>`}__name(getApiInformationHtml,"getApiInformationHtml");function generateWorkspaceActivityHTML(files){let formatFileSize=__name(bytes=>{if(bytes<1024)return`${bytes} B`;let kb=bytes/1024;return kb<1024?`${kb.toFixed(1)} KB`:`${(kb/1024).toFixed(1)} MB`},"formatFileSize"),fileRows=files.map(file=>`
        <tr>
            <td>${file.path}</td>
            <td>${file.modified.toLocaleString()}</td>
            <td>${formatFileSize(file.size)}</td>
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
                    <strong>Total Files Analyzed:</strong> ${files.length}
                </div>
                <div class="stat-box">
                    <strong>Most Recent:</strong> ${files.length>0?files[0].modified.toLocaleString():"N/A"}
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
                    ${fileRows}
                </tbody>
            </table>
        </body>
        </html>
    `}__name(generateWorkspaceActivityHTML,"generateWorkspaceActivityHTML");function generateDiagnosticsHTML(diagnostics){return`
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
            
            ${Object.entries(diagnostics).map(([title,data])=>{let rows=Object.entries(data).map(([key,value])=>{let displayValue=Array.isArray(value)?value.join(", ")||"None":value?.toString()||"N/A";return`
                <tr>
                    <td><strong>${key}:</strong></td>
                    <td>${displayValue}</td>
                </tr>
            `}).join("");return`
            <div class="diagnostic-section">
                <h3>\u{1F50D} ${title}</h3>
                <table>
                    ${rows}
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
    `}__name(generateDiagnosticsHTML,"generateDiagnosticsHTML");function generateDiagnosticsWebview(results){return`<!DOCTYPE html>
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
            <p><strong>VS Code:</strong> ${results.vscodeVersion} | <strong>Extension:</strong> ${results.extensionVersion}</p>
            <p><strong>Generated:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
        </div>

        ${Object.entries(results.tests).map(([testName,testResult])=>{let statusClass=testResult.status==="OK"?"test-ok":testResult.status==="ISSUES_FOUND"?"test-warning":"test-error",statusColor=testResult.status==="OK"?"status-ok":testResult.status==="ISSUES_FOUND"?"status-warning":"status-error";return`
            <div class="test-section ${statusClass}">
                <h2>\u{1F9EA} ${testName.replace(/([A-Z])/g," $1").replace(/^./,str=>str.toUpperCase())}</h2>
                <p class="${statusColor}">Status: ${testResult.status}</p>
                
                ${testResult.issues&&testResult.issues.length>0?`
                    <h3>Issues Found:</h3>
                    ${testResult.issues.map(issue=>`<div class="${issue.startsWith("CRITICAL:")?"issue-critical":"issue-warning"}">\u26A0\uFE0F ${issue}</div>`).join("")}
                `:""}
                
                ${testResult.settings?`
                    <h3>Settings:</h3>
                    <pre>${JSON.stringify(testResult.settings,null,2)}</pre>
                `:""}
                
                ${testResult.testFiles?`
                    <h3>File Tests:</h3>
                    ${testResult.testFiles.map(file=>`
                        <div class="file-test">
                            \u{1F4C4} ${file.file}: 
                            ${file.exists?"\u2705":"\u274C"} exists | 
                            ${file.excluded?"\u{1F6AB}":"\u2705"} ${file.excluded?"excluded":"included"} | 
                            ${file.hasDecoration?"\u{1F3F7}\uFE0F":"\u274C"} ${file.hasDecoration?`badge: ${file.badge}`:"no decoration"}
                        </div>
                    `).join("")}
                `:""}
                
                ${testResult.tests?`
                    <h3>Test Results:</h3>
                    ${testResult.tests.map(test=>`
                        <div class="badge-test">
                            ${test.success?"\u2705":"\u274C"} ${test.name}
                            ${test.badge?` \u2192 "${test.badge}"`:""}
                            ${test.error?` (${test.error})`:""}
                        </div>
                    `).join("")}
                `:""}
                
                ${testResult.cacheInfo?`
                    <h3>Cache Information:</h3>
                    <pre>${JSON.stringify(testResult.cacheInfo,null,2)}</pre>
                `:""}
                
                ${testResult.decorationExtensions&&testResult.decorationExtensions.length>0?`
                    <h3>Other Decoration Extensions:</h3>
                    ${testResult.decorationExtensions.map(ext=>`
                        <div class="file-test">\u{1F50C} ${ext.name} (${ext.id})</div>
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
            <pre>${JSON.stringify(results,null,2)}</pre>
        </div>
    </body>
    </html>`}__name(generateDiagnosticsWebview,"generateDiagnosticsWebview");function generatePerformanceAnalyticsHTML(metrics){let formatBytes=__name(bytes=>{if(bytes===0)return"0 B";let k=1024,sizes=["B","KB","MB","GB"],i=Math.floor(Math.log(bytes)/Math.log(k));return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+" "+sizes[i]},"formatBytes");return`
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
                    <div class="metric-value">${metrics.totalDecorations||0}</div>
                    <div class="metric-label">Total Decorations</div>
                    <div class="metric-value">${metrics.cacheHitRate||"0%"}</div>
                    <div class="metric-label">Cache Hit Rate</div>
                </div>
                
                ${metrics.advancedCache?`
                <div class="metric-card">
                    <div class="metric-title">\u{1F9E0} Advanced Cache</div>
                    <div class="metric-value">${metrics.advancedCache.memoryItems||0}</div>
                    <div class="metric-label">Memory Items</div>
                    <div class="metric-value">${formatBytes(metrics.advancedCache.memoryUsage||0)}</div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${metrics.advancedCache.memoryUsagePercent||0}%"></div>
                    </div>
                    <div class="metric-label">${metrics.advancedCache.memoryUsagePercent||"0.00"}% of limit</div>
                    <div class="metric-value">${metrics.advancedCache.memoryHitRate||"0%"}</div>
                    <div class="metric-label">Memory Hit Rate</div>
                    <div class="metric-value">${metrics.advancedCache.diskHitRate||"0%"}</div>
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
                
                ${metrics.batchProcessor?`
                <div class="metric-card">
                    <div class="metric-title">\u26A1 Batch Processor</div>
                    <div class="metric-value">${metrics.batchProcessor.totalBatches}</div>
                    <div class="metric-label">Total Batches Processed</div>
                    <div class="metric-value">${metrics.batchProcessor.averageBatchTime.toFixed(2)}ms</div>
                    <div class="metric-label">Average Batch Time</div>
                    <div class="metric-value">${metrics.batchProcessor.isProcessing?"Active":"Idle"}</div>
                    <div class="metric-label">Current Status</div>
                </div>
                `:""}
                
                <div class="metric-card">
                    <div class="metric-title">\u{1F4C8} Performance</div>
                    <div class="metric-value">${metrics.cacheHits||0}</div>
                    <div class="metric-label">Cache Hits</div>
                    <div class="metric-value">${metrics.cacheMisses||0}</div>
                    <div class="metric-label">Cache Misses</div>
                    <div class="metric-value">${metrics.errors||0}</div>
                    <div class="metric-label">Errors</div>
                </div>
            </div>
        </body>
        </html>
    `}__name(generatePerformanceAnalyticsHTML,"generatePerformanceAnalyticsHTML");function initializeStatusBar(context){let statusBarItem=vscode2.window.createStatusBarItem(vscode2.StatusBarAlignment.Right,100);statusBarItem.command="explorerDates.showFileDetails",statusBarItem.tooltip="Click to show detailed file information";let updateStatusBar=__name(async()=>{try{let activeEditor=vscode2.window.activeTextEditor;if(!activeEditor){statusBarItem.hide();return}let uri=activeEditor.document.uri;if(uri.scheme!=="file"){statusBarItem.hide();return}let stat=await fileSystem2.stat(uri),modified=stat.mtime instanceof Date?stat.mtime:new Date(stat.mtime),timeAgo=fileDateProvider._formatDateBadge(modified,"smart"),fileSize=fileDateProvider._formatFileSize(stat.size,"auto");statusBarItem.text=`$(clock) ${timeAgo} $(file) ${fileSize}`,statusBarItem.show()}catch(error){statusBarItem.hide(),logger.debug("Failed to update status bar",error)}},"updateStatusBar");return vscode2.window.onDidChangeActiveTextEditor(updateStatusBar),vscode2.window.onDidChangeTextEditorSelection(updateStatusBar),updateStatusBar(),context.subscriptions.push(statusBarItem),statusBarItem}__name(initializeStatusBar,"initializeStatusBar");async function activate(context){try{logger=getLogger(),l10n=getLocalization(),logger.info("Explorer Dates: Extension activated");let isWeb2=vscode2.env.uiKind===vscode2.UIKind.Web;await vscode2.commands.executeCommand("setContext","explorerDates.gitFeaturesAvailable",!isWeb2);let featureConfig=vscode2.workspace.getConfiguration("explorerDates"),workspaceTemplatesEnabled=featureConfig.get("enableWorkspaceTemplates",!0),reportingEnabled=featureConfig.get("enableReporting",!0),apiEnabled=featureConfig.get("enableExtensionApi",!0);fileDateProvider=new FileDateDecorationProvider;let decorationDisposable=vscode2.window.registerFileDecorationProvider(fileDateProvider);context.subscriptions.push(decorationDisposable),context.subscriptions.push(fileDateProvider),context.subscriptions.push(logger),await fileDateProvider.initializeAdvancedSystems(context);let onboardingManager=null,workspaceTemplatesManager=null,extensionApiManager=null,exportReportingManager=null,getOnboardingManager=__name(()=>{if(!onboardingManager){let{OnboardingManager}=require_onboarding();onboardingManager=new OnboardingManager(context)}return onboardingManager},"getOnboardingManager"),getWorkspaceTemplatesManager=__name(()=>{if(!workspaceTemplatesEnabled)throw new Error("Workspace templates are disabled via explorerDates.enableWorkspaceTemplates");if(!workspaceTemplatesManager){let{WorkspaceTemplatesManager}=require_workspaceTemplates();workspaceTemplatesManager=new WorkspaceTemplatesManager(context)}return workspaceTemplatesManager},"getWorkspaceTemplatesManager"),getExtensionApiManager=__name(()=>{if(!extensionApiManager){let{ExtensionApiManager}=require_extensionApi();extensionApiManager=new ExtensionApiManager}return extensionApiManager},"getExtensionApiManager"),getExportReportingManager=__name(()=>{if(!reportingEnabled)throw new Error("Reporting is disabled via explorerDates.enableReporting");if(!exportReportingManager){let{ExportReportingManager}=require_exportReporting();exportReportingManager=new ExportReportingManager}return exportReportingManager},"getExportReportingManager"),apiFactory=__name(()=>getExtensionApiManager().getApi(),"apiFactory");apiEnabled?context.exports=apiFactory:(context.exports=void 0,logger.info("Explorer Dates API exports disabled via explorerDates.enableExtensionApi")),vscode2.workspace.getConfiguration("explorerDates").get("showWelcomeOnStartup",!0)&&await getOnboardingManager().shouldShowOnboarding()&&setTimeout(()=>{getOnboardingManager().showWelcomeMessage()},5e3),registerCoreCommands2({context,fileDateProvider,logger,l10n}),registerAnalysisCommands({context,fileDateProvider,logger,generators:{generateWorkspaceActivityHTML,generatePerformanceAnalyticsHTML,generateDiagnosticsHTML,generateDiagnosticsWebview}}),registerOnboardingCommands({context,logger,getOnboardingManager});let openTemplateManager=vscode2.commands.registerCommand("explorerDates.openTemplateManager",async()=>{try{if(!workspaceTemplatesEnabled){vscode2.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to use this command.");return}await getWorkspaceTemplatesManager().showTemplateManager(),logger.info("Template manager opened")}catch(error){logger.error("Failed to open template manager",error),vscode2.window.showErrorMessage(`Failed to open template manager: ${error.message}`)}});context.subscriptions.push(openTemplateManager);let saveTemplate=vscode2.commands.registerCommand("explorerDates.saveTemplate",async()=>{try{if(!workspaceTemplatesEnabled){vscode2.window.showInformationMessage("Workspace templates are disabled. Enable explorerDates.enableWorkspaceTemplates to save templates.");return}let name=await vscode2.window.showInputBox({prompt:"Enter template name",placeHolder:"e.g., My Project Setup"});if(name){let description=await vscode2.window.showInputBox({prompt:"Enter description (optional)",placeHolder:"Brief description of this template"})||"";await getWorkspaceTemplatesManager().saveCurrentConfiguration(name,description)}logger.info("Template saved")}catch(error){logger.error("Failed to save template",error),vscode2.window.showErrorMessage(`Failed to save template: ${error.message}`)}});context.subscriptions.push(saveTemplate);let generateReport=vscode2.commands.registerCommand("explorerDates.generateReport",async()=>{try{if(!reportingEnabled){vscode2.window.showInformationMessage("Reporting features are disabled. Enable explorerDates.enableReporting to generate reports.");return}await getExportReportingManager().showReportDialog(),logger.info("Report generation started")}catch(error){logger.error("Failed to generate report",error),vscode2.window.showErrorMessage(`Failed to generate report: ${error.message}`)}});context.subscriptions.push(generateReport);let showApiInfo=vscode2.commands.registerCommand("explorerDates.showApiInfo",async()=>{try{if(!apiEnabled){vscode2.window.showInformationMessage("Explorer Dates API is disabled via settings.");return}let panel=vscode2.window.createWebviewPanel("apiInfo","Explorer Dates API Information",vscode2.ViewColumn.One,{enableScripts:!0});panel.webview.html=getApiInformationHtml(apiFactory()),logger.info("API information panel opened")}catch(error){logger.error("Failed to show API information",error),vscode2.window.showErrorMessage(`Failed to show API information: ${error.message}`)}});context.subscriptions.push(showApiInfo);let statusBarItem;vscode2.workspace.getConfiguration("explorerDates").get("showStatusBar",!1)&&(statusBarItem=initializeStatusBar(context)),vscode2.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration("explorerDates.showStatusBar")){let newValue=vscode2.workspace.getConfiguration("explorerDates").get("showStatusBar",!1);newValue&&!statusBarItem?statusBarItem=initializeStatusBar(context):!newValue&&statusBarItem&&(statusBarItem.dispose(),statusBarItem=null)}}),logger.info("Explorer Dates: Date decorations ready")}catch(error){let errorMessage=`${l10n?l10n.getString("activationError"):"Explorer Dates failed to activate"}: ${error.message}`;throw console.error("Explorer Dates: Failed to activate:",error),logger&&logger.error("Extension activation failed",error),vscode2.window.showErrorMessage(errorMessage),error}}__name(activate,"activate");async function deactivate(){try{logger?logger.info("Explorer Dates extension is being deactivated"):console.log("Explorer Dates extension is being deactivated"),fileDateProvider&&typeof fileDateProvider.dispose=="function"&&await fileDateProvider.dispose(),logger&&logger.info("Explorer Dates extension deactivated successfully")}catch(error){let errorMessage="Explorer Dates: Error during deactivation";console.error(errorMessage,error),logger&&logger.error(errorMessage,error)}}__name(deactivate,"deactivate");module2.exports={activate,deactivate}}});var extension=require_extension();module.exports={activate:extension.activate,deactivate:extension.deactivate};
//# sourceMappingURL=extension.web.js.map
