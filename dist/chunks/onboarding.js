var __create=Object.create;var __defProp=Object.defineProperty;var __getOwnPropDesc=Object.getOwnPropertyDescriptor;var __getOwnPropNames=Object.getOwnPropertyNames;var __getProtoOf=Object.getPrototypeOf,__hasOwnProp=Object.prototype.hasOwnProperty;var __name=(target,value)=>__defProp(target,"name",{value,configurable:!0});var __commonJS=(cb,mod)=>function(){return mod||(0,cb[__getOwnPropNames(cb)[0]])((mod={exports:{}}).exports,mod),mod.exports};var __copyProps=(to,from,except,desc)=>{if(from&&typeof from=="object"||typeof from=="function")for(let key of __getOwnPropNames(from))!__hasOwnProp.call(to,key)&&key!==except&&__defProp(to,key,{get:()=>from[key],enumerable:!(desc=__getOwnPropDesc(from,key))||desc.enumerable});return to};var __toESM=(mod,isNodeMode,target)=>(target=mod!=null?__create(__getProtoOf(mod)):{},__copyProps(isNodeMode||!mod||!mod.__esModule?__defProp(target,"default",{value:mod,enumerable:!0}):target,mod));var require_logger=__commonJS({"src/utils/logger.js"(exports2,module2){var GLOBAL_LOGGER_KEY="__explorerDatesLogger",LoggerFacade=class{static{__name(this,"LoggerFacade")}constructor(){this._impl=null}_call(method,args){if(this._impl&&typeof this._impl[method]=="function")try{return this._impl[method](...args)}catch{}switch(method){case"debug":typeof console.debug=="function"?console.debug(...args):console.log(...args);break;case"info":console.log(...args);break;case"warn":console.warn(...args);break;case"error":console.error(...args);break;default:console.log(...args);break}}debug(...args){return this._call("debug",args)}info(...args){return this._call("info",args)}warn(...args){return this._call("warn",args)}error(...args){return this._call("error",args)}_setImpl(impl){this._impl=impl}};function getLogger2(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new LoggerFacade),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new LoggerFacade),globalThis[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new LoggerFacade),loggerInstance)}__name(getLogger2,"getLogger");var Logger=class extends LoggerFacade{static{__name(this,"Logger")}},loggerInstance=null;module2.exports={Logger,getLogger:getLogger2}}});var require_constants=__commonJS({"src/constants.js"(exports2,module2){var env2=typeof process<"u"&&process.env?process.env:{},DEFAULT_CACHE_TIMEOUT=12e4,DEFAULT_MAX_CACHE_SIZE=1e4,DEFAULT_PERSISTENT_CACHE_TTL=1440*60*1e3,MAX_BADGE_LENGTH=2,MONTH_ABBREVIATIONS=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],DEFAULT_DECORATION_POOL_SIZE=Number(env2.EXPLORER_DATES_DECORATION_POOL_SIZE||2048),DEFAULT_FLYWEIGHT_CACHE_SIZE=Number(env2.EXPLORER_DATES_FLYWEIGHT_CACHE_SIZE||4096),WORKSPACE_SCALE_BALANCED_THRESHOLD=Number(env2.EXPLORER_DATES_WORKSPACE_BALANCED_THRESHOLD||15e3),WORKSPACE_SCALE_LARGE_THRESHOLD=Number(env2.EXPLORER_DATES_WORKSPACE_LARGE_THRESHOLD||25e4),WORKSPACE_SCALE_EXTREME_THRESHOLD=Number(env2.EXPLORER_DATES_WORKSPACE_EXTREME_THRESHOLD||4e5),WORKSPACE_SCAN_MAX_RESULTS=Number(env2.EXPLORER_DATES_WORKSPACE_SCAN_MAX_RESULTS||Math.min(WORKSPACE_SCALE_EXTREME_THRESHOLD+1,50001)),GLOBAL_STATE_KEYS={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"},WEB_CHUNK_GLOBAL_KEY="explorerDatesChunks",LEGACY_WEB_CHUNK_GLOBAL_KEY="__explorerDatesChunks";module2.exports={DEFAULT_CACHE_TIMEOUT,DEFAULT_MAX_CACHE_SIZE,DEFAULT_PERSISTENT_CACHE_TTL,DEFAULT_DECORATION_POOL_SIZE,DEFAULT_FLYWEIGHT_CACHE_SIZE,MAX_BADGE_LENGTH,MONTH_ABBREVIATIONS,WORKSPACE_SCALE_BALANCED_THRESHOLD,WORKSPACE_SCALE_LARGE_THRESHOLD,WORKSPACE_SCALE_EXTREME_THRESHOLD,WORKSPACE_SCAN_MAX_RESULTS,GLOBAL_STATE_KEYS,WEB_CHUNK_GLOBAL_KEY,LEGACY_WEB_CHUNK_GLOBAL_KEY}}});var require_settingsCoordinator=__commonJS({"src/utils/settingsCoordinator.js"(exports,module){var{getLogger}=require_logger(),env=typeof process<"u"&&process.env?process.env:{};function createFallbackVscodeMinimal(){return{workspace:{workspaceFolders:[],getConfiguration:__name(()=>({get:__name(()=>{},"get"),async update(){},inspect:__name(()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0}),"inspect")}),"getConfiguration")},ConfigurationTarget:{Global:1,Workspace:2,WorkspaceFolder:3}}}__name(createFallbackVscodeMinimal,"createFallbackVscodeMinimal");function resolveVscodeMinimal(){try{return require("vscode")}catch{return createFallbackVscodeMinimal()}}__name(resolveVscodeMinimal,"resolveVscodeMinimal");var MinimalSettingsCoordinator=class{static{__name(this,"MinimalSettingsCoordinator")}constructor(options2={}){this._defaultSection=options2.defaultSection||"explorerDates",this._locks=new Map,this._waitStats=new Map,this._lockWarnMs=Number(env.EXPLORER_DATES_LOCK_WAIT_WARN_MS||1e3),this._logger=getLogger()}_withLock(key,work){let p=(this._locks.get(key)||Promise.resolve()).then(()=>work()),chain=p.catch(()=>{});return this._locks.set(key,chain),p.finally(()=>{this._locks.get(key)===chain&&this._locks.delete(key)}),p}_getConfiguration(section,resource){return resolveVscodeMinimal().workspace.getConfiguration(section||void 0,resource)}_resolveKey(key,explicitSection){let section=explicitSection||this._defaultSection;return section?key.startsWith(`${section}.`)?{section,key:key.slice(section.length+1),fullKey:key}:key.includes(".")?{section:void 0,key,fullKey:key}:{section,key,fullKey:`${section}.${key}`}:{section:void 0,key,fullKey:key}}async updateSetting(key,value,options2={}){return this._withLock(this._resolveKey(key,options2.section).fullKey,async()=>{let resolved=this._resolveKey(key,options2.section),config=this._getConfiguration(resolved.section,options2.resource);try{let target=this._resolveScope(options2.scope,options2.resource);return await config.update(resolved.key,value,target),{key:resolved.fullKey,updated:!0}}catch(err){try{this._logger.warn(`Configuration update failed for ${resolved.fullKey}: ${err&&err.message}`)}catch{}return{key:resolved.fullKey,updated:!1,error:err}}})}async applySettings(settings,options2={}){let entries=Array.isArray(settings)?settings:Object.entries(settings).map(([k,v])=>({key:k,value:v})),results=[];for(let entry of entries)try{results.push(await this.updateSetting(entry.key,entry.value,options2))}catch(err){results.push({key:this._resolveKey(entry.key,options2.section).fullKey,updated:!1,error:err})}let errors=results.filter(r=>r&&r.error);if(errors.length>0){let messages=errors.map(e=>`${e.key}: ${e.error&&e.error.message?e.error.message:String(e.error)}`),aggregated=new Error(`Failed to apply ${errors.length} setting(s): ${messages.join("; ")}`);throw aggregated.details=errors,aggregated}return results}_resolveScope(scope,resource){return scope&&scope!=="auto"?this._mapScope(scope)||resolveVscodeMinimal().ConfigurationTarget.Workspace:resource?resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder:resolveVscodeMinimal().workspace.workspaceFolders&&resolveVscodeMinimal().workspace.workspaceFolders.length>0?resolveVscodeMinimal().ConfigurationTarget.Workspace:resolveVscodeMinimal().ConfigurationTarget.Global}_mapScope(scope){switch(scope){case"user":return resolveVscodeMinimal().ConfigurationTarget.Global;case"workspace":return resolveVscodeMinimal().ConfigurationTarget.Workspace;case"workspaceFolder":return resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder;default:return}}getValue(key,options2={}){let{section,resource}=options2||{},resolved=this._resolveKey(key,section);return this._getConfiguration(resolved.section,resource).get(resolved.key)}inspect(key,options2={}){let{section,resource}=options2||{},resolved=this._resolveKey(key,section);return this._getConfiguration(resolved.section,resource).inspect(resolved.key)}async clearSetting(key,options2={}){return this.updateSetting(key,void 0,options2)}getLockWaitStats(){let out={};for(let[k,v]of this._waitStats.entries())out[k]={...v};return out}resetLockWaitStats(){this._waitStats.clear()}},cachedCoordinator=null;function getSettingsCoordinator(options){if(!cachedCoordinator||options&&options.forceNew){try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){let chunk=null;try{chunk=dynamicRequire("../chunks/settings-coordinator-impl-chunk")}catch{}try{chunk||(chunk=dynamicRequire("../chunks/settingsCoordinator-impl-chunk"))}catch{}if(chunk&&typeof chunk.createSettingsCoordinatorImpl=="function")return cachedCoordinator=chunk.createSettingsCoordinatorImpl(options),cachedCoordinator}}catch{}try{let{WEB_CHUNK_GLOBAL_KEY,LEGACY_WEB_CHUNK_GLOBAL_KEY}=require_constants(),registry=typeof globalThis<"u"&&(globalThis[WEB_CHUNK_GLOBAL_KEY]||globalThis[LEGACY_WEB_CHUNK_GLOBAL_KEY])||null;if(registry&&registry.settingsCoordinatorImpl&&typeof registry.settingsCoordinatorImpl.createSettingsCoordinatorImpl=="function")return cachedCoordinator=registry.settingsCoordinatorImpl.createSettingsCoordinatorImpl(options),cachedCoordinator}catch{}cachedCoordinator=new MinimalSettingsCoordinator(options)}return cachedCoordinator}__name(getSettingsCoordinator,"getSettingsCoordinator");module.exports={getSettingsCoordinator,MinimalSettingsCoordinator}}});var require_onboarding=__commonJS({"src/onboarding.js"(exports,module){var vscode=require("vscode"),getLogger=__name(()=>{try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){let chunk=dynamicRequire("./chunks/logger-chunk");if(chunk&&typeof chunk.getLogger=="function")return getLogger=chunk.getLogger,getLogger()}}catch{}try{return getLogger=require_logger().getLogger,getLogger()}catch{return getLogger=__name(()=>({debug:console.debug?.bind(console)||console.log,info:console.log.bind(console),warn:console.warn.bind(console),error:console.error.bind(console)}),"getLogger"),getLogger()}},"getLogger"),{getLocalization}=require("./utils/localization"),{getSettingsCoordinator}=require_settingsCoordinator(),OnboardingManager=class{static{__name(this,"OnboardingManager")}constructor(context){this._context=context,this._logger=getLogger(),this._l10n=getLocalization(),this._settings=getSettingsCoordinator(),this._hasShownWelcome=context.globalState.get("explorerDates.hasShownWelcome",!1),this._hasCompletedSetup=context.globalState.get("explorerDates.hasCompletedSetup",!1),this._onboardingVersion=context.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this._hasShownWelcome,hasCompletedSetup:this._hasCompletedSetup,onboardingVersion:this._onboardingVersion})}async shouldShowOnboarding(){let extensionVersion=this._context.extension.packageJSON.version;return!this._hasShownWelcome||!this._hasCompletedSetup||this._shouldShowVersionUpdate(extensionVersion)}_shouldShowVersionUpdate(currentVersion){if(this._onboardingVersion==="0.0.0")return!0;let[currentMajor]=currentVersion.split(".").map(Number),[savedMajor]=this._onboardingVersion.split(".").map(Number);return currentMajor>savedMajor}_isMinorUpdate(currentVersion){if(this._onboardingVersion==="0.0.0")return!1;let[currentMajor,currentMinor]=currentVersion.split(".").map(Number),[savedMajor,savedMinor]=this._onboardingVersion.split(".").map(Number);return currentMajor===savedMajor&&currentMinor>savedMinor}async showWelcomeMessage(){try{let extensionVersion=this._context.extension.packageJSON.version,isUpdate=this._hasShownWelcome,isMinorUpdate=this._isMinorUpdate(extensionVersion);if(isMinorUpdate)return this._showGentleUpdateNotification(extensionVersion);let migrationHistory=this._context.globalState.get("explorerDates.migrationHistory",[]),recentMigration=migrationHistory.find(record=>record.extensionVersion===extensionVersion&&record.migratedSettings.length>0),message=isUpdate?`Explorer Dates has been updated to v${extensionVersion} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!";recentMigration&&(message+=`

\u2705 Your settings have been automatically migrated to maintain compatibility.`);let actions=isUpdate?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"];migrationHistory.length>0&&isUpdate&&actions.splice(-1,0,"\u{1F4DC} Migration History");let action=await vscode.window.showInformationMessage(message,{modal:!1},...actions);switch(await this._context.globalState.update("explorerDates.hasShownWelcome",!0),await this._context.globalState.update("explorerDates.onboardingVersion",extensionVersion),action){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(extensionVersion);break;case"\u{1F4DC} Migration History":await vscode.commands.executeCommand("explorerDates.showMigrationHistory");break;case"\u2699\uFE0F Settings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await vscode.commands.executeCommand("explorerDates.previewConfiguration",message.settings);break;case"clearPreview":await vscode.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action,isUpdate,isMinorUpdate})}catch(error){this._logger.error("Failed to show welcome message",error)}}async _showGentleUpdateNotification(version){let statusBarItem=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,100);statusBarItem.text=`$(check) Explorer Dates updated to v${version}`,statusBarItem.tooltip="Click to see what's new in Explorer Dates",statusBarItem.command="explorerDates.showWhatsNew",statusBarItem.show(),setTimeout(()=>{statusBarItem.dispose()},1e4),await this._context.globalState.update("explorerDates.onboardingVersion",version),this._logger.info("Showed gentle update notification",{version})}async showQuickSetupWizard(){try{let panel=vscode.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),html=await this._generateSetupWizardHTML();panel.webview.html=html,panel.webview.onDidReceiveMessage(async message=>{await this._handleSetupWizardMessage(message,panel)}),this._logger.info("Quick setup wizard opened")}catch(error){this._logger.error("Failed to show setup wizard",error)}}async _handleSetupWizardMessage(message,panel){try{switch(message.command){case"applyConfiguration":await this._applyQuickConfiguration(message.configuration),await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),vscode.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),panel.dispose();break;case"previewConfiguration":message.settings&&(await vscode.commands.executeCommand("explorerDates.previewConfiguration",message.settings),this._logger.info("Configuration preview applied via webview",message.settings));break;case"clearPreview":await vscode.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),panel.dispose();break;case"openSettings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates"),panel.dispose();break}}catch(error){this._logger.error("Failed to handle setup wizard message",error)}}async _applyQuickConfiguration(configuration){if(configuration.preset){let preset=(await this._getConfigurationPresets())[configuration.preset];preset&&(this._logger.info(`Applying preset: ${configuration.preset}`,preset.settings),await this._settings.applySettings(preset.settings,{scope:"user",reason:`onboarding-preset:${configuration.preset}`}),this._logger.info(`Applied preset: ${configuration.preset}`,preset.settings),vscode.window.showInformationMessage(`Applied "${preset.name}" configuration. Changes should be visible immediately!`))}configuration.individual&&(await this._settings.applySettings(configuration.individual,{scope:"user",reason:"onboarding-individual"}),this._logger.info("Applied individual settings",configuration.individual));try{await vscode.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(error){this._logger.warn("Failed to refresh decorations after configuration change",error)}}async _getConfigurationPresets(){try{let{loadOnboardingAssets}=require_onboarding_chunk(),assets=await loadOnboardingAssets();if(assets&&typeof assets.getPresets=="function")return assets.getPresets()}catch(error){this._logger.debug("Onboarding presets assets not available, using inline defaults",error)}return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",showFileSize:!0,showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}},powerUser:{name:"Power User",description:"All features enabled: Git badges, sizes, colors, and status bar details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",showFileSize:!0,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}},gitFocused:{name:"Git-Focused",description:"Prioritize Git authorship and commit details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"subtle",showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}}}}async showFeatureTour(){try{let panel=vscode.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),html=await this._generateFeatureTourHTML();panel.webview.html=html,panel.webview.onDidReceiveMessage(async message=>{message.command==="openSettings"?await vscode.commands.executeCommand("workbench.action.openSettings",message.setting||"explorerDates"):message.command==="runCommand"&&await vscode.commands.executeCommand(message.commandId)}),this._logger.info("Feature tour opened")}catch(error){this._logger.error("Failed to show feature tour",error)}}async _generateSetupWizardHTML(){let allPresets=await this._getConfigurationPresets(),simplifiedPresets={minimal:allPresets.minimal,developer:allPresets.developer,accessible:allPresets.accessible};try{let{loadOnboardingAssets}=require_onboarding_chunk(),assets=await loadOnboardingAssets();if(assets)return this._logger.debug("Using chunked onboarding assets for setup wizard"),await assets.getSetupWizardHTML(simplifiedPresets)}catch(error){this._logger.warn("Failed to load chunked assets, using inline fallback",error)}return`<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Quick Setup</title></head>
            <body>
                <h1>Explorer Dates Quick Setup</h1>
                <p>Full UI is loaded on demand; reopen the wizard to load full assets.</p>
            </body>
            </html>`}async _generateFeatureTourHTML(){try{let{loadOnboardingAssets}=require_onboarding_chunk(),assets=await loadOnboardingAssets();if(assets)return this._logger.debug("Using chunked onboarding assets for feature tour"),await assets.getFeatureTourHTML()}catch(error){this._logger.warn("Failed to load chunked assets for feature tour, using inline fallback",error)}return'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feature Tour</title></head><body><h1>Explorer Dates - Feature Tour</h1><p>Full tour loads on demand.</p></body></html>'}async showTipsAndTricks(){let tips=null;try{let{loadOnboardingAssets}=require_onboarding_chunk(),assets=await loadOnboardingAssets();assets&&typeof assets.getTips=="function"&&(tips=assets.getTips())}catch(error){this._logger.debug("Tips assets unavailable, using inline minimal tips",error)}tips||(tips=[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."}]);let selectedTip=tips[Math.floor(Math.random()*tips.length)],message=`\u{1F4A1} **Tip**: ${selectedTip.title}
${selectedTip.description}`;await vscode.window.showInformationMessage(message,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(version){try{let panel=vscode.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${version} - What's New`,vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1}),html=await this._generateWhatsNewHTML(version);panel.webview.html=html,panel.webview.onDidReceiveMessage(async message=>{switch(message.command){case"openSettings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates"),panel.dispose();break;case"tryFeature":message.feature==="badgePriority"&&(await this._settings.updateSetting("badgePriority","author",{scope:"user",reason:"whats-new-demo"}),vscode.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":panel.dispose();break}})}catch(error){this._logger.error("Failed to show what's new",error)}}async _generateWhatsNewHTML(version){try{let{loadOnboardingAssets}=require_onboarding_chunk(),assets=await loadOnboardingAssets();if(assets)return this._logger.debug("Using chunked onboarding assets for what's new"),await assets.getWhatsNewHTML(version)}catch(error){this._logger.warn("Failed to load chunked assets for what's new, using inline fallback",error)}return this._generateWhatsNewHTMLInline(version)}_generateWhatsNewHTMLInline(version){return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>What's New</title></head><body><h1>What's New ${version}</h1><p>Full content loads on demand.</p></body></html>`}};module.exports={OnboardingManager}}});var require_onboarding_logic_chunk=__commonJS({"src/chunks/onboarding-logic-chunk.js"(exports2,module2){var{OnboardingManager:OnboardingManager2}=require_onboarding();module2.exports={OnboardingManager:OnboardingManager2,createOnboardingManager:__name(context=>new OnboardingManager2(context),"createOnboardingManager")}}});var require_onboarding_assets_chunk=__commonJS({"src/chunks/onboarding-assets-chunk.js"(exports2,module2){var{getLogger:getLogger2}=require_logger(),OnboardingAssets=class{static{__name(this,"OnboardingAssets")}constructor(){this._logger=getLogger2(),this._templates=null,this._initialized=!1}async initialize(){if(!this._initialized)try{this._templates={setupWizardTemplate:this._generateSetupWizardTemplate(),featureTourTemplate:this._generateFeatureTourTemplate(),whatsNewTemplate:this._generateWhatsNewTemplate(),sharedStyles:this._generateSharedStyles(),sharedScripts:this._generateSharedScripts()},this._initialized=!0,this._logger.debug("Onboarding assets initialized (~23KB lazy loaded)")}catch(error){throw this._logger.error("Failed to initialize onboarding assets",error),error}}async getSetupWizardHTML(presets){return await this.initialize(),this._fillSetupTemplate(this._templates.setupWizardTemplate,presets)}async getFeatureTourHTML(){return await this.initialize(),this._templates.featureTourTemplate}async getWhatsNewHTML(version){return await this.initialize(),this._fillWhatsNewTemplate(this._templates.whatsNewTemplate,version)}_fillSetupTemplate(template,presets){let presetOptions=Object.entries(presets).filter(([,preset])=>!preset.hidden).map(([key,preset])=>`
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
        `).join("");return template.replace("{{PRESET_OPTIONS}}",presetOptions).replace("{{MORE_OPTIONS_LINK}}",`
            <div class="more-options">
                <p><strong>Need more options?</strong> Try the <a href="#" onmouseenter="previewConfiguration({preset: 'powerUser'})" onmouseleave="clearPreview()" onclick="showAllPresets()">Power User</a> or <a href="#" onmouseenter="previewConfiguration({preset: 'gitFocused'})" onmouseleave="clearPreview()" onclick="showGitFocused()">Git-Focused</a> presets, or configure manually in Settings.</p>
            </div>
        `).replace("{{PRESETS_JSON}}",JSON.stringify(presets))}_fillWhatsNewTemplate(template,version){return template.replace(/{{VERSION}}/g,version)}_generateSetupWizardTemplate(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Quick Setup</title>
                <style>
                    ${this._generateSharedStyles()}
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
                    <p><small><!-- Powered by lazy loaded onboarding assets chunk (~23KB) --></small></p>
                </div>

                <div class="step">
                    <h2>\u{1F4CB} Choose Your Configuration</h2>
                    <p>Select a preset that matches your needs, or skip to configure manually:</p>
                    
                    {{PRESET_OPTIONS}}
                    
                    {{MORE_OPTIONS_LINK}}
                </div>

                <div class="buttons">
                    <button class="btn" onclick="applyConfiguration()">Apply Configuration</button>
                    <button class="btn secondary" onclick="openSettings()">Manual Setup</button>
                    <button class="btn secondary" onclick="skipSetup()">Skip for Now</button>
                </div>

                <script>
                    ${this._generateSharedScripts()}
                    
                    // Specific setup wizard functionality
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
                        const presets = {{PRESETS_JSON}};
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
        `}_generateFeatureTourTemplate(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Feature Tour</title>
                <style>
                    ${this._generateSharedStyles()}
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
                    ${this._generateSharedScripts()}

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
        `}_generateWhatsNewTemplate(){return`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Explorer Dates - What's New</title>
                <style>
                    ${this._generateSharedStyles()}
                    
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
                    <div class="version">Explorer Dates v{{VERSION}}</div>
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
                    ${this._generateSharedScripts()}

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
        `}_generateSharedStyles(){return`
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                background: var(--vscode-editor-background);
                color: var(--vscode-foreground);
                line-height: 1.6;
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
            .step {
                margin-bottom: 30px;
                padding: 20px;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-widget-border);
                border-radius: 8px;
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
                text-decoration: none;
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
        `}_generateSharedScripts(){return`
            const vscode = acquireVsCodeApi();
        `}getPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",showFileSize:!0,showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}},powerUser:{name:"Power User",description:"All features enabled: Git badges, sizes, colors, and status bar details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",showFileSize:!0,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}},gitFocused:{name:"Git-Focused",description:"Prioritize Git authorship and commit details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"subtle",showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}}}}getTips(){return[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."},{icon:"\u{1F4CA}",title:"Performance Analytics",description:'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'},{icon:"\u{1F50D}",title:"Context Menu",description:"Right-click any file to access Git history, file details, and quick actions."}]}getMemoryInfo(){return{chunkName:"onboarding-assets",estimatedSize:"~23KB",templatesLoaded:this._initialized,templateCount:this._templates?Object.keys(this._templates).length:0,loaded:this._initialized}}dispose(){this._templates=null,this._initialized=!1,this._logger.debug("Onboarding assets disposed")}};module2.exports={OnboardingAssets,createOnboardingAssets:__name(()=>new OnboardingAssets,"createOnboardingAssets"),getPresets:__name(()=>new OnboardingAssets().getPresets(),"getPresets"),getTips:__name(()=>new OnboardingAssets().getTips(),"getTips"),getMemoryInfo:(()=>{let sharedInstance=null;return()=>(sharedInstance||(sharedInstance=new OnboardingAssets),sharedInstance.getMemoryInfo())})()}}});var require_onboarding_chunk=__commonJS({"src/chunks/onboarding-chunk.js"(exports2,module2){var OnboardingManager2=null,_createOnboardingManager=null,{getLogger:getLogger2}=require_logger(),logger=getLogger2(),vscode2=require("vscode"),{getSettingsCoordinator:getSettingsCoordinator2}=require_settingsCoordinator(),FALLBACK_PRESETS={minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",showFileSize:!0,showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}},powerUser:{name:"Power User",description:"All features enabled: Git badges, sizes, colors, and status bar details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",showFileSize:!0,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}},gitFocused:{name:"Git-Focused",description:"Prioritize Git authorship and commit details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"subtle",showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}}},FallbackOnboardingManager=class{static{__name(this,"FallbackOnboardingManager")}constructor(context){this._context=context,this._settings=getSettingsCoordinator2()}async showQuickSetupWizard(){let panel=vscode2.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",vscode2.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),presets=await this._getPresets(),assets=await loadOnboardingAssets();assets&&typeof assets.getSetupWizardHTML=="function"?panel.webview.html=await assets.getSetupWizardHTML(presets):panel.webview.html=this._getMinimalSetupHtml(),panel.webview.onDidReceiveMessage(async message=>{await this._handleSetupWizardMessage(message,panel)})}async showFeatureTour(){let panel=vscode2.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",vscode2.ViewColumn.One,{enableScripts:!1,retainContextWhenHidden:!1}),assets=await loadOnboardingAssets();assets&&typeof assets.getFeatureTourHTML=="function"?panel.webview.html=await assets.getFeatureTourHTML():panel.webview.html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feature Tour</title></head><body><h1>Explorer Dates Feature Tour</h1><p>Feature tour is unavailable in this session.</p></body></html>'}async showWhatsNew(version=""){let panel=vscode2.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates ${version?`v${version}`:""} - What's New`,vscode2.ViewColumn.One,{enableScripts:!1,retainContextWhenHidden:!1}),assets=await loadOnboardingAssets();assets&&typeof assets.getWhatsNewHTML=="function"?panel.webview.html=await assets.getWhatsNewHTML(version):panel.webview.html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>What's New</title></head><body><h1>What's New ${version}</h1><p>What's new content is unavailable in this session.</p></body></html>`}async showWelcomeMessage(){await vscode2.window.showInformationMessage("Explorer Dates onboarding is unavailable. Open settings to configure.","Open Settings").then(choice=>{choice==="Open Settings"&&vscode2.commands.executeCommand("workbench.action.openSettings","explorerDates")})}async _getPresets(){try{let assets=await loadOnboardingAssets();if(assets&&typeof assets.getPresets=="function")return assets.getPresets()}catch{}return FALLBACK_PRESETS}_getMinimalSetupHtml(){return`<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Quick Setup</title></head>
            <body>
                <h1>Explorer Dates Quick Setup</h1>
                <p>The onboarding UI could not be fully loaded in this session.</p>
                <p>Please open settings to configure Explorer Dates manually.</p>
            </body>
            </html>`}async _handleSetupWizardMessage(message,panel){try{switch(message.command){case"applyConfiguration":await this._applyQuickConfiguration(message.configuration),this._context?.globalState?.update&&await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),vscode2.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),panel.dispose();break;case"previewConfiguration":message.settings&&await vscode2.commands.executeCommand("explorerDates.previewConfiguration",message.settings);break;case"clearPreview":await vscode2.commands.executeCommand("explorerDates.clearPreview");break;case"skipSetup":this._context?.globalState?.update&&await this._context.globalState.update("explorerDates.hasCompletedSetup",!0),panel.dispose();break;case"openSettings":await vscode2.commands.executeCommand("workbench.action.openSettings","explorerDates"),panel.dispose();break}}catch(error){logger.warn("Fallback onboarding message handling failed",error)}}async _applyQuickConfiguration(configuration={}){if(configuration)try{if(configuration.preset){let preset=(await this._getPresets())[configuration.preset];preset?.settings&&await this._settings.applySettings(preset.settings,{scope:"user",reason:`onboarding-preset:${configuration.preset}`})}configuration.individual&&await this._settings.applySettings(configuration.individual,{scope:"user",reason:"onboarding-individual"});try{await vscode2.commands.executeCommand("explorerDates.refreshDateDecorations")}catch{}}catch(error){logger.warn("Fallback onboarding apply failed",error)}}};async function _ensureOnboardingLogic(){if(!(OnboardingManager2&&_createOnboardingManager))try{let chunk=await Promise.resolve().then(()=>__toESM(require_onboarding_logic_chunk()));if(OnboardingManager2=chunk.OnboardingManager||chunk.default?.OnboardingManager||chunk.default,_createOnboardingManager=chunk.createOnboardingManager,typeof _createOnboardingManager!="function"&&typeof OnboardingManager2=="function"&&(_createOnboardingManager=__name(context=>new OnboardingManager2(context),"_createOnboardingManager")),typeof _createOnboardingManager!="function")throw new Error("Onboarding logic loaded without a valid factory")}catch{try{let mod=await Promise.resolve().then(()=>__toESM(require_onboarding()));if(OnboardingManager2=mod.OnboardingManager||mod.default?.OnboardingManager||mod.default,_createOnboardingManager=mod.createOnboardingManager,typeof _createOnboardingManager!="function"&&typeof OnboardingManager2=="function"&&(_createOnboardingManager=__name(context=>new OnboardingManager2(context),"_createOnboardingManager")),typeof _createOnboardingManager!="function")throw new Error("Onboarding fallback loaded without a valid factory")}catch(e){logger.warn("Onboarding logic unavailable, using minimal fallback",e),OnboardingManager2=FallbackOnboardingManager,_createOnboardingManager=__name(context=>new FallbackOnboardingManager(context),"_createOnboardingManager")}}}__name(_ensureOnboardingLogic,"_ensureOnboardingLogic");var assetsLoaded=!1,onboardingAssets=null,loadOnboardingAssets=__name(async()=>{if(assetsLoaded&&onboardingAssets)return onboardingAssets;try{return onboardingAssets=require_onboarding_assets_chunk().createOnboardingAssets(),await onboardingAssets.initialize(),assetsLoaded=!0,logger.info("Onboarding webview assets loaded",{chunk:"onboarding-assets",estimatedKB:23}),onboardingAssets}catch(error){return logger.warn("Failed to load onboarding assets, falling back to inline templates",error),null}},"loadOnboardingAssets");module2.exports={OnboardingManager:OnboardingManager2,createOnboardingManager:__name(async context=>(await _ensureOnboardingLogic(),_createOnboardingManager(context)),"createOnboardingManager"),loadOnboardingAssets,getAssetsMemoryInfo:__name(()=>onboardingAssets?onboardingAssets.getMemoryInfo():{loaded:assetsLoaded,templatesLoaded:assetsLoaded,chunkName:"onboarding-assets",estimatedSize:"~23KB"},"getAssetsMemoryInfo")}}});module.exports=require_onboarding_chunk();
//# sourceMappingURL=onboarding.js.map
