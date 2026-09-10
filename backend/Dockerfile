FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
RUN npm install
COPY backend ./backend
COPY data ./data
RUN npm --workspace backend run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/data ./data
EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
