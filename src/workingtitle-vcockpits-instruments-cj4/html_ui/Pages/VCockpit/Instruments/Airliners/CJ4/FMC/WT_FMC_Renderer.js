// trying to bind most methods to fmcmaindisplay to instance
// to be able to use basic variables from there

class WT_FMC_Renderer {
    // takes the fmc instance
    constructor(fmc) {
        this._fmc = fmc;

        // overrides
        this._fmc.setTemplate = this.setTemplate.bind(fmc);
        this._fmc.setTitle = this.setTitle.bind(fmc);
        this._fmc.setLabel = this.setLabel.bind(fmc);
        this._fmc.setLine = this.setLine.bind(fmc);

        // bind own methods to fmc
        this._fmc.setTitle3Head = this.setTitle3Head.bind(fmc);
        this._fmc.renderHeader = this.renderHeader.bind(fmc);
        this._fmc.parseContent = this.parseContent.bind(fmc);

        // init layout
        this._fmc.renderHeader();
        this.renderScratchpad();
        this._messageBox = this.renderMsgLine();
        this._execEl = this.renderExec();
    }

    // FMCMainDisplay overrides

    setTemplate(template) {
        if (template[0]) {
            if (template[0].length > 3) {
                this.setTitle(template[0][0], 0);
                this.setTitle(template[0][1], 1);
                this.setTitle(template[0][2], 2);
                this.setPageCurrent(template[0][3]);
                this.setPageCount(template[0][4]);
            } else {
                // backwards compat
                this.setTitle(template[0][0]);
                this.setPageCurrent(template[0][1]);
                this.setPageCount(template[0][2]);
            }
        }
        for (let i = 0; i < 6; i++) {
            let tIndex = 2 * i + 1;
            if (template[tIndex]) {
                if (template[tIndex][1] !== undefined) {
                    this.setLabel(template[tIndex][0], i, 0);
                    this.setLabel(template[tIndex][1], i, 1);
                    this.setLabel(template[tIndex][2], i, 2);
                    this.setLabel(template[tIndex][3], i, 3);
                }
                else {
                    this.setLabel(template[tIndex][0], i, -1);
                }
            }
            tIndex = 2 * i + 2;
            if (template[tIndex]) {
                if (template[tIndex][1] !== undefined) {
                    this.setLine(template[tIndex][0], i, 0);
                    this.setLine(template[tIndex][1], i, 1);
                    this.setLine(template[tIndex][2], i, 2);
                    this.setLine(template[tIndex][3], i, 3);
                }
                else {
                    this.setLine(template[tIndex][0], i, -1);
                }
            }
        }
        if (template[13]) {
            this.setInOut(template[13][0]);
        }

        // wtf, why is this in this method? :D
        SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", this.currentFlightPlanWaypointIndex);
    }

    setLine(content, row, col = -1) {
        if (col >= this._lineElements[row].length) {
            return;
        }
        if (!content) {
            content = "";
        }
        if (!this._lines[row]) {
            this._lines[row] = [];
        }
        if (col === -1) {
            for (let i = 0; i < this._lineElements[row].length; i++) {
                this._lines[row][i] = "";
                this._lineElements[row][i].textContent = "";
            }
            col = 0;
        }
        if (content === "__FMCSEPARATOR") {
            content = "------------------------";
        }

        let resultElems = [];

        // TODO: think of a better way to reset classes from the default behavior
        this._lineElements[row][col].classList.remove("white", "blue", "yellow", "green", "red");

        if (content !== "") {
            if (content.includes("[color]")) {
                let color = content.split("[color]")[1];
                if (!color) {
                    color = "white";
                }
                this._lineElements[row][col].classList.add(color);
                content = content.split("[color]")[0];

                let el = document.createElement("span");
                el.innerHTML = content;
                resultElems.push(el);
            } else {
                resultElems.push(...this.parseContent(content));
            }
        }

        // clear it (fastest)
        this._lineElements[row][col].textContent = "";
        resultElems.forEach(el => { this._lineElements[row][col].appendChild(el) });
        this._lines[row][col] = this._lineElements[row][col].textContent;
    }

    setLabel(label, row, col = -1) {
        if (col >= this._labelElements[row].length) {
            return;
        }
        if (!this._labels[row]) {
            this._labels[row] = [];
        }
        if (!label) {
            label = "";
        }
        if (col === -1) {
            for (let i = 0; i < this._labelElements[row].length; i++) {
                this._labels[row][i] = "";
                this._labelElements[row][i].textContent = "";
            }
            col = 0;
        }
        if (label === "__FMCSEPARATOR") {
            label = "------------------------";
        }

        let resultElems = [];

        // TODO: think of a better way to reset classes from the default behavior
        this._labelElements[row][col].classList.remove("white", "blue", "yellow", "green", "red");

        if (label !== "") {
            if (label.includes("[color]")) {
                let color = label.split("[color]")[1];
                if (!color) {
                    color = "white";
                }
                this._labelElements[row][col].classList.add(color);
                label = label.split("[color]")[0];

                let el = document.createElement("span");
                el.innerHTML = label;
                resultElems.push(el);
            } else {
                resultElems.push(...this.parseContent(label));
            }
        }

        // clear it (fastest)
        this._labelElements[row][col].textContent = "";
        resultElems.forEach(el => { this._labelElements[row][col].appendChild(el) });
        this._labels[row][col] = this._labelElements[row][col].textContent;
    }

