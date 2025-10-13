# 🎮 Game Hotkeys Manager & QA Helper

A Chrome extension designed to streamline your workflow on Sportlogiq's platform. It allows you to set custom keyboard shortcuts for in-game actions and provides powerful helper tools for QA reports.

## ✨ Features

- **Custom Hotkeys**: Assign any keyboard combination to specific in-game actions.
- **Multiple Categories**: Organize hotkeys into logical groups like "Blocks & Checks," "LPRs," "Passes," etc.
- **Default Shortcuts**: Comes with a pre-configured set of default hotkeys to get you started immediately.
- **Persistent Settings**: Your custom hotkeys are saved and synced across your devices.
- **Easy Reset**: A one-click reset button restores all hotkeys to their default values.
- **User-Friendly Interface**: A clean popup menu for easy configuration of all features.

### 🚀 QA Helper Features
- **Quick Navigation**: Adds "Coor" and "Frame" buttons to the eventing page, allowing you to instantly open the corresponding QA report page with the correct match ID.
- **Smart Automation**: Automatically selects the correct period and enters the search term ("coor" or "frame") on the QA report page.
- **One-Click Timestamp Copy**: On the QA report page, simply click on any timestamp in the table to copy it to your clipboard.
- **Find Event by Timestamp**: On the eventing page, use a custom hotkey (default `Ctrl + F`) to instantly find, select, and scroll to the event corresponding to the timestamp in your clipboard.
- **Toggleable**: All QA Helper features can be easily enabled or disabled from the extension's settings popup.

## 📂 Project Structure

```
Game-Hotkeys-Manager/
├─ manifest.json                     # Extension configuration
├─ popup.html                        # The popup's HTML structure
├─ popup.js                          # Logic for the popup interface
├─ background.js                     # Service worker for cross-tab communication
├─ content/
│  ├─ loader.js                      # Injects scripts and initializes all modules
│  ├─ injected.js                    # Script injected into the page's context
│  ├─ oneapp_handler.js              # Content script for the QA reports page
│  └─ modules/
│     ├─ HotkeyManager.js             # Core logic for handling hotkeys
│     ├─ QaHelper.js                  # Logic for all QA Helper features
│     ├─ FrameFixer.js                # Module for frame-by-frame navigation
│     ├─ SvgVerticalSnap.js           # Module for SVG snapping feature
│     └─ VideoScrubber.js             # Module for video scrubbing feature
└─ README.md                         # This documentation file
```

---

## ⚙️ Installation

1. Create a folder for the extension.
2. Place all the project files and folders (`manifest.json`, `popup.html`, `content/`, etc.) inside it.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked**.
6. Select the folder you created. The extension icon will appear in your toolbar.

---

## 🚀 Usage

### Hotkeys Configuration
1. Go to the eventing page.
2. Click the extension's icon in the Chrome toolbar to open the settings popup.
3. The popup displays actions grouped by categories.
4. To set a new hotkey:
    - Click the input field next to the desired action (it will say "Recording...").
    - Press the key combination you want to assign (e.g., `Ctrl` + `Shift` + `A`).
    - The hotkey is saved automatically.
5. To clear a hotkey, click the "×" button next to it.

### QA Helper Workflow
1. **Enable the Helper**: In the extension popup, under the "Other" category, ensure the "Enable QA Report Helper" toggle is on.
2. **Navigate**: On the eventing page, click the **"Coor"** or **"Frame"** buttons to open the QA report page. The extension will automatically select the period and enter the search term.
3. **Copy Timestamp**: On the QA report page, find a warning you want to check and simply click on its timestamp (e.g., `00:04:07:29`). A "Copied!" notification will appear.
4. **Find Event**: Go back to the eventing page and press your "Find Event by Copied Timestamp" hotkey (default `Ctrl + F`). The extension will instantly find and select the corresponding event in the list.