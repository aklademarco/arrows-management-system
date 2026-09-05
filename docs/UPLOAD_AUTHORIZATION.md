# Image upload authorization

Flyer and preacher-image Server Actions verify access with the API before
signing or sending an upload to Cloudinary. A browser cookie alone does not
authorize an upload.

- Flyers use `GET /api/v1/ministry-content` and require explicit
  `canSubmitFlyer: true` plus an existing Media department. The Publicity
  leadership lookup excludes deactivated departments.
- Preacher images use `GET /api/v1/events/:eventId`, which requires an active
  administrator account and an event in that administrator's church.
- Requests use the same bearer token for authorization and final submission,
  with `cache: no-store`. Failed or malformed authorization responses stop
  the action before Cloudinary is contacted.
- The final API mutations still check permissions. Generating a liturgy
  without an image continues to use the protected generation endpoint directly.
- Member profile photos already verify the current profile with the API before
  uploading.

## Automated checks

Run `pnpm --filter web test --runInBand` for the Server Action regression tests.
API and Cloudinary responses are mocked; the tests make no real uploads. They
cover missing cookies, denied sessions/permissions, inaccessible events, API
errors, invalid responses, and authorization before a successful upload.

## Manual verification on a test environment

1. Send a flyer as an authorized Publicity leader with an active Media
   department. Confirm the flyer reaches the Media Hub.
2. Revoke the leadership assignment or deactivate the Publicity department
   while the form is open, then submit. Confirm submission is denied and no
   Cloudinary asset is created.
3. Upload a preacher image for an event as an administrator. Confirm the
   liturgy is generated with the image.
4. Remove the administrator role or suspend the account while the form is
   open, then submit. Confirm no Cloudinary asset is created.
5. Test an expired session, an inaccessible event, and an unavailable API.
   Each must stop the upload. Confirm generation without an image still works
   for an authorized administrator.

API authorization and Cloudinary storage are separate operations. Permissions
can change after the initial check; final API authorization continues to reject
the mutation in that case. Cleanup of an asset after a later submission failure
is outside this change.
