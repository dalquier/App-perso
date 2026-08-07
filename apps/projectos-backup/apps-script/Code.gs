const MAX_DECODED_BYTES = 7 * 1024 * 1024;
const MAX_BATCH_FILES = 4;
const MAX_BATCH_DECODED_BYTES = 1024 * 1024;
const SESSION_PREFIX = 'PROJECTOS_SYNC_';

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : '';
    if (!action) return json_({ok: true, service: 'ProjectOS Backup'});
    if (action !== 'manifest' && action !== 'syncStatus') throw new Error('Lecture inconnue');
    const properties = PropertiesService.getScriptProperties();
    const expected = properties.getProperty('AUTH_TOKEN');
    const timestamp = String(e.parameter.timestamp || '');
    const encodedPayload = e.parameter.payload || '{}';
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!expected || !/^\d{10}$/.test(timestamp) || age > 300) throw new Error('Accès refusé');
    const message = action + '\n' + timestamp + '\n' + encodedPayload;
    const expectedSignature = Utilities.computeHmacSha256Signature(message, expected, Utilities.Charset.UTF_8)
      .map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('');
    if (!secureEquals_(String(e.parameter.signature || ''), expectedSignature)) throw new Error('Accès refusé');
    const payload = JSON.parse(encodedPayload);
    if (action === 'syncStatus') return json_(syncStatus_(properties, payload));
    const rootId = properties.getProperty('ROOT_FOLDER_ID');
    if (!rootId) throw new Error('ROOT_FOLDER_ID absent');
    const current = childFolder_(DriveApp.getFolderById(rootId), 'Current');
    return json_({ok: true, manifest: readManifest_(current)});
  } catch (error) { return json_({ok: false, error: String(error.message || error)}); }
}

function secureEquals_(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const properties = PropertiesService.getScriptProperties();
    const expected = properties.getProperty('AUTH_TOKEN');
    if (!expected || payload.token !== expected) throw new Error('Accès refusé');
    if (payload.action === 'ping') return json_({ok: true, service: 'ProjectOS Backup', protocol: 2});
    const rootId = properties.getProperty('ROOT_FOLDER_ID');
    if (!rootId) throw new Error('ROOT_FOLDER_ID absent');
    const current = childFolder_(DriveApp.getFolderById(rootId), 'Current');
    if (payload.action === 'manifest') return json_({ok: true, manifest: readManifest_(current)});
    if (payload.action === 'syncStatus') return json_(syncStatus_(properties, payload));
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      let result = {};
      if (payload.action === 'beginSync') result = beginSync_(properties, payload);
      else if (payload.action === 'upload') upload_(current, payload);
      else if (payload.action === 'uploadBatch') result = uploadBatch_(current, properties, payload);
      else if (payload.action === 'delete') delete_(current, payload.path);
      else if (payload.action === 'deleteBatch') result = deleteBatch_(current, properties, payload);
      else if (payload.action === 'finalize') finalize_(current, payload.manifest);
      else if (payload.action === 'finalizeSync') result = finalizeSync_(current, properties, payload);
      else throw new Error('Action inconnue');
      return json_(Object.assign({ok: true}, result));
    } finally { lock.releaseLock(); }
  } catch (error) { return json_({ok: false, error: String(error.message || error)}); }
}

function beginSync_(properties, payload) {
  validateSyncId_(payload.syncId);
  if (!/^[a-f0-9]{64}$/.test(payload.planDigest || '')) throw new Error('Empreinte du plan invalide');
  const key = metaKey_(payload.syncId);
  const existing = properties.getProperty(key);
  if (existing) {
    const meta = JSON.parse(existing);
    if (meta.planDigest !== payload.planDigest) throw new Error('Session liée à un autre plan');
    return {receivedUploads: meta.receivedUploads || 0, receivedDeletes: meta.receivedDeletes || 0, resumed: true};
  }
  const meta = {
    syncId: payload.syncId,
    planDigest: payload.planDigest,
    uploadCount: nonNegativeInteger_(payload.uploadCount),
    deleteCount: nonNegativeInteger_(payload.deleteCount),
    receivedUploads: 0,
    receivedDeletes: 0,
    status: 'active',
    updatedAt: new Date().toISOString()
  };
  properties.setProperty(key, JSON.stringify(meta));
  return {receivedUploads: 0, receivedDeletes: 0, resumed: false};
}

