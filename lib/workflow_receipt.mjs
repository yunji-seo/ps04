import crypto from 'node:crypto';
import {writeJson,now} from './common.mjs';
const [runDir,stage,started,statusCode,message='']=process.argv.slice(2);
const code=Number(statusCode);
writeJson(`${runDir}/logs/${stage.replaceAll('/','-')}-${Date.now()}-${crypto.randomUUID()}.json`,{
 stage,status:code===0?'completed':'failed',started_at:started,finished_at:now(),exit_code:code,
 input_count:null,output_count:null,tools:['bash'],models:[],cost_usd:0,cost_is_estimate:false,
 errors:message?[message]:[]
});
