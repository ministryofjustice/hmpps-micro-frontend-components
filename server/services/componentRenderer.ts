import type { Response } from 'express'
import config from '../config'
import type { Component } from '../interfaces/externalContract'
import type { ViewModel } from '../controllers/componentsController'
import { assetMap } from '../utils/utils'

export class ComponentRenderer {
  constructor(private readonly res: Response) {}

  renderComponent(viewModel: ViewModel): Promise<Component> {
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
