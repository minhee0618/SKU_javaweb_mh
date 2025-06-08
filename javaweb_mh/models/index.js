
const Sequelize = require('sequelize');

// 현재 실행 환경 설정
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];       // config.json에서 현재 환경 설정 가져옴
const db = {};

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(config.database, config.username, config.password, config);


// Sequelize 모델 정의 및 테이블 생성
async function createTable(tableName) {
  const Model = sequelize.define(
    tableName,
    {
      core: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      task: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      usaged: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
    },
    {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Profile',
      tableName: tableName,
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );

  await Model.sync();   // 테이블 생성 (존재하지 않을 경우)
  return Model;
}

// 지정된 테이블을 MySQL에서 삭제
async function dropTable(tableName) {
  try {
    await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    console.log(`테이블 '${tableName}'이(가) 삭제되었습니다.`);
  } catch (error) {
    console.error(`테이블 삭제 중 오류가 발생했습니다: ${error}`);
  }
}

// 업로드된 2차원 배열 형식 데이터를 기반으로 동적 테이블 생성 및 데이터 삽입
async function createDynamicTable(profile) {
  const tableName = profile[0][0]; 
  const DynamicModel = await createTable(tableName);   // 테이블 생성

  let core_row = -1;

  for (let row = 1; row < profile.length; row++) {
    if (core_row === -1) {
      core_row = row;
      continue;
    }

    // 공백 만나면 다음 Core로 이동
    if (profile[row].length === 1) {
      core_row = -1;
      continue;
    }

    // 실제 데이터 삽입
    for (let column = 1; column < profile[row].length; column++) {
      try {
        await DynamicModel.create({
          task: profile[core_row][column - 1],  // Task 헤더
          core: profile[row][0],               // Core 이름
          usaged: profile[row][column],        // 사용량
        });
      } catch (e) {
        console.log(`Error: ${tableName} 파일 데이터 오류 발생`);
      }
    }
  }
}

// 데이터베이스에 존재하는 테이블 목록 조회
async function getTableList() {
  const query = 'SHOW TABLES';
  const [results, metadata] = await sequelize.query(query);

// MySQL 기준 테이블 이름 필드
  const tableList = results.map((result) => result.Tables_in_javaweb);
  return tableList;
}

// Sequelize 인스턴스를 외부에서 사용 가능하도록 export
db.sequelize = sequelize;

module.exports = {
  db,
  createDynamicTable,
  sequelize,
  getTableList,
  dropTable,
};
