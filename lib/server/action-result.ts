export type ActionResult<TData = void> =
  | {
      ok: true
      data: TData
    }
  | {
      ok: false
      error: string
    }
