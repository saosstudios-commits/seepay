import { readFileSync } from "node:fs";
import vm from "node:vm";

const file = new URL("../public/seepay-ui.html", import.meta.url);
const html = readFileSync(file, "utf8");
const scriptTags = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)];
const inlineScripts = scriptTags.filter((match) => {
  const openingTag = match[0].slice(0, match[0].indexOf(">"));
  return !/\bsrc\s*=/i.test(openingTag);
});

if (inlineScripts.length === 0) {
  throw new Error("No inline scripts found in public/seepay-ui.html");
}

for (const [index, match] of inlineScripts.entries()) {
  const openingEnd = match[0].indexOf(">") + 1;
  const closingStart = match[0].toLowerCase().lastIndexOf("</script");
  const source = match[0].slice(openingEnd, closingStart);
  new vm.Script(source, { filename: `public/seepay-ui.html:inline-${index + 1}.js` });
}

console.log(`Parsed ${inlineScripts.length} inline script(s) in public/seepay-ui.html`);
