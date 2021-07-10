var WTMenu;
(function (WTMenu) {
    let Menu_ItemType;
    (function (Menu_ItemType) {
        Menu_ItemType[Menu_ItemType["TITLE"] = 0] = "TITLE";
        Menu_ItemType[Menu_ItemType["SUBMENU"] = 6] = "SUBMENU";
        Menu_ItemType[Menu_ItemType["CHECKBOX"] = 7] = "CHECKBOX";
    })(Menu_ItemType || (Menu_ItemType = {}));
    class Menu_Item {
        constructor(_type, _section, _y, _height) {
            this.y = 0;
            this.height = 0;
            this.rangeMin = 0;
            this.checkboxVal = false;
            this.type = _type;
            this.section = _section;
            this.y = _y;
            this.height = _height;
        }
        get interactive() {
            if (this.type != Menu_ItemType.TITLE)
                return true;
            return false;
        }
        get enabled() {
            if (!this.subMenu)
                return false;
            return true;
        }
    }
    class Menu_Section {
        constructor() {
            this.items = new Array();
            this.startY = 0;
            this.endY = 0;
            this.interactionColor = "";
        }
    }
    class Checklist_Menu_Handler {
        constructor() {
            this.menuLeft = 0;
            this.menuTop = 0;
            this.menuWidth = 0;
            this.columnLeft1 = 3;
            this.columnLeft2 = 20;
            this.columnLeft3 = 90;
            this.lineHeight = 15;
            this.sectionBorderSize = 1;
            this.textStyle = "Roboto-Regular";
            this.textMarginX = 3;
            this.highlightColor = "cyan";
            this.interactionColor = "cyan";
            this.disabledColor = "grey";
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
            if (this.highlightItem) {
                switch (this.highlightItem.type) {
                    case Menu_ItemType.SUBMENU:
                        if(this.highlightItem.subMenu != null){
                            this.highlightItem.subMenu();
                        }
                        break;
                    case Menu_ItemType.CHECKBOX:
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
        }
        onDataInc() {
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
            diffAndSetAttribute(bg, "x", "0");
            diffAndSetAttribute(bg, "y", "0");
            diffAndSetAttribute(bg, "width", this.menuWidth.toString());
            diffAndSetAttribute(bg, "height", this.height.toString());
            diffAndSetAttribute(bg, "fill", "black");
            this.sectionRoot.insertBefore(bg, this.sectionRoot.firstChild);
            this.highlightElem = document.createElementNS(Avionics.SVG.NS, "rect");
            this.highlightElem.setAttribute("x", "0");
            this.highlightElem.setAttribute("y", "30");
            this.highlightElem.setAttribute("width", this.menuWidth.toString());
            this.highlightElem.setAttribute("height", this.lineHeight.toString() - 2);
            this.highlightElem.setAttribute("fill", "none");
            this.highlightElem.setAttribute("stroke", this.highlightColor);
            this.highlightElem.setAttribute("stroke-width", (this.sectionBorderSize + 1).toString());
            this.sectionRoot.appendChild(this.highlightElem);
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
            for (let i = 0; i < this.section.items.length; i++) {
                let item = this.section.items[i];
                let changed = false;
                if (item.checklistItem && item.checklistItem.key) {
                    this.activateItem(item, true);
                    changed = true;
                }
                if (changed)
                    this.onChanged(item);
            }
            this.allSections.push(this.section);
            this.section = null;
        }
        addChecklistTitle(_text, _textSize, _bgFactor, _pageNumber = undefined, _totalPages = undefined, _alignment = "center") {
            let bg = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(bg, "x", "0");
            diffAndSetAttribute(bg, "y", this.section.endY.toString());
            diffAndSetAttribute(bg, "width", (this.menuWidth * _bgFactor).toString());
            diffAndSetAttribute(bg, "height", this.lineHeight.toString());
            this.sectionRoot.appendChild(bg);
            let text = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetText(text, _text);
            if(_alignment == "left"){
                diffAndSetAttribute(text, "x", (this.columnLeft1).toString());
                diffAndSetAttribute(text, "text-anchor", "left");
            }
            else{
                diffAndSetAttribute(text, "x", "175");
                diffAndSetAttribute(text, "text-anchor", "middle");
            }
            diffAndSetAttribute(text, "y", (this.section.endY + this.lineHeight * 0.5).toString());
            diffAndSetAttribute(text, "fill", "white");
            diffAndSetAttribute(text, "font-size", _textSize.toString());
            diffAndSetAttribute(text, "font-family", this.textStyle);
            diffAndSetAttribute(text, "alignment-baseline", "central");

            this.sectionRoot.appendChild(text);

            if(_pageNumber && _totalPages && _totalPages > 1){
                let pageNumber = document.createElementNS(Avionics.SVG.NS, "text");
                diffAndSetText(pageNumber, "PG " + _pageNumber.toString() + "/" + _totalPages.toString());
                diffAndSetAttribute(pageNumber, "x", "305");
                diffAndSetAttribute(pageNumber, "y", (this.section.endY + this.lineHeight * 0.5).toString());
                diffAndSetAttribute(pageNumber, "fill", "white");
                diffAndSetAttribute(pageNumber, "font-size", _textSize.toString());
                diffAndSetAttribute(pageNumber, "font-family", this.textStyle);
                diffAndSetAttribute(pageNumber, "alignment-baseline", "central");
                diffAndSetAttribute(pageNumber, "text-anchor", "right");
                this.sectionRoot.appendChild(pageNumber);
            }


            let item = new Menu_Item(Menu_ItemType.TITLE, this.section, this.section.endY, this.lineHeight);
            this.section.items.push(item);
            this.section.endY += this.lineHeight;
        }
        addChecklistItem(_checklistItem, _textSize) {
            let enabled = (_checklistItem != null) ? true : false;
            let size = Math.min(this.lineHeight, this.columnLeft2) * 0.66;
            let cx = this.columnLeft1 + this.textMarginX;
            let cy = this.section.endY + this.lineHeight * 0.5;

            let tick = document.createElementNS(Avionics.SVG.NS, "path");
            diffAndSetAttribute(tick, "d", "M" + (cx - size * 0.1) + " " + (cy - 0.2) + " l" + (size * 0.1) + " " + (size * 0.5) + " l" + (size * 0.18) + " " + (-size));
            diffAndSetAttribute(tick, "fill", "none");
            diffAndSetAttribute(tick, "stroke", "white");
            diffAndSetAttribute(tick, "stroke-width", "2");
            diffAndSetAttribute(tick, "visibility", "hidden");
            this.sectionRoot.appendChild(tick);

            let text = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetText(text, _checklistItem.name);
            diffAndSetAttribute(text, "x", (this.columnLeft2 - 7).toString());
            diffAndSetAttribute(text, "y", (this.section.endY + this.lineHeight * 0.5).toString());
            diffAndSetAttribute(text, "fill", (enabled) ? "white" : this.disabledColor);
            diffAndSetAttribute(text, "font-size", _textSize.toString());
            diffAndSetAttribute(text, "font-family", this.textStyle);
            diffAndSetAttribute(text, "alignment-baseline", "central");
            this.sectionRoot.appendChild(text);

            let value = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetText(value, _checklistItem.value);
            diffAndSetAttribute(value, "x", (350 - this.textMarginX).toString());
            diffAndSetAttribute(value, "y", (this.section.endY + this.lineHeight * 0.5).toString());
            diffAndSetAttribute(value, "fill", (enabled) ? "white" : this.disabledColor);
            diffAndSetAttribute(value, "font-size", _textSize.toString());
            diffAndSetAttribute(value, "font-family", this.textStyle);
            diffAndSetAttribute(value, "alignment-baseline", "central");
            diffAndSetAttribute(value, "text-anchor", "end");
            this.sectionRoot.appendChild(value);

            let item = new Menu_Item(Menu_ItemType.CHECKBOX, this.section, this.section.endY, this.lineHeight);
            item.checklistItem = _checklistItem;
            item.checkboxTickElem = tick;
            item.text = text;
            item.value = value;
            this.section.items.push(item);
            this.registerWithMouse(item);
            this.section.endY += this.lineHeight;
        }
        addSubMenu(_text, _textSize, _callback, _textColour = "white") {
            let enabled = (_callback != null) ? true : false;
            let text = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetText(text, _text);
            diffAndSetAttribute(text, "x", (this.columnLeft1 + this.textMarginX).toString());
            diffAndSetAttribute(text, "y", (this.section.endY + this.lineHeight * 0.5).toString());
            diffAndSetAttribute(text, "fill", (enabled) ? _textColour : this.disabledColor);
            diffAndSetAttribute(text, "font-size", _textSize.toString());
            diffAndSetAttribute(text, "font-family", this.textStyle);
            diffAndSetAttribute(text, "alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            let item = new Menu_Item(Menu_ItemType.SUBMENU, this.section, this.section.endY, this.lineHeight);
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
            switch (_item.type) {
                case Menu_ItemType.CHECKBOX:
                    if (_val) {
                        _item.checkboxVal = true;
                        _item.checkboxTickElem.setAttribute("visibility", "visible");
                        _item.text.setAttribute("fill", "#11d011");
                        _item.value.setAttribute("fill", "#11d011");
                    }
                    else {
                        _item.checkboxVal = false;
                        _item.checkboxTickElem.setAttribute("visibility", "hidden");
                        _item.text.setAttribute("fill", "white");
                        _item.value.setAttribute("fill", "white");
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
        onChanged(_item) {
            switch (_item.type) {
                case Menu_ItemType.CHECKBOX:
                    _item.checklistItem.key = (_item.checkboxVal) ? true : false;
                    break;
            }
        }
        registerWithMouse(_item) {
            let mouseFrame = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(mouseFrame, "x", this.menuLeft.toString());
            diffAndSetAttribute(mouseFrame, "y", this.section.endY.toString());
            diffAndSetAttribute(mouseFrame, "width", this.menuWidth.toString());
            diffAndSetAttribute(mouseFrame, "height", this.lineHeight.toString());
            diffAndSetAttribute(mouseFrame, "fill", "none");
            diffAndSetAttribute(mouseFrame, "pointer-events", "visible");
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
        reactsOnEvent(_event) {
            switch (_event) {
                case "Lwr_DATA_PUSH":
                case "Lwr_DATA_DEC":
                case "Lwr_DATA_INC":
                case "Lwr_MENU_ADV_DEC":
                case "Lwr_MENU_ADV_INC":
                case "Lwr_Push_ESC":
                    return true;
            }
            return false;
        }
    }
    class PassengerBrief_Menu_Handler {
        constructor() {
            this.menuLeft = 0;
            this.menuTop = 0;
            this.menuWidth = 0;
            this.columnLeft1 = 3;
            this.columnLeft2 = 20;
            this.columnLeft3 = 90;
            this.lineHeight = 15;
            this.sectionBorderSize = 1;
            this.textStyle = "Roboto-Regular";
            this.textMarginX = 3;
            this.highlightColor = "cyan";
            this.interactionColor = "cyan";
            this.disabledColor = "grey";
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
            if (this.highlightItem) {
                switch (this.highlightItem.type) {
                    case Menu_ItemType.CHECKBOX:
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
        }
        onDataInc() {
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
            diffAndSetAttribute(bg, "x", "0");
            diffAndSetAttribute(bg, "y", "0");
            diffAndSetAttribute(bg, "width", this.menuWidth.toString());
            diffAndSetAttribute(bg, "height", this.height.toString());
            diffAndSetAttribute(bg, "fill", "black");
            this.sectionRoot.insertBefore(bg, this.sectionRoot.firstChild);
            this.highlightElem = document.createElementNS(Avionics.SVG.NS, "rect");
            this.highlightElem.setAttribute("x", "0");
            this.highlightElem.setAttribute("y", "30");
            this.highlightElem.setAttribute("width", this.menuWidth.toString());
            this.highlightElem.setAttribute("height", this.lineHeight.toString() - 2);
            this.highlightElem.setAttribute("fill", "none");
            this.highlightElem.setAttribute("stroke", this.highlightColor);
            this.highlightElem.setAttribute("stroke-width", (this.sectionBorderSize + 1).toString());
            this.sectionRoot.appendChild(this.highlightElem);
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
            for (let i = 0; i < this.section.items.length; i++) {
                let item = this.section.items[i];
                let changed = false;
                if (item.checklistItem && item.checklistItem.key) {
                    this.activateItem(item, true);
                    changed = true;
                }
                if (changed)
                    this.onChanged(item);
            }
            this.allSections.push(this.section);
            this.section = null;
        }
        addPassBriefTitle(_text, _textSize, _bgFactor) {
            let bg = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(bg, "x", "0");
            diffAndSetAttribute(bg, "y", this.section.endY.toString());
            diffAndSetAttribute(bg, "width", (this.menuWidth * _bgFactor).toString());
            diffAndSetAttribute(bg, "height", this.lineHeight.toString());
            this.sectionRoot.appendChild(bg);
            let text = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetText(text, _text);
            diffAndSetAttribute(text, "x", "175");
            diffAndSetAttribute(text, "y", (this.section.endY + this.lineHeight * 0.5).toString());
            diffAndSetAttribute(text, "fill", "white");
            diffAndSetAttribute(text, "font-size", _textSize.toString());
            diffAndSetAttribute(text, "font-family", this.textStyle);
            diffAndSetAttribute(text, "alignment-baseline", "central");
            diffAndSetAttribute(text, "text-anchor", "middle");
            this.sectionRoot.appendChild(text);

            let item = new Menu_Item(Menu_ItemType.TITLE, this.section, this.section.endY, this.lineHeight);
            this.section.items.push(item);
            this.section.endY += this.lineHeight;
        }
        addPassBriefItem(_title, _textSize, _simvar) {
            let enabled = true;

            let tick = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetText(tick, "-");
            diffAndSetAttribute(tick, "x", (this.columnLeft1 + this.textMarginX).toString());
            diffAndSetAttribute(tick, "y", (this.section.endY + this.lineHeight * 0.5).toString());
            diffAndSetAttribute(tick, "fill", "white");
            diffAndSetAttribute(tick, "visibility", "hidden");
            diffAndSetAttribute(tick, "font-size", _textSize.toString());
            diffAndSetAttribute(tick, "font-family", this.textStyle);
            diffAndSetAttribute(tick, "alignment-baseline", "central");
            this.sectionRoot.appendChild(tick);

            let text = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetText(text, _title);
            diffAndSetAttribute(text, "x", (this.columnLeft2 - 7).toString());
            diffAndSetAttribute(text, "y", (this.section.endY + this.lineHeight * 0.5).toString());
            diffAndSetAttribute(text, "fill", (enabled) ? "white" : this.disabledColor);
            diffAndSetAttribute(text, "font-size", _textSize.toString());
            diffAndSetAttribute(text, "font-family", this.textStyle);
            diffAndSetAttribute(text, "alignment-baseline", "central");
            this.sectionRoot.appendChild(text);

            let item = new Menu_Item(Menu_ItemType.CHECKBOX, this.section, this.section.endY, this.lineHeight);
            item.checkboxTickElem = tick;
            item.text = text;
            item.simVar = _simvar;
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
            switch (_item.type) {
                case Menu_ItemType.CHECKBOX:
                    if (_val) {
                        _item.checkboxVal = true;
                        _item.checkboxTickElem.setAttribute("visibility", "visible");
                        _item.text.setAttribute("fill", "#11d011");
                    }
                    else {
                        _item.checkboxVal = false;
                        _item.checkboxTickElem.setAttribute("visibility", "hidden");
                        _item.text.setAttribute("fill", "white");
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
        onChanged(_item) {
            switch (_item.type) {
                case Menu_ItemType.CHECKBOX:
                    const pax_brief_played = (_item.checkboxVal) ? 1 : 0;
                    SimVar.SetSimVarValue(_item.simVar, "number", pax_brief_played);
                    break;
            }
        }
        registerWithMouse(_item) {
            let mouseFrame = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(mouseFrame, "x", this.menuLeft.toString());
            diffAndSetAttribute(mouseFrame, "y", this.section.endY.toString());
            diffAndSetAttribute(mouseFrame, "width", this.menuWidth.toString());
            diffAndSetAttribute(mouseFrame, "height", this.lineHeight.toString());
            diffAndSetAttribute(mouseFrame, "fill", "none");
            diffAndSetAttribute(mouseFrame, "pointer-events", "visible");
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
        reactsOnEvent(_event) {
            switch (_event) {
                case "Lwr_DATA_PUSH":
                case "Lwr_DATA_DEC":
                case "Lwr_DATA_INC":
                case "Lwr_MENU_ADV_DEC":
                case "Lwr_MENU_ADV_INC":
                case "Lwr_Push_ESC":
                    return true;
            }
            return false;
        }
    }
    WTMenu.PassengerBrief_Menu_Handler = PassengerBrief_Menu_Handler;
    WTMenu.Checklist_Menu_Handler = Checklist_Menu_Handler;
})(WTMenu || (WTMenu = {}));
