const state = {
  apps: [],
  view: "home",
  query: "",
  settings: { token:"", owner:"", repo:"", branch:"main", basePath:"apps", autoUpload:false },
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const root = $("#view-root");

function uid(){ return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function fmtSize(bytes){
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/1024/1024).toFixed(2) + " MB";
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

let toastTimer = null;
function toast(msg, kind=""){
  const t = $("#toast");
  t.className = "toast show " + kind;
  t.innerHTML = (kind==="error" ? icon("info") : kind==="success" ? icon("check") : "") + `<span>${escapeHtml(msg)}</span>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

/* ---------------- Bottom sheet helper ---------------- */
function openSheet(html){
  $("#scrim").classList.add("show");
  const sheet = $("#sheet");
  sheet.innerHTML = `<div class="grabber"></div>${html}`;
  sheet.classList.add("show");
  bindA11yRoles(sheet);
  bindRipples();
}
function closeSheet(){
  $("#scrim").classList.remove("show");
  $("#sheet").classList.remove("show");
}
$("#scrim").addEventListener("click", closeSheet);

/* ---------------- Init ---------------- */
async function init(){
  const [apps, token, owner, repo, branch, basePath, autoUpload] = await Promise.all([
    DB.getAllApps(),
    DB.getKV("gh_token",""), DB.getKV("gh_owner",""), DB.getKV("gh_repo",""),
    DB.getKV("gh_branch","main"), DB.getKV("gh_basePath","apps"), DB.getKV("gh_auto",false),
  ]);
  state.apps = apps;
  state.settings = { token, owner, repo, branch, basePath, autoUpload };
  render();
}

function switchView(v){
  state.view = v;
  state.query = "";
  render();
}

/* ---------------- Rendering ---------------- */
function render(){
  $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === state.view));
  $("#fab").style.display = (state.view === "home" || state.view === "apps") ? "flex" : "none";

  if (state.view === "home") return renderHome();
  if (state.view === "apps") return renderApps();
  if (state.view === "files") return renderFiles();
  if (state.view === "github") return renderGithub();
  if (state.view === "settings") return renderSettings();
}

function filteredApps(){
  const q = state.query.trim().toLowerCase();
  if (!q) return state.apps;
  return state.apps.filter(a => a.name.toLowerCase().includes(q));
}

function appCard(app){
  return `
  <div class="app-card" data-id="${app.id}" role="button" tabindex="0" aria-label="Open ${escapeHtml(app.name)}">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div class="app-icon" style="background:linear-gradient(135deg,${app.color1},${app.color2})" aria-hidden="true">${app.letter}</div>
      <button class="icon-btn kebab" data-id="${app.id}" aria-label="More options for ${escapeHtml(app.name)}"><svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="width:18px;height:18px"><circle cx="12" cy="6" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18" r="1.7"/></svg></button>
    </div>
    <div class="app-name">${escapeHtml(app.name)}</div>
    <div class="app-meta">${icon(app.source==="github"?"github":"device")}<span>${fmtSize(app.size)}</span></div>
  </div>`;
}

function renderHome(){
  const q = state.query.trim();
  if (q){
    const results = filteredApps();
    root.innerHTML = `
      ${topbarHTML("Home", true)}
      <main>
        ${results.length === 0
          ? emptyState("apps", "No matches", "Try a different search term.")
          : `<div class="section-title">${results.length} match${results.length>1?"es":""}</div><div class="app-grid">${results.map(appCard).join("")}</div>`}
      </main>`;
    bindCommon();
    return;
  }
  const recent = state.apps.slice(0,6);
  root.innerHTML = `
    ${topbarHTML("Home", true)}
    <main>
      ${state.apps.length === 0 ? emptyState("apps",
          "Your hub is empty",
          "Tap the + button to import an HTML/CSS/JS project from your device or a GitHub repo. It'll show up here like an installed app.")
        : `
        <div class="section-title">Continue using <small>${state.apps.length} total</small></div>
        <div class="app-grid">${recent.map(appCard).join("")}</div>
        <div class="section-title" style="margin-top:26px;">Quick actions</div>
        <div class="list-row" id="qa-import-device">
          <div class="icon-wrap">${icon("upload")}</div>
          <div class="txt"><div class="title">Import from device storage</div><div class="sub">Pick a .zip or a project folder</div></div>
          <div class="chev">${icon("chevron_right")}</div>
        </div>
        <div class="list-row" id="qa-import-github">
          <div class="icon-wrap">${icon("github")}</div>
          <div class="txt"><div class="title">Import from GitHub</div><div class="sub">Pull a public or private repo</div></div>
          <div class="chev">${icon("chevron_right")}</div>
        </div>
        <div class="list-row" id="qa-github-sync">
          <div class="icon-wrap">${icon("cloud_upload")}</div>
          <div class="txt"><div class="title">GitHub sync status</div><div class="sub">${state.settings.repo ? state.settings.owner+"/"+state.settings.repo : "Not connected yet"}</div></div>
          <div class="chev">${icon("chevron_right")}</div>
        </div>`}
    </main>`;
  bindCommon();
  $("#qa-import-device")?.addEventListener("click", openImportDeviceSheet);
  $("#qa-import-github")?.addEventListener("click", openImportGithubSheet);
  $("#qa-github-sync")?.addEventListener("click", () => switchView("github"));
}

function renderApps(){
  const list = filteredApps();
  root.innerHTML = `
    ${topbarHTML("My apps", true)}
    <main>
      ${list.length === 0
        ? emptyState("apps", state.query ? "No matches" : "No apps yet", state.query ? "Try a different search term." : "Import your first app with the + button.")
        : `<div class="section-title">${list.length} app${list.length>1?"s":""}</div><div class="app-grid">${list.map(appCard).join("")}</div>`}
    </main>`;
  bindCommon();
}

function renderFiles(){
  const rows = [];
  state.apps.forEach(app => {
    Object.keys(app.files).sort().forEach(path => {
      rows.push({ app, path });
    });
  });
  const q = state.query.trim().toLowerCase();
  const filtered = q ? rows.filter(r => (r.app.name+"/"+r.path).toLowerCase().includes(q)) : rows;

  root.innerHTML = `
    ${topbarHTML("Files", true, "Search files & apps")}
    <main>
      ${filtered.length === 0
        ? emptyState("folder", "No files to show", "Files inside apps you import will appear here — HTML, CSS, JS, images, and PDFs.")
        : `<div class="section-title">${filtered.length} file${filtered.length>1?"s":""}</div>` +
          filtered.map(r => fileRow(r.app, r.path)).join("")}
    </main>`;
  bindCommon();
  $$(".file-row").forEach(el => el.addEventListener("click", (e) => {
    if (e.target.closest(".open-btn")) return;
    openFileViewer(el.dataset.appid, el.dataset.path);
  }));
  $$(".file-row .open-btn").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openFileViewer(btn.dataset.appid, btn.dataset.path);
  }));
}

function fileRow(app, path){
  const ext = path.split(".").pop().toLowerCase();
  const ic = ext==="pdf" ? "file_pdf" : ["png","jpg","jpeg","gif","webp","svg"].includes(ext) ? "file_image" :
             ["html","htm","css","js","json"].includes(ext) ? "file_code" : "file_generic";
  return `
  <div class="list-row file-row" data-appid="${app.id}" data-path="${escapeHtml(path)}">
    <div class="icon-wrap">${icon(ic)}</div>
    <div class="txt"><div class="title">${escapeHtml(path.split("/").pop())}</div><div class="sub">${escapeHtml(app.name)}/${escapeHtml(path)}</div></div>
    <button class="open-btn" data-appid="${app.id}" data-path="${escapeHtml(path)}" aria-label="Open ${escapeHtml(path.split("/").pop())}">Open</button>
  </div>`;
}

function renderGithub(){
  const s = state.settings;
  const connected = !!(s.owner && s.repo);
  root.innerHTML = `
    ${topbarHTML("GitHub", false)}
    <main>
      <div class="gh-card">
        <div class="gh-status">
          <div class="dot ${connected?"on":""}"></div>
          <div>
            <div class="txt">${connected ? s.owner+"/"+s.repo : "Not connected"}</div>
            <div class="sub2">${connected ? "Branch: "+(s.branch||"main")+" • Path: /"+(s.basePath||"apps") : "Add a repo below to enable upload & sync"}</div>
          </div>
        </div>
      </div>

      <div class="section-title">Repository</div>
      <div class="gh-card">
        <div class="field"><label>Personal access token</label>
          <input id="in-token" type="password" placeholder="ghp_xxx… (repo scope)" value="${escapeHtml(s.token)}"></div>
        <div class="field row2">
          <div><label>Owner / org</label><input id="in-owner" placeholder="e.g. yourname" value="${escapeHtml(s.owner)}"></div>
          <div><label>Repository</label><input id="in-repo" placeholder="e.g. my-apps" value="${escapeHtml(s.repo)}"></div>
        </div>
        <div class="field row2">
          <div><label>Branch</label><input id="in-branch" placeholder="main" value="${escapeHtml(s.branch||"main")}"></div>
          <div><label>Upload path</label><input id="in-basepath" placeholder="apps" value="${escapeHtml(s.basePath||"apps")}"></div>
        </div>
        <button class="btn tonal" id="btn-verify">${icon("refresh")}<span>Test connection</span></button>
      </div>

      <div class="gh-card" style="padding:6px 18px;">
        <div class="switch-row">
          <div><div class="title">Auto-upload on import</div><div class="sub">Push a new app to GitHub the moment it's imported</div></div>
          <button id="toggle-auto">${icon(s.autoUpload ? "toggle_on" : "toggle_off")}</button>
        </div>
      </div>

      <div class="section-title">Manual sync <small>${state.apps.length} app${state.apps.length!==1?"s":""}</small></div>
      ${state.apps.length===0 ? emptyState("cloud_upload","Nothing to upload yet","Import an app first, then push it to your repo from here.") :
        state.apps.map(a => `
        <div class="list-row" data-upload="${a.id}">
          <div class="icon-wrap">${icon("cloud_upload")}</div>
          <div class="txt"><div class="title">${escapeHtml(a.name)}</div><div class="sub">${fmtSize(a.size)} • tap to upload</div></div>
          <div class="chev">${icon("chevron_right")}</div>
        </div>`).join("")}
    </main>`;
  bindCommon();

  $("#btn-verify").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    await persistGithubFields();
    btn.classList.add("loading"); btn.disabled = true;
    try{
      await GitHub.verifyRepo(state.settings.owner, state.settings.repo, state.settings.token);
      toast("Connected to "+state.settings.owner+"/"+state.settings.repo, "success");
    }catch(e){ toast(e.message, "error"); }
    finally{ btn.classList.remove("loading"); btn.disabled = false; }
  });
  $("#toggle-auto").addEventListener("click", async () => {
    state.settings.autoUpload = !state.settings.autoUpload;
    await DB.setKV("gh_auto", state.settings.autoUpload);
    renderGithub();
  });
  $$(".gh-card input").forEach(inp => inp.addEventListener("change", persistGithubFields));
  $$("[data-upload]").forEach(el => el.addEventListener("click", () => uploadAppFlow(el.dataset.upload)));
}

async function persistGithubFields(){
  state.settings.token = $("#in-token")?.value.trim() ?? state.settings.token;
  state.settings.owner = $("#in-owner")?.value.trim() ?? state.settings.owner;
  state.settings.repo = $("#in-repo")?.value.trim() ?? state.settings.repo;
  state.settings.branch = $("#in-branch")?.value.trim() || "main";
  state.settings.basePath = $("#in-basepath")?.value.trim() || "apps";
  await Promise.all([
    DB.setKV("gh_token", state.settings.token), DB.setKV("gh_owner", state.settings.owner),
    DB.setKV("gh_repo", state.settings.repo), DB.setKV("gh_branch", state.settings.branch),
    DB.setKV("gh_basePath", state.settings.basePath),
  ]);
}

async function uploadAppFlow(appId){
  const app = state.apps.find(a => a.id === appId);
  const s = state.settings;
  if (!s.owner || !s.repo){ toast("Add a repo in GitHub tab first", "error"); return; }
  toast("Uploading "+app.name+"…");
  try{
    await GitHub.uploadApp(app, s, (done,total)=>{ if(done===total) toast("Uploaded "+app.name+" ("+total+" files)","success"); });
  }catch(e){ toast(e.message, "error"); }
}

function renderSettings(){
  const totalSize = state.apps.reduce((s,a)=>s+a.size,0);
  root.innerHTML = `
    ${topbarHTML("Settings", false)}
    <main>
      <div class="section-title">Storage</div>
      <div class="gh-card">
        <div class="switch-row"><div><div class="title">Apps stored on this device</div><div class="sub">${state.apps.length} apps • ${fmtSize(totalSize)}</div></div></div>
        <div class="switch-row"><div><div class="title">Storage engine</div><div class="sub">Browser IndexedDB (persists across restarts)</div></div></div>
      </div>
      <button class="btn tonal" id="btn-clear" style="margin-top:6px;">${icon("trash")}<span>Erase all local data</span></button>

      <div class="section-title" style="margin-top:26px;">About</div>
      <div class="gh-card" style="font-size:13px; line-height:1.6; color:var(--md-on-surface-variant);">
        <p style="margin-top:0;">This is a personal, no-login app hub. Imported HTML/CSS/JS projects are bundled into one self-contained page so they can run inside the built-in viewer — multi-file apps that fetch local files dynamically at runtime may need adjusting.</p>
        <p style="margin-bottom:0;">GitHub sync uses a personal access token stored only in this device's local storage — it is never sent anywhere except api.github.com.</p>
      </div>
    </main>`;
  bindCommon();
  $("#btn-clear").addEventListener("click", async () => {
    if (!confirm("Delete all imported apps and GitHub settings from this device?")) return;
    for (const a of state.apps) await DB.deleteApp(a.id);
    await Promise.all(["gh_token","gh_owner","gh_repo","gh_branch","gh_basePath","gh_auto"].map(k=>DB.setKV(k, k==="gh_branch"?"main":k==="gh_basePath"?"apps":k==="gh_auto"?false:"")));
    await init();
    toast("All local data erased", "success");
  });
}

function topbarHTML(title, withSearch, placeholder="Search your apps"){
  return `
  <div class="topbar">
    <div class="topbar-row">
      <div class="brand">${title === "Home" ? "My App Hub" : title}</div>
      <div class="spacer"></div>
    </div>
    ${withSearch ? `<div class="search-pill">${icon("search")}<input id="search-input" aria-label="${placeholder}" placeholder="${placeholder}" value="${escapeHtml(state.query)}"></div>` : ""}
  </div>`;
}

function emptyState(ic, title, sub){
  return `<div class="empty-state">${icon(ic)}<h3>${title}</h3><p>${sub}</p></div>`;
}

// Cheap ripple: only animates transform/opacity (per the perf/heating budget),
// listener is passive since it never calls preventDefault.
function spawnRipple(el, evt){
  const rect = el.getBoundingClientRect();
  const x = (evt.touches ? evt.touches[0].clientX : evt.clientX) - rect.left;
  const y = (evt.touches ? evt.touches[0].clientY : evt.clientY) - rect.top;
  const size = Math.max(rect.width, rect.height) * 1.6;
  const r = document.createElement("span");
  r.className = "ripple";
  r.style.width = r.style.height = size + "px";
  r.style.left = (x - size/2) + "px";
  r.style.top = (y - size/2) + "px";
  el.appendChild(r);
  r.addEventListener("animationend", () => r.remove(), { once:true });
}
function bindRipples(){
  $$(".app-card, .list-row, .option-row, .btn, .icon-btn, .nav-item, .fab, .open-btn").forEach(el => {
    if (el._rippleBound) return;
    el._rippleBound = true;
    // stopPropagation so a press on a nested control (e.g. the kebab button
    // inside an app-card, or the Open pill inside a list-row) doesn't also
    // bubble up and spawn a second ripple on the parent.
    el.addEventListener("pointerdown", (e) => { e.stopPropagation(); spawnRipple(el, e); }, { passive:true });
  });
}
// Every clickable row/option div gets a real accessible role + keyboard focus
// stop (buttons and role=button-tagged elements already have this natively).
function bindA11yRoles(scope){
  $$(".list-row, .option-row", scope).forEach(el => {
    if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
  });
}

// Debounced re-render on search typing: avoids re-rendering the whole grid
// on every keystroke, which is the main CPU/heating cost in this app.
let searchDebounce = null;
function bindCommon(){
  const s = $("#search-input");
  if (s) s.addEventListener("input", e => {
    const val = e.target.value;
    const caret = e.target.selectionStart; // remember where the user actually is, not just end-of-text
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.query = val; render();
      const s2 = $("#search-input");
      if (s2){
        s2.focus();
        const pos = Math.min(caret, s2.value.length);
        s2.setSelectionRange(pos, pos);
      }
    }, 120);
  });
  $$(".app-card").forEach(card => card.addEventListener("click", (e) => {
    if (e.target.closest(".kebab")) return;
    openRunner(card.dataset.id);
  }));
  $$(".kebab").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); openAppActionsSheet(btn.dataset.id); }));
  bindRipples();
  bindA11yRoles(root);
}

/* ---------------- Import flows ---------------- */
function openImportDeviceSheet(){
  closeSheet();
  openSheet(`
    <h3>Import from device</h3>
    <p class="hint">Bring in a project stored on your phone.</p>
    <div class="option-row" id="opt-zip"><div class="icon-wrap">${icon("file_code")}</div>
      <div><div class="title">Choose a .zip file</div><div class="sub">Extracted automatically</div></div></div>
    <div class="option-row" id="opt-folder"><div class="icon-wrap">${icon("folder")}</div>
      <div><div class="title">Choose a project folder</div><div class="sub">Pick the folder with your index.html</div></div></div>
    <input type="file" id="zip-input" class="hidden-input" accept=".zip">
    <input type="file" id="folder-input" class="hidden-input" webkitdirectory directory multiple>
  `);
  $("#opt-zip").addEventListener("click", () => $("#zip-input").click());
  $("#opt-folder").addEventListener("click", () => $("#folder-input").click());
  $("#zip-input").addEventListener("change", async (e) => { if (e.target.files[0]) await handleZipImport(e.target.files[0]); });
  $("#folder-input").addEventListener("change", async (e) => { if (e.target.files.length) await handleFolderImport(e.target.files); });
}

function openImportGithubSheet(){
  closeSheet();
  openSheet(`
    <h3>Import from GitHub</h3>
    <p class="hint">Pull any public repo, or a private one using your token from the GitHub tab.</p>
    <div class="field"><label>Owner / repository</label><input id="gh-in-slug" placeholder="e.g. octocat/hello-world"></div>
    <div class="field"><label>Branch</label><input id="gh-in-branch" placeholder="main"></div>
    <button class="btn primary" id="gh-do-import">${icon("cloud_upload")}<span>Import repo</span></button>
  `);
  $("#gh-do-import").addEventListener("click", async () => {
    const slug = $("#gh-in-slug").value.trim();
    const branch = $("#gh-in-branch").value.trim();
    if (!slug.includes("/")){ toast("Use the format owner/repo","error"); return; }
    const [owner, repo] = slug.split("/");
    closeSheet();
    toast("Downloading "+slug+"…");
    try{
      const blob = await GitHub.downloadRepoZip(owner, repo, branch, state.settings.token);
      const zip = await JSZip.loadAsync(blob);
      const { files, size } = await filesFromZip(zip);
      await saveImportedApp(repo, files, size, "github");
    }catch(e){ toast(e.message, "error"); }
  });
}

async function handleZipImport(file){
  closeSheet();
  toast("Extracting "+file.name+"…");
  try{
    const zip = await JSZip.loadAsync(file);
    const { files, size } = await filesFromZip(zip);
    const name = file.name.replace(/\.zip$/i,"");
    await saveImportedApp(name, files, size, "device");
  }catch(e){ toast("Could not read zip: "+e.message, "error"); }
}

async function handleFolderImport(fileList){
  closeSheet();
  toast("Importing folder…");
  try{
    const { files, size } = await filesFromFileList(fileList);
    const first = fileList[0].webkitRelativePath || "";
    const name = (first.split("/")[0]) || "My App";
    await saveImportedApp(name, files, size, "device");
  }catch(e){ toast("Could not read folder: "+e.message, "error"); }
}

async function saveImportedApp(name, files, size, source){
  const entry = findEntryHtml(files);
  if (!entry){ toast("No index.html found in that import", "error"); return; }
  const [c1,c2] = colorPairForName(name);
  const app = {
    id: uid(), name, entry, files, size, source,
    createdAt: Date.now(), letter: name.trim()[0]?.toUpperCase() || "A",
    color1: c1, color2: c2,
  };
  await DB.putApp(app);
  state.apps = await DB.getAllApps();
  render();
  toast("Imported "+name, "success");

  if (state.settings.autoUpload && state.settings.owner && state.settings.repo){
    toast("Auto-uploading "+name+" to GitHub…");
    try{
      await GitHub.uploadApp(app, state.settings, (done,total)=>{ if(done===total) toast(name+" synced to GitHub ("+total+" files)","success"); });
    }catch(e){ toast("Auto-upload failed: "+e.message, "error"); }
  }
}

/* ---------------- App actions (kebab menu) ---------------- */
function openAppActionsSheet(appId){
  const app = state.apps.find(a => a.id === appId);
  if (!app) return;
  openSheet(`
    <h3>${escapeHtml(app.name)}</h3>
    <p class="hint">${Object.keys(app.files).length} files • ${fmtSize(app.size)}</p>
    <div class="option-row" id="act-open"><div class="icon-wrap">${icon("play_store_bag")}</div><div><div class="title">Open app</div></div></div>
    <div class="option-row" id="act-files"><div class="icon-wrap">${icon("folder")}</div><div><div class="title">View files</div></div></div>
    <div class="option-row" id="act-upload"><div class="icon-wrap">${icon("cloud_upload")}</div><div><div class="title">Upload to GitHub</div></div></div>
    <div class="option-row" id="act-delete"><div class="icon-wrap" style="background:#5c2b2b;color:#ffb4a0;">${icon("trash")}</div><div><div class="title">Uninstall</div></div></div>
  `);
  $("#act-open").addEventListener("click", () => { closeSheet(); openRunner(appId); });
  $("#act-files").addEventListener("click", () => { closeSheet(); state.view="files"; state.query=app.name; render(); });
  $("#act-upload").addEventListener("click", () => { closeSheet(); uploadAppFlow(appId); });
  $("#act-delete").addEventListener("click", async () => {
    closeSheet();
    if (!confirm(`Uninstall "${app.name}"? This only removes it from this hub.`)) return;
    await DB.deleteApp(appId);
    state.apps = await DB.getAllApps();
    render();
    toast("Uninstalled "+app.name);
  });
}

/* ---------------- Runner overlay ---------------- */
function openRunner(appId){
  const app = state.apps.find(a => a.id === appId);
  if (!app) return;
  const ov = $("#overlay-runner");
  $("#runner-title").textContent = app.name;
  const iframe = $("#runner-frame");
  try{
    iframe.srcdoc = bundleEntry(app.files, app.entry);
  }catch(e){
    iframe.srcdoc = `<body style="font-family:sans-serif;padding:24px;color:#900">Could not run app: ${escapeHtml(e.message)}</body>`;
  }
  ov.classList.add("show");
}
$("#runner-close").addEventListener("click", () => { $("#overlay-runner").classList.remove("show"); $("#runner-frame").srcdoc = ""; });
$("#runner-reload").addEventListener("click", () => { const f = $("#runner-frame"); f.contentWindow.location.reload(); });

/* ---------------- File viewer overlay ---------------- */
function openFileViewer(appId, path){
  const app = state.apps.find(a => a.id === appId);
  if (!app) return;
  const file = app.files[path];
  const ov = $("#overlay-viewer");
  $("#viewer-title").textContent = path.split("/").pop();
  const body = $("#viewer-body");
  const ext = path.split(".").pop().toLowerCase();

  if (ext === "pdf"){
    body.innerHTML = `<div id="pdf-canvas-wrap"></div>`;
    renderPdfIntoContainer($("#pdf-canvas-wrap"), file.content).catch(e => {
      $("#pdf-canvas-wrap").innerHTML = `<p style="color:#fff;padding:20px;">${escapeHtml(e.message)}</p>`;
    });
  } else if (["png","jpg","jpeg","gif","webp","svg","ico"].includes(ext)){
    const mime = mimeOf(path);
    body.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;background:#0c0a10;"><img src="data:${mime};base64,${file.content}" style="max-width:94%;max-height:94%;border-radius:12px;"></div>`;
  } else if (file.type === "text"){
    body.innerHTML = `<pre class="code-view">${escapeHtml(file.content)}</pre>`;
  } else {
    body.innerHTML = `<div class="empty-state">${icon("file_generic")}<h3>Preview not available</h3><p>This file type can't be previewed inline yet.</p></div>`;
  }
  ov.classList.add("show");
}
$("#viewer-close").addEventListener("click", () => { $("#overlay-viewer").classList.remove("show"); $("#viewer-body").innerHTML = ""; });

/* ---------------- Nav & FAB ---------------- */
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches('[role="button"]')){
    e.preventDefault();
    e.target.click();
  }
});

$$(".nav-item").forEach(el => el.addEventListener("click", () => switchView(el.dataset.view)));
$("#fab").addEventListener("click", () => {
  openSheet(`
    <h3>Import an app</h3>
    <p class="hint">Choose a source for your HTML/CSS/JS project.</p>
    <div class="option-row" id="fab-device"><div class="icon-wrap">${icon("upload")}</div><div><div class="title">From device storage</div><div class="sub">.zip file or a folder</div></div></div>
    <div class="option-row" id="fab-github"><div class="icon-wrap">${icon("github")}</div><div><div class="title">From GitHub</div><div class="sub">Public or private repo</div></div></div>
  `);
  $("#fab-device").addEventListener("click", openImportDeviceSheet);
  $("#fab-github").addEventListener("click", openImportGithubSheet);
});

init();
