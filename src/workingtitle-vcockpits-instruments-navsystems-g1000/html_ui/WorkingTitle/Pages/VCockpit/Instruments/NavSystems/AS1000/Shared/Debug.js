class WT_Debug_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Debug_Console_Menu} consoleMenu 
     * @param {WT_Debug_Data_Store_Menu} dataStoreMenu 
     */
    constructor(menus, consoleMenu, dataStoreMenu) {
        super(false);
        this.addSoftKey(1, new WT_Soft_Key("Reload", () => {
            window.document.location.reload(true);
        }));
        this.addSoftKey(2, new WT_Soft_Key("Reload CSS", () => {
            for (let cssElement of document.querySelectorAll(`link[rel=stylesheet]`)) {
                let url = cssElement.getAttribute("href");
                url = url.split("?")[0];
                console.log(`Reloaded css: "${url.split("/").pop()}"`);
                url = url + "?" + (new Date().getTime());
                cssElement.setAttribute("href", url);
            }
        }));
        this.addSoftKey(3, new WT_Soft_Key("Console", () => { menus.goToMenu(consoleMenu); }));
        this.addSoftKey(4, new WT_Soft_Key("Data Store", () => { menus.goToMenu(dataStoreMenu); }));

        this.addSoftKey(11, menus.backKey);
    }
}

class WT_Debug_Data_Store_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     */
    constructor(menus) {
        super(false);

        this.addSoftKey(1, new WT_Soft_Key("Print", () => {
            const data = WTDataStore.getAll();
            let log = [];
            if (data) {
                const longestKey = Object.keys(data).reduce((value, current) => Math.max(value, current.length), 0);
                log.push(`${"Key".padEnd(longestKey, " ")} | Type    | Value (${Object.keys(data).length} total)`);
                log.push(`-------------------------------------------`);
                for (const key in data) {
                    const value = data[key];
                    log.push(`${key.padEnd(longestKey, " ")} | ${(typeof value).padEnd(7, " ")} | ${value}`);
                }
            }
            console.log(log.join("\n"));
        }));
        this.addSoftKey(2, new WT_Soft_Key("Empty", () => {
            WTDataStore.removeAll();
            console.log(`Deleted all data storage entries`);
        }));

        this.addSoftKey(11, menus.backKey);
    }
}

class WT_Debug_Console_Message extends HTMLElement {
    constructor(type, time, message) {
        super();
        this.type = type;
        this._time = time;
        this.message = message;
        this.count = 1;
        this.elements = {
            time: document.createElement("span"),
            message: document.createElement("span")
        };
        this.appendChild(this.elements.time);
        this.appendChild(this.elements.message);
        this.classList.add(type);
        this.update();
    }
    get time() {
        return this._time;
    }
    set time(time) {
        this._time = time;
        this.update();
    }
    incrementCount() {
        this.count++;
        this.update();
    }
    update() {
        this.elements.time.textContent = `[${this._time.toISOString().substr(11, 8)}]`;
        this.elements.message.textContent = `${this.count > 1 ? `(${this.count}) ` : ``}${this.message}`;
    }
}
customElements.define("wt-debug-console-message", WT_Debug_Console_Message);

