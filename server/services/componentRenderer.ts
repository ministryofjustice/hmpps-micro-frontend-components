import type { Response } from 'express'
import config from '../config'
import type Component from '../@types/Component'
import { type ViewModel } from '../controllers/componentsController'
import { assetMap } from '../utils/utils'

export class ComponentRenderer {
  constructor(private readonly res: Response) {}

  renderComponent(viewModel: ViewModel): Promise<Component> {
    if (viewModel.component === 'header' && config.features.useNewDpsHeader) {
      // eslint-disable-next-line no-param-reassign
      viewModel.component = 'header2'
    }

    return new Promise((resolve, reject) => {
      this.res.render(`components/${viewModel.component}.njk`, viewModel, (error, html) =>
        error
          ? reject(error)
          : resolve({
              html: html.trim(),
              css: [`${config.ingressUrl}${assetMap(`/assets/css/${viewModel.component}.css`)}`],
              javascript: viewModel.hasJavascript
                ? [`${config.ingressUrl}${assetMap(`/assets/js/${viewModel.component}.js`)}`]
                : [],
            }),
      )
    })
  }
}

export default { ComponentRenderer }
