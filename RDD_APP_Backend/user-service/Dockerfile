FROM openjdk:22-jdk-slim

WORKDIR /app

COPY target/user-0.0.1-SNAPSHOT.jar user.jar

EXPOSE 8081

CMD ["java", "-jar", "user.jar"]