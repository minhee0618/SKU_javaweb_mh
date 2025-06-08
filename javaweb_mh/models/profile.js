
const Sequelize = require('sequelize');

class Profile extends Sequelize.Model {
  // initiate 메서드는 Sequelize 인스턴스와 테이블명을 받아 테이블 구조를 정의하고 초기화
  static initiate(sequelize, tableName) {
    Profile.init(
      {
        core: {
          type: Sequelize.STRING(20),   // Core 이름
          allowNull: false,
        },
        task: {
          type: Sequelize.STRING(20),   // Task 이름
          allowNull: false,
        },
        usaged: {
          type: Sequelize.INTEGER.UNSIGNED,  // 사용량
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
  }

  // 모델 간 관계 정의용 메서드
  static associations(db) {
  }
}

module.exports = Profile;
