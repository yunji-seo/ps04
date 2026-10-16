import {InputError,requiredRun,stage,emit} from '../lib/common.mjs';
import {assess} from './assessment.mjs';
const [runDir,...extra]=process.argv.slice(2);
await stage('review/check_content',runDir||'runs/invalid-invocations',async receipt=>{
 if(extra.length)throw new InputError('Usage: check_content.sh RUN_DIR');
 requiredRun(runDir);const result=assess(runDir);emit(result);receipt.output_count=1;receipt.assessment_passed=result.passed;
});
