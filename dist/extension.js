var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/logger.js
var require_logger = __commonJS({
  "src/logger.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var Logger = class {
      constructor() {
        this._outputChannel = vscode2.window.createOutputChannel("Explorer Dates");
        this._isEnabled = false;
        this._updateConfig();
        vscode2.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration("explorerDates.enableLogging")) {
            this._updateConfig();
          }
        });
      }
      _updateConfig() {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        this._isEnabled = config.get("enableLogging", false);
      }
      /**
       * Log debug information
       */
      debug(message, ...args) {
        if (this._isEnabled) {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          const formattedMessage = `[${timestamp}] [DEBUG] ${message}`;
          this._outputChannel.appendLine(formattedMessage);
          if (args.length > 0) {
            this._outputChannel.appendLine(JSON.stringify(args, null, 2));
          }
          console.log(formattedMessage, ...args);
        }
      }
      /**
       * Log informational messages
       */
      info(message, ...args) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const formattedMessage = `[${timestamp}] [INFO] ${message}`;
        this._outputChannel.appendLine(formattedMessage);
        if (args.length > 0) {
          this._outputChannel.appendLine(JSON.stringify(args, null, 2));
        }
        console.log(formattedMessage, ...args);
      }
      /**
       * Log warning messages
       */
      warn(message, ...args) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const formattedMessage = `[${timestamp}] [WARN] ${message}`;
        this._outputChannel.appendLine(formattedMessage);
        if (args.length > 0) {
          this._outputChannel.appendLine(JSON.stringify(args, null, 2));
        }
        console.warn(formattedMessage, ...args);
      }
      /**
       * Log error messages
       */
      error(message, error, ...args) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const formattedMessage = `[${timestamp}] [ERROR] ${message}`;
        this._outputChannel.appendLine(formattedMessage);
        if (error instanceof Error) {
          this._outputChannel.appendLine(`Error: ${error.message}`);
          if (error.stack) {
            this._outputChannel.appendLine(`Stack: ${error.stack}`);
          }
        }
        if (args.length > 0) {
          this._outputChannel.appendLine(JSON.stringify(args, null, 2));
        }
        console.error(formattedMessage, error, ...args);
      }
      /**
       * Show the output channel
       */
      show() {
        this._outputChannel.show();
      }
      /**
       * Clear the output channel
       */
      clear() {
        this._outputChannel.clear();
      }
      /**
       * Dispose of resources
       */
      dispose() {
        this._outputChannel.dispose();
      }
    };
    var loggerInstance = null;
    function getLogger2() {
      if (!loggerInstance) {
        loggerInstance = new Logger();
      }
      return loggerInstance;
    }
    module2.exports = { Logger, getLogger: getLogger2 };
  }
});

// src/localization.js
var require_localization = __commonJS({
  "src/localization.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var translations = {
      en: {
        now: "now",
        minutes: "m",
        hours: "h",
        days: "d",
        weeks: "w",
        months: "mo",
        years: "y",
        justNow: "just now",
        minutesAgo: (n) => `${n} minute${n !== 1 ? "s" : ""} ago`,
        hoursAgo: (n) => `${n} hour${n !== 1 ? "s" : ""} ago`,
        yesterday: "yesterday",
        daysAgo: (n) => `${n} day${n !== 1 ? "s" : ""} ago`,
        lastModified: "Last modified",
        refreshSuccess: "Date decorations refreshed",
        activationError: "Explorer Dates failed to activate",
        errorAccessingFile: "Error accessing file for decoration"
      },
      es: {
        now: "ahora",
        minutes: "m",
        hours: "h",
        days: "d",
        weeks: "s",
        months: "m",
        years: "a",
        justNow: "ahora mismo",
        minutesAgo: (n) => `hace ${n} minuto${n !== 1 ? "s" : ""}`,
        hoursAgo: (n) => `hace ${n} hora${n !== 1 ? "s" : ""}`,
        yesterday: "ayer",
        daysAgo: (n) => `hace ${n} d\xEDa${n !== 1 ? "s" : ""}`,
        lastModified: "\xDAltima modificaci\xF3n",
        refreshSuccess: "Decoraciones de fecha actualizadas",
        activationError: "Explorer Dates no se pudo activar",
        errorAccessingFile: "Error al acceder al archivo para decoraci\xF3n"
      },
      fr: {
        now: "maintenant",
        minutes: "m",
        hours: "h",
        days: "j",
        weeks: "s",
        months: "m",
        years: "a",
        justNow: "\xE0 l'instant",
        minutesAgo: (n) => `il y a ${n} minute${n !== 1 ? "s" : ""}`,
        hoursAgo: (n) => `il y a ${n} heure${n !== 1 ? "s" : ""}`,
        yesterday: "hier",
        daysAgo: (n) => `il y a ${n} jour${n !== 1 ? "s" : ""}`,
        lastModified: "Derni\xE8re modification",
        refreshSuccess: "D\xE9corations de date actualis\xE9es",
        activationError: "\xC9chec de l'activation d'Explorer Dates",
        errorAccessingFile: "Erreur lors de l'acc\xE8s au fichier pour la d\xE9coration"
      },
      de: {
        now: "jetzt",
        minutes: "Min",
        hours: "Std",
        days: "T",
        weeks: "W",
        months: "Mon",
        years: "J",
        justNow: "gerade eben",
        minutesAgo: (n) => `vor ${n} Minute${n !== 1 ? "n" : ""}`,
        hoursAgo: (n) => `vor ${n} Stunde${n !== 1 ? "n" : ""}`,
        yesterday: "gestern",
        daysAgo: (n) => `vor ${n} Tag${n !== 1 ? "en" : ""}`,
        lastModified: "Zuletzt ge\xE4ndert",
        refreshSuccess: "Datumsdekorationen aktualisiert",
        activationError: "Explorer Dates konnte nicht aktiviert werden",
        errorAccessingFile: "Fehler beim Zugriff auf Datei f\xFCr Dekoration"
      },
      ja: {
        now: "\u4ECA",
        minutes: "\u5206",
        hours: "\u6642\u9593",
        days: "\u65E5",
        weeks: "\u9031",
        months: "\u30F6\u6708",
        years: "\u5E74",
        justNow: "\u305F\u3063\u305F\u4ECA",
        minutesAgo: (n) => `${n}\u5206\u524D`,
        hoursAgo: (n) => `${n}\u6642\u9593\u524D`,
        yesterday: "\u6628\u65E5",
        daysAgo: (n) => `${n}\u65E5\u524D`,
        lastModified: "\u6700\u7D42\u66F4\u65B0",
        refreshSuccess: "\u65E5\u4ED8\u88C5\u98FE\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F",
        activationError: "Explorer Dates\u306E\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
        errorAccessingFile: "\u30D5\u30A1\u30A4\u30EB\u30A2\u30AF\u30BB\u30B9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"
      },
      zh: {
        now: "\u73B0\u5728",
        minutes: "\u5206\u949F",
        hours: "\u5C0F\u65F6",
        days: "\u5929",
        weeks: "\u5468",
        months: "\u6708",
        years: "\u5E74",
        justNow: "\u521A\u521A",
        minutesAgo: (n) => `${n}\u5206\u949F\u524D`,
        hoursAgo: (n) => `${n}\u5C0F\u65F6\u524D`,
        yesterday: "\u6628\u5929",
        daysAgo: (n) => `${n}\u5929\u524D`,
        lastModified: "\u6700\u540E\u4FEE\u6539",
        refreshSuccess: "\u65E5\u671F\u88C5\u9970\u5DF2\u5237\u65B0",
        activationError: "Explorer Dates \u6FC0\u6D3B\u5931\u8D25",
        errorAccessingFile: "\u8BBF\u95EE\u6587\u4EF6\u88C5\u9970\u65F6\u51FA\u9519"
      }
    };
    var LocalizationManager = class {
      constructor() {
        this._currentLocale = "en";
        this._updateLocale();
        vscode2.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration("explorerDates.locale")) {
            this._updateLocale();
          }
        });
      }
      /**
       * Update current locale from configuration
       */
      _updateLocale() {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        let locale = config.get("locale", "auto");
        if (locale === "auto") {
          const vsCodeLocale = vscode2.env.language;
          locale = vsCodeLocale.split("-")[0];
        }
        if (!translations[locale]) {
          locale = "en";
        }
        this._currentLocale = locale;
      }
      /**
       * Get a localized string
       */
      getString(key, ...args) {
        const strings = translations[this._currentLocale] || translations.en;
        const value = strings[key];
        if (typeof value === "function") {
          return value(...args);
        }
        return value || translations.en[key] || key;
      }
      /**
       * Get current locale
       */
      getCurrentLocale() {
        return this._currentLocale;
      }
      /**
       * Format date using locale settings
       */
      formatDate(date, options = {}) {
        try {
          return date.toLocaleDateString(this._currentLocale, options);
        } catch (error) {
          return date.toLocaleDateString("en", options);
        }
      }
    };
    var localizationInstance = null;
    function getLocalization2() {
      if (!localizationInstance) {
        localizationInstance = new LocalizationManager();
      }
      return localizationInstance;
    }
    module2.exports = { LocalizationManager, getLocalization: getLocalization2 };
  }
});

// src/smartExclusion.js
var require_smartExclusion = __commonJS({
  "src/smartExclusion.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var path = require("path");
    var fs = require("fs").promises;
    var { getLogger: getLogger2 } = require_logger();
    var SmartExclusionManager = class {
      constructor() {
        this._logger = getLogger2();
        this._commonExclusions = [
          // Node.js
          "node_modules",
          ".npm",
          ".yarn",
          "coverage",
          "nyc_output",
          // Build outputs
          "dist",
          "build",
          "out",
          "target",
          "bin",
          "obj",
          // IDE/Editor
          ".vscode",
          ".idea",
          ".vs",
          ".vscode-test",
          // Version control
          ".git",
          ".svn",
          ".hg",
          ".bzr",
          // Package managers
          ".pnpm-store",
          "bower_components",
          "jspm_packages",
          // Temporary files
          "tmp",
          "temp",
          ".tmp",
          ".cache",
          ".parcel-cache",
          // OS specific
          ".DS_Store",
          "Thumbs.db",
          "__pycache__",
          ".pytest_cache",
          // Language specific
          ".tox",
          "venv",
          ".env",
          ".virtualenv",
          "vendor",
          // Docker
          ".docker",
          // Logs
          "logs",
          "*.log"
        ];
        this._patternScores = /* @__PURE__ */ new Map();
        this._workspaceAnalysis = /* @__PURE__ */ new Map();
        this._logger.info("SmartExclusionManager initialized");
      }
      /**
       * Analyze workspace and suggest exclusions
       */
      async analyzeWorkspace(workspaceUri) {
        try {
          const workspacePath = workspaceUri.fsPath;
          const analysis = {
            detectedPatterns: [],
            suggestedExclusions: [],
            projectType: "unknown",
            riskFolders: []
          };
          analysis.projectType = await this._detectProjectType(workspacePath);
          const foundFolders = await this._scanForExclusionCandidates(workspacePath);
          const scoredPatterns = this._scorePatterns(foundFolders, analysis.projectType);
          analysis.detectedPatterns = foundFolders;
          analysis.suggestedExclusions = scoredPatterns.filter((p) => p.score > 0.7).map((p) => p.pattern);
          analysis.riskFolders = scoredPatterns.filter((p) => p.riskLevel === "high").map((p) => p.pattern);
          this._workspaceAnalysis.set(workspacePath, analysis);
          this._logger.info(`Workspace analysis complete for ${workspacePath}`, analysis);
          return analysis;
        } catch (error) {
          this._logger.error("Failed to analyze workspace", error);
          return null;
        }
      }
      /**
       * Detect project type from package files and directory structure
       */
      async _detectProjectType(workspacePath) {
        const indicators = [
          { file: "package.json", type: "javascript" },
          { file: "pom.xml", type: "java" },
          { file: "Cargo.toml", type: "rust" },
          { file: "setup.py", type: "python" },
          { file: "requirements.txt", type: "python" },
          { file: "Gemfile", type: "ruby" },
          { file: "composer.json", type: "php" },
          { file: "go.mod", type: "go" },
          { file: "CMakeLists.txt", type: "cpp" },
          { file: "Dockerfile", type: "docker" }
        ];
        for (const indicator of indicators) {
          try {
            await fs.access(path.join(workspacePath, indicator.file));
            return indicator.type;
          } catch (error) {
          }
        }
        return "unknown";
      }
      /**
       * Scan workspace for folders that should likely be excluded
       */
      async _scanForExclusionCandidates(workspacePath, maxDepth = 2) {
        const candidates = [];
        const scanDirectory = async (dirPath, currentDepth = 0) => {
          if (currentDepth > maxDepth) return;
          try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory()) {
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(workspacePath, fullPath);
                if (this._commonExclusions.includes(entry.name)) {
                  candidates.push({
                    name: entry.name,
                    path: relativePath,
                    type: "common",
                    size: await this._getDirectorySize(fullPath)
                  });
                }
                const size = await this._getDirectorySize(fullPath);
                if (size > 10 * 1024 * 1024) {
                  candidates.push({
                    name: entry.name,
                    path: relativePath,
                    type: "large",
                    size
                  });
                }
                await scanDirectory(fullPath, currentDepth + 1);
              }
            }
          } catch (error) {
          }
        };
        await scanDirectory(workspacePath);
        return candidates;
      }
      /**
       * Get directory size (approximate)
       */
      async _getDirectorySize(dirPath) {
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          let size = 0;
          let fileCount = 0;
          for (const entry of entries) {
            if (fileCount > 100) break;
            if (entry.isFile()) {
              try {
                const stat = await fs.stat(path.join(dirPath, entry.name));
                size += stat.size;
                fileCount++;
              } catch (error) {
              }
            }
          }
          return size;
        } catch (error) {
          return 0;
        }
      }
      /**
       * Score patterns based on project type and characteristics
       */
      _scorePatterns(candidates, projectType) {
        return candidates.map((candidate) => {
          let score = 0;
          let riskLevel = "low";
          if (candidate.type === "common") {
            score += 0.8;
          }
          if (candidate.size > 100 * 1024 * 1024) {
            score += 0.9;
            riskLevel = "high";
          } else if (candidate.size > 10 * 1024 * 1024) {
            score += 0.5;
            riskLevel = "medium";
          }
          switch (projectType) {
            case "javascript":
              if (["node_modules", ".npm", "coverage", "dist", "build"].includes(candidate.name)) {
                score += 0.9;
              }
              break;
            case "python":
              if (["__pycache__", ".pytest_cache", "venv", ".env"].includes(candidate.name)) {
                score += 0.9;
              }
              break;
            case "java":
              if (["target", "build", ".gradle"].includes(candidate.name)) {
                score += 0.9;
              }
              break;
          }
          const sourcePatterns = ["src", "lib", "app", "components", "pages"];
          if (sourcePatterns.includes(candidate.name.toLowerCase())) {
            score = 0;
            riskLevel = "none";
          }
          return {
            pattern: candidate.name,
            path: candidate.path,
            score: Math.min(score, 1),
            riskLevel,
            size: candidate.size,
            type: candidate.type
          };
        });
      }
      /**
       * Get workspace-specific exclusion profile
       */
      getWorkspaceExclusions(workspaceUri) {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        const profiles = config.get("workspaceExclusionProfiles", {});
        const workspaceKey = this._getWorkspaceKey(workspaceUri);
        return profiles[workspaceKey] || [];
      }
      /**
       * Save workspace-specific exclusion profile
       */
      async saveWorkspaceExclusions(workspaceUri, exclusions) {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        const profiles = config.get("workspaceExclusionProfiles", {});
        const workspaceKey = this._getWorkspaceKey(workspaceUri);
        profiles[workspaceKey] = exclusions;
        await config.update("workspaceExclusionProfiles", profiles, vscode2.ConfigurationTarget.Global);
        this._logger.info(`Saved workspace exclusions for ${workspaceKey}`, exclusions);
      }
      /**
       * Get combined exclusion patterns (global + workspace + smart)
       */
      async getCombinedExclusions(workspaceUri) {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        const globalFolders = config.get("excludedFolders", []);
        const globalPatterns = config.get("excludedPatterns", []);
        const smartEnabled = config.get("smartExclusions", true);
        let combinedFolders = [...globalFolders];
        let combinedPatterns = [...globalPatterns];
        const workspaceExclusions = this.getWorkspaceExclusions(workspaceUri);
        combinedFolders.push(...workspaceExclusions);
        if (smartEnabled) {
          const analysis = await this.analyzeWorkspace(workspaceUri);
          if (analysis) {
            combinedFolders.push(...analysis.suggestedExclusions);
          }
        }
        combinedFolders = [...new Set(combinedFolders)];
        combinedPatterns = [...new Set(combinedPatterns)];
        return {
          folders: combinedFolders,
          patterns: combinedPatterns
        };
      }
      /**
       * Generate workspace key for storing profiles
       */
      _getWorkspaceKey(workspaceUri) {
        return path.basename(workspaceUri.fsPath);
      }
      /**
       * Show exclusion suggestions to user
       */
      async suggestExclusions(workspaceUri) {
        const analysis = await this.analyzeWorkspace(workspaceUri);
        if (!analysis || analysis.suggestedExclusions.length === 0) {
          return;
        }
        const message = `Found ${analysis.suggestedExclusions.length} folders that could be excluded for better performance.`;
        const action = await vscode2.window.showInformationMessage(
          message,
          "Apply Suggestions",
          "Review",
          "Dismiss"
        );
        if (action === "Apply Suggestions") {
          await this.saveWorkspaceExclusions(workspaceUri, analysis.suggestedExclusions);
          vscode2.window.showInformationMessage("Smart exclusions applied!");
        } else if (action === "Review") {
          this._showExclusionReview(analysis);
        }
      }
      /**
       * Show detailed exclusion review
       */
      _showExclusionReview(analysis) {
        const panel = vscode2.window.createWebviewPanel(
          "exclusionReview",
          "Smart Exclusion Review",
          vscode2.ViewColumn.One,
          { enableScripts: true }
        );
        panel.webview.html = this._generateReviewHTML(analysis);
      }
      /**
       * Generate HTML for exclusion review
       */
      _generateReviewHTML(analysis) {
        const formatSize = (bytes) => {
          if (bytes < 1024) return `${bytes} B`;
          const kb = bytes / 1024;
          if (kb < 1024) return `${kb.toFixed(1)} KB`;
          const mb = kb / 1024;
          return `${mb.toFixed(1)} MB`;
        };
        const suggestionRows = analysis.detectedPatterns.map((pattern) => `
            <tr>
                <td>${pattern.name}</td>
                <td>${pattern.path}</td>
                <td>${formatSize(pattern.size)}</td>
                <td>${pattern.type}</td>
                <td>
                    <input type="checkbox" ${analysis.suggestedExclusions.includes(pattern.name) ? "checked" : ""}>
                </td>
            </tr>
        `).join("");
        return `
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
        `;
      }
    };
    module2.exports = { SmartExclusionManager };
  }
});

// src/batchProcessor.js
var require_batchProcessor = __commonJS({
  "src/batchProcessor.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var { getLogger: getLogger2 } = require_logger();
    var BatchProcessor = class {
      constructor() {
        this._logger = getLogger2();
        this._processingQueue = [];
        this._isProcessing = false;
        this._batchSize = 50;
        this._processedCount = 0;
        this._totalCount = 0;
        this._statusBar = null;
        this._metrics = {
          totalBatches: 0,
          averageBatchTime: 0,
          totalProcessingTime: 0
        };
        this._logger.info("BatchProcessor initialized");
      }
      /**
       * Initialize batch processor with configuration
       */
      initialize() {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        this._batchSize = config.get("batchSize", 50);
        this._statusBar = vscode2.window.createStatusBarItem(vscode2.StatusBarAlignment.Left, -1e3);
        vscode2.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration("explorerDates.batchSize")) {
            this._batchSize = vscode2.workspace.getConfiguration("explorerDates").get("batchSize", 50);
            this._logger.debug(`Batch size updated to: ${this._batchSize}`);
          }
        });
      }
      /**
       * Add URIs to processing queue
       */
      queueForProcessing(uris, processor, options = {}) {
        const batch = {
          id: Date.now() + Math.random(),
          uris: Array.isArray(uris) ? uris : [uris],
          processor,
          priority: options.priority || "normal",
          background: options.background || false,
          onProgress: options.onProgress,
          onComplete: options.onComplete
        };
        if (batch.priority === "high") {
          this._processingQueue.unshift(batch);
        } else {
          this._processingQueue.push(batch);
        }
        this._logger.debug(`Queued batch ${batch.id} with ${batch.uris.length} URIs`);
        if (!this._isProcessing) {
          this._startProcessing();
        }
        return batch.id;
      }
      /**
       * Start batch processing
       */
      async _startProcessing() {
        if (this._isProcessing) return;
        this._isProcessing = true;
        this._processedCount = 0;
        this._totalCount = this._processingQueue.reduce((sum, batch) => sum + batch.uris.length, 0);
        this._logger.info(`Starting batch processing: ${this._totalCount} items in ${this._processingQueue.length} batches`);
        this._updateStatusBar();
        const startTime = Date.now();
        try {
          while (this._processingQueue.length > 0) {
            const batch = this._processingQueue.shift();
            await this._processBatch(batch);
            if (!batch.background) {
              await this._sleep(1);
            }
          }
        } catch (error) {
          this._logger.error("Batch processing failed", error);
        } finally {
          this._isProcessing = false;
          this._hideStatusBar();
          const totalTime = Date.now() - startTime;
          this._updateMetrics(totalTime);
          this._logger.info(`Batch processing completed in ${totalTime}ms`);
        }
      }
      /**
       * Process a single batch
       */
      async _processBatch(batch) {
        const batchStartTime = Date.now();
        this._logger.debug(`Processing batch ${batch.id} with ${batch.uris.length} URIs`);
        try {
          const chunks = this._chunkArray(batch.uris, this._batchSize);
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkResults = [];
            for (const uri of chunk) {
              try {
                const result = await batch.processor(uri);
                chunkResults.push({ uri, result, success: true });
                this._processedCount++;
              } catch (error) {
                chunkResults.push({ uri, error, success: false });
                this._processedCount++;
                this._logger.debug(`Failed to process ${uri.fsPath}`, error);
              }
              this._updateStatusBar();
              if (batch.onProgress) {
                batch.onProgress({
                  processed: this._processedCount,
                  total: this._totalCount,
                  current: uri
                });
              }
            }
            await this._sleep(0);
            if (!batch.background && i < chunks.length - 1) {
              await this._sleep(5);
            }
          }
          if (batch.onComplete) {
            batch.onComplete({
              processed: batch.uris.length,
              success: true,
              duration: Date.now() - batchStartTime
            });
          }
        } catch (error) {
          this._logger.error(`Batch ${batch.id} processing failed`, error);
          if (batch.onComplete) {
            batch.onComplete({
              processed: 0,
              success: false,
              error,
              duration: Date.now() - batchStartTime
            });
          }
        }
        this._metrics.totalBatches++;
      }
      /**
       * Progressive loading for large directories
       */
      async processDirectoryProgressively(directoryUri, processor, options = {}) {
        const maxFiles = options.maxFiles || 1e3;
        try {
          const pattern = new vscode2.RelativePattern(directoryUri, "**/*");
          const files = await vscode2.workspace.findFiles(pattern, null, maxFiles);
          if (files.length === 0) {
            this._logger.debug(`No files found in directory: ${directoryUri.fsPath}`);
            return;
          }
          this._logger.info(`Processing directory progressively: ${files.length} files in ${directoryUri.fsPath}`);
          return this.queueForProcessing(files, processor, {
            priority: "normal",
            background: true,
            ...options
          });
        } catch (error) {
          this._logger.error("Progressive directory processing failed", error);
          throw error;
        }
      }
      /**
       * Background refresh without blocking UI
       */
      async refreshInBackground(uris, processor, options = {}) {
        return this.queueForProcessing(uris, processor, {
          background: true,
          priority: "low",
          ...options
        });
      }
      /**
       * Priority refresh for visible files
       */
      async refreshVisible(uris, processor, options = {}) {
        return this.queueForProcessing(uris, processor, {
          background: false,
          priority: "high",
          ...options
        });
      }
      /**
       * Chunk array into smaller arrays
       */
      _chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
      }
      /**
       * Sleep utility for yielding control
       */
      _sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      /**
       * Update status bar with progress
       */
      _updateStatusBar() {
        if (!this._statusBar) return;
        const percentage = this._totalCount > 0 ? Math.round(this._processedCount / this._totalCount * 100) : 0;
        this._statusBar.text = `$(sync~spin) Processing files... ${percentage}% (${this._processedCount}/${this._totalCount})`;
        this._statusBar.tooltip = "Explorer Dates is processing file decorations";
        this._statusBar.show();
      }
      /**
       * Hide status bar
       */
      _hideStatusBar() {
        if (this._statusBar) {
          this._statusBar.hide();
        }
      }
      /**
       * Update processing metrics
       */
      _updateMetrics(totalTime) {
        this._metrics.totalProcessingTime += totalTime;
        if (this._metrics.totalBatches > 0) {
          this._metrics.averageBatchTime = this._metrics.totalProcessingTime / this._metrics.totalBatches;
        }
      }
      /**
       * Get processing metrics
       */
      getMetrics() {
        return {
          ...this._metrics,
          isProcessing: this._isProcessing,
          queueLength: this._processingQueue.length,
          currentProgress: this._totalCount > 0 ? this._processedCount / this._totalCount : 0
        };
      }
      /**
       * Cancel all pending processing
       */
      cancelAll() {
        this._processingQueue.length = 0;
        this._hideStatusBar();
        this._logger.info("All batch processing cancelled");
      }
      /**
       * Cancel specific batch
       */
      cancelBatch(batchId) {
        const index = this._processingQueue.findIndex((batch) => batch.id === batchId);
        if (index !== -1) {
          const cancelled = this._processingQueue.splice(index, 1)[0];
          this._logger.debug(`Cancelled batch ${batchId} with ${cancelled.uris.length} URIs`);
          return true;
        }
        return false;
      }
      /**
       * Dispose resources
       */
      dispose() {
        this.cancelAll();
        if (this._statusBar) {
          this._statusBar.dispose();
        }
        this._logger.info("BatchProcessor disposed", this.getMetrics());
      }
    };
    module2.exports = { BatchProcessor };
  }
});

