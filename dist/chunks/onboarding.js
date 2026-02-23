var G=Object.create;var D=Object.defineProperty;var H=Object.getOwnPropertyDescriptor;var B=Object.getOwnPropertyNames;var U=Object.getPrototypeOf,V=Object.prototype.hasOwnProperty;var p=(i,e)=>()=>(e||i((e={exports:{}}).exports,e),e.exports);var K=(i,e,t,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of B(e))!V.call(i,s)&&s!==t&&D(i,s,{get:()=>e[s],enumerable:!(o=H(e,s))||o.enumerable});return i};var _=(i,e,t)=>(t=i!=null?G(U(i)):{},K(e||!i||!i.__esModule?D(t,"default",{value:i,enumerable:!0}):t,i));var w=p((ce,F)=>{var f="__explorerDatesLogger",m=class{constructor(){this.a=null}n(e,t){if(this.a&&typeof this.a[e]=="function")try{return this.a[e](...t)}catch{}switch(e){case"debug":break;case"info":break;case"warn":break;case"error":break;default:break}}debug(...e){return this.n("debug",e)}info(...e){return this.n("info",e)}warn(...e){return this.n("warn",e)}error(...e){return this.n("error",e)}N(e){this.a=e}};function $(){return typeof global<"u"?(global[f]||(global[f]=new m),global[f]):typeof globalThis<"u"?(globalThis[f]||(globalThis[f]=new m),globalThis[f]):(C||(C=new m),C)}var k=class extends m{},C=null;F.exports={Logger:k,getLogger:$}});var P=p((le,A)=>{var q=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],Y=Number(process.env.EXPLORER_DATES_DECORATION_POOL_SIZE||2048),Q=Number(process.env.EXPLORER_DATES_FLYWEIGHT_CACHE_SIZE||4096),X=Number(process.env.EXPLORER_DATES_WORKSPACE_BALANCED_THRESHOLD||15e3),j=Number(process.env.EXPLORER_DATES_WORKSPACE_LARGE_THRESHOLD||25e4),O=Number(process.env.EXPLORER_DATES_WORKSPACE_EXTREME_THRESHOLD||4e5),J=Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_MAX_RESULTS||Math.min(O+1,50001)),Z={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"},ee="explorerDatesChunks",te="__explorerDatesChunks";A.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,DEFAULT_DECORATION_POOL_SIZE:Y,DEFAULT_FLYWEIGHT_CACHE_SIZE:Q,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:q,WORKSPACE_SCALE_BALANCED_THRESHOLD:X,WORKSPACE_SCALE_LARGE_THRESHOLD:j,WORKSPACE_SCALE_EXTREME_THRESHOLD:O,WORKSPACE_SCAN_MAX_RESULTS:J,GLOBAL_STATE_KEYS:Z,WEB_CHUNK_GLOBAL_KEY:ee,LEGACY_WEB_CHUNK_GLOBAL_KEY:te}});var E=p((exports,module)=>{var{getLogger}=w();function createFallbackVscodeMinimal(){return{workspace:{workspaceFolders:[],getConfiguration:()=>({get:()=>{},async update(){},inspect:()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})})},ConfigurationTarget:{Global:1,Workspace:2,WorkspaceFolder:3}}}function resolveVscodeMinimal(){try{return require("vscode")}catch{return createFallbackVscodeMinimal()}}var MinimalSettingsCoordinator=class{constructor(e={}){this.v=e.defaultSection||"explorerDates",this.c=new Map,this.f=new Map,this.I=Number(process.env.EXPLORER_DATES_LOCK_WAIT_WARN_MS||1e3),this._logger=getLogger()}y(e,t){let s=(this.c.get(e)||Promise.resolve()).then(()=>t()),r=s.catch(()=>{});return this.c.set(e,r),s.finally(()=>{this.c.get(e)===r&&this.c.delete(e)}),s}u(e,t){return resolveVscodeMinimal().workspace.getConfiguration(e||void 0,t)}i(e,t){let o=t||this.v;return o?e.startsWith(`${o}.`)?{section:o,key:e.slice(o.length+1),fullKey:e}:e.includes(".")?{section:void 0,key:e,fullKey:e}:{section:o,key:e,fullKey:`${o}.${e}`}:{section:void 0,key:e,fullKey:e}}async updateSetting(e,t,o={}){return this.y(this.i(e,o.section).fullKey,async()=>{let s=this.i(e,o.section),r=this.u(s.section,o.resource);try{let a=this.S(o.scope,o.resource);return await r.update(s.key,t,a),{key:s.fullKey,updated:!0}}catch(a){try{this._logger.warn(`Configuration update failed for ${s.fullKey}: ${a&&a.message}`)}catch{}return{key:s.fullKey,updated:!1,error:a}}})}async applySettings(e,t={}){let o=Array.isArray(e)?e:Object.entries(e).map(([a,l])=>({key:a,value:l})),s=[];for(let a of o)try{s.push(await this.updateSetting(a.key,a.value,t))}catch(l){s.push({key:this.i(a.key,t.section).fullKey,updated:!1,error:l})}let r=s.filter(a=>a&&a.error);if(r.length>0){let a=r.map(u=>`${u.key}: ${u.error&&u.error.message?u.error.message:String(u.error)}`),l=new Error(`Failed to apply ${r.length} setting(s): ${a.join("; ")}`);throw l.details=r,l}return s}S(e,t){return e&&e!=="auto"?this.x(e)||resolveVscodeMinimal().ConfigurationTarget.Workspace:t?resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder:resolveVscodeMinimal().workspace.workspaceFolders&&resolveVscodeMinimal().workspace.workspaceFolders.length>0?resolveVscodeMinimal().ConfigurationTarget.Workspace:resolveVscodeMinimal().ConfigurationTarget.Global}x(e){switch(e){case"user":return resolveVscodeMinimal().ConfigurationTarget.Global;case"workspace":return resolveVscodeMinimal().ConfigurationTarget.Workspace;case"workspaceFolder":return resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder;default:return}}getValue(e,t={}){let{section:o,resource:s}=t||{},r=this.i(e,o);return this.u(r.section,s).get(r.key)}inspect(e,t={}){let{section:o,resource:s}=t||{},r=this.i(e,o);return this.u(r.section,s).inspect(r.key)}async clearSetting(e,t={}){return this.updateSetting(e,void 0,t)}getLockWaitStats(){let e={};for(let[t,o]of this.f.entries())e[t]={...o};return e}resetLockWaitStats(){this.f.clear()}},cachedCoordinator=null;function getSettingsCoordinator(options){if(!cachedCoordinator||options&&options.forceNew){try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){let i=null;try{i=dynamicRequire("../chunks/settings-coordinator-impl-chunk")}catch{}try{i||(i=dynamicRequire("../chunks/settingsCoordinator-impl-chunk"))}catch{}if(i&&typeof i.createSettingsCoordinatorImpl=="function")return cachedCoordinator=i.createSettingsCoordinatorImpl(options),cachedCoordinator}}catch{}try{let{WEB_CHUNK_GLOBAL_KEY:i,LEGACY_WEB_CHUNK_GLOBAL_KEY:e}=P(),t=typeof globalThis<"u"&&(globalThis[i]||globalThis[e])||null;if(t&&t.settingsCoordinatorImpl&&typeof t.settingsCoordinatorImpl.createSettingsCoordinatorImpl=="function")return cachedCoordinator=t.settingsCoordinatorImpl.createSettingsCoordinatorImpl(options),cachedCoordinator}catch{}cachedCoordinator=new MinimalSettingsCoordinator(options)}return cachedCoordinator}module.exports={getSettingsCoordinator,MinimalSettingsCoordinator}});var M=p((exports,module)=>{var vscode=require("vscode"),getLogger=()=>{try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){let i=dynamicRequire("./chunks/logger-chunk");if(i&&typeof i.getLogger=="function")return getLogger=i.getLogger,getLogger()}}catch{}try{return getLogger=w().getLogger,getLogger()}catch{return getLogger=()=>({debug:(()=>{})?.bind(console)||console.log,info:(()=>{}).bind(console),warn:(()=>{}).bind(console),error:(()=>{}).bind(console)}),getLogger()}},{getLocalization}=require("./utils/localization"),{getSettingsCoordinator}=E(),OnboardingManager=class{constructor(e){this.e=e,this._logger=getLogger(),this.z=getLocalization(),this.o=getSettingsCoordinator(),this.p=e.globalState.get("explorerDates.hasShownWelcome",!1),this.m=e.globalState.get("explorerDates.hasCompletedSetup",!1),this.s=e.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this.p,hasCompletedSetup:this.m,onboardingVersion:this.s})}async shouldShowOnboarding(){let e=this.e.extension.packageJSON.version;return!this.p||!this.m||this.C(e)}C(e){if(this.s==="0.0.0")return!0;let[t]=e.split(".").map(Number),[o]=this.s.split(".").map(Number);return t>o}k(e){if(this.s==="0.0.0")return!1;let[t,o]=e.split(".").map(Number),[s,r]=this.s.split(".").map(Number);return t===s&&o>r}async showWelcomeMessage(){try{let e=this.e.extension.packageJSON.version,t=this.p,o=this.k(e);if(o)return this.E(e);let s=this.e.globalState.get("explorerDates.migrationHistory",[]),r=s.find(T=>T.extensionVersion===e&&T.migratedSettings.length>0),a=t?`Explorer Dates has been updated to v${e} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!";r&&(a+=`

\u2705 Your settings have been automatically migrated to maintain compatibility.`);let l=t?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"];s.length>0&&t&&l.splice(-1,0,"\u{1F4DC} Migration History");let u=await vscode.window.showInformationMessage(a,{modal:!1},...l);switch(await this.e.globalState.update("explorerDates.hasShownWelcome",!0),await this.e.globalState.update("explorerDates.onboardingVersion",e),u){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(e);break;case"\u{1F4DC} Migration History":await vscode.commands.executeCommand("explorerDates.showMigrationHistory");break;case"\u2699\uFE0F Settings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await vscode.commands.executeCommand("explorerDates.previewConfiguration",a.settings);break;case"clearPreview":await vscode.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action:u,isUpdate:t,isMinorUpdate:o})}catch(e){this._logger.error("Failed to show welcome message",e)}}async E(e){let t=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,100);t.text=`$(check) Explorer Dates updated to v${e}`,t.tooltip="Click to see what's new in Explorer Dates",t.command="explorerDates.showWhatsNew",t.show(),setTimeout(()=>{t.dispose()},1e4),await this.e.globalState.update("explorerDates.onboardingVersion",e),this._logger.info("Showed gentle update notification",{version:e})}async showQuickSetupWizard(){try{let e=vscode.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=await this.M();e.webview.html=t,e.webview.onDidReceiveMessage(async o=>{await this.g(o,e)}),this._logger.info("Quick setup wizard opened")}catch(e){this._logger.error("Failed to show setup wizard",e)}}async g(e,t){try{switch(e.command){case"applyConfiguration":await this.h(e.configuration),await this.e.globalState.update("explorerDates.hasCompletedSetup",!0),vscode.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&(await vscode.commands.executeCommand("explorerDates.previewConfiguration",e.settings),this._logger.info("Configuration preview applied via webview",e.settings));break;case"clearPreview":await vscode.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this.e.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(o){this._logger.error("Failed to handle setup wizard message",o)}}async h(e){if(e.preset){let o=(await this.b())[e.preset];o&&(this._logger.info(`Applying preset: ${e.preset}`,o.settings),await this.o.applySettings(o.settings,{scope:"user",reason:`onboarding-preset:${e.preset}`}),this._logger.info(`Applied preset: ${e.preset}`,o.settings),vscode.window.showInformationMessage(`Applied "${o.name}" configuration. Changes should be visible immediately!`))}e.individual&&(await this.o.applySettings(e.individual,{scope:"user",reason:"onboarding-individual"}),this._logger.info("Applied individual settings",e.individual));try{await vscode.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(t){this._logger.warn("Failed to refresh decorations after configuration change",t)}}async b(){try{let{loadOnboardingAssets:e}=b(),t=await e();if(t&&typeof t.getPresets=="function")return t.getPresets()}catch(e){this._logger.debug("Onboarding presets assets not available, using inline defaults",e)}return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",showFileSize:!0,showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}},powerUser:{name:"Power User",description:"All features enabled: Git badges, sizes, colors, and status bar details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",showFileSize:!0,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}},gitFocused:{name:"Git-Focused",description:"Prioritize Git authorship and commit details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"subtle",showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}}}}async showFeatureTour(){try{let e=vscode.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=await this.T();e.webview.html=t,e.webview.onDidReceiveMessage(async o=>{o.command==="openSettings"?await vscode.commands.executeCommand("workbench.action.openSettings",o.setting||"explorerDates"):o.command==="runCommand"&&await vscode.commands.executeCommand(o.commandId)}),this._logger.info("Feature tour opened")}catch(e){this._logger.error("Failed to show feature tour",e)}}async M(){let e=await this.b(),t={minimal:e.minimal,developer:e.developer,accessible:e.accessible};try{let{loadOnboardingAssets:o}=b(),s=await o();if(s)return this._logger.debug("Using chunked onboarding assets for setup wizard"),await s.getSetupWizardHTML(t)}catch(o){this._logger.warn("Failed to load chunked assets, using inline fallback",o)}return`<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Quick Setup</title></head>
            <body>
                <h1>Explorer Dates Quick Setup</h1>
                <p>Full UI is loaded on demand; reopen the wizard to load full assets.</p>
            </body>
            </html>`}async T(){try{let{loadOnboardingAssets:e}=b(),t=await e();if(t)return this._logger.debug("Using chunked onboarding assets for feature tour"),await t.getFeatureTourHTML()}catch(e){this._logger.warn("Failed to load chunked assets for feature tour, using inline fallback",e)}return'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feature Tour</title></head><body><h1>Explorer Dates - Feature Tour</h1><p>Full tour loads on demand.</p></body></html>'}async showTipsAndTricks(){let e=null;try{let{loadOnboardingAssets:r}=b(),a=await r();a&&typeof a.getTips=="function"&&(e=a.getTips())}catch(r){this._logger.debug("Tips assets unavailable, using inline minimal tips",r)}e||(e=[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."}]);let t=e[Math.floor(Math.random()*e.length)],o=`\u{1F4A1} **Tip**: ${t.title}
${t.description}`;await vscode.window.showInformationMessage(o,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(e){try{let t=vscode.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${e} - What's New`,vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1}),o=await this.D(e);t.webview.html=o,t.webview.onDidReceiveMessage(async s=>{switch(s.command){case"openSettings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break;case"tryFeature":s.feature==="badgePriority"&&(await this.o.updateSetting("badgePriority","author",{scope:"user",reason:"whats-new-demo"}),vscode.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":t.dispose();break}})}catch(t){this._logger.error("Failed to show what's new",t)}}async D(e){try{let{loadOnboardingAssets:t}=b(),o=await t();if(o)return this._logger.debug("Using chunked onboarding assets for what's new"),await o.getWhatsNewHTML(e)}catch(t){this._logger.warn("Failed to load chunked assets for what's new, using inline fallback",t)}return this._(e)}_(e){return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>What's New</title></head><body><h1>What's New ${e}</h1><p>Full content loads on demand.</p></body></html>`}};module.exports={OnboardingManager}});var N=p((de,W)=>{var{OnboardingManager:L}=M();W.exports={OnboardingManager:L,createOnboardingManager:i=>new L(i)}});var z=p((ue,I)=>{var{getLogger:oe}=w(),g=class{constructor(){this._logger=oe(),this.t=null,this.r=!1}async initialize(){if(!this.r)try{this.t={setupWizardTemplate:this.F(),featureTourTemplate:this.O(),whatsNewTemplate:this.A(),sharedStyles:this.l(),sharedScripts:this.d()},this.r=!0,this._logger.debug("Onboarding assets initialized (~23KB lazy loaded)")}catch(e){throw this._logger.error("Failed to initialize onboarding assets",e),e}}async getSetupWizardHTML(e){return await this.initialize(),this.P(this.t.setupWizardTemplate,e)}async getFeatureTourHTML(){return await this.initialize(),this.t.featureTourTemplate}async getWhatsNewHTML(e){return await this.initialize(),this.L(this.t.whatsNewTemplate,e)}P(e,t){let o=Object.entries(t).filter(([,r])=>!r.hidden).map(([r,a])=>`
            <div class="preset-option" data-preset="${r}" 
                 onmouseenter="previewConfiguration({preset: '${r}'})" 
                 onmouseleave="clearPreview()">
                <h3>${a.name}</h3>
                <p>${a.description}</p>
                <div class="preset-actions">
                    <button onclick="previewConfiguration({preset: '${r}'})">\u{1F441}\uFE0F Preview</button>
                    <button onclick="applyConfiguration({preset: '${r}'})">\u2705 Select ${a.name}</button>
                </div>
            </div>
        `).join("");return e.replace("{{PRESET_OPTIONS}}",o).replace("{{MORE_OPTIONS_LINK}}",`
            <div class="more-options">
                <p><strong>Need more options?</strong> Try the <a href="#" onmouseenter="previewConfiguration({preset: 'powerUser'})" onmouseleave="clearPreview()" onclick="showAllPresets()">Power User</a> or <a href="#" onmouseenter="previewConfiguration({preset: 'gitFocused'})" onmouseleave="clearPreview()" onclick="showGitFocused()">Git-Focused</a> presets, or configure manually in Settings.</p>
            </div>
        `).replace("{{PRESETS_JSON}}",JSON.stringify(t))}L(e,t){return e.replace(/{{VERSION}}/g,t)}F(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Quick Setup</title>
                <style>
                    ${this.l()}
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
                    ${this.d()}
                    
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
        `}O(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Feature Tour</title>
                <style>
                    ${this.l()}
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
                    ${this.d()}

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
        `}A(){return`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Explorer Dates - What's New</title>
                <style>
                    ${this.l()}
                    
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
                    ${this.d()}

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
        `}l(){return`
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
        `}d(){return`
            const vscode = acquireVsCodeApi();
        `}getPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",showFileSize:!0,showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}},powerUser:{name:"Power User",description:"All features enabled: Git badges, sizes, colors, and status bar details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",showFileSize:!0,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}},gitFocused:{name:"Git-Focused",description:"Prioritize Git authorship and commit details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"subtle",showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}}}}getTips(){return[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."},{icon:"\u{1F4CA}",title:"Performance Analytics",description:'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'},{icon:"\u{1F50D}",title:"Context Menu",description:"Right-click any file to access Git history, file details, and quick actions."}]}getMemoryInfo(){return{chunkName:"onboarding-assets",estimatedSize:"~23KB",templatesLoaded:this.r,templateCount:this.t?Object.keys(this.t).length:0,loaded:this.r}}dispose(){this.t=null,this.r=!1,this._logger.debug("Onboarding assets disposed")}};I.exports={OnboardingAssets:g,createOnboardingAssets:()=>new g,getPresets:()=>new g().getPresets(),getTips:()=>new g().getTips(),getMemoryInfo:(()=>{let i=null;return()=>(i||(i=new g),i.getMemoryInfo())})()}});var b=p((pe,R)=>{var d=null,c=null,{getLogger:ie}=w(),y=ie(),n=require("vscode"),{getSettingsCoordinator:se}=E(),re={minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",showFileSize:!0,showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}},powerUser:{name:"Power User",description:"All features enabled: Git badges, sizes, colors, and status bar details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",showFileSize:!0,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}},gitFocused:{name:"Git-Focused",description:"Prioritize Git authorship and commit details",hidden:!0,settings:{dateDecorationFormat:"smart",colorScheme:"subtle",showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0,highContrastMode:!1,accessibilityMode:!1}}},S=class{constructor(e){this.e=e,this.o=se()}async showQuickSetupWizard(){let e=n.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=await this.w(),o=await v();o&&typeof o.getSetupWizardHTML=="function"?e.webview.html=await o.getSetupWizardHTML(t):e.webview.html=this.W(),e.webview.onDidReceiveMessage(async s=>{await this.g(s,e)})}async showFeatureTour(){let e=n.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",n.ViewColumn.One,{enableScripts:!1,retainContextWhenHidden:!1}),t=await v();t&&typeof t.getFeatureTourHTML=="function"?e.webview.html=await t.getFeatureTourHTML():e.webview.html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feature Tour</title></head><body><h1>Explorer Dates Feature Tour</h1><p>Feature tour is unavailable in this session.</p></body></html>'}async showWhatsNew(e=""){let t=n.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates ${e?`v${e}`:""} - What's New`,n.ViewColumn.One,{enableScripts:!1,retainContextWhenHidden:!1}),o=await v();o&&typeof o.getWhatsNewHTML=="function"?t.webview.html=await o.getWhatsNewHTML(e):t.webview.html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>What's New</title></head><body><h1>What's New ${e}</h1><p>What's new content is unavailable in this session.</p></body></html>`}async showWelcomeMessage(){await n.window.showInformationMessage("Explorer Dates onboarding is unavailable. Open settings to configure.","Open Settings").then(e=>{e==="Open Settings"&&n.commands.executeCommand("workbench.action.openSettings","explorerDates")})}async w(){try{let e=await v();if(e&&typeof e.getPresets=="function")return e.getPresets()}catch{}return re}W(){return`<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Quick Setup</title></head>
            <body>
                <h1>Explorer Dates Quick Setup</h1>
                <p>The onboarding UI could not be fully loaded in this session.</p>
                <p>Please open settings to configure Explorer Dates manually.</p>
            </body>
            </html>`}async g(e,t){try{switch(e.command){case"applyConfiguration":await this.h(e.configuration),this.e?.globalState?.update&&await this.e.globalState.update("explorerDates.hasCompletedSetup",!0),n.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&await n.commands.executeCommand("explorerDates.previewConfiguration",e.settings);break;case"clearPreview":await n.commands.executeCommand("explorerDates.clearPreview");break;case"skipSetup":this.e?.globalState?.update&&await this.e.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await n.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(o){y.warn("Fallback onboarding message handling failed",o)}}async h(e={}){if(e)try{if(e.preset){let o=(await this.w())[e.preset];o?.settings&&await this.o.applySettings(o.settings,{scope:"user",reason:`onboarding-preset:${e.preset}`})}e.individual&&await this.o.applySettings(e.individual,{scope:"user",reason:"onboarding-individual"});try{await n.commands.executeCommand("explorerDates.refreshDateDecorations")}catch{}}catch(t){y.warn("Fallback onboarding apply failed",t)}}};async function ae(){if(!(d&&c))try{let i=await Promise.resolve().then(()=>_(N()));if(d=i.OnboardingManager||i.default?.OnboardingManager||i.default,c=i.createOnboardingManager,typeof c!="function"&&typeof d=="function"&&(c=e=>new d(e)),typeof c!="function")throw new Error("Onboarding logic loaded without a valid factory")}catch{try{let i=await Promise.resolve().then(()=>_(M()));if(d=i.OnboardingManager||i.default?.OnboardingManager||i.default,c=i.createOnboardingManager,typeof c!="function"&&typeof d=="function"&&(c=e=>new d(e)),typeof c!="function")throw new Error("Onboarding fallback loaded without a valid factory")}catch(i){y.warn("Onboarding logic unavailable, using minimal fallback",i),d=S,c=e=>new S(e)}}}var x=!1,h=null,v=async()=>{if(x&&h)return h;try{return h=z().createOnboardingAssets(),await h.initialize(),x=!0,y.info("Onboarding webview assets loaded",{chunk:"onboarding-assets",estimatedKB:23}),h}catch(i){return y.warn("Failed to load onboarding assets, falling back to inline templates",i),null}};R.exports={OnboardingManager:d,createOnboardingManager:async i=>(await ae(),c(i)),loadOnboardingAssets:v,getAssetsMemoryInfo:()=>h?h.getMemoryInfo():{loaded:x,templatesLoaded:x,chunkName:"onboarding-assets",estimatedSize:"~23KB"}}});module.exports=b();
