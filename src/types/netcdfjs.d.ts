declare module 'netcdfjs' {
  export class NetCDFReader {
    constructor(data: ArrayBuffer)
    
    readonly header: {
      recordDimension: {
        length: number
        id: number
        name: string
        recordStep: number
      }
      version: number
      dimensions: Array<{
        name: string
        size: number
      }>
      globalAttributes: Array<{
        name: string
        type: string
        value: unknown
      }>
      variables: Array<{
        name: string
        dimensions: string[]
        attributes: Array<{
          name: string
          type: string
          value: unknown
        }>
        type: string
        size: number
        offset: number
        record: boolean
      }>
    }
    
    readonly dimensions: Array<{
      name: string
      size: number
    }>
    
    readonly variables: Array<{
      name: string
      dimensions: string[]
      attributes: Record<string, unknown>
      type: string
      size: number
    }>
    
    readonly globalAttributes: Array<{
      name: string
      type: string
      value: unknown
    }>
    
    getDataVariable(variableName: string): number[] | string[] | null
    
    getAttribute(attributeName: string): unknown
    
    getDataVariableAsString(variableName: string): string | null
  }
}
