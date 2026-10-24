const STORAGE='fitengine.customActivities.v1';
const FAVORITES='fitengine.favorites.v1';
const PREFS='fitengine.viewerPrefs.v1';
const required=['id','name','category','modalities','movementPattern','activityType','primaryMuscles','secondaryMuscles','equipment','difficulty','laterality','description','instructions','tips','media','variations','tags','source'];
const slug=s=>String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const unique=a=>new Set(a).size===a.length;
const loadJSON=(key,fallback)=>{try{const x=localStorage.getItem(key);return x===null?fallback:JSON.parse(x)}catch(e){throw Error(`Stored data ${key} is invalid. Export or clear it before continuing.`)}};
export class ActivityRepository{
  constructor(){this.builtins=[];this.custom=[];this.vocab={};this.schema={};this.favorites=[];}
  async initialize(){const root=new URL('../',import.meta.url);const get=async path=>{const r=await fetch(new URL(path,root));if(!r.ok)throw Error(`Cannot load ${path} (${r.status})`);return r.json()};[this.builtins,this.vocab,this.schema]=await Promise.all([get('data/activities.json'),get('data/vocabulary.json'),get('schemas/activity.schema.json')]);this.custom=loadJSON(STORAGE,[]);this.favorites=loadJSON(FAVORITES,[]);if(!Array.isArray(this.custom)||!Array.isArray(this.favorites))throw Error('Invalid browser storage format');const errors=this.validateCatalog([...this.builtins,...this.custom]);if(errors.length)throw Error('Activity catalog validation failed:\n'+errors.join('\n'));}
  getAll(){return [...this.builtins,...this.custom].map(a=>structuredClone(a))}
  getById(id){const a=[...this.builtins,...this.custom].find(a=>a.id===id);return a?structuredClone(a):null}
  isBuiltin(id){return this.builtins.some(a=>a.id===id)}
  nextId(name){const base=slug(name)||'new-activity';let id=base,i=2;while(this.getById(id)){id=`${base}-${i++}`}return id}
  validate(a){const e=[];if(!a||typeof a!=='object'||Array.isArray(a))return ['Activity must be an object'];for(const k of required)if(!(k in a))e.push(`Missing ${k}`);for(const k of Object.keys(a))if(!required.includes(k))e.push(`Unknown field ${k}`);if(e.length)return e;
    const strings=['id','name','category','movementPattern','activityType','difficulty','laterality','description','tips','source'];for(const k of strings)if(typeof a[k]!=='string')e.push(`${k} must be text`);
    if(typeof a.id==='string'&&!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.id))e.push('ID must be lowercase kebab-case');if(typeof a.name==='string'&&(!a.name.trim()||a.name.length>120))e.push('Name must be 1–120 characters');
    const lists=['modalities','primaryMuscles','secondaryMuscles','equipment','instructions','variations','tags'];for(const k of lists){if(!Array.isArray(a[k])||a[k].some(v=>typeof v!=='string'||!v.trim())){e.push(`${k} must contain nonempty strings`);continue}if(k!=='instructions'&&!unique(a[k]))e.push(`${k} contains duplicates`)}
    for(const k of ['modalities','equipment','instructions'])if(Array.isArray(a[k])&&!a[k].length)e.push(`${k} cannot be empty`);
    for(const k of ['category','difficulty','laterality','activityType','movementPattern'])if(!this.vocab[k]?.includes(a[k]))e.push(`Invalid ${k}: ${a[k]}`);
    for(const k of ['modalities','primaryMuscles','secondaryMuscles','equipment'])if(Array.isArray(a[k]))for(const v of a[k])if(!this.vocab[k==='primaryMuscles'||k==='secondaryMuscles'?'muscles':k]?.includes(v))e.push(`Invalid ${k}: ${v}`);
    if(Array.isArray(a.primaryMuscles)&&Array.isArray(a.secondaryMuscles))for(const v of a.primaryMuscles)if(a.secondaryMuscles.includes(v))e.push(`Muscle in both lists: ${v}`);
    if(!a.media||typeof a.media!=='object'||Array.isArray(a.media)||Object.keys(a.media).sort().join()!=='image,video'||typeof a.media.image!=='string'||typeof a.media.video!=='string')e.push('media must have exactly image and video strings');
    if(a.source!=='builtin'&&a.source!=='custom')e.push('Invalid source');if(Array.isArray(a.variations))for(const v of a.variations)if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)||v===a.id)e.push(`Invalid variation: ${v}`);return e;
  }
  validateCatalog(list){const errors=[],ids=new Set();for(const a of list){for(const e of this.validate(a))errors.push(`${a?.id||'unknown'}: ${e}`);if(ids.has(a.id))errors.push(`Duplicate ID: ${a.id}`);ids.add(a.id)}for(const a of list)if(Array.isArray(a.variations))for(const v of a.variations)if(!ids.has(v))errors.push(`${a.id}: unresolved variation ${v}`);return errors}
  commit(next){const errors=this.validateCatalog([...this.builtins,...next]);if(errors.length)throw Error(errors.join('\n'));localStorage.setItem(STORAGE,JSON.stringify(next));this.custom=next;}
  create(a){a=structuredClone(a);a.source='custom';if(this.getById(a.id))throw Error(`Activity ID already exists: ${a.id}`);this.commit([...this.custom,a]);return a.id}
  update(id,a){if(this.isBuiltin(id))throw Error('Built-in activities are protected');if(a.id!==id)throw Error('Activity ID cannot change');const i=this.custom.findIndex(x=>x.id===id);if(i<0)throw Error('Custom activity not found');a=structuredClone(a);a.source='custom';const next=[...this.custom];next[i]=a;this.commit(next)}
  duplicate(id){const a=this.getById(id);if(!a)throw Error('Activity not found');a.id=this.nextId(`${a.id}-custom`);a.name=`${a.name} (Custom)`;a.source='custom';a.variations=a.variations.filter(x=>x!==a.id);this.create(a);return a.id}
  delete(id){if(this.isBuiltin(id))throw Error('Built-in activities are protected');const refs=this.getAll().filter(a=>a.id!==id&&a.variations.includes(id));if(refs.length)throw Error(`Referenced as a variation by: ${refs.map(a=>a.name).join(', ')}`);this.commit(this.custom.filter(a=>a.id!==id));this.setFavorite(id,false)}
  isFavorite(id){return this.favorites.includes(id)}
  setFavorite(id,yes){if(!this.getById(id)&&yes)throw Error('Activity not found');this.favorites=yes?[...new Set([...this.favorites,id])]:this.favorites.filter(x=>x!==id);localStorage.setItem(FAVORITES,JSON.stringify(this.favorites))}
  exportCustom(){return {format:'FitEngine Activity Backup',version:1,activityStandard:'1.1.0',activities:structuredClone(this.custom),favorites:[...this.favorites]}}
  importCustom(payload){if(!payload||payload.format!=='FitEngine Activity Backup'||payload.version!==1||!Array.isArray(payload.activities)||!Array.isArray(payload.favorites))throw Error('Unsupported backup format');if(payload.activities.some(a=>a.source!=='custom'))throw Error('Imports must contain only custom activities');if(payload.favorites.some(id=>typeof id!=='string'))throw Error('Invalid favorites');const next=[...this.custom];for(const a of payload.activities){const i=next.findIndex(x=>x.id===a.id);if(i>=0)next[i]=a;else next.push(a)}const errors=this.validateCatalog([...this.builtins,...next]);if(errors.length)throw Error(errors.join('\n'));const fav=[...new Set([...this.favorites,...payload.favorites])].filter(id=>[...this.builtins,...next].some(a=>a.id===id));localStorage.setItem(STORAGE,JSON.stringify(next));localStorage.setItem(FAVORITES,JSON.stringify(fav));this.custom=next;this.favorites=fav;return payload.activities.length}
  getPreferences(){return loadJSON(PREFS,{})}setPreferences(p){localStorage.setItem(PREFS,JSON.stringify(p))}
}
export const repository=new ActivityRepository();
export const downloadJSON=(name,obj)=>{const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
