export const THEME_STORAGE_KEY = "socios-backoffice-theme";

/** Inline script to avoid flash of wrong theme before hydration. */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=t==="dark"||(t!=="light"&&d);var e=document.documentElement;e.classList.toggle("dark",r);e.setAttribute("data-theme",r?"dark":"light");e.style.colorScheme=r?"dark":"light";}catch(e){}})();`;
