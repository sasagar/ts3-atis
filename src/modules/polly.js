const aws = require("aws-sdk");
const path = require("path");
const fs = require("fs").promises;

aws.config.loadFromPath(path.join(__dirname, '../credentials.json'));

let polly = new aws.Polly({ region: 'us-west-2' });

const putlex = async (filepath, name) => {
    try {
        const data = await fs.readFile(path.join(__dirname, filepath), 'utf-8');
        await polly.putLexicon({
            Content: data,
            Name: name
        }, (err) => {
            if (err) throw err;
            else console.log(name)
        });
    }
    catch (e) {
        console.error(e.message);
    }
}

putlex('../../lexicons/ATIS-1.pls', 'ATIS1');
putlex('../../lexicons/ATIS-2.pls', 'ATIS2');
putlex('../../lexicons/Phonetic.pls', 'PHONETIC');

let descParams = {
    LanguageCode: "en-US"
}

const msg = 'Tokyo intl Airport Information A 0800Z. \
             ILS Z RWY 34L / ILS Z RWY 34R, LDG RWY 34L / 34R DEP RWY 05 / 34R, \
             DEP FREQ 126.0, SIMUL PARL ILS APCHS TO RWY34L / R ARE INPR, \
             Wind 360 AT 5KT, Vis 9999. FEW020 BKN050, 20 / 15, QNH 3036. Advise you have information A.';

polly.describeVoices(descParams, async (err, data) => {

    if (err) {
        // return rej(err);
        console.error(err);
    }
    // console.dir(JSON.stringify(data));
    let voiceId = data.Voices[1].Id;
    // logger.trace("readText Try");

    // テキストを作る
    let content = msg;
    content = content.replace(/>.+?\n/g, '');
    let textMsg = content;

    // エスケープ文字一式対応
    textMsg = textMsg.replace(/"/g, '&quot;');
    textMsg = textMsg.replace(/&/g, '&amp;');
    textMsg = textMsg.replace(/'/g, '&apos;');
    textMsg = textMsg.replace(/</g, '&lt;');
    textMsg = textMsg.replace(/>/g, '&gt;');

    // アンダースコアをスペースに
    textMsg = textMsg.replace(/_/g, ' ');

    // ランウェイの数字の後のアルファベットを変換
    textMsg = textMsg.replace(/([0-9][0-9])L/ig, '$1 left');
    textMsg = textMsg.replace(/([0-9][0-9])R/ig, '$1 right');
    textMsg = textMsg.replace(/([0-9][0-9])C/ig, '$1 center');
    // パラレルの時のLRCの読み上げ方を変換
    textMsg = textMsg.replace(/(PARL .*) L (.*ARE INPR)/g, '$1 left $2');
    textMsg = textMsg.replace(/(PARL .*) R (.*ARE INPR)/g, '$1 right $2');
    textMsg = textMsg.replace(/(PARL .*) C (.*ARE INPR)/g, '$1 center $2');
    textMsg = textMsg.replace(/(PARL .*) \/ (.*ARE INPR)/g, '$1 and $2');

    // RWYの後ろのスペースを調整
    textMsg = textMsg.replace(/(RWY)([0-9])/ig, '$1 $2');

    // KTを変換
    textMsg = textMsg.replace(/KT/ig, 'KNOTS');

    // 気温と露点の読み上げ
    textMsg = textMsg.replace(/(Wind .*)(\s+[-0-9]+ *)(\/)(\s+[-0-9]+ *)/ig, '$1 temparature $2$3 dew point $4');

    // Visの数字を調整
    textMsg = textMsg.replace(/9999/ig, '\\10km\\');

    // 雲の高さの読み上げを調整
    textMsg = textMsg.replace(/(FEW|SCT|BKN|OVC)0([0-9][0-9])/ig, '$1 \\$200\\');
    textMsg = textMsg.replace(/(FEW|SCT|BKN|OVC)0([0-9][0-9])/ig, '$1 \\$200\\');

    // informationの後ろの文字を変換準備
    textMsg = textMsg.replace(/information ([A-Z])/ig, 'INFORMATION _$1_');
    // 時間の後ろの文字を変換準備
    textMsg = textMsg.replace(/([0-9][0-9][0-9][0-9])Z/ig, '$1 zulu');
    // ILSの後ろの文字を変換準備
    textMsg = textMsg.replace(/ILS ([A-Z]) /ig, 'ILS _$1_ ');

    // デシマル対応
    textMsg = textMsg.replace(/([0-9][0-9][0-9])\.([0-9])/ig, '$1decimal $2');

    // 数字をスペース区切りに
    textMsg = textMsg.replace(/([0-9])/ig, '$1 ');

    // 一部の数字などのスペースを詰める
    textMsg = textMsg.replace(/\\.*?\\/g, function () {
        console.log(arguments[0]);
        return arguments[0].replace(/ /g, '');
    });
    // バックスラッシュを削除
    textMsg = textMsg.replace(/\\/g, '');

    // 余計な制御文字を削除
    textMsg = textMsg.replace(/(\s+)/g, ' ');

    console.log(textMsg)

    // synthesizeSpeech
    let speechParams = {
        OutputFormat: 'mp3',
        Engine: 'neural',
        VoiceId: voiceId,
        Text: textMsg,
        SampleRate: '22050',
        TextType: 'text',
        LexiconNames: ['ATIS1', 'ATIS2', 'PHONETIC']
    };

    polly.synthesizeSpeech(speechParams, (err, data) => {
        if (err) {
            // logger.error(err);
            // bot.createMessage(TtoV_CHANNEL, "エラー(197)が起きています" + "```" + err + "```");
            polly = new aws.Polly({ region: 'us-west-2' });
            console.error(err)
            // rej(err);
        } else {
            fs.writeFile("sound.mp3", data.AudioStream, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }
    });
});
