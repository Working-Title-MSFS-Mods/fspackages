class Subject {
    constructor(value = null, inhibitDuplicates = true) {
        this._value = value;
        this.inhibitDuplicates = inhibitDuplicates;
        this.subject = new rxjs.BehaviorSubject(value);
        this.observable = inhibitDuplicates ? this.subject.pipe(rxjs.operators.distinctUntilChanged(), WT_RX.shareReplay()) : this.subject;
    }
    get value() {
        return this.subject.getValue();
    }
    set value(value) {
        this.subject.next(value);
    }
    subscribe(callback) {
        return this.observable.subscribe(callback);
    }
    unsubscribe(callback) {
        throw new Error("Subject.unsubscribe deprecated");
    }
    hasSubscribers() {
        return this.observable.observers.length > 0;
    }
    combineWith(others) {
        if (others instanceof Array) {
            return rxjs.combineLatest([this, ...others].map(s => s.observable));
        } else {
            return rxjs.combineLatest([this, others].map(s => s.observable));
        }
    }
}

class WT_Event {
    constructor() {
        this.listeners = [];
    }
    fire() {
        for (let listener of this.listeners) {
            listener(...arguments);
        }
    }
    subscribe(callback) {
        this.listeners.push(callback);
        return {
            unsubscribe: () => this.unsubscribe(callback)
        };
    }
    unsubscribe(callback) {
        let idx = this.listeners.indexOf(callback);
        this.listeners.splice(idx, 1);
        return null;
    }
    hasSubscribers() {
        return this.listeners.length > 0;
    }
}

class Subscriptions {
    constructor() {
        this.subscriptions = [];
    }
    add(subscription) {
        if (arguments.length > 0) {
            this.subscriptions.push(...arguments);
            return;
        }
        if (subscription instanceof Array) {
            this.subscriptions.push(...subscription);
        } else {
            this.subscriptions.push(subscription);
        }
    }
    unsubscribe() {
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    }
}

class WT_RX {
    static shareReplay(buffer = 1, refCount = true) {
        return rxjs.operators.shareReplay({
            bufferSize: buffer,
            refCount: refCount
        });
    }
    static observeSimVar(update$, simvar, units, distinct = true, log = false) {
        let observable = update$;

        const pipes = [rxjs.operators.map(() => SimVar.GetSimVarValue(simvar, units))];

        if (log)
            pipes.push(rxjs.operators.tap(v => console.log(`${simvar}: ${v}`)));

        if (distinct)
            pipes.push(rxjs.operators.distinctUntilChanged())

        return observable.pipe(...pipes, WT_RX.shareReplay());
    }
    static observeGlobalVar(update$, globalvar, units, distinct = true) {
        let observable = update$;

        observable = observable.pipe(
            rxjs.operators.map(() => SimVar.GetGlobalVarValue(globalvar, units))
        );

        if (distinct)
            observable = observable.pipe(rxjs.operators.distinctUntilChanged())

        return observable.pipe(WT_RX.shareReplay());
    }
    static observeGameVar(update$, gameVar, units, distinct = true) {
        let observable = update$;

        observable = observable.pipe(
            rxjs.operators.map(() => SimVar.GetGameVarValue(gameVar, units))
        );

        if (distinct)
            observable = observable.pipe(rxjs.operators.distinctUntilChanged())

        return observable.pipe(WT_RX.shareReplay());
    }
    static distinctUntilSignificantChange(delta) {
        return rxjs.pipe(
            rxjs.operators.scan((acc, current) => {
                if (acc === null) {
                    return current;
                }
                return Math.abs(acc - current) > delta ? current : acc
            }, null),
            rxjs.operators.distinctUntilChanged()
        );
    }
    static distinctMap(map) {
        return rxjs.pipe(
            rxjs.operators.map(map),
            rxjs.operators.distinctUntilChanged()
        );
    }
    static interpolateTo(divisor, threshhold = null) {
        if (threshhold) {
            return rxjs.pipe(
                rxjs.operators.scan((result, current) => {
                    const delta = current - result;
                    if (Math.abs(delta) < threshhold) {
                        return current;
                    }
                    return result + delta / divisor
                }, 0),
                rxjs.operators.distinctUntilChanged()
            );
        } else {
            return rxjs.pipe(
                rxjs.operators.scan((result, current) => {
                    if (current === null)
                        return null;
                    if (result === null)
                        result = 0;
                    return result + (current - result) / divisor
                }, 0),
                rxjs.operators.distinctUntilChanged()
            );
        }
    }
    /**
     * @param {HTMLElement} element 
     */
    static setInnerHtml(element) {
        return v => element.innerHTML = v;
    }
    /**
     * @param {HTMLElement} element 
     */
    static setTextContent(element) {
        return v => element.textContent = v;
    }
    static setValue(element) {
        return v => element.value = v;
    }
    /**
     * Update at a specific frequency with an offset
     * @param {rxjs.Observable} frame$ 
     * @param {Number} offset Offset from start of each boundary (prevents many overlapping updates)
     * @param {Number} frequency Seconds between updates
     */
    static frameUpdate(frame$, offset = 0, frequency = 1) {
        return frame$.pipe(WT_RX.distinctMap(v => Math.floor(v / frequency + offset)))
    }
    static toggleSwitchMap(trueObservable, falseObservable) {
        return rxjs.operators.switchMap(b => b ? trueObservable : falseObservable)
    }
}