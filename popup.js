document.addEventListener('DOMContentLoaded', function() {
    const hotkeyList = document.querySelector('.hotkey-list');
    const statusDiv = document.querySelector('.status');
    const categories = document.querySelectorAll('.category');
    const sectionTitle = document.querySelector('.section-title');

    let currentInput = null;
    let isRecording = false;
    let pressedKeys = new Set();
    let currentCategory = 'blocks-checks';

    const categoryData = {
        'blocks-checks': [
            { id: 'block/none/pass/successful', name: 'Successful blocked pass'},
            { id: 'block/none/pass/failed', name: 'Failed blocked pass'},
            { id: 'receptionprevention/nz/none/successful', name: 'Reception prevention'},
            { id: 'block/oz/blueline/successful', name: 'Successful blue-line hold' },
            { id: 'block/oz/blueline/failed', name: 'Failed blue-line hold'},
            { id: 'check/none/stick/successful', name: 'Successful stick-check'},
            { id: 'check/none/body/successful', name: 'Successful body-check'},
            { id: 'controlledentryagainst/dz/none/undetermined', name: 'Controlled entry against '},
            { id: 'dumpinagainst/dz/none/undetermined', name: 'Dump-in against '},
            { id: 'block/dz/shot/successful', name: 'Successful blocked shot'},
            { id: 'block/dz/shot/failed', name: 'Failed blocked shot'},
            { id: 'pressure/dz/shot/undetermined', name: 'Shot pressure',defaultShortcut: 'Ь'}
        ],
        'lprs': [
            { id: 'lpr/none/none/successful', name: 'Successful loose puck recovery',defaultShortcut: 'І'},
            { id: 'lpr/none/none/failed', name: 'Failed loose puck recovery',defaultShortcut: 'Ц' },
            { id: 'Contested_LPR', name: 'Contested LPR' ,defaultShortcut: 'Ч'},
            { id: 'lpr/none/faceoff/successful', name: 'Loose puck recovery after face-off' },
            { id: 'lpr/dz/nofore/successful', name: 'Loose puck recovery without opposition forecheck' },
            { id: 'lpr/dz/hipresopdump/successful', name: 'Successful loose puck recovery after a high pressure opposition dump-in' },
            { id: 'lpr/dz/hipresopdump/failed', name: 'Failed loose puck recovery after a high pressure opposition dump-in' }
        ],
        'carries-dumps': [
            { id: 'icing/dz/none/failed', name: 'Icing'},
            { id: 'Straight_Dump-In', name: 'Straight dump-in' },
            { id: 'Cross-Ice_Dump-In', name: 'Cross-ice dump-in' },
            { id: 'dumpin/nz/chip/successful', name: 'Successful chip-in to the offensive zone' },
            { id: 'dumpin/nz/dump/successful', name: 'Successful dump-in to the offensive zone' },
            { id: 'dumpin/nz/dump/failed', name: 'Failed dump-in' },
            { id: 'dumpin/nz/chip/failed', name: 'Failed chip-in' },
            { id: 'Soft_Dump-In', name: 'Soft dump-in' },
            { id: 'offside/nz/none/failed', name: 'Offside caused' },
            { id: 'carry/nz/none/successful', name: 'Line carry' ,defaultShortcut: 'У'},
            { id: 'dumpout/dz/boards/successful', name: 'Successful dump-out off the board' },
            { id: 'dumpout/dz/flip/successful', name: 'Successful flip out' },
            { id: 'dumpout/dz/ice/successful', name: 'Successful dump-out through center ice' },
            { id: 'dumpout/dz/ice/failed', name: 'Failed dump-out through center ice' },
            { id: 'dumpout/dz/flip/failed', name: 'Failed flip out' },
            { id: 'dumpout/dz/boards/failed', name: 'Failed dump-out off the board' },
            { id: 'controlledbreakout/dz/none/undetermined', name: 'Controlled breakout' }
        ],
        'passes': [
            { id: 'Pass_off-boards_(high)', name: 'Pass off boards',defaultShortcut: 'С' },
            { id: 'pass/nz/none/undetermined', name: 'Pass',defaultShortcut: 'В'},
            { id: 'reception/nz/none/successful', name: 'Successful pass reception' ,defaultShortcut: 'В'},
            { id: 'failedpasslocation/oz/none/failed', name: 'Failed pass trajectory location',defaultShortcut: 'У' },
            { id: 'reception/nz/none/failed', name: 'Missed pass reception' },
            { id: 'OZ_W-E_Pass_Off-Boards', name: 'OZ east-west pass off boards' },
            { id: 'pass/dz/outlet/undetermined', name: 'Outlet pass' }
        ],
        'shots-puck-protection': [
            { id: 'puckprotection/oz/deke/successful', name: 'Successful open-ice deke in the offensive zone' },
            { id: 'puckprotection/oz/deke/failed', name: 'Failed open-ice deke in the offensive zone' },
            { id: 'puckprotection/oz/body/successful', name: 'Successful puck protection in the offensive zone' },
            { id: 'puckprotection/oz/body/failed', name: 'Failed puck protection in the offensive zone' }
        ],
        'other': [
            { id: 'toggle-edit-mode', name: 'Toggle Edit Mode', defaultShortcut: 'M' }
        ]
    };

    function getCategoryTitle(category) {
        const titles = {
            'blocks-checks': 'Blocks & Checks Actions',
            'lprs': 'LPRs Actions',
            'carries-dumps': 'Carries & Dumps Actions',
            'passes': 'Passes Actions',
            'shots-puck-protection': 'Shots & Puck Protection Actions',
            'other': 'Other Actions'
        };
        return titles[category] || 'Actions';
    }

    async function switchCategory(categoryName) {
        currentCategory = categoryName;
        sectionTitle.textContent = getCategoryTitle(categoryName);
        categories.forEach(c => c.classList.toggle('active', c.dataset.category === categoryName));
        await loadHotkeys();
    }

    async function loadHotkeys() {
        const storageKey = `${currentCategory}Hotkeys`;
        const result = await chrome.storage.sync.get([storageKey]);
        const userHotkeys = result[storageKey] || [];

        const currentCategoryItems = categoryData[currentCategory] || [];
        const hotkeysToRender = [];

        for (const item of currentCategoryItems) {
            const userHotkey = userHotkeys.find(h => h.actionId === item.id);
            if (userHotkey) {
                hotkeysToRender.push({ ...item, shortcut: userHotkey.shortcut });
            } else if (item.defaultShortcut) {
                hotkeysToRender.push({ ...item, shortcut: item.defaultShortcut });
            } else {
                hotkeysToRender.push(item);
            }
        }

        renderHotkeyList(hotkeysToRender);
    }

    function renderHotkeyList(itemsWithShortcuts) {
        hotkeyList.innerHTML = '';
        if (!itemsWithShortcuts || itemsWithShortcuts.length === 0) {
            hotkeyList.innerHTML = `<div class="empty-state">Ця категорія порожня</div>`;
            return;
        }
        itemsWithShortcuts.forEach(item => {
            hotkeyList.appendChild(createHotkeyItem(item, { shortcut: item.shortcut, actionId: item.id }));
        });
    }

    function createHotkeyItem(item, savedHotkey) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'hotkey-item';
        const isDefault = item.defaultShortcut && item.defaultShortcut === savedHotkey?.shortcut;
        const value = savedHotkey?.shortcut || '';

        itemDiv.innerHTML = `
            <div class="event-info">
                <div class="event-name">${item.name}</div>
            </div>
            <div class="hotkey-input-container">
                <input type="text" class="hotkey-input" placeholder="Натисніть..."
                       value="${value}" readonly data-action-id="${item.id}"
                       title="${isDefault ? 'За замовчуванням' : ''}">
                ${value ? '<button class="clear-btn" title="Видалити">×</button>' : ''}
            </div>`;
        itemDiv.querySelector('.hotkey-input').addEventListener('click', (e) => startRecording(e.target));
        const clearBtn = itemDiv.querySelector('.clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearHotkey(item.id); });
        }
        return itemDiv;
    }

    function startRecording(input) {
        if (isRecording) stopRecording(false);
        isRecording = true;
        currentInput = input;
        pressedKeys.clear();
        input.value = '';
        input.placeholder = 'Записуємо...';
        input.classList.add('recording');
        input.closest('.hotkey-item').classList.add('recording');
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }

    function stopRecording(shouldSave) {
        if (!isRecording) return;
        isRecording = false;
        if (shouldSave) saveCurrentHotkey();
        else loadHotkeys();
        if (currentInput) {
            currentInput.classList.remove('recording');
            currentInput.placeholder = 'Натисніть...';
            currentInput.closest('.hotkey-item').classList.remove('recording');
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        currentInput = null;
    }

    function getKeyFromEvent(e) {
        const modifiers = ['Control', 'Shift', 'Alt', 'Meta'];
        if (modifiers.includes(e.key)) return e.key;
        if (e.code.startsWith('Key')) return e.code.replace('Key', '');
        if (e.code.startsWith('Digit')) return e.code.replace('Digit', '');
        return e.key;
    }

    function handleKeyDown(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Escape') return stopRecording(false);
        pressedKeys.add(getKeyFromEvent(e));
        currentInput.value = formatShortcut(pressedKeys);
    }

    function handleKeyUp(e) {
        e.preventDefault();
        e.stopPropagation();
        const key = getKeyFromEvent(e);
        const isModifier = ['Control', 'Shift', 'Alt', 'Meta'].includes(key);
        if (!isModifier && pressedKeys.size > 0) {
            stopRecording(true);
        }
    }

    function formatShortcut(keysSet) {
        const order = ['Control', 'Shift', 'Alt', 'Meta'];
        const keys = Array.from(keysSet);
        const modifiers = keys.filter(k => order.includes(k)).sort((a, b) => order.indexOf(a) - order.indexOf(b));
        const primaryKey = keys.find(k => !order.includes(k));
        return [...modifiers, primaryKey].filter(Boolean).join(' + ');
    }

    async function saveCurrentHotkey() {
        const shortcut = formatShortcut(pressedKeys);
        if (!shortcut) return loadHotkeys();
        const actionId = currentInput.dataset.actionId;
        const storageKey = `${currentCategory}Hotkeys`;

        const allData = await chrome.storage.sync.get(null);
        for (const key in allData) {
            if (Array.isArray(allData[key]) && allData[key].some(h => h.shortcut === shortcut && h.actionId !== actionId)) {
                showStatus('Ця комбінація вже зайнята!', 'error');
                return loadHotkeys();
            }
        }

        const categoryItems = categoryData[currentCategory] || [];
        const item = categoryItems.find(i => i.id === actionId);
        if (item && item.defaultShortcut === shortcut) {
            showStatus('Вибрано хоткей за замовчуванням', 'success');
            return loadHotkeys();
        }

        let hotkeys = (await chrome.storage.sync.get([storageKey]))[storageKey] || [];
        const existingIndex = hotkeys.findIndex(h => h.actionId === actionId);

        if (existingIndex > -1) hotkeys[existingIndex].shortcut = shortcut;
        else hotkeys.push({ actionId, shortcut });

        await chrome.storage.sync.set({ [storageKey]: hotkeys });
        showStatus('Хоткей збережено!', 'success');
        await loadHotkeys();
    }

    async function clearHotkey(actionId) {
        const storageKey = `${currentCategory}Hotkeys`;
        let hotkeys = (await chrome.storage.sync.get([storageKey]))[storageKey] || [];
        hotkeys = hotkeys.filter(h => h.actionId !== actionId);
        await chrome.storage.sync.set({ [storageKey]: hotkeys });
        showStatus('Хоткей видалено', 'success');
        await loadHotkeys();
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
        statusDiv.style.display = 'block';
        setTimeout(() => statusDiv.style.display = 'none', 3000);
    }

    switchCategory('blocks-checks');
    categories.forEach(c => c.addEventListener('click', () => switchCategory(c.dataset.category)));
});