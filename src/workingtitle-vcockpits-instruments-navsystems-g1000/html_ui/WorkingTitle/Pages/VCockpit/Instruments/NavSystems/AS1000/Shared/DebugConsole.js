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

class WT_Toggleable_Subject {
    constructor(initial = true) {
        this.subject = new rxjs.Subject();
        this.observable = this.subject.pipe(
            rxjs.operators.scan((result, current) => {
                if (current === undefined) {
                    return !result;
                } else {
                    return current
                }
            }, initial),
            rxjs.operators.startWith(initial),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        )
    }
    subscribe() {
        return this.observable.subscribe(...arguments);
    }
    pipe() {
        return this.observable.pipe(...arguments);
    }
    toggle() {
        this.subject.next();
    }
    set(value) {
        this.subject.next(value);
    }
}

class WT_Debug_Console {
    /**
     * @param {string} instrumentID
     */
    constructor(instrument, update$, beginUpdate$, endUpdate$) {
        this.prefix = instrument.templateID;
        this.enabled = new WT_Toggleable_Subject(WTDataStore.get(this.dataStoreKey("visible"), false));
        this.types = {
            errors: new WT_Toggleable_Subject(WTDataStore.get(this.dataStoreKey("errors"), true)),
            warnings: new WT_Toggleable_Subject(WTDataStore.get(this.dataStoreKey("warnings"), true)),
            notices: new WT_Toggleable_Subject(WTDataStore.get(this.dataStoreKey("notices"), false)),
        }

        this.newMessage = new rxjs.Subject();
        this.clearMessages = new rxjs.BehaviorSubject(null);

        this.enabled.subscribe(visible => WTDataStore.set(this.dataStoreKey("visible"), visible));
        this.types.notices.subscribe(show => WTDataStore.set(this.dataStoreKey("notices"), show));
        this.types.warnings.subscribe(show => WTDataStore.set(this.dataStoreKey("warnings"), show));
        this.types.errors.subscribe(show => WTDataStore.set(this.dataStoreKey("errors"), show));

        const messageStream$ = this.newMessage.pipe(
            rxjs.operators.scan((messages, newMessage) => {
                const existingMessageIndex = messages.findIndex(message => message.message == newMessage.text);
                if (existingMessageIndex != -1) {
                    const existingMessage = messages[existingMessageIndex];
                    messages.splice(existingMessageIndex, 1);
                    existingMessage.time = new Date();
                    existingMessage.incrementCount();
                    messages.push(existingMessage);
                } else {
                    messages.push(new WT_Debug_Console_Message(newMessage.type, new Date(), newMessage.text));
                }
                return messages.slice(-100);
            }, []),
            rxjs.operators.startWith([])
        );

        const messages$ = this.clearMessages.pipe(rxjs.operators.switchMapTo(messageStream$));
        const filter$ = rxjs.combineLatest(this.types.notices.observable, this.types.warnings.observable, this.types.errors.observable).pipe(
            rxjs.operators.map(([notices, warnings, errors]) => ({ notices: notices, warnings: warnings, errors: errors })),
            rxjs.operators.shareReplay(1)
        );
        this.filteredMessages = rxjs.combineLatest(messages$, filter$).pipe(
            rxjs.operators.map(([messages, filter]) => messages.filter(message => {
                switch (message.type) {
                    case "notice": return filter.notices;
                    case "warning": return filter.warnings;
                    case "error": return filter.errors;
                }
            })),
            rxjs.operators.shareReplay(1),
        )
        this.bindConsole();

        const now = () => window.performance.now();
        const frameTime$ = rxjs.zip(
            beginUpdate$.pipe(
                rxjs.operators.map(now)
            ),
            endUpdate$.pipe(
                rxjs.operators.map(now)
            ),
            (begin, end) => end - begin
        );

        const sampleFrames = 5;
        /*this.avionicsUpdateFps = frameTime$.pipe(
            rxjs.operators.map(time => time / 1000),
            rxjs.operators.bufferCount(sampleFrames),
            rxjs.operators.map(values => sampleFrames / values.reduce((total, value) => total + value, 0))
        );*/

        this.avionicsUpdateFps = frameTime$.pipe(
            /*rxjs.operators.bufferCount(sampleFrames, 1),
            rxjs.operators.map(values => values.reduce((total, value) => total + value, 0) / sampleFrames)*/
            rxjs.operators.scan((acc, current) => acc + (current - acc) / 5, 0)
        );

        /*this.avionicsFps = update$.pipe(
            rxjs.operators.scan(total => (total + 1) % sampleFrames, 0),
            rxjs.operators.filter(value => value == 0),
            rxjs.operators.map(() => window.performance.now()),
            rxjs.operators.pairwise(),
            rxjs.operators.map(([a, b]) => sampleFrames / ((b - a) / 1000))
        );*/

        this.avionicsFps = update$.pipe(
            rxjs.operators.map(() => window.performance.now()),
            rxjs.operators.pairwise(),
            rxjs.operators.map(([a, b]) => b - a),
            rxjs.operators.scan((acc, current) => acc + (current - acc) / 5, 0),
            rxjs.operators.map(u => 1 / (u / 1000))
        );

        this.gameFps = update$.pipe(
            rxjs.operators.scan((acc, current) => acc + (current - acc) / 5, 0),
            rxjs.operators.map(averageFrameTime => 1000 / averageFrameTime)
        );

        window.onerror = function (message, source, lineno, colno, error) {
            console.error(`${source}:${lineno}:${colno}\n${message}\n${error.stack}`);
        };

        const getSimVarValue = SimVar.GetSimVarValue;
        this.numSimVarCalls = 0;
        SimVar.GetSimVarValue = (name, unit, dataSource = "") => {
            this.numSimVarCalls++;
            return getSimVarValue(name, unit, dataSource);
        }

        this.simVarCalls = endUpdate$.pipe(
            rxjs.operators.map(() => {
                const value = this.numSimVarCalls;
                this.numSimVarCalls = 0;
                return value;
            })
        )
    }
    dataStoreKey(variable) {
        return `DebugConsole.${this.prefix}.${variable}`;
    }
    clear() {
        this.clearMessages.next(null);
    }
    toggleEnabled(enabled) {
        this.enabled.set(enabled);
    }
    toggleNotices() {
        this.types.notices.toggle();
    }
    toggleWarnings() {
        this.types.warnings.toggle();
    }
    toggleErrors() {
        this.types.errors.toggle();
    }
    addMessage(type, args) {
        this.newMessage.next({
            text: Array.prototype.slice.call(args).join(" "),
            type: type
        });

        if (type == "error") {
            this.enabled.set(true);
        }
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
            <div class="toolbar">
                <span data-element="avionicsUpdateFps"></span>
                <span data-element="avionicsFps"></span>
                <span data-element="gameFps"></span>
                <span data-element="simVarCalls"></span>
            </div>
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

        model.enabled.observable.subscribe(enabled => this.setAttribute("state", enabled ? "enabled" : "disabled"));

        model.types.errors.observable.subscribe(enabled => this.elements.errorsButton.classList.toggle("selected", enabled));
        model.types.warnings.observable.subscribe(enabled => this.elements.warningsButton.classList.toggle("selected", enabled));
        model.types.notices.observable.subscribe(enabled => this.elements.noticesButton.classList.toggle("selected", enabled));

        function mouseEventToXY(e) {
            return {
                x: e.clientX,
                y: e.clientY
            }
        }

        function compareXY(a, b) {
            return a.x == b.x && a.y == b.y;
        }

        const mouseMove$ = rxjs.fromEvent(window.document, "mousemove").pipe(
            rxjs.operators.map(mouseEventToXY),
            rxjs.operators.share()
        )

        const mouseUp$ = rxjs.fromEvent(window.document, "mouseup").pipe(
            rxjs.operators.filter(e => e.button == 0)
        );

        rxjs.fromEvent(this, "mousedown").pipe(
            rxjs.operators.filter(e => e.button == 0),
            rxjs.operators.switchMap(e => {
                const startMousePosition = mouseEventToXY(e);
                const startPosition = {
                    x: this.offsetLeft,
                    y: this.offsetTop
                };
                return mouseMove$.pipe(
                    rxjs.operators.takeUntil(mouseUp$),
                    rxjs.operators.map(position => ({
                        x: position.x - startMousePosition.x,
                        y: position.y - startMousePosition.y
                    })),
                    rxjs.operators.map(delta => ({
                        x: startPosition.x + delta.x,
                        y: startPosition.y + delta.y
                    }))
                )
            }),
            rxjs.operators.startWith({
                x: WTDataStore.get(this.model.dataStoreKey("x"), this.offsetLeft),
                y: WTDataStore.get(this.model.dataStoreKey("y"), this.offsetTop)
            }),
            rxjs.operators.map(position => ({
                x: Math.max(0, Math.min(window.innerWidth - this.offsetWidth, position.x)),
                y: Math.max(0, Math.min(window.innerHeight - this.offsetHeight, position.y))
            })),
            rxjs.operators.distinctUntilChanged(compareXY),
            rxjs.operators.tap(position => {
                this.style.left = `${position.x}px`;
                this.style.top = `${position.y}px`;
            }),
            rxjs.operators.debounceTime(1000),
            rxjs.operators.tap(position => {
                WTDataStore.set(this.model.dataStoreKey("x"), position.x);
                WTDataStore.set(this.model.dataStoreKey("y"), position.y);
            })
        ).subscribe();

        rxjs.fromEvent(this.elements.resize, "mousedown").pipe(
            rxjs.operators.tap(e => e.cancelBubble = true),
            rxjs.operators.filter(e => e.button == 0),
            rxjs.operators.switchMap(e => {
                const startMousePosition = mouseEventToXY(e);
                const startDimensions = {
                    x: this.offsetWidth,
                    y: this.offsetHeight
                };
                return mouseMove$.pipe(
                    rxjs.operators.takeUntil(mouseUp$),
                    rxjs.operators.map(position => ({
                        x: position.x - startMousePosition.x,
                        y: position.y - startMousePosition.y
                    })),
                    rxjs.operators.map(delta => ({
                        x: startDimensions.x + delta.x,
                        y: startDimensions.y + delta.y
                    }))
                )
            }),
            rxjs.operators.startWith({
                x: WTDataStore.get(this.model.dataStoreKey("w"), 500),
                y: WTDataStore.get(this.model.dataStoreKey("h"), 200)
            }),
            rxjs.operators.map(dimensions => ({
                x: Math.max(400, dimensions.x),
                y: Math.max(200, dimensions.y)
            })),
            rxjs.operators.distinctUntilChanged(compareXY),
            rxjs.operators.tap(dimensions => {
                this.style.width = `${dimensions.x}px`;
                this.style.height = `${dimensions.y}px`;
            }),
            rxjs.operators.debounceTime(1000),
            rxjs.operators.tap(dimensions => {
                WTDataStore.set(this.model.dataStoreKey("w"), dimensions.x);
                WTDataStore.set(this.model.dataStoreKey("h"), dimensions.y);
            })
        ).subscribe();

        model.avionicsUpdateFps.pipe(
            rxjs.operators.map(fps => fps.toFixed(1)),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(fps => this.elements.avionicsUpdateFps.textContent = `U: ${fps}`);

        model.avionicsFps.pipe(
            rxjs.operators.map(fps => fps.toFixed()),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(fps => this.elements.avionicsFps.textContent = `AV: ${fps}`);

        model.gameFps.pipe(
            rxjs.operators.map(fps => fps.toFixed()),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(fps => this.elements.gameFps.textContent = `GM: ${fps}`);

        model.simVarCalls.pipe(
            rxjs.operators.distinctUntilChanged()
        ).subscribe(call => this.elements.simVarCalls.textContent = `SV: ${call}`);
    }
}
customElements.define("wt-debug-console", WT_Debug_Console_View);