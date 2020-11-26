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
    /**
     * @param {NavSystem} instrument 
     */
    constructor(instrument) {
        this.prefix = instrument.templateID;
        this.enabled = new Subject(WTDataStore.get(this.dataStoreKey("visible"), false));
        this.types = {
            errors: new Subject(WTDataStore.get(this.dataStoreKey("errors"), true)),
            warnings: new Subject(WTDataStore.get(this.dataStoreKey("warnings"), true)),
            notices: new Subject(WTDataStore.get(this.dataStoreKey("notices"), false)),
        }
        this.messages = [];
        this.filteredMessages = new Subject([], false);
        this.bindConsole();

        window.onerror = function (message, source, lineno, colno, error) { this.addMessage("error", message); };
    }
    dataStoreKey(variable) {
        return `DebugConsole.${this.prefix}.${variable}`;
    }
    clear() {
        this.messages = [];
        this.updateFilteredMessages();
    }
    toggleEnabled(enabled) {
        this.enabled.value = enabled !== undefined ? enabled : !this.enabled.value;
        WTDataStore.set(this.dataStoreKey("visible"), this.enabled.value);
    }
    toggleNotices() {
        this.types.notices.value = !this.types.notices.value;
        this.updateFilteredMessages();
        WTDataStore.set(this.dataStoreKey("notices"), this.types.notices.value);
    }
    toggleWarnings() {
        this.types.warnings.value = !this.types.warnings.value;
        this.updateFilteredMessages();
        WTDataStore.set(this.dataStoreKey("warnings"), this.types.warnings.value);
    }
    toggleErrors() {
        this.types.errors.value = !this.types.errors.value;
        this.updateFilteredMessages();
        WTDataStore.set(this.dataStoreKey("errors"), this.types.errors.value);
    }
    addMessage(type, args) {
        const messageText = Array.prototype.slice.call(args).join(" ");
        const existingMessageIndex = this.messages.findIndex(message => message.message == messageText);
        if (existingMessageIndex != -1) {
            const existingMessage = this.messages[existingMessageIndex];
            this.messages.splice(existingMessageIndex, 1);
            existingMessage.time = new Date();
            existingMessage.incrementCount();
            this.messages.push(existingMessage);
        } else {
            this.messages.push(new WT_Debug_Console_Message(type, new Date(), messageText));
        }
        this.messages = this.messages.slice(Math.max(0, this.messages.length - 200), 200);
        this.updateFilteredMessages();

        if (type == "error" || type == "warning") {
            this.enabled.value = true;
        }
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
            <div class="buttons">
                <button data-click="clear">Clear</button>
                <button data-click="toggleNotices" data-element="noticesButton">Notices</button>
                <button data-click="toggleWarnings" data-element="warningsButton">Warnings</button>
                <button data-click="toggleErrors" data-element="errorsButton">Errors</button>
            </div>
            <div data-element="console" class="console"></div>
            <div class="resize" data-element="resize"></div>
        `;
        super.connectedCallback();
    }
    initResizeHandle() {
        const handle = this.elements.resize;
        const w = WTDataStore.get(this.model.dataStoreKey("w"), 500);
        const h = WTDataStore.get(this.model.dataStoreKey("h"), 200);
        this.updateDimensions(w, h);

        let mousePosition = null;
        const moveHandler = e => {
            const width = Math.max(200, e.clientX - this.offsetLeft);
            const height = Math.max(200, e.clientY - this.offsetTop);
            this.updateDimensions(width, height);
            this.saveDimensions(width, height);
        };
        const mouseUpHandler = e => {
            window.document.removeEventListener("mousemove", moveHandler);
            window.document.removeEventListener("mouseup", mouseUpHandler);
        }

        handle.addEventListener("mousedown", e => {
            if (e.button != 0)
                return;
            mousePosition = { x: e.clientX, y: e.clientY };
            window.document.addEventListener("mousemove", moveHandler);
            window.document.addEventListener("mouseup", mouseUpHandler);
            e.cancelBubble = true;
            e.preventDefault();
            return false;
        });
    }
    updatePosition(x, y) {
        this.style.left = `${x}px`;
        this.style.top = `${y}px`;

        WTDataStore.set(this.model.dataStoreKey("x"), x);
        WTDataStore.set(this.model.dataStoreKey("y"), y);
    }
    updateDimensions(width, height) {
        this.style.width = `${width}px`;
        this.style.height = `${height}px`;
    }
    saveDimensions(width, height) {
        WTDataStore.set(this.model.dataStoreKey("w"), width);
        WTDataStore.set(this.model.dataStoreKey("h"), height);
    }
    toggleNotices() {
        this.model.toggleNotices();
    }
    toggleWarnings() {
        this.model.toggleWarnings();
    }
    toggleErrors() {
        this.model.toggleErrors();
    }
    clear() {
        this.model.clear();
    }
    /**
     * @param {WT_Debug_Console} model 
     */
    setModel(model) {
        this.model = model;

        model.filteredMessages.subscribe(messages => {
            if (messages.length == 0) {
                this.elements.console.innerHTML = "";
            } else {
                DOMUtilities.repopulateElement(this.elements.console, messages);
                this.elements.console.scrollTop = this.elements.console.scrollHeight;
            }
        });

        model.enabled.subscribe(enabled => this.setAttribute("state", enabled ? "enabled" : "disabled"));

        this.position = { x: WTDataStore.get(this.model.dataStoreKey("x"), this.offsetLeft), y: WTDataStore.get(this.model.dataStoreKey("y"), this.offsetTop) };
        this.beginMousePosition = { x: 0, y: 0 };

        const moveHandler = e => {
            const x = Math.max(0, Math.min(window.innerWidth - this.offsetWidth, e.clientX - this.beginMousePosition.x + this.position.x));
            const y = Math.max(0, Math.min(window.innerHeight - this.offsetHeight, e.clientY - this.beginMousePosition.y + this.position.y));
            this.updatePosition(x, y);
        };
        const mouseUpHandler = e => {
            window.document.removeEventListener("mousemove", moveHandler);
            window.document.removeEventListener("mouseup", mouseUpHandler);
        };
        this.addEventListener("mousedown", e => {
            if (e.button != 0)
                return;
            this.position.x = this.offsetLeft;
            this.position.y = this.offsetTop;
            this.beginMousePosition.x = e.clientX;
            this.beginMousePosition.y = e.clientY;
            window.document.addEventListener("mousemove", moveHandler);
            window.document.addEventListener("mouseup", mouseUpHandler);
        });

        this.updatePosition(this.position.x, this.position.y);
        this.initResizeHandle();

        model.types.errors.subscribe(enabled => this.elements.errorsButton.classList.toggle("selected", enabled));
        model.types.warnings.subscribe(enabled => this.elements.warningsButton.classList.toggle("selected", enabled));
        model.types.notices.subscribe(enabled => this.elements.noticesButton.classList.toggle("selected", enabled));
    }
}
customElements.define("wt-debug-console", WT_Debug_Console_View);