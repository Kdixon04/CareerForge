// Explicit target selection: a requested live run must never silently run mocks.
import { spawnSync } from 'node:child_process';
if(process.env.STEVE_LIVE_CONTRACTS==='1'){
  console.error('REAL_ADAPTER_NOT_CONNECTED: live conformance NOT RUN. Supply an approved real harness and isolated fictional A/B environment; mock results are not a substitute.');process.exitCode=1;
}else{
  console.log('Target: TEST DOUBLE / process-memory conformance only');
  const result=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','src/components/ui/student-data/testing/adapter-contract.test.ts','src/components/ui/student-data/testing/http-boundary.test.ts','src/components/ui/student-data/testing/boundary-regression.test.ts','src/components/ui/student-data/testing/checked-adapter.test.ts','src/components/ui/student-data/testing/production-guards.test.ts','src/components/ui/student-data/testing/verified-resolver.test.ts'],{stdio:'inherit'});process.exitCode=result.status??1;
}
