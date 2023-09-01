[< Back](../README.md)
---

## Incorporating components

This guide assumes that you are importing into an Express application written TypeScript based on the [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) template project.

Code samples have been provided for examples. Your requirements may differ.

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

Add a Component model, API client and service, and include methods to call the components library. The API call requires the user token to be passed in on the `x-user-token` header.

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
async getComponent(component: 'header' | 'footer', userToken: string): Promise<Component> {
    return this.restClient.get<Component>({
      path: `/${component}`,
      headers: { 'x-user-token': userToken },
    })
}
```

The components api will return stringified html along with links to any css and javascript files required for the component.

Add a call for these components for each page that requires them. As the header and footer will likely be used on all pages, 
it is recommended to add a middleware function to call the endpoints and make available to the view using `res.locals`.

```typescript
export default function getFrontendComponents({ componentService }: Services): RequestHandler {
  return async (req, res, next) => {
    try {
      const [header, footer] = await Promise.all([
        componentService.getComponent('header', res.locals.user.token),
        componentService.getComponent('footer', res.locals.user.token),
      ])
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

```typescript
{% block header %}
  {% if feComponents.header %}
    {{ feComponents.header | safe }}
  {% else %}
    {% include "./header.njk" %}
  {% endif %}
{% endblock %}
```
```typescript
{% block footer %}
  {% if feComponents.footer %}
    {{ feComponents.footer | safe }}
  {% else %}
    {% include "./footer.njk" %}
  {% endif %}
{% endblock %}
```

The js and css values should be incorporated into the head block of the layout:

```typescript
{% if feComponents.jsInclude %}
    {% for js in feComponents.jsIncludes %}
      <script src="{{ js }}" nonce="{{ cspNonce }}"></script>
    {% endfor %}
{% endif %}
```
```typescript
{% if feComponents.cssIncludes %}
  {% for css in feComponents.cssIncludes %}
    <link href="{{ css }}" nonce="{{ cspNonce }}" rel="stylesheet" />
  {% endfor %}
{% endif %}
```

Web security needs to be updated to allow access to the syles and scripts from the components application.

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
See: https://github.com/ministryofjustice/hmpps-template-typescript/blob/main/server/middleware/setUpAuthentication.ts#L34

### Fallbacks (services with prison only users)

Appropriate fallback components should be included within your application. For the header and footer, templates are provided in the `_fallbacks` directory of this repo to copy and paste into your application, along with `scss` stylesheets.

Place the `header.njk` and `footer.njk` files into your `/server/views/partials` directory, overwriting the existing `header.njk` file if applicable.

Place the `_header-bar.scss` and `_footer.scss` files into your `/assets/scss/components` directory, overwriting the existing `_header-bar.scss` file if applicable, and update your `/assets/scss/application.scss` file to include these stylesheets, i.e.

```scss
@import './components/header-bar';
@import './components/footer';
```

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

The header component and fallback header include an environment 'badge' to display the name of the deployed environment
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

