declare module 'mammoth/mammoth.browser' {
  interface ExtractRawTextResult {
    value: string
    messages: Array<{
      type: string
      message: string
    }>
  }

  function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractRawTextResult>

  const mammoth: {
    extractRawText: typeof extractRawText
  }

  export default mammoth
}
