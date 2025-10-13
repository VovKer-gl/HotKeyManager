// content/modules/FrameFixer.js
const FrameFixer = {
    _observer: null,
    _isEnabled: false,
    _intervalId: null,

    enable: function () {
        if (this._isEnabled) return;
        console.log("[Module] FrameFixer enabling...");
        this._isEnabled = true;
        this._start();
    },

    disable: function () {
        if (!this._isEnabled) return;
        console.log("[Module] FrameFixer disabling...");

        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }

        document.querySelectorAll('td.frame-fix-cell').forEach(cell => cell.remove());
        document.querySelectorAll('tr[data-helper-processed-ff]').forEach(row => row.removeAttribute('data-helper-processed-ff'));

        this._isEnabled = false;
    },

    _start: function () {
        this._intervalId = setInterval(() => {
            const targetTableBody = document.querySelector('#game-events tbody');
            if (targetTableBody) {
                clearInterval(this._intervalId);
                this._intervalId = null;

                // Обробляємо існуючі рядки
                targetTableBody.querySelectorAll('tr').forEach(row => this._processTableRow(row));

                // Створюємо спостерігача для нових рядків
                this._observer = new MutationObserver((mutationsList) => {
                    for (const mutation of mutationsList) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === 1 && node.tagName === 'TR') {
                                this._processTableRow(node);
                            } else if (node.nodeType === 1 && node.querySelectorAll) {
                                node.querySelectorAll('tr').forEach(row => this._processTableRow(row));
                            }
                        }
                    }
                });
                this._observer.observe(targetTableBody, { childList: true, subtree: true });
            }
        }, 500);
    },

    /**
     * Надсилає повідомлення до injected.js для виконання дії
     * @param {string} eventId
     * @param {'next' | 'prev'} direction
     */
    _requestFrameFix: function(eventId, direction) {
        window.postMessage({
            type: "FROM_EXT_FRAME_FIX",
            payload: { eventId, direction }
        }, window.location.origin);
    },

    _processTableRow: function (row) {
        if (!row || !row.id || row.hasAttribute('data-helper-processed-ff')) return;

        if (row.id.startsWith('event-player-')) {
            const createButtonCell = (title, iconClass, clickHandler) => {
                const cell = document.createElement('td');
                cell.className = 'frame-fix-cell';
                cell.style.width = '30px';
                cell.style.textAlign = 'center';
                const button = document.createElement('button');
                button.title = title;
                button.innerHTML = `<span class="glyphicon ${iconClass}" aria-hidden="true"></span>`;
                button.style.cssText = `background: transparent; border: none; padding: 0; margin: 0; cursor: pointer; color: #fff; font-size: 14px; vertical-align: middle; transition: color 0.2s ease-in-out;`;
                button.onmouseover = () => button.style.color = '#999';
                button.onmouseout = () => button.style.color = '#fff';
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    clickHandler(); // Викликаємо обробник
                });
                cell.appendChild(button);
                return cell;
            };

            // При кліку викликаємо _requestFrameFix, передаючи ID рядка і напрямок
            const backButtonCell = createButtonCell('Fix Frame (-1F)', 'glyphicon-step-backward', () => this._requestFrameFix(row.id, 'prev'));
            const forwardButtonCell = createButtonCell('Fix Frame (+1F)', 'glyphicon-step-forward', () => this._requestFrameFix(row.id, 'next'));

            row.appendChild(backButtonCell);
            row.appendChild(forwardButtonCell);

        } else if (row.id.startsWith('event-game-')) {
            const emptyCell1 = document.createElement('td');
            emptyCell1.className = 'frame-fix-cell';
            const emptyCell2 = document.createElement('td');
            emptyCell2.className = 'frame-fix-cell';
            row.appendChild(emptyCell1);
            row.appendChild(emptyCell2);
        }

        row.setAttribute('data-helper-processed-ff', 'true');
    }
};