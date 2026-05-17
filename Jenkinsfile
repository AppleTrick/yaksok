pipeline {
    agent any

    stages {
        stage('Pull') {
            steps {
                sh 'cd /home/ubuntu/project/apps/yaksok && git pull origin main'
            }
        }
        stage('Deploy') {
            steps {
                sh 'cd /home/ubuntu/project && docker compose up -d --build yaksok-back yaksok-fastapi yaksok-front'
            }
        }
    }

    post {
        success {
            echo '약속 배포 성공'
        }
        failure {
            echo '약속 배포 실패'
        }
    }
}
