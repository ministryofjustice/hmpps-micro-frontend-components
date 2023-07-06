import { NextFunction, Request, Response } from 'express'

export const AVAILABLE_COMPONENTS = ['header', 'footer']
export default (req: Request, res: Response, next: NextFunction): void => {
  const { component } = req.params
  if (!component || !AVAILABLE_COMPONENTS.includes(component)) {
    res.status(404)
    return res.render('pages/notFound')
  }
  return next()
}
