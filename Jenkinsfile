pipeline {
    agent any

    environment {
        IMAGE_NAME    = 'hungnm-vibeda'
        CONTAINER     = 'hungnm-vibeda'
        HOST_PORT     = '3000'
        REPO_URL      = 'https://github.com/hungngominh/hungnm-vibeda.git'
        BRANCH        = 'master'
    }

    stages {

        stage('Checkout') {
            steps {
                git url: env.REPO_URL, branch: env.BRANCH, credentialsId: 'github-creds'
            }
        }

        stage('Build Image') {
            steps {
                script {
                    sh """
                        docker build \
                            --build-arg VEGABASE_REPO=https://github.com/hungngominh/vegabase-node.git \
                            -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                            -t ${IMAGE_NAME}:latest \
                            .
                    """
                }
            }
        }

        stage('Stop Old Container') {
            steps {
                script {
                    sh """
                        docker stop ${CONTAINER} 2>/dev/null || true
                        docker rm   ${CONTAINER} 2>/dev/null || true
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                // 'moodaily-env' is a Jenkins "Secret file" credential containing the .env content
                withCredentials([file(credentialsId: 'moodaily-env', variable: 'ENV_FILE')]) {
                    sh """
                        docker run -d \
                            --name ${CONTAINER} \
                            --restart unless-stopped \
                            -p ${HOST_PORT}:3000 \
                            --env-file "\${ENV_FILE}" \
                            ${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sleep(20)
                    sh """
                        STATUS=\$(docker inspect --format='{{.State.Status}}' ${CONTAINER})
                        echo "Container status: \$STATUS"
                        if [ "\$STATUS" != "running" ]; then
                            docker logs --tail=50 ${CONTAINER}
                            exit 1
                        fi
                    """
                    sh """
                        docker exec ${CONTAINER} node -e \
                          "require('http').get('http://localhost:3000/api/cloud',r=>{console.log('HTTP',r.statusCode);process.exit(r.statusCode<500?0:1)}).on('error',e=>{console.error(e.message);process.exit(1)})"
                    """
                }
            }
        }

        stage('Prune Old Images') {
            steps {
                sh "docker image prune -f --filter 'label!=keep' 2>/dev/null || true"
            }
        }
    }

    post {
        success {
            echo "✅ Deploy thành công! App đang chạy tại http://hungnm-vibeda.allianceits.com"
        }
        failure {
            echo "❌ Deploy thất bại! Xem log: docker logs ${CONTAINER}"
        }
    }
}
