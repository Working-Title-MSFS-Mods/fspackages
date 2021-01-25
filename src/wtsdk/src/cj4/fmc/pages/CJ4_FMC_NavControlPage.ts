import { CJ4_FMC_Page } from "../CJ4_FMC_Page";
import { CJ4_NavRadioSystem, NavRadioMode } from "../navradio/CJ4_NavRadioSystem";

/**
 * The NAV CONTROL FMC page.
 */
export class CJ4_FMC_NavControlPage extends CJ4_FMC_Page {

  /** An instance of the nav radio system. */
  public radioSystem: CJ4_NavRadioSystem;

  /** The radio index for the page. */
  public radioIndex: number;

  /** An instance of the template renderer. */
  public templateRenderer: WT_FMC_Renderer;

  /** The current page number. */
  public currentPageNumber: number = 1;

  /**
   * Creates an instance of the CJ4_FMC_NavControlPage.
   * @param fmc The FMC to use with this instance.
   * @param radioIndex The index of the radio for the page.
   */
  constructor(fmc: CJ4_FMC, radioIndex: number) {
    super(fmc);

    this.radioSystem = fmc._navRadioSystem;
    this.radioIndex = radioIndex;
    this.templateRenderer = fmc._templateRenderer;
  }

  /**
   * Whether or not the page has an automatic refresh.
   */
  public hasRefresh(): boolean {
    return true;
  }

  /**
   * Updates the page.
   */
  public update(): void {
    this.isDirty = true;
  }

  /**
   * Renders the nav control page.
   */
  public render(): void {
    const rows: Array<string[]> = [];
    const radioState = this.radioSystem.radioStates[this.radioIndex];
    const autoManSwitch = this.templateRenderer.renderSwitch(['AUTO', 'MAN'], radioState.mode === NavRadioMode.Auto ? 0 : 1, 'blue');

    rows.push(['', `${this.currentPageNumber}/7[blue]`, `NAV${this.radioIndex} CONTROL[blue]`]);
    rows.push([` NAV${this.radioIndex}`, 'NAV TUNING ']);
    rows.push([`${radioState.frequency.toFixed(2)}[green]`, autoManSwitch]);
    rows.push([` DME${this.radioIndex}`]);
    rows.push(['HOLD[disabled s-text]', 'TEST[disabled s-text]']);
    rows.push([' MKR SENS']);
    rows.push(['LO/[disabled]HI[disabled s-text]']);
    rows.push(['------[blue] NAV PRESETS[white] -----[blue]']);

    const presetStart = ((this.currentPageNumber * 3) - 3) + 1;

    rows.push([`${this.displayPreset(presetStart - 1)}`, `${presetStart}`]);
    rows.push(['']);
    rows.push([`${this.displayPreset(presetStart)}`, `${presetStart + 1}`]);
    rows.push(['']);

    if (this.currentPageNumber !== 7) {
      rows.push([`${this.displayPreset(presetStart + 1)}`, `${presetStart + 2}`]);
    }

    this.templateRenderer.setTemplateRaw(rows);
  }

  /**
   * Gets the display value for a given nav radio preset.
   * @param preset The preset index to display.
   * @returns The preset frequency as a string.
   */
  private displayPreset(preset: number): string {
    const presetFrequency = this.radioSystem.presets[preset];
    return presetFrequency?.toFixed(2) ?? '';
  }

  /**
   * Binds input events for the nav control page.
   */
  public bindEvents(): void {
    
    this._fmc.onLeftInput[0] = () => {
      const radioState = this.radioSystem.radioStates[this.radioIndex];
      this.handleFreqPressed(() => radioState.frequency, value => radioState.setManualFrequency(value));

      this.render();
      this.bindEvents();
    }

    this._fmc.onRightInput[0] = () => {
      const radioState = this.radioSystem.radioStates[this.radioIndex];
      radioState.mode = radioState.mode === NavRadioMode.Auto ? NavRadioMode.Manual : NavRadioMode.Auto;

      this.render();
      this.bindEvents();
    }

    this.bindPresets(this.currentPageNumber === 7 ? 2 : 3, 3, (this.currentPageNumber * 3) - 3);

    this._fmc.onNextPage = () => {
      this.currentPageNumber = Math.min(this.currentPageNumber + 1, 7);

      this.render();
      this.bindEvents();
    }

    this._fmc.onPrevPage = () => {
      this.currentPageNumber = Math.max(this.currentPageNumber - 1, 1);

      this.render();
      this.bindEvents();
    }
  }

  /**
   * Binds the buttons for the preset LSKs.
   * @param totalPresets The total number of presets on the page.
   * @param startLSK The starting LSK for the preset bindings.
   * @param startPreset The starting index for the presets.
   */
  private bindPresets(totalPresets: number, startLSK: number, startPreset: number): void {
    for (let i = 0; i < totalPresets; i++) {
      this._fmc.onLeftInput[startLSK + i] = () => { 
        this.handleFreqPressed(() => this.radioSystem.presets[startPreset + i], value => this.radioSystem.setPreset(startPreset + i, value));

        this.render();
        this.bindEvents();
      }
    }
  }

  /**
   * Handles when a frequency button is pressed on the page.
   * @param getter A function that gets the frequency value to copy to the scratchpad.
   * @param setter A function that sets the frequency value into the radio state from the parsed input.
   */
  private handleFreqPressed(getter: () => number, setter: (value: number) => void): void {
    if (this._fmc.inOut !== undefined && this._fmc.inOut !== '') {
      const numValue = this.radioSystem.parseFrequencyInput(this._fmc.inOut);

      if (isFinite(numValue) && numValue >= 108 && numValue <= 117.95 && RadioNav.isHz50Compliant(numValue)) {
        setter(numValue);
        this._fmc.inOut = '';
      }
      else {
        this._fmc.showErrorMessage(this._fmc.defaultInputErrorMessage);
      }
    }
    else {
      this._fmc.inOut = getter().toFixed(2);
    }
  }
}