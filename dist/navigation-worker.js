import {buildCampRoutes} from './camp-navigation.js';
self.onmessage = async ({data}) => {
  try { self.postMessage({routes:await buildCampRoutes(data.camps,data.solids)}); }
  catch(error) { self.postMessage({error:String(error.message||error)}); }
};
