const Discord = require('discord.js')
const fsutils = require('./fileutils.js');
const contestutils = require('./contestutils.js');
const schedule = require('node-schedule')
const constants = require('./constants');
const {client,GuildID,Officer,OwnerID,President,Mentor,token} = require('./constants.js');

client.on('ready', () =>{
    console.log("Vjudge Bot is Ready");
    
    fsutils.readLoggedContests(client,GuildID);
    contestutils.getSessionID(client.user).then( (ses)=>{
        contestutils.login(ses,constants.vjudge_username,constants.vjudge_password);
    });
});


client.on('guildMemberAdd', member => {
    client.users.cache.get(member.id).send("Hey! Thanks for joining the server! Please change your nickname to something which the club can identify you by. After you have done that contact an administrator of the server.");
});

var commandlist = [];
var callbackusers = [];
commandlist["!help"] = [" - Display this menu", 
    (msg) => {
        getPermissionLevel(msg.member).then( (perm_level) => {
            var str = "\n";
            for(var key in commandlist){
                if( perm_level <= commandlist[key][2])
                    str += "> "+key+commandlist[key][0]+"\n";
            };
            msg.reply(str);
        });
}, 5];
commandlist["!perms"] = [" - Get your permission level",
    (msg) => {
        getPermissionLevel(msg.member).then( (perm_level) => {
            msg.reply("You have Permission Level: "+perm_level);
        });
}, 5];
commandlist["!qcontest"] = [" [contest_id] [channel] - Queue a contest to be Announced",
    async (msg) => {
        try{
            let contest_announcement_channel = msg.mentions.channels.first();
            let contest_id = msg.content.split(" ")[1];
            if(contest_announcement_channel == null){
                msg.reply("No channel specified");
                return;
            }
            if(isNaN(contest_id)){
                msg.reply("Contest id needs to be a number");
                return;
            }
            let obj = await contestutils.getRankSingleOBJ(contest_id);
            console.log(obj.begin);
            contestutils.announceContest(obj,contest_announcement_channel);
            contestutils.scheduleAnnouncements(obj,contest_announcement_channel);
            fsutils.appendContest(`${contest_id} ${contest_announcement_channel.id}\n`);
        }catch(err1){msg.reply("An error occurred"); console.log(err1)}
            
}, 2];
commandlist["!addproblem"] = [" [contest_id] [source] [problem_id] [?seconds] [?channel] - Add a problem to a contest. Possible to specify after a number of seconds relative to the start time of the contest",
    /**
     * @param {Discord.Message} msg
     */
    async (msg) => {

        let args = msg.content.split(" ");
        let contest_id = args[1];
        let source = args[2];
        let problem_id = args[3];
        if(isNaN(contest_id)){
            msg.reply("Contest id needs to be a number");
            return;
        }
        let seconds = args.length>=5?args[4]:0;
        if(isNaN(seconds)){
            msg.reply("Seconds needs to be a number");
            return;
        }
        let channel = msg.mentions.channels.first();

        let session = await contestutils.getSessionID(msg.author);

        async function ensureLogin(){
            console.log("Checking logged in...");
            if(!(await contestutils.checkLogin(session))){
                if(!(await contestutils.login(session,constants.vjudge_username,constants.vjudge_password))){
                    throw new Error("cannot login");
                }
            }
            else console.log("Logged In");
        }
        await ensureLogin();
        let problemset = await contestutils.getProblemsetOBJ(session,contest_id);
        console.log(problemset);
        if(problemset==null){
            msg.reply("Do not have permission to edit contest.");
            return;
        }
        let problem = await contestutils.findProblemSimple(session,source,problem_id);
        if(problem[0]==null){
            msg.reply("Problem Not Found");
            return;
        }
        async function job(){
            console.log("Posting");
            await ensureLogin();
            problemset = await contestutils.getProblemsetOBJ(session,contest_id);
            let response = await contestutils.addProblem(session,problemset,problem);
            if(response.error){
                msg.author.send(response.error);
            }
            else{
                console.log(response);
                let str = `Added problem ${problem[1]} to ${problemset.title}.`;
                if(channel) channel.send(str);
                else msg.channel.send(str);
            }
        }
        if(seconds!=0) schedule.scheduleJob(new Date(problemset.beginTime+seconds*1000),job);
        else job();
}, 0];




/*
0 - ALL PERMS
1 - Officer Perms
2 - Mentor Perms
*/
async function getPermissionLevel(user_id){
    try{
        let member = client.guilds.cache.get(GuildID).members.cache.get(user_id);
        if(member==null){
            member = await client.guilds.cache.get(GuildID).members.fetch(user_id);
            if(member==null) return 10;
        }
        if(member.roles.cache.has(President)||user_id==OwnerID) return 0;
        if(member.roles.cache.has(Officer)) return 1;
        if(member.roles.cache.has(Mentor)) return 2;
        return 5;
    }catch(err) {
        return 10;
    }
}



function randomInList(list){
    var ind = Math.floor(Math.random() * list.length);
    return list[ind];
}


const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var testing = false;

//I didn't use any callbacks, but I did in a previous bot I made which I stole a lot of this code from
client.on('message', msg => {
    //Check for callbacks
    if(callbackusers[msg.author.id] && typeof callbackusers[msg.author.id][0] === "function"){
        console.log("Running Callback for user: "+msg.author.username);
        callbackusers[msg.author.id][0](msg).catch((err)=>{
            msg.reply("???");
            console.log(err);
            callbackusers[msg.author.id] = null;
        });
        callbackusers[msg.author.id] = null;
        return;
    }
    if(msg.author.discriminator==="5200" || testing){//Discriminator of the bot
        return;
    } 
    firstword =msg.content.split(" ")[0];
    //Run Commands
    if(commandlist[firstword] && typeof commandlist[msg.content.split(" ")[0]][1] === "function"){
        getPermissionLevel(msg.author.id).then( (perm_level) =>{
            if(perm_level > commandlist[firstword][2]) msg.reply("You do not have permissions for that.");
            else try{commandlist[firstword][1](msg)}catch(e){console.error(e)};
        });
        return;
    }

    //Extra hard-coded hidden features

});

client.login(token);
