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
    this.presetNavSource = 1;

    /** The current preset text. */
    this.currentPresetText = '';
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
   * Sets the preset nav source.
   * @param {number} navSource The nav source to set as preset.
   */
  setPreset(navSource) {
    this.presetNavSource = navSource;
  }

  /**
   * Updates the nav preset label.
   */
  update() {
    let preset = '';

    if (this.presetNavSource === 0) {
      preset = 'FMS1';
    }

    if (this.presetNavSource === 1) {
      const hasLoc = SimVar.GetSimVarValue('NAV HAS LOCALIZER:1', 'Bool');
      preset = hasLoc ? 'LOC1' : 'VOR1';
    }

    if (this.presetNavSource === 2) {
      const hasLoc = SimVar.GetSimVarValue('NAV HAS LOCALIZER:2', 'Bool');
      preset = hasLoc ? 'LOC2' : 'VOR2';
    }

    if (preset !== this.currentPresetText) {
      const el = this.element.querySelector('.preset-name');
      if (el) {
        el.textContentCached = preset;
        this.currentPresetText = preset;
      }
    }
  }
}
