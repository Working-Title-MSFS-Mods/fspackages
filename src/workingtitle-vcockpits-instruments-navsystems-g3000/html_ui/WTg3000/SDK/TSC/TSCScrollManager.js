/**
 * Manages scrolling for a touchscreen element.
 */
class WT_TSCScrollManager {
    /**
     * @param {HTMLElement} scrollElement - the scrolling element to manage.
     * @param {Object} [options] - an options object defining the new manager's initial options.
     */
    constructor(scrollElement, options) {
        this._scrollElement = scrollElement;

        this._scrollObjectiveX = 0;
        this._scrollObjectiveY = 0;
        this._isMouseDragging = false;
        this._mouseMoveLastPosX = 0;
        this._mouseMoveLastPosY = 0;
        this._mouseMoveLastScrollLeft = 0;
        this._mouseMoveLastScrollTop = 0;
        this._isScrollLocked = false;
        this._lastUpdateTime = Date.now() / 1000;

        this.scrollElement.addEventListener("mouseup", this._onMouseUp.bind(this));
        this.scrollElement.addEventListener("mouseleave", this._onMouseUp.bind(this));
        this.scrollElement.addEventListener("mousedown", this._onMouseDown.bind(this));
        this.scrollElement.addEventListener("mousemove", this._onMouseMove.bind(this));

        this._optsManager = new WT_OptionsManager(this, WT_TSCScrollManager.OPTIONS_DEF);
        if (options) {
            this._optsManager.setOptions(options);
        }
    }

    /**
     * The scrolling element managed by this manager.
     * @readonly
     * @type {HTMLElement}
     */
    get scrollElement() {
        return this._scrollElement;
    }

    /**
     * Sets this manager's options.
     * @param {Object} options - an options object.
     */
    setOptions(options) {
        this._optsManager.setOptions(options);
    }

    _onMouseDown(event) {
        this._mouseMoveLastPosX = event.x;
        this._mouseMoveLastPosY = event.y;
        this._mouseMoveLastScrollLeft = this.scrollElement.scrollLeft;
        this._mouseMoveLastScrollTop = this.scrollElement.scrollTop;
        this._isMouseDragging = this.allowDragging;
    }

    _onMouseUp(event) {
        this._isMouseDragging = false;
    }

    _onMouseMove(event) {
        if (this._isMouseDragging) {
            let x = this._mouseMoveLastScrollLeft - (event.x - this._mouseMoveLastPosX);
            let y = this._mouseMoveLastScrollTop - (event.y - this._mouseMoveLastPosY);
            this._scrollTo(x, y);
        }
    }

    _snapTo(x, y) {
        this.scrollElement.scrollLeft = x;
        this.scrollElement.scrollTop = y;
    }

    _scrollTo(x, y) {
        this._scrollObjectiveX = Math.max(0, Math.min(this.scrollElement.scrollWidth, x));
        this._scrollObjectiveY = Math.max(0, Math.min(this.scrollElement.scrollHeight, y));
        this._isScrollLocked = true;
    }

    _calculateElementScrollObjective(element, toCenter) {
        let elementLeft = element.getBoundingClientRect().left - this.scrollElement.getBoundingClientRect().left + this.scrollElement.scrollLeft;
        let elementTop = element.getBoundingClientRect().top - this.scrollElement.getBoundingClientRect().top + this.scrollElement.scrollTop;
        if (toCenter) {
            return {
                x: elementLeft - this.scrollElement.clientWidth / 2 + element.clientWidth / 2,
                y: elementTop - this.scrollElement.clientHeight / 2 + element.clientHeight / 2
            };
        } else {
            let elementRight = elementLeft + element.clientWidth;
            let scrollLeft = this.scrollElement.scrollLeft;
            let scrollWidth = this.scrollElement.clientWidth;
            let scrollRight = scrollLeft + scrollWidth;

            let objectiveX;
            if (elementRight > scrollRight - this.marginX) {
                objectiveX = Math.min(elementLeft - this.marginX, elementRight + this.marginX - scrollWidth);
            } else if (elementLeft < scrollLeft + this.marginX) {
                objectiveX = elementLeft - this.marginX;
            } else {
                objectiveX = scrollLeft;
            }

            let elementBottom = elementTop + element.clientHeight;
            let scrollTop = this.scrollElement.scrollTop;
            let scrollHeight = this.scrollElement.clientHeight;
            let scrollBottom = scrollTop + scrollHeight;

            let objectiveY;
            if (elementBottom > scrollBottom - this.marginY) {
                objectiveY = Math.min(elementTop - this.marginY, elementBottom + this.marginY - scrollHeight);
            } else if (elementTop < scrollTop + this.marginY) {
                objectiveY = elementTop - this.marginY;
            } else {
                objectiveY = scrollTop;
            }

            return {
                x: objectiveX,
                y: objectiveY
            }
        }
    }