// src/advancedCache.js
var require_advancedCache = __commonJS({
  "src/advancedCache.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var fs = require("fs").promises;
    var path = require("path");
    var { getLogger: getLogger2 } = require_logger();
    var AdvancedCache = class {
      constructor(context) {
        this._logger = getLogger2();
        this._context = context;
        this._memoryCache = /* @__PURE__ */ new Map();
        this._cacheMetadata = /* @__PURE__ */ new Map();
        this._maxMemoryUsage = 50 * 1024 * 1024;
        this._currentMemoryUsage = 0;
        this._persistentCacheEnabled = true;
        this._cacheDir = path.join(context.globalStorageUri && context.globalStorageUri.fsPath || context.globalStoragePath || "", "cache");
        this._persistentCacheFile = path.join(this._cacheDir, "file-decorations.json");
        this._metadataFile = path.join(this._cacheDir, "cache-metadata.json");
        this._metrics = {
          memoryHits: 0,
          memoryMisses: 0,
          diskHits: 0,
          diskMisses: 0,
          evictions: 0,
          persistentLoads: 0,
          persistentSaves: 0
        };
        this._cleanupInterval = null;
        this._saveInterval = null;
        this._logger.info("AdvancedCache initialized");
      }
      /**
       * Initialize cache system
       */
      async initialize() {
        try {
          await this._loadConfiguration();
          await this._ensureCacheDirectory();
          if (this._persistentCacheEnabled) {
            await this._loadPersistentCache();
          }
          this._startIntervals();
          this._logger.info("Advanced cache system initialized", {
            persistentEnabled: this._persistentCacheEnabled,
            maxMemoryUsage: this._maxMemoryUsage,
            cacheDir: this._cacheDir
          });
        } catch (error) {
          this._logger.error("Failed to initialize cache system", error);
        }
      }
      /**
       * Load configuration settings
       */
      async _loadConfiguration() {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        this._persistentCacheEnabled = config.get("persistentCache", true);
        this._maxMemoryUsage = config.get("maxMemoryUsage", 50) * 1024 * 1024;
        vscode2.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration("explorerDates.persistentCache") || e.affectsConfiguration("explorerDates.maxMemoryUsage")) {
            this._loadConfiguration();
          }
        });
      }
      /**
       * Ensure cache directory exists
       */
      async _ensureCacheDirectory() {
        try {
          await fs.mkdir(this._cacheDir, { recursive: true });
        } catch (error) {
          this._logger.error("Failed to create cache directory", error);
        }
      }
      /**
       * Get item from cache with intelligent fallback
       */
      async get(key) {
        if (this._memoryCache.has(key)) {
          const item = this._memoryCache.get(key);
          const metadata = this._cacheMetadata.get(key);
          if (this._isValid(metadata)) {
            this._metrics.memoryHits++;
            this._updateAccessTime(key);
            return item;
          } else {
            this._removeFromMemory(key);
          }
        }
        this._metrics.memoryMisses++;
        if (this._persistentCacheEnabled) {
          const persistentItem = await this._getFromPersistentCache(key);
          if (persistentItem) {
            this._addToMemory(key, persistentItem.data, persistentItem.metadata);
            this._metrics.diskHits++;
            return persistentItem.data;
          }
        }
        this._metrics.diskMisses++;
        return null;
      }
      /**
       * Set item in cache with metadata
       */
      async set(key, value, options = {}) {
        const metadata = {
          timestamp: Date.now(),
          lastAccess: Date.now(),
          size: this._estimateSize(value),
          ttl: options.ttl || 24 * 60 * 60 * 1e3,
          // 24 hours default
          tags: options.tags || [],
          version: options.version || 1
        };
        this._addToMemory(key, value, metadata);
        if (this._persistentCacheEnabled) {
          this._schedulePersistentSave();
        }
      }
      /**
       * Add item to memory cache with eviction handling
       */
      _addToMemory(key, value, metadata) {
        if (this._currentMemoryUsage + metadata.size > this._maxMemoryUsage) {
          this._evictOldestItems(metadata.size);
        }
        if (this._memoryCache.has(key)) {
          this._removeFromMemory(key);
        }
        this._memoryCache.set(key, value);
        this._cacheMetadata.set(key, metadata);
        this._currentMemoryUsage += metadata.size;
        this._logger.debug(`Added to cache: ${key} (${metadata.size} bytes)`);
      }
      /**
       * Remove item from memory cache
       */
      _removeFromMemory(key) {
        if (this._memoryCache.has(key)) {
          const metadata = this._cacheMetadata.get(key);
          this._memoryCache.delete(key);
          this._cacheMetadata.delete(key);
          if (metadata) {
            this._currentMemoryUsage -= metadata.size;
          }
        }
      }
      /**
       * Evict oldest items to make space
       */
      _evictOldestItems(requiredSpace) {
        const entries = Array.from(this._cacheMetadata.entries());
        entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        let freedSpace = 0;
        for (const [key, metadata] of entries) {
          this._removeFromMemory(key);
          freedSpace += metadata.size;
          this._metrics.evictions++;
          if (freedSpace >= requiredSpace) {
            break;
          }
        }
        this._logger.debug(`Evicted items to free ${freedSpace} bytes`);
      }
      /**
       * Check if cache item is still valid
       */
      _isValid(metadata) {
        if (!metadata) return false;
        const now = Date.now();
        const age = now - metadata.timestamp;
        return age < metadata.ttl;
      }
      /**
       * Update access time for cache item
       */
      _updateAccessTime(key) {
        const metadata = this._cacheMetadata.get(key);
        if (metadata) {
          metadata.lastAccess = Date.now();
        }
      }
      /**
       * Estimate memory size of object
       */
      _estimateSize(obj) {
        const type = typeof obj;
        switch (type) {
          case "string":
            return obj.length * 2;
          // UTF-16
          case "number":
            return 8;
          case "boolean":
            return 4;
          case "object":
            if (obj === null) return 4;
            return JSON.stringify(obj).length * 2;
          default:
            return 100;
        }
      }
      /**
       * Load persistent cache from disk
       */
      async _loadPersistentCache() {
        try {
          const cacheData = await fs.readFile(this._persistentCacheFile, "utf8");
          const cache = JSON.parse(cacheData);
          let loadedCount = 0;
          let skippedCount = 0;
          for (const [key, item] of Object.entries(cache)) {
            if (this._isValid(item.metadata)) {
              this._addToMemory(key, item.data, item.metadata);
              loadedCount++;
            } else {
              skippedCount++;
            }
          }
          this._metrics.persistentLoads++;
          this._logger.info(`Loaded persistent cache: ${loadedCount} items (${skippedCount} expired)`);
        } catch (error) {
          if (error.code !== "ENOENT") {
            this._logger.error("Failed to load persistent cache", error);
          }
        }
      }
      /**
       * Save persistent cache to disk
       */
      async _savePersistentCache() {
        if (!this._persistentCacheEnabled) return;
        try {
          const cache = {};
          for (const [key, value] of this._memoryCache.entries()) {
            const metadata = this._cacheMetadata.get(key);
            if (metadata && this._isValid(metadata)) {
              cache[key] = { data: value, metadata };
            }
          }
          await fs.writeFile(this._persistentCacheFile, JSON.stringify(cache, null, 2));
          this._metrics.persistentSaves++;
          this._logger.debug(`Saved persistent cache: ${Object.keys(cache).length} items`);
        } catch (error) {
          this._logger.error("Failed to save persistent cache", error);
        }
      }
      /**
       * Get item from persistent cache
       */
      async _getFromPersistentCache(key) {
        try {
          const cacheData = await fs.readFile(this._persistentCacheFile, "utf8");
          const cache = JSON.parse(cacheData);
          const item = cache[key];
          if (item && this._isValid(item.metadata)) {
            return item;
          }
        } catch (error) {
        }
        return null;
      }
      /**
       * Schedule persistent cache save
       */
      _schedulePersistentSave() {
        if (this._saveTimeout) {
          clearTimeout(this._saveTimeout);
        }
        this._saveTimeout = setTimeout(() => {
          this._savePersistentCache();
        }, 5e3);
      }
      /**
       * Start cleanup and save intervals
       */
      _startIntervals() {
        this._cleanupInterval = setInterval(() => {
          this._cleanupExpiredItems();
        }, 5 * 60 * 1e3);
        this._saveInterval = setInterval(() => {
          this._savePersistentCache();
        }, 10 * 60 * 1e3);
      }
      /**
       * Cleanup expired items from memory
       */
      _cleanupExpiredItems() {
        const keysToRemove = [];
        for (const [key, metadata] of this._cacheMetadata.entries()) {
          if (!this._isValid(metadata)) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          this._removeFromMemory(key);
        }
        if (keysToRemove.length > 0) {
          this._logger.debug(`Cleaned up ${keysToRemove.length} expired cache items`);
        }
      }
      /**
       * Invalidate cache items by tags
       */
      invalidateByTags(tags) {
        const keysToRemove = [];
        for (const [key, metadata] of this._cacheMetadata.entries()) {
          if (metadata.tags && metadata.tags.some((tag) => tags.includes(tag))) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          this._removeFromMemory(key);
        }
        this._logger.debug(`Invalidated ${keysToRemove.length} items by tags:`, tags);
      }
      /**
       * Invalidate cache items by pattern
       */
      invalidateByPattern(pattern) {
        const keysToRemove = [];
        const regex = new RegExp(pattern);
        for (const key of this._memoryCache.keys()) {
          if (regex.test(key)) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          this._removeFromMemory(key);
        }
        this._logger.debug(`Invalidated ${keysToRemove.length} items by pattern: ${pattern}`);
      }
      /**
       * Clear all cache
       */
      clear() {
        this._memoryCache.clear();
        this._cacheMetadata.clear();
        this._currentMemoryUsage = 0;
        this._logger.info("Cache cleared");
      }
      /**
       * Get cache statistics
       */
      getStats() {
        const memoryHitRate = this._metrics.memoryHits + this._metrics.memoryMisses > 0 ? (this._metrics.memoryHits / (this._metrics.memoryHits + this._metrics.memoryMisses) * 100).toFixed(2) : "0";
        const diskHitRate = this._metrics.diskHits + this._metrics.diskMisses > 0 ? (this._metrics.diskHits / (this._metrics.diskHits + this._metrics.diskMisses) * 100).toFixed(2) : "0";
        return {
          ...this._metrics,
          memoryItems: this._memoryCache.size,
          memoryUsage: this._currentMemoryUsage,
          memoryUsagePercent: (this._currentMemoryUsage / this._maxMemoryUsage * 100).toFixed(2),
          memoryHitRate: `${memoryHitRate}%`,
          diskHitRate: `${diskHitRate}%`,
          persistentEnabled: this._persistentCacheEnabled
        };
      }
      /**
       * Dispose cache system
       */
      async dispose() {
        if (this._cleanupInterval) {
          clearInterval(this._cleanupInterval);
        }
        if (this._saveInterval) {
          clearInterval(this._saveInterval);
        }
        if (this._saveTimeout) {
          clearTimeout(this._saveTimeout);
        }
        if (this._persistentCacheEnabled) {
          await this._savePersistentCache();
        }
        this.clear();
        this._logger.info("Advanced cache disposed", this.getStats());
      }
    };
    module2.exports = { AdvancedCache };
  }
});

// src/themeIntegration.js
var require_themeIntegration = __commonJS({
  "src/themeIntegration.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var { getLogger: getLogger2 } = require_logger();
    var ThemeIntegrationManager = class {
      constructor() {
        this._logger = getLogger2();
        this._currentThemeKind = vscode2.window.activeColorTheme.kind;
        this._themeChangeListeners = [];
        this._setupThemeChangeDetection();
        this._logger.info("ThemeIntegrationManager initialized", {
          currentTheme: this._getThemeKindName(this._currentThemeKind)
        });
      }
      /**
       * Setup theme change detection
       */
      _setupThemeChangeDetection() {
        vscode2.window.onDidChangeActiveColorTheme((theme) => {
          const oldTheme = this._currentThemeKind;
          this._currentThemeKind = theme.kind;
          this._logger.debug("Theme changed", {
            from: this._getThemeKindName(oldTheme),
            to: this._getThemeKindName(theme.kind)
          });
          this._themeChangeListeners.forEach((listener) => {
            try {
              listener(theme, oldTheme);
            } catch (error) {
              this._logger.error("Theme change listener failed", error);
            }
          });
        });
      }
      /**
       * Get readable theme kind name
       */
      _getThemeKindName(kind) {
        switch (kind) {
          case vscode2.ColorThemeKind.Light:
            return "Light";
          case vscode2.ColorThemeKind.Dark:
            return "Dark";
          case vscode2.ColorThemeKind.HighContrast:
            return "High Contrast";
          default:
            return "Unknown";
        }
      }
      /**
       * Register theme change listener
       */
      onThemeChange(callback) {
        this._themeChangeListeners.push(callback);
        return {
          dispose: () => {
            const index = this._themeChangeListeners.indexOf(callback);
            if (index !== -1) {
              this._themeChangeListeners.splice(index, 1);
            }
          }
        };
      }
      /**
       * Get adaptive colors based on current theme
       */
      getAdaptiveColors() {
        const isLight = this._currentThemeKind === vscode2.ColorThemeKind.Light;
        const isHighContrast = this._currentThemeKind === vscode2.ColorThemeKind.HighContrast;
        if (isHighContrast) {
          return this._getHighContrastColors();
        } else if (isLight) {
          return this._getLightThemeColors();
        } else {
          return this._getDarkThemeColors();
        }
      }
      /**
       * Get colors optimized for light themes
       */
      _getLightThemeColors() {
        return {
          // Recency colors - optimized for light backgrounds and selection states
          veryRecent: new vscode2.ThemeColor("list.highlightForeground"),
          recent: new vscode2.ThemeColor("list.warningForeground"),
          old: new vscode2.ThemeColor("list.errorForeground"),
          // File type colors - adapted for light theme with better selection visibility
          javascript: new vscode2.ThemeColor("symbolIcon.functionForeground"),
          css: new vscode2.ThemeColor("symbolIcon.colorForeground"),
          html: new vscode2.ThemeColor("symbolIcon.snippetForeground"),
          json: new vscode2.ThemeColor("symbolIcon.stringForeground"),
          markdown: new vscode2.ThemeColor("symbolIcon.textForeground"),
          python: new vscode2.ThemeColor("symbolIcon.classForeground"),
          // Subtle colors with selection contrast
          subtle: new vscode2.ThemeColor("list.inactiveSelectionForeground"),
          muted: new vscode2.ThemeColor("list.deemphasizedForeground"),
          emphasis: new vscode2.ThemeColor("list.highlightForeground")
        };
      }
      /**
       * Get colors optimized for dark themes
       */
      _getDarkThemeColors() {
        return {
          // Recency colors - softer for dark backgrounds, optimized for selection contrast
          veryRecent: new vscode2.ThemeColor("list.highlightForeground"),
          recent: new vscode2.ThemeColor("charts.yellow"),
          old: new vscode2.ThemeColor("charts.red"),
          // File type colors - optimized for dark theme with better selection contrast
          javascript: new vscode2.ThemeColor("symbolIcon.functionForeground"),
          css: new vscode2.ThemeColor("charts.purple"),
          html: new vscode2.ThemeColor("charts.orange"),
          json: new vscode2.ThemeColor("symbolIcon.stringForeground"),
          markdown: new vscode2.ThemeColor("charts.yellow"),
          python: new vscode2.ThemeColor("symbolIcon.classForeground"),
          // Subtle colors with selection awareness
          subtle: new vscode2.ThemeColor("list.inactiveSelectionForeground"),
          muted: new vscode2.ThemeColor("list.deemphasizedForeground"),
          emphasis: new vscode2.ThemeColor("list.highlightForeground")
        };
      }
      /**
       * Get colors optimized for high contrast themes
       */
      _getHighContrastColors() {
        return {
          // High contrast - use selection-aware theme colors for maximum visibility
          veryRecent: new vscode2.ThemeColor("list.highlightForeground"),
          recent: new vscode2.ThemeColor("list.warningForeground"),
          old: new vscode2.ThemeColor("list.errorForeground"),
          // File type colors - simplified palette with excellent selection contrast
          javascript: new vscode2.ThemeColor("list.highlightForeground"),
          css: new vscode2.ThemeColor("list.warningForeground"),
          html: new vscode2.ThemeColor("list.errorForeground"),
          json: new vscode2.ThemeColor("list.highlightForeground"),
          markdown: new vscode2.ThemeColor("list.warningForeground"),
          python: new vscode2.ThemeColor("list.errorForeground"),
          // Subtle colors - all highly visible in high contrast with selection awareness
          subtle: new vscode2.ThemeColor("list.highlightForeground"),
          muted: new vscode2.ThemeColor("list.inactiveSelectionForeground"),
          emphasis: new vscode2.ThemeColor("list.focusHighlightForeground")
        };
      }
      /**
       * Get color for specific context based on current theme
       */
      getColorForContext(context, intensity = "normal") {
        const colors = this.getAdaptiveColors();
        switch (context) {
          case "success":
          case "recent":
            return intensity === "subtle" ? colors.subtle : colors.veryRecent;
          case "warning":
          case "medium":
            return intensity === "subtle" ? colors.muted : colors.recent;
          case "error":
          case "old":
            return intensity === "subtle" ? colors.emphasis : colors.old;
          case "javascript":
          case "typescript":
            return colors.javascript;
          case "css":
          case "scss":
          case "less":
            return colors.css;
          case "html":
          case "xml":
            return colors.html;
          case "json":
          case "yaml":
            return colors.json;
          case "markdown":
          case "text":
            return colors.markdown;
          case "python":
            return colors.python;
          default:
            return intensity === "subtle" ? colors.muted : colors.subtle;
        }
      }
      /**
       * Apply theme-aware color scheme
       */
      applyThemeAwareColorScheme(colorScheme, filePath = "", fileAge = 0) {
        if (colorScheme === "none") {
          return void 0;
        }
        if (colorScheme === "adaptive") {
          return this._getAdaptiveColorForFile(filePath, fileAge);
        }
        const colors = this.getAdaptiveColors();
        switch (colorScheme) {
          case "recency":
            if (fileAge < 36e5) return colors.veryRecent;
            if (fileAge < 864e5) return colors.recent;
            return colors.old;
          case "file-type":
            return this._getFileTypeColor(filePath);
          case "subtle":
            if (fileAge < 36e5) return colors.subtle;
            if (fileAge < 6048e5) return colors.muted;
            return colors.emphasis;
          case "vibrant":
            return this._getVibrantSelectionAwareColor(fileAge);
          default:
            return void 0;
        }
      }
      /**
       * Get vibrant colors that work well in selection states
       */
      _getVibrantSelectionAwareColor(fileAge) {
        if (fileAge < 36e5) {
          return new vscode2.ThemeColor("list.highlightForeground");
        }
        if (fileAge < 864e5) {
          return new vscode2.ThemeColor("list.warningForeground");
        }
        return new vscode2.ThemeColor("list.errorForeground");
      }
      /**
       * Get adaptive color based on file characteristics and theme
       */
      _getAdaptiveColorForFile(filePath, fileAge) {
        const typeColor = this._getFileTypeColor(filePath);
        if (typeColor) return typeColor;
        const colors = this.getAdaptiveColors();
        if (fileAge < 36e5) return colors.veryRecent;
        if (fileAge < 864e5) return colors.recent;
        return colors.old;
      }
      /**
       * Get theme-appropriate color for file type
       */
      _getFileTypeColor(filePath) {
        const ext = require("path").extname(filePath).toLowerCase();
        const colors = this.getAdaptiveColors();
        if ([".js", ".ts", ".jsx", ".tsx", ".mjs"].includes(ext)) {
          return colors.javascript;
        }
        if ([".css", ".scss", ".sass", ".less", ".stylus"].includes(ext)) {
          return colors.css;
        }
        if ([".html", ".htm", ".xml", ".svg"].includes(ext)) {
          return colors.html;
        }
        if ([".json", ".yaml", ".yml", ".toml"].includes(ext)) {
          return colors.json;
        }
        if ([".md", ".markdown", ".txt", ".rst"].includes(ext)) {
          return colors.markdown;
        }
        if ([".py", ".pyx", ".pyi"].includes(ext)) {
          return colors.python;
        }
        return null;
      }
      /**
       * Get suggested color scheme based on current theme
       */
      getSuggestedColorScheme() {
        switch (this._currentThemeKind) {
          case vscode2.ColorThemeKind.Light:
            return "vibrant";
          // More visible on light backgrounds
          case vscode2.ColorThemeKind.Dark:
            return "recency";
          // Subtle but informative for dark themes
          case vscode2.ColorThemeKind.HighContrast:
            return "none";
          // Avoid colors in high contrast mode
          default:
            return "recency";
        }
      }
      /**
       * Get icon theme integration suggestions
       */
      getIconThemeIntegration() {
        const iconTheme = vscode2.workspace.getConfiguration("workbench").get("iconTheme");
        return {
          iconTheme,
          suggestions: {
            "vs-seti": {
              recommendedColorScheme: "file-type",
              description: "File-type colors complement Seti icons perfectly"
            },
            "material-icon-theme": {
              recommendedColorScheme: "subtle",
              description: "Subtle colors work well with Material icons"
            },
            "vscode-icons": {
              recommendedColorScheme: "recency",
              description: "Recency-based colors pair nicely with VS Code icons"
            }
          }
        };
      }
      /**
       * Auto-configure based on current theme and user preferences
       */
      async autoConfigureForTheme() {
        try {
          const config = vscode2.workspace.getConfiguration("explorerDates");
          const currentColorScheme = config.get("colorScheme", "none");
          if (currentColorScheme === "none" || currentColorScheme === "auto") {
            const suggestedScheme = this.getSuggestedColorScheme();
            await config.update("colorScheme", suggestedScheme, vscode2.ConfigurationTarget.Global);
            this._logger.info(`Auto-configured color scheme for ${this._getThemeKindName(this._currentThemeKind)} theme: ${suggestedScheme}`);
            const action = await vscode2.window.showInformationMessage(
              `Explorer Dates adapted to your ${this._getThemeKindName(this._currentThemeKind)} theme`,
              "Customize",
              "OK"
            );
            if (action === "Customize") {
              await vscode2.commands.executeCommand("workbench.action.openSettings", "explorerDates.colorScheme");
            }
          }
        } catch (error) {
          this._logger.error("Failed to auto-configure for theme", error);
        }
      }
      /**
       * Get current theme information
       */
      getCurrentThemeInfo() {
        return {
          kind: this._currentThemeKind,
          kindName: this._getThemeKindName(this._currentThemeKind),
          isLight: this._currentThemeKind === vscode2.ColorThemeKind.Light,
          isDark: this._currentThemeKind === vscode2.ColorThemeKind.Dark,
          isHighContrast: this._currentThemeKind === vscode2.ColorThemeKind.HighContrast,
          suggestedColorScheme: this.getSuggestedColorScheme(),
          adaptiveColors: this.getAdaptiveColors()
        };
      }
      /**
       * Dispose theme integration
       */
      dispose() {
        this._themeChangeListeners.length = 0;
        this._logger.info("ThemeIntegrationManager disposed");
      }
    };
    module2.exports = { ThemeIntegrationManager };
  }
});

