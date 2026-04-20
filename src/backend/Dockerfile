FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY backend ./backend

WORKDIR /app/backend
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/backend .

FROM alpine:3.21

RUN adduser -D -u 10001 appuser

COPY --from=builder /bin/backend /usr/local/bin/backend

USER appuser

EXPOSE 8080

CMD ["backend"]