const MAX_DECODED_BYTES = 7 * 1024 * 1024;
const MAX_BATCH_FILES = 4;
const MAX_BATCH_DECODED_BYTES = 1024 * 1024;
const SESSION_PREFIX = 'PROJECTOS_SYNC_';
const MANIFEST_CACHE_META = 'PROJECTOS_MANIFEST_CACHE_META';
const MANIFEST_CACHE_PREFIX = 'PROJECTOS_MANIFEST_CACHE_';
const MANIFEST_CACHE_CHUNK = 8000;
const MANIFEST_CACHE_MAX_CHUNKS = 55;

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : '';
    if (!action) return json_({ok: true, service: 'ProjectOS Backup', protocol: 3});
    if (action !== 'health' && action !== 'manifest' && action !== 'syncStatus' && action !== 'archiveStatus') throw new Error('Lecture inconnue');
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
    const root = DriveApp.getFolderById(rootId);
    if (action === 'health') return json_({
      ok: true, service: 'ProjectOS Backup', protocol: 3, rootReady: root.getId() === rootId
    });
    if (action === 'archiveStatus') return json_(archiveStatus_(root, properties, payload));
    const current = findChildFolder_(root, 'Current');
    if (!current) {
      return json_({ok: true, manifest: null, cached: false});
    }
    const cached = readManifestCache_(properties);
    if (cached.hit) return json_({ok: true, manifest: cached.manifest, cached: true});
    const manifest = readManifest_(current);
    writeManifestCache_(properties, manifest);
    return json_({ok: true, manifest: manifest, cached: false});
  } catch (error) { return json_({ok: false, error: String(error.message || error)}); }
}