// src/accessibility.js
var require_accessibility = __commonJS({
  "src/accessibility.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var { getLogger: getLogger2 } = require_logger();
    var { getLocalization: getLocalization2 } = require_localization();
    var AccessibilityManager = class {
      constructor() {
        this._logger = getLogger2();
        this._l10n = getLocalization2();
        this._isAccessibilityMode = false;
        this._keyboardNavigationEnabled = true;
        this._focusIndicators = /* @__PURE__ */ new Map();
        this._loadConfiguration();
        this._setupConfigurationListener();
        this._logger.info("AccessibilityManager initialized", {
          accessibilityMode: this._isAccessibilityMode,
          keyboardNavigation: this._keyboardNavigationEnabled
        });
      }
      /**
       * Load accessibility configuration
       */
      _loadConfiguration() {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        this._isAccessibilityMode = config.get("accessibilityMode", false);
        if (!config.has("accessibilityMode") && this._detectScreenReader()) {
          this._logger.info("Screen reader detected - consider enabling accessibility mode in settings");
        }
        this._keyboardNavigationEnabled = config.get("keyboardNavigation", true);
      }
      /**
       * Setup configuration change listener
       */
      _setupConfigurationListener() {
        vscode2.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration("explorerDates.accessibilityMode") || e.affectsConfiguration("explorerDates.keyboardNavigation")) {
            this._loadConfiguration();
            this._logger.debug("Accessibility configuration updated", {
              accessibilityMode: this._isAccessibilityMode,
              keyboardNavigation: this._keyboardNavigationEnabled
            });
          }
        });
      }
      /**
       * Get accessibility-optimized tooltip
       */
      getAccessibleTooltip(filePath, mtime, ctime, fileSize, gitInfo = null) {
        if (!this._isAccessibilityMode) {
          return null;
        }
        const path = require("path");
        const fileName = path.basename(filePath);
        const readableModified = this._formatAccessibleDate(mtime);
        const readableCreated = this._formatAccessibleDate(ctime);
        let tooltip = `File: ${fileName}. `;
        tooltip += `Last modified: ${readableModified}. `;
        tooltip += `Created: ${readableCreated}. `;
        if (fileSize !== void 0) {
          tooltip += `Size: ${this._formatAccessibleFileSize(fileSize)}. `;
        }
        if (gitInfo && gitInfo.authorName) {
          tooltip += `Last modified by: ${gitInfo.authorName}. `;
        }
        tooltip += `Full path: ${filePath}`;
        return tooltip;
      }
      /**
       * Format date in screen reader friendly way
       */
      _formatAccessibleDate(date) {
        const now = /* @__PURE__ */ new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1e3 * 60));
        const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
        if (diffMins < 1) {
          return "just now";
        } else if (diffMins < 60) {
          return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
        } else if (diffHours < 24) {
          return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
        } else if (diffDays < 7) {
          return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
        } else {
          return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        }
      }
      /**
       * Format file size in screen reader friendly way
       */
      _formatAccessibleFileSize(bytes) {
        if (bytes < 1024) {
          return `${bytes} bytes`;
        }
        const kb = bytes / 1024;
        if (kb < 1024) {
          const rounded2 = Math.round(kb);
          return `${rounded2} kilobytes`;
        }
        const mb = kb / 1024;
        const rounded = Math.round(mb * 10) / 10;
        return `${rounded} megabytes`;
      }
      /**
       * Get accessibility-optimized badge text
       */
      getAccessibleBadge(originalBadge) {
        if (!this._isAccessibilityMode) {
          return originalBadge;
        }
        const parts = originalBadge.split("|");
        const timePart = parts[0];
        const sizePart = parts[1];
        const gitPart = parts.length > 2 ? parts[2] : null;
        let accessibleBadge = this._expandTimeAbbreviation(timePart);
        if (sizePart) {
          accessibleBadge += ` ${this._expandSizeAbbreviation(sizePart)}`;
        }
        if (gitPart) {
          accessibleBadge += ` by ${gitPart.replace("\u2022", "")}`;
        }
        return accessibleBadge;
      }
      /**
       * Expand time abbreviations for screen readers
       */
      _expandTimeAbbreviation(timePart) {
        const expansions = {
          "m": " minutes ago",
          "h": " hours ago",
          "d": " days ago",
          "w": " weeks ago",
          "mo": " months ago",
          "yr": " years ago",
          "min": " minutes ago",
          "hrs": " hours ago",
          "day": " days ago",
          "wk": " weeks ago"
        };
        let expanded = timePart;
        for (const [abbrev, full] of Object.entries(expansions)) {
          if (timePart.endsWith(abbrev)) {
            const number = timePart.slice(0, -abbrev.length);
            expanded = number + full;
            break;
          }
        }
        return expanded;
      }
      /**
       * Expand size abbreviations for screen readers
       */
      _expandSizeAbbreviation(sizePart) {
        if (!sizePart.startsWith("~")) return sizePart;
        const sizeValue = sizePart.slice(1);
        if (sizeValue.endsWith("B")) {
          return sizeValue.slice(0, -1) + " bytes";
        } else if (sizeValue.endsWith("K")) {
          return sizeValue.slice(0, -1) + " kilobytes";
        } else if (sizeValue.endsWith("M")) {
          return sizeValue.slice(0, -1) + " megabytes";
        }
        return sizeValue;
      }
      /**
       * Create focus indicator for keyboard navigation
       */
      createFocusIndicator(element, description) {
        if (!this._keyboardNavigationEnabled) return null;
        const focusId = Math.random().toString(36).substr(2, 9);
        this._focusIndicators.set(focusId, {
          element,
          description,
          timestamp: Date.now()
        });
        return {
          id: focusId,
          dispose: () => {
            this._focusIndicators.delete(focusId);
          }
        };
      }
      /**
       * Announce message to screen readers
       */
      announceToScreenReader(message, priority = "polite") {
        if (!this._isAccessibilityMode) return;
        if (priority === "assertive") {
          vscode2.window.showWarningMessage(message);
        } else {
          this._logger.debug("Screen reader announcement", { message, priority });
        }
      }
      /**
       * Get keyboard shortcut help
       */
      getKeyboardShortcutHelp() {
        const shortcuts = [
          {
            key: "Ctrl+Shift+D (Cmd+Shift+D)",
            command: "Toggle date decorations",
            description: "Show or hide file modification times in Explorer"
          },
          {
            key: "Ctrl+Shift+C (Cmd+Shift+C)",
            command: "Copy file date",
            description: "Copy selected file's modification date to clipboard"
          },
          {
            key: "Ctrl+Shift+I (Cmd+Shift+I)",
            command: "Show file details",
            description: "Display detailed information about selected file"
          },
          {
            key: "Ctrl+Shift+R (Cmd+Shift+R)",
            command: "Refresh decorations",
            description: "Refresh all file modification time decorations"
          },
          {
            key: "Ctrl+Shift+A (Cmd+Shift+A)",
            command: "Show workspace activity",
            description: "Open workspace file activity analysis"
          },
          {
            key: "Ctrl+Shift+F (Cmd+Shift+F)",
            command: "Toggle fade old files",
            description: "Toggle fading effect for old files"
          }
        ];
        return shortcuts;
      }
      /**
       * Show keyboard shortcuts help dialog
       */
      async showKeyboardShortcutsHelp() {
        const shortcuts = this.getKeyboardShortcutHelp();
        await vscode2.window.showInformationMessage(
          "Keyboard shortcuts help available in output panel",
          "Show Shortcuts"
        ).then((action) => {
          if (action === "Show Shortcuts") {
            const outputChannel = vscode2.window.createOutputChannel("Explorer Dates Shortcuts");
            outputChannel.appendLine("Explorer Dates Keyboard Shortcuts");
            outputChannel.appendLine("=====================================");
            outputChannel.appendLine("");
            shortcuts.forEach((shortcut) => {
              outputChannel.appendLine(`${shortcut.key}`);
              outputChannel.appendLine(`  Command: ${shortcut.command}`);
              outputChannel.appendLine(`  Description: ${shortcut.description}`);
              outputChannel.appendLine("");
            });
            outputChannel.show();
          }
        });
      }
      /**
       * Check if accessibility features should be enhanced
       */
      shouldEnhanceAccessibility() {
        return this._isAccessibilityMode || this._detectScreenReader();
      }
      /**
       * Detect if screen reader is likely being used
       */
      _detectScreenReader() {
        const config = vscode2.workspace.getConfiguration("editor");
        return config.get("accessibilitySupport") === "on";
      }
      /**
       * Get accessibility recommendations
       */
      getAccessibilityRecommendations() {
        const recommendations = [];
        if (this._detectScreenReader()) {
          recommendations.push({
            type: "setting",
            setting: "explorerDates.accessibilityMode",
            value: true,
            reason: "Enable enhanced tooltips and screen reader optimizations"
          });
          recommendations.push({
            type: "setting",
            setting: "explorerDates.colorScheme",
            value: "none",
            reason: "Colors may not be useful with screen readers"
          });
          recommendations.push({
            type: "setting",
            setting: "explorerDates.dateDecorationFormat",
            value: "relative-long",
            reason: "Longer format is more descriptive for screen readers"
          });
        }
        const theme = vscode2.window.activeColorTheme;
        if (theme.kind === vscode2.ColorThemeKind.HighContrast) {
          recommendations.push({
            type: "setting",
            setting: "explorerDates.highContrastMode",
            value: true,
            reason: "Optimize for high contrast themes"
          });
        }
        return recommendations;
      }
      /**
       * Apply accessibility recommendations
       */
      async applyAccessibilityRecommendations() {
        const recommendations = this.getAccessibilityRecommendations();
        if (recommendations.length === 0) {
          vscode2.window.showInformationMessage("No accessibility recommendations at this time.");
          return;
        }
        const config = vscode2.workspace.getConfiguration("explorerDates");
        let appliedCount = 0;
        for (const rec of recommendations) {
          if (rec.type === "setting") {
            try {
              await config.update(rec.setting.replace("explorerDates.", ""), rec.value, vscode2.ConfigurationTarget.Global);
              appliedCount++;
              this._logger.info(`Applied accessibility recommendation: ${rec.setting} = ${rec.value}`);
            } catch (error) {
              this._logger.error(`Failed to apply recommendation: ${rec.setting}`, error);
            }
          }
        }
        if (appliedCount > 0) {
          vscode2.window.showInformationMessage(
            `Applied ${appliedCount} accessibility recommendations. Restart may be required for all changes to take effect.`
          );
        }
      }
      /**
       * Dispose accessibility manager
       */
      dispose() {
        this._focusIndicators.clear();
        this._logger.info("AccessibilityManager disposed");
      }
    };
    module2.exports = { AccessibilityManager };
  }
});

