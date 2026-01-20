pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
  }

  environment {
    DOCKERHUB_USERNAME = "hsindhuja"

    DOCKERHUB_API = "${DOCKERHUB_USERNAME}/cfd-api"
    DOCKERHUB_ML  = "${DOCKERHUB_USERNAME}/cfd-ml"
    DOCKERHUB_UI  = "${DOCKERHUB_USERNAME}/cfd-ui"

    CI_COMPOSE   = "ci/compose/docker-compose.ci.yml"
    PROD_COMPOSE = "ci/compose/docker-compose.prod.yml"

    PROD_HOST = "34.235.165.176"
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
          TAG=$(echo "$GIT_COMMIT" | cut -c1-7)
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

          # NOTE:
          # Do NOT bring down here if you want to access UI manually after pipeline starts.
          # Cleanup is handled in post actions.
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
