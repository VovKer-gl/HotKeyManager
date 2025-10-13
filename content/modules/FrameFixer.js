const FrameFixer = {
    _observer: null,
    _targetTableBody: null,
    _isEnabled: false,

    enable: function () {
        if (this._isEnabled) return;
        console.log("[Module] FrameFixer enabling...");
        this._isEnabled = true;
        this.start();
    },

    disable: function () {
        if (!this._isEnabled) return;
        console.log("[Module] FrameFixer disabling...");
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        // Видаляємо кнопки, які ми додали
        document.querySelectorAll('tr[data-helper-processed] .frame-fix-cell').forEach(cell => cell.remove());
        document.querySelectorAll('tr[data-helper-processed]').forEach(row => row.removeAttribute('data-helper-processed'));
        this._isEnabled = false;
    },

    start: function () {
        if (!this._isEnabled) return;

        const intervalId = setInterval(() => {
            this._targetTableBody = document.querySelector('#game-events tbody');
            if (this._targetTableBody) {
                clearInterval(intervalId);
                this._targetTableBody.querySelectorAll('tr').forEach(this._processTableRow.bind(this));

                this._observer = new MutationObserver((mutationsList) => {
                    mutationsList.forEach(mutation => mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.tagName === 'TR') {
                            this._processTableRow(node);
                        } else if (node.nodeType === 1 && node.querySelectorAll) {
                            node.querySelectorAll('tr').forEach(this._processTableRow.bind(this));
                        }
                    }));
                });
                this._observer.observe(this._targetTableBody, {childList: true, subtree: true});
            }
        }, 500);
    },

    _waitFor: function (conditionFn, callbackFn, timeout = 3000) {
        const startTime = Date.now();
        const intervalId = setInterval(() => {
            if (conditionFn()) {
                clearInterval(intervalId);
                callbackFn();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(intervalId);
            }
        }, 100);
    },

    _simulateRealClick: function (element) {
        if (!element) return;
        element.dispatchEvent(new MouseEvent('click', {view: window, bubbles: true, cancelable: true}));
    },

    _performFrameFix: function (row, direction) {
        row.click();
        setTimeout(() => {
            if (typeof playerEventEditor === 'undefined' || !playerEventEditor.checkIfUserCanEnterEditMode) return;
            playerEventEditor.checkIfUserCanEnterEditMode();

            this._waitFor(() => document.querySelector('div#frame-edit-controls.edit-current'), () => {
                const timecodeSpan = document.getElementById('current-frame');
                const originalTimecode = timecodeSpan ? timecodeSpan.textContent : '';

                setTimeout(() => {
                    const buttonId = direction === 'next' ? 'f-next-frame' : 'f-previous-frame';
                    const frameButton = document.getElementById(buttonId);
                    if (!frameButton) return;
                    this._simulateRealClick(frameButton);

                    this._waitFor(() => {
                        const currentTimecode = timecodeSpan ? timecodeSpan.textContent : '';
                        return currentTimecode && currentTimecode !== originalTimecode;
                    }, () => {
                        if (playerEventEditor.editData) {
                            playerEventEditor.editData.frame = videoFrameTracker.get();
                        } else {
                            return;
                        }

                        setTimeout(() => {
                            if (typeof playerEventEditor.startExitEditMode === 'function') {
                                playerEventEditor.startExitEditMode();
                                this._waitFor(() => playerEventEditor && playerEventEditor.editMode === false, () => {
                                }, 3000);
                            }
                        }, 150);
                    }, 3000);
                }, 200);
            }, 3000);
        }, 50);
    },

    _processTableRow: function (row) {
        if (!row || row.hasAttribute('data-helper-processed')) return;

        if (row.id && row.id.startsWith('event-player-')) {
            const createButtonCell = (title, iconClass, clickHandler) => {
                const cell = document.createElement('td');
                cell.className = 'frame-fix-cell'; // Клас для легкого видалення
                cell.style.width = '30px';
                cell.style.textAlign = 'center';

                const button = document.createElement('button');
                button.title = title;
                button.innerHTML = `<span class="glyphicon ${iconClass}" aria-hidden="true"></span>`;
                button.style.cssText = `background: transparent; border: none; padding: 0; margin: 0; cursor: pointer; color: #fff; font-size: 14px; vertical-align: middle; transition: color 0.2s ease-in-out;`;
                button.onmouseover = () => {
                    button.style.color = '#999';
                };
                button.onmouseout = () => {
                    button.style.color = '#fff';
                };
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    clickHandler(row);
                });

                cell.appendChild(button);
                return cell;
            };

            const backButtonCell = createButtonCell('Fix Frame (-1F)', 'glyphicon-step-backward', () => this._performFrameFix(row, 'prev'));
            const forwardButtonCell = createButtonCell('Fix Frame (+1F)', 'glyphicon-step-forward', () => this._performFrameFix(row, 'next'));

            row.appendChild(backButtonCell);
            row.appendChild(forwardButtonCell);
        } else if (row.id && row.id.startsWith('event-game-')) {
            const emptyCell1 = document.createElement('td');
            emptyCell1.className = 'frame-fix-cell';
            const emptyCell2 = document.createElement('td');
            emptyCell2.className = 'frame-fix-cell';
            row.appendChild(emptyCell1);
            row.appendChild(emptyCell2);
        }

        row.setAttribute('data-helper-processed', 'true');
    }
};