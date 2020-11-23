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
        try {
            if (this._value !== value || !this.inhibitDuplicates) {
                this._value = value;
                for (let listener of this.listeners) {
                    listener(this.value);
                }
            }
        } catch (e) {
            console.error(e.message);
            throw e;
        }
    }
    subscribe(callback) {
        this.listeners.push(callback);
        try {
            callback(this.value);
        } catch (e) {
            console.error(e.message);
            throw e;
        }
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
    combineWith(others) {
        if (others instanceof Array) {
            return new CombinedSubject([this, ...others]);
        } else {
            return new CombinedSubject([this, others]);
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
    constructor(subjects, zipFunction = null) {
        this._value = undefined;
        this.listeners = [];
        this.zipFunction = zipFunction;
        this.subjects = subjects;
        this.subscriptions = new Subscriptions();
        for (let subject of subjects) {
            if (!(subject instanceof Subject))
                throw new Error("Tried to create a combined subject with non subjects");
            this.subscriptions.add(subject.subscribe(this.updated.bind(this)));
        }
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this._value != value) {
            this._value = value;
            for (const listener of this.listeners) {
                if (this.zipFunction) {
                    listener(this.value);
                } else {
                    listener(...this.value);
                }
            }
        }
    }
    updated() {
        let values = this.subjects.map(subject => subject.value);
        for (let value of values) {
            if (typeof value == "undefined")
                return;
        }
        if (this.zipFunction) {
            this.value = this.zipFunction(...values);
        } else {
            this.value = values;
        }
    }
    subscribe(callback) {
        this.listeners.push(callback);
        if (typeof this.value != "undefined") {
            if (this.zipFunction) {
                callback(this.value);
            } else {
                callback(...this.value);
            }
        }
        return () => this.unsubscribe(callback);
    }
    unsubscribe(callback) {
        const idx = this.listeners.indexOf(callback);
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