    setTitle3Head(content, col) {
        let resultElems = [];

        // TODO: think of a better way to reset classes from the default behavior
        this._titleElement[col].classList.remove("white", "blue", "yellow", "green", "red");

        if (content !== "") {
            if (content.includes("[color]")) {
                // use old styling logic
                let color = content.split("[color]")[1];
                if (!color) {
                    color = "white";
                }
                this._title = content.split("[color]")[0];
                this._titleElement[col].classList.add(color);
                let el = document.createElement("span");
                el.innerHTML = this._title;
                resultElems.push(el);
            } else {
                resultElems.push(...this.parseContent(content));
            }
        }

        // clear it (fastest)
        this._titleElement[col].textContent = "";
        resultElems.forEach(el => { this._titleElement[col].appendChild(el) });
    }

    // for backwards compat
    setTitle(content) {
        if (arguments.length > 1) {
            this.setTitle3Head(...arguments);
        }

        let color = content.split("[color]")[1];
        if (!color) {
            color = "white";
        }
        this._title = content.split("[color]")[0];
        this._titleElement[2].classList.remove("white", "blue", "yellow", "green", "red");
        this._titleElement[2].classList.add(color);
        this._titleElement[2].textContent = this._title;;
    }

    // METHODS

    setMsg(text) {
        this._messageBox.innerHTML = text;
    }

    showExec() {
        if (this._execEl) {
            this._execEl.classList.remove("hidden");
        }
    }

    hideExec() {
        if (this._execEl) {
            this._execEl.classList.add("hidden");
        }
    }

    // "PRIVATE"

    // parses a template string and returns the elements array
    parseContent(content) {
        let resultElems = [];
        const rx = /([^\[\]\n]+)(\[[^\[\]\n]+\])*/g;
        let match = rx.exec(content);
        if (match) {
            while (match != null) {
                let el = document.createElement("span");
                var encodedStr = match[1].replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
                    return '&#' + i.charCodeAt(0) + ';';
                  });
                el.innerHTML = encodedStr;

                if (match[2]) {
                    // do css
                    let classes = match[2].match(/[^\s\[\]]+/g);
                    classes.forEach(c => { el.classList.add(c) });
                }
                resultElems.push(el);
                match = rx.exec(content);
            }
        }
        return resultElems;
    }

    renderHeader() {
        // triple header
        let headerEl = document.getElementById("header");
        headerEl.innerHTML = ""; // clear it
        let tl = document.createElement("span");
        tl.id = "title-left";
        tl.classList.add("label-left")
        headerEl.appendChild(tl);
        let tr = document.createElement("span");
        tr.id = "title-right";
        tr.classList.add("label-right")
        headerEl.appendChild(tr)
        let tc = document.createElement("span");
        tc.id = "title";
        tc.classList.add("label-center")
        headerEl.appendChild(tc)
        this._titleElement = [];
        this._titleElement.push(tl, tr, tc);
    }

    renderScratchpad() {
        // make footer accesible from css
        document.getElementById("in-out").parentElement.classList.add("footer");
        let inoutelem = document.getElementById("in-out");
        let brkOpen = document.createElement("span");
        brkOpen.innerHTML = "[";
        brkOpen.classList.add("blue", "line-left");
        let brkClose = document.createElement("span");
        brkClose.innerHTML = "]";
        brkClose.classList.add("blue", "line-right");
        inoutelem.parentElement.appendChild(brkOpen);
        inoutelem.parentElement.appendChild(brkClose);
    }

    renderMsgLine() {
        let lineEl = document.createElement("div");
        lineEl.id = "msg-line";
        lineEl.classList.add("line");
        document.getElementById("Electricity").append(lineEl);

        let msgEl = document.createElement("div");
        msgEl.classList.add("fitcontent", "line-left");
        lineEl.append(msgEl);

        return msgEl;
    }

    renderExec() {
        let execEl = document.getElementById("exec-sign");
        if (!execEl) {
            execEl = document.createElement("div");
            execEl.id = "exec-sign";
            execEl.innerHTML = "EXEC";
            execEl.classList.add("blackwhite", "line-right", "fitcontent", "hidden");
            document.getElementById("msg-line").append(execEl);
        }

        return execEl;
    }

    clearDisplay() {
        this.setTitle("", 0);
        this.setTitle("", 1);
        this.setTitle("", 2);
    }
}