class WT_Procedure_Transition {
    constructor(index, name, legs) {
        this.index = index;
        this.name = name;
        this.legs = legs;
    }
}

class WT_Approach_Transition extends WT_Procedure_Transition {

}

class WT_Runway_Transition extends WT_Procedure_Transition {

}

class WT_EnRoute_Transition extends WT_Procedure_Transition {

}