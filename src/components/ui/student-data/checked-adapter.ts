import { z } from 'zod';
import {
  AdapterError, ApplicationPatchSchema, ProfileWriteSchema, SaveApplicationSchema,
  assertAdapterShape, ownApplication, ownProfile, type StudentDataAdapter,
} from './adapter-contract';

const uuid = z.string().uuid();
function input<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AdapterError('INVALID_INPUT');
  return result.data;
}

// Consumer validation only: this cannot establish Auth, roles, RLS or atomicity.
// Keyan's bridge still derives identity from a verified ordinary session.
export function checkedAdapter(source: StudentDataAdapter): StudentDataAdapter {
  try { assertAdapterShape(source); } catch { throw new AdapterError('INVALID_DATA'); }
  const subjectId = source.subjectId;
  function identity() {
    if (source.subjectId !== subjectId) throw new AdapterError('INVALID_DATA');
  }
  const adapter: StudentDataAdapter = {
    kind: source.kind, subjectId,
    async getProfile() {
      identity();
      return ownProfile(adapter, await source.getProfile());
    },
    async putProfile(value) {
      identity();
      return ownProfile(adapter, await source.putProfile(input(ProfileWriteSchema, value)));
    },
    async listApplications() {
      identity();
      const values = await source.listApplications();
      if (!Array.isArray(values)) throw new AdapterError('INVALID_DATA');
      const result = values.map(value => ownApplication(adapter, value));
      if (new Set(result.map(value => value.id)).size !== result.length ||
          new Set(result.map(value => value.jobId)).size !== result.length) {
        throw new AdapterError('INVALID_DATA');
      }
      return result;
    },
    async saveApplication(value) {
      identity();
      const parsed = input(SaveApplicationSchema, value);
      const result = ownApplication(adapter, await source.saveApplication(parsed));
      if (result.jobId !== parsed.jobId) throw new AdapterError('INVALID_DATA');
      return result;
    },
    async patchApplication(id, value) {
      identity();
      const expected = input(uuid, id);
      const result = ownApplication(adapter, await source.patchApplication(expected, input(ApplicationPatchSchema, value)));
      if (result.id !== expected) throw new AdapterError('INVALID_DATA');
      return result;
    },
    async removeApplication(id) {
      identity();
      const expected = input(uuid, id);
      const result = await source.removeApplication(expected);
      if (!result || result.id !== expected || Object.keys(result).length !== 1) throw new AdapterError('INVALID_DATA');
      return { id: expected };
    },
  };
  return Object.freeze(adapter);
}
