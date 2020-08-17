FROM node:14.8-alpine3.11

# Create app directory
WORKDIR /usr/src/app/

# Install app dependencies
COPY package.json src yarn*.lock ./
RUN apk add --no-cache git tini tzdata && \
    yarn install --pure-lockfile --production=true && \
    yarn cache clean && \
    addgroup -S --gid 1001 bot && \
    adduser -SDH -G bot -u 1001 -s /bin/sh bot

# Use bot user
USER bot

# Copy files
COPY . .

# Run Node app as child of tini
# Signal handling for PID1 https://github.com/krallin/tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD [ "npm", "run", "--silent", "start" ]