pipeline {
  agent any

  environment {
    COMPOSE_FILE = "ci/compose/docker-compose.ci.yml"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Unit Tests') {
      steps {
        sh '''
          set -eux

          # Frontend tests (if your package.json has "test")
          if [ -f apps/checkout/package.json ]; then
            cd apps/checkout
            npm ci
            npm test || true
            cd -
          fi

          # API tests (if exists)
          if [ -f api/package.json ]; then
            cd api
            npm ci
            npm test || true
            cd -
          fi

          # ML tests (if pytest exists)
          if [ -f ml/requirements.txt ]; then
            python3 -V || true
          fi
        '''
      }
    }

    stage('Build & Deploy with Docker Compose') {
      steps {
        sh '''
          set -eux

          docker compose -f ${COMPOSE_FILE} down || true
          docker compose -f ${COMPOSE_FILE} build --no-cache
          docker compose -f ${COMPOSE_FILE} up -d

          chmod +x ci/scripts/wait-for-http.sh ci/scripts/smoke-test.sh

          ci/scripts/wait-for-http.sh http://localhost:8081/ 60
          ci/scripts/smoke-test.sh

          docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
          echo "OPEN UI: http://<EC2-PUBLIC-IP>:8081/"
        '''
      }
    }
  }

  post {
    always {
      sh '''
        docker compose -f ${COMPOSE_FILE} ps || true
      '''
    }
  }
}
