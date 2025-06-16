# Dockerfile
FROM oven/bun:1.1

WORKDIR /app

COPY . .

RUN bun install
RUN bun run build

CMD ["bun", "run", "start:dev"]