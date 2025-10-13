function waitForElement(selector, timeout = 15000) {
    console.log(`[QA Helper] Waiting for element: "${selector}"`);
    return new Promise((resolve, reject) => {
        const initialElement = document.querySelector(selector);
        if (initialElement) {
            console.log(`[QA Helper] Found element immediately: "${selector}"`);
            return resolve(initialElement);
        }
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`[QA Helper] Found element via observer: "${selector}"`);
                observer.disconnect();
                clearTimeout(timer);
                resolve(element);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        const timer = setTimeout(() => {
            observer.disconnect();
            console.error(`[QA Helper] Timeout: Element "${selector}" not found after ${timeout / 1000}s.`);
            reject(new Error(`Element not found: ${selector}`));
        }, timeout);
    });
}

function waitForElementToDisappear(selector, timeout = 10000) {
    console.log(`[QA Helper] Waiting for element to disappear: "${selector}"`);
    return new Promise((resolve) => {
        if (!document.querySelector(selector)) {
            console.log(`[QA Helper] Element "${selector}" is already gone.`);
            return resolve();
        }
        const observer = new MutationObserver(() => {
            if (!document.querySelector(selector)) {
                console.log(`[QA Helper] Element "${selector}" disappeared.`);
                observer.disconnect();
                clearTimeout(timer);
                resolve();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        const timer = setTimeout(() => {
            observer.disconnect();
            console.log(`[QA Helper] Timeout waiting for disappear: "${selector}". Continuing anyway.`);
            resolve();
        }, timeout);
    });
}

async function findElementByText(selector, text) {
    console.log(`[QA Helper] Trying to find element "${selector}" with text "${text}"`);
    await waitForElement(selector, 20000);
    const elements = Array.from(document.querySelectorAll(selector));
    const targetElement = elements.find(el => el.textContent.trim() === text);
    if (targetElement) {
        console.log(`[QA Helper] Found element with text "${text}"`);
        return targetElement;
    }
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver(() => {
            const allElements = Array.from(document.querySelectorAll(selector));
            const foundEl = allElements.find(el => el.textContent.trim() === text);
            if (foundEl) {
                console.log(`[QA Helper] Found element with text "${text}" via observer`);
                observer.disconnect();
                clearTimeout(timer);
                resolve(foundEl);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        const timer = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element "${selector}" with text "${text}" not found.`));
        }, 15000);
    });
}

async function selectPeriod(period) {
    try {
        const periodLabel = await findElementByText('mat-label', 'Period');
        const formField = periodLabel.closest('.mat-mdc-form-field');
        if (!formField) throw new Error("Could not find parent '.mat-mdc-form-field' for the 'Period' label.");
        const periodDropdownTrigger = formField.querySelector('mat-select');
        if (!periodDropdownTrigger) throw new Error("Could not find 'mat-select' inside the form field.");
        console.log("[QA Helper] Found 'Period' dropdown. Clicking it.");
        periodDropdownTrigger.click();
        const panelSelector = '.mat-mdc-select-panel.mdc-menu-surface--open';
        const panel = await waitForElement(panelSelector);
        const options = Array.from(panel.querySelectorAll('mat-option .mdc-list-item__primary-text'));
        const targetOption = options.find(opt => opt.textContent.trim() === period);
        if (targetOption) {
            targetOption.closest('mat-option').click();
            console.log(`[QA Helper] Clicked on period "${period}".`);
            await waitForElementToDisappear(panelSelector);
        } else {
            console.error(`[QA Helper] Period option "${period}" not found.`);
            document.body.click();
            await waitForElementToDisappear(panelSelector);
        }
    } catch (error) {
        console.error('[QA Helper] Failed to select period:', error);
        throw error;
    }
}

async function enterSearchTerm(searchTerm) {
    try {
        console.log("[QA Helper] Starting search for the 'Search' input field...");
        const searchLabel = await findElementByText('mat-label', 'Search');
        const formField = searchLabel.closest('.mat-mdc-form-field');
        if (!formField) throw new Error("Could not find parent '.mat-mdc-form-field' for the 'Search' label.");
        const searchInput = formField.querySelector('input[matinput]');
        if (!searchInput) throw new Error("Could not find 'input[matinput]' inside the search form field.");

        console.log(`[QA Helper] Found search input. Setting value to "${searchTerm}"`);
        searchInput.value = searchTerm;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        searchInput.focus();
        searchInput.blur();

        console.log(`[QA Helper] Dispatched events for search term: "${searchTerm}"`);
    } catch (error) {
        console.error('[QA Helper] Failed to enter search term:', error);
        throw error;
    }
}

function showToast(text) {
    const oldToast = document.getElementById('qa-helper-toast');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.id = 'qa-helper-toast';
    toast.textContent = text;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#323232',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        zIndex: '9999',
        fontSize: '14px',
        opacity: '0',
        transition: 'opacity 0.3s ease-in-out'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.addEventListener('transitionend', () => toast.remove());
    }, 2000);
}

function handleTableClick(event) {
    const cell = event.target.closest('.cdk-column-timeStamp');
    if (!cell) return;
    const timestamp = cell.childNodes[0].nodeValue.trim();
    navigator.clipboard.writeText(timestamp).then(() => {
        console.log(`[QA Helper] Copied to clipboard: ${timestamp}`);
        showToast(`Copied: ${timestamp}`);
    }).catch(err => {
        console.error('[QA Helper] Failed to copy text: ', err);
        showToast('Failed to copy!');
    });
}

async function setupTimestampCopy() {
    try {
        const tableBody = await waitForElement('tbody[role="rowgroup"]');
        tableBody.addEventListener('click', handleTableClick);
        console.log('[QA Helper] Timestamp copy functionality is enabled.');
    } catch (error) {
        console.error('[QA Helper] Could not find the table body to attach the click listener.', error);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'performQaActions') {
        const { period, searchTerm } = message.data;
        console.log('[QA Helper] Received task:', { period, searchTerm });
        (async () => {
            try {
                await selectPeriod(period);
                await enterSearchTerm(searchTerm);
                console.log('%c[QA Helper] All actions completed successfully.', 'color: green; font-weight: bold;');
            } catch (error) {
                console.error('%c[QA Helper] An error occurred during the automation process. Halting execution.', 'color: red; font-weight: bold;', error);
            }
        })();
    }
});

setupTimestampCopy();