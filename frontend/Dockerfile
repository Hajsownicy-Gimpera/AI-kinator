FROM node:18-alpine

WORKDIR /app

ENV HOST=0.0.0.0 \
    PORT=3000

COPY package*.json ./

RUN npm install

COPY . ./

EXPOSE 3000

CMD ["npm", "start"]