const MAX_DECODED_BYTES = 7 * 1024 * 1024;

function doGet() { return json_({ok: true, service: 'ProjectOS Backup'}); }

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const properties = PropertiesService.getScriptProperties();
    const expected = properties.getProperty('AUTH_TOKEN');
    if (!expected || payload.token !== expected) throw new Error('Accès refusé');
    const rootId = properties.getProperty('ROOT_FOLDER_ID');
    if (!rootId) throw new Error('ROOT_FOLDER_ID absent');
    const current = childFolder_(DriveApp.getFolderById(rootId), 'Current');
    if (payload.action === 'manifest') return json_({ok: true, manifest: readManifest_(current)});
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      if (payload.action === 'upload') upload_(current, payload);
      else if (payload.action === 'delete') delete_(current, payload.path);
      else if (payload.action === 'finalize') finalize_(current, payload.manifest);
      else throw new Error('Action inconnue');
    } finally { lock.releaseLock(); }
    return json_({ok: true});
  } catch (error) { return json_({ok: false, error: String(error.message || error)}); }
}

function upload_(current, payload) {
  const resolved = resolve_(current, payload.path, true);
  const bytes = Utilities.base64Decode(payload.contentBase64 || '');
  if (bytes.length > MAX_DECODED_BYTES) throw new Error('Fichier trop volumineux');
  if (sha256_(bytes) !== payload.sha256) throw new Error('SHA-256 incorrect: ' + payload.path);
  const temporaryName = '.projectos-' + Utilities.getUuid();
  const created = resolved.folder.createFile(Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', temporaryName));
  const existing = resolved.folder.getFilesByName(resolved.name);
  while (existing.hasNext()) existing.next().setTrashed(true);
  created.setName(resolved.name);
}

function delete_(current, path) {
  const resolved = resolve_(current, path, false);
  if (!resolved) return;
  const files = resolved.folder.getFilesByName(resolved.name);
  while (files.hasNext()) files.next().setTrashed(true);
}

function finalize_(current, manifest) {
  if (!manifest || manifest.status !== 'complete') throw new Error('Manifeste incomplet');
  const text = JSON.stringify(manifest, null, 2);
  const temporary = current.createFile('.projectos-manifest-' + Utilities.getUuid(), text, MimeType.PLAIN_TEXT);
  const old = current.getFilesByName('MANIFEST.json');
  while (old.hasNext()) old.next().setTrashed(true);
  temporary.setName('MANIFEST.json');
  removeEmpty_(current);
}

function readManifest_(current) {
  const files = current.getFilesByName('MANIFEST.json');
  if (!files.hasNext()) return null;
  try { return JSON.parse(files.next().getBlob().getDataAsString('UTF-8')); }
  catch (error) { throw new Error('MANIFEST.json Drive invalide'); }
}

function resolve_(root, path, createFolders) {
  if (typeof path !== 'string' || !path || path.length > 1000) throw new Error('Chemin invalide');
  const parts = path.split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || p.indexOf('\\') >= 0)) throw new Error('Chemin invalide');
  let folder = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const matches = folder.getFoldersByName(parts[i]);
    if (matches.hasNext()) folder = matches.next();
    else if (createFolders) folder = folder.createFolder(parts[i]);
    else return null;
  }
  return {folder: folder, name: parts[parts.length - 1]};
}

function childFolder_(parent, name) {
  const matches = parent.getFoldersByName(name);
  return matches.hasNext() ? matches.next() : parent.createFolder(name);
}

function removeEmpty_(root) {
  const folders = root.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next(); removeEmpty_(folder);
    if (!folder.getFiles().hasNext() && !folder.getFolders().hasNext()) folder.setTrashed(true);
  }
}

function sha256_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
    .map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('');
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
