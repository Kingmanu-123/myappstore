const GH_API = "https://api.github.com";

function ghHeaders(token){
  const h = { "Accept": "application/vnd.github+json" };
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

// base64-encode a JS unicode string safely (for pushing text files to GitHub)
function utf8ToBase64(str){
  return btoa(unescape(encodeURIComponent(str)));
}

const GitHub = {
  async verifyRepo(owner, repo, token){
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}`, { headers: ghHeaders(token) });
    if (!res.ok) throw new Error(res.status === 404 ? "Repo not found (check name / token access)" : `GitHub error ${res.status}`);
    return res.json();
  },

  // Downloads a repo as a zip (works for public repos with no token, or
  // private repos when a token with access is supplied).
  async downloadRepoZip(owner, repo, branch, token){
    const url = `${GH_API}/repos/${owner}/${repo}/zipball/${branch || ""}`;
    const res = await fetch(url, { headers: ghHeaders(token) });
    if (!res.ok) throw new Error(`Could not download repo (${res.status}). Check owner/repo/branch.`);
    return res.blob();
  },

  async getFileSha(owner, repo, path, branch, token){
    const url = `${GH_API}/repos/${owner}/${repo}/contents/${path}${branch ? "?ref="+branch : ""}`;
    const res = await fetch(url, { headers: ghHeaders(token) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
    const data = await res.json();
    return data.sha || null;
  },

  async putFile(owner, repo, path, base64Content, message, branch, token){
    const sha = await this.getFileSha(owner, repo, path, branch, token);
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message || `Update ${path}`,
        content: base64Content,
        branch: branch || undefined,
        sha: sha || undefined,
      }),
    });
    if (!res.ok){
      const err = await res.json().catch(()=>({}));
      throw new Error(err.message || `Upload failed (${res.status})`);
    }
    return res.json();
  },

  // Uploads every file of an imported app under {basePath}/{app.name}/...
  async uploadApp(app, { owner, repo, branch, basePath, token }, onProgress){
    const entries = Object.entries(app.files);
    let done = 0;
    for (const [relPath, file] of entries){
      const fullPath = `${basePath ? basePath.replace(/\/+$/,"") + "/" : ""}${app.name}/${relPath}`.replace(/\/{2,}/g,"/");
      const base64 = file.type === "text" ? utf8ToBase64(file.content) : file.content;
      await this.putFile(owner, repo, fullPath, base64, `Sync ${app.name}: ${relPath}`, branch, token);
      done++;
      if (onProgress) onProgress(done, entries.length, relPath);
    }
    return done;
  },
};
