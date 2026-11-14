/**
 * Applies the saved (or OS-preferred) colour scheme before first paint so the
 * page never flashes white for dark-mode visitors. Deliberately tiny and
 * inline: it must run before React hydrates.
 */
const SCRIPT = `(function(){try{
  var stored = localStorage.getItem("abzaro-theme");
  var dark = stored ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}catch(e){}})();`;

export function ThemeScript() {
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
