import { Options } from './'
import { getDefaultSiteMatrix } from './site-matrix'

export default function getDefaultOptions(
  append: Partial<Options> = {}
): Options {
  return {
    version: 1,
    site_matrix: getDefaultSiteMatrix(),
    ...append,
  }
}