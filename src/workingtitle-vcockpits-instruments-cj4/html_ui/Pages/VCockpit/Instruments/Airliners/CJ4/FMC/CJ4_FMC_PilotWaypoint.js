let PilotWaypointPage1Instance = undefined;

class CJ4_FMC_PilotWaypoint_Manager {
  constructor(fmc) {
    this._fmc = fmc;

    this._pilotWaypointArray = [];
    this._pilotWaypointCount = 0;

    this._pilotWaypointArray1 = []; //To protect datastore, only 4 wpts per array for a total of 20
    this._pilotWaypointArray2 = [];
    this._pilotWaypointArray3 = [];
    this._pilotWaypointArray4 = [];
    this._pilotWaypointArray5 = [];

  }

  activate() {
    this._pilotWaypointArray1 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_1', '{ }')); //To protect datastore, only 4 wpts per array for a total of 20
    this._pilotWaypointArray2 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_2', '{ }'));
    this._pilotWaypointArray3 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_3', '{ }'));
    this._pilotWaypointArray4 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_4', '{ }'));
    this._pilotWaypointArray5 = JSON.parse(WTDataStore.get('CJ4_PILOTWPT_5', '{ }'));

    if (this._pilotWaypointArray1.length > 0) {
      this._pilotWaypointArray = [...this._pilotWaypointArray1];
    }
    if (this._pilotWaypointArray2.length > 0) {
      this._pilotWaypointArray.push(...this._pilotWaypointArray2);
    }
    if (this._pilotWaypointArray3.length > 0) {
      this._pilotWaypointArray.push(...this._pilotWaypointArray3);
    }
    if (this._pilotWaypointArray4.length > 0) {
      this._pilotWaypointArray.push(...this._pilotWaypointArray4);
    }
    if (this._pilotWaypointArray5.length > 0) {
      this._pilotWaypointArray.push(...this._pilotWaypointArray5);
    }

    console.log("Pilot waypoints loaded from datastore: " + this._pilotWaypointArray.length);
    this._pilotWaypointCount = this._pilotWaypointArray.length;
  }

  checkPilotDuplicates(ident) {
    return this._pilotWaypointArray.find(w => { return w.id == ident; }) !== undefined;
  }

  async checkDatabaseDuplicates(ident) {
    return new Promise(resolve => {
      this._fmc.dataManager.GetWaypointsByIdent(ident).then((waypoints) => {
        if (waypoints && waypoints.length > 0 && waypoints.find(w => { return w.ident === ident; })) {
          resolve(true);
        }
        else {
          resolve(false);
        }
      });
    });
  }

  async addPilotWaypoint(ident, latitude, longitude) {
    let duplicateExists = false;
    duplicateExists = this.checkPilotDuplicates(ident);
    if (!duplicateExists) {
      duplicateExists = await this.checkDatabaseDuplicates(ident);
    }
    if (duplicateExists) {
      return false;
    }
    else {
      const pilotWaypoint = new CJ4_FMC_PilotWaypoint(ident, latitude, longitude);
      this._pilotWaypointArray.push(pilotWaypoint);
      this._pilotWaypointCount++;
      if (this._pilotWaypointCount > 20) {
        const deleteCount = this._pilotWaypointCount - 20;
        this._pilotWaypointArray.splice(0, deleteCount);
      }
      this.writePilotWaypointsToDatastore();
      return true;
    }
  }

  addPilotWaypointWithOverwrite(ident, latitude, longitude) {
    let duplicateExists = false;
    duplicateExists = this.checkPilotDuplicates(ident);
    if (duplicateExists) {
      this.deletePilotWaypoint(ident);
    }
    const pilotWaypoint = new CJ4_FMC_PilotWaypoint(ident, Math.round(latitude * 10000) / 10000, Math.round(longitude * 10000) / 10000);
    this._pilotWaypointArray.push(pilotWaypoint);
    this._pilotWaypointCount++;
    if (this._pilotWaypointCount > 20) {
      const deleteCount = this._pilotWaypointCount - 20;
      this._pilotWaypointArray.splice(0, deleteCount);
    }
    this.writePilotWaypointsToDatastore();
    if (duplicateExists) {
      this._fmc.showErrorMessage("PILOT WPT OVERWRITE");
    } else {
      this._fmc.showErrorMessage("PILOT WPT ADDED");
    }
  }

