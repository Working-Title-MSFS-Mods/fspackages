let PilotWaypointPage1Instance = undefined;

class CJ4_FMC_PilotWaypoint_Manager {
  constructor(fmc) {
    this._fmc = fmc;

    this._pilotWaypointArray = [];
    this._pilotWaypointCount = 0;

    this._pilotWaypointArray1 = []; //To protect datastore, only 5 wpts per array for a total of 25
    this._pilotWaypointArray2 = [];
    this._pilotWaypointArray3 = [];
    this._pilotWaypointArray4 = [];
    this._pilotWaypointArray5 = [];
      
  }

  activate() {
    this._pilotWaypointArray1 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_1', '{ }')); //To protect datastore, only 5 wpts per array for a total of 25
    this._pilotWaypointArray2 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_2', '{ }'));
    this._pilotWaypointArray3 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_3', '{ }'));
    this._pilotWaypointArray4 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_4', '{ }'));
    this._pilotWaypointArray5 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_5', '{ }'));

    if (this._pilotWaypointArray1.length > 0) {
      this._pilotWaypointArray = [...this._pilotWaypointArray1]
    }
    const k = "this._pilotWaypointArray";
    for (let i = 2; i <= 5; i++) {
      if ((eval(k + i)).length > 0) {
        const wpts = (eval(k + i)).length;
        for (let j = 0; j < wpts; j++) {
          this._pilotWaypointArray.push(eval(k + i)[j]);
        }
      }
    }
    console.log("Pilot waypoints loaded from datastore: " + this._pilotWaypointArray.length);
    this._pilotWaypointCount = this._pilotWaypointArray.length;
  }

  addPilotWaypoint(ident, latitude, longitude) {
    let pilotDuplicate = false;
    let databaseDuplicate = false;
    pilotDuplicate = this._pilotWaypointArray.find(w => { return w.id == ident;});

    if (!pilotDuplicate) {
      this._fmc.dataManager.GetWaypointsByIdent(ident).then((waypoints) => {
        if (waypoints && waypoints.length > 0) {
          databaseDuplicate = true;
        }
      });
    }

    if (pilotDuplicate || databaseDuplicate) {
      return false;
    }
    else {
      let pilotWaypoint = new CJ4_FMC_PilotWaypoint;
      pilotWaypoint.id = ident;
      pilotWaypoint.la = latitude;
      pilotWaypoint.lo = longitude;
      this._pilotWaypointArray.push(pilotWaypoint);
      this._pilotWaypointCount++;
      if (this._pilotWaypointCount > 25) {
        const deleteCount = this._pilotWaypointCount - 25;
        this._pilotWaypointArray.splice(0, deleteCount);
      }
      this.writePilotWaypointsToDatastore();
    }
  }

  deletePilotWaypoint(ident) {
    const pilotWaypoint = this._pilotWaypointArray.find(w => { return w.id == ident;});
    const pilotWaypointIndex = this._pilotWaypointArray.indexOf(pilotWaypoint);
    this._pilotWaypointArray.splice(pilotWaypointIndex, 1);
    this._pilotWaypointCount--;
    this.writePilotWaypointsToDatastore();
  }

  writePilotWaypointsToDatastore() {
    const pilotWaypointCount = this._pilotWaypointArray.length;
    if (pilotWaypointCount != this._pilotWaypointCount) {
      this._pilotWaypointCount = pilotWaypointCount;
    }
    const arraysRequired = Math.ceil(this._pilotWaypointCount / 5);

    const k = "this._pilotWaypointArray";
    
    for (let i = 1; i <= arraysRequired; i++) {
      eval(k + i) = [];
      for (let j = 0; j < 5; j++) {
        eval(k + i).push(this._pilotWaypointArray[((i - 1) * 5) + j]);
      }
      const waypointsToWrite = JSON.stringify(eval(k + i));
      WTDataStore.set(('CJ4_PILOTWPT_' + i), waypointsToWrite); 
    }
    
    if (arraysRequired < 5) {
      for (let l = arraysRequired + 1; l <= 5; l++) {
        if (WTDataStore.get('CJ4_PILOTWPT_' + l, '{ }') !== { }) {
          WTDataStore.remove('CJ4_PILOTWPT_' + l);
        }
      }
    }
    
  }
}

class CJ4_FMC_PilotWaypointPage {
  constructor(fmc) {
    this._fmc = fmc;
    this._isDirty = true; // render on first run ofc

    this._currentPage = 1;
    this._pageCount = 1;
    this._rows = [];

    this._selectedPilotWaypointIndex = undefined;
    this._showPilotWaypointPage = false;

    this._tempWaypoint = undefined;

    this.prepare();
  }

  prepare() {
    // Noop as there is no preparation with this
    this.update();
  }

  update(forceUpdate = false) {

    if (this._isDirty || forceUpdate) {
      this.invalidate();
    }

  }

