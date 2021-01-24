/**
 * An annunciation display slot on the PFD FGS display.
 */
export class CJ4_FGSDisplaySlot {

  /** The current FGS slot display value. */
  private currentDisplayValue: string = '';

  /** The current timeout to cancel value change blinking. */
  private blinkTimeout: number;

  /**
   * Creates an instance of a CJ4_FGSDisplaySlot.
   * @param element The underlying HTML element.
   * @param shouldFlash Whether or not the element should flash on change.
   */
  constructor(private element: HTMLElement, private shouldFlash = false) {
    if (element === undefined || element === null) {
      throw new Error('Element cannot be undefined or null.');
    }
  }

  /**
   * Sets the FGS slot display value.
   * @param value The value to display.
   */
  public setDisplayValue(value: string): void {
    if (value !== this.currentDisplayValue) {

      this.currentDisplayValue = value;
      clearTimeout(this.blinkTimeout);
      
      if (value !== undefined || value !== '') {
        this.element.textContent = value;

        if (this.shouldFlash) {
          this.element.classList.add('blinking');
          this.blinkTimeout = setTimeout(() => this.element.classList.remove('blinking'), 4000);
        }
      }
      else {
        this.element.classList.remove('blinking');
        this.element.textContent = '';
      }
    }
  }
}
