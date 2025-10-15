const FrameConflictDetector = {
    _observer: null,
    _tableObserver: null,
    _isEnabled: true,
    _intervalId: null,
    _timestampsMap: new Map(),

    _defaultColor: '#f36d00',
    _highlightColor: '#ffffff',
    _isHighlightMode: false,

    init: function() {
        console.log("[Module] FrameConflictDetector initializing...");
        if (!this._isEnabled) return;
        this._start();
    },

    _start: function() {
        this._intervalId = setInterval(() => {
            const targetTableBody = document.querySelector('#game-events tbody');
            const targetTable = document.getElementById('game-events');

            if (targetTableBody && targetTable) {
                clearInterval(this._intervalId);
                this._intervalId = null;

                this._isHighlightMode = targetTable.classList.contains('highlight');

                this._fullScanAndRender(targetTableBody);

                this._observer = new MutationObserver((mutationsList) => {
                    for (const mutation of mutationsList) {
                        mutation.addedNodes.forEach(node => this._processAddedNode(node));
                        mutation.removedNodes.forEach(node => this._processRemovedNode(node));
                    }
                });
                this._observer.observe(targetTableBody, { childList: true, subtree: true });

                this._tableObserver = new MutationObserver((mutationsList) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            this._handleTableClassChange(mutation.target);
                        }
                    }
                });
                this._tableObserver.observe(targetTable, { attributes: true });
            }
        }, 500);
    },

    _handleTableClassChange: function(tableElement) {
        const hasHighlight = tableElement.classList.contains('highlight');
        if (hasHighlight !== this._isHighlightMode) {
            this._isHighlightMode = hasHighlight;
            console.log(`[FrameConflictDetector] Highlight mode changed to: ${this._isHighlightMode}`);
            this._timestampsMap.forEach((events, timestamp) => {
                if (events.size > 0) this._updateIconsForTimestamp(timestamp);
            });
        }
    },

    _fullScanAndRender: function(tableBody) {
        this._timestampsMap.clear();
        const allRows = tableBody.querySelectorAll('tr');
        allRows.forEach(row => {
            const eventData = this._getEventData(row);
            if (eventData) {
                if (!this._timestampsMap.has(eventData.timestamp)) {
                    this._timestampsMap.set(eventData.timestamp, new Set());
                }
                this._timestampsMap.get(eventData.timestamp).add(eventData);
            }
        });
        this._timestampsMap.forEach((events, timestamp) => this._updateIconsForTimestamp(timestamp));
        this._alignAllRows(allRows);
    },

    _processAddedNode: function(node) {
        if (node.nodeType !== 1) return;
        const rows = node.tagName === 'TR' ? [node] : node.querySelectorAll('tr');
        rows.forEach(row => {
            const eventData = this._getEventData(row);
            if (eventData) {
                if (!this._timestampsMap.has(eventData.timestamp)) {
                    this._timestampsMap.set(eventData.timestamp, new Set());
                }
                this._timestampsMap.get(eventData.timestamp).add(eventData);
                this._updateIconsForTimestamp(eventData.timestamp);
            }
            this._alignRow(row);
        });
    },

    _processRemovedNode: function(node) {
        if (node.nodeType !== 1) return;
        const rows = node.tagName === 'TR' ? [node] : node.querySelectorAll('tr');
        rows.forEach(row => {
            const eventData = this._getEventData(row);
            if (eventData) {
                const events = this._timestampsMap.get(eventData.timestamp);
                if (events) {
                    events.forEach(e => {
                        if (e.row === row) events.delete(e);
                    });
                    this._updateIconsForTimestamp(eventData.timestamp);
                }
            }
        });
    },

    _updateIconsForTimestamp: function(timestamp) {
        const events = this._timestampsMap.get(timestamp) || new Set();
        const eventArray = Array.from(events);

        const gameEvents = eventArray.filter(e => e.isGameEvent);
        const ourTeamNonAssistEvents = eventArray.filter(e => e.isPlayerEvent && !e.isAssist && e.team === 'ours');
        const opposingTeamNonAssistEvents = eventArray.filter(e => e.isPlayerEvent && !e.isAssist && e.team === 'opponent');

        const isOurTeamConflict = ourTeamNonAssistEvents.length > 1 || (ourTeamNonAssistEvents.length > 0 && gameEvents.length > 0);
        const isOpposingTeamConflict = opposingTeamNonAssistEvents.length > 1 || (opposingTeamNonAssistEvents.length > 0 && gameEvents.length > 0);

        const color = this._isHighlightMode ? this._highlightColor : this._defaultColor;

        eventArray.forEach(event => {
            let shouldHaveIcon = false;
            if (event.isPlayerEvent && !event.isAssist) {
                if (event.team === 'ours' && isOurTeamConflict) {
                    shouldHaveIcon = true;
                } else if (event.team === 'opponent' && isOpposingTeamConflict) {
                    shouldHaveIcon = true;
                }
            }
            this._renderIcon(event.row, shouldHaveIcon, color);
        });
    },

    _renderIcon(row, showIcon, color) {
        let cell = row.querySelector('.frame-conflict-cell');
        if (!cell) {
            cell = document.createElement('td');
            cell.className = 'frame-conflict-cell';
            row.appendChild(cell);
        }

        if (showIcon) {
            cell.innerHTML = `<span class="glyphicon glyphicon-minus-sign" aria-hidden="true" title="Frame conflict detected" style="color: ${color}; font-size: 14px; vertical-align: middle;"></span>`;
            cell.style.width = '30px';
            cell.style.paddingBottom = '6px';
        } else {
            cell.innerHTML = '';
        }
    },

    _getEventData: function(row) {
        if (!row.id) return null;
        const timeCell = row.querySelector('td.video-time');
        if (!timeCell) return null;
        const desc = row.querySelector('td.description')?.textContent.trim() || '';
        return {
            row: row,
            timestamp: timeCell.textContent.trim(),
            isPlayerEvent: row.id.startsWith('event-player-'),
            isGameEvent: row.id.startsWith('event-game-'),
            isAssist: desc.includes('1ST ASSIST') || desc.includes('2ND ASSIST'),
            team: row.classList.contains('opposing-team-event') ? 'opponent' : 'ours'
        };
    },

    _alignAllRows: function(rows) {
        rows.forEach(row => this._alignRow(row));
    },

    _alignRow: function(row) {
        if (!row.querySelector('.frame-conflict-cell')) {
            const emptyCell = document.createElement('td');
            emptyCell.className = 'frame-conflict-cell';
            row.appendChild(emptyCell);
        }
    }
};