class WT_MapModelBordersComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelBordersComponent.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelBordersComponent.OPTIONS_DEF);
    }
}
WT_MapModelBordersComponent.NAME_DEFAULT = "borders";
WT_MapModelBordersComponent.OPTIONS_DEF = {
    show: {default: true, auto: true},
    showStateBorders: {default: true, auto: true},
};