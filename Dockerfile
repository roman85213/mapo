FROM eclipse-temurin:21
WORKDIR /opt/app
COPY . /opt/app
RUN ./gradlew build
CMD java -jar build/libs/mapo-0.0.1-SNAPSHOT.jar
