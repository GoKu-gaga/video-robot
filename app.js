const express = require('express')
const env2 = require('env2')
const sha1 = require('sha1')
const Xml2js = require('xml2js')
const xmlParser = require('express-xml-bodyparser')

env2('./.env')

const {
  PORT,
  TOKEN
} = process.env

const app = express()
const xmlBuilder = new Xml2js.Builder({
  rootName: 'xml',
  headless: true
})

app.get('/', function (req, res) {
  const {
    signature,
    timestamp,
    nonce,
    echostr
  } = req.query

  const tempStr = [TOKEN, timestamp, nonce].sort().join('')

  if (sha1(tempStr) === signature) {
    res.send(echostr)
    return
  }
  res.send('')
})

app.post('/', xmlParser({
  trim: false,
  explicitArray: false
}), function (req, res) {
  const {
    tousername,
    fromusername,
    createtime,
    msgtype,
    content,
    msgid
  } = req.body.xml

  const resBody = {
    ToUserName: `<![CDATA[${fromusername}]>`,
    FromUserName: `<![CDATA[${tousername}]>`,
    CreateTime: Date.now(),
    MsgType: `<![CDATA[text]>`,
    Content: `<![CDATA[${content}]>`
  }

  res.send(xmlBuilder.buildObject(resBody))
})

app.listen(PORT, () => console.log(`app listening on port ${PORT}!`))
