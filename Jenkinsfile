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

    // Production server details
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
