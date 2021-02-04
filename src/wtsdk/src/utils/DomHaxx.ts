/* eslint-disable prefer-rest-params */
// const _attrCache = new Map();
let callidx = 0;

// SET ATTRIBUTE
Element.prototype.setAttribute = function (orig) {
  return function (name, value) {
    try {
      if (name === "needDeletion" || (name === "state" && value === "off")) return;

      // if (this.id === "") {
      //   this.id = "custom" + callidx++;
      // }

      if (typeof value === 'number') {
        value = Math.round(value);
      }

      if(!this.attrCache){
        this.attrCache = new Map();
      }

      const key = name;
      let compVal = this.attrCache.get(key);
      if (compVal === undefined) {
        compVal = this.getAttribute(name);
      }

      if (compVal !== value.toString()) {
        this.attrCache.set(key, value.toString());
        orig.apply(this, arguments);
        //console.log(callidx + "|" + name + "=" + value);
      }
    } catch (error) {
      orig.apply(this, arguments);
    }
  }
}(Element.prototype.setAttribute)

Element.prototype.hide = function() {
  if(this._hidden === undefined || !this._hidden){
    this._hidden = true;
    this.style.display = 'none';
  }
};

Element.prototype.show = function(display:string = 'block') {
  if(this._hidden === undefined || this._hidden){
    this._hidden = false;
    this.style.display = display;
  }
};

// TEXT CONTENT
Object.defineProperty(Element.prototype, "textContentCached", {
  set: function (value) {
      if(this._text === undefined){
        this._text = this.textContent;
      }

      if(value !== this._text){
        this._text = value;
        this.textContent = value;
      }

      this._value = value;
  },
  get: function () {
      return this.textContent;
  }
});


export { }