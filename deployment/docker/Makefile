DOCKER_NAMESPACE := victoriametrics-datasource
PKG_PREFIX := github.com/VictoriaMetrics/victoriametrics-datasource

ROOT_IMAGE ?= alpine:3.20.0
CERTS_IMAGE := alpine:3.20.0
GO_BUILDER_IMAGE := golang:1.21.6-alpine
BUILDER_IMAGE := local/builder:2.0.0-$(shell echo $(GO_BUILDER_IMAGE) | tr :/ __)-1
BASE_IMAGE := local/base:1.1.3-$(shell echo $(ROOT_IMAGE) | tr :/ __)-$(shell echo $(CERTS_IMAGE) | tr :/ __)
GO_BUILDINFO = -X '$(PKG_PREFIX)/pkg/buildinfo.Version=$(APP_NAME)-$(DATEINFO_TAG)-$(BUILDINFO_TAG)'

package-base:
	(docker image ls --format '{{.Repository}}:{{.Tag}}' | grep -q '$(BASE_IMAGE)$$') \
		|| docker build \
			--build-arg root_image=$(ROOT_IMAGE) \
			--build-arg certs_image=$(CERTS_IMAGE) \
			--tag $(BASE_IMAGE) \
			deployment/docker/base

docker-scan: package-base
	docker scan --accept-license $(BASE_IMAGE) || (echo "❌ The build has been terminated because critical vulnerabilities were found in $(BASE_IMAGE)"; exit 1)

package-builder:
	(docker image ls --format '{{.Repository}}:{{.Tag}}' | grep -q '$(BUILDER_IMAGE)$$') \
		|| docker build \
			--build-arg go_builder_image=$(GO_BUILDER_IMAGE) \
			--tag $(BUILDER_IMAGE) \
			deployment/docker/builder

app-via-docker: package-builder
	mkdir -p gocache-for-docker
	docker run --rm \
		-v "$(shell pwd):/usr/local/go/src/victoriametrics-datasource" \
		-w /usr/local/go/src/victoriametrics-datasource \
		-v "$(shell pwd)/gocache-for-docker:/gocache" \
		--env GOCACHE=/gocache \
		$(DOCKER_OPTS) \
		$(BUILDER_IMAGE) \
		go build $(RACE) -trimpath -buildvcs=false \
			-ldflags "-extldflags '-static' $(GO_BUILDINFO)" \
			-tags 'netgo osusergo nethttpomithttp2 musl' \
			-o ./victoriametrics-datasource/$(APP_NAME)$(APP_SUFFIX) ./pkg/

app-via-docker-windows: package-builder
	mkdir -p gocache-for-docker
	docker run --rm \
		-v "$(shell pwd):/usr/local/go/src/victoriametrics-datasource" \
        -w /usr/local/go/src/victoriametrics-datasource \
        -v "$(shell pwd)/gocache-for-docker:/gocache" \
        --env GOCACHE=/gocache \
		$(DOCKER_OPTS) \
		$(BUILDER_IMAGE) \
		go build $(RACE) -trimpath -buildvcs=false \
			-ldflags "-s -w -extldflags '-static' $(GO_BUILDINFO)" \
			-tags 'netgo osusergo nethttpomithttp2' \
			-o ./victoriametrics-datasource/$(APP_NAME)$(APP_SUFFIX).exe ./pkg/

frontend-package-base-image:
	docker build -t frontent-builder-image -f deployment/docker/web/Dockerfile ./deployment/docker/web

frontend-build: frontend-package-base-image
	docker run --rm -ti \
         -v "$(shell pwd):/victoriametrics-datasource" \
         -w /victoriametrics-datasource \
         -v "$(shell pwd)/node_modules:/victoriametrics-datasource/node_modules" \
         -v "$(shell pwd)/.cache:/victoriametrics-datasource/.cache" \
         --entrypoint=/bin/bash \
         frontent-builder-image -c "yarn install --cache-folder /victoriametrics-datasource/.cache --omit=dev && yarn run build"

frontend-pack: frontend-package-base-image
	docker run --rm -ti \
	-v "$(shell pwd):/victoriametrics-datasource" \
	-w /victoriametrics-datasource \
	--entrypoint=/bin/bash \
	frontent-builder-image -c "yarn run zip"
