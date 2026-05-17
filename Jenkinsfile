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

        stage('Load Production Environment') {
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

        stage('Pull Image') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml pull api
                '''
            }
        }

        stage('Migrate') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml run --rm api yarn migrate
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG="${IMAGE_TAG}" docker-compose -f docker-compose.prod.yml up -d api

                    docker image prune -f
                '''
            }
        }
    }

    post {
        always {
            sh '''
                rm -f .env
            '''
            cleanWs()
        }
    }
}