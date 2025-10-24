[< Back](../README.md)
---

## Using the NPM package.

The easiest way to incorporate the components into your application is to use the [NPM package](https://www.npmjs.com/package/@ministryofjustice/hmpps-connect-dps-components).

Instructions can be found in the readme of that project.

If you have bespoke requirements that mean you cannot use the NPM package, you can incorporate the components manually. This guide will show you how to do that. However, please discuss your requirements in the #connect-dps slack channel as it may be something we would look to incorporate into the NPM package.

## Incorporating components manually

This guide assumes that you are importing into an Express application written in TypeScript based on the [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) project.

Code samples have been provided for examples. Your requirements may differ.

### Swagger docs

API swagger docs can be found at
* dev - https://frontend-components-dev.hmpps.service.justice.gov.uk/api-docs
* preprod - https://frontend-components-preprod.hmpps.service.justice.gov.uk/api-docs
* prod - https://frontend-components.hmpps.service.justice.gov.uk/api-docs

### Calling the component library API

Add environment variables to the `values-{env}.yaml` files for `COMPONENT_API_URL`. Populate with the following values:

* dev - https://frontend-components-dev.hmpps.service.justice.gov.uk
* preprod - https://frontend-components-preprod.hmpps.service.justice.gov.uk
* prod - https://frontend-components.hmpps.service.justice.gov.uk

You can also add this to your `.env` file with the `dev` url

Add a block for the component library in the `apis` section of `config.ts`, for example:

```typescript
    frontendComponents: {
      url: get('COMPONENT_API_URL', 'http://localhost:8082', requiredInProduction),
    },
```

Make sure that you also have access to the Digital Prison Services url to enable global search form submission.

Add a Component model, API client and service, and include methods to call the components library. The API call requires the user token to be passed in on the `x-user-token` header.

Components can be requested individually via e.g. `{api}/header` or multiple can be requested at once using e.g. `{api}/components?component=header&component=footer`

Model:
```typescript
interface Component {
  html: string
  css: string[]
  javascript: string[]
}
```
ApiClient method:
```typescript
type AvailableComponent = 'header' | 'footer'
async getComponents<T extends AvailableComponent[]>(
  components: T, userToken: string): Promise<Record<T[number], Component>> {
    return this.restClient.get({
      path: `/components`,
      query: `component=${components.join('&component=')}`,
      headers: { 'x-user-token': userToken },
    })
}
```

The components api will return stringified html along with links to any css and javascript files required for the component.

Add a call for these components for each page that requires them. As the header and footer will likely be used on all pages,
it is recommended to add a middleware function to call the endpoint and make available to the view using `res.locals`.

```typescript
export default function getFrontendComponents({ componentService }: Services): RequestHandler {
  return async (req, res, next) => {
    try {
      const { header, footer } = await componentService.getComponents(['header', 'footer'], res.locals.user.token)

      res.locals.feComponents = {
        header: header.html,
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }
      next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      next()
    }
  }
}
```
Then enable this middleware for all GET routes in your `app.ts` config, just before `app.use(routes(services))` using:

```typescript
app.get('*', getFrontendComponents(services))
```

(If required, you could instead only call the middleware for specific routes)


The following code should be used in the `layout.njk` file within your application.

**Note**: the `header.njk` and `footer.njk` templates used in the following code fragments are fallback HTML in case the component service is unavailable or the API call fails for some reason. These templates should be copied from the `_fallbacks` directory in this repo, and configuration added as described in the Fallbacks section at the end of this document.

```nunjucks
{% block header %}
  {% if feComponents.header %}
    {{ feComponents.header | safe }}
  {% else %}
    {% include "./header.njk" %}
  {% endif %}
{% endblock %}
```
```nunjucks
{% block footer %}
  {% if feComponents.footer %}
    {{ feComponents.footer | safe }}
  {% else %}
    {% include "./footer.njk" %}
  {% endif %}
{% endblock %}
```

The js and css values should be incorporated into the head block of the layout:

```nunjucks
{% if feComponents.jsIncludes %}
    {% for js in feComponents.jsIncludes %}
      <script src="{{ js }}" nonce="{{ cspNonce }}"></script>
    {% endfor %}
{% endif %}
```
```nunjucks
{% if feComponents.cssIncludes %}
  {% for css in feComponents.cssIncludes %}
    <link href="{{ css }}" nonce="{{ cspNonce }}" rel="stylesheet" />
  {% endfor %}
{% endif %}
```

Web security needs to be updated to allow access to the syles and scripts from the components application.

NOTE: you will also need to include the Digital Prison Services url in the formAction list to enable the global search form to be submitted.

```typescript
export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })

  // This nonce allows us to use scripts with the use of the `cspNonce` local, e.g (in a Nunjucks template):
  // <script nonce="{{ cspNonce }}">
  // or
  // <link href="http://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
  // This ensures only scripts we trust are loaded, and not anything injected into the
  // page by an attacker.
  const scriptSrc = ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`]
  const styleSrc = ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`]
  const imgSrc = ["'self'", 'data:']
  const fontSrc = ["'self'"]
  const formAction = [`'self' ${config.apis.hmppsAuth.externalUrl} ${config.digitalPrisonServiceUrl}`]

  if (config.apis.frontendComponents.url) {
    scriptSrc.push(config.apis.frontendComponents.url)
    styleSrc.push(config.apis.frontendComponents.url)
    imgSrc.push(config.apis.frontendComponents.url)
    fontSrc.push(config.apis.frontendComponents.url)
  }

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc,
          styleSrc,
          fontSrc,
          imgSrc,
          formAction
        },
      },
      crossOriginEmbedderPolicy: true,
    }),
  )
  return router
}
```

