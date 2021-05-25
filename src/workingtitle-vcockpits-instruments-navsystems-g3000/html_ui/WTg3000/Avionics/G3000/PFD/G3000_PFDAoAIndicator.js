class WT_G3000_PFDAoAIndicator extends WT_G3x5_PFDAoAIndicator {
    /**
     * @readonly
     * @property {WT_G3000_PFDAoAIndicatorHTMLElement} htmlElement
     * @type {WT_G3000_PFDAoAIndicatorHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createModel() {
        return new WT_G3000_AoAIndicatorModel(this.instrument.airplane, {
            zeroLiftAngle: this.instrument.airplane.references.aoaZeroLift,
            criticalAngle: this.instrument.airplane.references.aoaCritical
        }, this.aoaModeSetting);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3000_PFDAoAIndicatorHTMLElement();
        htmlElement.setContext({
            model: this._model,
            tickFraction: 0.6,
            redFraction: 0.9,
        });
        return htmlElement;
    }
}

class WT_G3000_AoAIndicatorModel extends WT_G3x5_AoAIndicatorModel {
    _updateShow() {
        this._show = this._aoaMode === WT_G3x5_PFDAoAModeSetting.Mode.ON;
    }
}

class WT_G3000_PFDAoAIndicatorHTMLElement extends WT_G3x5_PFDAoAIndicatorHTMLElement {
    _getTemplate() {
        return WT_G3000_PFDAoAIndicatorHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._tick = this.shadowRoot.querySelector(`#tick`);
        this._redArc = this.shadowRoot.querySelector(`#redarc`);
        this._needle = new WT_CachedElement(this.shadowRoot.querySelector(`#needle`));
    }

    _rotateElement(element, fraction) {
        element.setAttribute("transform", `rotate(${fraction * 90} 95 95)`);
    }

    _updateTick() {
        this._rotateElement(this._tick, this._context ? this._context.tickFraction : 0.5);
    }

    _updateRedArc() {
        let angle = ((this._context ? this._context.redFraction : 1) - 1) * Math.PI / 2;
        let x = 95 + 90 * Math.sin(angle);
        let y = 95 - 90 * Math.cos(angle);
        this._redArc.setAttribute("d", `M ${x} ${y} A 90 90 0 0 1 95 5`);
    }

    _updateFromContext() {
        this._updateTick();
        this._updateRedArc();
    }

    _setVisibility(value) {
        this.setAttribute("show", `${value}`);
    }

    _setNeedlePosition(normalizedAoA) {
        let fraction = Math.max(0, Math.min(1, normalizedAoA));
        this._rotateElement(this._needle, fraction);
    }

    _setNeedleColor(normalizedAoA) {
        if (normalizedAoA >= this._context.redFraction) {
            this._needle.setAttribute("red", "true");
        } else {
            this._needle.setAttribute("red", "false");
        }
    }
}
WT_G3000_PFDAoAIndicatorHTMLElement.NAME = "wt-pfd-aoaindicator";
WT_G3000_PFDAoAIndicatorHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDAoAIndicatorHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: none;
            background-color: var(--wt-g3x5-bggray);
            border-radius: 5px;
        }
        :host([show="true"]) {
            display: block;
        }

        #wrapper {
            position: absolute;
            left: var(--aoaindicator-margin-left, 0%);
            top: var(--aoaindicator-margin-top, 0%);
            width: calc(100% - var(--aoaindicator-margin-left, 0%) - var(--aoaindicator-margin-right, 0%));
            height: calc(100% - var(--aoaindicator-margin-top, 0%) - var(--aoaindicator-margin-bottom, 0%));
        }
            #gauge {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
            }
                svg {
                    width: 90%;
                    height: 100%;
                }
                    #tick {
                        stroke: white;
                        stroke-width: 2;
                        fill: transparent;
                    }
                    .arc {
                        stroke-width: 6;
                        fill: transparent;
                    }
                    #whitearc {
                        stroke: white;
                    }
                    #redarc {
                        stroke: red;
                    }
                    #needle {
                        stroke: black;
                        stroke-width: 1;
                        fill: white;
                    }
                    #needle[red="true"] {
                        fill: red;
                    }
            #label {
                position: absolute;
                right: 0%;
                top: 60%;
                transform: translateY(-50%);
            }
    </style>
    <div id="wrapper">
        <div id="gauge">
            <svg viewBox="0 0 100 100">
                <path id="tick" d="M 5 95 L -15 95"></path>
                <path id="whitearc" class="arc" d="M 5 95 A 90 90 0 0 1 95 5"></path>
                <path id="redarc" class="arc" d=""></path>
                <path id="needle" d="M 5 95 L 25 100 L 25 90 Z"></path>
            </svg>
        </div>
        <div id="label">AOA</div>
    </div>
`;

customElements.define(WT_G3000_PFDAoAIndicatorHTMLElement.NAME, WT_G3000_PFDAoAIndicatorHTMLElement);