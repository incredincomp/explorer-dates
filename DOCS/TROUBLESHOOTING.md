# 🔧 Troubleshooting Missing Date Decorations

## 🚨 **"I'm not seeing any badges on files in the explorer"**

If you're not seeing date decorations on JPG files or any other files in VS Code Explorer, here's how to fix it:

### **Quick Fix Commands** ⚡

1. **Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)**
2. **Run these commands in order:**

   - `Explorer Dates: Run Diagnostics (Fix Missing Decorations)` - **Press `Ctrl+Shift+H`**
   - `Explorer Dates: Quick Fix Common Issues`
   - `Explorer Dates: Refresh Date Decorations`

### **Manual Check - Most Common Issues** 🔍

#### **1. Check if decorations are enabled**
- Open VS Code Settings (`Ctrl+,`)
- Search for `explorer dates`
- Make sure `Show Date Decorations` is **checked ✓**

#### **2. Force show specific file types** 
For JPG, PNG, or other image files that aren't showing:
- In Settings, find `Force Show For File Types`
- Add: `[".jpg", ".jpeg", ".png", ".gif", ".pdf"]`
- This forces decorations to show even if the files would normally be excluded

#### **3. Clear exclusion patterns**
- Check `Excluded Patterns` setting
- Remove any overly broad patterns like `**/*` 
- Default safe patterns: `["**/*.tmp", "**/*.log", "**/.git/**", "**/node_modules/**"]`

#### **4. Enable troubleshooting mode**
- Turn on `Enable Troubleshooting Mode` in settings
- Check the Output panel → "Explorer Dates" to see what's happening

### **Step-by-Step Visual Guide** 📋

**For JPG files specifically:**

1. **Open Settings** → Search "explorer dates"
2. **Find "Force Show For File Types"**
3. **Add these extensions:**
   ```json
   [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"]
   ```
4. **Save and run:** `Explorer Dates: Refresh Date Decorations`

### **Advanced Diagnostics** 🛠️

If the above doesn't work:

1. **Run:** `Explorer Dates: Run Diagnostics` (`Ctrl+Shift+H`)
2. **Check the diagnostic report for:**
   - Extension Status: "Provider Active" should be "Yes"
   - Current File: "Is Excluded" should be "No" or "false"
   - Configuration issues

3. **Try the debug cache command:** `Explorer Dates: Debug Cache Performance` (`Ctrl+Shift+M`)

### **Platform-Specific Issues** 💻

**Windows 10/11:**
- Make sure VS Code has file system permissions
- Try running VS Code as administrator once to test

**VS Code Version 1.105.1:**
- This version is supported
- Try restarting VS Code completely
- Check if other extensions are interfering

### **Common Exclusion Patterns That Break Things** ⚠️

These patterns will hide ALL files - remove them:
- `**/*` (excludes everything)
- `*.*` (excludes all files with extensions)
- `**/*.jpg` (excludes all JPG files)

### **Quick Settings Template** 📝

Copy this into your VS Code `settings.json` for image-friendly configuration:

```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.forceShowForFileTypes": [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".mp4", ".mov"],
  "explorerDates.excludedPatterns": [
    "**/*.tmp",
    "**/*.log", 
    "**/.git/**",
    "**/node_modules/**"
  ],
  "explorerDates.enableTroubleShootingMode": true,
  "explorerDates.colorScheme": "recency"
}
```

### **Still Not Working?** 🆘

1. **Restart VS Code completely**
2. **Disable other file explorer extensions temporarily**
3. **Run:** `Developer: Reload Window` from Command Palette
4. **Open GitHub issue** with your diagnostic report: https://github.com/incredincomp/explorer-dates/issues

---

## 🔥 **Performance Issues (High CPU, Fan Noise, Slow Response)**

If Explorer Dates is using too many resources (CPU spikes, laptop fan running loud, VS Code feeling sluggish), follow these steps:

### **Quick Fix - Enable Performance Mode** ⚡

1. **Open Settings** (`Ctrl+,` or `Cmd+,`)
2. **Search for:** `explorerDates.performanceMode`
3. **Enable it** by checking the box ✓
4. **Changes apply immediately** - no restart needed!

**What Performance Mode Does:**
- ✅ Keeps basic date/time tooltips on hover
- ❌ Disables Git author information (no blame operations)
- ❌ Disables automatic file watching (use manual refresh)
- ❌ Disables status bar integration
- ❌ Disables progressive loading and background processing
- ❌ Disables color schemes and visual enhancements
- ❌ Reduces logging overhead

### **Alternative: Optimize Without Performance Mode**

If you want to keep some features but reduce resource usage:

```json
{
  "explorerDates.showGitInfo": "none",
  "explorerDates.progressiveLoading": false,
  "explorerDates.showStatusBar": false,
  "explorerDates.colorScheme": "none",
  "explorerDates.excludedFolders": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    ".vscode-test",
    "vendor",
    "target",
    ".next",
    ".nuxt"
  ]
}
```

### **Symptoms of Resource Issues**

- 🔥 Laptop fan running constantly
- 🐌 VS Code feels sluggish when browsing files
- 💻 High CPU usage in Task Manager/Activity Monitor
- 📊 "Extension Host" process using lots of resources
- 🔋 Battery draining faster than usual

### **When to Use Performance Mode**

- Large projects (thousands of files)
- Monorepos with multiple workspaces
- Projects with many dependencies (large node_modules)
- Low-resource systems (older laptops, limited RAM)
- Remote development over slow connections
- When you only need basic date/time information

### **Commands Still Available in Performance Mode**

- ✅ Manual refresh decorations (`Ctrl+Shift+R`)
- ✅ Show file details
- ✅ Copy file date
- ✅ Toggle decorations on/off
- ✅ All diagnostic and troubleshooting commands

---

## **Why This Happens** 🤔

The most common reasons decorations don't appear:

1. **Extension not properly activated** - VS Code sometimes doesn't load extensions fully
2. **Files excluded by default patterns** - Some patterns are too broad  
3. **VS Code FileDecorationProvider issues** - Platform-specific API problems
4. **Cache problems** - Old cached "no decoration" results
5. **Other extensions interfering** - File tree extensions can conflict

The diagnostic tools we added will help identify which of these is the problem! 🎯