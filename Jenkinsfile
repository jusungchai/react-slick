pipeline {
    agent any
    environment {
        CI = 'true';
        EXTERNAL_ARTIFACTORY_CREDENTIALS = credentials("EXTERNAL_ARTIFACTORY_CREDENTIALS");
    }
    stages {
        stage('Build') {
            steps {
                sh 'curl --user ${EXTERNAL_ARTIFACTORY_CREDENTIALS_USR}:${EXTERNAL_ARTIFACTORY_CREDENTIALS_PSW} https://vouchrsdk.jfrog.io/vouchrsdk/api/npm/auth > .npmrc'
                sh 'npm install'
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deliver') { 
            when {
                branch "master"
            }
            steps {
                script {
                    def server = Artifactory.newServer url: "https://vouchrsdk.jfrog.io/vouchrsdk/", username: "${EXTERNAL_ARTIFACTORY_CREDENTIALS_USR}", password: "${EXTERNAL_ARTIFACTORY_CREDENTIALS_PSW}";
                    def rtNpm = Artifactory.newNpmBuild()
                    rtNpm.resolver server: server, repo: 'npm'
                    rtNpm.deployer server: server, repo: 'npm-release'
                    def buildInfo = rtNpm.publish path: null
                }
            }
        }
    }
}
