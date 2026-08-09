const TEXT_EXT = new Set(["html","htm","css","js","mjs","json","svg","txt","md","xml","csv"]);
const MIME = {
  html:"text/html", htm:"text/html", css:"text/css", js:"application/javascript",
  mjs:"application/javascript", json:"application/json", svg:"image/svg+xml",
  png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif",
  webp:"image/webp", ico:"image/x-icon", pdf:"application/pdf",
  woff:"font/woff", woff2:"font/woff2", ttf:"font/ttf", txt:"text/plain",
  mp3:"audio/mpeg", mp4:"video/mp4", wav:"audio/wav",
};
function extOf(path){ const m = path.split(".").pop(); return (m || "").toLowerCase(); }
function mimeOf(path){ return MIME[extOf(path)] || "application/octet-stream"; }
function isText(path){ return TEXT_EXT.has(extOf(path)); }

function arrayBufferToBase64(buf){
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i=0;i<bytes.length;i+=chunk){
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i+chunk));
  }
  return btoa(binary);
}

// Build the { path: {type, content} } map from a JSZip instance, stripping
// a common top-level folder (GitHub zipballs wrap everything in reponame-sha/).
async function filesFromZip(zip){
  const entries = Object.values(zip.files).filter(f => !f.dir);
  const paths = entries.map(e => e.name);
  let strip = "";
  const first = paths[0] || "";
  const firstSeg = first.split("/")[0] + "/";
  if (firstSeg.length > 1 && paths.every(p => p.startsWith(firstSeg))) strip = firstSeg;

  const files = {};
  let totalSize = 0;
  for (const entry of entries){
    const path = entry.name.slice(strip.length);
    if (!path) continue;
    if (isText(path)){
      const content = await entry.async("text");
      files[path] = { type:"text", content };
      totalSize += content.length;
    } else {
      const buf = await entry.async("arraybuffer");
      files[path] = { type:"base64", content: arrayBufferToBase64(buf) };
      totalSize += buf.byteLength;
    }
  }
  return { files, size: totalSize };
}

async function filesFromFileList(fileList){
  const files = {};
  let totalSize = 0;
  for (const f of Array.from(fileList)){
    let path = f.webkitRelativePath || f.name;
    // drop the top-level folder name picked by the OS folder-picker
    const firstSlash = path.indexOf("/");
    if (firstSlash > -1) path = path.slice(firstSlash+1);
    if (!path) continue;
    if (isText(path)){
      const content = await f.text();
      files[path] = { type:"text", content };
      totalSize += content.length;
    } else {
      const buf = await f.arrayBuffer();
      files[path] = { type:"base64", content: arrayBufferToBase64(buf) };
      totalSize += buf.byteLength;
    }
  }
  return { files, size: totalSize };
}

function findEntryHtml(files){
  const paths = Object.keys(files);
  const htmls = paths.filter(p => extOf(p) === "html" || extOf(p) === "htm");
  if (!htmls.length) return null;
  const root = htmls.find(p => p.toLowerCase() === "index.html");
  if (root) return root;
  htmls.sort((a,b) => a.split("/").length - b.split("/").length);
  return htmls[0];
}

function resolveRelative(baseDir, rel){
  if (/^(https?:)?\/\//i.test(rel) || rel.startsWith("data:") || rel.startsWith("#")) return null;
  try{
    const u = new URL(rel, "http://x/" + baseDir);
    return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  }catch(e){ return null; }
}

// Inline local <link>, <script src>, <img src> references so the whole app
// works as one self-contained document inside the runner iframe. External
// http(s) URLs (CDN scripts, fonts, etc.) are left untouched.
function bundleEntry(files, entryPath){
  let html = files[entryPath].content;
  const baseDir = entryPath.includes("/") ? entryPath.slice(0, entryPath.lastIndexOf("/")+1) : "";

  html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, tag => {
    const m = tag.match(/href=["']([^"']+)["']/i);
    if (!m) return tag;
    const p = resolveRelative(baseDir, m[1]);
    if (p && files[p] && files[p].type === "text"){
      return `<style>\n${files[p].content}\n</style>`;
    }
    return tag;
  });

  html = html.replace(/<script\s+([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi, (tag, pre, src, post) => {
    const p = resolveRelative(baseDir, src);
    if (p && files[p] && files[p].type === "text"){
      return `<script ${pre}${post}>\n${files[p].content}\n</script>`;
    }
    return tag;
  });

  html = html.replace(/(<(?:img|source|audio|video)\s+[^>]*?src=)["']([^"']+)["']/gi, (tag, prefix, src) => {
    const p = resolveRelative(baseDir, src);
    if (p && files[p] && files[p].type === "base64"){
      return `${prefix}"data:${mimeOf(p)};base64,${files[p].content}"`;
    }
    return tag;
  });

  html = html.replace(/href=["']([^"']+\.(?:png|jpg|jpeg|svg|ico|webp))["']/gi, (tag, href) => {
    const p = resolveRelative(baseDir, href);
    if (p && files[p] && files[p].type === "base64"){
      return `href="data:${mimeOf(p)};base64,${files[p].content}"`;
    }
    if (p && files[p] && files[p].type === "text"){
      return `href="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(files[p].content)))}"`;
    }
    return tag;
  });

  return html;
}

function colorPairForName(name){
  const pairs = [
    ["#7C4DFF","#B388FF"], ["#FF7043","#FFAB91"], ["#26A69A","#80CBC4"],
    ["#5C6BC0","#9FA8DA"], ["#EC407A","#F48FB1"], ["#26C6DA","#80DEEA"],
    ["#9CCC65","#C5E1A5"], ["#FFA726","#FFCC80"],
  ];
  let h = 0;
  for (let i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i)) >>> 0;
  return pairs[h % pairs.length];
}
