const QaHelper = {
    settings: {},

    init: function() {
        console.log("[Module] QaHelper initializing...");
    },

    updateSettings: function(settings) {
        this.settings = settings;
        this.toggleQaButtonsVisibility();
    },

    addQaButtons: function() {
        if (document.getElementById('coor-button')) return;
        const targetDiv = document.getElementById('startstopbuttondiv');
        if (!targetDiv) return;

        const coorButton = document.createElement('button');
        coorButton.type = 'button';
        coorButton.className = 'btn btn-primary startstopbutton';
        coorButton.id = 'coor-button';
        coorButton.textContent = 'Coor';
        coorButton.addEventListener('click', () => this.handleQaButtonClick('coor'));

        const frameButton = document.createElement('button');
        frameButton.type = 'button';
        frameButton.className = 'btn btn-primary startstopbutton';
        frameButton.id = 'frame-button';
        frameButton.textContent = 'Frame';
        frameButton.addEventListener('click', () => this.handleQaButtonClick('frame'));

        const markButton = document.getElementById('markbutton');
        if (markButton) {
            markButton.insertAdjacentElement('afterend', frameButton);
            markButton.insertAdjacentElement('afterend', coorButton);
        } else {
            targetDiv.appendChild(coorButton);
            targetDiv.appendChild(frameButton);
        }

        this.toggleQaButtonsVisibility();
    },

    toggleQaButtonsVisibility: function() {
        const coorButton = document.getElementById('coor-button');
        const frameButton = document.getElementById('frame-button');
        if (!coorButton || !frameButton) return;

        const shouldBeVisible = this.settings.qaHelperEnabled;
        coorButton.style.display = shouldBeVisible ? 'inline-block' : 'none';
        frameButton.style.display = shouldBeVisible ? 'inline-block' : 'none';
    },

    handleQaButtonClick: function(searchTerm) {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('videoId');
        if (!videoId || !videoId.includes('-')) return;
        const [matchId, period] = videoId.split('-');
        chrome.runtime.sendMessage({
            action: 'openQaReport',
            data: { matchId, period, searchTerm }
        });
    },

    triggerFindByClipboard: async function() {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
                const clipboardText = await navigator.clipboard.readText();
                this.processTimestamp(clipboardText);
                return;
            }
        } catch (err) {
            console.warn("Could not use modern clipboard API, falling back to textarea method. Error:", err);
        }

        const textarea = document.createElement('textarea');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        textarea.setAttribute('contenteditable', 'true');
        document.body.appendChild(textarea);
        textarea.focus();

        document.execCommand('paste');

        const clipboardText = textarea.value;
        document.body.removeChild(textarea);

        this.processTimestamp(clipboardText);
    },

    processTimestamp: function(text) {
        const timestamp = text.trim();
        if (/^\d{2}:\d{2}:\d{2}:\d{2}$/.test(timestamp)) {
            this.findAndSelectEventByTimestamp(timestamp);
        } else {
            console.warn(`[QaHelper] Clipboard text "${timestamp}" does not look like a valid timestamp.`);
        }
    },

    findAndSelectEventByTimestamp: function(timestamp) {
        console.log(`[QaHelper] Searching for event with timestamp: ${timestamp}`);
        const allRows = document.querySelectorAll('#game-events tbody tr');
        let targetRow = null;

        for (const row of allRows) {
            const timeCell = row.querySelector('td.video-time');
            if (timeCell && timeCell.textContent.trim() === timestamp) {
                targetRow = row;
                break;
            }
        }

        if (targetRow) {
            console.log('[QaHelper] Event found!', targetRow);

            allRows.forEach(row => row.classList.remove('selected'));
            targetRow.classList.add('selected');
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetRow.click();
        } else {
            console.warn(`[QaHelper] Event with timestamp ${timestamp} not found.`);
        }
    }
};