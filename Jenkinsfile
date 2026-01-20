pipeline {
  agent any

  options {
    // prevents Jenkins from doing an automatic checkout in addition to our Checkout stage
    skipDefaultCheckout(true)
  }

  environment {
    DOCKERHUB_USERNAME = "hsindhuja"   // must be lowercase

    DOCKERHUB_API = "${DOCKERHUB_USERNAME}/cfd-api"
    DOCKERHUB_ML  = "${DOCKERHUB_USERNAME}/cfd-ml"
    DOCKERHUB_UI  = "${DOCKERHUB_USERNAME}/cfd-ui"

    CI_COMPOSE   = "ci/compose/docker-compose.ci.yml"
    PROD_COMPOSE = "ci/compose/docker-compose.prod.yml"

    // Production servepipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
  }

  environment {
    // ===== Docker Hub =====
    DOCKERHUB_USERNAME = "hsindhuja"   // must be lowercase

    API_IMAGE           = "${DOCKERHUB_USERNAME}/cfd-api"
    ML_IMAGE            = "${DOCKERHUB_USERNAME}/cfd-ml"
    UI_CHECKOUT_IMAGE   = "${DOCKERHUB_USERNAME}/cfd-ui-checkout"
    UI_ADMIN_IMAGE      = "${DOCKERHUB_USERNAME}/cfd-ui-admin"

    // ===== Compose files =====
    CI_COMPOSE   = "ci/compose/docker-compose.ci.yml"
    PROD_COMPOSE = "ci/compose/docker-compose.prod.yml"

    // ===== Production EC2 =====
    PROD_HOST = "52.90.126.62"
    PROD_USER = "ubuntu"
    PROD_DIR  = "/opt/couponfraud"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Set TAG') {
      steps {
        sh '''#!/usr/bin/env sh
          set -eu
          TAG=$(git rev-parse --short=7 HEAD)
          echo "$TAG" > .tag
          echo "TAG=$TAG"
        '''
      }
    }

    stage('Preflight: Docker access') {
      steps {
        sh '''#!/usr/bin/env sh
          set -eu
          docker --version
          docker ps >/dev/null
          docker compose version
        '''
      }
    }

    stage('Build Docker Images') {
      steps {
        sh '''#!/usr/bin/env sh
          set -eu
          TAG=$(cat .tag)
          echo "Building images with TAG=$TAG"

          docker build -f ci/docker/Dockerfile.api -t ${API_IMAGE}:${TAG} .
          docker build -f ci/docker/Dockerfile.ml  -t ${ML_IMAGE}:${TAG} .

          # UI - Checkout
          docker build -f ci/docker/Dockerfile.tomcat-ui \
            -t ${UI_CHECKOUT_IMAGE}:${TAG} \
            --build-arg APP_PATH=apps/checkout .

          # UI - Admin
          # If your admin folder is NOT apps/admin, change APP_PATH below (example: apps/dashboard)
          docker build -f ci/docker/Dockerfile.tomcat-ui \
            -t ${UI_ADMIN_IMAGE}:${TAG} \
            --build-arg APP_PATH=apps/admin .
        '''
      }
    }

    stage('CI Run + Smoke Test') {
      steps {
        sh '''#!/usr/bin/env sh
          set -eu
          chmod +x ci/scripts/wait-for-http.sh ci/scripts/smoke-test.sh

          docker compose -f ${CI_COMPOSE} down || true
          docker compose -f ${CI_COMPOSE} up -d --build

          echo "=== Running containers (CI) ==="
          docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"

          # Wait for Checkout + Admin UIs
          ci/scripts/wait-for-http.sh http://localhost:8081/ 60
          ci/scripts/wait-for-http.sh http://localhost:8082/ 60

          # Smoke test (recommended: check 8081 + 8082 in smoke-test.sh)
          ci/scripts/smoke-test.sh
        '''
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''#!/usr/bin/env sh
            set -eu
            TAG=$(cat .tag)

            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

            docker push ${API_IMAGE}:${TAG}
            docker push ${ML_IMAGE}:${TAG}
            docker push ${UI_CHECKOUT_IMAGE}:${TAG}
            docker push ${UI_ADMIN_IMAGE}:${TAG}
          '''
        }
      }
    }

    stage('Deploy to Production EC2') {
      steps {
        sshagent(credentials: ['prod-ssh-key']) {
          sh '''#!/usr/bin/env sh
            set -eu
            TAG=$(cat .tag)

            ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} "mkdir -p ${PROD_DIR}"
            scp -o StrictHostKeyChecking=no ${PROD_COMPOSE} ${PROD_USER}@${PROD_HOST}:${PROD_DIR}/docker-compose.yml

            ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} "
              set -eu
              cd ${PROD_DIR}
              export TAG=${TAG}
              docker compose pull
              docker compose
r details
    PROD_HOST = "34.235.165.176"
    PROD_USER = "ubuntu"
    PROD_DIR  = "/opt/couponfraud"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Set TAG') {
      steps {
        // Use git directly (reliable) instead of GIT_COMMIT env var (may be unset)
        sh '''#!/usr/bin/env sh
          set -eu
          TAG=$(git rev-parse --short=7 HEAD)
          echo "$TAG" > .tag
          echo "TAG=$TAG"
        '''
      }
    }

    stage('Build Docker Images') {
      steps {
        sh '''#!/usr/bin/env sh
          set -eu
          TAG=$(cat .tag)
          echo "Building images with TAG=$TAG"

          docker build -f ci/docker/Dockerfile.api -t ${DOCKERHUB_API}:${TAG} .
          docker build -f ci/docker/Dockerfile.ml  -t ${DOCKERHUB_ML}:${TAG} .
          docker build -f ci/docker/Dockerfile.tomcat-ui -t ${DOCKERHUB_UI}:${TAG} --build-arg APP_PATH=apps/checkout .
        '''
      }
    }

    stage('CI Run + Smoke Test') {
      steps {
        sh '''#!/usr/bin/env sh
          set -eu

          chmod +x ci/scripts/wait-for-http.sh ci/scripts/smoke-test.sh

          docker compose -f ${CI_COMPOSE} down || true
          docker compose -f ${CI_COMPOSE} up -d --build

          echo "=== Running containers ==="
          docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

          ci/scripts/wait-for-http.sh http://localhost:8081/ 60
          ci/scripts/smoke-test.sh
        '''
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''#!/usr/bin/env sh
            set -eu
            TAG=$(cat .tag)

            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

            docker push ${DOCKERHUB_API}:${TAG}
            docker push ${DOCKERHUB_ML}:${TAG}
            docker push ${DOCKERHUB_UI}:${TAG}
          '''
        }
      }
    }

    stage('Deploy to Production EC2') {
      steps {
        sshagent(credentials: ['prod-ssh-key']) {
          sh '''#!/usr/bin/env sh
            set -eu
            TAG=$(cat .tag)

            ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} "mkdir -p ${PROD_DIR}"
            scp -o StrictHostKeyChecking=no ${PROD_COMPOSE} ${PROD_USER}@${PROD_HOST}:${PROD_DIR}/docker-compose.yml

            ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} "
              set -eu
              cd ${PROD_DIR}
              export TAG=${TAG}
              docker compose pull
              docker compose up -d
              docker ps
            "
          '''
        }
      }
    }
  }

  post {
    always {
      sh '''#!/usr/bin/env sh
        set +e
        docker compose -f ci/compose/docker-compose.ci.yml down || true
      '''
    }
  }
}
