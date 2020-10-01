let PopupMenu_ItemType;
(function (PopupMenu_ItemType) {
    PopupMenu_ItemType[PopupMenu_ItemType["TITLE"] = 0] = "TITLE";
    PopupMenu_ItemType[PopupMenu_ItemType["LIST"] = 1] = "LIST";
    PopupMenu_ItemType[PopupMenu_ItemType["RANGE"] = 2] = "RANGE";
    PopupMenu_ItemType[PopupMenu_ItemType["RADIO"] = 3] = "RADIO";
    PopupMenu_ItemType[PopupMenu_ItemType["RADIO_LIST"] = 4] = "RADIO_LIST";
    PopupMenu_ItemType[PopupMenu_ItemType["RADIO_RANGE"] = 5] = "RADIO_RANGE";
    PopupMenu_ItemType[PopupMenu_ItemType["SUBMENU"] = 6] = "SUBMENU";
    PopupMenu_ItemType[PopupMenu_ItemType["CHECKBOX"] = 7] = "CHECKBOX";
})(PopupMenu_ItemType || (PopupMenu_ItemType = {}));
class Menu_Item {
    constructor(_type, _section, _y, _height) {
        this.y = 0;
        this.height = 0;
        this.listVal = 0;
        this.rangeMin = 0;
        this.rangeMax = 0;
        this.rangeStep = 0;
        this.rangeDecimals = 0;
        this.rangeVal = 0;
        this.radioVal = false;
        this.checkboxVal = false;
        this.type = _type;
        this.section = _section;
        this.y = _y;
        this.height = _height;
    }
    get interactive() {
        if (this.type != PopupMenu_ItemType.TITLE)
            return true;
        return false;
    }
    get enabled() {
        if (this.dictKeys != null || this.subMenu)
            return true;
        return false;
    }
}
class Menu_Section {
    constructor() {
        this.items = new Array();
        this.startY = 0;
        this.endY = 0;
        this.interactionColor = "";
        this.defaultRadio = true;
    }
}
class Menu_Handler {
    constructor() {
        this.menuLeft = 0;
        this.menuTop = 0;
        this.menuWidth = 0;
        this.columnLeft1 = 3;
        this.columnLeft2 = 20;
        this.columnLeft3 = 90;
        this.lineHeight = 18;
        this.sectionBorderSize = 1;
        this.textStyle = "Roboto-Regular";
        this.textMarginX = 3;
        this.highlightColor = "cyan";
        this.interactionColor = "cyan";
        this.disabledColor = "grey";
        this.shapeFillColor = "none";
        this.shapeFillIfDisabled = true;
        this.shape3D = false;
        this.shape3DBorderSize = 3;
        this.shape3DBorderLeft = "rgb(100, 100, 100)";
        this.shape3DBorderRight = "rgb(30, 30, 30)";
        this.highlightId = 0;
        this.speedInc = 1.0;
        this.speedInc_UpFactor = 0.25;
        this.speedInc_DownFactor = 0.075;
        this.speedInc_PowFactor = 0.9;
    }
    get height() {
        let height = 0;
        for (let i = 0; i < this.allSections.length; i++) {
            height += this.allSections[i].endY - this.allSections[i].startY;
        }
        return height;
    }
    highlight(_index) {
        if (_index >= 0)
            this.highlightId = _index;
    }
    reset() {
    }
    onUpdate(_dTime) {
        this.updateHighlight();
        this.updateSpeedInc();
    }
    onActivate() {
        if (this.highlightItem && this.highlightItem.enabled) {
            switch (this.highlightItem.type) {
                case PopupMenu_ItemType.RADIO:
                case PopupMenu_ItemType.RADIO_LIST:
                case PopupMenu_ItemType.RADIO_RANGE:
                    let changed = false;
                    let section = this.highlightItem.section;
                    for (let i = 0; i < section.items.length; i++) {
                        let item = section.items[i];
                        if (item.radioElem) {
                            if (item == this.highlightItem) {
                                if (!item.radioVal) {
                                    this.activateItem(item, true);
                                    changed = true;
                                }
                                else if (!section.defaultRadio) {
                                    this.activateItem(item, false);
                                    changed = true;
                                }
                            }
                            else if (item.radioVal) {
                                this.activateItem(item, false);
                            }
                        }
                    }
                    if (changed)
                        this.onChanged(this.highlightItem);
                    break;
                case PopupMenu_ItemType.SUBMENU:
                    this.highlightItem.subMenu();
                    break;
                case PopupMenu_ItemType.CHECKBOX:
                    if (!this.highlightItem.checkboxVal) {
                        this.activateItem(this.highlightItem, true);
                    }
                    else {
                        this.activateItem(this.highlightItem, false);
                        this.highlightItem.checkboxVal = false;
                    }
                    this.onChanged(this.highlightItem);
                    break;
            }
        }
    }
    onDataDec() {
        if (this.highlightItem && this.highlightItem.enabled) {
            switch (this.highlightItem.type) {
                case PopupMenu_ItemType.LIST:
                case PopupMenu_ItemType.RADIO_LIST:
                    if (this.highlightItem.listVal > 0) {
                        this.highlightItem.listVal--;
                        this.highlightItem.listElem.textContent = this.highlightItem.listValues[this.highlightItem.listVal];
                        this.onChanged(this.highlightItem);
                    }
                    break;
                case PopupMenu_ItemType.RANGE:
                case PopupMenu_ItemType.RADIO_RANGE:
                    if (this.highlightItem.rangeVal > this.highlightItem.rangeMin) {
                        this.highlightItem.rangeVal -= this.highlightItem.rangeStep * this.getSpeedAccel();
                        this.highlightItem.rangeVal = Math.max(this.highlightItem.rangeVal, this.highlightItem.rangeMin);
                        this.highlightItem.rangeElem.textContent = this.highlightItem.rangeVal.toFixed(this.highlightItem.rangeDecimals);
                        this.onChanged(this.highlightItem);
                        this.speedInc += this.speedInc_UpFactor;
                    }
                    break;
            }
        }
    }
    onDataInc() {
        if (this.highlightItem && this.highlightItem.enabled) {
            switch (this.highlightItem.type) {
                case PopupMenu_ItemType.LIST:
                case PopupMenu_ItemType.RADIO_LIST:
                    if (this.highlightItem.listVal < this.highlightItem.listValues.length - 1) {
                        this.highlightItem.listVal++;
                        this.highlightItem.listElem.textContent = this.highlightItem.listValues[this.highlightItem.listVal];
                        this.onChanged(this.highlightItem);
                    }
                    break;
                case PopupMenu_ItemType.RANGE:
                case PopupMenu_ItemType.RADIO_RANGE:
                    if (this.highlightItem.rangeVal < this.highlightItem.rangeMax) {
                        this.highlightItem.rangeVal += this.highlightItem.rangeStep * this.getSpeedAccel();
                        this.highlightItem.rangeVal = Math.min(this.highlightItem.rangeVal, this.highlightItem.rangeMax);
                        this.highlightItem.rangeElem.textContent = this.highlightItem.rangeVal.toFixed(this.highlightItem.rangeDecimals);
                        this.onChanged(this.highlightItem);
                        this.speedInc += this.speedInc_UpFactor;
                    }
                    break;
            }
        }
    }
    onMenuDec() {
        if (this.highlightId > 0)
            this.highlightId--;
    }
    onMenuInc() {
        this.highlightId++;
    }
    onEscape() {
        if (this.escapeCbk)
            this.escapeCbk();
    }
    openMenu() {
        this.allSections = [];
        this.sectionRoot = null;
        this.highlightItem = null;
        this.highlightId = 0;
        this.escapeCbk = null;
        this.sectionRoot = document.createElementNS(Avionics.SVG.NS, "g");
        this.sectionRoot.setAttribute("transform", "translate(" + this.menuLeft + " " + this.menuTop + ")");
        return this.sectionRoot;
    }
    closeMenu() {
        let bg = document.createElementNS(Avionics.SVG.NS, "rect");
        bg.setAttribute("x", "0");
        bg.setAttribute("y", "0");
        bg.setAttribute("width", this.menuWidth.toString());
        bg.setAttribute("height", this.height.toString());
        bg.setAttribute("fill", "black");
        this.sectionRoot.insertBefore(bg, this.sectionRoot.firstChild);
        this.highlightElem = document.createElementNS(Avionics.SVG.NS, "rect");
        this.highlightElem.setAttribute("x", "0");
        this.highlightElem.setAttribute("y", "0");
        this.highlightElem.setAttribute("width", this.menuWidth.toString());
        this.highlightElem.setAttribute("height", this.lineHeight.toString());
        this.highlightElem.setAttribute("fill", "none");
        this.highlightElem.setAttribute("stroke", this.highlightColor);
        this.highlightElem.setAttribute("stroke-width", (this.sectionBorderSize + 1).toString());
        this.sectionRoot.appendChild(this.highlightElem);
        if (this.dictionary)
            this.dictionary.changed = false;
    }
    beginSection(_defaultRadio = true) {
        this.section = new Menu_Section();
        this.section.interactionColor = this.interactionColor;
        this.section.defaultRadio = _defaultRadio;
        if (this.allSections.length > 0) {
            this.section.startY = this.allSections[this.allSections.length - 1].endY;
            this.section.endY = this.section.startY;
        }
    }
    endSection() {
        let stroke = document.createElementNS(Avionics.SVG.NS, "rect");
        stroke.setAttribute("x", "0");
        stroke.setAttribute("y", this.section.startY.toString());
        stroke.setAttribute("width", this.menuWidth.toString());
        stroke.setAttribute("height", (this.section.endY - this.section.startY).toString());
        stroke.setAttribute("fill", "none");
        stroke.setAttribute("stroke", "white");
        stroke.setAttribute("stroke-width", this.sectionBorderSize.toString());
        this.sectionRoot.appendChild(stroke);
        let defaultRadio = null;
        for (let i = 0; i < this.section.items.length; i++) {
            let item = this.section.items[i];
            if (item.radioElem) {
                if (this.dictionary && item.dictKeys && this.dictionary.exists(item.dictKeys[0])) {
                    if (this.dictionary.get(item.dictKeys[0]) == item.radioName) {
                        defaultRadio = item;
                        break;
                    }
                }
                else if (!defaultRadio && this.section.defaultRadio) {
                    defaultRadio = item;
                }
            }
        }
        for (let i = 0; i < this.section.items.length; i++) {
            let item = this.section.items[i];
            let dictIndex = 0;
            let changed = false;
            if (item.radioElem) {
                if (item == defaultRadio) {
                    this.activateItem(item, true);
                    changed = true;
                }
                dictIndex++;
            }
            if (item.listElem) {
                item.listVal = 0;
                if (this.dictionary && item.dictKeys && this.dictionary.exists(item.dictKeys[dictIndex])) {
                    let value = this.dictionary.get(item.dictKeys[dictIndex]);
                    for (let j = 0; j < item.listValues.length; j++) {
                        if (item.listValues[j] == value) {
                            item.listVal = j;
                            break;
                        }
                    }
                }
                item.listElem.textContent = item.listValues[item.listVal];
                changed = true;
            }
            if (item.rangeElem) {
                item.rangeVal = item.rangeMin;
                if (this.dictionary && item.dictKeys && this.dictionary.exists(item.dictKeys[dictIndex])) {
                    item.rangeVal = parseFloat(this.dictionary.get(item.dictKeys[dictIndex]));
                    item.rangeVal = Math.max(item.rangeMin, Math.min(item.rangeVal, item.rangeMax));
                }
                item.rangeElem.textContent = item.rangeVal.toFixed(item.rangeDecimals);
                changed = true;
            }
            if (item.checkboxElem) {
                if (this.dictionary && item.dictKeys && this.dictionary.exists(item.dictKeys[dictIndex])) {
                    if (this.dictionary.get(item.dictKeys[0]) == "ON") {
                        this.activateItem(item, true);
                        changed = true;
                    }
                }
            }
            if (changed)
                this.onChanged(item);
        }
        this.allSections.push(this.section);
        this.section = null;
    }
    addTitle(_text, _textSize, _bgFactor, _bgColor = "blue", _showEscapeIcon = false) {
        let bg = document.createElementNS(Avionics.SVG.NS, "rect");
        bg.setAttribute("x", "0");
        bg.setAttribute("y", this.section.endY.toString());
        bg.setAttribute("width", (this.menuWidth * _bgFactor).toString());
        bg.setAttribute("height", this.lineHeight.toString());
        bg.setAttribute("fill", _bgColor);
        this.sectionRoot.appendChild(bg);
        let posX = this.columnLeft1;
        if (_showEscapeIcon) {
            let arrow = document.createElementNS(Avionics.SVG.NS, "path");
            arrow.setAttribute("d", "M" + posX + " " + (this.section.endY + 2) + " l0 " + (this.lineHeight * 0.38) + " l13 0 l0 -2 l2 2 l-2 2 l0 -2");
            arrow.setAttribute("fill", "none");
            arrow.setAttribute("stroke", "white");
            arrow.setAttribute("stroke-width", "1.5");
            this.sectionRoot.appendChild(arrow);
            posX += 20;
        }
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", posX.toString());
        text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        text.setAttribute("fill", "white");
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let item = new Menu_Item(PopupMenu_ItemType.TITLE, this.section, this.section.endY, this.lineHeight);
        this.section.items.push(item);
        this.section.endY += this.lineHeight;
    }
    addList(_text, _textSize, _values, _dictKeys) {
        let enabled = (_dictKeys != null) ? true : false;
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
        text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let hl = document.createElementNS(Avionics.SVG.NS, "rect");
        hl.setAttribute("x", (this.columnLeft3 - 2).toString());
        hl.setAttribute("y", (this.section.endY + 2).toString());
        hl.setAttribute("width", (this.menuWidth - 2 - (this.columnLeft3 - 2)).toString());
        hl.setAttribute("height", ((this.section.endY + this.lineHeight - 2) - (this.section.endY + 2)).toString());
        hl.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
        hl.setAttribute("visibility", "hidden");
        this.sectionRoot.appendChild(hl);
        let choice = document.createElementNS(Avionics.SVG.NS, "text");
        choice.textContent = _values[0];
        choice.setAttribute("x", this.columnLeft3.toString());
        choice.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        choice.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
        choice.setAttribute("font-size", _textSize.toString());
        choice.setAttribute("font-family", this.textStyle);
        choice.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(choice);
        let item = new Menu_Item(PopupMenu_ItemType.LIST, this.section, this.section.endY, this.lineHeight);
        item.dictKeys = _dictKeys;
        item.listElem = choice;
        item.listValues = _values;
        item.listHLElem = hl;
        this.section.items.push(item);
        this.section.endY += this.lineHeight;
    }
    addRange(_text, _textSize, _min, _max, _step, _dictKeys) {
        let enabled = (_dictKeys != null) ? true : false;
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
        text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let hl = document.createElementNS(Avionics.SVG.NS, "rect");
        hl.setAttribute("x", (this.columnLeft3 - 2).toString());
        hl.setAttribute("y", (this.section.endY + 2).toString());
        hl.setAttribute("width", (this.menuWidth - 2 - (this.columnLeft3 - 2)).toString());
        hl.setAttribute("height", ((this.section.endY + this.lineHeight - 2) - (this.section.endY + 2)).toString());
        hl.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
        hl.setAttribute("visibility", "hidden");
        this.sectionRoot.appendChild(hl);
        let range = document.createElementNS(Avionics.SVG.NS, "text");
        range.setAttribute("x", this.columnLeft3.toString());
        range.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        range.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
        range.setAttribute("font-size", _textSize.toString());
        range.setAttribute("font-family", this.textStyle);
        range.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(range);
        let item = new Menu_Item(PopupMenu_ItemType.RANGE, this.section, this.section.endY, this.lineHeight);
        item.dictKeys = _dictKeys;
        item.rangeElem = range;
        item.rangeHLElem = hl;
        item.rangeMin = _min;
        item.rangeMax = _max;
        item.rangeVal = _min;
        item.rangeStep = _step;
        item.rangeDecimals = Utils.countDecimals(_step);
        this.section.items.push(item);
        this.section.endY += this.lineHeight;
    }
    addRadio(_text, _textSize, _dictKeys) {
        let enabled = (_dictKeys != null) ? true : false;
        let cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
        let cy = this.section.endY + this.lineHeight * 0.5;
        let shape;
        if (this.shape3D) {
            let b = this.shape3DBorderSize;
            let h = Math.min(this.lineHeight, this.columnLeft2) * 0.8;
            let w = h * 0.75;
            if (enabled) {
                let leftBorder = document.createElementNS(Avionics.SVG.NS, "path");
                leftBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " Z");
                leftBorder.setAttribute("fill", this.shape3DBorderLeft);
                this.sectionRoot.appendChild(leftBorder);
                let rightBorder = document.createElementNS(Avionics.SVG.NS, "path");
                rightBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " Z");
                rightBorder.setAttribute("fill", this.shape3DBorderRight);
                this.sectionRoot.appendChild(rightBorder);
            }
            shape = document.createElementNS(Avionics.SVG.NS, "path");
            shape.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5 + b) + " L" + (cx - w * 0.5 + b) + " " + (cy) + " L" + (cx) + " " + (cy + h * 0.5 - b) + " L" + (cx + w * 0.5 - b) + " " + (cy) + " Z");
            shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            if (!enabled) {
                shape.setAttribute("stroke", this.disabledColor);
                shape.setAttribute("stroke-width", "1");
            }
            this.sectionRoot.appendChild(shape);
        }
        else {
            let size = Math.min(this.lineHeight, this.columnLeft2) * 0.33;
            shape = document.createElementNS(Avionics.SVG.NS, "circle");
            shape.setAttribute("cx", cx.toString());
            shape.setAttribute("cy", cy.toString());
            shape.setAttribute("r", size.toString());
            shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
            shape.setAttribute("stroke-width", "1");
            this.sectionRoot.appendChild(shape);
        }
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
        text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let item = new Menu_Item(PopupMenu_ItemType.RADIO, this.section, this.section.endY, this.lineHeight);
        item.dictKeys = _dictKeys;
        item.radioElem = shape;
        item.radioName = _text;
        this.section.items.push(item);
        this.registerWithMouse(item);
        this.section.endY += this.lineHeight;
    }
    addRadioList(_text, _textSize, _values, _dictKeys) {
        let enabled = (_dictKeys != null) ? true : false;
        let cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
        let cy = this.section.endY + this.lineHeight * 0.5;
        let shape;
        if (this.shape3D) {
            let b = this.shape3DBorderSize;
            let h = Math.min(this.lineHeight, this.columnLeft2) * 0.8;
            let w = h * 0.75;
            if (enabled) {
                let leftBorder = document.createElementNS(Avionics.SVG.NS, "path");
                leftBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " Z");
                leftBorder.setAttribute("fill", this.shape3DBorderLeft);
                this.sectionRoot.appendChild(leftBorder);
                let rightBorder = document.createElementNS(Avionics.SVG.NS, "path");
                rightBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " Z");
                rightBorder.setAttribute("fill", this.shape3DBorderRight);
                this.sectionRoot.appendChild(rightBorder);
            }
            shape = document.createElementNS(Avionics.SVG.NS, "path");
            shape.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5 + b) + " L" + (cx - w * 0.5 + b) + " " + (cy) + " L" + (cx) + " " + (cy + h * 0.5 - b) + " L" + (cx + w * 0.5 - b) + " " + (cy) + " Z");
            shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            if (!enabled) {
                shape.setAttribute("stroke", this.disabledColor);
                shape.setAttribute("stroke-width", "1");
            }
            this.sectionRoot.appendChild(shape);
        }
        else {
            let size = Math.min(this.lineHeight, this.columnLeft2) * 0.33;
            shape = document.createElementNS(Avionics.SVG.NS, "circle");
            shape.setAttribute("cx", cx.toString());
            shape.setAttribute("cy", cy.toString());
            shape.setAttribute("r", size.toString());
            shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
            shape.setAttribute("stroke-width", "1");
            this.sectionRoot.appendChild(shape);
        }
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
        text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let hl = document.createElementNS(Avionics.SVG.NS, "rect");
        hl.setAttribute("x", (this.columnLeft3 - 2).toString());
        hl.setAttribute("y", (this.section.endY + 2).toString());
        hl.setAttribute("width", (this.menuWidth - 2 - (this.columnLeft3 - 2)).toString());
        hl.setAttribute("height", ((this.section.endY + this.lineHeight - 2) - (this.section.endY + 2)).toString());
        hl.setAttribute("fill", this.interactionColor);
        hl.setAttribute("visibility", "hidden");
        this.sectionRoot.appendChild(hl);
        let choice = document.createElementNS(Avionics.SVG.NS, "text");
        choice.textContent = _values[0];
        choice.setAttribute("x", this.columnLeft3.toString());
        choice.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        choice.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
        choice.setAttribute("font-size", _textSize.toString());
        choice.setAttribute("font-family", this.textStyle);
        choice.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(choice);
        let item = new Menu_Item(PopupMenu_ItemType.RADIO_LIST, this.section, this.section.endY, this.lineHeight);
        item.dictKeys = _dictKeys;
        item.radioElem = shape;
        item.radioName = _text;
        item.listElem = choice;
        item.listHLElem = hl;
        item.listValues = _values;
        this.section.items.push(item);
        this.registerWithMouse(item);
        this.section.endY += this.lineHeight;
    }
    addRadioRange(_text, _textSize, _min, _max, _step, _dictKeys) {
        let enabled = (_dictKeys != null) ? true : false;
        let cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
        let cy = this.section.endY + this.lineHeight * 0.5;
        let shape;
        if (this.shape3D) {
            let b = this.shape3DBorderSize;
            let h = Math.min(this.lineHeight, this.columnLeft2) * 0.8;
            let w = h * 0.75;
            if (enabled) {
                let leftBorder = document.createElementNS(Avionics.SVG.NS, "path");
                leftBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " Z");
                leftBorder.setAttribute("fill", this.shape3DBorderLeft);
                this.sectionRoot.appendChild(leftBorder);
                let rightBorder = document.createElementNS(Avionics.SVG.NS, "path");
                rightBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " Z");
                rightBorder.setAttribute("fill", this.shape3DBorderRight);
                this.sectionRoot.appendChild(rightBorder);
            }
            shape = document.createElementNS(Avionics.SVG.NS, "path");
            shape.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5 + b) + " L" + (cx - w * 0.5 + b) + " " + (cy) + " L" + (cx) + " " + (cy + h * 0.5 - b) + " L" + (cx + w * 0.5 - b) + " " + (cy) + " Z");
            shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            if (!enabled) {
                shape.setAttribute("stroke", this.disabledColor);
                shape.setAttribute("stroke-width", "1");
            }
            this.sectionRoot.appendChild(shape);
        }
        else {
            let size = Math.min(this.lineHeight, this.columnLeft2) * 0.33;
            shape = document.createElementNS(Avionics.SVG.NS, "circle");
            shape.setAttribute("cx", cx.toString());
            shape.setAttribute("cy", cy.toString());
            shape.setAttribute("r", size.toString());
            shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
            shape.setAttribute("stroke-width", "1");
            this.sectionRoot.appendChild(shape);
        }
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
        text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let hl = document.createElementNS(Avionics.SVG.NS, "rect");
        hl.setAttribute("x", (this.columnLeft3 - 2).toString());
        hl.setAttribute("y", (this.section.endY + 2).toString());
        hl.setAttribute("width", (this.menuWidth - 2 - (this.columnLeft3 - 2)).toString());
        hl.setAttribute("height", ((this.section.endY + this.lineHeight - 2) - (this.section.endY + 2)).toString());
        hl.setAttribute("fill", this.interactionColor);
        hl.setAttribute("visibility", "hidden");
        this.sectionRoot.appendChild(hl);
        let range = document.createElementNS(Avionics.SVG.NS, "text");
        range.setAttribute("x", this.columnLeft3.toString());
        range.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        range.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
        range.setAttribute("font-size", _textSize.toString());
        range.setAttribute("font-family", this.textStyle);
        range.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(range);
        let item = new Menu_Item(PopupMenu_ItemType.RADIO_RANGE, this.section, this.section.endY, this.lineHeight);
        item.dictKeys = _dictKeys;
        item.radioElem = shape;
        item.radioName = _text;
        item.rangeElem = range;
        item.rangeHLElem = hl;
        item.rangeMin = _min;
        item.rangeMax = _max;
        item.rangeStep = _step;
        item.rangeDecimals = Utils.countDecimals(_step);
        this.section.items.push(item);
        this.registerWithMouse(item);
        this.section.endY += this.lineHeight;
    }
    addCheckbox(_text, _textSize, _dictKeys) {
        let enabled = (_dictKeys != null) ? true : false;
        let size = Math.min(this.lineHeight, this.columnLeft2) * 0.66;
        let cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
        let cy = this.section.endY + this.lineHeight * 0.5;
        let shape;
        if (this.shape3D && enabled) {
            let b = this.shape3DBorderSize;
            let topLeftBorder = document.createElementNS(Avionics.SVG.NS, "path");
            topLeftBorder.setAttribute("d", "M" + (cx - size * 0.5) + " " + (cy - size * 0.5) + " l" + (size) + " 0 l" + (-b) + " " + (b) + " l" + (-(size - b * 2)) + " 0 l0 " + (size - b * 2) + " l" + (-b) + " " + (b) + " Z");
            topLeftBorder.setAttribute("fill", this.shape3DBorderLeft);
            this.sectionRoot.appendChild(topLeftBorder);
            let bottomRightBorder = document.createElementNS(Avionics.SVG.NS, "path");
            bottomRightBorder.setAttribute("d", "M" + (cx + size * 0.5) + " " + (cy + size * 0.5) + " l" + (-size) + " 0 l" + (b) + " " + (-b) + " l" + (size - b * 2) + " 0 l0 " + (-(size - b * 2)) + " l" + (b) + " " + (-b) + " Z");
            bottomRightBorder.setAttribute("fill", this.shape3DBorderRight);
            this.sectionRoot.appendChild(bottomRightBorder);
            shape = document.createElementNS(Avionics.SVG.NS, "rect");
            shape.setAttribute("x", (cx - size * 0.5 + b).toString());
            shape.setAttribute("y", (cy - size * 0.5 + b).toString());
            shape.setAttribute("width", (size - b * 2).toString());
            shape.setAttribute("height", (size - b * 2).toString());
            shape.setAttribute("fill", this.shapeFillColor);
            this.sectionRoot.appendChild(shape);
        }
        else {
            shape = document.createElementNS(Avionics.SVG.NS, "rect");
            shape.setAttribute("x", (cx - size * 0.5).toString());
            shape.setAttribute("y", (cy - size * 0.5).toString());
            shape.setAttribute("width", size.toString());
            shape.setAttribute("height", size.toString());
            shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
            shape.setAttribute("stroke-width", "1");
            this.sectionRoot.appendChild(shape);
        }
        let tick = document.createElementNS(Avionics.SVG.NS, "path");
        tick.setAttribute("d", "M" + (cx - size * 0.5) + " " + (cy) + " l" + (size * 0.4) + " " + (size * 0.5) + " l" + (size * 0.6) + " " + (-size));
        tick.setAttribute("fill", "none");
        tick.setAttribute("stroke", this.interactionColor);
        tick.setAttribute("stroke-width", "4");
        tick.setAttribute("visibility", "hidden");
        this.sectionRoot.appendChild(tick);
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
        text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let item = new Menu_Item(PopupMenu_ItemType.CHECKBOX, this.section, this.section.endY, this.lineHeight);
        item.dictKeys = _dictKeys;
        item.checkboxElem = shape;
        item.checkboxTickElem = tick;
        this.section.items.push(item);
        this.registerWithMouse(item);
        this.section.endY += this.lineHeight;
    }
    addSubMenu(_text, _textSize, _callback) {
        let enabled = (_callback != null) ? true : false;
        let size = Math.min(this.lineHeight, this.columnLeft2) * 0.66;
        let cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
        let cy = this.section.endY + this.lineHeight * 0.5;
        let arrow = document.createElementNS(Avionics.SVG.NS, "path");
        arrow.setAttribute("d", "M" + (cx - size * 0.5) + " " + (cy - size * 0.5) + " l0 " + (size) + " l" + (size * 0.75) + " " + (-size * 0.5) + " Z");
        arrow.setAttribute("fill", (enabled) ? this.interactionColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
        this.sectionRoot.appendChild(arrow);
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
        text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
        text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let item = new Menu_Item(PopupMenu_ItemType.SUBMENU, this.section, this.section.endY, this.lineHeight);
        item.subMenu = _callback;
        this.section.items.push(item);
        this.registerWithMouse(item);
        this.section.endY += this.lineHeight;
    }
    addButton(_text, _textSize, _callback) {
        let enabled = (_callback != null) ? true : false;
        let cx = this.menuLeft + (this.menuWidth - this.menuLeft) * 0.5;
        let cy = this.section.endY + this.lineHeight * 0.5;
        let w = this.menuWidth * 0.66;
        let h = this.lineHeight * 0.66;
        let shape;
        if (this.shape3D && enabled) {
            let b = this.shape3DBorderSize;
            let topLeftBorder = document.createElementNS(Avionics.SVG.NS, "path");
            topLeftBorder.setAttribute("d", "M" + (cx - w * 0.5) + " " + (cy - h * 0.5) + " l" + (w) + " 0 l" + (-b) + " " + (b) + " l" + (-(w - b * 2)) + " 0 l0 " + (h - b * 2) + " l" + (-b) + " " + (b) + " Z");
            topLeftBorder.setAttribute("fill", this.shape3DBorderLeft);
            this.sectionRoot.appendChild(topLeftBorder);
            let bottomRightBorder = document.createElementNS(Avionics.SVG.NS, "path");
            bottomRightBorder.setAttribute("d", "M" + (cx + w * 0.5) + " " + (cy + h * 0.5) + " l" + (-w) + " 0 l" + (b) + " " + (-b) + " l" + (w - b * 2) + " 0 l0 " + (-(h - b * 2)) + " l" + (b) + " " + (-b) + " Z");
            bottomRightBorder.setAttribute("fill", this.shape3DBorderRight);
            this.sectionRoot.appendChild(bottomRightBorder);
            shape = document.createElementNS(Avionics.SVG.NS, "rect");
            shape.setAttribute("x", (cx - w * 0.5 + b).toString());
            shape.setAttribute("y", (cy - h * 0.5 + b).toString());
            shape.setAttribute("width", (w - b * 2).toString());
            shape.setAttribute("height", (h - b * 2).toString());
            shape.setAttribute("fill", this.shapeFillColor);
            this.sectionRoot.appendChild(shape);
        }
        else {
            shape = document.createElementNS(Avionics.SVG.NS, "rect");
            shape.setAttribute("x", (cx - w * 0.5).toString());
            shape.setAttribute("y", (cy - h * 0.5).toString());
            shape.setAttribute("width", w.toString());
            shape.setAttribute("height", h.toString());
            shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
            shape.setAttribute("stroke-width", "1");
            this.sectionRoot.appendChild(shape);
        }
        let text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", cx.toString());
        text.setAttribute("y", cy.toString());
        text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
        text.setAttribute("font-size", _textSize.toString());
        text.setAttribute("font-family", this.textStyle);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("alignment-baseline", "central");
        this.sectionRoot.appendChild(text);
        let item = new Menu_Item(PopupMenu_ItemType.SUBMENU, this.section, this.section.endY, this.lineHeight);
        item.subMenu = _callback;
        this.section.items.push(item);
        this.registerWithMouse(item);
        this.section.endY += this.lineHeight;
    }
    updateHighlight() {
        if (this.highlightElem) {
            let itemId = 0;
            let lastItem;
            for (let i = 0; i < this.allSections.length; i++) {
                let section = this.allSections[i];
                for (let j = 0; j < section.items.length; j++) {
                    let item = section.items[j];
                    if (item.interactive) {
                        if (itemId == this.highlightId) {
                            this.setHighlightedItem(item);
                            return true;
                        }
                        lastItem = item;
                        itemId++;
                    }
                }
            }
            if (lastItem) {
                this.highlightId = itemId - 1;
                this.setHighlightedItem(lastItem);
            }
        }
    }
    setHighlightedItem(_item) {
        if (_item != this.highlightItem) {
            this.highlightItem = _item;
            this.highlightElem.setAttribute("y", _item.y.toString());
            this.speedInc = 1.0;
        }
    }
    activateItem(_item, _val) {
        if (!_item.enabled)
            return;
        switch (_item.type) {
            case PopupMenu_ItemType.RADIO:
            case PopupMenu_ItemType.RADIO_LIST:
            case PopupMenu_ItemType.RADIO_RANGE:
                if (_val) {
                    _item.radioVal = true;
                    _item.radioElem.setAttribute("fill", this.interactionColor);
                }
                else {
                    _item.radioVal = false;
                    _item.radioElem.setAttribute("fill", this.shapeFillColor);
                }
                break;
            case PopupMenu_ItemType.CHECKBOX:
                if (_val) {
                    _item.checkboxVal = true;
                    _item.checkboxTickElem.setAttribute("visibility", "visible");
                }
                else {
                    _item.checkboxVal = false;
                    _item.checkboxTickElem.setAttribute("visibility", "hidden");
                }
                break;
        }
    }
    updateSpeedInc() {
        if (this.highlightItem) {
            if (this.speedInc > 1) {
                this.speedInc -= this.speedInc_DownFactor;
                if (this.speedInc < 1)
                    this.speedInc = 1;
            }
        }
        else {
            this.speedInc = 1.0;
        }
    }
    getSpeedAccel() {
        let pow = 1.0 + ((this.speedInc - 1.0) * this.speedInc_PowFactor);
        let accel = Math.pow(this.speedInc, pow);
        return Math.floor(accel);
    }
    onChanged(_item) {
        if (this.dictionary && _item.enabled) {
            switch (_item.type) {
                case PopupMenu_ItemType.RADIO:
                case PopupMenu_ItemType.RADIO_LIST:
                case PopupMenu_ItemType.RADIO_RANGE:
                    let found = false;
                    for (let i = 0; i < _item.section.items.length; i++) {
                        if (_item.section.items[i].radioVal) {
                            this.dictionary.set(_item.dictKeys[0], _item.radioName);
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                        this.dictionary.remove(_item.dictKeys[0]);
                    break;
                case PopupMenu_ItemType.LIST:
                    this.dictionary.set(_item.dictKeys[0], _item.listValues[_item.listVal]);
                    break;
                case PopupMenu_ItemType.RANGE:
                    this.dictionary.set(_item.dictKeys[0], _item.rangeVal.toString());
                    break;
                case PopupMenu_ItemType.CHECKBOX:
                    this.dictionary.set(_item.dictKeys[0], (_item.checkboxVal) ? "ON" : "OFF");
                    break;
            }
            switch (_item.type) {
                case PopupMenu_ItemType.RADIO_LIST:
                    this.dictionary.set(_item.dictKeys[1], _item.listValues[_item.listVal]);
                    break;
                case PopupMenu_ItemType.RADIO_RANGE:
                    this.dictionary.set(_item.dictKeys[1], _item.rangeVal.toString());
                    break;
            }
        }
    }
    registerWithMouse(_item) {
        let mouseFrame = document.createElementNS(Avionics.SVG.NS, "rect");
        mouseFrame.setAttribute("x", this.menuLeft.toString());
        mouseFrame.setAttribute("y", this.section.endY.toString());
        mouseFrame.setAttribute("width", this.menuWidth.toString());
        mouseFrame.setAttribute("height", this.lineHeight.toString());
        mouseFrame.setAttribute("fill", "none");
        mouseFrame.setAttribute("pointer-events", "visible");
        this.sectionRoot.appendChild(mouseFrame);
        mouseFrame.addEventListener("mouseover", this.onMouseOver.bind(this, _item));
        mouseFrame.addEventListener("mouseup", this.onMousePress.bind(this, _item));
    }
    onMouseOver(_item) {
        if (_item.enabled) {
            let itemId = 0;
            for (let i = 0; i < this.allSections.length; i++) {
                let section = this.allSections[i];
                for (let j = 0; j < section.items.length; j++) {
                    let item = section.items[j];
                    if (item.interactive) {
                        if (item == _item) {
                            this.highlightId = itemId;
                            return;
                        }
                        itemId++;
                    }
                }
            }
        }
    }
    onMousePress(_item) {
        if (_item.enabled)
            this.onActivate();
    }
}