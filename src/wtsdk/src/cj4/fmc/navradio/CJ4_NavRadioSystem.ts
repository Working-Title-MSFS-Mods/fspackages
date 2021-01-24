import { CJ4_NearestVORSearch } from "./CJ4_NearestVORSearch";

/**
 * The CJ4 Nav Radio system.
 */
export class CJ4_NavRadioSystem {
  
  /** The states of the nav radios. */
  public radioStates: CJ4NavRadioState[] = [];

  public presets: number[] = [];

  /** Whether or not a nearest VOR search is pending. */
  private searchPending: boolean = false;

  constructor() {
    this.radioStates[1] = new CJ4NavRadioState(1);
    this.radioStates[2] = new CJ4NavRadioState(2);
  }

  /**
   * Initializes the radio system.
   */
  public initialize() {
    const presetsString = WTDataStore.get(`WT_CJ4_NAV_RADIO_PRESETS`, '[]');
    this.presets = JSON.parse(presetsString);

    setInterval(() => {
      this.radioStates[1].initialize();
      this.radioStates[2].initialize();
    }, 1000);
  }

  /**
   * Updates the nav radio system.
   */
  public update() {

    const radio1Freq = parseFloat(SimVar.GetSimVarValue('NAV ACTIVE FREQUENCY:1', 'MHz').toFixed(2));
    const radio2Freq = parseFloat(SimVar.GetSimVarValue('NAV ACTIVE FREQUENCY:2', 'MHz').toFixed(2));

    if (radio1Freq !== this.radioStates[1].frequency) {
      this.radioStates[1].frequency = radio1Freq;
    }
    
    if (radio2Freq !== this.radioStates[2].frequency) {
      this.radioStates[2].frequency = radio2Freq;
    }

    this.updateAutoTuning();
  }

  /**
   * Sets a nav radio preset.
   * @param index The index of the preset to set.
   * @param frequency The frequency to set the preset to.
   */
  public setPreset(index: number, frequency: number): void {
    this.presets[index] = frequency;
    WTDataStore.set(`WT_CJ4_NAV_RADIO_PRESETS`, JSON.stringify(this.presets));
  }

  /**
   * Updates the auto-tuning of the nav radios.
   */
  private updateAutoTuning() {
    const now = Date.now();

    const nav1TimeSinceTuned = now - this.radioStates[1].lastAutoTuned;
    const nav2TimeSinceTuned = now - this.radioStates[2].lastAutoTuned;
    const sixMinutes = 6 * 60 * 1000;

    let shouldSearch1 = false;
    let shouldSearch2 = false;
    if (this.radioStates[1].mode === NavRadioMode.Auto && nav1TimeSinceTuned > sixMinutes && !this.searchPending) {
      shouldSearch1 = true;
    }

    if (this.radioStates[2].mode === NavRadioMode.Auto && nav2TimeSinceTuned > sixMinutes && !this.searchPending) {
      shouldSearch2 = true;
    }

    if (shouldSearch1 || shouldSearch2) {
      this.searchPending = true;
      CJ4_NearestVORSearch.searchNearest(100, 10).then(stations => {
        if (stations[0] && shouldSearch1) {
          this.radioStates[1].setAutomaticFrequency(stations[0].frequency);
          this.radioStates[1].lastAutoTuned = Date.now();
        }

        if (stations[1] && shouldSearch2) {
          this.radioStates[2].setAutomaticFrequency(stations[1].frequency);
          this.radioStates[2].lastAutoTuned = Date.now();
        }

        this.searchPending = false;
      });
    }
  }
}

export enum NavRadioMode {
  Manual = 'MAN',
  Auto = 'AUTO'
}

/**
 * The state of a single NAV radio.
 */
export class CJ4NavRadioState {

  /** The index of the radio. */
  public radioIndex: 1 | 2;

  /** The current nav radio mode. */
  public mode: NavRadioMode = NavRadioMode.Manual;

  /** The current nav radio frequency. */
  public frequency: number = 110.0;

  /** The last time the nav radio was auto-tuned. */
  public lastAutoTuned: number = 0;

  /**
   * Creates an instance of CJ4NavRadioState.
   * @param radioIndex The index of the radio.
   */
  constructor(radioIndex: 1 | 2) {
    this.radioIndex = radioIndex;
  }

  /**
   * Initializes the radio state.
   */
  public initialize(): void {
    this.frequency = WTDataStore.get(`WT_CJ4_LAST_NAV_FREQ:${this.radioIndex}`, 110.0);
    SimVar.SetSimVarValue(`K:NAV${this.radioIndex}_RADIO_SET_HZ`, 'Hz', this.frequency * 1000000);
  }

  /**
   * Sets a manual nav frequency.
   * @param frequency The frequency to set.
   */
  public setManualFrequency(frequency: number): void {
    SimVar.SetSimVarValue(`K:NAV${this.radioIndex}_RADIO_SET_HZ`, 'Hz', frequency * 1000000);
    WTDataStore.set(`WT_CJ4_LAST_NAV_FREQ:${this.radioIndex}`, frequency);

    this.mode = NavRadioMode.Manual;
    this.lastAutoTuned = 0;
    this.frequency = frequency;
  }

  /**
   * Sets an automatically set nav frequency.
   * @param frequency The frequency to set.
   */
  public setAutomaticFrequency(frequency: number): void {
    SimVar.SetSimVarValue(`K:NAV${this.radioIndex}_RADIO_SET_HZ`, 'Hz', frequency * 1000000);
    WTDataStore.set(`WT_CJ4_LAST_NAV_FREQ:${this.radioIndex}`, frequency);
  }
}