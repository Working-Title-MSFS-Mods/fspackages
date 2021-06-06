/**
 * A type of nav data info that can be assigned to a data field on the navigational data bar.
 */
class WT_G3x5_NavDataInfo {
    /**
     * @param {Object} description - a description object containing the short name and long name of the new nav data info.
     */
    constructor(description) {
        this._shortName = description.shortName;
        this._longName = description.longName;
    }

    /**
     * @readonly
     * @property {String} id - this nav data info's ID string.
     * @type {String}
     */
    get id() {
        return this._shortName;
    }

    /**
     * @readonly
     * @property {String} shortName - this nav data info's short name.
     * @type {String}
     */
    get shortName() {
        return this._shortName;
    }

    /**
     * @readonly
     * @property {String} longName - this nava data info's long name.
     * @type {String}
     */
    get longName() {
        return this._longName;
    }

    /**
     * Gets this nav data info's current value.
     * @returns {*} this nav data info's current value.
     */
    getValue() {
        return null;
    }
}

/**
 * A nav data info type whose value is a WT_NumberUnit object.
 * @abstract
 */
class WT_G3x5_NavDataInfoNumber extends WT_G3x5_NavDataInfo {
    /**
     * @param {Object} description - a description object containing the short name and long name of the new nav data info.
     * @param {WT_NumberUnitModel} numberUnitModel - the number unit model to use for the new nav data info.
     */
    constructor(description, numberUnitModel) {
        super(description);

        this._numberUnitModel = numberUnitModel;
    }

    /**
     * Gets this nav data info's current value.
     * @returns {WT_NumberUnitReadOnly} this nav data info's current value.
     */
    getValue() {
        return this._numberUnitModel.getValue();
    }

    /**
     * Gets this nav data info's display unit type.
     * @returns {WT_Unit} this nav data info's display unit type.
     */
    getDisplayUnit() {
        return this._numberUnitModel.getUnit();
    }

    /**
     * Sets this nav data info's display unit type. Only unit types of the same family as the unit type of this nav
     * data info's number value are allowed.
     * @param {WT_Unit} unit - the new display unit type.
     */
    setDisplayUnit(unit) {
        this._numberUnitModel.setUnit(unit);
    }
}

/**
 * A nav data info type whose value is a WT_Time object.
 * @abstract
 */
class WT_G3x5_NavDataInfoTime extends WT_G3x5_NavDataInfo {
    /**
     * @param {Object} description - a description object containing the short name and long name of the new nav data info.
     * @param {WT_G3x5_TimeModel} timeModel - the time model to use for the new nav data info.
     */
    constructor(description, timeModel) {
        super(description);

        this._timeModel = timeModel;
    }

    /**
     * Gets this nav data info's current value.
     * @returns {WT_TimeReadOnly} this nav data info's current value.
     */
    getValue() {
        return this._timeModel.getTime();
    }

    /**
     * Gets this nav data info's current time format.
     * @returns {WT_G3x5_TimeFormatSetting.Mode} this nav data info's current time format.
     */
    getFormat() {
        return this._timeModel.getFormat();
    }

    /**
     * Gets this nav data info's current time format string.
     * @returns {String} this nav data info's current time format string.
     */
    getFormatString() {
        return this._timeModel.getFormatString();
    }

    /**
     * Gets this nav data info's current local time offset.
     * @returns {WT_NumberUnitReadOnly} this nav data info's current local time offset.
     */
    getLocalOffset() {
        return this._timeModel.getLocalOffset();
    }
}

class WT_G3x5_NavDataInfoViewFormatter {
    /**
     * Gets the display HTML string of a nav data info's current value.
     * @param {WT_G3x5_NavDataInfo} navDataInfo - a nav data info object.
     * @returns {String} the HTML string of the nav data info's current value.
     */
    getDisplayHTML(navDataInfo) {
        return "";
    }
}

class WT_G3x5_NavDataInfoViewNumberFormatter extends WT_G3x5_NavDataInfoViewFormatter {
    /**
     * @param {WT_NumberFormatter} formatter
     * @param {String} [defaultText]
     * @param {{isDefault(value:WT_NumberUnit):Boolean}} [defaultChecker]
     */
    constructor(formatter, defaultText = "___", defaultChecker = {isDefault: value => value.isNaN()}) {
        super();

        this._formatter = formatter;
        this._defaultText = defaultText;
        this._defaultChecker = defaultChecker;
    }

    /**
     * Gets the number part of the formatted display text of a nav data info's value.
     * @param {WT_G3x5_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} a formatted text representation of a nav data info's current value.
     */
    _getNumberText(navDataInfo) {
        let value = navDataInfo.getValue();
        return this._defaultChecker.isDefault(value) ? this._defaultText : this._formatter.getFormattedNumber(value, navDataInfo.getDisplayUnit());
    }

    /**
     * Gets the unit part of the formatted display text of a nav data info's value.
     * @param {WT_G3x5_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} a formatted text representation of a nav data info's current display unit.
     */
    _getUnitText(navDataInfo) {
        return this._formatter.getFormattedUnit(navDataInfo.getValue(), navDataInfo.getDisplayUnit());
    }