  deletePilotWaypoint(ident) {
    const pilotWaypoint = this._pilotWaypointArray.find(w => { return w.id == ident; });
    if (pilotWaypoint) {
      const pilotWaypointIndex = this._pilotWaypointArray.indexOf(pilotWaypoint);
      this._pilotWaypointArray.splice(pilotWaypointIndex, 1);
      this._pilotWaypointCount--;
      this.writePilotWaypointsToDatastore();
      return true;
    } else {
      return false;
    }

  }

  writePilotWaypointsToDatastore() {
    const pilotWaypointCount = this._pilotWaypointArray.length;
    if (pilotWaypointCount != this._pilotWaypointCount) {
      this._pilotWaypointCount = pilotWaypointCount;
    }
    const arraysRequired = Math.ceil(this._pilotWaypointCount / 4);
    this._pilotWaypointArray1 = [];
    this._pilotWaypointArray2 = [];
    this._pilotWaypointArray3 = [];
    this._pilotWaypointArray4 = [];
    this._pilotWaypointArray5 = [];

    let waypointsToWrite = undefined;

    for (let i = 1; i <= arraysRequired; i++) {
      switch (i) {
        case 1:
          for (let j = 0; j < 4; j++) {
            if (this._pilotWaypointArray[((i - 1) * 4) + j]) {
              this._pilotWaypointArray1.push(this._pilotWaypointArray[((i - 1) * 4) + j]);
            }
          }
          waypointsToWrite = JSON.stringify(this._pilotWaypointArray1);
          WTDataStore.set(('CJ4_PILOTWPT_1'), waypointsToWrite);
          break;
        case 2:
          for (let j = 0; j < 4; j++) {
            if (this._pilotWaypointArray[((i - 1) * 4) + j]) {
              this._pilotWaypointArray2.push(this._pilotWaypointArray[((i - 1) * 4) + j]);
            }
          }
          waypointsToWrite = JSON.stringify(this._pilotWaypointArray2);
          WTDataStore.set(('CJ4_PILOTWPT_2'), waypointsToWrite);
          break;
        case 3:
          for (let j = 0; j < 4; j++) {
            if (this._pilotWaypointArray[((i - 1) * 4) + j]) {
              this._pilotWaypointArray3.push(this._pilotWaypointArray[((i - 1) * 4) + j]);
            }
          }
          waypointsToWrite = JSON.stringify(this._pilotWaypointArray3);
          WTDataStore.set(('CJ4_PILOTWPT_3'), waypointsToWrite);
          break;
        case 4:
          for (let j = 0; j < 4; j++) {
            if (this._pilotWaypointArray[((i - 1) * 4) + j]) {
              this._pilotWaypointArray4.push(this._pilotWaypointArray[((i - 1) * 4) + j]);
            }
          }
          waypointsToWrite = JSON.stringify(this._pilotWaypointArray4);
          WTDataStore.set(('CJ4_PILOTWPT_4'), waypointsToWrite);
          break;
        case 5:
          for (let j = 0; j < 4; j++) {
            if (this._pilotWaypointArray[((i - 1) * 4) + j]) {
              this._pilotWaypointArray5.push(this._pilotWaypointArray[((i - 1) * 4) + j]);
            }
          }
          waypointsToWrite = JSON.stringify(this._pilotWaypointArray5);
          WTDataStore.set(('CJ4_PILOTWPT_5'), waypointsToWrite);
          break;
      }
    }

    if (arraysRequired < 5) {
      for (let l = arraysRequired + 1; l <= 5; l++) {
        if (WTDataStore.get('CJ4_PILOTWPT_' + l, '{ }') !== {}) {
          WTDataStore.remove('CJ4_PILOTWPT_' + l);
        }
      }
    }

  }
}

