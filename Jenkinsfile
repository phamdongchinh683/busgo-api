pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        IMAGE_REPOSITORY = 'phamdongchinh683/busgo-api'
        COMPOSE_FILE = 'docker-compose.prod.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()

                git branch: 'main',
                    credentialsId: 'github-ssh-key',
                    url: 'git@github.com:phamdongchinh683/busgo-api.git'

                script {
                    env.DEPLOY_IMAGE_TAG = sh(
                        script: 'git rev-parse --short=12 HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }

        stage('Prepare') {
            steps {
                script {
                    if (sh(script: 'docker compose version >/dev/null 2>&1', returnStatus: true) == 0) {
                        env.COMPOSE_CMD = 'docker compose'
                    } else {
                        env.COMPOSE_CMD = 'docker-compose'
                    }

                    echo "Image: ${IMAGE_REPOSITORY}:${DEPLOY_IMAGE_TAG}"
                    echo "Compose: ${COMPOSE_CMD}"
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

        stage('Push Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKERHUB_USERNAME',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''
                        set -e

                        echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

                        docker push "${IMAGE_REPOSITORY}:${DEPLOY_IMAGE_TAG}"
                        docker push "${IMAGE_REPOSITORY}:latest"
                    '''
                }
            }
        }

        stage('Ensure Core Services') {
            steps {
                sh '''
                    set -e

                    docker image inspect postgres:15 >/dev/null 2>&1 || docker pull postgres:15
                    docker image inspect redis:7-alpine >/dev/null 2>&1 || docker pull redis:7-alpine
                    docker image inspect amir20/dozzle:latest >/dev/null 2>&1 || docker pull amir20/dozzle:latest
                    docker image inspect netdata/netdata:stable >/dev/null 2>&1 || docker pull netdata/netdata:stable

                    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --no-recreate db redis dozzle netdata
                '''
            }
        }

        stage('Wait PostgreSQL') {
            steps {
                sh '''
                    set -e

                    for i in $(seq 1 30); do
                        if docker exec postgres pg_isready -U busgo -d busgo >/dev/null 2>&1; then
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "PostgreSQL is not ready"
                    exit 1
                '''
            }
        }

        stage('Wait Redis') {
            steps {
                sh '''
                    set -e

                    for i in $(seq 1 30); do
                        if docker exec redis sh -c 'redis-cli -a "$REDIS_PASSWORD" ping' | grep -q PONG; then
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "Redis is not ready"
                    exit 1
                '''
            }
        }

        stage('Run Migration') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${DEPLOY_IMAGE_TAG}" $COMPOSE_CMD -f "$COMPOSE_FILE" run --rm --no-deps api1 yarn migrate
                '''
            }
        }

        stage('Deploy API') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${DEPLOY_IMAGE_TAG}" $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --no-deps --force-recreate api1 api2
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -e

                    for port in 3001 3002; do
                        for i in $(seq 1 30); do
                            if curl -fsS "http://127.0.0.1:${port}/health" >/dev/null; then
                                echo "API port ${port} healthy"
                                break
                            fi

                            if [ "$i" -eq 30 ]; then
                                echo "API on port ${port} is not healthy"
                                exit 1
                            fi

                            sleep 2
                        done
                    done
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    docker image prune -f >/dev/null 2>&1 || true
                    docker container prune -f >/dev/null 2>&1 || true
                '''
            }
        }
    }

    post {
        failure {
            sh '''
                docker ps || true

                echo "===== API1 LOGS ====="
                docker logs --tail=80 api1 2>/dev/null || true

                echo "===== API2 LOGS ====="
                docker logs --tail=80 api2 2>/dev/null || true

                echo "===== POSTGRES LOGS ====="
                docker logs --tail=80 postgres 2>/dev/null || true

                echo "===== REDIS LOGS ====="
                docker logs --tail=80 redis 2>/dev/null || true
            '''
        }

        always {
            sh '''
                rm -f .env
            '''

            cleanWs()
        }

        success {
            echo "Deploy completed: ${IMAGE_REPOSITORY}:${DEPLOY_IMAGE_TAG}"
        }
    }
}