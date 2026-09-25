export const SEEN_KEY = 'sanat:seen';

// Runs before the first paint (inlined in <head>): a visitor who has already
// seen the loading screen in this tab session skips it; anyone else gets
// html[data-load=loading], which holds the page's entrance animations until it
// lifts. (An attribute React does not own: hydration rewrites <html>'s className.)
export const LOADING_BOOT_SCRIPT = `var d=document.documentElement;try{d.dataset.load=sessionStorage.getItem('${SEEN_KEY}')?'seen':'loading'}catch(e){d.dataset.load='loading'}`;
