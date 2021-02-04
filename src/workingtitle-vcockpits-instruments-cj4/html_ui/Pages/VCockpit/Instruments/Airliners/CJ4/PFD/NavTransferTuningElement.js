/**
 * The nav-to-nav transfer ghost needle info tuning indicator
 * for the PFD.
 */
class NavTransferTuningElement {
  /**
   * Creates an instance of the NavTransferTuningElement.
   * @param {HTMLDivElement} element The underlying HTML div element.
   */
  constructor(element) {
    /** The underlying HTML element. */
    this.element = element;

    /** Whether or not the element is displayed. */
    this.isDisplayed = undefined;

    /** The current frequency to display in the element. */
    this.frequency = '';
  }

  /**
   * Sets if the element is displayed.
   * @param {boolean} displayed Whether or not the element is displayed.
   */
  setDisplayed(displayed) {
    if (displayed !== this.isDisplayed) {
      this.element.style.display = displayed ? 'block' : 'none';
      this.isDisplayed = displayed;
    }
  }

  /**
   * Sets the displayed frequency.
   * @param {number} frequency The frequency to display.
   */
  setFrequency(frequency) {
    const fixedFrequency = frequency.toFixed(2);
    if (fixedFrequency !== this.frequency) {
      const frequencyLabelEl = this.element.querySelector('.preset-tuning-frequency');
      if (frequencyLabelEl) {
        frequencyLabelEl.textContentCached = fixedFrequency;
      }

      this.frequency = fixedFrequency;
    }
  }
}