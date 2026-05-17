pipeline {
    agent any

    stages {
        stage('Pull') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    sh '''
                        cd /home/ubuntu/project/apps/yaksok
                        git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@github.com/AppleTrick/yaksok.git
                        git pull origin master
                        git remote set-url origin https://github.com/AppleTrick/yaksok.git
                    '''
                }
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
