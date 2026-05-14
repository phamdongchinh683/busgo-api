pipeline {
    agent any

    environment {
        IMAGE_NAME = "phamdongchinh683/backend-fastify"
        DOCKER_HUB_CREDS = 'dockerhub-creds'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Push Image to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CREDS, usernameVariable: 'DOCKER_HUB_USERNAME', passwordVariable: 'DOCKER_HUB_PASSWORD')]) {
                    sh '''
                        export DOCKER_BUILDKIT=1
                        docker login -u ${DOCKER_HUB_USERNAME} -p ${DOCKER_HUB_PASSWORD}
                        docker build -t ${IMAGE_NAME}:latest -f Dockerfile.prod .
                        docker push ${IMAGE_NAME}:latest
                    '''
                }
            }
        }

        stage('Load Production Environment') {
    steps {
        withCredentials([file(credentialsId: 'env', variable: 'ENV_FILE')]) {
            sh '''
                jq -r '. | to_entries[] | .key + "=" + "\\""
                    + (.value | tostring | gsub("\\n"; "\\\\n"))
                    + "\\""' "$ENV_FILE" > .env
            '''
        }
    }
}

        stage("Test Migrate") {
            steps {
                sh '''
                    docker-compose -f docker-compose.prod.yml run --rm api yarn migrate
                '''
            }
        }

        stage("Deploy") {
            steps {
                 sh '''
                        docker-compose -f docker-compose.prod.yml up -d
                 '''
            }
        }
    }
}

