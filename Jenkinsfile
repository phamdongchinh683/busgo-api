pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        IMAGE_REPOSITORY = 'phamdongchinh683/busgo-api'
        COMPOSE_FILE = 'docker-compose.prod.yml'
        COMPOSE_PROJECT_NAME = 'busgo'
    }

    stages {
        stage('Checkout Latest Main') {
    steps {
        git branch: 'main',
            credentialsId: 'github-ssh-key',
            url: 'git@github.com:phamdongchinh683/busgo-api.git'

        script {
            env.DEPLOY_IMAGE_TAG = sh(
                script: 'git rev-parse --short=12 HEAD',
                returnStdout: true
            ).trim()
        }

        echo "Deploy commit: ${DEPLOY_IMAGE_TAG}"
    }
}

        stage('Prepare') {
            steps {
                script {
                    if (sh(script: 'docker compose version >/dev/null 2>&1', returnStatus: true) == 0) {
                        env.COMPOSE_CMD = 'docker compose'
                    } else if (sh(script: 'docker-compose version >/dev/null 2>&1', returnStatus: true) == 0) {
                        env.COMPOSE_CMD = 'docker-compose'
                    } else {
                        error('Docker Compose is not installed.')
                    }

                    echo "Compose command: ${env.COMPOSE_CMD}"
                    echo "Compose project: ${env.COMPOSE_PROJECT_NAME}"
                    echo "Image: ${env.IMAGE_REPOSITORY}:${env.DEPLOY_IMAGE_TAG}"
                }
            }
        }

        stage('Load Environment') {
            steps {
                withCredentials([file(credentialsId: 'env', variable: 'ENV_FILE')]) {
                    sh '''
                        set -e

                        jq -r '. | to_entries[] | .key + "=" + "\\\""
                            + (.value | tostring | gsub("\\n"; "\\\\n"))
                            + "\\\""' "$ENV_FILE" > .env
                    '''
                }
            }
        }

        stage('Build API Image') {
            steps {
                sh '''
                    set -e

                    DOCKER_BUILDKIT=1 docker build \
                      -f Dockerfile.prod \
                      -t "${IMAGE_REPOSITORY}:${DEPLOY_IMAGE_TAG}" \
                      -t "${IMAGE_REPOSITORY}:latest" \
                      .
                '''
            }
        }

        stage('Ensure Core Services') {
            steps {
                sh '''
                    set -e

                    $COMPOSE_CMD -p "$COMPOSE_PROJECT_NAME" -f "$COMPOSE_FILE" \
                    up -d --no-recreate db redis dozzle netdata
                '''
            }
        }

        stage('Wait Database And Redis') {
            steps {
                sh '''
                    set -e

                    for i in $(seq 1 30); do
                        if docker exec postgres pg_isready -U busgo -d busgo >/dev/null 2>&1; then
                            echo "PostgreSQL ready"
                            break
                        fi

                        if [ "$i" -eq 30 ]; then
                            echo "PostgreSQL is not ready"
                            exit 1
                        fi

                        sleep 1
                    done

                    for i in $(seq 1 30); do
                        if docker exec redis sh -c 'redis-cli -a "$REDIS_PASSWORD" ping' 2>/dev/null | grep -q PONG; then
                            echo "Redis ready"
                            break
                        fi

                        if [ "$i" -eq 30 ]; then
                            echo "Redis is not ready"
                            exit 1
                        fi

                        sleep 1
                    done
                '''
            }
        }

        stage('Run Migration') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${DEPLOY_IMAGE_TAG}" \
                    $COMPOSE_CMD -p "$COMPOSE_PROJECT_NAME" -f "$COMPOSE_FILE" \
                    run --rm --no-deps api1 yarn migrate
                '''
            }
        }

        stage('Deploy API') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${DEPLOY_IMAGE_TAG}" \
                    $COMPOSE_CMD -p "$COMPOSE_PROJECT_NAME" -f "$COMPOSE_FILE" \
                    up -d --no-deps --force-recreate api1 api2
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -e

                    for port in 3001 3002; do
                        for i in $(seq 1 20); do
                            if curl -fsS "http://127.0.0.1:${port}/health" >/dev/null; then
                                echo "API port ${port} healthy"
                                break
                            fi

                            if [ "$i" -eq 20 ]; then
                                echo "API on port ${port} is not healthy"
                                exit 1
                            fi

                            sleep 1
                        done
                    done
                '''
            }
        }

        stage('Light Cleanup') {
            steps {
                sh '''
                    docker container prune -f >/dev/null 2>&1 || true
                    docker image prune -f >/dev/null 2>&1 || true
                '''
            }
        }
    }

    post {
        always {
            sh '''
                rm -f .env
            '''
        }

        success {
            echo "Deploy completed: ${IMAGE_REPOSITORY}:${DEPLOY_IMAGE_TAG}"
        }

        failure {
            echo 'Deploy failed. Check the failed stage above.'
        }
    }
}