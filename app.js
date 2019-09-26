const express = require('express')
const axios = require('axios')
const env2 = require('env2')
const sha1 = require('sha1')
const xmlParser = require('express-xml-bodyparser')

env2('./.env')

const {
  PORT,
  TOKEN
} = process.env

const app = express()

app.use(require('express-logs')())

app.get('/', function (req, res) {
  req.logs.log('GET request start.')
  req.logs.log(`GET request query: ${JSON.stringify(req.query)}`)
  const {
    signature,
    timestamp,
    nonce,
    echostr
  } = req.query
  
  const tempStr = [TOKEN, timestamp, nonce].sort().join('')
  
  if (sha1(tempStr) === signature) {
    res.send(echostr)
    req.logs.log('GET request end.')
    return
  }
  res.send('')
  req.logs.log('GET request end.')
})

app.post('/', xmlParser({
  trim: false,
  explicitArray: false
}), async function (req, res) {
  req.logs.log('POST request start.')
  req.logs.log(`POST request body: ${JSON.stringify(req.body.xml)}`)
  const {
    tousername,
    fromusername,
    createtime,
    msgtype,
    content,
    msgid
  } = req.body.xml

  const result = await axios('https://happyukgo.com/api/video/?cached&lang=ch&hash=387af990271603ad18bde53048cce322&video=' + content).catch(err => err)
  const data = result.data

  let retContent = ''
  if (data && Array.isArray(data.urls)) {
    const urls = data.urls
    const len = urls.length
    retContent = `视频片段 1： ${urls[0]} \n\n 还有其它 ${len - 1} 段视频片段,请到 https://weibomiaopai.com 获取完整列表!`
  } else if (data && data.url) {
    retContent = `视频地址: ${data.url}`
  } else {
    retContent = '无法下载视频, 请到官网: https://weibomiaopai.com';
  }

  const resBody = `
    <xml>
      <ToUserName><![CDATA[${fromusername}]]></ToUserName>
      <FromUserName><![CDATA[${tousername}]]></FromUserName>
      <CreateTime>${parseInt(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${retContent}]]></Content>
    </xml>
  `
  req.logs.log(`POST response body: ${resBody}`)
  res.set('Content-Type', 'text/xml')
  res.send(resBody)
  req.logs.log('POST request end.')
})

app.listen(PORT, () => console.log(`app listening on port ${PORT}!`))
