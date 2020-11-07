class WT_Sound {
    constructor() {
        this.handlers = [];
    }
    play(id) {
        Coherent.call("PLAY_INSTRUMENT_SOUND", id);
        return new Promise(resolve => {
            this.handlers.push({
                id: id,
                nameZ: new Name_Z(id),
                callback: resolve
            });
        })
    }
    onSoundEnd(_eventId) {
        for (let i = this.handlers.length - 1; i >= 0; i--) {
            const handler = this.handlers[i];
            if (Name_Z.compare(_eventId, handler.nameZ)) {
                handler.callback();
                this.handlers.splice(i, 1);
            }
        }
    }
}