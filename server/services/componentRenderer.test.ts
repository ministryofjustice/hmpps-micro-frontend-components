import type { Response } from 'express'
import type { FooterViewModel } from '../controllers/componentsController'
import { ComponentRenderer } from './componentRenderer'

describe('Component render', () => {
  let res: jest.Mocked<Response>

  beforeEach(() => {
    res = { render: jest.fn() } as unknown as jest.Mocked<Response>
  })

  it.each([
    { scenario: 'a component with javascript', hasJavascript: true },
    { scenario: 'a component without javascript', hasJavascript: false },
  ])('should render $scenario', async ({ hasJavascript }) => {
    const viewModel: FooterViewModel = {
      component: 'footer',
      hasJavascript,
      isPrisonUser: false,
      managedPages: [],
    }

    res.render.mockImplementation(
      (view: string, options?: object, callback?: (error: Error | undefined, html?: string) => void) => {
        expect(view).toEqual('components/footer.njk')
        expect(options).toEqual(viewModel)
        callback(undefined, '<footer></footer>\n')
      },
    )

    const renderer = new ComponentRenderer(res)
    const component = await renderer.renderComponent(viewModel)
    expect(component.html).toEqual('<footer></footer>')
    expect(component.css).toEqual(['http://localhost:3000/assets/css/footer.css'])
    expect(component.javascript).toEqual(hasJavascript ? ['http://localhost:3000/assets/js/footer.js'] : [])
  })

  it('should throw an error if there is a problem with the template', async () => {
    const viewModel: FooterViewModel = {
      component: 'footer',
      hasJavascript: false,
      isPrisonUser: false,
      managedPages: [],
    }

    res.render.mockImplementation(
      (_view: string, _options?: object, callback?: (error: Error | undefined, html?: string) => void) => {
        callback(new Error('nunjucks error'))
      },
    )

    const renderer = new ComponentRenderer(res)
    await expect(() => renderer.renderComponent(viewModel)).rejects.toBeInstanceOf(Error)
  })
})
