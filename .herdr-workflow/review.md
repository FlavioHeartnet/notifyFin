APPROVED_FOR_PR: yes

## must-fix

None.

## should-fix

- Consider constraining JWT verification/signing to the intended algorithm (e.g. `HS256`) with `algorithms: ['HS256']` for defense-in-depth.
- Consider clearing the temporary OAuth `state` cookie even when callback validation fails, so stale state cookies are not kept until expiry.
- `npm audit --omit=dev` reports production vulnerabilities through `@nestjs/platform-express`/`multer` and `qs`. They do not appear specific to the auth implementation, but should be tracked/upgraded when compatible fixes are available.

## nits

- The checkout currently reports branch `master`, while the workflow says `agent/google-auth-login`; verify the PR branch before publishing.
- Some callback/controller behavior is only covered indirectly through `AuthService`; a future controller/e2e test with a mocked Google provider would increase confidence.

## security

- No real Google credentials or application secrets found in the diff; examples/tests use placeholders or dummy values.
- OAuth state uses random bytes and an HttpOnly SameSite cookie; session cookie is HttpOnly, SameSite=Lax, TTL-bound, and `Secure` is env-controlled.
- Error messages for missing config/auth failures are generic and do not expose env names, secrets, or tokens.

## tests

Reviewer ran:

- `cd api && npm test -- --runInBand` ✅
- `cd api && npm run test:e2e -- --runInBand` ✅
- `cd api && npm run build` ✅
- `cd api && npm audit --omit=dev --json` ⚠️ reports the vulnerabilities noted above.

## approval

Approved for PR. The implementation satisfies the stated acceptance criteria with no blocking issues found.