// src/fileDateDecorationProvider.js
var require_fileDateDecorationProvider = __commonJS({
  "src/fileDateDecorationProvider.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var fs = require("fs").promises;
    var path = require("path");
    var { getLogger: getLogger2 } = require_logger();
    var { getLocalization: getLocalization2 } = require_localization();
    var { exec } = require("child_process");
    var { promisify } = require("util");
    var { SmartExclusionManager } = require_smartExclusion();
    var { BatchProcessor } = require_batchProcessor();
    var { AdvancedCache } = require_advancedCache();
    var { ThemeIntegrationManager } = require_themeIntegration();
    var { AccessibilityManager } = require_accessibility();
    var execAsync = promisify(exec);
    var FileDateDecorationProvider2 = class {
      constructor() {
        this._onDidChangeFileDecorations = new vscode2.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        this._decorationCache = /* @__PURE__ */ new Map();
        this._cacheTimeout = 12e4;
        this._maxCacheSize = 1e4;
        this._cacheKeyStats = /* @__PURE__ */ new Map();
        this._logger = getLogger2();
        this._l10n = getLocalization2();
        this._smartExclusion = new SmartExclusionManager();
        this._batchProcessor = new BatchProcessor();
        this._advancedCache = null;
        this._themeIntegration = new ThemeIntegrationManager();
        this._accessibility = new AccessibilityManager();
        this._metrics = {
          totalDecorations: 0,
          cacheHits: 0,
          cacheMisses: 0,
          errors: 0
        };
        this._previewSettings = null;
        this._setupFileWatcher();
        this._setupConfigurationWatcher();
        this._logger.info("FileDateDecorationProvider initialized");
        this._previewSettings = null;
      }
      /**
       * Apply transient preview settings (do not persist to user settings)
       * @param {Object|null} settings
       */
      applyPreviewSettings(settings) {
        const wasInPreviewMode = !!this._previewSettings;
        if (settings && typeof settings === "object") {
          this._previewSettings = Object.assign({}, settings);
          this._logger.info("\u{1F504} Applied preview settings", this._previewSettings);
        } else {
          this._previewSettings = null;
          this._logger.info("\u{1F504} Cleared preview settings");
        }
        const memorySize = this._decorationCache.size;
        this._decorationCache.clear();
        this._logger.info(`\u{1F5D1}\uFE0F Cleared memory cache (${memorySize} items) for preview mode change`);
        if (this._advancedCache) {
          try {
            if (typeof this._advancedCache.clear === "function") {
              this._advancedCache.clear();
              this._logger.info("\u{1F5D1}\uFE0F Cleared advanced cache for preview mode change");
            } else {
              this._logger.warn("\u26A0\uFE0F Advanced cache does not support clear operation");
            }
          } catch (error) {
            this._logger.warn("\u26A0\uFE0F Failed to clear advanced cache:", error.message);
          }
        }
        if (this._previewSettings && !wasInPreviewMode) {
          this._logger.info("\u{1F3AD} Entered preview mode - caching disabled");
        } else if (!this._previewSettings && wasInPreviewMode) {
          this._logger.info("\u{1F3AD} Exited preview mode - caching re-enabled");
        }
        this._onDidChangeFileDecorations.fire(void 0);
        this._logger.info("\u{1F504} Fired decoration refresh event for preview change");
      }
      /**
       * Test decoration provider functionality
       */
      async testDecorationProvider() {
        this._logger.info("\u{1F9EA} Testing decoration provider functionality...");
        const workspaceFolders = vscode2.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          this._logger.error("\u274C No workspace folders available for testing");
          return;
        }
        const testFile = vscode2.Uri.joinPath(workspaceFolders[0].uri, "package.json");
        try {
          const decoration = await this.provideFileDecoration(testFile);
          this._logger.info("\u{1F9EA} Test decoration result:", {
            file: "package.json",
            success: !!decoration,
            badge: decoration?.badge,
            hasTooltip: !!decoration?.tooltip,
            hasColor: !!decoration?.color
          });
          this._onDidChangeFileDecorations.fire(testFile);
          this._logger.info("\u{1F504} Fired decoration change event for test file");
        } catch (error) {
          this._logger.error("\u274C Test decoration failed:", error);
        }
      }
      /**
       * Force refresh all decorations - triggers VS Code to re-request them
       */
      forceRefreshAllDecorations() {
        this._logger.info("\u{1F504} Force refreshing ALL decorations...");
        this._decorationCache.clear();
        if (this._advancedCache) {
          this._advancedCache.clear();
        }
        this._onDidChangeFileDecorations.fire(void 0);
        this._logger.info("\u{1F504} Triggered global decoration refresh");
      }
      /**
       * Debug method to check if VS Code is calling our provider
       */
      startProviderCallMonitoring() {
        this._providerCallCount = 0;
        this._providerCallFiles = /* @__PURE__ */ new Set();
        const originalProvide = this.provideFileDecoration.bind(this);
        this.provideFileDecoration = async (uri, token) => {
          this._providerCallCount++;
          this._providerCallFiles.add(uri.fsPath);
          this._logger.info(`\u{1F50D} Provider called ${this._providerCallCount} times for: ${uri.fsPath}`);
          return await originalProvide(uri, token);
        };
        this._logger.info("\u{1F4CA} Started provider call monitoring");
      }
      /**
       * Get provider call statistics
       */
      getProviderCallStats() {
        return {
          totalCalls: this._providerCallCount || 0,
          uniqueFiles: this._providerCallFiles ? this._providerCallFiles.size : 0,
          calledFiles: this._providerCallFiles ? Array.from(this._providerCallFiles) : []
        };
      }
      /**
       * Set up file system watcher to refresh decorations when files change
       */
      _setupFileWatcher() {
        const watcher = vscode2.workspace.createFileSystemWatcher("**/*");
        watcher.onDidChange((uri) => this.refreshDecoration(uri));
        watcher.onDidCreate((uri) => this.refreshDecoration(uri));
        watcher.onDidDelete((uri) => this.clearDecoration(uri));
        this._fileWatcher = watcher;
      }
      /**
       * Set up configuration watcher to update settings
       */
      _setupConfigurationWatcher() {
        vscode2.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration("explorerDates")) {
            this._logger.debug("Configuration changed, updating settings");
            const config = vscode2.workspace.getConfiguration("explorerDates");
            this._cacheTimeout = config.get("cacheTimeout", 3e4);
            this._maxCacheSize = config.get("maxCacheSize", 1e4);
            if (e.affectsConfiguration("explorerDates.showDateDecorations") || e.affectsConfiguration("explorerDates.dateDecorationFormat") || e.affectsConfiguration("explorerDates.excludedFolders") || e.affectsConfiguration("explorerDates.excludedPatterns") || e.affectsConfiguration("explorerDates.highContrastMode") || e.affectsConfiguration("explorerDates.fadeOldFiles") || e.affectsConfiguration("explorerDates.fadeThreshold") || e.affectsConfiguration("explorerDates.colorScheme") || e.affectsConfiguration("explorerDates.showGitInfo") || e.affectsConfiguration("explorerDates.customColors") || e.affectsConfiguration("explorerDates.showFileSize") || e.affectsConfiguration("explorerDates.fileSizeFormat")) {
              this.refreshAll();
            }
          }
        });
      }
      /**
       * Refresh decoration for a specific file
       */
      refreshDecoration(uri) {
        const cacheKey = this._getCacheKey(uri);
        this._decorationCache.delete(cacheKey);
        if (this._advancedCache) {
          try {
            this._advancedCache.invalidateByPattern(cacheKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
          } catch (error) {
            this._logger.debug(`Could not invalidate advanced cache for ${path.basename(uri.fsPath)}: ${error.message}`);
          }
        }
        this._onDidChangeFileDecorations.fire(uri);
        this._logger.debug(`\u{1F504} Refreshed decoration cache for: ${path.basename(uri.fsPath)}`);
      }
      /**
       * Clear decoration for a deleted file
       */
      clearDecoration(uri) {
        const cacheKey = this._getCacheKey(uri);
        this._decorationCache.delete(cacheKey);
        if (this._advancedCache) {
          this._logger.debug(`Advanced cache entry will expire naturally: ${path.basename(uri.fsPath)}`);
        }
        this._onDidChangeFileDecorations.fire(uri);
        this._logger.debug(`\u{1F5D1}\uFE0F Cleared decoration cache for: ${path.basename(uri.fsPath)}`);
      }
      /**
       * Clear all caches (memory and advanced cache)
       */
      clearAllCaches() {
        const memorySize = this._decorationCache.size;
        this._decorationCache.clear();
        this._logger.info(`Cleared memory cache (was ${memorySize} items)`);
        if (this._advancedCache) {
          this._advancedCache.clear();
          this._logger.info("Cleared advanced cache");
        }
        this._metrics.cacheHits = 0;
        this._metrics.cacheMisses = 0;
        this._logger.info("All caches cleared successfully");
      }
      /**
       * Refresh all decorations
       */
      refreshAll() {
        this._decorationCache.clear();
        if (this._advancedCache) {
          this._advancedCache.clear();
        }
        this._onDidChangeFileDecorations.fire(void 0);
        this._logger.info("All decorations refreshed with cache clear");
      }
      /**
       * Simplified exclusion check - bypasses smart exclusion system
       * Made public for diagnostics
       */
      async _isExcludedSimple(uri) {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        const fileExt = path.extname(filePath).toLowerCase();
        const forceShowTypes = config.get("forceShowForFileTypes", []);
        if (forceShowTypes.length > 0 && forceShowTypes.includes(fileExt)) {
          this._logger.debug(`File type ${fileExt} is forced to show: ${filePath}`);
          return false;
        }
        const troubleshootingMode = config.get("enableTroubleShootingMode", false);
        if (troubleshootingMode) {
          this._logger.info(`\u{1F50D} Checking exclusion for: ${fileName} (ext: ${fileExt})`);
        }
        const excludedFolders = config.get("excludedFolders", ["node_modules", ".git", "dist", "build", "out", ".vscode-test"]);
        const excludedPatterns = config.get("excludedPatterns", ["**/*.tmp", "**/*.log", "**/.git/**", "**/node_modules/**"]);
        for (const folder of excludedFolders) {
          if (filePath.includes(`${path.sep}${folder}${path.sep}`) || filePath.endsWith(`${path.sep}${folder}`)) {
            if (troubleshootingMode) {
              this._logger.info(`\u274C File excluded by folder: ${filePath} (${folder})`);
            } else {
              this._logger.debug(`File excluded by folder: ${filePath} (${folder})`);
            }
            return true;
          }
        }
        for (const pattern of excludedPatterns) {
          if (pattern.includes("node_modules") && filePath.includes("node_modules")) {
            return true;
          }
          if (pattern.includes(".git/**") && filePath.includes(".git" + path.sep)) {
            return true;
          }
          if (pattern.includes("*.tmp") && fileName.endsWith(".tmp")) {
            return true;
          }
          if (pattern.includes("*.log") && fileName.endsWith(".log")) {
            return true;
          }
        }
        if (troubleshootingMode) {
          this._logger.info(`\u2705 File NOT excluded: ${fileName} (ext: ${fileExt})`);
        }
        return false;
      }
      /**
       * Check if a file path should be excluded from decorations (complex version)
       */
      async _isExcluded(uri) {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        const workspaceFolder = vscode2.workspace.getWorkspaceFolder(uri);
        if (workspaceFolder) {
          const combined = await this._smartExclusion.getCombinedExclusions(workspaceFolder.uri);
          for (const folder of combined.folders) {
            const folderPattern = new RegExp(`(^|${path.sep.replace(/[\\]/g, "\\\\")})${folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(${path.sep.replace(/[\\]/g, "\\\\")}|$)`);
            if (folderPattern.test(filePath)) {
              this._logger.debug(`File excluded by folder rule: ${filePath} (folder: ${folder})`);
              return true;
            }
          }
          for (const pattern of combined.patterns) {
            const regexPattern = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/\\\\]*").replace(/\?/g, ".");
            const regex = new RegExp(regexPattern);
            if (regex.test(filePath) || regex.test(fileName)) {
              this._logger.debug(`File excluded by pattern: ${filePath} (pattern: ${pattern})`);
              return true;
            }
          }
        } else {
          const excludedFolders = config.get("excludedFolders", []);
          const excludedPatterns = config.get("excludedPatterns", []);
          for (const folder of excludedFolders) {
            const folderPattern = new RegExp(`(^|${path.sep.replace(/[\\]/g, "\\\\")})${folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(${path.sep.replace(/[\\]/g, "\\\\")}|$)`);
            if (folderPattern.test(filePath)) {
              return true;
            }
          }
          for (const pattern of excludedPatterns) {
            const regexPattern = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/\\\\]*").replace(/\?/g, ".");
            const regex = new RegExp(regexPattern);
            if (regex.test(filePath) || regex.test(fileName)) {
              return true;
            }
          }
        }
        return false;
      }
      /**
       * Manage cache size to prevent memory issues
       */
      _manageCacheSize() {
        if (this._decorationCache.size > this._maxCacheSize) {
          this._logger.debug(`Cache size (${this._decorationCache.size}) exceeds max (${this._maxCacheSize}), cleaning old entries`);
          const entriesToRemove = Math.floor(this._maxCacheSize * 0.2);
          const entries = Array.from(this._decorationCache.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
          for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
            this._decorationCache.delete(entries[i][0]);
          }
          this._logger.debug(`Removed ${entriesToRemove} old cache entries`);
        }
      }
      /**
       * Format date badge - VS Code compliant 2-character indicators
       * Based on user experience that VS Code supports at least 2 characters
       */
      _formatDateBadge(date, formatType, precalcDiffMs = null) {
        const now = /* @__PURE__ */ new Date();
        const diffMs = precalcDiffMs !== null ? precalcDiffMs : now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1e3 * 60));
        const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        switch (formatType) {
          case "relative-short":
          case "relative-long":
            if (diffMinutes < 1) return "\u25CF\u25CF";
            if (diffMinutes < 60) return `${Math.min(diffMinutes, 99)}m`;
            if (diffHours < 24) return `${Math.min(diffHours, 23)}h`;
            if (diffDays < 7) return `${diffDays}d`;
            if (diffWeeks < 4) return `${diffWeeks}w`;
            if (diffMonths < 12) return `${diffMonths}M`;
            return "1y";
          // 1+ year
          case "absolute-short":
          case "absolute-long": {
            const monthNames = [
              "Ja",
              "Fe",
              "Mr",
              "Ap",
              "My",
              "Jn",
              "Jl",
              "Au",
              "Se",
              "Oc",
              "No",
              "De"
            ];
            const day = date.getDate();
            return `${monthNames[date.getMonth()]}${day < 10 ? "0" + day : day}`;
          }
          case "technical":
            if (diffMinutes < 60) return `${diffMinutes}m`;
            if (diffHours < 24) return `${diffHours}h`;
            return `${diffDays}d`;
          case "minimal":
            if (diffHours < 1) return "\u2022\u2022";
            if (diffHours < 24) return "\u25CB\u25CB";
            return "\u2500\u2500";
          default:
            if (diffMinutes < 60) return `${diffMinutes}m`;
            if (diffHours < 24) return `${diffHours}h`;
            return `${diffDays}d`;
        }
      }
      /**
       * Format file size for display
       */
      _formatFileSize(bytes, format = "auto") {
        if (format === "bytes") {
          return `~${bytes}B`;
        }
        const kb = bytes / 1024;
        if (format === "kb") {
          return `~${kb.toFixed(1)}K`;
        }
        const mb = kb / 1024;
        if (format === "mb") {
          return `~${mb.toFixed(1)}M`;
        }
        if (bytes < 1024) {
          return `~${bytes}B`;
        } else if (kb < 1024) {
          return `~${Math.round(kb)}K`;
        } else {
          return `~${mb.toFixed(1)}M`;
        }
      }
      /**
       * Get color based on color scheme setting
       */
      _getColorByScheme(date, colorScheme, filePath = "") {
        if (colorScheme === "none") {
          return void 0;
        }
        const now = /* @__PURE__ */ new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
        switch (colorScheme) {
          case "recency":
            if (diffHours < 1) return new vscode2.ThemeColor("charts.green");
            if (diffHours < 24) return new vscode2.ThemeColor("charts.yellow");
            return new vscode2.ThemeColor("charts.red");
          case "file-type": {
            const ext = path.extname(filePath).toLowerCase();
            if ([".js", ".ts", ".jsx", ".tsx"].includes(ext)) return new vscode2.ThemeColor("charts.blue");
            if ([".css", ".scss", ".less"].includes(ext)) return new vscode2.ThemeColor("charts.purple");
            if ([".html", ".htm", ".xml"].includes(ext)) return new vscode2.ThemeColor("charts.orange");
            if ([".json", ".yaml", ".yml"].includes(ext)) return new vscode2.ThemeColor("charts.green");
            if ([".md", ".txt", ".log"].includes(ext)) return new vscode2.ThemeColor("charts.yellow");
            if ([".py", ".rb", ".php"].includes(ext)) return new vscode2.ThemeColor("charts.red");
            return new vscode2.ThemeColor("editorForeground");
          }
          case "subtle":
            if (diffHours < 1) return new vscode2.ThemeColor("editorInfo.foreground");
            if (diffDays < 7) return new vscode2.ThemeColor("editorWarning.foreground");
            return new vscode2.ThemeColor("editorError.foreground");
          case "vibrant":
            if (diffHours < 1) return new vscode2.ThemeColor("terminal.ansiGreen");
            if (diffHours < 24) return new vscode2.ThemeColor("terminal.ansiYellow");
            if (diffDays < 7) return new vscode2.ThemeColor("terminal.ansiMagenta");
            return new vscode2.ThemeColor("terminal.ansiRed");
          case "custom": {
            const config = vscode2.workspace.getConfiguration("explorerDates");
            const customColors = config.get("customColors", {
              veryRecent: "#00ff00",
              recent: "#ffff00",
              old: "#ff0000"
            });
            if (diffHours < 1) {
              return customColors.veryRecent.toLowerCase().includes("green") || customColors.veryRecent === "#00ff00" ? new vscode2.ThemeColor("terminal.ansiGreen") : new vscode2.ThemeColor("editorInfo.foreground");
            }
            if (diffHours < 24) {
              return customColors.recent.toLowerCase().includes("yellow") || customColors.recent === "#ffff00" ? new vscode2.ThemeColor("terminal.ansiYellow") : new vscode2.ThemeColor("editorWarning.foreground");
            }
            return customColors.old.toLowerCase().includes("red") || customColors.old === "#ff0000" ? new vscode2.ThemeColor("terminal.ansiRed") : new vscode2.ThemeColor("editorError.foreground");
          }
          default:
            return void 0;
        }
      }
      /**
       * Format readable date for tooltip
       */
      _formatDateReadable(date) {
        const now = /* @__PURE__ */ new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1e3 * 60));
        const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
        if (diffMins < 1) return this._l10n.getString("justNow");
        if (diffMins < 60) return this._l10n.getString("minutesAgo", diffMins);
        if (diffHours < 24 && date.toDateString() === now.toDateString()) {
          return this._l10n.getString("hoursAgo", diffHours);
        }
        if (diffDays < 7) {
          return diffDays === 1 ? this._l10n.getString("yesterday") : this._l10n.getString("daysAgo", diffDays);
        }
        if (date.getFullYear() === now.getFullYear()) {
          return this._l10n.formatDate(date, { month: "short", day: "numeric" });
        }
        return this._l10n.formatDate(date, { month: "short", day: "numeric", year: "numeric" });
      }
      /**
       * Get Git blame information for a file
       */
      async _getGitBlameInfo(filePath) {
        try {
          const workspaceFolder = vscode2.workspace.getWorkspaceFolder(vscode2.Uri.file(filePath));
          if (!workspaceFolder) {
            return null;
          }
          const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
          const { stdout } = await execAsync(
            `git log -1 --format="%an|%ae|%ad" -- "${relativePath}"`,
            { cwd: workspaceFolder.uri.fsPath, timeout: 2e3 }
          );
          if (!stdout || !stdout.trim()) {
            return null;
          }
          const [authorName, authorEmail, authorDate] = stdout.trim().split("|");
          return {
            authorName: authorName || "Unknown",
            authorEmail: authorEmail || "",
            authorDate: authorDate || ""
          };
        } catch (error) {
          return null;
        }
      }
      /**
       * Get initials (up to 2 characters) from a full name
       */
      _getInitials(fullName) {
        if (!fullName || typeof fullName !== "string") return null;
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return null;
        if (parts.length === 1) {
          return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + (parts[1][0] || "")).substring(0, 2).toUpperCase();
      }
      /**
       * Format a very compact size string (max 2 characters) for badges.
       * Strategy: prefer `<digit><unit>` where possible (e.g. '5K', '2M'),
       * fall back to two-digit number when needed (e.g. '12').
       */
      _formatCompactSize(bytes) {
        if (typeof bytes !== "number" || isNaN(bytes)) return null;
        const units = ["B", "K", "M", "G", "T"];
        let i = 0;
        let val = bytes;
        while (val >= 1024 && i < units.length - 1) {
          val = val / 1024;
          i++;
        }
        const rounded = Math.round(val);
        const unit = units[i];
        if (rounded <= 9) {
          return `${rounded}${unit}`;
        }
        const s = String(rounded);
        if (s.length >= 2) return s.slice(0, 2);
        return s;
      }
      /**
       * Format full date with timezone
       */
      _formatFullDate(date) {
        const options = {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short"
        };
        return date.toLocaleString("en-US", options);
      }
      /**
       * Normalize cache key to handle different URI representations
       */
      _getCacheKey(uri) {
        const normalized = path.resolve(uri.fsPath).toLowerCase();
        return normalized;
      }
      /**
       * Get file decoration with enhanced caching
       */
      async provideFileDecoration(uri, token) {
        let startTime;
        try {
          startTime = Date.now();
          if (!uri || !uri.fsPath) {
            console.error("\u274C Invalid URI provided to provideFileDecoration:", uri);
            return void 0;
          }
          const fileName = require("path").basename(uri.fsPath);
          this._logger.info(`\u{1F50D} VSCODE REQUESTED DECORATION: ${fileName} (${uri.fsPath})`);
          this._logger.info(`\u{1F4CA} Call context: token=${!!token}, cancelled=${token?.isCancellationRequested}`);
          const config = vscode2.workspace.getConfiguration("explorerDates");
          const _get = (key, def) => {
            if (this._previewSettings && Object.prototype.hasOwnProperty.call(this._previewSettings, key)) {
              const previewValue = this._previewSettings[key];
              this._logger.debug(`\u{1F3AD} Using preview value for ${key}: ${previewValue} (config has: ${config.get(key, def)})`);
              return previewValue;
            }
            return config.get(key, def);
          };
          if (this._previewSettings) {
            this._logger.info(`\u{1F3AD} Processing ${fileName} in PREVIEW MODE with settings:`, this._previewSettings);
          }
          if (!_get("showDateDecorations", true)) {
            this._logger.info(`\u274C RETURNED UNDEFINED: Decorations disabled globally for ${fileName}`);
            return void 0;
          }
          if (uri.scheme !== "file") {
            this._logger.debug(`Non-file URI scheme: ${uri.scheme}`);
            return void 0;
          }
          const filePath = uri.fsPath;
          const cacheKey = this._getCacheKey(uri);
          if (await this._isExcludedSimple(uri)) {
            this._logger.info(`\u274C File excluded: ${path.basename(filePath)}`);
            return void 0;
          }
          this._logger.debug(`\u{1F50D} Processing file: ${path.basename(filePath)}`);
          let cached = null;
          if (!this._previewSettings) {
            if (this._advancedCache) {
              try {
                cached = await this._advancedCache.get(cacheKey);
                if (cached) {
                  this._metrics.cacheHits++;
                  this._logger.debug(`\u{1F9E0} Advanced cache hit for: ${path.basename(filePath)}`);
                  return cached;
                }
              } catch (error) {
                this._logger.debug(`Advanced cache error: ${error.message}`);
              }
            }
            cached = this._decorationCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this._cacheTimeout) {
              this._metrics.cacheHits++;
              this._logger.debug(`\u{1F4BE} Memory cache hit for: ${path.basename(filePath)}`);
              return cached.decoration;
            }
          } else {
            this._logger.debug(`\u{1F504} Skipping cache due to active preview settings for: ${path.basename(filePath)}`);
          }
          this._metrics.cacheMisses++;
          this._logger.debug(`\u274C Cache miss for: ${path.basename(filePath)} (key: ${cacheKey.substring(0, 50)}...)`);
          if (token && token.isCancellationRequested) {
            this._logger.debug(`Decoration cancelled for: ${filePath}`);
            return void 0;
          }
          const stat = await fs.stat(filePath);
          if (!stat.isFile()) {
            return void 0;
          }
          const mtime = stat.mtime;
          const ctime = stat.birthtime;
          const now = /* @__PURE__ */ new Date();
          const diffMs = now.getTime() - mtime.getTime();
          const dateFormat = _get("dateDecorationFormat", "smart");
          const colorScheme = _get("colorScheme", "none");
          const highContrastMode = _get("highContrastMode", false);
          const showFileSize = _get("showFileSize", false);
          const fileSizeFormat = _get("fileSizeFormat", "auto");
          const badge = this._formatDateBadge(mtime, dateFormat, diffMs);
          const readableModified = this._formatDateReadable(mtime);
          const readableCreated = this._formatDateReadable(ctime);
          const showGitInfo = _get("showGitInfo", "none");
          const badgePriority = _get("badgePriority", "time");
          const needGitBlame = showGitInfo !== "none" || badgePriority === "author";
          const gitBlame = needGitBlame ? await this._getGitBlameInfo(filePath) : null;
          let displayBadge = badge;
          this._logger.debug(`\u{1F3F7}\uFE0F Badge generation for ${path.basename(filePath)}: badgePriority=${badgePriority}, showGitInfo=${showGitInfo}, hasGitBlame=${!!gitBlame}, authorName=${gitBlame?.authorName}, previewMode=${!!this._previewSettings}`);
          if (badgePriority === "author" && gitBlame && gitBlame.authorName) {
            const initials = this._getInitials(gitBlame.authorName);
            if (initials) {
              displayBadge = initials;
              this._logger.debug(`\u{1F3F7}\uFE0F Using author initials badge: "${initials}" (from ${gitBlame.authorName})`);
            }
          } else if (badgePriority === "size" && showFileSize) {
            const compact = this._formatCompactSize(stat.size);
            if (compact) {
              displayBadge = compact;
              this._logger.debug(`\u{1F3F7}\uFE0F Using size badge: "${compact}"`);
            }
          } else {
            displayBadge = badge;
            this._logger.debug(`\u{1F3F7}\uFE0F Using time badge: "${badge}" (badgePriority=${badgePriority})`);
          }
          const fileDisplayName = path.basename(filePath);
          const fileExt = path.extname(filePath);
          const isCodeFile = [".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".php", ".java", ".cpp", ".c", ".cs", ".go", ".rs", ".kt", ".swift"].includes(fileExt.toLowerCase());
          const accessibilityMode = _get("accessibilityMode", false);
          const shouldUseAccessibleTooltips = accessibilityMode && this._accessibility?.shouldEnhanceAccessibility();
          this._logger.debug(`\u{1F50D} Tooltip generation for ${path.basename(filePath)}: accessibilityMode=${accessibilityMode}, shouldUseAccessible=${shouldUseAccessibleTooltips}, previewMode=${!!this._previewSettings}`);
          let tooltip;
          this._logger.info(`\u{1F50D} TOOLTIP GENERATION START: accessibilityMode=${accessibilityMode}, shouldUseAccessible=${shouldUseAccessibleTooltips}, file=${path.basename(filePath)}`);
          if (shouldUseAccessibleTooltips) {
            const accessibleTooltip = this._accessibility.getAccessibleTooltip(filePath, mtime, ctime, stat.size, gitBlame);
            if (accessibleTooltip) {
              tooltip = accessibleTooltip;
              this._logger.info(`\u{1F50D} Using accessible tooltip (${accessibleTooltip.length} chars): "${accessibleTooltip.substring(0, 50)}..."`);
            } else {
              this._logger.info(`\u{1F50D} Accessible tooltip generation failed, using rich tooltip`);
            }
          }
          if (!tooltip) {
            this._logger.info(`\u{1F50D} Creating RICH tooltip for ${path.basename(filePath)}`);
            tooltip = `\u{1F4C4} File: ${fileDisplayName}
`;
            tooltip += `\u{1F4DD} Last Modified: ${readableModified}
`;
            tooltip += `   ${this._formatFullDate(mtime)}

`;
            tooltip += `\u{1F4C5} Created: ${readableCreated}
`;
            tooltip += `   ${this._formatFullDate(ctime)}

`;
            tooltip += `\u{1F4CA} Size: ${this._formatFileSize(stat.size, "auto")} (${stat.size.toLocaleString()} bytes)
`;
            if (fileExt) {
              tooltip += `\u{1F3F7}\uFE0F Type: ${fileExt.toUpperCase()} file
`;
            }
            if (isCodeFile) {
              try {
                const content = await fs.readFile(filePath, "utf8");
                const lineCount = content.split("\n").length;
                tooltip += `\u{1F4CF} Lines: ${lineCount.toLocaleString()}
`;
              } catch (error) {
              }
            }
            tooltip += `\u{1F4C2} Path: ${filePath}`;
            if (gitBlame) {
              tooltip += `

\u{1F464} Last Modified By: ${gitBlame.authorName}`;
              if (gitBlame.authorEmail) {
                tooltip += ` (${gitBlame.authorEmail})`;
              }
              if (gitBlame.authorDate) {
                tooltip += `
   ${gitBlame.authorDate}`;
              }
            }
          }
          let color = void 0;
          if (colorScheme !== "none") {
            if (this._themeIntegration) {
              color = this._themeIntegration.applyThemeAwareColorScheme(colorScheme, filePath, diffMs);
            } else {
              color = this._getColorByScheme(mtime, colorScheme, filePath);
            }
          }
          this._logger.debug(`\u{1F3A8} Color scheme setting: ${colorScheme}, using color: ${color ? "yes" : "no"}`);
          const fadeOldFiles = _get("fadeOldFiles", false);
          const fadeThreshold = _get("fadeThreshold", 30);
          if (fadeOldFiles) {
            const daysSinceModified = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
            if (daysSinceModified > fadeThreshold) {
              color = new vscode2.ThemeColor("editorGutter.commentRangeForeground");
            }
          }
          let finalBadge = displayBadge;
          if (this._accessibility && this._accessibility.shouldEnhanceAccessibility()) {
            finalBadge = this._accessibility.getAccessibleBadge(displayBadge);
          }
          if (finalBadge && finalBadge.length > 2) {
            finalBadge = finalBadge.substring(0, 2);
          }
          this._logger.info(`\u{1F3F7}\uFE0F Final badge for ${path.basename(filePath)}: "${finalBadge}" (type: ${typeof finalBadge})`);
          let decoration;
          try {
            decoration = new vscode2.FileDecoration(finalBadge);
            this._logger.info(`\u{1F9EA} Simple decoration test: badge="${finalBadge}"`);
            if (tooltip && tooltip.length < 500) {
              decoration.tooltip = tooltip;
              this._logger.debug(`\u{1F4DD} Added tooltip (${tooltip.length} chars)`);
            }
            if (color) {
              const enhancedColor = this._enhanceColorForSelection(color, colorScheme);
              decoration.color = enhancedColor;
              this._logger.debug(`\u{1F3A8} Added enhanced color: ${enhancedColor.id || enhancedColor} (original: ${color.id || color})`);
            }
            decoration.propagate = false;
            this._logger.info(`\u{1F4DD} Final decoration:`, {
              badge: decoration.badge,
              tooltip: decoration.tooltip ? `${decoration.tooltip.length} chars` : "none",
              color: decoration.color ? decoration.color.id || "custom" : "none",
              propagate: decoration.propagate
            });
            if (decoration.tooltip) {
              this._logger.info(`\u{1F4DD} Tooltip content preview: "${decoration.tooltip.substring(0, 100)}..."`);
            }
          } catch (decorationError) {
            this._logger.error(`\u274C Failed to create decoration:`, decorationError);
            decoration = new vscode2.FileDecoration("!!");
            decoration.propagate = false;
          }
          this._logger.debug(`\u{1F3A8} Color/contrast check for ${path.basename(filePath)}: colorScheme=${colorScheme}, highContrastMode=${highContrastMode}, hasColor=${!!color}, previewMode=${!!this._previewSettings}`);
          if (highContrastMode) {
            decoration.color = new vscode2.ThemeColor("editorWarning.foreground");
            this._logger.info(`\u{1F506} Applied high contrast color (overriding colorScheme=${colorScheme})`);
          }
          if (!this._previewSettings) {
            this._manageCacheSize();
            const cacheEntry = {
              decoration,
              timestamp: Date.now()
            };
            this._decorationCache.set(cacheKey, cacheEntry);
            if (this._advancedCache) {
              try {
                await this._advancedCache.set(cacheKey, decoration, { ttl: this._cacheTimeout });
                this._logger.debug(`\u{1F9E0} Stored in advanced cache: ${path.basename(filePath)}`);
              } catch (error) {
                this._logger.debug(`Failed to store in advanced cache: ${error.message}`);
              }
            }
          } else {
            this._logger.debug(`\u{1F504} Skipping cache storage due to preview mode for: ${path.basename(filePath)}`);
          }
          this._metrics.totalDecorations++;
          if (!decoration) {
            this._logger.error(`\u274C Decoration is null for: ${path.basename(filePath)}`);
            return void 0;
          }
          if (!decoration.badge) {
            this._logger.error(`\u274C Decoration badge is empty for: ${path.basename(filePath)}`);
            return void 0;
          }
          if (typeof decoration.badge !== "string" || decoration.badge.length === 0) {
            this._logger.error(`\u274C Invalid badge type/length for: ${path.basename(filePath)} - Badge: ${decoration.badge}`);
            return void 0;
          }
          this._logger.info(`\u2705 Decoration created for: ${path.basename(filePath)} (badge: ${finalBadge || "undefined"}) - Cache key: ${cacheKey.substring(0, 30)}...`);
          const processingTime = Date.now() - startTime;
          this._logger.info(`\u{1F3AF} RETURNING DECORATION TO VSCODE:`, {
            file: fileDisplayName,
            badge: decoration.badge,
            hasTooltip: !!decoration.tooltip,
            hasColor: !!decoration.color,
            colorType: decoration.color?.constructor?.name,
            processingTimeMs: processingTime,
            decorationType: decoration.constructor.name
          });
          console.log(`\u{1F3AF} DECORATION RETURNED: ${fileDisplayName} \u2192 "${decoration.badge}"`);
          return decoration;
        } catch (error) {
          this._metrics.errors++;
          const processingTime = startTime ? Date.now() - startTime : 0;
          const safeFileName = uri?.fsPath ? require("path").basename(uri.fsPath) : "unknown-file";
          const safeUri = uri?.fsPath || "unknown-uri";
          this._logger.error(`\u274C DECORATION ERROR for ${safeFileName}:`, {
            error: error.message,
            stack: error.stack?.split("\n")[0],
            processingTimeMs: processingTime,
            uri: safeUri
          });
          console.error(`\u274C DECORATION ERROR: ${safeFileName} \u2192 ${error.message}`);
          console.error(`\u274C Full error:`, error);
          console.error(`\u274C Stack trace:`, error.stack);
          this._logger.error(`\u274C CRITICAL ERROR DETAILS for ${safeFileName}: ${error.message}`);
          this._logger.error(`\u274C Error type: ${error.constructor.name}`);
          this._logger.error(`\u274C Full stack: ${error.stack}`);
          this._logger.info(`\u274C RETURNED UNDEFINED: Error occurred for ${safeFileName}`);
          return void 0;
        }
      }
      /**
       * Get enhanced performance metrics with cache debugging
       */
      getMetrics() {
        const baseMetrics = {
          ...this._metrics,
          cacheSize: this._decorationCache.size,
          cacheHitRate: this._metrics.cacheHits + this._metrics.cacheMisses > 0 ? (this._metrics.cacheHits / (this._metrics.cacheHits + this._metrics.cacheMisses) * 100).toFixed(2) + "%" : "0.00%"
        };
        if (this._advancedCache) {
          baseMetrics.advancedCache = this._advancedCache.getStats();
        }
        if (this._batchProcessor) {
          baseMetrics.batchProcessor = this._batchProcessor.getMetrics();
        }
        baseMetrics.cacheDebugging = {
          memoryCacheKeys: Array.from(this._decorationCache.keys()).slice(0, 5),
          // First 5 keys for debugging
          cacheTimeout: this._cacheTimeout,
          maxCacheSize: this._maxCacheSize,
          keyStatsSize: this._cacheKeyStats ? this._cacheKeyStats.size : 0
        };
        return baseMetrics;
      }
      /**
       * Initialize context-dependent systems
       */
      async initializeAdvancedSystems(context) {
        try {
          this._advancedCache = new AdvancedCache(context);
          await this._advancedCache.initialize();
          this._logger.info("Advanced cache initialized");
          this._batchProcessor.initialize();
          this._logger.info("Batch processor initialized");
          const config = vscode2.workspace.getConfiguration("explorerDates");
          if (config.get("autoThemeAdaptation", true)) {
            await this._themeIntegration.autoConfigureForTheme();
            this._logger.info("Theme integration configured");
          }
          if (this._accessibility.shouldEnhanceAccessibility()) {
            await this._accessibility.applyAccessibilityRecommendations();
            this._logger.info("Accessibility recommendations applied");
          }
          if (vscode2.workspace.workspaceFolders) {
            for (const folder of vscode2.workspace.workspaceFolders) {
              try {
                await this._smartExclusion.suggestExclusions(folder.uri);
                this._logger.info(`Smart exclusions analyzed for: ${folder.name}`);
              } catch (error) {
                this._logger.error(`Failed to analyze smart exclusions for ${folder.name}`, error);
              }
            }
          }
          this._logger.info("Advanced systems initialized successfully");
        } catch (error) {
          this._logger.error("Failed to initialize advanced systems", error);
        }
      }
      /**
       * Enhance color for better visibility against selection backgrounds
       */
      _enhanceColorForSelection(color, colorScheme) {
        const colorEnhancementMap = {
          // Chart colors that may not work well with selections
          "charts.yellow": "list.warningForeground",
          "charts.red": "list.errorForeground",
          "charts.green": "list.highlightForeground",
          "charts.blue": "symbolIcon.functionForeground",
          "charts.purple": "symbolIcon.classForeground",
          "charts.orange": "list.warningForeground",
          // Terminal colors that may have poor selection contrast
          "terminal.ansiYellow": "list.warningForeground",
          "terminal.ansiGreen": "list.highlightForeground",
          "terminal.ansiRed": "list.errorForeground",
          "terminal.ansiBlue": "symbolIcon.functionForeground",
          "terminal.ansiMagenta": "symbolIcon.classForeground",
          "terminal.ansiCyan": "symbolIcon.stringForeground",
          // Editor colors that may not work in lists
          "editorGutter.commentRangeForeground": "list.deemphasizedForeground",
          "editorWarning.foreground": "list.warningForeground",
          "editorError.foreground": "list.errorForeground",
          "editorInfo.foreground": "list.highlightForeground"
        };
        const colorId = color.id || color;
        const enhancedColorId = colorEnhancementMap[colorId];
        if (enhancedColorId) {
          this._logger.debug(`\u{1F527} Enhanced color ${colorId} \u2192 ${enhancedColorId} for better selection visibility`);
          return new vscode2.ThemeColor(enhancedColorId);
        }
        return color;
      }
      /**
       * Dispose of resources
       */
      async dispose() {
        this._logger.info("Disposing FileDateDecorationProvider", this.getMetrics());
        if (this._advancedCache) {
          await this._advancedCache.dispose();
        }
        if (this._batchProcessor) {
          this._batchProcessor.dispose();
        }
        this._decorationCache.clear();
        this._onDidChangeFileDecorations.dispose();
        if (this._fileWatcher) {
          this._fileWatcher.dispose();
        }
      }
    };
    module2.exports = { FileDateDecorationProvider: FileDateDecorationProvider2 };
  }
});

