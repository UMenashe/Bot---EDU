let img1;
let result2;
let reactionY = { '📁': 'גמרא', '📂': 'אנגלית', '📖': 'מחשבת ישראל', '📚':'ספרות'};
let reactionR = { 'גמרא': '📁', 'אנגלית': '📂', 'מחשבת ישראל': '📖', 'ספרות':'📚' };

const Discord = require('discord.js');
const axios = require('axios');
const FormData = require('form-data');
const cron = require('cron');
const firebase = require('firebase');
const fetch = require('node-fetch');

const firebaseConfig = {
    apiKey: process.env.FIREBASEKEY,
    authDomain: "schedule-b5d1b.firebaseapp.com",
    databaseURL: "https://schedule-b5d1b-default-rtdb.firebaseio.com",
    projectId: "schedule-b5d1b",
    storageBucket: "schedule-b5d1b.appspot.com",
    messagingSenderId: process.env.SENDERID,
    appId: process.env.APPID,
    measurementId: process.env.MEASUREMENTID
  };
  firebase.initializeApp(firebaseConfig);

const client = new Discord.Client();
client.login(process.env.BOTTOKEN);
client.on('ready', readyDiscord);

firebase.database().ref('/').on('value',getData,errData);

function readyDiscord() {
    console.log('bot ready');
}

let botData;

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
scheduledMessage.start();
scheduledMessage2.start();
scheduledMessage3.start();

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
    if (everyone) {
        str = '@everyone';
    }
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
client.on('message', msg => {
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
