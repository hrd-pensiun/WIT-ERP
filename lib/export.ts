/**
 * Export utilities for CSV/PDF generation
 */

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Convert data to CSV format
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape values with commas or quotes
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportToJSON(data: any[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Format data for export (flatten nested objects)
export function flattenForExport(data: any[]): any[] {
  return data.map(item => {
    const flattened: any = {}
    
    Object.keys(item).forEach(key => {
      const value = item[key]
      
      if (value === null || value === undefined) {
        flattened[key] = ''
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Flatten nested object (e.g., department: { name: 'IT' } becomes department_name: 'IT')
        Object.keys(value).forEach(nestedKey => {
          flattened[`${key}_${nestedKey}`] = value[nestedKey]
        })
      } else if (Array.isArray(value)) {
        flattened[key] = value.length
      } else {
        flattened[key] = value
      }
    })
    
    return flattened
  })
}

// Generate timestamp for filename
export function generateExportFilename(prefix: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}_${date}`
}
