# Stage 1 - build
FROM node:20-alpine AS builder

# Install build deps
RUN apk add --no-cache python3 make g++ git

WORKDIR /usr/src/app

# copy package.json and lockfile (if present) and install deps
COPY package.json package-lock.json* yarn.lock* ./

# install dependencies
RUN if [ -f yarn.lock ]; then \
			yarn install --frozen-lockfile; \
		elif [ -f package-lock.json ]; then \
			npm ci; \
		else \
			npm install; \
		fi

# copy sources and build
COPY . ./
RUN npm run build

# Stage 2 - production image
FROM node:20-alpine

WORKDIR /usr/src/app

# copy only compiled output and production deps
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

# install only production dependencies
RUN apk add --no-cache ca-certificates
RUN if [ -f yarn.lock ]; then \
			yarn install --production --frozen-lockfile; \
		elif [ -f package-lock.json ]; then \
			npm ci --omit=dev; \
		else \
			npm install --production; \
		fi

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]
