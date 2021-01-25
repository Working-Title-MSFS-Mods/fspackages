// simvar cache experiment
const oldGetSimVar = SimVar.GetSimVarValue;
const svCache = new Map();
SimVar.GetSimVarValue = (name, unit, dataSource = "") => {
  if (svCache.has(name)) {
    return svCache.get(name);
  } else {
    const val = oldGetSimVar(name, unit, dataSource);
    svCache.set(name, val);
    return val;
  }
};

const clearSv = () => {
  svCache.clear();
  requestAnimationFrame(clearSv);
};

clearSv();

export { }