function syncStatus_(properties, payload) {
  const meta = loadMeta_(properties, payload.syncId);
  const uploads = Array.isArray(payload.uploads) ? payload.uploads : [];
  const deletes = Array.isArray(payload.deletes) ? payload.deletes : [];
  const receivedUploads = uploads.filter(item =>
    properties.getProperty(receiptKey_(payload.syncId, 'U', item.path)) === item.sha256
  ).map(item => item.path);
  const receivedDeletes = deletes.filter(path =>
    properties.getProperty(receiptKey_(payload.syncId, 'D', path)) === '1'
  );
  return {ok: true, status: meta.status, receivedUploads: receivedUploads, receivedDeletes: receivedDeletes};
}

function uploadBatch_(current, properties, request) {
  const files = request.files;
  if (!Array.isArray(files) || !files.length || files.length > MAX_BATCH_FILES) throw new Error('Lot upload invalide');
  const meta = loadMeta_(properties, request.syncId);
  if (meta.status !== 'active') throw new Error('Session non active');
  let total = 0;
  const decoded = files.map(payload => {
    const bytes = Utilities.base64Decode(payload.contentBase64 || '');
    total += bytes.length;
    if (bytes.length > MAX_DECODED_BYTES || total > MAX_BATCH_DECODED_BYTES) throw new Error('Lot upload trop volumineux');
    if (sha256_(bytes) !== payload.sha256) throw new Error('SHA-256 incorrect: ' + payload.path);
    resolve_(current, payload.path, false); // validates the path without mutating Drive
    return {payload: payload, bytes: bytes};
  });
  let resumed = 0;
  decoded.forEach(item => {
    const key = receiptKey_(request.syncId, 'U', item.payload.path);
    const receipt = properties.getProperty(key);
    if (receipt === item.payload.sha256 || fileHasSha_(current, item.payload.path, item.payload.sha256)) {
      if (!receipt) {
        properties.setProperty(key, item.payload.sha256);
        meta.receivedUploads += 1;
      }
      resumed += 1;
      return;
    }
    if (receipt) throw new Error('Reçu upload contradictoire: ' + item.payload.path);
    uploadBytes_(current, item.payload, item.bytes);
    properties.setProperty(key, item.payload.sha256);
    meta.receivedUploads += 1;
    saveMeta_(properties, meta);
  });
  saveMeta_(properties, meta);
  return {resumed: resumed};
}

function upload_(current, payload) {
  const bytes = Utilities.base64Decode(payload.contentBase64 || '');
  if (bytes.length > MAX_DECODED_BYTES) throw new Error('Fichier trop volumineux');
  if (sha256_(bytes) !== payload.sha256) throw new Error('SHA-256 incorrect: ' + payload.path);
  uploadBytes_(current, payload, bytes);
}

