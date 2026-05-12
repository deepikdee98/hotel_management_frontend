export function printCurrentWindow(): void {
    if (typeof window === "undefined") return
    window.print()
}

export function openPrintableWindow(contentHtml: string, title = "Print"): void {
    if (typeof window === "undefined") return

    const win = window.open("", "", "width=900,height=700")
    if (!win) return

    const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
      @page { size: A4; margin: 10mm; }
      body { margin: 0; padding: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      #print-area { width: 100%; }
      .print-hidden { display: none !important; }
    </style></head><body><div id="print-area">${contentHtml}</div></body></html>`

    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
    win.close()
}
