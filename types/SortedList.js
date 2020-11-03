/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class SortedList {
    constructor() {
        this._list = [];
    }

    get length() {
        return this._list.length;
    }

    clear() {
        this._list = [];
    }

    add(e, from = 0, to = NaN) {
        if (from >= this.length) {
            let ec = e.clone();
            this._list.push(ec);
            return ec;
        }
        if (isNaN(to)) {
            to = this.length;
        }
        let i = Math.floor((from + to) * 0.5);
        let comparison = e.compare(this._list[i]);
        if (comparison === 0) {
            return this._list[i];
        }
        if (i === from) {
            if (comparison < 0) {
                let ec = e.clone();
                this._list.splice(i, 0, ec);
                return ec;
            } else {
                let ec = e.clone();
                this._list.splice(i + 1, 0, ec);
                return ec;
            }
        }
        if (comparison < 0) {
            return this.add(e, from, i);
        } else {
            return this.add(e, i + 1, to);
        }
    }

    get(i) {
        return this._list[i];
    }
}