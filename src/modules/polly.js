const aws = require("aws-sdk");
const path = require("path");
const fs = require("fs").promises;

import { findAirport } from './findAirport';

export class awsPolly {

    constructor(form, filepath) {
        aws.config.loadFromPath(path.join(__static, './credentials.json'));
        this.form = form;
        this.filepath = filepath;
        this.polly = new aws.Polly({ region: 'us-west-2' });
        this.descParams = {
            LanguageCode: "en-US"
        }

    }
    // const msg = 'Tokyo intl Airport Information A 0800Z. \
    //          ILS Z RWY 34L / ILS Z RWY 34R, LDG RWY 34L / 34R DEP RWY 05 / 34R, \
    //          DEP FREQ 126.0, SIMUL PARL ILS APCHS TO RWY34L / R ARE INPR, \
    //          Wind 360 AT 5KT, Vis 9999. FEW020 BKN050, 20 / 15, QNH 3036. Advise you have information A.';

    // const msg = 'Osaka intl Airport Information B 0100Z\
    //              ILS RWY 32L, USING RWY 32L / 32R, KANSAI DEP FREQ 119.5,\
    //              INFORM YR LDG RWY TO OSAKA TWR ON INITIAL CTC. Wind 360 AT 5KT,\
    //              Vis 5KM. -SHRA FEW020CU BKN030CU, 20 / 15, QNH 2980. Advise you have information B.'

    // ILS Z RWY 34L / ILS Z RWY 34R, LDG RWY 34L / 34R DEP RWY 05 / 34R, DEP FREQ 126.0, SIMUL PARL ILS APCHS TO RWY34L / R ARE INPR, Wind 360 AT 5KT, Vis 9999. FEW020 BKN050, 20 / 15, QNH 3036.

    getVoices() {
        return new Promise((resolve) => {
            this.polly.describeVoices(this.descParams, (err, data) => {
                resolve(data.Voices);
            });
        }).catch((e) => {
            console.error(e);
            return e;
        });
    }

    generateAtis() {
        const findAp = new findAirport();
        const icao = findAp.getAirport(this.form.icao);

        return new Promise((resolve) => {
            let atisMsg = '';
            atisMsg += icao.name;
            atisMsg += ' ' + 'Information ' + this.form.info;
            atisMsg += ' ' + this.form.time + 'Z.';
            atisMsg += ' ' + this.form.content;
            atisMsg += ' ' + 'Advice you have information ' + this.form.info + '.';
            console.log(atisMsg)

            this.putlex('lexicons/ATIS-1.pls', 'ATIS1');
            this.putlex('lexicons/ATIS-2.pls', 'ATIS2');
            this.putlex('lexicons/ATIS-3.pls', 'ATIS3');
            this.putlex('lexicons/Phonetic.pls', 'PHONETIC');

            const textMsg = this.textEscapes(atisMsg);

            console.log(this.form.voice)


            // synthesizeSpeech
            let speechParams = {
                OutputFormat: 'mp3',
                Engine: 'neural',
                VoiceId: this.form.voice,
                Text: textMsg,
                SampleRate: '22050',
                TextType: 'text',
                LexiconNames: [
                    'ATIS1',
                    'ATIS2',
                    'ATIS3',
                    'PHONETIC'
                ]
            };

            this.polly.synthesizeSpeech(speechParams, async (err, data) => {
                if (err) {
                    // logger.error(err);
                    console.error(err)
                    throw new Error(err);
                } else {
                    const date = new Date();
                    const time = date.getTime();
                    await fs.writeFile(path.join(this.filepath, "atis" + time + ".mp3"), data.AudioStream, (err) => {
                        if (err) throw new Error(err);
                    });
                    resolve(path.join(this.filepath, "atis" + time + ".mp3"));
                }
            });
        }).catch((e) => {
            console.error(e);
            return e;
        });
    }

    async putlex(filepath, name) {
        try {
            const data = await fs.readFile(path.join(__static, filepath), 'utf-8');
            await this.polly.putLexicon({
                Content: data,
                Name: name
            }, (err) => {
                if (err) throw err;
            });
        }
        catch (e) {
            console.error(e.message);
        }
    }

