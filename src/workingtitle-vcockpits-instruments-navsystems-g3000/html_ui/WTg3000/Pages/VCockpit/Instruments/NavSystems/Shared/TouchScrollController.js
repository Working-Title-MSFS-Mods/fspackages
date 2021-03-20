/**
 * Controls scrolling for a touchscreen element.
 */
class WT_TouchScrollController {
    /**
     * @param {*} scrollElement - the scrolling element to control.
     * @param {Number} scrollSpeed - the scroll speed to use, in pixels per second.
     * @param {Number} marginX - the margin around elements, in pixels, along the horizontal axis to respect when scrolling elements into view.
     * @param {Number} marginY - the margin around elements, in pixels, along the vertical axis to respect when scrolling elements into view.
     */
    constructor(scrollElement, scrollSpeed = 2000, marginX = 0, marginY = 0) {
        this.scrollElement = scrollElement;
        this.scrollSpeed = scrollSpeed;
        this.marginX = marginX;
        this.marginY = marginY;
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
    }

    _onMouseDown(event) {
        this._mouseMoveLastPosX = event.x;
        this._mouseMoveLastPosY = event.y;
        this._mouseMoveLastScrollLeft = this.scrollElement.scrollLeft;
        this._mouseMoveLastScrollTop = this.scrollElement.scrollTop;
        this._isMouseDragging = true;
    }

    _onMouseUp(event) {
        this._isMouseDragging = false;
    }

    _onMouseMove(event) {
        if (this._isMouseDragging) {
            this.scrollObjectiveX = this._mouseMoveLastScrollLeft - (event.x - this._mouseMoveLastPosX);
            this.scrollObjectiveY = this._mouseMoveLastScrollTop - (event.y - this._mouseMoveLastPosY);
            this._isScrollLocked = true;
        }
    }

    get scrollObjectiveX() {
        return this._scrollObjectiveX;
    }

    set scrollObjectiveX(val) {
        this._scrollObjectiveX = Math.max(0, Math.min(val, this.scrollElement.scrollWidth - this.scrollElement.clientWidth));
    }

    get scrollObjectiveY() {
        return this._scrollObjectiveY;
    }

    set scrollObjectiveY(val) {
        this._scrollObjectiveY = Math.max(0, Math.min(val, this.scrollElement.scrollHeight - this.scrollElement.clientHeight));
    }

    _scrollElementIntoViewX(element) {
        let elementLeft = element.getBoundingClientRect().left - this.scrollElement.getBoundingClientRect().left + this.scrollElement.scrollLeft;
        let elementRight = elementLeft + element.clientWidth;
        let scrollLeft = this.scrollElement.scrollLeft;
        let scrollWidth = this.scrollElement.clientWidth;
        let scrollRight = scrollLeft + scrollWidth;

        if (elementRight > scrollRight - this.marginX) {
            this.scrollObjectiveX = Math.min(elementLeft - this.marginX, elementRight + this.marginX - scrollWidth);
            this._isScrollLocked = true;
        } else if (elementLeft < scrollLeft + this.marginX) {
            this.scrollObjectiveX = elementLeft - this.marginX;
            this._isScrollLocked = true;
        }
    }

    _scrollElementIntoViewY(element) {
        let elementTop = element.getBoundingClientRect().top - this.scrollElement.getBoundingClientRect().top + this.scrollElement.scrollTop;
        let elementBottom = elementTop + element.clientHeight;
        let scrollTop = this.scrollElement.scrollTop;
        let scrollHeight = this.scrollElement.clientHeight;
        let scrollBottom = scrollTop + scrollHeight;

        if (elementBottom > scrollBottom - this.marginY) {
            this.scrollObjectiveY = Math.min(elementTop - this.marginY, elementBottom + this.marginY - scrollHeight);
            this._isScrollLocked = true;
        } else if (elementTop < scrollTop + this.marginY) {
            this.scrollObjectiveY = elementTop - this.marginY;
            this._isScrollLocked = true;
        }
    }

    scrollToElement(element, forceMiddle = false) {
        if (forceMiddle) {
            let offsetLeft = element.getBoundingClientRect().left - this.scrollElement.getBoundingClientRect().left + this.scrollElement.scrollLeft;
            let offsetTop = element.getBoundingClientRect().top - this.scrollElement.getBoundingClientRect().top + this.scrollElement.scrollTop;
            this.scrollObjectiveX = offsetLeft - this.scrollElement.clientWidth / 2 + element.clientWidth / 2;
            this.scrollObjectiveY = offsetTop - this.scrollElement.clientHeight / 2 + element.clientHeight / 2;
            this._isScrollLocked = true;
        } else {
            this._scrollElementIntoViewX(element);
            this._scrollElementIntoViewY(element);
        }
    }

    update() {
        let currentTime = Date.now() / 1000;
        let deltaTime = currentTime - this._lastUpdateTime;
        this._lastUpdateTime = currentTime;
        if (this._isScrollLocked) {
            let currentScrollLeft = this.scrollElement.scrollLeft;
            let currentScrollTop = this.scrollElement.scrollTop;

            if (this.scrollObjectiveX == currentScrollLeft && this.scrollObjectiveY == currentScrollTop) {
                this._isScrollLocked = false;
                return;
            }

            let scrollDelta = this.scrollSpeed * deltaTime;
            let deltaX = this.scrollObjectiveX - currentScrollLeft;
            let deltaY = this.scrollObjectiveY - currentScrollTop;
            let hypSquared = deltaX * deltaX + deltaY * deltaY;
            let ratio = scrollDelta * scrollDelta / hypSquared;
            if (ratio >= 1) {
                this.scrollElement.scrollLeft = this.scrollObjectiveX;
                this.scrollElement.scrollTop = this.scrollObjectiveY;
                this._isScrollLocked = false;
            } else {
                this.scrollElement.scrollLeft = currentScrollLeft + deltaX * ratio;
                this.scrollElement.scrollTop = currentScrollTop + deltaY * ratio;
            }
        }
    }

    scrollLeft() {
        this.scrollObjectiveX = this.scrollElement.scrollLeft - this.scrollElement.clientWidth;
        this._isScrollLocked = true;
    }

    scrollRight() {
        this.scrollObjectiveX = this.scrollElement.scrollLeft + this.scrollElement.clientWidth;
        this._isScrollLocked = true;
    }

    scrollUp() {
        this.scrollObjectiveY = this.scrollElement.scrollTop - this.scrollElement.clientHeight;
        this._isScrollLocked = true;
    }

    scrollDown() {
        this.scrollObjectiveY = this.scrollElement.scrollTop + this.scrollElement.clientHeight;
        this._isScrollLocked = true;
    }
}