  render() {

    if (this._showPilotWaypointPage) {
      let waypointLatString = "";
      let waypointLongString = "";
      let waypointIdent = "";

      if (this._selectedPilotWaypointIndex) {
        const waypoint = this._fmc._pilotWaypoint._pilotWaypointArray[this._selectedPilotWaypointIndex];
        waypointIdent = waypoint.ident;
        const waypointLatDir = waypoint.la >= 0 ? "N" : "S";
        const waypointLatDeg = Math.floor(Math.abs(waypoint.la));
        const waypointLatMin = 60 * (Math.abs(waypoint.la) - Math.abs(waypointLatDeg));
        waypointLatString = waypointLatDir + waypointLatDeg.toFixed(0).padStart(2, "0") + "\xB0C" + waypointLatMin.toFixed(2).padStart(5, "0");

        const waypointLongDir = waypoint.lo >= 0 ? "E" : "W";
        const waypointLongDeg = Math.floor(Math.abs(waypoint.lo));
        const waypointLongMin = 60 * (Math.abs(waypoint.lo) - Math.abs(waypointLongDeg));
        waypointLongString = waypointLongDir + waypointLongDeg.toFixed(0).padStart(3, "0") + "\xB0C" + waypointLongMin.toFixed(2).padStart(5, "0");
      } else {
        if (this._tempWaypoint && this._tempWaypoint.ident) {
          waypointLatString = this._tempWaypoint.la;
          waypointLongString = this._tempWaypoint.lo;
          waypointIdent = this._tempWaypoint.ident;
        } else {
          this._tempWaypoint = new CJ4_FMC_PilotWaypoint;
          waypointLatString = this._tempWaypoint.la;
          waypointLongString = this._tempWaypoint.lo;
          waypointIdent = this._tempWaypoint.ident;
        }
        

      }

      this._fmc._templateRenderer.setTemplateRaw([
        ["", "", "DEFINE PILOT WPT[blue]"],
        ["IDENT[blue s-text"],
        [waypointIdent + ""],
        [""],
        [""],
        [""],
        ["LATITUDE   LONGITUDE[blue s-text]"],
        [waypointLatString + "  " + waypointLongString],
        ["PLACE BRG  /DIST[blue s-text]"],
        [""],
        [""],
        [""],
        ["<STORE WPT", "RETURN>"]
      ]);
    }
    else {
      let waypointCells = [];
      const pages = Math.max(1, Math.ceil(this._fmc._pilotWaypoint._pilotWaypointCount / 5));
  
      for (let i = 0; i < 5; i++) {
        const pilotWaypoint = this._fmc._pilotWaypoint._pilotWaypointArray[i + ((this._currentPage - 1) * 5)]
        if (pilotWaypoint && pilotWaypoint.ident != undefined) {
          waypointCells.push(pilotWaypoint.ident);
        } else {
          waypointCells.push("");
        }
      }
  
      this._fmc._templateRenderer.setTemplateRaw([
        ["   PILOT WPT LIST[blue]", this._currentPage + "/" + pages + "[blue]"],
        [""],
        [waypointCells[0]],
        [""],
        [waypointCells[1]],
        [""],
        [waypointCells[2]],
        [""],
        [waypointCells[3]],
        [""],
        [waypointCells[4]],
        [""],
        ["<DATA BASE", "DEFINE WPT>"]
      ]);
    }

  }

  bindEvents() {

    if (this._showPilotWaypointPage) {


    } else {

      for (let i = 0; i < 5; i++) {
        this._fmc.onLeftInput[i] = () => {
          const selectedIndex = i + ((this._currentPage - 1) * 5);
          const pilotWaypoint = this._fmc._pilotWaypoint._pilotWaypointArray[selectedIndex]
          if (pilotWaypoint && pilotWaypoint.ident != undefined) {
            this._selectedPilotWaypointIndex = selectedIndex;
            this._showPilotWaypointPage = true;
            this.invalidate();
          } 
        }
      }

      this._fmc.onRightInput[5] = () => {
        this._selectedPilotWaypointIndex = undefined;
        this._showPilotWaypointPage = true;
        this.invalidate();
      };


    }

    

        this._fmc.onLeftInput[0] = () => { this.lightMode = this.lightMode + 1; };
        
        this._fmc.onLeftInput[1] = () => {
            let idValue = this._fmc.inOut;
            this.pilotId = idValue == FMCMainDisplay.clrValue ? "" : idValue;
            this._fmc.clearUserInput();
        };
        this._fmc.onLeftInput[2] = () => { this.cj4Units = this.cj4Units + 1; };
        this._fmc.onLeftInput[3] = () => { if (this._gpuAvailable) this.gpuSetting = this.gpuSetting + 1; };
        this._fmc.onLeftInput[4] = () => { this.yokeHide = this.yokeHide + 1; };
        this._fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage2(this._fmc); };
    }

    invalidate() {
        this._fmc.clearDisplay();
        this.render();
        this.bindEvents();
    }

    static ShowPage1(fmc) {
      fmc.clearDisplay();
  
      // create page instance and init 
      PilotWaypointPage1Instance = new CJ4_FMC_PilotWaypointPage(fmc);
      PilotWaypointPage1Instance.invalidate();
    }
}

/**
 * A Pilot Waypoint; simplified for minimal datastorage footprint.
 */
class CJ4_FMC_PilotWaypoint {
  constructor() {
    /** 
     * User Waypoint ident. 
     * @type {number}
     */
    this.id = undefined;

    /**
     * Latitude in DDMM.MM format.
     * @type {number}
     */
    this.la = undefined;

    /**
     * Longitude in in DDDMM.MM format.
     * @type {number}
     */
    this.lo = undefined;
  }
}