    /**
     * Gets the display HTML string of a nav data info's current value.
     * @param {WT_G3x5_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} the HTML string of the nav data info's current value.
     */
    getDisplayHTML(navDataInfo) {
        return `<span>${this._getNumberText(navDataInfo)}</span><span class="${WT_G3x5_NavDataInfoView.UNIT_CLASS}">${this._getUnitText(navDataInfo)}</span>`;
    }
}

class WT_G3x5_NavDataInfoViewDegreeFormatter extends WT_G3x5_NavDataInfoViewNumberFormatter {
    /**
     * Gets the display HTML string of a nav data info's current value.
     * @param {WT_G3x5_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} the HTML string of the nav data info's current value.
     */
    getDisplayHTML(navDataInfo) {
        return `${this._getNumberText(navDataInfo)}${this._getUnitText(navDataInfo)}`;
    }
}

class WT_G3x5_NavDataInfoViewDurationFormatter extends WT_G3x5_NavDataInfoViewNumberFormatter {
    /**
     * Gets the unit part of the formatted display text of a nav data info's value.
     * @param {WT_G3x5_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} a formatted text representation of a nav data info's current display unit.
     */
    _getUnitText(navDataInfo) {
        return "";
    }
}

class WT_G3x5_NavDataInfoViewTimeFormatter {
    /**
     * @param {String} [defaultText]
     * @param {{isDefault(value:WT_Time):Boolean}} [defaultChecker]
     */
    constructor(defaultText = "__:__", defaultChecker = {isDefault: time => !time.isValid()}) {
        this._defaultText = defaultText;
        this._defaultChecker = defaultChecker;

        this._offsetTime = new WT_Time();
    }

    /**
     *
     * @param {WT_G3x5_TimeFormatSetting.Mode} timeFormat
     * @returns {String}
     */
    _getFormatString(timeFormat) {
        return WT_G3x5_NavDataInfoViewTimeFormatter.FORMAT_STRINGS[timeFormat];
    }

    /**
     *
     * @param {WT_G3x5_NavDataInfoTime} navDataInfo
     * @param {WT_TimeObject} time
     * @returns {String}
     */
    _getFormattedTime(navDataInfo, time) {
        let format = navDataInfo.getFormat();
        if (format !== WT_G3x5_TimeFormatSetting.Mode.UTC) {
            time = this._offsetTime.set(time).add(navDataInfo.getLocalOffset());
        }
        return time.format(WT_Timezone.UTC, this._getFormatString(format));
    }

    /**
     * Gets the display HTML string of a nav data info's current value.
     * @param {WT_G3x5_NavDataInfoTime} navDataInfo - a nav data info object.
     * @returns {String} the HTML string of the nav data info's current value.
     */
    getDisplayHTML(navDataInfo) {
        let time = navDataInfo.getValue();
        return this._defaultChecker.isDefault(time) ? this._defaultText : this._getFormattedTime(navDataInfo, time);
    }
}
WT_G3x5_NavDataInfoViewTimeFormatter.FORMAT_STRINGS = [
    `{hour-pad}:{minute-pad}<span class="unit" style="text-transform: uppercase;">{ampm}</span>`,
    `{hour-24-pad}:{minute-pad}`,
    `{hour-24-pad}:{minute-pad}<span class="unit">UTC</span>`
];

class WT_G3x5_NavDataInfoViewRecycler extends WT_HTMLElementRecycler {
    _createElement() {
        let element = new WT_G3x5_NavDataInfoView();
        element.slot = "fields";
        return element;
    }
}

class WT_G3x5_NavDataInfoView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_NavDataInfoView.TEMPLATE.content.cloneNode(true));

        this._isInit = false;
    }

    _defineChildren() {
        this._title = new WT_CachedElement(this.shadowRoot.querySelector(`#title`), {cacheAttributes: false});
        this._value = new WT_CachedElement(this.shadowRoot.querySelector(`#value`), {cacheAttributes: false});
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    _clear() {
        this._title.innerHTML = "";
        this._value.innerHTML = "";
    }

    /**
     *
     * @param {WT_G3x5_NavDataInfo} navDataInfo
     * @param {WT_G3x5_NavDataInfoViewFormatter} formatter
     */
    update(navDataInfo, formatter) {
        if (!this._isInit) {
            return;
        }

        if (navDataInfo) {
            this._title.innerHTML = navDataInfo.shortName;
            this._value.innerHTML = formatter.getDisplayHTML(navDataInfo);
        } else {
            this._clear();
        }
    }
}
WT_G3x5_NavDataInfoView.UNIT_CLASS = "unit";
WT_G3x5_NavDataInfoView.NAME = "wt-navdatainfo-view";
WT_G3x5_NavDataInfoView.TEMPLATE = document.createElement("template");
WT_G3x5_NavDataInfoView.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-flow: row nowrap;
            justify-content: var(--navdatainfo-justify-content, flex-start);
            align-items: baseline;
        }
            #title {
                margin-right: 0.5em;
                font-size: var(--navdatainfo-unit-font-size, 0.75em);
                color: var(--navdatainfo-title-color, white);
            }
            #value {
                color: var(--navdatainfo-value-color, white);
            }
                .${WT_G3x5_NavDataInfoView.UNIT_CLASS} {
                    font-size: var(--navdatainfo-unit-font-size, 0.75em);
                }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <div id="value">
        </div>
    </div>
`;

customElements.define(WT_G3x5_NavDataInfoView.NAME, WT_G3x5_NavDataInfoView);