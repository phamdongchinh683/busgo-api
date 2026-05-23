pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 10, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: 'latest')
    }

    stages {

        stage('Checkout') {
            steps {
                cleanWs()

                git branch: 'main',
                    credentialsId: 'github-ssh-key',
                    url: 'git@github.com:phamdongchinh683/busgo-api.git'
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

        stage('Ensure Core Images') {
            steps {
                sh '''
                    set -e

                    docker image inspect postgres:15 > /dev/null 2>&1 || docker pull postgres:15
                    docker image inspect redis:7-alpine > /dev/null 2>&1 || docker pull redis:7-alpine
                    docker image inspect amir20/dozzle:latest > /dev/null 2>&1 || docker pull amir20/dozzle:latest
                    docker image inspect netdata/netdata:stable > /dev/null 2>&1 || docker pull netdata/netdata:stable
                '''
            }
        }

        stage('Ensure Core Services') {
            steps {
                sh '''
                    set -e

                    docker-compose -f docker-compose.prod.yml up -d --no-recreate db redis dozzle netdata
                '''
            }
        }

        stage('Wait PostgreSQL') {
            steps {
                sh '''
                    set -e

                    for i in $(seq 1 30); do
                        if docker exec postgres pg_isready -U busgo -d busgo > /dev/null 2>&1; then
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

        stage('Pull API Image') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml pull api1
                '''
            }
        }

        stage('Run Migration') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml run --rm --no-deps api1 yarn migrate
                '''
            }
        }

        stage('Deploy API') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml up -d --no-deps api1 api2
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    set -e

                    docker image prune -f > /dev/null 2>&1 || true
                    docker container prune -f > /dev/null 2>&1 || true
                '''
            }
        }
    }

    post {
        failure {
            sh '''
                docker ps || true

                echo "===== API1 LOGS ====="
                docker logs --tail=50 api1 2>/dev/null || true

                echo "===== API2 LOGS ====="
                docker logs --tail=50 api2 2>/dev/null || true

                echo "===== POSTGRES LOGS ====="
                docker logs --tail=50 postgres 2>/dev/null || true

                echo "===== REDIS LOGS ====="
                docker logs --tail=50 redis 2>/dev/null || true
            '''
        }

        always {
            sh '''
                rm -f .env
            '''

            cleanWs()
        }

        success {
            echo 'Deploy completed.'
        }
    }
}