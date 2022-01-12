const Discord = require('discord.js');
const schedule = require('node-schedule');
const constants = require('./constants');
const crypto = require('crypto')
const {curly} = require('node-libcurl');
const client = constants.client;

class UserSession{
    /**
     * 
     * @param {Discord.User} User 
     * @param {string} Cookies
     */
    constructor(User,Cookies){
        this.User = User;
        this.Cookies = {};
        if(Cookies){
            let tmp = Cookies.split(";");
            for(let i=0;i<tmp.length;i++){
                tmp[i].trim();
                let cookie = tmp[i].split("=");
                this.Cookies[cookie[0]] = cookie[1];
            }
        }
    }
    /**
     * 
     * @param {string} cookie_str 
     */
    setCookies(cookie_str){
        let tmp = cookie_str.split(";");
        for(let i=0;i<tmp.length;i++){
            tmp[i]=tmp[i].trim();
            let cookie = tmp[i].split("=");
            this.Cookies[cookie[0]] = cookie[1];
        }
    }
    getCookies(){
        
        let tmp = "";
        for(let [key,value] of Object.entries(this.Cookies)){
            if(value!=null) tmp += `${key}=${value}; `;
            else tmp+=`${key}; `;
        };
        return tmp;
    }
}

const DiscordUserSession = []; 

/**
 * Get the vjudge.net/contest/rank/single obj
 * @param {number} contest_id 
 */
async function getRankSingleOBJ(contest_id){

    let url = `https://vjudge.net/contest/rank/single/${contest_id}`;
    //let url = 'https://google.com';
    let { statusCode, data, headers } = await curly.get(url);
    console.log(`Retrieved rank/single object for ${contest_id}`);
    return data;
}

/**
 * 
 * @param {UserSession} session 
 * @param {number} contest_id
 * @returns Object or null if the user needs to login.
 */
async function getProblemsetOBJ(session,contest_id){
    let url = `https://vjudge.net/contest/update/${contest_id}`;
    let response = await doRequest(true,session,url,{
        httpHeader: [
            `cookie: ${session.getCookies()}`
        ]
    });
    console.log(response.data);
    if(response.statusCode==200&&response.data) {
        let obj = response.data;
        if(obj.errMsg&&obj.errMsg==='Please login first'){
            return null;
        }
        return obj;
    }
    throw new Error(`Something went wrong.\nStatus: ${response.statusCode}\nData:\n${response.data}`);
}
/**
 * 
 * @param {UserSession} session 
 * @param {string} source
 * @param {string} problem_id 
 * 
 */
async function findProblemSimple(session,source,problem_id){
    let formData = `oj=${source}&problemId=${problem_id}`;
    let url = `https://vjudge.net/problem/findProblemSimple`;
    let response = await doRequest(false,session,url,{
        postFields: formData,
        httpHeader: [ 
            `cookie: ${session.getCookies()}`,
            'content-type: application/x-www-form-urlencoded; charset=UTF-8',
            `content-length: ${formData.length}`
        ]
    });
    if(response.statusCode==200&&response.data){
        return response.data;
    }
    throw new Error(`An error occurred.\nStatus: ${response.statusCode}\nData:\n${response.data}`);
}

/**
 * 
 * @param {boolean} GET - GET:true, POST: false
 * @param {UserSession} session 
 * @param {string} url 
 * @param {Object} data 
 */
async function doRequest(GET,session,url,data){
    let response = null;
    if(GET) response = await curly.get(url,data);
    else response = await curly.post(url,data);
    
    if(response.headers[0]['Set-Cookie']){
        session.setCookies(response.headers[0]['Set-Cookie'][0]);
    }
    return response;
}

/**
 * 
 * @param {Discord.User} user - Discord User Object
 * @returns {Promise<UserSession>}
 */
async function getSessionID(user){
    if(DiscordUserSession[user.id]==null){
        let session = new UserSession(user);
        DiscordUserSession[user.id] = session;
        let response = await doRequest(true,session,'https://vjudge.net');

        //console.log(`Got Cookies: ${session.getCookies()}`);

        response = await doRequest(true,session,"https://vjudge.net",{
            httpHeader: [
                `cookie: ${session.getCookies()}`
            ]
        });

        headers = response.headers;
        //console.log(headers);
        if(headers[0]["Set-Cookie"]){
            console.error();
            throw new Error(`Got set-cookie twice.\nUser:${user.username}\nCookies: ${session.getCookies()}`);
        }
    }
    return DiscordUserSession[user.id];
}

/**
 * 
 * @param {UserSession} session
 * @returns {boolean} Whether or not the user is logged in.
 */
