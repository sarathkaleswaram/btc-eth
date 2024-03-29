FROM node:12-alpine
ENV APP_PORT=8000
ENV PROJECT_DIR=/app

WORKDIR $PROJECT_DIR
COPY . $PROJECT_DIR
EXPOSE $APP_PORT
RUN npm install
CMD [ "node", "server.js" ]