### Header sign out link

The header sign out link direct to  '{your-application}/sign-out'. This works on the assumption that the application has followed the redirect pattern that the hmpps-template-typescript project has.
See [setUpAuthentication.ts#L34](https://github.com/ministryofjustice/hmpps-template-typescript/blob/main/server/middleware/setUpAuthentication.ts#L34).

**Note**: If your application was copied from the typescript template before August 2021 then it is entirely likely
that your sign out link will be '/logout' instead.  In which case it will have to be changed to '/sign-out'.  See
restricted patients [PR#234](https://github.com/ministryofjustice/hmpps-restricted-patients/pull/234) for an example PR.
If you decide to change '/login' to '/sign-in' at the same time
([PR#235](https://github.com/ministryofjustice/hmpps-restricted-patients/pull/235)) then your client in HMPPS Auth will
also need to be changed to include the new callback url.

### Fallbacks (services with prison only users)

Appropriate fallback components should be included within your application. For the header and footer, templates are provided in the `_fallbacks` directory of this repo to copy and paste into your application, along with `scss` stylesheets.

Place the `header.njk` and `footer.njk` files into your `/server/views/partials` directory, overwriting the existing `header.njk` file if applicable.

Place the `_header-bar.scss` and `_footer.scss` files into your `/assets/scss/components` directory, overwriting the existing `_header-bar.scss` file if applicable, and update your `/assets/scss/application.scss` file to include these stylesheets, i.e.

```scss
@import './components/header-bar';
@import './components/footer';
```

The fallback header includes a link to the DPS homepage which uses a config property created from an environment variable
to ensure it works for each deployed environment (dev, pre-production and production):

```html
<a class="hmpps-header__link hmpps-header__link--no-underline hmpps-header__title__service-name" href="{{ config.apis.digitalPrisonServiceUrl }}">
```

You will need to use your own existing config property and environment variable that points to
the DPS homepage (e.g. for Production, `https://digital.prison.service.justice.gov.uk`)
or create new ones for this purpose.

The header component and fallback header include an environment 'badge' to display the name of the deployed environment
(e.g. DEV, PRE-PRODUCTION). In order to support this in the fallback header, copy the `setUpEnvironmentName.ts.txt` file
from the `_fallbacks` directory into your `/server/middleware` directory, removing the `.txt` extension, and add the
following line to your `/server/app.ts`, immediately before the `nunjucksSetup` line:

```typescript
  setUpEnvironmentName(app)
```

Then add an environment variable to the `values-{env}.yaml` files for `ENVIRONMENT_NAME` and populate with the following values:

* dev - DEV
* preprod - PRE-PRODUCTION

And include this in your `/server/config.ts` as:

```typescript
  environmentName: get('ENVIRONMENT_NAME', '')
```

You can also add the `ENVIRONMENT_NAME` variable to your `.env` file to show the badge when running locally.

An example of using these components, including the fallbacks, can be found in https://github.com/ministryofjustice/hmpps-digital-prison-services


### Fallbacks (services with prison and external users)

If your service has external, non-prison users, the header and footer supplied by the component service will be different for each group of users.

Appropriate fallback components should also be included within the application for these different groups of users.

For the header and footer, templates are provided in the `_fallbacks/external-users` directory of this repo to copy and paste into your application, along with `scss` stylesheets from the parent `_fallbacks` directory.

Place all of the `.njk` files from `_fallbacks/external-users` into your `/server/views/partials` directory, overwriting the existing `header.njk` file if applicable. (Do not copy the `.njk` files from the parent `_fallbacks` directory)

Place the `_header-bar.scss` and `_footer.scss` files into your `/assets/scss/components` directory, overwriting the existing `_header-bar.scss` file if applicable, and update your `/assets/scss/application.scss` file to include these stylesheets, i.e.

```scss
@import './components/header-bar';
@import './components/footer';
```

The fallback header for prison services (`dpsHeader.njk`) includes a link to the DPS homepage, and the fallback header
for external services (`externalHeader.njk`) includes a link to the HMPPS Auth homepage.

These links use config properties created from environment variables to ensure it works for each deployed environment (dev, pre-production and production).

For `dpsHeader.njk` it is:

```html
<a class="hmpps-header__link hmpps-header__link--no-underline hmpps-header__title__service-name" href="{{ config.apis.digitalPrisonServiceUrl }}">
```

For `externalHeader.njk` there are 2:

```html
<a class="hmpps-header__link hmpps-header__title__organisation-name" href="{{ config.apis.hmppsAuth.url }}">
```

```html
<a class="hmpps-header__link hmpps-header__title__service-name" href="{{ config.apis.hmppsAuth.url }}">Digital Services</a>
```

You will need to use your own existing config properties and environment variables that point to
the DPS homepage (e.g. for Production, `https://digital.prison.service.justice.gov.uk`) and
the HMPPS Auth homepage (e.g. for Production, `https://sign-in.hmpps.service.justice.gov.uk/auth`)
or create new ones for this purpose.

The header component and fallback headers include an environment 'badge' to display the name of the deployed environment
(e.g. DEV, PRE-PRODUCTION). In order to support this in the fallback header, copy the `setUpEnvironmentName.ts.txt` file
from the `_fallbacks` directory into your `/server/middleware` directory, removing the `.txt` extension, and add the
following line to your `/server/app.ts`, immediately before the `nunjucksSetup` line:

```typescript
  setUpEnvironmentName(app)
```

Within the `/helm_deploy/values-{env}.yaml` deployment configuration files,

Add an environment variable for `ENVIRONMENT_NAME` and populate with the following values:

* dev - DEV
* preprod - PRE-PRODUCTION

And an environment variable for `SUPPORT_URL` and populate with the following values:

* dev - https://support-dev.hmpps.service.justice.gov.uk/feedback-and-support
* preprod - https://support-preprod.hmpps.service.justice.gov.uk/feedback-and-support
* prod - https://support.hmpps.service.justice.gov.uk/feedback-and-support

Then include these in your `/server/config.ts` as:

```typescript
  environmentName: get('ENVIRONMENT_NAME', '')
  supportUrl: get('SUPPORT_URL', 'http://localhost:3001', requiredInProduction)
```

You can also add these variables to your `.env` file for running locally.

Finally, add the following to your `/server/middleware/populateCurrentUser.ts` file immediately after the <br>`res.locals.user = { ...user, ...res.locals.user }` line:

```typescript
  res.locals.isPrisonUser = res.locals.user.authSource === 'nomis'
```

This will populate the `isPrisonUser` flag which is used to render the correct header and footer.

### Breadcrumbs

As well as the header and footer, breadcrumbs in your service also need to be changed based on whether the user is a prison or non-prison user.

The same `isPrisonUser` flag can be used to set the right breadcrumb label.

For prison users, the "root" breadcrumb label should be `Digital Prison Services`

For non-prison users, the "root" breadcrumb label should be `HMPPS Digital Services`
