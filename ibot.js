let img1;
let result2;
let reactionY = { '📁': 'גמרא', '📂': 'אנגלית', '📖': 'מחשבת ישראל', '📚':'ספרות'};
let reactionR = { 'גמרא': '📁', 'אנגלית': '📂', 'מחשבת ישראל': '📖', 'ספרות':'📚' };

const Discord = require('discord.js');
const axios = require('axios');
const FormData = require('form-data');
const cron = require('cron');
const firebase = require('firebase-admin');
const fetch = require('node-fetch');
let  { Client } = require('node-mashov');
const { htmlToText } = require('html-to-text');
const Gematria = require('gematria');
const pdf2img = require('pdf-img-convert');

const firebaseConfig = {
    "type": "service_account",
    "project_id": process.env.PROJECTID,
    "private_key_id": process.env.PRIVATEKEYID,
    "private_key": process.env.PRIVATEKEY.replace(/\\n/g, '\n'),
    "client_email": process.env.CLIENTEMAIL,
    "client_id": process.env.CLIENTID,
    "auth_uri": process.env.AUTHURI,
    "token_uri": process.env.TOKENURI,
    "auth_provider_x509_cert_url": process.env.AUTHPROVIDER,
    "client_x509_cert_url": process.env.CLIENTCERT
  };

firebase.initializeApp({
    credential: firebase.credential.cert(firebaseConfig),
    databaseURL: process.env.DATABASEURL
  });

const client = new Discord.Client();
client.login(process.env.BOTTOKEN);
const Mashov = new Client();
const school = {id: 442319,name: 'ישיבת צביה קטיף - יד בנימין',years: [2012, 2013, 2014, 2015, 2016, 2017,2018, 2019, 2020,2021]};

async function loginMashov(){
    await Mashov.login({
        username: process.env.MASHOVUSER,
        password: process.env.MASHOVPASS,
        year: school.years[school.years.length - 1],
        school
      }) 
}; 


client.on('ready', readyDiscord);
firebase.database().ref('/').on('value',getData,errData);
let servers = {};

function readyDiscord() {
    console.log('bot ready');
}


function getData(data){
botData = data.val();
}
    
 function errData(err){
 console.log(err);
 }

let scheduledMessage = new cron.CronJob('29 9-16 * * 1', () => {
    let channelM = client.channels.cache.get('779330728608792579');
    findLesson(channelM, true);
});
let scheduledMessage2 = new cron.CronJob('14 9-15 * * 3,4,0', () => {
    let channelM = client.channels.cache.get('779330728608792579');
    findLesson(channelM, true);
});

let scheduledMessage3 = new cron.CronJob('30 6 * * 0-5', () => {
    let channelM = client.channels.cache.get('779330728608792579');
    sendGif('Good Morning',channelM);
});

const Help = new Discord.MessageEmbed()
    .setColor('#2c6bd7')
    .setTitle('שלח את הפקודה:')
    .setDescription('``תיקתק <6 ספרות של מספר הפריט>`` 👇')
    .setImage('https://i.imgur.com/vBjy5YH.jpg')
    .setAuthor('Help', 'https://icons.iconarchive.com/icons/visualpharm/must-have/256/Help-icon.png');

    const HelpDafYomi = new Discord.MessageEmbed()
    .setColor('#2c6bd7')
    .setTitle('שלח את הפקודה:')
    .setDescription('``הדף היומי מסכת X דף X``')
    .setAuthor('Help', 'https://icons.iconarchive.com/icons/visualpharm/must-have/256/Help-icon.png');

scheduledMessage3.start();

function queueDafYomi(queue,msg){
    let arrFields = [];
    let index = 0;
    if(!queue[0]){
        return;
    }
   for(let media of queue){
    arrFields.push(` **${index}** . מגיד: ${media.ma} |  ${media.lnk.match(/\(([^)]+)\)/)[1]}`);
    index++;
   }
   const dafYomiEmbed = new Discord.MessageEmbed()
      .setTitle(`מסכת ${queue[0].m} דף ${queue[0].d}`)
      .setColor('#e5cd77');

    if(arrFields.length === 1){
        dafYomiEmbed.addFields(
            { name: 'משמיע: 🔊', value: `מגיד: ${queue[0].ma} |  ${queue[0].lnk.match(/\(([^)]+)\)/)[1]}`, inline: false }
        );
    }else{
        dafYomiEmbed.addFields(
            { name: 'משמיע: 🔊', value: `מגיד: ${queue[0].ma} |  ${queue[0].lnk.match(/\(([^)]+)\)/)[1]}`, inline: false },
            { name: 'הבא בתור: ⏭', value: arrFields.slice(1,arrFields.length).join('\n\n'), inline: false },
        );
    }
      msg.channel.send(dafYomiEmbed);
  }

