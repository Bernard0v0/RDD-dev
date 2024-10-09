FROM openjdk:22-jdk-slim

WORKDIR /app

COPY target/RDD-0.0.1-SNAPSHOT.jar RDD_backend.jar

EXPOSE 8080

CMD ["java", "-jar", "RDD_backend.jar"]
