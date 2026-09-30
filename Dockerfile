FROM node:22-slim

WORKDIR /app
RUN npm install --global pnpm@10.26.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV NODE_ENV=production
# Temporary public demo only; remove this override when a real SMS provider is connected.
ENV PHONE_AUTH_EXPOSE_OTP=true
EXPOSE 3000
CMD ["node", "dist/index.js"]
