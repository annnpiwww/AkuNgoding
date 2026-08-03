import slugify from 'slugify'

export function exportAsMd(title: string, markdownContent: string): void {
  const fileName = slugify(title, { lower: true, strict: true }) + '-prd.md'
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
