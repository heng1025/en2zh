From golang

WORKDIR /usr/src/app

RUN go env -w GOPROXY=https://goproxy.cn,direct

# pre-copy/cache go.mod for pre-downloading dependencies and only redownloading them in subsequent builds if they change
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY ./main.go ./
RUN go build -v -o /usr/local/bin/endict ./...

CMD ["endict"]
