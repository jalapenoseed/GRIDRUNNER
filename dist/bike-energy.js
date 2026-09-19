// One world unit is two displayed metres. Consumption and range share this rate.
export const BIKE_ENERGY_PER_UNIT=.018;
export function bikeEnergyPerUnit({road=true,weight=0,upgrade=false,difficulty=1}={}){return BIKE_ENERGY_PER_UNIT*(road?1:1.4)*(1+Math.max(0,weight)/50)*(upgrade?.7:1)*difficulty;}
export function bikeRangeKm(battery,options){return Math.max(0,battery)/bikeEnergyPerUnit(options)*2/1000;}
