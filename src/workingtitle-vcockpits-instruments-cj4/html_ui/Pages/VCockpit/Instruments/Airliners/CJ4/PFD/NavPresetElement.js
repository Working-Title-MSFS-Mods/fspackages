/**
 * The nav-to-nav transfer ghost needle info tuning indicator
 * for the PFD.
 */
class NavPresetElement {
  /**
   * Creates an instance of the NavPresetElement.
   * @param {HTMLDivElement} element The underlying HTML div element.
   */
  constructor(element) {
    /** The underlying HTML element. */
    this.element = element;

    /** Whether or not the element is displayed. */
    this.isDisplayed = undefined;

    /** The current frequency to display in the element. */
    this.preset = '';
  }

  /**
   * Sets if the element is displayed.
   * @param {boolean} displayed Whether or not the element is displayed.
   */
  setDisplayed(displayed) {
    if (displayed !== this.isDisplayed) {
      this.element.style.visibility = displayed ? '' : 'hidden';
      this.isDisplayed = displayed;
    }
  }

  /**
   * Updates the nav preset label.
   */
  update() {
    const navSource = SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "number");
    let preset = '';

    if (navSource === 0) {
      const hasLoc = SimVar.GetSimVarValue('NAV HAS LOCALIZER:1', 'Bool');
      preset = hasLoc ? 'LOC1' : 'VOR1';
    }

    if (navSource === 1) {
      const hasLoc = SimVar.GetSimVarValue('NAV HAS LOCALIZER:2', 'Bool');
      preset = hasLoc ? 'LOC2' : 'VOR2';
    }

    if (navSource === 2) {
      preset = 'FMS1';
    }

    if (preset !== this.preset) {
      const el = this.element.querySelector('.preset-name');
      if (el) {
        el.textContent = preset;
      }
    }
  }
}