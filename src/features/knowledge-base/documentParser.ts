import mammoth from 'mammoth/mammoth.browser'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'
import type { KnowledgeAskAttachment } from './types'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

// 标准化解析后的纯文本，避免把大量空行和空白字符带入知识库
function normalizeParsedText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

// 从 pdf 中提取逐页文本并拼接成统一内容
async function extractTextFromPdf(file: File) {
  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  })
  const pdfDocument = await loadingTask.promise
  const pageTexts: string[] = []

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const items = textContent.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .filter(Boolean)
      .join(' ')

    if (items.trim()) {
      pageTexts.push(`第 ${pageNumber} 页\n${items}`)
    }
  }

  return normalizeParsedText(pageTexts.join('\n\n'))
}

// 从 docx 中提取正文纯文本
async function extractTextFromDocx(file: File) {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({
    arrayBuffer: buffer,
  })

  return normalizeParsedText(result.value)
}

// 从文本类文件中提取纯文本
async function extractTextFromPlainFile(file: File) {
  return normalizeParsedText(await file.text())
}

// 根据扩展名和 mime 识别文件解析策略
function resolveFileKind(file: File) {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()

  if (name.endsWith('.pdf') || type.includes('pdf')) {
    return 'pdf'
  }

  if (
    name.endsWith('.docx') ||
    type.includes('officedocument.wordprocessingml.document') ||
    type.includes('msword')
  ) {
    return 'docx'
  }

  return 'text'
}

// 将文件统一解析成会话/知识库可复用的附件结构
export async function parseKnowledgeAttachment(file: File): Promise<KnowledgeAskAttachment> {
  const fileKind = resolveFileKind(file)
  let rawContent = ''

  if (fileKind === 'pdf') {
    rawContent = await extractTextFromPdf(file)
  } else if (fileKind === 'docx') {
    rawContent = await extractTextFromDocx(file)
  } else {
    rawContent = await extractTextFromPlainFile(file)
  }

  return {
    title: file.name.replace(/\.[^.]+$/, ''),
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    rawContent,
  }
}
