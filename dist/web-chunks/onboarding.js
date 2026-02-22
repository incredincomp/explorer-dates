var module = { exports: {} }; var exports = module.exports; (function() {
var I=Object.create;var k=Object.defineProperty;var W=Object.getOwnPropertyDescriptor;var z=Object.getOwnPropertyNames;var H=Object.getPrototypeOf,B=Object.prototype.hasOwnProperty;var u=(i,e)=>()=>(e||i((e={exports:{}}).exports,e),e.exports);var G=(i,e,t,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of z(e))!B.call(i,r)&&r!==t&&k(i,r,{get:()=>e[r],enumerable:!(o=W(e,r))||o.enumerable});return i};var E=(i,e,t)=>(t=i!=null?I(H(i)):{},G(e||!i||!i.__esModule?k(t,"default",{value:i,enumerable:!0}):t,i));var v=u((re,_)=>{var h="__explorerDatesLogger",f=class{constructor(){this.s=null}a(e,t){if(this.s&&typeof this.s[e]=="function")try{return this.s[e](...t)}catch{}switch(e){case"debug":break;case"info":break;case"warn":break;case"error":break;default:break}}debug(...e){return this.a("debug",e)}info(...e){return this.a("info",e)}warn(...e){return this.a("warn",e)}error(...e){return this.a("error",e)}P(e){this.s=e}};function V(){return typeof global<"u"?(global[h]||(global[h]=new f),global[h]):typeof globalThis<"u"?(globalThis[h]||(globalThis[h]=new f),globalThis[h]):(w||(w=new f),w)}var y=class extends f{},w=null;_.exports={Logger:y,getLogger:V}});var O=u((se,M)=>{var K=["Ja","Fe","Mr","Ap","My","Jn","Jl","Au","Se","Oc","No","De"],$=Number(process.env.EXPLORER_DATES_DECORATION_POOL_SIZE||2048),q=Number(process.env.EXPLORER_DATES_FLYWEIGHT_CACHE_SIZE||4096),U=Number(process.env.EXPLORER_DATES_WORKSPACE_BALANCED_THRESHOLD||15e3),Y=Number(process.env.EXPLORER_DATES_WORKSPACE_LARGE_THRESHOLD||25e4),T=Number(process.env.EXPLORER_DATES_WORKSPACE_EXTREME_THRESHOLD||4e5),X=Number(process.env.EXPLORER_DATES_WORKSPACE_SCAN_MAX_RESULTS||Math.min(T+1,50001)),j={ADVANCED_CACHE:"explorerDates.advancedCache",ADVANCED_CACHE_METADATA:"explorerDates.advancedCacheMetadata",TEMPLATE_STORE:"explorerDates.templates",WEB_GIT_NOTICE:"explorerDates.webGitNotice"},Q="explorerDatesChunks",J="__explorerDatesChunks";M.exports={DEFAULT_CACHE_TIMEOUT:12e4,DEFAULT_MAX_CACHE_SIZE:1e4,DEFAULT_PERSISTENT_CACHE_TTL:864e5,DEFAULT_DECORATION_POOL_SIZE:$,DEFAULT_FLYWEIGHT_CACHE_SIZE:q,MAX_BADGE_LENGTH:2,MONTH_ABBREVIATIONS:K,WORKSPACE_SCALE_BALANCED_THRESHOLD:U,WORKSPACE_SCALE_LARGE_THRESHOLD:Y,WORKSPACE_SCALE_EXTREME_THRESHOLD:T,WORKSPACE_SCAN_MAX_RESULTS:X,GLOBAL_STATE_KEYS:j,WEB_CHUNK_GLOBAL_KEY:Q,LEGACY_WEB_CHUNK_GLOBAL_KEY:J}});var A=u((exports,module)=>{var{getLogger}=v();function createFallbackVscodeMinimal(){return{workspace:{workspaceFolders:[],getConfiguration:()=>({get:()=>{},async update(){},inspect:()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})})},ConfigurationTarget:{Global:1,Workspace:2,WorkspaceFolder:3}}}function resolveVscodeMinimal(){try{return require("vscode")}catch{return createFallbackVscodeMinimal()}}var MinimalSettingsCoordinator=class{constructor(e={}){this.m=e.defaultSection||"explorerDates",this.n=new Map,this.p=new Map,this.N=Number(process.env.EXPLORER_DATES_LOCK_WAIT_WARN_MS||1e3),this._logger=getLogger()}v(e,t){let r=(this.n.get(e)||Promise.resolve()).then(()=>t()),s=r.catch(()=>{});return this.n.set(e,s),r.finally(()=>{this.n.get(e)===s&&this.n.delete(e)}),r}l(e,t){return resolveVscodeMinimal().workspace.getConfiguration(e||void 0,t)}o(e,t){let o=t||this.m;return o?e.startsWith(`${o}.`)?{section:o,key:e.slice(o.length+1),fullKey:e}:e.includes(".")?{section:void 0,key:e,fullKey:e}:{section:o,key:e,fullKey:`${o}.${e}`}:{section:void 0,key:e,fullKey:e}}async updateSetting(e,t,o={}){return this.v(this.o(e,o.section).fullKey,async()=>{let r=this.o(e,o.section),s=this.l(r.section,o.resource);try{let a=this.b(o.scope,o.resource);return await s.update(r.key,t,a),{key:r.fullKey,updated:!0}}catch(a){try{this._logger.warn(`Configuration update failed for ${r.fullKey}: ${a&&a.message}`)}catch{}return{key:r.fullKey,updated:!1,error:a}}})}async applySettings(e,t={}){let o=Array.isArray(e)?e:Object.entries(e).map(([a,c])=>({key:a,value:c})),r=[];for(let a of o)try{r.push(await this.updateSetting(a.key,a.value,t))}catch(c){r.push({key:this.o(a.key,t.section).fullKey,updated:!1,error:c})}let s=r.filter(a=>a&&a.error);if(s.length>0){let a=s.map(d=>`${d.key}: ${d.error&&d.error.message?d.error.message:String(d.error)}`),c=new Error(`Failed to apply ${s.length} setting(s): ${a.join("; ")}`);throw c.details=s,c}return r}b(e,t){return e&&e!=="auto"?this.w(e)||resolveVscodeMinimal().ConfigurationTarget.Workspace:t?resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder:resolveVscodeMinimal().workspace.workspaceFolders&&resolveVscodeMinimal().workspace.workspaceFolders.length>0?resolveVscodeMinimal().ConfigurationTarget.Workspace:resolveVscodeMinimal().ConfigurationTarget.Global}w(e){switch(e){case"user":return resolveVscodeMinimal().ConfigurationTarget.Global;case"workspace":return resolveVscodeMinimal().ConfigurationTarget.Workspace;case"workspaceFolder":return resolveVscodeMinimal().ConfigurationTarget.WorkspaceFolder;default:return}}getValue(e,t={}){let{section:o,resource:r}=t||{},s=this.o(e,o);return this.l(s.section,r).get(s.key)}inspect(e,t={}){let{section:o,resource:r}=t||{},s=this.o(e,o);return this.l(s.section,r).inspect(s.key)}async clearSetting(e,t={}){return this.updateSetting(e,void 0,t)}getLockWaitStats(){let e={};for(let[t,o]of this.p.entries())e[t]={...o};return e}resetLockWaitStats(){this.p.clear()}},cachedCoordinator=null;function getSettingsCoordinator(options){if(!cachedCoordinator||options&&options.forceNew){try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){let i=null;try{i=dynamicRequire("../chunks/settings-coordinator-impl-chunk")}catch{}try{i||(i=dynamicRequire("../chunks/settingsCoordinator-impl-chunk"))}catch{}if(i&&typeof i.createSettingsCoordinatorImpl=="function")return cachedCoordinator=i.createSettingsCoordinatorImpl(options),cachedCoordinator}}catch{}try{let{WEB_CHUNK_GLOBAL_KEY:i,LEGACY_WEB_CHUNK_GLOBAL_KEY:e}=O(),t=typeof globalThis<"u"&&(globalThis[i]||globalThis[e])||null;if(t&&t.settingsCoordinatorImpl&&typeof t.settingsCoordinatorImpl.createSettingsCoordinatorImpl=="function")return cachedCoordinator=t.settingsCoordinatorImpl.createSettingsCoordinatorImpl(options),cachedCoordinator}catch{}cachedCoordinator=new MinimalSettingsCoordinator(options)}return cachedCoordinator}module.exports={getSettingsCoordinator,MinimalSettingsCoordinator}});var S=u((exports,module)=>{var vscode=require("vscode"),getLogger=()=>{try{let dynamicRequire=typeof eval=="function"?eval("require"):null;if(typeof dynamicRequire=="function"){let i=dynamicRequire("./chunks/logger-chunk");if(i&&typeof i.getLogger=="function")return getLogger=i.getLogger,getLogger()}}catch{}try{return getLogger=v().getLogger,getLogger()}catch{return getLogger=()=>({debug:(()=>{})?.bind(console)||console.log,info:(()=>{}).bind(console),warn:(()=>{}).bind(console),error:(()=>{}).bind(console)}),getLogger()}},{getLocalization}=require("./utils/localization"),{getSettingsCoordinator}=A(),OnboardingManager=class{constructor(e){this.e=e,this._logger=getLogger(),this.R=getLocalization(),this.u=getSettingsCoordinator(),this.g=e.globalState.get("explorerDates.hasShownWelcome",!1),this.h=e.globalState.get("explorerDates.hasCompletedSetup",!1),this.i=e.globalState.get("explorerDates.onboardingVersion","0.0.0"),this._logger.info("OnboardingManager initialized",{hasShownWelcome:this.g,hasCompletedSetup:this.h,onboardingVersion:this.i})}async shouldShowOnboarding(){let e=this.e.extension.packageJSON.version;return!this.g||!this.h||this.y(e)}y(e){if(this.i==="0.0.0")return!0;let[t]=e.split(".").map(Number),[o]=this.i.split(".").map(Number);return t>o}S(e){if(this.i==="0.0.0")return!1;let[t,o]=e.split(".").map(Number),[r,s]=this.i.split(".").map(Number);return t===r&&o>s}async showWelcomeMessage(){try{let e=this.e.extension.packageJSON.version,t=this.g,o=this.S(e);if(o)return this.x(e);let r=this.e.globalState.get("explorerDates.migrationHistory",[]),s=r.find(C=>C.extensionVersion===e&&C.migratedSettings.length>0),a=t?`Explorer Dates has been updated to v${e} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!";s&&(a+=`

\u2705 Your settings have been automatically migrated to maintain compatibility.`);let c=t?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"];r.length>0&&t&&c.splice(-1,0,"\u{1F4DC} Migration History");let d=await vscode.window.showInformationMessage(a,{modal:!1},...c);switch(await this.e.globalState.update("explorerDates.hasShownWelcome",!0),await this.e.globalState.update("explorerDates.onboardingVersion",e),d){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(e);break;case"\u{1F4DC} Migration History":await vscode.commands.executeCommand("explorerDates.showMigrationHistory");break;case"\u2699\uFE0F Settings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await vscode.commands.executeCommand("explorerDates.previewConfiguration",a.settings);break;case"clearPreview":await vscode.commands.executeCommand("explorerDates.clearPreview");break}this._logger.info("Welcome message shown",{action:d,isUpdate:t,isMinorUpdate:o})}catch(e){this._logger.error("Failed to show welcome message",e)}}async x(e){let t=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,100);t.text=`$(check) Explorer Dates updated to v${e}`,t.tooltip="Click to see what's new in Explorer Dates",t.command="explorerDates.showWhatsNew",t.show(),setTimeout(()=>{t.dispose()},1e4),await this.e.globalState.update("explorerDates.onboardingVersion",e),this._logger.info("Showed gentle update notification",{version:e})}async showQuickSetupWizard(){try{let e=vscode.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=await this.C();e.webview.html=t,e.webview.onDidReceiveMessage(async o=>{await this.k(o,e)}),this._logger.info("Quick setup wizard opened")}catch(e){this._logger.error("Failed to show setup wizard",e)}}async k(e,t){try{switch(e.command){case"applyConfiguration":await this.E(e.configuration),await this.e.globalState.update("explorerDates.hasCompletedSetup",!0),vscode.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&(await vscode.commands.executeCommand("explorerDates.previewConfiguration",e.settings),this._logger.info("Configuration preview applied via webview",e.settings));break;case"clearPreview":await vscode.commands.executeCommand("explorerDates.clearPreview"),this._logger.info("Configuration preview cleared via webview");break;case"skipSetup":await this.e.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(o){this._logger.error("Failed to handle setup wizard message",o)}}async E(e){if(e.preset){let o=(await this.f())[e.preset];o&&(this._logger.info(`Applying preset: ${e.preset}`,o.settings),await this.u.applySettings(o.settings,{scope:"user",reason:`onboarding-preset:${e.preset}`}),this._logger.info(`Applied preset: ${e.preset}`,o.settings),vscode.window.showInformationMessage(`Applied "${o.name}" configuration. Changes should be visible immediately!`))}e.individual&&(await this.u.applySettings(e.individual,{scope:"user",reason:"onboarding-individual"}),this._logger.info("Applied individual settings",e.individual));try{await vscode.commands.executeCommand("explorerDates.refreshDateDecorations"),this._logger.info("Decorations refreshed after configuration change")}catch(t){this._logger.warn("Failed to refresh decorations after configuration change",t)}}async f(){try{let{loadOnboardingAssets:e}=m(),t=await e();if(t&&typeof t.getPresets=="function")return t.getPresets()}catch(e){this._logger.debug("Onboarding presets assets not available, using inline defaults",e)}return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",showFileSize:!0,showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}async showFeatureTour(){try{let e=vscode.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=await this._();e.webview.html=t,e.webview.onDidReceiveMessage(async o=>{o.command==="openSettings"?await vscode.commands.executeCommand("workbench.action.openSettings",o.setting||"explorerDates"):o.command==="runCommand"&&await vscode.commands.executeCommand(o.commandId)}),this._logger.info("Feature tour opened")}catch(e){this._logger.error("Failed to show feature tour",e)}}async C(){let e=await this.f(),t={minimal:e.minimal,developer:e.developer,accessible:e.accessible};try{let{loadOnboardingAssets:o}=m(),r=await o();if(r)return this._logger.debug("Using chunked onboarding assets for setup wizard"),await r.getSetupWizardHTML(t)}catch(o){this._logger.warn("Failed to load chunked assets, using inline fallback",o)}return`<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>Quick Setup</title></head>
            <body>
                <h1>Explorer Dates Quick Setup</h1>
                <p>Full UI is loaded on demand; reopen the wizard to load full assets.</p>
            </body>
            </html>`}async _(){try{let{loadOnboardingAssets:e}=m(),t=await e();if(t)return this._logger.debug("Using chunked onboarding assets for feature tour"),await t.getFeatureTourHTML()}catch(e){this._logger.warn("Failed to load chunked assets for feature tour, using inline fallback",e)}return'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feature Tour</title></head><body><h1>Explorer Dates - Feature Tour</h1><p>Full tour loads on demand.</p></body></html>'}async showTipsAndTricks(){let e=null;try{let{loadOnboardingAssets:s}=m(),a=await s();a&&typeof a.getTips=="function"&&(e=a.getTips())}catch(s){this._logger.debug("Tips assets unavailable, using inline minimal tips",s)}e||(e=[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."}]);let t=e[Math.floor(Math.random()*e.length)],o=`\u{1F4A1} **Tip**: ${t.title}
${t.description}`;await vscode.window.showInformationMessage(o,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(e){try{let t=vscode.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${e} - What's New`,vscode.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1}),o=await this.T(e);t.webview.html=o,t.webview.onDidReceiveMessage(async r=>{switch(r.command){case"openSettings":await vscode.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break;case"tryFeature":r.feature==="badgePriority"&&(await this.u.updateSetting("badgePriority","author",{scope:"user",reason:"whats-new-demo"}),vscode.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":t.dispose();break}})}catch(t){this._logger.error("Failed to show what's new",t)}}async T(e){try{let{loadOnboardingAssets:t}=m(),o=await t();if(o)return this._logger.debug("Using chunked onboarding assets for what's new"),await o.getWhatsNewHTML(e)}catch(t){this._logger.warn("Failed to load chunked assets for what's new, using inline fallback",t)}return this.M(e)}M(e){return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>What's New</title></head><body><h1>What's New ${e}</h1><p>Full content loads on demand.</p></body></html>`}};module.exports={OnboardingManager}});var F=u((ae,L)=>{var{OnboardingManager:D}=S();L.exports={OnboardingManager:D,createOnboardingManager:i=>new D(i)}});var N=u((ne,P)=>{var{getLogger:Z}=v(),g=class{constructor(){this._logger=Z(),this.t=null,this.r=!1}async initialize(){if(!this.r)try{this.t={setupWizardTemplate:this.O(),featureTourTemplate:this.A(),whatsNewTemplate:this.D(),sharedStyles:this.c(),sharedScripts:this.d()},this.r=!0,this._logger.debug("Onboarding assets initialized (~23KB lazy loaded)")}catch(e){throw this._logger.error("Failed to initialize onboarding assets",e),e}}async getSetupWizardHTML(e){return await this.initialize(),this.L(this.t.setupWizardTemplate,e)}async getFeatureTourHTML(){return await this.initialize(),this.t.featureTourTemplate}async getWhatsNewHTML(e){return await this.initialize(),this.F(this.t.whatsNewTemplate,e)}L(e,t){let o=Object.entries(t).map(([s,a])=>`
            <div class="preset-option" data-preset="${s}" 
                 onmouseenter="previewConfiguration({preset: '${s}'})" 
                 onmouseleave="clearPreview()">
                <h3>${a.name}</h3>
                <p>${a.description}</p>
                <div class="preset-actions">
                    <button onclick="previewConfiguration({preset: '${s}'})">\u{1F441}\uFE0F Preview</button>
                    <button onclick="applyConfiguration({preset: '${s}'})">\u2705 Select ${a.name}</button>
                </div>
            </div>
        `).join("");return e.replace("{{PRESET_OPTIONS}}",o).replace("{{MORE_OPTIONS_LINK}}",`
            <div class="more-options">
                <p><strong>Need more options?</strong> Try the <a href="#" onclick="showAllPresets()">Power User</a> or <a href="#" onclick="showGitFocused()">Git-Focused</a> presets, or configure manually in Settings.</p>
            </div>
        `).replace("{{PRESETS_JSON}}",JSON.stringify(t))}F(e,t){return e.replace(/{{VERSION}}/g,t)}O(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Quick Setup</title>
                <style>
                    ${this.c()}
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
                <\/script>
            </body>
            </html>
        `}A(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Feature Tour</title>
                <style>
                    ${this.c()}
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
                <\/script>
            </body>
            </html>
        `}D(){return`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Explorer Dates - What's New</title>
                <style>
                    ${this.c()}
                    
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
                <\/script>
            </body>
            </html>
        `}c(){return`
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
        `}getPresets(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",showFileSize:!0,showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}getTips(){return[{icon:"\u2328\uFE0F",title:"Keyboard Shortcuts",description:"Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."},{icon:"\u{1F3AF}",title:"Smart Exclusions",description:"The extension automatically detects and suggests excluding build folders for better performance."},{icon:"\u{1F4CA}",title:"Performance Analytics",description:'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'},{icon:"\u{1F50D}",title:"Context Menu",description:"Right-click any file to access Git history, file details, and quick actions."}]}getMemoryInfo(){return{chunkName:"onboarding-assets",estimatedSize:"~23KB",templatesLoaded:this.r,templateCount:this.t?Object.keys(this.t).length:0,loaded:this.r}}dispose(){this.t=null,this.r=!1,this._logger.debug("Onboarding assets disposed")}};P.exports={OnboardingAssets:g,createOnboardingAssets:()=>new g,getPresets:()=>new g().getPresets(),getTips:()=>new g().getTips(),getMemoryInfo:(()=>{let i=null;return()=>(i||(i=new g),i.getMemoryInfo())})()}});var m=u((ce,R)=>{var l=null,n=null,{getLogger:ee}=v(),x=ee();async function te(){if(!(l&&n))try{let i=await Promise.resolve().then(()=>E(F()));if(l=i.OnboardingManager||i.default?.OnboardingManager||i.default,n=i.createOnboardingManager,typeof n!="function"&&typeof l=="function"&&(n=e=>new l(e)),typeof n!="function")throw new Error("Onboarding logic loaded without a valid factory")}catch{try{let i=await Promise.resolve().then(()=>E(S()));if(l=i.OnboardingManager||i.default?.OnboardingManager||i.default,n=i.createOnboardingManager,typeof n!="function"&&typeof l=="function"&&(n=e=>new l(e)),typeof n!="function")throw new Error("Onboarding fallback loaded without a valid factory")}catch(i){throw x.warn("Onboarding logic unavailable",i),i}}}var b=!1,p=null,oe=async()=>{if(b&&p)return p;try{return p=N().createOnboardingAssets(),await p.initialize(),b=!0,x.info("Onboarding webview assets loaded",{chunk:"onboarding-assets",estimatedKB:23}),p}catch(i){return x.warn("Failed to load onboarding assets, falling back to inline templates",i),null}};R.exports={OnboardingManager:l,createOnboardingManager:async i=>(await te(),n(i)),loadOnboardingAssets:oe,getAssetsMemoryInfo:()=>p?p.getMemoryInfo():{loaded:b,templatesLoaded:b,chunkName:"onboarding-assets",estimatedSize:"~23KB"}}});module.exports=m();
})(); (function(){const primaryKey="explorerDatesChunks";const legacyKey="__explorerDatesChunks";const registry=(globalThis[primaryKey]=globalThis[primaryKey]||globalThis[legacyKey]||(globalThis[legacyKey]={}));registry["onboarding"]=module.exports;})();
