import { InputError, requiredRun, stdinLines, emit, stage, writeLines, validTimestamp, validateItem } from '../lib/common.mjs';

const [runDir, ...extra] = process.argv.slice(2);
await stage('processing/filter_items', runDir || 'runs/invalid-invocations', async receipt => {
  if (extra.length) throw new InputError('Usage: filter_items.sh RUN_DIR');
  const meta = requiredRun(runDir);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.as_of_date) || !validTimestamp(meta.as_of_date + 'T00:00:00Z')) throw new InputError('Invalid as_of_date');
  const end = Date.parse(meta.as_of_date + 'T00:00:00Z');
  const start = end - 29 * 86400000;
  const rows = stdinLines();
  rows.forEach(validateItem);
  receipt.input_count = rows.length;
  const eligible = [], excluded = [];
  for (const row of rows) {
    let reason;
    if (row.published_at === null) reason = 'unknown_date';
    else if (!validTimestamp(row.published_at)) reason = 'invalid_date';
    else {
      const day = Date.parse(new Date(row.published_at).toISOString().slice(0,10) + 'T00:00:00Z');
      if (day < start) reason = 'outside_window';
      else if (day > end) reason = 'future_date';
    }
    if (reason) excluded.push({item_id:row.item_id, version_id:row.version_id, reason,
      detail:`Publication date ${JSON.stringify(row.published_at)}; inclusive UTC window ${new Date(start).toISOString().slice(0,10)} through ${meta.as_of_date}`});
    else eligible.push(row);
  }
  writeLines(`${runDir}/exclusions.jsonl`, excluded);
  eligible.forEach(emit);
  receipt.output_count = eligible.length;
  receipt.excluded_count = excluded.length;
});
