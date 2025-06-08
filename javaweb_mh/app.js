const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const { sequelize } = require('./models/index');
const indexRouter = require('./routes/index');
const profilesRouter = require('./routes/profiles');


const app = express(); // Express 서버 초기화

app.set('port', process.env.PORT || 3003);   // 포트번호 설정 
app.set('view engine', 'html');              // 템플릿 엔진을 HTML로 설정

// Nunjucks 템플릿 엔진 설정
nunjucks.configure('views', {
  express: app,                               // Express와 Nunjucks 연동
  watch: true,                                // 템플릿 수정 시 자동 반영
});

// Sequelize를 통해 MySQL 데이터베이스 연결 및 동기화
sequelize.sync({ force: false })               // force: false → 기존 테이블 유지
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });


// 정적 파일 제공을 위한 설정
app.use(express.static(path.join(__dirname, 'public')));

// 요청 바디를 JSON 형식으로 파싱
app.use(express.json());

// URL-encoded 형식 바디 파싱 (폼 데이터 처리)
app.use(express.urlencoded({ extended: false }));

// 라우터 연결 설정
app.use('/', indexRouter);                    // '/' 경로 진입 시 indexRouter 실행
app.use('/profiles', profilesRouter);         // '/profiles' 경로 진입 시 profilesRouter 실행

// 존재하지 않는 경로 요청 시 404 에러 처리
app.use((req, res, next) => {
  const error = new Error(`${req.url}은 잘못된 주소입니다.`);
  error.status = 404;
  next(error);
});

// 서버 내부 오류 처리 (500번대 에러)
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.status(err.status || 500);
  res.render('error');
});

// 지정된 포트로 서버 실행
app.listen(app.get('port'), () => {
  console.log("http://localhost:" + app.get('port') + " server open");
});
