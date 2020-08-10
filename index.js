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

// ENV
const __ENV = {
  debug: process.env.NODE_ENV == true ? true : false, // Debug mode.
  noHeadText: true,
  noLog: false,
  disableWarn: false, // turn off Warning Log.
}

if(noHeadText = false) { headTextLoad() }  
ClientLoad()

async function ClientLoad() {
  messageInfo('Checking...')
  // vaildUpload(StudentName: string, SchoolName: string, FrontCode: string, aditCrtfcNo: string)
  vaildUpload(StuInfo.name, StuInfo.schoolName, StuInfo.birth, StuInfo.BackCode)

  // Auto Execute function / docker +9 hour
  const j = schedule.scheduleJob('0 16-17 * * *', function(){
    vaildUpload(StuInfo.name, StuInfo.schoolName, StuInfo.birth, StuInfo.BackCode)
  })

  const j = schedule.scheduleJob('0 16-17 * * *', function(){
    vaildUpload(StuInfo.name, StuInfo.schoolName, StuInfo.birth, StuInfo.BackCode)
  })
}

async function getSchulCode(schulNm) {
  // Need Encrypted String
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: 'https://eduro.goe.go.kr/stv_cvd_co00_004.do',
        form: {
          schulNm: schulNm
        }
      }, (err, httpResponse, body) => {
        if (err) { reject('[POST ERROR] ' + err); } // Request Error Handling
        resolve(body)
      }
    )
  })
  
  .then((body) => {
    const ConvData = JSON.parse(body);
    switch (ConvData.resultSVO.data.rtnRsltCode) { // ConvData = Converted Data
  
      case undefined:
        messageError('invaild Encrypted String (Server)', 'getSchulCode > server');
        return null;
  
      case 'SUCCESS':
        let Result = {
          schulCode: ConvData.resultSVO.data.schulCode,
          original: ConvData.resultSVO.data.schulNm // Original Request String
        };
        messageDone('getSchulCode OK - ' + Result.schulCode + '/' + Result.original);
        return Result; // Return Data.
  
      default:
        messageError('Unexpected Response Error (Response : ' + ConvData.resultSVO.data.rtnRsltCode + ')', 'getSchulCode > server');
        return null;
    }
  })
  
  .catch((err)=>{
    messageError(err.stack, 'getSchulCode')
  })
}

async function qstnDecrypt(Enc) {
// Need Encrypted String
try {
  if(
    Enc &&
    Enc.includes('==') &&
    Enc.length == 24
  ){
    return new Promise((resolve, reject) => {
      request.post({
        url:'https://eduro.goe.go.kr/stv_cvd_co01_000.do', // POST URL
        form: {
          qstnCrtfcNoEncpt: Enc
        }
      }, function(err, httpResponse, body){
        if(err){messageError('[POST ERROR] '+err, 'qstnDecrypt')} // Request Error Handling
        const ConvData = JSON.parse(body)
        resolve(ConvData)
      })
    })
    
    .then((ConvData) => {
      switch (ConvData.resultSVO.data.rtnRsltCode){ // ConvData = Converted Data

        case 'CRTFC_NO_DECRYPT_ERROR':
          messageError('invaild Encrypted String (Server)', 'qstnDecrypt > server')
          return null
        
        case 'SUCCESS': 
          let Result = {
            schulNm : ConvData.resultSVO.data.schulNm, // School Name
            stdntName : ConvData.resultSVO.data.stdntName, // Student Name
            original : ConvData.resultSVO.data.qstnCrtfcNoEncpt // Original Request String
          }
          messageDone('qstnDecrypt OK - '+Result.schulNm+'/'+Result.stdntName+'/'+Result.original)
          return Result // Return Data.

      default:
        messageError('Unexpected Response Error (Response : '+ConvData.resultSVO.data.rtnRsltCode+')', 'qstnDecrypt > server')
        return null
      }
    })
    
  }else{
    messageError('invaild Encrypted String ('+Enc+')', 'qstnDecrypt > filter')
    return null
  }
}catch (err){
  messageError(err.stack, 'qstnDecrypt')
  return null
}
}

