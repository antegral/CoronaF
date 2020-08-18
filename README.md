# 코로나 전자동 자가진단 (경기도)

[![CodeFactor](https://www.codefactor.io/repository/github/antegral/coronaf/badge/master)](https://www.codefactor.io/repository/github/antegral/coronaf/overview/master)

## 사용방법

### 파일 수정

사용하기 위해서는 미리 자신의 학적정보를 정의해줘야 합니다.
그래야 인식하고 작동할 수 있으니까요.

```javascript
const request = require('request');
const ejs = require('ejs');
const chalk = require('chalk');
const moment = require('moment'); require('moment-timezone'); moment.tz.setDefault("Asia/Seoul");
const schedule = require('node-schedule');

// STUDENT INFO
const StuInfo = {
  name : '',
  schoolName : '', // 학교 이름을 입력해주세요.
  birth : '', // 6글자로 입력해주세요.
  BackCode : '' // 동명이인을 구분하기 위한 장치로, Need aditCrtfcNo 에러가 뜨지 않는 이상 입력 할 필요는 없습니다.
}
```

`const StuInfo = {` 밑에 4가지 정보를 입력하는 칸이 보이실겁니다.
여기서 name, schoolName, birth를 먼저 입력해보세요.

정상적으로 실행이 되신다면 계속 쓰시면 되지만,

만약, `Need aditCrtfcNo` 오류가 뜬다면, BackCode를 입력해주세요.

**이제 저장하고 쓰시면 됩니다.**

### 최종 실행

Node.js가 설치되어있냐의 여부에 따라 다릅니다.
만약 설치되어있다면, 간단하게 `module-download.bat`를 실행하고, `run.bat`를 실행하면 자동으로 실행됩니다.

여러분이 리눅스, MacOS여도 상관 없습니다. 그저 파일 경로로 가서 `npm install`을 한번 입력하고, `node index` 한번만 입력해주세요.

**만약, Node.js가 없다면, [https://nodejs.org/ko/](https://) 로 접속해서 LTS라고 적힌 버튼을 클릭해서 다운로드 받으세요.
그리고 설치하시면 됩니다.**

### + 스케줄링으로 전자동 체크하기

먼저, 이 파일을 항상 실행하는 환경이 갖추어져 있어야 합니다.
이 부분을 해결하려면 Docker를 사용하시는 것을 추천합니다.

Docker를 설치하고 환경이 준비되었다면,
`node_modules` 폴더를 제외한 전체를 Docker container 내부에 넣어줍니다.

내부에 파일을 모두 넣고, Docker container를 콘솔로 접속하여,
`npm install` 을 한번 입력해줍니다.

모든 모듈의 설치가 끝났다면,
`node index`를 시작명령어로 지정하고 컨테이너를 재시작하세요.

### + 개발자라면,

자신이 Node.js 개발자라면, 아래 테이블을 참고해보세요.
좀더 다양한 기능을 입맛대로 골라 써보세요.

모든 IO는 자료형은 `String` 입니다.


| Function Name | Input/Output | Description |
| - | - | - |
| qstnEncrypt | (schulCode, pName, frnoRidno, aditCrtfcNo) / (null or false or qstnCrtfcNoEncpt) (null은 오류, false라면 aditCrtfcNo입력) | 학생정보를 암호화된 문자열로 변경합니다. pName은 이름, frnoRidno는 주민번호 앞 6자리, aditCrtfcNo는 뒤에서 2자리입니다. |
| qstnDecrypt | (qstnCrtfcNoEncpt) / (schulNm, stdntName, original) | 암호화된 학생정보를 다시 복호화합니다. 이는 자가진단 절차중 하나입니다. 따라서 이 작업을 실행하려면, 나중에 stateUpload를 한번 호출하는 것이 나을것입니다. |
| getSchulCode | (SchoolName) / (schulCode, original) | 학교 고유번호를 얻어옵니다. |
| stateUpload | (schulNm, stdntName, qstnCrtfcNoEncpt) / (null or true) | 학생정보를 기반으로 서버에 자가진단을 정상처리하도록 데이터를 전송합니다. |
| vaildUpload | (schulCode, pName, frnoRidno, aditCrtfcNo) / none | 지금까지의 함수를 모두 사용하여 지능적으로 자가진단 정상처리를 수행합니다. |
