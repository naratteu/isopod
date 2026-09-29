FROM elixir:1.18-slim AS build
WORKDIR /app
ENV MIX_ENV=prod
RUN apt-get update && apt-get install -y --no-install-recommends build-essential ca-certificates && rm -rf /var/lib/apt/lists/*
RUN mix local.hex --force && mix local.rebar --force
COPY providers/phoenix/mix.exs providers/phoenix/mix.lock ./
RUN mix deps.get --only prod && mix deps.compile
COPY providers/phoenix/ ./

FROM node:24-bookworm-slim AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY --from=build /app /app/providers/phoenix
RUN mkdir -p /out && npx esbuild providers/phoenix/remote.js --bundle --format=esm --minify --outfile=/out/remote.js

FROM build AS release
COPY --from=assets /out/remote.js /app/priv/static/remote.js
RUN echo ok > priv/static/health && mix release
CMD ["_build/prod/rel/isopod/bin/isopod", "start"]
