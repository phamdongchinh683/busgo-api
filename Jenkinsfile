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

        stage('Ensure Core Services') {
            steps {
                sh '''
                    set -e

                    docker-compose -f docker-compose.prod.yml up -d db dozzle netdata
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

        stage('Pull API Image') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml pull api
                '''
            }
        }

        stage('Run Migration') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml run --rm --no-deps api yarn migrate
                '''
            }
        }

        stage('Deploy API') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml up -d --no-deps api
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    set -e

                    docker image prune -af > /dev/null 2>&1 || true
                    docker container prune -f > /dev/null 2>&1 || true
                    docker builder prune -af > /dev/null 2>&1 || true
                '''
            }
        }
    }

    post {
        failure {
            sh '''
                docker ps || true

                echo "===== API LOGS ====="
                docker logs --tail=50 api 2>/dev/null || true

                echo "===== POSTGRES LOGS ====="
                docker logs --tail=50 postgres 2>/dev/null || true
            '''
        }

        always {
            sh '''
                rm -f .env
            '''

            cleanWs()
        }

        success {
            echo 'Deploy completed successfully.'
        }
    }
}