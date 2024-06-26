FROM  node:current-bullseye
WORKDIR /
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
