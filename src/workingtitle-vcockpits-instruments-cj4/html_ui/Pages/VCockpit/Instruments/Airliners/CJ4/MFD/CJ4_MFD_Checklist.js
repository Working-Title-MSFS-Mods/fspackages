class Checklist{
    constructor(_name) {
        this.name = _name; // NORMAL CHECKLIST
        this.sections = []; // TAKEOFF, DESCENT
    }
}

class NormalChecklist extends Checklist {
    constructor() {
        super("NORMAL CHECKLIST MENU");
        this.sections = [
            {
                name: "BEFORE STARTING ENGINES",
                checklistItems: [
                    {
                        name: "BATTERY SWITCH",
                        value: "ON",
                        key: false
                    },
                    {
                        name: "EMERGENCY LIGHTS SWITCH",
                        value: "ARMED",
                        key: false
                    },
                    {
                        name: "STANDBY FLIGHT DISPLAY SWITCH",
                        value: "ON",
                        key: false
                    },
                    {
                        name: "AVIONICS SWITCH",
                        value: "DISPATCH",
                        key: false
                    },
                    {
                        name: "PARKING BRAKE",
                        value: "SET",
                        key: false
                    },
                    {
                        name: "WHEEL CHOCKS",
                        value: "REMOVE",
                        key: false
                    },
                    {
                        name: "CABIN DOOR",
                        value: "CLOSED",
                        key: false
                    },
                    {
                        name: "PASSENGER BRIEFING",
                        value: "COMPLETE",
                        key: false
                    },
                    {
                        name: "SEATS/BELTS/PEDALS",
                        value: "ADJUST/SECTURE",
                        key: false
                    },
                    {
                        name: "EXTERIOR LIGHTS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "EICAS",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "FMS",
                        value: "CHECK/SET",
                        key: false
                    },
                    {
                        name: "CLIMATE CONTROL SELECTOR",
                        value: "OFF",
                        key: false
                    }
                    
                    
                ]
            },
            {
                name: "STARTING ENGINES",
                checklistItems: [
                    {
                        name: "THROTTLES",
                        value: "IDLE",
                        key: false
                    },
                    {
                        name: "ENGINE STARTER BUTTON",
                        value: "PUSH",
                        key: false
                    },
                    {
                        name: "ENGINE RUN/STOP BUTTON",
                        value: "RUN",
                        key: false
                    },
                    {
                        name: "ITT",
                        value: "CHECK FOR RISE",
                        key: false
                    },
                    {
                        name: "EICAS",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "OPPOSITE ENGINE",
                        value: "START",
                        key: false
                    },
                    {
                        name: "EXTERNAL POWER",
                        value: "DISCONNECTED",
                        key: false
                    },
                    {
                        name: "ELECTRICAL SYSTEM",
                        value: "CHECK",
                        key: false
                    }
                ]
            },
            {
                name: "BEFORE TAXI",
                checklistItems: [
                    {
                        name: "AVIONICS SWITCH",
                        value: "ON",
                        key: false
                    },
                    {
                        name: "CLIMATE CONTROL SELECTOR",
                        value: "NORM",
                        key: false
                    },
                    {
                        name: "PASS LIGHTS SAFETY BUTTON",
                        value: "ON",
                        key: false
                    },
                    {
                        name: "TRIMS",
                        value: "CHECK/SET",
                        key: false
                    },
                    {
                        name: "FLIGHT CONTROLS",
                        value: "FREE/CORRECT",
                        key: false
                    },
                    {
                        name: "SPEEDBRAKES/GROUND SPOILERS",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "FLAPS",
                        value: "CHECK/SET",
                        key: false
                    },
                    {
                        name: "HYDRAULIC PRESSURE",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "ENGINE ONLY ANTI-ICE",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "TAKEOFF DATA",
                        value: "CONFIRM/SET",
                        key: false
                    },
                    {
                        name: "AVIONICS",
                        value: "CHECK/SET",
                        key: false
                    },
                    {
                        name: "AUTOPILOT",
                        value: "ENGAGE/DISCONNECT",
                        key: false
                    },
                    {
                        name: "ALTIMETER",
                        value: "SET/CHECK",
                        key: false
                    },
                    {
                        name: "PRESSURIZATION",
                        value: "VERIFY/SET",
                        key: false
                    },
                    {
                        name: "EICAS",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "AFT DIVIDER DOORS",
                        value: "LATCHED OPEN",
                        key: false
                    }
                ]
            },
            {
                name: "TAXI",
                checklistItems: [
                    {
                        name: "EXTERIOR LIGHTS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "BRAKES",
                        value: "APPLY/HOLD",
                        key: false
                    },
                    {
                        name: "PARKING BRAKE",
                        value: "RELEASE",
                        key: false
                    },
                    {
                        name: "BRAKES",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "NOSEWHEEL STEERING",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "FLIGHT INSTRUMENTS",
                        value: "CHECK",
                        key: false
                    }
                ]
            },
            {
                name: "BEFORE TAKEOFF",
                checklistItems: [
                    {
                        name: "ICE PROTECTION SYSTEM",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "RUDDER BIAS SYSTEM",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "SEATS",
                        value: "UPRIGHT/OUTBOARD",
                        key: false
                    },
                    {
                        name: "FLAPS",
                        value: "CHECK/SET",
                        key: false
                    },
                    {
                        name: "SPEED BRAKES",
                        value: "0%",
                        key: false
                    },
                    {
                        name: "TRIMS (3)",
                        value: "SET FOR TAKEOFF",
                        key: false
                    },
                    {
                        name: "CREW BRIEFING",
                        value: "COMPLETE",
                        key: false
                    },
                    {
                        name: "TCAS",
                        value: "TA/RA",
                        key: false
                    },
                    {
                        name: "RADAR",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "GA BUTTON",
                        value: "PUSH",
                        key: false
                    },
                    {
                        name: "BATTERY AMPS",
                        value: "VERIFY 20 OR LESS",
                        key: false
                    },
                    {
                        name: "ICE PROTECTION SYSTEMS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "PITOT/STATIC HEAT BUTTONS",
                        value: "ON",
                        key: false
                    },
                    {
                        name: "EXTERIOR LIGHTS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "EICAS",
                        value: "CHECK",
                        key: false
                    }
                ]
            },
            {
                name: "TAKEOFF",
                checklistItems: [
                    {
                        name: "THROTTLES",
                        value: "TAKEOFF",
                        key: false
                    },
                    {
                        name: "N1 COMMAND BUGS",
                        value: "GREEN CHEVRON",
                        key: false
                    },
                    {
                        name: "BRAKES",
                        value: "RELEASE",
                        key: false
                    },
                    {
                        name: "CONTROL WHEEL",
                        value: "ROTATE AT VR",
                        key: false
                    }
                ]
            },
            {
                name: "AFTER TAKEOFF/CLIMB",
                checklistItems: [
                    {
                        name: "LANDING GEAR",
                        value: "UP",
                        key: false
                    },
                    {
                        name: "FLAPS",
                        value: "0\xB0",
                        key: false
                    },
                    {
                        name: "THROTTLES",
                        value: "CLIMB",
                        key: false
                    },
                    {
                        name: "YAW DAMPER",
                        value: "ON",
                        key: false
                    },
                    {
                        name: "AUTOPILOT",
                        value: "AS DESIRED",
                        key: false
                    },
                    {
                        name: "ICE PROTECTION SYSTEMS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "PASS LIGHTS BUTTONS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "LANDING LIGHTS BUTTON",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "PRESSURIZATION",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "ALTIMETERS",
                        value: "SET/CROSSCHECK",
                        key: false
                    }
                ]
            },
            {
                name: "CRUISE",
                checklistItems: [
                    {
                        name: "THROTTLES",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "PRESSURIZATION",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "ICE PROTECTION SYSTEMS",
                        value: "AS REQUIRED",
                        key: false
                    }
                ]
            },
            {
                name: "DESCENT",
                checklistItems: [
                    {
                        name: "PRESSURIZATION",
                        value: "VERIFY/SET LDG ELEV",
                        key: false
                    },
                    {
                        name: "ICE PROTECTION SYSTEMS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "ALTIMETERS",
                        value: "SET/CROSSCHECK",
                        key: false
                    },
                    {
                        name: "EXTERIOR LIGHTS",
                        value: "AS REQUIRED",
                        key: false
                    }
                ]
            },
            {
                name: "APPROACH",
                checklistItems: [
                    {
                        name: "LANDING DATA",
                        value: "CONFIRM",
                        key: false
                    },
                    {
                        name: "CREW BRIEFING",
                        value: "COMPLETE",
                        key: false
                    },
                    {
                        name: "AVIONICS/FLIGHT INSTRUMENTS",
                        value: "CHECK",
                        key: false
                    },
                    {
                        name: "MINIMUMS",
                        value: "SET",
                        key: false
                    },
                    {
                        name: "FUEL TRANSFER SELECTOR",
                        value: "OFF",
                        key: false
                    },
                    {
                        name: "EXTERIOR LIGHTS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "ICE PROTECTION SYSTEMS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "FLAPS",
                        value: "15\xB0",
                        key: false
                    },
                    {
                        name: "PASSENGER BRIEFING",
                        value: "COMPLETE",
                        key: false
                    },
                    {
                        name: "SEATS",
                        value: "UPRIGHT AND OUTBOARD",
                        key: false
                    },
                    {
                        name: "SEAT BELTS",
                        value: "ADJUSTED/SECURE",
                        key: false
                    },
                    {
                        name: "PASS LIGHTS SAFETY BUTTON",
                        value: "ON",
                        key: false
                    },
                    {
                        name: "PRESSURIZATION",
                        value: "< 0.5 PSI BEFORE LDG",
                        key: false
                    }
                ]
            },
            {
                name: "BEFORE LANDING",
                checklistItems: [
                    {
                        name: "LANDING GEAR",
                        value: "DOWN (3 GREEN)",
                        key: false
                    },
                    {
                        name: "FLAPS",
                        value: "35\xB0",
                        key: false
                    },
                    {
                        name: "SPEED BRAKES",
                        value: "0%",
                        key: false
                    },
                    {
                        name: "AIRSPEED",
                        value: "VREF",
                        key: false
                    },
                    {
                        name: "AUTOPILOT AND YAW DAMPER",
                        value: "DISENGAGE",
                        key: false
                    }
                ]
            },
            {
                name: "LANDING",
                checklistItems: [
                    {
                        name: "THROTTLES",
                        value: "IDLE",
                        key: false
                    },
                    {
                        name: "BRAKES (AFTER NLG TOUCHDOWN)",
                        value: "APPLY",
                        key: false
                    },
                    {
                        name: "GROUND SPOILERS",
                        value: "EXTEND",
                        key: false
                    }
                ]
            },
            {
                name: "ALL ENGINE GO-AROUND",
                checklistItems: [
                    {
                        name: "GA BUTTON",
                        value: "PUSH",
                        key: false
                    },
                    {
                        name: "THROTTLES",
                        value: "TO",
                        key: false
                    },
                    {
                        name: "PITCH ALTITUDE",
                        value: "7.5\xB0, THEN AS REQ'D",
                        key: false
                    },
                    {
                        name: "FLAPS",
                        value: "15\xB0",
                        key: false
                    },
                    {
                        name: "LANDING GEAR",
                        value: "UP",
                        key: false
                    },
                    {
                        name: "FLAPS",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "AIRSPEED",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "THROTTLES",
                        value: "AS REQUIRED",
                        key: false
                    },
                    {
                        name: "YAW DAMPER",
                        value: "ON",
                        key: false
                    },
                    {
                        name: "AUTOPILOT",
                        value: "AS DESIRED",
                        key: false
                    }
                ]
            },
            {
                name: "AFTER LANDING",
                checklistItems: [
                    {
                        name: "SPEEDBRAKES",
                        value: "0%",
                        key: false
                    },
                    {
                        name: "FLAPS",
                        value: "0\xB0",
                        key: false
                    },
                    {
                        name: "PITOT/STATIC HEAT BUTTONS",
                        value: "OFF",
                        key: false
                    },
                    {
                        name: "ICE PROTECTION SYSTEMS",
                        value: "OFF/AS REQUIRED",
                        key: false
                    },
                    {
                        name: "RADAR",
                        value: "STANDBY",
                        key: false
                    },
                    {
                        name: "EXTERIOR LIGHTS",
                        value: "AS REQUIRED",
                        key: false
                    }
                ]
            },
        ];
    }
}