class WT_Debug_Console {
    constructor() {
        this.enabled = new Subject(false);
        this.types = {
            errors: new Subject(true),
            warnings: new Subject(true),
            notices: new Subject(false),
        }
        this.messages = [];
        this.height = new Subject(15);
        this.filteredMessages = new Subject([], false);
        this.bindConsole();

        window.onerror = function (message, source, lineno, colno, error) { this.addMessage("error", message); };
    }
    clear() {
        this.messages = [];
        this.updateFilteredMessages();
    }
    toggleEnabled(enabled) {
        this.enabled.value = enabled !== undefined ? enabled : !this.enabled.value;
    }
    toggleNotices() {
        this.types.notices.value = !this.types.notices.value;
        this.updateFilteredMessages();
    }
    toggleWarnings() {
        this.types.warnings.value = !this.types.warnings.value;
        this.updateFilteredMessages();
    }
    toggleErrors() {
        this.types.errors.value = !this.types.errors.value;
        this.updateFilteredMessages();
    }
    increaseHeight() {
        this.height.value = Math.min(90, this.height.value + 10);
    }
    decreaseHeight() {
        this.height.value = Math.max(10, this.height.value - 10);
    }
    addMessage(type, args) {
        const messageText = Array.prototype.slice.call(args).join(" ");
        const existingMessage = this.messages.find(message => {
            return message.message == messageText;
        });
        if (existingMessage) {
            const index = this.messages.findIndex(message => message == existingMessage);
            this.messages.splice(index, 1);
            existingMessage.time = new Date();
            existingMessage.incrementCount();
            this.messages.push(existingMessage);
        } else {
            this.messages.push(new WT_Debug_Console_Message(type, new Date(), messageText));
        }
        this.messages = this.messages.slice(Math.max(0, this.messages.length - 200), 200);
        this.updateFilteredMessages();
    }
    getMessages() {
        return this.messages.filter(message => {
            switch (message.type) {
                case "notice": return this.types.notices.value;
                case "warning": return this.types.warnings.value;
                case "error": return this.types.errors.value;
            }
        });
    }
    updateFilteredMessages() {
        this.filteredMessages.value = this.getMessages();
    }
    bindConsole() {
        const log = console.log;
        console.log = function () {
            this.addMessage("notice", arguments);
            log(...arguments);
        }.bind(this);

        const warn = console.warn;
        console.warn = function () {
            this.addMessage("warning", arguments);
            warn(...arguments);
        }.bind(this);

        const error = console.error;
        console.error = function () {
            this.addMessage("error", arguments);
            error(...arguments);
        }.bind(this);
    }
}

class WT_Debug_Console_View extends WT_HTML_View {
    connectedCallback() {
        this.innerHTML = `
            <div data-element="console" class="console"></div>
        `;
        super.connectedCallback();
    }
    /**
     * @param {WT_Debug_Console} model 
     */
    setModel(model) {
        this.model = model;

        model.filteredMessages.subscribe(messages => {
            DOMUtilities.repopulateElement(this.elements.console, messages);
            this.elements.console.scrollTop = this.elements.console.scrollHeight;
        });

        model.enabled.subscribe(enabled => this.setAttribute("state", enabled ? "enabled" : "disabled"));

        model.height.subscribe(height => {
            this.style.height = `${height}vh`;
            this.elements.console.scrollTop = this.elements.console.scrollHeight;
        });
    }
}
customElements.define("wt-debug-console", WT_Debug_Console_View);

class WT_Debug_Console_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Debug_Console} debugConsole 
     */
    constructor(menus, debugConsole) {
        super(false);

        this.debugConsole = debugConsole;

        this.buttons = {
            notices: new WT_Soft_Key("Notices", () => debugConsole.toggleNotices()),
            warnings: new WT_Soft_Key("Warnings", () => debugConsole.toggleWarnings()),
            errors: new WT_Soft_Key("Errors", () => debugConsole.toggleErrors()),
        }

        this.addSoftKey(1, new WT_Soft_Key("Off", () => {
            debugConsole.toggleEnabled(false);
            menus.back();
        }));
        this.addSoftKey(2, new WT_Soft_Key("Clear", () => debugConsole.clear()));
        this.addSoftKey(3, this.buttons.notices);
        this.addSoftKey(4, this.buttons.warnings);
        this.addSoftKey(5, this.buttons.errors);
        this.addSoftKey(6, new WT_Soft_Key("Size +", () => debugConsole.increaseHeight()));
        this.addSoftKey(7, new WT_Soft_Key("Size -", () => debugConsole.decreaseHeight()));

        debugConsole.types.errors.subscribe(enabled => this.buttons.errors.selected = enabled);
        debugConsole.types.warnings.subscribe(enabled => this.buttons.warnings.selected = enabled);
        debugConsole.types.notices.subscribe(enabled => this.buttons.notices.selected = enabled);

        this.addSoftKey(11, menus.backKey);
    }
    activate() {
        this.debugConsole.toggleEnabled(true);
    }
}