function secureEquals_(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function warmManifestCache() {
  const properties = PropertiesService.getScriptProperties();
  const rootId = properties.getProperty('ROOT_FOLDER_ID');
  if (!rootId) throw new Error('ROOT_FOLDER_ID absent');
  const current = childFolder_(DriveApp.getFolderById(rootId), 'Current');
  const manifest = readManifest_(current);
  writeManifestCache_(properties, manifest);
  return {ok: true, cached: true, fileCount: manifest ? manifest.fileCount || 0 : 0};
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const properties = PropertiesService.getScriptProperties();
    const expected = properties.getProperty('AUTH_TOKEN');
    if (!expected || payload.token !== expected) throw new Error('Accès refusé');
    if (payload.action === 'ping') return json_({ok: true, service: 'ProjectOS Backup', protocol: 3});
    const rootId = properties.getProperty('ROOT_FOLDER_ID');
    if (!rootId) throw new Error('ROOT_FOLDER_ID absent');
    const root = DriveApp.getFolderById(rootId);
    const current = childFolder_(root, 'Current');
    if (payload.action === 'manifest') return json_({ok: true, manifest: readManifest_(current)});
    if (payload.action === 'syncStatus') return json_(syncStatus_(properties, payload));
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      let result = {};
      if (payload.action === 'archiveBegin') result = archiveBegin_(root, properties, payload);
      else if (payload.action === 'archiveUpload') result = archiveUpload_(root, properties, payload);
      else if (payload.action === 'archiveUploadBatch') result = archiveUploadBatch_(root, properties, payload);
      else if (payload.action === 'archiveFinalize') result = archiveFinalize_(root, properties, payload);
      else if (payload.action === 'beginSync') result = beginSync_(properties, payload);
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

function validateArchiveId_(archiveId) {
  if (typeof archiveId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(archiveId)) {
    throw new Error('Identifiant archive invalide');
  }
}

function archiveFolder_(root, archiveId, create) {
  validateArchiveId_(archiveId);
  const archives = create ? childFolder_(root, 'ConversationArchives') : findChildFolder_(root, 'ConversationArchives');
  if (!archives) return null;
  return create ? childFolder_(archives, archiveId) : findChildFolder_(archives, archiveId);
}

function archiveBegin_(root, properties, payload) {
  validateArchiveId_(payload.archiveId);
  if (!/^[a-f0-9]{64}$/.test(payload.manifestSha256 || '')) throw new Error('Empreinte archive invalide');
  const existingSha = readArchiveManifestSha_(root, payload.archiveId);
  if (existingSha) {
    if (existingSha !== payload.manifestSha256) throw new Error('Archive déjà présente avec un contenu différent');
    return {receivedUploads: nonNegativeInteger_(payload.uploadCount), resumed: true, finalized: true};
  }
  const result = beginSync_(properties, {
    syncId: payload.syncId,
    planDigest: payload.manifestSha256,
    uploadCount: payload.uploadCount,
    deleteCount: 0
  });
  const meta = loadMeta_(properties, payload.syncId);
  if (meta.archiveId && (meta.archiveId !== payload.archiveId || meta.manifestSha256 !== payload.manifestSha256)) {
    throw new Error('Session archive contradictoire');
  }
  meta.archiveId = payload.archiveId;
  meta.manifestSha256 = payload.manifestSha256;
  saveMeta_(properties, meta);
  archiveFolder_(root, payload.archiveId, true);
  return result;
}

function archiveUploadBatch_(root, properties, payload) {
  validateArchiveId_(payload.archiveId);
  const meta = loadMeta_(properties, payload.syncId);
  if (meta.archiveId !== payload.archiveId) throw new Error('Cible archive contradictoire');
  return uploadBatch_(archiveFolder_(root, payload.archiveId, true), properties, payload);
}

function archiveUpload_(root, properties, payload) {
  validateArchiveId_(payload.archiveId);
  const meta = loadMeta_(properties, payload.syncId);
  if (meta.archiveId !== payload.archiveId || meta.status !== 'active') throw new Error('Session archive contradictoire');
  const target = archiveFolder_(root, payload.archiveId, true);
  const key = receiptKey_(payload.syncId, 'U', payload.path);
  const receipt = properties.getProperty(key);
  if (receipt === payload.sha256 || fileHasSha_(target, payload.path, payload.sha256)) {
    if (!receipt) {
      properties.setProperty(key, payload.sha256);
      meta.receivedUploads += 1;
      saveMeta_(properties, meta);
    }
    return {resumed: 1};
  }
  if (receipt) throw new Error('Reçu upload contradictoire: ' + payload.path);
  const bytes = Utilities.base64Decode(payload.contentBase64 || '');
  if (bytes.length > MAX_DECODED_BYTES || sha256_(bytes) !== payload.sha256) throw new Error('Fichier archive invalide');
  resolve_(target, payload.path, false);
  uploadBytes_(target, payload, bytes);
  properties.setProperty(key, payload.sha256);
  meta.receivedUploads += 1;
  saveMeta_(properties, meta);
  return {resumed: 0};
}

function archiveStatus_(root, properties, payload) {
  validateArchiveId_(payload.archiveId);
  if (!/^[a-f0-9]{64}$/.test(payload.manifestSha256 || '')) throw new Error('Empreinte archive invalide');
  const remoteSha = readArchiveManifestSha_(root, payload.archiveId);
  if (remoteSha) {
    if (remoteSha !== payload.manifestSha256) throw new Error('Archive distante contradictoire');
    return {
      ok: true, status: 'finalized', finalized: true,
      manifestSha256: remoteSha, folder: 'ConversationArchives/' + payload.archiveId,
      receivedUploads: (Array.isArray(payload.uploads) ? payload.uploads : []).map(item => item.path)
    };
  }
  const raw = properties.getProperty(metaKey_(payload.syncId));
  if (!raw) return {ok: true, status: 'absent', finalized: false, receivedUploads: []};
  const meta = JSON.parse(raw);
  if (meta.archiveId && meta.archiveId !== payload.archiveId) throw new Error('Session archive contradictoire');
  const uploads = Array.isArray(payload.uploads) ? payload.uploads : [];
  const received = uploads.filter(item =>
    properties.getProperty(receiptKey_(payload.syncId, 'U', item.path)) === item.sha256
  ).map(item => item.path);
  return {ok: true, status: meta.status, finalized: false, receivedUploads: received};
}

function archiveFinalize_(root, properties, payload) {
  validateArchiveId_(payload.archiveId);
  const existingSha = readArchiveManifestSha_(root, payload.archiveId);
  if (existingSha) {
    if (existingSha !== payload.manifestSha256) throw new Error('Archive distante contradictoire');
    return {status: 'complete', finalized: true, manifestSha256: existingSha};
  }
  const meta = loadMeta_(properties, payload.syncId);
  if (meta.archiveId !== payload.archiveId || meta.manifestSha256 !== payload.manifestSha256) {
    throw new Error('Session archive contradictoire');
  }
  if (meta.receivedUploads !== meta.uploadCount) throw new Error('Archive incomplète');
  const uploads = Array.isArray(payload.uploads) ? payload.uploads : [];
  if (uploads.length !== meta.uploadCount) throw new Error('Plan archive incomplet');
  uploads.forEach(item => {
    if (properties.getProperty(receiptKey_(payload.syncId, 'U', item.path)) !== item.sha256) {
      throw new Error('Fichier archive non confirmé: ' + item.path);
    }
  });
  let manifest;
  try { manifest = JSON.parse(payload.manifestText || ''); }
  catch (error) { throw new Error('Manifeste archive invalide'); }
  if (manifest.archiveId !== payload.archiveId || manifest.manifestSha256 !== payload.manifestSha256) {
    throw new Error('Manifeste archive contradictoire');
  }
  const digestPayload = Object.assign({}, manifest);
  delete digestPayload.manifestSha256;
  if (sha256Text_(JSON.stringify(digestPayload)) !== payload.manifestSha256) {
    throw new Error('Empreinte du manifeste archive incorrecte');
  }
  const target = archiveFolder_(root, payload.archiveId, true);
  const temporary = target.createFile('.projectos-archive-manifest-' + Utilities.getUuid(), payload.manifestText, MimeType.PLAIN_TEXT);
  const old = target.getFilesByName('BUFFER_MANIFEST.json');
  while (old.hasNext()) old.next().setTrashed(true);
  temporary.setName('BUFFER_MANIFEST.json');
  temporary.setDescription('projectos-archive-manifest:' + payload.manifestSha256);
  cleanupSession_(properties, payload.syncId, uploads, []);
  return {status: 'complete', finalized: true, manifestSha256: payload.manifestSha256};
}

function readArchiveManifestSha_(root, archiveId) {
  const folder = archiveFolder_(root, archiveId, false);
  if (!folder) return null;
  const files = folder.getFilesByName('BUFFER_MANIFEST.json');
  if (!files.hasNext()) return null;
  const file = files.next();
  const description = file.getDescription() || '';
  const prefix = 'projectos-archive-manifest:';
  if (description.indexOf(prefix) === 0) return description.slice(prefix.length);
  try {
    const manifest = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
    return manifest.manifestSha256 || null;
  } catch (error) { throw new Error('Manifeste archive Drive invalide'); }
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
  writeManifestCache_(properties, payload.manifest);
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

function readManifestCache_(properties) {
  const rawMeta = properties.getProperty(MANIFEST_CACHE_META);
  if (!rawMeta) return {hit: false};
  try {
    const meta = JSON.parse(rawMeta);
    if (!Number.isInteger(meta.chunks) || meta.chunks < 1 || meta.chunks > MANIFEST_CACHE_MAX_CHUNKS) {
      return {hit: false};
    }
    let text = '';
    for (let index = 0; index < meta.chunks; index++) {
      const chunk = properties.getProperty(MANIFEST_CACHE_PREFIX + index);
      if (chunk === null) return {hit: false};
      text += chunk;
    }
    if (text.length !== meta.length || sha256Text_(text) !== meta.sha256) return {hit: false};
    return {hit: true, manifest: JSON.parse(text)};
  } catch (error) { return {hit: false}; }
}

function writeManifestCache_(properties, manifest) {
  const text = JSON.stringify(manifest);
  const chunks = Math.max(1, Math.ceil(text.length / MANIFEST_CACHE_CHUNK));
  if (chunks > MANIFEST_CACHE_MAX_CHUNKS) return;
  const previous = properties.getProperty(MANIFEST_CACHE_META);
  let previousChunks = 0;
  try { previousChunks = Number(JSON.parse(previous || '{}').chunks) || 0; } catch (error) {}
  const values = {};
  for (let index = 0; index < chunks; index++) {
    values[MANIFEST_CACHE_PREFIX + index] = text.slice(
      index * MANIFEST_CACHE_CHUNK, (index + 1) * MANIFEST_CACHE_CHUNK
    );
  }
  properties.setProperties(values, false);
  for (let index = chunks; index < previousChunks; index++) {
    properties.deleteProperty(MANIFEST_CACHE_PREFIX + index);
  }
  properties.setProperty(MANIFEST_CACHE_META, JSON.stringify({
    chunks: chunks,
    length: text.length,
    sha256: sha256Text_(text),
    updatedAt: new Date().toISOString()
  }));
}

function sha256Text_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('');
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

function findChildFolder_(parent, name) {
  const matches = parent.getFoldersByName(name);
  return matches.hasNext() ? matches.next() : null;
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
