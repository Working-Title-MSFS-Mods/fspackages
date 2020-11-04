class Subject {
    constructor(value, inhibitDuplicates = true) {
        this._value = value;
        this.inhibitDuplicates = inhibitDuplicates;
        this.listeners = [];
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this._value !== value || !this.inhibitDuplicates) {
            this._value = value;
            for (let listener of this.listeners) {
                listener(this.value);
            }
        }
    }
    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.value);
        return () => this.unsubscribe(callback);
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
        return () => this.unsubscribe(callback);
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

class CombinedSubject {
    constructor(subjects, callback) {
        this._value = undefined;
        this.listeners = [];
        this.callback = callback;
        this.subjects = subjects;
        for (let subject of subjects) {
            if (!(subject instanceof Subject))
                throw new Error("Tried to create a combined subject with non subjects");
            subject.subscribe(this.updated.bind(this));
        }
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this._value != value) {
            this._value = value;
            for (let listener of this.listeners) {
                listener(this.value);
            }
        }
    }
    updated() {
        let values = this.subjects.map(subject => subject.value);
        for (let value of values) {
            if (typeof value == "undefined")
                return;
        }
        this.value = this.callback(...values);
    }
    subscribe(callback) {
        this.listeners.push(callback);
        if (typeof this.value != "undefined")
            callback(this.value);
        return () => this.unsubscribe(callback);
    }
    unsubscribe(callback) {
        let idx = this.listeners.indexOf(callback);
        this.listeners.splice(idx, 1);
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
        this.subscriptions.push(subscription);
    }
    unsubscribe() {
        for (let sub of this.subscriptions) {
            sub();
        }
        this.subscriptions = [];
    }
}