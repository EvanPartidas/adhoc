const Discord = require('discord.js');
const fs = require('fs');
const contestutils = require('./contestutils.js');

/**
 * 
 * @param {string} data 
 */
function appendContest(data){
    fs.appendFile('./queuedcontests', data, function (err) {
        if (err) {
            console.log('Contest not logged');
            throw err;
        }
        console.log('Contest logged successfully');
    });
}

/**
 * 
 * @param {Discord.Client} client 
 * @param {string} GuildID
 */
async function readLoggedContests(client,GuildID){
    fs.readFile('./queuedcontests','ascii', function (err,data) {
        if (err) {
            return console.log(err);
        }
        if(data=='') return;
        let lines = data.split("\n");
        for(let i=0;i<lines.length;i++){
            let ln = lines[i].split(" ");
            let contest_id = ln[0];
            let channel_id = ln[1];
            client.guilds.fetch(GuildID).then(guild=>{
                let contest_announcement_channel = guild.channels.cache.get(channel_id);
                console.log(`Channel_is_null: ${contest_announcement_channel==null}`);
                if(contest_announcement_channel==null) return;
                contestutils.getRankSingleOBJ(contest_id).then(obj=> {
                    try{
                        contestutils.scheduleAnnouncements(obj,contest_announcement_channel);
                    }catch(err1){
                        client.users.fetch(OwnerID,rsp=>{rsp.send("Error while scheduling contest announcements");}); 
                        console.log(err1);
                    }
                });
            });
        }
    });
}


module.exports = {appendContest, readLoggedContests};