// src/onboarding.js
var require_onboarding = __commonJS({
  "src/onboarding.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var { getLogger: getLogger2 } = require_logger();
    var { getLocalization: getLocalization2 } = require_localization();
    var OnboardingManager2 = class {
      constructor(context) {
        this._context = context;
        this._logger = getLogger2();
        this._l10n = getLocalization2();
        this._hasShownWelcome = context.globalState.get("explorerDates.hasShownWelcome", false);
        this._hasCompletedSetup = context.globalState.get("explorerDates.hasCompletedSetup", false);
        this._onboardingVersion = context.globalState.get("explorerDates.onboardingVersion", "0.0.0");
        this._logger.info("OnboardingManager initialized", {
          hasShownWelcome: this._hasShownWelcome,
          hasCompletedSetup: this._hasCompletedSetup,
          onboardingVersion: this._onboardingVersion
        });
      }
      /**
       * Check if onboarding should run
       */
      async shouldShowOnboarding() {
        const extensionVersion = this._context.extension.packageJSON.version;
        return !this._hasShownWelcome || !this._hasCompletedSetup || this._shouldShowVersionUpdate(extensionVersion);
      }
      /**
       * Check if version update warrants showing new features
       */
      _shouldShowVersionUpdate(currentVersion) {
        if (this._onboardingVersion === "0.0.0") return true;
        const [currentMajor, currentMinor] = currentVersion.split(".").map(Number);
        const [savedMajor, savedMinor] = this._onboardingVersion.split(".").map(Number);
        return currentMajor > savedMajor;
      }
      /**
       * Check if this is a minor update that deserves a gentle notification
       */
      _isMinorUpdate(currentVersion) {
        if (this._onboardingVersion === "0.0.0") return false;
        const [currentMajor, currentMinor] = currentVersion.split(".").map(Number);
        const [savedMajor, savedMinor] = this._onboardingVersion.split(".").map(Number);
        return currentMajor === savedMajor && currentMinor > savedMinor;
      }
      /**
       * Show welcome message and start onboarding flow
       */
      async showWelcomeMessage() {
        try {
          const extensionVersion = this._context.extension.packageJSON.version;
          const isUpdate = this._hasShownWelcome;
          const isMinorUpdate = this._isMinorUpdate(extensionVersion);
          if (isMinorUpdate) {
            return this._showGentleUpdateNotification(extensionVersion);
          }
          const message = isUpdate ? `Explorer Dates has been updated to v${extensionVersion} with new features and improvements!` : "See file modification dates right in VS Code Explorer with intuitive time badges, file sizes, Git info, and much more!";
          const actions = isUpdate ? ["\u{1F4D6} What's New", "\u2699\uFE0F Settings", "Dismiss"] : ["\u{1F680} Quick Setup", "\u{1F4D6} Feature Tour", "\u2699\uFE0F Settings", "Maybe Later"];
          const action = await vscode2.window.showInformationMessage(
            message,
            { modal: false },
            ...actions
          );
          await this._context.globalState.update("explorerDates.hasShownWelcome", true);
          await this._context.globalState.update("explorerDates.onboardingVersion", extensionVersion);
          switch (action) {
            case "\u{1F680} Quick Setup":
              await this.showQuickSetupWizard();
              break;
            case "\u{1F4D6} Feature Tour":
              await this.showFeatureTour();
              break;
            case "\u{1F4D6} What's New":
              await this.showWhatsNew(extensionVersion);
              break;
            case "\u2699\uFE0F Settings":
              await vscode2.commands.executeCommand("workbench.action.openSettings", "explorerDates");
              break;
            case "previewConfiguration":
              await vscode2.commands.executeCommand("explorerDates.previewConfiguration", message.settings);
              break;
            case "clearPreview":
              await vscode2.commands.executeCommand("explorerDates.clearPreview");
              break;
          }
          this._logger.info("Welcome message shown", { action, isUpdate, isMinorUpdate });
        } catch (error) {
          this._logger.error("Failed to show welcome message", error);
        }
      }
      /**
       * Show gentle update notification in status bar for minor updates
       */
      async _showGentleUpdateNotification(version) {
        const statusBarItem = vscode2.window.createStatusBarItem(vscode2.StatusBarAlignment.Right, 100);
        statusBarItem.text = `$(check) Explorer Dates updated to v${version}`;
        statusBarItem.tooltip = "Click to see what's new in Explorer Dates";
        statusBarItem.command = "explorerDates.showWhatsNew";
        statusBarItem.show();
        setTimeout(() => {
          statusBarItem.dispose();
        }, 1e4);
        await this._context.globalState.update("explorerDates.onboardingVersion", version);
        this._logger.info("Showed gentle update notification", { version });
      }
      /**
       * Show quick setup wizard for common configurations
       */
      async showQuickSetupWizard() {
        try {
          const panel = vscode2.window.createWebviewPanel(
            "explorerDatesSetup",
            "Explorer Dates Quick Setup",
            vscode2.ViewColumn.One,
            {
              enableScripts: true,
              retainContextWhenHidden: true
            }
          );
          panel.webview.html = this._generateSetupWizardHTML();
          panel.webview.onDidReceiveMessage(async (message) => {
            await this._handleSetupWizardMessage(message, panel);
          });
          this._logger.info("Quick setup wizard opened");
        } catch (error) {
          this._logger.error("Failed to show setup wizard", error);
        }
      }
      /**
       * Handle messages from setup wizard webview
       */
      async _handleSetupWizardMessage(message, panel) {
        try {
          switch (message.command) {
            case "applyConfiguration":
              await this._applyQuickConfiguration(message.configuration);
              await this._context.globalState.update("explorerDates.hasCompletedSetup", true);
              vscode2.window.showInformationMessage("\u2705 Explorer Dates configured successfully!");
              panel.dispose();
              break;
            case "previewConfiguration":
              if (message.settings) {
                await vscode2.commands.executeCommand("explorerDates.previewConfiguration", message.settings);
                this._logger.info("Configuration preview applied via webview", message.settings);
              }
              break;
            case "clearPreview":
              await vscode2.commands.executeCommand("explorerDates.clearPreview");
              this._logger.info("Configuration preview cleared via webview");
              break;
            case "skipSetup":
              await this._context.globalState.update("explorerDates.hasCompletedSetup", true);
              panel.dispose();
              break;
            case "openSettings":
              await vscode2.commands.executeCommand("workbench.action.openSettings", "explorerDates");
              panel.dispose();
              break;
          }
        } catch (error) {
          this._logger.error("Failed to handle setup wizard message", error);
        }
      }
      /**
       * Apply quick configuration based on user selections
       */
      async _applyQuickConfiguration(configuration) {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        if (configuration.preset) {
          const presets = this._getConfigurationPresets();
          const preset = presets[configuration.preset];
          if (preset) {
            this._logger.info(`Applying preset: ${configuration.preset}`, preset.settings);
            for (const [key, value] of Object.entries(preset.settings)) {
              await config.update(key, value, vscode2.ConfigurationTarget.Global);
              this._logger.debug(`Updated setting: explorerDates.${key} = ${value}`);
            }
            this._logger.info(`Applied preset: ${configuration.preset}`, preset.settings);
            vscode2.window.showInformationMessage(`Applied "${preset.name}" configuration. Changes should be visible immediately!`);
          }
        }
        if (configuration.individual) {
          for (const [key, value] of Object.entries(configuration.individual)) {
            await config.update(key, value, vscode2.ConfigurationTarget.Global);
          }
          this._logger.info("Applied individual settings", configuration.individual);
        }
        try {
          await vscode2.commands.executeCommand("explorerDates.refreshDateDecorations");
          this._logger.info("Decorations refreshed after configuration change");
        } catch (error) {
          this._logger.warn("Failed to refresh decorations after configuration change", error);
        }
      }
      /**
       * Get configuration presets for different use cases
       */
      _getConfigurationPresets() {
        return {
          minimal: {
            name: "Minimal",
            description: "Clean and simple - just show modification times in short format",
            settings: {
              dateDecorationFormat: "relative-short",
              colorScheme: "none",
              highContrastMode: false,
              showFileSize: false,
              showGitInfo: "none",
              badgePriority: "time",
              fadeOldFiles: false,
              enableContextMenu: false,
              showStatusBar: false
            }
          },
          developer: {
            name: "Developer",
            description: "Perfect for development - includes Git info, file sizes, and color coding",
            settings: {
              dateDecorationFormat: "smart",
              colorScheme: "recency",
              highContrastMode: false,
              showFileSize: true,
              fileSizeFormat: "auto",
              showGitInfo: "author",
              badgePriority: "time",
              fadeOldFiles: true,
              fadeThreshold: 30,
              enableContextMenu: true,
              showStatusBar: true
            }
          },
          powerUser: {
            name: "Power User",
            description: "Maximum information - all features enabled with vibrant colors",
            settings: {
              dateDecorationFormat: "smart",
              colorScheme: "vibrant",
              highContrastMode: false,
              showFileSize: true,
              fileSizeFormat: "auto",
              showGitInfo: "both",
              badgePriority: "time",
              fadeOldFiles: true,
              fadeThreshold: 14,
              enableContextMenu: true,
              showStatusBar: true,
              smartExclusions: true,
              progressiveLoading: true,
              persistentCache: true
            }
          },
          gitFocused: {
            name: "Git-Focused",
            description: "Show author initials as badges with full Git information in tooltips",
            settings: {
              dateDecorationFormat: "smart",
              colorScheme: "file-type",
              highContrastMode: false,
              showFileSize: false,
              showGitInfo: "both",
              badgePriority: "author",
              fadeOldFiles: false,
              enableContextMenu: true,
              showStatusBar: true
            }
          },
          accessible: {
            name: "Accessible",
            description: "High contrast and screen reader friendly with detailed tooltips",
            settings: {
              dateDecorationFormat: "relative-short",
              colorScheme: "none",
              highContrastMode: true,
              accessibilityMode: true,
              showFileSize: false,
              showGitInfo: "none",
              badgePriority: "time",
              fadeOldFiles: false,
              enableContextMenu: true,
              keyboardNavigation: true
            }
          }
        };
      }
      /**
       * Show interactive feature tour
       */
      async showFeatureTour() {
        try {
          const panel = vscode2.window.createWebviewPanel(
            "explorerDatesFeatureTour",
            "Explorer Dates Feature Tour",
            vscode2.ViewColumn.One,
            {
              enableScripts: true,
              retainContextWhenHidden: true
            }
          );
          panel.webview.html = this._generateFeatureTourHTML();
          panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "openSettings") {
              await vscode2.commands.executeCommand("workbench.action.openSettings", message.setting || "explorerDates");
            } else if (message.command === "runCommand") {
              await vscode2.commands.executeCommand(message.commandId);
            }
          });
          this._logger.info("Feature tour opened");
        } catch (error) {
          this._logger.error("Failed to show feature tour", error);
        }
      }
      /**
       * Generate HTML for setup wizard
       */
      _generateSetupWizardHTML() {
        const allPresets = this._getConfigurationPresets();
        const simplifiedPresets = {
          minimal: allPresets.minimal,
          developer: allPresets.developer,
          accessible: allPresets.accessible
        };
        const presetOptions = Object.entries(simplifiedPresets).map(([key, preset]) => `
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
        `).join("");
        const moreOptionsLink = `
            <div class="more-options">
                <p><strong>Need more options?</strong> Try the <a href="#" onclick="showAllPresets()">Power User</a> or <a href="#" onclick="showGitFocused()">Git-Focused</a> presets, or configure manually in Settings.</p>
            </div>
        `;
        return `
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
                    
                    ${presetOptions}
                    
                    ${moreOptionsLink}
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
                </script>
            </body>
            </html>
        `;
      }
      /**
       * Generate HTML for feature tour
       */
      _generateFeatureTourHTML() {
        return `
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
        `;
      }
      /**
       * Show tips and tricks for power users
       */
      async showTipsAndTricks() {
        const tips = [
          {
            icon: "\u2328\uFE0F",
            title: "Keyboard Shortcuts",
            description: "Use Ctrl+Shift+D (Cmd+Shift+D on Mac) to quickly toggle decorations on/off."
          },
          {
            icon: "\u{1F3AF}",
            title: "Smart Exclusions",
            description: "The extension automatically detects and suggests excluding build folders for better performance."
          },
          {
            icon: "\u{1F4CA}",
            title: "Performance Analytics",
            description: 'Use "Show Performance Analytics" to monitor cache performance and optimization opportunities.'
          },
          {
            icon: "\u{1F50D}",
            title: "Context Menu",
            description: "Right-click any file to access Git history, file details, and quick actions."
          }
        ];
        const selectedTip = tips[Math.floor(Math.random() * tips.length)];
        const message = `\u{1F4A1} **Tip**: ${selectedTip.title}
${selectedTip.description}`;
        const action = await vscode2.window.showInformationMessage(
          message,
          "Show More Tips",
          "Got it!"
        );
        if (action === "Show More Tips") {
          await this.showFeatureTour();
        }
      }
      /**
       * Show focused "What's New" for existing users
       */
      async showWhatsNew(version) {
        try {
          const panel = vscode2.window.createWebviewPanel(
            "explorerDatesWhatsNew",
            `Explorer Dates v${version} - What's New`,
            vscode2.ViewColumn.One,
            {
              enableScripts: true,
              retainContextWhenHidden: false
            }
          );
          panel.webview.html = this._generateWhatsNewHTML(version);
          panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
              case "openSettings":
                await vscode2.commands.executeCommand("workbench.action.openSettings", "explorerDates");
                panel.dispose();
                break;
              case "tryFeature":
                if (message.feature === "badgePriority") {
                  const config = vscode2.workspace.getConfiguration("explorerDates");
                  await config.update("badgePriority", "author", vscode2.ConfigurationTarget.Global);
                  vscode2.window.showInformationMessage("Badge priority set to author! You should see author initials on files now.");
                }
                break;
              case "dismiss":
                panel.dispose();
                break;
            }
          });
        } catch (error) {
          this._logger.error("Failed to show what's new", error);
        }
      }
      /**
       * Generate HTML for What's New panel
       */
      _generateWhatsNewHTML(version) {
        return `
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
                </script>
            </body>
            </html>
        `;
      }
    };
    module2.exports = { OnboardingManager: OnboardingManager2 };
  }
});

// src/workspaceTemplates.js
var require_workspaceTemplates = __commonJS({
  "src/workspaceTemplates.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var path = require("path");
    var fs = require("fs").promises;
    var { getLogger: getLogger2 } = require_logger();
    var logger2 = getLogger2();
    var WorkspaceTemplatesManager2 = class {
      constructor() {
        this.templatesPath = null;
        this.builtInTemplates = this.getBuiltInTemplates();
        this.initialize();
      }
      async initialize() {
        try {
          const workspaceFolders = vscode2.workspace.workspaceFolders;
          const storageUri = workspaceFolders && workspaceFolders[0] && workspaceFolders[0].uri;
          if (storageUri) {
            this.templatesPath = path.join(storageUri.fsPath, ".vscode", "explorer-dates-templates");
            await this.ensureTemplatesDirectory();
          }
          logger2.info("Workspace Templates Manager initialized");
        } catch (error) {
          logger2.error("Failed to initialize Workspace Templates Manager:", error);
        }
      }
      async ensureTemplatesDirectory() {
        try {
          if (this.templatesPath) {
            await fs.mkdir(this.templatesPath, { recursive: true });
          }
        } catch (error) {
          logger2.error("Failed to create templates directory:", error);
        }
      }
      getBuiltInTemplates() {
        return {
          "web-development": {
            name: "Web Development",
            description: "Optimized for web projects with focus on source files",
            settings: {
              "explorerDates.enabled": true,
              "explorerDates.displayFormat": "relative-short",
              "explorerDates.colorCoding": true,
              "explorerDates.showFileSize": true,
              "explorerDates.fadeOldFiles": true,
              "explorerDates.fadeThreshold": 14,
              "explorerDates.excludePatterns": [
                "**/node_modules/**",
                "**/dist/**",
                "**/build/**",
                "**/.next/**",
                "**/coverage/**"
              ]
            }
          },
          "data-science": {
            name: "Data Science",
            description: "Focused on notebooks and data files with detailed timestamps",
            settings: {
              "explorerDates.enabled": true,
              "explorerDates.displayFormat": "absolute-long",
              "explorerDates.colorCoding": false,
              "explorerDates.showFileSize": true,
              "explorerDates.showOnlyModified": false,
              "explorerDates.enableTooltips": true,
              "explorerDates.excludePatterns": [
                "**/__pycache__/**",
                "**/.ipynb_checkpoints/**",
                "**/data/raw/**"
              ]
            }
          },
          "documentation": {
            name: "Documentation",
            description: "Clean display for documentation projects",
            settings: {
              "explorerDates.enabled": true,
              "explorerDates.displayFormat": "smart",
              "explorerDates.colorCoding": false,
              "explorerDates.showFileSize": false,
              "explorerDates.minimalistMode": true,
              "explorerDates.excludePatterns": [
                "**/node_modules/**",
                "**/.git/**"
              ]
            }
          },
          "enterprise": {
            name: "Enterprise",
            description: "Full feature set with Git integration and analytics",
            settings: {
              "explorerDates.enabled": true,
              "explorerDates.displayFormat": "smart",
              "explorerDates.colorCoding": true,
              "explorerDates.showFileSize": true,
              "explorerDates.enableGitIntegration": true,
              "explorerDates.showGitInfo": "author",
              "explorerDates.enableWorkspaceAnalytics": true,
              "explorerDates.enableContextMenu": true,
              "explorerDates.enableStatusBar": true,
              "explorerDates.accessibilityMode": true
            }
          },
          "minimal": {
            name: "Minimal",
            description: "Clean, distraction-free setup",
            settings: {
              "explorerDates.enabled": true,
              "explorerDates.displayFormat": "relative-short",
              "explorerDates.colorCoding": false,
              "explorerDates.showFileSize": false,
              "explorerDates.minimalistMode": true,
              "explorerDates.enableTooltips": false
            }
          }
        };
      }
      async saveCurrentConfiguration(templateName, description = "") {
        try {
          if (!this.templatesPath) {
            throw new Error("Templates path not initialized");
          }
          const config = vscode2.workspace.getConfiguration("explorerDates");
          const settings = {};
          const inspect = config.inspect();
          if (inspect) {
            for (const [key, value] of Object.entries(inspect)) {
              if (value && typeof value === "object" && "workspaceValue" in value) {
                settings[`explorerDates.${key}`] = value.workspaceValue;
              } else if (value && typeof value === "object" && "globalValue" in value) {
                settings[`explorerDates.${key}`] = value.globalValue;
              }
            }
          }
          const template = {
            name: templateName,
            description,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            version: "1.0.0",
            settings
          };
          const templatePath = path.join(this.templatesPath, `${templateName}.json`);
          await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
          vscode2.window.showInformationMessage(`Template "${templateName}" saved successfully!`);
          logger2.info(`Saved workspace template: ${templateName}`);
          return true;
        } catch (error) {
          logger2.error("Failed to save template:", error);
          vscode2.window.showErrorMessage(`Failed to save template: ${error.message}`);
          return false;
        }
      }
      async loadTemplate(templateId) {
        try {
          let template;
          if (this.builtInTemplates[templateId]) {
            template = this.builtInTemplates[templateId];
          } else {
            if (!this.templatesPath) {
              throw new Error("Templates path not initialized");
            }
            const templatePath = path.join(this.templatesPath, `${templateId}.json`);
            const templateData = await fs.readFile(templatePath, "utf8");
            template = JSON.parse(templateData);
          }
          const config = vscode2.workspace.getConfiguration();
          for (const [key, value] of Object.entries(template.settings)) {
            await config.update(key, value, vscode2.ConfigurationTarget.Workspace);
          }
          vscode2.window.showInformationMessage(`Template "${template.name}" applied successfully!`);
          logger2.info(`Applied workspace template: ${template.name}`);
          return true;
        } catch (error) {
          logger2.error("Failed to load template:", error);
          vscode2.window.showErrorMessage(`Failed to load template: ${error.message}`);
          return false;
        }
      }
      async getAvailableTemplates() {
        const templates = [];
        for (const [id, template] of Object.entries(this.builtInTemplates)) {
          templates.push({
            id,
            name: template.name,
            description: template.description,
            type: "built-in",
            createdAt: null
          });
        }
        try {
          if (this.templatesPath) {
            const files = await fs.readdir(this.templatesPath);
            for (const file of files) {
              if (file.endsWith(".json")) {
                const templatePath = path.join(this.templatesPath, file);
                const templateData = await fs.readFile(templatePath, "utf8");
                const template = JSON.parse(templateData);
                templates.push({
                  id: path.basename(file, ".json"),
                  name: template.name,
                  description: template.description,
                  type: "custom",
                  createdAt: template.createdAt
                });
              }
            }
          }
        } catch (error) {
          logger2.error("Failed to load custom templates:", error);
        }
        return templates;
      }
      async deleteTemplate(templateId) {
        try {
          if (this.builtInTemplates[templateId]) {
            vscode2.window.showErrorMessage("Cannot delete built-in templates");
            return false;
          }
          if (!this.templatesPath) {
            throw new Error("Templates path not initialized");
          }
          const templatePath = path.join(this.templatesPath, `${templateId}.json`);
          await fs.unlink(templatePath);
          vscode2.window.showInformationMessage(`Template "${templateId}" deleted successfully!`);
          logger2.info(`Deleted workspace template: ${templateId}`);
          return true;
        } catch (error) {
          logger2.error("Failed to delete template:", error);
          vscode2.window.showErrorMessage(`Failed to delete template: ${error.message}`);
          return false;
        }
      }
      async exportTemplate(templateId, exportPath) {
        try {
          let template;
          if (this.builtInTemplates[templateId]) {
            template = this.builtInTemplates[templateId];
          } else {
            const templatePath = path.join(this.templatesPath, `${templateId}.json`);
            const templateData = await fs.readFile(templatePath, "utf8");
            template = JSON.parse(templateData);
          }
          await fs.writeFile(exportPath, JSON.stringify(template, null, 2));
          vscode2.window.showInformationMessage(`Template exported to ${exportPath}`);
          logger2.info(`Exported template ${templateId} to ${exportPath}`);
          return true;
        } catch (error) {
          logger2.error("Failed to export template:", error);
          vscode2.window.showErrorMessage(`Failed to export template: ${error.message}`);
          return false;
        }
      }
      async importTemplate(importPath) {
        try {
          const templateData = await fs.readFile(importPath, "utf8");
          const template = JSON.parse(templateData);
          if (!template.name || !template.settings) {
            throw new Error("Invalid template format");
          }
          const templateName = template.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
          const templatePath = path.join(this.templatesPath, `${templateName}.json`);
          await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
          vscode2.window.showInformationMessage(`Template "${template.name}" imported successfully!`);
          logger2.info(`Imported template: ${template.name}`);
          return true;
        } catch (error) {
          logger2.error("Failed to import template:", error);
          vscode2.window.showErrorMessage(`Failed to import template: ${error.message}`);
          return false;
        }
      }
      async showTemplateManager() {
        try {
          const templates = await this.getAvailableTemplates();
          const panel = vscode2.window.createWebviewPanel(
            "templateManager",
            "Explorer Dates - Template Manager",
            vscode2.ViewColumn.One,
            {
              enableScripts: true,
              retainContextWhenHidden: true
            }
          );
          panel.webview.html = this.getTemplateManagerHtml(templates);
          panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
              case "loadTemplate":
                await this.loadTemplate(message.templateId);
                break;
              case "deleteTemplate": {
                await this.deleteTemplate(message.templateId);
                const updatedTemplates = await this.getAvailableTemplates();
                panel.webview.postMessage({ command: "refreshTemplates", templates: updatedTemplates });
                break;
              }
              case "exportTemplate": {
                const result = await vscode2.window.showSaveDialog({
                  defaultUri: vscode2.Uri.file(`${message.templateId}.json`),
                  filters: { "JSON": ["json"] }
                });
                if (result) {
                  await this.exportTemplate(message.templateId, result.fsPath);
                }
                break;
              }
            }
          });
          logger2.info("Template Manager opened");
        } catch (error) {
          logger2.error("Failed to show template manager:", error);
          vscode2.window.showErrorMessage("Failed to open Template Manager");
        }
      }
      getTemplateManagerHtml(templates) {
        const templateItems = templates.map((template) => `
            <div class="template-item ${template.type}">
                <div class="template-header">
                    <h3>${template.name}</h3>
                    <span class="template-type">${template.type}</span>
                </div>
                <p class="template-description">${template.description}</p>
                ${template.createdAt ? `<small>Created: ${new Date(template.createdAt).toLocaleDateString()}</small>` : ""}
                <div class="template-actions">
                    <button onclick="loadTemplate('${template.id}')">Apply</button>
                    <button onclick="exportTemplate('${template.id}')">Export</button>
                    ${template.type === "custom" ? `<button onclick="deleteTemplate('${template.id}')" class="delete">Delete</button>` : ""}
                </div>
            </div>
        `).join("");
        return `<!DOCTYPE html>
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
                ${templateItems}
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
        </html>`;
      }
    };
    module2.exports = { WorkspaceTemplatesManager: WorkspaceTemplatesManager2 };
  }
});