async function qstnEncrypt(schulCode, pName, frnoRidno, aditCrtfcNo) {
// Need Encrypted String
  if(
    schulCode.startsWith('J') &&
    schulCode.length == 10 &&
    frnoRidno.length == 6
  ){
    return new Promise((resolve, reject) => {
      request.post(
        {
          url:'https://eduro.goe.go.kr/stv_cvd_co00_012.do', // POST URL
          form: {
            schulCode: schulCode,
            pName: pName,
            frnoRidno: frnoRidno,
            aditCrtfcNo: aditCrtfcNo
          }
        }, function(err, httpResponse, body){
          if(err){messageError('[POST ERROR] '+err, 'qstnEncrypt')} // Request Error Handling
          const ConvData = JSON.parse(body)
          resolve(ConvData)
        }
      )
    })

    .then((ConvData) => {
      switch (ConvData.resultSVO.data.rtnRsltCode){ // ConvData = Converted Data
        case 'QSTN_USR_ERROR':
          messageError('invaild Input Data. tip: "j must changed J."', 'qstnEncrypt > server')
          return null

        case 'ADIT_CRTFC_NO':
          messageError('Need aditCrtfcNo. aditCrtfcNo is 000000-00000"00".', 'qstnEncrypt > server')
          return false

        case 'SUCCESS':
          messageDone('qstnEncrypt OK - '+ConvData.resultSVO.data.qstnCrtfcNoEncpt)
          return ConvData.resultSVO.data.qstnCrtfcNoEncpt

        default :
          messageError('Unexpected Response Error (Response : '+ConvData.resultSVO.data.rtnRsltCode+')', 'qstnEncrypt > server')
          return null
      }
    })

    .catch((err) => {
      messageError(err.stack, 'qstnEncrypt')
      return null
    })

  }else{
    messageError('invaild Input Data. tip: "j must changed J."', 'qstnEncrypt > filter')
    return null
  }
}

async function stateUpload(schulNm, stdntName, qstnCrtfcNoEncpt) {

const __CheckStartRangeText = '<p style="margin:5rem auto; line-height:3rem; text-align:center;">'
const __CheckEndRangeText = '<br/>'

request.post({
  url:'https://eduro.goe.go.kr/stv_cvd_co01_000.do', // POST URL
  form: {
    rtnRsltCode: 'SUCCESS',
    qstnCrtfcNoEncpt: qstnCrtfcNoEncpt,
    schulNm: schulNm,
    stdntName: stdntName,
    rspns01 : 1,
    rspns02 : 1,
    rspns07 : 0,
    rspns08 : 0,
    rspns09 : 0
  }
}, async function(err, httpResponse, body){
  if(err){messageError('[POST ERROR] '+err, 'qstnDecrypt')} // Request Error Handling
  const ConvData = JSON.parse(body)
  switch (ConvData.resultSVO.data.rtnRsltCode){ // ConvData = Converted Data

    case 'CRTFC_NO_DECRYPT_ERROR':
      messageError('invaild Encrypted String (Server)', 'qstnDecrypt > server')
      return null
    
    case 'SUCCESS': 
      let Result = {
        schulNm : ConvData.resultSVO.data.schulNm, // School Name
        stdntName : ConvData.resultSVO.data.stdntName, // Student Name
        original : ConvData.resultSVO.data.qstnCrtfcNoEncpt // Original Request String
      }
      messageDone('qstnDecrypt OK - '+Result.schulNm+'/'+Result.stdntName+'/'+Result.original)

      try {
        const body_2 = await new Promise((resolve, reject) => {
          request.post(
            {
              url: 'https://eduro.goe.go.kr/stv_cvd_co02_000.do',
              form: {
                rtnRsltCode: 'SUCCESS',
                qstnCrtfcNoEncpt: qstnCrtfcNoEncpt,
                schulNm: schulNm,
                stdntName: stdntName,
                rspns01: 1,
                rspns02: 1,
                rspns07: 0,
                rspns08: 0,
                rspns09: 0
              }
            },

            function (err_1, httpResponse_1, body_1) {
              if (err_1) { messageError('[POST ERROR] ' + err_1, 'stateUpload'); }
              else {
                resolve(body_1);
              } // Request Error Handling.
            }
          );
        });
        if (body_2.includes('코로나19 예방을 위한 자가진단 설문결과 의심 증상에 해당되는 항목이 없어 등교가 가능함을 안내드립니다.')) {
          messageDone('stateUpload OK. State OK.');
          return true;
        }
        else if (body_2.includes('코로나19 예방을 위한 자가진단 설문결과 의심 증상에 해당되는 항목이 없어 등교가 가능함을 안내드립니다.')) {
          messageError('stateUpload Failed. Please Check Parameter.');
          return null;
        }
        else {
          messageWarn('stateUpload OK. but Wrong State or Unexpected text Detected. Please Check rspns values or parser.');
          if (__AutoStop == true) { messageError('Autostop detected. Shutdown...'); }
          return null;
        }
      }
      catch (err_2) {
        messageError(err_2, 'stateUpload');
        return null;
      }

  default:
    messageError('Unexpected Response Error (Response : '+ConvData.resultSVO.data.rtnRsltCode+')', 'qstnDecrypt > server')
  }
})
}

