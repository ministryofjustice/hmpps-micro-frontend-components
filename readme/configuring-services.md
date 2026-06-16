[← Back](../README.md)
---

## Configuring services

The list of DPS services available to users is configured in this repository.
Amongst other places, these are shown within the DPS home page, header and footer.
Other services can use the metadata responses from this api/middleware to determine what the current user can access.

Access to services is often controlled by user roles, case loads and the prisons where the service has been rolled out.

To add a DPS service:

1) Agree with the Connect DPS team the name of the service and description that will be used throughout DPS.

2) Configure the user-facing URLs for `dev`, `preprod` and `prod` environments
   in `helm_deploy/values-[environment].yaml` files,
   for example `YOUR_SERVICE_URL=https://your-service-dev.hmpps.service.justice.gov.uk`.
   Enter a dummy value in `feature.env`.

3) Map this environment variable for access in code by adding service URL configuration in `server/config.ts`,
   under `serviceUrls`.

4) Add the service definition to `server/services/utils/getServicesForUser.ts`,
   including the heading (used throughout) and description (shows on the home page).
   The `enabledForCurrentUser` function is used to determine whether the current user can access this service.
   1) If your service has role requirements, add them to the Role enumeration in `server/services/utils/roles.ts`
      (excluding “ROLE_” prefix). Use the `userHasRoles` helper function in the `enabledForCurrentUser` property
      to check for them.
   2) If your service is not available in all prisons/establishments/agencies,
      use the `isActiveInEstablishment` helper function in the `enabledForCurrentUser` property
      to check the active case load and follow step 5.
   3) For complex logic, it’s worth adding tests to `server/services/utils/getServicesForUser.test.ts`.

5) Skip this step if your service is available in all prisons. Otherwise:
   1) Expose a `activeAgencies` property on the /info JSON endpoint in your service.
      This must be a list of prison IDs where the service is available.
      Once rolled out everywhere, the value should be `["***"]`.
   2) Add the service to the ServiceName enunmeration in `server/@types/activeAgencies.ts`.
   3) Register your /info endpoint in `scripts/getReleaseStatus.js`.
      It’ll be loaded periodically in all environments and cached for ~1 hour.

A relatively complete example can be found in [hmpps-micro-frontend-components#544](https://github.com/ministryofjustice/hmpps-micro-frontend-components/pull/544),
though it includes changes that are no longer necessary.
