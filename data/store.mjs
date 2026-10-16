import fs from 'node:fs';
import { InputError, safePath, readJson, writeJson, stdinLines, validateItem, emit, stage, now, requiredRun } from '../lib/common.mjs';

// This component alone owns the persistent evidence index and its lock.
const [command, ...args] = process.argv.slice(2);
const runDir = command === 'upsert' ? args[0] : process.env.PIPELINE_RUN_DIR || 'runs/store-operations';
const indexPath = 'data/evidence/index.json';
await stage('data/store/' + (command || 'invalid'), runDir || 'runs/store-operations', async receipt => {
  const expected = {init:[0], upsert:[1], list:[0], get:[1,2]};
  if (!expected[command]?.includes(args.length)) throw new InputError('Usage: store.sh init | upsert RUN_DIR | list | get ITEM_ID [VERSION_ID]');
  if (command === 'upsert') requiredRun(runDir);
  let lock;
  try {
    if (['init','upsert'].includes(command)) {
      fs.mkdirSync(safePath('data/evidence'), {recursive:true});
      try { lock = fs.openSync(safePath('data/evidence/write.lock'), 'wx'); }
      catch { throw new Error('Evidence store is locked; another writer may be active'); }
    }
    if (command === 'init') {
      if (!fs.existsSync(safePath(indexPath))) writeJson(indexPath, {schema_version:1, items:{}});
      else if (readJson(indexPath).schema_version !== 1) throw new InputError('Unsupported store schema');
      return;
    }
    const store = readJson(indexPath);
    if (store.schema_version !== 1 || !store.items) throw new InputError('Invalid evidence index');
    if (command === 'upsert') {
      const rows = stdinLines();
      receipt.input_count = rows.length;
      // Validate the complete stream before changing the persistent index.
      rows.forEach(validateItem);
      const changes = [];
      for (const row of rows) {
        const id = row.item_id;
        const version = row.version_id;
        let entry = Object.hasOwn(store.items, id) ? store.items[id] : null;
        let change;
        if (!entry) {
          entry = {latest:version, versions:{}, first_seen_at:now()};
          Object.defineProperty(store.items,id,{value:entry,enumerable:true,writable:true,configurable:true});
          change = 'new';
        } else change = Object.hasOwn(entry.versions, version) ? 'unchanged' : 'changed';
        if (change !== 'unchanged') {
          Object.defineProperty(entry.versions,version,{value:{record:row, runs:[runDir], first_seen_at:now()},enumerable:true,writable:true,configurable:true});
          entry.latest = version;
        } else {
          const known = entry.versions[version];
          if (!known.runs.includes(runDir)) known.runs.push(runDir);
        }
        entry.last_seen_at = row.retrieved_at;
        changes.push({item_id:id,version_id:version,change});
      }
      writeJson(indexPath, store);
      changes.forEach(emit);
      receipt.output_count = changes.length;
    } else if (command === 'list') {
      const rows = Object.values(store.items).map(x => x.versions[x.latest].record).sort((a,b) => a.item_id.localeCompare(b.item_id));
      rows.forEach(emit); receipt.output_count = rows.length;
    } else {
      const entry = Object.hasOwn(store.items,args[0]) ? store.items[args[0]] : null;
      const version = args[1] || entry?.latest;
      if (!entry || !Object.hasOwn(entry.versions,version)) { receipt.outcome='not_found'; throw new Error('Requested item or version not found'); }
      emit(entry.versions[version].record); receipt.output_count = 1;
    }
  } finally {
    if (lock !== undefined) { fs.closeSync(lock); fs.unlinkSync(safePath('data/evidence/write.lock')); }
  }
});
