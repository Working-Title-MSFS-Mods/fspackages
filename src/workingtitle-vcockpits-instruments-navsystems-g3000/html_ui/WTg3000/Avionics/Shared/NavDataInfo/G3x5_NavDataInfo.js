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

/**
 * @abstract
 */
class WT_G3x5_NavDataInfoViewFormatter {
    /**
     * Formats a nav data info's current value for a nav data info view.
     * @param {WT_G3x5_NavDataInfo} navDataInfo - a nav data info object.
     * @param {WT_G3x5_NavDataInfoView} view - a nav data info view.
     */
    format(navDataInfo, view) {
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
     * Formats a nav data info's current value for a nav data info view.
     * @param {WT_G3x5_NavDataInfo} navDataInfo - a nav data info object.
     * @param {WT_G3x5_NavDataInfoView} view - a nav data info view.
     */
    format(navDataInfo, view) {
        view.setNumberUnitValue(this._getNumberText(navDataInfo), this._getUnitText(navDataInfo));
    }
}

class WT_G3x5_NavDataInfoViewDegreeFormatter extends WT_G3x5_NavDataInfoViewNumberFormatter {
    /**
     * Formats a nav data info's current value for a nav data info view.
     * @param {WT_G3x5_NavDataInfo} navDataInfo - a nav data info object.
     * @param {WT_G3x5_NavDataInfoView} view - a nav data info view.
     */
    format(navDataInfo, view) {
        view.setNumberUnitValue(`${this._getNumberText(navDataInfo)}${this._getUnitText(navDataInfo)}`, "");
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

class WT_G3x5_NavDataInfoViewTimeFormatter extends WT_G3x5_NavDataInfoViewFormatter {
    /**
     * @param {String} [defaultText]
     * @param {{isDefault(value:WT_Time):Boolean}} [defaultChecker]
     */
    constructor(defaultText = "__:__", defaultChecker = {isDefault: time => !time.isValid()}) {
        super();

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
     * @returns {String}
     */
    _getFormattedTime(navDataInfo) {
        let time = navDataInfo.getValue();
        let format = navDataInfo.getFormat();
        if (format !== WT_G3x5_TimeFormatSetting.Mode.UTC) {
            time = this._offsetTime.set(time).add(navDataInfo.getLocalOffset());
        }
        return time.format(WT_Timezone.UTC, this._getFormatString(format));
    }

    /**
     *
     * @param {WT_G3x5_NavDataInfoTime} navDataInfo
     * @returns {String}
     */
    _getFormattedSuffix(navDataInfo) {
        let format = navDataInfo.getFormat();
        switch (format) {
            case WT_G3x5_TimeFormatSetting.Mode.UTC:
                return "UTC";
            case WT_G3x5_TimeFormatSetting.Mode.LOCAL_24_HOUR:
                return "LCL";
            case WT_G3x5_TimeFormatSetting.Mode.LOCAL_12_HOUR:
                let time = navDataInfo.getValue();
                if (this._defaultChecker.isDefault(time)) {
                    return "LCL";
                } else {
                    time = this._offsetTime.set(time).add(navDataInfo.getLocalOffset());
                    return time.format(WT_Timezone.UTC, "{ampm}").toUpperCase();
                }
            default:
                return "";
        }
    }

    /**
     * Formats a nav data info's current value for a nav data info view.
     * @param {WT_G3x5_NavDataInfo} navDataInfo - a nav data info object.
     * @param {WT_G3x5_NavDataInfoView} view - a nav data info view.
     */
    format(navDataInfo, view) {
        let time = navDataInfo.getValue();
        let numberText = this._defaultChecker.isDefault(time) ? this._defaultText : this._getFormattedTime(navDataInfo);
        let unitText = this._getFormattedSuffix(navDataInfo);
        view.setNumberUnitValue(numberText, unitText);
    }
}
WT_G3x5_NavDataInfoViewTimeFormatter.FORMAT_STRINGS = [
    `{hour-pad}:{minute-pad}`,
    `{hour-24-pad}:{minute-pad}`,
    `{hour-24-pad}:{minute-pad}`
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

    async _defineChildren() {
        this._title = new WT_CachedElement(this.shadowRoot.querySelector("#title"), {cacheAttributes: false});
        this._numberUnitValue = await WT_CustomElementSelector.select(this.shadowRoot, "#numberunitvalue", WT_NumberUnitView);
        this._textValue = new WT_CachedElement(this.shadowRoot.querySelector("#textvalue"), {cacheAttributes: false});
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _clear() {
        this._title.textContent = "";
        this._numberUnitValue.setNumberText("");
        this._numberUnitValue.setUnitText("");
        this._textValue.textContent = "";
    }

    /**
     * Sets the number unit value of this view. This will clear this view's text value.
     * @param {String} numberText - the number component of the new value.
     * @param {String} unitText - the unit component of the new value.
     */
    setNumberUnitValue(numberText, unitText) {
        this._numberUnitValue.setNumberText(numberText);
        this._numberUnitValue.setUnitText(unitText);
        this._textValue.textContent = "";
    }

    /**
     * Sets the text value of this view. This will clear this view's number unit value.
     * @param {String} text - the new text value.
     */
    setTextValue(text) {
        this._textValue.textContent = text;
        this._numberUnitValue.setNumberText("");
        this._numberUnitValue.setUnitText("");
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
            formatter.format(navDataInfo, this);
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
            #numberunitvalue {
                color: var(--navdatainfo-value-color, white);
                --numberunit-unit-font-size: var(--navdatainfo-unit-font-size, 0.75em);
            }
            #textvalue {
                color: var(--navdatainfo-value-color, white);
            }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <wt-numberunit id="numberunitvalue"></wt-numberunit>
        <div id="textvalue"></div>
    </div>
`;

customElements.define(WT_G3x5_NavDataInfoView.NAME, WT_G3x5_NavDataInfoView);