class CJ4_FMC_PilotWaypointPage {
  constructor(fmc, defineWaypoint = false) {
    this._fmc = fmc;

    this._isDirty = true; // render on first run ofc

    this._currentPage = 1;
    this._pageCount = 1;
    this._rows = [];

    this._selectedPilotWaypointIndex = undefined;
    this._showPilotWaypointPage = defineWaypoint;

    this._tempWaypointParameters = {
      exists: false,
      ident: undefined,
      la: undefined,
      lo: undefined,
      pbd: undefined
    };

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
    let leftInputText = "<STORE WPT";
    if (this._showPilotWaypointPage) {
      let waypointLatString = "□□□□□□□□[s-text]";
      let waypointLongString = "□□□□□□□□[s-text]";
      let waypointIdent = "□□□□□[s-text]";
      let waypointPBD = "□□□□□□□□/□□□□[s-text]";

      if (this._selectedPilotWaypointIndex >= 0) {
        leftInputText = "<DELETE WPT";
        const waypoint = this._fmc._pilotWaypoints._pilotWaypointArray[this._selectedPilotWaypointIndex];
        waypointIdent = waypoint.id;
        const waypointLatDir = waypoint.la >= 0 ? "N" : "S";
        const waypointLatDeg = Math.floor(Math.abs(waypoint.la));
        const waypointLatMin = 60 * (Math.abs(waypoint.la) - Math.abs(waypointLatDeg));
        waypointLatString = waypointLatDir + waypointLatDeg.toFixed(0).padStart(2, "0") + "\xB0" + waypointLatMin.toFixed(2).padStart(5, "0");

        const waypointLongDir = waypoint.lo >= 0 ? "E" : "W";
        const waypointLongDeg = Math.floor(Math.abs(waypoint.lo));
        const waypointLongMin = 60 * (Math.abs(waypoint.lo) - Math.abs(waypointLongDeg));
        waypointLongString = waypointLongDir + waypointLongDeg.toFixed(0).padStart(3, "0") + "\xB0" + waypointLongMin.toFixed(2).padStart(5, "0");
        waypointPBD = "--------/---[s-text]";
      } else {
        if (this._tempWaypointParameters && this._tempWaypointParameters.exists) {
          waypointIdent = this._tempWaypointParameters.ident ? this._tempWaypointParameters.ident : "□□□□□[s-text]";
          waypointPBD = this._tempWaypointParameters.pbd ? this._tempWaypointParameters.pbd : "□□□□□□□□/□□□□[s-text]";

          if (this._tempWaypointParameters.la && this._tempWaypointParameters.lo) {
            const waypointLatDir = this._tempWaypointParameters.la >= 0 ? "N" : "S";
            const waypointLatDeg = Math.floor(Math.abs(this._tempWaypointParameters.la));
            const waypointLatMin = 60 * (Math.abs(this._tempWaypointParameters.la) - Math.abs(waypointLatDeg));
            waypointLatString = waypointLatDir + waypointLatDeg.toFixed(0).padStart(2, "0") + "\xB0" + waypointLatMin.toFixed(2).padStart(5, "0");
            const waypointLongDir = this._tempWaypointParameters.lo >= 0 ? "E" : "W";
            const waypointLongDeg = Math.floor(Math.abs(this._tempWaypointParameters.lo));
            const waypointLongMin = 60 * (Math.abs(this._tempWaypointParameters.lo) - Math.abs(waypointLongDeg));
            waypointLongString = waypointLongDir + waypointLongDeg.toFixed(0).padStart(3, "0") + "\xB0" + waypointLongMin.toFixed(2).padStart(5, "0");
          }
        }
      }

      this._fmc._templateRenderer.setTemplateRaw([
        ["", "", "DEFINE PILOT WPT[blue]"],
        ["IDENT[blue s-text]"],
        [waypointIdent + ""],
        [""],
        [""],
        [""],
        [""],
        ["LATITUDE   LONGITUDE[blue s-text]"],
        [waypointLatString + "  " + waypointLongString],
        ["PLACE BRG  /DIST[blue s-text]"],
        [waypointPBD + ""],
        [""],
        [leftInputText + "", "RETURN>"]
      ]);
    }
    else {
      let waypointCells = [];
      this._pageCount = Math.max(1, Math.ceil(this._fmc._pilotWaypoints._pilotWaypointCount / 10));

      for (let i = 0; i < 10; i++) {
        const pilotWaypoint = this._fmc._pilotWaypoints._pilotWaypointArray[i + ((this._currentPage - 1) * 10)]
        if (pilotWaypoint && pilotWaypoint.id != undefined) {
          waypointCells.push(pilotWaypoint.id);
        } else {
          waypointCells.push("");
        }
      }

      this._fmc._templateRenderer.setTemplateRaw([
        ["   PILOT WPT LIST[blue]", this._currentPage + "/" + this._pageCount + "[blue]"],
        [""],
        [waypointCells[0], waypointCells[5]],
        [""],
        [waypointCells[1], waypointCells[6]],
        [""],
        [waypointCells[2], waypointCells[7]],
        [""],
        [waypointCells[3], waypointCells[8]],
        [""],
        [waypointCells[4], waypointCells[9]],
        [""],
        ["<DATA BASE", "DEFINE WPT>"]
      ]);
    }

  }

