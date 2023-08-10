[< Back](../README.md)
---

## Incorporating components

This guide assumes that you are importing into an Express application written TypeScript based on the [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) template project.

Code samples have been provided for examples. Your requirements may differ.

### Calling the component library API

Add environment variables to the `values-{env}.yaml` files for `COMPONENT_API_URL`. Populate with the following values:

* dev - https://hmpps-micro-frontend-components-dev.hmpps.service.justice.gov.uk

add a block for the component library in the apis section of config.ts.

Add a Component Client and Service and include methods to call the components library. This call requires the user token to be passed in on the `x-user-token` header.

```typescript
interface Component {
  html: string
  css?: string[]
  javascript?: string[]
}
```
```typescript
async getComponent(component: 'header' | 'footer', userToken: string): Promise<Component> {
    return this.restClient.get<Component>({
      path: `/${component}`,
      headers: { 'x-user-token': userToken },
    })
}
```

The components api will return stringified html along with links to any css and javascript filed required for the component.

Add a call for these components for each page that requires them. As the header and footer will likely be used on all pages, it is recommended to add a middleware function to call the endpoints and make available to the view using res.locals.

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
These values should be used in the layout.njk file with a basic fallback header kept within the application

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
  {% if footer %}
    {{ footer | safe }}
  {% else %}
    {{ govukFooter({}) }}
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

  if (config.apis.component.url) {
    scriptSrc.push(config.apis.component.url)
    styleSrc.push(config.apis.component.url)
    imgSrc.push(config.apis.component.url)
  }

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc,
          styleSrc,
          fontSrc: ["'self'"],
          imgSrc,
        },
      },
      crossOriginEmbedderPolicy: true,
    }),
  )
  return router
}
```