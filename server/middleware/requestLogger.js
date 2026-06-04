export function requestLogger(req, res, next) {
  const startedAt = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    console.log(
      `[server] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms) [${req.requestId}]`,
    )
  })

  next()
}
