export type BackofficeSearchText<TItem> = (
  item: TItem,
) => Array<string | null | undefined>

export function filterBackofficeItemsByQuery<TItem>(
  items: TItem[],
  query: string,
  getSearchText: BackofficeSearchText<TItem>,
): TItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (normalizedQuery.length === 0) {
    return items
  }

  return items.filter((item) =>
    getSearchText(item)
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  )
}