async function checkLogin(session){
    try{
    let url  = "https://vjudge.net/user/checkLogInStatus";
    console.log("Performing first post...");
    await doRequest(false,session,url,{
        postFields: '',
        httpHeader: [
            `cookie: ${session.getCookies()}`,
            'content-length: 0'
        ]
    });
    console.log("Performing Second Post");
    let {data} = await doRequest(false,session,url,{
        postFields: '',
        httpHeader: [
            `cookie: ${session.getCookies()}`,
            'content-length: 0'
        ]
    });
    console.log(data);
    return data;
    }catch(err){console.error(err)};
}
/**
 * 
 * @param {UserSession} session 
 * @param {string} username 
 * @param {string} password
 * @returns {Promise<boolean>}
 */
async function login(session,username,password){
    console.log(`Logging in. Cookies: ${session.getCookies()}`);
    let formdata = `username=${username}&password=${password}`;
    let response = await doRequest(false,session,'https://vjudge.net/user/login',{
        postFields: formdata,
        httpHeader: [
            'accept: */*',
            'accept-language: en-US,en;q=0.9',
            'content-type: application/x-www-form-urlencoded; charset=UTF-8',
            `cookie: ${session.getCookies()}`,
            `referer: https://vjudge.net/`,
            'origin: https://vjudge.net',
            'sec-fetch-site: same-origin',
            'content-type: application/x-www-form-urlencoded; charset=UTF-8',
            `content-length: ${formdata.length}`
        ]
    });
    
    console.log("Posted login");
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Response: ${response.data}`);
    if(response.data==='success'){
        //console.log(`Cookies are now: ${session.getCookies()}`);
        return true;
    }
    return false;
}

/**
 * 
 * @param {Object} problemset 
 * @param {Object} problem 
 * @param {UserSession} session  
 */
async function addProblem(session,problemset,problem){
    problemset.problems[problemset.problems.length] = {
        oj: problem[3],
        probNum: problem[4],
        descId: 0,
        pid: problem[0],
        alias: "",
        weight: 1
    };
    console.log(problemset);
    let url = "https://vjudge.net/contest/edit";
    let requestData = JSON.stringify(problemset);
    let {statusCode, data} = await doRequest(false,session,url,{
        postFields: requestData,
        httpHeader: [
            'accept: application/json, text/javascript, */*; q=0.01',
            'accept-language: en-US,en;q=0.9,sh;q=0.8,hr;q=0.7,sr;q=0.6,ru;q=0.5',
            `cookie: ${session.getCookies()}`,
            `content-length: ${requestData.length}`,
            'content-type: application/json',
            'origin: https://vjudge.net',
            `referer: https://vjudge.net/contest/${problemset.contestId}`
        ]
    });
    if(statusCode==200&&data){
        if(data.error){
            console.log(`Did not update: ${data.error}`);
        }
        return data;
    }
    throw new Error(`Error while editing contest.\nStatus: ${statusCode}\nData:\n${data}`);
}


/**
 * Announces a contest in a specificed channel
 * @param {*} obj Response object from vjudge.net/contest/rank/single
 * @param {Discord.Channel} contest_announcement_channel Discord channel to send announcements 
 */
function announceContest(obj,contest_announcement_channel){
    let time = obj.begin-Date.now();
    let url = `https://vjudge.net/contest/${obj.id}`;
    let days = Math.trunc(time/(24*3600*1000));
    time%=(24*3600*1000);
    let hours = Math.trunc(time/(3600*1000));
    time%=(3600*1000);
    let minutes = Math.trunc(time/(60*1000));
    contest_announcement_channel.send(`Contest Starting in ${days} Days, ${hours} Hours and ${minutes} Minutes\n${url}`);
}

/**
 * Schedules announcements to be sent in a specificed channel
 * @param {*} obj Response object from vjudge.net/contest/rank/single
 * @param {Discord.Channel} contest_announcement_channel Discord channel to send announcements 
 */
function scheduleAnnouncements(obj,contest_announcement_channel){
    let times = [20*3600,3600,30*60, 0];//20 hours, 1 hour, 30 minutes
    for(let i=0;i<times.length;i++){
        try{
        schedule.scheduleJob(new Date(obj.begin-times[i]*1000),function(){
            AnnounceContest(obj,contest_announcement_channel);
        });
        } catch(err){console.error(err);client.users.cache.get(OwnerID).send("Error while scheduling a contest announcement")}
    }
}

module.exports = {scheduleAnnouncements, announceContest,getRankSingleOBJ,getSessionID,login,getProblemsetOBJ,findProblemSimple,addProblem,checkLogin};