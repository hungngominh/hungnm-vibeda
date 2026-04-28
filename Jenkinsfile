pipeline {
    agent any

    environment {
        IMAGE_NAME       = 'hungnm-vibeda'
        CONTAINER_NAME   = 'hungnm-vibeda'
        GG_CHAT_WEBHOOK  = 'https://chat.googleapis.com/v1/spaces/AAQAkY-qUt8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=UdjB1Zx2Va3LFMqf9YJLC8R_PcddCUQzJViK6gHOmd8'
        JENKINS_URL_PUBLIC = 'http://42.119.236.229:9090'
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Checkout') {
            steps {
                sh """
                    curl -s -X POST '${GG_CHAT_WEBHOOK}&threadKey=hungnm-vibeda-${BUILD_NUMBER}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                        -H 'Content-Type: application/json' \
                        -d '{"text": "🚀 *[HungNM-VibeDa] Deployment Started*\\nBuild: #${BUILD_NUMBER}\\nBranch: ${GIT_BRANCH}\\nView log: ${JENKINS_URL_PUBLIC}/job/hungnm-vibeda/${BUILD_NUMBER}/console"}'
                """
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    MSG=\$(git log -1 --pretty=%s | cut -c1-60)
                    curl -s -X POST '${GG_CHAT_WEBHOOK}&threadKey=hungnm-vibeda-${BUILD_NUMBER}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                        -H 'Content-Type: application/json' \
                        -d "{\\"text\\": \\"🔨 *[HungNM-VibeDa - 1/3] Building Docker image...*\\\\nCommit: ${GIT_COMMIT.take(7)} - \$MSG\\"}"
                """
                sh """
                    docker build \
                        --build-arg VEGABASE_REPO=https://github.com/hungngominh/vegabase-node.git \
                        -t ${IMAGE_NAME}:latest \
                        -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                        .
                """
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    curl -s -X POST '${GG_CHAT_WEBHOOK}&threadKey=hungnm-vibeda-${BUILD_NUMBER}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                        -H 'Content-Type: application/json' \
                        -d '{"text": "📦 *[HungNM-VibeDa - 2/3] Deploying container...*"}'
                """
                withCredentials([
                    string(credentialsId: 'VIBEDA_DATABASE_URL', variable: 'DATABASE_URL'),
                    string(credentialsId: 'VIBEDA_JWT_SECRET',   variable: 'JWT_SECRET'),
                    string(credentialsId: 'VIBEDA_GEMINI_KEY',   variable: 'GEMINI_API_KEY')
                ]) {
                    sh """
                        docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
                        DATABASE_URL=\${DATABASE_URL} \
                        JWT_SECRET=\${JWT_SECRET} \
                        JWT_ISSUER=moodaily \
                        JWT_AUDIENCE=moodaily-client \
                        PORT=3000 \
                        AI_PROVIDER=gemini \
                        OPENAI_API_KEY= \
                        GEMINI_API_KEY=\${GEMINI_API_KEY} \
                        docker compose up -d --no-build
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sh """
                    curl -s -X POST '${GG_CHAT_WEBHOOK}&threadKey=hungnm-vibeda-${BUILD_NUMBER}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                        -H 'Content-Type: application/json' \
                        -d '{"text": "🩺 *[HungNM-VibeDa - 3/3] Running health check...*"}'
                """
                sh '''
                    echo "Waiting for container to start..."
                    sleep 15
                    for i in $(seq 1 12); do
                        STATUS=$(docker inspect --format="{{.State.Status}}" hungnm-vibeda 2>/dev/null || echo "not_found")
                        if [ "$STATUS" = "running" ]; then
                            if docker exec hungnm-vibeda node -e "require('http').get('http://localhost:3000/api/cloud',r=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"; then
                                echo "Health check passed"
                                exit 0
                            fi
                        fi
                        echo "Attempt $i/12: container=$STATUS, waiting..."
                        sleep 10
                    done
                    echo "Health check failed"
                    docker logs hungnm-vibeda --tail 80
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            sh """
                curl -s -X POST '${GG_CHAT_WEBHOOK}&threadKey=hungnm-vibeda-${BUILD_NUMBER}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                    -H 'Content-Type: application/json' \
                    -d '{"text": "✅ *[HungNM-VibeDa] Deployment Successful*\\nBuild: #${BUILD_NUMBER}\\nCommit: ${GIT_COMMIT.take(7)}\\nURL: http://hungnm-vibeda.allianceits.com\\nView log: ${JENKINS_URL_PUBLIC}/job/hungnm-vibeda/${BUILD_NUMBER}/console"}'
            """
        }
        failure {
            sh """
                curl -s -X POST '${GG_CHAT_WEBHOOK}&threadKey=hungnm-vibeda-${BUILD_NUMBER}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                    -H 'Content-Type: application/json' \
                    -d '{"text": "❌ *[HungNM-VibeDa] Deployment Failed*\\nBuild: #${BUILD_NUMBER}\\nCommit: ${GIT_COMMIT.take(7)}\\nView log: ${JENKINS_URL_PUBLIC}/job/hungnm-vibeda/${BUILD_NUMBER}/console"}'
            """
        }
        aborted {
            sh """
                curl -s -X POST '${GG_CHAT_WEBHOOK}&threadKey=hungnm-vibeda-${BUILD_NUMBER}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD' \
                    -H 'Content-Type: application/json' \
                    -d '{"text": "⚠️ *[HungNM-VibeDa] Deployment Aborted*\\nBuild: #${BUILD_NUMBER}\\nView log: ${JENKINS_URL_PUBLIC}/job/hungnm-vibeda/${BUILD_NUMBER}/console"}'
            """
        }
    }
}
