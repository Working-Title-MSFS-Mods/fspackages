class Subject {
    constructor(value) {
        this._value = value;
        this.listeners = [];
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this._value !== value) {
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