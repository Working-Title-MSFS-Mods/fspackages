export enum CJ4_MapSymbol {
  TRAFFIC = 0,
  CONSTRAINTS = 1,
  AIRSPACES = 2,
  AIRWAYS = 3,
  AIRPORTS = 4,
  INTERSECTS = 5,
  NAVAIDS = 6,
  NDBS = 7,
  TERMWPTS = 8,
  MISSEDAPPR = 9
}

export class CJ4_MapSymbols {
  static toggleSymbol(_symbol): Promise<void> {
    return new Promise(function (resolve) {
      let symbols = SimVar.GetSimVarValue("L:CJ4_MAP_SYMBOLS", "number");
      if (symbols == -1) {
        resolve();
      } // if it fails, it fails
      symbols ^= (1 << _symbol);
      SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "number", symbols).then(() => {
        resolve();
      });
    });
  }

  static hasSymbol(_symbol: CJ4_MapSymbol): number {
    const symbols = SimVar.GetSimVarValue("L:CJ4_MAP_SYMBOLS", "number");
    if (symbols == -1) {
      return 0;
    }
    if (symbols & (1 << _symbol)) {
      return 1;
    }
    return 0;
  }
}