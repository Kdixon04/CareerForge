import { test,expect } from 'vitest';import { validateProfileDraft } from './profile-model';
test('UI fact bounds match the prepared adapter and existing server limit',()=>{
  const fact={id:'88888888-8888-4888-8888-888888888888',kind:'skill' as const,text:'x'.repeat(2000),org:null,dates:null};
  expect(validateProfileDraft({displayName:'Fictional',field:null,facts:[fact]}).success).toBe(true);
  const result=validateProfileDraft({displayName:'Fictional',field:null,facts:[{...fact,text:'x'.repeat(2001)}]});expect(result.success).toBe(false);if(!result.success)expect(result.errors['facts.0.text']).toContain('2,000');
});