// src/extensionApi.js
var require_extensionApi = __commonJS({
  "src/extensionApi.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var EventEmitter = require("events");
    var { getLogger: getLogger2 } = require_logger();
    var logger2 = getLogger2();
    var ExtensionApiManager2 = class extends EventEmitter {
      constructor() {
        super();
        this.plugins = /* @__PURE__ */ new Map();
        this.api = null;
        this.decorationProviders = /* @__PURE__ */ new Map();
        this.initialize();
      }
      initialize() {
        this.api = this.createPublicApi();
        logger2.info("Extension API Manager initialized");
      }
      /**
       * Create the public API that other extensions can use
       */
      createPublicApi() {
        return {
          // Core decoration functionality
          getFileDecorations: this.getFileDecorations.bind(this),
          refreshDecorations: this.refreshDecorations.bind(this),
          // Plugin system
          registerPlugin: this.registerPlugin.bind(this),
          unregisterPlugin: this.unregisterPlugin.bind(this),
          // Custom decoration providers
          registerDecorationProvider: this.registerDecorationProvider.bind(this),
          unregisterDecorationProvider: this.unregisterDecorationProvider.bind(this),
          // Events
          onDecorationChanged: this.onDecorationChanged.bind(this),
          onFileScanned: this.onFileScanned.bind(this),
          // Utilities
          formatDate: this.formatDate.bind(this),
          getFileStats: this.getFileStats.bind(this),
          // Version info
          version: "1.2.0",
          apiVersion: "1.0.0"
        };
      }
      /**
       * Get file decorations for specified files
       */
      async getFileDecorations(filePaths) {
        try {
          const decorations = [];
          for (const filePath of filePaths) {
            const uri = vscode2.Uri.file(filePath);
            const decoration = await this.getDecorationForFile(uri);
            if (decoration) {
              decorations.push({
                uri: uri.toString(),
                decoration
              });
            }
          }
          return decorations;
        } catch (error) {
          logger2.error("Failed to get file decorations:", error);
          return [];
        }
      }
      async getDecorationForFile(uri) {
        try {
          const stat = await vscode2.workspace.fs.stat(uri);
          const lastModified = new Date(stat.mtime);
          let decoration = {
            badge: this.formatDate(lastModified, "smart"),
            color: void 0,
            // Let the main decoration provider handle colors
            tooltip: `Modified: ${lastModified.toLocaleString()}`
          };
          for (const [providerId, provider] of this.decorationProviders) {
            try {
              const customDecoration = await provider.provideDecoration(uri, stat, decoration);
              if (customDecoration) {
                decoration = { ...decoration, ...customDecoration };
              }
            } catch (error) {
              logger2.error(`Decoration provider ${providerId} failed:`, error);
            }
          }
          return decoration;
        } catch (error) {
          logger2.error("Failed to get decoration for file:", error);
          return null;
        }
      }
      /**
       * Refresh decorations for all files or specific files
       */
      async refreshDecorations(filePaths = null) {
        try {
          this.emit("decorationRefreshRequested", filePaths);
          logger2.info("Decoration refresh requested");
          return true;
        } catch (error) {
          logger2.error("Failed to refresh decorations:", error);
          return false;
        }
      }
      /**
       * Register a plugin with the extension
       */
      registerPlugin(pluginId, plugin) {
        try {
          if (!this.validatePlugin(plugin)) {
            throw new Error("Invalid plugin structure");
          }
          this.plugins.set(pluginId, {
            ...plugin,
            registeredAt: /* @__PURE__ */ new Date(),
            active: true
          });
          if (typeof plugin.activate === "function") {
            plugin.activate(this.api);
          }
          this.emit("pluginRegistered", { pluginId, plugin });
          logger2.info(`Plugin registered: ${pluginId}`);
          return true;
        } catch (error) {
          logger2.error(`Failed to register plugin ${pluginId}:`, error);
          return false;
        }
      }
      /**
       * Unregister a plugin
       */
      unregisterPlugin(pluginId) {
        try {
          const plugin = this.plugins.get(pluginId);
          if (!plugin) {
            return false;
          }
          if (typeof plugin.deactivate === "function") {
            plugin.deactivate();
          }
          this.plugins.delete(pluginId);
          this.emit("pluginUnregistered", { pluginId });
          logger2.info(`Plugin unregistered: ${pluginId}`);
          return true;
        } catch (error) {
          logger2.error(`Failed to unregister plugin ${pluginId}:`, error);
          return false;
        }
      }
      /**
       * Register a custom decoration provider
       */
      registerDecorationProvider(providerId, provider) {
        try {
          if (!this.validateDecorationProvider(provider)) {
            throw new Error("Invalid decoration provider");
          }
          this.decorationProviders.set(providerId, provider);
          this.emit("decorationProviderRegistered", { providerId, provider });
          logger2.info(`Decoration provider registered: ${providerId}`);
          return true;
        } catch (error) {
          logger2.error(`Failed to register decoration provider ${providerId}:`, error);
          return false;
        }
      }
      /**
       * Unregister a decoration provider
       */
      unregisterDecorationProvider(providerId) {
        try {
          const removed = this.decorationProviders.delete(providerId);
          if (removed) {
            this.emit("decorationProviderUnregistered", { providerId });
            logger2.info(`Decoration provider unregistered: ${providerId}`);
          }
          return removed;
        } catch (error) {
          logger2.error(`Failed to unregister decoration provider ${providerId}:`, error);
          return false;
        }
      }
      /**
       * Subscribe to decoration change events
       */
      onDecorationChanged(callback) {
        this.on("decorationChanged", callback);
        return () => this.off("decorationChanged", callback);
      }
      /**
       * Subscribe to file scan events
       */
      onFileScanned(callback) {
        this.on("fileScanned", callback);
        return () => this.off("fileScanned", callback);
      }
      /**
       * Utility: Format date according to current settings
       */
      formatDate(date, format = null) {
        try {
          const config = vscode2.workspace.getConfiguration("explorerDates");
          const displayFormat = format || config.get("displayFormat", "smart");
          const now = /* @__PURE__ */ new Date();
          const diffMs = now - date;
          const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
          switch (displayFormat) {
            case "relative-short":
              return this.getRelativeTimeShort(diffMs);
            case "relative-long":
              return this.getRelativeTimeLong(diffMs);
            case "absolute-short":
              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            case "absolute-long":
              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              });
            case "smart":
            default:
              return diffDays < 7 ? this.getRelativeTimeShort(diffMs) : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
        } catch (error) {
          logger2.error("Failed to format date:", error);
          return date.toLocaleDateString();
        }
      }
      /**
       * Utility: Get file statistics
       */
      async getFileStats(filePath) {
        try {
          const uri = vscode2.Uri.file(filePath);
          const stat = await vscode2.workspace.fs.stat(uri);
          return {
            path: filePath,
            size: stat.size,
            created: new Date(stat.ctime),
            modified: new Date(stat.mtime),
            type: stat.type === vscode2.FileType.Directory ? "directory" : "file"
          };
        } catch (error) {
          logger2.error("Failed to get file stats:", error);
          return null;
        }
      }
      /**
       * Get the public API object
       */
      getApi() {
        return this.api;
      }
      /**
       * Get list of registered plugins
       */
      getRegisteredPlugins() {
        const plugins = [];
        for (const [id, plugin] of this.plugins) {
          plugins.push({
            id,
            name: plugin.name,
            version: plugin.version,
            author: plugin.author,
            active: plugin.active,
            registeredAt: plugin.registeredAt
          });
        }
        return plugins;
      }
      /**
       * Validate plugin structure
       */
      validatePlugin(plugin) {
        if (!plugin || typeof plugin !== "object") {
          return false;
        }
        if (!plugin.name || !plugin.version) {
          return false;
        }
        if (plugin.activate && typeof plugin.activate !== "function") {
          return false;
        }
        if (plugin.deactivate && typeof plugin.deactivate !== "function") {
          return false;
        }
        return true;
      }
      /**
       * Validate decoration provider
       */
      validateDecorationProvider(provider) {
        if (!provider || typeof provider !== "object") {
          return false;
        }
        if (typeof provider.provideDecoration !== "function") {
          return false;
        }
        return true;
      }
      /**
       * Helper: Get relative time in short format
       */
      getRelativeTimeShort(diffMs) {
        const diffSeconds = Math.floor(diffMs / 1e3);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffSeconds < 60) return `${diffSeconds}s`;
        if (diffMinutes < 60) return `${diffMinutes}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 30) return `${diffDays}d`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths}mo`;
        const diffYears = Math.floor(diffMonths / 12);
        return `${diffYears}y`;
      }
      /**
       * Helper: Get relative time in long format
       */
      getRelativeTimeLong(diffMs) {
        const diffSeconds = Math.floor(diffMs / 1e3);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""} ago`;
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
        const diffYears = Math.floor(diffMonths / 12);
        return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
      }
      /**
       * Helper: Get color for file age
       */
      getColorForAge(date) {
        const config = vscode2.workspace.getConfiguration("explorerDates");
        const colorCoding = config.get("colorCoding", false);
        if (!colorCoding) {
          return void 0;
        }
        const now = /* @__PURE__ */ new Date();
        const diffHours = (now - date) / (1e3 * 60 * 60);
        if (diffHours < 1) return new vscode2.ThemeColor("charts.green");
        if (diffHours < 24) return new vscode2.ThemeColor("charts.yellow");
        if (diffHours < 168) return new vscode2.ThemeColor("charts.orange");
        return new vscode2.ThemeColor("charts.red");
      }
      /**
       * Create example plugin for demonstration
       */
      createExamplePlugin() {
        return {
          name: "File Size Display",
          version: "1.0.0",
          author: "Explorer Dates",
          description: "Adds file size to decorations",
          activate: (api) => {
            api.registerDecorationProvider("fileSize", {
              provideDecoration: async (uri, stat, currentDecoration) => {
                const size = this.formatFileSize(stat.size);
                return {
                  badge: `${currentDecoration.badge} \u2022 ${size}`,
                  tooltip: `${currentDecoration.tooltip}
Size: ${size}`
                };
              }
            });
            console.log("File Size Display plugin activated");
          },
          deactivate: () => {
            console.log("File Size Display plugin deactivated");
          }
        };
      }
      formatFileSize(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
      }
    };
    module2.exports = { ExtensionApiManager: ExtensionApiManager2 };
  }
});

// src/exportReporting.js
var require_exportReporting = __commonJS({
  "src/exportReporting.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var path = require("path");
    var fs = require("fs").promises;
    var { getLogger: getLogger2 } = require_logger();
    var logger2 = getLogger2();
    var ExportReportingManager2 = class {
      constructor() {
        this.fileActivityCache = /* @__PURE__ */ new Map();
        this.reportFormats = ["json", "csv", "html", "markdown"];
        this.initialize();
      }
      async initialize() {
        try {
          this.startFileWatcher();
          logger2.info("Export & Reporting Manager initialized");
        } catch (error) {
          logger2.error("Failed to initialize Export & Reporting Manager:", error);
        }
      }
      startFileWatcher() {
        const watcher = vscode2.workspace.createFileSystemWatcher("**/*");
        watcher.onDidChange((uri) => {
          this.recordFileActivity(uri, "modified");
        });
        watcher.onDidCreate((uri) => {
          this.recordFileActivity(uri, "created");
        });
        watcher.onDidDelete((uri) => {
          this.recordFileActivity(uri, "deleted");
        });
      }
      recordFileActivity(uri, action) {
        try {
          const filePath = uri.fsPath;
          const timestamp = /* @__PURE__ */ new Date();
          if (!this.fileActivityCache.has(filePath)) {
            this.fileActivityCache.set(filePath, []);
          }
          this.fileActivityCache.get(filePath).push({
            action,
            timestamp,
            path: filePath
          });
          const activities = this.fileActivityCache.get(filePath);
          if (activities.length > 100) {
            activities.splice(0, activities.length - 100);
          }
        } catch (error) {
          logger2.error("Failed to record file activity:", error);
        }
      }
      async generateFileModificationReport(options = {}) {
        try {
          const {
            format = "json",
            timeRange = "all",
            includeDeleted = false,
            outputPath = null
          } = options;
          const report = await this.collectFileData(timeRange, includeDeleted);
          const formattedReport = await this.formatReport(report, format);
          if (outputPath) {
            await this.saveReport(formattedReport, outputPath);
            vscode2.window.showInformationMessage(`Report saved to ${outputPath}`);
          }
          return formattedReport;
        } catch (error) {
          logger2.error("Failed to generate file modification report:", error);
          vscode2.window.showErrorMessage("Failed to generate report");
          return null;
        }
      }
      async collectFileData(timeRange, includeDeleted) {
        const files = [];
        const workspaceFolders = vscode2.workspace.workspaceFolders;
        if (!workspaceFolders) {
          return { files: [], summary: this.createSummary([]) };
        }
        for (const folder of workspaceFolders) {
          const folderFiles = await this.scanWorkspaceFolder(folder.uri, timeRange, includeDeleted);
          files.push(...folderFiles);
        }
        const summary = this.createSummary(files);
        return {
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          workspace: workspaceFolders.map((f) => f.uri.fsPath),
          timeRange,
          files,
          summary
        };
      }
      async scanWorkspaceFolder(folderUri, timeRange, includeDeleted) {
        const files = [];
        const config = vscode2.workspace.getConfiguration("explorerDates");
        const excludePatterns = config.get("excludePatterns", []);
        try {
          const entries = await vscode2.workspace.fs.readDirectory(folderUri);
          for (const [name, type] of entries) {
            const fileUri = vscode2.Uri.joinPath(folderUri, name);
            const relativePath = vscode2.workspace.asRelativePath(fileUri);
            if (this.isExcluded(relativePath, excludePatterns)) {
              continue;
            }
            if (type === vscode2.FileType.File) {
              const fileData = await this.getFileData(fileUri, timeRange);
              if (fileData) {
                files.push(fileData);
              }
            } else if (type === vscode2.FileType.Directory) {
              const subFiles = await this.scanWorkspaceFolder(fileUri, timeRange, includeDeleted);
              files.push(...subFiles);
            }
          }
          if (includeDeleted) {
            const deletedFiles = this.getDeletedFiles(folderUri.fsPath, timeRange);
            files.push(...deletedFiles);
          }
        } catch (error) {
          logger2.error(`Failed to scan folder ${folderUri.fsPath}:`, error);
        }
        return files;
      }
      async getFileData(uri, timeRange) {
        try {
          const stat = await vscode2.workspace.fs.stat(uri);
          const relativePath = vscode2.workspace.asRelativePath(uri);
          const activities = this.fileActivityCache.get(uri.fsPath) || [];
          const filteredActivities = this.filterActivitiesByTimeRange(activities, timeRange);
          const fileData = {
            path: relativePath,
            fullPath: uri.fsPath,
            size: stat.size,
            created: new Date(stat.ctime),
            modified: new Date(stat.mtime),
            type: this.getFileType(relativePath),
            extension: path.extname(relativePath),
            activities: filteredActivities,
            activityCount: filteredActivities.length,
            lastActivity: filteredActivities.length > 0 ? filteredActivities[filteredActivities.length - 1].timestamp : new Date(stat.mtime)
          };
          return fileData;
        } catch (error) {
          logger2.error(`Failed to get file data for ${uri.fsPath}:`, error);
          return null;
        }
      }
      filterActivitiesByTimeRange(activities, timeRange) {
        if (timeRange === "all") {
          return activities;
        }
        const now = /* @__PURE__ */ new Date();
        let cutoff;
        switch (timeRange) {
          case "24h":
            cutoff = new Date(now - 24 * 60 * 60 * 1e3);
            break;
          case "7d":
            cutoff = new Date(now - 7 * 24 * 60 * 60 * 1e3);
            break;
          case "30d":
            cutoff = new Date(now - 30 * 24 * 60 * 60 * 1e3);
            break;
          case "90d":
            cutoff = new Date(now - 90 * 24 * 60 * 60 * 1e3);
            break;
          default:
            return activities;
        }
        return activities.filter((activity) => activity.timestamp >= cutoff);
      }
      getDeletedFiles(folderPath, timeRange) {
        const deletedFiles = [];
        for (const [filePath, activities] of this.fileActivityCache) {
          if (filePath.startsWith(folderPath)) {
            const deleteActivities = activities.filter((a) => a.action === "deleted");
            const filteredDeletes = this.filterActivitiesByTimeRange(deleteActivities, timeRange);
            if (filteredDeletes.length > 0) {
              deletedFiles.push({
                path: vscode2.workspace.asRelativePath(filePath),
                fullPath: filePath,
                size: 0,
                created: null,
                modified: null,
                type: "deleted",
                extension: path.extname(filePath),
                activities: filteredDeletes,
                activityCount: filteredDeletes.length,
                lastActivity: filteredDeletes[filteredDeletes.length - 1].timestamp
              });
            }
          }
        }
        return deletedFiles;
      }
      createSummary(files) {
        const summary = {
          totalFiles: files.length,
          totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
          fileTypes: {},
          activityByDay: {},
          mostActiveFiles: [],
          recentlyModified: [],
          largestFiles: [],
          oldestFiles: []
        };
        files.forEach((file) => {
          const type = file.type || "unknown";
          summary.fileTypes[type] = (summary.fileTypes[type] || 0) + 1;
        });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
        files.forEach((file) => {
          file.activities.forEach((activity) => {
            if (activity.timestamp >= thirtyDaysAgo) {
              const day = activity.timestamp.toISOString().split("T")[0];
              summary.activityByDay[day] = (summary.activityByDay[day] || 0) + 1;
            }
          });
        });
        summary.mostActiveFiles = files.sort((a, b) => b.activityCount - a.activityCount).slice(0, 10).map((file) => ({
          path: file.path,
          activityCount: file.activityCount,
          lastActivity: file.lastActivity
        }));
        summary.recentlyModified = files.filter((file) => file.modified).sort((a, b) => b.modified - a.modified).slice(0, 20).map((file) => ({
          path: file.path,
          modified: file.modified,
          size: file.size
        }));
        summary.largestFiles = files.sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, 10).map((file) => ({
          path: file.path,
          size: file.size,
          modified: file.modified
        }));
        summary.oldestFiles = files.filter((file) => file.modified).sort((a, b) => a.modified - b.modified).slice(0, 10).map((file) => ({
          path: file.path,
          modified: file.modified,
          size: file.size
        }));
        return summary;
      }
      async formatReport(report, format) {
        switch (format.toLowerCase()) {
          case "json":
            return JSON.stringify(report, null, 2);
          case "csv":
            return this.formatAsCSV(report);
          case "html":
            return this.formatAsHTML(report);
          case "markdown":
            return this.formatAsMarkdown(report);
          default:
            throw new Error(`Unsupported format: ${format}`);
        }
      }
      formatAsCSV(report) {
        const lines = [
          "Path,Size,Created,Modified,Type,Extension,ActivityCount,LastActivity"
        ];
        report.files.forEach((file) => {
          lines.push([
            file.path,
            file.size || 0,
            file.created ? file.created.toISOString() : "",
            file.modified ? file.modified.toISOString() : "",
            file.type,
            file.extension,
            file.activityCount,
            file.lastActivity ? file.lastActivity.toISOString() : ""
          ].join(","));
        });
        return lines.join("\n");
      }
      formatAsHTML(report) {
        return `<!DOCTYPE html>
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
        ${Object.entries(report.summary.fileTypes).map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`).join("")}
    </table>
    
    <h2>Most Active Files</h2>
    <table>
        <tr><th>Path</th><th>Activity Count</th><th>Last Activity</th></tr>
        ${report.summary.mostActiveFiles.map((file) => `<tr><td>${file.path}</td><td>${file.activityCount}</td><td>${new Date(file.lastActivity).toLocaleString()}</td></tr>`).join("")}
    </table>
    
    <h2>All Files</h2>
    <table>
        <tr><th>Path</th><th>Size</th><th>Modified</th><th>Type</th><th>Activity Count</th></tr>
        ${report.files.map((file) => `<tr>
                <td>${file.path}</td>
                <td>${this.formatFileSize(file.size || 0)}</td>
                <td>${file.modified ? new Date(file.modified).toLocaleString() : "N/A"}</td>
                <td>${file.type}</td>
                <td>${file.activityCount}</td>
            </tr>`).join("")}
    </table>
</body>
</html>`;
      }
      formatAsMarkdown(report) {
        return `# File Modification Report

**Generated:** ${new Date(report.generatedAt).toLocaleString()}
**Time Range:** ${report.timeRange}

## Summary

- **Total Files:** ${report.summary.totalFiles}
- **Total Size:** ${this.formatFileSize(report.summary.totalSize)}

## File Types

| Type | Count |
|------|-------|
${Object.entries(report.summary.fileTypes).map(([type, count]) => `| ${type} | ${count} |`).join("\n")}

## Most Active Files

| Path | Activity Count | Last Activity |
|------|----------------|---------------|
${report.summary.mostActiveFiles.map((file) => `| ${file.path} | ${file.activityCount} | ${new Date(file.lastActivity).toLocaleString()} |`).join("\n")}

## Recently Modified Files

| Path | Modified | Size |
|------|----------|------|
${report.summary.recentlyModified.map((file) => `| ${file.path} | ${new Date(file.modified).toLocaleString()} | ${this.formatFileSize(file.size)} |`).join("\n")}

## All Files

| Path | Size | Modified | Type | Activities |
|------|------|----------|------|------------|
${report.files.map((file) => `| ${file.path} | ${this.formatFileSize(file.size || 0)} | ${file.modified ? new Date(file.modified).toLocaleString() : "N/A"} | ${file.type} | ${file.activityCount} |`).join("\n")}
`;
      }
      async saveReport(content, outputPath) {
        try {
          await fs.writeFile(outputPath, content, "utf8");
          logger2.info(`Report saved to ${outputPath}`);
        } catch (error) {
          logger2.error("Failed to save report:", error);
          throw error;
        }
      }
      async exportToTimeTrackingTools(options = {}) {
        try {
          const { tool = "generic", timeRange = "7d" } = options;
          const report = await this.collectFileData(timeRange, false);
          const timeTrackingData = this.formatForTimeTracking(report, tool);
          return timeTrackingData;
        } catch (error) {
          logger2.error("Failed to export to time tracking tools:", error);
          return null;
        }
      }
      formatForTimeTracking(report, tool) {
        const sessions = [];
        report.files.forEach((file) => {
          file.activities.forEach((activity) => {
            sessions.push({
              file: file.path,
              action: activity.action,
              timestamp: activity.timestamp,
              duration: this.estimateSessionDuration(activity),
              project: this.extractProjectName(file.path)
            });
          });
        });
        switch (tool) {
          case "toggl":
            return this.formatForToggl(sessions);
          case "clockify":
            return this.formatForClockify(sessions);
          case "generic":
          default:
            return sessions;
        }
      }
      formatForToggl(sessions) {
        return sessions.map((session) => ({
          description: `${session.action}: ${session.file}`,
          start: session.timestamp.toISOString(),
          duration: session.duration * 60,
          // Toggl expects seconds
          project: session.project,
          tags: [session.action, this.getFileType(session.file)]
        }));
      }
      formatForClockify(sessions) {
        return sessions.map((session) => ({
          description: `${session.action}: ${session.file}`,
          start: session.timestamp.toISOString(),
          end: new Date(session.timestamp.getTime() + session.duration * 60 * 1e3).toISOString(),
          project: session.project,
          tags: [session.action, this.getFileType(session.file)]
        }));
      }
      estimateSessionDuration(activity) {
        switch (activity.action) {
          case "created":
            return 15;
          // 15 minutes for file creation
          case "modified":
            return 5;
          // 5 minutes for modification
          case "deleted":
            return 1;
          // 1 minute for deletion
          default:
            return 5;
        }
      }
      extractProjectName(filePath) {
        const parts = filePath.split(path.sep);
        return parts[0] || "Unknown Project";
      }
      getFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const typeMap = {
          ".js": "javascript",
          ".ts": "typescript",
          ".py": "python",
          ".java": "java",
          ".cpp": "cpp",
          ".html": "html",
          ".css": "css",
          ".md": "markdown",
          ".json": "json",
          ".xml": "xml",
          ".txt": "text"
        };
        return typeMap[ext] || "other";
      }
      isExcluded(filePath, excludePatterns) {
        return excludePatterns.some((pattern) => {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          return regex.test(filePath);
        });
      }
      formatFileSize(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
      }
      async showReportDialog() {
        try {
          const options = {
            "\u{1F4CA} Generate Full Report": "full",
            "\u{1F4C5} Last 24 Hours": "24h",
            "\u{1F4C5} Last 7 Days": "7d",
            "\u{1F4C5} Last 30 Days": "30d",
            "\u{1F4C5} Last 90 Days": "90d"
          };
          const selected = await vscode2.window.showQuickPick(
            Object.keys(options),
            { placeHolder: "Select report time range" }
          );
          if (!selected) return;
          const timeRange = options[selected];
          const formatOptions = ["JSON", "CSV", "HTML", "Markdown"];
          const format = await vscode2.window.showQuickPick(
            formatOptions,
            { placeHolder: "Select report format" }
          );
          if (!format) return;
          const result = await vscode2.window.showSaveDialog({
            defaultUri: vscode2.Uri.file(`file-report.${format.toLowerCase()}`),
            filters: {
              [format]: [format.toLowerCase()]
            }
          });
          if (!result) return;
          await this.generateFileModificationReport({
            format: format.toLowerCase(),
            timeRange,
            outputPath: result.fsPath
          });
        } catch (error) {
          logger2.error("Failed to show report dialog:", error);
          vscode2.window.showErrorMessage("Failed to generate report");
        }
      }
    };
    module2.exports = { ExportReportingManager: ExportReportingManager2 };
  }
});

