FROM node:22.14.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY tsconfig.base.json ./
COPY packages ./packages
COPY production-server.mjs start-prod.sh ./
RUN npm run build --workspace=@socialgraph/shared \
  && npm run build --workspace=@socialgraph/backend \
  && npm run build --workspace=@socialgraph/frontend
EXPOSE 3000
CMD ["sh", "start-prod.sh"]
