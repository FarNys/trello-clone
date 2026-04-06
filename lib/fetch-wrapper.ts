type FetchWrapperOptions = Omit<RequestInit, "body"> & {
  body?: RequestInit["body"] | Record<string, unknown> | Array<unknown>
}

type ErrorPayload = {
  error?: string
  message?: string
  [key: string]: unknown
}

export class FetchWrapperError<TPayload = unknown> extends Error {
  readonly status: number
  readonly payload: TPayload | null

  constructor(message: string, status: number, payload: TPayload | null) {
    super(message)
    this.name = "FetchWrapperError"
    this.status = status
    this.payload = payload
  }
}

function isSerializableJsonBody(
  body: FetchWrapperOptions["body"]
): body is Record<string, unknown> | Array<unknown> {
  if (!body) {
    return false
  }

  if (Array.isArray(body)) {
    return true
  }

  if (typeof body !== "object") {
    return false
  }

  return Object.getPrototypeOf(body) === Object.prototype
}

function getErrorMessage(payload: unknown, response: Response) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload
  }

  if (payload && typeof payload === "object") {
    const errorPayload = payload as ErrorPayload

    if (typeof errorPayload.error === "string" && errorPayload.error.length > 0) {
      return errorPayload.error
    }

    if (
      typeof errorPayload.message === "string" &&
      errorPayload.message.length > 0
    ) {
      return errorPayload.message
    }
  }

  if (response.statusText.length > 0) {
    return response.statusText
  }

  return `Request failed with status ${response.status}`
}

async function parseResponsePayload(response: Response) {
  if (response.status === 204 || response.status === 205) {
    return null
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null)
  }

  const textPayload = await response.text().catch(() => "")
  return textPayload.length > 0 ? textPayload : null
}

export async function fetchWrapper<TResponse = unknown, TError = unknown>(
  input: RequestInfo | URL,
  options: FetchWrapperOptions = {}
) {
  const {
    body,
    headers,
    credentials = "same-origin",
    ...requestInit
  } = options

  const requestHeaders = new Headers(headers)
  let requestBody: RequestInit["body"] = undefined

  if (isSerializableJsonBody(body)) {
    requestBody = JSON.stringify(body)

    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json")
    }
  } else {
    requestBody = body as RequestInit["body"]
  }

  const response = await fetch(input, {
    ...requestInit,
    credentials,
    headers: requestHeaders,
    body: requestBody,
  })

  const payload = await parseResponsePayload(response)

  if (!response.ok) {
    throw new FetchWrapperError<TError>(
      getErrorMessage(payload, response),
      response.status,
      payload as TError
    )
  }

  return payload as TResponse
}

export function isFetchWrapperError(
  error: unknown
): error is FetchWrapperError {
  return error instanceof FetchWrapperError
}
