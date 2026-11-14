import { preparedAdapter, SaveApplicationSchema, ApplicationPatchSchema } from '../../../components/ui/student-data/adapter-contract';
import { adapterResponse, inputJson, type ResolveAdapter } from '../../../components/ui/student-data/http-boundary';
export function createApplicationHandlers(resolve: ResolveAdapter = async () => preparedAdapter()) {
  return {
    GET: (request: Request) => adapterResponse(request, resolve, adapter => adapter.listApplications(), 'GET'),
    POST: (request: Request) => adapterResponse(request, resolve,
      async adapter => adapter.saveApplication(await inputJson(request, SaveApplicationSchema)), 'POST'),
    PATCH: (request: Request, id: string) => adapterResponse(request, resolve,
      async adapter => adapter.patchApplication(id, await inputJson(request, ApplicationPatchSchema)), 'PATCH'),
    DELETE: (request: Request, id: string) => adapterResponse(request, resolve,
      adapter => adapter.removeApplication(id), 'DELETE'),
  };
}
