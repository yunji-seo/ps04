import {spawnSync} from 'node:child_process';
export function command(executable,args,options={}) {
  const result=spawnSync(executable,args,{encoding:'utf8',timeout:options.timeout||120000,maxBuffer:30000000,windowsHide:true,...options});
  if(result.error)throw new Error(`${executable}: ${result.error.code||'execution failed'}`);
  if(result.status!==0)throw new Error(`${executable} failed (${result.status}): ${(result.stderr||'').slice(-1200)}`);
  return result.stdout;
}
export function storeGet(id,version) {
  const args=['data/store.sh','get',id];if(version)args.push(version);
  return JSON.parse(command(process.env.BASH_EXE||'bash',args));
}
