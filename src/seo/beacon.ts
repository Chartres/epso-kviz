import { BOT_UA } from '../platform/flywheel-client.ts'

export interface BeaconConfig {
  /** Supabase project URL (VITE_SUPABASE_URL). */
  url: string
  /** Publishable key (VITE_SUPABASE_PUBLISHABLE_KEY), already public in the app bundle. */
  key: string
  app: string
}

/**
 * The inline script on the prerendered pages: one page_view {path, static: true}, plus
 * key_action source_open when a reader opens a cited passage. It writes the same row as
 * flywheel-client (same table, headers and fw:vid / fw:sid ids) without loading the app
 * bundle, and skips automated browsers by the same rule. Never throws into the page.
 */
export function beaconScript({ url, key, app }: BeaconConfig): string {
  const J = JSON.stringify
  return `(function(){try{
var n=navigator;if(n.webdriver===true||${BOT_UA}.test(n.userAgent||''))return;
function id(s,k){try{var st=s(),v=st.getItem(k);if(!v){v=crypto.randomUUID();st.setItem(k,v)}return v}catch(e){return'anon'}}
function track(ev,props){try{props.path=location.pathname;props.static=true;
fetch(${J(url + '/rest/v1/events')},{method:'POST',keepalive:true,headers:{apikey:${J(key)},Authorization:${J('Bearer ' + key)},'Content-Type':'application/json',Prefer:'return=minimal'},
body:JSON.stringify({app:${J(app)},event:ev,props:props,visitor_id:id(function(){return localStorage},'fw:vid'),session_id:id(function(){return sessionStorage},'fw:sid'),flywheel_uid:null,created_at:new Date().toISOString()})}).catch(function(){})}catch(e){}}
track('page_view',{});
document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[data-doc]');
if(a)track('key_action',{action:'source_open',doc:a.dataset.doc,ref:a.dataset.ref,from:'static'})});
}catch(e){}})();`
}