// src/decorationDiagnostics.js
var require_decorationDiagnostics = __commonJS({
  "src/decorationDiagnostics.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var path = require("path");
    var fs = require("fs").promises;
    var { getLogger: getLogger2 } = require_logger();
    var DecorationDiagnostics = class {
      constructor(decorationProvider) {
        this._logger = getLogger2();
        this._provider = decorationProvider;
        this._testResults = [];
      }
      /**
       * Run comprehensive decoration diagnostics
       */
      async runComprehensiveDiagnostics() {
        this._logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");
        const results = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          vscodeVersion: vscode2.version,
          extensionVersion: vscode2.extensions.getExtension("incredincomp.explorer-dates")?.packageJSON?.version,
          tests: {}
        };
        results.tests.vscodeSettings = await this._testVSCodeSettings();
        results.tests.providerRegistration = await this._testProviderRegistration();
        results.tests.fileProcessing = await this._testFileProcessing();
        results.tests.decorationCreation = await this._testDecorationCreation();
        results.tests.cacheAnalysis = await this._testCacheAnalysis();
        results.tests.extensionConflicts = await this._testExtensionConflicts();
        results.tests.uriPathIssues = await this._testURIPathIssues();
        this._logger.info("\u{1F50D} Comprehensive diagnostics completed", results);
        return results;
      }
      /**
       * Test VS Code settings that affect file decorations
       */
      async _testVSCodeSettings() {
        const explorerConfig = vscode2.workspace.getConfiguration("explorer");
        const workbenchConfig = vscode2.workspace.getConfiguration("workbench");
        const explorerDatesConfig = vscode2.workspace.getConfiguration("explorerDates");
        const settings = {
          "explorer.decorations.badges": explorerConfig.get("decorations.badges"),
          "explorer.decorations.colors": explorerConfig.get("decorations.colors"),
          "workbench.colorTheme": workbenchConfig.get("colorTheme"),
          "explorerDates.showDateDecorations": explorerDatesConfig.get("showDateDecorations"),
          "explorerDates.colorScheme": explorerDatesConfig.get("colorScheme"),
          "explorerDates.showGitInfo": explorerDatesConfig.get("showGitInfo")
        };
        const issues = [];
        if (settings["explorer.decorations.badges"] === false) {
          issues.push("CRITICAL: explorer.decorations.badges is disabled");
        }
        if (settings["explorer.decorations.colors"] === false) {
          issues.push("WARNING: explorer.decorations.colors is disabled");
        }
        if (settings["explorerDates.showDateDecorations"] === false) {
          issues.push("CRITICAL: explorerDates.showDateDecorations is disabled");
        }
        return {
          status: issues.length > 0 ? "ISSUES_FOUND" : "OK",
          settings,
          issues
        };
      }
      /**
       * Test provider registration status
       */
      async _testProviderRegistration() {
        const issues = [];
        if (!this._provider) {
          issues.push("CRITICAL: Decoration provider is null/undefined");
          return { status: "FAILED", issues };
        }
        if (typeof this._provider.provideFileDecoration !== "function") {
          issues.push("CRITICAL: provideFileDecoration method missing");
        }
        if (!this._provider.onDidChangeFileDecorations) {
          issues.push("WARNING: onDidChangeFileDecorations event emitter missing");
        }
        const testUri = vscode2.Uri.file("/test/path");
        try {
          const testResult = await this._provider.provideFileDecoration(testUri);
          this._logger.debug("Provider test call completed", { result: !!testResult });
        } catch (error) {
          issues.push(`ERROR: Provider test call failed: ${error.message}`);
        }
        return {
          status: issues.length > 0 ? "ISSUES_FOUND" : "OK",
          providerActive: !!this._provider,
          issues
        };
      }
      /**
       * Test file processing for workspace files
       */
      async _testFileProcessing() {
        const workspaceFolders = vscode2.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          return { status: "NO_WORKSPACE", issues: ["No workspace folders available"] };
        }
        const testFiles = [];
        const issues = [];
        try {
          const commonFiles = ["package.json", "README.md", "extension.js", "src/logger.js"];
          for (const fileName of commonFiles) {
            const fileUri = vscode2.Uri.joinPath(workspaceFolders[0].uri, fileName);
            try {
              await fs.access(fileUri.fsPath);
              const isExcluded = this._provider._isExcludedSimple ? await this._provider._isExcludedSimple(fileUri) : false;
              const decoration = await this._provider.provideFileDecoration(fileUri);
              testFiles.push({
                file: fileName,
                exists: true,
                excluded: isExcluded,
                hasDecoration: !!decoration,
                badge: decoration?.badge,
                uri: fileUri.toString()
              });
            } catch (fileError) {
              testFiles.push({
                file: fileName,
                exists: false,
                error: fileError.message
              });
            }
          }
        } catch (error) {
          issues.push(`File processing test failed: ${error.message}`);
        }
        return {
          status: issues.length > 0 ? "ISSUES_FOUND" : "OK",
          testFiles,
          issues
        };
      }
      /**
       * Test decoration creation with various inputs
       */
      async _testDecorationCreation() {
        const tests = [];
        const issues = [];
        try {
          const simpleDecoration = new vscode2.FileDecoration("test");
          tests.push({ name: "Simple decoration", success: true, badge: simpleDecoration.badge });
        } catch (error) {
          tests.push({ name: "Simple decoration", success: false, error: error.message });
          issues.push("CRITICAL: Cannot create simple FileDecoration");
        }
        try {
          const tooltipDecoration = new vscode2.FileDecoration("test", "Test tooltip");
          tests.push({ name: "Decoration with tooltip", success: true, hasTooltip: !!(tooltipDecoration && tooltipDecoration.tooltip) });
        } catch (error) {
          tests.push({ name: "Decoration with tooltip", success: false, error: error.message });
          issues.push("WARNING: Cannot create FileDecoration with tooltip");
        }
        try {
          const colorDecoration = new vscode2.FileDecoration("test", "Test tooltip", new vscode2.ThemeColor("charts.red"));
          tests.push({ name: "Decoration with color", success: true, hasColor: !!colorDecoration.color });
        } catch (error) {
          tests.push({ name: "Decoration with color", success: false, error: error.message });
          issues.push("WARNING: Cannot create FileDecoration with color");
        }
        const badgeTests = ["1d", "10m", "2h", "!!", "\u25CF\u25CF", "JA12", "123456789"];
        for (const badge of badgeTests) {
          try {
            const badgeDecoration = new vscode2.FileDecoration(badge);
            tests.push({
              name: `Badge format: ${badge}`,
              success: true,
              badge: badgeDecoration.badge,
              length: badge.length
            });
          } catch (error) {
            tests.push({ name: `Badge format: ${badge}`, success: false, error: error.message });
            if (badge.length <= 8) {
              issues.push(`WARNING: Valid badge format '${badge}' failed`);
            }
          }
        }
        return {
          status: issues.length > 0 ? "ISSUES_FOUND" : "OK",
          tests,
          issues
        };
      }
      /**
       * Test cache analysis
       */
      async _testCacheAnalysis() {
        const cacheInfo = {
          memoryCache: {
            size: this._provider._decorationCache?.size || 0,
            maxSize: this._provider._maxCacheSize || 0
          },
          advancedCache: {
            available: !!this._provider._advancedCache,
            initialized: false
          },
          metrics: this._provider.getMetrics ? this._provider.getMetrics() : null
        };
        const issues = [];
        if (cacheInfo.memoryCache.size > cacheInfo.memoryCache.maxSize * 0.9) {
          issues.push("WARNING: Memory cache is nearly full");
        }
        if (cacheInfo.metrics && cacheInfo.metrics.cacheHits === 0 && cacheInfo.metrics.cacheMisses > 10) {
          issues.push("WARNING: Cache hit rate is 0% - potential cache key issues");
        }
        return {
          status: issues.length > 0 ? "ISSUES_FOUND" : "OK",
          cacheInfo,
          issues
        };
      }
      /**
       * Test for potential extension conflicts
       */
      async _testExtensionConflicts() {
        const allExtensions = vscode2.extensions.all;
        const potentialConflicts = [];
        const decorationExtensions = [];
        for (const ext of allExtensions) {
          if (!ext.isActive) continue;
          const packageJson = ext.packageJSON;
          if (packageJson.contributes?.commands?.some(
            (cmd) => cmd.command?.includes("decoration") || cmd.title?.includes("decoration") || cmd.title?.includes("badge") || cmd.title?.includes("explorer")
          )) {
            decorationExtensions.push({
              id: ext.id,
              name: packageJson.displayName || packageJson.name,
              version: packageJson.version
            });
          }
          const knownConflicts = [
            "file-icons",
            "vscode-icons",
            "material-icon-theme",
            "explorer-exclude",
            "hide-files",
            "file-watcher"
          ];
          if (knownConflicts.some((conflict) => ext.id.includes(conflict))) {
            potentialConflicts.push({
              id: ext.id,
              name: packageJson.displayName || packageJson.name,
              reason: "Known to potentially interfere with file decorations"
            });
          }
        }
        const issues = [];
        if (decorationExtensions.length > 1) {
          issues.push(`WARNING: ${decorationExtensions.length} extensions might provide file decorations`);
        }
        if (potentialConflicts.length > 0) {
          issues.push(`WARNING: ${potentialConflicts.length} potentially conflicting extensions detected`);
        }
        return {
          status: issues.length > 0 ? "ISSUES_FOUND" : "OK",
          decorationExtensions,
          potentialConflicts,
          issues
        };
      }
      /**
       * Test URI and path issues
       */
      async _testURIPathIssues() {
        const workspaceFolders = vscode2.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          return { status: "NO_WORKSPACE", issues: ["No workspace available for URI testing"] };
        }
        const tests = [];
        const issues = [];
        const testPaths = [
          "package.json",
          "src/logger.js",
          "README.md",
          ".gitignore"
        ];
        for (const testPath of testPaths) {
          const fileUri = vscode2.Uri.joinPath(workspaceFolders[0].uri, testPath);
          tests.push({
            path: testPath,
            scheme: fileUri.scheme,
            fsPath: fileUri.fsPath,
            authority: fileUri.authority,
            valid: fileUri.scheme === "file" && fileUri.fsPath.length > 0
          });
          if (fileUri.scheme !== "file") {
            issues.push(`WARNING: Non-file URI scheme for ${testPath}: ${fileUri.scheme}`);
          }
          if (fileUri.fsPath.includes("\\\\") || fileUri.fsPath.includes("//")) {
            issues.push(`WARNING: Potential path separator issues in ${testPath}`);
          }
        }
        return {
          status: issues.length > 0 ? "ISSUES_FOUND" : "OK",
          tests,
          issues
        };
      }
    };
    module2.exports = { DecorationDiagnostics };
  }
});

// src/decorationTester.js
var require_decorationTester = __commonJS({
  "src/decorationTester.js"(exports2, module2) {
    var vscode2 = require("vscode");
    async function testVSCodeDecorationRendering() {
      const logger2 = require_logger().getLogger();
      logger2.info("\u{1F3A8} Testing VS Code decoration rendering...");
      class TestDecorationProvider {
        constructor() {
          this._onDidChangeFileDecorations = new vscode2.EventEmitter();
          this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        }
        provideFileDecoration(uri) {
          const fileName = require("path").basename(uri.fsPath);
          const decoration = new vscode2.FileDecoration("TEST");
          decoration.tooltip = `Test decoration for ${fileName}`;
          decoration.color = new vscode2.ThemeColor("charts.red");
          logger2.info(`\u{1F9EA} Test provider returning decoration for: ${fileName}`);
          console.log(`\u{1F9EA} TEST DECORATION: ${fileName} \u2192 "TEST"`);
          return decoration;
        }
      }
      const testProvider = new TestDecorationProvider();
      const disposable = vscode2.window.registerFileDecorationProvider(testProvider);
      logger2.info("\u{1F9EA} Test decoration provider registered");
      setTimeout(() => {
        testProvider._onDidChangeFileDecorations.fire(void 0);
        logger2.info("\u{1F504} Test decoration refresh triggered");
        setTimeout(() => {
          disposable.dispose();
          logger2.info("\u{1F9EA} Test decoration provider disposed");
        }, 1e4);
      }, 1e3);
      return "Test decoration provider registered for 10 seconds";
    }
    async function testFileDecorationAPI() {
      const logger2 = require_logger().getLogger();
      logger2.info("\u{1F527} Testing FileDecoration API...");
      const tests = [];
      try {
        const minimal = new vscode2.FileDecoration("MIN");
        tests.push({ name: "Minimal decoration", success: true, badge: minimal.badge });
        logger2.info("\u2705 Minimal decoration created successfully");
      } catch (error) {
        tests.push({ name: "Minimal decoration", success: false, error: error.message });
        logger2.error("\u274C Minimal decoration failed:", error);
      }
      try {
        const full = new vscode2.FileDecoration("FULL", "Full decoration tooltip", new vscode2.ThemeColor("charts.blue"));
        full.propagate = false;
        tests.push({
          name: "Full decoration",
          success: true,
          badge: full.badge,
          hasTooltip: !!full.tooltip,
          hasColor: !!full.color,
          propagate: full.propagate
        });
        logger2.info("\u2705 Full decoration created successfully");
      } catch (error) {
        tests.push({ name: "Full decoration", success: false, error: error.message });
        logger2.error("\u274C Full decoration failed:", error);
      }
      const themeColors = [
        "charts.red",
        "charts.blue",
        "charts.green",
        "charts.yellow",
        "terminal.ansiRed",
        "terminal.ansiGreen",
        "terminal.ansiBlue",
        "editorError.foreground",
        "editorWarning.foreground",
        "editorInfo.foreground"
      ];
      for (const colorName of themeColors) {
        try {
          tests.push({
            name: `ThemeColor: ${colorName}`,
            success: true,
            colorId: colorName
          });
        } catch (error) {
          tests.push({
            name: `ThemeColor: ${colorName}`,
            success: false,
            error: error.message
          });
          logger2.error(`\u274C ThemeColor ${colorName} failed:`, error);
        }
      }
      return tests;
    }
    module2.exports = {
      testVSCodeDecorationRendering,
      testFileDecorationAPI
    };
  }
});