async function getBuffer(url){
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
}


async function getInbox(channelM){
    let mail = await Mashov.getConversations('inbox',1,0);
    if(mail[0].id === botData.conversationId) return;
   
    firebase.database().ref('conversationId').set(mail[0].id);
    let mailbody = await Mashov.getConversation(mail[0].id);
    let title = mailbody.subject;
    let lastUpdate = mailbody.messages[0].timestamp;
    let senderName = mailbody.messages[0].sender;
    let content = htmlToText(mailbody.messages[0].body, {
        wordwrap: 130
      });
      const  mashovEmbed = new Discord.MessageEmbed()
      .setColor('#106030')
      .setTitle(title)
      .setAuthor('Mashov', 'https://web.mashov.info/students/images/logo_students.png')
      .setDescription(content)
      .setTimestamp(lastUpdate)
      .setFooter(`מאת: ${senderName}`);
      let arrfiles = [];
    if(mailbody.hasAttachments){
        for(let i = 0 ; i<mailbody.messages[0].attachments.length ; i++ ){
            let url = `https://web.mashov.info/api/mail/messages/${mailbody.messages[0].id}/files/${mailbody.messages[0].attachments[i].id}/download/${encodeURI(mailbody.messages[0].attachments[i].name)}`;
            arrfiles.push(url);
        }
        mashovEmbed.attachFiles(arrfiles,mailbody.messages[0].attachments[0].name);
    }
    channelM.send(mashovEmbed);
}

async function GetSolutions(bookObj,page,question,sq = null) {
    let promis = await fetch('https://tiktek.com/il/services/SolutionSearch.asmx/GetSolutionsEx',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Accept-Language':'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept':'application/json, text/javascript, */*; q=0.01',
        },
        body: JSON.stringify({bookID: bookObj.ID, page: page, question: question, sq: sq, ssq: null, userID: null})
    })
    let json = await promis.json();
    return json;
}

async function dafYomi(daf,massechet){
    let url = `http://www.daf-yomi.com/AjaxHandler.ashx?medialist=1&pagesize=5&page=1&massechet=${massechet}&medaf=${daf}&addaf=${daf}&safa=1&maggid=&chofshi=&sort=massechet&dir=1&ro=1614616432944`;
    let promis = await fetch(url,{
        method: 'GET',
        headers: {
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language':'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept':'application/json, text/javascript, */*; q=0.01',
        }
    })
    let json = await promis.json();
    return json;
}

 function playServer(connection,server){
              server.dispatcher = connection.play(server.queue[0].k);
                server.queue.shift();
                
                server.dispatcher.on('finish', () => {
                    if(server.queue[0]){
                      playServer(connection,server);
                    }else{
                        connection.disconnect();
                    }
                    
                });
                server.dispatcher.on('error', console.error);
}

function buildTest(date, type, material, heDate, msg) {
    const EmbedTest = new Discord.MessageEmbed()
        .setColor('#59BB8E')
        .setTitle('מבחן ב' + type)
        .setURL()
        .setDescription('תאריך עברי - ' + heDate + '\n\n' + 'תאריך לועזי - ' + date)
        .addField('חומר ללימוד:', material, true)
        .setAuthor('Test', 'https://i.imgur.com/gOntclL.png')
    msg.channel.send(EmbedTest).then(async embedMessage => {
        let e = reactionR[type];
        await embedMessage.react(e);
    });
}

async function sendGif(KeyWord,channelM){
    let tenorAPI = `https://api.tenor.com/v1/search?q=${KeyWord}&key=${process.env.TENORKEY}&contentfilter=high`;
    let response = await fetch(tenorAPI);
    let json = await response.json();
    let index = Math.floor(Math.random()* json.results.length);
    channelM.send('בוקר טוב!');
    channelM.send(json.results[index].url);
}

