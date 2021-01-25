// simvar cache experiment
const oldGetSimVar = SimVar.GetSimVarValue;
const svCache = new Map();
SimVar.GetSimVarValue = (name, unit, dataSource = "") => {
  const key = name + unit;
  if (svCache.has(key)) {
    return svCache.get(key);
  } else {
    const val = oldGetSimVar(name, unit, dataSource);
    svCache.set(key, val);
    return val;
  }
};

const oldSetSimvar = SimVar.SetSimVarValue;
SimVar.SetSimVarValue = (name: string, unit: string, value: any, dataSource?: string): Promise<void> => {
  if(!name.startsWith("K:") && !name.startsWith("A:")){
    const key = name + unit;
    svCache.set(key, value);
  }
  return oldSetSimvar(name, unit, value, dataSource);
};

const clearSv = () => {
  svCache.clear();
  requestAnimationFrame(clearSv);
};

clearSv();

export { }