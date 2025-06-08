const express = require('express');                  // Express 서버 구성
const router = express.Router();                     // 라우터 객체 생성

const {
  createDynamicTable,
  getTableList,
  sequelize,
  dropTable
} = require('../models/index');

const profile_model = require('../models/profile');  // 동적 테이블용 모델


// [1] 프로파일 파일 업로드 및 테이블 생성
//-------------------------------------
router.post('/', async (req, res) => {
  const profiles = req.body;
  let count = 0;

  try {
    const tableList = await getTableList(); // 현재 DB에 존재하는 테이블 목록 조회

    for (let file_num = 0; file_num < profiles.length; file_num++) {
      // 파일명 정리 (소문자화 + .txt 확장자 제거)
      profiles[file_num][0][0] = profiles[file_num][0][0].toLowerCase().slice(0, -4);

      // 이미 존재하는 테이블은 건너뜀
      if (tableList.includes(profiles[file_num][0][0])) {
        console.log("이미 존재하는 파일입니다");
        continue;
      }

      await createDynamicTable(profiles[file_num]); // 동적 테이블 생성
      count++;
    }

    // 결과 메시지 응답
    if (count === 0) {
      res.json({ status: 'success', message: `저장 가능한 파일이 존재하지 않습니다.` });
    } else if (count === profiles.length) {
      res.json({ status: 'success', message: `${count}개의 프로파일이 정상적으로 저장되었습니다.` });
    } else {
      res.json({ status: 'success', message: `중복된 이름의 파일을 제외한 ${count}개의 프로파일이 저장되었습니다.` });
    }

  } catch (error) {
    console.error('오류가 발생하였습니다:', error);
    res.json({ status: 'error', message: '오류가 발생하였습니다.' });
  }
});

// [2] 전체 테이블 목록 조회
//-------------------------------------
router.get('/', async (req, res) => {
  const tableList = await getTableList();
  res.json(tableList);
});

// [3] 특정 테이블 데이터 + core/task 목록 조회
//-------------------------------------
router.get('/data/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const tableList = await getTableList();

    if (!tableList.includes(tableName)) {
      return res.status(404).json({ error: '존재하지 않는 파일입니다.' });
    }

    profile_model.initiate(sequelize, tableName); // 동적 모델 초기화

    const datas = await profile_model.findAll(); // 전체 데이터
    const tasks = await profile_model.findAll({ attributes: [sequelize.fn('DISTINCT', sequelize.col('core')), 'core'] });
    const cores = await profile_model.findAll({ attributes: [sequelize.fn('DISTINCT', sequelize.col('task')), 'task'] });

    res.json({ datas, cores, tasks });

  } catch (error) {
    console.error('데이터 조회 오류', error);
  }
});

// [4] 특정 테이블 삭제
//-------------------------------------
router.delete('/drop/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    dropTable(tableName);
    res.json({ state: 'success' });
  } catch (error) {
    res.json({ state: 'error' });
  }
});

// [5] 특정 core 기준 task 통계
//-------------------------------------
router.get('/coredata/:tableName/:core', async (req, res) => {
  const { tableName, core } = req.params;

  profile_model.initiate(sequelize, tableName);

  const data = await profile_model.findAll({
    attributes: [
      'task',
      [sequelize.fn('max', sequelize.col('usaged')), 'max_usaged'],
      [sequelize.fn('min', sequelize.col('usaged')), 'min_usaged'],
      [sequelize.fn('avg', sequelize.col('usaged')), 'avg_usaged'],
      [sequelize.fn('stddev', sequelize.col('usaged')), 'std_usaged'],
    ],
    where: { core },
    group: ['task']
  });

  res.json(data);
});

// [6] 특정 task 기준 core 통계
//-------------------------------------
router.get('/taskdata/:tableName/:task', async (req, res) => {
  const { tableName, task } = req.params;

  profile_model.initiate(sequelize, tableName);

  const data = await profile_model.findAll({
    attributes: [
      'core',
      [sequelize.fn('max', sequelize.col('usaged')), 'max_usaged'],
      [sequelize.fn('min', sequelize.col('usaged')), 'min_usaged'],
      [sequelize.fn('avg', sequelize.col('usaged')), 'avg_usaged'],
      [sequelize.fn('stddev', sequelize.col('usaged')), 'std_usaged'],
    ],
    where: { task },
    group: ['core']
  });

  res.json(data);
});

// [7] 전체 산점도 데이터 조회
//-------------------------------------
router.get('/scatterdata/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;

    profile_model.initiate(sequelize, tableName);

    const datas = await profile_model.findAll({
      attributes: ['core', 'task', 'usaged']
    });

    res.json(datas);

  } catch (error) {
    console.error('산점도 전체 데이터 조회 오류:', error);
    res.status(500).json({ error: '산점도 데이터 조회 실패' });
  }
});

module.exports = router; // 모듈로 export