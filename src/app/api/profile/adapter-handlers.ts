import { preparedAdapter } from '../../../components/ui/student-data/adapter-contract';
import { adapterResponse, inputJson, type ResolveAdapter } from '../../../components/ui/student-data/http-boundary';
import { ProfileWriteSchema } from '../../../components/ui/student-data/adapter-contract';
// Prepared modules only. Production resolution must verify Auth and student role.
export function createProfileHandlers(resolve: ResolveAdapter = async () => preparedAdapter()) {
  return {
    GET: (request: Request) => adapterResponse(request, resolve, adapter => adapter.getProfile(), 'GET'),
    PUT: (request: Request) => adapterResponse(request, resolve,
      async adapter => adapter.putProfile(await inputJson(request, ProfileWriteSchema)), 'PUT'),
  };
}