function Capsules(id) {
    let T;
    for (let S of botData.student) {
        if (id === S.id) {
            T = S.type;
        }
    }
    return T;
}
function findLesson(channelM, everyone) {
    let date = new Date();
    if (date.getDay() === 6) {
        channelM.send('יום שבת מנוחה 🙂');
    } else {
        let code = `${date.getHours()}${date.getMinutes()}`;
        if (date.getMinutes() < 10) {
            code = `${date.getHours()}0${date.getMinutes()}`
        }
        let Lesson;
        let zoomUrl;
        let zoomUrl2;
        let type;
        let time;

        for (let hour of botData.Schedule[date.getDay()]) {

            if (code < parseInt(hour.time.replace(":", ""))) {
                if (hour.ZoomUrl > '') {
                    Lesson = hour.Lesson;
                    zoomUrl = hour.ZoomUrl;
                    zoomUrl2 = hour.ZoomUrl2;
                    time = hour.time;
                    type = 'סינכרוני';
                } else {
                    Lesson = hour.Lesson;
                    time = hour.time;
                    type = 'אסינכרוני';
                }

            }
            if (Lesson > '') {
                break;
            }
        }

        build(Lesson, zoomUrl, zoomUrl2, time, type, channelM, everyone);
    }
}
function build(Lesson, zoomUrl, zoomUrl2, time, type, channelM, everyone) {
    let str = '';
   
const EmbedZoom = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('הקישור לזום')
    .setURL(zoomUrl)
    .setDescription(Lesson + ' :מתחיל בשעה -' + time)
    .setAuthor('Zoom', 'https://is2-ssl.mzstatic.com/image/thumb/Purple124/v4/bc/a0/40/bca040c3-85d7-d00c-dba0-56aaca9f3779/source/512x512bb.png')

const EmbedZoom2 = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setDescription(Lesson + ' :מתחיל בשעה -' + time)
    .setTitle('הקישור לזום - מגמת פיזיקה')
    .setURL(zoomUrl2)
    .setAuthor('Zoom', 'https://is2-ssl.mzstatic.com/image/thumb/Purple124/v4/bc/a0/40/bca040c3-85d7-d00c-dba0-56aaca9f3779/source/512x512bb.png')

const EmbedZoom4 = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setDescription(Lesson + ' :מתחיל בשעה -' + time)
    .setTitle('הקישור לזום - מגמת מחשבים')
    .setURL(zoomUrl)
    .setAuthor('Zoom', 'https://is2-ssl.mzstatic.com/image/thumb/Purple124/v4/bc/a0/40/bca040c3-85d7-d00c-dba0-56aaca9f3779/source/512x512bb.png')

const EmbedZoom5 = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setDescription(Lesson + ' :מתחיל בשעה -' + time)
    .setTitle('הקישור לזום - 5 יחידות')
    .setURL(zoomUrl2)
    .setAuthor('Zoom', 'https://is2-ssl.mzstatic.com/image/thumb/Purple124/v4/bc/a0/40/bca040c3-85d7-d00c-dba0-56aaca9f3779/source/512x512bb.png')

const EmbedZoom6 = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setDescription(Lesson + ' :מתחיל בשעה -' + time)
    .setTitle('הקישור לזום - 4 יחידות')
    .setURL(zoomUrl)
    .setAuthor('Zoom', 'https://is2-ssl.mzstatic.com/image/thumb/Purple124/v4/bc/a0/40/bca040c3-85d7-d00c-dba0-56aaca9f3779/source/512x512bb.png')

const EmbedZoom7 = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setDescription(Lesson + ' :מתחיל בשעה -' + time)
    .setTitle('הקישור לזום - המורה נעמי')
    .setURL(zoomUrl)
    .setAuthor('Zoom', 'https://is2-ssl.mzstatic.com/image/thumb/Purple124/v4/bc/a0/40/bca040c3-85d7-d00c-dba0-56aaca9f3779/source/512x512bb.png')

const EmbedZoom8 = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setDescription(Lesson + ' :מתחיל בשעה -' + time)
    .setTitle('הקישור לזום - המורה קרוליין')
    .setURL(zoomUrl2)
    .setAuthor('Zoom', 'https://is2-ssl.mzstatic.com/image/thumb/Purple124/v4/bc/a0/40/bca040c3-85d7-d00c-dba0-56aaca9f3779/source/512x512bb.png')

const EmbedZoom3 = new Discord.MessageEmbed()
    .setColor('#e07b39')
    .setDescription(Lesson + ' :מתחיל בשעה -' + time)
    .setTitle('שיעור אסינכרוני')
    .setAuthor('Moodle', 'https://is5-ssl.mzstatic.com/image/thumb/Purple124/v4/a5/c3/70/a5c37089-63fa-3c67-63de-3e000bd65027/source/512x512bb.png')

if (type === 'סינכרוני' && Lesson == 'מגמות') {
    channelM.send(str ,EmbedZoom2);
    channelM.send(str ,EmbedZoom4);
} else if (type === 'סינכרוני' && Lesson == 'מתמטיקה') {
    channelM.send(str, EmbedZoom5);
    channelM.send(str, EmbedZoom6);
} else if (type === 'סינכרוני' && Lesson == 'אנגלית') {
    channelM.send(str, EmbedZoom7);
    channelM.send(str, EmbedZoom8);
} else if (type === 'סינכרוני') {
    channelM.send(str, EmbedZoom);
}



if (type === 'אסינכרוני') {
    channelM.send(str, EmbedZoom3);
}
if (type !== 'אסינכרוני' && type !== 'סינכרוני') {
    channelM.send('הסתיימו השיעורים להיום. תהנו🤗');
    }
}
client.on('messageReactionAdd', (reaction, user) => {
    let message = reaction.message, emoji = reaction.emoji;
    if (user.bot !== true) {
        for (let emojiT of botData.tests) {
            if (emojiT.type === reactionY[emoji.name] && emojiT['files'] !== undefined) {
                user.send(emojiT['files']);
            } else if (emojiT['files'] == undefined && emojiT.type === reactionY[emoji.name]) {
                message.channel.send('לא נמצאו קבצים');
            }
        }
    }
});
client.on('message', async msg  =>  {
    try {
        if (msg.author.bot) return;
        if (msg.content == 'השיעור הבא' || msg.content == 'שיעור הבא' || msg.content == 'מה השיעור הבא') {
            channelM = msg.channel;
            findLesson(channelM, false);
        }

        if (msg.content.startsWith('טל')) {
            let foo = msg.content;
            let number;
            let teacher;
            let profession;
            foo = foo.replace("טל ", "");
            foo = foo.replace("המורה ל", "");
            foo = foo.replace("המורה ", "");
            foo = foo.replace("הרב ", "");

            for (let number1 of botData.Phones) {
                if (number1.teacher.split(" ").includes(foo) === true || number1.profession.split(" ").includes(foo) === true) {
                    number = number1.number;
                    teacher = number1.teacher;
                    profession = number1.profession;
                    const EmbedContact = new Discord.MessageEmbed()
                        .setColor('#5be052')
                        .setTitle('whatsapp - שוחח ב')
                        .setURL('https://api.whatsapp.com/send?phone=972' + number + '&source=&data=&app_absent=')
                        .setDescription(teacher + ' - ' + profession)
                        .setAuthor('contact', 'https://banner2.cleanpng.com/20180328/tow/kisspng-iphone-facetime-computer-icons-computer-software-call-5abc5e41380535.8492973415222943372295.jpg')
                    msg.channel.send(EmbedContact);
                }

            }
            if (number === undefined) {
                msg.channel.send('לא נמצאו תוצאות');
            }
        }

        if (msg.content === 'המערכת של היום' || msg.content === 'מערכת להיום' || msg.content === 'המערכת להיום' || msg.content === 'מערכת של היום') {
            let dateimg = new Date();
            let img1 = botData.img[dateimg.getDay()];
            const EmbedImg = new Discord.MessageEmbed()
                .setImage(img1)
            msg.channel.send(EmbedImg);
        }

        if (msg.content === 'המערכת של מחר' || msg.content === 'מערכת למחר' || msg.content === 'המערכת למחר' || msg.content === 'מערכת של מחר') {
            let dateimg = new Date();
            dateimg = dateimg.getDay();
            if (dateimg === 6) {
                dateimg = 0;
                img1 = botData.img[dateimg];
            } else {
                img1 = botData.img[dateimg + 1];
            }
            const EmbedImg = new Discord.MessageEmbed()
                .setImage(img1)
            msg.channel.send(EmbedImg);
        }

        if(msg.content.startsWith('תיקתק')){
            let key = msg.content.split(' ');
            if(key.length > 1){
                if(parseInt(key[1]) === 0){
                  msg.reply('מספר פריט שאינו תקין');
                }else{
              (async() => {
                  let bookObj = botData.BookData.find(book => book.itemNumber === key[1])
                  if(bookObj === undefined){
                      const msgError = new Discord.MessageEmbed()
                    .setTitle('הספר אינו נמצא במאגר')
                    .setDescription('נשלחה בקשה לעדכון הספר,תודה! 👍')
                    .setColor('#F9360C')
                      firebase.database().ref('MissingBooks').push({id: msg.content.replace("תיקתק ",'')})
                      msg.reply('',msgError);
                   }else{
                  const tiktekEmbed = new Discord.MessageEmbed()
                    .setTitle("הכנס: `עמוד x שאלה x (סעיף x)`")
                    .setAuthor('Tiktek', `https://lh3.googleusercontent.com/GoZivKsWYOiUEqizHWOIiqmcu9iNOfym9DF6sLhXPkwuC4R6nRsaak8YbrKix059TA=s141-rw`)
                    .setThumbnail(`${bookObj.Image}`)
                    .setColor('#355D8D')
                    .addFields(
                      { name: 'עמודים', value: `${bookObj.PMin}-${bookObj.PMax}`, inline: true },
                      { name: 'מוציא לאור', value: `${bookObj.Pub}`, inline: true },
                  )
                  msg.channel.send(tiktekEmbed);
  
                  msg.channel.awaitMessages(async m =>  m.author.id == msg.author.id,
                      {max: 1, time: 60000}).then(async collected  => {
                          let page = collected.first().content.split(' ')[1];
                          let section = collected.first().content.split(' ')[3];
                          let sq = collected.first().content.split(' ')[5];
                              if (page != null) {
                    let solutions =  await GetSolutions(bookObj,page,section,sq);
                    let length = solutions.d.ResultData.length;
                 if(length === 0){
                  msg.channel.send("לא נמצאו פתרונות");
                 }else {
                     if(length > 9){
                      length = 9;
                     }
                     for(let data of solutions.d.ResultData){
                      const tiktekEmbed = new Discord.MessageEmbed()
                    .setTitle(`פתרון לעמוד ${data.Page} שאלה ${data.Question}`)
                    .setAuthor('Tiktek', `https://lh3.googleusercontent.com/GoZivKsWYOiUEqizHWOIiqmcu9iNOfym9DF6sLhXPkwuC4R6nRsaak8YbrKix059TA=s141-rw`)
                    .setImage(`https://tiktek.com/il/tt-resources/solution-images/${data.Prefix}_${data.BookID}/${data.Image}`)
                    .setColor('#355D8D')
                    .addFields(
                      { name: 'הועלה ע"י:', value: `${data.UserName}`, inline: true },
                      { name: 'דירוג', value: `${data.Correct}`, inline: true },
                      
                  )
                  .setFooter('© Tiktek Learning 2021')
                  msg.channel.send(tiktekEmbed);
                  length--;
                  if(length === 0){
                      break;
                  }
                     }
                     
                 }       
                    }else{
                      msg.reply('הכנס נתונים שנית'); 
                    }
                    
                      }).catch(() => {
                          msg.reply('הפעולה התבטלה אחרי 60 שניות');
                  });
              }
              })();
          }
            }else{
              msg.reply(Help);
            }
            
        }

        if(msg.content.startsWith('הדף היומי') || msg.content.startsWith('דף יומי')){
            let details = msg.content.split(' מסכת ');

            if(details.length !== 2){
               msg.reply(HelpDafYomi);
               return;
             }
            details = details[1].split(' דף ');

           if(details.length !== 2){
             msg.reply(HelpDafYomi);
             return;
           }

           if (!msg.member.voice.channel) {
               msg.reply('You must be in a voice channel 🔉');
               return;
           }

           if(!servers[msg.guild.id]){
               servers[msg.guild.id] = {queue: []};
           }
             let server = servers[msg.guild.id];
             let massechet = botData.Massahot.find(Massahot => Massahot.Name === details[0]);
             let daf = Gematria(details[1]).toMisparGadol();
             let list =  await dafYomi(daf,massechet.Id);
             if(list.length === 0){
               msg.reply('לא נמצאו שיעורים 👀');
               return;
             }
             
             for(let media of list){
                 if(media.dur){
                   server.queue.push(media);
                 }
             }
           
           if(!msg.guild.VoiceConnection){
               queueDafYomi(server.queue,msg);
               const connection = await msg.member.voice.channel.join();
                playServer(connection,server);
           }
             
         }


          if(msg.content === 'דלג'){
             let server = servers[msg.guild.id];
             if(server)
              if(server.dispatcher){
                server.dispatcher.end();
                queueDafYomi(server.queue,msg);
              }
          }

          if(msg.content === 'סיים'){
            let server = servers[msg.guild.id];
            if(server)
            if(server.dispatcher){
                for(let i = server.queue.length -1 ; i>=0 ; i--){
                    server.queue.splice(i,1);
                }
                server.dispatcher.end();
                if(msg.member.voice.connection){
                    msg.member.voice.connection.disconnect();
                    msg.channel.send('👍'); 
                }   
            }     
          }

          if(msg.content === 'עצור'){
            let server = servers[msg.guild.id];
            if(server)
            if(server.dispatcher){
            server.dispatcher.pause(true);
            msg.channel.send('stopped ▶️');
            }
          }

          if(msg.content === 'המשך'){
            let server = servers[msg.guild.id];
            if(server)
            if(server.dispatcher){
            server.dispatcher.resume();
            msg.channel.send('continue ⏸');
            }
          }

        if (msg.content === 'קפסולות') {
            for (let img of botData.CapsulesImg) {
                const EmbedCapsules = new Discord.MessageEmbed()
                    .setImage(img)
                msg.channel.send(EmbedCapsules);
            }
            result2 = Capsules(msg.author.id);
            msg.reply('אתה בקפסולה - ' + result2);
        }

        if (msg.content.startsWith("קפסולה")) {
            let imgA;
            let strC = msg.content;
            strC = strC.replace("קפסולה ", "");
            if (strC === 'א') {
                imgA = botData.CapsulesImg[0];
            } else if (strC === 'ב') {
                imgA = botData.CapsulesImg[1];
            } else {
                msg.reply('הכנס קפסולה נכונה');
                return;
            }

            const EmbedCapsules = new Discord.MessageEmbed()
                .setImage(imgA)
            msg.channel.send(EmbedCapsules);
            result2 = Capsules(msg.author.id);
            if (result2 !== strC) {
                msg.reply('אתה בקפסולה - ' + result2 + "\nמתעניין לעבור קפסולה?😏");
            } else {
                msg.reply('אתה בקפסולה - ' + result2);
            }

        }

        if(msg.content.startsWith('עזרה תיקתק')){
            msg.channel.send(Help);
        }

        if (msg.content.startsWith('אימייל')) {
            let e = msg.content;
            let email;
            e = e.replace("אימייל ", "");
            e = e.replace("המורה ל", "");
            e = e.replace("המורה ", "");
            e = e.replace("הרב ", "");

            for (let number2 of botData.Emails) {
                if (number2.teacher.split(" ").includes(e) || number2.profession.split(" ").includes(e)) {
                    email = number2.email;
                    msg.channel.send(email);
                }
            }
            if (email === undefined) {
                msg.channel.send('לא נמצאו תוצאות');
            }
        }

        if (msg.content === 'המבחן הבא'|| msg.content === 'מבחן הבא') {
            
            if (botData.tests.length <= 0) {
                msg.channel.send('אין מבחנים קרובים');
            } else if (botData.tests.length > 0) {
                let date = botData.tests[0].date;
                let heDate = botData.tests[0].hedate;
                let type = botData.tests[0].type;
                let material = botData.tests[0].material;
                buildTest(date, type, material, heDate, msg);
            }

        }

        if ((/^[0-9]/).test(msg.content)) {
            if (msg.content.split(" ").includes('המבחנים') === true) {
                let index = msg.content.replace("המבחנים הבאים", "");
                index = parseInt(index);
                
                if (botData.tests.length <= 0) {
                    msg.channel.send('אין מבחנים קרובים');
                } else if (botData.tests.length > 0) {
                    let date;
                    let heDate;
                    let type;
                    let material;
                    for (let i = 0; i < index; i++) {
                        date = botData.tests[i].date;
                        heDate = botData.tests[i].hedate;
                        type = botData.tests[i].type;
                        material = botData.tests[i].material;
                        buildTest(date, type, material, heDate, msg);
                    }
                }
            }
        }

        if(msg.content === '!pdf' && msg.author.id == '682520312818302987'){
            let outputImages1 = await pdf2img.convert('http://www.daf-yomi.com/Data/UploadedFiles/DY_Page/845.pdf',{width: 1300 ,height: 1300 ,page_numbers: [1],base64: false});
            const buffer = Buffer.from(outputImages1[0]);
            const  pdf = new Discord.MessageEmbed()
         .attachFiles(buffer)
          msg.channel.send(pdf);
        }
        
        if(msg.content === 'צור הודעה'){
            const message = new Discord.MessageEmbed()
            .setTitle('חוקי שרת ישיבת צביה קטיף')
            .setDescription("\nאין להעליב/לקלל/להשפיל או לפגוע באף אחד ■\n\nאסור לריב/להציק ■\n\nאין להספים ■\n\nנא לא לתייג בלי סיבה ■\n\nאין לפרסם שרתי דיסקורד ■\n\nנא לא להזמין לשרת אנשים שלא מהכיתה ■\n")
            .setAuthor('Rules', `https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Note_icon.svg/1200px-Note_icon.svg.png`)
            .setColor('#F9360C')
            msg.channel.send(message);
        }

        if (msg.content === 'כל המבחנים הקרובים' || msg.content === 'כל המבחנים הבאים'|| msg.content === 'המבחנים הבאים') {
           
            if (botData.tests.length <= 0) {
                msg.channel.send('אין מבחנים קרובים');
            } else if (botData.tests.length > 0) {
                let date;
                let type;
                let material;
                let heDate;
                for (let tests of botData.tests) {
                    date = tests.date;
                    heDate = tests.hedate;
                    type = tests.type;
                    material = tests.material;
                    buildTest(date, type, material, heDate, msg);
                }
            }
        }
        
        if(msg.content === '!getinbox' && msg.author.id == '682520312818302987'){
            (async ()=>{
                await loginMashov();
                await Mashov.setAuthDetails(await Mashov.getAuthDetails());
               let channelM = client.channels.cache.get('779330728608792579');
                await getInbox(channelM);
            })()
           }
        
        if (msg.content === '!stop msg') {
            scheduledMessage.stop();
            scheduledMessage2.stop();
            msg.reply('scheduled Message stopped');
        }
        if (msg.content === '!start msg' ) {
            scheduledMessage.start();
            scheduledMessage2.start();
            msg.reply('scheduled Message Started');
        }


        if (!(/[\u0590-\u05FF]/).test(msg.content)) {
            data = new FormData();
            data.append('text', msg.content);
            data.append('lang', 'en');
            data.append('mode', 'standard');
            data.append('api_user', '1098999894');
            data.append('api_secret', process.env.APISECRET);

            axios({
                url: 'https://api.sightengine.com/1.0/text/check.json',
                method: 'post',
                data: data,
                headers: data.getHeaders()
            })
                .then(function (response) {
                    if (response.data.profanity.matches[0] !== undefined) {
                        let type = response.data.profanity.matches[0].type;
                        if (type === 'insult' || type === 'sexual' || type === 'inappropriate' || type === 'discriminatory' || type === 'other_profanity') {
                            msg.delete()
                                .then(msg => console.log(`Deleted message from ${msg.author.username}`))
                                .catch(console.error);
                        }
                    }
                })
                .catch(function (error) {
                    if (error.response) console.log(error.response.data);
                    else console.log(error.message);
                });
        }
    } catch (error) {
        console.error(error)
    }
});