    textEscapes(text) {
        // テキストを作る
        let textMsg = text;

        // エスケープ文字一式対応
        textMsg = textMsg.replace(/"/g, '&quot;');
        textMsg = textMsg.replace(/&/g, '&amp;');
        textMsg = textMsg.replace(/'/g, '&apos;');
        textMsg = textMsg.replace(/</g, '&lt;');
        textMsg = textMsg.replace(/>/g, '&gt;');

        // アンダースコアをスペースに
        textMsg = textMsg.replace(/_/g, ' ');

        // visをスペース無しにする準備
        textMsg = textMsg.replace(/9999/ig, '\\9999\\');

        // 雲の高さの読み上げを調整
        textMsg = textMsg.replace(/(FEW|SCT|BKN|OVC)0([0-9][0-9])/ig, ',$1 \\$200 \\ft ');
        textMsg = textMsg.replace(/(FEW|SCT|BKN|OVC)([1-9])([0-9][0-9])/ig, ',$1 $2 \\$300 \\ft ');

        // ランウェイの数字の後のアルファベットを変換
        textMsg = textMsg.replace(/RWY *([0-3][0-9])([L|R|C]*.*?\/.*?[0-3][0-9])L/ig, 'RWY $1$2 left');
        textMsg = textMsg.replace(/RWY *([0-3][0-9])([L|R|C]*.*?\/.*?[0-3][0-9])R/ig, 'RWY $1$2 right');
        textMsg = textMsg.replace(/RWY *([0-3][0-9])([L|R|C]*.*?\/.*?[0-3][0-9])C/ig, 'RWY $1$2 center');
        textMsg = textMsg.replace(/RWY ([0-3][0-9])L/ig, 'RWY $1 left');
        textMsg = textMsg.replace(/RWY ([0-3][0-9])R/ig, 'RWY $1 right');
        textMsg = textMsg.replace(/RWY ([0-3][0-9])C/ig, 'RWY $1 center');
        textMsg = textMsg.replace(/RWY ([0-3][0-9].*?)\/(.*?[0-3][0-9])/ig, 'RWY $1 and $2');

        // パラレルの時のLRCの読み上げ方を変換
        textMsg = textMsg.replace(/(PARL .* APCHS .*)L(.*ARE INPR)/g, '$1 left $2');
        textMsg = textMsg.replace(/(PARL .* APCHS .*)R(.*ARE INPR)/g, '$1 right $2');
        textMsg = textMsg.replace(/(PARL .* APCHS .*)C(.*ARE INPR)/g, '$1 center $2');
        textMsg = textMsg.replace(/(PARL .* APCHS .*) \/ (.*ARE INPR)/g, '$1 and $2');

        // RWYの後ろのスペースを調整
        textMsg = textMsg.replace(/(RWY)([0-9])/ig, '$1 $2');

        // KTを変換
        textMsg = textMsg.replace(/KT/ig, 'KNOTS');

        // 気温と露点の読み上げ
        textMsg = textMsg.replace(/(Wind .*)(\s+[-0-9]+ *)(\/)(\s+[-0-9]+ *)/ig, '$1 temparature $2$3 dew point $4');

        // informationの後ろの文字を変換準備
        textMsg = textMsg.replace(/information ([A-Z])/ig, 'INFORMATION _$1_,');
        // 時間の後ろの文字を変換準備
        textMsg = textMsg.replace(/([0-9][0-9][0-9][0-9])Z/ig, '$1 _Z_.');
        // ILSの後ろの文字を変換準備
        textMsg = textMsg.replace(/ILS ([A-Z]) /ig, 'ILS _$1_ ');

        // デシマル対応
        textMsg = textMsg.replace(/([0-9][0-9][0-9])\.([0-9])/ig, '$1decimal $2');

        // 天候対応
        textMsg = textMsg.replace(/(Vis .*?)([A-Za-z]{4,6})/ig, function () {
            if (arguments[2] == 'tempar') {
                return arguments[0];
            } else {
                const wargs = arguments[2].match(/.{2}/g);
                let weather = '';
                for (let i = 0; i < wargs.length; i++) {
                    weather += wargs[i] + " ";
                }
                return arguments[1] + weather;
            }
        });

        // 数字をスペース区切りに
        textMsg = textMsg.replace(/([0-9])/ig, '$1 ');

        // 一部の数字などのスペースを詰める
        textMsg = textMsg.replace(/\\.*?\\/g, function () {
            return arguments[0].replace(/ /g, '');
        });
        // バックスラッシュを削除
        textMsg = textMsg.replace(/\\/g, '');

        // 余計な制御文字を削除
        textMsg = textMsg.replace(/(\s+)/g, ' ');

        return textMsg;
    }
}
