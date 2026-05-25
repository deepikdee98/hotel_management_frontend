"use client"

import { useCallback, useMemo, useState } from "react"

export function usePagination<T>(items: T[], pageSize = 10) {
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)

  const goToPage = useCallback(
    (nextPage: number) => {
      setPage(Math.min(Math.max(nextPage, 1), totalPages))
    },
    [totalPages]
  )

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * safePageSize
    return items.slice(start, start + safePageSize)
  }, [items, safePageSize, currentPage])

  return {
    page: currentPage,
    pageSize: safePageSize,
    totalPages,
    paginatedItems,
    setPage: goToPage,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    previousPage: () => goToPage(currentPage - 1),
  }
}