// extension.js
var vscode = require("vscode");
var { FileDateDecorationProvider } = require_fileDateDecorationProvider();
var { getLogger } = require_logger();
var { getLocalization } = require_localization();
var { OnboardingManager } = require_onboarding();
var { WorkspaceTemplatesManager } = require_workspaceTemplates();
var { ExtensionApiManager } = require_extensionApi();
var { ExportReportingManager } = require_exportReporting();
var fileDateProvider;
var logger;
var l10n;
function getApiInformationHtml(api) {
  return `<!DOCTYPE html>
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
    </html>`;
}
function generateWorkspaceActivityHTML(files) {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };
  const fileRows = files.map((file) => `
        <tr>
            <td>${file.path}</td>
            <td>${file.modified.toLocaleString()}</td>
            <td>${formatFileSize(file.size)}</td>
        </tr>
    `).join("");
  return `
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
                    <strong>Most Recent:</strong> ${files.length > 0 ? files[0].modified.toLocaleString() : "N/A"}
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
    `;
}
function generateDiagnosticsHTML(diagnostics) {
  const sections = Object.entries(diagnostics).map(([title, data]) => {
    const rows = Object.entries(data).map(([key, value]) => {
      const displayValue = Array.isArray(value) ? value.join(", ") || "None" : value?.toString() || "N/A";
      return `
                <tr>
                    <td><strong>${key}:</strong></td>
                    <td>${displayValue}</td>
                </tr>
            `;
    }).join("");
    return `
            <div class="diagnostic-section">
                <h3>\u{1F50D} ${title}</h3>
                <table>
                    ${rows}
                </table>
            </div>
        `;
  }).join("");
  return `
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
            
            ${sections}
            
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
    `;
}
function generateDiagnosticsWebview(results) {
  return `<!DOCTYPE html>
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

        ${Object.entries(results.tests).map(([testName, testResult]) => {
    const statusClass = testResult.status === "OK" ? "test-ok" : testResult.status === "ISSUES_FOUND" ? "test-warning" : "test-error";
    const statusColor = testResult.status === "OK" ? "status-ok" : testResult.status === "ISSUES_FOUND" ? "status-warning" : "status-error";
    return `
            <div class="test-section ${statusClass}">
                <h2>\u{1F9EA} ${testName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</h2>
                <p class="${statusColor}">Status: ${testResult.status}</p>
                
                ${testResult.issues && testResult.issues.length > 0 ? `
                    <h3>Issues Found:</h3>
                    ${testResult.issues.map((issue) => {
      const issueClass = issue.startsWith("CRITICAL:") ? "issue-critical" : "issue-warning";
      return `<div class="${issueClass}">\u26A0\uFE0F ${issue}</div>`;
    }).join("")}
                ` : ""}
                
                ${testResult.settings ? `
                    <h3>Settings:</h3>
                    <pre>${JSON.stringify(testResult.settings, null, 2)}</pre>
                ` : ""}
                
                ${testResult.testFiles ? `
                    <h3>File Tests:</h3>
                    ${testResult.testFiles.map((file) => `
                        <div class="file-test">
                            \u{1F4C4} ${file.file}: 
                            ${file.exists ? "\u2705" : "\u274C"} exists | 
                            ${file.excluded ? "\u{1F6AB}" : "\u2705"} ${file.excluded ? "excluded" : "included"} | 
                            ${file.hasDecoration ? "\u{1F3F7}\uFE0F" : "\u274C"} ${file.hasDecoration ? `badge: ${file.badge}` : "no decoration"}
                        </div>
                    `).join("")}
                ` : ""}
                
                ${testResult.tests ? `
                    <h3>Test Results:</h3>
                    ${testResult.tests.map((test) => `
                        <div class="badge-test">
                            ${test.success ? "\u2705" : "\u274C"} ${test.name}
                            ${test.badge ? ` \u2192 "${test.badge}"` : ""}
                            ${test.error ? ` (${test.error})` : ""}
                        </div>
                    `).join("")}
                ` : ""}
                
                ${testResult.cacheInfo ? `
                    <h3>Cache Information:</h3>
                    <pre>${JSON.stringify(testResult.cacheInfo, null, 2)}</pre>
                ` : ""}
                
                ${testResult.decorationExtensions && testResult.decorationExtensions.length > 0 ? `
                    <h3>Other Decoration Extensions:</h3>
                    ${testResult.decorationExtensions.map((ext) => `
                        <div class="file-test">\u{1F50C} ${ext.name} (${ext.id})</div>
                    `).join("")}
                ` : ""}
            </div>`;
  }).join("")}
        
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
            <pre>${JSON.stringify(results, null, 2)}</pre>
        </div>
    </body>
    </html>`;
}
function generatePerformanceAnalyticsHTML(metrics) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  return `
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
                    <div class="metric-value">${metrics.totalDecorations || 0}</div>
                    <div class="metric-label">Total Decorations</div>
                    <div class="metric-value">${metrics.cacheHitRate || "0%"}</div>
                    <div class="metric-label">Cache Hit Rate</div>
                </div>
                
                ${metrics.advancedCache ? `
                <div class="metric-card">
                    <div class="metric-title">\u{1F9E0} Advanced Cache</div>
                    <div class="metric-value">${metrics.advancedCache.memoryItems || 0}</div>
                    <div class="metric-label">Memory Items</div>
                    <div class="metric-value">${formatBytes(metrics.advancedCache.memoryUsage || 0)}</div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${metrics.advancedCache.memoryUsagePercent || 0}%"></div>
                    </div>
                    <div class="metric-label">${metrics.advancedCache.memoryUsagePercent || "0.00"}% of limit</div>
                    <div class="metric-value">${metrics.advancedCache.memoryHitRate || "0%"}</div>
                    <div class="metric-label">Memory Hit Rate</div>
                    <div class="metric-value">${metrics.advancedCache.diskHitRate || "0%"}</div>
                    <div class="metric-label">Disk Hit Rate</div>
                </div>
                ` : `
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
                
                ${metrics.batchProcessor ? `
                <div class="metric-card">
                    <div class="metric-title">\u26A1 Batch Processor</div>
                    <div class="metric-value">${metrics.batchProcessor.totalBatches}</div>
                    <div class="metric-label">Total Batches Processed</div>
                    <div class="metric-value">${metrics.batchProcessor.averageBatchTime.toFixed(2)}ms</div>
                    <div class="metric-label">Average Batch Time</div>
                    <div class="metric-value">${metrics.batchProcessor.isProcessing ? "Active" : "Idle"}</div>
                    <div class="metric-label">Current Status</div>
                </div>
                ` : ""}
                
                <div class="metric-card">
                    <div class="metric-title">\u{1F4C8} Performance</div>
                    <div class="metric-value">${metrics.cacheHits || 0}</div>
                    <div class="metric-label">Cache Hits</div>
                    <div class="metric-value">${metrics.cacheMisses || 0}</div>
                    <div class="metric-label">Cache Misses</div>
                    <div class="metric-value">${metrics.errors || 0}</div>
                    <div class="metric-label">Errors</div>
                </div>
            </div>
        </body>
        </html>
    `;
}
function initializeStatusBar(context) {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "explorerDates.showFileDetails";
  statusBarItem.tooltip = "Click to show detailed file information";
  const updateStatusBar = async () => {
    try {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        statusBarItem.hide();
        return;
      }
      const uri = activeEditor.document.uri;
      if (uri.scheme !== "file") {
        statusBarItem.hide();
        return;
      }
      const fs = require("fs").promises;
      const stat = await fs.stat(uri.fsPath);
      const timeAgo = fileDateProvider._formatDateBadge(stat.mtime, "smart");
      const fileSize = fileDateProvider._formatFileSize(stat.size, "auto");
      statusBarItem.text = `$(clock) ${timeAgo} $(file) ${fileSize}`;
      statusBarItem.show();
    } catch (error) {
      statusBarItem.hide();
      logger.debug("Failed to update status bar", error);
    }
  };
  vscode.window.onDidChangeActiveTextEditor(updateStatusBar);
  vscode.window.onDidChangeTextEditorSelection(updateStatusBar);
  updateStatusBar();
  context.subscriptions.push(statusBarItem);
  return statusBarItem;
}
async function activate(context) {
  try {
    logger = getLogger();
    l10n = getLocalization();
    logger.info("Explorer Dates: Extension activated");
    fileDateProvider = new FileDateDecorationProvider();
    const decorationDisposable = vscode.window.registerFileDecorationProvider(fileDateProvider);
    context.subscriptions.push(decorationDisposable);
    context.subscriptions.push(fileDateProvider);
    context.subscriptions.push(logger);
    await fileDateProvider.initializeAdvancedSystems(context);
    const onboardingManager = new OnboardingManager(context);
    const workspaceTemplatesManager = new WorkspaceTemplatesManager();
    const extensionApiManager = new ExtensionApiManager();
    const exportReportingManager = new ExportReportingManager();
    const api = extensionApiManager.getApi();
    context.exports = api;
    const onboardingConfig = vscode.workspace.getConfiguration("explorerDates");
    if (onboardingConfig.get("showWelcomeOnStartup", true) && await onboardingManager.shouldShowOnboarding()) {
      setTimeout(() => {
        onboardingManager.showWelcomeMessage();
      }, 5e3);
    }
    const refreshDecorations = vscode.commands.registerCommand("explorerDates.refreshDateDecorations", () => {
      try {
        if (fileDateProvider) {
          fileDateProvider.clearAllCaches();
          fileDateProvider.refreshAll();
          const message = l10n.getString("refreshSuccess") || "Date decorations refreshed - all caches cleared";
          vscode.window.showInformationMessage(message);
          logger.info("Date decorations refreshed manually with cache clear");
        }
      } catch (error) {
        logger.error("Failed to refresh decorations", error);
        vscode.window.showErrorMessage(`Failed to refresh decorations: ${error.message}`);
      }
    });
    context.subscriptions.push(refreshDecorations);
    const previewConfiguration = vscode.commands.registerCommand("explorerDates.previewConfiguration", (settings) => {
      try {
        if (fileDateProvider) {
          fileDateProvider.applyPreviewSettings(settings);
          logger.info("Configuration preview applied", settings);
        }
      } catch (error) {
        logger.error("Failed to apply configuration preview", error);
      }
    });
    context.subscriptions.push(previewConfiguration);
    const clearPreview = vscode.commands.registerCommand("explorerDates.clearPreview", () => {
      try {
        if (fileDateProvider) {
          fileDateProvider.applyPreviewSettings(null);
          logger.info("Configuration preview cleared");
        }
      } catch (error) {
        logger.error("Failed to clear configuration preview", error);
      }
    });
    context.subscriptions.push(clearPreview);
    const showMetrics = vscode.commands.registerCommand("explorerDates.showMetrics", () => {
      try {
        if (fileDateProvider) {
          const metrics = fileDateProvider.getMetrics();
          let message = `Explorer Dates Metrics:
Total Decorations: ${metrics.totalDecorations}
Cache Size: ${metrics.cacheSize}
Cache Hits: ${metrics.cacheHits}
Cache Misses: ${metrics.cacheMisses}
Cache Hit Rate: ${metrics.cacheHitRate}
Errors: ${metrics.errors}`;
          if (metrics.advancedCache) {
            message += `

Advanced Cache:
Memory Items: ${metrics.advancedCache.memoryItems}
Memory Usage: ${(metrics.advancedCache.memoryUsage / 1024 / 1024).toFixed(2)} MB
Memory Hit Rate: ${metrics.advancedCache.memoryHitRate}
Disk Hit Rate: ${metrics.advancedCache.diskHitRate}
Evictions: ${metrics.advancedCache.evictions}`;
          }
          if (metrics.batchProcessor) {
            message += `

Batch Processor:
Queue Length: ${metrics.batchProcessor.queueLength}
Is Processing: ${metrics.batchProcessor.isProcessing}
Average Batch Time: ${metrics.batchProcessor.averageBatchTime.toFixed(2)}ms`;
          }
          vscode.window.showInformationMessage(message, { modal: true });
          logger.info("Metrics displayed", metrics);
        }
      } catch (error) {
        logger.error("Failed to show metrics", error);
        vscode.window.showErrorMessage(`Failed to show metrics: ${error.message}`);
      }
    });
    context.subscriptions.push(showMetrics);
    const openLogs = vscode.commands.registerCommand("explorerDates.openLogs", () => {
      try {
        logger.show();
      } catch (error) {
        logger.error("Failed to open logs", error);
        vscode.window.showErrorMessage(`Failed to open logs: ${error.message}`);
      }
    });
    context.subscriptions.push(openLogs);
    const showConfig = vscode.commands.registerCommand("explorerDates.showCurrentConfig", () => {
      try {
        const config2 = vscode.workspace.getConfiguration("explorerDates");
        const settings = {
          highContrastMode: config2.get("highContrastMode"),
          badgePriority: config2.get("badgePriority"),
          colorScheme: config2.get("colorScheme"),
          accessibilityMode: config2.get("accessibilityMode"),
          dateDecorationFormat: config2.get("dateDecorationFormat"),
          showGitInfo: config2.get("showGitInfo"),
          showFileSize: config2.get("showFileSize")
        };
        const message = `Current Explorer Dates Configuration:

${Object.entries(settings).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}`;
        vscode.window.showInformationMessage(message, { modal: true });
        logger.info("Current configuration displayed", settings);
      } catch (error) {
        logger.error("Failed to show configuration", error);
      }
    });
    context.subscriptions.push(showConfig);
    const resetSettings = vscode.commands.registerCommand("explorerDates.resetToDefaults", async () => {
      try {
        const config2 = vscode.workspace.getConfiguration("explorerDates");
        await config2.update("highContrastMode", false, vscode.ConfigurationTarget.Global);
        await config2.update("badgePriority", "time", vscode.ConfigurationTarget.Global);
        await config2.update("accessibilityMode", false, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage("Reset high contrast, badge priority, and accessibility mode to defaults. Changes should take effect immediately.");
        logger.info("Reset problematic settings to defaults");
        if (fileDateProvider) {
          fileDateProvider.clearAllCaches();
          fileDateProvider.refreshAll();
        }
      } catch (error) {
        logger.error("Failed to reset settings", error);
        vscode.window.showErrorMessage(`Failed to reset settings: ${error.message}`);
      }
    });
    context.subscriptions.push(resetSettings);
    const toggleDecorations = vscode.commands.registerCommand("explorerDates.toggleDecorations", () => {
      try {
        const config2 = vscode.workspace.getConfiguration("explorerDates");
        const currentValue = config2.get("showDateDecorations", true);
        config2.update("showDateDecorations", !currentValue, vscode.ConfigurationTarget.Global);
        const message = !currentValue ? l10n.getString("decorationsEnabled") || "Date decorations enabled" : l10n.getString("decorationsDisabled") || "Date decorations disabled";
        vscode.window.showInformationMessage(message);
        logger.info(`Date decorations toggled to: ${!currentValue}`);
      } catch (error) {
        logger.error("Failed to toggle decorations", error);
        vscode.window.showErrorMessage(`Failed to toggle decorations: ${error.message}`);
      }
    });
    context.subscriptions.push(toggleDecorations);
    const copyFileDate = vscode.commands.registerCommand("explorerDates.copyFileDate", async (uri) => {
      try {
        if (!uri && vscode.window.activeTextEditor) {
          uri = vscode.window.activeTextEditor.document.uri;
        }
        if (!uri) {
          vscode.window.showWarningMessage("No file selected");
          return;
        }
        const fs = require("fs").promises;
        const stat = await fs.stat(uri.fsPath);
        const dateString = stat.mtime.toLocaleString();
        await vscode.env.clipboard.writeText(dateString);
        vscode.window.showInformationMessage(`Copied to clipboard: ${dateString}`);
        logger.info(`File date copied for: ${uri.fsPath}`);
      } catch (error) {
        logger.error("Failed to copy file date", error);
        vscode.window.showErrorMessage(`Failed to copy file date: ${error.message}`);
      }
    });
    context.subscriptions.push(copyFileDate);
    const showFileDetails = vscode.commands.registerCommand("explorerDates.showFileDetails", async (uri) => {
      try {
        if (!uri && vscode.window.activeTextEditor) {
          uri = vscode.window.activeTextEditor.document.uri;
        }
        if (!uri) {
          vscode.window.showWarningMessage("No file selected");
          return;
        }
        const fs = require("fs").promises;
        const path = require("path");
        const stat = await fs.stat(uri.fsPath);
        const fileName = path.basename(uri.fsPath);
        const fileSize = fileDateProvider._formatFileSize(stat.size, "auto");
        const modified = stat.mtime.toLocaleString();
        const created = stat.birthtime.toLocaleString();
        const details = `File: ${fileName}
Size: ${fileSize}
Modified: ${modified}
Created: ${created}
Path: ${uri.fsPath}`;
        vscode.window.showInformationMessage(details, { modal: true });
        logger.info(`File details shown for: ${uri.fsPath}`);
      } catch (error) {
        logger.error("Failed to show file details", error);
        vscode.window.showErrorMessage(`Failed to show file details: ${error.message}`);
      }
    });
    context.subscriptions.push(showFileDetails);
    const toggleFadeOldFiles = vscode.commands.registerCommand("explorerDates.toggleFadeOldFiles", () => {
      try {
        const config2 = vscode.workspace.getConfiguration("explorerDates");
        const currentValue = config2.get("fadeOldFiles", false);
        config2.update("fadeOldFiles", !currentValue, vscode.ConfigurationTarget.Global);
        const message = !currentValue ? "Fade old files enabled" : "Fade old files disabled";
        vscode.window.showInformationMessage(message);
        logger.info(`Fade old files toggled to: ${!currentValue}`);
      } catch (error) {
        logger.error("Failed to toggle fade old files", error);
        vscode.window.showErrorMessage(`Failed to toggle fade old files: ${error.message}`);
      }
    });
    context.subscriptions.push(toggleFadeOldFiles);
    const showFileHistory = vscode.commands.registerCommand("explorerDates.showFileHistory", async (uri) => {
      try {
        if (!uri && vscode.window.activeTextEditor) {
          uri = vscode.window.activeTextEditor.document.uri;
        }
        if (!uri) {
          vscode.window.showWarningMessage("No file selected");
          return;
        }
        const { exec } = require("child_process");
        const path = require("path");
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
          vscode.window.showWarningMessage("File is not in a workspace");
          return;
        }
        const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
        const command = `git log --oneline -10 -- "${relativePath}"`;
        exec(command, { cwd: workspaceFolder.uri.fsPath }, (error, stdout) => {
          if (error) {
            if (error.message.includes("not a git repository")) {
              vscode.window.showWarningMessage("This file is not in a Git repository");
            } else {
              vscode.window.showErrorMessage(`Git error: ${error.message}`);
            }
            return;
          }
          if (!stdout.trim()) {
            vscode.window.showInformationMessage("No Git history found for this file");
            return;
          }
          const history = stdout.trim();
          const fileName = path.basename(uri.fsPath);
          vscode.window.showInformationMessage(
            `Recent commits for ${fileName}:

${history}`,
            { modal: true }
          );
        });
        logger.info(`File history requested for: ${uri.fsPath}`);
      } catch (error) {
        logger.error("Failed to show file history", error);
        vscode.window.showErrorMessage(`Failed to show file history: ${error.message}`);
      }
    });
    context.subscriptions.push(showFileHistory);
    const compareWithPrevious = vscode.commands.registerCommand("explorerDates.compareWithPrevious", async (uri) => {
      try {
        if (!uri && vscode.window.activeTextEditor) {
          uri = vscode.window.activeTextEditor.document.uri;
        }
        if (!uri) {
          vscode.window.showWarningMessage("No file selected");
          return;
        }
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
          vscode.window.showWarningMessage("File is not in a workspace");
          return;
        }
        await vscode.commands.executeCommand("git.openChange", uri);
        logger.info(`Git diff opened for: ${uri.fsPath}`);
      } catch (error) {
        logger.error("Failed to compare with previous version", error);
        vscode.window.showErrorMessage(`Failed to compare with previous version: ${error.message}`);
      }
    });
    context.subscriptions.push(compareWithPrevious);
    const showWorkspaceActivity = vscode.commands.registerCommand("explorerDates.showWorkspaceActivity", async () => {
      try {
        const panel = vscode.window.createWebviewPanel(
          "workspaceActivity",
          "Workspace File Activity",
          vscode.ViewColumn.One,
          { enableScripts: true }
        );
        const fs = require("fs").promises;
        const path = require("path");
        const files = [];
        if (!vscode.workspace.workspaceFolders) {
          vscode.window.showWarningMessage("No workspace folder open");
          return;
        }
        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const allFiles = await vscode.workspace.findFiles("**/*", "**/node_modules/**", 100);
        for (const fileUri of allFiles) {
          try {
            const stat = await fs.stat(fileUri.fsPath);
            if (stat.isFile()) {
              files.push({
                path: path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath),
                modified: stat.mtime,
                size: stat.size
              });
            }
          } catch (err) {
          }
        }
        files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
        const html = generateWorkspaceActivityHTML(files.slice(0, 50));
        panel.webview.html = html;
        logger.info("Workspace activity panel opened");
      } catch (error) {
        logger.error("Failed to show workspace activity", error);
        vscode.window.showErrorMessage(`Failed to show workspace activity: ${error.message}`);
      }
    });
    context.subscriptions.push(showWorkspaceActivity);
    const showPerformanceAnalytics = vscode.commands.registerCommand("explorerDates.showPerformanceAnalytics", async () => {
      try {
        const panel = vscode.window.createWebviewPanel(
          "performanceAnalytics",
          "Explorer Dates Performance Analytics",
          vscode.ViewColumn.One,
          { enableScripts: true }
        );
        const metrics = fileDateProvider ? fileDateProvider.getMetrics() : {};
        panel.webview.html = generatePerformanceAnalyticsHTML(metrics);
        logger.info("Performance analytics panel opened");
      } catch (error) {
        logger.error("Failed to show performance analytics", error);
        vscode.window.showErrorMessage(`Failed to show performance analytics: ${error.message}`);
      }
    });
    context.subscriptions.push(showPerformanceAnalytics);
    const debugCache = vscode.commands.registerCommand("explorerDates.debugCache", async () => {
      try {
        if (fileDateProvider) {
          const metrics = fileDateProvider.getMetrics();
          const debugInfo = {
            "Cache Summary": {
              "Memory Cache Size": metrics.cacheSize,
              "Cache Hit Rate": metrics.cacheHitRate,
              "Total Hits": metrics.cacheHits,
              "Total Misses": metrics.cacheMisses,
              "Cache Timeout": `${metrics.cacheDebugging.cacheTimeout}ms`
            },
            "Advanced Cache": metrics.advancedCache || "Not available",
            "Sample Cache Keys": metrics.cacheDebugging.memoryCacheKeys || []
          };
          const message = JSON.stringify(debugInfo, null, 2);
          vscode.window.showInformationMessage(
            `Cache Debug Info:
${message}`,
            { modal: true }
          );
          logger.info("Cache debug info displayed", debugInfo);
        }
      } catch (error) {
        logger.error("Failed to show cache debug info", error);
        vscode.window.showErrorMessage(`Failed to show cache debug info: ${error.message}`);
      }
    });
    context.subscriptions.push(debugCache);
    const diagnostics = vscode.commands.registerCommand("explorerDates.runDiagnostics", async () => {
      try {
        const path = require("path");
        const config2 = vscode.workspace.getConfiguration("explorerDates");
        const activeEditor = vscode.window.activeTextEditor;
        const diagnosticResults = {
          "Extension Status": {
            "Provider Active": fileDateProvider ? "Yes" : "No",
            "Decorations Enabled": config2.get("showDateDecorations", true) ? "Yes" : "No",
            "VS Code Version": vscode.version,
            "Extension Version": context.extension.packageJSON.version
          }
        };
        if (activeEditor) {
          const uri = activeEditor.document.uri;
          if (uri.scheme === "file") {
            diagnosticResults["Current File"] = {
              "File Path": uri.fsPath,
              "File Extension": path.extname(uri.fsPath) || "No extension",
              "Is Excluded": fileDateProvider ? await fileDateProvider._isExcludedSimple(uri) : "Unknown"
            };
          }
        }
        diagnosticResults["Configuration"] = {
          "Excluded Folders": config2.get("excludedFolders", []),
          "Excluded Patterns": config2.get("excludedPatterns", []),
          "Color Scheme": config2.get("colorScheme", "none"),
          "Cache Timeout": config2.get("cacheTimeout", 3e4) + "ms"
        };
        if (fileDateProvider) {
          const metrics = fileDateProvider.getMetrics();
          diagnosticResults["Performance"] = {
            "Total Decorations": metrics.totalDecorations,
            "Cache Size": metrics.cacheSize,
            "Errors": metrics.errors
          };
        }
        const panel = vscode.window.createWebviewPanel(
          "explorerDatesDiagnostics",
          "Explorer Dates Diagnostics",
          vscode.ViewColumn.One,
          { enableScripts: true }
        );
        panel.webview.html = generateDiagnosticsHTML(diagnosticResults);
        logger.info("Diagnostics panel opened", diagnosticResults);
      } catch (error) {
        logger.error("Failed to run diagnostics", error);
        vscode.window.showErrorMessage(`Failed to run diagnostics: ${error.message}`);
      }
    });
    context.subscriptions.push(diagnostics);
    const testDecorations = vscode.commands.registerCommand("explorerDates.testDecorations", async () => {
      try {
        logger.info("\u{1F50D} Starting comprehensive decoration diagnostics...");
        const { DecorationDiagnostics } = require_decorationDiagnostics();
        const diagnostics2 = new DecorationDiagnostics(fileDateProvider);
        const results = await diagnostics2.runComprehensiveDiagnostics();
        const panel = vscode.window.createWebviewPanel(
          "decorationDiagnostics",
          "Decoration Diagnostics - Root Cause Analysis",
          vscode.ViewColumn.One,
          { enableScripts: true }
        );
        panel.webview.html = generateDiagnosticsWebview(results);
        const criticalIssues = [];
        const warnings = [];
        Object.values(results.tests).forEach((test) => {
          if (test.issues) {
            test.issues.forEach((issue) => {
              if (issue.startsWith("CRITICAL:")) {
                criticalIssues.push(issue);
              } else if (issue.startsWith("WARNING:")) {
                warnings.push(issue);
              }
            });
          }
        });
        if (criticalIssues.length > 0) {
          vscode.window.showErrorMessage(`CRITICAL ISSUES FOUND: ${criticalIssues.join(", ")}`);
        } else if (warnings.length > 0) {
          vscode.window.showWarningMessage(`Warnings found: ${warnings.length} potential issues detected. Check diagnostics panel.`);
        } else {
          vscode.window.showInformationMessage("No critical issues found. Decorations should be working properly.");
        }
        logger.info("\u{1F50D} Comprehensive diagnostics completed", results);
      } catch (error) {
        logger.error("Failed to run comprehensive diagnostics", error);
        vscode.window.showErrorMessage(`Diagnostics failed: ${error.message}`);
      }
    });
    context.subscriptions.push(testDecorations);
    const monitorDecorations = vscode.commands.registerCommand("explorerDates.monitorDecorations", async () => {
      if (fileDateProvider) {
        fileDateProvider.startProviderCallMonitoring();
        fileDateProvider.forceRefreshAllDecorations();
        setTimeout(() => {
          const stats = fileDateProvider.getProviderCallStats();
          const message = `VS Code Decoration Requests: ${stats.totalCalls} calls for ${stats.uniqueFiles} files`;
          vscode.window.showInformationMessage(message);
          logger.info("\u{1F50D} Decoration monitoring results:", stats);
        }, 5e3);
        vscode.window.showInformationMessage("Started monitoring VS Code decoration requests. Results in 5 seconds...");
      } else {
        vscode.window.showErrorMessage("Decoration provider not available");
      }
    });
    context.subscriptions.push(monitorDecorations);
    const testVSCodeRendering = vscode.commands.registerCommand("explorerDates.testVSCodeRendering", async () => {
      try {
        const { testVSCodeDecorationRendering, testFileDecorationAPI } = require_decorationTester();
        logger.info("\u{1F3A8} Testing VS Code decoration rendering system...");
        const apiTests = await testFileDecorationAPI();
        logger.info("\u{1F527} FileDecoration API tests:", apiTests);
        const renderResult = await testVSCodeDecorationRendering();
        logger.info("\u{1F3A8} Decoration rendering test:", renderResult);
        vscode.window.showInformationMessage('VS Code decoration rendering test started. Check Output panel and Explorer for "TEST" badges on files.');
      } catch (error) {
        logger.error("Failed to test VS Code rendering:", error);
        vscode.window.showErrorMessage(`VS Code rendering test failed: ${error.message}`);
      }
    });
    context.subscriptions.push(testVSCodeRendering);
    const quickFix = vscode.commands.registerCommand("explorerDates.quickFix", async () => {
      try {
        const config2 = vscode.workspace.getConfiguration("explorerDates");
        const fixes = [];
        if (!config2.get("showDateDecorations", true)) {
          fixes.push({
            issue: "Date decorations are disabled",
            fix: async () => {
              await config2.update("showDateDecorations", true, vscode.ConfigurationTarget.Global);
            },
            description: "Enable date decorations"
          });
        }
        const excludedPatterns = config2.get("excludedPatterns", []);
        if (excludedPatterns.includes("**/*")) {
          fixes.push({
            issue: "All files are excluded by pattern",
            fix: async () => {
              const newPatterns = excludedPatterns.filter((p) => p !== "**/*");
              await config2.update("excludedPatterns", newPatterns, vscode.ConfigurationTarget.Global);
            },
            description: "Remove overly broad exclusion pattern"
          });
        }
        if (fixes.length === 0) {
          vscode.window.showInformationMessage("No common issues detected. Decorations should be working.");
          return;
        }
        const items = fixes.map((fix) => ({
          label: fix.description,
          description: fix.issue,
          fix: fix.fix
        }));
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select an issue to fix automatically"
        });
        if (selected) {
          await selected.fix();
          vscode.window.showInformationMessage("Fixed! Try refreshing decorations now.");
          if (fileDateProvider) {
            fileDateProvider.clearAllCaches();
            fileDateProvider.refreshAll();
          }
        }
      } catch (error) {
        logger.error("Failed to run quick fix", error);
        vscode.window.showErrorMessage(`Failed to run quick fix: ${error.message}`);
      }
    });
    context.subscriptions.push(quickFix);
    const showKeyboardShortcuts = vscode.commands.registerCommand("explorerDates.showKeyboardShortcuts", async () => {
      try {
        if (fileDateProvider && fileDateProvider._accessibility) {
          await fileDateProvider._accessibility.showKeyboardShortcutsHelp();
        } else {
          vscode.window.showInformationMessage(
            "Keyboard shortcuts: Ctrl+Shift+D (toggle), Ctrl+Shift+C (copy date), Ctrl+Shift+I (file details), Ctrl+Shift+R (refresh), Ctrl+Shift+A (workspace activity)"
          );
        }
        logger.info("Keyboard shortcuts help shown");
      } catch (error) {
        logger.error("Failed to show keyboard shortcuts help", error);
        vscode.window.showErrorMessage(`Failed to show keyboard shortcuts help: ${error.message}`);
      }
    });
    context.subscriptions.push(showKeyboardShortcuts);
    const showFeatureTour = vscode.commands.registerCommand("explorerDates.showFeatureTour", async () => {
      try {
        await onboardingManager.showFeatureTour();
        logger.info("Feature tour opened");
      } catch (error) {
        logger.error("Failed to show feature tour", error);
        vscode.window.showErrorMessage(`Failed to show feature tour: ${error.message}`);
      }
    });
    context.subscriptions.push(showFeatureTour);
    const showQuickSetup = vscode.commands.registerCommand("explorerDates.showQuickSetup", async () => {
      try {
        await onboardingManager.showQuickSetupWizard();
        logger.info("Quick setup wizard opened");
      } catch (error) {
        logger.error("Failed to show quick setup wizard", error);
        vscode.window.showErrorMessage(`Failed to show quick setup wizard: ${error.message}`);
      }
    });
    context.subscriptions.push(showQuickSetup);
    const showWhatsNew = vscode.commands.registerCommand("explorerDates.showWhatsNew", async () => {
      try {
        const extensionVersion = context.extension.packageJSON.version;
        await onboardingManager.showWhatsNew(extensionVersion);
        logger.info("What's new panel opened");
      } catch (error) {
        logger.error("Failed to show what's new", error);
        vscode.window.showErrorMessage(`Failed to show what's new: ${error.message}`);
      }
    });
    context.subscriptions.push(showWhatsNew);
    const openTemplateManager = vscode.commands.registerCommand("explorerDates.openTemplateManager", async () => {
      try {
        await workspaceTemplatesManager.showTemplateManager();
        logger.info("Template manager opened");
      } catch (error) {
        logger.error("Failed to open template manager", error);
        vscode.window.showErrorMessage(`Failed to open template manager: ${error.message}`);
      }
    });
    context.subscriptions.push(openTemplateManager);
    const saveTemplate = vscode.commands.registerCommand("explorerDates.saveTemplate", async () => {
      try {
        const name = await vscode.window.showInputBox({
          prompt: "Enter template name",
          placeHolder: "e.g., My Project Setup"
        });
        if (name) {
          const description = await vscode.window.showInputBox({
            prompt: "Enter description (optional)",
            placeHolder: "Brief description of this template"
          }) || "";
          await workspaceTemplatesManager.saveCurrentConfiguration(name, description);
        }
        logger.info("Template saved");
      } catch (error) {
        logger.error("Failed to save template", error);
        vscode.window.showErrorMessage(`Failed to save template: ${error.message}`);
      }
    });
    context.subscriptions.push(saveTemplate);
    const generateReport = vscode.commands.registerCommand("explorerDates.generateReport", async () => {
      try {
        await exportReportingManager.showReportDialog();
        logger.info("Report generation started");
      } catch (error) {
        logger.error("Failed to generate report", error);
        vscode.window.showErrorMessage(`Failed to generate report: ${error.message}`);
      }
    });
    context.subscriptions.push(generateReport);
    const showApiInfo = vscode.commands.registerCommand("explorerDates.showApiInfo", async () => {
      try {
        const panel = vscode.window.createWebviewPanel(
          "apiInfo",
          "Explorer Dates API Information",
          vscode.ViewColumn.One,
          { enableScripts: true }
        );
        panel.webview.html = getApiInformationHtml(api);
        logger.info("API information panel opened");
      } catch (error) {
        logger.error("Failed to show API information", error);
        vscode.window.showErrorMessage(`Failed to show API information: ${error.message}`);
      }
    });
    context.subscriptions.push(showApiInfo);
    let statusBarItem;
    const config = vscode.workspace.getConfiguration("explorerDates");
    if (config.get("showStatusBar", false)) {
      statusBarItem = initializeStatusBar(context);
    }
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("explorerDates.showStatusBar")) {
        const newValue = vscode.workspace.getConfiguration("explorerDates").get("showStatusBar", false);
        if (newValue && !statusBarItem) {
          statusBarItem = initializeStatusBar(context);
        } else if (!newValue && statusBarItem) {
          statusBarItem.dispose();
          statusBarItem = null;
        }
      }
    });
    logger.info("Explorer Dates: Date decorations ready");
  } catch (error) {
    const errorMessage = `${l10n ? l10n.getString("activationError") : "Explorer Dates failed to activate"}: ${error.message}`;
    console.error("Explorer Dates: Failed to activate:", error);
    if (logger) {
      logger.error("Extension activation failed", error);
    }
    vscode.window.showErrorMessage(errorMessage);
    throw error;
  }
}
async function deactivate() {
  try {
    if (logger) {
      logger.info("Explorer Dates extension is being deactivated");
    } else {
      console.log("Explorer Dates extension is being deactivated");
    }
    if (fileDateProvider && typeof fileDateProvider.dispose === "function") {
      await fileDateProvider.dispose();
    }
    if (logger) {
      logger.info("Explorer Dates extension deactivated successfully");
    }
  } catch (error) {
    const errorMessage = "Explorer Dates: Error during deactivation";
    console.error(errorMessage, error);
    if (logger) {
      logger.error(errorMessage, error);
    }
  }
}
module.exports = {
  activate,
  deactivate
};
//# sourceMappingURL=extension.js.map