    /**
     * Snaps this manager's scrolling element to a target child element.
     * @param {Element} element - the target child element to which to snap.
     * @param {Boolean} [toCenter] - whether to scroll such that the target element is positioned in the center of
     *                               the scrolling element. If false, the scrolling element will be scrolled the
     *                               minimum amount to place as much of the target element into view as possible.
     *                               False by default.
     */
    snapToElement(element, toCenter = false) {
        let objective = this._calculateElementScrollObjective(element, toCenter);
        this._snapTo(objective.x, objective.y);
        this._isScrollLocked = false;
    }

    /**
     * Scrolls this manager's scrolling element to a target child element.
     * @param {Element} element - the target child element to which to scroll.
     * @param {Boolean} [toCenter] - whether to scroll such that the target element is positioned in the center of
     *                               the scrolling element. If false, the scrolling element will be scrolled the
     *                               minimum amount to place as much of the target element into view as possible.
     *                               False by default.
     */
    scrollToElement(element, toCenter = false) {
        let objective = this._calculateElementScrollObjective(element, toCenter);
        this._scrollTo(objective.x, objective.y);
    }

    /**
     * Scrolls this manager's scrolling element to the left a distance equal to the scrolling element's visible width.
     */
    scrollLeft() {
        let x = this.scrollElement.scrollLeft - this.scrollElement.clientWidth;
        let y = this.scrollElement.scrollTop;
        this._scrollTo(x, y);
    }

    /**
     * Scrolls this manager's scrolling element to the right a distance equal to the scrolling element's visible width.
     */
    scrollRight() {
        let x = this.scrollElement.scrollLeft + this.scrollElement.clientWidth;
        let y = this.scrollElement.scrollTop;
        this._scrollTo(x, y);
    }

    /**
     * Scrolls this manager's scrolling element up a distance equal to the scrolling element's visible height.
     */
    scrollUp() {
        let x = this.scrollElement.scrollLeft;
        let y = this.scrollElement.scrollTop - this.scrollElement.clientHeight;
        this._scrollTo(x, y);
    }

    /**
     * Scrolls this manager's scrolling element down a distance equal to the scrolling element's visible height.
     */
    scrollDown() {
        let x = this.scrollElement.scrollLeft;
        let y = this.scrollElement.scrollTop + this.scrollElement.clientHeight;
        this._scrollTo(x, y);
    }

    /**
     * Cancels this manager's current scrolling action.
     */
    cancelScroll() {
        this._isScrollLocked = false;
    }

    update() {
        let currentTime = Date.now() / 1000;
        let deltaTime = currentTime - this._lastUpdateTime;
        this._lastUpdateTime = currentTime;
        if (this._isScrollLocked) {
            let currentScrollLeft = this.scrollElement.scrollLeft;
            let currentScrollTop = this.scrollElement.scrollTop;

            if (this._scrollObjectiveX == currentScrollLeft && this._scrollObjectiveY == currentScrollTop) {
                this._isScrollLocked = false;
                return;
            }

            let scrollDelta = this.scrollSpeed * deltaTime;
            let deltaX = this._scrollObjectiveX - currentScrollLeft;
            let deltaY = this._scrollObjectiveY - currentScrollTop;
            let hyp = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            let ratio = scrollDelta / hyp;
            if (ratio >= 1 - WT_TSCScrollManager.SCROLL_TOLERANCE) {
                this.scrollElement.scrollLeft = this._scrollObjectiveX;
                this.scrollElement.scrollTop = this._scrollObjectiveY;
                this._isScrollLocked = false;
            } else {
                this.scrollElement.scrollLeft = currentScrollLeft + deltaX * ratio;
                this.scrollElement.scrollTop = currentScrollTop + deltaY * ratio;
            }
        }
    }
}
WT_TSCScrollManager.SCROLL_TOLERANCE = 1e-6;
WT_TSCScrollManager.OPTIONS_DEF = {
    allowDragging: {default: true, auto: true},
    scrollSpeed: {default: 2000, auto: true},
    marginX: {default: 0, auto: true},
    marginY: {default: 0, auto: true}
};