async function vaildUpload(StudentName, SchoolName, FrontCode, BackCode) {
  new Promise((resolve, reject) => {
    // RunTime.run() // Runtime Check
    const gscData = getSchulCode(SchoolName)
    resolve(gscData)
  })

  .then(async function (gscData) {
    switch(gscData){
      case null:
        messageError('Invaild SchoolName Error.', 'gscData')
        break
      default:
        messageDone('EncTest OK.')
        return gscData
    }
  })

  .then(async function (gscData) {
    const EncTest = await qstnEncrypt(gscData.schulCode, StudentName, FrontCode, BackCode)
    return EncTest
  })

  .then((EncTest) => {
    switch(EncTest){
      case null:
        reject('Invaild Value Error.')
        break
      case false:
        reject('Need BackCode. Please type BackCode.')
        break
      default:
        messageDone('DecTest OK. '+EncTest)
        return EncTest
    }
  })

  .then(async function (EncTest) {
    const DecTest = await qstnDecrypt(EncTest)

    if(DecTest.schulNm){
      messageDone('DecTest OK.')
      return EncTest
    }else if (DecTest.isNull()){
      messageError('Invaild Value Error. (DecTest)', 'DecTest')
    }else{
      messageError('Unexpected Error. (DecTest)', 'DecTest')
    }
  })

  .then(async function (Enc) {
    const FinalResult = await stateUpload(SchoolName, StudentName, Enc)
    return FinalResult
  })
}

// HEAD TITLE
function headTextLoad () {
  const TextLine = [
    ' ',
    ' ',
    '   ██████╗ ██████╗ ██████╗  ██████╗ ███╗   ██╗ █████╗ ███████╗',
    '  ██╔════╝██╔═══██╗██╔══██╗██╔═══██╗████╗  ██║██╔══██╗██╔════╝',
    '  ██║     ██║   ██║██████╔╝██║   ██║██╔██╗ ██║███████║█████╗  ',
    '  ██║     ██║   ██║██╔══██╗██║   ██║██║╚██╗██║██╔══██║██╔══╝  ',
    '  ╚██████╗╚██████╔╝██║  ██║╚██████╔╝██║ ╚████║██║  ██║██║     ',
    '   ╚═════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ',
    ' ',
    'CREATED BY ANTEGRAL - VERSION 1.2.4200807',
    ' ',
    '====================================================================================================',
    ' '
  ]
  for (let i = 0; i < TextLine.length; i++) {
    console.log(chalk.magenta.bold(TextLine[i]))
  }

  if (__ENV.debug === true){
    messageWarn('WORKING ON DEBUG MODE')
  }
}

// ERROR HANDLING
function messageError(msg, head, isStop) {
if (!msg) { console.error(chalk.bgRed.bold('[ERR!]') + chalk.red.bold(' CALLED messageError but, msg is undefind')) } else {
  if (head && msg){
    console.error(chalk.bgRed.bold('[ERR!]') + chalk.red.bold(' (' +moment().format('YYYY-MM-DD HH:mm:ss') + ') ' + head) + chalk.red(' =>\n' + msg))
  }else{
    console.error(chalk.bgRed.bold('[ERR!]') + chalk.red(' UNDEFIND MESSAGE \n' + msg))
  }
  if (isStop === true) { throw(chalk.bgRed.bold('[!FATAL ERROR!]') + chalk.red.bold(' ' + head) + chalk.red(' >\n' + msg)) }
}
}
  
// INFO HANDLING
function messageInfo(msg) {
  noLog ? null : console.info(chalk.bgBlue.bold('[INFO]') + chalk.gray.bold(' (' +moment().format('YYYY-MM-DD HH:mm:ss') + ')') + chalk.blue(' ' + msg))
}

// DATA HANDLING
function messageData(msg) {
  noLog ? null : console.info(chalk.bgCyan.bold('[DATA]') + chalk.gray.bold(' (' +moment().format('YYYY-MM-DD HH:mm:ss') + ')') + chalk.cyan(' ' + msg))
}

// WARN HANDLING
function messageWarn(msg) {
  console.log(chalk.gray.bgYellow.bold('[WARN]') + chalk.gray.bold(' (' +moment().format('YYYY-MM-DD HH:mm:ss') + ')') + chalk.yellow(' ' + msg))
}

// DONE HANDLING
function messageDone(msg) {
  noLog ? null : console.log(chalk.bgGreen.bold('[DONE]') + chalk.gray.bold(' (' +moment().format('YYYY-MM-DD HH:mm:ss') + ')') + chalk.green(' ' + msg))
}

function nowTime(){ return moment().format('YYYY-MM-DD HH:mm:ss') }