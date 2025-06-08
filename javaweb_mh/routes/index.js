
const express = require('express');
const router = express.Router();

const { getTableList } = require('../models/index');  // 테이블 목록 조회 함수

// GET '/' 요청 처리 - 메인 페이지 로딩 시 DB의 테이블 목록을 불러와 렌더링
router.get('/', async (req, res) => {
  getTableList()
    .then((tableList) => {
      // 테이블 목록을 index.html에 전달하여 렌더링
      res.render('index', { tableList });
    })
    .catch((error) => {
      console.error('테이블 리스트 조회 중 오류가 발생하였습니다:', error);
    });
});

module.exports = router; 
