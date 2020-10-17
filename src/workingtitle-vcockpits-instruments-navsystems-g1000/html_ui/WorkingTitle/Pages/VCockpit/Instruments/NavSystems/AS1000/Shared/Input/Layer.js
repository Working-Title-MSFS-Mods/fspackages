class Input_Layer {
    onLargeInc(inputStack) { return false; }
    onLargeDec(inputStack) { return false; }
    onSmallInc(inputStack) { return false; }
    onSmallDec(inputStack) { return false; }
    onMenuPush(inputStack) { return false; }
    onNavigationPush(inputStack) { return false; }
    onEnter(inputStack) { return false; }
    onCLR(inputStack) { return false; }
    onProceduresPush(inputStack) { return false; }
    onFlightPlan(inputStack) { return false; }
    onSoftKey(index, inputStack) { return false; }

    onNavPush(inputStack) { return false; }
    onNavSwitch(inputStack) { return false; }
    onNavLargeInc(inputStack) { return false; }
    onNavLargeDec(inputStack) { return false; }
    onNavSmallInc(inputStack) { return false; }
    onNavSmallDec(inputStack) { return false; }
    onVolume1Inc(inputStack) { return false; }
    onVolume1Dec(inputStack) { return false; }

    onComPush(inputStack) { return false; }
    onComSwitch(inputStack) { return false; }
    onComSwitchLong(inputStack) { return false; }
    onComLargeInc(inputStack) { return false; }
    onComLargeDec(inputStack) { return false; }
    onComSmallInc(inputStack) { return false; }
    onComSmallDec(inputStack) { return false; }
    onVolume2Inc(inputStack) { return false; }
    onVolume2Dec(inputStack) { return false; }

    onCourseIncrement(inputStack) { return false; }
    onCourseDecrement(inputStack) { return false; }
    onCoursePush(inputStack) { return false; }

    onRangeInc(inputStack) { return false; }
    onRangeDec(inputStack) { return false; }
    onJoystickPush(inputStack) { return false; };
    onJoystickUp(inputStack) { return false; };
    onJoystickDown(inputStack) { return false; };
    onJoystickLeft(inputStack) { return false; };
    onJoystickRight(inputStack) { return false; };

    processEvent(_event, inputStack) {
        switch (_event) {
            case "FMS_Lower_INC":
                return this.onLargeInc(inputStack);
            case "FMS_Lower_DEC":
                return this.onLargeDec(inputStack);
            case "FMS_Upper_INC":
                return this.onSmallInc(inputStack);
            case "FMS_Upper_DEC":
                return this.onSmallDec(inputStack);

            case "MENU_Push":
                return this.onMenuPush(inputStack);
            case "ENT_Push":
                return this.onEnter(inputStack);
            case "FMS_Upper_PUSH":
                return this.onNavigationPush(inputStack);
            case "PROC_Push":
                return this.onProceduresPush(inputStack);
            case "CLR":
                return this.onCLR(inputStack);

            case "FPL_Push":
                return this.onFlightPlan(inputStack);
            case "SOFTKEYS_1":
                return this.onSoftKey(1, inputStack);
            case "SOFTKEYS_2":
                return this.onSoftKey(2, inputStack);
            case "SOFTKEYS_3":
                return this.onSoftKey(3, inputStack);
            case "SOFTKEYS_4":
                return this.onSoftKey(4, inputStack);
            case "SOFTKEYS_5":
                return this.onSoftKey(5, inputStack);
            case "SOFTKEYS_6":
                return this.onSoftKey(6, inputStack);
            case "SOFTKEYS_7":
                return this.onSoftKey(7, inputStack);
            case "SOFTKEYS_8":
                return this.onSoftKey(8, inputStack);
            case "SOFTKEYS_9":
                return this.onSoftKey(9, inputStack);
            case "SOFTKEYS_10":
                return this.onSoftKey(10, inputStack);
            case "SOFTKEYS_11":
                return this.onSoftKey(11, inputStack);
            case "SOFTKEYS_12":
                return this.onSoftKey(12, inputStack);

            case "NAV_Push":
                return this.onNavPush(inputStack);
            case "NAV_Switch":
                return this.onNavSwitch(inputStack);
            case "NAV_Large_INC":
                return this.onNavLargeInc(inputStack);
            case "NAV_Large_DEC":
                return this.onNavLargeDec(inputStack);
            case "NAV_Small_INC":
                return this.onNavSmallInc(inputStack);
            case "NAV_Small_DEC":
                return this.onNavSmallDec(inputStack);
            case "VOL_1_INC":
                return this.onVolume1Inc(inputStack);
            case "VOL_1_DEC":
                return this.onVolume1Dec(inputStack);

            case "COM_Push":
                return this.onComPush(inputStack);
            case "COM_Switch":
                return this.onComSwitch(inputStack);
            case "COM_Switch_Long":
                return this.onComSwitchLong(inputStack);
            case "COM_Large_INC":
                return this.onComLargeInc(inputStack);
            case "COM_Large_DEC":
                return this.onComLargeDec(inputStack);
            case "COM_Small_INC":
                return this.onComSmallInc(inputStack);
            case "COM_Small_DEC":
                return this.onComSmallDec(inputStack);
            case "VOL_2_INC":
                return this.onVolume2Inc(inputStack);
            case "VOL_2_DEC":
                return this.onVolume2Dec(inputStack);

            case "CRS_INC":
                return this.onCourseIncrement(inputStack);
            case "CRS_DEC":
                return this.onCourseDecrement(inputStack);
            case "CRS_PUSH":
                return this.onCoursePush(inputStack);

            case "RANGE_INC":
                return this.onRangeInc(inputStack);
            case "RANGE_DEC":
                return this.onRangeDec(inputStack);
            case "JOYSTICK_PUSH":
                return this.onJoystickPush(inputStack);
            case "JOYSTICK_UP":
                return this.onJoystickUp(inputStack);
            case "JOYSTICK_DOWN":
                return this.onJoystickDown(inputStack);
            case "JOYSTICK_LEFT":
                return this.onJoystickLeft(inputStack);
            case "JOYSTICK_RIGHT":
                return this.onJoystickRight(inputStack);
        }
        return false;
    }

    onActivate() { }
    onDeactivate() { }
}

class Page_Input_Layer extends Input_Layer {
    constructor(page) {
        super();
        this.page = page;
        this.active = false;
    }
    onNavigationPush(inputStack) {
        this.page.activate();
    }
}