function uploadBytes_(current, payload, bytes) {
  const resolved = resolve_(current, payload.path, true);
  const temporaryName = '.projectos-' + Utilities.getUuid();
  const created = resolved.folder.createFile(Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', temporaryName));
  const existing = resolved.folder.getFilesByName(resolved.name);
  while (existing.hasNext()) existing.next().setTrashed(true);
  created.setName(resolved.name);
  created.setDescription('projectos-sha256:' + payload.sha256);
}

function deleteBatch_(current, properties, request) {
  const paths = request.paths;
  if (!Array.isArray(paths) || !paths.length || paths.length > MAX_BATCH_FILES) throw new Error('Lot suppression invalide');
  const meta = loadMeta_(properties, request.syncId);
  if (meta.receivedUploads !== meta.uploadCount) throw new Error('Suppressions interdites avant la fin des uploads');
  paths.forEach(path => resolve_(current, path, false)); // validate every path first
  let resumed = 0;
  paths.forEach(path => {
    const key = receiptKey_(request.syncId, 'D', path);
    if (properties.getProperty(key) === '1') { resumed += 1; return; }
    delete_(current, path);
    properties.setProperty(key, '1');
    meta.receivedDeletes += 1;
    saveMeta_(properties, meta);
  });
  return {resumed: resumed};
}

function finalizeSync_(current, properties, payload) {
  const meta = loadMeta_(properties, payload.syncId);
  if (meta.planDigest !== payload.planDigest) throw new Error('Empreinte du plan contradictoire');
  if (meta.receivedUploads !== meta.uploadCount || meta.receivedDeletes !== meta.deleteCount) {
    throw new Error('Session incomplète');
  }
  const uploads = Array.isArray(payload.uploads) ? payload.uploads : [];
  const deletes = Array.isArray(payload.deletes) ? payload.deletes : [];
  if (uploads.length !== meta.uploadCount || deletes.length !== meta.deleteCount) throw new Error('Plan final incomplet');
  uploads.forEach(item => {
    if (properties.getProperty(receiptKey_(payload.syncId, 'U', item.path)) !== item.sha256) {
      throw new Error('Upload non confirmé: ' + item.path);
    }
  });
  deletes.forEach(path => {
    if (properties.getProperty(receiptKey_(payload.syncId, 'D', path)) !== '1') {
      throw new Error('Suppression non confirmée: ' + path);
    }
  });
  finalize_(current, payload.manifest);
  cleanupSession_(properties, payload.syncId, uploads, deletes);
  return {status: 'complete'};
}

function validateSyncId_(syncId) {
  if (typeof syncId !== 'string' || !syncId || syncId.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(syncId)) {
    throw new Error('Identifiant de session invalide');
  }
}

function nonNegativeInteger_(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new Error('Compteur de session invalide');
  return number;
}

function metaKey_(syncId) {
  validateSyncId_(syncId);
  return SESSION_PREFIX + shortHash_(syncId) + '_META';
}

function receiptKey_(syncId, kind, path) {
  validateSyncId_(syncId);
  if (kind !== 'U' && kind !== 'D') throw new Error('Type de reçu invalide');
  if (typeof path !== 'string' || !path) throw new Error('Chemin de reçu invalide');
  return SESSION_PREFIX + shortHash_(syncId) + '_' + kind + '_' + shortHash_(path);
}

function shortHash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)
    .slice(0, 16).map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('');
}

function loadMeta_(properties, syncId) {
  const raw = properties.getProperty(metaKey_(syncId));
  if (!raw) throw new Error('Session Drive absente — redémarrez la sauvegarde');
  return JSON.parse(raw);
}

function saveMeta_(properties, meta) {
  meta.updatedAt = new Date().toISOString();
  properties.setProperty(metaKey_(meta.syncId), JSON.stringify(meta));
}

function cleanupSession_(properties, syncId, uploads, deletes) {
  uploads.forEach(item => properties.deleteProperty(receiptKey_(syncId, 'U', item.path)));
  deletes.forEach(path => properties.deleteProperty(receiptKey_(syncId, 'D', path)));
  properties.deleteProperty(metaKey_(syncId));
}

function fileHasSha_(current, path, expectedSha) {
  const resolved = resolve_(current, path, false);
  if (!resolved) return false;
  const files = resolved.folder.getFilesByName(resolved.name);
  while (files.hasNext()) {
    if (files.next().getDescription() === 'projectos-sha256:' + expectedSha) return true;
  }
  return false;
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
