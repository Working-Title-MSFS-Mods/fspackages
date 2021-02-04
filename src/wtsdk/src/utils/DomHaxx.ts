/* eslint-disable prefer-rest-params */
// const _attrCache = new Map();
let callidx = 0;

// SET ATTRIBUTE
Element.prototype.setAttribute = function (orig) {
  return function (name, value) {
    try {
      // if (name === "needDeletion" || (name === "state" && value === "off")) return;

      // if (this.id === "") {
      //   this.id = "custom" + callidx++;
      // }

      if(!this.attrCache){
        this.attrCache = new Map();
      }

      const key = name;
      let compVal = this.attrCache.get(key);
      if (compVal === undefined) {
        compVal = this.getAttribute(name);
      }

      if (compVal !== value.toString()) {
        orig.apply(this, arguments);
        this.attrCache.set(key, value.toString());
        //console.log(callidx + "|" + name + "=" + value);
      }
    } catch (error) {
      orig.apply(this, arguments);
    }
  }
}(Element.prototype.setAttribute)

Element.prototype.hide = function() {
  if(this.style.display !== 'none'){
    this.style.display = 'none';
  }
};

Element.prototype.show = function(display:string = 'block') {
  if(this.style.display !== display){
    this.style.display = display;
  }
};

// TEXT CONTENT
Object.defineProperty(Element.prototype, "textContentCached", {
  set: function (value) {
      if(value !== this.textContent){
        this.textContent = value;
      }

      this._value = value;
  },
  get: function () {
      return this.textContent;
  }
});


export { }