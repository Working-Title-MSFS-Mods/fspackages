class Subject {
    constructor(value = null, inhibitDuplicates = true) {
        this._value = value;
        this.inhibitDuplicates = inhibitDuplicates;
        this.subject = new rxjs.BehaviorSubject(value);
        this.observable = inhibitDuplicates ? this.subject.pipe(rxjs.operators.distinctUntilChanged()) : this.subject;
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