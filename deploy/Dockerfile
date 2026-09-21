# Build the static site, then serve it with nginx. Mirrors the Loomings
# image: a node build stage and nginx:alpine behind Caddy on the VPS.
# The build context must contain vendor/ (run `npm run vendor` first, or
# let the workflow do it); the image never fetches anything itself.
FROM node:20-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1
