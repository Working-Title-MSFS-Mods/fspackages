// trying to bind most methods to fmcmaindisplay to instance
// to be able to use basic variables from there

class WT_FMC_Renderer {
    // takes the fmc instance
    constructor(fmc) {
        this._fmc = fmc;

        // overrides
        this._fmc.setTemplate = this.setTemplate.bind(fmc);
        this._fmc.setTitle = this.setTitle.bind(fmc);

        // bind methods to fmc
        this._fmc.setTitle3Head = this.setTitle3Head.bind(fmc);
        this._fmc.renderHeader = this.renderHeader.bind(fmc);

        // init layout
        this._fmc.renderHeader();
        this.renderScratchpad();
        this._messageBox = this.renderMsgLine();
        this._execEl = this.renderExec();
    }

    // PUBLIC
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
        SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", this.currentFlightPlanWaypointIndex);
    }

    setTitle3Head(content, col) {
        let resultElems = [];

        if (content !== "") {
            if (content.includes("[color]")) {
                // use old styling logic
                let color = content.split("[color]")[1];
                if (!color) {
                    color = "white";
                }
                this._title = content.split("[color]")[0];
                this._titleElement[col].classList.remove("white", "blue", "yellow", "green", "red");
                this._titleElement[col].classList.add(color);
                let el = document.createElement("span");
                el.innerHTML = this._title;
                resultElems.push(el);
            } else {
                const rx = /([^\[\]\n]+)(\[[^\[\]\n]+\])*/g;
                let match = rx.exec(content);
                if (match) {
                    while (match != null) {
                        let el = document.createElement("span");
                        el.innerHTML = match[1];

                        if (match.length == 3) {
                            // do css
                            let classes = match[2].match(/\w+/g);
                            classes.forEach(c => { el.classList.add(c) });
                        }
                        resultElems.push(el);
                        match = rx.exec(content);
                    }
                }
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