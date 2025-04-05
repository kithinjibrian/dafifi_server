# Development Stage
FROM node:22 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g @nestjs/cli
RUN npm install

COPY . .

RUN npm run build


# Production Stage
FROM node:22 AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g @nestjs/cli
RUN npm install --only=production

COPY . .

# Copy the built application from the development stage
COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
