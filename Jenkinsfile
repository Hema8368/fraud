pipeline {
  agent any

  environment {
    DOCKERHUB_API = "yourdockerhub/cfd-api"
    DOCKERHUB_ML  = "yourdockerhub/cfd-ml"
    DOCKERHUB_UI  = "yourdockerhub/cfd-ui"

    PROD_HOST = "PROD_PUBLIC_IP"
    PROD_USER = "ubuntu"
    PROD_DIR  = "/opt/couponfraud"
    PROD_COMPOSE = "ci/compose/docker-compose.prod.yml"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build Docker Images') {
      steps {
        sh '''
          set -eux
          TAG=${GIT_COMMIT:0:7}

          docker build -f ci/docker/Dockerfile.api -t ${DOCKERHUB_API}:${TAG} .
          docker build -f ci/docker/Dockerfile.ml  -t ${DOCKERHUB_ML}:${TAG} .
          docker build -f ci/docker/Dockerfile.tomcat-ui -t ${DOCKERHUB_UI}:${TAG} --build-arg APP_PATH=apps/checkout .
        '''
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            set -eux
            TAG=${GIT_COMMIT:0:7}

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
          sh '''
            set -eux
            TAG=${GIT_COMMIT:0:7}

            ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} "mkdir -p ${PROD_DIR}"

            scp -o StrictHostKeyChecking=no ${PROD_COMPOSE} ${PROD_USER}@${PROD_HOST}:${PROD_DIR}/docker-compose.yml

            ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} "
              set -eux
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
}
