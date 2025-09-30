
# Game Hotkeys Manager Extension

A Chrome extension that allows you to set custom keyboard shortcuts for in-game actions.

## Features

- **Custom Hotkeys**: Assign any keyboard combination to specific in-game actions.
- **Multiple Categories**: Organize hotkeys into logical groups like "Blocks & Checks," "LPRs," "Passes," etc.
- **Default Hotkeys**: Comes with a pre-configured set of default hotkeys to get you started immediately.
- **Persistent Settings**: Your custom hotkeys are saved and synced across your devices.
- **Easy Reset**: A one-click reset button restores all hotkeys to their default values.
- **User-Friendly Interface**: A clean popup menu for easy configuration.

## 📂 Project structure

```
Game-Hotkeys-Manager/
 ├─ manifest.json          # Extension configuration
 ├─ popup.html             # The popup's HTML structure
 ├─ popup.js               # Logic for the popup interface
 ├─ content_isolated.js    # Script to read stored hotkeys
 ├─ content_main.js        # Script to execute actions on the page
 └─ README.md              # This documentation file
```

---

## ⚙️ Installation

1. Create a folder.
2. Add all the project files (`manifest.json`, `popup.html`, `popup.js`, etc.) inside it.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked**.
6. Select the folder.

---

## 🚀 Usage

1. Go to the page with the video player.
2. Click the extension's icon in the Chrome toolbar to open the settings popup.
3. The popup displays actions grouped by categories. Default hotkeys are already assigned.
4. To set a new hotkey:
    - Click the input field next to the desired action (it will say "Recording...").
    - Press the key combination you want to assign (e.g., `Ctrl` + `Shift` + `A`).
    - The hotkey is saved automatically.
5. To clear a hotkey, click the "×" button next to it.
6. Once configured, your hotkeys will trigger the corresponding actions on the page.