  bindEvents() {
    if (this._showPilotWaypointPage) {
      if (this._selectedPilotWaypointIndex >= 0) {
        this._fmc.onLeftInput[5] = () => {
          const ident = this._fmc._pilotWaypoints._pilotWaypointArray[this._selectedPilotWaypointIndex].id;
          const success = this._fmc._pilotWaypoints.deletePilotWaypoint(ident);
          if (success) {
            this._selectedPilotWaypointIndex = undefined;
            this._showPilotWaypointPage = false;
            this.invalidate();
          } else {
            this._fmc.showErrorMessage("DELETE FAILED");
            this.invalidate();
          }
        };
        this._fmc.onRightInput[5] = () => {
          this._selectedPilotWaypointIndex = undefined;
          this._showPilotWaypointPage = false;
          this.invalidate();
        };
      } else {
        this._fmc.onLeftInput[0] = async () => {
          const inputValue = this._fmc.inOut;
          if (inputValue.length > 0 && inputValue.length <= 5) {
            if (this._fmc._pilotWaypoints.checkPilotDuplicates(inputValue)) {
              this._fmc.showErrorMessage("PILOT WPT DUPLICATE");
            }
            else {
              await this._fmc._pilotWaypoints.checkDatabaseDuplicates(inputValue).then((exists) => {
                if (exists) {
                  this._fmc.showErrorMessage("NAVDATA WPT DUPLICATE");
                } else {
                  this._tempWaypointParameters.ident = inputValue;
                  this._tempWaypointParameters.exists = true;
                  this.invalidate();
                }
              });
            }          
          }
          else {
            this._fmc.showErrorMessage("INVALID ENTRY");
          }
        };
        this._fmc.onLeftInput[3] = () => {
          const inputValue = this._fmc.inOut;
          if (inputValue.length > 0) {
            const waypoint = CJ4_FMC_PilotWaypointParser.parseInputLatLong(inputValue, this._fmc);
            if (waypoint) {
              this._tempWaypointParameters.la = waypoint.wpt.infos.coordinates.lat;
              this._tempWaypointParameters.lo = waypoint.wpt.infos.coordinates.long;
              this._tempWaypointParameters.pbd = undefined;
              this._tempWaypointParameters.exists = true;
              this.invalidate();
            } else {
              this._fmc.showErrorMessage("INVALID ENTRY");
            }
          }
          else {
            this._fmc.showErrorMessage("INVALID ENTRY");
          }
        };
        this._fmc.onLeftInput[4] = async () => {
          const inputValue = this._fmc.inOut;
          if (inputValue.length > 0) {
            CJ4_FMC_PilotWaypointParser.parseInputPlaceBearingDistance(inputValue, this._fmc).then((waypoint) => {
              if (waypoint && waypoint.wpt) {
                this._tempWaypointParameters.la = waypoint.wpt.infos.coordinates.lat;
                this._tempWaypointParameters.lo = waypoint.wpt.infos.coordinates.long;
                this._tempWaypointParameters.pbd = inputValue;
                this._tempWaypointParameters.exists = true;
                this.invalidate();
              } else {
                this._fmc.showErrorMessage("INVALID ENTRY");
              }
            });
          }
          else {
            this._fmc.showErrorMessage("INVALID ENTRY");
          }
        };
        this._fmc.onLeftInput[5] = () => {
          if (this._tempWaypointParameters.exists && this._tempWaypointParameters.ident && this._tempWaypointParameters.la && this._tempWaypointParameters.lo) {
            const success = this._fmc._pilotWaypoints.addPilotWaypoint(this._tempWaypointParameters.ident, this._tempWaypointParameters.la, this._tempWaypointParameters.lo);
            if (success) {
              this._tempWaypointParameters = {
                exists: false,
                ident: undefined,
                la: undefined,
                lo: undefined,
                pbd: undefined
              };
              this._selectedPilotWaypointIndex = undefined;
              this._showPilotWaypointPage = false;
              this._fmc.clearUserInput();
              this._fmc.clearDisplay();
              this._fmc.showErrorMessage("STORING PILOT WPT");
              setTimeout(() => {
                this._fmc.showErrorMessage("STORING PILOT WPT");
                CJ4_FMC_PilotWaypointPage.ShowPage1(this._fmc, false);
              }, 1000);
              
             
            } else {
              this._fmc.showErrorMessage("ERROR ADDING PILOT WPT");
              this.invalidate();
            }
          } else {
            this._fmc.showErrorMessage("ERROR ADDING PILOT WPT");
            this.invalidate();
          }
        };
        this._fmc.onRightInput[5] = () => {
          this._tempWaypointParameters = {
            exists: false,
            ident: undefined,
            la: undefined,
            lo: undefined,
            pbd: undefined
          };
          this._selectedPilotWaypointIndex = undefined;
          this._showPilotWaypointPage = false;
          this.invalidate();
        };
      }

    } else {

      for (let i = 0; i < 5; i++) {
        this._fmc.onLeftInput[i] = () => {
          const selectedIndex = i + ((this._currentPage - 1) * 10);
          console.log("selectedIndex: " + selectedIndex);
          const pilotWaypoint = this._fmc._pilotWaypoints._pilotWaypointArray[selectedIndex];
          console.log("pilotWaypoint: " + pilotWaypoint.id);
          if (pilotWaypoint && pilotWaypoint.id != undefined) {
            this._selectedPilotWaypointIndex = selectedIndex;
            this._showPilotWaypointPage = true;
            this.invalidate();
          }
        }
        this._fmc.onRightInput[i] = () => {
          const selectedIndex = 5 + i + ((this._currentPage - 1) * 10);
          console.log("selectedIndex: " + selectedIndex);
          const pilotWaypoint = this._fmc._pilotWaypoints._pilotWaypointArray[selectedIndex];
          console.log("pilotWaypoint: " + pilotWaypoint.id);
          if (pilotWaypoint && pilotWaypoint.id != undefined) {
            this._selectedPilotWaypointIndex = selectedIndex;
            this._showPilotWaypointPage = true;
            this.invalidate();
          }
        }
      }

      this._fmc.onRightInput[5] = () => {
        this._selectedPilotWaypointIndex = undefined;
        this._showPilotWaypointPage = true;
        this._tempWaypointParameters = {
          exists: false,
          ident: undefined,
          la: undefined,
          lo: undefined,
          pbd: undefined
        };
        this.invalidate();
      };
      this._fmc.onLeftInput[5] = () => {
        CJ4_FMC_InitRefIndexPage.ShowPage18(this._fmc);
      };
      this._fmc.onPrevPage = () => {
        this._currentPage = Math.max(1, this._currentPage - 1);
        this.invalidate();
      };
      this._fmc.onNextPage = () => {
        if (this._currentPage < this._pageCount) {
          this._currentPage = this._currentPage + 1;
        }
        this.invalidate();
      };
    }
  }

  invalidate() {
    this._fmc.clearUserInput();
    this._fmc.clearDisplay();
    this.render();
    this.bindEvents();
  }

  static ShowPage1(fmc, defineWaypoint = false) {
    fmc.clearDisplay();

    // create page instance and init 
    PilotWaypointPage1Instance = new CJ4_FMC_PilotWaypointPage(fmc, defineWaypoint);
    PilotWaypointPage1Instance.invalidate();
  }
}

/**
 * A Pilot Waypoint; simplified for minimal datastorage footprint.
 */
class CJ4_FMC_PilotWaypoint {
  constructor(ident = undefined, latitude = undefined, longitude = undefined) {
    /** 
     * User Waypoint ident. 
     * @type {number}
     */
    this.id = ident;

    /**
     * Latitude in DDMM.MM format.
     * @type {number}
     */
    this.la = latitude;

    /**
     * Longitude in in DDDMM.MM format.
     * @type {number}
     */
    this.lo = longitude;
  }
}