[← Back](../README.md)
---

## Using the NPM package

The encouraged and easiest way to incorporate the components into your application is to use the [NPM package](https://www.npmjs.com/package/@ministryofjustice/hmpps-connect-dps-components).

Instructions can be found in the readme of that project.

If you have bespoke requirements that mean you cannot use the NPM package, you can incorporate the components manually.
This guide will show you how to do that.
However, please discuss your requirements in the #connect-dps slack channel as it may be something we would look to incorporate into the NPM package.

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
  url: get('COMPONENT_API_URL', 'http://localhost:8082', requiredInProduction)
}
```

Make sure that you also have access to the Digital Prison Services url to enable global search form submission.

Add a Component model, API client and service, and include methods to call the components library.
The API call requires the user token to be passed in on the `x-user-token` header.

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
app.get('*allPaths', getFrontendComponents(services))
```

(If required, you could instead only call the middleware for specific routes)


The following code should be used in the `layout.njk` file within your application.

**Note**: the `partials/header-bar.njk` and `partials/footer.njk` templates used in the following code fragments are fallback templates
in case the component service is unavailable or the API call fails for some reason. See [fallbacks section](#fallbacks) below.

```nunjucks
{% block govukHeader %}
  {% if feComponents.header %}
    {{ feComponents.header | safe }}
  {% else %}
    {% include "partials/header-bar.njk" %}
  {% endif %}
{% endblock %}
```
```nunjucks
{% block govukFooter %}
  {% if feComponents.footer %}
    {{ feComponents.footer | safe }}
  {% else %}
    {% include "partials/footer.njk" %}
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

The content security policy needs to be updated to allow access to the syles and scripts from the components application.

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
  // <link href="https://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
  // This ensures only scripts we trust are loaded, and not anything injected into the
  // page by an attacker.
  const scriptSrc = ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`]
  const styleSrc = ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`]
  const imgSrc = ["'self'", 'data:']
  const fontSrc = ["'self'"]
  const formAction = ["'self'", config.apis.hmppsAuth.externalUrl, config.digitalPrisonServiceUrl]

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

The header sign out link direct to  '{your-application}/sign-out'.
This works on the assumption that the application has followed the redirect pattern that the hmpps-template-typescript project has.
See [setUpAuthentication.ts#L34](https://github.com/ministryofjustice/hmpps-template-typescript/blob/main/server/middleware/setUpAuthentication.ts#L34).

### Fallbacks

Appropriate fallback components should be included within your application if the components service is inaccessible.

Users based in prisons and external or non-prison users should see different headers and footers.

HTML templates and styles can be adapted from fallback components in the NPM package referenced above.
See the `/src/assets` folder in the [components library repository](https://github.com/ministryofjustice/hmpps-connect-dps-components).

**Note**: the components library may have been updated since these instructions were written, so test carefully.

Copy the sass style sheets into a subfolder of `/assets/scss` and `@use` them from your root style sheets.
They rely on the GOV.UK frontend styles being accessible.

Copy the nunjucks templates from `/src/assets/dpsComponents` into `/server/views/partials`.

These templates currently need the following context variables which can be provided in
`res.locals`, `app.locals` or nunjucks globals.

| Variable        | Purpose                                                                                                             | Sample                                            |
|-----------------|---------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| environmentName | Indicates to users the current environment `DEV`, `PRE-PRODUCTION` or `PRODUCTION` (blank is treated as production) | PRODUCTION                                        |
| user            | The user details object as provided by HMPPS Auth                                                                   | {authSource, username, displayName, etc}          |
| isPrisonUser    | Whether user is a prison/NOMIS user and should see the DPS header (`user.authSource === 'nomis'`)                   | `true`                                            |
| name            | The user’s name with initialised first name                                                                         | J. Smith                                          |
| authUrl         | URL of HMPPS Auth                                                                                                   | https://sign-in.hmpps.service.justice.gov.uk/auth |
| dpsUrl          | URL of DPS home page                                                                                                | https://dps.prison.service.justice.gov.uk         |
| supportUrl      | URL to feedback and support seen by external and non-prison users only                                              |                                                   |

### Breadcrumbs

As well as the header and footer, breadcrumbs in your service also need to be changed based on whether the user is a prison or non-prison user.

The `user.authSource === 'nomis'` check (for prison users) can be used to set the right breadcrumb label.

For prison users, the first breadcrumb label should be `Digital Prison Services`
For external and non-prison users, the first breadcrumb label should be `HMPPS Digital Services`
