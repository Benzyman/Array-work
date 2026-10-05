# Small production image for CardinalGIS.
FROM node:22-alpine
WORKDIR /app

# Install only production dependencies first (cached between builds).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the app itself.
COPY server.js ./
COPY src ./src
COPY data ./data
COPY public ./public

# The SQLite database lives here; mount a volume so it survives restarts.
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]
USER node

EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
