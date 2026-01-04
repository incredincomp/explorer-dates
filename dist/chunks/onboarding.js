var g=(o,e)=>()=>(e||o((e={exports:{}}).exports,e),e.exports);var b=g((exports,module)=>{var vscode=require("vscode"),isWebRuntime=process.env.VSCODE_WEB==="true",inspectValue=isWebRuntime?o=>{if(typeof o=="string")return o;try{return JSON.stringify(o,null,2)}catch{return"<<unable to serialize log arg>>"}}:eval("require")("util").inspect,DEFAULT_LOG_PROFILE="default",SUPPORTED_PROFILES=new Set(["default","stress","soak"]),LOG_LEVEL_ORDER=["debug","info","warn","error"],DEFAULT_CONSOLE_LEVEL="warn",Logger=class{constructor(){this.t=vscode.window.createOutputChannel("Explorer Dates"),this.f=!1,this.o=null,this.s=(process.env.EXPLORER_DATES_LOG_PROFILE||DEFAULT_LOG_PROFILE).toLowerCase(),SUPPORTED_PROFILES.has(this.s)||(this.s=DEFAULT_LOG_PROFILE),this.a=new Map,this.y=DEFAULT_CONSOLE_LEVEL,this.x(),this.o=vscode.workspace.onDidChangeConfiguration(e=>{(e.affectsConfiguration("explorerDates.enableLogging")||e.affectsConfiguration("explorerDates.consoleLogLevel"))&&this.x()})}x(){let e=vscode.workspace.getConfiguration("explorerDates");this.f=e.get("enableLogging",!1);let t=(e.get("consoleLogLevel",DEFAULT_CONSOLE_LEVEL)||"").toLowerCase();this.y=LOG_LEVEL_ORDER.includes(t)?t:DEFAULT_CONSOLE_LEVEL}setLogProfile(e=DEFAULT_LOG_PROFILE){let t=(e||DEFAULT_LOG_PROFILE).toLowerCase();this.s=SUPPORTED_PROFILES.has(t)?t:DEFAULT_LOG_PROFILE,this.resetThrottle()}resetThrottle(e){if(e){this.a.delete(e);return}this.a.clear()}debug(e,...t){this.f&&this.d("debug",null,e,t)}info(e,...t){this.d("info",null,e,t)}infoWithOptions(e,t,...i){this.d("info",e||null,t,i)}warn(e,...t){this.d("warn",null,e,t)}error(e,t,...i){let r=`[${new Date().toISOString()}] [ERROR] ${e}`;this.t.appendLine(r),t instanceof Error?(this.t.appendLine(`Error: ${t.message}`),t.stack&&this.t.appendLine(`Stack: ${t.stack}`)):t&&this.t.appendLine(this.g(t));let s=this.k(i);s.length>0&&s.forEach(d=>this.t.appendLine(this.g(d))),this.h("error",r,[t,...s])}show(){this.t.show()}clear(){this.t.clear()}dispose(){this.t.dispose(),this.o&&(this.o.dispose(),this.o=null);let e="__explorerDatesLogger";typeof global<"u"&&global[e]===this?global[e]=null:typeof globalThis<"u"&&globalThis[e]===this?globalThis[e]=null:typeof window<"u"&&window[e]===this&&(window[e]=null),loggerInstance===this&&(loggerInstance=null)}d(e,t,i,a){if(e==="debug"&&!this.f||this.E(e,t))return;let s=`[${new Date().toISOString()}] [${e.toUpperCase()}] ${i}`;this.t.appendLine(s);let d=this.k(a);d.length>0&&d.forEach(f=>this.t.appendLine(this.g(f))),this.h(e,s,d)}k(e){return!e||e.length===0?[]:e.map(t=>{if(typeof t!="function")return t;try{return t()}catch(i){return`<<log arg threw: ${i.message}>>`}})}g(e){try{return typeof e=="string"?e:typeof e=="object"?JSON.stringify(e,null,2):inspectValue(e)}catch(t){return`<<failed to serialize log arg: ${t.message}>>`}}E(e,t){if(e!=="info"||!t||!t.throttleKey)return!1;let i=(t.profile||"stress").toLowerCase();if(!this.O(i))return!1;let a=Number(t.throttleLimit)||50,r=t.throttleKey,s=this.a.get(r)||{count:0,suppressed:0,noticeLogged:!1};if(s.count<a)return s.count+=1,this.a.set(r,s),!1;if(s.suppressed+=1,!s.noticeLogged){s.noticeLogged=!0;let d=`[${new Date().toISOString()}] [INFO] \u23F8\uFE0F Suppressing further logs for "${r}" after ${a} entries (profile=${this.s})`;this.t.appendLine(d),this.h("info",d)}return this.a.set(r,s),!0}O(e){let t=this.s||DEFAULT_LOG_PROFILE;return e==="default"?t===DEFAULT_LOG_PROFILE:t===e}D(e){let t=LOG_LEVEL_ORDER.indexOf(this.y),i=LOG_LEVEL_ORDER.indexOf(e);return t===-1||i===-1?!1:i>=t}h(e,t,i=[]){if(!this.D(e))return;(e==="warn"?console.warn:e==="error"?console.error:console.log).call(console,t,...i)}},GLOBAL_LOGGER_KEY="__explorerDatesLogger";function getLogger(){return typeof global<"u"?(global[GLOBAL_LOGGER_KEY]||(global[GLOBAL_LOGGER_KEY]=new Logger),global[GLOBAL_LOGGER_KEY]):typeof globalThis<"u"?(globalThis[GLOBAL_LOGGER_KEY]||(globalThis[GLOBAL_LOGGER_KEY]=new Logger),globalThis[GLOBAL_LOGGER_KEY]):typeof window<"u"?(window[GLOBAL_LOGGER_KEY]||(window[GLOBAL_LOGGER_KEY]=new Logger),window[GLOBAL_LOGGER_KEY]):(loggerInstance||(loggerInstance=new Logger),loggerInstance)}var loggerInstance=null;module.exports={Logger,getLogger}});var P=g((le,A)=>{var O=require("vscode"),w={en:{now:"now",minutes:"m",hours:"h",days:"d",weeks:"w",months:"mo",years:"y",justNow:"just now",minutesAgo:o=>`${o} minute${o!==1?"s":""} ago`,hoursAgo:o=>`${o} hour${o!==1?"s":""} ago`,yesterday:"yesterday",daysAgo:o=>`${o} day${o!==1?"s":""} ago`,lastModified:"Last modified",refreshSuccess:"Date decorations refreshed",activationError:"Explorer Dates failed to activate",errorAccessingFile:"Error accessing file for decoration"},es:{now:"ahora",minutes:"m",hours:"h",days:"d",weeks:"s",months:"m",years:"a",justNow:"ahora mismo",minutesAgo:o=>`hace ${o} minuto${o!==1?"s":""}`,hoursAgo:o=>`hace ${o} hora${o!==1?"s":""}`,yesterday:"ayer",daysAgo:o=>`hace ${o} d\xEDa${o!==1?"s":""}`,lastModified:"\xDAltima modificaci\xF3n",refreshSuccess:"Decoraciones de fecha actualizadas",activationError:"Explorer Dates no se pudo activar",errorAccessingFile:"Error al acceder al archivo para decoraci\xF3n"},fr:{now:"maintenant",minutes:"m",hours:"h",days:"j",weeks:"s",months:"m",years:"a",justNow:"\xE0 l'instant",minutesAgo:o=>`il y a ${o} minute${o!==1?"s":""}`,hoursAgo:o=>`il y a ${o} heure${o!==1?"s":""}`,yesterday:"hier",daysAgo:o=>`il y a ${o} jour${o!==1?"s":""}`,lastModified:"Derni\xE8re modification",refreshSuccess:"D\xE9corations de date actualis\xE9es",activationError:"\xC9chec de l'activation d'Explorer Dates",errorAccessingFile:"Erreur lors de l'acc\xE8s au fichier pour la d\xE9coration"},de:{now:"jetzt",minutes:"Min",hours:"Std",days:"T",weeks:"W",months:"Mon",years:"J",justNow:"gerade eben",minutesAgo:o=>`vor ${o} Minute${o!==1?"n":""}`,hoursAgo:o=>`vor ${o} Stunde${o!==1?"n":""}`,yesterday:"gestern",daysAgo:o=>`vor ${o} Tag${o!==1?"en":""}`,lastModified:"Zuletzt ge\xE4ndert",refreshSuccess:"Datumsdekorationen aktualisiert",activationError:"Explorer Dates konnte nicht aktiviert werden",errorAccessingFile:"Fehler beim Zugriff auf Datei f\xFCr Dekoration"},ja:{now:"\u4ECA",minutes:"\u5206",hours:"\u6642\u9593",days:"\u65E5",weeks:"\u9031",months:"\u30F6\u6708",years:"\u5E74",justNow:"\u305F\u3063\u305F\u4ECA",minutesAgo:o=>`${o}\u5206\u524D`,hoursAgo:o=>`${o}\u6642\u9593\u524D`,yesterday:"\u6628\u65E5",daysAgo:o=>`${o}\u65E5\u524D`,lastModified:"\u6700\u7D42\u66F4\u65B0",refreshSuccess:"\u65E5\u4ED8\u88C5\u98FE\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",activationError:"Explorer Dates\u306E\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F",errorAccessingFile:"\u30D5\u30A1\u30A4\u30EB\u30A2\u30AF\u30BB\u30B9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"},zh:{now:"\u73B0\u5728",minutes:"\u5206\u949F",hours:"\u5C0F\u65F6",days:"\u5929",weeks:"\u5468",months:"\u6708",years:"\u5E74",justNow:"\u521A\u521A",minutesAgo:o=>`${o}\u5206\u949F\u524D`,hoursAgo:o=>`${o}\u5C0F\u65F6\u524D`,yesterday:"\u6628\u5929",daysAgo:o=>`${o}\u5929\u524D`,lastModified:"\u6700\u540E\u4FEE\u6539",refreshSuccess:"\u65E5\u671F\u88C5\u9970\u5DF2\u5237\u65B0",activationError:"Explorer Dates \u6FC0\u6D3B\u5931\u8D25",errorAccessingFile:"\u8BBF\u95EE\u6587\u4EF6\u88C5\u9970\u65F6\u51FA\u9519"}},y=class{constructor(){this.l="en",this.o=null,this.S(),this.o=O.workspace.onDidChangeConfiguration(e=>{e.affectsConfiguration("explorerDates.locale")&&this.S()})}S(){let t=O.workspace.getConfiguration("explorerDates").get("locale","auto");t==="auto"&&(t=O.env.language.split("-")[0]),w[t]||(t="en"),this.l=t}getString(e,...t){let a=(w[this.l]||w.en)[e];return typeof a=="function"?a(...t):a||w.en[e]||e}getCurrentLocale(){return this.l}formatDate(e,t={}){try{return e.toLocaleDateString(this.l,t)}catch{return e.toLocaleDateString("en",t)}}dispose(){this.o&&(this.o.dispose(),this.o=null),h===this&&(h=null)}},h=null;function H(){return h||(h=new y),h}A.exports={LocalizationManager:y,getLocalization:H}});var I=g((ue,$)=>{var Q="__explorerDatesVscode",u=null,x=null,k=!1;function J(){try{return globalThis[Q]}catch{return}}function z(){if(x)return x;let o={get:()=>{},async update(){},inspect:()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})};return x={workspace:{workspaceFolders:[],getConfiguration:()=>o},ConfigurationTarget:{Global:1,Workspace:2,WorkspaceFolder:3}},x}var Z=new Set(["MODULE_NOT_FOUND","ERR_MODULE_NOT_FOUND","WEB_NATIVE_MODULE"]);function X(o){return!o||o.code&&Z.has(o.code)?!0:(typeof o.message=="string"?o.message:"").includes("Cannot find module 'vscode'")}function v(){let o=J();if(o)return u=D(o),k=!1,u;if(u&&!k)return u;try{u=D(require("vscode")),k=!1}catch(e){if(X(e))u=D(z()),k=!0;else throw e}return u}var c=new Proxy({},{get(o,e){return v()[e]},set(o,e,t){return v()[e]=t,!0},has(o,e){return e in v()},ownKeys(){return Reflect.ownKeys(v())},getOwnPropertyDescriptor(o,e){let t=Object.getOwnPropertyDescriptor(v(),e);return t&&(t.configurable=!0),t}}),ee="explorerDates",_="__explorerDatesConfigWrapped";function G(o){return!o||typeof o!="object"?{get:()=>{},async update(){},inspect:()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})}:(typeof o.get!="function"&&(o.get=()=>{}),typeof o.update!="function"&&(o.update=async()=>{}),typeof o.inspect!="function"&&(o.inspect=()=>({defaultValue:void 0,globalValue:void 0,workspaceValue:void 0,workspaceFolderValue:void 0})),o)}function D(o){if(!o)return z();o.ConfigurationTarget||(o.ConfigurationTarget={Global:1,Workspace:2,WorkspaceFolder:3}),o.workspace||(o.workspace={});let e=o.workspace.getConfiguration;if(typeof e=="function"&&!e[_]){let t=function(...i){let a=e.apply(this,i);return G(a)};t[_]=!0,o.workspace.getConfiguration=t}else typeof e!="function"&&(o.workspace.getConfiguration=()=>G());return Array.isArray(o.workspace.workspaceFolders)||(o.workspace.workspaceFolders=[]),o}var S=class{constructor(e={}){this.F=e.defaultSection||ee}getValue(e,t={}){let{section:i,resource:a}=t,r=this.v(e,i);return this.m(r.section,a).get(r.key)}inspect(e,t={}){let{section:i,resource:a}=t,r=this.v(e,i);return this.m(r.section,a).inspect(r.key)}async updateSetting(e,t,i={}){let{scope:a="auto",resource:r,section:s,reason:d="",force:f=!1}=i,l=this.v(e,s),E=this.m(l.section,r),M=this.T(a,r),K=E.get(l.key),q=E.inspect(l.key),Y=this.M(q,M);return t!==void 0&&this.A(K,t)&&!f&&Y!==void 0?{key:l.fullKey,updated:!1,reason:"unchanged"}:(await E.update(l.key,t,M),{key:l.fullKey,updated:!0})}async applySettings(e,t={}){let i=Array.isArray(e)?e:Object.entries(e).map(([r,s])=>({key:r,value:s})),a=[];for(let r of i){let s={...t,...r.options||{}};a.push(await this.updateSetting(r.key,r.value,s))}return a}async clearSetting(e,t={}){return this.updateSetting(e,void 0,t)}m(e,t){return c.workspace.getConfiguration(e||void 0,t)}v(e,t){let i=t||this.F;if(!i)return{section:void 0,key:e,fullKey:e};if(e.startsWith(`${i}.`)){let a=e.slice(i.length+1);return{section:i,key:a,fullKey:e}}return e.includes(".")?{section:void 0,key:e,fullKey:e}:{section:i,key:e,fullKey:`${i}.${e}`}}T(e,t){return e&&e!=="auto"?this.P(e)||c.ConfigurationTarget.Workspace:t?c.ConfigurationTarget.WorkspaceFolder:c.workspace.workspaceFolders&&c.workspace.workspaceFolders.length>0?c.ConfigurationTarget.Workspace:c.ConfigurationTarget.Global}P(e){switch(e){case"user":return c.ConfigurationTarget.Global;case"workspace":return c.ConfigurationTarget.Workspace;case"workspaceFolder":return c.ConfigurationTarget.WorkspaceFolder;default:return}}H(e){switch(e){case c.ConfigurationTarget.Global:return"user";case c.ConfigurationTarget.Workspace:return"workspace";case c.ConfigurationTarget.WorkspaceFolder:return"workspaceFolder";default:return"unknown"}}A(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(typeof e=="object")try{return JSON.stringify(e)===JSON.stringify(t)}catch{return!1}return!1}M(e,t){if(e)switch(t){case c.ConfigurationTarget.Global:return e.globalValue;case c.ConfigurationTarget.Workspace:return e.workspaceValue;case c.ConfigurationTarget.WorkspaceFolder:return e.workspaceFolderValue;default:return}}},F=null;function te(o){return(!F||o&&o.forceNew)&&(F=new S(o)),F}$.exports={SettingsCoordinator:S,getSettingsCoordinator:te}});var B=g((pe,R)=>{var n=require("vscode"),{getLogger:oe}=b(),{getLocalization:ie}=P(),{getSettingsCoordinator:re}=I(),T=class{constructor(e){this.i=e,this.e=oe(),this.Q=ie(),this.b=re(),this.w=e.globalState.get("explorerDates.hasShownWelcome",!1),this.L=e.globalState.get("explorerDates.hasCompletedSetup",!1),this.n=e.globalState.get("explorerDates.onboardingVersion","0.0.0"),this.e.info("OnboardingManager initialized",{hasShownWelcome:this.w,hasCompletedSetup:this.L,onboardingVersion:this.n})}async shouldShowOnboarding(){let e=this.i.extension.packageJSON.version;return!this.w||!this.L||this._(e)}_(e){if(this.n==="0.0.0")return!0;let[t]=e.split(".").map(Number),[i]=this.n.split(".").map(Number);return t>i}G(e){if(this.n==="0.0.0")return!1;let[t,i]=e.split(".").map(Number),[a,r]=this.n.split(".").map(Number);return t===a&&i>r}async showWelcomeMessage(){try{let e=this.i.extension.packageJSON.version,t=this.w,i=this.G(e);if(i)return this.z(e);let a=this.i.globalState.get("explorerDates.migrationHistory",[]),r=a.find(l=>l.extensionVersion===e&&l.migratedSettings.length>0),s=t?`Explorer Dates has been updated to v${e} with new features and improvements!`:"See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!";r&&(s+=`

\u2705 Your settings have been automatically migrated to maintain compatibility.`);let d=t?["\u{1F4D6} What's New","\u2699\uFE0F Settings","Dismiss"]:["\u{1F680} Quick Setup","\u{1F4D6} Feature Tour","\u2699\uFE0F Settings","Maybe Later"];a.length>0&&t&&d.splice(-1,0,"\u{1F4DC} Migration History");let f=await n.window.showInformationMessage(s,{modal:!1},...d);switch(await this.i.globalState.update("explorerDates.hasShownWelcome",!0),await this.i.globalState.update("explorerDates.onboardingVersion",e),f){case"\u{1F680} Quick Setup":await this.showQuickSetupWizard();break;case"\u{1F4D6} Feature Tour":await this.showFeatureTour();break;case"\u{1F4D6} What's New":await this.showWhatsNew(e);break;case"\u{1F4DC} Migration History":await n.commands.executeCommand("explorerDates.showMigrationHistory");break;case"\u2699\uFE0F Settings":await n.commands.executeCommand("workbench.action.openSettings","explorerDates");break;case"previewConfiguration":await n.commands.executeCommand("explorerDates.previewConfiguration",s.settings);break;case"clearPreview":await n.commands.executeCommand("explorerDates.clearPreview");break}this.e.info("Welcome message shown",{action:f,isUpdate:t,isMinorUpdate:i})}catch(e){this.e.error("Failed to show welcome message",e)}}async z(e){let t=n.window.createStatusBarItem(n.StatusBarAlignment.Right,100);t.text=`$(check) Explorer Dates updated to v${e}`,t.tooltip="Click to see what's new in Explorer Dates",t.command="explorerDates.showWhatsNew",t.show(),setTimeout(()=>{t.dispose()},1e4),await this.i.globalState.update("explorerDates.onboardingVersion",e),this.e.info("Showed gentle update notification",{version:e})}async showQuickSetupWizard(){try{let e=n.window.createWebviewPanel("explorerDatesSetup","Explorer Dates Quick Setup",n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=await this.$();e.webview.html=t,e.webview.onDidReceiveMessage(async i=>{await this.I(i,e)}),this.e.info("Quick setup wizard opened")}catch(e){this.e.error("Failed to show setup wizard",e)}}async I(e,t){try{switch(e.command){case"applyConfiguration":await this.R(e.configuration),await this.i.globalState.update("explorerDates.hasCompletedSetup",!0),n.window.showInformationMessage("\u2705 Explorer Dates configured successfully!"),t.dispose();break;case"previewConfiguration":e.settings&&(await n.commands.executeCommand("explorerDates.previewConfiguration",e.settings),this.e.info("Configuration preview applied via webview",e.settings));break;case"clearPreview":await n.commands.executeCommand("explorerDates.clearPreview"),this.e.info("Configuration preview cleared via webview");break;case"skipSetup":await this.i.globalState.update("explorerDates.hasCompletedSetup",!0),t.dispose();break;case"openSettings":await n.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break}}catch(i){this.e.error("Failed to handle setup wizard message",i)}}async R(e){if(e.preset){let i=this.C()[e.preset];i&&(this.e.info(`Applying preset: ${e.preset}`,i.settings),await this.b.applySettings(i.settings,{scope:"user",reason:`onboarding-preset:${e.preset}`}),this.e.info(`Applied preset: ${e.preset}`,i.settings),n.window.showInformationMessage(`Applied "${i.name}" configuration. Changes should be visible immediately!`))}e.individual&&(await this.b.applySettings(e.individual,{scope:"user",reason:"onboarding-individual"}),this.e.info("Applied individual settings",e.individual));try{await n.commands.executeCommand("explorerDates.refreshDateDecorations"),this.e.info("Decorations refreshed after configuration change")}catch(t){this.e.warn("Failed to refresh decorations after configuration change",t)}}C(){return{minimal:{name:"Minimal",description:"Clean and simple - just show modification times in short format",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!1,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!1,showStatusBar:!1}},developer:{name:"Developer",description:"Perfect for development - includes Git info, file sizes, and color coding",settings:{dateDecorationFormat:"smart",colorScheme:"recency",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"author",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:30,enableContextMenu:!0,showStatusBar:!0}},powerUser:{name:"Power User",description:"Maximum information - all features enabled with vibrant colors",settings:{dateDecorationFormat:"smart",colorScheme:"vibrant",highContrastMode:!1,showFileSize:!0,fileSizeFormat:"auto",showGitInfo:"both",badgePriority:"time",fadeOldFiles:!0,fadeThreshold:14,enableContextMenu:!0,showStatusBar:!0,smartExclusions:!0,progressiveLoading:!0,persistentCache:!0}},gitFocused:{name:"Git-Focused",description:"Show author initials as badges with full Git information in tooltips",settings:{dateDecorationFormat:"smart",colorScheme:"file-type",highContrastMode:!1,showFileSize:!1,showGitInfo:"both",badgePriority:"author",fadeOldFiles:!1,enableContextMenu:!0,showStatusBar:!0}},accessible:{name:"Accessible",description:"High contrast and screen reader friendly with detailed tooltips",settings:{dateDecorationFormat:"relative-short",colorScheme:"none",highContrastMode:!0,accessibilityMode:!0,showFileSize:!1,showGitInfo:"none",badgePriority:"time",fadeOldFiles:!1,enableContextMenu:!0,keyboardNavigation:!0}}}}async showFeatureTour(){try{let e=n.window.createWebviewPanel("explorerDatesFeatureTour","Explorer Dates Feature Tour",n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),t=await this.B();e.webview.html=t,e.webview.onDidReceiveMessage(async i=>{i.command==="openSettings"?await n.commands.executeCommand("workbench.action.openSettings",i.setting||"explorerDates"):i.command==="runCommand"&&await n.commands.executeCommand(i.commandId)}),this.e.info("Feature tour opened")}catch(e){this.e.error("Failed to show feature tour",e)}}async $(){let e=this.C(),t={minimal:e.minimal,developer:e.developer,accessible:e.accessible};try{let{loadOnboardingAssets:r}=L(),s=await r();if(s)return this.e.debug("Using chunked onboarding assets for setup wizard"),await s.getSetupWizardHTML(t)}catch(r){this.e.warn("Failed to load chunked assets, using inline fallback",r)}return`
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
                </script>
            </body>
            </html>
        `}async B(){try{let{loadOnboardingAssets:e}=L(),t=await e();if(t)return this.e.debug("Using chunked onboarding assets for feature tour"),await t.getFeatureTourHTML()}catch(e){this.e.warn("Failed to load chunked assets for feature tour, using inline fallback",e)}return this.N()}N(){return`
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
${t.description}`;await n.window.showInformationMessage(i,"Show More Tips","Got it!")==="Show More Tips"&&await this.showFeatureTour()}async showWhatsNew(e){try{let t=n.window.createWebviewPanel("explorerDatesWhatsNew",`Explorer Dates v${e} - What's New`,n.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!1}),i=await this.V(e);t.webview.html=i,t.webview.onDidReceiveMessage(async a=>{switch(a.command){case"openSettings":await n.commands.executeCommand("workbench.action.openSettings","explorerDates"),t.dispose();break;case"tryFeature":a.feature==="badgePriority"&&(await this.b.updateSetting("badgePriority","author",{scope:"user",reason:"whats-new-demo"}),n.window.showInformationMessage("Badge priority set to author! You should see author initials on files now."));break;case"dismiss":t.dispose();break}})}catch(t){this.e.error("Failed to show what's new",t)}}async V(e){try{let{loadOnboardingAssets:t}=L(),i=await t();if(i)return this.e.debug("Using chunked onboarding assets for what's new"),await i.getWhatsNewHTML(e)}catch(t){this.e.warn("Failed to load chunked assets for what's new, using inline fallback",t)}return this.W(e)}W(e){return`
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
        `}};R.exports={OnboardingManager:T}});var V=g((fe,N)=>{var{getLogger:se}=b(),m=class{constructor(){this.e=se(),this.r=null,this.c=!1}async initialize(){if(!this.c)try{this.r={setupWizardTemplate:this.U(),featureTourTemplate:this.j(),whatsNewTemplate:this.K(),sharedStyles:this.u(),sharedScripts:this.p()},this.c=!0,this.e.debug("Onboarding assets initialized (~23KB lazy loaded)")}catch(e){throw this.e.error("Failed to initialize onboarding assets",e),e}}async getSetupWizardHTML(e){return await this.initialize(),this.q(this.r.setupWizardTemplate,e)}async getFeatureTourHTML(){return await this.initialize(),this.r.featureTourTemplate}async getWhatsNewHTML(e){return await this.initialize(),this.Y(this.r.whatsNewTemplate,e)}q(e,t){let i=Object.entries(t).map(([r,s])=>`
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
        `).join("");return e.replace("{{PRESET_OPTIONS}}",i).replace("{{MORE_OPTIONS_LINK}}",`
            <div class="more-options">
                <p><strong>Need more options?</strong> Try the <a href="#" onclick="showAllPresets()">Power User</a> or <a href="#" onclick="showGitFocused()">Git-Focused</a> presets, or configure manually in Settings.</p>
            </div>
        `).replace("{{PRESETS_JSON}}",JSON.stringify(t))}Y(e,t){return e.replace(/{{VERSION}}/g,t)}U(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Quick Setup</title>
                <style>
                    ${this.u()}
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
                    ${this.p()}
                    
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
        `}j(){return`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Explorer Dates Feature Tour</title>
                <style>
                    ${this.u()}
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
                    ${this.p()}

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
        `}K(){return`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Explorer Dates - What's New</title>
                <style>
                    ${this.u()}
                    
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
                    ${this.p()}

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
        `}u(){return`
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
        `}p(){return`
            const vscode = acquireVsCodeApi();
        `}getMemoryInfo(){return{chunkName:"onboarding-assets",estimatedSize:"~23KB",templatesLoaded:this.c,templateCount:this.r?Object.keys(this.r).length:0,loaded:this.c}}dispose(){this.r=null,this.c=!1,this.e.debug("Onboarding assets disposed")}};N.exports={OnboardingAssets:m,createOnboardingAssets:()=>new m,getMemoryInfo:(()=>{let o=null;return()=>(o||(o=new m),o.getMemoryInfo())})()}});var L=g((ge,j)=>{var{OnboardingManager:W}=B(),{getLogger:ae}=b(),U=ae(),C=!1,p=null,ne=async()=>{if(C&&p)return p;try{return p=V().createOnboardingAssets(),await p.initialize(),C=!0,U.info("Onboarding webview assets loaded",{chunk:"onboarding-assets",estimatedKB:23}),p}catch(o){return U.warn("Failed to load onboarding assets, falling back to inline templates",o),null}};j.exports={OnboardingManager:W,createOnboardingManager:o=>new W(o),loadOnboardingAssets:ne,getAssetsMemoryInfo:()=>p?p.getMemoryInfo():{loaded:C,templatesLoaded:C,chunkName:"onboarding-assets",estimatedSize:"~23KB"}}});module.exports=L();
